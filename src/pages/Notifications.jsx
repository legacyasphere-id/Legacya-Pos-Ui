import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  Bell,
  Check,
  X,
  ArrowRight,
  Settings,
  Mail,
  Phone,
  Volume2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { useNotificationsStore } from '../store/notifications.store';

const typeMeta = {
  danger: { icon: AlertTriangle, bg: 'bg-danger-soft', color: 'text-danger-text', tone: 'danger' },
  warning: {
    icon: AlertCircle,
    bg: 'bg-warning-soft',
    color: 'text-warning-text',
    tone: 'warning',
  },
  success: {
    icon: CheckCircle2,
    bg: 'bg-success-soft',
    color: 'text-success-text',
    tone: 'success',
  },
  primary: { icon: Sparkles, bg: 'bg-primary-soft', color: 'text-primary-text', tone: 'primary' },
  info: { icon: Info, bg: 'bg-surface', color: 'text-ink-strong', tone: 'neutral' },
};

const NotificationItem = ({ n, onToggleRead, onDismiss }) => {
  const meta = typeMeta[n.type];
  const Icon = meta.icon;
  return (
    <div
      className={`group relative flex gap-3 px-5 py-4 hover:bg-surface-2 transition-colors cursor-pointer ${!n.isRead ? 'bg-surface-2' : ''}`}
    >
      {!n.isRead && <span className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r bg-primary" />}

      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg}`}>
        <Icon size={17} strokeWidth={2.4} className={meta.color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone={meta.tone}>{n.category}</Badge>
          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </div>
        <p className="text-[13.5px] font-bold text-ink leading-snug">{n.title}</p>
        <p className="text-[12.5px] text-ink-soft mt-0.5 leading-relaxed">{n.message}</p>
        <div className="mt-2 flex items-center gap-3">
          <button className="text-[12px] font-bold text-primary-text hover:text-ink transition-colors inline-flex items-center gap-1">
            {n.action} <ArrowRight size={11} />
          </button>
          <span className="text-[11px] text-ink-muted tabular-nums">{n.timestamp}</span>
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleRead(n.id);
          }}
          className="w-7 h-7 rounded-md hover:bg-line flex items-center justify-center text-ink-muted"
          title={n.isRead ? 'Mark as unread' : 'Mark as read'}
        >
          {n.isRead ? <Bell size={13} /> : <Check size={13} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(n.id);
          }}
          className="w-7 h-7 rounded-md hover:bg-danger-soft hover:text-danger flex items-center justify-center text-ink-muted transition-colors"
          title="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

const ChannelRow = ({ icon: Icon, label, enabled: initial }) => {
  const [on, setOn] = useState(initial);
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={13} className={on ? 'text-primary-text' : 'text-ink-faint'} strokeWidth={2.2} />
        <span className={`text-[12.5px] font-medium ${on ? 'text-ink' : 'text-ink-muted'}`}>
          {label}
        </span>
      </div>
      <Switch checked={on} onChange={setOn} size="sm" />
    </div>
  );
};

const NotificationsView = () => {
  const { items, toggleRead, dismiss, markAllRead } = useNotificationsStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    markAllRead();
    // markAllRead is a stable Zustand action — intentionally omitted from deps
  }, [markAllRead]);

  const counts = useMemo(
    () => ({
      all: items.length,
      unread: items.filter((n) => !n.isRead).length,
      Inventory: items.filter((n) => n.category === 'Inventory').length,
      Sales: items.filter((n) => n.category === 'Sales').length,
      'AI Insight': items.filter((n) => n.category === 'AI Insight').length,
      Order: items.filter((n) => n.category === 'Order').length,
      System: items.filter((n) => n.category === 'System').length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'unread') return items.filter((n) => !n.isRead);
    return items.filter((n) => n.category === filter);
  }, [items, filter]);

  const grouped = useMemo(() => {
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    filtered.forEach((n) => {
      if (n.timestamp.startsWith('Today')) groups['Today'].push(n);
      else if (n.timestamp.startsWith('Yesterday')) groups['Yesterday'].push(n);
      else groups['Earlier'].push(n);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line-soft">
          <div>
            <h2
              className="text-[16px] font-bold text-ink tracking-tight"
              style={{ fontFamily: 'Plus Jakarta Sans' }}
            >
              Activity feed
            </h2>
            <p className="text-[11.5px] text-ink-muted mt-0.5">
              {counts.unread > 0 ? (
                <>
                  <span className="font-semibold text-primary-text">{counts.unread} unread</span> ·{' '}
                  {counts.all} total
                </>
              ) : (
                `${counts.all} notifications`
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={Check} onClick={markAllRead}>
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" icon={Settings}>
              Preferences
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 py-3 border-b border-line-soft overflow-x-auto">
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'unread', label: 'Unread', count: counts.unread },
            { id: 'Inventory', label: 'Inventory', count: counts.Inventory },
            { id: 'Sales', label: 'Sales', count: counts.Sales },
            { id: 'AI Insight', label: 'AI Insights', count: counts['AI Insight'] },
            { id: 'Order', label: 'Orders', count: counts.Order },
            { id: 'System', label: 'System', count: counts.System },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors ${
                filter === t.id
                  ? 'bg-tooltip text-white'
                  : 'text-ink-soft hover:bg-surface hover:text-ink'
              }`}
            >
              {t.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold tabular-nums ${
                  filter === t.id ? 'bg-white/15 text-white' : 'bg-line text-ink-soft'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div>
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-success-soft flex items-center justify-center mb-3">
                <CheckCircle2 size={24} className="text-success-text" />
              </div>
              <p className="text-[14px] font-bold text-ink">You&apos;re all caught up.</p>
              <p className="text-[12.5px] text-ink-muted mt-1">
                No notifications matching this filter.
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={group}>
                  <div className="px-5 py-2 bg-surface-2 border-y border-line-soft flex items-center justify-between">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">
                      {group}
                    </span>
                    <span className="text-[10.5px] text-ink-muted tabular-nums">{list.length}</span>
                  </div>
                  <div className="divide-y divide-surface">
                    {list.map((n) => (
                      <NotificationItem
                        key={n.id}
                        n={n}
                        onToggleRead={toggleRead}
                        onDismiss={dismiss}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="space-y-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center">
              <Sparkles size={13} className="text-white" />
            </div>
            <p
              className="text-[13px] font-bold text-ink"
              style={{ fontFamily: 'Plus Jakarta Sans' }}
            >
              Today&apos;s digest
            </p>
          </div>
          <ul className="space-y-2.5 text-[12.5px]">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-danger mt-1.5 shrink-0" />
              <span className="text-ink">
                <span className="font-semibold">1 critical</span> inventory alert needs action
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
              <span className="text-ink">
                Daily target hit <span className="font-semibold tabular-nums">2h earlier</span> than
                usual
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span className="text-ink">
                <span className="font-semibold">2 AI insights</span> waiting for review
              </span>
            </li>
          </ul>
        </Card>

        <Card className="p-4">
          <p
            className="text-[13px] font-bold text-ink mb-3"
            style={{ fontFamily: 'Plus Jakarta Sans' }}
          >
            Delivery channels
          </p>
          <div className="space-y-2.5">
            <ChannelRow icon={Bell} label="In-app" enabled={true} />
            <ChannelRow icon={Mail} label="Email" enabled={true} />
            <ChannelRow icon={Phone} label="SMS" enabled={false} />
            <ChannelRow icon={Volume2} label="Push" enabled={true} />
          </div>
          <button className="mt-3 w-full h-8 rounded-lg bg-app hover:bg-line-soft text-[12px] font-semibold text-primary-text transition-colors">
            Configure channels
          </button>
        </Card>

        <Card className="p-4">
          <p
            className="text-[13px] font-bold text-ink mb-1.5"
            style={{ fontFamily: 'Plus Jakarta Sans' }}
          >
            Quiet hours
          </p>
          <p className="text-[11.5px] text-ink-muted mb-3">Suppress non-critical alerts</p>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-app">
            <span className="text-[12.5px] font-semibold text-ink tabular-nums">23:00 – 07:00</span>
            <Switch checked={true} onChange={() => {}} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <NotificationsView />
      </div>
    </div>
  );
}
