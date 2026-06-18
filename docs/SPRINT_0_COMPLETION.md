# Sprint 0 Completion Report

**Branch:** `sprint0/typescript-foundation`
**Merged:** 2026-06-18
**PR:** #11
**Status:** ✅ Complete — all CI checks green, merged to `main`

---

## What Was Built

### PRE-Sprint 0: Restaurant → Retail Migration

Soft-deprecated all restaurant-specific UI before the TypeScript foundation was laid:

| Change | File(s) |
|---|---|
| Removed Kitchen Display page | `src/pages/Kitchen.jsx` deleted, router updated |
| Renamed Menu → Products | `src/pages/Products.jsx` (retail terminology) |
| Cashier: removed table/dine-in flow | `src/pages/Cashier.jsx` — no table selector, "New sale" |
| Orders: retail status labels | Open / Completed / Void (removed cooking/ready/done/paid) |
| Settings: removed kitchen role + service charge | `src/pages/Settings.jsx` |
| Nav: Kitchen removed, Menu→Products | `src/data/navGroups.js`, `src/data/routeMeta.js` |
| API: `getKitchenOrders` removed | `src/lib/api.js` |

### Milestone 1: TypeScript Foundation

- `tsconfig.json` — strict mode, `allowJs: true`, `checkJs: false` for incremental migration
- `src/types/supabase.ts` — full DB type definitions (all tables, enums, RPCs) from migration files
- `src/types/app.ts` — view model types (`PlaceOrderPayload`, `OrderRow`, `CartItem`, `AuthUser`, etc.)
- `src/types/index.ts` — barrel export
- Migrated `src/utils/cn.js` → `cn.ts`, `formatCurrency.js` → `formatCurrency.ts`, `formatTime.js` → `formatTime.ts`

### Milestone 2: Test Infrastructure

- Vitest + @testing-library/react + jsdom installed
- `src/test/setup.ts` — jest-dom matchers
- `vite.config.js` — test environment configured
- **17 tests across 3 files, all passing:**
  - `src/utils/formatCurrency.test.ts` — 7 tests
  - `src/utils/formatTime.test.ts` — 5 tests
  - `src/lib/placeOrder.test.ts` — 5 payload shape tests

### Milestone 3: Linting & Formatting

- `eslint.config.js` — ESLint v9 flat config (TypeScript + React + React Hooks plugins)
- `.prettierrc` — singleQuote, trailingComma: all, printWidth: 100
- `.prettierignore`
- `.npmrc` — `legacy-peer-deps=true` (required: eslint@9/eslint@10 peer dep conflict)
- Fixed all lint errors across codebase (0 warnings threshold enforced)

### Milestone 4: Git Hooks

- Husky installed, `.husky/pre-commit` configured
- lint-staged in `package.json` — runs ESLint + Prettier on staged files only

### Milestone 5: CI Pipeline

- `.github/workflows/ci.yml` — GitHub Actions on push/PR to main and develop
- Steps: `npm ci --legacy-peer-deps` → lint → type-check → test → build
- All checks passed on merge

### Docs & Ops

- `docs/environment-strategy.md` — local/staging/production Supabase + Vercel runbook
- `docs/migrations/DATABASE_BACKUP_PLAN.md` — pre-migration backup procedures
- `docs/migrations/ROLLBACK_PLAN.md` — per-migration rollback SQL
- `BASELINE_STATUS.md` — Sprint 0 authorization gate (archived)
- `.env.example` — updated with Midtrans + app env vars
- `.gitignore` — `.env.staging` added

---

## New npm Scripts

```json
"type-check":    "tsc --noEmit",
"lint":          "eslint src --max-warnings 0",
"lint:fix":      "eslint src --fix",
"format":        "prettier --write src",
"format:check":  "prettier --check src",
"test":          "vitest run",
"test:watch":    "vitest",
"test:coverage": "vitest run --coverage"
```

---

## Open Items for Sprint 1

### P0 Stage 1 Blockers (semantic bug — `status='paid'`)

These were audited in Sprint 0 but execution deferred to Sprint 1:

1. **Webhook Edge Function** (`supabase/functions/payments-midtrans-webhook/index.ts` line ~53):
   ```ts
   // WRONG: status: "paid"
   // CORRECT: payment_status: "paid"
   ```
2. **`advance_order_status` RPC** — add guard rejecting `p_to = 'paid'` (paid is not an `order_status`)

### P1 Sprint 1 Work

- Supabase migration `0006` — retail schema (`products`, `categories`, `inventory`, `transactions`, `transaction_items`) with RLS
- Updated `src/types/supabase.ts` from new schema
- Wire Dashboard KPI cards to `get_dashboard_summary` RPC (replace mock data)
- Wire Inventory page to live `inventory` table
