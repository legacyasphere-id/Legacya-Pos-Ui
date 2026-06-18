import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Package,
  TrendingUp,
  Tag,
  Layers,
  Search,
  Plus,
  Grid3X3,
  List,
  AlertCircle,
  X,
  Pencil,
  Archive,
  ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { fmtIDR, fmtIDRShort } from '../utils/formatCurrency';
import {
  productService,
  type ProductWithCategory,
  type ProductCategory,
  type ProductInsert,
  type ProductUpdate,
} from '../services/productService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const relTime = (iso: string | null): string => {
  if (!iso) return '—';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '—';
  }
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatProps {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  valueClass?: string;
}

const ProductStat: React.FC<StatProps> = ({ label, value, sub, icon: Icon, valueClass = '' }) => (
  <Card className="p-4 flex items-center gap-3">
    <div className="w-11 h-11 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
      <Icon size={18} className="text-primary-text" strokeWidth={2.2} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10.5px] font-semibold text-ink-soft uppercase tracking-wider">{label}</p>
      <p
        className={`text-[18px] font-bold text-ink tabular-nums leading-tight truncate ${valueClass}`}
        style={{ fontFamily: 'Plus Jakarta Sans' }}
      >
        {value}
      </p>
      <p className="text-[10.5px] text-ink-muted truncate">{sub}</p>
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// ProductDrawer — create / edit slide panel
// ---------------------------------------------------------------------------

interface DrawerProps {
  open: boolean;
  product: ProductWithCategory | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSaved: () => void;
}

type DrawerForm = {
  name: string;
  price: number;
  cost_price: number | undefined;
  description: string | null;
  emoji: string | null;
  sku: string | null;
  barcode: string | null;
  category_id: string | null;
  is_available: boolean;
  track_inventory: boolean;
};

const EMPTY_FORM: DrawerForm = {
  name: '',
  price: 0,
  cost_price: undefined,
  description: null,
  emoji: null,
  sku: null,
  barcode: null,
  category_id: null,
  is_available: true,
  track_inventory: false,
};

