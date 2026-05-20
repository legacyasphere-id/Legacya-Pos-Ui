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
              <span className="tabular-nums font-medium text-
