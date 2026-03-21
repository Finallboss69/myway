# My Way — Plan 0: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the complete Turborepo monorepo with all shared packages, Supabase project, Prisma schema, and a working local-server with SQLite — the foundation every other plan depends on.

**Architecture:** Turborepo monorepo with pnpm workspaces. Shared packages (ui, types, db, sync-engine, auth, config, utils) consumed by all apps. Supabase for cloud PostgreSQL + Realtime + Auth. local-server runs Node.js + Express + SQLite via Prisma on the bar's PC.

**Tech Stack:** Turborepo, pnpm, Next.js 15, TypeScript 5, Tailwind v4, shadcn/ui, Prisma 5, Supabase, SQLite (better-sqlite3), Node.js 22, Express 5, Socket.io 4, Vitest

---

## File Map

```
myway/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
├── .env.example
│
├── packages/
│   ├── config/
│   │   ├── package.json
│   │   ├── tailwind.config.ts        # Shared Tailwind config (dark premium theme)
│   │   ├── tsconfig.base.json        # Base TS config
│   │   └── eslint.config.js          # Shared ESLint config
│   │
│   ├── types/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── venue.ts
│   │       ├── table.ts
│   │       ├── order.ts
│   │       ├── product.ts
│   │       ├── staff.ts
│   │       ├── customer.ts
│   │       ├── delivery.ts
│   │       ├── payment.ts
│   │       ├── ingredient.ts
│   │       └── sync.ts
│   │
│   ├── db/
│   │   ├── package.json
│   │   ├── prisma/
│   │   │   └── schema.prisma         # Complete schema (cloud + local)
│   │   └── src/
│   │       ├── index.ts              # Exports client + all helpers
│   │       ├── client.ts             # Prisma client singleton
│   │       └── migrations/           # Custom SQL migrations for SQLite quirks
│   │
│   ├── utils/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── qr.ts                 # QR token sign/verify (HMAC-SHA256)
│   │       ├── format.ts             # Currency, date formatters
│   │       └── constants.ts          # Shared app constants
│   │
│   ├── auth/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── supabase-server.ts    # Supabase server client helper
│   │       ├── supabase-client.ts    # Supabase browser client helper
│   │       └── roles.ts              # Role permission matrix
│   │
│   └── ui/
│       ├── package.json
│       └── src/
│           ├── index.ts
│           ├── components/
│           │   ├── button.tsx
│           │   ├── card.tsx
│           │   ├── badge.tsx
│           │   ├── input.tsx
│           │   ├── dialog.tsx
│           │   ├── table.tsx
│           │   └── offline-banner.tsx
│           └── styles/
│               └── globals.css       # Tailwind base + dark premium theme vars
│
├── apps/
│   └── local-server/
│       ├── package.json
│       ├── src/
│       │   ├── index.ts              # Entry: start Express + Socket.io
│       │   ├── server.ts             # Express app factory
│       │   ├── socket.ts             # Socket.io server setup + event handlers
│       │   ├── routes/
│       │   │   └── health.ts         # GET /health
│       │   ├── middleware/
│       │   │   ├── auth.ts           # JWT verify (with JWKS cache)
│       │   │   └── rate-limit.ts     # 100 req/min per IP
│       │   └── lib/
│       │       ├── jwks-cache.ts     # JWKS fetch + disk cache + offline fallback
│       │       └── logger.ts         # Pino logger
│       └── scripts/
│           └── setup.ts              # npm run setup: init DB, create first admin
│
└── supabase/
    ├── config.toml
    ├── migrations/
    │   └── 20260321000000_initial.sql
    └── seed.sql
```

---

## Task 1: Initialize the monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`

- [ ] **1.1** Initialize pnpm + create root package.json

```bash
cd /workspace/myway
pnpm init
```

Edit `package.json`:
```json
{
  "name": "myway",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **1.2** Create `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **1.3** Create `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": { "dependsOn": ["^lint"] },
    "test": { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^type-check"] }
  }
}
```

- [ ] **1.4** Create `.gitignore`

```
node_modules/
.next/
dist/
.env
.env.local
*.db
*.db-shm
*.db-wal
.turbo/
```

- [ ] **1.5** Install Turborepo

```bash
pnpm install
```

- [ ] **1.6** Commit

```bash
git add .
git commit -m "chore: initialize turborepo monorepo with pnpm workspaces"
```

---

