# Legacya POS

> Retail Point-of-Sale SaaS — built by [Legacya Sphere](https://github.com/legacyasphere-id)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-Ready-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white&style=flat-square)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel&logoColor=white&style=flat-square)](https://legacya-pos-ui.vercel.app)
[![CI](https://img.shields.io/github/actions/workflow/status/legacyasphere-id/Legacya-Pos-Ui/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/legacyasphere-id/Legacya-Pos-Ui/actions)

**[Live Demo →](https://legacya-pos-ui.vercel.app)**

---

## What This Is

Legacya POS is a production-grade **General Retail POS SaaS** — not a mockup, not a portfolio demo. It is being built as a real, deployable product by Legacya Sphere studio.

The system handles the full retail transaction lifecycle: product catalog, inventory tracking, cashier checkout, and reporting — across multiple user roles with proper auth and RLS.

---

## Current Status

| Sprint | Focus | Status |
|---|---|---|
| Pre-Sprint 0 | Database backup, rollback plan, soft-deprecation | ✅ Done |
| Sprint 0 | TypeScript strict, CI/CD, ESLint, Vitest, Husky | ✅ Done |
| Sprint 1 | Retail schema (DB), ProductService, TransactionService | 🔄 In Progress |
| Sprint 2 | POS cashier UI → live data, product management screens | Planned |
| Sprint 3 | Inventory management, reporting, analytics | Planned |

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| UI | React 18 + Vite | TypeScript strict mode |
| Styling | Tailwind CSS | Utility-first, no component library bloat |
| Database | Supabase (PostgreSQL) | Row-Level Security on all tables |
| Auth | Supabase Auth | Multi-role: owner, manager, cashier |
| Deploy | Vercel | Auto-deploy on push to `main` |
| CI | GitHub Actions | lint → type-check → test → build |
| Testing | Vitest + jest-dom | 17+ tests, must stay green |

---

## User Roles

| Role | Access |
|---|---|
| **Owner** | Full access — products, inventory, reports, settings |
| **Manager** | Products, inventory, transactions, reports |
| **Cashier** | POS checkout, view transactions |

---

## Data Model (Sprint 1)

### Retail Tables (live on Supabase)
```
product_category    → product catalog categories
product             → SKU, barcode, price, cost, inventory flag
inventory           → qty_on_hand, qty_reserved, reorder_point
inventory_movement  → append-only ledger (sale/purchase/adjustment/waste)
transaction         → retail sales (TXN-YYYYMMDD-NNNN format)
transaction_item    → line items with price/name snapshot at time of sale
```

All tables have Row-Level Security enabled. Inventory movements are written via `SECURITY DEFINER` functions only — no direct authenticated inserts.

### Legacy Tables (soft-deprecated)
```
category    → replaced by product_category
menu_item   → replaced by product
ingredient  → replaced by inventory
order       → replaced by transaction
order_item  → replaced by transaction_item
```
Legacy tables are retained until data migration is verified. Drop only after full transition.

---

## Project Structure

```
legacya-pos-ui/
├── .github/workflows/     # CI pipeline (lint, type-check, test, build)
├── docs/
│   ├── migrations/        # DATABASE_BACKUP_PLAN.md, ROLLBACK_PLAN.md
│   ├── SPRINT_0_COMPLETION.md
│   └── environment-strategy.md
├── src/
│   ├── services/          # productService, transactionService (Sprint 1)
│   ├── types/             # supabase.ts (generated), app.ts
│   └── utils/             # formatCurrency, formatTime, cn
├── supabase/
│   └── migrations/        # SQL migration files
├── artifacts/             # Legacy UI screens (portfolio reference)
├── CONTEXT.md             # Project brain — read by AI Code
└── .npmrc                 # legacy-peer-deps=true (resolves ESLint peer dep)
```

---

## Safety Rules

> These are hard constraints, not guidelines.

1. **No DROP TABLE without a written rollback plan.** See `docs/migrations/ROLLBACK_PLAN.md`.
2. **Soft-deprecate before hard delete.** SQL comments first, drop only after verification.
3. **CI must be green before any merge to `main`.**
4. **TypeScript strict mode.** `tsc --noEmit` must pass on every commit.

---

## Local Development

```bash
git clone https://github.com/legacyasphere-id/Legacya-Pos-Ui.git
cd Legacya-Pos-Ui
npm install
cp .env.example .env.local   # add your Supabase URL + anon key
npm run dev
```

**Required env vars:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Built by Legacya Sphere

Legacya Sphere is a studio that builds systems for brands and businesses.  
This product is built with the **Sphere Method v2.1** — an internal framework for AI-assisted product development.

→ [github.com/legacyasphere-id](https://github.com/legacyasphere-id)
