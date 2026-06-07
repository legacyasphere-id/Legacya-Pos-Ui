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

// ── Orders / Kitchen ─────────────────────────────────────────────────────────
const ORDER_SELECT =
  'id, order_no, table_label, status, payment_status, grand_total, placed_at, cooking_at, ' +
  'order_item(name_snapshot, qty), payment(method, status)';

export async function getOrders({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from('order')
    .select(ORDER_SELECT)
    .order('placed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// Active kitchen queue: not yet served/paid.
export async function getKitchenOrders() {
  const { data, error } = await supabase
    .from('order')
    .select('id, order_no, table_label, status, placed_at, cooking_at, order_item(name_snapshot, qty)')
    .in('status', ['pending', 'cooking'])
    .order('placed_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function advanceOrderStatus(orderId, toStatus) {
  const { data, error } = await supabase.rpc('advance_order_status', {
    p_order_id: orderId,
    p_to: toStatus,
  });
  if (error) throw error;
  return data;
}

// Realtime subscription on the order table. Returns an unsubscribe function.
// (Requires the `order` table to be in the supabase_realtime publication; if it
//  isn't, callers should also poll — see Kitchen.)
export function subscribeOrders(onChange) {
  const channel = supabase
    .channel('orders-stream')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order' }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

