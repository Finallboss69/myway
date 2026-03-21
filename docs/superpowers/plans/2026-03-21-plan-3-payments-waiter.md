# My Way — Plan 3: Payments & Waiter App

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `app-waiter` (full PWA mobile-first app for waiters) and the complete payments system: MercadoPago dynamic QR, cash payments, account splitting, discounts, cancellations, thermal printer integration, and daily cash register close.

**Architecture:** `app-waiter` is a Next.js 15 PWA connecting to `local-server` via Socket.io and REST. Payments flow through `local-server` (creates MP QR, listens to Supabase Realtime for webhook confirmations, falls back to MP polling). Thermal printer accessed via TCP from `local-server`. Cash register close generates PDF server-side.

**Tech Stack:** Next.js 15 + next-pwa, Socket.io 4, MercadoPago Node.js SDK, escpos npm package (TCP), pdfkit (PDF generation), Vitest, @myway/ui, @myway/types

**Depends on:** Plan 2 (Customer QR Ordering)

---

## File Map

```
apps/
├── app-waiter/
│   ├── package.json
│   ├── next.config.ts                         # next-pwa config
│   ├── public/
│   │   ├── manifest.json                      # PWA manifest
│   │   └── icons/                             # PWA icons (192, 512)
│   └── src/
│       ├── app/
│       │   ├── layout.tsx                     # Root layout: dark theme, offline banner, vibration
│       │   ├── page.tsx                       # Redirect to /login
│       │   ├── login/page.tsx                 # PIN login
│       │   ├── salon/page.tsx                 # Salon view (table grid)
│       │   ├── salon/[tableId]/page.tsx       # Table detail: items + add + deliver
│       │   ├── payment/[sessionId]/page.tsx   # Payment flow (MP QR + cash)
│       │   └── delivery/page.tsx              # Delivery orders assigned to this waiter
│       ├── components/
│       │   ├── SalonLayout.tsx                # Same layout as POS (reuses @myway/ui)
│       │   ├── TableCard.tsx                  # Mobile-optimized table card
│       │   ├── ItemDeliveryList.tsx           # List of items — tap to confirm delivery
│       │   ├── AddItemsSheet.tsx              # Bottom sheet: browse menu + add to table
│       │   ├── CallWaiterAlert.tsx            # Alert overlay with vibration
│       │   ├── MpQrSheet.tsx                  # Bottom sheet: show QR, wait for confirmation
│       │   ├── CashPaymentSheet.tsx           # Enter cash amount, give change
│       │   ├── SplitBillSheet.tsx             # Split N ways or custom amounts
│       │   └── PartialPaymentSheet.tsx        # Mixed: partial cash + partial MP
│       ├── hooks/
│       │   ├── useSocket.ts                   # Socket.io (reuse pattern from app-pos)
│       │   ├── useOffline.ts                  # Ping /health
│       │   ├── useTables.ts                   # Tables state + real-time
│       │   ├── useSessionBalance.ts           # GET /payments/session/:id → balance
│       │   └── useCallWaiter.ts               # Listen to call_waiter socket event
│       └── lib/
│           ├── api.ts                         # fetch wrapper
│           └── auth.ts                        # PIN login + JWT
│
└── local-server/src/
    ├── routes/
    │   ├── payments.ts                        # POST /payments, POST /payments/mp-qr,
    │   │                                      # GET /payments/session/:sessionId,
    │   │                                      # POST /payments/cash, POST /payments/close-table
    │   ├── discounts.ts                       # POST /orders/:id/discount (cashier only)
    │   ├── cancellations.ts                   # POST /orders/:id/cancel, POST /order-items/:id/cancel
    │   ├── cash-register.ts                   # POST /cash-register/close, GET /cash-register/today
    │   └── print.ts                           # POST /print/ticket, POST /print/bill
    ├── services/
    │   ├── payment.service.ts                 # Business logic: create payment, balance calc
    │   ├── mp.service.ts                      # MP SDK wrapper: create QR, poll payment status
    │   ├── printer.service.ts                 # ESC/POS TCP printer abstraction
    │   └── cash-register.service.ts           # Tally payments, generate PDF
    └── lib/
        └── printer.ts                         # escpos TCP connection + format helpers

packages/
└── types/src/
    ├── payment.ts                             # Payment, MpQrRequest, CashRegisterClose types
    └── index.ts                               # Re-export payment types
```

---

## Task 1: `packages/types` — Payment types

**Files:**
- Modify: `packages/types/src/payment.ts`
- Modify: `packages/types/src/index.ts`

- [ ] **1.1** Write test: import `Payment` and `CashRegisterClose` from `@myway/types` — verify shape
- [ ] **1.2** Run test — verify FAIL
- [ ] **1.3** Update `packages/types/src/payment.ts`

```typescript
export type PaymentMethod =
  | 'cash'
  | 'mercadopago_qr'
  | 'mercadopago_online'
  | 'card'
  | 'transfer'

export interface Payment {
  id: string
  tableSessionId: string
  orderId: string | null
  method: PaymentMethod
  amount: number
  mpPaymentId: string | null
  receivedBy: string
  createdAt: Date
}

export interface SessionBalance {
  sessionId: string
  total: number        // sum of all order items unit_price * quantity (after discounts)
  paid: number         // sum of payments.amount
  pending: number      // total - paid
  payments: Payment[]
}

export interface MpQrRequest {
  sessionId: string
  amount: number       // exact amount for this QR (may be partial)
  description: string
}

export interface MpQrResponse {
  qrData: string       // base64 image or URL from MP
  paymentId: string    // MP external_reference / payment_id to track
  expiresAt: Date
}

export interface CashPaymentRequest {
  sessionId: string
  amount: number
  receivedBy: string
}

export interface SplitBillRequest {
  sessionId: string
  parts: number        // split N ways equally
}

export interface SplitBillPart {
  partIndex: number
  amount: number
  paid: boolean
}

export interface DiscountRequest {
  orderId: string
  type: 'percentage' | 'fixed'
  value: number
  reason: string
  appliedBy: string   // staff id
}

export interface CancellationRequest {
  reason: string
  cancelledBy: string  // staff id
}

export interface CashRegisterClose {
  id: string
  venueId: string
  staffId: string
  openedAt: Date
  closedAt: Date
  openingAmount: number
  closingAmount: number        // actual cash counted
  totalCashSales: number
  totalMpSales: number
  totalCardSales: number
  totalTransferSales: number
  totalSales: number
  totalDiscounts: number
  totalCancellations: number
  notes: string | null
  createdAt: Date
}

export interface CashRegisterCloseRequest {
  openingAmount: number
  closingAmount: number   // actual cash counted by staff
  notes?: string
}
```

- [ ] **1.4** Export from `packages/types/src/index.ts`:

```typescript
export * from './payment'
```

- [ ] **1.5** Run test — verify PASS
- [ ] **1.6** Commit: `feat(types): add payment, split-bill, discount, cash-register types`

---

## Task 2: local-server — `printer.ts` lib (ESC/POS over TCP)

**Files:**
- Create: `apps/local-server/src/lib/printer.ts`

- [ ] **2.1** Install dependency:

```bash
cd apps/local-server
pnpm add escpos escpos-network
pnpm add -D @types/escpos
```

- [ ] **2.2** Write test: `PrinterService.formatKitchenTicket(order)` returns non-empty buffer; connection failure throws `PrinterOfflineError`
- [ ] **2.3** Run test — verify FAIL
- [ ] **2.4** Create `apps/local-server/src/lib/printer.ts`

