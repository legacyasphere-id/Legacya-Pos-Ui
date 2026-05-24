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
        <div className="p-4 border-b border-[#EEF2F7] flex items-center gap-3">
          <button className="flex items-center gap-2 h-11 px-3.5 rounded-xl bg-[#DCEAF5] text-[#3A6588] hover:bg-[#C9DEF0] transition-colors">
            <Hash size={15} strokeWidth={2.4} />
            <span className="text-[14px] font-bold">Table {selectedTable}</span>
            <ChevronDown size={14} strokeWidth={2.4} />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu…"
              className="w-full h-11 pl-9 pr-3 rounded-xl bg-[#F6F9FC] text-[14px] border border-transparent focus:outline-none focus:border-[#4A7FA7] focus:bg-white transition-all" />
          </div>
          <Badge tone="success" dot size="lg">Online · Synced</Badge>
        </div>

        <div className="px-4 pt-3 pb-2 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              className={`shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-xl text-[13.5px] font-semibold transition-all ${
                activeCat === cat.id ? 'bg-[#1E293B] text-white shadow-sm' : 'bg-[#F6F9FC] text-[#64748B] hover:bg-[#EEF2F7] hover:text-[#1E293B]'
              }`}>
              <span className="text-base">{cat.emoji}</span>
              {cat.label}
              <span className={`text-[10.5px] px-1.5 py-0.5 rounded-md font-bold tabular-nums ${
                activeCat === cat.id ? 'bg-white/15 text-white' : 'bg-white text-[#94A3B8]'
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
                  className="relative group bg-white border border-[#E2E8F0] rounded-2xl p-3 text-left hover:border-[#4A7FA7] hover:shadow-md transition-all duration-150 active:scale-[0.98]">
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-[#F6F9FC] to-[#DCEAF5] flex items-center justify-center text-5xl mb-3">
                    {item.emoji}
                  </div>
                  {item.stock === 'low' && (
                    <div className="absolute top-2 right-2"><Badge tone="warning" size="sm" dot>Low</Badge></div>
                  )}
                  {inCart && (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#4A7FA7] text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                      {inCart.qty}
                    </div>
                  )}
                  <p className="text-[13px] font-semibold text-[#1E293B] line-clamp-2 leading-snug min-h-[34px]">{item.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-[#3A6588] tabular-nums">{fmtIDRShort(item.price)}</p>
                    <div className="w-7 h-7 rounded-lg bg-[#F6F9FC] group-hover:bg-[#4A7FA7] group-hover:text-white text-[#64748B] flex items-center justify-center transition-colors">
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
        <div className="p-4 border-b border-[#EEF2F7]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Current Order</p>
              <p className="text-[16px] font-bold text-[#1E293B] tabular-nums" style={{ fontFamily: 'Plus Jakarta Sans' }}>ORD-1052</p>
            </div>
            <Badge tone="primary" dot size="lg">Table {selectedTable}</Badge>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[12px] text-[#64748B]">
            <User size={12} /> <span>Walk-in customer</span>
            <Dot size={12} className="text-[#CBD5E1]" />
            <Clock size={12} /> <span className="tabular-nums">11:48 WIB</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-[#F6F9FC] flex items-center justify-center mb-3">
                <span className="text-3xl">🛒</span>
              </div>
              <p className="text-[14px] font-semibold text-[#1E293B]">Empty order</p>
              <p className="text-[12.5px] text-[#94A3B8] mt-1">Tap any menu item to start</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#F6F9FC] to-[#DCEAF5] flex items-center justify-center text-2xl shrink-0">{item.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1E293B] leading-tight">{item.name}</p>
                    <p className="text-[11.5px] text-[#94A3B8] tabular-nums mt-0.5">{fmtIDR(item.price)}</p>
                    <div className="mt-1.5 inline-flex items-center gap-2 bg-[#F1F5F9] rounded-lg p-0.5">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-white hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B]">
                        <Minus size={12} strokeWidth={2.6} />
                      </button>
                      <span className="text-[12.5px] font-bold tabular-nums min-w-[16px] text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-white hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B]">
                        <Plus size={12} strokeWidth={2.6} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-[#1E293B] tabular-nums">{fmtIDRShort(item.price * item.qty)}</p>
                    <button onClick={() => removeItem(item.id)} className="mt-1 text-[#CBD5E1] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#EEF2F7] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Tag size={13} className="text-[#94A3B8]" />
            <span className="text-[12.5px] text-[#64748B] flex-1">Discount</span>
            <div className="flex items-center gap-1">
              {[0, 10, 15].map((d) => (
                <button key={d} onClick={() => setDiscount(d)}
                  className={`h-7 px-2.5 rounded-md text-[11.5px] font-bold tabular-nums transition-colors ${
                    discount === d ? 'bg-[#1E293B] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}>
                  {d === 0 ? 'None' : `${d}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-dashed border-[#E2E8F0]">
            <div className="flex justify-between text-[12.5px]">
              <span className="text-[#64748B]">Subtotal</span>
              <span className="tabular-nums font-medium text-[#1E293B]">{fmtIDR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[12.5px]">
                <span className="text-[#15803D]">Discount ({discount}%)</span>
                <span className="tabular-nums font-medium text-[#15803D]">-{fmtIDR(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between text-[12.5px]">
              <span className="text-[#64748B]">Tax 10%</span>
              <span className="tabular-nums font-medium text-[#1E293B]">{fmtIDR(tax)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#E2E8F0]">
              <span className="text-[13px] font-semibold text-[#1E293B]">Total</span>
              <span className="text-[22px] font-bold tabular-nums text-[#1E293B]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {fmtIDR(Math.round(total))}
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Payment method</p>
            <div className="grid grid-cols-4 gap-1.5">
              {paymentMethods.map((p) => {
                const Icon = p.icon;
                const active = payment === p.id;
                return (
                  <button key={p.id} onClick={() => setPayment(p.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      active ? 'bg-[#DCEAF5] text-[#3A6588] ring-2 ring-[#4A7FA7]' : 'bg-[#F6F9FC] text-[#64748B] hover:bg-[#EEF2F7]'
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
