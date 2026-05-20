import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard, ShoppingCart, ReceiptText, ChefHat,
  Package, UtensilsCrossed, BarChart3, Bell, Settings,
  Search, ChevronsLeft, ChevronsRight, Sparkles, MoreHorizontal,
  TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight,
  Plus, Minus, Command, Dot, Check, X, Calendar, ChevronDown,
  Flame, Clock, ArrowRight, RefreshCw, Download, Eye,
  CreditCard, Wallet, QrCode, Banknote, User, Tag, Trash2,
  Maximize2, Volume2, Timer, ChefHat as ChefHatIcon, CheckCircle2,
  Filter, SlidersHorizontal, ArrowUpDown, MapPin, Hash, Printer
} from 'lucide-react';

/* =========================================================================
   LEGACYAPOS — PHASE 2 (final): POS Cashier · Orders · Kitchen Display
   ========================================================================= */

const tokens = {
  color: {
    primary:'#4A7FA7', primarySoft:'#DCEAF5', primaryDeep:'#3A6588',
    bg:'#F6F9FC', card:'#FFFFFF',
    textMain:'#1E293B', textSoft:'#64748B', textMuted:'#94A3B8',
    border:'#E2E8F0', borderSoft:'#EEF2F7',
    success:'#22C55E', warning:'#F59E0B', danger:'#EF4444',
  },
  shadow: {
    sm:'0 1px 2px 0 rgb(15 23 42 / 0.04)',
    md:'0 4px 12px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
    lg:'0 12px 32px -8px rgb(15 23 42 / 0.10), 0 4px 8px -4px rgb(15 23 42 / 0.05)',
  },
};