## Task 2: Package `config` — shared TS, ESLint, Tailwind

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.base.json`
- Create: `packages/config/eslint.config.js`
- Create: `packages/config/tailwind.config.ts`

- [ ] **2.1** Create `packages/config/package.json`

```json
{
  "name": "@myway/config",
  "version": "0.0.1",
  "private": true,
  "exports": {
    "./tailwind": "./tailwind.config.ts",
    "./tsconfig": "./tsconfig.base.json",
    "./eslint": "./eslint.config.js"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0"
  }
}
```

- [ ] **2.2** Create `packages/config/tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "isolatedModules": true
  }
}
```

- [ ] **2.3** Create `packages/config/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // My Way dark premium palette
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',  // gold accent
          600: '#d97706',
          900: '#78350f',
        },
        surface: {
          0:   '#0a0a0a',  // deepest bg
          1:   '#111111',  // card bg
          2:   '#1a1a1a',  // elevated
          3:   '#222222',  // border
          4:   '#2d2d2d',  // subtle border
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
export default config
```

- [ ] **2.4** Commit

```bash
git add packages/config
git commit -m "chore: add shared config package (ts, eslint, tailwind dark theme)"
```

---

## Task 3: Package `types` — shared TypeScript interfaces

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/src/index.ts` + all entity type files

- [ ] **3.1** Create `packages/types/package.json`

```json
{
  "name": "@myway/types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@myway/config": "workspace:*"
  }
}
```

- [ ] **3.2** Create `packages/types/src/order.ts`

```typescript
export type OrderType = 'table' | 'delivery'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type OrderItemStatus = OrderStatus
export type OrderItemTarget = 'kitchen' | 'bar'

export interface Order {
  id: string
  venueId: string
  type: OrderType
  status: OrderStatus
  tableSessionId: string | null
  customerId: string | null
  total: number
  discountAmount: number
  discountReason: string | null
  createdBy: string | null
  synced: boolean
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: number
  notes: string | null
  modifiersJson: Record<string, unknown> | null
  status: OrderItemStatus
  target: OrderItemTarget
  station: string | null
  synced: boolean
  createdAt: Date
  updatedAt: Date
}
```

- [ ] **3.3** Create `packages/types/src/table.ts`

```typescript
export type TableType = 'bar' | 'pool'
export type TableStatus = 'available' | 'occupied' | 'reserved'
export type TableSessionStatus = 'open' | 'closed' | 'paid'

export interface Table {
  id: string
  venueId: string
  zoneId: string
  number: number
  type: TableType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  seats: number
  status: TableStatus
  mergedIntoId: string | null
  synced: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Zone {
  id: string
  venueId: string
  name: string
  order: number
}

export interface TableSession {
  id: string
  tableId: string
  openedBy: string
  openedAt: Date
  closedAt: Date | null
  closedBy: string | null
  status: TableSessionStatus
  notes: string | null
  synced: boolean
}
```

- [ ] **3.4** Create `packages/types/src/product.ts`

```typescript
export type ProductTarget = 'kitchen' | 'bar'

export interface Product {
  id: string
  venueId: string
  categoryId: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  isPoolChip: boolean
  target: ProductTarget
  station: string | null
  sortOrder: number
  stockCount: number | null
  stockAlertThreshold: number | null
  allergensJson: string[] | null
  createdAt: Date
  updatedAt: Date
}

export interface ProductCategory {
  id: string
  venueId: string
  name: string
  color: string
  icon: string
  sortOrder: number
  isActive: boolean
}
```

- [ ] **3.5** Create `packages/types/src/staff.ts`

```typescript
export type StaffRole = 'superadmin' | 'admin' | 'cashier' | 'waiter' | 'kitchen' | 'bar'

export interface Staff {
  id: string
  venueId: string
  name: string
  email: string
  role: StaffRole
  isActive: boolean
  failedPinAttempts: number
  lockedUntil: Date | null
  lastLoginAt: Date | null
  createdAt: Date
}
```

- [ ] **3.6** Create `packages/types/src/payment.ts`

```typescript
export type PaymentMethod = 'cash' | 'mercadopago_qr' | 'mercadopago_online' | 'card' | 'transfer'

export interface Payment {
  id: string
  tableSessionId: string | null
  orderId: string | null
  method: PaymentMethod
  amount: number
  mpPaymentId: string | null
  receivedBy: string | null
  createdAt: Date
}
```

- [ ] **3.7** Create `packages/types/src/sync.ts`

```typescript
export type SyncStatus = 'success' | 'partial' | 'failed'

export interface SyncLog {
  id: string
  startedAt: Date
  finishedAt: Date | null
  status: SyncStatus
  recordsPushed: number
  recordsPulled: number
  errorMessage: string | null
}

export interface SyncState {
  id: number
  lastSyncAt: Date | null
  lastSuccessfulSyncAt: Date | null
}

// Socket event payloads
export interface SocketNewOrder { order: import('./order').Order }
export interface SocketItemReady { itemId: string; tableId: string }
export interface SocketTableStatus { tableId: string; status: import('./table').TableStatus }
export interface SocketMpPaymentConfirmed { paymentId: string; amount: number }
export interface SocketSyncStatus { status: SyncStatus; lastSync: Date | null }
```

- [ ] **3.8** Create `packages/types/src/ingredient.ts`

```typescript
export type IngredientUnit = 'ml' | 'gr' | 'units'
export type StockMovementType = 'purchase' | 'sale' | 'waste' | 'adjustment'

export interface Ingredient {
  id: string
  venueId: string
  name: string
  unit: IngredientUnit
  stockCurrent: number
  stockAlertThreshold: number
  costPerUnit: number
  createdAt: Date
  updatedAt: Date
}

export interface RecipeItem {
  id: string
  recipeId: string
  ingredientId: string
  quantity: number
}
```

- [ ] **3.9** Create `packages/types/src/index.ts`

```typescript
export * from './order'
export * from './table'
export * from './product'
export * from './staff'
export * from './payment'
export * from './sync'
export * from './ingredient'
```

- [ ] **3.10** Commit

```bash
git add packages/types
git commit -m "feat(types): add all shared TypeScript interfaces"
```

---

## Task 4: Supabase project setup + schema

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20260321000000_initial.sql`
- Create: `supabase/seed.sql`

- [ ] **4.1** Install Supabase CLI

```bash
pnpm add -g supabase
```

- [ ] **4.2** Initialize Supabase

```bash
cd /workspace/myway
supabase init
```

- [ ] **4.3** Create the initial migration — `supabase/migrations/20260321000000_initial.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Venues
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  logo_url TEXT,
  settings_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zones
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id),
  number INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bar','pool')),
  x FLOAT NOT NULL DEFAULT 0,
  y FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 100,
  height FLOAT NOT NULL DEFAULT 60,
  rotation FLOAT NOT NULL DEFAULT 0,
  seats INT NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','reserved')),
  merged_into_id UUID REFERENCES tables(id),
  synced BOOLEAN NOT NULL DEFAULT false,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, number)
);

-- Layout snapshots
CREATE TABLE layout_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  snapshot_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product categories
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#f59e0b',
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES product_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_pool_chip BOOLEAN NOT NULL DEFAULT false,
  target TEXT NOT NULL CHECK (target IN ('kitchen','bar')),
  station TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  stock_count INT,
  stock_alert_threshold INT,
  allergens_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product modifiers
CREATE TABLE product_modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  options_json JSONB NOT NULL DEFAULT '[]',
  is_required BOOLEAN NOT NULL DEFAULT false,
  max_selections INT NOT NULL DEFAULT 1
);

-- Product combos
CREATE TABLE product_combos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  items_json JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Happy hours
CREATE TABLE happy_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INT[] NOT NULL DEFAULT '{1,2,3,4,5}',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Staff
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('superadmin','admin','cashier','waiter','kitchen','bar')),
  pin_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  failed_pin_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  loyalty_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty transactions
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_id UUID,
  type TEXT NOT NULL CHECK (type IN ('earn','redeem')),
  points INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR codes
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES staff(id),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Table sessions
CREATE TABLE table_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id),
  opened_by UUID REFERENCES staff(id),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES staff(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','paid')),
  notes TEXT,
  synced BOOLEAN NOT NULL DEFAULT false,
  synced_at TIMESTAMPTZ
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  type TEXT NOT NULL CHECK (type IN ('table','delivery')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','confirmed','preparing','ready','delivered','cancelled')
  ),
  table_session_id UUID REFERENCES table_sessions(id),
  customer_id UUID REFERENCES customers(id),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_reason TEXT,
  created_by UUID REFERENCES staff(id),
  synced BOOLEAN NOT NULL DEFAULT false,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  modifiers_json JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','preparing','ready','delivered','cancelled')
  ),
  target TEXT NOT NULL CHECK (target IN ('kitchen','bar')),
  station TEXT,
  synced BOOLEAN NOT NULL DEFAULT false,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery orders
CREATE TABLE delivery_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  address TEXT NOT NULL,
  lat FLOAT,
  lng FLOAT,
  delivery_zone_id UUID,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','mercadopago')),
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    delivery_status IN ('pending','confirmed','preparing','on_the_way','delivered')
  ),
  assigned_to UUID REFERENCES staff(id),
  estimated_minutes INT,
  delivered_at TIMESTAMPTZ,
  received_at_local TIMESTAMPTZ
);

-- Delivery zones
CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  name TEXT NOT NULL,
  polygon_json JSONB NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_session_id UUID REFERENCES table_sessions(id),
  order_id UUID REFERENCES orders(id),
  method TEXT NOT NULL CHECK (method IN ('cash','mercadopago_qr','mercadopago_online','card','transfer')),
  amount DECIMAL(10,2) NOT NULL,
  mp_payment_id TEXT,
  received_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync state
CREATE TABLE sync_state (
  id INT PRIMARY KEY DEFAULT 1,
  last_sync_at TIMESTAMPTZ,
  last_successful_sync_at TIMESTAMPTZ
);
INSERT INTO sync_state (id) VALUES (1);

