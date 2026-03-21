# My Way — Plan 8: Employee Management

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete employee management system in `app-admin`: staff CRUD with role-based access control, shift tracking across all staff apps, employee performance analytics, salary contracts, advances, salary payments, and a balance/liquidation PDF export.

**Architecture:** `app-admin` is the primary surface — all management views live under `/employees`. Shift open/close buttons are injected into the root layouts of `app-waiter`, `app-pos`, `app-kitchen`, and `app-bar`. All data is stored in Supabase (cloud-only tables: `staff_shifts`, `staff_contracts`, `staff_advances`, `staff_payments`). Performance stats are computed via aggregation queries against `orders` and `order_items`. PDF export uses `@react-pdf/renderer`. Date calculations use `date-fns`.

**Tech Stack:** Next.js 15 App Router, Supabase (cloud), TanStack Query v5, @myway/ui, @myway/types, @myway/auth, @react-pdf/renderer, date-fns, Vitest

**Depends on:** Plan 6 (app-admin shell + auth guard — superadmin/admin roles already enforced at layout level)

---

## File Map

```
apps/
├── app-admin/
│   └── src/
│       ├── app/
│       │   └── employees/
│       │       ├── layout.tsx                        # Guard: superadmin | admin only
│       │       ├── page.tsx                          # Staff list (redirect to /employees/staff)
│       │       ├── staff/
│       │       │   ├── page.tsx                      # Staff list table
│       │       │   └── [staffId]/
│       │       │       ├── page.tsx                  # Employee detail hub (tabs)
│       │       │       ├── shifts/page.tsx            # Shift history for employee
│       │       │       ├── performance/page.tsx       # Performance stats for employee
│       │       │       ├── salary/page.tsx            # Salary contract management
│       │       │       ├── advances/page.tsx          # Advances list + register
│       │       │       ├── payments/page.tsx          # Salary payments list + register
│       │       │       └── balance/page.tsx           # Balance summary + PDF export
│       │
│       ├── components/
│       │   └── employees/
│       │       ├── StaffTable.tsx                    # Staff list with role badge, status, last login
│       │       ├── CreateStaffDialog.tsx             # Dialog: name, email, role, initial PIN
│       │       ├── EditStaffDialog.tsx               # Dialog: name, role, is_active
│       │       ├── ResetPinDialog.tsx                # Dialog: enter new PIN for staff member
│       │       ├── DeactivateStaffDialog.tsx         # Confirm soft-delete dialog
│       │       ├── EmployeeDetailTabs.tsx            # Tab navigation for [staffId] hub
│       │       ├── ShiftHistoryTable.tsx             # Table: started_at, ended_at, duration_minutes
│       │       ├── PerformanceStats.tsx              # Cards + table: tables, items, sales, ticket, cancels
│       │       ├── TopPerformersRanking.tsx          # Ranked list of top employees
│       │       ├── SalaryContractCard.tsx            # Current contract display
│       │       ├── SetContractDialog.tsx             # Dialog: salary_type, amount, effective_from
│       │       ├── AdvancesTable.tsx                 # Advances list
│       │       ├── RegisterAdvanceDialog.tsx         # Dialog: amount, date, reason, authorized_by
│       │       ├── PaymentsTable.tsx                 # Salary payments list
│       │       ├── RegisterPaymentDialog.tsx         # Dialog: amount, period_from, period_to, method
│       │       ├── BalanceSummary.tsx                # Devengado - adelantos - pagos = saldo
│       │       └── LiquidacionPDF.tsx                # react-pdf Document component
│       │
│       ├── hooks/
│       │   └── employees/
│       │       ├── useStaff.ts                       # TanStack Query: list + mutations
│       │       ├── useShifts.ts                      # TanStack Query: shifts per employee + period
│       │       ├── usePerformance.ts                 # TanStack Query: aggregated stats
│       │       ├── useSalaryContract.ts              # TanStack Query: current contract
│       │       ├── useAdvances.ts                    # TanStack Query: advances per employee
│       │       ├── useSalaryPayments.ts              # TanStack Query: payments per employee
│       │       └── useEmployeeBalance.ts             # Derived: devengado, advances, payments, saldo
│       │
│       └── lib/
│           └── employees/
│               ├── staff.actions.ts                  # Server Actions: createStaff, updateStaff, deactivateStaff, resetPin
│               ├── shifts.actions.ts                 # Server Actions: getShifts, getShiftsSummary
│               ├── salary.actions.ts                 # Server Actions: setContract, registerAdvance, registerPayment
│               ├── performance.queries.ts            # Supabase aggregation queries for stats
│               ├── balance.utils.ts                  # Pure functions: computeDevengado, computeSaldo
│               └── pdf.utils.ts                      # generateLiquidacionPDF (blob)
│
├── app-waiter/
│   └── src/app/
│       └── layout.tsx                                # Add ShiftBanner (open/close shift button)
│
├── app-pos/
│   └── src/app/
│       └── layout.tsx                                # Add ShiftBanner
│
├── app-kitchen/
│   └── src/app/
│       └── layout.tsx                                # Add ShiftBanner
│
├── app-bar/
│   └── src/app/
│       └── layout.tsx                                # Add ShiftBanner
│
└── packages/
    ├── types/
    │   └── src/
    │       └── employee.ts                           # New: StaffContract, StaffAdvance, StaffPayment, StaffShift, EmployeePerformance, EmployeeBalance types
    └── ui/
        └── src/components/
            └── shift-banner.tsx                      # Shared ShiftBanner component (used in all 4 apps)

supabase/
└── migrations/
    └── 20260321000800_employee_rls.sql               # RLS policies for employee tables + indexes
```

---

## Task 1: Extend `@myway/types` with employee types

**Files:**
- Create: `packages/types/src/employee.ts`
- Edit: `packages/types/src/index.ts`

- [ ] **1.1** Write test: verify all employee types can be imported from `@myway/types`
- [ ] **1.2** Run test — verify FAIL
- [ ] **1.3** Create `packages/types/src/employee.ts`

