import { supabase } from '../lib/supabaseClient';
import type { Tables, Enums } from '../types/database.generated';

export type Inventory = Tables<'inventory'>;
export type InventoryMovement = Tables<'inventory_movement'>;
export type InventoryMovementKind = Enums<'inventory_movement_kind'>;

export type InventoryWithProduct = Inventory & {
  product: Pick<Tables<'product'>, 'id' | 'name' | 'sku' | 'is_available' | 'archived'> | null;
};

export interface InventoryFilters {
  lowStock?: boolean;
  productId?: string;
}

const INVENTORY_SELECT =
  'id, product_id, qty_on_hand, qty_reserved, reorder_point, reorder_qty, ' +
  'unit, last_counted_at, created_at, updated_at, ' +
  'product(id, name, sku, is_available, archived)';

const MOVEMENT_SELECT =
  'id, inventory_id, kind, qty_delta, qty_after, reference_id, note, created_by, created_at';

export const inventoryService = {
  async getInventory(filters?: InventoryFilters): Promise<InventoryWithProduct[]> {
    let query = supabase.from('inventory').select(INVENTORY_SELECT);

    if (filters?.productId) {
      query = query.eq('product_id', filters.productId);
    }

    const { data, error } = await query;
    if (error) throw error;

    let rows = (data ?? []) as unknown as InventoryWithProduct[];

    if (filters?.lowStock) {
      rows = rows.filter((inv) => inv.qty_on_hand <= inv.reorder_point);
    }

    return rows;
  },

  async getMovements(productId?: string): Promise<InventoryMovement[]> {
    if (productId) {
      const { data: inv, error: invErr } = await supabase
        .from('inventory')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      if (invErr) throw invErr;
      if (!inv) return [];

      const { data, error } = await supabase
        .from('inventory_movement')
        .select(MOVEMENT_SELECT)
        .eq('inventory_id', inv.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as InventoryMovement[];
    }

    const { data, error } = await supabase
      .from('inventory_movement')
      .select(MOVEMENT_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as InventoryMovement[];
  },

  async adjustStock(
    productId: string,
    quantity: number,
    reason: string,
    kind: InventoryMovementKind = 'adjustment',
  ): Promise<InventoryMovement> {
    const { data, error } = await supabase.rpc('retail_adjust_stock', {
      p_product_id: productId,
      p_qty_delta: quantity,
      p_kind: kind,
      p_note: reason,
    });
    if (error) throw error;
    return data as InventoryMovement;
  },

  async getLowStockProducts(threshold?: number): Promise<InventoryWithProduct[]> {
    const { data, error } = await supabase.from('inventory').select(INVENTORY_SELECT);
    if (error) throw error;

    const rows = (data ?? []) as unknown as InventoryWithProduct[];

    return rows.filter((inv) =>
      threshold !== undefined ? inv.qty_on_hand <= threshold : inv.qty_on_hand <= inv.reorder_point,
    );
  },
};
