import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight,
  Calendar, ChevronDown, Flame, Clock, ArrowRight, RefreshCw,
  Download, MoreHorizontal,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { tokens } from '../data/tokens';
import { fmtIDR, fmtIDRShort } from '../utils/formatCurrency';

/* ── Mock data ── */
const revenueSeries = [
  { day: 'Wed', date: 'May 14', current: 3_650_000, previous: 3_120_000 },
  { day: 'Thu', date: 'May 15', current: 3_980_000, previous: 3_410_000 },
  { day: 'Fri', date: 'May 16', current: 4_820_000, previous: 4_100_000 },
  { day: 'Sat', date: 'May 17', current: 6_240_000, previous: 5_780_000 },
  { day: 'Sun', date: 'May 18', current: 5_910_000, previous: 5_420_000 },
  { day: 'Mon', date: 'May 19', current: 3_810_000, previous: 3_240_000 },
  { day: 'Tue', date: 'May 20', current: 4_280_000, previous: 3_650_000 },
];
const sparkRevenue = [3.65, 3.98, 4.82, 6.24, 5.91, 3.81, 4.28];
const sparkOrders  = [98, 112, 138, 178, 165, 121, 142];
const sparkAOV     = [37.2, 35.5, 34.9, 35.1, 35.8, 31.5, 30.1];
const sparkPending = [3, 5, 2, 8, 6, 4, 6];
const peakHoursData = [
  { hour: '10', orders: 4 },  { hour: '11', orders: 8 },
  { hour: '12', orders: 14 }, { hour: '13', orders: 12 },
  { hour: '14', orders: 7 },  { hour: '15', orders: 5 },
  { hour: '16', orders: 8 },  { hour: '17', orders: 11 },
  { hour: '18', orders: 16 }, { hour: '19', orders: 22, peak: true },
  { hour: '20', orders: 21, peak: true }, { hour: '21', orders: 14 },
];
const topMenuItems = [
  { id: 'm01', name: 'Chicken Mentai Bowl', category: 'Rice Bowl', sold: 38, revenue: 2_204_000, trend: 34,  emoji: '🍱' },
  { id: 'm02', name: 'Salmon Aburi',        category: 'Sushi',     sold: 24, revenue: 2_040_000, trend: 12,  emoji: '🍣' },
  { id: 'm04', name: 'Beef Yakiniku',       category: 'Main',      sold: 19, revenue: 1_368_000, trend: 8,   emoji: '🥩' },
  { id: 'm05', name: 'Tom Yum Soup',        category: 'Soup',      sold: 17, revenue: 765_000,   trend: -5,  emoji: '🍲' },
  { id: 'm06', name: 'Iced Matcha Latte',   category: 'Beverage',  sold: 31, revenue: 837_000,   trend: 22,  emoji: '🍵' },
];
const inventoryAlerts = [
  { id: 'i01', name: 'Burger Bun',        unit: 'pcs', currentStock: 8,   minStock: 30, status: 'critical', burnRate: '24/day',  etaDays: 0.3 },
  { id: 'i02', name: 'Salmon Fillet',     unit: 'kg',  currentStock: 2.4, minStock: 5,  status: 'low',      burnRate: '1.8/day', etaDays: 1.3 },
  { id: 'i03', name: 'Mozzarella Cheese', unit: 'kg',  currentStock: 1.8, minStock: 3,  status: 'low',      burnRate: '0.9/day', etaDays: 2.0 },
];
const mockInsights = [
  { id: 1, category: 'Sales',     headline: 'Chicken Mentai Bowl trending up 34% this week.', detail: '127 sold vs 95 last week',         confidence: 'high', trend: 'up' },
  { id: 2, category: 'Traffic',   headline: 'Peak hours 7PM–9PM. Staff up +2 crew recommended.', detail: 'Avg 22 orders / hour at peak',  confidence: 'high', trend: 'up' },
  { id: 3, category: 'Inventory', headline: 'Burger bun may deplete in ~8 hours at current rate.', detail: 'Stock 8 units · 24/day burn', confidence: 'high', trend: 'down' },
  { id: 4, category: 'Sales',     headline: 'Weekend revenue 2.3x weekday average.',           detail: 'Sat-Sun avg Rp 6.1M vs Rp 4.1M',  confidence: 'high', trend: 'up' },
];
const recentOrders = [
  { id: 'ORD-1048', table: 7,  items: 'Chicken Mentai Bowl ×2',         status: 'cooking', time: '11:42', total: 116_000, payment: 'qris' },
  { id: 'ORD-1047', table: 12, items: 'Salmon Aburi ×3, Matcha ×2',     status: 'pending', time: '11:40', total: 309_000, payment: 'card' },
  { id: 'ORD-1046', table: 3,  items: 'Beef Yakiniku ×1',               status: 'cooking', time: '11:38', total: 72_000,  payment: 'cash' },
  { id: 'ORD-1045', table: 5,  items: 'Tom Yum ×2, Iced Matcha ×1',     status: 'done',    time: '11:32', total: 117_000, payment: 'qris' },
  { id: 'ORD-1044', table: 9,  items: 'Chicken Mentai ×1, Salmon ×1',   status: 'paid',    time: '11:28', total: 143_000, payment: 'card' },
  { id: 'ORD-1043', table: 2,  items: 'Beef Yakiniku ×2, Matcha ×2',    status: 'paid',    time: '11:24', total: 198_000, payment: 'qris' },
];

