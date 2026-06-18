import { beforeEach, describe, expect, it, vi } from 'vitest';
import { transactionService, type CheckoutItem, type CheckoutTotals } from '../transactionService';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

type MockResult = { data: unknown; error: null | { message: string } };

function makeChain(result: MockResult) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'gte', 'order', 'limit', 'insert', 'update']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain['single'] = vi.fn().mockResolvedValue(result);
  chain['maybeSingle'] = vi.fn().mockResolvedValue(result);
  chain['then'] = (resolve: (v: MockResult) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TXN = {
  id: 'txn-1',
  txn_no: 'TXN-20260618-ABCD',
  status: 'completed' as const,
  payment_status: 'paid' as const,
  subtotal: 50000,
  discount_amount: 0,
  tax_amount: 5000,
  grand_total: 55000,
  discount_id: null,
  note: null,
  cashier_id: null,
  completed_at: '2026-06-18T10:00:00Z',
  void_reason: null,
  voided_at: null,
  voided_by: null,
  created_at: '2026-06-18T10:00:00Z',
  updated_at: '2026-06-18T10:00:00Z',
};

const ITEM: TransactionItemFixture = {
  id: 'ti-1',
  transaction_id: 'txn-1',
  product_id: 'prod-1',
  qty: 2,
  price_snapshot: 25000,
  cost_snapshot: 10000,
  name_snapshot: 'Kopi Susu',
  sku_snapshot: 'KS-001',
  line_total: 50000,
  created_at: '2026-06-18T10:00:00Z',
};

type TransactionItemFixture = {
  id: string;
  transaction_id: string;
  product_id: string;
  qty: number;
  price_snapshot: number;
  cost_snapshot: number;
  name_snapshot: string;
  sku_snapshot: string;
  line_total: number;
  created_at: string;
};

const CART_ITEM: CheckoutItem = {
  product_id: 'prod-1',
  qty: 2,
  price_snapshot: 25000,
  cost_snapshot: 10000,
  name_snapshot: 'Kopi Susu',
  sku_snapshot: 'KS-001',
  track_inventory: true,
  line_total: 50000,
};

const TOTALS: CheckoutTotals = {
  subtotal: 50000,
  discount_id: null,
  discount_amount: 0,
  tax_amount: 5000,
  grand_total: 55000,
};

const DISCOUNT = {
  id: 'disc-1',
  label: '10% off',
  kind: 'percent',
  value: 10,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('transactionService.checkout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls retail_checkout RPC and returns the transaction', async () => {
    mockRpc.mockResolvedValue({ data: [TXN], error: null });
    const result = await transactionService.checkout([CART_ITEM], TOTALS);
    expect(mockRpc).toHaveBeenCalledWith(
      'retail_checkout',
      expect.objectContaining({
        p_subtotal: 50000,
        p_grand_total: 55000,
        p_tax_amt: 5000,
      }),
    );
    expect(result.txn_no).toMatch(/^TXN-/);
    expect(result.grand_total).toBe(55000);
  });

  it('passes note when provided', async () => {
    mockRpc.mockResolvedValue({ data: [TXN], error: null });
    await transactionService.checkout([CART_ITEM], TOTALS, 'birthday discount');
    expect(mockRpc).toHaveBeenCalledWith(
      'retail_checkout',
      expect.objectContaining({ p_note: 'birthday discount' }),
    );
  });

  it('passes discount_id when set', async () => {
    mockRpc.mockResolvedValue({ data: [TXN], error: null });
    const totalsWithDiscount = { ...TOTALS, discount_id: 'disc-1', discount_amount: 5000 };
    await transactionService.checkout([CART_ITEM], totalsWithDiscount);
    expect(mockRpc).toHaveBeenCalledWith(
      'retail_checkout',
      expect.objectContaining({ p_discount_id: 'disc-1', p_discount_amt: 5000 }),
    );
  });

  it('throws when RPC returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'checkout_failed' } });
    await expect(transactionService.checkout([CART_ITEM], TOTALS)).rejects.toMatchObject({
      message: 'checkout_failed',
    });
  });

  it('throws when RPC returns empty array', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    await expect(transactionService.checkout([CART_ITEM], TOTALS)).rejects.toThrow(
      'Checkout returned no transaction',
    );
  });
});

describe('transactionService.getTransactions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list of transactions', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [TXN], error: null }));
    const result = await transactionService.getTransactions();
    expect(result).toHaveLength(1);
    expect(result[0].txn_no).toBe('TXN-20260618-ABCD');
  });

  it('applies fromDate filter', async () => {
    const chain = makeChain({ data: [TXN], error: null });
    mockFrom.mockReturnValue(chain);
    await transactionService.getTransactions({ fromDate: '2026-06-01' });
    expect(chain['gte']).toHaveBeenCalledWith('created_at', '2026-06-01');
  });

  it('applies limit filter', async () => {
    const chain = makeChain({ data: [TXN], error: null });
    mockFrom.mockReturnValue(chain);
    await transactionService.getTransactions({ limit: 20 });
    expect(chain['limit']).toHaveBeenCalledWith(20);
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'forbidden' } }));
    await expect(transactionService.getTransactions()).rejects.toMatchObject({
      message: 'forbidden',
    });
  });
});

describe('transactionService.getTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns transaction with items', async () => {
    const txnWithItems = { ...TXN, transaction_item: [ITEM] };
    mockFrom.mockReturnValue(makeChain({ data: txnWithItems, error: null }));
    const result = await transactionService.getTransaction('txn-1');
    expect(result?.id).toBe('txn-1');
    expect(result?.transaction_item).toHaveLength(1);
  });

  it('returns null when not found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    const result = await transactionService.getTransaction('missing');
    expect(result).toBeNull();
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'not found' } }));
    await expect(transactionService.getTransaction('bad')).rejects.toMatchObject({
      message: 'not found',
    });
  });
});

describe('transactionService.voidTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates status and payment_status to void', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await transactionService.voidTransaction('txn-1', 'customer request');
    expect(chain['update']).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'void',
        payment_status: 'void',
        void_reason: 'customer request',
      }),
    );
    expect(chain['eq']).toHaveBeenCalledWith('id', 'txn-1');
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'rls violation' } }));
    await expect(transactionService.voidTransaction('txn-1', 'x')).rejects.toMatchObject({
      message: 'rls violation',
    });
  });
});

describe('transactionService.getDiscounts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns active discounts', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [DISCOUNT], error: null }));
    const result = await transactionService.getDiscounts();
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('10% off');
  });

  it('filters only active discounts', async () => {
    const chain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await transactionService.getDiscounts();
    expect(chain['eq']).toHaveBeenCalledWith('is_active', true);
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'db error' } }));
    await expect(transactionService.getDiscounts()).rejects.toMatchObject({ message: 'db error' });
  });
});