-- Sync log
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('success','partial','failed')),
  records_pushed INT NOT NULL DEFAULT 0,
  records_pulled INT NOT NULL DEFAULT 0,
  error_message TEXT
);

-- Cash register closes
CREATE TABLE cash_register_closes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  staff_id UUID REFERENCES staff(id),
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  closing_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cash_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_mp_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_card_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_transfer_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_discounts DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cancellations DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredients
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('ml','gr','units')),
  stock_current DECIMAL(10,3) NOT NULL DEFAULT 0,
  stock_alert_threshold DECIMAL(10,3) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe items
CREATE TABLE recipe_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  quantity DECIMAL(10,3) NOT NULL
);

-- Ingredient stock movements
CREATE TABLE ingredient_stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  type TEXT NOT NULL CHECK (type IN ('purchase','sale','waste','adjustment')),
  quantity DECIMAL(10,3) NOT NULL,
  order_item_id UUID REFERENCES order_items(id),
  notes TEXT,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily accounting snapshots
CREATE TABLE daily_accounting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  date DATE NOT NULL UNIQUE,
  revenue_food DECIMAL(10,2) NOT NULL DEFAULT 0,
  revenue_drinks DECIMAL(10,2) NOT NULL DEFAULT 0,
  revenue_cocktails DECIMAL(10,2) NOT NULL DEFAULT 0,
  revenue_pool_chips DECIMAL(10,2) NOT NULL DEFAULT 0,
  revenue_delivery DECIMAL(10,2) NOT NULL DEFAULT 0,
  revenue_other DECIMAL(10,2) NOT NULL DEFAULT 0,
  revenue_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_mp DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_card DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_transfer DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_discounts DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cancellations DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_ingredients DECIMAL(10,2) NOT NULL DEFAULT 0,
  gross_margin DECIMAL(10,2) NOT NULL DEFAULT 0,
  orders_count INT NOT NULL DEFAULT 0,
  delivery_orders_count INT NOT NULL DEFAULT 0,
  average_ticket DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff contracts
CREATE TABLE staff_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id),
  salary_type TEXT NOT NULL CHECK (salary_type IN ('monthly','hourly')),
  salary_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff advances
CREATE TABLE staff_advances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id),
  venue_id UUID NOT NULL REFERENCES venues(id),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  authorized_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff payments
CREATE TABLE staff_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id),
  venue_id UUID NOT NULL REFERENCES venues(id),
  amount DECIMAL(10,2) NOT NULL,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','transfer','mp')),
  notes TEXT,
  paid_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff shifts
CREATE TABLE staff_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id),
  venue_id UUID NOT NULL REFERENCES venues(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INT,
  notes TEXT
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier products
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  unit_cost DECIMAL(10,4),
  notes TEXT
);

-- Restock requests
CREATE TABLE restock_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  requested_by UUID REFERENCES staff(id),
  quantity_requested DECIMAL(10,3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','purchased')),
  notes TEXT,
  resolved_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Purchase orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','received','cancelled')),
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  ordered_by UUID REFERENCES staff(id),
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  received_at TIMESTAMPTZ,
  notes TEXT
);

-- Purchase order items
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  quantity_ordered DECIMAL(10,3) NOT NULL,
  quantity_received DECIMAL(10,3),
  unit_cost DECIMAL(10,4) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL
);

-- Expense categories
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  category_id UUID REFERENCES expense_categories(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('cash','transfer','mp','card')),
  receipt_url TEXT,
  registered_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waste log
CREATE TABLE waste_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  ingredient_id UUID REFERENCES ingredients(id),
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(10,3) NOT NULL,
  unit TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('expired','accident','preparation_error','other')),
  notes TEXT,
  estimated_cost DECIMAL(10,2),
  registered_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  table_id UUID REFERENCES tables(id),
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

-- Row Level Security
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_accounting ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (service role bypasses these)
-- Customer delivery: can only see their own orders
CREATE POLICY "customers_own_orders" ON orders
  FOR SELECT USING (
    customer_id = (SELECT id FROM customers WHERE google_id = auth.uid()::text)
  );

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE restock_requests;

