# My Way — Plan 1: Core Bar Operations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the working bar system: POS with salon view, Kitchen Display, Bar Display, real-time Socket.io events, and the 15-minute sync engine. After this plan, the bar can operate fully on the local network.

**Architecture:** `local-server` is the central hub. `app-pos`, `app-kitchen`, and `app-bar` are Next.js PWAs connecting to it via Socket.io. SQLite stores all local data. Sync engine pushes/pulls from Supabase every 15 min.

**Tech Stack:** Next.js 15, Socket.io 4, Prisma + SQLite, node-cron, @myway/ui, @myway/types, @myway/db

**Depends on:** Plan 0 (Foundation)

---

## File Map

```
apps/
├── app-pos/
│   ├── package.json
│   ├── next.config.ts
│   ├── src/app/
│   │   ├── layout.tsx                 # Root layout with dark theme + OfflineBanner
│   │   ├── page.tsx                   # Redirect to /login
│   │   ├── login/page.tsx             # PIN login screen
│   │   ├── salon/page.tsx             # Main salon view (table grid)
│   │   ├── salon/[tableId]/page.tsx   # Table detail: active order + add items
│   │   └── orders/page.tsx            # All active orders list
│   ├── src/components/
│   │   ├── SalonLayout.tsx            # Interactive table grid (no editor yet)
│   │   ├── TableCard.tsx              # Table status card
│   │   ├── OrderPanel.tsx             # Slide-in panel: order items + actions
│   │   └── AddItemsModal.tsx          # Browse menu, add to table
│   ├── src/hooks/
│   │   ├── useSocket.ts               # Socket.io connection + event listeners
│   │   ├── useOffline.ts              # Online/offline detection
│   │   └── useTables.ts               # Tables state with real-time updates
│   └── src/lib/
│       ├── api.ts                     # fetch wrapper for local-server API
│       └── auth.ts                    # PIN login + JWT storage
│
├── app-kitchen/
│   ├── package.json
│   ├── next.config.ts
│   └── src/app/
│       ├── layout.tsx
│       ├── login/page.tsx
│       ├── page.tsx                   # KDS main view
│       └── stock/page.tsx             # Stock view (kitchen ingredients)
│   └── src/components/
│       ├── OrderTicket.tsx            # Single order ficha
│       ├── TicketTimer.tsx            # Elapsed time with color coding
│       └── BumpButton.tsx             # Large state-advance button
│
├── app-bar/
│   ├── package.json
│   ├── next.config.ts
│   └── src/app/
│       ├── layout.tsx
│       ├── login/page.tsx
│       ├── page.tsx                   # Bar display main view
│       └── stock/page.tsx             # Bar stock view
│   └── src/components/
│       ├── DrinkTicket.tsx
│       ├── PoolChipCounter.tsx        # Prominent pool chip display
│       └── BumpButton.tsx
│
└── local-server/src/
    ├── routes/
    │   ├── auth.ts                    # POST /auth/pin-login
    │   ├── tables.ts                  # GET/PATCH /tables
    │   ├── table-sessions.ts          # POST/PATCH /table-sessions
    │   ├── orders.ts                  # GET/POST/PATCH /orders
    │   ├── order-items.ts             # POST/PATCH /order-items
    │   └── products.ts                # GET /products (read-only)
    ├── services/
    │   ├── order.service.ts           # Business logic: create order, update status
    │   ├── table.service.ts           # Open/close sessions, update status
    │   └── stock.service.ts           # Deduct stock on item delivered
    └── sync/
        ├── sync-engine.ts             # Main sync orchestrator
        ├── push.ts                    # Local → Supabase
        ├── pull.ts                    # Supabase → Local
        └── scheduler.ts              # node-cron 15-min job
```

---

## Task 1: local-server — PIN auth endpoint

