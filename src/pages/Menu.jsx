import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed, TrendingUp, Star, Tag,
  Search, Pencil, Trash2, Plus, Grid3X3, List,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { fmtIDR, fmtIDRShort } from '../utils/formatCurrency';

const menuCategories = [
  { id:'all',   label:'All items' },
  { id:'rice',  label:'Rice Bowl' },
  { id:'sushi', label:'Sushi' },
  { id:'main',  label:'Mains' },
  { id:'bev',   label:'Beverages' },
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

const MenuStat = ({ label, value, sub, icon:Icon, valueClass='' }) => (
  <Card className="p-4 flex items-center gap-3">
    <div className="w-11 h-11 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
      <Icon size={18} className="text-primary-text" strokeWidth={2.2}/>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10.5px] font-semibold text-ink-soft uppercase tracking-wider">{label}</p>
      <p className={`text-[18px] font-bold text-ink tabular-nums leading-tight truncate ${valueClass}`} style={{ fontFamily:'Plus Jakarta Sans' }}>{value}</p>
      <p className="text-[10.5px] text-ink-muted truncate">{sub}</p>
    </div>
  </Card>
);

const MenuView = () => {
  const [items, setItems]       = useState(menuItemsData);
  const [activeCat, setActiveCat] = useState('all');
  const [view, setView]         = useState('grid');
  const [search, setSearch]     = useState('');

  const toggleAvail = (id) => setItems(prev => prev.map(i => i.id===id ? { ...i, available:!i.available } : i));

  const filtered = useMemo(() => {
    let res = activeCat==='all' ? items : items.filter(i => i.cat===activeCat);
    if (search) res = res.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    return res;
  }, [items, activeCat, search]);

  const totalItems  = items.length;
  const activeItems = items.filter(i => i.available).length;
  const avgPrice    = Math.round(items.reduce((s, i) => s + i.price, 0) / items.length);
  const topSeller   = [...items].sort((a, b) => b.soldToday - a.soldToday)[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MenuStat label="Total menu items" value={totalItems}           sub={`${activeItems} available`}                         icon={UtensilsCrossed}/>
        <MenuStat label="Categories"       value="4"                    sub="Rice, Sushi, Main, Bev"                             icon={Tag}/>
        <MenuStat label="Avg price"        value={fmtIDRShort(avgPrice)} sub="Range Rp 12–95K"                                  icon={TrendingUp}/>
        <MenuStat label="Top seller today" value={topSeller.name}       sub={`${topSeller.soldToday} sold · ⭐ ${topSeller.rating}`} icon={Star} valueClass="text-[14px] leading-tight"/>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-line-soft flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto">
            {menuCategories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                className={`shrink-0 h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors ${
                  activeCat===cat.id ? 'bg-tooltip text-white' : 'bg-app text-ink-soft hover:bg-line-soft hover:text-ink'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search menu…"
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-app text-[12.5px] border border-transparent focus:outline-none focus:border-primary focus:bg-card transition-all"/>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-app rounded-lg p-0.5">
              <button onClick={() => setView('grid')}
                className={`w-8 h-7 rounded-md flex items-center justify-center transition-colors ${
                  view==='grid' ? 'bg-card text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}><Grid3X3 size={14} strokeWidth={2.2}/></button>
              <button onClick={() => setView('list')}
                className={`w-8 h-7 rounded-md flex items-center justify-center transition-colors ${
                  view==='list' ? 'bg-card text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}><List size={14} strokeWidth={2.2}/></button>
            </div>
            <Button variant="primary" size="sm" icon={Plus}>Add menu</Button>
          </div>
        </div>

        <div className="p-4">
          {view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(item => (
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
                    <div className="absolute inset-x-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex-1 h-7 rounded-md bg-card backdrop-blur text-ink text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-card">
                        <Pencil size={11}/> Edit
                      </button>
                      <button className="w-7 h-7 rounded-md bg-card backdrop-blur text-danger flex items-center justify-center hover:bg-card">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[12.5px] font-semibold text-ink line-clamp-2 leading-snug flex-1 min-h-[34px]">{item.name}</p>
                    <Switch checked={item.available} onChange={() => toggleAvail(item.id)} size="sm"/>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-primary-text tabular-nums">{fmtIDRShort(item.price)}</p>
                    <div className="flex items-center gap-1 text-[10.5px] text-ink-muted">
                      <Star size={10} className="fill-warning text-warning"/>
                      <span className="font-semibold tabular-nums">{item.rating}</span>
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-surface flex items-center justify-between text-[10.5px] text-ink-muted">
                    <span className="tabular-nums">{item.soldToday} sold today</span>
                    <span>{item.updated}</span>
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
                  <th className="text-right py-2.5">Sold today</th>
                  <th className="text-right py-2.5">Rating</th>
                  <th className="text-center py-2.5">Available</th>
                  <th className="text-right py-2.5">Updated</th>
                  <th className="text-right py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="text-[13px] hover:bg-surface-2 transition-colors border-t border-surface">
                    <td className="py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-app to-primary-soft flex items-center justify-center text-xl">
                        {item.emoji}
                      </div>
                      <span className="font-semibold text-ink">{item.name}</span>
                    </td>
                    <td className="py-3 text-ink-soft">{item.catLabel}</td>
                    <td className="py-3 text-right font-bold tabular-nums text-ink">{fmtIDR(item.price)}</td>
                    <td className="py-3 text-right tabular-nums text-ink-soft">{item.soldToday}</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[12.5px]">
                        <Star size={11} className="fill-warning text-warning"/>
                        <span className="font-semibold tabular-nums">{item.rating}</span>
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-center"><Switch checked={item.available} onChange={() => toggleAvail(item.id)}/></div>
                    </td>
                    <td className="py-3 text-right text-ink-muted text-[12px]">{item.updated}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button className="w-7 h-7 rounded-md hover:bg-surface flex items-center justify-center text-ink-soft"><Pencil size={13}/></button>
                        <button className="w-7 h-7 rounded-md hover:bg-danger-soft flex items-center justify-center text-ink-muted hover:text-danger transition-colors"><Trash2 size={13}/></button>
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

export default function MenuPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1500px] mx-auto px-6 py-6">
        <MenuView />
      </div>
    </div>
  );
}
