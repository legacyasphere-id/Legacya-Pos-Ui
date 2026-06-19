# Legacya POS

Production-quality retail Point of Sale system built with React + Supabase.

[![CI](https://img.shields.io/github/actions/workflow/status/legacyasphere-id/Legacya-Pos-Ui/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/legacyasphere-id/Legacya-Pos-Ui/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white&style=flat-square)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel&logoColor=white&style=flat-square)](https://legacya-pos-ui-129q.vercel.app)

---

## Live Demo

**[https://legacya-pos-ui-129q.vercel.app](https://legacya-pos-ui-129q.vercel.app)**

Contact repo owner for demo credentials.

---

## What it does

Legacya POS handles the complete retail transaction lifecycle across three roles: Owner, Cashier, and Kitchen. Owners manage products, inventory, and store settings; cashiers run atomic checkout transactions; kitchen staff track order fulfillment in real time via Supabase Realtime. The system enforces Row-Level Security on every table, tracks inventory through an append-only movement ledger, and processes transactions via a single `retail_checkout` RPC that atomically inserts the sale, line items, and stock adjustments in one database call.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + Vite 5 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + RLS) |
| Realtime | Supabase Realtime |
| Auth | Supabase Auth |
| State | Zustand |
| Routing | React Router v6 |
| Charts | Recharts |
| Testing | Vitest + React Testing Library |
| E2E | Playwright |
| CI/CD | GitHub Actions + Vercel |
| Git hooks | Husky + lint-staged |

---

## Features

- Product & category management
- Inventory tracking with movement ledger
- Atomic checkout via `retail_checkout` RPC
- Real-time kitchen display
- Owner onboarding tour (first-time visit)
- Role-based access (Owner / Cashier / Kitchen)
- Tax + discount support
- Transaction history

---

## Screens

| Screen | Role | Status |
|---|---|---|
| Dashboard | Owner | Live |
| POS Cashier | Cashier | Live |
| Products | Owner | Live |
| Inventory | Owner | Live |
| Orders | Kitchen | Live |
| Analytics | Owner | In Progress |
| Settings | Owner | Live |
| Notifications | All | Live |
| Login | Public | Live |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with the retail schema applied

### Installation

```bash
git clone https://github.com/legacyasphere-id/Legacya-Pos-Ui.git
cd Legacya-Pos-Ui
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
VITE_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
VITE_APP_ENV=development
```

### Run locally

```bash
npm run dev
```

---

## Running Tests

```bash
npm test              # 97 tests — unit + integration (Vitest)
npm run type-check    # tsc --noEmit (strict)
npm run build         # production build via Vite
```

CI runs all three on every push. Merges to `main` require a green pipeline.

---

## Architecture

**Service layer** — all data access goes through `productService`, `inventoryService`, and `transactionService`. Pages never call the Supabase client directly; they call typed service methods that return domain objects.

**Atomic RPCs** — `retail_checkout` inserts a transaction, its line items, and inventory adjustments in a single plpgsql transaction. `retail_adjust_stock` writes both the inventory row update and the movement ledger entry atomically. No partial writes.

**Anchor-based tour system** — the onboarding tour uses a `registerAnchor(id, el)` pattern. UI components register their DOM nodes by ID on mount and deregister on unmount. The tour engine reads live `getBoundingClientRect()` values from that registry to position the spotlight — no hardcoded selectors.

**RLS enforcement** — every Supabase table has Row-Level Security enabled. Role checks happen at the database level via `auth.jwt() -> role`, not just in the UI.

---

## Roadmap

- [ ] Analytics screen wired to live data
- [ ] Notifications system
- [ ] Cashier + Kitchen onboarding tours
- [ ] Multi-store support

---

## License

MIT
