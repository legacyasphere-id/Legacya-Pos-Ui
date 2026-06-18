import { supabase } from '../lib/supabaseClient';
import type { Tables, TablesUpdate, Enums } from '../types/database.generated';

export type Transaction = Tables<'transaction'>;
export type TransactionItem = Tables<'transaction_item'>;
export type TransactionStatus = Enums<'transaction_status'>;
export type Discount = Tables<'discount'>;

export type TransactionWithItems = Transaction & {
  transaction_item: TransactionItem[];
};

export interface CheckoutItem {
  product_id: string;
  qty: number;
  price_snapshot: number;
  cost_snapshot: number;
  name_snapshot: string;
  sku_snapshot: string | null;
  track_inventory: boolean;
  line_total: number;
}

export interface CheckoutTotals {
  subtotal: number;
  discount_id: string | null;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
}

const TXN_SELECT =
  'id, txn_no, status, payment_status, subtotal, discount_amount, tax_amount, grand_total, ' +
  'note, cashier_id, completed_at, void_reason, voided_at, voided_by, created_at, updated_at, ' +
  'discount_id, transaction_item(*)';

function generateTxnNo(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TXN-${date}-${rand}`;
}

export const transactionService = {
  async checkout(
    items: CheckoutItem[],
    totals: CheckoutTotals,
    note?: string,
  ): Promise<Transaction> {
    const txnNo = generateTxnNo();
    const { data, error } = await supabase.rpc('retail_checkout', {
      p_txn_no: txnNo,
      p_items: items as unknown as import('../types/database.generated').Json,
      p_subtotal: totals.subtotal,
      p_discount_id: totals.discount_id ?? undefined,
      p_discount_amt: totals.discount_amount,
      p_tax_amt: totals.tax_amount,
      p_grand_total: totals.grand_total,
      p_note: note,
    });
    if (error) throw error;
    const rows = data as unknown as Transaction[];
    if (!rows || rows.length === 0) throw new Error('Checkout returned no transaction');
    return rows[0];
  },

  async getTransactions(filters?: { limit?: number; fromDate?: string }): Promise<Transaction[]> {
    let query = supabase
      .from('transaction')
      .select(
        'id, txn_no, status, payment_status, subtotal, discount_amount, tax_amount, grand_total, ' +
          'note, cashier_id, completed_at, void_reason, voided_at, created_at, updated_at, discount_id',
      )
      .order('created_at', { ascending: false });

    if (filters?.fromDate) {
      query = query.gte('created_at', filters.fromDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Transaction[];
  },

  async getTransaction(id: string): Promise<TransactionWithItems | null> {
    const { data, error } = await supabase
      .from('transaction')
      .select(TXN_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as TransactionWithItems | null;
  },

  async voidTransaction(id: string, reason: string): Promise<void> {
    const update: TablesUpdate<'transaction'> = {
      status: 'void',
      payment_status: 'void',
      void_reason: reason,
      voided_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('transaction').update(update).eq('id', id);
    if (error) throw error;
  },

  async getDiscounts(): Promise<Discount[]> {
    const { data, error } = await supabase
      .from('discount')
      .select('id, label, kind, value, is_active, created_at')
      .eq('is_active', true)
      .order('value');
    if (error) throw error;
    return (data ?? []) as Discount[];
  },
};
