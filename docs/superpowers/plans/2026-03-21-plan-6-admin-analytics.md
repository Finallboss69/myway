# My Way — Plan 6: Admin Panel & Analytics

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `app-admin` — the cloud-only owner panel at `admin.myway.com`. Covers authentication with optional 2FA, a live KPI dashboard, revenue/sales analytics with charts, waiter performance reports, accounting with daily balance and PDF export, expense management with receipt uploads, waste log, sync log viewer, manual backup trigger, and venue configuration.

**Architecture:** Next.js 15 App Router deployed to Vercel. Connects exclusively to Supabase cloud (no local-server). All data access through the Supabase client (server-side via `@supabase/ssr`) and Prisma cloud client where complex queries are needed. Charts via Recharts. PDF export via `@react-pdf/renderer`. Date math via `date-fns`.

**Tech Stack:** Next.js 15, Supabase Auth (email+password + TOTP 2FA), Supabase client (`@supabase/ssr`), Prisma 5 (PostgreSQL), Recharts, `@react-pdf/renderer`, `date-fns`, Vitest, Supertest, `@myway/ui`, `@myway/types`, `@myway/auth`

**Depends on:** Plan 3 (Supabase Auth + roles infrastructure — `@myway/auth` helpers, `roles.ts` permission matrix, RLS policies)

---

## File Map

```
apps/app-admin/
├── package.json
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # Root layout: auth gate + sidebar nav + dark theme
│   │   ├── page.tsx                            # Redirect to /dashboard
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx                   # Email + password login form
│   │   │   └── totp/
│   │   │       └── page.tsx                   # TOTP challenge screen (if 2FA enrolled)
│   │   │
│   │   ├── (admin)/
│   │   │   ├── layout.tsx                     # Protected layout: role check + sidebar
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                   # KPI dashboard — today's snapshot + comparisons
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx                   # Sales overview: period selector + charts
│   │   │   │   ├── products/page.tsx          # Top-selling products ranking
│   │   │   │   ├── tables/page.tsx            # Top-grossing tables ranking
│   │   │   │   ├── hours/page.tsx             # Peak hours heatmap
│   │   │   │   └── discounts/page.tsx         # Discount & cancellation report
│   │   │   │
│   │   │   ├── accounting/
│   │   │   │   ├── page.tsx                   # Today's balance: revenue - expenses = net profit
│   │   │   │   └── [date]/
│   │   │   │       └── page.tsx               # Past day accounting view (YYYY-MM-DD)
│   │   │   │
│   │   │   ├── expenses/
│   │   │   │   └── page.tsx                   # Expense CRUD + receipt photo upload
│   │   │   │
│   │   │   ├── waste/
│   │   │   │   └── page.tsx                   # Waste log: view + add entries
│   │   │   │
│   │   │   ├── sync/
│   │   │   │   └── page.tsx                   # Sync log viewer + manual backup button
│   │   │   │
│   │   │   └── settings/
│   │   │       └── page.tsx                   # Venue config: logo, name, hours, theme colors
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx                    # Navigation sidebar with route links
│   │   │   ├── TopBar.tsx                     # App bar: venue name + user menu + logout
│   │   │   └── AdminShell.tsx                 # Combines Sidebar + TopBar + main content area
│   │   │
│   │   ├── dashboard/
│   │   │   ├── KpiCard.tsx                    # Single KPI: value + delta badge + label
│   │   │   ├── KpiGrid.tsx                    # 4-column KPI row
│   │   │   ├── PaymentBreakdown.tsx           # Donut/bar: cash/MP/card/transfer
│   │   │   ├── CategoryBreakdown.tsx          # Horizontal bars: food/drinks/cocktails/chips/delivery
│   │   │   └── AlertBanner.tsx                # Active alerts: low stock, sync errors, unusual cancellations
│   │   │
│   │   ├── charts/
│   │   │   ├── RevenueLineChart.tsx           # Daily/weekly/monthly/yearly revenue line chart
│   │   │   ├── RevenueBarChart.tsx            # Bar chart variant for period comparison
│   │   │   ├── PeakHoursHeatmap.tsx           # 7×24 heatmap grid (day × hour)
│   │   │   └── PeriodSelector.tsx             # Tabs: today / week / month / year + custom range
│   │   │
│   │   ├── reports/
│   │   │   ├── ProductRankingTable.tsx        # Top products: name, qty sold, revenue, category
│   │   │   ├── TableRankingTable.tsx          # Top tables: table number, sessions, revenue
│   │   │   ├── WaiterPerformanceTable.tsx     # Waiter stats: tables, revenue, avg ticket, cancellations
│   │   │   └── DiscountCancellationTable.tsx  # Who / when / why / amount for discounts + cancellations
│   │   │
│   │   ├── accounting/
│   │   │   ├── DailyBalanceCard.tsx           # Revenue / expenses / net profit summary card
│   │   │   ├── AccountingDateNav.tsx          # Navigate ← previous day | date picker | next day →
│   │   │   ├── WeeklyBalanceChart.tsx         # 7-day bar chart of net profit
│   │   │   ├── MonthlyBalanceSummary.tsx      # Monthly total with week-by-week breakdown
│   │   │   └── ExportPdfButton.tsx            # Triggers PDF generation + download
│   │   │
│   │   ├── expenses/
│   │   │   ├── ExpenseList.tsx                # Paginated list with category filter
│   │   │   ├── ExpenseFormModal.tsx           # Create/edit expense: amount, category, date, method, receipt
│   │   │   ├── ReceiptUpload.tsx              # Upload receipt photo → Supabase Storage
│   │   │   └── ExpenseCategoryBadge.tsx       # Colored badge for category
│   │   │
│   │   ├── waste/
│   │   │   ├── WasteLogTable.tsx              # List: ingredient/product, qty, reason, cost, who
│   │   │   └── AddWasteModal.tsx              # Form: ingredient or product, qty, reason, notes
│   │   │
│   │   ├── sync/
│   │   │   ├── SyncLogTable.tsx               # Table: date, pushed, pulled, status, error
│   │   │   └── ManualBackupButton.tsx         # POST /api/admin/sync → spinner → result toast
│   │   │
│   │   └── settings/
│   │       ├── VenueForm.tsx                  # Name, address, business hours inputs
│   │       ├── LogoUpload.tsx                 # Upload venue logo → Supabase Storage
│   │       └── ThemeColorPicker.tsx           # Accent color + surface color pickers
│   │
│   ├── lib/
│   │   ├── supabase.ts                        # Supabase browser client singleton
│   │   ├── supabase-server.ts                 # Supabase server client (for Server Components / Route Handlers)
│   │   ├── prisma.ts                          # Prisma cloud client singleton
│   │   ├── auth.ts                            # getSession(), requireAdmin(), requireSuperadmin()
│   │   ├── date.ts                            # date-fns helpers: startOfDay, startOfWeek, formatARS, etc.
│   │   └── format.ts                          # Currency formatter: formatCurrency(n) → "$1.234,56"
│   │
│   ├── hooks/
│   │   ├── useDashboard.ts                    # TanStack Query: fetch today KPIs + comparisons
│   │   ├── useRevenue.ts                      # Fetch revenue series for selected period
│   │   ├── useAccounting.ts                   # Fetch daily_accounting row for a given date
│   │   ├── useExpenses.ts                     # CRUD operations for expenses
│   │   └── useWasteLog.ts                     # Fetch + create waste log entries
│   │
│   ├── pdf/
│   │   ├── DailyReportPdf.tsx                 # react-pdf document: daily accounting report
│   │   └── MonthlyReportPdf.tsx               # react-pdf document: monthly summary report
│   │
│   └── app/api/
│       ├── admin/
│       │   └── sync/
│       │       └── route.ts                   # POST /api/admin/sync — triggers manual backup
│       ├── accounting/
│       │   └── [date]/
│       │       └── route.ts                   # GET /api/accounting/:date
│       ├── expenses/
│       │   ├── route.ts                       # GET (list) + POST (create) /api/expenses
│       │   └── [id]/
│       │       └── route.ts                   # PATCH + DELETE /api/expenses/:id
│       ├── waste/
│       │   ├── route.ts                       # GET (list) + POST (create) /api/waste
│       └── reports/
│           ├── kpis/route.ts                  # GET /api/reports/kpis?date=
│           ├── revenue/route.ts               # GET /api/reports/revenue?period=&from=&to=
│           ├── products/route.ts              # GET /api/reports/products?period=
│           ├── tables/route.ts                # GET /api/reports/tables?period=
│           ├── hours/route.ts                 # GET /api/reports/hours?period=
│           ├── waiters/route.ts               # GET /api/reports/waiters?period=
│           └── discounts/route.ts             # GET /api/reports/discounts?from=&to=
│
└── __tests__/
    ├── api/
    │   ├── kpis.test.ts
    │   ├── revenue.test.ts
    │   ├── accounting.test.ts
    │   ├── expenses.test.ts
    │   ├── waste.test.ts
    │   └── sync.test.ts
    └── lib/
        ├── auth.test.ts
        └── date.test.ts
```

