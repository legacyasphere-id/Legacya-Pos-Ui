import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProductInsert, ProductUpdate } from '../productService';
import { productService } from '../productService';

// ---------------------------------------------------------------------------
// Supabase mock — chainable builder that resolves to { data, error }
// ---------------------------------------------------------------------------

type MockResult = { data: unknown; error: null | { message: string } };

function makeChain(result: MockResult) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'ilike', 'order', 'insert', 'update', 'limit']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain['single'] = vi.fn().mockResolvedValue(result);
  chain['maybeSingle'] = vi.fn().mockResolvedValue(result);
  // makes `await chain` work (builder is thenable)
  chain['then'] = (resolve: (v: MockResult) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: mockFrom },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PRODUCT = {
  id: 'prod-1',
  name: 'Kopi Susu',
  sku: 'KS-001',
  barcode: null,
  description: null,
  price: 25000,
  cost_price: 10000,
  emoji: '☕',
  image_url: null,
  is_available: true,
  archived: false,
  track_inventory: true,
  sort_order: 1,
  category_id: 'cat-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  product_category: { id: 'cat-1', name: 'Beverages' },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('productService.getProducts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [PRODUCT], error: null }));
    const result = await productService.getProducts();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Kopi Susu');
  });

  it('filters by categoryId', async () => {
    const chain = makeChain({ data: [PRODUCT], error: null });
    mockFrom.mockReturnValue(chain);
    await productService.getProducts({ categoryId: 'cat-1' });
    expect(chain['eq']).toHaveBeenCalledWith('category_id', 'cat-1');
  });

  it('filters by search term', async () => {
    const chain = makeChain({ data: [PRODUCT], error: null });
    mockFrom.mockReturnValue(chain);
    await productService.getProducts({ search: 'Kopi' });
    expect(chain['ilike']).toHaveBeenCalledWith('name', '%Kopi%');
  });

  it('defaults archived=false', async () => {
    const chain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await productService.getProducts();
    expect(chain['eq']).toHaveBeenCalledWith('archived', false);
  });

  it('can request archived products', async () => {
    const chain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await productService.getProducts({ archived: true });
    expect(chain['eq']).toHaveBeenCalledWith('archived', true);
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'db error' } }));
    await expect(productService.getProducts()).rejects.toMatchObject({ message: 'db error' });
  });
});

describe('productService.getProduct', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the product when found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: PRODUCT, error: null }));
    const result = await productService.getProduct('prod-1');
    expect(result).toMatchObject({ id: 'prod-1', name: 'Kopi Susu' });
  });

  it('returns null when not found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    const result = await productService.getProduct('unknown');
    expect(result).toBeNull();
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'not found' } }));
    await expect(productService.getProduct('bad')).rejects.toMatchObject({ message: 'not found' });
  });
});

describe('productService.createProduct', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the created product', async () => {
    mockFrom.mockReturnValue(makeChain({ data: PRODUCT, error: null }));
    const payload: ProductInsert = { name: 'Kopi Susu', price: 25000 };
    const result = await productService.createProduct(payload);
    expect(result.id).toBe('prod-1');
  });

  it('throws on insert error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'unique violation' } }));
    await expect(productService.createProduct({ name: 'Dup', price: 1000 })).rejects.toMatchObject({
      message: 'unique violation',
    });
  });
});

describe('productService.updateProduct', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the updated product', async () => {
    const updated = { ...PRODUCT, price: 30000 };
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }));
    const payload: ProductUpdate = { price: 30000 };
    const result = await productService.updateProduct('prod-1', payload);
    expect(result.price).toBe(30000);
  });

  it('throws on update error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'rls violation' } }));
    await expect(productService.updateProduct('prod-1', { price: 0 })).rejects.toMatchObject({
      message: 'rls violation',
    });
  });
});

describe('productService.archiveProduct', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls update with archived=true', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await productService.archiveProduct('prod-1');
    expect(chain['update']).toHaveBeenCalledWith(expect.objectContaining({ archived: true }));
    expect(chain['eq']).toHaveBeenCalledWith('id', 'prod-1');
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'forbidden' } }));
    await expect(productService.archiveProduct('prod-1')).rejects.toMatchObject({
      message: 'forbidden',
    });
  });
});

describe('productService.searchProducts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns matching products', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [PRODUCT], error: null }));
    const result = await productService.searchProducts('Kopi');
    expect(result).toHaveLength(1);
  });

  it('passes the ilike filter', async () => {
    const chain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await productService.searchProducts('Es Teh');
    expect(chain['ilike']).toHaveBeenCalledWith('name', '%Es Teh%');
  });

  it('only returns non-archived products', async () => {
    const chain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await productService.searchProducts('anything');
    expect(chain['eq']).toHaveBeenCalledWith('archived', false);
  });
});

describe('productService.getProductCategories', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list of categories', async () => {
    const cats = [
      { id: 'cat-1', name: 'Beverages' },
      { id: 'cat-2', name: 'Food' },
    ];
    mockFrom.mockReturnValue(makeChain({ data: cats, error: null }));
    const result = await productService.getProductCategories();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Beverages');
  });

  it('queries product_category table', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));
    await productService.getProductCategories();
    expect(mockFrom).toHaveBeenCalledWith('product_category');
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'forbidden' } }));
    await expect(productService.getProductCategories()).rejects.toMatchObject({
      message: 'forbidden',
    });
  });
});