- [ ] **1.1** Write test: `POST /auth/pin-login` with valid PIN returns JWT
- [ ] **1.2** Run test — verify FAIL
- [ ] **1.3** Create `apps/local-server/src/routes/auth.ts`
  - Hash input PIN with bcrypt, compare against `staff.pin_hash`
  - Check `locked_until` — return 423 if locked
  - On 5 failures: set `locked_until = NOW() + 15min`
  - On success: sign JWT with `VENUE_QR_SECRET`, return `{ token, staff: { id, name, role } }`
  - Reset `failed_pin_attempts = 0`, update `last_login_at`
- [ ] **1.4** Run test — verify PASS
- [ ] **1.5** Commit: `feat(local-server): add PIN login endpoint with lockout protection`

---

## Task 2: local-server — Tables and sessions API

- [ ] **2.1** Write tests: GET /tables returns all tables; PATCH /tables/:id/status updates status
- [ ] **2.2** Write tests: POST /table-sessions creates session and sets table status to 'occupied'
- [ ] **2.3** Run tests — verify FAIL
- [ ] **2.4** Create `apps/local-server/src/routes/tables.ts`
  - `GET /tables` — returns all tables with active session info joined
  - `PATCH /tables/:id/status` — update status, emit `table_status` socket event
- [ ] **2.5** Create `apps/local-server/src/routes/table-sessions.ts`
  - `POST /table-sessions` — open session, set table to 'occupied'
  - `PATCH /table-sessions/:id/close` — close session, set table to 'available'
- [ ] **2.6** Create `apps/local-server/src/services/table.service.ts` with business logic
- [ ] **2.7** Run tests — verify PASS
- [ ] **2.8** Commit: `feat(local-server): add tables and table sessions API`

---

## Task 3: local-server — Orders API

- [ ] **3.1** Write tests: create order → items route to correct target; update item status → emits socket
- [ ] **3.2** Run tests — verify FAIL
- [ ] **3.3** Create `apps/local-server/src/routes/orders.ts`
  - `POST /orders` — create order + items, emit `new_order` to all
  - `GET /orders` — active orders (filter by status != delivered/cancelled)
  - `PATCH /orders/:id/status` — advance status (validate state machine)
- [ ] **3.4** Create `apps/local-server/src/routes/order-items.ts`
  - `PATCH /order-items/:id/status` — update status, emit `item_ready` or `item_delivered`
  - On `delivered`: trigger stock deduction (call stock.service.ts)
- [ ] **3.5** Create `apps/local-server/src/services/order.service.ts`
  - Validates state machine transitions using `ORDER_STATUS_TRANSITIONS` constant
- [ ] **3.6** Create `apps/local-server/src/services/stock.service.ts`
  - On item delivered: find recipe → deduct each ingredient → emit `stock_low` if below threshold
- [ ] **3.7** Run tests — verify PASS
- [ ] **3.8** Commit: `feat(local-server): add orders API with state machine + stock deduction`

---

## Task 4: Sync engine

- [ ] **4.1** Write test: pushUnsynced() selects records with synced=false and upserts to Supabase
- [ ] **4.2** Write test: pullFromCloud() fetches records updated since last_sync_at
- [ ] **4.3** Run tests — verify FAIL
- [ ] **4.4** Create `apps/local-server/src/sync/push.ts`
  - Query each bidirectional table: `WHERE synced = false LIMIT 100`
  - Upsert to Supabase via REST API (service role key)
  - Mark as `synced = true, synced_at = NOW()`
  - `order_items`: append-only (no updates, only inserts)
  - `orders`: respect state machine (only advance status)
- [ ] **4.5** Create `apps/local-server/src/sync/pull.ts`
  - Query Supabase for each table: `updated_at > sync_state.last_sync_at`
  - Upsert into SQLite respecting conflict rules
  - Set `received_at_local` on delivery_orders when first seen
- [ ] **4.6** Create `apps/local-server/src/sync/sync-engine.ts`
  - Orchestrates push → pull → update sync_state → emit `sync_status` socket → write sync_log
  - Handles errors: write to sync_log with error_message
- [ ] **4.7** Create `apps/local-server/src/sync/scheduler.ts`
  - `node-cron` job: run sync every SYNC_INTERVAL_MINUTES
  - Also: listen for connectivity restore (check every 30s when offline) → run sync immediately