---

## Task 1: App scaffold + authentication

**Files:**
- Create: `apps/app-admin/package.json`
- Create: `apps/app-admin/next.config.ts`
- Create: `apps/app-admin/tsconfig.json`
- Create: `apps/app-admin/vitest.config.ts`
- Create: `apps/app-admin/src/lib/supabase.ts`
- Create: `apps/app-admin/src/lib/supabase-server.ts`
- Create: `apps/app-admin/src/lib/auth.ts`
- Create: `apps/app-admin/src/app/(auth)/login/page.tsx`
- Create: `apps/app-admin/src/app/(auth)/totp/page.tsx`
- Create: `apps/app-admin/src/app/(admin)/layout.tsx`
- Create: `apps/app-admin/src/middleware.ts`

- [ ] **1.1** Write tests — `__tests__/lib/auth.test.ts`

```typescript
// Test: requireAdmin() redirects when session is missing
// Test: requireAdmin() redirects when role is 'waiter' (not admin/superadmin)
// Test: requireAdmin() returns session when role is 'admin'
// Test: requireAdmin() returns session when role is 'superadmin'
// Test: requireSuperadmin() rejects 'admin' role
```

- [ ] **1.2** Run tests — verify FAIL

- [ ] **1.3** Create `apps/app-admin/package.json`

```json
{
  "name": "@myway/app-admin",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3006",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@myway/ui": "workspace:*",
    "@myway/types": "workspace:*",
    "@myway/auth": "workspace:*",
    "@myway/utils": "workspace:*",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.47.0",
    "@prisma/client": "^5.22.0",
    "@tanstack/react-query": "^5.0.0",
    "recharts": "^2.14.0",
    "@react-pdf/renderer": "^4.1.0",
    "date-fns": "^4.1.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@myway/config": "workspace:*",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.0"
  }
}
```

- [ ] **1.4** Create `apps/app-admin/src/lib/supabase.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **1.5** Create `apps/app-admin/src/lib/supabase-server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **1.6** Create `apps/app-admin/src/lib/auth.ts`
  - `getSession()` — returns Supabase session or null, reads `staff` row from Supabase to get role
  - `requireAdmin()` — calls `getSession()`, throws redirect to `/login` if no session or role not in `['admin', 'superadmin']`
  - `requireSuperadmin()` — same, but only allows `superadmin` role
  - Both return `{ session, staff }` on success so callers can use them without re-fetching

- [ ] **1.7** Create `apps/app-admin/src/middleware.ts`
  - Match all routes except `/login`, `/totp`, and Next.js internals
  - Refresh Supabase session cookie on every request (standard `@supabase/ssr` middleware pattern)
  - If no valid session → redirect to `/login`

- [ ] **1.8** Create `apps/app-admin/src/app/(auth)/login/page.tsx`
  - Email + password form
  - On submit: `supabase.auth.signInWithPassword({ email, password })`
  - On success with no TOTP enrolled: redirect to `/dashboard`
  - On success with TOTP required (error code `mfa_challenge_required`): redirect to `/totp`
  - Show inline error on wrong credentials; show loading spinner on submit
  - Link: "Forgot password?" (not implemented — placeholder for now)

- [ ] **1.9** Create `apps/app-admin/src/app/(auth)/totp/page.tsx`
  - 6-digit OTP input (one digit per box, auto-advance)
  - On submit: `supabase.auth.mfa.challengeAndVerify({ factorId, code })`
  - On success: redirect to `/dashboard`
  - On error: shake animation + clear input

- [ ] **1.10** Create `apps/app-admin/src/app/(admin)/layout.tsx`
  - Server Component: calls `requireAdmin()` — redirects to `/login` if unauthorized
  - Renders `<AdminShell>` with `<Sidebar />` + `<TopBar />`
  - TopBar shows venue name (from Supabase `venues` table) + logged-in user email + logout button
  - Logout: `supabase.auth.signOut()` → redirect to `/login`

- [ ] **1.11** Run tests — verify PASS

- [ ] **1.12** Commit: `feat(app-admin): scaffold + Supabase email/TOTP authentication`

---

## Task 2: Layout shell — sidebar + navigation

**Files:**
- Create: `apps/app-admin/src/components/layout/Sidebar.tsx`
- Create: `apps/app-admin/src/components/layout/TopBar.tsx`
- Create: `apps/app-admin/src/components/layout/AdminShell.tsx`

- [ ] **2.1** Create `apps/app-admin/src/components/layout/Sidebar.tsx`
  - Dark premium sidebar (surface-1 background, gold accent on active route)
  - Navigation groups:
    - **General**: Dashboard (`/dashboard`), Reports (`/reports`)
    - **Finances**: Accounting (`/accounting`), Expenses (`/expenses`), Waste (`/waste`)
    - **Operations**: Sync (`/sync`), Employees (`/employees` — Plan 8), Menu (`/menu` — Plan 7)
    - **Config**: Settings (`/settings`)
  - Each item: icon + label, highlighted when `pathname.startsWith(href)`
  - Collapsible on mobile (hamburger toggle)
  - Show venue logo at top if set

- [ ] **2.2** Create `apps/app-admin/src/components/layout/TopBar.tsx`
  - Shows current page title (derived from pathname)
  - Right side: user avatar/initials + dropdown (Profile, 2FA setup link, Logout)
  - Breadcrumb for nested routes (e.g., Accounting / 2026-03-15)

- [ ] **2.3** Create `apps/app-admin/src/components/layout/AdminShell.tsx`
  - Combines Sidebar (fixed left, `w-64`) + TopBar (fixed top) + main content scrollable area
  - Responsive: sidebar collapses to drawer on `< lg` breakpoint