```typescript
export type SalaryType = 'monthly' | 'hourly'
export type SalaryPaymentMethod = 'cash' | 'transfer' | 'mp'

export interface StaffContract {
  id: string
  staffId: string
  salaryType: SalaryType
  salaryAmount: number
  currency: string
  effectiveFrom: string  // ISO date string
  effectiveTo: string | null
  createdBy: string | null
  createdAt: Date
}

export interface StaffAdvance {
  id: string
  staffId: string
  venueId: string
  amount: number
  reason: string | null
  date: string  // ISO date string
  authorizedBy: string | null
  authorizedByName?: string  // joined
  createdAt: Date
}

export interface StaffPayment {
  id: string
  staffId: string
  venueId: string
  amount: number
  periodFrom: string  // ISO date string
  periodTo: string    // ISO date string
  paymentMethod: SalaryPaymentMethod
  notes: string | null
  paidBy: string | null
  paidByName?: string  // joined
  createdAt: Date
}

export interface StaffShift {
  id: string
  staffId: string
  venueId: string
  startedAt: Date
  endedAt: Date | null
  durationMinutes: number | null
  notes: string | null
}

export interface EmployeePerformance {
  staffId: string
  staffName: string
  role: string
  tablesServed: number
  itemsDelivered: number
  totalSales: number
  averageTicket: number
  cancellations: number
  totalDiscounts: number
}

export interface EmployeeBalance {
  staffId: string
  staffName: string
  periodFrom: string
  periodTo: string
  salaryType: SalaryType
  salaryAmount: number
  hoursWorked: number       // derived from shifts
  devengado: number         // computed salary for the period
  totalAdvances: number     // sum of advances in period
  totalPayments: number     // sum of payments in period
  saldoPendiente: number    // devengado - totalAdvances - totalPayments
}
```

- [ ] **1.4** Edit `packages/types/src/index.ts` — add `export * from './employee'`
- [ ] **1.5** Run test — verify PASS
- [ ] **1.6** Commit: `feat(types): add employee management types`

---

## Task 2: Supabase RLS + indexes for employee tables

**Files:**
- Create: `supabase/migrations/20260321000800_employee_rls.sql`

All four employee tables (`staff_contracts`, `staff_advances`, `staff_payments`, `staff_shifts`) exist in the initial migration (Plan 0). This task adds RLS policies and performance indexes.

- [ ] **2.1** Create `supabase/migrations/20260321000800_employee_rls.sql`

```sql
-- Enable RLS on employee tables (if not already done)
ALTER TABLE staff_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_advances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_shifts    ENABLE ROW LEVEL SECURITY;

-- Only service role (used by app-admin server actions via service key) can write.
-- Staff can read their own shifts (used by shift banner in staff apps).

CREATE POLICY "staff_own_shifts_read" ON staff_shifts
  FOR SELECT USING (
    staff_id::text = auth.uid()::text
  );

CREATE POLICY "service_role_shifts_all" ON staff_shifts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_contracts_all" ON staff_contracts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_advances_all" ON staff_advances
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_payments_all" ON staff_payments
  FOR ALL USING (auth.role() = 'service_role');

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff     ON staff_shifts(staff_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_venue     ON staff_shifts(venue_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_contracts_staff  ON staff_contracts(staff_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_staff_advances_staff   ON staff_advances(staff_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_staff_payments_staff   ON staff_payments(staff_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_by      ON orders(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_status ON order_items(order_id, status);
```

- [ ] **2.2** Apply migration:

```bash
supabase db push
```

- [ ] **2.3** Commit: `feat(db): add RLS policies and indexes for employee management tables`

---

## Task 3: `@myway/ui` — shared `ShiftBanner` component

**Files:**
- Create: `packages/ui/src/components/shift-banner.tsx`
- Edit: `packages/ui/src/index.ts`

The `ShiftBanner` renders a persistent bottom bar in staff apps showing: current shift status, elapsed time (if open), and an "Iniciar turno" / "Finalizar turno" button. It is self-contained and calls the Supabase client directly from the browser.

- [ ] **3.1** Write test: `ShiftBanner` renders "Iniciar turno" when no active shift; renders "Finalizar turno" + elapsed time when shift is open
- [ ] **3.2** Run test — verify FAIL
- [ ] **3.3** Create `packages/ui/src/components/shift-banner.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { formatDuration, intervalToDuration } from 'date-fns'

interface ShiftBannerProps {
  staffId: string
  venueId: string
  supabaseUrl: string
  supabaseAnonKey: string
}

// Renders at the bottom of every staff app layout.
// Calls Supabase directly using the anon key + staff JWT (set in cookie by auth flow).
// Uses staff_own_shifts_read RLS policy for SELECT.
// Uses a /api/shifts route (implemented per-app) for INSERT/UPDATE to avoid exposing service key.
export function ShiftBanner({ staffId, venueId, supabaseUrl, supabaseAnonKey }: ShiftBannerProps) {
  const [activeShift, setActiveShift] = useState<{ id: string; startedAt: Date } | null>(null)
  const [elapsed, setElapsed] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Load active (open) shift on mount
  useEffect(() => {
    async function loadShift() {
      const { data } = await supabase
        .from('staff_shifts')
        .select('id, started_at')
        .eq('staff_id', staffId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setActiveShift({ id: data.id, startedAt: new Date(data.started_at) })
      }
    }
    loadShift()
  }, [staffId])

  // Tick elapsed time every minute
  useEffect(() => {
    if (!activeShift) { setElapsed(''); return }
    function tick() {
      const dur = intervalToDuration({ start: activeShift!.startedAt, end: new Date() })
      setElapsed(formatDuration(dur, { format: ['hours', 'minutes'] }))
    }
    tick()
    const interval = setInterval(tick, 60_000)
    return () => clearInterval(interval)
  }, [activeShift])

  async function handleStart() {
    setLoading(true)
    const res = await fetch('/api/shifts/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, venueId }),
    })
    const data = await res.json()
    if (data.shift) {
      setActiveShift({ id: data.shift.id, startedAt: new Date(data.shift.started_at) })
    }
    setLoading(false)
  }

  async function handleEnd() {
    if (!activeShift) return
    setLoading(true)
    await fetch('/api/shifts/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftId: activeShift.id }),
    })
    setActiveShift(null)
    setLoading(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between
                    bg-surface-1 border-t border-surface-3 px-4 py-2 text-sm">
      {activeShift ? (
        <>
          <span className="text-green-400 font-medium">Turno activo · {elapsed}</span>
          <button
            onClick={handleEnd}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md font-medium disabled:opacity-50"
          >
            Finalizar turno
          </button>
        </>
      ) : (
        <>
          <span className="text-surface-4">Sin turno activo</span>
          <button
            onClick={handleStart}
            disabled={loading}
            className="bg-brand-500 hover:bg-brand-600 text-black px-4 py-1.5 rounded-md font-medium disabled:opacity-50"
          >
            Iniciar turno
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **3.4** Export from `packages/ui/src/index.ts`: `export { ShiftBanner } from './components/shift-banner'`
- [ ] **3.5** Run test — verify PASS
- [ ] **3.6** Commit: `feat(ui): add ShiftBanner component for shift open/close in staff apps`

---

## Task 4: Shift API routes in each staff app

Each staff app (`app-waiter`, `app-pos`, `app-kitchen`, `app-bar`) needs two route handlers to open and close shifts. These use the Supabase service key (never exposed to the browser) to bypass RLS for writes.

**Files (repeat pattern in each of the 4 apps):**
- Create: `apps/<app>/src/app/api/shifts/open/route.ts`
- Create: `apps/<app>/src/app/api/shifts/close/route.ts`

- [ ] **4.1** Write tests for `app-waiter` shift API:
  - POST `/api/shifts/open` creates a `staff_shifts` row with `ended_at = null`
  - POST `/api/shifts/open` returns 409 if the staff member already has an open shift (`ended_at IS NULL`)
  - POST `/api/shifts/close` sets `ended_at` and computes `duration_minutes`
- [ ] **4.2** Run tests — verify FAIL
- [ ] **4.3** Create `apps/app-waiter/src/app/api/shifts/open/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { staffId, venueId } = await req.json()
  if (!staffId || !venueId) {
    return NextResponse.json({ error: 'staffId and venueId required' }, { status: 400 })
  }
  // Guard: only one open shift per staff member
  const { data: existing } = await supabase
    .from('staff_shifts')
    .select('id')
    .eq('staff_id', staffId)
    .is('ended_at', null)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'Staff member already has an open shift', shiftId: existing.id }, { status: 409 })
  }

  const { data: shift, error } = await supabase
    .from('staff_shifts')
    .insert({ staff_id: staffId, venue_id: venueId, started_at: new Date().toISOString() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shift })
}
```

- [ ] **4.4** Create `apps/app-waiter/src/app/api/shifts/close/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { differenceInMinutes } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { shiftId } = await req.json()
  if (!shiftId) return NextResponse.json({ error: 'shiftId required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('staff_shifts')
    .select('started_at')
    .eq('id', shiftId)
    .single()

  if (!existing) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })

  const endedAt = new Date()
  const durationMinutes = differenceInMinutes(endedAt, new Date(existing.started_at))

  const { data: shift, error } = await supabase
    .from('staff_shifts')
    .update({ ended_at: endedAt.toISOString(), duration_minutes: durationMinutes })
    .eq('id', shiftId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shift })
}
```

- [ ] **4.5** Replicate `open/route.ts` and `close/route.ts` in `app-pos`, `app-kitchen`, `app-bar` (identical logic, same env vars)
- [ ] **4.6** Run tests — verify PASS
- [ ] **4.7** Commit: `feat(apps): add shift open/close API routes to all 4 staff apps`

---

## Task 5: Inject `ShiftBanner` into staff app layouts

**Files:**
- Edit: `apps/app-waiter/src/app/layout.tsx`
- Edit: `apps/app-pos/src/app/layout.tsx`
- Edit: `apps/app-kitchen/src/app/layout.tsx`
- Edit: `apps/app-bar/src/app/layout.tsx`

Each app already has a root layout that renders after PIN login. The `ShiftBanner` must be injected at the bottom of the authenticated layout (not the login page).

- [ ] **5.1** In each authenticated layout (e.g. `apps/app-waiter/src/app/(auth)/layout.tsx` or equivalent auth-guarded layout), import and render `ShiftBanner`:

```typescript
import { ShiftBanner } from '@myway/ui'