const fmtIDR = (n) => 'Rp ' + n.toLocaleString('id-ID');
const fmtIDRShort = (n) => n >= 1_000_000 ? `Rp ${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `Rp ${(n/1_000).toFixed(0)}K` : `Rp ${n}`;

/* -------------------------------------------------------------------------
   MOCK DATA
   ------------------------------------------------------------------------- */
const categories = [
  { id:'rice',  label:'Rice Bowl', emoji:'🍱', count:4 },
  { id:'sushi', label:'Sushi',     emoji:'🍣', count:4 },
  { id:'main',  label:'Mains',     emoji:'🍜', count:4 },
  { id:'bev',   label:'Beverages', emoji:'🍵', count:4 },
];

const menuItems = [
  { id:'m01', name:'Chicken Mentai Bowl', cat:'rice',  price:58_000, emoji:'🍱', stock:'high', sold:38 },
  { id:'m02', name:'Salmon Mentai Bowl',  cat:'rice',  price:75_000, emoji:'🍱', stock:'high', sold:24 },
  { id:'m03', name:'Beef Teriyaki Bowl',  cat:'rice',  price:68_000, emoji:'🍚', stock:'med',  sold:19 },
  { id:'m04', name:'Karaage Bowl',        cat:'rice',  price:52_000, emoji:'🍱', stock:'high', sold:22 },
  { id:'m05', name:'Salmon Aburi (4 pcs)',cat:'sushi', price:85_000, emoji:'🍣', stock:'low',  sold:14 },
  { id:'m06', name:'Tuna Nigiri (4 pcs)', cat:'sushi', price:72_000, emoji:'🍣', stock:'high', sold:11 },
  { id:'m07', name:'California Roll',     cat:'sushi', price:58_000, emoji:'🍣', stock:'high', sold:9  },
  { id:'m08', name:'Dragon Roll',         cat:'sushi', price:95_000, emoji:'🍣', stock:'med',  sold:7  },
  { id:'m09', name:'Beef Yakiniku',       cat:'main',  price:72_000, emoji:'🥩', stock:'high', sold:19 },
  { id:'m10', name:'Chicken Katsu',       cat:'main',  price:58_000, emoji:'🍗', stock:'high', sold:16 },
  { id:'m11', name:'Ramen Tonkotsu',      cat:'main',  price:65_000, emoji:'🍜', stock:'high', sold:21 },
  { id:'m12', name:'Tempura Set',         cat:'main',  price:78_000, emoji:'🍤', stock:'med',  sold:8  },
  { id:'m13', name:'Iced Matcha Latte',   cat:'bev',   price:27_000, emoji:'🍵', stock:'high', sold:31 },
  { id:'m14', name:'Yuzu Lemonade',       cat:'bev',   price:25_000, emoji:'🍋', stock:'high', sold:18 },
  { id:'m15', name:'Ocha (Hot/Cold)',     cat:'bev',   price:12_000, emoji:'🍶', stock:'high', sold:42 },
  { id:'m16', name:'Sparkling Water',     cat:'bev',   price:18_000, emoji:'💧', stock:'high', sold:9  },
];

const tablesData = Array.from({ length:12 }, (_, i) => ({
  id:i+1,
  status: [2,5,9,12].includes(i+1) ? 'occupied' : [7].includes(i+1) ? 'reserved' : 'free',
  guests: [2,5,9,12].includes(i+1) ? Math.floor(Math.random()*3)+2 : 0,
}));

const allOrders = [
  { id:'ORD-1051', table:2,  items:[{ name:'Chicken Mentai', qty:2 }, { name:'Matcha', qty:2 }], total:170_000, status:'pending', payment:'qris', time:'11:48', date:'Today', elapsed:30 },
  { id:'ORD-1050', table:9,  items:[{ name:'Beef Yakiniku', qty:1 }, { name:'Ramen', qty:1 }], total:137_000, status:'cooking', payment:'card', time:'11:36', date:'Today', elapsed:12*60 },
  { id:'ORD-1049', table:4,  items:[{ name:'Salmon Aburi', qty:2 }, { name:'Ocha', qty:2 }], total:194_000, status:'cooking', payment:'qris', time:'11:41', date:'Today', elapsed:7*60 },
  { id:'ORD-1048', table:7,  items:[{ name:'Chicken Mentai', qty:2 }], total:116_000, status:'cooking', payment:'qris', time:'11:42', date:'Today', elapsed:6*60 },
  { id:'ORD-1047', table:12, items:[{ name:'Salmon Mentai', qty:3 }, { name:'Matcha', qty:2 }], total:279_000, status:'pending', payment:'card', time:'11:44', date:'Today', elapsed:4*60 },
  { id:'ORD-1046', table:3,  items:[{ name:'Beef Yakiniku', qty:1 }], total:72_000, status:'done', payment:'cash', time:'11:38', date:'Today' },
  { id:'ORD-1045', table:5,  items:[{ name:'Tom Yum', qty:2 }, { name:'Matcha', qty:1 }], total:117_000, status:'paid', payment:'qris', time:'11:32', date:'Today' },
  { id:'ORD-1044', table:9,  items:[{ name:'Mentai', qty:1 }, { name:'Salmon', qty:1 }], total:143_000, status:'paid', payment:'card', time:'11:28', date:'Today' },
  { id:'ORD-1043', table:2,  items:[{ name:'Yakiniku', qty:2 }, { name:'Matcha', qty:2 }], total:198_000, status:'paid', payment:'qris', time:'11:24', date:'Today' },
  { id:'ORD-1042', table:6,  items:[{ name:'Ramen', qty:1 }, { name:'Karaage', qty:1 }], total:117_000, status:'paid', payment:'cash', time:'11:18', date:'Today' },
  { id:'ORD-1041', table:11, items:[{ name:'Dragon Roll', qty:1 }, { name:'Sake', qty:1 }], total:120_000, status:'paid', payment:'card', time:'11:12', date:'Today' },
  { id:'ORD-1040', table:8,  items:[{ name:'Tempura Set', qty:2 }], total:156_000, status:'paid', payment:'qris', time:'11:06', date:'Today' },
];

/* -------------------------------------------------------------------------
   NAV
   ------------------------------------------------------------------------- */
const navGroups = [
  { label:'Operations', items:[
    { id:'dashboard', label:'Dashboard',       icon:LayoutDashboard },
    { id:'pos',       label:'POS Cashier',     icon:ShoppingCart },
    { id:'orders',    label:'Orders',          icon:ReceiptText, badge:3 },
    { id:'kitchen',   label:'Kitchen Display', icon:ChefHat, badge:5 },
  ]},
  { label:'Manage', items:[
    { id:'inventory', label:'Inventory',       icon:Package, alert:true },
    { id:'menu',      label:'Menu',            icon:UtensilsCrossed },
    { id:'analytics', label:'Analytics',       icon:BarChart3 },
  ]},
  { label:'System', items:[
    { id:'notifications', label:'Notifications', icon:Bell, badge:2 },
    { id:'settings',      label:'Settings',      icon:Settings },
  ]},
];

/* -------------------------------------------------------------------------
   BASE COMPONENTS
   ------------------------------------------------------------------------- */
const Button = ({ variant='primary', size='md', icon:Icon, iconRight:IconRight, children, className='', ...rest }) => {
  const sizes = { sm:'h-8 px-3 text-[13px] gap-1.5', md:'h-10 px-4 text-sm gap-2', lg:'h-12 px-5 text-[15px] gap-2', xl:'h-14 px-6 text-base gap-2.5' };
  const variants = {
    primary:'bg-[#4A7FA7] text-white hover:bg-[#3A6588] shadow-sm',
    secondary:'bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#F6F9FC]',
    ghost:'bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]',
    soft:'bg-[#DCEAF5] text-[#3A6588] hover:bg-[#C9DEF0]',
    danger:'bg-[#EF4444] text-white hover:bg-[#DC2626]',
    success:'bg-[#22C55E] text-white hover:bg-[#16A34A] shadow-sm',
  };
  return (
    <button {...rest} className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] ${sizes[size]} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={size==='sm'?14:size==='xl'?20:16} strokeWidth={2.2} />}
      {children}
      {IconRight && <IconRight size={size==='sm'?14:size==='xl'?20:16} strokeWidth={2.2} />}
    </button>
  );
};

const Badge = ({ tone='neutral', children, dot=false, className='', size='md' }) => {
  const tones = {
    neutral:'bg-[#F1F5F9] text-[#475569]',
    primary:'bg-[#DCEAF5] text-[#3A6588]',
    success:'bg-[#DCFCE7] text-[#15803D]',
    warning:'bg-[#FEF3C7] text-[#B45309]',
    danger: 'bg-[#FEE2E2] text-[#B91C1C]',
  };
  const dotColors = { neutral:'bg-slate-400', primary:'bg-[#4A7FA7]', success:'bg-[#22C55E]', warning:'bg-[#F59E0B]', danger:'bg-[#EF4444]' };
  const sizes = { sm:'px-1.5 py-0.5 text-[10px]', md:'px-2 py-0.5 text-[11px]', lg:'px-2.5 py-1 text-[12px]' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-semibold ${tones[tone]} ${sizes[size]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[tone]}`} />}
      {children}
    </span>
  );
};

