import React, { useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Sparkles, TrendingUp, TrendingDown, Calendar, ChevronDown,
  ArrowRight, Download, ArrowUp, ArrowDown,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { fmtIDR, fmtIDRShort } from '../utils/formatCurrency';
import { tokens } from '../data/tokens';
import { useThemeColors } from '../hooks/useThemeColors';

const revenue30Days = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const isWeekend = (day % 7 === 5) || (day % 7 === 6);
  const base = isWeekend ? 5_800_000 : 3_900_000;
  const variance = (Math.sin(i * 0.7) + 1) * 600_000;
  return { day: `${day}`, current: Math.round(base + variance), previous: Math.round(base * 0.86 + variance * 0.9) };
});

// `tone` keys resolve to theme-aware colors at render via useThemeColors.
const categoryBreakdown = [
  { name:'Rice Bowl',  value:38, revenue:42_180_000, tone:'b0' },
  { name:'Sushi',      value:22, revenue:24_420_000, tone:'b1' },
  { name:'Mains',      value:25, revenue:27_750_000, tone:'b2' },
  { name:'Beverages',  value:15, revenue:16_650_000, tone:'b3' },
];

const paymentMix = [
  { method:'QRIS',     value:52, count:74, icon:'📱', tone:'b0' },
  { method:'Card',     value:28, count:40, icon:'💳', tone:'b1' },
  { method:'Cash',     value:14, count:20, icon:'💵', tone:'success' },
  { method:'E-Wallet', value:6,  count:8,  icon:'👛', tone:'warning' },
];

const topItemsAnalytics = [
  { name:'Chicken Mentai Bowl', cat:'Rice Bowl', sold:284, revenue:16_472_000, trend:34,  emoji:'🍱' },
  { name:'Iced Matcha Latte',   cat:'Beverages', sold:251, revenue:6_777_000,  trend:22,  emoji:'🍵' },
  { name:'Salmon Aburi',        cat:'Sushi',     sold:189, revenue:16_065_000, trend:12,  emoji:'🍣' },
  { name:'Beef Yakiniku',       cat:'Mains',     sold:142, revenue:10_224_000, trend:8,   emoji:'🥩' },
  { name:'Ramen Tonkotsu',      cat:'Mains',     sold:138, revenue:8_970_000,  trend:15,  emoji:'🍜' },
  { name:'Tom Yum Soup',        cat:'Mains',     sold:96,  revenue:4_320_000,  trend:-5,  emoji:'🍲' },
];

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const hours = Array.from({ length: 14 }, (_, i) => i + 10);
const dayPattern  = { Mon:0.7, Tue:0.65, Wed:0.7, Thu:0.8, Fri:1.0, Sat:1.15, Sun:1.05 };
const hourPattern = { 10:0.2, 11:0.5, 12:0.95, 13:0.85, 14:0.4, 15:0.3, 16:0.4, 17:0.55, 18:0.8, 19:1.2, 20:1.15, 21:0.7, 22:0.3, 23:0.15 };

const heatmapData = days.flatMap(d => hours.map(h => ({
  day: d, hour: h,
  orders: Math.round(20 * dayPattern[d] * hourPattern[h] + (Math.sin(h * 0.5) * 2)),
})));
const maxHeat = Math.max(...heatmapData.map(c => c.orders));

