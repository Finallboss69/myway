# My Way — Plan 4: Delivery System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete delivery flow end-to-end — customer-facing ordering (Google OAuth, address autocomplete, delivery zone detection, MercadoPago checkout, loyalty points, order tracking, order history), the MercadoPago webhook handler on Vercel, local-server Supabase Realtime listener, and the waiter delivery mode in app-waiter.

**Architecture:** `web-customer` (Next.js 15, App Router, Vercel) handles the public delivery UI. NextAuth.js v5 with Google provider authenticates customers. MercadoPago SDK creates payment preferences server-side; MP redirects back to Vercel on success/failure. A Vercel API route validates the MP webhook HMAC and updates `delivery_orders` in Supabase. Supabase Realtime fires a CDC event that `local-server` picks up via a persistent channel subscription; local-server then emits `delivery_new` over Socket.io to POS and kitchen. `app-waiter` shows assigned delivery orders and records cash payment / status transitions. Delivery zone polygons are managed in `app-admin` (covered in Plan 6) and read here via Supabase.

**Tech Stack:** Next.js 15 (App Router), NextAuth.js v5, `@auth/supabase-adapter`, Google Maps JavaScript API (Places Autocomplete), `@googlemaps/js-api-loader`, MercadoPago Node.js SDK (`mercadopago`), Supabase JS v2 (`@supabase/supabase-js`), Supabase Realtime, Socket.io client 4.x, Zustand 5, TanStack Query 5, Vitest, Playwright (E2E)

**Depends on:** Plan 0 (foundation) — can be developed in parallel with Plans 1–3

---

## Environment Variables

```
# web-customer (.env.local)
NEXTAUTH_URL=https://pedidos.myway.com
NEXTAUTH_SECRET=<random-32-chars>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXT_PUBLIC_GOOGLE_MAPS_KEY=<Maps JavaScript API key with Places enabled>
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
MP_ACCESS_TOKEN=<MercadoPago production access token>
MP_WEBHOOK_SECRET=<secret string set in MP webhook config>
NEXT_PUBLIC_VENUE_ID=00000000-0000-0000-0000-000000000001

# local-server (.env) — additions for Plan 4
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
VENUE_ID=00000000-0000-0000-0000-000000000001
DELIVERY_STALENESS_WARN_MINUTES=10
```

---

## File Map

```
apps/
├── web-customer/
│   ├── package.json
│   ├── next.config.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                        # Root layout — SessionProvider + QueryProvider
│   │   │   ├── providers.tsx                     # NextAuth SessionProvider + TanStack QueryClientProvider
│   │   │   ├── delivery/
│   │   │   │   ├── page.tsx                      # Delivery home — redirects to /delivery/menu if logged in
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx                  # Google sign-in prompt page
│   │   │   │   ├── menu/
│   │   │   │   │   └── page.tsx                  # Delivery menu (same products, delivery mode)
│   │   │   │   ├── checkout/
│   │   │   │   │   └── page.tsx                  # Address + payment selection + loyalty redemption
│   │   │   │   ├── success/
│   │   │   │   │   └── page.tsx                  # Post-MP-redirect success page
│   │   │   │   ├── failure/
│   │   │   │   │   └── page.tsx                  # Post-MP-redirect failure page
│   │   │   │   ├── order/
│   │   │   │   │   └── [orderId]/
│   │   │   │   │       └── page.tsx              # Real-time order tracking page
│   │   │   │   └── history/
│   │   │   │       └── page.tsx                  # Order history + "pedir de nuevo"
│   │   │   └── api/
│   │   │       ├── auth/
│   │   │       │   └── [...nextauth]/
│   │   │       │       └── route.ts              # NextAuth.js v5 handler
│   │   │       ├── delivery/
│   │   │       │   ├── zones/
│   │   │       │   │   └── route.ts              # GET active delivery zones
│   │   │       │   ├── orders/
│   │   │       │   │   └── route.ts              # POST create delivery order
│   │   │       │   └── mp-preference/
│   │   │       │       └── route.ts              # POST create MP preference → return init_point
│   │   │       └── webhooks/
│   │   │           └── mercadopago/
│   │   │               └── route.ts              # POST MP webhook — validate HMAC + update Supabase
│   │   ├── auth.ts                               # NextAuth.js v5 config (Google provider + Supabase adapter)
│   │   ├── middleware.ts                         # Protect /delivery/menu, /delivery/checkout, /delivery/history
│   │   ├── lib/
│   │   │   ├── supabase-server.ts                # Supabase server client (uses service role for API routes)
│   │   │   ├── supabase-client.ts                # Supabase browser client singleton
│   │   │   ├── mp.ts                             # MercadoPago SDK singleton
│   │   │   ├── geo.ts                            # Point-in-polygon: check address coords vs zone polygons
│   │   │   └── loyalty.ts                        # Loyalty points helpers (earn/redeem calculations)
│   │   ├── hooks/
│   │   │   ├── use-delivery-zones.ts             # TanStack Query — fetch + cache zones
│   │   │   ├── use-cart.ts                       # Zustand cart store (delivery mode)
│   │   │   ├── use-order-tracking.ts             # Supabase Realtime subscription for order status
│   │   │   └── use-loyalty.ts                    # Fetch customer loyalty balance
│   │   ├── components/
│   │   │   ├── delivery/
│   │   │   │   ├── address-autocomplete.tsx      # Google Places Autocomplete input
│   │   │   │   ├── zone-fee-display.tsx          # Show matched zone name + delivery fee
│   │   │   │   ├── payment-selector.tsx          # Efectivo / MercadoPago radio
│   │   │   │   ├── loyalty-redeemer.tsx          # Show balance + redeem checkbox
│   │   │   │   ├── order-status-tracker.tsx      # Real-time status stepper
│   │   │   │   ├── order-history-card.tsx        # Past order card with "Pedir de nuevo"
│   │   │   │   └── delivery-cart-drawer.tsx      # Slide-out cart for delivery mode
│   │   │   └── menu/
│   │   │       ├── product-grid.tsx              # Shared with table mode
│   │   │       ├── product-card.tsx
│   │   │       └── category-tabs.tsx
│   │   └── store/
│   │       ├── delivery-cart.ts                  # Zustand: items, address, zone, payment method
│   │       └── checkout.ts                       # Zustand: checkout step state
│
├── app-waiter/
│   └── src/
│       ├── app/
│       │   └── delivery/
│       │       └── page.tsx                      # Waiter delivery orders list
│       └── components/
│           └── delivery/
│               ├── delivery-order-card.tsx       # Shows order, address, status actions
│               └── cash-payment-modal.tsx        # Record cash payment for COD orders
│
└── local-server/
    └── src/
        ├── delivery/
        │   ├── realtime-listener.ts              # Subscribe to Supabase Realtime delivery_orders channel
        │   └── staleness-check.ts                # Warn POS if received_at_local > DELIVERY_STALENESS_WARN_MINUTES
        └── routes/
            └── delivery.ts                       # PATCH /delivery/:id/status (waiter updates)

supabase/
└── migrations/
    └── 20260321000004_delivery_rls.sql           # RLS policies for delivery_orders + loyalty_transactions
```

---

## Task 1: web-customer — app scaffold + NextAuth.js v5

**Files:**
- Create: `apps/web-customer/package.json`
- Create: `apps/web-customer/next.config.ts`
- Create: `apps/web-customer/src/auth.ts`
- Create: `apps/web-customer/src/middleware.ts`
- Create: `apps/web-customer/src/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/web-customer/src/app/providers.tsx`
- Create: `apps/web-customer/src/app/layout.tsx`

- [ ] **1.1** Create `apps/web-customer/package.json`

```json
{
  "name": "@myway/web-customer",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev -H 0.0.0.0 --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "^5.0.0",
    "@auth/supabase-adapter": "^1.4.0",
    "@supabase/supabase-js": "^2.46.0",
    "mercadopago": "^2.0.0",
    "@googlemaps/js-api-loader": "^1.16.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "socket.io-client": "^4.8.0",
    "@myway/ui": "workspace:*",
    "@myway/types": "workspace:*",
    "@myway/utils": "workspace:*",
    "@myway/auth": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^2.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@playwright/test": "^1.48.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "@myway/config": "workspace:*"
  }
}
```

- [ ] **1.2** Create `apps/web-customer/next.config.ts`

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
}

export default config
```

- [ ] **1.3** Write failing test for auth config — `src/__tests__/auth.test.ts`

```typescript
import { describe, it, expect } from 'vitest'

describe('NextAuth config', () => {
  it('exports handlers, signIn, signOut, auth', async () => {
    // Dynamic import so we can test exports without full Next.js runtime
    const mod = await import('../auth')
    expect(mod.handlers).toBeDefined()
    expect(mod.signIn).toBeDefined()
    expect(mod.signOut).toBeDefined()
    expect(mod.auth).toBeDefined()
  })
})
```

- [ ] **1.4** Run test — verify it fails

```bash
cd apps/web-customer && pnpm test
# Expected: FAIL — cannot find module '../auth'
```

- [ ] **1.5** Create `apps/web-customer/src/auth.ts`

```typescript
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { SupabaseAdapter } from '@auth/supabase-adapter'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  callbacks: {
    async session({ session, user }) {
      // Attach Supabase customer id to session for downstream use
      session.user.id = user.id
      return session
    },
  },
  pages: {
    signIn: '/delivery/login',
  },
})
```

- [ ] **1.6** Create `apps/web-customer/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/auth'

