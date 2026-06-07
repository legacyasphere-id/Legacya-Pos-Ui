import React, { useState, useMemo, useEffect } from 'react';
import {
  ReceiptText, TrendingUp, Clock, Flame, Hash,
  Search, MoreHorizontal, ChevronDown, Calendar,
  SlidersHorizontal, Download, ArrowUpDown, Printer, Eye, AlertCircle,
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { fmtIDR, fmtIDRShort } from '../utils/formatCurrency';
import { tokens } from '../data/tokens';
import { getOrders } from '../lib/api';

const orderStatusMeta = {
  pending: { tone: 'neutral', label: 'Pending' },
  cooking: { tone: 'warning', label: 'Cooking' },
  ready:   { tone: 'primary', label: 'Ready' },
  done:    { tone: 'primary', label: 'Served' },
  paid:    { tone: 'success', label: 'Paid' },
  void:    { tone: 'danger',  label: 'Void' },
};

const paymentMeta = {
  qris:          { label: 'QRIS', bg: 'bg-primary-soft text-primary-text' },
  card:          { label: 'Card', bg: 'bg-surface text-ink-strong' },
  cash:          { label: 'Cash', bg: 'bg-success-soft text-success-text' },
  ewallet:       { label: 'E-Wallet', bg: 'bg-warning-soft text-warning-text' },
  bank_transfer: { label: 'Transfer', bg: 'bg-surface text-ink-strong' },
};

const StatChip = ({ label, value, icon: Icon, tone = 'neutral' }) => {
  const tones = {
    neutral: 'bg-card text-ink border-line',
    primary: 'bg-primary-soft text-primary-text border-transparent',
    warning: 'bg-warning-soft text-warning-text border-transparent',
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${tones[tone]}`} style={{ boxShadow: tokens.shadow.sm }}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone === 'neutral' ? 'bg-app' : 'bg-card'}`}>
        <Icon size={16} strokeWidth={2.2} className={tone === 'neutral' ? 'text-ink-soft' : ''} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-[16px] font-bold tabular-nums leading-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>{value}</p>
      </div>
    </div>
  );
};