// Inside the layout JSX, after {children}:
<ShiftBanner
  staffId={session.staff.id}
  venueId={session.staff.venueId}
  supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
  supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
/>
```

- [ ] **5.2** Add `pb-14` padding-bottom to the main content area in each layout to prevent ShiftBanner from overlapping content
- [ ] **5.3** Verify ShiftBanner does NOT render on `/login` pages
- [ ] **5.4** Commit: `feat(apps): inject ShiftBanner into all staff app authenticated layouts`

---

## Task 6: `app-admin` — employees layout + authorization guard

**Files:**
- Create: `apps/app-admin/src/app/employees/layout.tsx`

- [ ] **6.1** Write test: accessing `/employees` as a `waiter` role redirects to `/unauthorized`
- [ ] **6.2** Write test: accessing `/employees` as `admin` returns 200
- [ ] **6.3** Run tests — verify FAIL
- [ ] **6.4** Create `apps/app-admin/src/app/employees/layout.tsx`

```typescript
import { redirect } from 'next/navigation'
import { createServerClient } from '@myway/auth'
import { cookies } from 'next/headers'

export default async function EmployeesLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient(cookies())
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: staff } = await supabase
    .from('staff')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!staff || !['superadmin', 'admin'].includes(staff.role)) {
    redirect('/unauthorized')
  }

  return <>{children}</>
}
```

- [ ] **6.5** Run tests — verify PASS
- [ ] **6.6** Commit: `feat(app-admin): add employees route with superadmin/admin authorization guard`

---

## Task 7: Staff list page + CRUD

**Files:**
- Create: `apps/app-admin/src/app/employees/staff/page.tsx`
- Create: `apps/app-admin/src/components/employees/StaffTable.tsx`
- Create: `apps/app-admin/src/components/employees/CreateStaffDialog.tsx`
- Create: `apps/app-admin/src/components/employees/EditStaffDialog.tsx`
- Create: `apps/app-admin/src/components/employees/ResetPinDialog.tsx`
- Create: `apps/app-admin/src/components/employees/DeactivateStaffDialog.tsx`
- Create: `apps/app-admin/src/hooks/employees/useStaff.ts`
- Create: `apps/app-admin/src/lib/employees/staff.actions.ts`

### Role permission rules (CRITICAL — enforce in all mutations):
- `superadmin` can create/edit/deactivate any role including `admin`
- `admin` can create/edit/deactivate roles: `cashier`, `waiter`, `kitchen`, `bar`
- `admin` CANNOT create, edit, or deactivate another `admin` or `superadmin`
- No one can edit themselves via this panel (use profile settings)

- [ ] **7.1** Write tests for `staff.actions.ts`:
  - `createStaff`: admin cannot create another admin → throws `FORBIDDEN`
  - `createStaff`: superadmin can create admin → succeeds
  - `updateStaff`: admin cannot edit an existing admin → throws `FORBIDDEN`
  - `deactivateStaff`: admin cannot deactivate a superadmin → throws `FORBIDDEN`
  - `resetPin`: validates PIN is 4–6 digits, hashes with bcrypt
- [ ] **7.2** Run tests — verify FAIL
- [ ] **7.3** Create `apps/app-admin/src/lib/employees/staff.actions.ts`

```typescript
'use server'

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_MANAGEABLE_ROLES = ['cashier', 'waiter', 'kitchen', 'bar']

function assertCanManage(actorRole: string, targetRole: string) {
  if (actorRole === 'superadmin') return  // superadmin can do anything
  if (actorRole === 'admin' && ADMIN_MANAGEABLE_ROLES.includes(targetRole)) return
  throw new Error('FORBIDDEN')
}