```typescript
import escpos from 'escpos'
import Network from 'escpos-network'
import type { Order, OrderItem } from '@myway/types'

export class PrinterOfflineError extends Error {
  constructor(host: string, port: number) {
    super(`Printer unreachable at ${host}:${port}`)
    this.name = 'PrinterOfflineError'
  }
}

const PRINTER_HOST = process.env['PRINTER_HOST'] ?? '192.168.1.100'
const PRINTER_PORT = parseInt(process.env['PRINTER_PORT'] ?? '9100', 10)
const CONNECT_TIMEOUT_MS = 3000

export async function printKitchenTicket(
  order: Order & { items: OrderItem[]; tableNumber?: number }
): Promise<void> {
  const device = new Network(PRINTER_HOST, PRINTER_PORT)
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new PrinterOfflineError(PRINTER_HOST, PRINTER_PORT))
    }, CONNECT_TIMEOUT_MS)

    device.open((err: Error | null) => {
      clearTimeout(timeout)
      if (err) return reject(new PrinterOfflineError(PRINTER_HOST, PRINTER_PORT))

      const printer = new escpos.Printer(device)
      const now = new Date().toLocaleString('es-AR')

      printer
        .font('a')
        .align('ct')
        .style('b')
        .size(1, 1)
        .text('*** COCINA / BARRA ***')
        .text('----------------------------')
        .align('lt')
        .style('normal')
        .text(`Mesa: ${order.tableNumber ?? 'Delivery'}`)
        .text(`Hora: ${now}`)
        .text(`Pedido: #${order.id.slice(-6).toUpperCase()}`)
        .text('----------------------------')

      for (const item of order.items) {
        printer.text(`${item.quantity}x  ${item.productId}`)
        if (item.notes) printer.text(`     Nota: ${item.notes}`)
      }

      printer
        .text('----------------------------')
        .cut()
        .close(() => resolve())
    })
  })
}

export async function printCustomerBill(params: {
  tableNumber: number
  items: Array<{ name: string; quantity: number; unitPrice: number }>
  subtotal: number
  discount: number
  total: number
  paymentSummary: string
}): Promise<void> {
  const device = new Network(PRINTER_HOST, PRINTER_PORT)
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new PrinterOfflineError(PRINTER_HOST, PRINTER_PORT))
    }, CONNECT_TIMEOUT_MS)

    device.open((err: Error | null) => {
      clearTimeout(timeout)
      if (err) return reject(new PrinterOfflineError(PRINTER_HOST, PRINTER_PORT))

      const printer = new escpos.Printer(device)
      const now = new Date().toLocaleString('es-AR')

      printer
        .font('a')
        .align('ct')
        .style('b')
        .size(1, 1)
        .text('MY WAY')
        .style('normal')
        .size(0, 0)
        .text(now)
        .text(`Mesa ${params.tableNumber}`)
        .text('----------------------------')
        .align('lt')

      for (const item of params.items) {
        const lineTotal = (item.quantity * item.unitPrice).toFixed(2)
        printer.text(`${item.quantity}x ${item.name.padEnd(16)} $${lineTotal}`)
      }

      printer.text('----------------------------')
      if (params.discount > 0) {
        printer.text(`Subtotal:          $${params.subtotal.toFixed(2)}`)
        printer.text(`Descuento:        -$${params.discount.toFixed(2)}`)
      }
      printer
        .style('b')
        .text(`TOTAL:             $${params.total.toFixed(2)}`)
        .style('normal')
        .text(params.paymentSummary)
        .text('')
        .align('ct')
        .text('Gracias por su visita!')
        .cut()
        .close(() => resolve())
    })
  })
}
```

- [ ] **2.5** Run test — verify PASS
- [ ] **2.6** Commit: `feat(local-server): add ESC/POS thermal printer lib with TCP connection`

---

## Task 3: local-server — `mp.service.ts` (MercadoPago QR)

**Files:**
- Create: `apps/local-server/src/services/mp.service.ts`

- [ ] **3.1** Install dependency:

```bash
cd apps/local-server
pnpm add mercadopago
```

- [ ] **3.2** Write test: `createDynamicQr({ amount, description, externalReference })` calls MP SDK and returns `{ qrData, paymentId }`. Mock the MP SDK client. Test `pollPaymentStatus(paymentId)` returns `'approved'` when MP API returns `status: 'approved'`.
- [ ] **3.3** Run tests — verify FAIL
- [ ] **3.4** Create `apps/local-server/src/services/mp.service.ts`

```typescript
import MercadoPagoConfig, { Payment, MerchantOrder } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env['MP_ACCESS_TOKEN'] ?? '',
})

const POLL_INTERVAL_MS = 5_000
const POLL_TIMEOUT_MS = 5 * 60 * 1000  // 5 minutes

export interface DynamicQrParams {
  amount: number
  description: string
  externalReference: string   // tableSessionId + timestamp
}

export interface DynamicQrResult {
  qrData: string    // base64 image
  paymentId: string
  expiresAt: Date
}

/**
 * Creates a MercadoPago dynamic QR for in-person collection.
 * MP requires a POS (point of sale) to be registered. Uses MP Instore API.
 */
export async function createDynamicQr(params: DynamicQrParams): Promise<DynamicQrResult> {
  const userId = process.env['MP_USER_ID'] ?? ''
  const externalPosId = process.env['MP_POS_ID'] ?? 'myway-pos-1'

  const body = {
    external_reference: params.externalReference,
    title: params.description,
    description: params.description,
    notification_url: `${process.env['VERCEL_URL']}/api/webhooks/mp`,
    total_amount: params.amount,
    items: [
      {
        sku_number: 'TABLE_ORDER',
        category: 'marketplace',
        title: params.description,
        description: params.description,
        unit_price: params.amount,
        quantity: 1,
        unit_measure: 'unit',
        total_amount: params.amount,
      },
    ],
    sponsor: { id: parseInt(userId, 10) },
  }

  const response = await fetch(
    `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${userId}/pos/${externalPosId}/qrs`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env['MP_ACCESS_TOKEN']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`MP QR creation failed: ${err}`)
  }

  const data = await response.json() as { qr_data: string; in_store_order_id: string }

  return {
    qrData: data.qr_data,
    paymentId: data.in_store_order_id,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),  // 10 min expiry
  }
}

/**
 * Polls MP API for payment status on a given paymentId.
 * Returns 'approved' | 'pending' | 'rejected'.
 */
export async function pollPaymentStatus(
  paymentId: string
): Promise<'approved' | 'pending' | 'rejected'> {
  const paymentClient = new Payment(client)
  const result = await paymentClient.get({ id: paymentId })
  if (result.status === 'approved') return 'approved'
  if (result.status === 'rejected' || result.status === 'cancelled') return 'rejected'
  return 'pending'
}

/**
 * Long-polls MP until approved, rejected, or timeout.
 * Starts after initialDelayMs (wait for Supabase Realtime webhook first).
 * Calls onConfirmed when approved.
 */
export function startPaymentPolling(params: {
  paymentId: string
  initialDelayMs: number
  onConfirmed: (paymentId: string) => void
  onFailed: (paymentId: string) => void
}): () => void {
  let cancelled = false
  let intervalId: ReturnType<typeof setInterval>

  const startPolling = () => {
    const deadline = Date.now() + POLL_TIMEOUT_MS
    intervalId = setInterval(async () => {
      if (cancelled) {
        clearInterval(intervalId)
        return
      }
      if (Date.now() > deadline) {
        clearInterval(intervalId)
        params.onFailed(params.paymentId)
        return
      }
      try {
        const status = await pollPaymentStatus(params.paymentId)
        if (status === 'approved') {
          clearInterval(intervalId)
          params.onConfirmed(params.paymentId)
        } else if (status === 'rejected') {
          clearInterval(intervalId)
          params.onFailed(params.paymentId)
        }
      } catch {
        // transient error — keep polling
      }
    }, POLL_INTERVAL_MS)
  }

  setTimeout(startPolling, params.initialDelayMs)

  return () => {
    cancelled = true
    clearInterval(intervalId)
  }
}
```

- [ ] **3.5** Run tests — verify PASS
- [ ] **3.6** Commit: `feat(local-server): add MercadoPago QR service with polling fallback`

---

## Task 4: local-server — `payment.service.ts`

**Files:**
- Create: `apps/local-server/src/services/payment.service.ts`

- [ ] **4.1** Write tests:
  - `getSessionBalance(sessionId)` returns `{ total, paid, pending, payments }`
  - `recordPayment(...)` inserts row into `payments`, marks `synced=false`
  - `canCloseSession(sessionId)` returns `true` only when `pending === 0`
  - `closeTableSession(sessionId, closedBy)` updates session `status='paid'`, emits `table_closed`
- [ ] **4.2** Run tests — verify FAIL
- [ ] **4.3** Create `apps/local-server/src/services/payment.service.ts`

```typescript
import { db } from '@myway/db'
import type { SessionBalance, Payment } from '@myway/types'
import { emitToAll } from '../socket.js'

