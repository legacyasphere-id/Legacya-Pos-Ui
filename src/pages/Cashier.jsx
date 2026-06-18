import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, ChevronDown, Plus, Minus,
  QrCode, CreditCard, Banknote, Wallet, User, Tag,
  Trash2, ArrowRight, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { fmtIDR, fmtIDRShort } from '../utils/formatCurrency';
import { getCategories, getMenuItems, getDiscounts, getStoreSettings, placeOrder, payOrderCash } from '../lib/api';

const paymentMethods = [
  { id: 'cash',    label: 'Cash',     icon: Banknote  },
  { id: 'qris',    label: 'QRIS',     icon: QrCode    },
  { id: 'card',    label: 'Card',     icon: CreditCard },
  { id: 'ewallet', label: 'E-Wallet', icon: Wallet    },
];

const POSCashier = () => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [taxBps, setTaxBps] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [discountId, setDiscountId] = useState(null);
  const [payment, setPayment] = useState('cash');
  const [search, setSearch] = useState('');
  const [charging, setCharging] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [cats, menu, discs, settings] = await Promise.all([
          getCategories(), getMenuItems(), getDiscounts(), getStoreSettings(),
        ]);
        setCategories(cats);
        setActiveCat(cats[0]?.id ?? null);
        setMenuItems(menu.filter((m) => m.is_available));
        setDiscounts(discs);
        setTaxBps(settings.tax_rate_bps ?? 1000);
      } catch (e) {
        setLoadError(e?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let res = menuItems.filter((m) => m.category_id === activeCat);
    if (search) res = menuItems.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    return res;
  }, [menuItems, activeCat, search]);

  const addToCart = (item) =>
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1, emoji: item.emoji }];
    });

  const updateQty = (id, delta) =>
    setCart((prev) => prev.flatMap((i) => (i.id === id ? (i.qty + delta <= 0 ? [] : [{ ...i, qty: i.qty + delta }]) : [i])));

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const selectedDiscount = discounts.find((d) => d.id === discountId) || null;
  const discountAmt = !selectedDiscount ? 0
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
      const order = await placeOrder({
        discount_id: discountId,
        items: cart.map((c) => ({ menu_item_id: c.id, qty: c.qty })),
      });
      if (payment === 'cash') {
        await payOrderCash(order.id, order.grand_total, crypto.randomUUID());
        setToast({ kind: 'ok', text: `${order.order_no} · Paid (cash)` });
      } else {
        setToast({ kind: 'ok', text: `${order.order_no} · awaiting ${payment.toUpperCase()} payment (Midtrans not configured yet)` });
      }
      setCart([]);
      setDiscountId(null);
    } catch (e) {
      setToast({ kind: 'err', text: e?.message || 'Charge failed' });
    } finally {
      setCharging(false);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="h-7 w-7 rounded-full border-2 border-line border-t-primary animate-spin" /></div>;
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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
              className="w-full h-11 pl-9 pr-3 rounded-xl bg-app text-[14px] border border-transparent focus:outline-none focus:border-primary focus:bg-card transition-all" />
          </div>
          <Badge tone="success" dot size="lg">Online · Synced</Badge>
        </div>

        <div className="px-4 pt-3 pb-2 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => {
            const count = menuItems.filter((m) => m.category_id === cat.id).length;
            return (
              <button key={cat.id} onClick={() => { setActiveCat(cat.id); setSearch(''); }}
                className={`shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-xl text-[13.5px] font-semibold transition-all ${
                  activeCat === cat.id && !search ? 'bg-tooltip text-white shadow-sm' : 'bg-app text-ink-soft hover:bg-line-soft hover:text-ink'
                }`}>
                {cat.name}
                <span className={`text-[10.5px] px-1.5 py-0.5 rounded-md font-bold tabular-nums ${
                  activeCat === cat.id && !search ? 'bg-white/15 text-white' : 'bg-card text-ink-muted'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="text-center text-[13px] text-ink-muted py-10">No items.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((item) => {
                const inCart = cart.find((c) => c.id === item.id);
                return (
                  <button key={item.id} onClick={() => addToCart(item)}
                    className="relative group bg-card border border-line rounded-2xl p-3 text-left hover:border-primary hover:shadow-md transition-all duration-150 active:scale-[0.98]">
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-app to-primary-soft flex items-center justify-center text-5xl mb-3">
                      {item.emoji}
                    </div>
                    {inCart && (
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                        {inCart.qty}
                      </div>
                    )}
                    <p className="text-[13px] font-semibold text-ink line-clamp-2 leading-snug min-h-[34px]">{item.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[13px] font-bold text-primary-text tabular-nums">{fmtIDRShort(item.price)}</p>
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
      <Card className="flex flex-col overflow-hidden">
        <div className="p-4 border-b border-line-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Current Order</p>
              <p className="text-[16px] font-bold text-ink tabular-nums" style={{ fontFamily: 'Plus Jakarta Sans' }}>New sale</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[12px] text-ink-soft">
            <User size={12} /> <span className="text-ink-muted">Customer lookup (optional)</span>
          </div>
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
                <div key={item.id} className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-2 transition-colors">
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-app to-primary-soft flex items-center justify-center text-2xl shrink-0">{item.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink leading-tight">{item.name}</p>
                    <p className="text-[11.5px] text-ink-muted tabular-nums mt-0.5">{fmtIDR(item.price)}</p>
                    <div className="mt-1.5 inline-flex items-center gap-2 bg-surface rounded-lg p-0.5">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-card hover:bg-line flex items-center justify-center text-ink-soft">
                        <Minus size={12} strokeWidth={2.6} />
                      </button>
                      <span className="text-[12.5px] font-bold tabular-nums min-w-[16px] text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-card hover:bg-line flex items-center justify-center text-ink-soft">
                        <Plus size={12} strokeWidth={2.6} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-ink tabular-nums">{fmtIDRShort(item.price * item.qty)}</p>
                    <button onClick={() => removeItem(item.id)} className="mt-1 text-ink-faint hover:text-danger transition-colors opacity-0 group-hover:opacity-100">
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
            <div className={`flex items-start gap-2 rounded-lg p-2.5 text-[12px] ${
              toast.kind === 'ok' ? 'bg-success-soft text-success-text' : 'bg-danger-soft text-danger-text'
            }`}>
              {toast.kind === 'ok' ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <AlertCircle size={14} className="shrink-0 mt-0.5" />}
              <span>{toast.text}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Tag size={13} className="text-ink-muted" />
            <span className="text-[12.5px] text-ink-soft flex-1">Discount</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setDiscountId(null)}
                className={`h-7 px-2.5 rounded-md text-[11.5px] font-bold transition-colors ${
                  !discountId ? 'bg-tooltip text-white' : 'bg-surface text-ink-soft hover:bg-line'
                }`}>None</button>
              {discounts.map((d) => (
                <button key={d.id} onClick={() => setDiscountId(d.id)}
                  className={`h-7 px-2.5 rounded-md text-[11.5px] font-bold tabular-nums transition-colors ${
                    discountId === d.id ? 'bg-tooltip text-white' : 'bg-surface text-ink-soft hover:bg-line'
                  }`}>{d.label}</button>
              ))}
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-dashed border-line">
            <div className="flex justify-between text-[12.5px]">
              <span className="text-ink-soft">Subtotal</span>
              <span className="tabular-nums font-medium text-ink">{fmtIDR(subtotal)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-[12.5px]">
                <span className="text-success-text">Discount</span>
                <span className="tabular-nums font-medium text-success-text">-{fmtIDR(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between text-[12.5px]">
              <span className="text-ink-soft">Tax {(taxBps / 100).toFixed(0)}%</span>
              <span className="tabular-nums font-medium text-ink">{fmtIDR(tax)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-line">
              <span className="text-[13px] font-semibold text-ink">Total</span>
              <span className="text-[22px] font-bold tabular-nums text-ink" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {fmtIDR(total)}
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">Payment method</p>
            <div className="grid grid-cols-4 gap-1.5">
              {paymentMethods.map((p) => {
                const Icon = p.icon;
                const active = payment === p.id;
                return (
                  <button key={p.id} onClick={() => setPayment(p.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      active ? 'bg-primary-soft text-primary-text ring-2 ring-primary' : 'bg-app text-ink-soft hover:bg-line-soft'
                    }`}>
                    <Icon size={16} strokeWidth={2.2} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button variant="primary" size="xl" className="w-full" iconRight={ArrowRight}
            onClick={handleCharge} disabled={charging || cart.length === 0}>
            {charging ? 'Processing…' : `Charge ${fmtIDR(total)}`}
          </Button>
        </div>
      </Card>
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