-- Indexes for performance
CREATE INDEX idx_orders_venue_status ON orders(venue_id, status);
CREATE INDEX idx_orders_table_session ON orders(table_session_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_status_target ON order_items(status, target);
CREATE INDEX idx_order_items_synced ON order_items(synced) WHERE synced = false;
CREATE INDEX idx_orders_synced ON orders(synced) WHERE synced = false;
CREATE INDEX idx_tables_venue ON tables(venue_id);
CREATE INDEX idx_ingredient_movements_ingredient ON ingredient_stock_movements(ingredient_id);
CREATE INDEX idx_daily_accounting_date ON daily_accounting(venue_id, date);
CREATE INDEX idx_reservations_date ON reservations(venue_id, date);
```

- [ ] **4.4** Create `supabase/seed.sql` with initial venue + default data

```sql
-- Insert default venue
INSERT INTO venues (id, name, address) VALUES
  ('00000000-0000-0000-0000-000000000001', 'My Way', 'Dirección del bar');

-- Insert default zones
INSERT INTO zones (venue_id, name, "order") VALUES
  ('00000000-0000-0000-0000-000000000001', 'Salón Principal', 0),
  ('00000000-0000-0000-0000-000000000001', 'Afuera', 1);

-- Insert default expense categories
INSERT INTO expense_categories (venue_id, name, color) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Insumos', '#f59e0b'),
  ('00000000-0000-0000-0000-000000000001', 'Sueldos', '#3b82f6'),
  ('00000000-0000-0000-0000-000000000001', 'Servicios', '#8b5cf6'),
  ('00000000-0000-0000-0000-000000000001', 'Alquiler', '#ef4444'),
  ('00000000-0000-0000-0000-000000000001', 'Mantenimiento', '#10b981'),
  ('00000000-0000-0000-0000-000000000001', 'Otros', '#6b7280');
```

- [ ] **4.5** Push schema to Supabase

```bash
# 1. Create a project at https://supabase.com → New Project
# 2. Copy your Project Reference ID from: Project Settings → General → Reference ID
# 3. Copy your database password (set during project creation)
supabase link --project-ref <YOUR_PROJECT_REF>   # e.g. abcdefghijklmnop
supabase db push
# 4. To run seed: get DB URL from Project Settings → Database → Connection string (URI mode)
supabase db reset --db-url "postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres"
```

- [ ] **4.6** Commit

```bash
git add supabase/
git commit -m "feat(db): add complete Supabase schema with all tables, indexes, RLS, and seed"
```

---

## Task 5: Package `db` — Prisma schema + client

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/index.ts`

- [ ] **5.1** Create `packages/db/package.json`

```json
{
  "name": "@myway/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "generate": "prisma generate",
    "migrate:cloud": "prisma migrate deploy --schema ./prisma/schema.prisma",
    "migrate:local": "prisma migrate deploy --schema ./prisma/schema-local.prisma"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0"
  },
  "devDependencies": {
    "prisma": "^5.22.0",
    "@myway/config": "workspace:*"
  }
}
```

- [ ] **5.2** Create `packages/db/prisma/schema.prisma` (Supabase/PostgreSQL)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Venue {
  id           String   @id @default(uuid())
  name         String
  address      String?
  logoUrl      String?  @map("logo_url")
  settingsJson Json     @default("{}") @map("settings_json")
  createdAt    DateTime @default(now()) @map("created_at")

  zones     Zone[]
  tables    Table[]
  products  Product[]
  staff     Staff[]
  orders    Order[]

  @@map("venues")
}

model Zone {
  id        String   @id @default(uuid())
  venueId   String   @map("venue_id")
  name      String
  order     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")

  venue  Venue   @relation(fields: [venueId], references: [id])
  tables Table[]

  @@map("zones")
}

model Table {
  id           String      @id @default(uuid())
  venueId      String      @map("venue_id")
  zoneId       String      @map("zone_id")
  number       Int
  type         String      // 'bar' | 'pool'
  x            Float       @default(0)
  y            Float       @default(0)
  width        Float       @default(100)
  height       Float       @default(60)
  rotation     Float       @default(0)
  seats        Int         @default(4)
  status       String      @default("available")
  mergedIntoId String?     @map("merged_into_id")
  synced       Boolean     @default(false)
  syncedAt     DateTime?   @map("synced_at")
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")

  venue    Venue          @relation(fields: [venueId], references: [id])
  zone     Zone           @relation(fields: [zoneId], references: [id])
  sessions TableSession[]
  qrCodes  QrCode[]

  @@unique([venueId, number])
  @@map("tables")
}

model Order {
  id             String    @id @default(uuid())
  venueId        String    @map("venue_id")
  type           String    // 'table' | 'delivery'
  status         String    @default("pending")
  tableSessionId String?   @map("table_session_id")
  customerId     String?   @map("customer_id")
  total          Decimal   @default(0) @db.Decimal(10,2)
  discountAmount Decimal   @default(0) @map("discount_amount") @db.Decimal(10,2)
  discountReason String?   @map("discount_reason")
  createdBy      String?   @map("created_by")
  synced         Boolean   @default(false)
  syncedAt       DateTime? @map("synced_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  venue        Venue          @relation(fields: [venueId], references: [id])
  session      TableSession?  @relation(fields: [tableSessionId], references: [id])
  items        OrderItem[]
  payments     Payment[]
  deliveryInfo DeliveryOrder?

  @@map("orders")
}

model OrderItem {
  id           String    @id @default(uuid())
  orderId      String    @map("order_id")
  productId    String    @map("product_id")
  quantity     Int       @default(1)
  unitPrice    Decimal   @map("unit_price") @db.Decimal(10,2)
  notes        String?
  modifiersJson Json?    @default("{}") @map("modifiers_json")
  status       String    @default("pending")
  target       String    // 'kitchen' | 'bar'
  station      String?
  synced       Boolean   @default(false)
  syncedAt     DateTime? @map("synced_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

model TableSession {
  id        String    @id @default(uuid())
  tableId   String    @map("table_id")
  openedBy  String?   @map("opened_by")
  openedAt  DateTime  @default(now()) @map("opened_at")
  closedAt  DateTime? @map("closed_at")
  closedBy  String?   @map("closed_by")
  status    String    @default("open")
  notes     String?
  synced    Boolean   @default(false)
  syncedAt  DateTime? @map("synced_at")

  table    Table     @relation(fields: [tableId], references: [id])
  orders   Order[]
  payments Payment[]

  @@map("table_sessions")
}

model Payment {
  id             String    @id @default(uuid())
  tableSessionId String?   @map("table_session_id")
  orderId        String?   @map("order_id")
  method         String
  amount         Decimal   @db.Decimal(10,2)
  mpPaymentId    String?   @map("mp_payment_id")
  receivedBy     String?   @map("received_by")
  createdAt      DateTime  @default(now()) @map("created_at")

  session TableSession? @relation(fields: [tableSessionId], references: [id])
  order   Order?        @relation(fields: [orderId], references: [id])

  @@map("payments")
}

model Product {
  id                  String   @id @default(uuid())
  venueId             String   @map("venue_id")
  categoryId          String   @map("category_id")
  name                String
  description         String?
  price               Decimal  @db.Decimal(10,2)
  imageUrl            String?  @map("image_url")
  isAvailable         Boolean  @default(true) @map("is_available")
  isPoolChip          Boolean  @default(false) @map("is_pool_chip")
  target              String
  station             String?
  sortOrder           Int      @default(0) @map("sort_order")
  stockCount          Int?     @map("stock_count")
  stockAlertThreshold Int?     @map("stock_alert_threshold")
  allergensJson       Json?    @default("[]") @map("allergens_json")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  venue    Venue           @relation(fields: [venueId], references: [id])
  category ProductCategory @relation(fields: [categoryId], references: [id])
  items    OrderItem[]
  recipe   Recipe?

  @@map("products")
}

model ProductCategory {
  id        String   @id @default(uuid())
  venueId   String   @map("venue_id")
  name      String
  color     String   @default("#f59e0b")
  icon      String?
  sortOrder Int      @default(0) @map("sort_order")
  isActive  Boolean  @default(true) @map("is_active")
  products  Product[]

  @@map("product_categories")
}

model Staff {
  id                String    @id @default(uuid())
  venueId           String    @map("venue_id")
  name              String
  email             String    @unique
  role              String
  pinHash           String    @map("pin_hash")
  isActive          Boolean   @default(true) @map("is_active")
  failedPinAttempts Int       @default(0) @map("failed_pin_attempts")
  lockedUntil       DateTime? @map("locked_until")
  lastLoginAt       DateTime? @map("last_login_at")
  createdAt         DateTime  @default(now()) @map("created_at")

  venue Venue @relation(fields: [venueId], references: [id])

  @@map("staff")
}

model QrCode {
  id          String   @id @default(uuid())
  tableId     String   @map("table_id")
  code        String   @unique
  tokenHash   String   @map("token_hash")
  generatedAt DateTime @default(now()) @map("generated_at")
  generatedBy String?  @map("generated_by")
  imageUrl    String?  @map("image_url")
  isActive    Boolean  @default(true) @map("is_active")

  table Table @relation(fields: [tableId], references: [id])

  @@map("qr_codes")
}

model Ingredient {
  id                   String   @id @default(uuid())
  venueId              String   @map("venue_id")
  name                 String
  unit                 String   // 'ml' | 'gr' | 'units'
  stockCurrent         Decimal  @default(0) @map("stock_current") @db.Decimal(10,3)
  stockAlertThreshold  Decimal  @default(0) @map("stock_alert_threshold") @db.Decimal(10,3)
  costPerUnit          Decimal  @default(0) @map("cost_per_unit") @db.Decimal(10,4)
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  recipeItems     RecipeItem[]
  stockMovements  IngredientStockMovement[]
  supplierProducts SupplierProduct[]
  restockRequests RestockRequest[]

  @@map("ingredients")
}

model Recipe {
  id        String   @id @default(uuid())
  productId String   @unique @map("product_id")
  notes     String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  product Product    @relation(fields: [productId], references: [id])
  items   RecipeItem[]

  @@map("recipes")
}

model RecipeItem {
  id           String  @id @default(uuid())
  recipeId     String  @map("recipe_id")
  ingredientId String  @map("ingredient_id")
  quantity     Decimal @db.Decimal(10,3)

  recipe     Recipe     @relation(fields: [recipeId], references: [id])
  ingredient Ingredient @relation(fields: [ingredientId], references: [id])

  @@map("recipe_items")
}

model IngredientStockMovement {
  id           String   @id @default(uuid())
  ingredientId String   @map("ingredient_id")
  type         String   // 'purchase' | 'sale' | 'waste' | 'adjustment'
  quantity     Decimal  @db.Decimal(10,3)
  orderItemId  String?  @map("order_item_id")
  notes        String?
  createdBy    String?  @map("created_by")
  createdAt    DateTime @default(now()) @map("created_at")

  ingredient Ingredient @relation(fields: [ingredientId], references: [id])

  @@map("ingredient_stock_movements")
}

model SyncState {
  id                    Int       @id @default(1)
  lastSyncAt            DateTime? @map("last_sync_at")
  lastSuccessfulSyncAt  DateTime? @map("last_successful_sync_at")

  @@map("sync_state")
}

model SyncLog {
  id             String    @id @default(uuid())
  startedAt      DateTime  @default(now()) @map("started_at")
  finishedAt     DateTime? @map("finished_at")
  status         String?
  recordsPushed  Int       @default(0) @map("records_pushed")
  recordsPulled  Int       @default(0) @map("records_pulled")
  errorMessage   String?   @map("error_message")

  @@map("sync_log")
}

model RestockRequest {
  id                String    @id @default(uuid())
  venueId           String    @map("venue_id")
  ingredientId      String    @map("ingredient_id")
  requestedBy       String?   @map("requested_by")
  quantityRequested Decimal   @map("quantity_requested") @db.Decimal(10,3)
  status            String    @default("pending")
  notes             String?
  resolvedBy        String?   @map("resolved_by")
  createdAt         DateTime  @default(now()) @map("created_at")
  resolvedAt        DateTime? @map("resolved_at")

  ingredient Ingredient @relation(fields: [ingredientId], references: [id])

  @@map("restock_requests")
}

model Supplier {
  id          String   @id @default(uuid())
  venueId     String   @map("venue_id")
  name        String
  contactName String?  @map("contact_name")
  phone       String?
  email       String?
  notes       String?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  products       SupplierProduct[]
  purchaseOrders PurchaseOrder[]

  @@map("suppliers")
}

model SupplierProduct {
  id           String  @id @default(uuid())
  supplierId   String  @map("supplier_id")
  ingredientId String  @map("ingredient_id")
  unitCost     Decimal? @map("unit_cost") @db.Decimal(10,4)
  notes        String?

  supplier   Supplier   @relation(fields: [supplierId], references: [id])
  ingredient Ingredient @relation(fields: [ingredientId], references: [id])

  @@map("supplier_products")
}

model PurchaseOrder {
  id         String    @id @default(uuid())
  venueId    String    @map("venue_id")
  supplierId String    @map("supplier_id")
  status     String    @default("pending")
  totalCost  Decimal   @default(0) @map("total_cost") @db.Decimal(10,2)
  orderedBy  String?   @map("ordered_by")
  orderedAt  DateTime  @default(now()) @map("ordered_at")
  receivedAt DateTime? @map("received_at")
  notes      String?

  supplier Supplier        @relation(fields: [supplierId], references: [id])
  items    PurchaseOrderItem[]

  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id               String   @id @default(uuid())
  purchaseOrderId  String   @map("purchase_order_id")
  ingredientId     String   @map("ingredient_id")
  quantityOrdered  Decimal  @map("quantity_ordered") @db.Decimal(10,3)
  quantityReceived Decimal? @map("quantity_received") @db.Decimal(10,3)
  unitCost         Decimal  @map("unit_cost") @db.Decimal(10,4)
  totalCost        Decimal  @map("total_cost") @db.Decimal(10,2)

  order PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])

  @@map("purchase_order_items")
}

model Reservation {
  id           String   @id @default(uuid())
  venueId      String   @map("venue_id")
  tableId      String?  @map("table_id")
  customerName String   @map("customer_name")
  customerPhone String? @map("customer_phone")
  date         DateTime @db.Date
  time         DateTime @db.Time
  partySize    Int      @default(2) @map("party_size")
  status       String   @default("pending")
  notes        String?
  createdBy    String?  @map("created_by")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("reservations")
}
```

- [ ] **5.2b** Create `packages/db/prisma/schema-local.prisma` (SQLite — used by local-server on bar PC)

```prisma
generator clientLocal {
  provider = "prisma-client-js"
  output   = "../generated/client-local"
}

datasource db {
  provider = "sqlite"
  url      = env("LOCAL_DATABASE_URL")
}

// Only include tables that local-server reads/writes.
// Omit admin-only tables (staff_contracts, purchase_orders, etc.)

model Table {
  id           String   @id @default(uuid())
  venueId      String   @map("venue_id")
  zoneId       String   @map("zone_id")
  number       Int
  type         String
  x            Float    @default(0)
  y            Float    @default(0)
  width        Float    @default(100)
  height       Float    @default(60)
  rotation     Float    @default(0)
  seats        Int      @default(4)
  status       String   @default("available")
  mergedIntoId String?  @map("merged_into_id")
  synced       Boolean  @default(false)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  sessions TableSession[]

  @@map("tables")
}

model Zone {
  id    String @id @default(uuid())
  venueId String @map("venue_id")
  name  String
  order Int    @default(0)

  @@map("zones")
}

model TableSession {
  id       String    @id @default(uuid())
  tableId  String    @map("table_id")
  openedBy String    @map("opened_by")
  openedAt DateTime  @default(now()) @map("opened_at")
  closedAt DateTime? @map("closed_at")
  closedBy String?   @map("closed_by")
  status   String    @default("open")
  notes    String?
  synced   Boolean   @default(false)

  table  Table   @relation(fields: [tableId], references: [id])
  orders Order[]

  @@map("table_sessions")
}

model Order {
  id             String    @id @default(uuid())
  venueId        String    @map("venue_id")
  type           String
  status         String    @default("pending")
  tableSessionId String?   @map("table_session_id")
  customerId     String?   @map("customer_id")
  total          Float     @default(0)
  discountAmount Float     @default(0) @map("discount_amount")
  discountReason String?   @map("discount_reason")
  createdBy      String?   @map("created_by")
  synced         Boolean   @default(false)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  session TableSession? @relation(fields: [tableSessionId], references: [id])
  items   OrderItem[]

  @@map("orders")
}

model OrderItem {
  id          String   @id @default(uuid())
  orderId     String   @map("order_id")
  productId   String   @map("product_id")
  quantity    Int
  unitPrice   Float    @map("unit_price")
  notes       String?
  status      String   @default("pending")
  target      String
  station     String?
  synced      Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  order Order @relation(fields: [orderId], references: [id])

  @@map("order_items")
}

model Product {
  id                  String   @id @default(uuid())
  venueId             String   @map("venue_id")
  categoryId          String   @map("category_id")
  name                String
  description         String?
  price               Float
  imageUrl            String?  @map("image_url")
  isAvailable         Boolean  @default(true) @map("is_available")
  isPoolChip          Boolean  @default(false) @map("is_pool_chip")
  target              String
  station             String?
  sortOrder           Int      @default(0) @map("sort_order")
  allergensJson       String?  @map("allergens_json")
  synced              Boolean  @default(false)
  updatedAt           DateTime @updatedAt @map("updated_at")

  @@map("products")
}

model Staff {
  id                 String    @id @default(uuid())
  venueId            String    @map("venue_id")
  name               String
  email              String    @unique
  pinHash            String    @map("pin_hash")
  role               String
  isActive           Boolean   @default(true) @map("is_active")
  failedPinAttempts  Int       @default(0) @map("failed_pin_attempts")
  lockedUntil        DateTime? @map("locked_until")
  lastLoginAt        DateTime? @map("last_login_at")

  @@map("staff")
}

model Ingredient {
  id                  String  @id @default(uuid())
  venueId             String  @map("venue_id")
  name                String
  unit                String
  stockCurrent        Float   @default(0) @map("stock_current")
  stockAlertThreshold Float   @default(0) @map("stock_alert_threshold")
  costPerUnit         Float   @default(0) @map("cost_per_unit")
  synced              Boolean @default(false)

  @@map("ingredients")
}

model QrCode {
  id        String   @id @default(uuid())
  tableId   String   @map("table_id")
  venueId   String   @map("venue_id")
  token     String   @unique
  isActive  Boolean  @default(true) @map("is_active")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("qr_codes")
}

model SyncState {
  id                   Int       @id @default(1)
  lastSyncAt           DateTime? @map("last_sync_at")
  lastSuccessfulSyncAt DateTime? @map("last_successful_sync_at")

  @@map("sync_state")
}

model SyncLog {
  id            String    @id @default(uuid())
  startedAt     DateTime  @default(now()) @map("started_at")
  finishedAt    DateTime? @map("finished_at")
  status        String    @default("success")
  recordsPushed Int       @default(0) @map("records_pushed")
  recordsPulled Int       @default(0) @map("records_pulled")
  errorMessage  String?   @map("error_message")

  @@map("sync_log")
}
```

- [ ] **5.3** Create `packages/db/src/client.ts`

```typescript
import { PrismaClient } from '../generated/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **5.4** Create `packages/db/src/index.ts`

```typescript
export { prisma } from './client'
export type { Prisma } from '../generated/client'
```

- [ ] **5.5** Generate Prisma client

```bash
cd packages/db
pnpm prisma generate
```

- [ ] **5.6** Commit

```bash
git add packages/db
git commit -m "feat(db): add Prisma schema covering all entities + client singleton"
```

---

## Task 6: Package `utils` — QR signing, formatters, constants

**Files:**
- Create: `packages/utils/package.json`
- Create: `packages/utils/src/qr.ts`
- Create: `packages/utils/src/format.ts`
- Create: `packages/utils/src/constants.ts`
- Create: `packages/utils/src/index.ts`
- Test: `packages/utils/src/__tests__/qr.test.ts`

- [ ] **6.1** Create `packages/utils/package.json`

```json
{
  "name": "@myway/utils",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run" },
  "devDependencies": {
    "vitest": "^2.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **6.2** Write failing test first — `packages/utils/src/__tests__/qr.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { signQrToken, verifyQrToken } from '../qr'

describe('QR token signing', () => {
  const secret = 'test-secret-32chars-minimum-length'
  const tableId = '123e4567-e89b-12d3-a456-426614174000'
  const venueId = '987fcdeb-51a2-43f7-b012-345678901234'

  it('signs and verifies a valid token', () => {
    const token = signQrToken({ tableId, venueId }, secret)
    const result = verifyQrToken(token, secret)
    expect(result).not.toBeNull()
    expect(result?.tableId).toBe(tableId)
    expect(result?.venueId).toBe(venueId)
  })

  it('returns null for tampered token', () => {
    const token = signQrToken({ tableId, venueId }, secret)
    const tampered = token.slice(0, -5) + 'XXXXX'
    expect(verifyQrToken(tampered, secret)).toBeNull()
  })

  it('returns null for expired token', () => {
    const expiredAt = Date.now() - 1000 * 60 * 60 * 9  // 9 hours ago
    const token = signQrToken({ tableId, venueId, expiresAt: expiredAt }, secret)
    expect(verifyQrToken(token, secret)).toBeNull()
  })
})
```

- [ ] **6.3** Run test — verify it fails

```bash
cd packages/utils && pnpm test
# Expected: FAIL — signQrToken not defined
```

- [ ] **6.4** Create `packages/utils/src/qr.ts`

```typescript
import { createHmac } from 'node:crypto'

const EXPIRY_HOURS = 8

interface QrPayload {
  tableId: string
  venueId: string
  expiresAt?: number
}

export function signQrToken(
  payload: Omit<QrPayload, 'expiresAt'> & { expiresAt?: number },
  secret: string
): string {
  const expiresAt = payload.expiresAt ?? Date.now() + 1000 * 60 * 60 * EXPIRY_HOURS
  const data = JSON.stringify({ ...payload, expiresAt })
  const encoded = Buffer.from(data).toString('base64url')
  const sig = createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

export function verifyQrToken(token: string, secret: string): QrPayload | null {
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return null

  const expectedSig = createHmac('sha256', secret).update(encoded).digest('base64url')
  if (sig !== expectedSig) return null

  try {
    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as QrPayload & { expiresAt: number }
    if (data.expiresAt < Date.now()) return null
    return { tableId: data.tableId, venueId: data.venueId }
  } catch {
    return null
  }
}
```

- [ ] **6.5** Run test — verify it passes

```bash
cd packages/utils && pnpm test
# Expected: PASS all 3 tests
```

- [ ] **6.6** Create `packages/utils/src/format.ts`

```typescript
export function formatCurrency(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(date))
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
```

- [ ] **6.7** Create `packages/utils/src/constants.ts`

```typescript
export const SOCKET_EVENTS = {
  NEW_ORDER: 'new_order',
  ORDER_UPDATED: 'order_updated',
  ITEM_READY: 'item_ready',
  ITEM_DELIVERED: 'item_delivered',
  TABLE_STATUS: 'table_status',
  TABLE_PAID: 'table_paid',
  TABLE_CLOSED: 'table_closed',
  CALL_WAITER: 'call_waiter',
  CALL_WAITER_ACK: 'call_waiter_ack',
  DELIVERY_NEW: 'delivery_new',
  DELIVERY_UPDATED: 'delivery_updated',
  MP_PAYMENT_CONFIRMED: 'mp_payment_confirmed',
  SYNC_STATUS: 'sync_status',
  STOCK_LOW: 'stock_low',
} as const

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['preparing', 'cancelled'],
  preparing:  ['ready'],
  ready:      ['delivered'],
  delivered:  [],
  cancelled:  [],
}

export const SYNC_INTERVAL_MS = 15 * 60 * 1000  // 15 minutes
export const PIN_MAX_ATTEMPTS = 5
export const PIN_LOCKOUT_MINUTES = 15
export const QR_TOKEN_HOURS = 8
export const JWKS_CACHE_TTL_MS = 60 * 60 * 1000  // 1 hour
export const JWKS_OFFLINE_MAX_AGE_MS = 48 * 60 * 60 * 1000  // 48 hours
```

- [ ] **6.8** Create `packages/utils/src/index.ts`

```typescript
export * from './qr'
export * from './format'
export * from './constants'
```

- [ ] **6.9** Commit

```bash
git add packages/utils
git commit -m "feat(utils): add QR signing, currency formatters, socket constants"
```

---

## Task 7: Package `auth` — Supabase helpers + role matrix

**Files:**
- Create: `packages/auth/package.json`
- Create: `packages/auth/src/supabase-server.ts`
- Create: `packages/auth/src/supabase-client.ts`
- Create: `packages/auth/src/roles.ts`
- Create: `packages/auth/src/index.ts`

- [ ] **7.1** Create `packages/auth/package.json`

```json
{
  "name": "@myway/auth",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.46.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@myway/config": "workspace:*",
    "@myway/types": "workspace:*"
  }
}
```

- [ ] **7.2** Create `packages/auth/src/roles.ts`

```typescript
import type { StaffRole } from '@myway/types'

// Permissions matrix — what each role can do
export const ROLE_PERMISSIONS = {
  superadmin: ['*'],  // everything
  admin: [
    'menu:read', 'menu:write',
    'prices:write',
    'accounting:read',
    'employees:read', 'employees:write',
    'payments:read',
    'reports:read',
    'layout:write',
    'orders:cancel',
    'discounts:apply',
    'staff:manage:cashier', 'staff:manage:waiter', 'staff:manage:kitchen', 'staff:manage:bar',
  ],
  cashier: [
    'menu:read', 'availability:write',
    'orders:read', 'orders:cancel',
    'discounts:apply',
    'payments:create',
    'register:close',
    'tables:manage',
  ],
  waiter: [
    'menu:read',
    'tables:own:manage',
    'payments:create',
    'availability:write',
  ],
  kitchen: ['orders:kitchen:read', 'orders:kitchen:update'],
  bar:     ['orders:bar:read', 'orders:bar:update'],
} as const

export function hasPermission(role: StaffRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] as readonly string[]
  return perms.includes('*') || perms.includes(permission)
}

