# My Way — Plan 2: Customer QR Ordering

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Customers scan a QR at their table and place orders from their phone — no login required. Orders arrive in real-time to kitchen and bar.

**Architecture:** QR contains a signed HMAC token. `web-customer` (Vercel) detects if on bar WiFi (ping `myway.local:3001/health`) and connects to local-server directly, otherwise goes through Supabase. QR generated in app-pos.

**Tech Stack:** Next.js 15, Socket.io client, QRCode.js, @myway/utils (signQrToken/verifyQrToken)

**Depends on:** Plan 1 (Core Bar Operations)

---

## File Map

```
apps/
├── web-customer/
│   ├── package.json
│   ├── next.config.ts
│   └── src/app/
│       ├── layout.tsx
│       ├── table/[token]/
│       │   ├── page.tsx               # QR landing: verify token → show menu
│       │   └── order/page.tsx         # Active order status tracker
│       └── api/
│           └── table/verify/route.ts  # Server: verify QR token → return table info
│   └── src/components/
│       ├── MenuView.tsx               # Categories + products grid
│       ├── ProductCard.tsx            # Product with photo, price, add button
│       ├── Cart.tsx                   # Floating cart with items
│       ├── OrderStatus.tsx            # Real-time order status tracker
│       ├── ModifierSelector.tsx       # Modal for product modifiers
│       └── CallWaiterButton.tsx       # "Llamar al mesero" button
│
└── app-pos/src/
    ├── components/
    │   └── QrGenerator.tsx            # Generate + display QR for a table
    └── app/
        └── salon/[tableId]/qr/page.tsx  # QR generation page
```

---

## Task 1: QR token endpoint in local-server

- [ ] **1.1** Write test: `GET /qr/:token` with valid token returns `{ tableId, tableNumber, venueId }`
- [ ] **1.2** Write test: expired or tampered token returns 401
- [ ] **1.3** Run tests — verify FAIL
- [ ] **1.4** Create `apps/local-server/src/routes/qr.ts`
  - `GET /qr/:token` — no auth required
  - Call `verifyQrToken(token, VENUE_QR_SECRET)` from @myway/utils
  - If valid: return table info + active session if any
  - If invalid/expired: return 401
- [ ] **1.5** Run tests — verify PASS
- [ ] **1.6** Commit: `feat(local-server): add QR token verification endpoint`

---

## Task 2: QR generator in app-pos

- [ ] **2.1** Add `qrcode` package to app-pos: `pnpm add qrcode @types/qrcode`
- [ ] **2.2** Create `apps/app-pos/src/components/QrGenerator.tsx`
  - Takes `tableId`, calls `POST /qr-codes` to generate signed token
  - Renders QR image using `qrcode` library
  - QR URL format: `https://pedidos.myway.com/table/{token}`
  - "Regenerar QR" button (invalidates old token)
  - "Imprimir" button → opens print dialog with QR + table number
- [ ] **2.3** Add `apps/app-pos/app/salon/[tableId]/qr/page.tsx`
- [ ] **2.4** Add `POST /qr-codes` route to local-server
  - Generate token with `signQrToken`, store in `qr_codes` table
  - Deactivate previous QR for that table
- [ ] **2.5** Test: generate QR, verify token in DB, old QR deactivated
- [ ] **2.6** Commit: `feat(app-pos): add QR generation per table`

---

## Task 3: web-customer app scaffold + local network detection

- [ ] **3.1** Create `apps/web-customer` Next.js app
- [ ] **3.2** Create `apps/web-customer/src/lib/server-url.ts`
  ```typescript
  // Detects whether to use local-server or cloud
  export async function resolveServerUrl(): Promise<string> {
    const localUrl = process.env.NEXT_PUBLIC_LOCAL_SERVER_URL ?? 'http://myway.local:3001'
    try {
      const res = await fetch(`${localUrl}/health`, {
        signal: AbortSignal.timeout(800),
      })
      if (res.ok) return localUrl
    } catch { /* timeout or unreachable */ }
    return process.env.NEXT_PUBLIC_API_URL ?? 'https://api.myway.com'
  }
  ```