export async function createStaff(input: {
  actorRole: string
  venueId: string
  name: string
  email: string
  role: string
  pin: string
}) {
  assertCanManage(input.actorRole, input.role)

  const pinHash = await bcrypt.hash(input.pin, 10)

  const { data, error } = await supabase
    .from('staff')
    .insert({
      venue_id: input.venueId,
      name: input.name,
      email: input.email,
      role: input.role,
      pin_hash: pinHash,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/employees/staff')
  return data
}

export async function updateStaff(input: {
  actorRole: string
  staffId: string
  name?: string
  role?: string
  isActive?: boolean
}) {
  // Fetch current role to enforce permissions
  const { data: existing } = await supabase
    .from('staff')
    .select('role')
    .eq('id', input.staffId)
    .single()

  if (!existing) throw new Error('Staff not found')
  assertCanManage(input.actorRole, existing.role)
  if (input.role) assertCanManage(input.actorRole, input.role)  // also check new role

  const { data, error } = await supabase
    .from('staff')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
    })
    .eq('id', input.staffId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/employees/staff')
  return data
}

export async function deactivateStaff(input: { actorRole: string; staffId: string }) {
  return updateStaff({ ...input, isActive: false })
}

export async function resetPin(input: {
  actorRole: string
  staffId: string
  newPin: string
}) {
  if (!/^\d{4,6}$/.test(input.newPin)) throw new Error('PIN must be 4-6 digits')

  const { data: existing } = await supabase
    .from('staff')
    .select('role')
    .eq('id', input.staffId)
    .single()

  if (!existing) throw new Error('Staff not found')
  assertCanManage(input.actorRole, existing.role)

  const pinHash = await bcrypt.hash(input.newPin, 10)

  const { error } = await supabase
    .from('staff')
    .update({ pin_hash: pinHash, failed_pin_attempts: 0, locked_until: null })
    .eq('id', input.staffId)

  if (error) throw new Error(error.message)
  revalidatePath('/employees/staff')
}
```

- [ ] **7.4** Create `apps/app-admin/src/hooks/employees/useStaff.ts`

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@myway/auth'

export function useStaffList(venueId: string, actorRole: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['staff', venueId, actorRole],
    queryFn: async () => {
      let query = supabase
        .from('staff')
        .select('id, name, email, role, is_active, last_login_at, created_at')
        .eq('venue_id', venueId)
        .order('name')

      // Admins must not see admin/superadmin accounts (privilege escalation guard)
      // Only superadmins can see all roles
      if (actorRole === 'admin') {
        query = query.not('role', 'in', '("admin","superadmin")')
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
```

- [ ] **7.5** Create `apps/app-admin/src/components/employees/StaffTable.tsx`
  - Renders a table with columns: Name, Email, Role (badge), Status (Active/Inactive badge), Last Login, Actions
  - Actions menu per row: Edit, Reset PIN, Deactivate (conditionally shown based on actor role)
  - "Nuevo empleado" button opens `CreateStaffDialog`
  - Filter input for name/email search (client-side)
- [ ] **7.6** Create `apps/app-admin/src/components/employees/CreateStaffDialog.tsx`
  - Fields: Name (text), Email (email), Role (select, options filtered by actor role), PIN (number, 4–6 digits), Confirm PIN
  - Validates PIN match before submitting
  - Calls `createStaff` server action on submit
- [ ] **7.7** Create `apps/app-admin/src/components/employees/EditStaffDialog.tsx`
  - Pre-fills current name, role, is_active
  - Role select options filtered by actor role
  - Calls `updateStaff` server action
- [ ] **7.8** Create `apps/app-admin/src/components/employees/ResetPinDialog.tsx`
  - Fields: New PIN (4–6 digits), Confirm PIN
  - Calls `resetPin` server action
- [ ] **7.9** Create `apps/app-admin/src/components/employees/DeactivateStaffDialog.tsx`
  - Confirmation dialog with staff name
  - Calls `deactivateStaff` server action
- [ ] **7.10** Create `apps/app-admin/src/app/employees/staff/page.tsx` — Server Component that renders `StaffTable`
- [ ] **7.11** Run tests — verify PASS
- [ ] **7.12** Commit: `feat(app-admin/employees): staff list with create, edit, deactivate, reset PIN`

---

## Task 8: Employee detail hub + shift history

**Files:**
- Create: `apps/app-admin/src/app/employees/staff/[staffId]/page.tsx`
- Create: `apps/app-admin/src/app/employees/staff/[staffId]/shifts/page.tsx`
- Create: `apps/app-admin/src/components/employees/EmployeeDetailTabs.tsx`
- Create: `apps/app-admin/src/components/employees/ShiftHistoryTable.tsx`
- Create: `apps/app-admin/src/hooks/employees/useShifts.ts`
- Create: `apps/app-admin/src/lib/employees/shifts.actions.ts`

- [ ] **8.1** Write tests for `shifts.actions.ts`:
  - `getShifts`: returns shifts for a staffId filtered by date range, ordered by `started_at DESC`
  - `getShiftsSummary`: returns total `duration_minutes` for a date range, correctly handles null `ended_at` (open shifts excluded from summary or marked separately)
- [ ] **8.2** Run tests — verify FAIL
- [ ] **8.3** Create `apps/app-admin/src/lib/employees/shifts.actions.ts`

```typescript
'use server'

import { createClient } from '@supabase/supabase-js'
import { startOfDay, endOfDay } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getShifts(staffId: string, from: Date, to: Date) {
  const { data, error } = await supabase
    .from('staff_shifts')
    .select('*')
    .eq('staff_id', staffId)
    .gte('started_at', startOfDay(from).toISOString())
    .lte('started_at', endOfDay(to).toISOString())
    .order('started_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getShiftsSummary(staffId: string, from: Date, to: Date) {
  const shifts = await getShifts(staffId, from, to)
  const completedShifts = shifts.filter(s => s.duration_minutes !== null)
  const totalMinutes = completedShifts.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0)
  return {
    totalShifts: shifts.length,
    completedShifts: completedShifts.length,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    hasOpenShift: shifts.some(s => s.ended_at === null),
  }
}
```

- [ ] **8.4** Create `apps/app-admin/src/hooks/employees/useShifts.ts`

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { getShifts, getShiftsSummary } from '@/lib/employees/shifts.actions'

export function useShifts(staffId: string, from: Date, to: Date) {
  return useQuery({
    queryKey: ['shifts', staffId, from.toISOString(), to.toISOString()],
    queryFn: () => getShifts(staffId, from, to),
  })
}

export function useShiftsSummary(staffId: string, from: Date, to: Date) {
  return useQuery({
    queryKey: ['shifts-summary', staffId, from.toISOString(), to.toISOString()],
    queryFn: () => getShiftsSummary(staffId, from, to),
  })
}
```

- [ ] **8.5** Create `apps/app-admin/src/components/employees/EmployeeDetailTabs.tsx`
  - Tab links: Turnos, Rendimiento, Contrato, Adelantos, Pagos, Liquidación
  - Shows staff name + role badge at the top
- [ ] **8.6** Create `apps/app-admin/src/components/employees/ShiftHistoryTable.tsx`
  - Columns: Date, Start, End, Duration (h:mm), Status (Open/Complete)
  - Date range filter (DateRangePicker using `@myway/ui`)
  - Summary row at bottom: total hours worked in period
- [ ] **8.7** Create page stubs: `[staffId]/page.tsx` (renders `EmployeeDetailTabs` + redirects to `/shifts`), `[staffId]/shifts/page.tsx` (renders `ShiftHistoryTable`)
- [ ] **8.8** Run tests — verify PASS
- [ ] **8.9** Commit: `feat(app-admin/employees): employee detail hub + shift history view`

---

## Task 9: Employee performance

**Files:**
- Create: `apps/app-admin/src/app/employees/staff/[staffId]/performance/page.tsx`
- Create: `apps/app-admin/src/components/employees/PerformanceStats.tsx`
- Create: `apps/app-admin/src/components/employees/TopPerformersRanking.tsx`
- Create: `apps/app-admin/src/hooks/employees/usePerformance.ts`
- Create: `apps/app-admin/src/lib/employees/performance.queries.ts`

Performance stats are computed against `orders` and `order_items` tables. The `orders.created_by` field links an order to the staff member who created it.

- [ ] **9.1** Write tests for `performance.queries.ts`:
  - `getEmployeePerformance`: for a given staffId + date range, returns correct `tablesServed`, `totalSales`, `averageTicket`, `cancellations`, `totalDiscounts`
  - `getAllEmployeesPerformance`: returns ranked list for the venue, ordered by `totalSales DESC`
  - Test with mock Supabase data: 3 staff members, various orders
- [ ] **9.2** Run tests — verify FAIL
- [ ] **9.3** Create `apps/app-admin/src/lib/employees/performance.queries.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { startOfDay, endOfDay } from 'date-fns'
import type { EmployeePerformance } from '@myway/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getEmployeePerformance(
  staffId: string,
  from: Date,
  to: Date
): Promise<Omit<EmployeePerformance, 'staffName' | 'role'>> {
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, total, discount_amount, status,
      order_items(id, status)
    `)
    .eq('created_by', staffId)
    .gte('created_at', startOfDay(from).toISOString())
    .lte('created_at', endOfDay(to).toISOString())

  if (!orders) return {
    staffId, tablesServed: 0, itemsDelivered: 0,
    totalSales: 0, averageTicket: 0, cancellations: 0, totalDiscounts: 0
  }

  const activeOrders = orders.filter(o => o.status !== 'cancelled')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')
  const totalSales = activeOrders.reduce((sum, o) => sum + Number(o.total), 0)
  const itemsDelivered = activeOrders.flatMap(o => o.order_items)
    .filter(i => i.status === 'delivered').length
  const totalDiscounts = activeOrders.reduce((sum, o) => sum + Number(o.discount_amount), 0)

  return {
    staffId,
    tablesServed: activeOrders.length,
    itemsDelivered,
    totalSales,
    averageTicket: activeOrders.length > 0 ? totalSales / activeOrders.length : 0,
    cancellations: cancelledOrders.length,
    totalDiscounts,
  }
}

export async function getAllEmployeesPerformance(
  venueId: string,
  from: Date,
  to: Date
): Promise<EmployeePerformance[]> {
  const { data: staffList } = await supabase
    .from('staff')
    .select('id, name, role')
    .eq('venue_id', venueId)
    .eq('is_active', true)

  if (!staffList) return []

  const results = await Promise.all(
    staffList.map(async (s) => {
      const perf = await getEmployeePerformance(s.id, from, to)
      return { ...perf, staffName: s.name, role: s.role }
    })
  )

  return results.sort((a, b) => b.totalSales - a.totalSales)
}
```

- [ ] **9.4** Create `apps/app-admin/src/hooks/employees/usePerformance.ts` — wraps `getEmployeePerformance` and `getAllEmployeesPerformance` in TanStack Query hooks with date range params
- [ ] **9.5** Create `apps/app-admin/src/components/employees/PerformanceStats.tsx`
  - Four stat cards: Mesas atendidas, Items entregados, Ventas totales, Ticket promedio
  - Secondary row: Cancelaciones, Descuentos otorgados
  - Date range filter at the top
- [ ] **9.6** Create `apps/app-admin/src/components/employees/TopPerformersRanking.tsx`
  - Shown on a venue-level overview (can be embedded in `/employees/staff` page)
  - Ranked list with rank number, name, role, total sales, tables served
  - Configurable date range
- [ ] **9.7** Create `apps/app-admin/src/app/employees/staff/[staffId]/performance/page.tsx`
- [ ] **9.8** Run tests — verify PASS
- [ ] **9.9** Commit: `feat(app-admin/employees): employee performance stats + top performers ranking`

---

## Task 10: Salary contract management

**Files:**
- Create: `apps/app-admin/src/app/employees/staff/[staffId]/salary/page.tsx`
- Create: `apps/app-admin/src/components/employees/SalaryContractCard.tsx`
- Create: `apps/app-admin/src/components/employees/SetContractDialog.tsx`
- Create: `apps/app-admin/src/hooks/employees/useSalaryContract.ts`
- Add to: `apps/app-admin/src/lib/employees/salary.actions.ts`

Business rule: creating a new contract automatically sets `effective_to` on the previous active contract (the day before `effective_from` of the new contract).

- [ ] **10.1** Write tests for salary contract actions:
  - `setContract`: creates new contract; if a previous contract exists with `effective_to = null`, sets its `effective_to` to `effective_from - 1 day`
  - `getCurrentContract`: returns the contract where `effective_to IS NULL` (or latest by `effective_from`)
- [ ] **10.2** Run tests — verify FAIL
- [ ] **10.3** Create `apps/app-admin/src/lib/employees/salary.actions.ts` (initial — salary contract section):

```typescript
'use server'

import { createClient } from '@supabase/supabase-js'
import { subDays, formatISO } from 'date-fns'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getCurrentContract(staffId: string) {
  const { data } = await supabase
    .from('staff_contracts')
    .select('*')
    .eq('staff_id', staffId)
    .is('effective_to', null)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single()
  return data
}

export async function setContract(input: {
  actorId: string
  staffId: string
  salaryType: 'monthly' | 'hourly'
  salaryAmount: number
  effectiveFrom: string  // ISO date
}) {
  // Close the current active contract
  const current = await getCurrentContract(input.staffId)
  if (current) {
    const closeDate = formatISO(subDays(new Date(input.effectiveFrom), 1), { representation: 'date' })
    await supabase
      .from('staff_contracts')
      .update({ effective_to: closeDate })
      .eq('id', current.id)
  }

  const { data, error } = await supabase
    .from('staff_contracts')
    .insert({
      staff_id: input.staffId,
      salary_type: input.salaryType,
      salary_amount: input.salaryAmount,
      effective_from: input.effectiveFrom,
      created_by: input.actorId,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/employees/staff/${input.staffId}/salary`)
  return data
}
```

- [ ] **10.4** Create `apps/app-admin/src/hooks/employees/useSalaryContract.ts`
- [ ] **10.5** Create `apps/app-admin/src/components/employees/SalaryContractCard.tsx`
  - Shows: salary type, amount, currency, effective from, contract history (collapsible)
  - "Actualizar contrato" button opens `SetContractDialog`
  - Shows "Sin contrato" state when no contract exists
- [ ] **10.6** Create `apps/app-admin/src/components/employees/SetContractDialog.tsx`
  - Fields: Tipo (monthly/hourly select), Monto (number), Vigencia desde (date)
  - Warning: "Esto cerrará el contrato actual" if one exists
- [ ] **10.7** Create `apps/app-admin/src/app/employees/staff/[staffId]/salary/page.tsx`
- [ ] **10.8** Run tests — verify PASS
- [ ] **10.9** Commit: `feat(app-admin/employees): salary contract management`

---

## Task 11: Advances management

**Files:**
- Create: `apps/app-admin/src/app/employees/staff/[staffId]/advances/page.tsx`
- Create: `apps/app-admin/src/components/employees/AdvancesTable.tsx`
- Create: `apps/app-admin/src/components/employees/RegisterAdvanceDialog.tsx`
- Create: `apps/app-admin/src/hooks/employees/useAdvances.ts`
- Add to: `apps/app-admin/src/lib/employees/salary.actions.ts`

- [ ] **11.1** Write tests:
  - `registerAdvance`: inserts row in `staff_advances`, validates `amount > 0`
  - `getAdvances`: returns advances for staffId filtered by date range, ordered by `date DESC`
- [ ] **11.2** Run tests — verify FAIL
- [ ] **11.3** Add to `salary.actions.ts`:

```typescript
export async function getAdvances(staffId: string, from?: Date, to?: Date) {
  let query = supabase
    .from('staff_advances')
    .select('*, authorized_by_staff:authorized_by(name)')
    .eq('staff_id', staffId)
    .order('date', { ascending: false })

  if (from) query = query.gte('date', formatISO(from, { representation: 'date' }))
  if (to)   query = query.lte('date', formatISO(to,   { representation: 'date' }))

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function registerAdvance(input: {
  actorId: string
  staffId: string
  venueId: string
  amount: number
  reason?: string
  date: string  // ISO date
}) {
  if (input.amount <= 0) throw new Error('Amount must be positive')

  const { data, error } = await supabase
    .from('staff_advances')
    .insert({
      staff_id: input.staffId,
      venue_id: input.venueId,
      amount: input.amount,
      reason: input.reason ?? null,
      date: input.date,
      authorized_by: input.actorId,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/employees/staff/${input.staffId}/advances`)
  return data
}
```

- [ ] **11.4** Create `apps/app-admin/src/hooks/employees/useAdvances.ts`
- [ ] **11.5** Create `apps/app-admin/src/components/employees/AdvancesTable.tsx`
  - Columns: Date, Amount, Reason, Authorized by
  - Date range filter
  - "Registrar adelanto" button opens `RegisterAdvanceDialog`
  - Total advances shown in footer row
- [ ] **11.6** Create `apps/app-admin/src/components/employees/RegisterAdvanceDialog.tsx`
  - Fields: Monto (number), Fecha (date, defaults today), Motivo (text, optional)
- [ ] **11.7** Create `apps/app-admin/src/app/employees/staff/[staffId]/advances/page.tsx`
- [ ] **11.8** Run tests — verify PASS
- [ ] **11.9** Commit: `feat(app-admin/employees): advances registration and history`

---

## Task 12: Salary payments management

**Files:**
- Create: `apps/app-admin/src/app/employees/staff/[staffId]/payments/page.tsx`
- Create: `apps/app-admin/src/components/employees/PaymentsTable.tsx`
- Create: `apps/app-admin/src/components/employees/RegisterPaymentDialog.tsx`
- Create: `apps/app-admin/src/hooks/employees/useSalaryPayments.ts`
- Add to: `apps/app-admin/src/lib/employees/salary.actions.ts`

- [ ] **12.1** Write tests:
  - `registerPayment`: inserts row in `staff_payments`, validates `amount > 0` and `period_from <= period_to`
  - `getPayments`: returns payments for staffId ordered by `created_at DESC`
- [ ] **12.2** Run tests — verify FAIL
- [ ] **12.3** Add to `salary.actions.ts`:

```typescript
export async function getPayments(staffId: string) {
  const { data, error } = await supabase
    .from('staff_payments')
    .select('*, paid_by_staff:paid_by(name)')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function registerPayment(input: {
  actorId: string
  staffId: string
  venueId: string
  amount: number
  periodFrom: string
  periodTo: string
  paymentMethod: 'cash' | 'transfer' | 'mp'
  notes?: string
}) {
  if (input.amount <= 0) throw new Error('Amount must be positive')
  if (input.periodFrom > input.periodTo) throw new Error('period_from must be <= period_to')

  const { data, error } = await supabase
    .from('staff_payments')
    .insert({
      staff_id: input.staffId,
      venue_id: input.venueId,
      amount: input.amount,
      period_from: input.periodFrom,
      period_to: input.periodTo,
      payment_method: input.paymentMethod,
      notes: input.notes ?? null,
      paid_by: input.actorId,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/employees/staff/${input.staffId}/payments`)
  return data
}
```

- [ ] **12.4** Create `apps/app-admin/src/hooks/employees/useSalaryPayments.ts`
- [ ] **12.5** Create `apps/app-admin/src/components/employees/PaymentsTable.tsx`
  - Columns: Date, Period (from–to), Amount, Method (badge), Notes, Paid by
  - "Registrar pago" button opens `RegisterPaymentDialog`
  - Total paid shown in footer
- [ ] **12.6** Create `apps/app-admin/src/components/employees/RegisterPaymentDialog.tsx`
  - Fields: Monto, Período desde (date), Período hasta (date), Método (cash/transfer/mp), Notas
- [ ] **12.7** Create `apps/app-admin/src/app/employees/staff/[staffId]/payments/page.tsx`
- [ ] **12.8** Run tests — verify PASS
- [ ] **12.9** Commit: `feat(app-admin/employees): salary payments registration and history`

---

## Task 13: Employee balance + saldo pendiente

**Files:**
- Create: `apps/app-admin/src/lib/employees/balance.utils.ts`
- Create: `apps/app-admin/src/hooks/employees/useEmployeeBalance.ts`
- Create: `apps/app-admin/src/components/employees/BalanceSummary.tsx`
- Create: `apps/app-admin/src/app/employees/staff/[staffId]/balance/page.tsx`

Balance formula:
- **Monthly contract**: `devengado = (salaryAmount / daysInMonth) × daysWorkedInPeriod`
- **Hourly contract**: `devengado = salaryAmount × totalHoursWorked` (from `staff_shifts.duration_minutes`)
- `saldoPendiente = devengado - totalAdvances - totalPayments`

- [ ] **13.1** Write unit tests for `balance.utils.ts`:
  - `computeDevengado`: monthly, 30-day month, 15 days worked → returns 50% of monthly salary
  - `computeDevengado`: hourly, 20 hours worked, rate $500/h → returns $10,000
  - `computeSaldo`: devengado $50,000, advances $10,000, payments $20,000 → saldo $20,000
  - `computeDevengado`: handles partial month at period boundaries correctly with `date-fns/differenceInCalendarDays`
- [ ] **13.2** Run tests — verify FAIL
- [ ] **13.3** Create `apps/app-admin/src/lib/employees/balance.utils.ts`

```typescript
import {
  differenceInCalendarDays,
  getDaysInMonth,
  parseISO,
} from 'date-fns'

export function computeDevengado(input: {
  salaryType: 'monthly' | 'hourly'
  salaryAmount: number
  periodFrom: Date
  periodTo: Date
  totalHoursWorked: number  // derived from shifts, used only for hourly
}): number {
  if (input.salaryType === 'hourly') {
    return Math.round(input.salaryAmount * input.totalHoursWorked * 100) / 100
  }

  // Monthly: pro-rate based on calendar days in the month of periodFrom
  // If period spans multiple months, use total calendar days / 30 approximation
  const daysInPeriod = differenceInCalendarDays(input.periodTo, input.periodFrom) + 1
  const daysInMonth = getDaysInMonth(input.periodFrom)
  const dailyRate = input.salaryAmount / daysInMonth
  return Math.round(dailyRate * daysInPeriod * 100) / 100
}

export function computeSaldo(
  devengado: number,
  totalAdvances: number,
  totalPayments: number
): number {
  return Math.round((devengado - totalAdvances - totalPayments) * 100) / 100
}

export function buildEmployeeBalance(input: {
  staffId: string
  staffName: string
  periodFrom: string
  periodTo: string
  salaryType: 'monthly' | 'hourly'
  salaryAmount: number
  totalHoursWorked: number
  advances: Array<{ amount: number }>
  payments: Array<{ amount: number; period_from: string; period_to: string }>
}) {
  const from = parseISO(input.periodFrom)
  const to = parseISO(input.periodTo)

  const devengado = computeDevengado({
    salaryType: input.salaryType,
    salaryAmount: input.salaryAmount,
    periodFrom: from,
    periodTo: to,
    totalHoursWorked: input.totalHoursWorked,
  })

  // Filter advances and payments within the period
  const periodAdvances = input.advances
  const periodPayments = input.payments.filter(
    p => p.period_from >= input.periodFrom && p.period_to <= input.periodTo
  )

  const totalAdvances = periodAdvances.reduce((sum, a) => sum + Number(a.amount), 0)
  const totalPayments = periodPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const saldoPendiente = computeSaldo(devengado, totalAdvances, totalPayments)

  return {
    staffId: input.staffId,
    staffName: input.staffName,
    periodFrom: input.periodFrom,
    periodTo: input.periodTo,
    salaryType: input.salaryType,
    salaryAmount: input.salaryAmount,
    totalHoursWorked: input.totalHoursWorked,
    devengado,
    totalAdvances,
    totalPayments,
    saldoPendiente,
  }
}
```

- [ ] **13.4** Create `apps/app-admin/src/hooks/employees/useEmployeeBalance.ts`
  - Combines `useShiftsSummary`, `useSalaryContract`, `useAdvances`, `useSalaryPayments`
  - Calls `buildEmployeeBalance` to produce the final balance object
- [ ] **13.5** Create `apps/app-admin/src/components/employees/BalanceSummary.tsx`
  - Period selector (date range) at top
  - Cards layout:
    - Salario devengado (green)
    - Adelantos descontados (amber)
    - Pagos realizados (blue)
    - **Saldo pendiente** (large, red if positive, green if zero/negative)
  - "Exportar liquidación PDF" button
- [ ] **13.6** Create `apps/app-admin/src/app/employees/staff/[staffId]/balance/page.tsx`
- [ ] **13.7** Run tests — verify PASS
- [ ] **13.8** Commit: `feat(app-admin/employees): employee balance calculation and summary view`

---

## Task 14: Liquidación PDF export

**Files:**
- Create: `apps/app-admin/src/components/employees/LiquidacionPDF.tsx`
- Create: `apps/app-admin/src/lib/employees/pdf.utils.ts`
- Add dependency: `@react-pdf/renderer` to `app-admin`

- [ ] **14.1** Install dependency:

```bash
cd /workspace/myway
pnpm --filter app-admin add @react-pdf/renderer
```

- [ ] **14.2** Write test: `generateLiquidacionBlob` returns a `Blob` with `type = 'application/pdf'` and size > 0
  - Note: `@react-pdf/renderer`'s `pdf().toBlob()` returns a browser `Blob`, not a `Uint8Array`. Verify with:
    ```typescript
    const blob = await generateLiquidacionBlob(mockBalance, 'My Way')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBeGreaterThan(0)
    ```
  - In Node/Vitest the global `Blob` is available from Node 18+. If the test environment doesn't support it, mock `pdf().toBlob()` to return `new Blob(['%PDF-1.4'], { type: 'application/pdf' })`
- [ ] **14.3** Run test — verify FAIL
- [ ] **14.4** Create `apps/app-admin/src/components/employees/LiquidacionPDF.tsx`

```typescript
import {
  Document, Page, Text, View, StyleSheet, Font
} from '@react-pdf/renderer'
import type { EmployeeBalance } from '@myway/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a' },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#555' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 8,
                  borderBottomWidth: 1, borderColor: '#e5e7eb', paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#555' },
  value: { fontFamily: 'Helvetica-Bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between',
              borderTopWidth: 1.5, borderColor: '#1a1a1a', paddingTop: 8, marginTop: 8 },
  totalLabel: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40,
            borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 8,
            color: '#999', fontSize: 9, textAlign: 'center' },
})