export function canManageRole(actorRole: StaffRole, targetRole: StaffRole): boolean {
  const hierarchy: StaffRole[] = ['superadmin', 'admin', 'cashier', 'waiter', 'kitchen', 'bar']
  const actorIndex = hierarchy.indexOf(actorRole)
  const targetIndex = hierarchy.indexOf(targetRole)
  // Can only manage roles strictly below yours
  return actorIndex < targetIndex
}
```

- [ ] **7.3** Create `packages/auth/src/supabase-server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import type { cookies } from 'next/headers'

export function createSupabaseServerClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export function createSupabaseAdminClient() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

- [ ] **7.4** Create `packages/auth/src/index.ts`

```typescript
export * from './roles'
export * from './supabase-server'
```

- [ ] **7.5** Commit

```bash
git add packages/auth
git commit -m "feat(auth): add role permissions matrix and Supabase client helpers"
```

---

## Task 8: Package `ui` — base components with dark premium theme

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/src/styles/globals.css`
- Create: `packages/ui/src/components/offline-banner.tsx`
- Create: `packages/ui/src/components/button.tsx`
- Create: `packages/ui/src/index.ts`

- [ ] **8.1** Create `packages/ui/package.json`

```json
{
  "name": "@myway/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles/globals.css"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0",
    "@myway/config": "workspace:*"
  }
}
```

- [ ] **8.2** Create `packages/ui/src/styles/globals.css`

```css
@import "tailwindcss";

