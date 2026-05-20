import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  LayoutDashboard, ShoppingCart, ReceiptText, ChefHat,
  Package, UtensilsCrossed, BarChart3, Bell, Settings,
  Search, ChevronsLeft, ChevronsRight, Sparkles, MoreHorizontal,
  TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight,
  Plus, Command, Dot, Check, Calendar, ChevronDown,
  Flame, Clock, ArrowRight, RefreshCw, Download,
  Filter, SlidersHorizontal, Grid3X3, List, Pencil, Trash2,
  Eye, EyeOff, Star, Tag, Boxes, History, TrendingUpIcon,
  Truck, AlertCircle, ArrowUp, ArrowDown
} from 'lucide-react';

/* =========================================================================
   LEGACYAPOS — PHASE 3: Analytics · Inventory · Menu Management
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
   NAV (shared)
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
  const sizes = { sm:'h-8 px-3 text-[13px] gap-1.5', md:'h-10 px-4 text-sm gap-2', lg:'h-12 px-5 text-[15px] gap-2' };
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
      {Icon && <Icon size={size==='sm'?14:16} strokeWidth={2.2} />}
      {children}
      {IconRight && <IconRight size={size==='sm'?14:16} strokeWidth={2.2} />}
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

const Switch = ({ checked, onChange, size='md' }) => {
  const sizes = {
    sm:{ w:'w-8',  h:'h-[18px]', dot:'w-3.5 h-3.5', shift:'translate-x-[14px]' },
    md:{ w:'w-10', h:'h-[22px]', dot:'w-[18px] h-[18px]', shift:'translate-x-[18px]' },
  };
  const s = sizes[size];
  return (
    <button onClick={() => onChange(!checked)}
      className={`${s.w} ${s.h} relative rounded-full transition-colors duration-200 ${checked ? 'bg-[#22C55E]' : 'bg-[#CBD5E1]'}`}>
      <span className={`absolute top-0.5 left-0.5 ${s.dot} rounded-full bg-white shadow transition-transform duration-200 ${checked ? s.shift : ''}`}/>
    </button>
  );
};

/* =========================================================================
   ANALYTICS
   ========================================================================= */

const revenue30Days = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const isWeekend = (day % 7 === 5) || (day % 7 === 6);
  const base = isWeekend ? 5_800_000 : 3_900_000;
  const variance = (Math.sin(i*0.7) + 1) * 600_000;
  return { day: `${day}`, current: Math.round(base + variance), previous: Math.round(base*0.86 + variance*0.9) };
});

const categoryBreakdown = [
  { name:'Rice Bowl',  value:38, revenue:42_180_000, color:'#4A7FA7' },
  { name:'Sushi',      value:22, revenue:24_420_000, color:'#7AA9CC' },
  { name:'Mains',      value:25, revenue:27_750_000, color:'#A8C7DD' },
  { name:'Beverages',  value:15, revenue:16_650_000, color:'#DCEAF5' },
];

const paymentMix = [
  { method:'QRIS',     value:52, count:74, icon:'📱', color:'#4A7FA7' },
  { method:'Card',     value:28, count:40, icon:'💳', color:'#7AA9CC' },
  { method:'Cash',     value:14, count:20, icon:'💵', color:'#22C55E' },
  { method:'E-Wallet', value:6,  count:8,  icon:'👛', color:'#F59E0B' },
];

const topItemsAnalytics = [
  { name:'Chicken Mentai Bowl', cat:'Rice Bowl', sold:284, revenue:16_472_000, trend:34,  emoji:'🍱' },
  { name:'Iced Matcha Latte',   cat:'Beverages', sold:251, revenue:6_777_000,  trend:22,  emoji:'🍵' },
  { name:'Salmon Aburi',        cat:'Sushi',     sold:189, revenue:16_065_000, trend:12,  emoji:'🍣' },
  { name:'Beef Yakiniku',       cat:'Mains',     sold:142, revenue:10_224_000, trend:8,   emoji:'🥩' },
  { name:'Ramen Tonkotsu',      cat:'Mains',     sold:138, revenue:8_970_000,  trend:15,  emoji:'🍜' },
  { name:'Tom Yum Soup',        cat:'Mains',     sold:96,  revenue:4_320_000,  trend:-5,  emoji:'🍲' },
];

// Heatmap: 7 days × 14 hours (10AM-11PM)
const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const hours = Array.from({ length: 14 }, (_, i) => i + 10); // 10..23
const dayPattern = { Mon:0.7, Tue:0.65, Wed:0.7, Thu:0.8, Fri:1.0, Sat:1.15, Sun:1.05 };
const hourPattern = { 10:0.2, 11:0.5, 12:0.95, 13:0.85, 14:0.4, 15:0.3, 16:0.4, 17:0.55, 18:0.8, 19:1.2, 20:1.15, 21:0.7, 22:0.3, 23:0.15 };

