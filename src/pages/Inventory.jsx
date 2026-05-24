import React, { useState, useMemo } from 'react';
import {
  Sparkles, AlertTriangle, AlertCircle, Check, Boxes,
  Search, MoreHorizontal, Download, Plus, History, Truck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { tokens } from '../data/tokens';

const inventoryItems = [
  { id:'i01', name:'Burger Bun',        cat:'Bakery',   unit:'pcs', current:8,    min:30,  burnRate:24,  lastRestocked:'May 18', status:'critical' },
  { id:'i02', name:'Salmon Fillet',     cat:'Seafood',  unit:'kg',  current:2.4,  min:5,   burnRate:1.8, lastRestocked:'May 19', status:'low' },
  { id:'i03', name:'Mozzarella Cheese', cat:'Dairy',    unit:'kg',  current:1.8,  min:3,   burnRate:0.9, lastRestocked:'May 17', status:'low' },
  { id:'i04', name:'Beef Tenderloin',   cat:'Meat',     unit:'kg',  current:6.2,  min:4,   burnRate:1.4, lastRestocked:'May 20', status:'ok' },
  { id:'i05', name:'Chicken Breast',    cat:'Meat',     unit:'kg',  current:12.8, min:6,   burnRate:2.8, lastRestocked:'May 20', status:'ok' },
  { id:'i06', name:'Sushi Rice',        cat:'Grain',    unit:'kg',  current:18,   min:10,  burnRate:3.2, lastRestocked:'May 19', status:'ok' },
  { id:'i07', name:'Matcha Powder',     cat:'Beverage', unit:'g',   current:340,  min:200, burnRate:65,  lastRestocked:'May 15', status:'ok' },
  { id:'i08', name:'Nori Sheets',       cat:'Asian',    unit:'pcs', current:32,   min:50,  burnRate:18,  lastRestocked:'May 16', status:'low' },
  { id:'i09', name:'Egg',               cat:'Dairy',    unit:'pcs', current:144,  min:60,  burnRate:32,  lastRestocked:'May 20', status:'ok' },
  { id:'i10', name:'Soy Sauce',         cat:'Sauce',    unit:'L',   current:4.8,  min:2,   burnRate:0.6, lastRestocked:'May 14', status:'ok' },
  { id:'i11', name:'Tempura Flour',     cat:'Bakery',   unit:'kg',  current:5.2,  min:3,   burnRate:0.8, lastRestocked:'May 17', status:'ok' },
  { id:'i12', name:'Lemon',             cat:'Produce',  unit:'pcs', current:18,   min:30,  burnRate:12,  lastRestocked:'May 18', status:'low' },
];

const statusMeta = {
  critical: { tone:'danger',  label:'Critical', barBg:'bg-[#EF4444]' },
  low:      { tone:'warning', label:'Low',      barBg:'bg-[#F59E0B]' },
  ok:       { tone:'success', label:'OK',       barBg:'bg-[#22C55E]' },
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

const InventoryView = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => ({
    all:      inventoryItems.length,
    critical: inventoryItems.filter(i => i.status==='critical').length,
    low:      inventoryItems.filter(i => i.status==='low').length,
    ok:       inventoryItems.filter(i => i.status==='ok').length,
  }), []);

  const filtered = useMemo(() => {
    let res = filter==='all' ? inventoryItems : inventoryItems.filter(i => i.status===filter);
    if (search) res = res.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.cat.toLowerCase().includes(search.toLowerCase()));
    return res;
  }, [filter, search]);

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InvStat label="Total items" value={counts.all}      icon={Boxes}         tone="neutral"/>
        <InvStat label="Critical"    value={counts.critical} icon={AlertTriangle}  tone="danger"/>
        <InvStat label="Low stock"   value={counts.low}      icon={AlertCircle}   tone="warning"/>
        <InvStat label="OK"          value={counts.ok}       icon={Check}         tone="success"/>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-[#EEF2F7] flex-wrap">
          <div className="flex items-center gap-0.5 bg-[#F6F9FC] rounded-lg p-0.5">
            {[
              { id:'all',      label:'All',      count:counts.all },
              { id:'critical', label:'Critical', count:counts.critical },
              { id:'low',      label:'Low',      count:counts.low },
              { id:'ok',       label:'OK',       count:counts.ok },
            ].map(t => (
              <button key={t.id} onClick={() => setFilter(t.id)}
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
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#F6F9FC] text-[12.5px] border border-transparent focus:outline-none focus:border-[#4A7FA7] focus:bg-white transition-all"/>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost"     size="sm" icon={History}>History</Button>
            <Button variant="secondary" size="sm" icon={Download}>Export</Button>
            <Button variant="primary"   size="sm" icon={Plus}>Add item</Button>
          </div>
        </div>

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
                const etaStr = etaDays < 1 ? `${Math.round(etaDays * 24)}h` : `${etaDays.toFixed(1)}d`;
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
                        item.status==='low'      ? 'text-[#B45309]' :
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

export default function InventoryPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1500px] mx-auto px-6 py-6">
        <InventoryView />
      </div>
    </div>
  );
}
