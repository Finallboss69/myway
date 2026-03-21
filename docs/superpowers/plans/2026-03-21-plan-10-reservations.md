# My Way — Plan 10: Reservations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete reservations system — create, confirm, seat, and cancel table reservations from app-pos, highlight reserved tables in the salon layout, show today's reservations panel, send a 15-minute upcoming alert via Socket.io, and provide full reservation management with statistics in app-admin.

**Architecture:** Reservations live in SQLite (local-server) and sync to Supabase like all other entities. local-server exposes REST endpoints and runs a `node-cron` job every minute to emit `reservation_upcoming` events when a reservation is 15 minutes away. app-pos renders reserved tables with a clock icon overlay and shows a collapsible sidebar panel grouping today's reservations by time. app-admin adds a dedicated `/reservations` page with filters and stats.

**Tech Stack:** Next.js 15, Socket.io 4, Prisma + SQLite, node-cron 3, date-fns 3, @myway/ui, @myway/types, @myway/db

**Depends on:** Plan 1 (Core Bar Operations)

---

## File Map

```
apps/
├── app-pos/
│   └── src/
│       ├── app/
│       │   └── salon/
│       │       └── page.tsx                        # Extended: add ReservationsSidebar
│       └── components/
│           ├── ReservationsSidebar.tsx              # Today's reservations grouped by time
│           ├── ReservationCard.tsx                  # Single reservation row with actions
│           ├── ReservationFormModal.tsx             # Create/edit reservation form
│           ├── ReservationUpcomingToast.tsx         # 15-min alert toast component
│           └── TableCard.tsx                        # Extended: clock icon overlay for reserved
│
├── app-admin/
│   └── src/
│       ├── app/
│       │   └── reservations/
│       │       └── page.tsx                        # Full reservation management page
│       └── components/
│           ├── ReservationTable.tsx                # Filterable list with status badges
│           ├── ReservationFilters.tsx              # Date + status + table filters
│           └── ReservationStats.tsx                # Rate, no-show %, popular time slots
│
└── local-server/
    └── src/
        ├── routes/
        │   └── reservations.ts                     # GET/POST/PATCH/DELETE /reservations
        ├── services/
        │   └── reservation.service.ts              # Business logic: conflict check, seat, cancel
        └── jobs/
            └── reservation-reminder.ts             # node-cron: every minute, emit upcoming alert

packages/
└── types/
    └── src/
        └── reservation.ts                          # ReservationStatus, Reservation interface

supabase/
└── migrations/
    └── 20260321001000_reservations.sql             # reservations table + index (if not in initial)
```

---

## Task 1: Package `types` — Reservation types

**Files:**
- Create: `packages/types/src/reservation.ts`
- Modify: `packages/types/src/index.ts`

- [ ] **1.1** Create `packages/types/src/reservation.ts`

```typescript
export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'no_show'

export interface Reservation {
  id: string
  venueId: string
  tableId: string | null
  customerName: string
  customerPhone: string | null
  date: string          // ISO date string 'YYYY-MM-DD'
  time: string          // 'HH:mm'
  partySize: number
  status: ReservationStatus
  notes: string | null
  createdBy: string | null
  createdAt: Date
}

// Payload for the 15-min socket alert
export interface SocketReservationUpcoming {
  reservation: Reservation
  minutesAway: number
}
```

- [ ] **1.2** Add export to `packages/types/src/index.ts`

```typescript
export * from './reservation'
```

- [ ] **1.3** Commit

```bash
git add packages/types
git commit -m "feat(types): add Reservation types and SocketReservationUpcoming payload"
```

---

## Task 2: Database migration — reservations table

**Files:**
- Create: `supabase/migrations/20260321001000_reservations.sql`

> Note: If the `reservations` table was already created in the initial migration from Plan 0, skip step 2.1 and only run 2.2 (the index) as a delta migration. Check before running.

- [ ] **2.1** Create `supabase/migrations/20260321001000_reservations.sql`

```sql
-- Skip this file if the reservations table already exists from Plan 0's initial migration.

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  party_size INT NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','confirmed','seated','cancelled','no_show')
  ),
  notes TEXT,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast daily queries (used on every salon load)
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(venue_id, date);

-- Index for status-based filtering in admin
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(venue_id, status);

-- Enable Realtime so local-server can receive cloud changes during sync
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
```

- [ ] **2.2** Apply migration

```bash
supabase db push
```

- [ ] **2.3** Commit

```bash
git add supabase/migrations/
git commit -m "feat(db): add reservations table, indexes, and realtime publication"
```

---

## Task 3: local-server — Reservation service + routes

**Files:**
- Create: `apps/local-server/src/services/reservation.service.ts`
- Create: `apps/local-server/src/routes/reservations.ts`
- Modify: `apps/local-server/src/server.ts` (register router)
- Test: `apps/local-server/src/__tests__/reservations.test.ts`

### TDD — write tests first

