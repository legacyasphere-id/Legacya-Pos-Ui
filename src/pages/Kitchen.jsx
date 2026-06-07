import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChefHat, Flame, Timer, RefreshCw, Maximize2, CheckCircle2,
  ChefHat as ChefHatIcon, AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { fmtElapsed } from '../utils/formatTime';
import { tokens } from '../data/tokens';
import { getKitchenOrders, advanceOrderStatus, subscribeOrders } from '../lib/api';

const urgencyStyles = {
  fresh:   { ring: 'ring-2 ring-primary-soft',              accent: 'bg-primary', tone: 'primary', label: 'New order' },
  normal:  { ring: 'ring-1 ring-line',                      accent: 'bg-success', tone: 'success', label: 'Cooking' },
  warning: { ring: 'ring-2 ring-warning-accent',            accent: 'bg-warning', tone: 'warning', label: '5+ min' },
  urgent:  { ring: 'ring-2 ring-danger-accent animate-pulse', accent: 'bg-danger', tone: 'danger',  label: 'URGENT' },
};

const KitchenStat = ({ label, value, accent }) => (
  <div className="flex items-center gap-2.5">
    <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <p className="text-[18px] font-bold tabular-nums leading-none" style={{ fontFamily: 'Plus Jakarta Sans' }}>{value}</p>
    </div>
  </div>
);

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [, setTick] = useState(0);

  const refetch = useCallback(async () => {
    try {
      const rows = await getKitchenOrders();
      setOrders(rows);
      setError('');
    } catch (e) {
      setError(e?.message || 'Failed to load kitchen queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const poll = setInterval(refetch, 10000);            // fallback if realtime is off
    const unsub = subscribeOrders(refetch);               // live updates if enabled
    const tick = setInterval(() => setTick((x) => x + 1), 1000); // elapsed clock
    return () => { clearInterval(poll); clearInterval(tick); unsub(); };
  }, [refetch]);

  const advance = async (id, to) => {
    setBusyId(id);
    try {
      await advanceOrderStatus(id, to);
      await refetch();
    } catch (e) {
      setError(e?.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const ordersLive = useMemo(() => orders.map((o) => {
    const elapsed = o.status === 'cooking' && o.cooking_at
      ? Math.max(0, Math.floor((Date.now() - new Date(o.cooking_at).getTime()) / 1000))
      : 0;
    return {
      id: o.id,
      orderNo: o.order_no,
      table: o.table_label ?? '—',
      status: o.status,
      time: o.placed_at ? format(new Date(o.placed_at), 'HH:mm') : '—',
      items: (o.order_item ?? []).map((it) => ({ name: it.name_snapshot, qty: it.qty })),
      elapsed,
    };
  }), [orders]);

  const urgencyOf = (o) => {
    if (o.status === 'pending') return 'fresh';
    if (o.elapsed < 5 * 60) return 'normal';
    if (o.elapsed < 10 * 60) return 'warning';
    return 'urgent';
  };

  const counts = {
    pending: ordersLive.filter((o) => o.status === 'pending').length,
    cooking: ordersLive.filter((o) => o.status === 'cooking').length,
    urgent: ordersLive.filter((o) => urgencyOf(o) === 'urgent').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 bg-tooltip rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <ChefHat size={22} className="text-white" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wider">Kitchen Display</p>
            <p className="text-[24px] font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {ordersLive.length} orders in queue
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <KitchenStat label="Pending" value={counts.pending} accent="#DCEAF5" />
          <KitchenStat label="Cooking" value={counts.cooking} accent="#22C55E" />
          <KitchenStat label="Urgent" value={counts.urgent} accent="#EF4444" />
          <div className="h-10 w-px bg-white/15" />
          <div className="flex items-center gap-2 text-white/80">
            <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-[12px] font-medium">Live</span>
          </div>
          <button className="h-10 w-10 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-danger-soft text-danger-text p-4 text-[13px]">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center"><div className="h-7 w-7 rounded-full border-2 border-line border-t-primary animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {ordersLive.map((o) => {
            const urgency = urgencyOf(o);
            const style = urgencyStyles[urgency];
            return (
              <div key={o.id} className={`bg-card rounded-2xl overflow-hidden ${style.ring}`} style={{ boxShadow: tokens.shadow.md }}>
                <div className={`h-1 ${style.accent}`} />
                <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[20px] font-bold text-ink tabular-nums" style={{ fontFamily: 'Plus Jakarta Sans' }}>Table {o.table}</p>
                      {urgency === 'urgent' && <Flame size={18} className="text-danger" />}
                    </div>
                    <p className="text-[12.5px] text-ink-muted font-semibold tabular-nums mt-0.5">{o.orderNo} · {o.time}</p>
                  </div>
                  <Badge tone={style.tone} dot size="lg">{style.label}</Badge>
                </div>

                <div className="px-5 py-3 space-y-1.5 border-y border-surface bg-surface-2">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-md bg-tooltip text-white text-[13px] font-bold tabular-nums">×{it.qty}</span>
                      <p className="text-[15px] font-semibold text-ink leading-tight pt-0.5">{it.name}</p>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      urgency === 'urgent' ? 'bg-danger-soft text-danger-text'
                        : urgency === 'warning' ? 'bg-warning-soft text-warning-text'
                        : urgency === 'fresh' ? 'bg-primary-soft text-primary-text'
                        : 'bg-success-soft text-success-text'
                    }`}>
                      <Timer size={16} strokeWidth={2.4} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Elapsed</p>
                      <p className="text-[17px] font-bold tabular-nums text-ink leading-none mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                        {o.status === 'pending' ? '—' : fmtElapsed(o.elapsed)}
                      </p>
                    </div>
                  </div>
                  {o.status === 'pending' ? (
                    <Button variant="primary" size="lg" icon={ChefHatIcon} disabled={busyId === o.id} onClick={() => advance(o.id, 'cooking')}>
                      {busyId === o.id ? '…' : 'Start'}
                    </Button>
                  ) : (
                    <Button variant="success" size="lg" icon={CheckCircle2} disabled={busyId === o.id} onClick={() => advance(o.id, 'ready')}>
                      {busyId === o.id ? '…' : 'Ready'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && ordersLive.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-success-soft flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-success-text" />
          </div>
          <p className="text-[18px] font-bold text-ink" style={{ fontFamily: 'Plus Jakarta Sans' }}>All caught up.</p>
          <p className="text-[13px] text-ink-soft mt-1">Queue is empty — new orders appear here automatically.</p>
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