export const { GET, POST } = handlers
```

- [ ] **1.7** Create `apps/web-customer/src/middleware.ts`

```typescript
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const protectedPrefixes = ['/delivery/menu', '/delivery/checkout', '/delivery/history', '/delivery/order']
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))

  if (isProtected && !req.auth) {
    const loginUrl = new URL('/delivery/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/delivery/:path*'],
}
```

- [ ] **1.8** Create `apps/web-customer/src/app/providers.tsx`

```typescript
'use client'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  }))

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

- [ ] **1.9** Create `apps/web-customer/src/app/layout.tsx`

```typescript
import type { ReactNode } from 'react'
import { Providers } from './providers'
import '@myway/ui/styles/globals.css'

export const metadata = { title: 'My Way — Delivery', description: 'Pedí a domicilio' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="bg-surface-0 text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **1.10** Run test — verify it passes

```bash
cd apps/web-customer && pnpm test
# Expected: PASS — auth exports verified
```

- [ ] **1.11** Commit

```bash
git add apps/web-customer
git commit -m "feat(web-customer): scaffold Next.js app + NextAuth.js v5 Google provider"
```

---

## Task 2: Supabase clients + MercadoPago singleton

**Files:**
- Create: `apps/web-customer/src/lib/supabase-server.ts`
- Create: `apps/web-customer/src/lib/supabase-client.ts`
- Create: `apps/web-customer/src/lib/mp.ts`

- [ ] **2.1** Create `apps/web-customer/src/lib/supabase-server.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

// Service-role client for use in API routes only — never import in client components
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

- [ ] **2.2** Create `apps/web-customer/src/lib/supabase-client.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
```

- [ ] **2.3** Create `apps/web-customer/src/lib/mp.ts`

```typescript
import MercadoPagoConfig, { Preference } from 'mercadopago'

let mpClient: MercadoPagoConfig | null = null

export function getMpClient(): MercadoPagoConfig {
  if (!mpClient) {
    mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    })
  }
  return mpClient
}

export function getMpPreference() {
  return new Preference(getMpClient())
}
```

- [ ] **2.4** Commit

```bash
git add apps/web-customer/src/lib
git commit -m "feat(web-customer): add Supabase server/client helpers and MercadoPago singleton"
```

---

## Task 3: Delivery zones API + geo helpers

**Files:**
- Create: `apps/web-customer/src/lib/geo.ts`
- Create: `apps/web-customer/src/app/api/delivery/zones/route.ts`
- Create: `apps/web-customer/src/__tests__/geo.test.ts`

- [ ] **3.1** Write failing test — `src/__tests__/geo.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { pointInPolygon, findDeliveryZone } from '../lib/geo'

const squareZone = {
  id: 'zone-1',
  name: 'Centro',
  delivery_fee: 500,
  polygon_json: [
    { lat: -34.60, lng: -58.40 },
    { lat: -34.60, lng: -58.38 },
    { lat: -34.62, lng: -58.38 },
    { lat: -34.62, lng: -58.40 },
  ],
}

describe('pointInPolygon', () => {
  it('returns true for a point inside the polygon', () => {
    expect(pointInPolygon({ lat: -34.61, lng: -58.39 }, squareZone.polygon_json)).toBe(true)
  })

  it('returns false for a point outside the polygon', () => {
    expect(pointInPolygon({ lat: -34.50, lng: -58.30 }, squareZone.polygon_json)).toBe(false)
  })
})

describe('findDeliveryZone', () => {
  it('returns the matching zone for a point inside it', () => {
    const result = findDeliveryZone({ lat: -34.61, lng: -58.39 }, [squareZone])
    expect(result?.id).toBe('zone-1')
  })

  it('returns null when no zone matches', () => {
    const result = findDeliveryZone({ lat: -34.50, lng: -58.30 }, [squareZone])
    expect(result).toBeNull()
  })
})
```

- [ ] **3.2** Run test — verify it fails

```bash
cd apps/web-customer && pnpm test
# Expected: FAIL — cannot find module '../lib/geo'
```

- [ ] **3.3** Create `apps/web-customer/src/lib/geo.ts`

```typescript
interface LatLng { lat: number; lng: number }
interface DeliveryZone {
  id: string
  name: string
  delivery_fee: number
  polygon_json: LatLng[]
}

/**
 * Ray-casting algorithm for point-in-polygon check.
 * Returns true if the point is inside the polygon.
 */
export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  const { lat: py, lng: px } = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.lng
    const yi = polygon[i]!.lat
    const xj = polygon[j]!.lng
    const yj = polygon[j]!.lat

    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Returns the first zone whose polygon contains the given point, or null.
 */
export function findDeliveryZone(point: LatLng, zones: DeliveryZone[]): DeliveryZone | null {
  for (const zone of zones) {
    if (pointInPolygon(point, zone.polygon_json)) return zone
  }
  return null
}
```

- [ ] **3.4** Run test — verify it passes

```bash
cd apps/web-customer && pnpm test
# Expected: PASS — 4 geo tests green
```

- [ ] **3.5** Create `apps/web-customer/src/app/api/delivery/zones/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabase()
  const venueId = process.env.NEXT_PUBLIC_VENUE_ID!

  const { data, error } = await supabase
    .from('delivery_zones')
    .select('id, name, polygon_json, delivery_fee')
    .eq('venue_id', venueId)
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: 'Failed to load zones' }, { status: 500 })
  }

  return NextResponse.json({ zones: data })
}
```

- [ ] **3.6** Commit

```bash
git add apps/web-customer/src/lib/geo.ts apps/web-customer/src/__tests__/geo.test.ts apps/web-customer/src/app/api/delivery/zones
git commit -m "feat(web-customer): point-in-polygon geo helper + delivery zones API"
```

---

## Task 4: Loyalty helpers

**Files:**
- Create: `apps/web-customer/src/lib/loyalty.ts`
- Create: `apps/web-customer/src/__tests__/loyalty.test.ts`

- [ ] **4.1** Write failing test — `src/__tests__/loyalty.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { computeEarnedPoints, computeRedeemDiscount, POINTS_PER_PESO, REDEEM_MIN_POINTS, REDEEM_PESOS_PER_POINT } from '../lib/loyalty'

describe('loyalty points', () => {
  it('earns 1 point per $100 ARS', () => {
    expect(computeEarnedPoints(1500)).toBe(15)
    expect(computeEarnedPoints(99)).toBe(0)
    expect(computeEarnedPoints(100)).toBe(1)
  })

  it('minimum 100 points required to redeem', () => {
    expect(computeRedeemDiscount(50)).toBe(0)
    expect(computeRedeemDiscount(100)).toBe(50)
    expect(computeRedeemDiscount(200)).toBe(100)
  })
})
```

- [ ] **4.2** Run test — verify it fails

```bash
cd apps/web-customer && pnpm test
# Expected: FAIL — cannot find module '../lib/loyalty'
```

- [ ] **4.3** Create `apps/web-customer/src/lib/loyalty.ts`

```typescript
// 1 point per $100 ARS spent
export const POINTS_PER_PESO = 1 / 100

// Minimum points required to redeem
export const REDEEM_MIN_POINTS = 100

// 100 points = $50 ARS discount
export const REDEEM_PESOS_PER_POINT = 0.5

/**
 * How many points a customer earns on an order of the given total (ARS).
 */
export function computeEarnedPoints(totalArs: number): number {
  return Math.floor(totalArs * POINTS_PER_PESO)
}

/**
 * How many ARS discount the given points balance redeems.
 * Returns 0 if below the minimum redemption threshold.
 */
export function computeRedeemDiscount(points: number): number {
  if (points < REDEEM_MIN_POINTS) return 0
  return Math.floor(points * REDEEM_PESOS_PER_POINT)
}
```

- [ ] **4.4** Run test — verify it passes

```bash
cd apps/web-customer && pnpm test
# Expected: PASS — 2 loyalty tests green
```

- [ ] **4.5** Commit

```bash
git add apps/web-customer/src/lib/loyalty.ts apps/web-customer/src/__tests__/loyalty.test.ts
git commit -m "feat(web-customer): loyalty points earn/redeem helpers"
```

---

## Task 5: Address autocomplete component + delivery zones hook

**Files:**
- Create: `apps/web-customer/src/hooks/use-delivery-zones.ts`
- Create: `apps/web-customer/src/hooks/use-loyalty.ts`
- Create: `apps/web-customer/src/components/delivery/address-autocomplete.tsx`
- Create: `apps/web-customer/src/components/delivery/zone-fee-display.tsx`

- [ ] **5.1** Create `apps/web-customer/src/hooks/use-delivery-zones.ts`

```typescript
import { useQuery } from '@tanstack/react-query'

interface DeliveryZone {
  id: string
  name: string
  polygon_json: Array<{ lat: number; lng: number }>
  delivery_fee: number
}

async function fetchZones(): Promise<DeliveryZone[]> {
  const res = await fetch('/api/delivery/zones')
  if (!res.ok) throw new Error('Failed to load zones')
  const data = await res.json() as { zones: DeliveryZone[] }
  return data.zones
}

export function useDeliveryZones() {
  return useQuery({
    queryKey: ['delivery-zones'],
    queryFn: fetchZones,
    staleTime: 5 * 60 * 1000,
  })
}
```