- [ ] **3.3** Commit: `feat(web-customer): scaffold + local network detection`

---

## Task 4: QR landing page + menu display

- [ ] **4.1** Create `apps/web-customer/src/app/api/table/verify/route.ts`
  - Server action: verify token against local-server or Supabase
  - Returns `{ valid, tableId, tableNumber, type, venueId }`
- [ ] **4.2** Create `apps/web-customer/src/app/table/[token]/page.tsx`
  - On load: verify token
  - If invalid: show "QR inválido o expirado" error page
  - If valid: show `MenuView`
  - Store `tableToken` in sessionStorage for subsequent requests
- [ ] **4.3** Create `apps/web-customer/src/components/MenuView.tsx`
  - Fetch `GET /products?venueId=...` from resolved server
  - Group products by category tabs
  - If table type = 'pool': show "Fichas de Pool" section at top
  - Each product: `ProductCard` with add-to-cart button
- [ ] **4.4** Create `apps/web-customer/src/components/ProductCard.tsx`
  - Shows image, name, price, allergens
  - "+ Add" button → if has modifiers: open `ModifierSelector` first
- [ ] **4.5** Create `apps/web-customer/src/components/ModifierSelector.tsx`
  - Modal showing modifier groups (required/optional)
  - Validates required selections before confirming
- [ ] **4.6** Test: scan QR token → menu loads → products visible grouped by category
- [ ] **4.7** Commit: `feat(web-customer): add QR table landing + menu display`

---

## Task 5: Cart + order submission

- [ ] **5.1** Create `apps/web-customer/src/components/Cart.tsx`
  - Floating bottom bar with item count + total
  - Expand to show full cart
  - Quantity +/- per item, remove item, notes per item
  - "Pedir" button
- [ ] **5.2** Use Zustand for cart state (`src/store/cart.ts`)
  - Persist to localStorage (survives page refresh on same table)
  - Clear cart on successful order
- [ ] **5.3** Create `POST /orders` handling for anonymous table orders
  - No auth required for table QR orders
  - Validates token, creates order + items, emits `new_order` socket
- [ ] **5.4** Create order confirmation screen with order ID
- [ ] **5.5** Test: add items → submit → order appears in app-kitchen / app-bar
- [ ] **5.6** Commit: `feat(web-customer): add cart and order submission for table QR`

---

## Task 6: Real-time order status for customer

- [ ] **6.1** Create `apps/web-customer/src/components/OrderStatus.tsx`
  - Shows list of ordered items
  - Status badges per item: Pendiente / En preparación / Listo / Entregado
  - Updates in real-time via Socket.io
  - "Llamar al mesero" button → emits `call_waiter` event
- [ ] **6.2** Create `apps/web-customer/src/app/table/[token]/order/page.tsx`
  - Shows OrderStatus after placing order
  - Socket.io connection to local-server for updates
  - When all items = delivered: show "¡Todo entregado! 🎉"
- [ ] **6.3** Create `apps/web-customer/src/components/CallWaiterButton.tsx`
  - Single prominent button
  - Disabled for 60s after pressing (prevents spam)
  - Shows "El mesero está en camino" after pressing
- [ ] **6.4** Test: bump item to ready in kitchen → customer sees "Listo" update
- [ ] **6.5** Commit: `feat(web-customer): add real-time order status tracking for customers`

---

## Verification Checklist

- [ ] QR generated in POS → scanned on phone → menu loads
- [ ] Token expiry works (test with expired token)
- [ ] Pool table → pool chip section visible at top of menu
- [ ] Order submitted → appears in kitchen AND bar display within 1 second
- [ ] Customer sees real-time status updates
- [ ] "Llamar al mesero" → alert appears in app-waiter and app-pos
- [ ] Cart persists on page refresh within same table session

---

*Previous: [Plan 1 — Core Bar Operations](2026-03-21-plan-1-core-bar.md)*
*Next: [Plan 3 — Payments & Waiter App](2026-03-21-plan-3-payments-waiter.md)*