export async function getSessionBalance(sessionId: string): Promise<SessionBalance> {
  const session = await db.tableSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      orders: {
        where: { status: { not: 'cancelled' } },
        include: {
          items: { where: { status: { not: 'cancelled' } } },
        },
      },
      payments: true,
    },
  })

  // total = sum of all non-cancelled items, minus order-level discounts
  let total = 0
  for (const order of session.orders) {
    const itemsTotal = order.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )
    total += itemsTotal - (order.discountAmount ?? 0)
  }

  const paid = session.payments.reduce((sum, p) => sum + p.amount, 0)

  return {
    sessionId,
    total: Math.round(total * 100) / 100,
    paid: Math.round(paid * 100) / 100,
    pending: Math.round((total - paid) * 100) / 100,
    payments: session.payments as Payment[],
  }
}

export async function recordPayment(params: {
  tableSessionId: string
  orderId?: string
  method: string
  amount: number
  mpPaymentId?: string
  receivedBy: string
}): Promise<Payment> {
  const payment = await db.payment.create({
    data: {
      tableSessionId: params.tableSessionId,
      orderId: params.orderId ?? null,
      method: params.method,
      amount: params.amount,
      mpPaymentId: params.mpPaymentId ?? null,
      receivedBy: params.receivedBy,
      synced: false,
    },
  })
  return payment as Payment
}

export async function canCloseSession(sessionId: string): Promise<boolean> {
  const balance = await getSessionBalance(sessionId)
  return balance.pending <= 0
}

export async function closeTableSession(
  sessionId: string,
  closedBy: string
): Promise<void> {
  const session = await db.tableSession.findUniqueOrThrow({
    where: { id: sessionId },
  })

  if (session.status !== 'open') return  // idempotent: already closed

  await db.$transaction([
    db.tableSession.update({
      where: { id: sessionId },
      data: { status: 'paid', closedAt: new Date(), closedBy, synced: false },
    }),
    db.table.update({
      where: { id: session.tableId },
      data: { status: 'available', updatedAt: new Date(), synced: false },
    }),
  ])

  emitToAll('table_closed', { tableId: session.tableId })
  emitToAll('table_status', { tableId: session.tableId, status: 'available' })
}
```

- [ ] **4.4** Run tests — verify PASS
- [ ] **4.5** Commit: `feat(local-server): add payment service (balance, record, close session)`

---

## Task 5: local-server — Payments routes

**Files:**
- Create: `apps/local-server/src/routes/payments.ts`

- [ ] **5.1** Write tests:
  - `POST /payments/mp-qr` with `{ sessionId, amount }` → returns `{ qrData, paymentId }`
  - `GET /payments/session/:sessionId` → returns `SessionBalance`
  - `POST /payments/cash` with `{ sessionId, amount }` → records payment, returns updated balance
  - `POST /payments/close-table` with `{ sessionId }` returns 409 if `pending > 0`, 200 if paid
- [ ] **5.2** Run tests — verify FAIL
- [ ] **5.3** Create `apps/local-server/src/routes/payments.ts`

```typescript
import { Router } from 'express'
import { requireRole } from '../middleware/auth.js'
import { getSessionBalance, recordPayment, canCloseSession, closeTableSession } from '../services/payment.service.js'
import { createDynamicQr, startPaymentPolling } from '../services/mp.service.js'
import { emitToAll } from '../socket.js'
import { db } from '@myway/db'

const router = Router()

// GET /payments/session/:sessionId — balance for a session
router.get('/session/:sessionId', requireRole(['cashier', 'waiter', 'admin', 'superadmin']), async (req, res) => {
  try {
    const balance = await getSessionBalance(req.params['sessionId']!)
    res.json({ success: true, data: balance })
  } catch (err) {
    res.status(404).json({ success: false, error: 'Session not found' })
  }
})

// POST /payments/mp-qr — create MP dynamic QR, start polling fallback
router.post('/mp-qr', requireRole(['cashier', 'waiter', 'admin', 'superadmin']), async (req, res) => {
  const { sessionId, amount, description } = req.body as {
    sessionId: string
    amount: number
    description?: string
  }

  if (!sessionId || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'sessionId and positive amount required' })
  }

  try {
    const qrResult = await createDynamicQr({
      amount,
      description: description ?? 'My Way — Consumición',
      externalReference: `${sessionId}-${Date.now()}`,
    })

    // Start polling fallback — fires 30s after QR created (Supabase Realtime gets first shot)
    const cancelPolling = startPaymentPolling({
      paymentId: qrResult.paymentId,
      initialDelayMs: 30_000,
      onConfirmed: async (paymentId) => {
        // Supabase Realtime didn't deliver — record payment from polling
        await recordPayment({
          tableSessionId: sessionId,
          method: 'mercadopago_qr',
          amount,
          mpPaymentId: paymentId,
          receivedBy: (req as any).staffId,
        })
        emitToAll('mp_payment_confirmed', { paymentId, amount, sessionId })
      },
      onFailed: (paymentId) => {
        emitToAll('mp_payment_failed', { paymentId, sessionId })
      },
    })

    // Store cancel fn keyed by paymentId so webhook can cancel polling if it fires first
    ;(req.app.locals as any).pendingPolling ??= new Map()
    ;(req.app.locals as any).pendingPolling.set(qrResult.paymentId, cancelPolling)

    res.json({ success: true, data: qrResult })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(502).json({ success: false, error: message })
  }
})

// POST /payments/cash — record cash payment
router.post('/cash', requireRole(['cashier', 'waiter', 'admin', 'superadmin']), async (req, res) => {
  const { sessionId, amount } = req.body as { sessionId: string; amount: number }

  if (!sessionId || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'sessionId and positive amount required' })
  }

  try {
    await recordPayment({
      tableSessionId: sessionId,
      method: 'cash',
      amount,
      receivedBy: (req as any).staffId,
    })
    const balance = await getSessionBalance(sessionId)
    res.json({ success: true, data: balance })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ success: false, error: message })
  }
})

// POST /payments — generic payment record (card, transfer, etc.)
router.post('/', requireRole(['cashier', 'admin', 'superadmin']), async (req, res) => {
  const { sessionId, method, amount, mpPaymentId } = req.body as {
    sessionId: string
    method: string
    amount: number
    mpPaymentId?: string
  }

  try {
    const payment = await recordPayment({
      tableSessionId: sessionId,
      method,
      amount,
      mpPaymentId,
      receivedBy: (req as any).staffId,
    })
    const balance = await getSessionBalance(sessionId)
    res.json({ success: true, data: { payment, balance } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ success: false, error: message })
  }
})

// POST /payments/close-table — close session (waiter OR cashier, first wins)
router.post('/close-table', requireRole(['cashier', 'waiter', 'admin', 'superadmin']), async (req, res) => {
  const { sessionId } = req.body as { sessionId: string }

  const ready = await canCloseSession(sessionId)
  if (!ready) {
    const balance = await getSessionBalance(sessionId)
    return res.status(409).json({
      success: false,
      error: 'Pending balance must be zero before closing',
      data: balance,
    })
  }

  await closeTableSession(sessionId, (req as any).staffId)
  res.json({ success: true })
})

// Internal route: called by Supabase Realtime handler when mp webhook arrives
router.post('/mp-webhook-confirmed', async (req, res) => {
  const { mpPaymentId, amount, sessionId } = req.body as {
    mpPaymentId: string
    amount: number
    sessionId: string
  }

  // Cancel polling fallback since webhook already arrived
  const cancelPolling = (req.app.locals as any).pendingPolling?.get(mpPaymentId)
  if (cancelPolling) {
    cancelPolling()
    ;(req.app.locals as any).pendingPolling.delete(mpPaymentId)
  }

  // Check if payment already recorded (webhook may race with polling)
  const existing = await db.payment.findFirst({ where: { mpPaymentId } })
  if (!existing) {
    await recordPayment({
      tableSessionId: sessionId,
      method: 'mercadopago_qr',
      amount,
      mpPaymentId,
      receivedBy: 'webhook',
    })
  }

  emitToAll('mp_payment_confirmed', { paymentId: mpPaymentId, amount, sessionId })
  res.json({ success: true })
})