:root {
  --background: 10 10 10;
  --foreground: 245 245 247;
  --card: 17 17 17;
  --card-foreground: 245 245 247;
  --border: 45 45 45;
  --input: 26 26 26;
  --primary: 245 158 11;
  --primary-foreground: 10 10 10;
  --muted: 34 34 34;
  --muted-foreground: 134 134 139;
  --accent: 245 158 11;
  --destructive: 239 68 68;
  --radius: 0.75rem;
}

body {
  background-color: rgb(var(--background));
  color: rgb(var(--foreground));
  font-family: 'Inter', system-ui, sans-serif;
}

* { box-sizing: border-box; }
```

- [ ] **8.3** Create `packages/ui/src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **8.4** Create `packages/ui/src/components/offline-banner.tsx`

```typescript
'use client'

interface OfflineBannerProps {
  isOffline: boolean
}

export function OfflineBanner({ isOffline }: OfflineBannerProps) {
  if (!isOffline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-center py-2 text-sm font-semibold">
      ⚠️ Modo Offline — Trabajando con datos locales. Delivery pausado.
    </div>
  )
}
```

- [ ] **8.5** Create `packages/ui/src/components/button.tsx`

```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-amber-500 text-black hover:bg-amber-400',
        secondary: 'bg-surface-2 text-white hover:bg-surface-3 border border-surface-4',
        destructive: 'bg-red-600 text-white hover:bg-red-500',
        ghost: 'hover:bg-surface-2 text-white',
        outline: 'border border-surface-4 bg-transparent text-white hover:bg-surface-2',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        xl: 'h-16 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = 'Button'
```