- [ ] **2.4** Manual test: navigate all sidebar routes, verify active state updates, sidebar collapses on mobile viewport

- [ ] **2.5** Commit: `feat(app-admin): add sidebar navigation shell`

---

## Task 3: KPI dashboard

**Files:**
- Create: `apps/app-admin/src/app/api/reports/kpis/route.ts`
- Create: `apps/app-admin/src/components/dashboard/KpiCard.tsx`
- Create: `apps/app-admin/src/components/dashboard/KpiGrid.tsx`
- Create: `apps/app-admin/src/components/dashboard/PaymentBreakdown.tsx`
- Create: `apps/app-admin/src/components/dashboard/CategoryBreakdown.tsx`
- Create: `apps/app-admin/src/components/dashboard/AlertBanner.tsx`
- Create: `apps/app-admin/src/app/(admin)/dashboard/page.tsx`
- Create: `apps/app-admin/src/hooks/useDashboard.ts`

- [ ] **3.1** Write tests — `__tests__/api/kpis.test.ts`

```typescript
// GET /api/reports/kpis?date=2026-03-21
// → returns { today: { revenue, orderCount, avgTicket, tablesServed },
//             yesterday: { revenue, orderCount, avgTicket, tablesServed },
//             thisWeek: { revenue }, lastWeek: { revenue },
//             paymentBreakdown: { cash, mp, card, transfer },
//             categoryBreakdown: { food, drinks, cocktails, poolChips, delivery } }

// Test: uses daily_accounting row for today; falls back to computing from payments if no snapshot
// Test: returns 401 if not authenticated
// Test: returns 403 if role is not admin/superadmin
```

- [ ] **3.2** Run tests — verify FAIL

- [ ] **3.3** Create `apps/app-admin/src/app/api/reports/kpis/route.ts`
  - `GET /api/reports/kpis?date=YYYY-MM-DD`
  - Server-side: authenticate with `requireAdmin()`
  - Query `daily_accounting` for `date` and `date - 1 day`
  - Query `daily_accounting` for current ISO week and previous ISO week (sum of rows)
  - Query `payments` grouped by `method` for today (for live payment breakdown when no snapshot yet)
  - Response shape:

```typescript
interface KpisResponse {
  today: {
    revenue: number
    orderCount: number
    avgTicket: number
    tablesServed: number
    discounts: number
    cancellations: number
  }
  yesterday: { revenue: number; orderCount: number; avgTicket: number }
  thisWeek: { revenue: number; orderCount: number }
  lastWeek: { revenue: number; orderCount: number }
  paymentBreakdown: { cash: number; mp: number; card: number; transfer: number }
  categoryBreakdown: {
    food: number
    drinks: number
    cocktails: number
    poolChips: number
    delivery: number
    other: number
  }
}
```

- [ ] **3.4** Create `apps/app-admin/src/components/dashboard/KpiCard.tsx`
  - Props: `label`, `value` (formatted string), `delta` (number, optional), `icon`, `loading`
  - Delta badge: green arrow up / red arrow down + percentage difference
  - Skeleton loading state

- [ ] **3.5** Create `apps/app-admin/src/components/dashboard/KpiGrid.tsx`
  - 4-column responsive grid (2 col on mobile)
  - Shows: Today's Revenue, Order Count, Average Ticket, Tables Served
  - Each KpiCard shows delta vs yesterday

- [ ] **3.6** Create `apps/app-admin/src/components/dashboard/CategoryBreakdown.tsx`
  - Horizontal stacked bar or grouped bar (Recharts `BarChart`)
  - Categories: Food / Drinks / Cocktails / Pool Chips / Delivery / Other
  - Color coded per category (gold=chips, green=food, blue=drinks, purple=cocktails)

- [ ] **3.7** Create `apps/app-admin/src/components/dashboard/PaymentBreakdown.tsx`
  - Recharts `PieChart` (donut style) with legend
  - Segments: Cash / MercadoPago / Card / Transfer
  - Center text: total revenue of the day

- [ ] **3.8** Create `apps/app-admin/src/components/dashboard/AlertBanner.tsx`
  - Reads from multiple sources (one server query):
    - Ingredients with `stock_current < stock_alert_threshold` → "N insumos con stock bajo"
    - Last sync_log entry with `status = 'failed'` → "Último sync falló: {error_message}"
    - Orders with `discount_amount > 0` in last 24h exceeding configurable threshold → "X descuentos aplicados hoy"
  - Each alert: icon + message + dismiss button (session-only dismiss)
  - If no alerts: show nothing (hidden)

- [ ] **3.9** Create `apps/app-admin/src/hooks/useDashboard.ts`
  - TanStack Query: `useQuery` for `/api/reports/kpis?date=${today}`
  - Refetch interval: 60 seconds (live dashboard)
  - Returns `{ data, isLoading, error }`

- [ ] **3.10** Create `apps/app-admin/src/app/(admin)/dashboard/page.tsx`
  - Server Component: calls `requireAdmin()`, pre-fetches today's KPIs via direct Prisma query
  - Passes initial data to client components via `initialData`
  - Renders: `AlertBanner` + `KpiGrid` + `CategoryBreakdown` + `PaymentBreakdown`
  - Page title: "Dashboard — {today's date formatted as 'Sábado, 21 de marzo de 2026'}"

- [ ] **3.11** Run tests — verify PASS

- [ ] **3.12** Commit: `feat(app-admin): add KPI dashboard with live comparisons and payment breakdown`

---

## Task 4: Revenue charts + period selector

**Files:**
- Create: `apps/app-admin/src/app/api/reports/revenue/route.ts`
- Create: `apps/app-admin/src/components/charts/PeriodSelector.tsx`
- Create: `apps/app-admin/src/components/charts/RevenueLineChart.tsx`
- Create: `apps/app-admin/src/components/charts/RevenueBarChart.tsx`
- Create: `apps/app-admin/src/app/(admin)/reports/page.tsx`
- Create: `apps/app-admin/src/hooks/useRevenue.ts`

- [ ] **4.1** Write tests — `__tests__/api/revenue.test.ts`

```typescript
// GET /api/reports/revenue?period=daily&from=2026-03-01&to=2026-03-21
// → returns array of { date, revenue, orderCount, avgTicket }

// GET /api/reports/revenue?period=weekly&from=2026-01-01&to=2026-03-21
// → returns array of { weekStart, revenue, orderCount }

// GET /api/reports/revenue?period=monthly&year=2026
// → returns array of { month (1-12), revenue, orderCount }

// GET /api/reports/revenue?period=yearly
// → returns array of { year, revenue, orderCount }

// Test: daily queries sum from daily_accounting table
// Test: weekly queries group by ISO week
// Test: returns 401 unauthenticated
```

- [ ] **4.2** Run tests — verify FAIL

- [ ] **4.3** Create `apps/app-admin/src/app/api/reports/revenue/route.ts`
  - `GET /api/reports/revenue` — accepts `period` (`daily|weekly|monthly|yearly`), `from`, `to`, `year`
  - Auth: `requireAdmin()`
  - Daily: `SELECT date, revenue_total, orders_count, average_ticket FROM daily_accounting WHERE date BETWEEN $from AND $to ORDER BY date`
  - Weekly: `SELECT date_trunc('week', date) as week_start, SUM(revenue_total), SUM(orders_count) FROM daily_accounting GROUP BY week_start`
  - Monthly/Yearly: similar aggregations
  - Returns typed response array

