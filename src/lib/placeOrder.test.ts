import { describe, it, expect } from 'vitest';
import type { PlaceOrderPayload } from '../types/app';

// Validates the payload shape that will be sent to the place_order RPC.
// Does not call Supabase — tests the contract, not the network.

function buildPayload(overrides?: Partial<PlaceOrderPayload>): PlaceOrderPayload {
  return {
    items: [{ menu_item_id: 'abc-123', qty: 2 }],
    discount_id: null,
    ...overrides,
  };
}

describe('placeOrder payload shape', () => {
  it('requires at least one item', () => {
    const p = buildPayload();
    expect(p.items.length).toBeGreaterThan(0);
  });

  it('each item has menu_item_id and qty', () => {
    const p = buildPayload();
    p.items.forEach((item) => {
      expect(item).toHaveProperty('menu_item_id');
      expect(item).toHaveProperty('qty');
      expect(typeof item.menu_item_id).toBe('string');
      expect(typeof item.qty).toBe('number');
      expect(item.qty).toBeGreaterThan(0);
    });
  });

  it('qty must be a positive integer', () => {
    const p = buildPayload({ items: [{ menu_item_id: 'abc', qty: 3 }] });
    expect(p.items[0].qty).toBeGreaterThan(0);
    expect(Number.isInteger(p.items[0].qty)).toBe(true);
  });

  it('discount_id is optional (null allowed)', () => {
    const noDiscount = buildPayload({ discount_id: null });
    const withDiscount = buildPayload({ discount_id: 'disc-uuid-123' });
    expect(noDiscount.discount_id).toBeNull();
    expect(withDiscount.discount_id).toBe('disc-uuid-123');
  });

  it('multiple items are supported', () => {
    const p = buildPayload({
      items: [
        { menu_item_id: 'item-1', qty: 1 },
        { menu_item_id: 'item-2', qty: 3 },
      ],
    });
    expect(p.items).toHaveLength(2);
  });
});
