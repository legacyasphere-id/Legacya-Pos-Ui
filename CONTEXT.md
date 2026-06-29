# Legacya POS — Project Context

This file is the project brain for AI-assisted development. Read it before making any changes.

---

## What this project is

A production-quality retail Point of Sale system built with React 18 + Supabase. It is live, not a portfolio demo. Customers depend on it. Every commit must leave CI green and must not break existing behavior.

**Live URL:** https://legacya-pos-ui-129q.vercel.app  
**Repo:** https://github.com/legacyasphere-id/Legacya-Pos-Ui  
**Supabase project:** `dlizxnlwhnbargobvzmi`

---

## Stack

| Concern | Choice |
|---|---|
| UI | React 18 + Vite 5 |
| Language | TypeScript strict — `tsc --noEmit` must pass |
| Styling | Tailwind CSS utility classes only |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth — `public.profiles` stores `role` |
| State | Zustand stores in `src/store/` |
| Routing | React Router v6 |
| Testing | Vitest + React Testing Library |
| CI | GitHub Actions → lint → type-check → test → build |

---

## Repository layout

```
src/
  pages/           # One file per route. TypeScript preferred, JSX legacy files still exist.
  components/
    layout/        # DashboardShell, Sidebar, Topbar
    tour/          # TourProvider, TourTooltip — onboarding tour system
    ui/            # Headless UI primitives
  services/        # productService, inventoryService, transactionService
    __tests__/     # Unit tests for service layer
  hooks/           # useTour, and other shared hooks
  store/           # Zustand: auth.store, ui.store, notifications.store
  types/           # supabase.ts (generated), app.ts (domain types)
  data/            # navGroups, tokens — static config
  utils/           # formatCurrency, formatTime, cn
supabase/
  migrations/      # SQL migrations — never drop without a rollback plan
docs/              # Architecture decisions, sprint notes
artifacts/         # Legacy UI reference screens — do not import from here
```

---

## Database conventions

All retail tables live in `public` with RLS enabled:

| Table | Purpose |
|---|---|
| `product_category` | Catalog categories |
| `product` | SKU, barcode, price, cost, `tracks_inventory` flag |
| `inventory` | `qty_on_hand`, `qty_reserved`, `reorder_point` |
| `inventory_movement` | Append-only ledger — never UPDATE, only INSERT |
| `transaction` | Retail sales header (`TXN-YYYYMMDD-NNNN`) |
| `transaction_item` | Line items with price/name snapshot at sale time |
| `store_settings` | Single-row config: `tax_rate_bps`, store name, receipt |
| `discount` | Named discounts with percentage or flat amount |

**Inventory movement kinds:** `sale | return | purchase | adjustment | waste` — not `restock`.

**Critical RPCs:**
- `retail_checkout(items, discount_id?, notes?)` — atomic: inserts transaction + items + adjusts stock. Never replicate this logic in the UI.
- `retail_adjust_stock(product_id, delta, kind, notes?)` — atomic: updates `inventory.qty_on_hand` + inserts `inventory_movement`.

---

## Service layer rules

Pages call service methods. Pages never call `supabase.from()` directly (except where no service method exists yet — fix that when you touch the file).

```
productService      → product_category, product
inventoryService    → inventory, inventory_movement  
transactionService  → transaction, transaction_item, discount, retail_checkout RPC
```

Services return typed domain objects. Supabase join results require `as unknown as TargetType` double-cast when TypeScript can't infer the shape.

---

## Auth and roles

```typescript
// auth.store.ts
profile: {
  id: string;
  full_name: string;
  email: string;
  role: 'owner' | 'cashier' | 'kitchen';
  avatar_url: string | null;
} | null
```

Role checks happen at two levels:
1. Database: RLS policies read `auth.jwt() ->> 'role'`
2. UI: component-level guard via `profile?.role === 'owner'`

Never gate database writes behind UI-only checks. The database is the source of truth.

---

## Onboarding tour system

`TourProvider` wraps `DashboardShell`. It auto-starts once for owners when `legacya_pos_tour_completed` is absent from localStorage.

**Anchor registration pattern:** components register their own DOM nodes:
```typescript
const { registerAnchor } = useTour();
useEffect(() => {
  registerAnchor('dashboard-stats', ref.current);
  return () => registerAnchor('dashboard-stats', null);
}, [registerAnchor]);
```

Tour step IDs: `sidebar-nav`, `dashboard-stats`, `products-nav`, `inventory-nav`, `cashier-nav`, `settings-nav`.

Both `skip()` and `complete()` write `legacya_pos_tour_completed = 'true'` to localStorage and set `active = false`.

---

## TypeScript rules

- Strict mode. No `any` without a `// eslint-disable` comment explaining why.
- Cast Supabase join results with `as unknown as TargetType` — not `as TargetType`.
- `react-hooks/set-state-in-effect` — the ESLint disable comment must go **inside** the effect callback body, one line before the flagged `setState` call.
- All browser globals (`localStorage`, `HTMLElement`, `DOMRect`, `requestAnimationFrame`, etc.) are declared in `eslint.config.js` globals for `**/*.{ts,tsx}`.

---

## Testing conventions

- Tests live next to the code they test: `src/services/__tests__/`, `src/components/tour/__tests__/`.
- Mock Supabase with `vi.mock('../../lib/supabase')` — never hit the real database in tests.
- Mock the auth store with `vi.mock('../../../store/auth.store')` when role matters.
- 97 tests must pass before any merge.

```bash
npm test           # run all tests
npm run type-check # tsc --noEmit
npm run lint       # zero warnings
npm run build      # must succeed
```

---

## Hard rules

1. **CI must be green before merge to `main`.** No exceptions.
2. **Never DROP TABLE without a written rollback plan** in `docs/migrations/`.
3. **Never bypass git hooks** (`--no-verify`). Fix the underlying issue instead.
4. **Never write to `inventory_movement` except via `retail_adjust_stock` RPC.**
5. **`retail_checkout` is the only valid checkout path.** Do not replicate its logic in client code.
6. **TypeScript strict.** `tsc --noEmit` must pass on every commit.

---

## Active branch

Development happens on `claude/checks-ym1j5v`. PR: https://github.com/legacyasphere-id/Legacya-Pos-Ui/pull/13

---

## Built by

Yoga Pratama Effendi — [Legacya Sphere](https://github.com/legacyasphere-id)