- [ ] **4.4** Create `apps/app-admin/src/components/charts/PeriodSelector.tsx`
  - Tab group: "Hoy" / "Esta semana" / "Este mes" / "Este año" / "Personalizado"
  - "Personalizado": shows date range picker (two `<input type="date">` fields)
  - Returns `{ period, from, to }` via `onChange` callback
  - Highlights active tab with brand-500 underline

- [ ] **4.5** Create `apps/app-admin/src/components/charts/RevenueLineChart.tsx`
  - Recharts `LineChart` with `CartesianGrid`, `XAxis` (formatted dates), `YAxis` (ARS formatted), `Tooltip`, `Legend`
  - Lines: Total Revenue (gold), Order Count (secondary axis, blue)
  - Responsive container: `width="100%" height={320}`
  - Custom tooltip: formats currency in ARS

- [ ] **4.6** Create `apps/app-admin/src/components/charts/RevenueBarChart.tsx`
  - Recharts `BarChart` — used for period comparison (this period vs last period)
  - Two bar groups: "Período actual" (gold) vs "Período anterior" (muted)
  - Same axes + tooltip as line chart

- [ ] **4.7** Create `apps/app-admin/src/hooks/useRevenue.ts`
  - `useRevenue(period, from, to)` — TanStack Query, key includes period + date range
  - Returns series data + loading/error state

- [ ] **4.8** Create `apps/app-admin/src/app/(admin)/reports/page.tsx`
  - Client Component (needs period selector state)
  - `PeriodSelector` at top → drives all charts below
  - `RevenueLineChart` — full width
  - `RevenueBarChart` — comparison vs previous equivalent period
  - Summary row: total revenue, total orders, avg ticket for selected period
  - Navigation cards to sub-reports: Products / Tables / Hours / Discounts / Waiter Performance

- [ ] **4.9** Run tests — verify PASS

- [ ] **4.10** Commit: `feat(app-admin): add revenue charts with period selector`

---

## Task 5: Top products, top tables, peak hours heatmap

**Files:**
- Create: `apps/app-admin/src/app/api/reports/products/route.ts`
- Create: `apps/app-admin/src/app/api/reports/tables/route.ts`
- Create: `apps/app-admin/src/app/api/reports/hours/route.ts`
- Create: `apps/app-admin/src/components/reports/ProductRankingTable.tsx`
- Create: `apps/app-admin/src/components/reports/TableRankingTable.tsx`
- Create: `apps/app-admin/src/components/charts/PeakHoursHeatmap.tsx`
- Create: `apps/app-admin/src/app/(admin)/reports/products/page.tsx`
- Create: `apps/app-admin/src/app/(admin)/reports/tables/page.tsx`
- Create: `apps/app-admin/src/app/(admin)/reports/hours/page.tsx`

- [ ] **5.1** Write tests — `__tests__/api/revenue.test.ts` (extend existing file)

```typescript
// GET /api/reports/products?from=2026-03-01&to=2026-03-21
// → [{ productId, name, category, quantitySold, revenue }] sorted by revenue DESC, limit 20

// GET /api/reports/tables?from=2026-03-01&to=2026-03-21
// → [{ tableId, number, sessions, revenue, avgTicket }] sorted by revenue DESC

// GET /api/reports/hours?from=2026-03-01&to=2026-03-21
// → [{ dayOfWeek (0-6), hour (0-23), orderCount, revenue }] — 168 rows max
```

- [ ] **5.2** Run tests — verify FAIL

- [ ] **5.3** Create `apps/app-admin/src/app/api/reports/products/route.ts`
  - Auth: `requireAdmin()`
  - Prisma query: join `order_items` → `orders` → filter by `created_at` range + `orders.status != 'cancelled'`
  - Group by `product_id`, sum `quantity` and `unit_price * quantity`
  - Join `products` for name + category name
  - Order by revenue DESC, limit 50

- [ ] **5.4** Create `apps/app-admin/src/app/api/reports/tables/route.ts`
  - Join `table_sessions` → `orders` → `payments`
  - Group by `table_id`, count sessions, sum payments
  - Join `tables` for table number
  - Order by revenue DESC

- [ ] **5.5** Create `apps/app-admin/src/app/api/reports/hours/route.ts`
  - Query `orders` in date range (status != cancelled)
  - Extract `EXTRACT(DOW FROM created_at)` and `EXTRACT(HOUR FROM created_at)`
  - Group by `(day_of_week, hour)`, count orders + sum totals
  - Returns flat array of `{ dayOfWeek, hour, orderCount, revenue }`

- [ ] **5.6** Create `apps/app-admin/src/components/reports/ProductRankingTable.tsx`
  - Columns: Rank, Product name, Category (badge), Qty sold, Revenue
  - Sortable columns (client-side sort)
  - Search/filter input at top
  - Category filter tabs: All / Food / Drinks / Cocktails / Pool Chips

- [ ] **5.7** Create `apps/app-admin/src/components/reports/TableRankingTable.tsx`
  - Columns: Rank, Table #, Sessions, Total Revenue, Avg Ticket
  - Color code top 3 rows with gold/silver/bronze indicators

- [ ] **5.8** Create `apps/app-admin/src/components/charts/PeakHoursHeatmap.tsx`
  - 7 rows (Mon-Sun) × 24 columns (0h-23h)
  - Each cell colored by intensity: transparent (0) → amber-900 → amber-500 → brand-400 (max)
  - Tooltip on hover: "Lunes 14h: 23 pedidos, $45.600"
  - X-axis labels: every 2 hours (0, 2, 4 … 22)
  - Y-axis labels: day names (Lun, Mar, Mié, Jue, Vie, Sáb, Dom)
  - Implementation: plain `<div>` grid (no Recharts — more control for heatmap)

- [ ] **5.9** Create pages for each sub-report:
  - `reports/products/page.tsx` — `PeriodSelector` + `ProductRankingTable`
  - `reports/tables/page.tsx` — `PeriodSelector` + `TableRankingTable`
  - `reports/hours/page.tsx` — `PeriodSelector` + `PeakHoursHeatmap`

- [ ] **5.10** Run tests — verify PASS

- [ ] **5.11** Commit: `feat(app-admin): add product/table rankings and peak hours heatmap`

---

## Task 6: Discount, cancellation and waiter performance reports

**Files:**
- Create: `apps/app-admin/src/app/api/reports/discounts/route.ts`
- Create: `apps/app-admin/src/app/api/reports/waiters/route.ts`
- Create: `apps/app-admin/src/components/reports/DiscountCancellationTable.tsx`
- Create: `apps/app-admin/src/components/reports/WaiterPerformanceTable.tsx`
- Create: `apps/app-admin/src/app/(admin)/reports/discounts/page.tsx`

- [ ] **6.1** Write tests — extend `__tests__/api/revenue.test.ts`

```typescript
// GET /api/reports/discounts?from=2026-03-01&to=2026-03-21
// → [{ orderId, tableNumber, staffName, discountAmount, discountReason,
//       cancellationReason, createdAt, type: 'discount'|'cancellation' }]

// GET /api/reports/waiters?from=2026-03-01&to=2026-03-21
// → [{ staffId, name, tablesServed, ordersCreated, revenueGenerated,
//       avgTicket, discountsApplied, cancellations }]
```