export default router
```

- [ ] **5.4** Register route in `apps/local-server/src/server.ts`:

```typescript
import paymentsRouter from './routes/payments.js'
// ...
app.use('/payments', paymentsRouter)
```

- [ ] **5.5** Run tests — verify PASS
- [ ] **5.6** Commit: `feat(local-server): add payments routes (MP QR, cash, session balance, close)`

---

## Task 6: local-server — Discounts & Cancellations routes

**Files:**
- Create: `apps/local-server/src/routes/discounts.ts`
- Create: `apps/local-server/src/routes/cancellations.ts`

- [ ] **6.1** Write tests:
  - `POST /orders/:id/discount` with `{ type: 'percentage', value: 10, reason }` — cashier role only; computes `discountAmount`, records reason
  - `POST /orders/:id/discount` with waiter role → returns 403
  - `POST /orders/:id/cancel` with `{ reason }` — cashier role only; sets status='cancelled', creates audit log
  - `POST /order-items/:id/cancel` with `{ reason }` — cashier only; item status='cancelled', emits `order_updated`
- [ ] **6.2** Run tests — verify FAIL
- [ ] **6.3** Create `apps/local-server/src/routes/discounts.ts`

```typescript
import { Router } from 'express'
import { requireRole } from '../middleware/auth.js'
import { db } from '@myway/db'
import { emitToAll } from '../socket.js'

const router = Router()

// POST /orders/:id/discount
router.post('/:id/discount', requireRole(['cashier', 'admin', 'superadmin']), async (req, res) => {
  const { type, value, reason } = req.body as {
    type: 'percentage' | 'fixed'
    value: number
    reason: string
  }
  const orderId = req.params['id']!

  if (!type || value == null || !reason?.trim()) {
    return res.status(400).json({ success: false, error: 'type, value, and reason required' })
  }

  const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } })

  const subtotal = order.items
    .filter(i => i.status !== 'cancelled')
    .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  const discountAmount =
    type === 'percentage'
      ? Math.round((subtotal * value) / 100 * 100) / 100
      : Math.min(value, subtotal)

  const updated = await db.order.update({
    where: { id: orderId },
    data: {
      discountAmount,
      discountReason: `[${type.toUpperCase()} ${value}] ${reason}`,
      synced: false,
    },
  })

  emitToAll('order_updated', { orderId, discountAmount, discountReason: updated.discountReason })
  res.json({ success: true, data: { discountAmount } })
})

export default router
```

- [ ] **6.4** Create `apps/local-server/src/routes/cancellations.ts`

```typescript
import { Router } from 'express'
import { requireRole } from '../middleware/auth.js'
import { db } from '@myway/db'
import { emitToAll } from '../socket.js'

const router = Router()

// POST /orders/:id/cancel
router.post('/orders/:id/cancel', requireRole(['cashier', 'admin', 'superadmin']), async (req, res) => {
  const { reason } = req.body as { reason: string }
  const orderId = req.params['id']!

  if (!reason?.trim()) {
    return res.status(400).json({ success: false, error: 'reason required' })
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      status: 'cancelled',
      discountReason: `ANULADO: ${reason}`,
      synced: false,
    },
  })

  // Audit log entry (stored as sync_log note or dedicated cancellations table if added later)
  emitToAll('order_updated', { orderId, status: 'cancelled', reason })
  res.json({ success: true })
})

// POST /order-items/:id/cancel
router.post('/order-items/:id/cancel', requireRole(['cashier', 'admin', 'superadmin']), async (req, res) => {
  const { reason } = req.body as { reason: string }
  const itemId = req.params['id']!

  if (!reason?.trim()) {
    return res.status(400).json({ success: false, error: 'reason required' })
  }

  const item = await db.orderItem.update({
    where: { id: itemId },
    data: { status: 'cancelled', synced: false },
  })

  emitToAll('order_updated', { orderId: item.orderId, itemId, status: 'cancelled', reason })
  res.json({ success: true })
})

export default router
```

- [ ] **6.5** Register routes in `server.ts`:

```typescript
import discountsRouter from './routes/discounts.js'
import cancellationsRouter from './routes/cancellations.js'
// ...
app.use('/orders', discountsRouter)
app.use('/', cancellationsRouter)
```

- [ ] **6.6** Run tests — verify PASS
- [ ] **6.7** Commit: `feat(local-server): add discounts (cashier-only) and cancellations routes`

---

## Task 7: local-server — Print routes

**Files:**
- Create: `apps/local-server/src/routes/print.ts`
- Create: `apps/local-server/src/services/printer.service.ts`

- [ ] **7.1** Write tests:
  - `POST /print/ticket` with valid orderId → calls `printKitchenTicket`, returns 200
  - `POST /print/ticket` when printer offline → returns 503 with `PrinterOfflineError` message
  - `POST /print/bill` with valid sessionId → calls `printCustomerBill`, returns 200
- [ ] **7.2** Run tests — verify FAIL
- [ ] **7.3** Create `apps/local-server/src/services/printer.service.ts`

```typescript
import { db } from '@myway/db'
import { printKitchenTicket, printCustomerBill, PrinterOfflineError } from '../lib/printer.js'

export { PrinterOfflineError }

export async function printOrderTicket(orderId: string): Promise<void> {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: { where: { status: { not: 'cancelled' } } },
      tableSession: { include: { table: true } },
    },
  })

  await printKitchenTicket({
    ...order,
    tableNumber: order.tableSession?.table?.number,
  } as any)
}

export async function printSessionBill(sessionId: string): Promise<void> {
  const session = await db.tableSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      table: true,
      orders: {
        where: { status: { not: 'cancelled' } },
        include: {
          items: {
            where: { status: { not: 'cancelled' } },
            include: { product: true },
          },
        },
      },
      payments: true,
    },
  })

  const allItems: Array<{ name: string; quantity: number; unitPrice: number }> = []
  let subtotal = 0
  let totalDiscount = 0

  for (const order of session.orders) {
    for (const item of order.items) {
      allItems.push({
        name: item.product?.name ?? item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })
      subtotal += item.unitPrice * item.quantity
    }
    totalDiscount += order.discountAmount ?? 0
  }

  const total = subtotal - totalDiscount
  const paymentSummary = session.payments
    .map(p => `${p.method}: $${p.amount.toFixed(2)}`)
    .join(' | ')

  await printCustomerBill({
    tableNumber: session.table.number,
    items: allItems,
    subtotal,
    discount: totalDiscount,
    total,
    paymentSummary,
  })
}
```

- [ ] **7.4** Create `apps/local-server/src/routes/print.ts`

```typescript
import { Router } from 'express'
import { requireRole } from '../middleware/auth.js'
import { printOrderTicket, printSessionBill, PrinterOfflineError } from '../services/printer.service.js'

const router = Router()

// POST /print/ticket — print kitchen/bar ticket for an order
router.post('/ticket', requireRole(['cashier', 'waiter', 'admin', 'superadmin']), async (req, res) => {
  const { orderId } = req.body as { orderId: string }
  if (!orderId) return res.status(400).json({ success: false, error: 'orderId required' })

  try {
    await printOrderTicket(orderId)
    res.json({ success: true })
  } catch (err) {
    if (err instanceof PrinterOfflineError) {
      return res.status(503).json({ success: false, error: err.message })
    }
    const message = err instanceof Error ? err.message : 'Print failed'
    res.status(500).json({ success: false, error: message })
  }
})

// POST /print/bill — print customer bill for a session
router.post('/bill', requireRole(['cashier', 'waiter', 'admin', 'superadmin']), async (req, res) => {
  const { sessionId } = req.body as { sessionId: string }
  if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' })

  try {
    await printSessionBill(sessionId)
    res.json({ success: true })
  } catch (err) {
    if (err instanceof PrinterOfflineError) {
      return res.status(503).json({ success: false, error: err.message })
    }
    const message = err instanceof Error ? err.message : 'Print failed'
    res.status(500).json({ success: false, error: message })
  }
})

export default router
```

- [ ] **7.5** Register in `server.ts`: `app.use('/print', printRouter)`
- [ ] **7.6** Run tests — verify PASS
- [ ] **7.7** Commit: `feat(local-server): add print routes for kitchen ticket and customer bill`

---

## Task 8: local-server — Cash register close

**Files:**
- Create: `apps/local-server/src/services/cash-register.service.ts`
- Create: `apps/local-server/src/routes/cash-register.ts`

- [ ] **8.1** Install PDF dependency:

```bash
cd apps/local-server
pnpm add pdfkit
pnpm add -D @types/pdfkit
```

- [ ] **8.2** Write tests:
  - `tallyCashRegister(date)` sums all payments for the given date by method
  - `closeCashRegister({ openingAmount, closingAmount, staffId })` inserts `cash_register_closes` row
  - `GET /cash-register/today` returns today's tally
  - `POST /cash-register/close` — cashier only; returns `{ pdfBase64, summary }`
- [ ] **8.3** Run tests — verify FAIL
- [ ] **8.4** Create `apps/local-server/src/services/cash-register.service.ts`

```typescript
import { db } from '@myway/db'
import PDFDocument from 'pdfkit'
import type { CashRegisterClose, CashRegisterCloseRequest } from '@myway/types'

