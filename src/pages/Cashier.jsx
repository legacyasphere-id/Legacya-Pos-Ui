import React, { useState, useMemo } from 'react';
import {
  Search, ChevronDown, Plus, Minus, Dot, Clock,
  QrCode, CreditCard, Banknote, Wallet, User, Tag,
  Trash2, Hash, ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { fmtIDR, fmtIDRShort } from '../utils/formatCurrency';

const categories = [
  { id: 'rice',  label: 'Rice Bowl', emoji: '🍱', count: 4 },
  { id: 'sushi', label: 'Sushi',     emoji: '🍣', count: 4 },
  { id: 'main',  label: 'Mains',     emoji: '🍜', count: 4 },
  { id: 'bev',   label: 'Beverages', emoji: '🍵', count: 4 },
];

const menuItems = [
  { id: 'm01', name: 'Chicken Mentai Bowl', cat: 'rice',  price: 58_000, emoji: '🍱', stock: 'high' },
  { id: 'm02', name: 'Salmon Mentai Bowl',  cat: 'rice',  price: 75_000, emoji: '🍱', stock: 'high' },
  { id: 'm03', name: 'Beef Teriyaki Bowl',  cat: 'rice',  price: 68_000, emoji: '🍚', stock: 'med' },
  { id: 'm04', name: 'Karaage Bowl',        cat: 'rice',  price: 52_000, emoji: '🍱', stock: 'high' },
  { id: 'm05', name: 'Salmon Aburi (4 pcs)',cat: 'sushi', price: 85_000, emoji: '🍣', stock: 'low' },
  { id: 'm06', name: 'Tuna Nigiri (4 pcs)', cat: 'sushi', price: 72_000, emoji: '🍣', stock: 'high' },
  { id: 'm07', name: 'California Roll',     cat: 'sushi', price: 58_000, emoji: '🍣', stock: 'high' },
  { id: 'm08', name: 'Dragon Roll',         cat: 'sushi', price: 95_000, emoji: '🍣', stock: 'med' },
  { id: 'm09', name: 'Beef Yakiniku',       cat: 'main',  price: 72_000, emoji: '🥩', stock: 'high' },
  { id: 'm10', name: 'Chicken Katsu',       cat: 'main',  price: 58_000, emoji: '🍗', stock: 'high' },
  { id: 'm11', name: 'Ramen Tonkotsu',      cat: 'main',  price: 65_000, emoji: '🍜', stock: 'high' },
  { id: 'm12', name: 'Tempura Set',         cat: 'main',  price: 78_000, emoji: '🍤', stock: 'med' },
  { id: 'm13', name: 'Iced Matcha Latte',   cat: 'bev',   price: 27_000, emoji: '🍵', stock: 'high' },
  { id: 'm14', name: 'Yuzu Lemonade',       cat: 'bev',   price: 25_000, emoji: '🍋', stock: 'high' },
  { id: 'm15', name: 'Ocha (Hot/Cold)',     cat: 'bev',   price: 12_000, emoji: '🍶', stock: 'high' },
  { id: 'm16', name: 'Sparkling Water',     cat: 'bev',   price: 18_000, emoji: '💧', stock: 'high' },
];

const paymentMethods = [
  { id: 'qris', label: 'QRIS',     icon: QrCode },
  { id: 'card', label: 'Card',     icon: CreditCard },
  { id: 'cash', label: 'Cash',     icon: Banknote },
  { id: 'ewal', label: 'E-Wallet', icon: Wallet },
];

const POSCashier = () => {
  const [activeCat, setActiveCat] = useState('rice');
  const [cart, setCart] = useState([
    { id: 'm01', name: 'Chicken Mentai Bowl', price: 58_000, qty: 2, emoji: '🍱' },
    { id: 'm13', name: 'Iced Matcha Latte',   price: 27_000, qty: 1, emoji: '🍵' },
  ]);
  const [selectedTable] = useState(3);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState('qris');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const inCat = menuItems.filter((m) => m.cat === activeCat);
    if (!search) return inCat;
    return inCat.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [activeCat, search]);

  const addToCart = (item) =>
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1, emoji: item.emoji }];
    });

  const updateQty = (id, delta) =>
    setCart((prev) => prev.flatMap((i) => i.id === id ? (i.qty + delta <= 0 ? [] : [{ ...i, qty: i.qty + delta }]) : [i]));

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = subtotal * (discount / 100);
  const tax         = (subtotal - discountAmt) * 0.1;
  const total       = subtotal - discountAmt + tax;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 h-full">
      {/* LEFT — Menu */}
      <Card className="flex flex-col overflow-hidden">
        <div className="p-4 border-b border-line-soft flex items-center gap-3">
          <button className="flex items-center gap-2 h-11 px-3.5 rounded-xl bg-primary-soft text-primary-text hover:bg-primary-soft-deep transition-colors">
            <Hash size={15} strokeWidth={2.4} />
            <span className="text-[14px] font-bold">Table {selectedTable}</span>
            <ChevronDown size={14} strokeWidth={2.4} />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu…"
              className="w-full h-11 pl-9 pr-3 rounded-xl bg-app text-[14px] border border-transparent focus:outline-none focus:border-primary focus:bg-card transition-all" />
          </div>
          <Badge tone="success" dot size="lg">Online · Synced</Badge>
        </div>

        <div className="px-4 pt-3 pb-2 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              className={`shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-xl text-[13.5px] font-semibold transition-all ${
                activeCat === cat.id ? 'bg-tooltip text-white shadow-sm' : 'bg-app text-ink-soft hover:bg-line-soft hover:text-ink'
              }`}>
              <span className="text-base">{cat.emoji}</span>
              {cat.label}
              <span className={`text-[10.5px] px-1.5 py-0.5 rounded-md font-bold tabular-nums ${
                activeCat === cat.id ? 'bg-white/15 text-white' : 'bg-card text-ink-muted'
              }`}>{cat.count}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((item) => {
              const inCart = cart.find((c) => c.id === item.id);
              return (
                <button key={item.id} onClick={() => addToCart(item)}
                  className="relative group bg-card border border-line rounded-2xl p-3 text-left hover:border-primary hover:shadow-md transition-all duration-150 active:scale-[0.98]">
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-app to-primary-soft flex items-center justify-center text-5xl mb-3">
                    {item.emoji}
                  </div>
                  {item.stock === 'low' && (
                    <div className="absolute top-2 right-2"><Badge tone="warning" size="sm" dot>Low</Badge></div>
                  )}
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
        </div>
      </Card>

      {/* RIGHT — Order panel */}
      <Card className="flex flex-col overflow-hidden">
        <div className="p-4 border-b border-line-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Current Order</p>
              <p className="text-[16px] font-bold text-ink tabular-nums" style={{ fontFamily: 'Plus Jakarta Sans' }}>ORD-1052</p>
            </div>
            <Badge tone="primary" dot size="lg">Table {selectedTable}</Badge>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[12px] text-ink-soft">
            <User size={12} /> <span>Walk-in customer</span>
            <Dot size={12} className="text-ink-faint" />
            <Clock size={12} /> <span className="tabular-nums">11:48 WIB</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-app flex items-center justify-center mb-3">
                <span className="text-3xl">🛒</span>
              </div>
              <p className="text-[14px] font-semibold text-ink">Empty order</p>
              <p className="text-[12.5px] text-ink-muted mt-1">Tap any menu item to start</p>
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
          <div className="flex items-center gap-2">
            <Tag size={13} className="text-ink-muted" />
            <span className="text-[12.5px] text-ink-soft flex-1">Discount</span>
            <div className="flex items-center gap-1">
              {[0, 10, 15].map((d) => (
                <button key={d} onClick={() => setDiscount(d)}
                  className={`h-7 px-2.5 rounded-md text-[11.5px] font-bold tabular-nums transition-colors ${
                    discount === d ? 'bg-tooltip text-white' : 'bg-surface text-ink-soft hover:bg-line'
                  }`}>
                  {d === 0 ? 'None' : `${d}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-dashed border-line">
            <div className="flex justify-between text-[12.5px]">
              <span className="text-ink-soft">Subtotal</span>
              <span className="tabular-nums font-medium text-ink">{fmtIDR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[12.5px]">
                <span className="text-success-text">Discount ({discount}%)</span>
                <span className="tabular-nums font-medium text-success-text">-{fmtIDR(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between text-[12.5px]">
              <span className="text-ink-soft">Tax 10%</span>
              <span className="tabular-nums font-medium text-ink">{fmtIDR(tax)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-line">
              <span className="text-[13px] font-semibold text-ink">Total</span>
              <span className="text-[22px] font-bold tabular-nums text-ink" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {fmtIDR(Math.round(total))}
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

          <Button variant="primary" size="xl" className="w-full" iconRight={ArrowRight}>
            Charge {fmtIDR(Math.round(total))}
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