- [ ] **6.2** Run tests — verify FAIL

- [ ] **6.3** Create `apps/app-admin/src/app/api/reports/discounts/route.ts`
  - Auth: `requireAdmin()`
  - Query `orders` where `discount_amount > 0 OR status = 'cancelled'` in date range
  - Join `table_sessions` → `tables` for table number
  - Join `staff` (via `created_by`) for staff name
  - Order by `created_at DESC`

- [ ] **6.4** Create `apps/app-admin/src/app/api/reports/waiters/route.ts`
  - Auth: `requireAdmin()`
  - Query `staff` where `role = 'waiter'` and `venue_id = venueId`
  - For each waiter: subquery count of `table_sessions` opened, sum of `orders.total` for orders they created, count of discounts/cancellations
  - Return ranked by revenue DESC

- [ ] **6.5** Create `apps/app-admin/src/components/reports/DiscountCancellationTable.tsx`
  - Columns: Date/Time, Table, Staff, Type (badge: Descuento/Cancelación), Amount/Impact, Reason
  - Filter tabs: All / Discounts only / Cancellations only
  - Total row at bottom: total discount amount + total cancelled amount

- [ ] **6.6** Create `apps/app-admin/src/components/reports/WaiterPerformanceTable.tsx`
  - Columns: Rank, Waiter Name, Tables Served, Revenue Generated, Avg Ticket, Discounts, Cancellations
  - Color code: high cancellations → amber warning icon

- [ ] **6.7** Create `apps/app-admin/src/app/(admin)/reports/discounts/page.tsx`
  - `PeriodSelector` + `DiscountCancellationTable`
  - Summary cards: Total discounts applied / Total value of discounts / Total cancellations

- [ ] **6.8** Add waiter performance section to `reports/page.tsx` — link card to waiter sub-report

- [ ] **6.9** Run tests — verify PASS

- [ ] **6.10** Commit: `feat(app-admin): add discount/cancellation report and waiter performance`

---

## Task 7: Accounting — daily balance + date navigation

**Files:**
- Create: `apps/app-admin/src/app/api/accounting/[date]/route.ts`
- Create: `apps/app-admin/src/components/accounting/DailyBalanceCard.tsx`
- Create: `apps/app-admin/src/components/accounting/AccountingDateNav.tsx`
- Create: `apps/app-admin/src/components/accounting/WeeklyBalanceChart.tsx`
- Create: `apps/app-admin/src/components/accounting/MonthlyBalanceSummary.tsx`
- Create: `apps/app-admin/src/app/(admin)/accounting/page.tsx`
- Create: `apps/app-admin/src/app/(admin)/accounting/[date]/page.tsx`
- Create: `apps/app-admin/src/hooks/useAccounting.ts`

- [ ] **7.1** Write tests — `__tests__/api/accounting.test.ts`

```typescript
// GET /api/accounting/2026-03-21
// → {
//     date: '2026-03-21',
//     revenue: { total, food, drinks, cocktails, poolChips, delivery, other },
//     payments: { cash, mp, card, transfer },
//     expenses: { total, byCategory: [{ name, amount }] },
//     waste: { estimatedCost },
//     netProfit: revenue.total - expenses.total - waste.estimatedCost,
//     ordersCount, avgTicket, discounts, cancellations,
//     snapshot: boolean  // true if from daily_accounting, false if computed live
//   }

// Test: when daily_accounting row exists → uses snapshot data
// Test: when no snapshot → computes from payments + orders tables
// Test: expenses aggregated from expenses table for that date
// Test: waste cost from waste_log for that date
// Test: returns 400 for invalid date format
// Test: returns 401 unauthenticated
```

- [ ] **7.2** Run tests — verify FAIL

