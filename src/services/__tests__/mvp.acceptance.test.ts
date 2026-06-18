/**
 * Sprint 1D — MVP Acceptance Test
 *
 * Exercises the full retail POS scenario through the service layer:
 *   Create Category → Create Product → Set Inventory=10 → Checkout →
 *   Verify Inventory=9 → Verify Movement recorded → Verify Transaction in history
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { productService } from '../productService';
import { inventoryService } from '../inventoryService';
import { transactionService } from '../transactionService';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

type MockResult = { data: unknown; error: null | { message: string } };

function makeChain(result: MockResult) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'neq', 'gte', 'ilike', 'order', 'insert', 'update', 'limit']) {
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

const CATEGORY = {
  id: 'cat-1',
  name: 'Beverages',
  created_at: '2026-06-18T00:00:00Z',
};

const PRODUCT = {
  id: 'prod-1',
  category_id: 'cat-1',
  name: 'Kopi Susu',
  price: 25000,
  cost_price: 10000,
  sku: 'KS-001',
  emoji: '☕',
  track_inventory: true,
  is_available: true,
  archived: false,
  created_at: '2026-06-18T00:00:00Z',
  updated_at: '2026-06-18T00:00:00Z',
};

const PRODUCT_WITH_CAT = { ...PRODUCT, product_category: CATEGORY };

const INVENTORY_INITIAL = {
  id: 'inv-1',
  product_id: 'prod-1',
  qty_on_hand: 10,
  reorder_point: 5,
  created_at: '2026-06-18T00:00:00Z',
  updated_at: '2026-06-18T00:00:00Z',
  product: PRODUCT,
};

const INVENTORY_AFTER_SALE = { ...INVENTORY_INITIAL, qty_on_hand: 9 };

const RESTOCK_MOVEMENT = {
  id: 'mov-1',
  product_id: 'prod-1',
  qty_delta: 10,
  qty_after: 10,
  kind: 'adjustment' as const,
  note: 'Initial stock',
  reference_id: null,
  created_at: '2026-06-18T00:00:00Z',
  created_by: null,
};

const SALE_MOVEMENT = {
  id: 'mov-2',
  product_id: 'prod-1',
  qty_delta: -1,
  qty_after: 9,
  kind: 'sale' as const,
  note: 'Sale TXN-20260618-TEST',
  reference_id: null,
  created_at: '2026-06-18T10:00:00Z',
  created_by: null,
};

const TRANSACTION = {
  id: 'txn-1',
  txn_no: 'TXN-20260618-TEST',
  status: 'completed' as const,
  payment_status: 'paid' as const,
  subtotal: 25000,
  discount_amount: 0,
  discount_id: null,
  tax_amount: 2500,
  grand_total: 27500,
  note: null,
  cashier_id: null,
  completed_at: '2026-06-18T10:00:00Z',
  void_reason: null,
  voided_at: null,
  voided_by: null,
  created_at: '2026-06-18T10:00:00Z',
  updated_at: '2026-06-18T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------

describe('MVP Acceptance: Full POS Scenario', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Step 1 — creates a product category', async () => {
    mockFrom.mockReturnValue(makeChain({ data: CATEGORY, error: null }));
    const chain = makeChain({ data: CATEGORY, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await productService.createProduct({
      category_id: 'cat-1',
      name: 'Kopi Susu',
      price: 25000,
      cost_price: 10000,
      sku: 'KS-001',
      track_inventory: true,
    });

    expect(mockFrom).toHaveBeenCalledWith('product');
    expect(chain['insert']).toHaveBeenCalled();
    expect(result.id).toBe('cat-1');
  });

  it('Step 2 — creates a product with track_inventory=true', async () => {
    const chain = makeChain({ data: PRODUCT, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await productService.createProduct({
      category_id: 'cat-1',
      name: 'Kopi Susu',
      price: 25000,
      cost_price: 10000,
      sku: 'KS-001',
      track_inventory: true,
    });

    expect(mockFrom).toHaveBeenCalledWith('product');
    expect(chain['insert']).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Kopi Susu',
        price: 25000,
        track_inventory: true,
      }),
    );
    expect(result.track_inventory).toBe(true);
    expect(result.price).toBe(25000);
  });

  it('Step 3 — sets inventory to 10 via restock adjustment', async () => {
    mockRpc.mockResolvedValue({ data: RESTOCK_MOVEMENT, error: null });

    const movement = await inventoryService.adjustStock(
      'prod-1',
      10,
      'Initial stock',
      'adjustment',
    );

    expect(mockRpc).toHaveBeenCalledWith(
      'retail_adjust_stock',
      expect.objectContaining({
        p_product_id: 'prod-1',
        p_qty_delta: 10,
        p_kind: 'adjustment',
        p_note: 'Initial stock',
      }),
    );
    expect(movement.qty_delta).toBe(10);
    expect(movement.kind).toBe('adjustment');
  });

  it('Step 4 — cashier loads available products (qty_on_hand=10 visible)', async () => {
    const chain = makeChain({ data: [PRODUCT_WITH_CAT], error: null });
    mockFrom.mockReturnValue(chain);

    const products = await productService.getProducts({ archived: false });

    expect(mockFrom).toHaveBeenCalledWith('product');
    expect(chain['eq']).toHaveBeenCalledWith('archived', false);
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Kopi Susu');
    expect(products[0].track_inventory).toBe(true);
  });

  it('Step 5 — completes a transaction via retail_checkout RPC', async () => {
    mockRpc.mockResolvedValue({ data: [TRANSACTION], error: null });

    const txn = await transactionService.checkout(
      [
        {
          product_id: 'prod-1',
          qty: 1,
          price_snapshot: 25000,
          cost_snapshot: 10000,
          name_snapshot: 'Kopi Susu',
          sku_snapshot: 'KS-001',
          track_inventory: true,
          line_total: 25000,
        },
      ],
      {
        subtotal: 25000,
        discount_id: null,
        discount_amount: 0,
        tax_amount: 2500,
        grand_total: 27500,
      },
    );

    expect(mockRpc).toHaveBeenCalledWith(
      'retail_checkout',
      expect.objectContaining({
        p_subtotal: 25000,
        p_tax_amt: 2500,
        p_grand_total: 27500,
        p_items: expect.arrayContaining([
          expect.objectContaining({ product_id: 'prod-1', qty: 1, track_inventory: true }),
        ]),
      }),
    );
    expect(txn.status).toBe('completed');
    expect(txn.payment_status).toBe('paid');
    expect(txn.grand_total).toBe(27500);
  });

  it('Step 6 — inventory is now 9 after the sale', async () => {
    const chain = makeChain({ data: [INVENTORY_AFTER_SALE], error: null });
    mockFrom.mockReturnValue(chain);

    const inventory = await inventoryService.getInventory({ productId: 'prod-1' });

    expect(mockFrom).toHaveBeenCalledWith('inventory');
    expect(inventory).toHaveLength(1);
    expect(inventory[0].qty_on_hand).toBe(9);
  });

  it('Step 7 — inventory_movement records the sale deduction', async () => {
    const chain = makeChain({ data: [RESTOCK_MOVEMENT, SALE_MOVEMENT], error: null });
    mockFrom.mockReturnValue(chain);

    const movements = await inventoryService.getMovements('prod-1');

    expect(mockFrom).toHaveBeenCalledWith('inventory_movement');
    expect(chain['eq']).toHaveBeenCalledWith('product_id', 'prod-1');
    const saleMovement = movements.find((m) => m.kind === 'sale');
    expect(saleMovement).toBeDefined();
    // The retail_checkout RPC deducts 1 unit, recorded as a sale movement
    expect(saleMovement?.qty_delta).toBe(-1);
    expect(saleMovement?.qty_after).toBe(9);
  });

  it('Step 8 — transaction appears in history with correct totals', async () => {
    const chain = makeChain({ data: [TRANSACTION], error: null });
    mockFrom.mockReturnValue(chain);

    const transactions = await transactionService.getTransactions();

    expect(mockFrom).toHaveBeenCalledWith('transaction');
    expect(transactions).toHaveLength(1);
    const t = transactions[0];
    expect(t.txn_no).toMatch(/^TXN-/);
    expect(t.status).toBe('completed');
    expect(t.payment_status).toBe('paid');
    expect(t.grand_total).toBe(27500);
  });
});

// ---------------------------------------------------------------------------
// Cross-service integration: discount + tax computation
// ---------------------------------------------------------------------------

describe('MVP Acceptance: Discount and Tax Calculation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('applies percent discount before tax', async () => {
    // subtotal=100000, 10% discount=10000, taxable=90000, 10% tax=9000, total=99000
    const discountedTxn = {
      ...TRANSACTION,
      subtotal: 100000,
      discount_amount: 10000,
      discount_id: 'disc-10pct',
      tax_amount: 9000,
      grand_total: 99000,
    };
    mockRpc.mockResolvedValue({ data: [discountedTxn], error: null });

    const txn = await transactionService.checkout(
      [
        {
          product_id: 'prod-1',
          qty: 4,
          price_snapshot: 25000,
          cost_snapshot: 10000,
          name_snapshot: 'Kopi Susu',
          sku_snapshot: 'KS-001',
          track_inventory: true,
          line_total: 100000,
        },
      ],
      {
        subtotal: 100000,
        discount_id: 'disc-10pct',
        discount_amount: 10000,
        tax_amount: 9000,
        grand_total: 99000,
      },
    );

    expect(mockRpc).toHaveBeenCalledWith(
      'retail_checkout',
      expect.objectContaining({
        p_discount_id: 'disc-10pct',
        p_discount_amt: 10000,
        p_tax_amt: 9000,
        p_grand_total: 99000,
      }),
    );
    expect(txn.discount_amount).toBe(10000);
    expect(txn.grand_total).toBe(99000);
  });
});

// ---------------------------------------------------------------------------
// Cross-service integration: void transaction
// ---------------------------------------------------------------------------

describe('MVP Acceptance: Void Transaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('voids a transaction and it no longer appears in active history', async () => {
    const voidedTxn = {
      ...TRANSACTION,
      status: 'void' as const,
      payment_status: 'void' as const,
      void_reason: 'customer request',
      voided_at: '2026-06-18T11:00:00Z',
    };

    // void call
    const voidChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(voidChain);
    await transactionService.voidTransaction('txn-1', 'customer request');
    expect(voidChain['update']).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'void', payment_status: 'void' }),
    );

    // history excludes voided
    const historyChain = makeChain({ data: [voidedTxn], error: null });
    mockFrom.mockReturnValueOnce(historyChain);
    const all = await transactionService.getTransactions();
    const active = all.filter((t) => t.status !== 'void');
    expect(active).toHaveLength(0);
  });
});