/* ── Sparkline ── */
const Sparkline = ({ data, color = '#4A7FA7', height = 32, width = 88 }) => {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const pathArea = `M0,${height} L${points.split(' ').join(' L')} L${width},${height} Z`;
  const id = useMemo(() => 'spark-' + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={pathArea} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="2.5" fill={color} />
    </svg>
  );
};

/* ── StatCard ── */
const StatCard = ({ label, value, delta, deltaTone = 'success', helper, spark, sparkColor }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] font-semibold text-[#64748B] uppercase tracking-wider">{label}</p>
        <p className="mt-2.5 text-[26px] font-bold text-[#1E293B] tabular-nums tracking-tight leading-none" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          {value}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          {delta && (
            <span className={`inline-flex items-center gap-0.5 text-[11.5px] font-semibold ${
              deltaTone === 'success' ? 'text-[#15803D]' : deltaTone === 'danger' ? 'text-[#B91C1C]' : 'text-[#64748B]'
            }`}>
              {deltaTone === 'success' ? <TrendingUp size={12} /> : deltaTone === 'danger' ? <TrendingDown size={12} /> : null}
              {delta}
            </span>
          )}
          {helper && <span className="text-[11.5px] text-[#94A3B8]">· {helper}</span>}
        </div>
      </div>
      {spark && <Sparkline data={spark} color={sparkColor || tokens.color.primary} />}
    </div>
  </Card>
);