- [ ] **7.3** Create `apps/app-admin/src/app/api/accounting/[date]/route.ts`
  - `GET /api/accounting/:date` — date is `YYYY-MM-DD`
  - Auth: `requireAdmin()`
  - Validate date format with `date-fns` `isValid(parseISO(date))`; return 400 if invalid
  - Step 1: fetch `daily_accounting` row for that date
  - Step 2: fetch expenses for that date (`SUM(amount)` grouped by category)
  - Step 3: fetch waste_log for that date (`SUM(estimated_cost)`)
  - If no daily_accounting row (e.g., today hasn't been snapshotted yet): compute revenue from `payments` + `orders` tables live
  - Return combined response as typed object

- [ ] **7.4** Create `apps/app-admin/src/hooks/useAccounting.ts`
  - `useAccounting(date: string)` — TanStack Query with key `['accounting', date]`
  - Uses `fetch('/api/accounting/' + date)`

- [ ] **7.5** Create `apps/app-admin/src/components/accounting/AccountingDateNav.tsx`
  - `← Ayer` button | current date display (formatted) | `Hoy →` button
  - `Hoy →` disabled when already on today
  - Clicking a date navigates to `/accounting/YYYY-MM-DD`
  - Optional date picker popup for arbitrary date selection
  - Shows day name (e.g., "Sábado, 21 de marzo de 2026")

- [ ] **7.6** Create `apps/app-admin/src/components/accounting/DailyBalanceCard.tsx`
  - Three-column summary: Revenue (green) / Expenses (red) / Net Profit (gold if positive, red if negative)
  - Breakdown rows underneath: per-category revenue + per-category expenses
  - "Cierre estimado" badge if data is live (not yet snapshotted)

- [ ] **7.7** Create `apps/app-admin/src/components/accounting/WeeklyBalanceChart.tsx`
  - Recharts `BarChart` — 7 bars for Mon-Sun of current week
  - Each bar: revenue (stacked gold) + expenses (stacked red)
  - Net profit line overlay on secondary axis
  - Click on a bar → navigate to that day's accounting page

- [ ] **7.8** Create `apps/app-admin/src/components/accounting/MonthlyBalanceSummary.tsx`
  - Fetches all `daily_accounting` rows for current month
  - Summary: total revenue, total expenses (from expenses table), net profit
  - Week-by-week breakdown table: Week 1 / Week 2 / Week 3 / Week 4

- [ ] **7.9** Create `apps/app-admin/src/app/(admin)/accounting/page.tsx`
  - Redirects to `/accounting/${format(new Date(), 'yyyy-MM-dd')}`

- [ ] **7.10** Create `apps/app-admin/src/app/(admin)/accounting/[date]/page.tsx`
  - Server Component with `requireAdmin()`
  - Renders: `AccountingDateNav` + `DailyBalanceCard` + `WeeklyBalanceChart` + `MonthlyBalanceSummary`
  - At bottom: `ExportPdfButton` (implemented in Task 9)

- [ ] **7.11** Run tests — verify PASS

- [ ] **7.12** Commit: `feat(app-admin): add accounting daily balance with date navigation`

---

## Task 8: Expense management

**Files:**
- Create: `apps/app-admin/src/app/api/expenses/route.ts`
- Create: `apps/app-admin/src/app/api/expenses/[id]/route.ts`
- Create: `apps/app-admin/src/components/expenses/ExpenseList.tsx`
- Create: `apps/app-admin/src/components/expenses/ExpenseFormModal.tsx`
- Create: `apps/app-admin/src/components/expenses/ReceiptUpload.tsx`
- Create: `apps/app-admin/src/components/expenses/ExpenseCategoryBadge.tsx`
- Create: `apps/app-admin/src/app/(admin)/expenses/page.tsx`
- Create: `apps/app-admin/src/hooks/useExpenses.ts`

- [ ] **8.1** Write tests — `__tests__/api/expenses.test.ts`

```typescript
// GET /api/expenses?from=2026-03-01&to=2026-03-21 → list of expenses in range
// POST /api/expenses → creates expense; validates: description required, amount > 0, date required
// PATCH /api/expenses/:id → updates expense; 404 if not found
// DELETE /api/expenses/:id → deletes expense; 404 if not found
// Test: POST with receipt_url stores the URL (upload is handled separately via Storage)
// Test: all endpoints return 401 unauthenticated
// Test: DELETE returns 403 for 'admin' role (only superadmin can delete)
```

- [ ] **8.2** Run tests — verify FAIL

- [ ] **8.3** Create `apps/app-admin/src/app/api/expenses/route.ts`
  - `GET /api/expenses` — list with optional `from`, `to`, `categoryId` filters; paginated (default limit 50)
  - `POST /api/expenses` — create; body: `{ description, amount, date, categoryId, paymentMethod, receiptUrl? }`
  - Validate with `zod` schema inline
  - Set `registered_by` from authenticated session's staff id

- [ ] **8.4** Create `apps/app-admin/src/app/api/expenses/[id]/route.ts`
  - `PATCH /api/expenses/:id` — partial update; return 404 if not found
  - `DELETE /api/expenses/:id` — requires `superadmin` role (call `requireSuperadmin()`)

- [ ] **8.5** Create `apps/app-admin/src/components/expenses/ReceiptUpload.tsx`
  - File input accepting `image/*`
  - On select: upload to Supabase Storage bucket `receipts/{venue_id}/{date}/{uuid}.jpg`
  - Show upload progress bar
  - On success: calls `onUploaded(publicUrl)` callback
  - Show thumbnail preview of uploaded receipt

- [ ] **8.6** Create `apps/app-admin/src/components/expenses/ExpenseFormModal.tsx`
  - Fields: Description (text), Amount (number, ARS), Date (date picker), Category (select), Payment Method (select), Receipt (ReceiptUpload component)
  - Pre-fills when editing existing expense
  - Submit: POST or PATCH depending on mode
  - Inline validation errors

- [ ] **8.7** Create `apps/app-admin/src/components/expenses/ExpenseCategoryBadge.tsx`
  - Colored badge pill using category's `color` field
  - Shows category icon + name

- [ ] **8.8** Create `apps/app-admin/src/components/expenses/ExpenseList.tsx`
  - Paginated table: Date, Description, Category, Amount, Method, Receipt (eye icon)
  - Filter bar: date range + category dropdown
  - Edit icon per row → opens `ExpenseFormModal`
  - Delete icon per row → confirm dialog → DELETE request
  - "Nueva Expense" button at top right → opens blank `ExpenseFormModal`
  - Total row: sum of filtered expenses

- [ ] **8.9** Create `apps/app-admin/src/hooks/useExpenses.ts`
  - `useExpenses(filters)` — TanStack Query
  - `useCreateExpense()`, `useUpdateExpense()`, `useDeleteExpense()` — mutations with optimistic updates + invalidation

- [ ] **8.10** Create `apps/app-admin/src/app/(admin)/expenses/page.tsx`
  - `ExpenseList` full page
  - Summary cards above list: Total this month / Total this year / Largest category

- [ ] **8.11** Run tests — verify PASS

- [ ] **8.12** Commit: `feat(app-admin): add expense management with receipt upload`

---

## Task 9: PDF export (daily + monthly accounting reports)

**Files:**
- Create: `apps/app-admin/src/pdf/DailyReportPdf.tsx`
- Create: `apps/app-admin/src/pdf/MonthlyReportPdf.tsx`
- Create: `apps/app-admin/src/components/accounting/ExportPdfButton.tsx`
- Create: `apps/app-admin/src/app/api/accounting/[date]/pdf/route.ts`

- [ ] **9.1** Write tests

```typescript
// GET /api/accounting/2026-03-21/pdf
// → response Content-Type: application/pdf
// → response Content-Disposition: attachment; filename="myway-2026-03-21.pdf"
// Test: includes all revenue, expenses, net profit in the generated document (snapshot test)
// Test: returns 401 unauthenticated
```

- [ ] **9.2** Run tests — verify FAIL

- [ ] **9.3** Create `apps/app-admin/src/pdf/DailyReportPdf.tsx`
  - `@react-pdf/renderer` document
  - Header: venue logo + name + "Reporte Diario — {date}"
  - Section 1 — Ingresos: table with category rows + total, payment method breakdown
  - Section 2 — Egresos: expense table grouped by category
  - Section 3 — Mermas: waste log entries + cost
  - Section 4 — Resumen: Revenue - Expenses - Waste = Net Profit (large, prominent)
  - Footer: "Generado el {datetime}" + admin name
  - Uses `@myway/ui` brand colors (convert to hex for PDF)

- [ ] **9.4** Create `apps/app-admin/src/pdf/MonthlyReportPdf.tsx`
  - Similar structure but for a full month
  - Summary per week + totals
  - Bar chart embedded as SVG (recharts rendered to SVG string, embedded in PDF)

- [ ] **9.5** Create `apps/app-admin/src/app/api/accounting/[date]/pdf/route.ts`
  - `GET /api/accounting/:date/pdf`
  - Fetches same data as `/api/accounting/:date`
  - Renders `DailyReportPdf` with `renderToBuffer()` from `@react-pdf/renderer`
  - Returns response with `Content-Type: application/pdf` and `Content-Disposition: attachment`

- [ ] **9.6** Create `apps/app-admin/src/components/accounting/ExportPdfButton.tsx`
  - Button with PDF icon
  - On click: `window.open('/api/accounting/{date}/pdf', '_blank')`
  - Loading state while PDF generates
  - Shows in `accounting/[date]/page.tsx`

- [ ] **9.7** Run tests — verify PASS

- [ ] **9.8** Commit: `feat(app-admin): add PDF export for daily and monthly accounting reports`

---

## Task 10: Waste log

**Files:**
- Create: `apps/app-admin/src/app/api/waste/route.ts`
- Create: `apps/app-admin/src/components/waste/WasteLogTable.tsx`
- Create: `apps/app-admin/src/components/waste/AddWasteModal.tsx`
- Create: `apps/app-admin/src/app/(admin)/waste/page.tsx`
- Create: `apps/app-admin/src/hooks/useWasteLog.ts`

- [ ] **10.1** Write tests — `__tests__/api/waste.test.ts`

```typescript
// GET /api/waste?from=2026-03-01&to=2026-03-21 → list of waste log entries
// POST /api/waste → creates entry; validates: quantity > 0, reason required
// Test: POST deducts quantity from ingredient stock (creates ingredient_stock_movement of type 'waste')
// Test: POST with product_id (not ingredient_id) also accepted
// Test: returns 401 unauthenticated
```

- [ ] **10.2** Run tests — verify FAIL

- [ ] **10.3** Create `apps/app-admin/src/app/api/waste/route.ts`
  - `GET /api/waste` — list with optional `from`, `to` date filters; joins ingredient/product for names
  - `POST /api/waste` — validates body with zod:
    ```typescript
    z.object({
      ingredientId: z.string().uuid().optional(),
      productId: z.string().uuid().optional(),
      quantity: z.number().positive(),
      unit: z.string(),
      reason: z.enum(['expired', 'accident', 'preparation_error', 'other']),
      notes: z.string().optional(),
      estimatedCost: z.number().min(0),
    }).refine(d => d.ingredientId ?? d.productId, {
      message: 'Either ingredientId or productId required',
    })
    ```
  - On create: if `ingredientId` present, also insert `ingredient_stock_movements` record with type `'waste'` and negative quantity
  - Update `ingredients.stock_current` accordingly

- [ ] **10.4** Create `apps/app-admin/src/components/waste/WasteLogTable.tsx`
  - Columns: Date, Item (ingredient/product name), Qty + Unit, Reason (badge), Estimated Cost, Registered By
  - Filter: date range + reason dropdown
  - Total cost row at bottom

- [ ] **10.5** Create `apps/app-admin/src/components/waste/AddWasteModal.tsx`
  - Toggle: "Ingrediente" / "Producto"
  - Ingredient mode: searchable select of ingredients (with current stock shown)
  - Product mode: searchable select of products
  - Fields: Quantity, Reason (select), Notes (optional), Estimated Cost (auto-calculated from ingredient cost_per_unit, editable)
  - Submits POST to `/api/waste`

- [ ] **10.6** Create `apps/app-admin/src/hooks/useWasteLog.ts`
  - `useWasteLog(filters)` — TanStack Query
  - `useCreateWasteEntry()` — mutation

- [ ] **10.7** Create `apps/app-admin/src/app/(admin)/waste/page.tsx`
  - `WasteLogTable` + "Registrar Merma" button → `AddWasteModal`
  - Summary cards: total waste cost this month / top wasted ingredient

- [ ] **10.8** Run tests — verify PASS

- [ ] **10.9** Commit: `feat(app-admin): add waste log with stock deduction`

---

## Task 11: Sync log viewer + manual backup

**Files:**
- Create: `apps/app-admin/src/app/api/admin/sync/route.ts`
- Create: `apps/app-admin/src/components/sync/SyncLogTable.tsx`
- Create: `apps/app-admin/src/components/sync/ManualBackupButton.tsx`
- Create: `apps/app-admin/src/app/(admin)/sync/page.tsx`

- [ ] **11.1** Write tests — `__tests__/api/sync.test.ts`

```typescript
// GET (via page) renders SyncLogTable with data from sync_log table
// POST /api/admin/sync → returns { success: true, message: 'Sync triggered' }
// Test: POST /api/admin/sync → inserts a sync_log entry with status 'success' or 'failed'
// Test: POST returns 401 unauthenticated
// Test: POST returns 403 for non-admin role
```

- [ ] **11.2** Run tests — verify FAIL

- [ ] **11.3** Create `apps/app-admin/src/app/api/admin/sync/route.ts`
  - `POST /api/admin/sync`
  - Auth: `requireAdmin()`
  - Inserts a row into `sync_log` with `status = 'success'` and a note that it was manually triggered
  - Note: the actual data sync runs on `local-server`. This endpoint only logs a manual trigger event visible in the sync log. If local-server exposes a webhook URL (configurable in venue settings), this route can additionally POST to that URL with the venue's service role key
  - Returns `{ success: true, triggeredAt: ISO_timestamp }`

- [ ] **11.4** Create `apps/app-admin/src/components/sync/SyncLogTable.tsx`
  - Columns: Started At, Finished At, Duration (computed), Status (badge: success=green/partial=amber/failed=red), Records Pushed, Records Pulled, Error Message (truncated with expand)
  - Sorted by started_at DESC, paginated (20 per page)
  - Status filter tabs: All / Success / Failed

- [ ] **11.5** Create `apps/app-admin/src/components/sync/ManualBackupButton.tsx`
  - Button: "Forzar Sync Ahora"
  - On click: POST to `/api/admin/sync`, show spinner
  - On success: toast "Sync iniciado correctamente" + refetch sync log table
  - On error: toast "Error al iniciar sync: {message}"

- [ ] **11.6** Create `apps/app-admin/src/app/(admin)/sync/page.tsx`
  - Server Component: fetch last 100 sync_log entries via Prisma
  - Renders: status summary (last sync time + status badge) + `ManualBackupButton` + `SyncLogTable`
  - Shows `sync_state.last_successful_sync_at` prominently at top

- [ ] **11.7** Run tests — verify PASS

- [ ] **11.8** Commit: `feat(app-admin): add sync log viewer and manual backup trigger`

---

## Task 12: Venue settings

**Files:**
- Create: `apps/app-admin/src/components/settings/VenueForm.tsx`
- Create: `apps/app-admin/src/components/settings/LogoUpload.tsx`
- Create: `apps/app-admin/src/components/settings/ThemeColorPicker.tsx`
- Create: `apps/app-admin/src/app/api/settings/route.ts`
- Create: `apps/app-admin/src/app/(admin)/settings/page.tsx`

- [ ] **12.1** Write tests

```typescript
// GET /api/settings → returns venue row (id, name, address, logo_url, settings_json)
// PATCH /api/settings → updates venue; validates name not empty
// Test: logo_url updated after upload
// Test: settings_json stores { primaryColor, surfaceColor, businessHours }
// Test: returns 401 unauthenticated; returns 403 for non-admin
```

- [ ] **12.2** Run tests — verify FAIL

- [ ] **12.3** Create `apps/app-admin/src/app/api/settings/route.ts`
  - `GET /api/settings` — returns venue row for authenticated user's `venue_id`
  - `PATCH /api/settings` — updates `name`, `address`, `logo_url`, `settings_json`
  - `settings_json` schema:
    ```typescript
    interface VenueSettings {
      primaryColor: string       // hex color for brand accent
      surfaceColor: string       // hex color for surface background
      businessHours: {
        [day: string]: { open: string; close: string; closed: boolean }
      }
    }
    ```

- [ ] **12.4** Create `apps/app-admin/src/components/settings/LogoUpload.tsx`
  - Accepts image files; uploads to `logos/{venue_id}/{uuid}.jpg` in Supabase Storage
  - Shows current logo preview
  - On upload success: calls `onUploaded(url)` + updates venue via PATCH /api/settings

- [ ] **12.5** Create `apps/app-admin/src/components/settings/ThemeColorPicker.tsx`
  - Two color pickers: "Color de acento" (brand) + "Color de fondo" (surface)
  - HTML `<input type="color">` with live preview applied to a mini UI mockup
  - Saves to `venue.settings_json.primaryColor` + `settings_json.surfaceColor`

- [ ] **12.6** Create `apps/app-admin/src/components/settings/VenueForm.tsx`
  - Fields: Venue Name, Address, Business Hours (per day: open/close time + closed toggle)
  - Save button with loading state
  - Inline success/error feedback

- [ ] **12.7** Create `apps/app-admin/src/app/(admin)/settings/page.tsx`
  - Server Component: fetch venue data
  - Renders: `LogoUpload` + `VenueForm` + `ThemeColorPicker`
  - Separate section: "Seguridad" — link to configure 2FA (calls Supabase MFA enrollment)
  - 2FA setup: shows QR code from `supabase.auth.mfa.enroll({ factorType: 'totp' })`, then verify with 6-digit code

- [ ] **12.8** Run tests — verify PASS

- [ ] **12.9** Commit: `feat(app-admin): add venue settings with logo upload and theme customization`

---

## Task 13: Date utilities + format helpers

**Files:**
- Create: `apps/app-admin/src/lib/date.ts`
- Create: `apps/app-admin/src/lib/format.ts`

- [ ] **13.1** Write tests — `__tests__/lib/date.test.ts`

```typescript
// getDateRange('today') → { from: startOfDay(today), to: endOfDay(today) }
// getDateRange('week') → { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(...) }
// getDateRange('month') → { from: startOfMonth(today), to: endOfMonth(today) }
// getDateRange('year') → { from: startOfYear(today), to: endOfYear(today) }
// formatARS(1234.5) → '$1.234,50'
// formatARS(0) → '$0,00'
// getDaysBetween('2026-03-01', '2026-03-21') → 20
// toISODate(new Date('2026-03-21T10:00:00Z')) → '2026-03-21'
```

- [ ] **13.2** Run tests — verify FAIL

- [ ] **13.3** Create `apps/app-admin/src/lib/date.ts`

```typescript
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  format, parseISO, isValid, differenceInDays
} from 'date-fns'
import { es } from 'date-fns/locale'

export type DateRangePreset = 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'year'

export function getDateRange(preset: DateRangePreset): { from: Date; to: Date } {
  const now = new Date()
  switch (preset) {
    case 'today':    return { from: startOfDay(now), to: endOfDay(now) }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { from: startOfDay(y), to: endOfDay(y) }
    }
    case 'week':     return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'lastWeek': {
      const lw = new Date(now); lw.setDate(lw.getDate() - 7)
      return { from: startOfWeek(lw, { weekStartsOn: 1 }), to: endOfWeek(lw, { weekStartsOn: 1 }) }
    }
    case 'month':    return { from: startOfMonth(now), to: endOfMonth(now) }
    case 'year':     return { from: startOfYear(now), to: endOfYear(now) }
  }
}

export function toISODate(d: Date): string { return format(d, 'yyyy-MM-dd') }
export function formatLongDate(d: Date): string { return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) }
export function getDaysBetween(from: string, to: string): number {
  return differenceInDays(parseISO(to), parseISO(from))
}
export function isValidDate(s: string): boolean { return isValid(parseISO(s)) }
```

- [ ] **13.4** Create `apps/app-admin/src/lib/format.ts`

```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDelta(current: number, previous: number): { pct: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) return { pct: 0, direction: 'flat' }
  const pct = ((current - previous) / previous) * 100
  return { pct: Math.round(pct * 10) / 10, direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' }
}
```

- [ ] **13.5** Run tests — verify PASS

- [ ] **13.6** Commit: `feat(app-admin): add date and format utility helpers`

---

## Task 14: Prisma client + environment

**Files:**
- Create: `apps/app-admin/src/lib/prisma.ts`
- Create: `apps/app-admin/.env.example`

- [ ] **14.1** Create `apps/app-admin/src/lib/prisma.ts`
  - Singleton Prisma client for cloud PostgreSQL
  - Use global singleton pattern to avoid multiple clients in Next.js dev hot-reload:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **14.2** Create `apps/app-admin/.env.example`

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Prisma (direct Supabase PostgreSQL connection)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# App
NEXT_PUBLIC_APP_URL=https://admin.myway.com
```

- [ ] **14.3** Create `apps/app-admin/next.config.ts`

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@myway/ui', '@myway/types', '@myway/auth', '@myway/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default config
```

- [ ] **14.4** Commit: `chore(app-admin): add Prisma singleton and environment config`

---

## Task 15: Vitest setup + full test run

**Files:**
- Create: `apps/app-admin/vitest.config.ts`

- [ ] **15.1** Create `apps/app-admin/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **15.2** Create `apps/app-admin/src/__tests__/setup.ts`
  - Mock Prisma client with `vi.mock('@/lib/prisma')`
  - Mock Supabase server client with `vi.mock('@/lib/supabase-server')`
  - Export test helper `createMockSession(role: StaffRole)` for use in API tests

- [ ] **15.3** Run full test suite: `pnpm --filter @myway/app-admin test`
  - All tests must pass
  - Fix any failing tests

- [ ] **15.4** Run `pnpm --filter @myway/app-admin build`
  - Zero TypeScript errors
  - Zero build errors

- [ ] **15.5** Run `pnpm --filter @myway/app-admin lint`
  - Zero lint errors

- [ ] **15.6** Commit: `test(app-admin): add vitest setup and pass full test suite`

---

## Task 16: Integration test of full admin flow

- [ ] **16.1** Manual integration test checklist:
  - Login with email + password → redirects to dashboard
  - Login with wrong password → shows error, does not redirect
  - Non-admin role (e.g., waiter email) → redirects back to login after access attempt
  - Dashboard KPIs load and show today's date in heading
  - Period selector switches chart data (verify network calls in devtools)
  - Navigate to Accounting → today's date shown, prev/next day navigation works
  - Create an expense with receipt photo → appears in list and in accounting page
  - Register a waste entry → estimated cost shows in accounting page
  - Navigate to Sync log → shows last sync entries
  - Click "Forzar Sync Ahora" → shows toast, new entry appears in sync log
  - PDF export → browser downloads a PDF file with today's data
  - Settings: change venue name → persists after page reload

- [ ] **16.2** Fix any issues found in manual test

- [ ] **16.3** Commit: `test(app-admin): integration test pass — all flows verified`

---

## Verification Checklist

- [ ] `pnpm --filter @myway/app-admin build` — zero errors
- [ ] `pnpm --filter @myway/app-admin test` — all tests pass
- [ ] `pnpm --filter @myway/app-admin lint` — zero warnings
- [ ] Login with email+password works; wrong credentials show error
- [ ] TOTP challenge screen shown when MFA is enrolled on the account
- [ ] Waiter/kitchen/bar role attempting access is redirected to `/login`
- [ ] Dashboard KPIs reflect today's `daily_accounting` data
- [ ] Category breakdown and payment breakdown render correct Recharts visuals
- [ ] Revenue line chart responds to period selector (today / week / month / year)
- [ ] Peak hours heatmap renders a 7×24 colored grid with tooltips
- [ ] Top products table is sortable and category-filterable
- [ ] Discount/cancellation report shows correct staff names and amounts
- [ ] Waiter performance table ranks by revenue with cancellation warnings
- [ ] Accounting date navigation moves ±1 day and disables "→" on today
- [ ] `/accounting/2026-03-21` page renders without error for a past date
- [ ] Daily PDF export downloads and opens a valid PDF with correct figures
- [ ] Creating an expense with receipt photo: photo visible at Supabase Storage URL
- [ ] Deleting an expense with admin role → 403; with superadmin → succeeds
- [ ] Registering waste for an ingredient deducts from `ingredients.stock_current`
- [ ] Sync log shows last 100 entries with status badges
- [ ] Manual backup button creates a new sync_log entry
- [ ] Venue settings: changing name persists; logo upload shows in sidebar

---

*Previous: [Plan 5 — Waiter App](2026-03-21-plan-5-waiter.md)*
*Next: [Plan 7 — Menu Management](2026-03-21-plan-7-menu.md)*