- [ ] **3.1** Write failing tests — `apps/local-server/src/__tests__/reservations.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../server'

// Mock Prisma so tests run without a real DB
vi.mock('@myway/db', () => ({
  prisma: {
    reservation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    table: {
      update: vi.fn(),
    },
    tableSession: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@myway/db'

const VENUE_ID = '00000000-0000-0000-0000-000000000001'

describe('GET /reservations', () => {
  it('returns 400 if date param is missing', async () => {
    const app = createApp()
    const res = await request(app)
      .get('/reservations')
      .set('Authorization', 'Bearer mock-token')
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/date/)
  })

  it('returns reservations for a given date', async () => {
    const mockReservations = [
      {
        id: 'r-001',
        venueId: VENUE_ID,
        tableId: null,
        customerName: 'Juan Pérez',
        customerPhone: '1155551234',
        date: new Date('2026-03-21'),
        time: new Date('1970-01-01T20:00:00'),
        partySize: 4,
        status: 'confirmed',
        notes: null,
        createdBy: null,
        createdAt: new Date(),
      },
    ]
    vi.mocked(prisma.reservation.findMany).mockResolvedValue(mockReservations as never)

    const app = createApp()
    const res = await request(app)
      .get('/reservations?date=2026-03-21')
      .set('Authorization', 'Bearer mock-token')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].customerName).toBe('Juan Pérez')
  })
})

describe('POST /reservations', () => {
  it('returns 422 if required fields are missing', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', 'Bearer mock-token')
      .send({ customerName: 'Ana' }) // missing date, time, partySize
    expect(res.status).toBe(422)
    expect(res.body.error).toBeDefined()
  })

  it('creates a reservation and returns it with status pending', async () => {
    const payload = {
      customerName: 'Ana García',
      customerPhone: '1144449999',
      date: '2026-03-22',
      time: '21:00',
      partySize: 2,
      tableId: null,
      notes: 'Mesa cerca de la ventana',
    }
    const created = { id: 'r-002', ...payload, status: 'pending', venueId: VENUE_ID, createdBy: null, createdAt: new Date() }
    vi.mocked(prisma.reservation.create).mockResolvedValue(created as never)

    const app = createApp()
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', 'Bearer mock-token')
      .send(payload)
    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('pending')
    expect(res.body.data.customerName).toBe('Ana García')
  })
})

describe('PATCH /reservations/:id/status', () => {
  it('returns 400 for invalid status transition (e.g. seated → pending)', async () => {
    vi.mocked(prisma.reservation.findUnique).mockResolvedValue({
      id: 'r-003', status: 'seated',
    } as never)

    const app = createApp()
    const res = await request(app)
      .patch('/reservations/r-003/status')
      .set('Authorization', 'Bearer mock-token')
      .send({ status: 'pending' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/transition/)
  })

  it('confirms a pending reservation', async () => {
    vi.mocked(prisma.reservation.findUnique).mockResolvedValue({
      id: 'r-004', status: 'pending',
    } as never)
    vi.mocked(prisma.reservation.update).mockResolvedValue({
      id: 'r-004', status: 'confirmed',
    } as never)

    const app = createApp()
    const res = await request(app)
      .patch('/reservations/r-004/status')
      .set('Authorization', 'Bearer mock-token')
      .send({ status: 'confirmed' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('confirmed')
  })

  it('seats a confirmed reservation and creates a table session', async () => {
    vi.mocked(prisma.reservation.findUnique).mockResolvedValue({
      id: 'r-005', status: 'confirmed', tableId: 't-001',
    } as never)
    vi.mocked(prisma.reservation.update).mockResolvedValue({
      id: 'r-005', status: 'seated',
    } as never)
    vi.mocked(prisma.tableSession.create).mockResolvedValue({ id: 'ts-001' } as never)
    vi.mocked(prisma.table.update).mockResolvedValue({} as never)

    const app = createApp()
    const res = await request(app)
      .patch('/reservations/r-005/status')
      .set('Authorization', 'Bearer mock-token')
      .send({ status: 'seated' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('seated')
    expect(res.body.tableSessionId).toBeDefined()
  })
})

describe('DELETE /reservations/:id', () => {
  it('soft-cancels by setting status to cancelled', async () => {
    vi.mocked(prisma.reservation.findUnique).mockResolvedValue({
      id: 'r-006', status: 'confirmed',
    } as never)
    vi.mocked(prisma.reservation.update).mockResolvedValue({
      id: 'r-006', status: 'cancelled',
    } as never)

    const app = createApp()
    const res = await request(app)
      .delete('/reservations/r-006')
      .set('Authorization', 'Bearer mock-token')
      .send({ reason: 'El cliente llamó para cancelar' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('cancelled')
  })
})
```

- [ ] **3.2** Run tests — verify they FAIL

```bash
cd apps/local-server && pnpm test
# Expected: FAIL — routes not defined
```

- [ ] **3.3** Create `apps/local-server/src/services/reservation.service.ts`