/* ── RevenueChart ── */
const RevenueTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const cur = payload.find((p) => p.dataKey === 'current')?.value || 0;
  const prev = payload.find((p) => p.dataKey === 'previous')?.value || 0;
  const delta = ((cur - prev) / prev) * 100;
  const point = payload[0]?.payload;
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 min-w-[180px]" style={{ boxShadow: tokens.shadow.lg }}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">{point?.date}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4A7FA7]" /><span className="text-[12px] text-[#64748B]">This week</span></div>
          <span className="text-[13px] font-semibold tabular-nums">{fmtIDR(cur)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#CBD5E1]" /><span className="text-[12px] text-[#64748B]">Last week</span></div>
          <span className="text-[13px] font-semibold tabular-nums text-[#64748B]">{fmtIDR(prev)}</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
        <span className="text-[11px] text-[#94A3B8]">vs last week</span>
        <span className={`text-[11.5px] font-bold tabular-nums ${delta >= 0 ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

const RevenueChart = () => {
  const [range, setRange] = useState('7D');
  const total = revenueSeries.reduce((s, p) => s + p.current, 0);
  const totalPrev = revenueSeries.reduce((s, p) => s + p.previous, 0);
  const delta = ((total - totalPrev) / totalPrev) * 100;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-[11.5px] font-semibold text-[#64748B] uppercase tracking-wider">Revenue</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <h3 className="text-[26px] font-bold text-[#1E293B] tabular-nums tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {fmtIDR(total)}
            </h3>
            <Badge tone={delta >= 0 ? 'success' : 'danger'} dot>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs last week
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-[#F6F9FC] rounded-lg p-0.5">
          {['7D', '14D', '30D'].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-2.5 h-7 rounded-md text-[11.5px] font-semibold transition-colors ${range === r ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 -ml-2" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="curGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4A7FA7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4A7FA7" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} dy={8} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={fmtIDRShort} width={56} />
            <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#CBD5E1', strokeDasharray: '3 3' }} />
            <Area type="monotone" dataKey="previous" stroke="#CBD5E1" strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false} />
            <Area type="monotone" dataKey="current" stroke="#4A7FA7" strokeWidth={2.2} fill="url(#curGrad)"
              dot={{ r: 3, fill: '#fff', stroke: '#4A7FA7', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#4A7FA7', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

/* ── AI Insights ── */
const InsightCard = ({ insight }) => {
  const map = {
    Sales:     { tone: 'primary', icon: TrendingUp,    bg: 'bg-[#DCEAF5] text-[#3A6588]' },
    Traffic:   { tone: 'warning', icon: ArrowUpRight,  bg: 'bg-[#FEF3C7] text-[#B45309]' },
    Inventory: { tone: 'danger',  icon: AlertTriangle, bg: 'bg-[#FEE2E2] text-[#B91C1C]' },
  };
  const meta = map[insight.category];
  const Icon = meta.icon;
  return (
    <div className="flex gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer group">
      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${meta.bg}`}>
        <Icon size={16} strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone={meta.tone}>{insight.category}</Badge>
          <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-medium">
            {insight.confidence === 'high' ? 'High confidence' : 'Med confidence'}
          </span>
        </div>
        <p className="text-[13px] font-semibold text-[#1E293B] leading-snug">{insight.headline}</p>
        <p className="text-[12px] text-[#64748B] mt-0.5 tabular-nums">{insight.detail}</p>
      </div>
      <ArrowUpRight size={15} className="text-[#CBD5E1] group-hover:text-[#4A7FA7] transition-colors shrink-0 mt-1" />
    </div>
  );
};

const AIInsightsPanel = () => (
  <Card className="overflow-hidden flex flex-col">
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF2F7]">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4A7FA7] to-[#3A6588] flex items-center justify-center">
          <Sparkles size={15} className="text-white" />
        </div>
        <div>
          <p className="text-[13.5px] font-bold text-[#1E293B]" style={{ fontFamily: 'Plus Jakarta Sans' }}>Insights</p>
          <p className="text-[10.5px] text-[#94A3B8]">Updated 2m ago · 4 signals</p>
        </div>
      </div>
      <Badge tone="success" dot>Live</Badge>
    </div>
    <div className="p-2 flex-1 divide-y divide-[#F1F5F9] overflow-y-auto">
      {mockInsights.map((i) => <InsightCard key={i.id} insight={i} />)}
    </div>
    <button className="border-t border-[#EEF2F7] px-4 py-3 text-[12.5px] font-semibold text-[#3A6588] hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-1.5">
      View all insights <ArrowRight size={13} />
    </button>
  </Card>
);