const mapOrder = (o) => {
  const when = o.placed_at ? new Date(o.placed_at) : null;
  return {
    id: o.order_no,
    rowId: o.id,
    table: o.table_label ?? '—',
    items: (o.order_item ?? []).map((it) => ({ name: it.name_snapshot, qty: it.qty })),
    total: o.grand_total,
    status: o.status,
    payment: o.payment?.[0]?.method ?? null,
    time: when ? format(when, 'HH:mm') : '—',
    date: when ? (isToday(when) ? 'Today' : format(when, 'd MMM')) : '—',
  };
};

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await getOrders({ limit: 100 });
        setOrders(rows.map(mapOrder));
      } catch (e) {
        setError(e?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    cooking: orders.filter((o) => o.status === 'cooking').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    done: orders.filter((o) => o.status === 'done').length,
    paid: orders.filter((o) => o.status === 'paid').length,
  }), [orders]);

  const filtered = useMemo(() => {
    let res = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
    if (search) res = res.filter((o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) || String(o.table).includes(search));
    return res;
  }, [orders, filter, search]);

  const totalRevenue = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.total, 0);
  const avgOrder = counts.paid ? Math.round(totalRevenue / counts.paid) : 0;

  if (loading) {
    return <div className="h-64 flex items-center justify-center"><div className="h-7 w-7 rounded-full border-2 border-line border-t-primary animate-spin" /></div>;
  }
  if (error) {
    return <div className="flex items-start gap-2 rounded-xl bg-danger-soft text-danger-text p-4 text-[13px]"><AlertCircle size={16} className="shrink-0 mt-0.5" /> <span>{error}</span></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <StatChip label="Today's revenue" value={fmtIDRShort(totalRevenue)} icon={TrendingUp} tone="primary" />
        <StatChip label="Total orders" value={counts.all} icon={ReceiptText} />
        <StatChip label="Pending" value={counts.pending} icon={Clock} tone="neutral" />
        <StatChip label="Cooking" value={counts.cooking} icon={Flame} tone="warning" />
        <StatChip label="Avg order" value={fmtIDRShort(avgOrder)} icon={Hash} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-line-soft flex-wrap">
          <div className="flex items-center gap-0.5 bg-app rounded-lg p-0.5">
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'cooking', label: 'Cooking', count: counts.cooking },
              { id: 'ready', label: 'Ready', count: counts.ready },
              { id: 'paid', label: 'Paid', count: counts.paid },
            ].map((t) => (
              <button key={t.id} onClick={() => setFilter(t.id)}
                className={`px-3 h-8 rounded-md text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5 ${
                  filter === t.id ? 'bg-card text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
                }`}>
                {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tabular-nums ${
                  filter === t.id ? 'bg-primary-soft text-primary-text' : 'bg-line text-ink-soft'
                }`}>{t.count}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID or table…"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-app text-[12.5px] border border-transparent focus:outline-none focus:border-primary focus:bg-card transition-all" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={Calendar}>Today</Button>
            <Button variant="ghost" size="sm" icon={SlidersHorizontal}>Filters</Button>
            <Button variant="secondary" size="sm" icon={Download}>Export</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
                <th className="text-left px-5 py-2.5 w-8"></th>
                <th className="text-left px-3 py-2.5"><span className="inline-flex items-center gap-1">Order ID <ArrowUpDown size={11} /></span></th>
                <th className="text-left px-3 py-2.5">Table</th>
                <th className="text-left px-3 py-2.5">Items</th>
                <th className="text-left px-3 py-2.5">Status</th>
                <th className="text-left px-3 py-2.5">Payment</th>
                <th className="text-right px-3 py-2.5"><span className="inline-flex items-center gap-1">Total <ArrowUpDown size={11} /></span></th>
                <th className="text-right px-3 py-2.5">Time</th>
                <th className="text-right px-5 py-2.5 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-[13px] text-ink-muted">No orders match.</td></tr>
              )}
              {filtered.map((o) => {
                const status = orderStatusMeta[o.status] ?? { tone: 'neutral', label: o.status };
                const pay = o.payment ? (paymentMeta[o.payment] ?? { label: o.payment, bg: 'bg-surface text-ink-strong' }) : null;
                const isExpanded = expandedId === o.rowId;
                return (
                  <React.Fragment key={o.rowId}>
                    <tr onClick={() => setExpandedId(isExpanded ? null : o.rowId)}
                      className={`text-[13px] hover:bg-surface-2 transition-colors cursor-pointer border-t border-surface ${isExpanded ? 'bg-surface-2' : ''}`}>
                      <td className="px-5 py-3.5"><ChevronDown size={14} className={`text-ink-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></td>
                      <td className="px-3 py-3.5 font-semibold tabular-nums text-ink">{o.id}</td>
                      <td className="px-3 py-3.5"><span className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-app text-[12px] font-bold text-ink tabular-nums">{o.table}</span></td>
                      <td className="px-3 py-3.5 text-ink-soft max-w-[280px]"><span className="truncate block">{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ') || '—'}</span></td>
                      <td className="px-3 py-3.5"><Badge tone={status.tone} dot>{status.label}</Badge></td>
                      <td className="px-3 py-3.5">{pay ? <span className={`inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-bold ${pay.bg}`}>{pay.label}</span> : <span className="text-ink-faint">—</span>}</td>
                      <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-ink">{fmtIDR(o.total)}</td>
                      <td className="px-3 py-3.5 text-right text-ink-muted tabular-nums">{o.time}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button className="w-7 h-7 rounded-md hover:bg-line flex items-center justify-center text-ink-muted ml-auto" onClick={(e) => e.stopPropagation()}><MoreHorizontal size={14} /></button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-surface-2 border-t border-surface">
                        <td colSpan={9} className="px-5 py-4">
                          <div className="flex items-start gap-6 flex-wrap">
                            <div className="flex-1 min-w-[240px]">
                              <p className="text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider mb-2">Items</p>
                              <div className="space-y-1">
                                {o.items.map((it, i) => (
                                  <div key={i} className="flex justify-between text-[12.5px]">
                                    <span className="text-ink font-medium">{it.name} <span className="text-ink-muted">×{it.qty}</span></span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex-1 min-w-[180px]">
                              <p className="text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider mb-2">Details</p>
                              <div className="space-y-1 text-[12.5px]">
                                <div className="flex justify-between"><span className="text-ink-muted">Date</span><span className="text-ink tabular-nums">{o.date} · {o.time}</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Payment</span><span className="text-ink">{pay?.label ?? '—'}</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Total</span><span className="text-ink font-semibold tabular-nums">{fmtIDR(o.total)}</span></div>
                              </div>
                            </div>
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

        <div className="flex items-center justify-between px-5 py-3 border-t border-line-soft text-[12px] text-ink-soft">
          <span>Showing <span className="font-semibold text-ink tabular-nums">{filtered.length}</span> of <span className="font-semibold text-ink tabular-nums">{counts.all}</span> orders</span>
        </div>
      </Card>
    </div>
  );
};

export default function OrdersPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <OrdersList />
      </div>
    </div>
  );
}