```typescript
import { prisma } from '@myway/db'
import type { ReservationStatus } from '@myway/types'

// Valid status transitions for reservations
const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['seated', 'cancelled', 'no_show'],
  seated:    [],
  cancelled: [],
  no_show:   [],
}

export function isValidTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

export interface CreateReservationInput {
  venueId: string
  tableId?: string | null
  customerName: string
  customerPhone?: string | null
  date: string   // 'YYYY-MM-DD'
  time: string   // 'HH:mm'
  partySize: number
  notes?: string | null
  createdBy?: string | null
}

export async function createReservation(input: CreateReservationInput) {
  const { date, time, ...rest } = input
  return prisma.reservation.create({
    data: {
      ...rest,
      date: new Date(date),
      // Store time as a Date on the epoch day so Prisma TIME maps correctly
      time: new Date(`1970-01-01T${time}:00Z`),
      status: 'pending',
    },
  })
}

export async function getReservationsByDate(venueId: string, date: string) {
  return prisma.reservation.findMany({
    where: {
      venueId,
      date: new Date(date),
      status: { notIn: ['cancelled', 'no_show'] },
    },
    orderBy: { time: 'asc' },
  })
}

export async function getAllReservations(
  venueId: string,
  filters: { date?: string; status?: ReservationStatus; tableId?: string }
) {
  return prisma.reservation.findMany({
    where: {
      venueId,
      ...(filters.date ? { date: new Date(filters.date) } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.tableId ? { tableId: filters.tableId } : {}),
    },
    orderBy: [{ date: 'desc' }, { time: 'asc' }],
  })
}

export interface UpdateStatusResult {
  reservation: Awaited<ReturnType<typeof prisma.reservation.update>>
  tableSessionId?: string
}

export async function updateReservationStatus(
  id: string,
  newStatus: ReservationStatus,
  staffId?: string
): Promise<UpdateStatusResult> {
  const current = await prisma.reservation.findUnique({ where: { id } })
  if (!current) throw new Error('Reservation not found')

  if (!isValidTransition(current.status as ReservationStatus, newStatus)) {
    throw new Error(`Invalid transition: ${current.status} → ${newStatus}`)
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: newStatus },
  })

  // When seating, open a table session and mark the table as occupied
  let tableSessionId: string | undefined
  if (newStatus === 'seated' && current.tableId) {
    const session = await prisma.tableSession.create({
      data: {
        tableId: current.tableId,
        openedBy: staffId ?? null,
        status: 'open',
        notes: `Reserva: ${current.customerName} (${current.partySize} personas)`,
      },
    })
    tableSessionId = session.id

    await prisma.table.update({
      where: { id: current.tableId },
      data: { status: 'occupied' },
    })
  }

  // When cancelling or no-show, free the table if it was reserved
  if ((newStatus === 'cancelled' || newStatus === 'no_show') && current.tableId) {
    await prisma.table.update({
      where: { id: current.tableId },
      data: { status: 'available' },
    })
  }

  return { reservation: updated, tableSessionId }
}

export async function cancelReservation(id: string, reason?: string): Promise<typeof updateReservationStatus> {
  // Soft cancel: delegate to updateReservationStatus
  void reason // reason is stored in notes if provided
  const current = await prisma.reservation.findUnique({ where: { id } })
  if (!current) throw new Error('Reservation not found')

  if (!isValidTransition(current.status as ReservationStatus, 'cancelled')) {
    throw new Error(`Cannot cancel reservation with status: ${current.status}`)
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      status: 'cancelled',
      ...(reason ? { notes: reason } : {}),
    },
  })

  if (current.tableId) {
    await prisma.table.update({
      where: { id: current.tableId },
      data: { status: 'available' },
    })
  }

  return updated as never
}

// Returns reservations starting in the next `withinMinutes` minutes
export async function getUpcomingReservations(venueId: string, withinMinutes: number) {
  const { isWithinInterval, addMinutes, startOfDay } = await import('date-fns')
  const now = new Date()
  const today = startOfDay(now)
  const horizon = addMinutes(now, withinMinutes)

  const todayReservations = await prisma.reservation.findMany({
    where: {
      venueId,
      date: today,
      status: { in: ['pending', 'confirmed'] },
    },
  })

  return todayReservations.filter((r) => {
    // Reconstruct reservation datetime for today
    const reservationTime = new Date(r.time)
    const todayWithTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      reservationTime.getUTCHours(),
      reservationTime.getUTCMinutes()
    )
    return isWithinInterval(todayWithTime, { start: now, end: horizon })
  })
}
```

- [ ] **3.4** Create `apps/local-server/src/routes/reservations.ts`

```typescript
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  createReservation,
  getReservationsByDate,
  getAllReservations,
  updateReservationStatus,
  cancelReservation,
} from '../services/reservation.service'
import type { ReservationStatus } from '@myway/types'

export const reservationsRouter = Router()

const VENUE_ID = process.env.VENUE_ID ?? '00000000-0000-0000-0000-000000000001'

// GET /reservations?date=YYYY-MM-DD
// Returns today's active reservations (used by app-pos sidebar)
reservationsRouter.get('/', requireAuth, async (req, res) => {
  const { date } = req.query

  if (!date || typeof date !== 'string') {
    res.status(400).json({ error: 'Query param "date" is required (YYYY-MM-DD)' })
    return
  }

  try {
    const reservations = await getReservationsByDate(VENUE_ID, date)
    res.json({ data: reservations })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservations' })
  }
})

// GET /reservations/all — full list with filters (used by app-admin)
reservationsRouter.get('/all', requireAuth, async (req, res) => {
  const { date, status, tableId } = req.query

  try {
    const reservations = await getAllReservations(VENUE_ID, {
      date: typeof date === 'string' ? date : undefined,
      status: typeof status === 'string' ? (status as ReservationStatus) : undefined,
      tableId: typeof tableId === 'string' ? tableId : undefined,
    })
    res.json({ data: reservations })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservations' })
  }
})

// POST /reservations — create new reservation
reservationsRouter.post('/', requireAuth, async (req, res) => {
  const { customerName, date, time, partySize, customerPhone, tableId, notes } = req.body

  if (!customerName || !date || !time || !partySize) {
    res.status(422).json({
      error: 'Required fields: customerName, date (YYYY-MM-DD), time (HH:mm), partySize',
    })
    return
  }

  if (typeof partySize !== 'number' || partySize < 1) {
    res.status(422).json({ error: 'partySize must be a positive number' })
    return
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(422).json({ error: 'date must be in YYYY-MM-DD format' })
    return
  }

  // Validate time format
  if (!/^\d{2}:\d{2}$/.test(time)) {
    res.status(422).json({ error: 'time must be in HH:mm format' })
    return
  }

  try {
    const reservation = await createReservation({
      venueId: VENUE_ID,
      customerName,
      customerPhone: customerPhone ?? null,
      date,
      time,
      partySize,
      tableId: tableId ?? null,
      notes: notes ?? null,
      createdBy: res.locals.staffId ?? null,
    })
    res.status(201).json({ data: reservation })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create reservation' })
  }
})

// PATCH /reservations/:id/status — update status (confirm, seat, no-show)
reservationsRouter.patch('/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!status) {
    res.status(400).json({ error: 'Body field "status" is required' })
    return
  }

  const validStatuses: ReservationStatus[] = ['pending', 'confirmed', 'seated', 'cancelled', 'no_show']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
    return
  }

  try {
    const result = await updateReservationStatus(id, status as ReservationStatus, res.locals.staffId)
    res.json({ data: result.reservation, tableSessionId: result.tableSessionId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('transition') || message.includes('not found')) {
      res.status(400).json({ error: message })
    } else {
      res.status(500).json({ error: 'Failed to update reservation status' })
    }
  }
})

// DELETE /reservations/:id — soft cancel
reservationsRouter.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { reason } = req.body

  try {
    const reservation = await cancelReservation(id, reason)
    res.json({ data: reservation })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('not found') || message.includes('Cannot cancel')) {
      res.status(400).json({ error: message })
    } else {
      res.status(500).json({ error: 'Failed to cancel reservation' })
    }
  }
})
```