function fmt(amount: number) {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
}

function fmtDate(iso: string) {
  return format(parseISO(iso), 'dd/MM/yyyy', { locale: es })
}

interface LiquidacionPDFProps {
  balance: EmployeeBalance
  venueName: string
  generatedAt: Date
}

export function LiquidacionPDF({ balance, venueName, generatedAt }: LiquidacionPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{venueName}</Text>
          <Text style={styles.subtitle}>Liquidación de Haberes</Text>
        </View>

        {/* Employee info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Empleado</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{balance.staffName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Período</Text>
            <Text style={styles.value}>{fmtDate(balance.periodFrom)} — {fmtDate(balance.periodTo)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo de contrato</Text>
            <Text style={styles.value}>{balance.salaryType === 'monthly' ? 'Mensual' : 'Por hora'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {balance.salaryType === 'monthly' ? 'Salario mensual' : 'Tarifa por hora'}
            </Text>
            <Text style={styles.value}>{fmt(balance.salaryAmount)}</Text>
          </View>
          {balance.salaryType === 'hourly' && (
            <View style={styles.row}>
              <Text style={styles.label}>Horas trabajadas</Text>
              <Text style={styles.value}>{balance.hoursWorked.toFixed(2)} hs</Text>
            </View>
          )}
        </View>

        {/* Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglose</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Salario devengado</Text>
            <Text style={styles.value}>{fmt(balance.devengado)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Menos: Adelantos</Text>
            <Text style={styles.value}>- {fmt(balance.totalAdvances)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Menos: Pagos realizados</Text>
            <Text style={styles.value}>- {fmt(balance.totalPayments)}</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Saldo a pagar</Text>
          <Text style={styles.totalValue}>{fmt(balance.saldoPendiente)}</Text>
        </View>

        {/* Signature lines */}
        <View style={{ marginTop: 60, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', width: 180 }}>
            <View style={{ borderTopWidth: 1, borderColor: '#1a1a1a', width: '100%', marginBottom: 4 }} />
            <Text style={{ fontSize: 10, color: '#555' }}>Empleado: {balance.staffName}</Text>
          </View>
          <View style={{ alignItems: 'center', width: 180 }}>
            <View style={{ borderTopWidth: 1, borderColor: '#1a1a1a', width: '100%', marginBottom: 4 }} />
            <Text style={{ fontSize: 10, color: '#555' }}>{venueName}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generado el {format(generatedAt, "dd/MM/yyyy 'a las' HH:mm", { locale: es })} · My Way
        </Text>
      </Page>
    </Document>
  )
}
```

- [ ] **14.5** Create `apps/app-admin/src/lib/employees/pdf.utils.ts`

```typescript
import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { LiquidacionPDF } from '@/components/employees/LiquidacionPDF'
import type { EmployeeBalance } from '@myway/types'

export async function generateLiquidacionBlob(
  balance: EmployeeBalance,
  venueName: string
): Promise<Blob> {
  const doc = createElement(LiquidacionPDF, { balance, venueName, generatedAt: new Date() })
  const blob = await pdf(doc).toBlob()
  return blob
}
```

- [ ] **14.6** Wire up "Exportar liquidación PDF" button in `BalanceSummary.tsx`:
  - On click: calls `generateLiquidacionBlob`, creates an object URL, triggers browser download
  - Filename format: `liquidacion-{staffName}-{periodFrom}-{periodTo}.pdf`
  - Show loading spinner during generation
- [ ] **14.7** Run test — verify PASS
- [ ] **14.8** Commit: `feat(app-admin/employees): liquidación PDF export with react-pdf`

---

## Task 15: Wire navigation + polish

**Files:**
- Edit: `apps/app-admin/src/app/employees/page.tsx`
- Edit: `apps/app-admin/src/app/employees/staff/page.tsx` (add TopPerformersRanking)
- Edit: `apps/app-admin/src/app/(nav)/layout.tsx` or sidebar navigation

- [ ] **15.1** Add "Empleados" link to the `app-admin` sidebar navigation pointing to `/employees/staff`
- [ ] **15.2** Create `apps/app-admin/src/app/employees/page.tsx` as a redirect to `/employees/staff`
- [ ] **15.3** Add `TopPerformersRanking` component to the `/employees/staff` list page (below the StaffTable, defaulting to current month's date range)
- [ ] **15.4** Add date range defaults throughout:
  - Shift history: default last 30 days
  - Advances: default current month
  - Balance: default current month (1st to today)
- [ ] **15.5** Verify that `/employees/*` routes are not accessible to `waiter`, `kitchen`, `cashier`, and `bar` roles
- [ ] **15.6** Verify that `admin` role cannot see admin/superadmin entries in the staff list (filter server-side in `useStaffList` based on actor role — admins see only non-admin staff)
- [ ] **15.7** Commit: `feat(app-admin/employees): wire navigation, defaults, and role filters`

---

## Verification Checklist

### Staff Management
- [ ] Staff list shows name, email, role badge, active/inactive badge, last login date
- [ ] "Nuevo empleado" button is visible; dialog validates PIN match (4–6 digits)
- [ ] Admin cannot see or create/edit admin or superadmin rows
- [ ] Superadmin can create, edit, and deactivate admins
- [ ] Deactivating a staff member sets `is_active = false` (soft delete, data preserved)
- [ ] Reset PIN clears `failed_pin_attempts` and `locked_until`
- [ ] Deactivated staff cannot log in to staff apps (existing login checks `is_active`)

### Shift Tracking
- [ ] `ShiftBanner` appears at the bottom of authenticated views in all 4 staff apps
- [ ] `ShiftBanner` does NOT appear on `/login` pages
- [ ] Clicking "Iniciar turno" creates a `staff_shifts` row with `ended_at = null`
- [ ] Clicking "Finalizar turno" sets `ended_at` and computes `duration_minutes` correctly
- [ ] Only one shift can be active at a time (UI shows open shift automatically on load)
- [ ] Shift history in admin shows all shifts with duration; open shifts marked "En curso"
- [ ] Total hours worked is accurately computed from `duration_minutes` sum

### Employee Performance
- [ ] Performance stats query uses `orders.created_by` for attribution
- [ ] Date range filter correctly narrows results
- [ ] `tablesServed` counts orders with status != 'cancelled'
- [ ] `cancellations` counts orders with status = 'cancelled'
- [ ] `totalDiscounts` sums `discount_amount` from active orders
- [ ] Top performers ranking is ordered by `totalSales DESC`

### Salary Contract
- [ ] Setting a new contract closes the previous one (sets `effective_to`)
- [ ] Current contract card shows "Sin contrato" when none exists
- [ ] Contract history is visible (all past contracts)

### Advances
- [ ] Amount validation: must be > 0
- [ ] Authorized by field is set to the current admin's staffId
- [ ] Advances list shows total sum in footer

### Salary Payments
- [ ] Amount validation: must be > 0
- [ ] `period_from <= period_to` validation enforced
- [ ] Payments list shows total sum in footer

### Balance & PDF
- [ ] Monthly contract: devengado = (salary / days_in_month) × days_in_period ± $0.01 (rounding)
- [ ] Hourly contract: devengado = hourly_rate × total_hours_worked
- [ ] `saldoPendiente = devengado - advances - payments` (can be negative — overpaid)
- [ ] PDF renders employee name, period, breakdown, and saldo correctly
- [ ] PDF download triggers automatically; filename includes staff name and period
- [ ] PDF displays both signature lines

### Authorization
- [ ] `/employees` routes return redirect for non-admin/non-superadmin roles
- [ ] All server actions validate actor role before executing mutations
- [ ] `FORBIDDEN` error surfaces as a user-friendly toast in the UI (not a 500)