- [ ] **4.8** Run tests — verify PASS
- [ ] **4.9** Commit: `feat(local-server): add 15-min bidirectional sync engine`

---

## Task 5: app-pos scaffold + PIN login

- [ ] **5.1** Create Next.js app: `pnpm create next-app@latest apps/app-pos --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint` (the `--src-dir` flag puts everything under `src/`, matching the file map above)
- [ ] **5.2** Add `@myway/ui`, `@myway/types`, `@myway/utils` as workspace deps
- [ ] **5.3** Set up root layout with `OfflineBanner` and dark theme globals
- [ ] **5.4** Create `apps/app-pos/src/lib/auth.ts`
  - `loginWithPin(pin)` → POST to local-server `/auth/pin-login` → store JWT in localStorage
  - `logout()` → clear localStorage
  - `getToken()` → retrieve JWT
- [ ] **5.5** Create `apps/app-pos/src/app/login/page.tsx`
  - Numpad PIN entry (1-9, 0, backspace, confirm)
  - Show error on wrong PIN, lockout message if locked
  - On success: redirect to `/salon`
- [ ] **5.6** Test: enter correct PIN → redirects to salon
- [ ] **5.7** Commit: `feat(app-pos): scaffold + PIN login screen`

---

## Task 6: app-pos — useSocket + useTables hooks

- [ ] **6.1** Create `apps/app-pos/src/hooks/useSocket.ts`
  - Connect to `http://myway.local:3001` (or env var)
  - Reconnect on disconnect, track connected state
  - Return `{ socket, connected }`
- [ ] **6.2** Create `apps/app-pos/src/hooks/useOffline.ts`
  - Ping `/health` every 30s
  - Track `isOffline` state, update when status changes
- [ ] **6.3** Create `apps/app-pos/src/hooks/useTables.ts`
  - Fetch tables on mount
  - Listen to `table_status`, `table_closed`, `new_order` socket events → update state
  - Return `{ tables, loading }`
- [ ] **6.4** Commit: `feat(app-pos): add socket, offline, and tables hooks`

---

## Task 7: app-pos — Salon view

- [ ] **7.1** Create `apps/app-pos/src/components/TableCard.tsx`
  - Shows table number, status color (green/red/amber), occupancy time, seats
  - Pool tables show a pool icon
  - Pending items count badge
- [ ] **7.2** Create `apps/app-pos/src/components/SalonLayout.tsx`
  - Grid of TableCards grouped by zone (Salón Principal / Afuera) in tabs
  - Click on table → open OrderPanel
- [ ] **7.3** Create `apps/app-pos/src/app/salon/page.tsx`
  - Uses `useTables`, renders `SalonLayout`
  - Real-time updates via socket hooks
- [ ] **7.4** Test: table status change via socket → card color updates without refresh
- [ ] **7.5** Commit: `feat(app-pos): add salon view with real-time table grid`

---

## Task 8: app-pos — Order panel (view + add items)

- [ ] **8.1** Create `apps/app-pos/src/components/OrderPanel.tsx`
  - Slide-in panel on table click
  - Shows all order items grouped by status
  - "Open table" button if no active session
  - "Add items" button → AddItemsModal
  - Each item shows name, qty, price, status badge
- [ ] **8.2** Create `apps/app-pos/src/components/AddItemsModal.tsx`
  - Browse products by category
  - Quantity selector per item
  - Notes field per item
  - Submit → POST /orders with items
- [ ] **8.3** Test: add items → appear in KDS (if target=kitchen) and bar display (if target=bar)
- [ ] **8.4** Commit: `feat(app-pos): add order panel and item-adding flow`

---

## Task 9: app-kitchen scaffold + KDS view

- [ ] **9.1** Scaffold `apps/app-kitchen` (same as app-pos)
- [ ] **9.2** Create `apps/app-kitchen/src/components/TicketTimer.tsx`
  - Shows elapsed minutes since order created
  - Green < configurable threshold, yellow < 2x, red >= 2x
