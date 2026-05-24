import React, { useState, useEffect, useMemo } from 'react';
import {
  ChefHat, Flame, Timer, RefreshCw, Maximize2, CheckCircle2,
  ChefHat as ChefHatIcon,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { fmtElapsed } from '../utils/formatTime';
import { tokens } from '../data/tokens';

const seedOrders = [
  { id:'ORD-1051', table:2,  items:[{ name:'Chicken Mentai', qty:2 }, { name:'Matcha', qty:2 }], status:'pending', time:'11:48', elapsed:30 },
  { id:'ORD-1050', table:9,  items:[{ name:'Beef Yakiniku', qty:1 }, { name:'Ramen', qty:1 }],   status:'cooking', time:'11:36', elapsed:12*60 },
  { id:'ORD-1049', table:4,  items:[{ name:'Salmon Aburi', qty:2 }, { name:'Ocha', qty:2 }],     status:'cooking', time:'11:41', elapsed:7*60 },
  { id:'ORD-1048', table:7,  items:[{ name:'Chicken Mentai', qty:2 }],                           status:'cooking', time:'11:42', elapsed:6*60 },
  { id:'ORD-1047', table:12, items:[{ name:'Salmon Mentai', qty:3 }, { name:'Matcha', qty:2 }],  status:'pending', time:'11:44', elapsed:4*60 },
];

const urgencyStyles = {
  fresh:   { ring:'ring-2 ring-[#DCEAF5]',              accent:'bg-[#4A7FA7]', tone:'primary', label:'New order' },
  normal:  { ring:'ring-1 ring-[#E2E8F0]',              accent:'bg-[#22C55E]', tone:'success', label:'Cooking' },
  warning: { ring:'ring-2 ring-[#FCD34D]',              accent:'bg-[#F59E0B]', tone:'warning', label:'5+ min' },
  urgent:  { ring:'ring-2 ring-[#FCA5A5] animate-pulse', accent:'bg-[#EF4444]', tone:'danger',  label:'URGENT' },
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

const KitchenDisplay = () => {
  const [orders, setOrders] = useState(seedOrders);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const startCooking = (id) => setOrders(prev => prev.map(o => o.id===id ? { ...o, status:'cooking', elapsed:0 } : o));
  const markDone = (id) => setOrders(prev => prev.filter(o => o.id !== id));

  const urgencyOf = (o) => {
    if (o.status==='pending') return 'fresh';
    if (o.elapsed < 5*60) return 'normal';
    if (o.elapsed < 10*60) return 'warning';
    return 'urgent';
  };

  const counts = {
    pending: orders.filter(o=>o.status==='pending').length,
    cooking: orders.filter(o=>o.status==='cooking').length,
    urgent: orders.filter(o => urgencyOf(o)==='urgent').length,
  };

  const ordersLive = useMemo(
    () => orders.map(o => ({ ...o, elapsed: (o.elapsed || 0) + (o.status==='cooking' ? tick : 0) })),
    [orders, tick],
  );

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {ordersLive.map(o => {
          const urgency = urgencyOf(o);
          const style = urgencyStyles[urgency];
          return (
            <div key={o.id} className={`bg-white rounded-2xl overflow-hidden ${style.ring}`} style={{ boxShadow: tokens.shadow.md }}>
              <div className={`h-1 ${style.accent}`}/>
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

              <div className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    urgency==='urgent'  ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                    urgency==='warning' ? 'bg-[#FEF3C7] text-[#B45309]' :
                    urgency==='fresh'   ? 'bg-[#DCEAF5] text-[#3A6588]' :
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

export default function KitchenPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <KitchenDisplay />
      </div>
    </div>
  );
}
