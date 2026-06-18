# BASELINE_STATUS — Pre-Sprint 0 Authorization Gate
Generated: 2026-06-18  
Branch: sprint0/typescript-foundation  
Tag: pre-sprint0-cleanup  

---

## 1. Build Status

| Check | Result |
|---|---|
| Command | `npm run build` |
| Tool | Vite 5.4.21 |
| Exit code | 0 (success) |
| Modules transformed | 2,691 |
| CSS output | `dist/assets/index-Bgmn4XeQ.css` — 43.29 kB (8.19 kB gzip) |
| JS output | `dist/assets/index-CNnC5CGS.js` — 1,015.03 kB (278.34 kB gzip) |
| Build time | 11.14s |
| Warnings | Chunk size > 500 kB (Vite default threshold, not a failure) |
| **Status** | ✅ PASS |

---

## 2. Deployment Status

| Environment | Status | Notes |
|---|---|---|
| Local dev | ✅ Builds successfully | `npm run build` passes |
| Vercel | ⚠️ Not yet connected | Vercel project not linked — Sprint 0 task |
| Staging Supabase | ⚠️ Not yet created | `legacyapos-staging` project pending — Sprint 0 task |
| Production Supabase | ✅ Exists | Live project with 5 migrations applied |

---

## 3. Dependency List

### Runtime Dependencies (`dependencies`)
| Package | Version |
|---|---|
| `@supabase/supabase-js` | ^2.45.0 |
| `clsx` | ^2.1.0 |
| `date-fns` | ^3.6.0 |
| `lucide-react` | ^0.383.0 |
| `react` | ^18.2.0 |
| `react-dom` | ^18.2.0 |
| `react-router-dom` | ^6.22.0 |
| `recharts` | ^2.12.0 |
| `zustand` | ^4.5.0 |

### Dev Dependencies (`devDependencies`)
| Package | Version |
|---|---|
| `@types/react` | ^18.2.0 |
| `@types/react-dom` | ^18.2.0 |
| `@vitejs/plugin-react` | ^4.2.0 |
| `autoprefixer` | ^10.4.19 |
| `playwright` | ^1.60.0 |
| `postcss` | ^8.4.38 |
| `tailwindcss` | ^3.4.3 |
| `vite` | ^5.2.0 |

**Missing (Sprint 0 tasks):**
- `typescript` — not yet installed
- `eslint` + plugins — not yet installed
- `prettier` — not yet installed
- `vitest` + `@testing-library/react` — not yet installed
- `husky` + `lint-staged` — not yet installed

---

## 4. Lint Status

| Check | Result |
|---|---|
| ESLint | ⚠️ Not configured — no `lint` script in package.json |
| Prettier | ⚠️ Not configured |
| TypeScript type-check | ⚠️ Not configured — no `tsconfig.json` |
| **Status** | ⚠️ NOT YET SET UP — Sprint 0 deliverable |

---

## 5. Route Inventory

All routes defined in `src/router.jsx`:

| Path | Component | Auth Required | Notes |
|---|---|---|---|
| `/` | Redirect → `/dashboard` | No | Root redirect |
| `/login` | `LoginPage` | No | Public |
| `/dashboard` | `DashboardPage` | Yes | Owner overview (mock data) |
| `/cashier` | `CashierPage` | Yes | Retail POS — wired to Supabase |
| `/orders` | `OrdersPage` | Yes | Order list — wired to Supabase |
| `/analytics` | `AnalyticsPage` | Yes | 100% mock data |
| `/inventory` | `InventoryPage` | Yes | 100% mock data |
| `/products` | `ProductsPage` | Yes | Wired to Supabase (formerly /menu) |
| `/notifications` | `NotificationsPage` | Yes | Mock data (mockNotifications.js) |
| `/settings` | `SettingsPage` | Yes | Local state only, no save |

**Removed routes (PRE-Sprint 0):**
- `/kitchen` — deleted (Kitchen module removed)
- `/menu` — replaced by `/products`

---

## Authorization Gate Checks

| # | Check | Result | Detail |
|---|---|---|---|
| 1 | Branch created | ✅ PASS | `sprint0/typescript-foundation` |
| 2 | Tag applied | ✅ PASS | `pre-sprint0-cleanup` at commit `928e5d2` |
| 3 | Build passes | ✅ PASS | `npm run build` exits 0, 2691 modules |
| 4 | No Kitchen references in routes/nav | ✅ PASS | `/kitchen` route gone, `ChefHat` removed from nav |
| 5 | Kitchen refs in non-route files | ⚠️ NOTE | 3 residual refs in `mockNotifications.js` (copy text), `api.js` (comment + `getKitchenOrders` function), `Dashboard.jsx` ("Pending Kitchen" stat label). None are routes or navigation — all are mock data or dormant API functions. Not blockers. |
| 6 | `/products` route exists | ✅ PASS | `{ path: '/products', element: <ProductsPage /> }` confirmed |
| 7 | All 5 pre-sprint0 commits present | ✅ PASS | See commit log below |

### 5 PRE-Sprint 0 Commits (git log)
```
928e5d2  feat: retail settings cleanup
ef8e2a2  feat: simplify retail order workflow
9374add  feat: retail cashier workflow cleanup
06772d6  feat: replace menu module with products module
311c178  feat: remove restaurant kitchen module
```

---

## Gate Decision

**PASS with 1 note.**

All 5 hard checks pass. Sprint 0 TypeScript migration is authorized to begin.

Note to resolve in Sprint 0 (not blockers):
- `getKitchenOrders()` in `api.js` — dead code, remove when api.js is migrated to TypeScript
- `"Pending Kitchen"` label in `Dashboard.jsx` — relabel when Dashboard is wired to real data (Stage 3)
- Kitchen copy in `mockNotifications.js` — clean up when Notifications module is wired to Supabase (Stage post-5)