const Card = ({ children, className='', ...rest }) => (
  <div {...rest} className={`bg-white border border-[#E2E8F0] rounded-2xl ${className}`} style={{ boxShadow: tokens.shadow.sm }}>
    {children}
  </div>
);

/* -------------------------------------------------------------------------
   POS CASHIER
   ------------------------------------------------------------------------- */
const POSCashier = () => {
  const [activeCat, setActiveCat] = useState('rice');
  const [cart, setCart] = useState([
    { id:'m01', name:'Chicken Mentai Bowl', price:58_000, qty:2, emoji:'🍱' },
    { id:'m13', name:'Iced Matcha Latte', price:27_000, qty:1, emoji:'🍵' },
  ]);
  const [selectedTable, setSelectedTable] = useState(3);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState('qris');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const inCat = menuItems.filter(m => m.cat === activeCat);
    if (!search) return inCat;
    return inCat.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [activeCat, search]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id===item.id ? { ...i, qty:i.qty+1 } : i);
      return [...prev, { id:item.id, name:item.name, price:item.price, qty:1, emoji:item.emoji }];
    });
  };
  const updateQty = (id, delta) => setCart(prev => prev.flatMap(i => i.id===id ? (i.qty+delta <= 0 ? [] : [{ ...i, qty:i.qty+delta }]) : [i]));
  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((s,i) => s + i.price*i.qty, 0);
  const discountAmt = subtotal * (discount/100);
  const tax = (subtotal - discountAmt) * 0.1;
  const total = subtotal - discountAmt + tax;

  const paymentMethods = [
    { id:'qris', label:'QRIS',   icon:QrCode },
    { id:'card', label:'Card',   icon:CreditCard },
    { id:'cash', label:'Cash',   icon:Banknote },
    { id:'ewal', label:'E-Wallet', icon:Wallet },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 h-[calc(100vh-9rem)]">
      {/* LEFT — Menu */}
      <Card className="flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#EEF2F7] flex items-center gap-3">
          {/* Table picker */}
          <button className="flex items-center gap-2 h-11 px-3.5 rounded-xl bg-[#DCEAF5] text-[#3A6588] hover:bg-[#C9DEF0] transition-colors">
            <Hash size={15} strokeWidth={2.4}/>
            <span className="text-[14px] font-bold">Table {selectedTable}</span>
            <ChevronDown size={14} strokeWidth={2.4}/>
          </button>
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search menu…"
              className="w-full h-11 pl-9 pr-3 rounded-xl bg-[#F6F9FC] text-[14px] border border-transparent focus:outline-none focus:border-[#4A7FA7] focus:bg-white transition-all"/>
          </div>
          <Badge tone="success" dot size="lg">Online · Synced</Badge>
        </div>

        {/* Category pills */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button key={cat.id} onClick={()=>setActiveCat(cat.id)}
              className={`shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-xl text-[13.5px] font-semibold transition-all ${
                activeCat===cat.id
                  ? 'bg-[#1E293B] text-white shadow-sm'
                  : 'bg-[#F6F9FC] text-[#64748B] hover:bg-[#EEF2F7] hover:text-[#1E293B]'
              }`}>
              <span className="text-base">{cat.emoji}</span>
              {cat.label}
              <span className={`text-[10.5px] px-1.5 py-0.5 rounded-md font-bold tabular-nums ${
                activeCat===cat.id ? 'bg-white/15 text-white' : 'bg-white text-[#94A3B8]'
              }`}>{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(item => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <button key={item.id} onClick={()=>addToCart(item)}
                  className="relative group bg-white border border-[#E2E8F0] rounded-2xl p-3 text-left hover:border-[#4A7FA7] hover:shadow-md transition-all duration-150 active:scale-[0.98]">
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-[#F6F9FC] to-[#DCEAF5] flex items-center justify-center text-5xl mb-3">
                    {item.emoji}
                  </div>
                  {item.stock==='low' && (
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
                      <Plus size={14} strokeWidth={2.6}/>
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
        {/* Header */}
        <div className="p-4 border-b border-[#EEF2F7]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Current Order</p>
              <p className="text-[16px] font-bold text-[#1E293B] tabular-nums" style={{ fontFamily:'Plus Jakarta Sans' }}>ORD-1052</p>
            </div>
            <Badge tone="primary" dot size="lg">Table {selectedTable}</Badge>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[12px] text-[#64748B]">
            <User size={12}/> <span>Walk-in customer</span>
            <Dot size={12} className="text-[#CBD5E1]"/>
            <Clock size={12}/> <span className="tabular-nums">11:48 WIB</span>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-[#F6F9FC] flex items-center justify-center mb-3">
                <ShoppingCart size={28} className="text-[#CBD5E1]"/>
              </div>
              <p className="text-[14px] font-semibold text-[#1E293B]">Empty order</p>
              <p className="text-[12.5px] text-[#94A3B8] mt-1">Tap any menu item to start</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#F6F9FC] to-[#DCEAF5] flex items-center justify-center text-2xl shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1E293B] leading-tight">{item.name}</p>
                    <p className="text-[11.5px] text-[#94A3B8] tabular-nums mt-0.5">{fmtIDR(item.price)}</p>
                    <div className="mt-1.5 inline-flex items-center gap-2 bg-[#F1F5F9] rounded-lg p-0.5">
                      <button onClick={()=>updateQty(item.id,-1)} className="w-6 h-6 rounded-md bg-white hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B]">
                        <Minus size={12} strokeWidth={2.6}/>
                      </button>
                      <span className="text-[12.5px] font-bold tabular-nums min-w-[16px] text-center">{item.qty}</span>
                      <button onClick={()=>updateQty(item.id,1)} className="w-6 h-6 rounded-md bg-white hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B]">
                        <Plus size={12} strokeWidth={2.6}/>
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-[#1E293B] tabular-nums">{fmtIDRShort(item.price*item.qty)}</p>
                    <button onClick={()=>removeItem(item.id)} className="mt-1 text-[#CBD5E1] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary + payment + CTA */}
        <div className="border-t border-[#EEF2F7] p-4 space-y-3">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <Tag size={13} className="text-[#94A3B8]"/>
            <span className="text-[12.5px] text-[#64748B] flex-1">Discount</span>
            <div className="flex items-center gap-1">
              {[0,10,15].map(d => (
                <button key={d} onClick={()=>setDiscount(d)}
                  className={`h-7 px-2.5 rounded-md text-[11.5px] font-bold tabular-nums transition-colors ${
                    discount===d ? 'bg-[#1E293B] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}>
                  {d===0 ? 'None' : `${d}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Totals */}
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
              <span className="text-[22px] font-bold tabular-nums text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>
                {fmtIDR(Math.round(total))}
              </span>
            </div>
          </div>

          {/* Payment method tiles */}
          <div>
            <p className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Payment method</p>
            <div className="grid grid-cols-4 gap-1.5">
              {paymentMethods.map(p => {
                const Icon = p.icon;
                const active = payment === p.id;
                return (
                  <button key={p.id} onClick={()=>setPayment(p.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      active
                        ? 'bg-[#DCEAF5] text-[#3A6588] ring-2 ring-[#4A7FA7]'
                        : 'bg-[#F6F9FC] text-[#64748B] hover:bg-[#EEF2F7]'
                    }`}>
                    <Icon size={16} strokeWidth={2.2}/>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <Button variant="primary" size="xl" className="w-full" iconRight={ArrowRight}>
            Charge {fmtIDR(Math.round(total))}
          </Button>
        </div>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------
   ORDERS LIST
   ------------------------------------------------------------------------- */
const orderStatusMeta = {
  pending: { tone:'neutral', label:'Pending' },
  cooking: { tone:'warning', label:'Cooking' },
  done:    { tone:'primary', label:'Ready' },
  paid:    { tone:'success', label:'Paid' },
};
const paymentMeta = {
  qris: { label:'QRIS', bg:'bg-[#DCEAF5] text-[#3A6588]' },
  card: { label:'Card', bg:'bg-[#F1F5F9] text-[#475569]' },
  cash: { label:'Cash', bg:'bg-[#DCFCE7] text-[#15803D]' },
};

const OrdersList = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const counts = useMemo(() => ({
    all: allOrders.length,
    pending: allOrders.filter(o=>o.status==='pending').length,
    cooking: allOrders.filter(o=>o.status==='cooking').length,
    done: allOrders.filter(o=>o.status==='done').length,
    paid: allOrders.filter(o=>o.status==='paid').length,
  }), []);

  const filtered = useMemo(() => {
    let res = filter==='all' ? allOrders : allOrders.filter(o => o.status===filter);
    if (search) res = res.filter(o => o.id.toLowerCase().includes(search.toLowerCase()) || String(o.table).includes(search));
    return res;
  }, [filter, search]);

  const totalRevenue = allOrders.filter(o=>o.status==='paid').reduce((s,o)=>s+o.total, 0);

  return (
    <div className="space-y-4">
      {/* Stat chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <StatChip label="Today's revenue"  value={fmtIDRShort(totalRevenue)} icon={TrendingUp} tone="primary" />
        <StatChip label="Total orders"     value={counts.all}        icon={ReceiptText} />
        <StatChip label="Pending"          value={counts.pending}    icon={Clock}      tone="neutral" />
        <StatChip label="Cooking"          value={counts.cooking}    icon={Flame}      tone="warning" />
        <StatChip label="Avg order"        value={fmtIDRShort(Math.round(totalRevenue/counts.paid))} icon={Hash} />
      </div>

      {/* Filter bar */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-[#EEF2F7] flex-wrap">
          <div className="flex items-center gap-0.5 bg-[#F6F9FC] rounded-lg p-0.5">
            {[
              { id:'all',     label:'All',     count:counts.all },
              { id:'pending', label:'Pending', count:counts.pending },
              { id:'cooking', label:'Cooking', count:counts.cooking },
              { id:'done',    label:'Ready',   count:counts.done },
              { id:'paid',    label:'Paid',    count:counts.paid },
            ].map(t => (
              <button key={t.id} onClick={()=>setFilter(t.id)}
                className={`px-3 h-8 rounded-md text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5 ${
                  filter===t.id ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
                }`}>
                {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tabular-nums ${
                  filter===t.id ? 'bg-[#DCEAF5] text-[#3A6588]' : 'bg-[#E2E8F0] text-[#64748B]'
                }`}>{t.count}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search ID or table…"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#F6F9FC] text-[12.5px] border border-transparent focus:outline-none focus:border-[#4A7FA7] focus:bg-white transition-all"/>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={Calendar}>Today</Button>
            <Button variant="ghost" size="sm" icon={SlidersHorizontal}>Filters</Button>
            <Button variant="secondary" size="sm" icon={Download}>Export</Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC]">
                <th className="text-left px-5 py-2.5 w-8"></th>
                <th className="text-left px-3 py-2.5">
                  <button className="inline-flex items-center gap-1 hover:text-[#1E293B] transition-colors">Order ID <ArrowUpDown size={11}/></button>
                </th>
                <th className="text-left px-3 py-2.5">Table</th>
                <th className="text-left px-3 py-2.5">Items</th>
                <th className="text-left px-3 py-2.5">Status</th>
                <th className="text-left px-3 py-2.5">Payment</th>
                <th className="text-right px-3 py-2.5">
                  <button className="inline-flex items-center gap-1 hover:text-[#1E293B] transition-colors">Total <ArrowUpDown size={11}/></button>
                </th>
                <th className="text-right px-3 py-2.5">Time</th>
                <th className="text-right px-5 py-2.5 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, idx) => {
                const status = orderStatusMeta[o.status];
                const pay = paymentMeta[o.payment];
                const isExpanded = expandedId === o.id;
                return (
                  <React.Fragment key={o.id}>
                    <tr onClick={()=>setExpandedId(isExpanded ? null : o.id)}
                      className={`text-[13px] hover:bg-[#F8FAFC] transition-colors cursor-pointer border-t border-[#F1F5F9] ${isExpanded ? 'bg-[#F8FAFC]' : ''}`}>
                      <td className="px-5 py-3.5">
                        <ChevronDown size={14} className={`text-[#94A3B8] transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                      </td>
                      <td className="px-3 py-3.5 font-semibold tabular-nums text-[#1E293B]">{o.id}</td>
                      <td className="px-3 py-3.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#F6F9FC] text-[12px] font-bold text-[#1E293B] tabular-nums">{o.table}</span>
                      </td>
                      <td className="px-3 py-3.5 text-[#64748B] max-w-[280px]">
                        <span className="truncate block">{o.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</span>
                      </td>
                      <td className="px-3 py-3.5"><Badge tone={status.tone} dot>{status.label}</Badge></td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-bold ${pay.bg}`}>{pay.label}</span>
                      </td>
                      <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-[#1E293B]">{fmtIDR(o.total)}</td>
                      <td className="px-3 py-3.5 text-right text-[#94A3B8] tabular-nums">{o.time}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button className="w-7 h-7 rounded-md hover:bg-[#E2E8F0] flex items-center justify-center text-[#94A3B8] ml-auto" onClick={e=>e.stopPropagation()}>
                          <MoreHorizontal size={14}/>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#F8FAFC] border-t border-[#F1F5F9]">
                        <td colSpan={9} className="px-5 py-4">
                          <div className="flex items-start gap-6 flex-wrap">
                            {/* Items detail */}
                            <div className="flex-1 min-w-[240px]">
                              <p className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Items</p>
                              <div className="space-y-1">
                                {o.items.map((it, i) => (
                                  <div key={i} className="flex justify-between text-[12.5px]">
                                    <span className="text-[#1E293B] font-medium">{it.name} <span className="text-[#94A3B8]">×{it.qty}</span></span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Meta */}
                            <div className="flex-1 min-w-[180px]">
                              <p className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Details</p>
                              <div className="space-y-1 text-[12.5px]">
                                <div className="flex justify-between"><span className="text-[#94A3B8]">Date</span><span className="text-[#1E293B] tabular-nums">{o.date} · {o.time}</span></div>
                                <div className="flex justify-between"><span className="text-[#94A3B8]">Payment</span><span className="text-[#1E293B]">{pay.label}</span></div>
                                <div className="flex justify-between"><span className="text-[#94A3B8]">Total</span><span className="text-[#1E293B] font-semibold tabular-nums">{fmtIDR(o.total)}</span></div>
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Button variant="secondary" size="sm" icon={Printer}>Reprint</Button>
                              <Button variant="secondary" size="sm" icon={Eye}>View receipt</Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#EEF2F7] text-[12px] text-[#64748B]">
          <span>Showing <span className="font-semibold text-[#1E293B] tabular-nums">{filtered.length}</span> of <span className="font-semibold text-[#1E293B] tabular-nums">{counts.all}</span> orders</span>
          <div className="flex items-center gap-1">
            <button className="h-7 px-2.5 rounded-md hover:bg-[#F1F5F9] text-[12px] font-medium">Previous</button>
            <button className="h-7 w-7 rounded-md bg-[#1E293B] text-white text-[12px] font-semibold tabular-nums">1</button>
            <button className="h-7 w-7 rounded-md hover:bg-[#F1F5F9] text-[12px] font-medium tabular-nums">2</button>
            <button className="h-7 w-7 rounded-md hover:bg-[#F1F5F9] text-[12px] font-medium tabular-nums">3</button>
            <button className="h-7 px-2.5 rounded-md hover:bg-[#F1F5F9] text-[12px] font-medium">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const StatChip = ({ label, value, icon:Icon, tone='neutral' }) => {
  const tones = {
    neutral:'bg-white text-[#1E293B] border-[#E2E8F0]',
    primary:'bg-[#DCEAF5] text-[#3A6588] border-transparent',
    warning:'bg-[#FEF3C7] text-[#B45309] border-transparent',
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${tones[tone]}`} style={{ boxShadow: tokens.shadow.sm }}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
        tone==='primary' ? 'bg-white/60' : tone==='warning' ? 'bg-white/60' : 'bg-[#F6F9FC]'
      }`}>
        <Icon size={16} strokeWidth={2.2} className={tone==='neutral' ? 'text-[#64748B]' : ''}/>
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-[16px] font-bold tabular-nums leading-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>{value}</p>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------
   KITCHEN DISPLAY
   ------------------------------------------------------------------------- */
const KitchenDisplay = () => {
  const [orders, setOrders] = useState(allOrders.filter(o => o.status==='pending' || o.status==='cooking'));
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(()=>setTick(x=>x+1), 1000); return ()=>clearInterval(t); }, []);

  const startCooking = (id) => setOrders(prev => prev.map(o => o.id===id ? { ...o, status:'cooking', elapsed:0 } : o));
  const markDone = (id) => setOrders(prev => prev.filter(o => o.id !== id));

  const fmtElapsed = (sec) => {
    const m = Math.floor(sec/60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2,'0')}`;
  };

  const urgencyOf = (o) => {
    if (o.status==='pending') return 'fresh';
    if (o.elapsed < 5*60) return 'normal';
    if (o.elapsed < 10*60) return 'warning';
    return 'urgent';
  };

  const urgencyStyles = {
    fresh:   { ring:'ring-2 ring-[#DCEAF5]',          accent:'bg-[#4A7FA7]', tone:'primary', label:'New order' },
    normal:  { ring:'ring-1 ring-[#E2E8F0]',          accent:'bg-[#22C55E]', tone:'success', label:'Cooking' },
    warning: { ring:'ring-2 ring-[#FCD34D]',          accent:'bg-[#F59E0B]', tone:'warning', label:'5+ min' },
    urgent:  { ring:'ring-2 ring-[#FCA5A5] animate-pulse', accent:'bg-[#EF4444]', tone:'danger', label:'URGENT' },
  };

  const counts = {
    pending: orders.filter(o=>o.status==='pending').length,
    cooking: orders.filter(o=>o.status==='cooking').length,
    urgent: orders.filter(o => urgencyOf(o)==='urgent').length,
  };

  // Update elapsed time
  const ordersLive = useMemo(() => orders.map(o => ({ ...o, elapsed: (o.elapsed || 0) + (o.status==='cooking' ? tick : 0) })), [orders, tick]);

  return (
    <div className="space-y-4">
      {/* Kitchen header — bigger typography (+20%) */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[#1E293B] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <ChefHat size={22} className="text-white"/>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wider">Kitchen Display</p>
            <p className="text-[24px] font-bold tracking-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
              {ordersLive.length} orders in queue
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <KitchenStat label="Pending" value={counts.pending} accent="#DCEAF5"/>
          <KitchenStat label="Cooking" value={counts.cooking} accent="#22C55E"/>
          <KitchenStat label="Urgent"  value={counts.urgent}  accent="#EF4444"/>
          <div className="h-10 w-px bg-white/15"/>
          <div className="flex items-center gap-2 text-white/80">
            <RefreshCw size={14} className="animate-spin" style={{ animationDuration:'4s' }}/>
            <span className="text-[12px] font-medium">Auto-refresh 15s</span>
          </div>
          <button className="h-10 w-10 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors">
            <Maximize2 size={16}/>
          </button>
        </div>
      </div>

      {/* Order cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {ordersLive.map(o => {
          const urgency = urgencyOf(o);
          const style = urgencyStyles[urgency];
          return (
            <div key={o.id} className={`bg-white rounded-2xl overflow-hidden ${style.ring}`} style={{ boxShadow: tokens.shadow.md }}>
              <div className={`h-1 ${style.accent}`}/>
              {/* Header */}
              <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[20px] font-bold text-[#1E293B] tabular-nums" style={{ fontFamily:'Plus Jakarta Sans' }}>
                      Table {o.table}
                    </p>
                    {urgency==='urgent' && <Flame size={18} className="text-[#EF4444]"/>}
                  </div>
                  <p className="text-[12.5px] text-[#94A3B8] font-semibold tabular-nums mt-0.5">{o.id} · {o.time}</p>
                </div>
                <Badge tone={style.tone} dot size="lg">{style.label}</Badge>
              </div>

              {/* Items — bigger text */}
              <div className="px-5 py-3 space-y-1.5 border-y border-[#F1F5F9] bg-[#FAFBFC]">
                {o.items.map((it, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-md bg-[#1E293B] text-white text-[13px] font-bold tabular-nums">
                      ×{it.qty}
                    </span>
                    <p className="text-[15px] font-semibold text-[#1E293B] leading-tight pt-0.5">{it.name}</p>
                  </div>
                ))}
              </div>

              {/* Timer + action */}
              <div className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    urgency==='urgent' ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                    urgency==='warning' ? 'bg-[#FEF3C7] text-[#B45309]' :
                    urgency==='fresh' ? 'bg-[#DCEAF5] text-[#3A6588]' :
                    'bg-[#DCFCE7] text-[#15803D]'
                  }`}>
                    <Timer size={16} strokeWidth={2.4}/>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Elapsed</p>
                    <p className="text-[17px] font-bold tabular-nums text-[#1E293B] leading-none mt-0.5" style={{ fontFamily:'Plus Jakarta Sans' }}>
                      {o.status==='pending' ? '—' : fmtElapsed(o.elapsed)}
                    </p>
                  </div>
                </div>
                {o.status==='pending' ? (
                  <Button variant="primary" size="lg" icon={ChefHatIcon} onClick={()=>startCooking(o.id)}>
                    Start
                  </Button>
                ) : (
                  <Button variant="success" size="lg" icon={CheckCircle2} onClick={()=>markDone(o.id)}>
                    Done
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {ordersLive.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#DCFCE7] flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-[#15803D]"/>
          </div>
          <p className="text-[18px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>All caught up.</p>
          <p className="text-[13px] text-[#64748B] mt-1">Queue is empty — new orders will appear here automatically.</p>
        </Card>
      )}
    </div>
  );
};

const KitchenStat = ({ label, value, accent }) => (
  <div className="flex items-center gap-2.5">
    <span className="w-2 h-2 rounded-full" style={{ background: accent }}/>
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <p className="text-[18px] font-bold tabular-nums leading-none" style={{ fontFamily:'Plus Jakarta Sans' }}>{value}</p>
    </div>
  </div>
);

/* -------------------------------------------------------------------------
   SHELL — LOGO, SIDEBAR, TOPBAR
   ------------------------------------------------------------------------- */
const Logo = ({ collapsed }) => (
  <div className="flex items-center gap-2.5">
    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center shrink-0" style={{ boxShadow:'0 4px 12px -2px rgb(74 127 167 / 0.35)' }}>
      <div className="absolute inset-0.5 rounded-[10px] border border-white/15"/>
      <span className="text-white font-bold text-[15px]" style={{ fontFamily:'Plus Jakarta Sans' }}>L</span>
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#22C55E] border-2 border-white"/>
    </div>
    {!collapsed && (
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-tight text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>
          Legacya<span className="text-[#4A7FA7]">Pos</span>
        </span>
        <span className="text-[10px] text-[#94A3B8] mt-0.5 tracking-wider font-medium uppercase">Restaurant OS</span>
      </div>
    )}
  </div>
);

const Sidebar = ({ activePage, setActivePage, collapsed, setCollapsed }) => (
  <aside className="relative bg-white border-r border-[#E2E8F0] flex flex-col transition-all duration-200 ease-out shrink-0" style={{ width: collapsed ? 76 : 248 }}>
    <div className="h-16 flex items-center px-4 border-b border-[#EEF2F7]"><Logo collapsed={collapsed}/></div>
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {navGroups.map(group => (
        <div key={group.label}>
          {!collapsed && <p className="px-3 mb-1.5 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">{group.label}</p>}
          <div className="space-y-0.5">
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button key={item.id} onClick={()=>setActivePage(item.id)} title={collapsed?item.label:undefined}
                  className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-150 ${
                    isActive ? 'bg-[#DCEAF5] text-[#3A6588]' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                  }`}>
                  {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[#4A7FA7]"/>}
                  <Icon size={18} strokeWidth={isActive?2.4:2} className="shrink-0"/>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 h-[18px] min-w-[18px] inline-flex items-center justify-center rounded-md bg-[#4A7FA7] text-white text-[10px] font-bold tabular-nums">{item.badge}</span>
                      )}
                      {item.alert && <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"/>}
                    </>
                  )}
                  {collapsed && (item.badge || item.alert) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] border-2 border-white"/>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
    <div className="p-3 border-t border-[#EEF2F7]">
      <div className={`flex items-center gap-2.5 rounded-xl p-2 hover:bg-[#F8FAFC] transition-colors cursor-pointer ${collapsed?'justify-center':''}`}>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center text-white font-semibold text-[13px] shrink-0">AR</div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#1E293B] truncate">Arif Rahman</p>
            <p className="text-[11px] text-[#94A3B8] truncate">Owner · Cabang Kemang</p>
          </div>
        )}
      </div>
    </div>
    <button onClick={()=>setCollapsed(!collapsed)}
      className="absolute -right-3 top-[58px] w-6 h-6 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center hover:border-[#4A7FA7] hover:text-[#4A7FA7] text-[#64748B] transition-colors z-10"
      style={{ boxShadow: tokens.shadow.sm }}>
      {collapsed ? <ChevronsRight size={12} strokeWidth={2.5}/> : <ChevronsLeft size={12} strokeWidth={2.5}/>}
    </button>
  </aside>
);

const pageTitles = {
  dashboard:     { breadcrumb:'Operations', title:'Dashboard',       meta:'Owner overview' },
  pos:           { breadcrumb:'Operations', title:'POS Cashier',     meta:'Counter mode' },
  orders:        { breadcrumb:'Operations', title:'Orders',          meta:'All orders today' },
  kitchen:       { breadcrumb:'Operations', title:'Kitchen Display', meta:'Live queue · 15s refresh' },
  inventory:     { breadcrumb:'Manage',     title:'Inventory' },
  menu:          { breadcrumb:'Manage',     title:'Menu' },
  analytics:     { breadcrumb:'Manage',     title:'Analytics' },
  notifications: { breadcrumb:'System',     title:'Notifications' },
  settings:      { breadcrumb:'System',     title:'Settings' },
};

const Topbar = ({ activePage }) => {
  const page = pageTitles[activePage] ?? { breadcrumb:'—', title:'—' };
  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[12px] text-[#94A3B8]">
          <span>LegacyaPos</span><Dot size={14} className="text-[#CBD5E1]"/><span>{page.breadcrumb}</span>
        </div>
        <h1 className="text-[18px] font-bold text-[#1E293B] tracking-tight leading-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
          {page.title}
          {page.meta && <span className="ml-1.5 text-[12px] font-medium text-[#94A3B8]">{page.meta}</span>}
        </h1>
      </div>
      <div className="relative w-72 max-w-[35vw] hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"/>
        <input type="text" placeholder="Search…"
          className="w-full h-9 pl-9 pr-16 rounded-lg bg-[#F6F9FC] border border-transparent text-[13px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4A7FA7] focus:bg-white transition-all"/>
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 px-1.5 h-5 rounded bg-white border border-[#E2E8F0] text-[10px] font-semibold text-[#64748B]">
          <Command size={9}/> K
        </kbd>
      </div>
      <div className="flex items-center gap-1">
        <button className="relative w-9 h-9 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:text-[#1E293B] transition-colors">
          <Bell size={16} strokeWidth={2.2}/>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] border-2 border-white"/>
        </button>
        <div className="w-px h-6 bg-[#E2E8F0] mx-1"/>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center text-white font-semibold text-[12px]">AR</div>
      </div>
    </header>
  );
};

/* -------------------------------------------------------------------------
   PLACEHOLDER for routes not built yet
   ------------------------------------------------------------------------- */
const PlaceholderView = ({ page }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Card className="p-10 text-center max-w-md">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#DCEAF5] flex items-center justify-center mb-4">
        <Sparkles size={22} className="text-[#3A6588]"/>
      </div>
      <h3 className="text-[18px] font-bold text-[#1E293B] mb-1.5" style={{ fontFamily:'Plus Jakarta Sans' }}>{page.title}</h3>
      <p className="text-[13.5px] text-[#64748B] leading-relaxed mb-5">This screen ships in Phase 3. Shell & components ready.</p>
      <Button variant="soft" icon={Sparkles}>Generate this screen next</Button>
    </Card>
  </div>
);

/* -------------------------------------------------------------------------
   APP
   ------------------------------------------------------------------------- */
export default function LegacyaPos() {
  const [activePage, setActivePage] = useState('pos');  // start on POS to showcase
  const [collapsed, setCollapsed] = useState(true);     // collapsed by default for tablet feel

  useEffect(() => {
    if (document.getElementById('legacyapos-fonts')) return;
    const link = document.createElement('link');
    link.id = 'legacyapos-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);

  const renderView = () => {
    switch (activePage) {
      case 'pos':     return <POSCashier/>;
      case 'orders':  return <OrdersList/>;
      case 'kitchen': return <KitchenDisplay/>;
      default:        return <PlaceholderView page={pageTitles[activePage]}/>;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-[#1E293B] antialiased"
      style={{ background: tokens.color.bg, fontFamily:'Inter, system-ui, sans-serif' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} collapsed={collapsed} setCollapsed={setCollapsed}/>
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar activePage={activePage}/>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto px-6 py-6">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