const KPICard = ({ label, value, delta, deltaTone, sub }) => (
  <Card className="p-5">
    <p className="text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider">{label}</p>
    <p className="mt-2.5 text-[26px] font-bold text-ink tabular-nums tracking-tight leading-none" style={{ fontFamily:'Plus Jakarta Sans' }}>
      {value}
    </p>
    <div className="mt-2 flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-0.5 text-[11.5px] font-semibold ${
        deltaTone==='success' ? 'text-success-text' : 'text-danger-text'
      }`}>
        {deltaTone==='success' ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
        {delta}
      </span>
      <span className="text-[11.5px] text-ink-muted">· {sub}</span>
    </div>
  </Card>
);

const RevenueDeepChart = () => {
  const c = useThemeColors();
  const [range, setRange] = useState('30D');
  const total = revenue30Days.reduce((s, p) => s + p.current, 0);
  const totalPrev = revenue30Days.reduce((s, p) => s + p.previous, 0);
  const delta = ((total - totalPrev) / totalPrev) * 100;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
        <div>
          <p className="text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider">Revenue trend</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <h3 className="text-[28px] font-bold text-ink tabular-nums tracking-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
              {fmtIDR(total)}
            </h3>
            <Badge tone={delta >= 0 ? 'success' : 'danger'} dot>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs prev period
            </Badge>
          </div>
          <p className="text-[12px] text-ink-muted mt-1">Last 30 days · compared to previous 30 days</p>
        </div>
        <div className="flex items-center gap-1 bg-app rounded-lg p-0.5">
          {['7D','30D','90D','1Y'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 h-8 rounded-md text-[12px] font-semibold transition-colors ${
                range===r ? 'bg-card text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}>{r}</button>
          ))}
        </div>
      </div>
      <div className="mt-5 -ml-2" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenue30Days} margin={{ top:8, right:8, left:8, bottom:0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={c.primary} stopOpacity="0.28"/>
                <stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="day" tick={{ fontSize:10.5, fill:c.axis }} axisLine={false} tickLine={false} dy={8} interval={4}/>
            <YAxis tick={{ fontSize:10.5, fill:c.axis }} axisLine={false} tickLine={false} tickFormatter={fmtIDRShort} width={60}/>
            <Tooltip
              cursor={{ stroke:c.compare, strokeDasharray:'3 3' }}
              contentStyle={{ borderRadius:12, border:`1px solid ${c.line}`, background:c.card, color:c.ink, boxShadow: tokens.shadow.lg, fontSize:12 }}
              formatter={(v, name) => [fmtIDR(v), name==='current' ? 'This period' : 'Prev period']}
              labelFormatter={(l) => `Day ${l}`}/>
            <Area type="monotone" dataKey="previous" stroke={c.compare} strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false}/>
            <Area type="monotone" dataKey="current"  stroke={c.primary} strokeWidth={2.4} fill="url(#revGrad)"
              dot={false} activeDot={{ r:5, fill:c.primary, stroke:c.card, strokeWidth:2 }}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const HourDayHeatmap = () => {
  const c = useThemeColors();
  const [hovered, setHovered] = useState(null);
  const intensity = (val) => Math.max(0.05, val / maxHeat);
  // Build an rgba from the resolved primary hex so the heat scale follows theme.
  const heat = (a) => {
    const h = c.primary.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[13.5px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Order volume by hour × day</p>
          <p className="text-[11.5px] text-ink-muted mt-0.5">When customers actually come in</p>
        </div>
        <Badge tone="primary" dot size="lg">Fri-Sun 7-9PM peak</Badge>
      </div>
      <div className="relative">
        <div className="flex">
          <div className="flex flex-col gap-1 pt-6 pr-2">
            {days.map(d => (
              <div key={d} className="h-7 flex items-center justify-end text-[11px] font-semibold text-ink-soft tabular-nums">{d}</div>
            ))}
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-1 mb-1">
              {hours.map(h => (
                <div key={h} className="flex-1 min-w-[28px] h-5 flex items-center justify-center text-[10px] font-semibold text-ink-muted tabular-nums">
                  {h}
                </div>
              ))}
            </div>
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
                        className={`flex-1 min-w-[28px] h-7 rounded-md transition-all cursor-pointer ${isHovered ? 'ring-2 ring-tooltip ring-offset-1' : ''}`}
                        style={{ background: alpha < 0.1 ? c.surface : heat(alpha) }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-semibold text-ink-muted">Less</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(a => (
              <div key={a} className="w-5 h-3.5 rounded" style={{ background: heat(a) }}/>
            ))}
            <span className="text-[10.5px] font-semibold text-ink-muted">More</span>
          </div>
          {hovered && (
            <div className="text-[12px] text-ink flex items-center gap-3">
              <span className="font-semibold">{hovered.day} · {hovered.hour}:00–{hovered.hour+1}:00</span>
              <span className="text-primary font-bold tabular-nums">{hovered.orders} orders</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-surface flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center shrink-0">
          <Sparkles size={13} className="text-white"/>
        </div>
        <p className="text-[12.5px] text-ink">
          <span className="font-semibold">Friday-Sunday 7-9 PM</span> drives 38% of weekly orders.
          Consider staff scheduling and stock pre-prep before <span className="font-semibold tabular-nums">6 PM</span>.
        </p>
      </div>
    </Card>
  );
};

const toneToColor = (c) => (tone) => ({
  b0: c.blues[0], b1: c.blues[1], b2: c.blues[2], b3: c.blues[3],
  success: c.success, warning: c.warning, danger: c.danger, primary: c.primary,
}[tone] ?? c.primary);

const CategoryDonut = () => {
  const colors = useThemeColors();
  const color = toneToColor(colors);
  return (
  <Card className="p-5">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-[13.5px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>By category</p>
        <p className="text-[11.5px] text-ink-muted mt-0.5">% of orders · last 30 days</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="relative w-[140px] h-[140px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={categoryBreakdown} dataKey="value" innerRadius={45} outerRadius={62} paddingAngle={2} strokeWidth={0}>
              {categoryBreakdown.map((item, i) => <Cell key={i} fill={color(item.tone)}/>)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Orders</p>
          <p className="text-[22px] font-bold text-ink tabular-nums leading-none mt-0.5" style={{ fontFamily:'Plus Jakarta Sans' }}>1,847</p>
        </div>
      </div>
      <div className="flex-1 space-y-1.5 min-w-0">
        {categoryBreakdown.map(item => (
          <div key={item.name} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background:color(item.tone) }}/>
            <span className="text-[12.5px] text-ink font-medium flex-1 truncate">{item.name}</span>
            <span className="text-[12.5px] text-ink-soft font-semibold tabular-nums">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  </Card>
  );
};

const PaymentMixCard = () => {
  const colors = useThemeColors();
  const color = toneToColor(colors);
  return (
  <Card className="p-5">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-[13.5px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Payment mix</p>
        <p className="text-[11.5px] text-ink-muted mt-0.5">By transaction count</p>
      </div>
    </div>
    <div className="space-y-3">
      {paymentMix.map(p => (
        <div key={p.method}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{p.icon}</span>
              <span className="text-[12.5px] font-semibold text-ink">{p.method}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-ink-muted tabular-nums">{p.count} txn</span>
              <span className="text-[12.5px] font-bold tabular-nums text-ink">{p.value}%</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <div className="h-full rounded-full" style={{ width:`${p.value}%`, background:color(p.tone) }}/>
          </div>
        </div>
      ))}
    </div>
  </Card>
  );
};

const TopItemsLeaderboard = () => {
  const maxRev = Math.max(...topItemsAnalytics.map(i => i.revenue));
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[13.5px] font-bold text-ink" style={{ fontFamily:'Plus Jakarta Sans' }}>Top performers</p>
          <p className="text-[11.5px] text-ink-muted mt-0.5">By revenue · last 30 days</p>
        </div>
        <Button variant="ghost" size="sm" iconRight={ArrowRight}>Full report</Button>
      </div>
      <div className="space-y-2">
        {topItemsAnalytics.map((item, i) => {
          const pct = (item.revenue / maxRev) * 100;
          return (
            <div key={item.name} className="relative px-2 py-2.5 rounded-lg hover:bg-surface-2 transition-colors group cursor-pointer">
              <div className="absolute inset-y-0 left-0 rounded-lg bg-primary-soft opacity-40" style={{ width:`${pct}%` }}/>
              <div className="relative flex items-center gap-3">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold tabular-nums ${
                  i < 3 ? 'bg-tooltip text-white' : 'bg-surface text-ink-muted'
                }`}>{i+1}</span>
                <div className="w-9 h-9 rounded-lg bg-card border border-line-soft flex items-center justify-center text-xl">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate">{item.name}</p>
                  <p className="text-[11px] text-ink-muted">{item.cat} · <span className="tabular-nums">{item.sold} sold</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[13.5px] font-bold text-ink tabular-nums">{fmtIDRShort(item.revenue)}</p>
                  <p className={`text-[10.5px] font-semibold tabular-nums ${item.trend>=0?'text-success-text':'text-danger-text'}`}>
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
    <div className="flex items-end justify-between flex-wrap gap-3">
      <div>
        <p className="text-[12px] font-semibold text-ink-muted uppercase tracking-wider">Last 30 days · May 2026</p>
        <h2 className="text-[22px] font-bold text-ink tracking-tight" style={{ fontFamily:'Plus Jakarta Sans' }}>
          Analytics deep-dive
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <button className="h-9 px-3 rounded-lg border border-line bg-card text-ink text-[12.5px] font-medium hover:bg-app flex items-center gap-2">
          <Calendar size={13} className="text-ink-soft"/> Apr 20 – May 20 <ChevronDown size={13} className="text-ink-muted"/>
        </button>
        <Button variant="secondary" size="md" icon={Download}>Export PDF</Button>
        <Button variant="primary" size="md" icon={Sparkles}>Ask AI</Button>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard label="Total revenue"    value={fmtIDR(111_000_000)} delta="+18.4%" deltaTone="success" sub="vs prev 30D"/>
      <KPICard label="Total orders"     value="1,847"               delta="+12.1%" deltaTone="success" sub="61 / day avg"/>
      <KPICard label="Avg order value"  value={fmtIDR(60_100)}      delta="+5.6%"  deltaTone="success" sub="Target Rp 65K"/>
      <KPICard label="Repeat customers" value="38%"                  delta="-2.3%"  deltaTone="danger"  sub="Of 142 unique"/>
    </div>

    <RevenueDeepChart/>
    <HourDayHeatmap/>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <CategoryDonut/>
      <PaymentMixCard/>
      <div className="lg:col-span-1"><TopItemsLeaderboard/></div>
    </div>
  </div>
);

export default function AnalyticsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1500px] mx-auto px-6 py-6">
        <AnalyticsView />
      </div>
    </div>
  );
}