export interface DailyTally {
  date: string
  totalCash: number
  totalMp: number
  totalCard: number
  totalTransfer: number
  totalSales: number
  totalDiscounts: number
  totalCancellations: number
  ordersCount: number
}

export async function tallyCashRegister(date: Date = new Date()): Promise<DailyTally> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const payments = await db.payment.findMany({
    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
  })

  const totalCash = payments.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0)
  const totalMp = payments
    .filter(p => p.method === 'mercadopago_qr' || p.method === 'mercadopago_online')
    .reduce((s, p) => s + p.amount, 0)
  const totalCard = payments.filter(p => p.method === 'card').reduce((s, p) => s + p.amount, 0)
  const totalTransfer = payments.filter(p => p.method === 'transfer').reduce((s, p) => s + p.amount, 0)

  const orders = await db.order.findMany({
    where: { createdAt: { gte: startOfDay, lte: endOfDay }, status: { not: 'cancelled' } },
  })

  const cancelledOrders = await db.order.findMany({
    where: { createdAt: { gte: startOfDay, lte: endOfDay }, status: 'cancelled' },
  })

  const totalDiscounts = orders.reduce((s, o) => s + (o.discountAmount ?? 0), 0)
  const totalCancellations = cancelledOrders.reduce((s, o) => s + o.total, 0)

  return {
    date: startOfDay.toISOString().slice(0, 10),
    totalCash,
    totalMp,
    totalCard,
    totalTransfer,
    totalSales: totalCash + totalMp + totalCard + totalTransfer,
    totalDiscounts,
    totalCancellations,
    ordersCount: orders.length,
  }
}

export async function closeCashRegister(params: {
  staffId: string
  venueId: string
  openingAmount: number
  closingAmount: number
  notes?: string
}): Promise<{ record: CashRegisterClose; pdfBase64: string }> {
  const tally = await tallyCashRegister()

  const record = await db.cashRegisterClose.create({
    data: {
      venueId: params.venueId,
      staffId: params.staffId,
      openedAt: new Date(new Date().setHours(0, 0, 0, 0)),
      closedAt: new Date(),
      openingAmount: params.openingAmount,
      closingAmount: params.closingAmount,
      totalCashSales: tally.totalCash,
      totalMpSales: tally.totalMp,
      totalCardSales: tally.totalCard,
      totalTransferSales: tally.totalTransfer,
      totalSales: tally.totalSales,
      totalDiscounts: tally.totalDiscounts,
      totalCancellations: tally.totalCancellations,
      notes: params.notes ?? null,
      synced: false,
    },
  })

  const pdfBase64 = await generateCashRegisterPdf({ record: record as CashRegisterClose, tally, params })
  return { record: record as CashRegisterClose, pdfBase64 }
}

async function generateCashRegisterPdf(input: {
  record: CashRegisterClose
  tally: DailyTally
  params: { openingAmount: number; closingAmount: number; notes?: string }
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks).toString('base64')))
    doc.on('error', reject)

    doc
      .fontSize(20).font('Helvetica-Bold').text('MY WAY — CIERRE DE CAJA', { align: 'center' })
      .moveDown(0.5)
      .fontSize(12).font('Helvetica').text(`Fecha: ${input.tally.date}`, { align: 'center' })
      .text(`Cerrado por: ${input.record.staffId}`, { align: 'center' })
      .moveDown()
      .fontSize(14).font('Helvetica-Bold').text('VENTAS POR MÉTODO DE PAGO')
      .moveDown(0.3)
      .fontSize(12).font('Helvetica')
      .text(`Efectivo:        $${input.tally.totalCash.toFixed(2)}`)
      .text(`MercadoPago:     $${input.tally.totalMp.toFixed(2)}`)
      .text(`Tarjeta:         $${input.tally.totalCard.toFixed(2)}`)
      .text(`Transferencia:   $${input.tally.totalTransfer.toFixed(2)}`)
      .moveDown(0.3)
      .font('Helvetica-Bold')
      .text(`TOTAL VENTAS:    $${input.tally.totalSales.toFixed(2)}`)
      .moveDown()
      .font('Helvetica')
      .fontSize(14).font('Helvetica-Bold').text('EFECTIVO')
      .moveDown(0.3)
      .fontSize(12).font('Helvetica')
      .text(`Caja inicial:    $${input.params.openingAmount.toFixed(2)}`)
      .text(`Ventas efectivo: $${input.tally.totalCash.toFixed(2)}`)
      .text(`Esperado en caja: $${(input.params.openingAmount + input.tally.totalCash).toFixed(2)}`)
      .text(`Contado:         $${input.params.closingAmount.toFixed(2)}`)
      .font('Helvetica-Bold')
      .text(`Diferencia:      $${(input.params.closingAmount - input.params.openingAmount - input.tally.totalCash).toFixed(2)}`)
      .moveDown()
      .font('Helvetica')
      .fontSize(14).font('Helvetica-Bold').text('RESUMEN')
      .fontSize(12).font('Helvetica')
      .text(`Pedidos:         ${input.tally.ordersCount}`)
      .text(`Descuentos:      $${input.tally.totalDiscounts.toFixed(2)}`)
      .text(`Anulaciones:     $${input.tally.totalCancellations.toFixed(2)}`)

    if (input.params.notes) {
      doc.moveDown().font('Helvetica-Bold').text('Notas:').font('Helvetica').text(input.params.notes)
    }

    doc.end()
  })
}
```

- [ ] **8.5** Create `apps/local-server/src/routes/cash-register.ts`

```typescript
import { Router } from 'express'
import { requireRole } from '../middleware/auth.js'
import { tallyCashRegister, closeCashRegister } from '../services/cash-register.service.js'

const router = Router()

// GET /cash-register/today — cashier sees today's running tally
router.get('/today', requireRole(['cashier', 'admin', 'superadmin']), async (req, res) => {
  const tally = await tallyCashRegister()
  res.json({ success: true, data: tally })
})

// POST /cash-register/close — close the day, generate PDF
router.post('/close', requireRole(['cashier', 'admin', 'superadmin']), async (req, res) => {
  const { openingAmount, closingAmount, notes } = req.body as {
    openingAmount: number
    closingAmount: number
    notes?: string
  }

  if (openingAmount == null || closingAmount == null) {
    return res.status(400).json({ success: false, error: 'openingAmount and closingAmount required' })
  }

  try {
    const result = await closeCashRegister({
      staffId: (req as any).staffId,
      venueId: (req as any).venueId,
      openingAmount,
      closingAmount,
      notes,
    })
    res.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error closing register'
    res.status(500).json({ success: false, error: message })
  }
})