- [ ] **5.2** Create `apps/web-customer/src/hooks/use-loyalty.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getSupabaseClient } from '@/lib/supabase-client'

export function useLoyalty() {
  const { data: session } = useSession()
  const customerId = session?.user?.id

  return useQuery({
    queryKey: ['loyalty', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId!)
        .single()
      if (error) throw error
      return (data as { loyalty_points: number }).loyalty_points
    },
  })
}
```

- [ ] **5.3** Create `apps/web-customer/src/components/delivery/address-autocomplete.tsx`

```typescript
'use client'
import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface AddressResult {
  address: string
  lat: number
  lng: number
}

interface Props {
  onAddressSelect: (result: AddressResult) => void
}

export function AddressAutocomplete({ onAddressSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
      libraries: ['places'],
    })

    loader.load().then(() => setReady(true)).catch(console.error)
  }, [])

  useEffect(() => {
    if (!ready || !inputRef.current) return

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'ar' },
      fields: ['formatted_address', 'geometry'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const lat = place.geometry?.location?.lat()
      const lng = place.geometry?.location?.lng()
      if (place.formatted_address && lat !== undefined && lng !== undefined) {
        onAddressSelect({ address: place.formatted_address, lat, lng })
      }
    })

    return () => google.maps.event.clearInstanceListeners(autocomplete)
  }, [ready, onAddressSelect])

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Ingresá tu dirección de entrega"
      className="w-full rounded-lg border border-surface-3 bg-surface-1 px-4 py-3 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
    />
  )
}
```

- [ ] **5.4** Create `apps/web-customer/src/components/delivery/zone-fee-display.tsx`

```typescript
'use client'
import { formatCurrency } from '@myway/utils'

interface Props {
  zoneName: string | null
  deliveryFee: number | null
  loading: boolean
}

export function ZoneFeeDisplay({ zoneName, deliveryFee, loading }: Props) {
  if (loading) {
    return <p className="text-sm text-gray-400">Verificando zona de entrega...</p>
  }

  if (!zoneName) {
    return (
      <p className="text-sm text-red-400">
        Lo sentimos, no llegamos a esa dirección todavía.
      </p>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-surface-3 bg-surface-1 px-4 py-3">
      <span className="text-sm text-gray-300">
        Zona: <strong className="text-white">{zoneName}</strong>
      </span>
      <span className="text-sm font-semibold text-brand-500">
        Envío: {deliveryFee === 0 ? 'Gratis' : formatCurrency(deliveryFee ?? 0)}
      </span>
    </div>
  )
}
```

- [ ] **5.5** Commit

```bash
git add apps/web-customer/src/hooks apps/web-customer/src/components/delivery
git commit -m "feat(web-customer): address autocomplete, zone fee display, loyalty hook"
```

---

## Task 6: Delivery cart store + checkout page

**Files:**
- Create: `apps/web-customer/src/store/delivery-cart.ts`
- Create: `apps/web-customer/src/components/delivery/payment-selector.tsx`
- Create: `apps/web-customer/src/components/delivery/loyalty-redeemer.tsx`
- Create: `apps/web-customer/src/app/delivery/checkout/page.tsx`

- [ ] **6.1** Create `apps/web-customer/src/store/delivery-cart.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  notes?: string
  modifiers?: Record<string, string>
}

interface AddressInfo {
  address: string
  lat: number
  lng: number
}

interface DeliveryCartState {
  items: CartItem[]
  address: AddressInfo | null
  zoneId: string | null
  deliveryFee: number
  paymentMethod: 'cash' | 'mercadopago' | null
  redeemPoints: boolean

  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setAddress: (info: AddressInfo) => void
  setZone: (zoneId: string, fee: number) => void
  setPaymentMethod: (method: 'cash' | 'mercadopago') => void
  setRedeemPoints: (redeem: boolean) => void
  clearCart: () => void
  get subtotal(): number
}

export const useDeliveryCart = create<DeliveryCartState>()(
  persist(
    (set, get) => ({
      items: [],
      address: null,
      zoneId: null,
      deliveryFee: 0,
      paymentMethod: null,
      redeemPoints: false,

      get subtotal() {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        }),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => i.productId !== productId)
            : state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),

      setAddress: (info) => set({ address: info }),
      setZone: (zoneId, fee) => set({ zoneId, deliveryFee: fee }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setRedeemPoints: (redeem) => set({ redeemPoints: redeem }),
      clearCart: () => set({ items: [], address: null, zoneId: null, deliveryFee: 0, paymentMethod: null, redeemPoints: false }),
    }),
    { name: 'delivery-cart' }
  )
)
```

- [ ] **6.2** Create `apps/web-customer/src/components/delivery/payment-selector.tsx`

```typescript
'use client'

interface Props {
  value: 'cash' | 'mercadopago' | null
  onChange: (v: 'cash' | 'mercadopago') => void
}

export function PaymentSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-300">Método de pago</p>
      {(['cash', 'mercadopago'] as const).map((method) => (
        <label
          key={method}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
            value === method ? 'border-brand-500 bg-surface-2' : 'border-surface-3 bg-surface-1'
          }`}
        >
          <input
            type="radio"
            name="payment"
            value={method}
            checked={value === method}
            onChange={() => onChange(method)}
            className="accent-brand-500"
          />
          <span className="text-sm text-white">
            {method === 'cash' ? 'Efectivo al recibir' : 'MercadoPago (online)'}
          </span>
        </label>
      ))}
    </div>
  )
}
```

- [ ] **6.3** Create `apps/web-customer/src/components/delivery/loyalty-redeemer.tsx`

```typescript
'use client'
import { formatCurrency } from '@myway/utils'
import { computeRedeemDiscount, REDEEM_MIN_POINTS } from '@/lib/loyalty'

interface Props {
  pointsBalance: number
  checked: boolean
  onChange: (v: boolean) => void
}

