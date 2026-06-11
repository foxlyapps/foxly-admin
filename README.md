# Foxly Admin

The **internal admin panel for the Foxly Shopify app**, used by staff to monitor
app health (installs, active shops, churn) and manage every record powering the
app. Built with **Next.js 16 (App Router)**, **Drizzle ORM + PostgreSQL**,
**Zustand** for client state, and **Zod** for validation.

---

## Table of Contents

1. [Quick start](#quick-start)
2. [Environment variables](#environment-variables)
3. [Architecture overview](#architecture-overview)
4. [Authentication & authorization](#authentication--authorization)
5. [The resource system (generic CRUD)](#the-resource-system-generic-crud)
6. [Analytics](#analytics)
7. [Design system](#design-system)
8. [State management (Zustand)](#state-management-zustand)
9. [Validation (Zod)](#validation-zod)
10. [Database & migrations](#database--migrations)
11. [Seeding admin users](#seeding-admin-users)
12. [Adding a new managed table](#adding-a-new-managed-table)
13. [Project structure](#project-structure)
14. [Scripts](#scripts)

---

## Quick start

```bash
bun install
# Configure .env (see below)
bun run seed                 # create the first admin (see seeding section)
bun run dev                  # http://localhost:3000  ->  /login
```

The landing page is the **login screen**. After signing in you are routed to
`/dashboard`.

---

## Environment variables

| Variable         | Required | Description                                                        |
| ---------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`   | yes      | PostgreSQL connection string. App uses it for all queries.         |
| `SESSION_SECRET` | yes      | 32+ byte secret used to sign session JWTs. `openssl rand -base64 32`. |

> **Supabase note:** the runtime app works on either the pooler port (`6543`)
> or session port (`5432`). `drizzle-kit` schema commands (`pull`, `generate`,
> `migrate`, `push`) **require** the session port `5432`.
>
> **Password escaping:** if your password contains a `$`, escape it with a
> backslash in `.env` (e.g. `Rashel\$110506`) so Bun's dotenv parser does not
> treat it as a shell variable.

---

## Architecture overview

```
Browser ──▶ proxy.ts (edge auth gate) ──▶ App Router pages (RSC)
                                              │
                          server actions ◀────┤ data fetching (DAL)
                                │                  │
                          Zod validation       verifySession()
                                │                  │
                          Drizzle ORM ──────▶ PostgreSQL
```

- **Server Components** fetch data and enforce auth close to the data source.
- **Server Actions** (`"use server"`) handle every mutation, re-validating
  input with Zod and re-checking authorization.
- **Client Components** (`"use client"`) handle interactivity (tables, forms,
  toasts) and talk to the server exclusively through Server Actions.
- **`proxy.ts`** (Next 16's renamed middleware) performs a fast, optimistic
  cookie check to redirect unauthenticated users before render.

---

## Authentication & authorization

Stateless **JWT sessions** stored in an `httpOnly` cookie (`foxly_admin_session`).

| File                      | Responsibility                                                |
| ------------------------- | ------------------------------------------------------------- |
| `lib/session.ts`          | Encrypt/decrypt JWTs (jose), set/read/delete the cookie.      |
| `lib/dal.ts`              | `verifySession()` (redirects if absent), `requireRole()`.     |
| `lib/actions/auth.ts`     | `login` / `logout` server actions (bcrypt verify, timing-safe). |
| `lib/validations/auth.ts` | Zod `LoginSchema`.                                            |
| `proxy.ts`                | Optimistic route gate (login ↔ dashboard redirects).          |

**Roles:** `admin` and `superadmin` (Postgres enum `admin_role`).
`superadmin`-only resources (e.g. **Admin Users**) are filtered out of the
sidebar *and* re-checked inside every server action via `authorize()`.

Security properties:

- Passwords hashed with **bcrypt** (cost 12).
- Constant-ish login timing (a dummy hash runs when the user is absent).
- Generic "Invalid email or password" message (no account enumeration).
- Every mutation re-verifies the session server-side; client UI hiding is
  never the only line of defense.
- You cannot delete your own admin account.

---

## The resource system (generic CRUD)

Rather than hand-coding 12+ near-identical CRUD screens, the dashboard is
**schema-driven**. One set of pages and components renders every table by
introspecting its Drizzle definition.

### Pieces

| File                                | Role                                                                 |
| ----------------------------------- | -------------------------------------------------------------------- |
| `lib/resources/registry.ts`         | Declares each managed table: slug, labels, icon, group, permissions. |
| `lib/resources/introspect.ts`       | Reads Drizzle column metadata → `FieldMeta[]` (kind, nullability…).  |
| `lib/resources/schema-builder.ts`   | Builds a **Zod schema dynamically** from `FieldMeta` + coerces FormData. |
| `lib/resources/actions.ts`          | Generic `listRows`, `getRow`, `createRow`, `updateRow`, `deleteRow`. |
| `lib/resources/stats.ts`            | Row counts for the overview page.                                    |

### Pages (dynamic routes)

| Route                                   | Purpose            |
| --------------------------------------- | ------------------ |
| `/dashboard`                            | Overview + stats   |
| `/dashboard/[resource]`                 | Searchable, sortable, paginated list |
| `/dashboard/[resource]/new`             | Create form        |
| `/dashboard/[resource]/[id]/edit`       | Edit form          |

### Field-kind inference

`introspectTable()` maps each Drizzle column type to a UI `FieldKind`:

| Drizzle column                  | FieldKind   | Input rendered          |
| ------------------------------- | ----------- | ----------------------- |
| `PgUUID`                        | `uuid`      | text (mono, optional)   |
| `PgBoolean`                     | `boolean`   | checkbox                |
| integer/numeric/bigserial/…     | `number`    | number input            |
| `PgJsonb` / `PgJson`            | `json`      | JSON textarea           |
| `PgTimestamp`                   | `datetime`  | datetime-local          |
| `PgDate`                        | `date`      | date input              |
| enum columns                    | `enum`      | select                  |
| `PgText` (long-name heuristic)  | `textarea`  | textarea                |
| everything else                 | `text`      | text input              |

System columns (`id`, `createdAt`, `updatedAt`, primary keys) are read-only.

---

## Analytics

A feature-rich analytics page at **`/dashboard/analytics`**, organized into two
sections: **App health** (the Shopify-app view) and **Merchant commerce**.

### Date-range filtering

A dropdown filter (`components/analytics/range-filter.tsx`) offers presets:

- **Recent:** Today, Yesterday, Last 7 / 30 / 90 days
- **Calendar:** This week, Last week, This month, Last month, This year
- **All time**

Each preset resolves to a `{ from, to, bucket }` window in
`lib/analytics/ranges.ts`. Switching a preset calls the `fetchAnalytics`
server action and re-renders without a full page navigation (`useTransition`).
KPI deltas compare against the **immediately-preceding equal-length period**.

### What it shows

**App health** (from the `shops` table — `installed_at` / `uninstalled_at`):

| Metric                 | Detail                                                       |
| ---------------------- | ------------------------------------------------------------ |
| New installs           | Installs in the window, % vs previous period.                |
| Uninstalls             | Uninstalls in the window (lower is better).                  |
| Active shops           | Currently-installed shops.                                   |
| Churn rate             | Uninstalls / shops active at window start.                   |
| Installs vs uninstalls | Diverging bar chart over time + net change + engaged shops.  |

**Merchant commerce** (from `order_logs`):

| Section                    | Detail                                                                 |
| -------------------------- | ---------------------------------------------------------------------- |
| KPI cards                  | Revenue, Orders, Avg. Order Value, Customers — each with % vs previous. |
| Trend chart                | Revenue/Orders over time (toggle), bucketed by hour/day/week/month.    |
| **Feature usage & insights** | The highlight — see below.                                           |
| Orders by status           | Donut.                                                                 |
| Orders by payment method   | Donut.                                                                 |
| Top shops by revenue       | Ranked bar list.                                                       |
| Top products               | Ranked bar list.                                                       |
| Top locations (cities)     | Ranked bar list.                                                       |

The dashboard overview (`/dashboard`) also surfaces a 4-card app-health band
(active shops, 30-day installs, uninstalls/churn, orders).

### Feature usage & insights

Answers "which features are stores/customers using most":

- **Most-used feature** headline (e.g. *Partial COD used in 151 orders, 60%*).
- **Payment feature mix** — Cash on Delivery vs Partial COD vs Partial Payment
  vs Full Prepaid, with order share, revenue share, and **AOV per feature**
  (a stacked bar + table).
- **Feature adoption rates** — % of orders using Partial COD, Full Prepaid, and
  Coupons (progress bars).
- **Discount impact** — orders using a coupon, coupon rate, total and average
  discount value.

All charts are **dependency-free SVG** components in `components/analytics/`
(`area-chart`, `donut`, `bar-list`, `kpi-card`, `feature-insights-panel`).
Queries live in `lib/analytics/queries.ts` (SQL aggregations:
`date_trunc` + `generate_series` for gap-free time series, `filter (where …)`
for adoption rates).

To add a metric: add an aggregation to `getAnalytics`, extend `AnalyticsData`,
and render it in `analytics-dashboard.tsx`.

---

## Design system

Defined entirely in `app/globals.css` using **Tailwind CSS v4** `@theme` tokens
and **OKLCH** color space for perceptually-even palettes. Supports automatic
light/dark via `prefers-color-scheme`.

Token groups: `--color-brand-*` (Foxly amber), surfaces, borders, foreground,
sidebar, ring. UI primitives live in `components/ui/`:

| Component        | File                            |
| ---------------- | ------------------------------- |
| Button           | `components/ui/button.tsx`      |
| Input/Textarea/Select/Label | `components/ui/input.tsx` |
| Card             | `components/ui/card.tsx`        |
| Badge            | `components/ui/badge.tsx`       |
| Toaster          | `components/ui/toaster.tsx`     |
| ConfirmDialog    | `components/ui/confirm-dialog.tsx` |

Dashboard composites live in `components/dashboard/` (shell, sidebar, user
menu, data table, resource form, record drawer, page header, stat card).

Design principles: consistent spacing & radius tokens, subtle shadows,
`focus-visible` rings on every interactive element, accessible labels, and a
unified empty/loading/error treatment across all tables.

---

## State management (Zustand)

| Store                          | Purpose                                                |
| ------------------------------ | ------------------------------------------------------ |
| `lib/stores/toast-store.ts`    | Global toast notifications + `toast.success/error/info`. |
| `lib/stores/table-store.ts`    | Reusable table UI state (search, page, sort).          |

The `DataTable` component manages per-instance fetch state with
`useTransition` for non-blocking pagination/search/sort, while toasts are
global via Zustand so any component (or server-action result handler) can emit.

---

## Validation (Zod)

- **Auth:** static `LoginSchema` in `lib/validations/auth.ts`.
- **Resources:** schemas are generated at runtime by `buildSchema(fields, mode)`
  from introspected metadata. `create` enforces required fields; `update` is
  partial. `coerceFormData` converts raw `FormData` strings into typed values
  (booleans, numbers, JSON) before validation.

All validation runs **on the server** inside the action; field errors are
returned to the client and shown inline under each input.

---

## Database & migrations

Drizzle ORM with the `node-postgres` driver. See [`db/`](db/):

- `db/index.ts` — pooled client (`db`) reused across HMR.
- `db/schema.ts` — introspected store tables (regenerated by `db:pull`).
- `db/relations.ts` — relations (regenerated by `db:pull`).
- `db/admin.ts` — **hand-written** `admin_users` table + `admin_role` enum
  (kept separate so `db:pull` never overwrites it).
- `db/migrations/` — SQL migrations + snapshots.

```bash
bun run db:pull       # introspect existing DB -> schema.ts (use :5432)
bun run db:generate   # generate a migration from schema changes
bun run db:migrate    # apply pending migrations (use :5432)
bun run db:studio     # Drizzle Studio
```

---

## Seeding admin users

The seeder (`seed.ts`) is **git-ignored** (contains/depends on credentials).

```bash
# defaults: superadmin@foxly.app / ChangeMe123!
bun run seed

# custom
EMAIL=you@foxly.app PASSWORD='Str0ngPass!' NAME="You" ROLE=superadmin bun run seed
```

It upserts by email and hashes the password with bcrypt (cost 12).

---

## Adding a new managed table

1. Add the table to `db/schema.ts` (or run `bun run db:pull`).
2. Append a `ResourceConfig` entry to `RESOURCES` in
   `lib/resources/registry.ts` (slug, labels, icon, group, primary columns).
3. That's it — list/create/edit/delete pages, validation, search, sort,
   pagination and the sidebar entry are generated automatically.

Optional per-resource flags: `superAdminOnly`, `disableCreate`.

---

## Project structure

```
app/
  layout.tsx               Root layout + Toaster
  page.tsx                 Redirects to /dashboard
  not-found.tsx            404
  login/                   Login landing page + form
  dashboard/
    layout.tsx             Authenticated shell (sidebar/topbar)
    page.tsx               Overview + stats
    [resource]/
      page.tsx             List
      new/page.tsx         Create
      [id]/edit/page.tsx   Edit
components/
  ui/                      Design-system primitives
  dashboard/               Dashboard composites
lib/
  session.ts  dal.ts       Auth/session
  actions/auth.ts          Login/logout actions
  validations/auth.ts      Zod auth schema
  resources/               Generic CRUD engine
  stores/                  Zustand stores
  utils.ts                 cn(), formatters
db/                        Drizzle schema + migrations
proxy.ts                   Route auth gate
seed.ts                    Admin seeder (git-ignored)
```

---

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `bun run dev`       | Start dev server                     |
| `bun run build`     | Production build                     |
| `bun run start`     | Start production server              |
| `bun run lint`      | ESLint                               |
| `bun run db:pull`   | Introspect DB → schema               |
| `bun run db:generate` | Generate migration                 |
| `bun run db:migrate`  | Apply migrations                   |
| `bun run db:push`     | Push schema (dev)                  |
| `bun run db:studio`   | Drizzle Studio                     |
| `bun run seed`        | Seed an admin user (git-ignored)   |