export default router
```

- [ ] **8.6** Register in `server.ts`: `app.use('/cash-register', cashRegisterRouter)`
- [ ] **8.7** Run tests — verify PASS
- [ ] **8.8** Commit: `feat(local-server): add cash register close with PDF export`

---

## Task 9: `app-waiter` scaffold + PWA config

**Files:**
- Create: `apps/app-waiter/package.json`
- Create: `apps/app-waiter/next.config.ts`
- Create: `apps/app-waiter/public/manifest.json`

- [ ] **9.1** Create `apps/app-waiter/package.json`

```json
{
  "name": "@myway/app-waiter",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3004",
    "build": "next build",
    "start": "next start -H 0.0.0.0 -p 3004",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@myway/ui": "workspace:*",
    "@myway/types": "workspace:*",
    "@myway/utils": "workspace:*",
    "next": "^15.0.0",
    "next-pwa": "^5.6.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "socket.io-client": "^4.8.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "@myway/config": "workspace:*",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **9.2** Create `apps/app-waiter/next.config.ts`

```typescript
import withPWA from 'next-pwa'

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

export default pwaConfig({
  reactStrictMode: true,
})
```

- [ ] **9.3** Create `apps/app-waiter/public/manifest.json`

```json
{
  "name": "My Way — Mozo",
  "short_name": "MyWay Mozo",
  "description": "App del mozo — My Way Bar",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#f59e0b",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **9.4** Create `apps/app-waiter/src/app/layout.tsx`
  - Dark theme (`bg-surface-0 text-white`)
  - Include `OfflineBanner` from `@myway/ui`
  - Viewport: `width=device-width, initial-scale=1, maximum-scale=1` (prevent zoom on mobile)
  - Manifest link tag

- [ ] **9.5** Create `apps/app-waiter/src/lib/auth.ts` (same pattern as app-pos: PIN → JWT)
- [ ] **9.6** Create `apps/app-waiter/src/app/login/page.tsx`
  - Mobile numpad (large tap targets, 60px buttons)
  - Shows waiter name/role after login
  - Redirects to `/salon`
- [ ] **9.7** Commit: `feat(app-waiter): scaffold PWA with manifest, next-pwa, PIN login`

---

## Task 10: `app-waiter` — hooks

**Files:**
- Create: `apps/app-waiter/src/hooks/useSocket.ts`
- Create: `apps/app-waiter/src/hooks/useOffline.ts`
- Create: `apps/app-waiter/src/hooks/useTables.ts`
- Create: `apps/app-waiter/src/hooks/useSessionBalance.ts`
- Create: `apps/app-waiter/src/hooks/useCallWaiter.ts`

- [ ] **10.1** Write test: `useCallWaiter` hook subscribes to `call_waiter` socket events and calls `navigator.vibrate([200, 100, 200])` on each event
- [ ] **10.2** Run test — verify FAIL
- [ ] **10.3** Create `apps/app-waiter/src/hooks/useSocket.ts` (identical pattern to app-pos)

- [ ] **10.4** Create `apps/app-waiter/src/hooks/useCallWaiter.ts`

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useSocket } from './useSocket'

export interface CallWaiterAlert {
  tableId: string
  tableNumber: number
  receivedAt: Date
}

export function useCallWaiter() {
  const { socket } = useSocket()
  const [alerts, setAlerts] = useState<CallWaiterAlert[]>([])

  useEffect(() => {
    if (!socket) return

    const handler = (payload: { tableId: string; tableNumber: number }) => {
      // Vibrate: 200ms on, 100ms off, 200ms on
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200])
      }
      setAlerts(prev => [
        ...prev,
        { tableId: payload.tableId, tableNumber: payload.tableNumber, receivedAt: new Date() },
      ])
    }

    socket.on('call_waiter', handler)
    return () => { socket.off('call_waiter', handler) }
  }, [socket])

  const dismissAlert = (tableId: string) => {
    setAlerts(prev => prev.filter(a => a.tableId !== tableId))
    socket?.emit('call_waiter_ack', { tableId, waiterId: 'self' })
  }

  return { alerts, dismissAlert }
}
```

- [ ] **10.5** Create `apps/app-waiter/src/hooks/useSessionBalance.ts`

```typescript
'use client'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import type { SessionBalance } from '@myway/types'

export function useSessionBalance(sessionId: string | null) {
  return useQuery<SessionBalance>({
    queryKey: ['session-balance', sessionId],
    queryFn: () => apiFetch(`/payments/session/${sessionId}`),
    enabled: !!sessionId,
    refetchInterval: 5000,  // poll every 5s while payment sheet is open
  })
}
```

- [ ] **10.6** Create `apps/app-waiter/src/hooks/useTables.ts` (same as app-pos, reuse pattern)
- [ ] **10.7** Run tests — verify PASS
- [ ] **10.8** Commit: `feat(app-waiter): add socket, offline, tables, balance, call-waiter hooks`

---

## Task 11: `app-waiter` — Salon view + Table detail

**Files:**
- Create: `apps/app-waiter/src/components/SalonLayout.tsx`
- Create: `apps/app-waiter/src/components/TableCard.tsx`
- Create: `apps/app-waiter/src/components/CallWaiterAlert.tsx`
- Create: `apps/app-waiter/src/components/ItemDeliveryList.tsx`
- Create: `apps/app-waiter/src/components/AddItemsSheet.tsx`
- Create: `apps/app-waiter/src/app/salon/page.tsx`
- Create: `apps/app-waiter/src/app/salon/[tableId]/page.tsx`

- [ ] **11.1** Create `apps/app-waiter/src/components/CallWaiterAlert.tsx`

```tsx
'use client'
import { useCallWaiter } from '../hooks/useCallWaiter'

export function CallWaiterAlert() {
  const { alerts, dismissAlert } = useCallWaiter()
  if (alerts.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-amber-500 text-black rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-bounce-in">
        <div className="text-4xl mb-4">🔔</div>
        <h2 className="text-2xl font-bold">¡Llamado!</h2>
        {alerts.map(alert => (
          <div key={alert.tableId} className="mt-4">
            <p className="text-xl font-semibold">Mesa {alert.tableNumber}</p>
            <button
              onClick={() => dismissAlert(alert.tableId)}
              className="mt-3 bg-black text-white px-6 py-3 rounded-xl font-bold text-lg w-full"
            >
              Atender
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **11.2** Create `apps/app-waiter/src/components/TableCard.tsx`
  - Mobile-optimized: large tap target (min 80px height)
  - Show table number, status color, occupancy time, pending items badge
  - Pool icon for pool tables

- [ ] **11.3** Create `apps/app-waiter/src/components/SalonLayout.tsx`
  - Grid of TableCards (2 columns on mobile, 3 on tablet)
  - Zone tabs (Salón Principal / Afuera)
  - Sticky header with waiter name

- [ ] **11.4** Create `apps/app-waiter/src/app/salon/page.tsx`
  - Renders `SalonLayout` + `CallWaiterAlert`
  - Bottom nav: Salón | Mis Mesas | Delivery

- [ ] **11.5** Create `apps/app-waiter/src/components/ItemDeliveryList.tsx`

```tsx
'use client'
import type { OrderItem } from '@myway/types'

interface Props {
  items: OrderItem[]
  onDeliver: (itemId: string) => Promise<void>
}

export function ItemDeliveryList({ items, onDeliver }: Props) {
  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li
          key={item.id}
          className="flex items-center justify-between bg-surface-1 rounded-xl p-4"
        >
          <div>
            <span className="font-semibold">{item.quantity}x {item.productId}</span>
            {item.notes && <p className="text-sm text-gray-400">{item.notes}</p>}
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={item.status} />
            {item.status === 'ready' && (
              <button
                onClick={() => onDeliver(item.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
              >
                Entregar
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-gray-600',
    preparing: 'bg-amber-600',
    ready: 'bg-green-500 animate-pulse',
    delivered: 'bg-gray-400',
    cancelled: 'bg-red-800',
  }
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    preparing: 'En prep.',
    ready: '¡Listo!',
    delivered: 'Entregado',
    cancelled: 'Anulado',
  }
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-semibold text-white ${colors[status] ?? 'bg-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}
```

- [ ] **11.6** Create `apps/app-waiter/src/components/AddItemsSheet.tsx`
  - Bottom sheet (slides up from bottom — mobile native feel)
  - Browse products by category
  - Large quantity buttons (+ / -)
  - Notes field per item
  - Submit → `POST /orders` with items

- [ ] **11.7** Create `apps/app-waiter/src/app/salon/[tableId]/page.tsx`
  - Shows table header (number, occupancy time, waiter name)
  - Open table button if no active session
  - `ItemDeliveryList` for active order items
  - Floating action buttons: "Agregar items" | "Cobrar"
  - Tapping "Cobrar" → navigate to `/payment/[sessionId]`
  - Listen to `item_ready` socket → flash green badge, short vibration

- [ ] **11.8** Test: item marked `ready` in kitchen → status badge in app-waiter updates, device vibrates
- [ ] **11.9** Commit: `feat(app-waiter): add salon view, table detail, item delivery, add-items sheet`

---

## Task 12: `app-waiter` — Payment flow (MP QR + cash + split)

**Files:**
- Create: `apps/app-waiter/src/components/MpQrSheet.tsx`
- Create: `apps/app-waiter/src/components/CashPaymentSheet.tsx`
- Create: `apps/app-waiter/src/components/SplitBillSheet.tsx`
- Create: `apps/app-waiter/src/components/PartialPaymentSheet.tsx`
- Create: `apps/app-waiter/src/app/payment/[sessionId]/page.tsx`

- [ ] **12.1** Create `apps/app-waiter/src/app/payment/[sessionId]/page.tsx`

```tsx
'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useSessionBalance } from '../../hooks/useSessionBalance'
import { MpQrSheet } from '../../components/MpQrSheet'
import { CashPaymentSheet } from '../../components/CashPaymentSheet'
import { SplitBillSheet } from '../../components/SplitBillSheet'
import { PartialPaymentSheet } from '../../components/PartialPaymentSheet'
import { apiFetch } from '../../lib/api'
import { useRouter } from 'next/navigation'

type Sheet = 'none' | 'mp' | 'cash' | 'split' | 'partial'

export default function PaymentPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { data: balance, refetch } = useSessionBalance(sessionId)
  const [activeSheet, setActiveSheet] = useState<Sheet>('none')
  const router = useRouter()

  if (!balance) return <div className="p-4 text-gray-400">Cargando cuenta...</div>

  const handleClose = async () => {
    if (balance.pending > 0) return
    await apiFetch('/payments/close-table', { method: 'POST', body: { sessionId } })
    await apiFetch('/print/bill', { method: 'POST', body: { sessionId } }).catch(() => {})
    router.push('/salon')
  }

  return (
    <div className="min-h-screen bg-surface-0 p-4 pb-32">
      <h1 className="text-2xl font-bold mb-6">Cobro — Mesa</h1>

      {/* Balance summary */}
      <div className="bg-surface-1 rounded-2xl p-6 mb-6">
        <div className="flex justify-between text-lg mb-2">
          <span>Total cuenta</span>
          <span className="font-bold">${balance.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg mb-2">
          <span>Pagado</span>
          <span className="text-green-400 font-semibold">${balance.paid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl border-t border-surface-3 pt-3 mt-3">
          <span className="font-bold">Pendiente</span>
          <span className={`font-bold text-2xl ${balance.pending > 0 ? 'text-amber-400' : 'text-green-400'}`}>
            ${balance.pending.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment method buttons */}
      {balance.pending > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setActiveSheet('mp')}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl"
          >
            Cobrar con MercadoPago QR
          </button>
          <button
            onClick={() => setActiveSheet('cash')}
            className="w-full bg-green-700 text-white py-5 rounded-2xl font-bold text-xl"
          >
            Cobrar en Efectivo
          </button>
          <button
            onClick={() => setActiveSheet('split')}
            className="w-full bg-surface-2 text-white py-4 rounded-2xl font-semibold text-lg border border-surface-3"
          >
            Dividir cuenta en N personas
          </button>
          <button
            onClick={() => setActiveSheet('partial')}
            className="w-full bg-surface-2 text-white py-4 rounded-2xl font-semibold text-lg border border-surface-3"
          >
            Pago mixto (efectivo + MP)
          </button>
        </div>
      )}

      {balance.pending === 0 && (
        <button
          onClick={handleClose}
          className="w-full bg-amber-500 text-black py-5 rounded-2xl font-bold text-xl mt-4"
        >
          Cerrar mesa e imprimir
        </button>
      )}

      {/* Sheets */}
      {activeSheet === 'mp' && (
        <MpQrSheet
          sessionId={sessionId}
          amount={balance.pending}
          onSuccess={() => { setActiveSheet('none'); refetch() }}
          onClose={() => setActiveSheet('none')}
        />
      )}
      {activeSheet === 'cash' && (
        <CashPaymentSheet
          sessionId={sessionId}
          pendingAmount={balance.pending}
          onSuccess={() => { setActiveSheet('none'); refetch() }}
          onClose={() => setActiveSheet('none')}
        />
      )}
      {activeSheet === 'split' && (
        <SplitBillSheet
          sessionId={sessionId}
          total={balance.total}
          paid={balance.paid}
          onClose={() => setActiveSheet('none')}
        />
      )}
      {activeSheet === 'partial' && (
        <PartialPaymentSheet
          sessionId={sessionId}
          pendingAmount={balance.pending}
          onSuccess={() => { setActiveSheet('none'); refetch() }}
          onClose={() => setActiveSheet('none')}
        />
      )}
    </div>
  )
}
```

- [ ] **12.2** Create `apps/app-waiter/src/components/MpQrSheet.tsx`

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '../hooks/useSocket'
import { apiFetch } from '../lib/api'
import type { MpQrResponse } from '@myway/types'
import Image from 'next/image'

interface Props {
  sessionId: string
  amount: number
  onSuccess: () => void
  onClose: () => void
}

export function MpQrSheet({ sessionId, amount, onSuccess, onClose }: Props) {
  const { socket } = useSocket()
  const [qr, setQr] = useState<MpQrResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    apiFetch<MpQrResponse>('/payments/mp-qr', {
      method: 'POST',
      body: { sessionId, amount },
    })
      .then(data => { setQr(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [sessionId, amount])

  useEffect(() => {
    if (!socket || !qr) return
    const handler = (payload: { paymentId: string; sessionId: string }) => {
      if (payload.sessionId === sessionId) {
        setConfirmed(true)
        setTimeout(() => onSuccess(), 1500)
      }
    }
    socket.on('mp_payment_confirmed', handler)
    return () => { socket.off('mp_payment_confirmed', handler) }
  }, [socket, qr, sessionId, onSuccess])

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-end">
      <div className="w-full bg-surface-1 rounded-t-3xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Pago con MercadoPago</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">✕</button>
        </div>

        <p className="text-3xl font-bold text-center text-amber-400 mb-6">
          ${amount.toFixed(2)}
        </p>

        {loading && <div className="text-center text-gray-400 py-8">Generando QR...</div>}

        {error && <div className="text-center text-red-400 py-4">{error}</div>}

        {confirmed && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-2xl font-bold text-green-400">¡Pago confirmado!</p>
          </div>
        )}

        {qr && !confirmed && (
          <div className="flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl">
              {/* qr.qrData is either a URL or base64 */}
              <Image
                src={qr.qrData.startsWith('data:') ? qr.qrData : `data:image/png;base64,${qr.qrData}`}
                alt="QR MercadoPago"
                width={240}
                height={240}
              />
            </div>
            <p className="text-sm text-gray-400 mt-4 text-center">
              El cliente escanea con su app bancaria o MercadoPago
            </p>
            <div className="mt-4 flex items-center gap-2 text-amber-400">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
              <span>Esperando confirmación...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **12.3** Create `apps/app-waiter/src/components/CashPaymentSheet.tsx`
  - Input for amount received (large numeric input)
  - Show change to give: `amountReceived - pendingAmount`
  - Confirm button → `POST /payments/cash`
  - Shows "¡Cobrado!" confirmation

- [ ] **12.4** Create `apps/app-waiter/src/components/SplitBillSheet.tsx`
  - Numeric stepper: select N people (min 2, max 20)
  - Shows amount per person: `(total - paid) / N`
  - Generates N equal-amount MP QR buttons or cash records
  - Each part tracked as a separate payment with same `tableSessionId`
  - "Parte 1 de N pagada" counter updates as each payment confirmed

- [ ] **12.5** Create `apps/app-waiter/src/components/PartialPaymentSheet.tsx`
  - Two inputs: "Efectivo" amount + "MercadoPago" amount
  - Auto-fills: MP = pending - cash entered, cash = pending - MP entered
  - Validates: cash + mp == pending
  - Submit → records cash payment first, then generates MP QR for remainder

- [ ] **12.6** Test: MP QR confirmed via socket → `confirmed` state → `onSuccess` called
- [ ] **12.7** Test: close table with pending > 0 → 409 response, balance shown
- [ ] **12.8** Test: close table with pending == 0 → table status becomes 'available' on salon view
- [ ] **12.9** Commit: `feat(app-waiter): add payment flow (MP QR, cash, split, partial)`

---

## Task 13: `app-waiter` — "Table closed by cashier" notification

**Files:**
- Modify: `apps/app-waiter/src/app/salon/[tableId]/page.tsx`

- [ ] **13.1** Write test: when `table_closed` socket event fires for the current table while payment sheet is open → waiter is redirected to salon with a toast "Caja cerró la mesa"
- [ ] **13.2** Run test — verify FAIL
- [ ] **13.3** In `apps/app-waiter/src/app/salon/[tableId]/page.tsx`, add socket listener:

```typescript
useEffect(() => {
  if (!socket) return
  const handler = (payload: { tableId: string }) => {
    if (payload.tableId === tableId) {
      toast('Caja cerró esta mesa')
      router.push('/salon')
    }
  }
  socket.on('table_closed', handler)
  return () => { socket.off('table_closed', handler) }
}, [socket, tableId, router])
```

- [ ] **13.4** In `apps/local-server/src/routes/payments.ts`, when cashier closes via `POST /payments/close-table`:
  - `closeTableSession` already emits `table_closed` to all — waiter receives it automatically
- [ ] **13.5** Run test — verify PASS
- [ ] **13.6** Commit: `feat(app-waiter): handle table closed by cashier — redirect + toast`

---

## Task 14: Supabase Realtime → MP webhook bridge

**Files:**
- Create: `apps/local-server/src/lib/realtime-listener.ts`

The MP webhook hits Vercel → Vercel upserts payment to Supabase → Supabase Realtime fires → local-server must receive it and emit `mp_payment_confirmed` socket event.

- [ ] **14.1** Write test: when Supabase Realtime INSERT event arrives for `payments` table with `method='mercadopago_qr'` → local-server calls `cancelPolling(mpPaymentId)` and emits `mp_payment_confirmed`
- [ ] **14.2** Run test — verify FAIL
- [ ] **14.3** Create `apps/local-server/src/lib/realtime-listener.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { recordPayment } from '../services/payment.service.js'
import { emitToAll } from '../socket.js'
import type { Application } from 'express'

const supabase = createClient(
  process.env['SUPABASE_URL'] ?? '',
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? ''
)

export function startRealtimeListener(app: Application): void {
  supabase
    .channel('payments-inserts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'payments' },
      async (payload) => {
        const row = payload.new as {
          id: string
          table_session_id: string
          method: string
          amount: number
          mp_payment_id: string | null
        }

        if (row.method !== 'mercadopago_qr' && row.method !== 'mercadopago_online') return
        if (!row.mp_payment_id) return

        // Cancel polling fallback since Supabase Realtime delivered first
        const cancelPolling = (app.locals as any).pendingPolling?.get(row.mp_payment_id)
        if (cancelPolling) {
          cancelPolling()
          ;(app.locals as any).pendingPolling?.delete(row.mp_payment_id)
        }

        // Upsert payment into local SQLite (may already exist if recorded locally)
        try {
          await recordPayment({
            tableSessionId: row.table_session_id,
            method: row.method,
            amount: row.amount,
            mpPaymentId: row.mp_payment_id,
            receivedBy: 'webhook',
          })
        } catch {
          // Payment may already be recorded — ignore duplicate
        }

        emitToAll('mp_payment_confirmed', {
          paymentId: row.mp_payment_id,
          amount: row.amount,
          sessionId: row.table_session_id,
        })
      }
    )
    .subscribe()
}
```

- [ ] **14.4** Call `startRealtimeListener(app)` in `apps/local-server/src/index.ts` after server starts
- [ ] **14.5** Run test — verify PASS
- [ ] **14.6** Commit: `feat(local-server): listen to Supabase Realtime for MP payment confirmations`

---

## Task 15: app-pos — Discounts, cancellations, cash register UI

The POS (cashier) needs UI for these operations. These extend the app-pos built in Plan 1.

**Files:**
- Create: `apps/app-pos/src/components/DiscountModal.tsx`
- Create: `apps/app-pos/src/components/CancelOrderModal.tsx`
- Create: `apps/app-pos/src/app/cash-register/page.tsx`

- [ ] **15.1** Create `apps/app-pos/src/components/DiscountModal.tsx`
  - Radio: Porcentaje / Monto fijo
  - Numeric input for value
  - Text input for reason (required, min 3 chars)
  - Preview: "Descuento: -$X.XX" before confirming
  - Submit → `POST /orders/:id/discount`
  - Cashier role guard (hide button for waiter role)

- [ ] **15.2** Create `apps/app-pos/src/components/CancelOrderModal.tsx`
  - Textarea for reason (required)
  - Warning: "Esta acción es irreversible"
  - Submit → `POST /orders/:id/cancel`
  - Audit info: shows current user name

- [ ] **15.3** Create `apps/app-pos/src/app/cash-register/page.tsx`

```
Flow:
1. Page loads → GET /cash-register/today → shows running tally
2. Input: "Fondo de caja (apertura)" — default from last close or 0
3. Input: "Efectivo contado" — what the cashier physically counts
4. "Generar cierre" button → POST /cash-register/close → gets pdfBase64
5. Auto-download PDF + show summary table
6. Previous closes listed below (GET /cash-register/history if implemented)
```

- [ ] **15.4** In `apps/app-pos/src/components/OrderPanel.tsx` (from Plan 1), add:
  - "Aplicar descuento" button (cashier role only) → opens `DiscountModal`
  - "Anular pedido" button (cashier role only) → opens `CancelOrderModal`
  - "Anular item" per item row → opens `CancelOrderModal` (item variant)

- [ ] **15.5** Test: cashier applies 10% discount → order total updates in panel; `order_updated` socket event received by waiter
- [ ] **15.6** Test: cashier cancels order → order disappears from KDS; `order_updated` received
- [ ] **15.7** Commit: `feat(app-pos): add discount modal, cancel modal, cash register close page`

---

## Task 16: Integration test — full payment flow

- [ ] **16.1** Manual E2E test sequence (document and optionally automate with Playwright):

```
1. Open table (app-waiter or app-pos)
2. Add 2 items (app-waiter)
3. Items appear in kitchen/bar (Plan 1 flow)
4. Mark items ready (kitchen/bar)
5. app-waiter shows items as ready, vibrates
6. Waiter delivers items (tap "Entregar" per item)
7. Navigate to /payment/[sessionId] in app-waiter
8. Verify balance shows correct total
9. Tap "Cobrar con MercadoPago QR"
10. QR appears — verify MP QR created (check MP sandbox dashboard)
11. Simulate webhook: POST to Vercel webhook endpoint with test payload
12. Verify Supabase payment row inserted
13. Verify Supabase Realtime fires → local-server receives
14. Verify mp_payment_confirmed socket event reaches app-waiter
15. MpQrSheet shows "¡Pago confirmado!"
16. Balance pending = 0
17. Tap "Cerrar mesa e imprimir" — verify printer ticket sent (or PrinterOfflineError 503 if no printer)
18. Table status = available in both app-waiter and app-pos salon
19. app-pos cashier opens cash register page — today's tally shows the payment
20. Generate cierre — PDF downloads
```

- [ ] **16.2** Test split payment:
  - Add items, navigate to payment, tap "Dividir cuenta en 2"
  - Pay part 1 with cash — balance updates
  - Pay part 2 with MP QR — confirmation received
  - Balance = 0, close table

- [ ] **16.3** Test cashier closes waiter's table:
  - app-waiter is on /payment/[sessionId]
  - app-pos cashier closes same table
  - app-waiter receives `table_closed` socket event → redirected to /salon with toast

- [ ] **16.4** Commit: `test: add integration test checklist for full payment flow`

---

## Verification Checklist

- [ ] `pnpm build` — zero errors across app-waiter and local-server
- [ ] app-waiter installs as PWA on Android/iOS (manifest + service worker)
- [ ] "Llamar al mesero" triggers vibration on waiter device
- [ ] MP QR appears within 3 seconds of tapping "Cobrar con MP"
- [ ] Payment confirmed via Supabase Realtime (not polling) in < 5 seconds
- [ ] Polling fallback fires after 30s if Realtime does not deliver
- [ ] Cash payment records correctly and updates balance
- [ ] Split bill N ways distributes amount correctly
- [ ] Partial payment (cash + MP) totals to exact pending amount
- [ ] Table closed by cashier notifies waiter in real-time
- [ ] Discounts applied by cashier only (waiter gets 403)
- [ ] Cancellations require reason, emit `order_updated` to KDS
- [ ] Thermal printer `/print/ticket` → kitchen ticket printed
- [ ] Thermal printer `/print/bill` → customer bill printed
- [ ] Printer offline → 503 response, app shows toast (does not block close)
- [ ] Cash register close generates PDF with correct totals
- [ ] Expected cash vs counted cash difference shown in PDF
- [ ] `GET /payments/session/:id` returns correct balance at all times
- [ ] All payment rows have `synced=false` until next sync cycle

---

*Previous: [Plan 2 — Customer QR Ordering](2026-03-21-plan-2-qr-ordering.md)*
*Next: [Plan 4 — Salon Editor & Delivery](2026-03-21-plan-4-salon-delivery.md)*
