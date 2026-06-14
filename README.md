# LegacyaPos — Restaurant POS with AI Insights

> A portfolio-grade restaurant Point-of-Sale system demonstrating **enterprise SaaS UI craft**, **multi-role product thinking**, and **AI-augmented decision support** — built with a live Supabase backend powering 5 of 9 screens.

<div align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-Ready-646CFF?logo=vite&logoColor=white&style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Realtime-3ECF8E?logo=supabase&logoColor=white&style=flat-square)
![Status](https://img.shields.io/badge/Backend-5%2F9%20screens%20live-22C55E?style=flat-square)

</div>

---

## Live Demo

https://legacya-pos-ui-129q.vercel.app

---

## Backend Status

| Screen | Status |
|--------|--------|
| Auth (login, role guard) | ✅ Live — Supabase Auth + `profiles` table |
| Menu Management | ✅ Live — categories, items, availability toggle persists |
| POS Cashier | ✅ Live — `place_order` + `pay_order_cash` RPCs, live discounts + tax |
| Orders List | ✅ Live — real orders with status filters, revenue stats |
| Kitchen Display | ✅ Live — Realtime subscription + 10s polling, elapsed timer |
| Inventory | 🔲 Mock data |
| Analytics | 🔲 Mock data |
| Notifications | 🔲 Mock data |
| Settings | 🔲 Mock data |

---

## Why This Project Exists

Most "POS UI" mockups stop at a pretty dashboard. LegacyaPos is built to demonstrate **product depth** — three distinct user roles, real interaction patterns, AI-informed actions, and 9 fully designed screens that share one cohesive design system, backed by a production Supabase database with RLS.

---

## The Three Personas

| Persona | Device | Priority screen | Constraint |
|---------|--------|-----------------|------------|
| 🧑‍💼 **Owner** | Desktop / mobile | Dashboard · Analytics | Decisions in <2 min |
| 🧾 **Cashier** | Tablet landscape | POS Cashier | Complete order in <30 sec |
| 👨‍🍳 **Kitchen** | Wall-mounted display | Kitchen Display | Readable from 2 meters |

---

## The 9 Screens

| # | Screen | Backend | Signature detail |
|---|--------|---------|------------------|
| 1 | **Dashboard** | 🔲 Mock | AI insight panel · sparkline stat cards |
| 2 | **POS Cashier** | ✅ Live | Two-pane tablet layout · live menu from Supabase · `place_order` RPC |
| 3 | **Orders List** | ✅ Live | Real orders · expandable rows · `payment_status` axis |
| 4 | **Kitchen Display** | ✅ Live | Realtime + polling · elapsed timer from `cooking_at` |
| 5 | **Inventory** | 🔲 Mock | Stock bar viz · AI prediction banner |
| 6 | **Menu Management** | ✅ Live | Availability toggle persists to Supabase (optimistic) |
| 7 | **Analytics** | 🔲 Mock | Hour×Day heatmap · category donut |
| 8 | **Notifications** | 🔲 Mock | Time-grouped feed · multi-channel preferences |
| 9 | **Settings** | 🔲 Mock | Live thermal receipt preview · sticky save bar |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| UI | React 18 |
| Build | Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| State | Zustand (auth store) |
| Backend | Supabase PostgreSQL + RLS + Realtime |
| Auth | Supabase Auth + `profiles` + `app_role` enum |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

## Database Schema (P1)

```sql
profiles          -- id, role (app_role enum: owner/cashier/kitchen/staff)
category          -- id, name, sort_order
menu_item         -- id, category_id, name, price, available, stock_qty
ingredient        -- id, name, unit, stock_qty, min_stock
order             -- id, status (order_status enum), payment_status (order_payment_status enum), total
order_item        -- id, order_id, menu_item_id, qty, unit_price
payment           -- id, order_id, method, amount
stock_movement    -- id, ingredient_id, type, qty, order_id
discount          -- id, name, type, value, active
settings          -- singleton config (tax_rate, restaurant_name, etc.)
```

**Key design decision:** `order.status` = kitchen/fulfillment axis only. `order.payment_status` = payment axis. Cash orders run through the kitchen queue (`pending → cooking → ready → done`) while `payment_status = 'paid'` immediately.

---

## Design Philosophy

**Enterprise fintech, not generic admin template.**

- Light theme only, deliberate whitespace, soft shadows, `rounded-2xl` cards
- `tabular-nums` everywhere numbers appear — fintech-grade alignment
- Three card variants by context (KPICard, StatChip, MenuStat)
- Custom components over libraries where it matters (heatmap, sparklines, receipt preview)
- AI insights as a cohesive panel with confidence indicators

### Color Tokens

```css
--primary:       #4A7FA7
--primary-soft:  #DCEAF5
--bg:            #F6F9FC
--text-main:     #1E293B
--text-soft:     #64748B
--success:       #22C55E
--warning:       #F59E0B
--danger:        #EF4444
```

---

## Getting Started

```bash
git clone https://github.com/legacyasphere-id/Legacya-Pos-Ui.git
cd Legacya-Pos-Ui
npm install
# Copy .env.example → .env and fill in Supabase keys
npm run dev
```

Run Supabase migrations (`supabase/migrations/`) and seed with `supabase/seed.sql` for a working local backend.

---

## Changelog

| Date | What changed |
|------|--------------|
| Jun 7, 2026 | **Payment split from fulfillment**: `order.payment_status` axis added; cash orders now flow through kitchen queue. Migration 0005 + `pay_order_cash` updated. |
| Jun 7, 2026 | **Orders + Kitchen wired**: real order list, Kitchen Realtime subscription + 10s polling, elapsed timer. |
| Jun 7, 2026 | **`auth_role()` fix**: was reading JWT `role` claim (`'authenticated'`) instead of `profiles` table, causing `invalid input value for enum app_role` on every RPC. |
| Jun 7, 2026 | **Auth + Menu + Cashier wired**: Supabase auth store, RequireAuth guard, live menu categories, `place_order` + `pay_order_cash` RPCs. |
| Pre-Jun 7 | 9 screens designed and shipped as mock UI (design system, all layouts complete) |

---

## Credits

Designed & built by **[Yoga P. Effendi](https://github.com/legacyasphere-id)** · AI fullstack designer-engineer · 2026

<div align="center">

**LegacyaPos** · Restaurant OS · 2026

</div>