- [ ] **3.5** Register the router in `apps/local-server/src/server.ts`

Add after existing route registrations:

```typescript
import { reservationsRouter } from './routes/reservations'

// inside createApp():
app.use('/reservations', reservationsRouter)
```

- [ ] **3.6** Run tests — verify they PASS

```bash
cd apps/local-server && pnpm test
# Expected: PASS — all reservation route tests green
```

- [ ] **3.7** Commit

```bash
git add apps/local-server
git commit -m "feat(local-server): add reservations CRUD routes with status machine and seat-to-session flow"
```

---

## Task 4: local-server — 15-minute reservation reminder cron job

**Files:**
- Create: `apps/local-server/src/jobs/reservation-reminder.ts`
- Modify: `apps/local-server/src/index.ts` (start the cron)
- Modify: `packages/utils/src/constants.ts` (add socket event constant)
- Test: `apps/local-server/src/__tests__/reservation-reminder.test.ts`

- [ ] **4.1** Add `RESERVATION_UPCOMING` to `packages/utils/src/constants.ts`

```typescript
// Add to SOCKET_EVENTS:
RESERVATION_UPCOMING: 'reservation_upcoming',
```

- [ ] **4.2** Add `date-fns` and `node-cron` to local-server dependencies

```bash
cd apps/local-server
pnpm add date-fns node-cron
pnpm add -D @types/node-cron
```

- [ ] **4.3** Write failing test — `apps/local-server/src/__tests__/reservation-reminder.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkUpcomingReservations } from '../jobs/reservation-reminder'

vi.mock('../services/reservation.service', () => ({
  getUpcomingReservations: vi.fn(),
}))

import { getUpcomingReservations } from '../services/reservation.service'

describe('checkUpcomingReservations', () => {
  const mockEmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits reservation_upcoming for each reservation found', async () => {
    const mockReservation = {
      id: 'r-001',
      customerName: 'Carlos López',
      partySize: 3,
      time: new Date('1970-01-01T20:00:00Z'),
    }
    vi.mocked(getUpcomingReservations).mockResolvedValue([mockReservation] as never)

    await checkUpcomingReservations(mockEmit as never, '00000000-0000-0000-0000-000000000001')

    expect(mockEmit).toHaveBeenCalledOnce()
    expect(mockEmit).toHaveBeenCalledWith(
      'reservation_upcoming',
      expect.objectContaining({ reservation: mockReservation })
    )
  })

  it('does not emit when no upcoming reservations', async () => {
    vi.mocked(getUpcomingReservations).mockResolvedValue([])

    await checkUpcomingReservations(mockEmit as never, '00000000-0000-0000-0000-000000000001')

    expect(mockEmit).not.toHaveBeenCalled()
  })
})
```

- [ ] **4.4** Run test — verify it FAILS

```bash
cd apps/local-server && pnpm test
# Expected: FAIL — checkUpcomingReservations not defined
```

- [ ] **4.5** Create `apps/local-server/src/jobs/reservation-reminder.ts`

```typescript
import cron from 'node-cron'
import { differenceInMinutes, startOfDay } from 'date-fns'
import type { Server } from 'socket.io'
import { getUpcomingReservations } from '../services/reservation.service'
import { SOCKET_EVENTS } from '@myway/utils'
import { logger } from '../lib/logger'

const ALERT_WINDOW_MINUTES = 15

// Exported for unit testing — receives an emit function, not the full io instance
export async function checkUpcomingReservations(
  emit: (event: string, payload: unknown) => void,
  venueId: string
): Promise<void> {
  const upcoming = await getUpcomingReservations(venueId, ALERT_WINDOW_MINUTES)

  for (const reservation of upcoming) {
    const now = new Date()
    const today = startOfDay(now)
    const resTime = new Date(reservation.time)
    const todayWithTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      resTime.getUTCHours(),
      resTime.getUTCMinutes()
    )
    const minutesAway = differenceInMinutes(todayWithTime, now)

    emit(SOCKET_EVENTS.RESERVATION_UPCOMING, { reservation, minutesAway })
    logger.info({ reservationId: reservation.id, minutesAway }, 'Upcoming reservation alert emitted')
  }
}

// Called from index.ts after Socket.io is initialized
export function startReservationReminderCron(io: Server, venueId: string): void {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    await checkUpcomingReservations(
      (event, payload) => io.emit(event, payload),
      venueId
    )
  })
  logger.info('Reservation reminder cron started (every minute)')
}
```

- [ ] **4.6** Run test — verify it PASSES

```bash
cd apps/local-server && pnpm test
# Expected: PASS
```

- [ ] **4.7** Start the cron in `apps/local-server/src/index.ts`

Add after Socket.io setup:

```typescript
import { startReservationReminderCron } from './jobs/reservation-reminder'

const VENUE_ID = process.env.VENUE_ID ?? '00000000-0000-0000-0000-000000000001'

// After io is created:
startReservationReminderCron(io, VENUE_ID)
```

- [ ] **4.8** Commit

```bash
git add apps/local-server packages/utils
git commit -m "feat(local-server): add reservation_upcoming cron job emitting 15-min alerts via Socket.io"
```

---

## Task 5: app-pos — Reservations sidebar and table overlay

**Files:**
- Create: `apps/app-pos/src/components/ReservationsSidebar.tsx`
- Create: `apps/app-pos/src/components/ReservationCard.tsx`
- Create: `apps/app-pos/src/components/ReservationFormModal.tsx`
- Create: `apps/app-pos/src/components/ReservationUpcomingToast.tsx`
- Modify: `apps/app-pos/src/components/TableCard.tsx` (add clock icon overlay)
- Modify: `apps/app-pos/src/app/salon/page.tsx` (integrate sidebar + toast listener)