const heatmapData = days.flatMap(d => hours.map(h => ({
  day: d, hour: h,
  orders: Math.round(20 * dayPattern[d] * hourPattern[h] + (Math.sin(h*0.5) * 2)),
})));
const maxHeat = Math.max(...heatmapData.map(c => c.orders));

const RevenueDeepChart = () => {
  const [range, setRange] = useState('30D');
  const total = revenue30Days.reduce((s,p)=>s+p.current,0);
  const totalPrev = revenue30Days.reduce((s,p)=>s+p.previous,0);
  const delta = ((total-totalPrev)/totalPrev)*100;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
        <div>
          <p className="text-[11.5px] font-semibold text-[#64748B] uppercase tracking-wider">Revenue trend</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <h3 className="text-[28px] font-bold text-[#1E293B] tabular-nums tracking-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
              {fmtIDR(total)}
            </h3>
            <Badge tone={delta>=0?'success':'danger'} dot>
              {delta>=0?'+':''}{delta.toFixed(1)}% vs prev period
            </Badge>
          </div>
          <p className="text-[12px] text-[#94A3B8] mt-1">Last 30 days · compared to previous 30 days</p>
        </div>
        <div className="flex items-center gap-1 bg-[#F6F9FC] rounded-lg p-0.5">
          {['7D','30D','90D','1Y'].map(r => (
            <button key={r} onClick={()=>setRange(r)}
              className={`px-3 h-8 rounded-md text-[12px] font-semibold transition-colors ${
                range===r ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}>{r}</button>
          ))}
        </div>
      </div>
      <div className="mt-5 -ml-2" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenue30Days} margin={{ top:8, right:8, left:8, bottom:0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4A7FA7" stopOpacity="0.28"/>
                <stop offset="100%" stopColor="#4A7FA7" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="day" tick={{ fontSize:10.5, fill:'#94A3B8' }} axisLine={false} tickLine={false} dy={8} interval={4}/>
            <YAxis tick={{ fontSize:10.5, fill:'#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={fmtIDRShort} width={60}/>
            <Tooltip
              cursor={{ stroke:'#CBD5E1', strokeDasharray:'3 3' }}
              contentStyle={{ borderRadius:12, border:'1px solid #E2E8F0', boxShadow: tokens.shadow.lg, fontSize:12 }}
              formatter={(v, name) => [fmtIDR(v), name==='current' ? 'This period' : 'Prev period']}
              labelFormatter={(l) => `Day ${l}`}/>
            <Area type="monotone" dataKey="previous" stroke="#CBD5E1" strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false}/>
            <Area type="monotone" dataKey="current"  stroke="#4A7FA7" strokeWidth={2.4} fill="url(#revGrad)"
              dot={false} activeDot={{ r:5, fill:'#4A7FA7', stroke:'#fff', strokeWidth:2 }}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const HourDayHeatmap = () => {
  const [hovered, setHovered] = useState(null);
  const intensity = (val) => Math.max(0.05, val / maxHeat);
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[13.5px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Order volume by hour × day</p>
          <p className="text-[11.5px] text-[#94A3B8] mt-0.5">When customers actually come in</p>
        </div>
        <Badge tone="primary" dot size="lg">Fri-Sun 7-9PM peak</Badge>
      </div>

      {/* Heatmap grid */}
      <div className="relative">
        <div className="flex">
          {/* Y-axis (days) */}
          <div className="flex flex-col gap-1 pt-6 pr-2">
            {days.map(d => (
              <div key={d} className="h-7 flex items-center justify-end text-[11px] font-semibold text-[#64748B] tabular-nums">{d}</div>
            ))}
          </div>
          {/* Grid */}
          <div className="flex-1 overflow-x-auto">
            {/* X-axis (hours) */}
            <div className="flex gap-1 mb-1">
              {hours.map(h => (
                <div key={h} className="flex-1 min-w-[28px] h-5 flex items-center justify-center text-[10px] font-semibold text-[#94A3B8] tabular-nums">
                  {h}
                </div>
              ))}
            </div>
            {/* Cells */}
            <div className="flex flex-col gap-1">
              {days.map(d => (
                <div key={d} className="flex gap-1">
                  {hours.map(h => {
                    const cell = heatmapData.find(c => c.day===d && c.hour===h);
                    const alpha = intensity(cell.orders);
                    const isHovered = hovered?.day===d && hovered?.hour===h;
                    return (
                      <div
                        key={h}
                        onMouseEnter={() => setHovered(cell)}
                        onMouseLeave={() => setHovered(null)}
                        className={`flex-1 min-w-[28px] h-7 rounded-md transition-all cursor-pointer ${isHovered ? 'ring-2 ring-[#1E293B] ring-offset-1' : ''}`}
                        style={{ background: alpha < 0.1 ? '#F6F9FC' : `rgba(74, 127, 167, ${alpha})` }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-semibold text-[#94A3B8]">Less</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(a => (
              <div key={a} className="w-5 h-3.5 rounded" style={{ background:`rgba(74, 127, 167, ${a})` }}/>
            ))}
            <span className="text-[10.5px] font-semibold text-[#94A3B8]">More</span>
          </div>
          {hovered && (
            <div className="text-[12px] text-[#1E293B] flex items-center gap-3">
              <span className="font-semibold">{hovered.day} · {hovered.hour}:00–{hovered.hour+1}:00</span>
              <span className="text-[#4A7FA7] font-bold tabular-nums">{hovered.orders} orders</span>
            </div>
          )}
        </div>
      </div>

      {/* Insight */}
      <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center shrink-0">
          <Sparkles size={13} className="text-white"/>
        </div>
        <div>
          <p className="text-[12.5px] text-[#1E293B]">
            <span className="font-semibold">Friday-Sunday 7-9 PM</span> drives 38% of weekly orders.
            Consider staff scheduling and stock pre-prep before <span className="font-semibold tabular-nums">6 PM</span>.
          </p>
        </div>
      </div>
    </Card>
  );
};

const CategoryDonut = () => (
  <Card className="p-5">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-[13.5px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>By category</p>
        <p className="text-[11.5px] text-[#94A3B8] mt-0.5">% of orders · last 30 days</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="relative w-[140px] h-[140px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={categoryBreakdown} dataKey="value" innerRadius={45} outerRadius={62} paddingAngle={2} strokeWidth={0}>
              {categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color}/>)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Orders</p>
          <p className="text-[22px] font-bold text-[#1E293B] tabular-nums leading-none mt-0.5" style={{ fontFamily:'Plus Jakarta Sans' }}>1,847</p>
        </div>
      </div>
      <div className="flex-1 space-y-1.5 min-w-0">
        {categoryBreakdown.map(c => (
          <div key={c.name} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background:c.color }}/>
            <span className="text-[12.5px] text-[#1E293B] font-medium flex-1 truncate">{c.name}</span>
            <span className="text-[12.5px] text-[#64748B] font-semibold tabular-nums">{c.value}%</span>
          </div>
        ))}
      </div>
    </div>
  </Card>
);

const PaymentMixCard = () => (
  <Card className="p-5">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-[13.5px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Payment mix</p>
        <p className="text-[11.5px] text-[#94A3B8] mt-0.5">By transaction count</p>
      </div>
    </div>
    <div className="space-y-3">
      {paymentMix.map(p => (
        <div key={p.method}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{p.icon}</span>
              <span className="text-[12.5px] font-semibold text-[#1E293B]">{p.method}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94A3B8] tabular-nums">{p.count} txn</span>
              <span className="text-[12.5px] font-bold tabular-nums text-[#1E293B]">{p.value}%</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div className="h-full rounded-full" style={{ width:`${p.value}%`, background:p.color }}/>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const TopItemsLeaderboard = () => {
  const maxRev = Math.max(...topItemsAnalytics.map(i => i.revenue));
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[13.5px] font-bold text-[#1E293B]" style={{ fontFamily:'Plus Jakarta Sans' }}>Top performers</p>
          <p className="text-[11.5px] text-[#94A3B8] mt-0.5">By revenue · last 30 days</p>
        </div>
        <Button variant="ghost" size="sm" iconRight={ArrowRight}>Full report</Button>
      </div>
      <div className="space-y-2">
        {topItemsAnalytics.map((item, i) => {
          const pct = (item.revenue / maxRev) * 100;
          return (
            <div key={item.name} className="relative px-2 py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors group cursor-pointer">
              <div className="absolute inset-y-0 left-0 rounded-lg bg-[#DCEAF5] opacity-40 transition-opacity"
                style={{ width: `${pct}%` }}/>
              <div className="relative flex items-center gap-3">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold tabular-nums ${
                  i < 3 ? 'bg-[#1E293B] text-white' : 'bg-[#F1F5F9] text-[#94A3B8]'
                }`}>{i+1}</span>
                <div className="w-9 h-9 rounded-lg bg-white border border-[#EEF2F7] flex items-center justify-center text-xl">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#1E293B] truncate">{item.name}</p>
                  <p className="text-[11px] text-[#94A3B8]">{item.cat} · <span className="tabular-nums">{item.sold} sold</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[13.5px] font-bold text-[#1E293B] tabular-nums">{fmtIDRShort(item.revenue)}</p>
                  <p className={`text-[10.5px] font-semibold tabular-nums ${item.trend>=0?'text-[#15803D]':'text-[#B91C1C]'}`}>
                    {item.trend>=0 ? <ArrowUp size={9} className="inline -mt-0.5"/> : <ArrowDown size={9} className="inline -mt-0.5"/>} {Math.abs(item.trend)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const AnalyticsView = () => (
  <div className="space-y-5">
    {/* Header */}
    <div className="flex items-end justify-between flex-wrap gap-3">
      <div>
        <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">Last 30 days · May 2026</p>
        <h2 className="text-[22px] font-bold text-[#1E293B] tracking-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
          Analytics deep-dive
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <button className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B] text-[12.5px] font-medium hover:bg-[#F6F9FC] flex items-center gap-2">
          <Calendar size={13} className="text-[#64748B]"/> Apr 20 – May 20 <ChevronDown size={13} className="text-[#94A3B8]"/>
        </button>
        <Button variant="secondary" size="md" icon={Download}>Export PDF</Button>
        <Button variant="primary" size="md" icon={Sparkles}>Ask AI</Button>
      </div>
    </div>

    {/* KPI row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard label="Total revenue"     value={fmtIDR(111_000_000)}  delta="+18.4%" deltaTone="success" sub="vs prev 30D"/>
      <KPICard label="Total orders"      value="1,847"                 delta="+12.1%" deltaTone="success" sub="61 / day avg"/>
      <KPICard label="Avg order value"   value={fmtIDR(60_100)}        delta="+5.6%"  deltaTone="success" sub="Target Rp 65K"/>
      <KPICard label="Repeat customers"  value="38%"                   delta="-2.3%"  deltaTone="danger"  sub="Of 142 unique"/>
    </div>

    {/* Revenue chart */}
    <RevenueDeepChart/>

    {/* Heatmap (signature viz) */}
    <HourDayHeatmap/>

    {/* Lower grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <CategoryDonut/>
      <PaymentMixCard/>
      <div className="lg:col-span-1"><TopItemsLeaderboard/></div>
    </div>
  </div>
);

const KPICard = ({ label, value, delta, deltaTone, sub }) => (
  <Card className="p-5">
    <p className="text-[11.5px] font-semibold text-[#64748B] uppercase tracking-wider">{label}</p>
    <p className="mt-2.5 text-[26px] font-bold text-[#1E293B] tabular-nums tracking-tight leading-none" style={{ fontFamily:'Plus Jakarta Sans' }}>
      {value}
    </p>
    <div className="mt-2 flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-0.5 text-[11.5px] font-semibold ${
        deltaTone==='success' ? 'text-[#15803D]' : 'text-[#B91C1C]'
      }`}>
        {deltaTone==='success' ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
        {delta}
      </span>
      <span className="text-[11.5px] text-[#94A3B8]">· {sub}</span>
    </div>
  </Card>
);

/* =========================================================================
   INVENTORY
   ========================================================================= */

const inventoryItems = [
  { id:'i01', name:'Burger Bun',         cat:'Bakery',   unit:'pcs', current:8,    min:30,  burnRate:24,  lastRestocked:'May 18', status:'critical' },
  { id:'i02', name:'Salmon Fillet',      cat:'Seafood',  unit:'kg',  current:2.4,  min:5,   burnRate:1.8, lastRestocked:'May 19', status:'low' },
  { id:'i03', name:'Mozzarella Cheese',  cat:'Dairy',    unit:'kg',  current:1.8,  min:3,   burnRate:0.9, lastRestocked:'May 17', status:'low' },
  { id:'i04', name:'Beef Tenderloin',    cat:'Meat',     unit:'kg',  current:6.2,  min:4,   burnRate:1.4, lastRestocked:'May 20', status:'ok' },
  { id:'i05', name:'Chicken Breast',     cat:'Meat',     unit:'kg',  current:12.8, min:6,   burnRate:2.8, lastRestocked:'May 20', status:'ok' },
  { id:'i06', name:'Sushi Rice',         cat:'Grain',    unit:'kg',  current:18,   min:10,  burnRate:3.2, lastRestocked:'May 19', status:'ok' },
  { id:'i07', name:'Matcha Powder',      cat:'Beverage', unit:'g',   current:340,  min:200, burnRate:65,  lastRestocked:'May 15', status:'ok' },
  { id:'i08', name:'Nori Sheets',        cat:'Asian',    unit:'pcs', current:32,   min:50,  burnRate:18,  lastRestocked:'May 16', status:'low' },
  { id:'i09', name:'Egg',                cat:'Dairy',    unit:'pcs', current:144,  min:60,  burnRate:32,  lastRestocked:'May 20', status:'ok' },
  { id:'i10', name:'Soy Sauce',          cat:'Sauce',    unit:'L',   current:4.8,  min:2,   burnRate:0.6, lastRestocked:'May 14', status:'ok' },
  { id:'i11', name:'Tempura Flour',      cat:'Bakery',   unit:'kg',  current:5.2,  min:3,   burnRate:0.8, lastRestocked:'May 17', status:'ok' },
  { id:'i12', name:'Lemon',              cat:'Produce',  unit:'pcs', current:18,   min:30,  burnRate:12,  lastRestocked:'May 18', status:'low' },
];

const statusMeta = {
  critical: { tone:'danger',  label:'Critical', barBg:'bg-[#EF4444]', cardBg:'bg-[#FEF2F2]', cardBorder:'border-[#FECACA]' },
  low:      { tone:'warning', label:'Low',      barBg:'bg-[#F59E0B]', cardBg:'bg-[#FFFBEB]', cardBorder:'border-[#FDE68A]' },
  ok:       { tone:'success', label:'OK',       barBg:'bg-[#22C55E]', cardBg:'',             cardBorder:'border-[#E2E8F0]' },
};

const InventoryView = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => ({
    all: inventoryItems.length,
    critical: inventoryItems.filter(i=>i.status==='critical').length,
    low: inventoryItems.filter(i=>i.status==='low').length,
    ok: inventoryItems.filter(i=>i.status==='ok').length,
  }), []);

  const filtered = useMemo(() => {
    let res = filter==='all' ? inventoryItems : inventoryItems.filter(i => i.status===filter);
    if (search) res = res.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.cat.toLowerCase().includes(search.toLowerCase()));
    return res;
  }, [filter, search]);

  return (
    <div className="space-y-4">
      {/* AI alert banner */}
      <Card className="p-4 border-l-4 border-l-[#F59E0B] flex items-start gap-3 bg-gradient-to-r from-[#FFFBEB] to-white">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-white"/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Badge tone="primary">AI prediction</Badge>
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-medium">High confidence</span>
          </div>
          <p className="text-[13.5px] font-semibold text-[#1E293B]">
            Burger Bun will run out in ~<span className="tabular-nums">8 hours</span> at current burn rate.
            <span className="text-[#64748B] font-normal"> Restock urgently or pause affected menu.</span>
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Truck}>Restock now</Button>
      </Card>

      {/* Stat chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InvStat label="Total items"  value={counts.all}      icon={Boxes}        tone="neutral"/>
        <InvStat label="Critical"     value={counts.critical} icon={AlertTriangle} tone="danger"/>
        <InvStat label="Low stock"    value={counts.low}      icon={AlertCircle}  tone="warning"/>
        <InvStat label="OK"           value={counts.ok}       icon={Check}        tone="success"/>
      </div>

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-[#EEF2F7] flex-wrap">
          <div className="flex items-center gap-0.5 bg-[#F6F9FC] rounded-lg p-0.5">
            {[
              { id:'all',      label:'All',      count:counts.all },
              { id:'critical', label:'Critical', count:counts.critical },
              { id:'low',      label:'Low',      count:counts.low },
              { id:'ok',       label:'OK',       count:counts.ok },
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
              placeholder="Search items…"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#F6F9FC] text-[12.5px] border border-transparent focus:outline-none focus:border-[#4A7FA7] focus:bg-white transition-all"/>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={History}>History</Button>
            <Button variant="secondary" size="sm" icon={Download}>Export</Button>
            <Button variant="primary" size="sm" icon={Plus}>Add item</Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC]">
                <th className="text-left px-5 py-2.5">Item</th>
                <th className="text-left px-3 py-2.5 w-[260px]">Current stock</th>
                <th className="text-right px-3 py-2.5">Min</th>
                <th className="text-right px-3 py-2.5">Burn rate</th>
                <th className="text-right px-3 py-2.5">ETA out</th>
                <th className="text-left px-3 py-2.5">Last restocked</th>
                <th className="text-left px-3 py-2.5">Status</th>
                <th className="text-right px-5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const meta = statusMeta[item.status];
                const pct = Math.min((item.current / item.min) * 100, 100);
                const etaDays = item.current / item.burnRate;
                const etaStr = etaDays < 1 ? `${Math.round(etaDays*24)}h` : `${etaDays.toFixed(1)}d`;
                return (
                  <tr key={item.id} className="text-[13px] hover:bg-[#F8FAFC] transition-colors border-t border-[#F1F5F9]">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#1E293B]">{item.name}</p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">{item.cat}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[140px]">
                          <div className="h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                            <div className={`h-full rounded-full ${meta.barBg}`} style={{ width:`${pct}%` }}/>
                          </div>
                        </div>
                        <span className="text-[13px] font-bold tabular-nums text-[#1E293B] min-w-[60px]">
                          {item.current} {item.unit}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-right text-[#64748B] tabular-nums">{item.min}</td>
                    <td className="px-3 py-3.5 text-right text-[#64748B] tabular-nums">{item.burnRate}/d</td>
                    <td className="px-3 py-3.5 text-right">
                      <span className={`tabular-nums font-semibold ${
                        item.status==='critical' ? 'text-[#B91C1C]' :
                        item.status==='low' ? 'text-[#B45309]' :
                        'text-[#1E293B]'
                      }`}>{etaStr}</span>
                    </td>
                    <td className="px-3 py-3.5 text-[#64748B] tabular-nums">{item.lastRestocked}</td>
                    <td className="px-3 py-3.5"><Badge tone={meta.tone} dot>{meta.label}</Badge></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button className={`h-8 px-3 rounded-md text-[11.5px] font-bold transition-colors ${
                          item.status==='critical' || item.status==='low'
                            ? 'bg-[#4A7FA7] text-white hover:bg-[#3A6588]'
                            : 'text-[#64748B] hover:bg-[#F1F5F9]'
                        }`}>
                          Restock
                        </button>
                        <button className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
                          <MoreHorizontal size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const InvStat = ({ label, value, icon:Icon, tone }) => {
  const styles = {
    neutral:{ bg:'bg-white', iconBg:'bg-[#F6F9FC]', iconColor:'text-[#64748B]', border:'border-[#E2E8F0]' },
    danger: { bg:'bg-[#FEF2F2]', iconBg:'bg-[#FEE2E2]', iconColor:'text-[#B91C1C]', border:'border-[#FECACA]' },
    warning:{ bg:'bg-[#FFFBEB]', iconBg:'bg-[#FEF3C7]', iconColor:'text-[#B45309]', border:'border-[#FDE68A]' },
    success:{ bg:'bg-[#F0FDF4]', iconBg:'bg-[#DCFCE7]', iconColor:'text-[#15803D]', border:'border-[#BBF7D0]' },
  };
  const s = styles[tone];
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${s.bg} ${s.border}`} style={{ boxShadow: tokens.shadow.sm }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
        <Icon size={17} strokeWidth={2.2} className={s.iconColor}/>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{label}</p>
        <p className="text-[20px] font-bold tabular-nums leading-none text-[#1E293B] mt-0.5" style={{ fontFamily:'Plus Jakarta Sans' }}>{value}</p>
      </div>
    </div>
  );
};

/* =========================================================================
   MENU MANAGEMENT
   ========================================================================= */

const menuCategories = [
  { id:'all', label:'All items' },
  { id:'rice', label:'Rice Bowl' },
  { id:'sushi', label:'Sushi' },
  { id:'main', label:'Mains' },
  { id:'bev', label:'Beverages' },
];

const menuItemsData = [
  { id:'m01', name:'Chicken Mentai Bowl', cat:'rice', catLabel:'Rice Bowl', price:58_000, emoji:'🍱', available:true,  rating:4.8, soldToday:38, updated:'2h ago' },
  { id:'m02', name:'Salmon Mentai Bowl',  cat:'rice', catLabel:'Rice Bowl', price:75_000, emoji:'🍱', available:true,  rating:4.7, soldToday:24, updated:'1d ago' },
  { id:'m03', name:'Beef Teriyaki Bowl',  cat:'rice', catLabel:'Rice Bowl', price:68_000, emoji:'🍚', available:true,  rating:4.6, soldToday:19, updated:'3d ago' },
  { id:'m04', name:'Karaage Bowl',        cat:'rice', catLabel:'Rice Bowl', price:52_000, emoji:'🍱', available:true,  rating:4.5, soldToday:22, updated:'1w ago' },
  { id:'m05', name:'Salmon Aburi',        cat:'sushi',catLabel:'Sushi',     price:85_000, emoji:'🍣', available:false, rating:4.9, soldToday:14, updated:'4h ago' },
  { id:'m06', name:'Tuna Nigiri',         cat:'sushi',catLabel:'Sushi',     price:72_000, emoji:'🍣', available:true,  rating:4.7, soldToday:11, updated:'2d ago' },
  { id:'m07', name:'California Roll',     cat:'sushi',catLabel:'Sushi',     price:58_000, emoji:'🍣', available:true,  rating:4.4, soldToday:9,  updated:'1w ago' },
  { id:'m08', name:'Dragon Roll',         cat:'sushi',catLabel:'Sushi',     price:95_000, emoji:'🍣', available:true,  rating:4.8, soldToday:7,  updated:'5d ago' },
  { id:'m09', name:'Beef Yakiniku',       cat:'main', catLabel:'Mains',     price:72_000, emoji:'🥩', available:true,  rating:4.7, soldToday:19, updated:'2d ago' },
  { id:'m10', name:'Chicken Katsu',       cat:'main', catLabel:'Mains',     price:58_000, emoji:'🍗', available:true,  rating:4.5, soldToday:16, updated:'1w ago' },
  { id:'m11', name:'Ramen Tonkotsu',      cat:'main', catLabel:'Mains',     price:65_000, emoji:'🍜', available:true,  rating:4.8, soldToday:21, updated:'3d ago' },
  { id:'m12', name:'Tempura Set',         cat:'main', catLabel:'Mains',     price:78_000, emoji:'🍤', available:true,  rating:4.6, soldToday:8,  updated:'2w ago' },
  { id:'m13', name:'Iced Matcha Latte',   cat:'bev',  catLabel:'Beverages', price:27_000, emoji:'🍵', available:true,  rating:4.9, soldToday:31, updated:'5d ago' },
  { id:'m14', name:'Yuzu Lemonade',       cat:'bev',  catLabel:'Beverages', price:25_000, emoji:'🍋', available:true,  rating:4.6, soldToday:18, updated:'1w ago' },
  { id:'m15', name:'Ocha',                cat:'bev',  catLabel:'Beverages', price:12_000, emoji:'🍶', available:true,  rating:4.3, soldToday:42, updated:'1mo ago' },
  { id:'m16', name:'Sparkling Water',     cat:'bev',  catLabel:'Beverages', price:18_000, emoji:'💧', available:false, rating:4.2, soldToday:9,  updated:'2w ago' },
];

const MenuView = () => {
  const [items, setItems] = useState(menuItemsData);
  const [activeCat, setActiveCat] = useState('all');
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');

  const toggleAvail = (id) => setItems(prev => prev.map(i => i.id===id ? { ...i, available:!i.available } : i));

  const filtered = useMemo(() => {
    let res = activeCat==='all' ? items : items.filter(i => i.cat===activeCat);
    if (search) res = res.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    return res;
  }, [items, activeCat, search]);

  const totalItems = items.length;
  const activeItems = items.filter(i=>i.available).length;
  const avgPrice = Math.round(items.reduce((s,i)=>s+i.price,0) / items.length);
  const topSeller = [...items].sort((a,b)=>b.soldToday-a.soldToday)[0];

  return (
    <div className="space-y-4">
      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MenuStat label="Total menu items" value={totalItems} sub={`${activeItems} available`} icon={UtensilsCrossed}/>
        <MenuStat label="Categories"       value="4"          sub="Rice, Sushi, Main, Bev" icon={Tag}/>
        <MenuStat label="Avg price"        value={fmtIDRShort(avgPrice)} sub="Range Rp 12–95K" icon={TrendingUp}/>
        <MenuStat label="Top seller today" value={topSeller.name} sub={`${topSeller.soldToday} sold · ⭐ ${topSeller.rating}`} icon={Star} valueClass="text-[14px] leading-tight"/>
      </div>

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-[#EEF2F7] flex-wrap">
          {/* Category pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {menuCategories.map(cat => (
              <button key={cat.id} onClick={()=>setActiveCat(cat.id)}
                className={`shrink-0 h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors ${
                  activeCat===cat.id ? 'bg-[#1E293B] text-white' : 'bg-[#F6F9FC] text-[#64748B] hover:bg-[#EEF2F7] hover:text-[#1E293B]'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search menu…"
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-[#F6F9FC] text-[12.5px] border border-transparent focus:outline-none focus:border-[#4A7FA7] focus:bg-white transition-all"/>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-[#F6F9FC] rounded-lg p-0.5">
              <button onClick={()=>setView('grid')}
                className={`w-8 h-7 rounded-md flex items-center justify-center transition-colors ${
                  view==='grid' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#94A3B8] hover:text-[#1E293B]'
                }`}><Grid3X3 size={14} strokeWidth={2.2}/></button>
              <button onClick={()=>setView('list')}
                className={`w-8 h-7 rounded-md flex items-center justify-center transition-colors ${
                  view==='list' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#94A3B8] hover:text-[#1E293B]'
                }`}><List size={14} strokeWidth={2.2}/></button>
            </div>
            <Button variant="primary" size="sm" icon={Plus}>Add menu</Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(item => (
                <div key={item.id} className={`relative group bg-white border rounded-2xl p-3 transition-all hover:shadow-md ${
                  item.available ? 'border-[#E2E8F0] hover:border-[#4A7FA7]' : 'border-[#E2E8F0] opacity-60'
                }`}>
                  {/* Image area */}
                  <div className="relative aspect-square rounded-xl bg-gradient-to-br from-[#F6F9FC] to-[#DCEAF5] flex items-center justify-center text-5xl mb-3">
                    {item.emoji}
                    {!item.available && (
                      <div className="absolute inset-0 bg-white/40 rounded-xl flex items-center justify-center">
                        <Badge tone="danger" dot>Unavailable</Badge>
                      </div>
                    )}
                    {/* Hover actions */}
                    <div className="absolute inset-x-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex-1 h-7 rounded-md bg-white/95 backdrop-blur text-[#1E293B] text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-white">
                        <Pencil size={11}/> Edit
                      </button>
                      <button className="w-7 h-7 rounded-md bg-white/95 backdrop-blur text-[#EF4444] flex items-center justify-center hover:bg-white">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[12.5px] font-semibold text-[#1E293B] line-clamp-2 leading-snug flex-1 min-h-[34px]">{item.name}</p>
                    <Switch checked={item.available} onChange={()=>toggleAvail(item.id)} size="sm"/>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-[#3A6588] tabular-nums">{fmtIDRShort(item.price)}</p>
                    <div className="flex items-center gap-1 text-[10.5px] text-[#94A3B8]">
                      <Star size={10} className="fill-[#F59E0B] text-[#F59E0B]"/>
                      <span className="font-semibold tabular-nums">{item.rating}</span>
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-[#F1F5F9] flex items-center justify-between text-[10.5px] text-[#94A3B8]">
                    <span className="tabular-nums">{item.soldToday} sold today</span>
                    <span>{item.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  <th className="text-left py-2.5">Item</th>
                  <th className="text-left py-2.5">Category</th>
                  <th className="text-right py-2.5">Price</th>
                  <th className="text-right py-2.5">Sold today</th>
                  <th className="text-right py-2.5">Rating</th>
                  <th className="text-center py-2.5">Available</th>
                  <th className="text-right py-2.5">Updated</th>
                  <th className="text-right py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="text-[13px] hover:bg-[#F8FAFC] transition-colors border-t border-[#F1F5F9]">
                    <td className="py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F6F9FC] to-[#DCEAF5] flex items-center justify-center text-xl">
                        {item.emoji}
                      </div>
                      <span className="font-semibold text-[#1E293B]">{item.name}</span>
                    </td>
                    <td className="py-3 text-[#64748B]">{item.catLabel}</td>
                    <td className="py-3 text-right font-bold tabular-nums text-[#1E293B]">{fmtIDR(item.price)}</td>
                    <td className="py-3 text-right tabular-nums text-[#64748B]">{item.soldToday}</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[12.5px]">
                        <Star size={11} className="fill-[#F59E0B] text-[#F59E0B]"/>
                        <span className="font-semibold tabular-nums">{item.rating}</span>
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-center"><Switch checked={item.available} onChange={()=>toggleAvail(item.id)}/></div>
                    </td>
                    <td className="py-3 text-right text-[#94A3B8] text-[12px]">{item.updated}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"><Pencil size={13}/></button>
                        <button className="w-7 h-7 rounded-md hover:bg-[#FEE2E2] flex items-center justify-center text-[#94A3B8] hover:text-[#EF4444] transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

const MenuStat = ({ label, value, sub, icon:Icon, valueClass='' }) => (
  <Card className="p-4 flex items-center gap-3">
    <div className="w-11 h-11 rounded-xl bg-[#DCEAF5] flex items-center justify-center shrink-0">
      <Icon size={18} className="text-[#3A6588]" strokeWidth={2.2}/>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10.5px] font-semibold text-[#64748B] uppercase tracking-wider">{label}</p>
      <p className={`text-[18px] font-bold text-[#1E293B] tabular-nums leading-tight truncate ${valueClass}`} style={{ fontFamily:'Plus Jakarta Sans' }}>{value}</p>
      <p className="text-[10.5px] text-[#94A3B8] truncate">{sub}</p>
    </div>
  </Card>
);

/* =========================================================================
   SHELL
   ========================================================================= */
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
                      {item.badge && <span className="px-1.5 h-[18px] min-w-[18px] inline-flex items-center justify-center rounded-md bg-[#4A7FA7] text-white text-[10px] font-bold tabular-nums">{item.badge}</span>}
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
  dashboard:     { breadcrumb:'Operations', title:'Dashboard' },
  pos:           { breadcrumb:'Operations', title:'POS Cashier' },
  orders:        { breadcrumb:'Operations', title:'Orders' },
  kitchen:       { breadcrumb:'Operations', title:'Kitchen Display' },
  inventory:     { breadcrumb:'Manage',     title:'Inventory',  meta:'Stock & alerts' },
  menu:          { breadcrumb:'Manage',     title:'Menu',       meta:'Catalog management' },
  analytics:     { breadcrumb:'Manage',     title:'Analytics',  meta:'Deep performance review' },
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

const PlaceholderView = ({ page }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Card className="p-10 text-center max-w-md">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#DCEAF5] flex items-center justify-center mb-4">
        <Sparkles size={22} className="text-[#3A6588]"/>
      </div>
      <h3 className="text-[18px] font-bold text-[#1E293B] mb-1.5" style={{ fontFamily:'Plus Jakarta Sans' }}>{page.title}</h3>
      <p className="text-[13.5px] text-[#64748B] leading-relaxed mb-5">Built in an earlier phase. Switch to Analytics, Inventory, or Menu to see Phase 3.</p>
    </Card>
  </div>
);

/* =========================================================================
   APP
   ========================================================================= */
export default function LegacyaPos() {
  const [activePage, setActivePage] = useState('analytics');
  const [collapsed, setCollapsed] = useState(false);

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
      case 'analytics': return <AnalyticsView/>;
      case 'inventory': return <InventoryView/>;
      case 'menu':      return <MenuView/>;
      default:          return <PlaceholderView page={pageTitles[activePage]}/>;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-[#1E293B] antialiased"
      style={{ background: tokens.color.bg, fontFamily:'Inter, system-ui, sans-serif' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} collapsed={collapsed} setCollapsed={setCollapsed}/>
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar activePage={activePage}/>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1500px] mx-auto px-6 py-6">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
