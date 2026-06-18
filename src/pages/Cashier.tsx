import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Search,
  Plus,
  Minus,
  QrCode,
  CreditCard,
  Banknote,
  Wallet,
  Tag,
  Trash2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { fmtIDR, fmtIDRShort } from '../utils/formatCurrency';
import {
  productService,
  type ProductWithCategory,
  type ProductCategory,
} from '../services/productService';
import {
  transactionService,
  type Discount,
  type Transaction,
  type CheckoutItem,
} from '../services/transactionService';
import { supabase } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartEntry {
  product_id: string;
  name: string;
  price: number;
  cost_price: number;
  sku: string | null;
  track_inventory: boolean;
  qty: number;
  emoji: string | null;
}

interface PaymentMethod {
  id: string;
  label: string;
  icon: LucideIcon;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'qris', label: 'QRIS', icon: QrCode },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'ewallet', label: 'E-Wallet', icon: Wallet },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const POSCashier: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [taxBps, setTaxBps] = useState(1000);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [discountId, setDiscountId] = useState<string | null>(null);
  const [payment, setPayment] = useState('cash');
  const [search, setSearch] = useState('');
  const [charging, setCharging] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [cats, prods, discs, settingsRes] = await Promise.all([
        productService.getProductCategories(),
        productService.getProducts({ archived: false }),
        transactionService.getDiscounts(),
        supabase.from('store_settings').select('tax_rate_bps').maybeSingle(),
      ]);
      setCategories(cats);
      setActiveCat(cats[0]?.id ?? null);
      setProducts(prods.filter((p) => p.is_available));
      setDiscounts(discs);
      if (settingsRes.data?.tax_rate_bps) setTaxBps(settingsRes.data.tax_rate_bps);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentTxns = useCallback(async () => {
    try {
      const txns = await transactionService.getTransactions({ limit: 5 });
      setRecentTxns(txns.filter((t) => t.status !== 'void'));
    } catch {
      /* non-critical */
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    void loadData();
  }, [loadData]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    void loadRecentTxns();
  }, [loadRecentTxns]);

  const filtered = useMemo(() => {
    if (search) return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (activeCat) return products.filter((p) => p.category_id === activeCat);
    return products;
  }, [products, activeCat, search]);

  const addToCart = (product: ProductWithCategory) =>
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => (i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          cost_price: product.cost_price,
          sku: product.sku,
          track_inventory: product.track_inventory,
          qty: 1,
          emoji: product.emoji,
        },
      ];
    });

  const updateQty = (productId: string, delta: number) =>
    setCart((prev) =>
      prev.flatMap((i) =>
        i.product_id === productId
          ? i.qty + delta <= 0
            ? []
            : [{ ...i, qty: i.qty + delta }]
          : [i],
      ),
    );

  const removeItem = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.product_id !== productId));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const selectedDiscount = discounts.find((d) => d.id === discountId) ?? null;
  const discountAmt = !selectedDiscount
    ? 0
    : selectedDiscount.kind === 'percent'
      ? Math.floor((subtotal * selectedDiscount.value) / 10000)
      : Math.min(selectedDiscount.value, subtotal);
  const taxable = subtotal - discountAmt;
  const tax = Math.floor((taxable * taxBps) / 10000);
  const total = taxable + tax;

  const handleCharge = async () => {
    if (cart.length === 0 || charging) return;
    setCharging(true);
    setToast(null);
    try {
      const items: CheckoutItem[] = cart.map((i) => ({
        product_id: i.product_id,
        qty: i.qty,
        price_snapshot: i.price,
        cost_snapshot: i.cost_price,
        name_snapshot: i.name,
        sku_snapshot: i.sku,
        track_inventory: i.track_inventory,
        line_total: i.price * i.qty,
      }));

      const txn = await transactionService.checkout(
        items,
        {
          subtotal,
          discount_id: discountId,
          discount_amount: discountAmt,
          tax_amount: tax,
          grand_total: total,
        },
        payment !== 'cash' ? `Payment: ${payment}` : undefined,
      );

      setToast({ kind: 'ok', text: `${txn.txn_no} · Paid ${fmtIDR(total)}` });
      setCart([]);
      setDiscountId(null);
      void loadRecentTxns();
    } catch (e: unknown) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Charge failed' });
    } finally {
      setCharging(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-7 w-7 rounded-full border-2 border-line border-t-primary animate-spin" />
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-danger-soft text-danger-text p-4 text-[13px]">
        <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span>{loadError}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 h-full">
      {/* LEFT — Products */}
      <Card className="flex flex-col overflow-hidden">
        <div className="p-4 border-b border-line-soft flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full h-11 pl-9 pr-3 rounded-xl bg-app text-[14px] border border-transparent focus:outline-none focus:border-primary focus:bg-card transition-all"
            />
          </div>
          <Badge tone="success" dot size="lg">
            Online · Live
          </Badge>
        </div>

        <div className="px-4 pt-3 pb-2 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCat(cat.id);
                  setSearch('');
                }}
                className={`shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-xl text-[13.5px] font-semibold transition-all ${
                  activeCat === cat.id && !search
                    ? 'bg-tooltip text-white shadow-sm'
                    : 'bg-app text-ink-soft hover:bg-line-soft hover:text-ink'
                }`}
              >
                {cat.name}
                <span
                  className={`text-[10.5px] px-1.5 py-0.5 rounded-md font-bold tabular-nums ${
                    activeCat === cat.id && !search
                      ? 'bg-white/15 text-white'
                      : 'bg-card text-ink-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="text-center text-[13px] text-ink-muted py-10">No products.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((product) => {
                const inCart = cart.find((c) => c.product_id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="relative group bg-card border border-line rounded-2xl p-3 text-left hover:border-primary hover:shadow-md transition-all duration-150 active:scale-[0.98]"
                  >
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-app to-primary-soft flex items-center justify-center text-5xl mb-3">
                      {product.emoji ?? '📦'}
                    </div>
                    {inCart && (
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                        {inCart.qty}
                      </div>
                    )}
                    <p className="text-[13px] font-semibold text-ink line-clamp-2 leading-snug min-h-[34px]">
                      {product.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[13px] font-bold text-primary-text tabular-nums">
                        {fmtIDRShort(product.price)}
                      </p>
                      <div className="w-7 h-7 rounded-lg bg-app group-hover:bg-primary group-hover:text-white text-ink-soft flex items-center justify-center transition-colors">
                        <Plus size={14} strokeWidth={2.6} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* RIGHT — Order panel */}
      <div className="flex flex-col gap-3 overflow-hidden">
        <Card className="flex flex-col overflow-hidden flex-1">
          <div className="p-4 border-b border-line-soft">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Current Order
            </p>
            <p
              className="text-[16px] font-bold text-ink tabular-nums"
              style={{ fontFamily: 'Plus Jakarta Sans' }}
            >
              New sale
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-app flex items-center justify-center mb-3">
                  <span className="text-3xl">🛒</span>
                </div>
                <p className="text-[14px] font-semibold text-ink">Empty order</p>
                <p className="text-[12.5px] text-ink-muted mt-1">Tap any product to start</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-2 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-app to-primary-soft flex items-center justify-center text-2xl shrink-0">
                      {item.emoji ?? '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink leading-tight">
                        {item.name}
                      </p>
                      <p className="text-[11.5px] text-ink-muted tabular-nums mt-0.5">
                        {fmtIDR(item.price)}
                      </p>
                      <div className="mt-1.5 inline-flex items-center gap-2 bg-surface rounded-lg p-0.5">
                        <button
                          onClick={() => updateQty(item.product_id, -1)}
                          className="w-6 h-6 rounded-md bg-card hover:bg-line flex items-center justify-center text-ink-soft"
                        >
                          <Minus size={12} strokeWidth={2.6} />
                        </button>
                        <span className="text-[12.5px] font-bold tabular-nums min-w-[16px] text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.product_id, 1)}
                          className="w-6 h-6 rounded-md bg-card hover:bg-line flex items-center justify-center text-ink-soft"
                        >
                          <Plus size={12} strokeWidth={2.6} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-ink tabular-nums">
                        {fmtIDRShort(item.price * item.qty)}
                      </p>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="mt-1 text-ink-faint hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-line-soft p-4 space-y-3">
            {toast && (
              <div
                className={`flex items-start gap-2 rounded-lg p-2.5 text-[12px] ${
                  toast.kind === 'ok'
                    ? 'bg-success-soft text-success-text'
                    : 'bg-danger-soft text-danger-text'
                }`}
              >
                {toast.kind === 'ok' ? (
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                )}
                <span>{toast.text}</span>
              </div>
            )}

            {discounts.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag size={13} className="text-ink-muted" />
                <span className="text-[12.5px] text-ink-soft flex-1">Discount</span>
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => setDiscountId(null)}
                    className={`h-7 px-2.5 rounded-md text-[11.5px] font-bold transition-colors ${
                      !discountId
                        ? 'bg-tooltip text-white'
                        : 'bg-surface text-ink-soft hover:bg-line'
                    }`}
                  >
                    None
                  </button>
                  {discounts.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDiscountId(d.id)}
                      className={`h-7 px-2.5 rounded-md text-[11.5px] font-bold tabular-nums transition-colors ${
                        discountId === d.id
                          ? 'bg-tooltip text-white'
                          : 'bg-surface text-ink-soft hover:bg-line'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1 pt-2 border-t border-dashed border-line">
              <div className="flex justify-between text-[12.5px]">
                <span className="text-ink-soft">Subtotal</span>
                <span className="tabular-nums font-medium text-ink">{fmtIDR(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-success-text">Discount</span>
                  <span className="tabular-nums font-medium text-success-text">
                    -{fmtIDR(discountAmt)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[12.5px]">
                <span className="text-ink-soft">Tax {(taxBps / 100).toFixed(0)}%</span>
                <span className="tabular-nums font-medium text-ink">{fmtIDR(tax)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-line">
                <span className="text-[13px] font-semibold text-ink">Total</span>
                <span
                  className="text-[22px] font-bold tabular-nums text-ink"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  {fmtIDR(total)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Payment method
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  const active = payment === pm.id;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => setPayment(pm.id)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                        active
                          ? 'bg-primary-soft text-primary-text ring-2 ring-primary'
                          : 'bg-app text-ink-soft hover:bg-line-soft'
                      }`}
                    >
                      <Icon size={16} strokeWidth={2.2} />
                      {pm.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              variant="primary"
              size="xl"
              className="w-full"
              iconRight={ArrowRight}
              onClick={() => void handleCharge()}
              disabled={charging || cart.length === 0}
            >
              {charging ? 'Processing…' : `Charge ${fmtIDR(total)}`}
            </Button>
          </div>
        </Card>

        {/* Recent transactions */}
        {recentTxns.length > 0 && (
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={13} className="text-ink-muted" />
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Recent
              </p>
            </div>
            <div className="space-y-1.5">
              {recentTxns.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between text-[12px] py-1">
                  <div>
                    <span className="font-semibold text-ink">{txn.txn_no}</span>
                    <span className="ml-2 text-ink-muted">
                      {formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <span className="font-bold tabular-nums text-ink">
                    {fmtIDRShort(txn.grand_total)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default function CashierPage() {
  return (
    <div className="flex-1 overflow-hidden p-4">
      <POSCashier />
    </div>
  );
}