- [ ] **9.3** Create `apps/app-kitchen/src/components/BumpButton.tsx`
  - Large (full-width, 80px tall) button: "En preparación" / "Listo"
  - Single tap advances status
- [ ] **9.4** Create `apps/app-kitchen/src/components/OrderTicket.tsx`
  - Shows table/delivery, all items with status, elapsed timer, notes
  - BumpButton at bottom
- [ ] **9.5** Create `apps/app-kitchen/src/app/page.tsx`
  - Columns: Nuevo | En preparación | Listo
  - Listens to `new_order`, `order_updated` socket events
  - Sound alert on `new_order` (Audio API)
- [ ] **9.6** Test: new order appears; bump advances status; disappears when all items delivered
- [ ] **9.7** Commit: `feat(app-kitchen): add KDS with real-time order tickets and bump bar`

---

## Task 10: app-bar scaffold + bar display

- [ ] **10.1** Scaffold `apps/app-bar`
- [ ] **10.2** Create `apps/app-bar/src/components/PoolChipCounter.tsx`
  - Large, prominent display: "Mesa 5 — 3 fichas de pool"
  - Highlighted with amber/gold border
- [ ] **10.3** Create `apps/app-bar/src/components/DrinkTicket.tsx`
  - Same as OrderTicket but styled for bar
  - PoolChipCounter shown prominently at top if any pool chip items
- [ ] **10.4** Create `apps/app-bar/src/app/page.tsx`
  - Same column layout as kitchen
  - Filters items where `target = 'bar'`
  - Sound alert + vibration on mobile
- [ ] **10.5** Test: order with pool chip item → chip counter prominent in bar display
- [ ] **10.6** Commit: `feat(app-bar): add bar display with pool chip counter`

---

## Task 11: Kitchen + Bar stock views

- [ ] **11.1** Add `GET /ingredients?target=kitchen|bar` route to local-server
  - Returns ingredients relevant to that section via: `recipe_items JOIN recipes JOIN products WHERE products.target = $target`
  - This joins through recipe_items → recipes → products to find which ingredients belong to kitchen vs bar dishes
- [ ] **11.2** Add `POST /restock-requests` route to local-server
- [ ] **11.3** Create `apps/app-kitchen/src/app/stock/page.tsx`
  - List of kitchen ingredients with stock level bars
  - Color coded: green OK / amber low / red critical
  - "Solicitar reposición" button per ingredient → sends to admin
- [ ] **11.4** Create `apps/app-bar/src/app/stock/page.tsx` (same pattern)
- [ ] **11.5** Test: mark ingredient low → appears in admin as pending restock request
- [ ] **11.6** Commit: `feat(kitchen,bar): add stock views with restock request flow`

---

## Task 12: Integration test of full order flow

- [ ] **12.1** E2E test (manual or Playwright):
  - Open table in POS
  - Add 1 kitchen item + 1 bar item
  - Verify appears in app-kitchen (kitchen item only)
  - Verify appears in app-bar (bar item only)
  - Bump kitchen item to ready
  - Verify `item_ready` socket event received in POS
  - Bump bar item to ready
  - Mark items as delivered
  - Verify stock deducted if product has recipe
- [ ] **12.2** Commit: `test: add integration test for full order flow`

---

## Verification Checklist

- [ ] `pnpm build` — zero errors across all 3 apps + local-server
- [ ] PIN login works in app-pos, app-kitchen, app-bar
- [ ] Adding order in POS appears in KDS and bar display in < 1 second
- [ ] Bumping item status in kitchen updates POS in real-time
- [ ] Sync runs every 15 min (check sync_log in SQLite)
- [ ] OfflineBanner appears when local-server is unreachable
- [ ] Stock deducts when item marked as delivered

---

*Previous: [Plan 0 — Foundation](2026-03-21-plan-0-foundation.md)*
*Next: [Plan 2 — Customer QR Ordering](2026-03-21-plan-2-qr-ordering.md)*