- [ ] **5.1** Create `apps/app-pos/src/components/ReservationCard.tsx`

```typescript
'use client'

import { Button } from '@myway/ui'
import type { Reservation } from '@myway/types'

interface ReservationCardProps {
  reservation: Reservation
  onConfirm: (id: string) => void
  onSeat: (id: string) => void
  onNoShow: (id: string) => void
  onCancel: (id: string) => void
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendiente',
  confirmed: 'Confirmada',
  seated:    'Sentado',
  cancelled: 'Cancelada',
  no_show:   'No se presentó',
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-500/20 text-amber-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  seated:    'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  no_show:   'bg-surface-3 text-muted-foreground',
}

export function ReservationCard({
  reservation,
  onConfirm,
  onSeat,
  onNoShow,
  onCancel,
}: ReservationCardProps) {
  return (
    <div className="bg-surface-2 rounded-lg p-3 border border-surface-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm text-white">{reservation.customerName}</p>
          {reservation.customerPhone && (
            <p className="text-xs text-muted-foreground">{reservation.customerPhone}</p>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[reservation.status]}`}>
          {STATUS_LABELS[reservation.status]}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{reservation.time}</span>
        <span>{reservation.partySize} personas</span>
        {reservation.tableId && <span>Mesa asignada</span>}
      </div>

      {reservation.notes && (
        <p className="text-xs text-muted-foreground italic">{reservation.notes}</p>
      )}

      <div className="flex gap-2 pt-1">
        {reservation.status === 'pending' && (
          <Button size="sm" onClick={() => onConfirm(reservation.id)}>
            Confirmar
          </Button>
        )}
        {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
          <Button size="sm" variant="default" onClick={() => onSeat(reservation.id)}>
            Sentar clientes
          </Button>
        )}
        {reservation.status === 'confirmed' && (
          <Button size="sm" variant="secondary" onClick={() => onNoShow(reservation.id)}>
            No se presentó
          </Button>
        )}
        {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
          <Button size="sm" variant="destructive" onClick={() => onCancel(reservation.id)}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **5.2** Create `apps/app-pos/src/components/ReservationFormModal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@myway/ui'
import type { Table } from '@myway/types'

interface ReservationFormModalProps {
  tables: Table[]
  onSubmit: (data: ReservationFormData) => Promise<void>
  onClose: () => void
}

export interface ReservationFormData {
  customerName: string
  customerPhone: string
  date: string
  time: string
  partySize: number
  tableId: string | null
  notes: string
}

export function ReservationFormModal({ tables, onSubmit, onClose }: ReservationFormModalProps) {
  const [form, setForm] = useState<ReservationFormData>({
    customerName: '',
    customerPhone: '',
    date: new Date().toISOString().slice(0, 10),
    time: '20:00',
    partySize: 2,
    tableId: null,
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customerName.trim()) {
      setError('El nombre del cliente es requerido')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la reserva')
    } finally {
      setLoading(false)
    }
  }

  const availableTables = tables.filter((t) => t.status === 'available')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface-1 rounded-xl border border-surface-3 p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Nueva reserva</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Nombre del cliente *</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              className="w-full bg-surface-2 border border-surface-4 rounded-lg px-3 py-2 text-sm text-white"
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.customerPhone}
              onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
              className="w-full bg-surface-2 border border-surface-4 rounded-lg px-3 py-2 text-sm text-white"
              placeholder="1155551234"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Fecha *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full bg-surface-2 border border-surface-4 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Hora *</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full bg-surface-2 border border-surface-4 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Personas *</label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.partySize}
                onChange={(e) => setForm((f) => ({ ...f, partySize: Number(e.target.value) }))}
                className="w-full bg-surface-2 border border-surface-4 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Mesa (opcional)</label>
              <select
                value={form.tableId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, tableId: e.target.value || null }))}
                className="w-full bg-surface-2 border border-surface-4 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Sin asignar</option>
                {availableTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Mesa {t.number} ({t.seats} asientos)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full bg-surface-2 border border-surface-4 rounded-lg px-3 py-2 text-sm text-white resize-none"
              rows={2}
              placeholder="Mesa cerca de la ventana, cumpleaños, etc."
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creando...' : 'Crear reserva'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **5.3** Create `apps/app-pos/src/components/ReservationUpcomingToast.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import type { SocketReservationUpcoming } from '@myway/types'

interface ReservationUpcomingToastProps {
  alert: SocketReservationUpcoming | null
  onDismiss: () => void
}

export function ReservationUpcomingToast({ alert, onDismiss }: ReservationUpcomingToastProps) {
  useEffect(() => {
    if (!alert) return
    // Auto-dismiss after 30 seconds
    const timer = setTimeout(onDismiss, 30_000)
    return () => clearTimeout(timer)
  }, [alert, onDismiss])

  if (!alert) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm bg-amber-500 text-black rounded-xl p-4 shadow-2xl animate-in slide-in-from-right-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⏰</span>
        <div className="flex-1">
          <p className="font-bold text-sm">Reserva en {alert.minutesAway} min</p>
          <p className="text-sm mt-0.5">
            {alert.reservation.customerName} — {alert.reservation.partySize} personas
          </p>
          {alert.reservation.time && (
            <p className="text-xs mt-0.5 opacity-75">Hora: {alert.reservation.time}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-black/60 hover:text-black text-lg leading-none"
          aria-label="Cerrar alerta"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
```

- [ ] **5.4** Create `apps/app-pos/src/components/ReservationsSidebar.tsx`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { Button } from '@myway/ui'
import { ReservationCard } from './ReservationCard'
import { ReservationFormModal, type ReservationFormData } from './ReservationFormModal'
import type { Reservation, Table } from '@myway/types'

interface ReservationsSidebarProps {
  reservations: Reservation[]
  tables: Table[]
  onCreateReservation: (data: ReservationFormData) => Promise<void>
  onConfirm: (id: string) => void
  onSeat: (id: string) => void
  onNoShow: (id: string) => void
  onCancel: (id: string) => void
}

// Groups reservations by hour slot: '20:00', '21:00', etc.
function groupByHour(reservations: Reservation[]): Map<string, Reservation[]> {
  const groups = new Map<string, Reservation[]>()
  for (const r of reservations) {
    const hour = r.time.slice(0, 5)   // 'HH:mm'
    const group = groups.get(hour) ?? []
    group.push(r)
    groups.set(hour, group)
  }
  return new Map([...groups.entries()].sort())
}

export function ReservationsSidebar({
  reservations,
  tables,
  onCreateReservation,
  onConfirm,
  onSeat,
  onNoShow,
  onCancel,
}: ReservationsSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const grouped = groupByHour(reservations)
  const totalActive = reservations.filter(
    (r) => r.status === 'pending' || r.status === 'confirmed'
  ).length

  return (
    <>
      {/* Sidebar toggle tab */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-surface-2 border border-surface-4 border-r-0 rounded-l-lg px-2 py-4 text-xs text-muted-foreground hover:text-white writing-mode-vertical"
        aria-label={isOpen ? 'Cerrar panel de reservas' : 'Abrir panel de reservas'}
      >
        <span className="[writing-mode:vertical-rl] rotate-180">
          Reservas {totalActive > 0 && `(${totalActive})`}
        </span>
      </button>

      {/* Sidebar panel */}
      {isOpen && (
        <aside className="fixed right-0 top-0 bottom-0 w-80 bg-surface-1 border-l border-surface-3 z-20 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-surface-3">
            <div>
              <h2 className="font-semibold text-white">Reservas de hoy</h2>
              <p className="text-xs text-muted-foreground">
                {totalActive} activas
              </p>
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              + Nueva
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {grouped.size === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay reservas para hoy
              </p>
            )}
            {[...grouped.entries()].map(([hour, group]) => (
              <div key={hour}>
                <p className="text-xs font-semibold text-amber-400 mb-2">{hour}</p>
                <div className="space-y-2">
                  {group.map((r) => (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      onConfirm={onConfirm}
                      onSeat={onSeat}
                      onNoShow={onNoShow}
                      onCancel={onCancel}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {showForm && (
        <ReservationFormModal
          tables={tables}
          onSubmit={onCreateReservation}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  )
}
```

- [ ] **5.5** Extend `apps/app-pos/src/components/TableCard.tsx` — add clock icon when table is reserved

Find the table status rendering section and add:

```typescript
// Add to the status overlay section inside TableCard:
{table.status === 'reserved' && (
  <div className="absolute top-1 right-1 text-blue-400 text-sm" title="Mesa reservada">
    🕐
  </div>
)}
```

- [ ] **5.6** Extend `apps/app-pos/src/app/salon/page.tsx` — integrate sidebar, toast, and reservation data

Add the following capabilities:
- Fetch today's reservations with TanStack Query (`GET /reservations?date=today`)
- Maintain `upcomingAlert` state of type `SocketReservationUpcoming | null`
- Listen to `reservation_upcoming` socket event, set alert state
- Listen to `reservation_updated` socket event, invalidate query
- Render `<ReservationsSidebar />` with action handlers calling PATCH/DELETE
- Render `<ReservationUpcomingToast />` driven by alert state
- On "Sentar clientes": call `PATCH /reservations/:id/status { status: 'seated' }`, navigate to `/salon/${tableSessionId}` if returned

Key wiring:

```typescript
const { data: reservations } = useQuery({
  queryKey: ['reservations', today],
  queryFn: () => api.get<Reservation[]>(`/reservations?date=${today}`),
  refetchInterval: 60_000,   // poll every minute as fallback
})

socket.on(SOCKET_EVENTS.RESERVATION_UPCOMING, (payload: SocketReservationUpcoming) => {
  setUpcomingAlert(payload)
})

const handleSeat = async (reservationId: string) => {
  const result = await api.patch(`/reservations/${reservationId}/status`, { status: 'seated' })
  if (result.tableSessionId) {
    router.push(`/salon/${result.tableSessionId}`)
  }
  queryClient.invalidateQueries({ queryKey: ['reservations'] })
  queryClient.invalidateQueries({ queryKey: ['tables'] })
}
```

- [ ] **5.7** Commit

```bash
git add apps/app-pos
git commit -m "feat(app-pos): add reservations sidebar, clock overlay on reserved tables, and 15-min alert toast"
```

---

## Task 6: app-admin — Reservation management page

**Files:**
- Create: `apps/app-admin/src/app/reservations/page.tsx`
- Create: `apps/app-admin/src/components/ReservationTable.tsx`
- Create: `apps/app-admin/src/components/ReservationFilters.tsx`
- Create: `apps/app-admin/src/components/ReservationStats.tsx`

- [ ] **6.1** Create `apps/app-admin/src/components/ReservationFilters.tsx`

```typescript
'use client'

import type { ReservationStatus } from '@myway/types'

interface ReservationFiltersProps {
  date: string
  status: string
  onDateChange: (date: string) => void
  onStatusChange: (status: string) => void
  onReset: () => void
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'seated', label: 'Sentado' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'no_show', label: 'No se presentó' },
]

export function ReservationFilters({
  date,
  status,
  onDateChange,
  onStatusChange,
  onReset,
}: ReservationFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-surface-2 border border-surface-4 rounded-lg px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Estado</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-surface-2 border border-surface-4 rounded-lg px-3 py-2 text-sm text-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <button
        onClick={onReset}
        className="text-sm text-muted-foreground hover:text-white px-3 py-2"
      >
        Limpiar filtros
      </button>
    </div>
  )
}
```

- [ ] **6.2** Create `apps/app-admin/src/components/ReservationStats.tsx`

```typescript
'use client'

import type { Reservation } from '@myway/types'

interface ReservationStatsProps {
  reservations: Reservation[]
}

function getPopularTimeSlots(reservations: Reservation[]): { time: string; count: number }[] {
  const counts: Record<string, number> = {}
  for (const r of reservations) {
    const slot = r.time.slice(0, 5)
    counts[slot] = (counts[slot] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([time, count]) => ({ time, count }))
}

export function ReservationStats({ reservations }: ReservationStatsProps) {
  const total = reservations.length
  const noShows = reservations.filter((r) => r.status === 'no_show').length
  const seated = reservations.filter((r) => r.status === 'seated').length
  const noShowRate = total > 0 ? Math.round((noShows / total) * 100) : 0
  const seatRate = total > 0 ? Math.round((seated / total) * 100) : 0
  const popularSlots = getPopularTimeSlots(reservations)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-surface-2 rounded-xl p-4 border border-surface-4">
        <p className="text-xs text-muted-foreground">Total reservas</p>
        <p className="text-2xl font-bold text-white mt-1">{total}</p>
      </div>
      <div className="bg-surface-2 rounded-xl p-4 border border-surface-4">
        <p className="text-xs text-muted-foreground">Tasa de ocupación</p>
        <p className="text-2xl font-bold text-green-400 mt-1">{seatRate}%</p>
      </div>
      <div className="bg-surface-2 rounded-xl p-4 border border-surface-4">
        <p className="text-xs text-muted-foreground">Tasa de no-show</p>
        <p className="text-2xl font-bold text-red-400 mt-1">{noShowRate}%</p>
      </div>
      <div className="bg-surface-2 rounded-xl p-4 border border-surface-4">
        <p className="text-xs text-muted-foreground">Horarios más populares</p>
        <div className="mt-1 space-y-1">
          {popularSlots.length === 0 && (
            <p className="text-sm text-muted-foreground">—</p>
          )}
          {popularSlots.map((slot) => (
            <div key={slot.time} className="flex justify-between text-xs text-white">
              <span>{slot.time}</span>
              <span className="text-amber-400">{slot.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **6.3** Create `apps/app-admin/src/components/ReservationTable.tsx`

```typescript
'use client'

import type { Reservation } from '@myway/types'
import { Button } from '@myway/ui'

interface ReservationTableProps {
  reservations: Reservation[]
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  onMarkNoShow: (id: string) => void
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendiente',
  confirmed: 'Confirmada',
  seated:    'Sentado',
  cancelled: 'Cancelada',
  no_show:   'No se presentó',
}

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-500/20 text-amber-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  seated:    'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  no_show:   'bg-surface-3 text-muted-foreground',
}

export function ReservationTable({
  reservations,
  onConfirm,
  onCancel,
  onMarkNoShow,
}: ReservationTableProps) {
  if (reservations.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No hay reservas para los filtros seleccionados
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-3 text-left text-xs text-muted-foreground">
            <th className="pb-3 pr-4">Fecha / Hora</th>
            <th className="pb-3 pr-4">Cliente</th>
            <th className="pb-3 pr-4">Teléfono</th>
            <th className="pb-3 pr-4">Personas</th>
            <th className="pb-3 pr-4">Estado</th>
            <th className="pb-3 pr-4">Notas</th>
            <th className="pb-3">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-3">
          {reservations.map((r) => (
            <tr key={r.id}>
              <td className="py-3 pr-4 text-white">
                <div>{r.date}</div>
                <div className="text-xs text-muted-foreground">{r.time}</div>
              </td>
              <td className="py-3 pr-4 font-medium text-white">{r.customerName}</td>
              <td className="py-3 pr-4 text-muted-foreground">{r.customerPhone ?? '—'}</td>
              <td className="py-3 pr-4 text-white">{r.partySize}</td>
              <td className="py-3 pr-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </span>
              </td>
              <td className="py-3 pr-4 text-xs text-muted-foreground max-w-[180px] truncate">
                {r.notes ?? '—'}
              </td>
              <td className="py-3">
                <div className="flex gap-2">
                  {r.status === 'pending' && (
                    <Button size="sm" onClick={() => onConfirm(r.id)}>
                      Confirmar
                    </Button>
                  )}
                  {r.status === 'confirmed' && (
                    <Button size="sm" variant="secondary" onClick={() => onMarkNoShow(r.id)}>
                      No show
                    </Button>
                  )}
                  {(r.status === 'pending' || r.status === 'confirmed') && (
                    <Button size="sm" variant="destructive" onClick={() => onCancel(r.id)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **6.4** Create `apps/app-admin/src/app/reservations/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ReservationFilters } from '../../components/ReservationFilters'
import { ReservationTable } from '../../components/ReservationTable'
import { ReservationStats } from '../../components/ReservationStats'
import { ReservationFormModal, type ReservationFormData } from '../../components/ReservationFormModal'
import { Button } from '@myway/ui'
import { api } from '../../lib/api'
import type { Reservation } from '@myway/types'

export default function ReservationsPage() {
  const queryClient = useQueryClient()

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ['admin-reservations', date, status],
    queryFn: () => {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      if (status) params.set('status', status)
      return api.get<Reservation[]>(`/reservations/all?${params.toString()}`)
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      api.patch(`/reservations/${id}/status`, { status: newStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reservations'] }),
  })

  const createReservation = useMutation({
    mutationFn: (data: ReservationFormData) => api.post('/reservations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] })
      setShowForm(false)
    },
  })

  const handleReset = () => {
    setDate(today)
    setStatus('')
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reservas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión y estadísticas de reservas de mesas
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Nueva reserva</Button>
      </div>

      {/* Statistics computed from the current filtered dataset */}
      <ReservationStats reservations={reservations} />

      {/* Filters */}
      <ReservationFilters
        date={date}
        status={status}
        onDateChange={setDate}
        onStatusChange={setStatus}
        onReset={handleReset}
      />

      {/* Table */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm py-8 text-center">Cargando reservas...</div>
      ) : (
        <div className="bg-surface-1 rounded-xl border border-surface-3 p-4">
          <ReservationTable
            reservations={reservations}
            onConfirm={(id) => updateStatus.mutate({ id, newStatus: 'confirmed' })}
            onCancel={(id) => updateStatus.mutate({ id, newStatus: 'cancelled' })}
            onMarkNoShow={(id) => updateStatus.mutate({ id, newStatus: 'no_show' })}
          />
        </div>
      )}

      {showForm && (
        <ReservationFormModal
          tables={[]}   // app-admin fetches tables separately if needed
          onSubmit={(data) => createReservation.mutateAsync(data)}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **6.5** Add reservations link to app-admin navigation

In `apps/app-admin/src/components/Sidebar.tsx` (or wherever nav links live), add:

```typescript
{ href: '/reservations', label: 'Reservas', icon: '📅' }
```

- [ ] **6.6** Commit

```bash
git add apps/app-admin
git commit -m "feat(app-admin): add reservations management page with filters, stats, and CRUD actions"
```

---

## Task 7: Sync engine — include reservations in push/pull

**Files:**
- Modify: `apps/local-server/src/sync/push.ts`
- Modify: `apps/local-server/src/sync/pull.ts`

- [ ] **7.1** Add `reservations` to `push.ts`

In the push sync loop where unsynced records are pushed to Supabase, add the reservations table. Reservations do not have a `synced` column (they are created locally but should be mirrored). Implement as an upsert on `id`:

```typescript
// In pushToSupabase():
const localReservations = await prisma.reservation.findMany({
  where: { venueId: VENUE_ID },
  orderBy: { createdAt: 'asc' },
  take: 500,
})

if (localReservations.length > 0) {
  await supabase
    .from('reservations')
    .upsert(
      localReservations.map((r) => ({
        id: r.id,
        venue_id: r.venueId,
        table_id: r.tableId,
        customer_name: r.customerName,
        customer_phone: r.customerPhone,
        date: r.date,
        time: r.time,
        party_size: r.partySize,
        status: r.status,
        notes: r.notes,
        created_by: r.createdBy,
        created_at: r.createdAt,
      })),
      { onConflict: 'id' }
    )
}
```

- [ ] **7.2** Add `reservations` to `pull.ts`

On pull, fetch reservations modified in the cloud (e.g. confirmed via app-admin on web) and upsert locally:

```typescript
// In pullFromSupabase():
const { data: cloudReservations } = await supabase
  .from('reservations')
  .select('*')
  .eq('venue_id', VENUE_ID)
  .gte('created_at', lastSyncAt.toISOString())

if (cloudReservations?.length) {
  for (const r of cloudReservations) {
    await prisma.reservation.upsert({
      where: { id: r.id },
      update: {
        status: r.status,
        tableId: r.table_id,
        notes: r.notes,
      },
      create: {
        id: r.id,
        venueId: r.venue_id,
        tableId: r.table_id,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        date: new Date(r.date),
        time: new Date(`1970-01-01T${r.time}Z`),
        partySize: r.party_size,
        status: r.status,
        notes: r.notes,
        createdBy: r.created_by,
        createdAt: new Date(r.created_at),
      },
    })
  }
}
```

- [ ] **7.3** Commit

```bash
git add apps/local-server/src/sync
git commit -m "feat(sync): include reservations in push/pull sync cycle"
```

---

## Task 8: Final integration and build verification

- [ ] **8.1** Run all local-server tests

```bash
cd apps/local-server && pnpm test
# Expected: All tests pass including reservation routes and cron job
```

- [ ] **8.2** Type-check all apps

```bash
cd /workspace/myway
pnpm type-check
# Expected: Zero TypeScript errors
```

- [ ] **8.3** Build all apps

```bash
pnpm build
# Expected: All packages and apps build without errors
```

- [ ] **8.4** Smoke-test the reservation endpoints manually

```bash
# Start local-server in dev mode
cd apps/local-server && pnpm dev

# In another terminal:
TOKEN="your-jwt-token"
TODAY=$(date +%Y-%m-%d)

# Create a reservation
curl -X POST http://localhost:3001/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test User","date":"'"$TODAY"'","time":"21:00","partySize":4}'
# Expected: 201 { data: { status: 'pending', ... } }

# List today's reservations
curl "http://localhost:3001/reservations?date=$TODAY" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 { data: [...] }

# Confirm it (replace ID from creation response)
curl -X PATCH http://localhost:3001/reservations/RESERVATION_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'
# Expected: 200 { data: { status: 'confirmed' } }
```

- [ ] **8.5** Final commit

```bash
git add .
git commit -m "chore(plan-10): verify build, types, and reservation smoke tests pass"
```

---

## Verification Checklist

Before marking this plan complete:

- [ ] `pnpm build` passes with zero TypeScript errors across all apps
- [ ] `pnpm test` — all tests green (reservation routes, status transitions, cron job)
- [ ] `POST /reservations` creates a reservation with status `pending`
- [ ] `PATCH /reservations/:id/status` with `status: seated` creates a `table_session` and returns `tableSessionId`
- [ ] Invalid status transitions (e.g. `seated → pending`) return HTTP 400
- [ ] Cron job runs every minute and emits `reservation_upcoming` for reservations within 15 min
- [ ] app-pos salon page shows `ReservationsSidebar` with today's reservations grouped by hour
- [ ] Reserved tables show clock icon overlay in `SalonLayout`
- [ ] `ReservationUpcomingToast` appears in app-pos when `reservation_upcoming` socket event fires
- [ ] "Sentar clientes" button navigates to the new table session
- [ ] app-admin `/reservations` page loads with filters, statistics, and full table
- [ ] No-show rate and popular time slot stats compute correctly from data
- [ ] Reservations are pushed to Supabase in the 15-min sync cycle
- [ ] Reservations created or updated in cloud are pulled back to SQLite on sync

---

*Next plan: All plans complete — system is fully implemented.*