- [ ] **8.6** Create `packages/ui/src/index.ts`

```typescript
export { Button } from './components/button'
export { OfflineBanner } from './components/offline-banner'
export { cn } from './lib/utils'
```

- [ ] **8.7** Commit

```bash
git add packages/ui
git commit -m "feat(ui): add shared component library with dark premium theme"
```

---

## Task 9: local-server scaffold — Express + Socket.io + JWT + health check

**Files:**
- Create: `apps/local-server/package.json`
- Create: `apps/local-server/src/index.ts`
- Create: `apps/local-server/src/server.ts`
- Create: `apps/local-server/src/socket.ts`
- Create: `apps/local-server/src/routes/health.ts`
- Create: `apps/local-server/src/middleware/auth.ts`
- Create: `apps/local-server/src/middleware/rate-limit.ts`
- Create: `apps/local-server/src/lib/jwks-cache.ts`
- Create: `apps/local-server/src/lib/logger.ts`
- Test: `apps/local-server/src/__tests__/health.test.ts`

- [ ] **9.1** Create `apps/local-server/package.json`

```json
{
  "name": "@myway/local-server",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc",
    "test": "vitest run",
    "setup": "tsx scripts/setup.ts"
  },
  "dependencies": {
    "express": "^5.0.0",
    "socket.io": "^4.8.0",
    "jose": "^5.9.0",
    "pino": "^9.5.0",
    "pino-pretty": "^13.0.0",
    "express-rate-limit": "^7.4.0",
    "@myway/db": "workspace:*",
    "@myway/types": "workspace:*",
    "@myway/utils": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "vitest": "^2.0.0",
    "supertest": "^7.0.0",
    "@types/express": "^5.0.0",
    "@types/supertest": "^6.0.0",
    "@myway/config": "workspace:*"
  }
}
```

- [ ] **9.2** Create `apps/local-server/src/lib/logger.ts`