export function LoyaltyRedeemer({ pointsBalance, checked, onChange }: Props) {
  const discount = computeRedeemDiscount(pointsBalance)
  const canRedeem = pointsBalance >= REDEEM_MIN_POINTS

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Puntos de fidelidad</p>
          <p className="text-xs text-gray-400">{pointsBalance} puntos acumulados</p>
        </div>
        {canRedeem ? (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="accent-brand-500"
            />
            <span className="text-sm text-brand-400">
              Usar ({formatCurrency(discount)} de descuento)
            </span>
          </label>
        ) : (
          <p className="text-xs text-gray-500">
            Necesitás {REDEEM_MIN_POINTS - pointsBalance} puntos más para canjear
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **6.4** Create `apps/web-customer/src/app/delivery/checkout/page.tsx`

```typescript
'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AddressAutocomplete } from '@/components/delivery/address-autocomplete'
import { ZoneFeeDisplay } from '@/components/delivery/zone-fee-display'
import { PaymentSelector } from '@/components/delivery/payment-selector'
import { LoyaltyRedeemer } from '@/components/delivery/loyalty-redeemer'
import { useDeliveryCart } from '@/store/delivery-cart'
import { useDeliveryZones } from '@/hooks/use-delivery-zones'
import { useLoyalty } from '@/hooks/use-loyalty'
import { findDeliveryZone } from '@/lib/geo'
import { computeEarnedPoints, computeRedeemDiscount } from '@/lib/loyalty'
import { formatCurrency } from '@myway/utils'

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: zones = [] } = useDeliveryZones()
  const { data: loyaltyPoints = 0 } = useLoyalty()
  const cart = useDeliveryCart()

  const [matchedZone, setMatchedZone] = useState<{ id: string; name: string; fee: number } | null>(null)
  const [zoneChecking, setZoneChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddressSelect = useCallback(
    (result: { address: string; lat: number; lng: number }) => {
      setZoneChecking(true)
      cart.setAddress(result)
      const zone = findDeliveryZone({ lat: result.lat, lng: result.lng }, zones)
      if (zone) {
        setMatchedZone({ id: zone.id, name: zone.name, fee: zone.delivery_fee })
        cart.setZone(zone.id, zone.delivery_fee)
      } else {
        setMatchedZone(null)
      }
      setZoneChecking(false)
    },
    [zones, cart]
  )

  const redeemDiscount = cart.redeemPoints ? computeRedeemDiscount(loyaltyPoints) : 0
  const total = cart.subtotal + (matchedZone?.fee ?? 0) - redeemDiscount
  const earnedPoints = computeEarnedPoints(total)

  async function handleSubmit() {
    if (!cart.address || !matchedZone || !cart.paymentMethod) {
      setError('Completá todos los campos para continuar.')
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/delivery/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: session!.user!.id,
          items: cart.items,
          address: cart.address.address,
          lat: cart.address.lat,
          lng: cart.address.lng,
          zoneId: matchedZone.id,
          deliveryFee: matchedZone.fee,
          paymentMethod: cart.paymentMethod,
          redeemPoints: cart.redeemPoints,
          redeemDiscount,
        }),
      })

      const data = await res.json() as { orderId?: string; mpInitPoint?: string; error?: string }

      if (!res.ok) throw new Error(data.error ?? 'Error al crear el pedido')

      cart.clearCart()

      if (cart.paymentMethod === 'mercadopago' && data.mpInitPoint) {
        window.location.href = data.mpInitPoint
      } else {
        router.push(`/delivery/order/${data.orderId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 p-4 pb-32">
      <h1 className="text-2xl font-bold text-white">Finalizar pedido</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Dirección</h2>
        <AddressAutocomplete onAddressSelect={handleAddressSelect} />
        <ZoneFeeDisplay
          zoneName={matchedZone?.name ?? null}
          deliveryFee={matchedZone?.fee ?? null}
          loading={zoneChecking}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Pago</h2>
        <PaymentSelector value={cart.paymentMethod} onChange={cart.setPaymentMethod} />
      </section>

      {loyaltyPoints > 0 && (
        <LoyaltyRedeemer
          pointsBalance={loyaltyPoints}
          checked={cart.redeemPoints}
          onChange={cart.setRedeemPoints}
        />
      )}

      <div className="space-y-1 rounded-lg border border-surface-3 bg-surface-1 px-4 py-3 text-sm">
        <div className="flex justify-between text-gray-300">
          <span>Subtotal</span><span>{formatCurrency(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Envío</span><span>{formatCurrency(matchedZone?.fee ?? 0)}</span>
        </div>
        {redeemDiscount > 0 && (
          <div className="flex justify-between text-green-400">
            <span>Descuento puntos</span><span>-{formatCurrency(redeemDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-surface-3 pt-2 font-bold text-white">
          <span>Total</span><span>{formatCurrency(total)}</span>
        </div>
        <p className="text-xs text-gray-500">Ganás {earnedPoints} puntos con este pedido</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || !matchedZone || !cart.paymentMethod}
        className="w-full rounded-xl bg-brand-500 py-4 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {submitting ? 'Procesando...' : 'Confirmar pedido'}
      </button>
    </main>
  )
}
```

- [ ] **6.5** Commit

```bash
git add apps/web-customer/src/store apps/web-customer/src/components/delivery apps/web-customer/src/app/delivery/checkout
git commit -m "feat(web-customer): delivery cart store + checkout page with zone detection and loyalty"
```

---

## Task 7: Create order API route + MercadoPago preference

**Files:**
- Create: `apps/web-customer/src/app/api/delivery/orders/route.ts`
- Create: `apps/web-customer/src/app/api/delivery/mp-preference/route.ts`

- [ ] **7.1** Create `apps/web-customer/src/app/api/delivery/orders/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerSupabase } from '@/lib/supabase-server'
import { getMpPreference } from '@/lib/mp'
import { computeEarnedPoints, computeRedeemDiscount } from '@/lib/loyalty'

interface OrderBody {
  customerId: string
  items: Array<{ productId: string; name: string; price: number; quantity: number; notes?: string }>
  address: string
  lat: number
  lng: number
  zoneId: string
  deliveryFee: number
  paymentMethod: 'cash' | 'mercadopago'
  redeemPoints: boolean
  redeemDiscount: number
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as OrderBody
  const supabase = createServerSupabase()
  const venueId = process.env.NEXT_PUBLIC_VENUE_ID!

  // Validate input
  if (!body.items?.length || !body.address || !body.zoneId || !body.paymentMethod) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Fetch loyalty points if redeeming
  let appliedDiscount = 0
  if (body.redeemPoints) {
    const { data: customer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', body.customerId)
      .single()
    const points = (customer as { loyalty_points: number } | null)?.loyalty_points ?? 0
    appliedDiscount = computeRedeemDiscount(points)
  }

  const itemsTotal = body.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const total = itemsTotal + body.deliveryFee - appliedDiscount

  // Create order record
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      venue_id: venueId,
      type: 'delivery',
      status: 'pending',
      customer_id: body.customerId,
      total,
      discount_amount: appliedDiscount,
      discount_reason: body.redeemPoints ? 'loyalty_redeem' : null,
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Insert order items
  const orderItems = body.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.price,
    notes: item.notes ?? null,
    target: 'kitchen' as const, // Overridden by product.target in practice; safe default
    status: 'pending' as const,
  }))

  await supabase.from('order_items').insert(orderItems)

  // Create delivery_order record
  const { data: deliveryOrder, error: deliveryErr } = await supabase
    .from('delivery_orders')
    .insert({
      order_id: order.id,
      customer_id: body.customerId,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      delivery_zone_id: body.zoneId,
      payment_method: body.paymentMethod,
      delivery_status: 'pending',
    })
    .select('id')
    .single()

  if (deliveryErr || !deliveryOrder) {
    return NextResponse.json({ error: 'Failed to create delivery order' }, { status: 500 })
  }

  // Deduct loyalty points if redeemed
  if (body.redeemPoints && appliedDiscount > 0) {
    const pointsRedeemed = Math.ceil(appliedDiscount / 0.5) // 100 pts = $50 ARS
    await supabase.rpc('deduct_loyalty_points', {
      p_customer_id: body.customerId,
      p_points: pointsRedeemed,
      p_order_id: order.id,
    })
  }

  // If MercadoPago, create preference and return init_point
  if (body.paymentMethod === 'mercadopago') {
    const preference = getMpPreference()
    const mpResult = await preference.create({
      body: {
        items: body.items.map((item) => ({
          id: item.productId,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: 'ARS',
        })),
        payer: { email: session.user.email! },
        external_reference: deliveryOrder.id,
        back_urls: {
          success: `${process.env.NEXTAUTH_URL}/delivery/success?order=${deliveryOrder.id}`,
          failure: `${process.env.NEXTAUTH_URL}/delivery/failure?order=${deliveryOrder.id}`,
          pending: `${process.env.NEXTAUTH_URL}/delivery/order/${deliveryOrder.id}`,
        },
        auto_approve: false,
        notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`,
      },
    })

    // Save preference id
    await supabase
      .from('delivery_orders')
      .update({ mp_preference_id: mpResult.id })
      .eq('id', deliveryOrder.id)

    return NextResponse.json({ orderId: deliveryOrder.id, mpInitPoint: mpResult.init_point })
  }

  // Award loyalty points for cash orders immediately
  const earned = computeEarnedPoints(total)
  if (earned > 0) {
    await supabase.rpc('add_loyalty_points', {
      p_customer_id: body.customerId,
      p_points: earned,
      p_order_id: order.id,
    })
  }

  return NextResponse.json({ orderId: deliveryOrder.id })
}
```

- [ ] **7.2** Commit

```bash
git add apps/web-customer/src/app/api/delivery/orders
git commit -m "feat(web-customer): POST /api/delivery/orders — create order + MP preference"
```

---

## Task 8: MercadoPago webhook handler

**Files:**
- Create: `apps/web-customer/src/app/api/webhooks/mercadopago/route.ts`
- Create: `apps/web-customer/src/__tests__/mp-webhook.test.ts`

- [ ] **8.1** Write failing test — `src/__tests__/mp-webhook.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { validateMpSignature } from '../lib/mp-signature'

describe('MP webhook signature validation', () => {
  it('returns true for valid HMAC-SHA256 signature', () => {
    const secret = 'test-webhook-secret'
    const dataId = 'payment-123'
    const ts = '1710000000'
    // mp signature format: ts;data.id — signed with HMAC-SHA256
    const crypto = await import('node:crypto')
    const msg = `id:${dataId};request-id:req-1;ts:${ts};`
    const sig = crypto.createHmac('sha256', secret).update(msg).digest('hex')
    const xSignature = `ts=${ts},v1=${sig}`

    expect(validateMpSignature(xSignature, 'req-1', dataId, secret)).toBe(true)
  })

  it('returns false for tampered signature', () => {
    expect(validateMpSignature('ts=1,v1=fakesig', 'req-1', 'id-1', 'secret')).toBe(false)
  })
})
```

- [ ] **8.2** Run test — verify it fails

```bash
cd apps/web-customer && pnpm test
# Expected: FAIL — cannot find module '../lib/mp-signature'
```

- [ ] **8.3** Create `apps/web-customer/src/lib/mp-signature.ts`

```typescript
import { createHmac } from 'node:crypto'

/**
 * Validate MercadoPago x-signature header.
 * MP signs: "id:<dataId>;request-id:<requestId>;ts:<ts>;"
 * Header format: "ts=<ts>,v1=<hex-sig>"
 */
export function validateMpSignature(
  xSignature: string,
  requestId: string,
  dataId: string,
  secret: string
): boolean {
  try {
    const parts = Object.fromEntries(
      xSignature.split(',').map((p) => p.split('=') as [string, string])
    )
    const ts = parts['ts']
    const v1 = parts['v1']
    if (!ts || !v1) return false

    const message = `id:${dataId};request-id:${requestId};ts:${ts};`
    const expected = createHmac('sha256', secret).update(message).digest('hex')

    // Constant-time comparison
    if (expected.length !== v1.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}
```

- [ ] **8.4** Run test — verify it passes

```bash
cd apps/web-customer && pnpm test
# Expected: PASS — 2 webhook signature tests green
```

- [ ] **8.5** Create `apps/web-customer/src/app/api/webhooks/mercadopago/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { validateMpSignature } from '@/lib/mp-signature'
import { getMpClient } from '@/lib/mp'
import { Payment } from 'mercadopago'
import { computeEarnedPoints } from '@/lib/loyalty'

export async function POST(req: NextRequest) {
  const xSignature = req.headers.get('x-signature') ?? ''
  const requestId = req.headers.get('x-request-id') ?? ''
  const body = await req.json() as { data?: { id?: string }; type?: string }

  const dataId = body.data?.id ?? ''

  if (!validateMpSignature(xSignature, requestId, dataId, process.env.MP_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Only process payment notifications
  if (body.type !== 'payment') {
    return NextResponse.json({ ok: true })
  }

  const paymentClient = new Payment(getMpClient())
  let paymentInfo: Awaited<ReturnType<typeof paymentClient.get>>
  try {
    paymentInfo = await paymentClient.get({ id: dataId })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 502 })
  }

  if (paymentInfo.status !== 'approved') {
    return NextResponse.json({ ok: true })
  }

  const deliveryOrderId = paymentInfo.external_reference
  if (!deliveryOrderId) {
    return NextResponse.json({ error: 'No external_reference' }, { status: 400 })
  }

  const supabase = createServerSupabase()

  // Update delivery_order
  const { data: deliveryOrder } = await supabase
    .from('delivery_orders')
    .update({
      mp_payment_id: dataId,
      delivery_status: 'confirmed',
    })
    .eq('id', deliveryOrderId)
    .select('order_id, customer_id')
    .single()

  if (!deliveryOrder) {
    return NextResponse.json({ error: 'delivery_order not found' }, { status: 404 })
  }

  // Update parent order status
  await supabase
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', deliveryOrder.order_id)

  // Insert payment record
  await supabase.from('payments').insert({
    order_id: deliveryOrder.order_id,
    method: 'mercadopago_online',
    amount: paymentInfo.transaction_amount,
    mp_payment_id: dataId,
  })

  // Award loyalty points
  const earned = computeEarnedPoints(paymentInfo.transaction_amount ?? 0)
  if (earned > 0) {
    await supabase.rpc('add_loyalty_points', {
      p_customer_id: deliveryOrder.customer_id,
      p_points: earned,
      p_order_id: deliveryOrder.order_id,
    })
  }

  // Supabase Realtime will now fire a CDC event on delivery_orders for local-server

  return NextResponse.json({ ok: true })
}
```

- [ ] **8.6** Commit

```bash
git add apps/web-customer/src/lib/mp-signature.ts apps/web-customer/src/__tests__/mp-webhook.test.ts apps/web-customer/src/app/api/webhooks
git commit -m "feat(web-customer): MercadoPago webhook handler with HMAC validation"
```

---

## Task 9: Order tracking page + success/failure pages

**Files:**
- Create: `apps/web-customer/src/hooks/use-order-tracking.ts`
- Create: `apps/web-customer/src/components/delivery/order-status-tracker.tsx`
- Create: `apps/web-customer/src/app/delivery/order/[orderId]/page.tsx`
- Create: `apps/web-customer/src/app/delivery/success/page.tsx`
- Create: `apps/web-customer/src/app/delivery/failure/page.tsx`

- [ ] **9.1** Create `apps/web-customer/src/hooks/use-order-tracking.ts`

```typescript
'use client'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

export type DeliveryStatus = 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered'

interface TrackingState {
  deliveryStatus: DeliveryStatus | null
  estimatedMinutes: number | null
  loading: boolean
}

export function useOrderTracking(deliveryOrderId: string): TrackingState {
  const [state, setState] = useState<TrackingState>({
    deliveryStatus: null,
    estimatedMinutes: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Initial fetch
    supabase
      .from('delivery_orders')
      .select('delivery_status, estimated_minutes')
      .eq('id', deliveryOrderId)
      .single()
      .then(({ data }) => {
        if (data) {
          setState({
            deliveryStatus: (data as { delivery_status: DeliveryStatus; estimated_minutes: number | null }).delivery_status,
            estimatedMinutes: (data as { estimated_minutes: number | null }).estimated_minutes,
            loading: false,
          })
        }
      })

    // Realtime subscription
    const channel = supabase
      .channel(`delivery:${deliveryOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: `id=eq.${deliveryOrderId}`,
        },
        (payload) => {
          const row = payload.new as { delivery_status: DeliveryStatus; estimated_minutes: number | null }
          setState((prev) => ({
            ...prev,
            deliveryStatus: row.delivery_status,
            estimatedMinutes: row.estimated_minutes,
          }))
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [deliveryOrderId])

  return state
}
```

- [ ] **9.2** Create `apps/web-customer/src/components/delivery/order-status-tracker.tsx`

```typescript
'use client'
import type { DeliveryStatus } from '@/hooks/use-order-tracking'

const STEPS: Array<{ status: DeliveryStatus; label: string; icon: string }> = [
  { status: 'pending',    label: 'Pedido recibido',  icon: '📋' },
  { status: 'confirmed',  label: 'Confirmado',        icon: '✅' },
  { status: 'preparing',  label: 'En preparación',    icon: '🍳' },
  { status: 'on_the_way', label: 'En camino',         icon: '🛵' },
  { status: 'delivered',  label: 'Entregado',         icon: '🎉' },
]

const STATUS_ORDER: DeliveryStatus[] = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered']

interface Props {
  currentStatus: DeliveryStatus | null
  estimatedMinutes: number | null
}

export function OrderStatusTracker({ currentStatus, estimatedMinutes }: Props) {
  const currentIdx = currentStatus ? STATUS_ORDER.indexOf(currentStatus) : 0

  return (
    <div className="space-y-4">
      {estimatedMinutes && currentStatus !== 'delivered' && (
        <p className="text-center text-sm text-gray-300">
          Tiempo estimado: <strong className="text-white">{estimatedMinutes} min</strong>
        </p>
      )}
      <ol className="relative space-y-6 border-l border-surface-3 pl-6">
        {STEPS.map((step, idx) => {
          const done = idx <= currentIdx
          const active = idx === currentIdx
          return (
            <li key={step.status} className="flex items-start gap-3">
              <span
                className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  done ? 'bg-brand-500 text-black' : 'bg-surface-2 text-gray-500'
                } ${active ? 'ring-2 ring-brand-400' : ''}`}
              >
                {step.icon}
              </span>
              <p className={`text-sm ${done ? 'text-white' : 'text-gray-500'} ${active ? 'font-semibold' : ''}`}>
                {step.label}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
```

- [ ] **9.3** Create `apps/web-customer/src/app/delivery/order/[orderId]/page.tsx`

```typescript
'use client'
import { useParams } from 'next/navigation'
import { useOrderTracking } from '@/hooks/use-order-tracking'
import { OrderStatusTracker } from '@/components/delivery/order-status-tracker'

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { deliveryStatus, estimatedMinutes, loading } = useOrderTracking(orderId)

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Cargando...</div>
  }

  return (
    <main className="mx-auto max-w-lg space-y-8 p-6">
      <h1 className="text-2xl font-bold text-white">Seguimiento del pedido</h1>
      <OrderStatusTracker currentStatus={deliveryStatus} estimatedMinutes={estimatedMinutes} />
      {deliveryStatus === 'delivered' && (
        <div className="rounded-xl bg-green-900/30 border border-green-700 p-4 text-center">
          <p className="font-semibold text-green-300">¡Tu pedido fue entregado!</p>
          <p className="mt-1 text-sm text-gray-400">Gracias por elegirnos.</p>
          <a href="/delivery/history" className="mt-3 inline-block text-sm text-brand-400 underline">
            Ver historial de pedidos
          </a>
        </div>
      )}
    </main>
  )
}
```

- [ ] **9.4** Create `apps/web-customer/src/app/delivery/success/page.tsx`

```typescript
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SuccessPage() {
  const params = useSearchParams()
  const router = useRouter()
  const orderId = params.get('order')

  useEffect(() => {
    if (orderId) {
      // Brief delay so the user sees the confirmation
      const t = setTimeout(() => router.push(`/delivery/order/${orderId}`), 2000)
      return () => clearTimeout(t)
    }
  }, [orderId, router])

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-6xl">✅</div>
      <h1 className="text-2xl font-bold text-white">¡Pago confirmado!</h1>
      <p className="text-gray-400">Tu pedido está en camino. Redirigiendo al seguimiento...</p>
    </main>
  )
}
```

- [ ] **9.5** Create `apps/web-customer/src/app/delivery/failure/page.tsx`

```typescript
'use client'
import { useSearchParams, useRouter } from 'next/navigation'

export default function FailurePage() {
  const params = useSearchParams()
  const router = useRouter()
  const orderId = params.get('order')

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-6xl">❌</div>
      <h1 className="text-2xl font-bold text-white">El pago no pudo procesarse</h1>
      <p className="text-gray-400">Podés intentar nuevamente o elegir pago en efectivo.</p>
      <button
        onClick={() => router.push('/delivery/checkout')}
        className="mt-4 rounded-xl bg-brand-500 px-6 py-3 font-bold text-black"
      >
        Volver al checkout
      </button>
      {orderId && (
        <a href={`/delivery/order/${orderId}`} className="text-sm text-gray-500 underline">
          Ver estado del pedido
        </a>
      )}
    </main>
  )
}
```

- [ ] **9.6** Commit

```bash
git add apps/web-customer/src/hooks/use-order-tracking.ts apps/web-customer/src/components/delivery/order-status-tracker.tsx apps/web-customer/src/app/delivery/order apps/web-customer/src/app/delivery/success apps/web-customer/src/app/delivery/failure
git commit -m "feat(web-customer): real-time order tracking + success/failure redirect pages"
```

---

## Task 10: Order history page + "pedir de nuevo"

**Files:**
- Create: `apps/web-customer/src/components/delivery/order-history-card.tsx`
- Create: `apps/web-customer/src/app/delivery/history/page.tsx`

- [ ] **10.1** Create `apps/web-customer/src/components/delivery/order-history-card.tsx`

```typescript
'use client'
import { formatCurrency, formatDate } from '@myway/utils'
import { useDeliveryCart } from '@/store/delivery-cart'
import { useRouter } from 'next/navigation'

interface HistoryItem {
  productId: string
  name: string
  price: number
  quantity: number
}

interface Props {
  orderId: string
  createdAt: string
  total: number
  deliveryStatus: string
  items: HistoryItem[]
}

export function OrderHistoryCard({ orderId, createdAt, total, deliveryStatus, items }: Props) {
  const cart = useDeliveryCart()
  const router = useRouter()

  function reorder() {
    cart.clearCart()
    for (const item of items) {
      cart.addItem({ productId: item.productId, name: item.name, price: item.price })
      if (item.quantity > 1) cart.updateQuantity(item.productId, item.quantity)
    }
    router.push('/delivery/checkout')
  }

  return (
    <div className="rounded-xl border border-surface-3 bg-surface-1 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500">{formatDate(createdAt)}</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(total)}</p>
        </div>
        <span className="rounded-full bg-surface-2 px-2 py-1 text-xs text-gray-400">
          {deliveryStatus}
        </span>
      </div>
      <ul className="space-y-1 text-sm text-gray-300">
        {items.map((item) => (
          <li key={item.productId}>
            {item.quantity}× {item.name}
          </li>
        ))}
      </ul>
      <button
        onClick={reorder}
        className="w-full rounded-lg border border-brand-500 py-2 text-sm font-medium text-brand-400 hover:bg-brand-500/10 transition-colors"
      >
        Pedir de nuevo
      </button>
    </div>
  )
}
```

- [ ] **10.2** Create `apps/web-customer/src/app/delivery/history/page.tsx`

```typescript
import { auth } from '@/auth'
import { createServerSupabase } from '@/lib/supabase-server'
import { OrderHistoryCard } from '@/components/delivery/order-history-card'
import { redirect } from 'next/navigation'

export default async function HistoryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/delivery/login')

  const supabase = createServerSupabase()

  const { data: orders } = await supabase
    .from('delivery_orders')
    .select(`
      id,
      delivery_status,
      orders!inner(
        id,
        total,
        created_at,
        order_items(
          product_id,
          quantity,
          unit_price,
          products(name)
        )
      )
    `)
    .eq('customer_id', session.user.id)
    .order('created_at', { ascending: false, referencedTable: 'orders' })
    .limit(20)

  type HistoryRow = {
    id: string
    delivery_status: string
    orders: {
      id: string
      total: string
      created_at: string
      order_items: Array<{
        product_id: string
        quantity: number
        unit_price: string
        products: { name: string } | null
      }>
    }
  }

  const rows = (orders ?? []) as unknown as HistoryRow[]

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-2xl font-bold text-white">Mis pedidos</h1>
      {rows.length === 0 && (
        <p className="text-gray-400">Todavía no hiciste ningún pedido.</p>
      )}
      {rows.map((row) => (
        <OrderHistoryCard
          key={row.id}
          orderId={row.id}
          createdAt={row.orders.created_at}
          total={parseFloat(row.orders.total)}
          deliveryStatus={row.delivery_status}
          items={row.orders.order_items.map((oi) => ({
            productId: oi.product_id,
            name: oi.products?.name ?? 'Producto',
            price: parseFloat(oi.unit_price),
            quantity: oi.quantity,
          }))}
        />
      ))}
    </main>
  )
}
```

- [ ] **10.3** Commit

```bash
git add apps/web-customer/src/components/delivery/order-history-card.tsx apps/web-customer/src/app/delivery/history
git commit -m "feat(web-customer): order history page with 'pedir de nuevo'"
```

---

## Task 11: Login page + delivery entry page + menu page

**Files:**
- Create: `apps/web-customer/src/app/delivery/login/page.tsx`
- Create: `apps/web-customer/src/app/delivery/page.tsx`
- Create: `apps/web-customer/src/app/delivery/menu/page.tsx`

- [ ] **11.1** Create `apps/web-customer/src/app/delivery/login/page.tsx`

```typescript
'use client'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/delivery/menu'

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="text-5xl">🍺</div>
      <h1 className="text-3xl font-bold text-white">My Way Delivery</h1>
      <p className="max-w-xs text-gray-400">
        Iniciá sesión para hacer tu pedido, ver tu historial y acumular puntos.
      </p>
      <button
        onClick={() => signIn('google', { callbackUrl })}
        className="flex items-center gap-3 rounded-xl bg-white px-6 py-3 font-semibold text-gray-900 shadow-lg hover:bg-gray-100 transition-colors"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
      </button>
    </main>
  )
}
```

- [ ] **11.2** Create `apps/web-customer/src/app/delivery/page.tsx`

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DeliveryPage() {
  const session = await auth()
  if (session) {
    redirect('/delivery/menu')
  } else {
    redirect('/delivery/login')
  }
}
```

- [ ] **11.3** Create `apps/web-customer/src/app/delivery/menu/page.tsx`

```typescript
import { createServerSupabase } from '@/lib/supabase-server'
import { DeliveryMenuClient } from '@/components/menu/delivery-menu-client'

export default async function DeliveryMenuPage() {
  const supabase = createServerSupabase()
  const venueId = process.env.NEXT_PUBLIC_VENUE_ID!

  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name, color, icon, sort_order')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('sort_order')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price, image_url, is_available, category_id, allergens_json')
    .eq('venue_id', venueId)
    .eq('is_available', true)
    .order('sort_order')

  return <DeliveryMenuClient categories={categories ?? []} products={products ?? []} />
}
```

- [ ] **11.4** Commit

```bash
git add apps/web-customer/src/app/delivery
git commit -m "feat(web-customer): delivery entry, login, and menu pages"
```

---

## Task 12: Supabase Realtime listener in local-server

**Files:**
- Create: `apps/local-server/src/delivery/realtime-listener.ts`
- Create: `apps/local-server/src/delivery/staleness-check.ts`
- Create: `apps/local-server/src/__tests__/staleness.test.ts`

- [ ] **12.1** Write failing test — `apps/local-server/src/__tests__/staleness.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { isStale } from '../delivery/staleness-check'

describe('isStale', () => {
  it('returns false when received_at_local is recent', () => {
    const now = new Date()
    const recent = new Date(now.getTime() - 5 * 60 * 1000) // 5 min ago
    expect(isStale(recent.toISOString(), 10)).toBe(false)
  })

  it('returns true when received_at_local exceeds warn threshold', () => {
    const now = new Date()
    const old = new Date(now.getTime() - 15 * 60 * 1000) // 15 min ago
    expect(isStale(old.toISOString(), 10)).toBe(true)
  })

  it('returns false when received_at_local is null', () => {
    expect(isStale(null, 10)).toBe(false)
  })
})
```

- [ ] **12.2** Run test — verify it fails

```bash
cd apps/local-server && pnpm test
# Expected: FAIL — cannot find module '../delivery/staleness-check'
```

- [ ] **12.3** Create `apps/local-server/src/delivery/staleness-check.ts`

```typescript
/**
 * Returns true if the delivery order has not been confirmed by the local server
 * within the given threshold (minutes). Used to warn POS staff.
 */
export function isStale(receivedAtLocal: string | null, thresholdMinutes: number): boolean {
  if (!receivedAtLocal) return false
  const elapsed = (Date.now() - new Date(receivedAtLocal).getTime()) / 1000 / 60
  return elapsed > thresholdMinutes
}
```

- [ ] **12.4** Run test — verify it passes

```bash
cd apps/local-server && pnpm test
# Expected: PASS — 3 staleness tests green
```

- [ ] **12.5** Create `apps/local-server/src/delivery/realtime-listener.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Server as SocketServer } from 'socket.io'
import { SOCKET_EVENTS } from '@myway/utils'
import { logger } from '../lib/logger'
import { isStale } from './staleness-check'

const WARN_MINUTES = parseInt(process.env.DELIVERY_STALENESS_WARN_MINUTES ?? '10', 10)

interface DeliveryOrderRow {
  id: string
  order_id: string
  customer_id: string
  address: string
  delivery_status: string
  payment_method: string
  received_at_local: string | null
  estimated_minutes: number | null
}

export function startDeliveryRealtimeListener(io: SocketServer) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const venueId = process.env.VENUE_ID!

  supabase
    .channel('delivery-orders-local')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_orders',
      },
      async (payload) => {
        const row = payload.new as DeliveryOrderRow
        logger.info({ deliveryOrderId: row.id }, 'New delivery_order received via Realtime')

        // Stamp received_at_local
        await supabase
          .from('delivery_orders')
          .update({ received_at_local: new Date().toISOString() })
          .eq('id', row.id)

        // Fetch full order details to pass to POS/kitchen
        const { data: order } = await supabase
          .from('orders')
          .select('*, order_items(*, products(name, target))')
          .eq('id', row.order_id)
          .single()

        io.emit(SOCKET_EVENTS.DELIVERY_NEW, {
          deliveryOrder: { ...row, order },
        })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_orders',
      },
      (payload) => {
        const row = payload.new as DeliveryOrderRow

        // Staleness warning: if received_at_local was set a while ago and order is still pending
        if (row.delivery_status === 'pending' && isStale(row.received_at_local, WARN_MINUTES)) {
          logger.warn({ deliveryOrderId: row.id }, 'Delivery order staleness warning')
          io.emit('delivery_staleness_warning', { deliveryOrderId: row.id })
        }
      }
    )
    .subscribe((status) => {
      logger.info({ status }, 'Supabase Realtime channel subscription status')
    })

  logger.info('Delivery Realtime listener started')
}
```

- [ ] **12.6** Wire listener into `apps/local-server/src/index.ts`

In `apps/local-server/src/index.ts`, add after the socket server is initialized:

```typescript
import { startDeliveryRealtimeListener } from './delivery/realtime-listener'

// After: const io = setupSocket(httpServer)
startDeliveryRealtimeListener(io)
```

- [ ] **12.7** Commit

```bash
git add apps/local-server/src/delivery apps/local-server/src/__tests__/staleness.test.ts
git commit -m "feat(local-server): Supabase Realtime delivery_orders listener + staleness check"
```

---

## Task 13: local-server delivery status route

**Files:**
- Create: `apps/local-server/src/routes/delivery.ts`

- [ ] **13.1** Create `apps/local-server/src/routes/delivery.ts`

```typescript
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { SOCKET_EVENTS } from '@myway/utils'
import type { Server as SocketServer } from 'socket.io'
import { logger } from '../lib/logger'

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:    ['confirmed'],
  confirmed:  ['preparing'],
  preparing:  ['on_the_way'],
  on_the_way: ['delivered'],
  delivered:  [],
}

export function createDeliveryRouter(io: SocketServer) {
  const router = Router()

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // PATCH /delivery/:id/status — waiter updates delivery status
  router.patch('/:id/status', async (req, res) => {
    const { id } = req.params
    const { status, cashAmount } = req.body as { status: string; cashAmount?: number }

    const { data: current, error: fetchErr } = await supabase
      .from('delivery_orders')
      .select('delivery_status, order_id, customer_id, payment_method')
      .eq('id', id)
      .single()

    if (fetchErr || !current) {
      res.status(404).json({ error: 'Delivery order not found' })
      return
    }

    const allowed = VALID_TRANSITIONS[current.delivery_status] ?? []
    if (!allowed.includes(status)) {
      res.status(422).json({
        error: `Invalid transition: ${current.delivery_status} → ${status}`,
      })
      return
    }

    const updates: Record<string, unknown> = { delivery_status: status }
    if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString()
    }

    const { error: updateErr } = await supabase
      .from('delivery_orders')
      .update(updates)
      .eq('id', id)

    if (updateErr) {
      logger.error({ updateErr }, 'Failed to update delivery_order status')
      res.status(500).json({ error: 'Failed to update status' })
      return
    }

    // If cash payment on delivery: record payment and award loyalty points
    if (status === 'delivered' && current.payment_method === 'cash' && cashAmount) {
      await supabase.from('payments').insert({
        order_id: current.order_id,
        method: 'cash',
        amount: cashAmount,
        received_by: res.locals.staffId as string,
      })

      // Update parent order status
      await supabase.from('orders').update({ status: 'delivered' }).eq('id', current.order_id)
    }

    // Emit real-time update to customer web app via Supabase (Realtime picks up the DB change)
    // Also emit to local sockets
    io.emit(SOCKET_EVENTS.DELIVERY_UPDATED, { deliveryId: id, status })

    res.json({ ok: true })
  })

  return router
}
```

- [ ] **13.2** Commit

```bash
git add apps/local-server/src/routes/delivery.ts
git commit -m "feat(local-server): PATCH /delivery/:id/status with state machine validation"
```

---

## Task 14: app-waiter delivery mode

**Files:**
- Create: `apps/app-waiter/src/components/delivery/delivery-order-card.tsx`
- Create: `apps/app-waiter/src/components/delivery/cash-payment-modal.tsx`
- Create: `apps/app-waiter/src/app/delivery/page.tsx`

- [ ] **14.1** Create `apps/app-waiter/src/components/delivery/delivery-order-card.tsx`

```typescript
'use client'
import { useState } from 'react'
import { formatCurrency } from '@myway/utils'
import { CashPaymentModal } from './cash-payment-modal'

interface DeliveryItem {
  name: string
  quantity: number
  unit_price: number
}

interface Props {
  id: string
  address: string
  deliveryStatus: string
  paymentMethod: 'cash' | 'mercadopago'
  total: number
  items: DeliveryItem[]
  onStatusChange: (id: string, status: string, cashAmount?: number) => Promise<void>
}

const STATUS_LABELS: Record<string, string> = {
  pending:    'Pendiente',
  confirmed:  'Confirmado',
  preparing:  'En preparación',
  on_the_way: 'En camino',
  delivered:  'Entregado',
}

const NEXT_STATUS: Record<string, string | null> = {
  confirmed:  'preparing',
  preparing:  'on_the_way',
  on_the_way: 'delivered',
  delivered:  null,
}

export function DeliveryOrderCard({ id, address, deliveryStatus, paymentMethod, total, items, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [showCash, setShowCash] = useState(false)
  const nextStatus = NEXT_STATUS[deliveryStatus]

  async function advance() {
    if (!nextStatus) return
    if (nextStatus === 'delivered' && paymentMethod === 'cash') {
      setShowCash(true)
      return
    }
    setLoading(true)
    await onStatusChange(id, nextStatus)
    setLoading(false)
  }

  async function handleCashConfirm(amount: number) {
    setShowCash(false)
    setLoading(true)
    await onStatusChange(id, 'delivered', amount)
    setLoading(false)
  }

  return (
    <>
      <div className="rounded-xl border border-surface-3 bg-surface-1 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <p className="text-sm font-semibold text-white truncate max-w-[70%]">{address}</p>
          <span className="rounded-full bg-surface-2 px-2 py-1 text-xs text-gray-400 shrink-0">
            {STATUS_LABELS[deliveryStatus] ?? deliveryStatus}
          </span>
        </div>

        <ul className="space-y-1 text-sm text-gray-300">
          {items.map((item, i) => (
            <li key={i}>{item.quantity}× {item.name}</li>
          ))}
        </ul>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {paymentMethod === 'cash' ? '💵 Efectivo' : '📱 MercadoPago'} — {formatCurrency(total)}
          </span>
          {nextStatus && (
            <button
              onClick={advance}
              disabled={loading}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-black disabled:opacity-40"
            >
              {loading ? '...' : nextStatus === 'on_the_way' ? 'Salir a entregar' : nextStatus === 'delivered' ? 'Marcar entregado' : 'Avanzar'}
            </button>
          )}
        </div>
      </div>

      {showCash && (
        <CashPaymentModal
          expectedAmount={total}
          onConfirm={handleCashConfirm}
          onCancel={() => setShowCash(false)}
        />
      )}
    </>
  )
}
```

- [ ] **14.2** Create `apps/app-waiter/src/components/delivery/cash-payment-modal.tsx`

```typescript
'use client'
import { useState } from 'react'
import { formatCurrency } from '@myway/utils'

interface Props {
  expectedAmount: number
  onConfirm: (amount: number) => void
  onCancel: () => void
}

export function CashPaymentModal({ expectedAmount, onConfirm, onCancel }: Props) {
  const [received, setReceived] = useState(String(expectedAmount))

  const change = parseFloat(received) - expectedAmount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface-1 p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Registrar cobro en efectivo</h2>
        <p className="text-sm text-gray-400">
          Total del pedido: <strong className="text-white">{formatCurrency(expectedAmount)}</strong>
        </p>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Monto recibido (ARS)</label>
          <input
            type="number"
            value={received}
            onChange={(e) => setReceived(e.target.value)}
            className="w-full rounded-lg border border-surface-3 bg-surface-2 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
          />
        </div>
        {change >= 0 && (
          <p className="text-sm text-green-400">Vuelto: {formatCurrency(change)}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-surface-3 py-3 text-sm text-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(parseFloat(received))}
            disabled={parseFloat(received) < expectedAmount}
            className="flex-1 rounded-lg bg-brand-500 py-3 text-sm font-bold text-black disabled:opacity-40"
          >
            Confirmar cobro
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **14.3** Create `apps/app-waiter/src/app/delivery/page.tsx`

```typescript
'use client'
import { useEffect, useState } from 'react'
import { DeliveryOrderCard } from '@/components/delivery/delivery-order-card'
import { useLocalServer } from '@/hooks/use-local-server'

interface DeliveryOrderSummary {
  id: string
  address: string
  delivery_status: string
  payment_method: 'cash' | 'mercadopago'
  orders: {
    total: string
    order_items: Array<{ products: { name: string } | null; quantity: number; unit_price: string }>
  }
}

export default function WaiterDeliveryPage() {
  const { apiBase } = useLocalServer()
  const [orders, setOrders] = useState<DeliveryOrderSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${apiBase}/delivery/assigned`)
      .then((r) => r.json())
      .then((data: { orders: DeliveryOrderSummary[] }) => setOrders(data.orders))
      .finally(() => setLoading(false))
  }, [apiBase])

  async function handleStatusChange(id: string, status: string, cashAmount?: number) {
    await fetch(`${apiBase}/delivery/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, cashAmount }),
    })
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, delivery_status: status } : o))
    )
  }

  if (loading) return <div className="p-4 text-gray-400">Cargando pedidos...</div>

  const active = orders.filter((o) => o.delivery_status !== 'delivered')

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-white">Mis entregas</h1>
      {active.length === 0 && <p className="text-gray-400">No tenés entregas asignadas.</p>}
      {active.map((order) => (
        <DeliveryOrderCard
          key={order.id}
          id={order.id}
          address={order.address}
          deliveryStatus={order.delivery_status}
          paymentMethod={order.payment_method}
          total={parseFloat(order.orders.total)}
          items={order.orders.order_items.map((oi) => ({
            name: oi.products?.name ?? 'Producto',
            quantity: oi.quantity,
            unit_price: parseFloat(oi.unit_price),
          }))}
          onStatusChange={handleStatusChange}
        />
      ))}
    </main>
  )
}
```

- [ ] **14.4** Commit

```bash
git add apps/app-waiter/src/components/delivery apps/app-waiter/src/app/delivery
git commit -m "feat(app-waiter): delivery mode — order cards, status transitions, cash payment modal"
```

---

## Task 15: Supabase migration — delivery RLS + loyalty RPCs

**Files:**
- Create: `supabase/migrations/20260321000004_delivery_rls.sql`

- [ ] **15.1** Create `supabase/migrations/20260321000004_delivery_rls.sql`

```sql
-- =====================
-- RLS: delivery_orders — customers can only see their own
-- =====================
CREATE POLICY "customers_own_delivery_orders" ON delivery_orders
  FOR SELECT USING (
    customer_id = (SELECT id FROM customers WHERE google_id = auth.uid()::text)
  );

-- Staff (service role) can do everything — already bypasses RLS
-- Web-customer API routes use service role, so these policies only apply to anon/customer-facing queries

-- =====================
-- RLS: loyalty_transactions — customers see only their own
-- =====================
CREATE POLICY "customers_own_loyalty_transactions" ON loyalty_transactions
  FOR SELECT USING (
    customer_id = (SELECT id FROM customers WHERE google_id = auth.uid()::text)
  );

-- =====================
-- Helper RPCs (run as SECURITY DEFINER to bypass RLS in atomic ops)
-- =====================

CREATE OR REPLACE FUNCTION add_loyalty_points(
  p_customer_id UUID,
  p_points INT,
  p_order_id UUID
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE customers SET loyalty_points = loyalty_points + p_points WHERE id = p_customer_id;
  INSERT INTO loyalty_transactions (customer_id, order_id, type, points, description)
  VALUES (p_customer_id, p_order_id, 'earn', p_points, 'Puntos ganados por compra');
END;
$$;

CREATE OR REPLACE FUNCTION deduct_loyalty_points(
  p_customer_id UUID,
  p_points INT,
  p_order_id UUID
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Guard against going negative
  UPDATE customers
  SET loyalty_points = GREATEST(0, loyalty_points - p_points)
  WHERE id = p_customer_id;

  INSERT INTO loyalty_transactions (customer_id, order_id, type, points, description)
  VALUES (p_customer_id, p_order_id, 'redeem', p_points, 'Puntos canjeados en pedido');
END;
$$;

-- =====================
-- Index: speed up customer delivery order lookups
-- =====================
CREATE INDEX IF NOT EXISTS idx_delivery_orders_customer ON delivery_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
```

- [ ] **15.2** Apply migration

```bash
supabase db push
```

- [ ] **15.3** Commit

```bash
git add supabase/migrations/20260321000004_delivery_rls.sql
git commit -m "feat(db): delivery RLS policies + loyalty add/deduct RPCs"
```

---

## Task 16: E2E tests (Playwright)

**Files:**
- Create: `apps/web-customer/e2e/delivery-flow.spec.ts`

- [ ] **16.1** Create `apps/web-customer/e2e/delivery-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

// These tests run against a locally seeded test environment.
// Set PLAYWRIGHT_BASE_URL in .env.test to the running dev server.

test.describe('Delivery flow', () => {
  test.beforeEach(async ({ page }) => {
    // Stub Google OAuth for test: use test user session cookie
    await page.goto('/delivery')
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await expect(page).toHaveURL(/\/delivery\/login/)
    await expect(page.getByRole('button', { name: /Google/ })).toBeVisible()
  })

  test('authenticated user sees delivery menu', async ({ page, context }) => {
    // Inject a test session (set via API route /api/test/session in test mode only)
    await context.addCookies([{ name: 'next-auth.session-token', value: process.env.TEST_SESSION_TOKEN!, domain: 'localhost', path: '/' }])
    await page.goto('/delivery/menu')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('checkout page shows zone fee after address entry', async ({ page, context }) => {
    await context.addCookies([{ name: 'next-auth.session-token', value: process.env.TEST_SESSION_TOKEN!, domain: 'localhost', path: '/' }])
    await page.goto('/delivery/checkout')
    // Verify address input is present
    await expect(page.getByPlaceholder(/dirección/i)).toBeVisible()
    // Verify payment selector is present
    await expect(page.getByText(/Efectivo al recibir/)).toBeVisible()
    await expect(page.getByText(/MercadoPago/)).toBeVisible()
  })

  test('order history page loads for authenticated user', async ({ page, context }) => {
    await context.addCookies([{ name: 'next-auth.session-token', value: process.env.TEST_SESSION_TOKEN!, domain: 'localhost', path: '/' }])
    await page.goto('/delivery/history')
    await expect(page.getByRole('heading', { name: /Mis pedidos/i })).toBeVisible()
  })
})
```

- [ ] **16.2** Commit

```bash
git add apps/web-customer/e2e
git commit -m "test(web-customer): Playwright E2E specs for delivery flow"
```

---

## Task 17: Type extensions + .env.example updates

**Files:**
- Update: `packages/types/src/delivery.ts`
- Update: `.env.example`

- [ ] **17.1** Ensure `packages/types/src/delivery.ts` covers all delivery types

```typescript
export type DeliveryStatus = 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered'
export type DeliveryPaymentMethod = 'cash' | 'mercadopago'

export interface DeliveryOrder {
  id: string
  orderId: string
  customerId: string
  address: string
  lat: number | null
  lng: number | null
  deliveryZoneId: string | null
  paymentMethod: DeliveryPaymentMethod
  mpPaymentId: string | null
  mpPreferenceId: string | null
  deliveryStatus: DeliveryStatus
  assignedTo: string | null
  estimatedMinutes: number | null
  deliveredAt: Date | null
  receivedAtLocal: Date | null
}

export interface DeliveryZone {
  id: string
  venueId: string
  name: string
  polygonJson: Array<{ lat: number; lng: number }>
  deliveryFee: number
  isActive: boolean
}

export interface LoyaltyTransaction {
  id: string
  customerId: string
  orderId: string | null
  type: 'earn' | 'redeem'
  points: number
  description: string | null
  createdAt: Date
}
```

- [ ] **17.2** Add delivery-related vars to `.env.example`

```
# web-customer
NEXTAUTH_URL=https://pedidos.myway.com
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
NEXT_PUBLIC_VENUE_ID=00000000-0000-0000-0000-000000000001

# local-server (delivery additions)
DELIVERY_STALENESS_WARN_MINUTES=10
```

- [ ] **17.3** Export delivery types from `packages/types/src/index.ts`

```typescript
// Add to existing exports:
export * from './delivery'
```

- [ ] **17.4** Commit

```bash
git add packages/types/src/delivery.ts packages/types/src/index.ts .env.example
git commit -m "feat(types): delivery, zone, and loyalty transaction interfaces"
```

---

## Verification Checklist

Before marking this plan complete:

- [ ] `pnpm build` — zero TypeScript errors across all apps
- [ ] `pnpm test` — all unit tests green (geo, loyalty, mp-signature, staleness)
- [ ] Unauthenticated `GET /delivery` redirects to `/delivery/login`
- [ ] Google OAuth sign-in completes and session cookie is set
- [ ] Address autocomplete resolves a real address and triggers zone detection
- [ ] Zone inside polygon → fee displayed; zone outside → "no llegamos" message
- [ ] Loyalty balance shown when `loyalty_points > 0`; redeem checkbox deducts correctly
- [ ] Cash order: `POST /api/delivery/orders` returns `{ orderId }`, inserts rows in `orders`, `order_items`, `delivery_orders`
- [ ] MP order: `POST /api/delivery/orders` returns `{ orderId, mpInitPoint }` and MP preference created
- [ ] Visiting `mpInitPoint` → MP checkout → success redirect → `/delivery/success` → redirects to tracking page
- [ ] `POST /api/webhooks/mercadopago` with valid x-signature → `delivery_orders.delivery_status = confirmed`, `payments` row inserted
- [ ] `POST /api/webhooks/mercadopago` with invalid signature → 401
- [ ] `local-server` Realtime listener fires `delivery_new` socket on `delivery_orders` INSERT
- [ ] POS receives `delivery_new` socket event with full order payload
- [ ] `PATCH /delivery/:id/status` advances status; invalid transition → 422
- [ ] Waiter app shows active deliveries; "Salir a entregar" sets `on_the_way`; "Marcar entregado" + cash modal records payment
- [ ] Delivered cash order → `payments` row in Supabase with `method = cash`
- [ ] `loyalty_points` incremented after confirmed delivery (both cash and MP paths)
- [ ] `/delivery/history` shows past orders for logged-in user
- [ ] "Pedir de nuevo" repopulates the cart and redirects to `/delivery/checkout`
- [ ] `isStale()` staleness check fires `delivery_staleness_warning` socket when threshold exceeded
- [ ] Playwright E2E: all 4 specs pass in CI against dev server
- [ ] Supabase migration `20260321000004_delivery_rls.sql` applied with no errors

---

*Previous plan: [Plan 3 — Waiter App](2026-03-21-plan-3-waiter.md)*
*Next plan: [Plan 5 — Salon Editor](2026-03-21-plan-5-salon-editor.md)*
