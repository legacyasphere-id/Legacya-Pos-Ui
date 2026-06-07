import { supabase } from './supabaseClient';

// ── Catalog ────────────────────────────────────────────────────────────────
export async function getCategories() {
  const { data, error } = await supabase
    .from('category')
    .select('id, name, sort_order')
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function getMenuItems() {
  const { data, error } = await supabase
    .from('menu_item')
    .select('id, name, price, emoji, image_url, is_available, category_id, updated_at, category(name)')
    .order('sort_order')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function setMenuItemAvailability(id, isAvailable) {
  const { error } = await supabase
    .from('menu_item')
    .update({ is_available: isAvailable })
    .eq('id', id);
  if (error) throw error;
}

export async function getDiscounts() {
  const { data, error } = await supabase
    .from('discount')
    .select('id, label, kind, value')
    .eq('is_active', true)
    .order('value');
  if (error) throw error;
  return data ?? [];
}

export async function getStoreSettings() {
  const { data, error } = await supabase
    .from('store_settings')
    .select('tax_rate_bps, service_charge_bps, currency')
    .maybeSingle();
  if (error) throw error;
  return data ?? { tax_rate_bps: 1000, service_charge_bps: 0, currency: 'IDR' };
}

// ── Orders / payments (RPC) ──────────────────────────────────────────────────
// payload: { table_label, customer_type, discount_id?, items:[{menu_item_id, qty}] }
export async function placeOrder(payload) {
  const { data, error } = await supabase.rpc('place_order', { payload });
  if (error) throw error;
  return data; // the order row
}

export async function payOrderCash(orderId, amount, idempotencyKey) {
  const { data, error } = await supabase.rpc('pay_order_cash', {
    p_order_id: orderId,
    p_amount: amount,
    p_idempotency_key: idempotencyKey,
  });
  if (error) throw error;
  return data;
}