```typescript
import pino from 'pino'

export const logger = pino({
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  level: process.env.LOG_LEVEL ?? 'info',
})
```

- [ ] **9.3** Create `apps/local-server/src/lib/jwks-cache.ts`

```typescript
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { JWKS_CACHE_TTL_MS, JWKS_OFFLINE_MAX_AGE_MS } from '@myway/utils'
import { logger } from './logger'

// Use absolute path anchored to this file — avoids CWD issues when started via Turborepo
const CACHE_PATH = resolve(__dirname, '../../jwks-cache.json')

interface JwksCache {
  keys: unknown[]
  fetchedAt: number
}

let cachedJwks: JwksCache | null = null

async function loadJwks(): Promise<JwksCache['keys']> {
  // Try to load from disk first
  if (existsSync(CACHE_PATH)) {
    const cached = JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) as JwksCache
    cachedJwks = cached
  }

  try {
    const jwksUrl = new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
    const res = await fetch(jwksUrl)
    const data = await res.json() as { keys: unknown[] }
    cachedJwks = { keys: data.keys, fetchedAt: Date.now() }
    writeFileSync(CACHE_PATH, JSON.stringify(cachedJwks))
    logger.info('JWKS refreshed from Supabase')
    return data.keys
  } catch (err) {
    if (cachedJwks) {
      const age = Date.now() - cachedJwks.fetchedAt
      if (age < JWKS_OFFLINE_MAX_AGE_MS) {
        logger.warn({ age }, 'Using cached JWKS (offline mode)')
        return cachedJwks.keys
      }
    }
    throw new Error('Cannot verify JWT: JWKS unavailable and cache expired')
  }
}

let jwksSet: ReturnType<typeof createLocalJWKSet> | null = null
let lastRefresh = 0

export async function getJwksSet() {
  const now = Date.now()
  if (!jwksSet || now - lastRefresh > JWKS_CACHE_TTL_MS) {
    const keys = await loadJwks()
    jwksSet = createLocalJWKSet({ keys: keys as Parameters<typeof createLocalJWKSet>[0]['keys'] })
    lastRefresh = now
  }
  return jwksSet
}

export async function verifyJwt(token: string): Promise<JWTPayload> {
  const jwks = await getJwksSet()
  const { payload } = await jwtVerify(token, jwks)
  return payload
}
```

- [ ] **9.4** Write failing health check test first

`apps/local-server/src/__tests__/health.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../server'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const app = createApp()
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.version).toBeDefined()
  })
})
```

- [ ] **9.5** Run test — verify it fails

```bash
cd apps/local-server && pnpm test
# Expected: FAIL — createApp not defined
```

- [ ] **9.6** Create `apps/local-server/src/routes/health.ts`

```typescript
import type { Router } from 'express'
import { Router as createRouter } from 'express'

export const healthRouter: Router = createRouter()

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version ?? '0.0.1',
    timestamp: new Date().toISOString(),
  })
})
```

- [ ] **9.7** Create `apps/local-server/src/middleware/rate-limit.ts`

```typescript
import rateLimit from 'express-rate-limit'

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
})
```

- [ ] **9.8** Create `apps/local-server/src/middleware/auth.ts`

```typescript
import type { Request, Response, NextFunction } from 'express'
import { verifyJwt } from '../lib/jwks-cache'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const token = authHeader.slice(7)
  try {
    const payload = await verifyJwt(token)
    res.locals.staffId = payload.sub
    res.locals.role = payload.role
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

- [ ] **9.9** Create `apps/local-server/src/server.ts`

```typescript
import express from 'express'
import { apiRateLimiter } from './middleware/rate-limit'
import { healthRouter } from './routes/health'

export function createApp() {
  const app = express()

  app.use(express.json())
  app.use(apiRateLimiter)

  // CORS — only allow local network
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    next()
  })

  app.use(healthRouter)

  return app
}
```

- [ ] **9.10** Create `apps/local-server/src/socket.ts`

```typescript
import { Server } from 'socket.io'
import type { Server as HttpServer } from 'node:http'
import { SOCKET_EVENTS } from '@myway/utils'
import { logger } from './lib/logger'

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected')

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected')
    })
  })

  // Export emit helpers
  return {
    io,
    emit: (event: string, data: unknown) => io.emit(event, data),
  }
}
```

- [ ] **9.11** Create `apps/local-server/src/index.ts`

```typescript
import { createServer } from 'node:http'
import { createApp } from './server'
import { createSocketServer } from './socket'
import { logger } from './lib/logger'

const PORT = parseInt(process.env.PORT ?? '3001')

const app = createApp()
const httpServer = createServer(app)
createSocketServer(httpServer)

httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT }, '🚀 My Way local-server started')
})
```

- [ ] **9.12** Run test — verify it passes

```bash
cd apps/local-server && pnpm test
# Expected: PASS
```

- [ ] **9.13** Test the server manually

```bash
cd apps/local-server && pnpm dev
# In another terminal:
curl http://localhost:3001/health
# Expected: {"status":"ok","version":"0.0.1","timestamp":"..."}
```

- [ ] **9.14** Commit

```bash
git add apps/local-server
git commit -m "feat(local-server): scaffold Express + Socket.io + JWT auth + health check"
```

---

## Task 10: Create `.env.example` + validate setup

**Files:**
- Create: `.env.example`
- Create: `apps/local-server/.env.example`

- [ ] **10.1** Create root `.env.example`

```env
# ============================================
# PUBLIC (safe for browser - use NEXT_PUBLIC_ prefix)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# ============================================
# SERVER ONLY (never expose to browser)
# ============================================
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_SECRET=your-google-client-secret
MP_ACCESS_TOKEN=your-mercadopago-access-token
MP_WEBHOOK_SECRET=your-mp-webhook-secret
VENUE_QR_SECRET=generate-with-openssl-rand-base64-32
```

- [ ] **10.2** Create `apps/local-server/.env.example`

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=file:./myway.db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MP_ACCESS_TOKEN=your-mercadopago-access-token
VENUE_QR_SECRET=generate-with-openssl-rand-base64-32
SYNC_INTERVAL_MINUTES=15
PRINTER_HOST=
PRINTER_PORT=9100
ALLOWED_NETWORK=192.168.1.0/24
LOG_LEVEL=info
```

- [ ] **10.3** Run full build to verify everything compiles

```bash
cd /workspace/myway
pnpm install
pnpm build
# Expected: All packages build without errors
```

- [ ] **10.4** Run all tests

```bash
pnpm test
# Expected: All tests pass
```

- [ ] **10.5** Final commit

```bash
git add .
git commit -m "chore: add env examples, verify full monorepo build and tests pass"
```

---

## Verification Checklist

Before marking this plan complete:

- [ ] `pnpm build` passes with zero TypeScript errors
- [ ] `pnpm test` — all tests green
- [ ] `curl http://localhost:3001/health` returns `{"status":"ok",...}`
- [ ] Supabase migration applied — all tables exist in cloud DB
- [ ] All 6 packages exist and export their public API without errors
- [ ] `.gitignore` includes `.env`, `*.db`, `node_modules/`, `.next/`

---

*Next plan: [Plan 1 — Core Bar Operations](2026-03-21-plan-1-core-bar.md)*