const ProductDrawer: React.FC<DrawerProps> = ({ open, product, categories, onClose, onSaved }) => {
  const [form, setForm] = useState<DrawerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('');
      setSaving(false);
      if (product) {
        setForm({
          name: product.name,
          price: product.price,
          cost_price: product.cost_price ?? undefined,
          description: product.description,
          emoji: product.emoji,
          sku: product.sku,
          barcode: product.barcode,
          category_id: product.category_id,
          is_available: product.is_available,
          track_inventory: product.track_inventory,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, product]);

  const set = <K extends keyof DrawerForm>(k: K, v: DrawerForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) {
      setError('Product name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: ProductInsert | ProductUpdate = {
        name: form.name,
        price: form.price,
        cost_price: form.cost_price,
        description: form.description,
        emoji: form.emoji,
        sku: form.sku,
        barcode: form.barcode,
        category_id: form.category_id,
        is_available: form.is_available,
        track_inventory: form.track_inventory,
      };
      if (product) {
        await productService.updateProduct(product.id, payload as ProductUpdate);
      } else {
        await productService.createProduct(payload as ProductInsert);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void save();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-[var(--c-scrim)] z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-card shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-[15px] font-bold text-ink">
            {product ? 'Edit product' : 'New product'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:bg-surface hover:text-ink transition-colors"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-danger-soft text-danger-text p-3 text-[12.5px]">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Product name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Kopi Susu"
                required
              />
            </div>
            <div className="w-20">
              <label className="block text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                Emoji
              </label>
              <input
                type="text"
                value={form.emoji ?? ''}
                onChange={(e) => set('emoji', e.target.value || null)}
                placeholder="☕"
                maxLength={2}
                className="w-full h-10 px-3 rounded-lg bg-card border border-line text-[20px] text-center focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <Textarea
            label="Description"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value || null)}
            placeholder="Optional product description…"
            rows={2}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price (Rp)"
              type="number"
              min={0}
              step={500}
              value={form.price}
              onChange={(e) => set('price', Number(e.target.value))}
              required
            />
            <Input
              label="Cost price (Rp)"
              type="number"
              min={0}
              step={500}
              value={form.cost_price ?? ''}
              onChange={(e) =>
                set('cost_price', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="relative">
              <select
                value={form.category_id ?? ''}
                onChange={(e) => set('category_id', e.target.value || null)}
                className="w-full h-10 pl-3.5 pr-8 rounded-lg bg-card border border-line text-[13.5px] text-ink appearance-none focus:outline-none focus:border-primary transition-all"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU"
              value={form.sku ?? ''}
              onChange={(e) => set('sku', e.target.value || null)}
              placeholder="KS-001"
            />
            <Input
              label="Barcode"
              value={form.barcode ?? ''}
              onChange={(e) => set('barcode', e.target.value || null)}
              placeholder="8991234567890"
            />
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-ink">Available for sale</p>
                <p className="text-[11.5px] text-ink-muted">Show this product on the cashier</p>
              </div>
              <Switch checked={form.is_available} onChange={(v) => set('is_available', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-ink">Track inventory</p>
                <p className="text-[11.5px] text-ink-muted">
                  Enable stock tracking for this product
                </p>
              </div>
              <Switch checked={form.track_inventory} onChange={(v) => set('track_inventory', v)} />
            </div>
          </div>
        </form>

        <div className="px-5 py-4 border-t border-line flex gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => void save()}
            type="button"
            disabled={saving}
          >
            {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// ArchiveDialog — confirmation modal
// ---------------------------------------------------------------------------

interface ArchiveDialogProps {
  product: ProductWithCategory | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ArchiveDialog: React.FC<ArchiveDialogProps> = ({ product, onConfirm, onCancel }) => {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--c-scrim)]" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4 z-10">
        <div className="w-12 h-12 rounded-2xl bg-warning-soft flex items-center justify-center">
          <Archive size={22} className="text-warning-text" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-ink">Archive product?</h3>
          <p className="mt-1 text-[13px] text-ink-soft">
            <span className="font-semibold text-ink">{product.name}</span> will be hidden from the
            cashier and product lists. You can restore it anytime from the archived view.
          </p>
        </div>
        <div className="flex gap-2.5 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>
            Archive
          </Button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Products view
// ---------------------------------------------------------------------------

const ProductsView: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductWithCategory | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ProductWithCategory | null>(null);

  const load = useCallback(async () => {
    try {
      const [cats, prods] = await Promise.all([
        productService.getProductCategories(),
        productService.getProducts({ archived: false }),
      ]);
      setCategories(cats);
      setProducts(prods);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const toggleAvailable = async (product: ProductWithCategory) => {
    const next = !product.is_available;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_available: next } : p)),
    );
    try {
      await productService.updateProduct(product.id, { is_available: next });
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_available: !next } : p)),
      );
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setDrawerOpen(true);
  };
  const openEdit = (p: ProductWithCategory) => {
    setEditTarget(p);
    setDrawerOpen(true);
  };
  const closeDrawer = () => setDrawerOpen(false);

  const handleSaved = async () => {
    closeDrawer();
    setLoading(true);
    await load();
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    try {
      await productService.archiveProduct(archiveTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== archiveTarget.id));
    } catch {
      /* noop */
    }
    setArchiveTarget(null);
  };

  const catTabs = useMemo(
    () => [
      { id: 'all', label: 'All products' },
      ...categories.map((c) => ({ id: c.id, label: c.name })),
    ],
    [categories],
  );

  const filtered = useMemo(() => {
    let res = activeCat === 'all' ? products : products.filter((p) => p.category_id === activeCat);
    if (search) res = res.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return res;
  }, [products, activeCat, search]);

  const totalProducts = products.length;
  const availableCount = products.filter((p) => p.is_available).length;
  const avgPrice = products.length
    ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length)
    : 0;

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
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ProductStat
            label="Total products"
            value={totalProducts}
            sub={`${availableCount} available`}
            icon={Package}
          />
          <ProductStat
            label="Available"
            value={availableCount}
            sub={`${totalProducts - availableCount} hidden`}
            icon={Layers}
          />
          <ProductStat
            label="Categories"
            value={categories.length}
            sub={
              categories
                .map((c) => c.name)
                .slice(0, 3)
                .join(', ') || 'None yet'
            }
            icon={Tag}
          />
          <ProductStat
            label="Avg price"
            value={fmtIDRShort(avgPrice)}
            sub="Across all products"
            icon={TrendingUp}
          />
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-line-soft flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto">
              {catTabs.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`shrink-0 h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors ${
                    activeCat === cat.id
                      ? 'bg-tooltip text-white'
                      : 'bg-app text-ink-soft hover:bg-line-soft hover:text-ink'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full h-8 pl-9 pr-3 rounded-lg bg-app text-[12.5px] border border-transparent focus:outline-none focus:border-primary focus:bg-card transition-all"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-app rounded-lg p-0.5">
                <button
                  onClick={() => setView('grid')}
                  className={`w-8 h-7 rounded-md flex items-center justify-center transition-colors ${view === 'grid' ? 'bg-card text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
                >
                  <Grid3X3 size={14} strokeWidth={2.2} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`w-8 h-7 rounded-md flex items-center justify-center transition-colors ${view === 'list' ? 'bg-card text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
                >
                  <List size={14} strokeWidth={2.2} />
                </button>
              </div>
              <Button variant="primary" size="sm" icon={Plus} onClick={openCreate}>
                Add product
              </Button>
            </div>
          </div>

          <div className="p-4">
            {filtered.length === 0 ? (
              <div className="text-center py-14">
                <Package
                  size={32}
                  className="mx-auto mb-3 text-ink-muted opacity-40"
                  strokeWidth={1.5}
                />
                <p className="text-[13px] text-ink-muted">No products match.</p>
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map((product) => (
                  <div
                    key={product.id}
                    className={`relative group bg-card border rounded-2xl p-3 transition-all hover:shadow-md ${
                      product.is_available
                        ? 'border-line hover:border-primary'
                        : 'border-line opacity-60'
                    }`}
                  >
                    <div className="relative aspect-square rounded-xl bg-gradient-to-br from-app to-primary-soft flex items-center justify-center text-5xl mb-3">
                      {product.emoji ?? '📦'}
                      {!product.is_available && (
                        <div className="absolute inset-0 bg-[var(--c-scrim)] rounded-xl flex items-center justify-center">
                          <Badge tone="danger" dot>
                            Unavailable
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-1">
                      <p className="text-[12.5px] font-semibold text-ink line-clamp-2 leading-snug flex-1 min-h-[34px]">
                        {product.name}
                      </p>
                      <Switch
                        checked={product.is_available}
                        onChange={() => void toggleAvailable(product)}
                        size="sm"
                      />
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[13px] font-bold text-primary-text tabular-nums">
                        {fmtIDRShort(product.price)}
                      </p>
                      <span className="text-[10.5px] text-ink-muted">
                        {product.product_category?.name ?? '—'}
                      </span>
                    </div>

                    <div className="mt-1.5 pt-1.5 border-t border-surface text-[10.5px] text-ink-muted flex items-center justify-between">
                      <span>{relTime(product.updated_at)}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(product)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-line-soft text-ink-muted hover:text-ink transition-colors"
                        >
                          <Pencil size={11} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => setArchiveTarget(product)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-warning-soft text-ink-muted hover:text-warning-text transition-colors"
                        >
                          <Archive size={11} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">
                    <th className="text-left py-2.5">Product</th>
                    <th className="text-left py-2.5">Category</th>
                    <th className="text-right py-2.5">Price</th>
                    <th className="text-center py-2.5">Available</th>
                    <th className="text-right py-2.5">Updated</th>
                    <th className="py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="text-[13px] hover:bg-surface-2 transition-colors border-t border-surface group"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-app to-primary-soft flex items-center justify-center text-xl shrink-0">
                            {product.emoji ?? '📦'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink truncate">{product.name}</p>
                            {product.sku && (
                              <p className="text-[11px] text-ink-muted">{product.sku}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-ink-soft">
                        {product.product_category?.name ?? '—'}
                      </td>
                      <td className="py-3 text-right font-bold tabular-nums text-ink">
                        {fmtIDR(product.price)}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-center">
                          <Switch
                            checked={product.is_available}
                            onChange={() => void toggleAvailable(product)}
                          />
                        </div>
                      </td>
                      <td className="py-3 text-right text-ink-muted text-[12px]">
                        {relTime(product.updated_at)}
                      </td>
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(product)}
                            className="w-7 h-7 rounded flex items-center justify-center hover:bg-line-soft text-ink-muted hover:text-ink transition-colors"
                          >
                            <Pencil size={13} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => setArchiveTarget(product)}
                            className="w-7 h-7 rounded flex items-center justify-center hover:bg-warning-soft text-ink-muted hover:text-warning-text transition-colors"
                          >
                            <Archive size={13} strokeWidth={2.5} />
                          </button>
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

      <ProductDrawer
        open={drawerOpen}
        product={editTarget}
        categories={categories}
        onClose={closeDrawer}
        onSaved={() => void handleSaved()}
      />

      <ArchiveDialog
        product={archiveTarget}
        onConfirm={() => void handleArchiveConfirm()}
        onCancel={() => setArchiveTarget(null)}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function ProductsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1500px] mx-auto px-6 py-6">
        <ProductsView />
      </div>
    </div>
  );
}
