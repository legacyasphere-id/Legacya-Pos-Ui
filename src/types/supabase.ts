// Auto-derived from supabase/migrations/*.sql through 0006_retail_schema.sql
// Re-generate when schema changes.

export type AppRole = 'owner' | 'manager' | 'cashier';
export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'done' | 'void';
export type OrderPaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'void';
export type PaymentStatus = 'pending' | 'settled' | 'failed' | 'refunded' | 'expired';
export type PaymentMethod = 'qris' | 'card' | 'cash' | 'ewallet' | 'bank_transfer';
export type DiscountKind = 'percent' | 'amount';
export type CustomerType = 'dine_in' | 'takeaway';
export type StockMovementType = 'sale' | 'restock' | 'adjust' | 'waste';
export type DeviceType = 'printer' | 'terminal';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: AppRole;
  avatar_url: string | null;
  status: 'active' | 'invited' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  price: number;
  emoji: string | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Pick<Category, 'name'>;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
  last_restocked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeItem {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  qty_per_unit: number;
}

export interface Discount {
  id: string;
  label: string;
  kind: DiscountKind;
  value: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  table_label: string | null;
  customer_type: CustomerType;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  subtotal: number;
  discount_id: string | null;
  discount_type: 'none' | DiscountKind;
  discount_value: number;
  discount_total: number;
  tax_total: number;
  service_total: number;
  grand_total: number;
  placed_by: string | null;
  placed_at: string;
  cooking_at: string | null;
  ready_at: string | null;
  done_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order_item?: OrderItem[];
  payment?: Payment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name_snapshot: string;
  unit_price: number;
  qty: number;
  line_total: number;
  station_status: 'queued' | 'cooking' | 'done';
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  provider: string;
  provider_ref: string | null;
  idempotency_key: string;
  raw_payload: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
}

export interface StockMovement {
  id: string;
  ingredient_id: string;
  type: StockMovementType;
  qty_delta: number;
  reason: string | null;
  ref_order_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StoreSettings {
  id: number;
  singleton: boolean;
  business_name: string | null;
  handle: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  opens_at: string | null;
  closes_at: string | null;
  currency: string;
  tax_rate_bps: number;
  service_charge_bps: number;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodConfig {
  method: PaymentMethod;
  is_enabled: boolean;
  fee_bps: number;
  description: string | null;
  updated_at: string;
}

export interface ReceiptConfig {
  id: number;
  singleton: boolean;
  header_line_1: string | null;
  header_line_2: string | null;
  footer: string | null;
  show_logo: boolean;
  show_tax: boolean;
  show_qr: boolean;
  auto_print: boolean;
  updated_at: string;
}

// ── Retail schema (migration 0006) ────────────────────────────────────────────

export type InventoryMovementKind = 'sale' | 'return' | 'purchase' | 'adjustment' | 'waste';
export type TransactionStatus = 'open' | 'completed' | 'void';

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  /** Selling price in IDR (integer, no decimal) */
  price: number;
  /** Purchase/cost price in IDR for margin tracking */
  cost_price: number;
  emoji: string | null;
  image_url: string | null;
  is_available: boolean;
  track_inventory: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_category?: Pick<ProductCategory, 'name'>;
  inventory?: Inventory | null;
}

export interface Inventory {
  id: string;
  product_id: string;
  qty_on_hand: number;
  qty_reserved: number;
  reorder_point: number;
  reorder_qty: number;
  unit: string;
  last_counted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  inventory_id: string;
  kind: InventoryMovementKind;
  /** Positive = stock in, negative = stock out */
  qty_delta: number;
  /** Snapshot of qty_on_hand after this movement */
  qty_after: number;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  txn_no: string;
  cashier_id: string | null;
  discount_id: string | null;
  status: TransactionStatus;
  payment_status: OrderPaymentStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  note: string | null;
  void_reason: string | null;
  voided_at: string | null;
  voided_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  transaction_item?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string | null;
  name_snapshot: string;
  sku_snapshot: string | null;
  price_snapshot: number;
  cost_snapshot: number;
  qty: number;
  line_total: number;
  created_at: string;
}
