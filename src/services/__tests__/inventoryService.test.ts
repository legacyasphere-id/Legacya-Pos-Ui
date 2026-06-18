import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inventoryService } from '../inventoryService';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

type MockResult = { data: unknown; error: null | { message: string } };

function makeChain(result: MockResult) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'insert', 'update', 'limit']) {
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

const INVENTORY = {
  id: 'inv-1',
  product_id: 'prod-1',
  qty_on_hand: 50,
  qty_reserved: 0,
  reorder_point: 10,
  reorder_qty: 100,
  unit: 'pcs',
  last_counted_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  product: { id: 'prod-1', name: 'Kopi Susu', sku: 'KS-001', is_available: true, archived: false },
};

const LOW_STOCK_INVENTORY = { ...INVENTORY, qty_on_hand: 5, reorder_point: 10 };

const MOVEMENT = {
  id: 'mov-1',
  inventory_id: 'inv-1',
  kind: 'adjustment' as const,
  qty_delta: -5,
  qty_after: 45,
  reference_id: null,
  note: 'stocktake',
  created_by: null,
  created_at: '2026-01-02T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('inventoryService.getInventory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all inventory rows', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [INVENTORY], error: null }));
    const result = await inventoryService.getInventory();
    expect(result).toHaveLength(1);
    expect(result[0].product_id).toBe('prod-1');
  });

  it('filters by productId', async () => {
    const chain = makeChain({ data: [INVENTORY], error: null });
    mockFrom.mockReturnValue(chain);
    await inventoryService.getInventory({ productId: 'prod-1' });
    expect(chain['eq']).toHaveBeenCalledWith('product_id', 'prod-1');
  });

  it('filters lowStock client-side when flag is true', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [INVENTORY, LOW_STOCK_INVENTORY], error: null }));
    const result = await inventoryService.getInventory({ lowStock: true });
    // Only the row where qty_on_hand (5) <= reorder_point (10) should be returned
    expect(result).toHaveLength(1);
    expect(result[0].qty_on_hand).toBe(5);
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'db error' } }));
    await expect(inventoryService.getInventory()).rejects.toMatchObject({ message: 'db error' });
  });
});

describe('inventoryService.getMovements', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all movements when no productId given', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [MOVEMENT], error: null }));
    const result = await inventoryService.getMovements();
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('adjustment');
  });

  it('resolves the inventoryId then fetches movements for a productId', async () => {
    // First call: inventory lookup → returns inv-1
    // Second call: movement query → returns movements
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { id: 'inv-1' }, error: null }))
      .mockReturnValueOnce(makeChain({ data: [MOVEMENT], error: null }));

    const result = await inventoryService.getMovements('prod-1');
    expect(result).toHaveLength(1);
    expect(mockFrom).toHaveBeenCalledWith('inventory');
    expect(mockFrom).toHaveBeenCalledWith('inventory_movement');
  });

  it('returns empty array when product has no inventory record', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));
    const result = await inventoryService.getMovements('no-inv-prod');
    expect(result).toEqual([]);
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'forbidden' } }));
    await expect(inventoryService.getMovements()).rejects.toMatchObject({ message: 'forbidden' });
  });
});

describe('inventoryService.adjustStock', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls retail_adjust_stock RPC with correct args', async () => {
    mockRpc.mockResolvedValue({ data: MOVEMENT, error: null });
    const result = await inventoryService.adjustStock('prod-1', -5, 'damage');
    expect(mockRpc).toHaveBeenCalledWith('retail_adjust_stock', {
      p_product_id: 'prod-1',
      p_qty_delta: -5,
      p_kind: 'adjustment',
      p_note: 'damage',
    });
    expect(result.qty_delta).toBe(-5);
  });

  it('accepts a custom kind', async () => {
    mockRpc.mockResolvedValue({ data: MOVEMENT, error: null });
    await inventoryService.adjustStock('prod-1', 100, 'restock', 'purchase');
    expect(mockRpc).toHaveBeenCalledWith('retail_adjust_stock', {
      p_product_id: 'prod-1',
      p_qty_delta: 100,
      p_kind: 'purchase',
      p_note: 'restock',
    });
  });

  it('throws when RPC returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'inventory_not_found' } });
    await expect(inventoryService.adjustStock('bad-id', 1, 'x')).rejects.toMatchObject({
      message: 'inventory_not_found',
    });
  });
});

describe('inventoryService.getLowStockProducts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses reorder_point when no threshold given', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [INVENTORY, LOW_STOCK_INVENTORY], error: null }));
    const result = await inventoryService.getLowStockProducts();
    expect(result).toHaveLength(1);
    expect(result[0].qty_on_hand).toBe(5);
  });

  it('uses explicit threshold when provided', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [INVENTORY, LOW_STOCK_INVENTORY], error: null }));
    // threshold=60 → both rows (50 and 5) are below 60
    const result = await inventoryService.getLowStockProducts(60);
    expect(result).toHaveLength(2);
  });

  it('returns empty when all stock is sufficient', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [INVENTORY], error: null }));
    const result = await inventoryService.getLowStockProducts();
    // qty_on_hand=50, reorder_point=10 → not low
    expect(result).toHaveLength(0);
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'query failed' } }));
    await expect(inventoryService.getLowStockProducts()).rejects.toMatchObject({
      message: 'query failed',
    });
  });
});
