import React, { useState, useMemo, useEffect } from 'react';
import {
  UtensilsCrossed, TrendingUp, Tag, Layers,
  Search, Pencil, Trash2, Plus, Grid3X3, List, AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { fmtIDR, fmtIDRShort } from '../utils/formatCurrency';
import { getCategories, getMenuItems, setMenuItemAvailability } from '../lib/api';

const relTime = (iso) => {
  if (!iso) return '—';
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); }
  catch { return '—'; }
};

const MenuStat = ({ label, value, sub, icon: Icon, valueClass = '' }) => (
  <Card className="p-4 flex items-center gap-3">
    <div className="w-11 h-11 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
      <Icon size={18} className="text-primary-text" strokeWidth={2.2} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10.5px] font-semibold text-ink-soft uppercase tracking-wider">{label}</p>
      <p className={`text-[18px] font-bold text-ink tabular-nums leading-tight truncate ${valueClass}`} style={{ fontFamily: 'Plus Jakarta Sans' }}>{value}</p>
      <p className="text-[10.5px] text-ink-muted truncate">{sub}</p>
    </div>
  </Card>
);

const MenuView = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [cats, menu] = await Promise.all([getCategories(), getMenuItems()]);
        setCategories(cats);
        setItems(menu.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          emoji: m.emoji,
          available: m.is_available,
          catId: m.category_id,
          catLabel: m.category?.name ?? '—',
          updated: relTime(m.updated_at),
        })));
      } catch (e) {
        setError(e?.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleAvail = async (id) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const next = !item.available;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, available: next } : i))); // optimistic
    try {
      await setMenuItemAvailability(id, next);
    } catch {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, available: !next } : i))); // revert
    }
  };

  const catTabs = useMemo(
    () => [{ id: 'all', label: 'All items' }, ...categories.map((c) => ({ id: c.id, label: c.name }))],
    [categories],
  );

  const filtered = useMemo(() => {
    let res = activeCat === 'all' ? items : items.filter((i) => i.catId === activeCat);
    if (search) res = res.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return res;
  }, [items, activeCat, search]);

  const totalItems = items.length;
  const activeItems = items.filter((i) => i.available).length;
  const avgPrice = items.length ? Math.round(items.reduce((s, i) => s + i.price, 0) / items.length) : 0;

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="h-7 w-7 rounded-full border-2 border-line border-t-primary animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-danger-soft text-danger-text p-4 text-[13px]">
        <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MenuStat label="Total menu items" value={totalItems} sub={`${activeItems} available`} icon={UtensilsCrossed} />
        <MenuStat label="Available" value={activeItems} sub={`${totalItems - activeItems} hidden`} icon={Layers} />
        <MenuStat label="Categories" value={categories.length} sub={categories.map((c) => c.name).slice(0, 3).join(', ')} icon={Tag} />
        <MenuStat label="Avg price" value={fmtIDRShort(avgPrice)} sub="Across all items" icon={TrendingUp} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-line-soft flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto">
            {catTabs.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                className={`shrink-0 h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors ${
                  activeCat === cat.id ? 'bg-tooltip text-white' : 'bg-app text-ink-soft hover:bg-line-soft hover:text-ink'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu…"
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-app text-[12.5px] border border-transparent focus:outline-none focus:border-primary focus:bg-card transition-all" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-app rounded-lg p-0.5">
              <button onClick={() => setView('grid')}
                className={`w-8 h-7 rounded-md flex items-center justify-center transition-colors ${
                  view === 'grid' ? 'bg-card text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}><Grid3X3 size={14} strokeWidth={2.2} /></button>
              <button onClick={() => setView('list')}
                className={`w-8 h-7 rounded-md flex items-center justify-center transition-colors ${
                  view === 'list' ? 'bg-card text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}><List size={14} strokeWidth={2.2} /></button>
            </div>
            <Button variant="primary" size="sm" icon={Plus}>Add menu</Button>
          </div>
        </div>

        <div className="p-4">
          {filtered.length === 0 ? (
            <p className="text-center text-[13px] text-ink-muted py-10">No items match.</p>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map((item) => (
                <div key={item.id} className={`relative group bg-card border rounded-2xl p-3 transition-all hover:shadow-md ${
                  item.available ? 'border-line hover:border-primary' : 'border-line opacity-60'
                }`}>
                  <div className="relative aspect-square rounded-xl bg-gradient-to-br from-app to-primary-soft flex items-center justify-center text-5xl mb-3">
                    {item.emoji}
                    {!item.available && (
                      <div className="absolute inset-0 bg-[var(--c-scrim)] rounded-xl flex items-center justify-center">
                        <Badge tone="danger" dot>Unavailable</Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[12.5px] font-semibold text-ink line-clamp-2 leading-snug flex-1 min-h-[34px]">{item.name}</p>
                    <Switch checked={item.available} onChange={() => toggleAvail(item.id)} size="sm" />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-primary-text tabular-nums">{fmtIDRShort(item.price)}</p>
                    <span className="text-[10.5px] text-ink-muted">{item.catLabel}</span>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-surface text-[10.5px] text-ink-muted">
                    Updated {item.updated}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">
                  <th className="text-left py-2.5">Item</th>
                  <th className="text-left py-2.5">Category</th>
                  <th className="text-right py-2.5">Price</th>
                  <th className="text-center py-2.5">Available</th>
                  <th className="text-right py-2.5">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="text-[13px] hover:bg-surface-2 transition-colors border-t border-surface">
                    <td className="py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-app to-primary-soft flex items-center justify-center text-xl">
                        {item.emoji}
                      </div>
                      <span className="font-semibold text-ink">{item.name}</span>
                    </td>
                    <td className="py-3 text-ink-soft">{item.catLabel}</td>
                    <td className="py-3 text-right font-bold tabular-nums text-ink">{fmtIDR(item.price)}</td>
                    <td className="py-3">
                      <div className="flex justify-center"><Switch checked={item.available} onChange={() => toggleAvail(item.id)} /></div>
                    </td>
                    <td className="py-3 text-right text-ink-muted text-[12px]">{item.updated}</td>
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

export default function MenuPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1500px] mx-auto px-6 py-6">
        <MenuView />
      </div>
    </div>
  );
}