/* ── Top Menu ── */
const TopMenuCard = () => (
  <Card className="p-5">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-[13.5px] font-bold text-[#1E293B]" style={{ fontFamily: 'Plus Jakarta Sans' }}>Top menu today</p>
        <p className="text-[11px] text-[#94A3B8] mt-0.5">By units sold</p>
      </div>
      <button className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
        <MoreHorizontal size={15} />
      </button>
    </div>
    <div className="space-y-1">
      {topMenuItems.map((item, i) => {
        const maxSold = Math.max(...topMenuItems.map((x) => x.sold));
        const pct = (item.sold / maxSold) * 100;
        return (
          <div key={item.id} className="relative px-2 py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors group cursor-pointer">
            <div className="absolute inset-y-0 left-0 rounded-lg bg-[#DCEAF5] opacity-0 group-hover:opacity-40 transition-opacity" style={{ width: `${pct}%` }} />
            <div className="relative flex items-center gap-3">
              <span className="w-5 text-[11px] font-bold text-[#CBD5E1] tabular-nums">{i + 1}</span>
              <div className="w-9 h-9 rounded-lg bg-[#F6F9FC] border border-[#EEF2F7] flex items-center justify-center text-lg">{item.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1E293B] truncate">{item.name}</p>
                <p className="text-[11px] text-[#94A3B8]">{item.category} · {fmtIDRShort(item.revenue)}</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-bold text-[#1E293B] tabular-nums">{item.sold}</p>
                <p className={`text-[10.5px] font-semibold tabular-nums ${item.trend >= 0 ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
                  {item.trend >= 0 ? '+' : ''}{item.trend}%
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

/* ── Peak Hours ── */
const PeakHoursTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] px-3 py-2" style={{ boxShadow: tokens.shadow.md }}>
      <p className="text-[10.5px] text-[#94A3B8] uppercase tracking-wider">{p.hour}:00 – {Number(p.hour) + 1}:00</p>
      <p className="text-[13px] font-bold tabular-nums">{p.orders} orders</p>
      {p.peak && <p className="text-[10.5px] text-[#B45309] font-semibold mt-0.5 flex items-center gap-1"><Flame size={10} /> Peak hour</p>}
    </div>
  );
};

const PeakHoursCard = () => (
  <Card className="p-5">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-[13.5px] font-bold text-[#1E293B]" style={{ fontFamily: 'Plus Jakarta Sans' }}>Peak hours</p>
        <p className="text-[11px] text-[#94A3B8] mt-0.5">Today · 144 orders total</p>
      </div>
      <Badge tone="warning" dot>7–9 PM peak</Badge>
    </div>
    <div className="h-[180px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={peakHoursData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="hour" tick={{ fontSize: 10.5, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10.5, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<PeakHoursTooltip />} cursor={{ fill: 'rgba(220,234,245,0.4)' }} />
          <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
            {peakHoursData.map((d, i) => <Cell key={i} fill={d.peak ? '#4A7FA7' : '#DCEAF5'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center gap-2 text-[11.5px] text-[#64748B]">
      <Sparkles size={12} className="text-[#4A7FA7]" />
      <span>Recommendation: <span className="font-semibold text-[#1E293B]">staff +2 crew</span> from 6:30 PM</span>
    </div>
  </Card>
);

/* ── Inventory Alerts ── */
const InventoryAlertsCard = () => (
  <Card className="p-5">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-[13.5px] font-bold text-[#1E293B]" style={{ fontFamily: 'Plus Jakarta Sans' }}>Inventory alerts</p>
        <p className="text-[11px] text-[#94A3B8] mt-0.5">{inventoryAlerts.length} items need attention</p>
      </div>
      <Button variant="ghost" size="sm" iconRight={ArrowRight}>View all</Button>
    </div>
    <div className="space-y-2">
      {inventoryAlerts.map((item) => {
        const isCritical = item.status === 'critical';
        const tone = isCritical ? 'danger' : 'warning';
        const pct = Math.min((item.currentStock / item.minStock) * 100, 100);
        return (
          <div key={item.id} className={`p-3 rounded-xl border ${isCritical ? 'bg-[#FEF2F2] border-[#FECACA]' : 'bg-[#FFFBEB] border-[#FDE68A]'}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1E293B] truncate">{item.name}</p>
                <p className="text-[11px] text-[#64748B] tabular-nums mt-0.5">{item.currentStock} {item.unit} left · {item.burnRate} burn</p>
              </div>
              <Badge tone={tone} dot>{isCritical ? 'Critical' : 'Low'}</Badge>
            </div>
            <div className="h-1 rounded-full bg-white/60 overflow-hidden mb-2">
              <div className={`h-full ${isCritical ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10.5px] font-semibold ${isCritical ? 'text-[#B91C1C]' : 'text-[#B45309]'}`}>
                ETA out in {item.etaDays < 1 ? `${Math.round(item.etaDays * 24)}h` : `${item.etaDays.toFixed(1)}d`}
              </span>
              <button className="text-[11px] font-bold text-[#1E293B] hover:text-[#3A6588] transition-colors">Restock →</button>
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

/* ── Recent Orders ── */
const orderStatusMeta = {
  pending: { tone: 'neutral', label: 'Pending' },
  cooking: { tone: 'warning', label: 'Cooking' },
  done:    { tone: 'primary', label: 'Ready' },
  paid:    { tone: 'success', label: 'Paid' },
};
const paymentMeta = {
  qris: { label: 'QRIS', bg: 'bg-[#DCEAF5] text-[#3A6588]' },
  card: { label: 'Card', bg: 'bg-[#F1F5F9] text-[#475569]' },
  cash: { label: 'Cash', bg: 'bg-[#DCFCE7] text-[#15803D]' },
};

const RecentOrdersCard = () => {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? recentOrders : recentOrders.filter((o) => o.status === filter);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF2F7]">
        <div>
          <p className="text-[13.5px] font-bold text-[#1E293B]" style={{ fontFamily: 'Plus Jakarta Sans' }}>Recent orders</p>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">Live · auto-refreshing every 30s</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-[#F6F9FC] rounded-lg p-0.5">
            {[{ id: 'all', label: 'All' }, { id: 'pending', label: 'Pending' }, { id: 'cooking', label: 'Cooking' }, { id: 'paid', label: 'Paid' }].map((t) => (
              <button key={t.id} onClick={() => setFilter(t.id)}
                className={`px-2.5 h-7 rounded-md text-[11.5px] font-semibold transition-colors ${filter === t.id ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" icon={Download}>Export</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              <th className="text-left px-5 py-2.5">Order</th>
              <th className="text-left px-3 py-2.5">Table</th>
              <th className="text-left px-3 py-2.5">Items</th>
              <th className="text-left px-3 py-2.5">Status</th>
              <th className="text-left px-3 py-2.5">Payment</th>
              <th className="text-right px-3 py-2.5">Total</th>
              <th className="text-right px-5 py-2.5">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const status = orderStatusMeta[o.status];
              const pay = paymentMeta[o.payment];
              return (
                <tr key={o.id} className="text-[13px] hover:bg-[#F8FAFC] transition-colors cursor-pointer border-t border-[#F1F5F9]">
                  <td className="px-5 py-3.5 font-semibold tabular-nums text-[#1E293B]">{o.id}</td>
                  <td className="px-3 py-3.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#F6F9FC] text-[12px] font-bold text-[#1E293B] tabular-nums">{o.table}</span>
                  </td>
                  <td className="px-3 py-3.5 text-[#64748B] max-w-[260px] truncate">{o.items}</td>
                  <td className="px-3 py-3.5"><Badge tone={status.tone} dot>{status.label}</Badge></td>
                  <td className="px-3 py-3.5"><span className={`inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-bold ${pay.bg}`}>{pay.label}</span></td>
                  <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-[#1E293B]">{fmtIDR(o.total)}</td>
                  <td className="px-5 py-3.5 text-right text-[#94A3B8] tabular-nums">{o.time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

/* ── Dashboard View ── */
const DashboardView = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const greeting = now.getHours() < 11 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">
            {now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h2 className="text-[22px] font-bold text-[#1E293B] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            {greeting}, Arif. <span className="text-[#64748B] font-medium">Here's your store today.</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B] text-[12.5px] font-medium hover:bg-[#F6F9FC] flex items-center gap-2">
            <Calendar size={13} className="text-[#64748B]" /> May 20, 2026 <ChevronDown size={13} className="text-[#94A3B8]" />
          </button>
          <Button variant="secondary" size="md" icon={RefreshCw}>Refresh</Button>
          <Button variant="primary" size="md" icon={Sparkles}>Ask AI</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Revenue Today"   value={fmtIDR(4_280_000)} delta="+12.4%"   deltaTone="success" helper="vs yesterday"   spark={sparkRevenue} />
        <StatCard label="Orders"          value="142"               delta="+8 today"  deltaTone="success" helper="avg 5.9/hr"    spark={sparkOrders}  sparkColor="#22C55E" />
        <StatCard label="Avg Order Value" value={fmtIDR(30_141)}    delta="-2.1%"    deltaTone="danger"  helper="target Rp 32K" spark={sparkAOV}     sparkColor="#F59E0B" />
        <StatCard label="Pending Kitchen" value="6"                 delta="2 over 8 min" deltaTone="danger" helper="needs attention" spark={sparkPending} sparkColor="#EF4444" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2"><RevenueChart /></div>
        <div className="xl:col-span-1"><AIInsightsPanel /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopMenuCard />
        <PeakHoursCard />
        <InventoryAlertsCard />
      </div>

      <RecentOrdersCard />

      <div className="flex items-center justify-center gap-2 py-2 text-[11.5px] text-[#94A3B8]">
        <Clock size={12} />
        <span>Last sync {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · auto-refreshing every 30s</span>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <DashboardView />
      </div>
    </div>
  );
}
