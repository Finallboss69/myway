# My Way — Plan 7: Menu, Recipes & Stock Management

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete menu management system (categories, products, modifiers, combos, happy hours, price history), the recipe/ingredient management system with ML-level tracking, and all stock management features (adjustments, alerts, waste log, restock requests) — all inside `app-admin`. After this plan, the owner has full control over every product and can track exact ingredient consumption down to the milliliter.

**Architecture:** All data lives exclusively in Supabase (PostgreSQL). `app-admin` reads/writes directly via Supabase client — no local-server intermediary. On save, a socket broadcast propagates changes to all local-server clients within seconds. Product images are stored in Supabase Storage bucket `product-images`. The local-server sync engine pulls updated products/ingredients on the 15-minute cadence (Plan 1), so any changes become available to POS/KDS/Bar automatically.

**Tech Stack:** Next.js 15, Supabase JS client, react-hook-form v7, zod v3, @tanstack/react-table v8, TanStack Query v5, Supabase Storage, shadcn/ui, @myway/types, @myway/db, @myway/ui

**Depends on:** Plan 6 (Admin Panel & Analytics)

---

## File Map

```
apps/app-admin/src/
│
├── app/
│   ├── menu/
│   │   ├── page.tsx                          # Menu overview: category tabs + product list
│   │   ├── layout.tsx                        # Menu section layout with nav tabs
│   │   ├── categories/
│   │   │   └── page.tsx                      # Category CRUD table
│   │   ├── products/
│   │   │   ├── page.tsx                      # Products table (filterable by category)
│   │   │   ├── new/page.tsx                  # Create product form
│   │   │   └── [id]/
│   │   │       ├── page.tsx                  # Edit product form
│   │   │       ├── modifiers/page.tsx        # Modifier groups for this product
│   │   │       └── recipe/page.tsx           # Recipe editor for this product
│   │   ├── combos/
│   │   │   └── page.tsx                      # Combo CRUD
│   │   └── happy-hours/
│   │       └── page.tsx                      # Happy hour rules CRUD
│   │
│   └── inventory/
│       ├── page.tsx                          # Inventory overview: stock dashboard
│       ├── layout.tsx                        # Inventory section layout with nav tabs
│       ├── ingredients/
│       │   ├── page.tsx                      # Ingredient list with stock bars
│       │   ├── new/page.tsx                  # Create ingredient form
│       │   └── [id]/
│       │       ├── page.tsx                  # Edit ingredient + movement history
│       │       └── adjust/page.tsx           # Stock adjustment form
│       ├── stock/
│       │   └── page.tsx                      # Stock overview dashboard + low-stock alerts
│       ├── waste/
│       │   └── page.tsx                      # Waste log: list + add entry
│       ├── restock-requests/
│       │   └── page.tsx                      # Pending requests from kitchen/bar
│       └── reports/
│           └── page.tsx                      # Consumption report + restock suggestions
│
├── components/
│   ├── menu/
│   │   ├── CategoryForm.tsx                  # Create/edit category (name, color, icon, sort_order)
│   │   ├── CategoryTable.tsx                 # Sortable category list with inline edit
│   │   ├── ProductForm.tsx                   # Full product form with image upload
│   │   ├── ProductTable.tsx                  # Products with filters + availability toggle
│   │   ├── ProductImageUpload.tsx            # Drag-drop image uploader → Supabase Storage
│   │   ├── PriceHistoryDrawer.tsx            # Side drawer showing past price changes
│   │   ├── ModifierGroupForm.tsx             # Create/edit modifier group
│   │   ├── ModifierGroupList.tsx             # List of modifier groups for a product
│   │   ├── ComboForm.tsx                     # Create/edit combo with product picker
│   │   ├── ComboTable.tsx                    # Combos list with active toggle
│   │   ├── HappyHourForm.tsx                 # Time rule form (days, hours, discount)
│   │   └── HappyHourTable.tsx                # Happy hour rules list
│   │
│   └── inventory/
│       ├── IngredientForm.tsx                # Create/edit ingredient (name, unit, thresholds)
│       ├── IngredientTable.tsx               # Ingredients with stock bars + color coding
│       ├── StockAdjustmentForm.tsx           # Add/reduce/correct stock with reason
│       ├── StockMovementHistory.tsx          # Movement log table per ingredient
│       ├── StockDashboard.tsx                # All ingredients with visual level bars
│       ├── LowStockAlert.tsx                 # Red/amber ingredient alert cards
│       ├── WasteLogTable.tsx                 # Waste entries table (TanStack Table)
│       ├── WasteEntryForm.tsx                # Add waste entry form
│       ├── RecipeEditor.tsx                  # Add/edit/remove recipe items
│       ├── RecipeCostCalculator.tsx          # Shows cost breakdown + margin
│       ├── ConsumptionReport.tsx             # ml/gr/units used per ingredient (chart + table)
│       ├── RestockSuggestion.tsx             # Auto-computed restock amounts
│       └── RestockRequestTable.tsx           # Pending requests with approve/reject actions
│
├── hooks/
│   ├── useCategories.ts                      # TanStack Query: CRUD product_categories
│   ├── useProducts.ts                        # TanStack Query: CRUD products
│   ├── useProductModifiers.ts                # TanStack Query: CRUD product_modifiers
│   ├── useCombos.ts                          # TanStack Query: CRUD product_combos
│   ├── useHappyHours.ts                      # TanStack Query: CRUD happy_hours
│   ├── usePriceHistory.ts                    # TanStack Query: read price_history by product
│   ├── useIngredients.ts                     # TanStack Query: CRUD ingredients
│   ├── useRecipes.ts                         # TanStack Query: CRUD recipes + recipe_items
│   ├── useStockMovements.ts                  # TanStack Query: movements per ingredient
│   ├── useWasteLog.ts                        # TanStack Query: waste_log entries
│   └── useRestockRequests.ts                 # TanStack Query: restock_requests
│
├── lib/
│   ├── supabase-admin.ts                     # Supabase client (uses service role in server actions)
│   ├── storage.ts                            # Product image upload helpers (Supabase Storage)
│   ├── menu-broadcast.ts                     # Emit menu:updated socket event after changes
│   └── stock-calculations.ts                 # Cost, margin, consumption aggregation helpers
│
└── actions/
    ├── categories.ts                         # Server actions: createCategory, updateCategory, deleteCategory
    ├── products.ts                           # Server actions: createProduct, updateProduct, deleteProduct, toggleAvailability
    ├── modifiers.ts                          # Server actions: createModifier, updateModifier, deleteModifier
    ├── combos.ts                             # Server actions: createCombo, updateCombo, deleteCombo
    ├── happy-hours.ts                        # Server actions: createHappyHour, updateHappyHour, deleteHappyHour
    ├── ingredients.ts                        # Server actions: createIngredient, updateIngredient, deleteIngredient
    ├── recipes.ts                            # Server actions: upsertRecipe, addRecipeItem, removeRecipeItem
    ├── stock.ts                              # Server actions: adjustStock, bulkAdjust
    ├── waste.ts                              # Server actions: createWasteEntry
    └── restock-requests.ts                   # Server actions: approveRequest, rejectRequest

packages/db/prisma/schema.prisma              # Add price_history model
supabase/migrations/
  └── 20260321000007_menu_recipes_stock.sql   # price_history table + triggers + indexes
```

---

## Task 1: Database — `price_history` migration

**Files:**
- Create: `supabase/migrations/20260321000007_menu_recipes_stock.sql`
- Edit: `packages/db/prisma/schema.prisma` — add `PriceHistory` model

- [ ] **1.1** Write test: inserting a product with a price then changing the price should create a `price_history` row automatically (test the SQL trigger behavior via Supabase JS)

- [ ] **1.2** Run test — verify FAIL

- [ ] **1.3** Create migration `supabase/migrations/20260321000007_menu_recipes_stock.sql`

```sql
-- Price history (automatically populated by trigger)
CREATE TABLE price_history (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price     DECIMAL(10,2) NOT NULL,
  new_price     DECIMAL(10,2) NOT NULL,
  changed_by    UUID        REFERENCES staff(id),
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_product ON price_history(product_id, changed_at DESC);

-- Trigger: on products.price UPDATE, insert into price_history
CREATE OR REPLACE FUNCTION fn_record_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price <> NEW.price THEN
    INSERT INTO price_history (product_id, old_price, new_price, changed_at)
    VALUES (NEW.id, OLD.price, NEW.price, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_price_change
AFTER UPDATE OF price ON products
FOR EACH ROW EXECUTE FUNCTION fn_record_price_change();

-- Enable Realtime for menu-related tables so local-server can pick up changes
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE product_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE product_modifiers;
ALTER PUBLICATION supabase_realtime ADD TABLE product_combos;
ALTER PUBLICATION supabase_realtime ADD TABLE happy_hours;
ALTER PUBLICATION supabase_realtime ADD TABLE price_history;
ALTER PUBLICATION supabase_realtime ADD TABLE waste_log;
ALTER PUBLICATION supabase_realtime ADD TABLE restock_requests;

-- Performance indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_venue_available ON products(venue_id, is_available);
CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);
CREATE INDEX idx_stock_movements_created ON ingredient_stock_movements(ingredient_id, created_at DESC);
CREATE INDEX idx_waste_log_created ON waste_log(venue_id, created_at DESC);
CREATE INDEX idx_restock_requests_status ON restock_requests(venue_id, status);
```

- [ ] **1.4** Add `PriceHistory` model to `packages/db/prisma/schema.prisma`

```prisma
model PriceHistory {
  id         String   @id @default(uuid())
  productId  String   @map("product_id")
  oldPrice   Decimal  @map("old_price") @db.Decimal(10, 2)
  newPrice   Decimal  @map("new_price") @db.Decimal(10, 2)
  changedBy  String?  @map("changed_by")
  changedAt  DateTime @default(now()) @map("changed_at")

  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  staff      Staff?   @relation(fields: [changedBy], references: [id])

  @@index([productId, changedAt(sort: Desc)])
  @@map("price_history")
}
```

Also add the reverse relation to the `Product` model:

```prisma
// inside model Product — add:
priceHistory  PriceHistory[]
```

- [ ] **1.5** Run migration: `supabase db push`

- [ ] **1.6** Run `pnpm --filter @myway/db generate` to regenerate Prisma client

- [ ] **1.7** Run test — verify PASS

- [ ] **1.8** Commit

```bash
git add supabase/migrations/20260321000007_menu_recipes_stock.sql packages/db/
git commit -m "feat(db): add price_history table with auto-trigger + realtime for menu tables"
```

---

## Task 2: Shared types — extend `@myway/types` for menu & inventory

**Files:**
- Edit: `packages/types/src/product.ts`
- Edit: `packages/types/src/ingredient.ts`
- Edit: `packages/types/src/index.ts`

- [ ] **2.1** Extend `packages/types/src/product.ts`

```typescript
// Extend existing Product interface — add:
export interface PriceHistory {
  id: string
  productId: string
  oldPrice: number
  newPrice: number
  changedBy: string | null
  changedAt: Date
}

export interface ProductModifier {
  id: string
  productId: string
  name: string
  options: ModifierOption[]   // parsed from options_json
  isRequired: boolean
  maxSelections: number
}

export interface ModifierOption {
  label: string
  extraPrice?: number         // optional surcharge
}

export interface ProductCombo {
  id: string
  venueId: string
  name: string
  description: string | null
  price: number
  items: ComboItem[]          // parsed from items_json
  isActive: boolean
}

export interface ComboItem {
  productId: string
  quantity: number
}

export interface HappyHour {
  id: string
  venueId: string
  name: string
  startTime: string           // "HH:MM"
  endTime: string             // "HH:MM"
  daysOfWeek: number[]        // 0=Sun … 6=Sat
  discountType: 'percentage' | 'fixed'
  discountValue: number
  isActive: boolean
}
```

- [ ] **2.2** Extend `packages/types/src/ingredient.ts`

```typescript
// Extend existing types — add:
export interface Recipe {
  id: string
  productId: string
  notes: string | null
  items: RecipeItemDetail[]
  createdAt: Date
  updatedAt: Date
}

export interface RecipeItemDetail extends RecipeItem {
  ingredient: Pick<Ingredient, 'name' | 'unit' | 'costPerUnit'>
}

export interface StockMovement {
  id: string
  ingredientId: string
  type: StockMovementType
  quantity: number            // positive = inflow, negative = outflow
  orderItemId: string | null
  notes: string | null
  createdBy: string | null
  createdAt: Date
}

export interface WasteEntry {
  id: string
  venueId: string
  ingredientId: string | null
  productId: string | null
  quantity: number
  unit: string
  reason: 'expired' | 'accident' | 'preparation_error' | 'other'
  notes: string | null
  estimatedCost: number | null
  registeredBy: string | null
  createdAt: Date
}

export interface RestockRequest {
  id: string
  venueId: string
  ingredientId: string
  requestedBy: string | null
  quantityRequested: number
  status: 'pending' | 'approved' | 'rejected' | 'purchased'
  notes: string | null
  resolvedBy: string | null
  createdAt: Date
  resolvedAt: Date | null
}

// Computed types for UI
export interface IngredientWithStock extends Ingredient {
  stockPercent: number        // (stockCurrent / stockAlertThreshold) × 100, capped at 200
  stockStatus: 'ok' | 'low' | 'critical'  // ok ≥ 1.5×, low 1–1.5×, critical < threshold
}

export interface RecipeCost {
  productId: string
  totalCost: number           // sum of (quantity × costPerUnit) per item
  estimatedMargin: number     // (price - totalCost) / price × 100
  items: RecipeCostItem[]
}

export interface RecipeCostItem {
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: string
  costPerUnit: number
  lineCost: number
}
```

- [ ] **2.3** Update `packages/types/src/index.ts` to re-export all new types (already exports `./product` and `./ingredient` — no change needed if those files export directly)

- [ ] **2.4** Commit

```bash
git add packages/types/
git commit -m "feat(types): extend product and ingredient types for menu and inventory management"
```

---

## Task 3: Supabase server-side helpers + storage utility

**Files:**
- Edit: `apps/app-admin/src/lib/supabase-admin.ts`
- Create: `apps/app-admin/src/lib/storage.ts`
- Create: `apps/app-admin/src/lib/menu-broadcast.ts`
- Create: `apps/app-admin/src/lib/stock-calculations.ts`

- [ ] **3.1** Write test: `uploadProductImage(file, productId)` returns a public URL string

- [ ] **3.2** Run test — verify FAIL

- [ ] **3.3** Create `apps/app-admin/src/lib/storage.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'product-images'

export async function uploadProductImage(
  file: File,
  productId: string,
): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${productId}/main.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(`Image upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteProductImage(productId: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  // Delete all files under the product folder
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(productId)

  if (files && files.length > 0) {
    const paths = files.map((f) => `${productId}/${f.name}`)
    await supabase.storage.from(BUCKET).remove(paths)
  }
}
```

- [ ] **3.4** Ensure Supabase Storage bucket `product-images` is created with public access:

```sql
-- In supabase/migrations/20260321000007_menu_recipes_stock.sql (append):
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_write"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'service_role'
);
```

- [ ] **3.5** Create `apps/app-admin/src/lib/menu-broadcast.ts`

```typescript
// After any menu mutation, emit a socket event so local-server
// picks it up via Supabase Realtime (already subscribed in Plan 1).
// This is a thin wrapper — actual broadcast happens via Realtime trigger.
// Call this helper after every server action to log + optionally force-ping.

export async function broadcastMenuUpdate(
  entityType: 'product' | 'category' | 'modifier' | 'combo' | 'happy_hour',
  entityId: string,
): Promise<void> {
  // Supabase Realtime already picks up DB changes automatically.
  // This function exists for future manual push (e.g. webhook) and logging.
  console.info(`[menu-broadcast] ${entityType} ${entityId} updated — Realtime will propagate`)
}
```

- [ ] **3.6** Create `apps/app-admin/src/lib/stock-calculations.ts`

```typescript
import type { RecipeCost, RecipeItemDetail, Ingredient } from '@myway/types'

export function computeRecipeCost(
  productId: string,
  productPrice: number,
  items: RecipeItemDetail[],
): RecipeCost {
  const costItems = items.map((item) => ({
    ingredientId: item.ingredientId,
    ingredientName: item.ingredient.name,
    quantity: item.quantity,
    unit: item.ingredient.unit,
    costPerUnit: item.ingredient.costPerUnit,
    lineCost: item.quantity * item.ingredient.costPerUnit,
  }))
  const totalCost = costItems.reduce((sum, i) => sum + i.lineCost, 0)
  const estimatedMargin =
    productPrice > 0 ? ((productPrice - totalCost) / productPrice) * 100 : 0

  return {
    productId,
    totalCost,
    estimatedMargin,
    items: costItems,
  }
}

export function computeStockStatus(
  stockCurrent: number,
  alertThreshold: number,
): 'ok' | 'low' | 'critical' {
  if (alertThreshold <= 0) return 'ok'
  const ratio = stockCurrent / alertThreshold
  if (ratio >= 1.5) return 'ok'
  if (ratio >= 1.0) return 'low'
  return 'critical'
}

export function computeRestockSuggestion(
  ingredientId: string,
  weeklyConsumption: number,   // total ml/gr/units sold this week
  stockCurrent: number,
  targetWeeks: number = 2,     // how many weeks of stock to maintain
): number {
  const targetStock = weeklyConsumption * targetWeeks
  const needed = targetStock - stockCurrent
  return Math.max(0, Math.ceil(needed))
}
```

- [ ] **3.7** Run test — verify PASS

- [ ] **3.8** Commit

```bash
git add apps/app-admin/src/lib/
git commit -m "feat(app-admin): add storage, broadcast, and stock calculation helpers"
```

---

## Task 4: Server actions — Categories

**Files:**
- Create: `apps/app-admin/src/actions/categories.ts`

- [ ] **4.1** Write tests for:
  - `createCategory` creates a row in `product_categories` and returns it
  - `updateCategory` updates only the specified fields
  - `deleteCategory` fails if products reference it (FK constraint)
  - `reorderCategories` updates `sort_order` in bulk

- [ ] **4.2** Run tests — verify FAIL

- [ ] **4.3** Create `apps/app-admin/src/actions/categories.ts`

```typescript
'use server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { broadcastMenuUpdate } from '@/lib/menu-broadcast'

const CategorySchema = z.object({
  name:       z.string().min(1).max(50),
  color:      z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon:       z.string().max(50).optional(),
  sort_order: z.number().int().min(0).default(0),
})

export async function createCategory(venueId: string, data: unknown) {
  const parsed = CategorySchema.parse(data)
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('product_categories')
    .insert({ venue_id: venueId, ...parsed })
    .select()
    .single()
  if (error) throw new Error(error.message)
  await broadcastMenuUpdate('category', row.id)
  return row
}

export async function updateCategory(id: string, data: unknown) {
  const parsed = CategorySchema.partial().parse(data)
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('product_categories')
    .update(parsed)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  await broadcastMenuUpdate('category', id)
  return row
}

export async function deleteCategory(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)  // FK error surfaces if products reference it
}

export async function reorderCategories(
  updates: Array<{ id: string; sort_order: number }>,
) {
  const supabase = createAdminClient()
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase
        .from('product_categories')
        .update({ sort_order })
        .eq('id', id),
    ),
  )
}
```

- [ ] **4.4** Run tests — verify PASS

- [ ] **4.5** Commit

```bash
git add apps/app-admin/src/actions/categories.ts
git commit -m "feat(app-admin): add category server actions with zod validation"
```

---

## Task 5: Server actions — Products (with image upload + price history)

**Files:**
- Create: `apps/app-admin/src/actions/products.ts`

- [ ] **5.1** Write tests for:
  - `createProduct` inserts product and returns it
  - `updateProduct` with a changed `price` triggers a `price_history` row (via DB trigger)
  - `toggleAvailability` flips `is_available` and returns updated row
  - `deleteProduct` removes the product and calls `deleteProductImage`

- [ ] **5.2** Run tests — verify FAIL

- [ ] **5.3** Create `apps/app-admin/src/actions/products.ts`

```typescript
'use server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { uploadProductImage, deleteProductImage } from '@/lib/storage'
import { broadcastMenuUpdate } from '@/lib/menu-broadcast'

const ALLERGEN_OPTIONS = [
  'gluten', 'dairy', 'eggs', 'fish', 'shellfish',
  'tree_nuts', 'peanuts', 'soy', 'sesame',
] as const

const ProductSchema = z.object({
  category_id:  z.string().uuid(),
  name:         z.string().min(1).max(100),
  description:  z.string().max(500).optional(),
  price:        z.number().positive(),
  is_available: z.boolean().default(true),
  is_pool_chip: z.boolean().default(false),
  target:       z.enum(['kitchen', 'bar']),
  station:      z.string().max(50).optional(),
  sort_order:   z.number().int().min(0).default(0),
  allergens_json: z.array(z.enum(ALLERGEN_OPTIONS)).default([]),
})

export async function createProduct(
  venueId: string,
  data: unknown,
  imageFile?: File,
) {
  const parsed = ProductSchema.parse(data)
  const supabase = createAdminClient()

  const { data: row, error } = await supabase
    .from('products')
    .insert({ venue_id: venueId, ...parsed })
    .select()
    .single()
  if (error) throw new Error(error.message)

  if (imageFile) {
    const imageUrl = await uploadProductImage(imageFile, row.id)
    await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', row.id)
    row.image_url = imageUrl
  }

  await broadcastMenuUpdate('product', row.id)
  return row
}

export async function updateProduct(
  id: string,
  data: unknown,
  imageFile?: File,
) {
  const parsed = ProductSchema.partial().parse(data)
  const supabase = createAdminClient()

  if (imageFile) {
    parsed.image_url = await uploadProductImage(imageFile, id) as never
  }

  const { data: row, error } = await supabase
    .from('products')
    .update(parsed)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)

  // price_history row is created automatically by DB trigger trg_price_change
  await broadcastMenuUpdate('product', id)
  return row
}

export async function toggleAvailability(id: string) {
  const supabase = createAdminClient()
  const { data: current } = await supabase
    .from('products')
    .select('is_available')
    .eq('id', id)
    .single()

  const { data: row, error } = await supabase
    .from('products')
    .update({ is_available: !current?.is_available })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)

  await broadcastMenuUpdate('product', id)
  return row
}

export async function deleteProduct(id: string) {
  await deleteProductImage(id)
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
```

- [ ] **5.4** Run tests — verify PASS

- [ ] **5.5** Commit

```bash
git add apps/app-admin/src/actions/products.ts
git commit -m "feat(app-admin): add product server actions with image upload and price history"
```

---

## Task 6: Server actions — Modifiers, Combos, Happy Hours

**Files:**
- Create: `apps/app-admin/src/actions/modifiers.ts`
- Create: `apps/app-admin/src/actions/combos.ts`
- Create: `apps/app-admin/src/actions/happy-hours.ts`

- [ ] **6.1** Write tests:
  - `createModifier` inserts modifier group linked to productId
  - `deleteModifier` removes the modifier group
  - `createCombo` inserts combo with items_json correctly
  - `createHappyHour` validates that `start_time < end_time`
  - `createHappyHour` validates `days_of_week` contains values 0–6 only

- [ ] **6.2** Run tests — verify FAIL

- [ ] **6.3** Create `apps/app-admin/src/actions/modifiers.ts`

```typescript
'use server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { broadcastMenuUpdate } from '@/lib/menu-broadcast'

const ModifierOptionSchema = z.object({
  label:      z.string().min(1).max(50),
  extraPrice: z.number().min(0).optional(),
})

const ModifierSchema = z.object({
  name:           z.string().min(1).max(50),
  options_json:   z.array(ModifierOptionSchema).min(1),
  is_required:    z.boolean().default(false),
  max_selections: z.number().int().min(1).default(1),
})

export async function createModifier(productId: string, data: unknown) {
  const parsed = ModifierSchema.parse(data)
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('product_modifiers')
    .insert({ product_id: productId, ...parsed })
    .select()
    .single()
  if (error) throw new Error(error.message)
  await broadcastMenuUpdate('modifier', row.id)
  return row
}

export async function updateModifier(id: string, data: unknown) {
  const parsed = ModifierSchema.partial().parse(data)
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('product_modifiers')
    .update(parsed)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  await broadcastMenuUpdate('modifier', id)
  return row
}

export async function deleteModifier(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('product_modifiers')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
```

- [ ] **6.4** Create `apps/app-admin/src/actions/combos.ts`

```typescript
'use server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { broadcastMenuUpdate } from '@/lib/menu-broadcast'

const ComboItemSchema = z.object({
  productId: z.string().uuid(),
  quantity:  z.number().int().min(1),
})

const ComboSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  price:       z.number().positive(),
  items_json:  z.array(ComboItemSchema).min(2),
  is_active:   z.boolean().default(true),
})

export async function createCombo(venueId: string, data: unknown) {
  const parsed = ComboSchema.parse(data)
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('product_combos')
    .insert({ venue_id: venueId, ...parsed })
    .select()
    .single()
  if (error) throw new Error(error.message)
  await broadcastMenuUpdate('combo', row.id)
  return row
}

export async function updateCombo(id: string, data: unknown) {
  const parsed = ComboSchema.partial().parse(data)
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('product_combos')
    .update(parsed)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  await broadcastMenuUpdate('combo', id)
  return row
}

export async function deleteCombo(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('product_combos')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
```

- [ ] **6.5** Create `apps/app-admin/src/actions/happy-hours.ts`

```typescript
'use server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { broadcastMenuUpdate } from '@/lib/menu-broadcast'

const TimeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const HappyHourSchema = z.object({
  name:           z.string().min(1).max(80),
  start_time:     z.string().regex(TimeRegex, 'Format HH:MM'),
  end_time:       z.string().regex(TimeRegex, 'Format HH:MM'),
  days_of_week:   z.array(z.number().int().min(0).max(6)).min(1),
  discount_type:  z.enum(['percentage', 'fixed']),
  discount_value: z.number().positive(),
  is_active:      z.boolean().default(true),
}).refine(
  (d) => d.start_time < d.end_time,
  { message: 'start_time must be before end_time', path: ['start_time'] },
)

export async function createHappyHour(venueId: string, data: unknown) {
  const parsed = HappyHourSchema.parse(data)
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('happy_hours')
    .insert({ venue_id: venueId, ...parsed })
    .select()
    .single()
  if (error) throw new Error(error.message)
  await broadcastMenuUpdate('happy_hour', row.id)
  return row
}

export async function updateHappyHour(id: string, data: unknown) {
  const parsed = HappyHourSchema.partial().parse(data)
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('happy_hours')
    .update(parsed)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  await broadcastMenuUpdate('happy_hour', id)
  return row
}

export async function deleteHappyHour(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('happy_hours').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
```

- [ ] **6.6** Run tests — verify PASS

- [ ] **6.7** Commit

```bash
git add apps/app-admin/src/actions/modifiers.ts \
        apps/app-admin/src/actions/combos.ts \
        apps/app-admin/src/actions/happy-hours.ts
git commit -m "feat(app-admin): add modifier, combo, and happy hour server actions"
```

---

## Task 7: Server actions — Ingredients & Recipes

**Files:**
- Create: `apps/app-admin/src/actions/ingredients.ts`
- Create: `apps/app-admin/src/actions/recipes.ts`

- [ ] **7.1** Write tests:
  - `createIngredient` inserts with correct unit enum
  - `updateIngredient` changes `cost_per_unit`; does NOT auto-create a stock movement
  - `upsertRecipe` creates a new recipe row if none exists for `productId`, or returns existing
  - `addRecipeItem` inserts a recipe_item; `removeRecipeItem` deletes it
  - `getRecipeWithCost` returns a `RecipeCost` object using `computeRecipeCost`

- [ ] **7.2** Run tests — verify FAIL

- [ ] **7.3** Create `apps/app-admin/src/actions/ingredients.ts`

```typescript
'use server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'

const IngredientSchema = z.object({
  name:                  z.string().min(1).max(100),
  unit:                  z.enum(['ml', 'gr', 'units']),
  stock_current:         z.number().min(0).default(0),
  stock_alert_threshold: z.number().min(0).default(0),
  cost_per_unit:         z.number().min(0).default(0),
})

export async function createIngredient(venueId: string, data: unknown) {
  const parsed = IngredientSchema.parse(data)
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('ingredients')
    .insert({ venue_id: venueId, ...parsed })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function updateIngredient(id: string, data: unknown) {
  const parsed = IngredientSchema.partial().parse(data)
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('ingredients')
    .update(parsed)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function deleteIngredient(id: string) {
  const supabase = createAdminClient()
  // Will fail if referenced by recipe_items — surface FK error to UI
  const { error } = await supabase.from('ingredients').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getIngredients(venueId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('venue_id', venueId)
    .order('name')
  if (error) throw new Error(error.message)
  return data
}
```

- [ ] **7.4** Create `apps/app-admin/src/actions/recipes.ts`

```typescript
'use server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { computeRecipeCost } from '@/lib/stock-calculations'

const RecipeItemSchema = z.object({
  ingredient_id: z.string().uuid(),
  quantity:      z.number().positive(),
})

export async function upsertRecipe(productId: string, notes?: string) {
  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from('recipes')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    if (notes !== undefined) {
      await supabase.from('recipes').update({ notes }).eq('id', existing.id)
    }
    return existing
  }

  const { data: row, error } = await supabase
    .from('recipes')
    .insert({ product_id: productId, notes })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function addRecipeItem(recipeId: string, data: unknown) {
  const parsed = RecipeItemSchema.parse(data)
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('recipe_items')
    .insert({ recipe_id: recipeId, ...parsed })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function updateRecipeItem(id: string, quantity: number) {
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('recipe_items')
    .update({ quantity })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function removeRecipeItem(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('recipe_items').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getRecipeWithCost(productId: string, productPrice: number) {
  const supabase = createAdminClient()
  const { data: recipe } = await supabase
    .from('recipes')
    .select(`
      id,
      notes,
      recipe_items (
        id,
        quantity,
        ingredient_id,
        ingredients ( name, unit, cost_per_unit )
      )
    `)
    .eq('product_id', productId)
    .maybeSingle()

  if (!recipe) return null

  const items = (recipe.recipe_items ?? []).map((ri: any) => ({
    id: ri.id,
    recipeId: recipe.id,
    ingredientId: ri.ingredient_id,
    quantity: ri.quantity,
    ingredient: {
      name: ri.ingredients.name,
      unit: ri.ingredients.unit,
      costPerUnit: ri.ingredients.cost_per_unit,
    },
  }))

  return {
    recipe,
    cost: computeRecipeCost(productId, productPrice, items),
  }
}
```

- [ ] **7.5** Run tests — verify PASS

- [ ] **7.6** Commit

```bash
git add apps/app-admin/src/actions/ingredients.ts \
        apps/app-admin/src/actions/recipes.ts
git commit -m "feat(app-admin): add ingredient and recipe server actions with cost computation"
```

---

## Task 8: Server actions — Stock adjustments, Waste log, Restock requests

**Files:**
- Create: `apps/app-admin/src/actions/stock.ts`
- Create: `apps/app-admin/src/actions/waste.ts`
- Create: `apps/app-admin/src/actions/restock-requests.ts`

- [ ] **8.1** Write tests:
  - `adjustStock` with `type=purchase` and `quantity=500` increases `ingredients.stock_current` by 500 and inserts a movement row
  - `adjustStock` with `type=adjustment` and negative quantity decreases stock (clamped at 0)
  - `createWasteEntry` inserts waste_log row AND decreases `ingredients.stock_current`
  - `approveRestockRequest` sets `status=approved` and `resolved_by`
  - `rejectRestockRequest` sets `status=rejected`

- [ ] **8.2** Run tests — verify FAIL

- [ ] **8.3** Create `apps/app-admin/src/actions/stock.ts`

```typescript
'use server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'

const AdjustSchema = z.object({
  type:     z.enum(['purchase', 'adjustment']),
  quantity: z.number(),           // positive = add, negative = subtract
  notes:    z.string().max(300).optional(),
})

export async function adjustStock(
  ingredientId: string,
  staffId: string,
  data: unknown,
) {
  const parsed = AdjustSchema.parse(data)
  const supabase = createAdminClient()

  // Insert movement row
  const { error: mvErr } = await supabase
    .from('ingredient_stock_movements')
    .insert({
      ingredient_id: ingredientId,
      type:          parsed.type,
      quantity:      parsed.quantity,
      notes:         parsed.notes,
      created_by:    staffId,
    })
  if (mvErr) throw new Error(mvErr.message)

  // Update stock_current (use RPC or inline)
  const { data: ingredient } = await supabase
    .from('ingredients')
    .select('stock_current')
    .eq('id', ingredientId)
    .single()

  const newStock = Math.max(0, (ingredient?.stock_current ?? 0) + parsed.quantity)
  const { error: upErr } = await supabase
    .from('ingredients')
    .update({ stock_current: newStock })
    .eq('id', ingredientId)
  if (upErr) throw new Error(upErr.message)

  return { newStock }
}

export async function getStockMovements(
  ingredientId: string,
  limit: number = 50,
) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ingredient_stock_movements')
    .select('*, staff:created_by(name)')
    .eq('ingredient_id', ingredientId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data
}
```

- [ ] **8.4** Create `apps/app-admin/src/actions/waste.ts`

```typescript
'use server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'

const WasteSchema = z.object({
  ingredient_id:  z.string().uuid().optional(),
  product_id:     z.string().uuid().optional(),
  quantity:       z.number().positive(),
  unit:           z.string().min(1),
  reason:         z.enum(['expired', 'accident', 'preparation_error', 'other']),
  notes:          z.string().max(500).optional(),
  estimated_cost: z.number().min(0).optional(),
}).refine(
  (d) => d.ingredient_id != null || d.product_id != null,
  { message: 'Must provide ingredient_id or product_id' },
)

export async function createWasteEntry(
  venueId: string,
  staffId: string,
  data: unknown,
) {
  const parsed = WasteSchema.parse(data)
  const supabase = createAdminClient()

  const { error: wasteErr } = await supabase
    .from('waste_log')
    .insert({ venue_id: venueId, registered_by: staffId, ...parsed })
  if (wasteErr) throw new Error(wasteErr.message)

  // If ingredient_id provided, deduct from stock + create movement
  if (parsed.ingredient_id) {
    const { data: ing } = await supabase
      .from('ingredients')
      .select('stock_current')
      .eq('id', parsed.ingredient_id)
      .single()

    const newStock = Math.max(0, (ing?.stock_current ?? 0) - parsed.quantity)

    await Promise.all([
      supabase
        .from('ingredients')
        .update({ stock_current: newStock })
        .eq('id', parsed.ingredient_id),
      supabase
        .from('ingredient_stock_movements')
        .insert({
          ingredient_id: parsed.ingredient_id,
          type:          'waste',
          quantity:      -parsed.quantity,
          notes:         `Waste: ${parsed.reason}${parsed.notes ? ' — ' + parsed.notes : ''}`,
          created_by:    staffId,
        }),
    ])
  }
}

export async function getWasteLog(venueId: string, days: number = 30) {
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('waste_log')
    .select('*, ingredient:ingredient_id(name, unit), product:product_id(name)')
    .eq('venue_id', venueId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}
```

- [ ] **8.5** Create `apps/app-admin/src/actions/restock-requests.ts`

```typescript
'use server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function getPendingRestockRequests(venueId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('restock_requests')
    .select('*, ingredient:ingredient_id(name, unit, stock_current), staff:requested_by(name, role)')
    .eq('venue_id', venueId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function approveRestockRequest(id: string, resolvedBy: string) {
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('restock_requests')
    .update({
      status:      'approved',
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function rejectRestockRequest(
  id: string,
  resolvedBy: string,
  reason?: string,
) {
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('restock_requests')
    .update({
      status:      'rejected',
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      notes:       reason,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}
```

- [ ] **8.6** Run tests — verify PASS

- [ ] **8.7** Commit

```bash
git add apps/app-admin/src/actions/stock.ts \
        apps/app-admin/src/actions/waste.ts \
        apps/app-admin/src/actions/restock-requests.ts
git commit -m "feat(app-admin): add stock adjustment, waste log, and restock request actions"
```

---

## Task 9: TanStack Query hooks for all entities

**Files:**
- Create: `apps/app-admin/src/hooks/useCategories.ts`
- Create: `apps/app-admin/src/hooks/useProducts.ts`
- Create: `apps/app-admin/src/hooks/useProductModifiers.ts`
- Create: `apps/app-admin/src/hooks/useCombos.ts`
- Create: `apps/app-admin/src/hooks/useHappyHours.ts`
- Create: `apps/app-admin/src/hooks/usePriceHistory.ts`
- Create: `apps/app-admin/src/hooks/useIngredients.ts`
- Create: `apps/app-admin/src/hooks/useRecipes.ts`
- Create: `apps/app-admin/src/hooks/useStockMovements.ts`
- Create: `apps/app-admin/src/hooks/useWasteLog.ts`
- Create: `apps/app-admin/src/hooks/useRestockRequests.ts`

- [ ] **9.1** Write tests: each hook returns the correct data shape when the Supabase client is mocked

- [ ] **9.2** Run tests — verify FAIL

- [ ] **9.3** Create `apps/app-admin/src/hooks/useCategories.ts` — representative pattern (all other hooks follow the same structure):

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '@/actions/categories'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export function useCategories(venueId: string) {
  return useQuery({
    queryKey: ['categories', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('venue_id', venueId)
        .order('sort_order')
      if (error) throw new Error(error.message)
      return data
    },
  })
}

export function useCreateCategory(venueId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => createCategory(venueId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', venueId] }),
  })
}

export function useUpdateCategory(venueId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      updateCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', venueId] }),
  })
}

export function useDeleteCategory(venueId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', venueId] }),
  })
}

export function useReorderCategories(venueId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (updates: Array<{ id: string; sort_order: number }>) =>
      reorderCategories(updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', venueId] }),
  })
}
```

- [ ] **9.4** Create the remaining 10 hooks following the same pattern:
  - `useProducts(venueId, categoryId?)` — filters by category when provided
  - `useProductModifiers(productId)` — scoped to a product
  - `useCombos(venueId)`
  - `useHappyHours(venueId)`
  - `usePriceHistory(productId)` — read-only, no mutations (written by trigger)
  - `useIngredients(venueId)` — includes `computeStockStatus` enrichment
  - `useRecipes(productId)` — includes cost via `getRecipeWithCost`
  - `useStockMovements(ingredientId)` — paginated, 50 per page
  - `useWasteLog(venueId, days?)` — defaults to 30 days
  - `useRestockRequests(venueId)` — pending only; includes approve/reject mutations

- [ ] **9.5** Run tests — verify PASS

- [ ] **9.6** Commit

```bash
git add apps/app-admin/src/hooks/
git commit -m "feat(app-admin): add TanStack Query hooks for all menu and inventory entities"
```

---

## Task 10: Menu section — Category management UI

**Files:**
- Create: `apps/app-admin/src/app/menu/layout.tsx`
- Create: `apps/app-admin/src/app/menu/page.tsx`
- Create: `apps/app-admin/src/app/menu/categories/page.tsx`
- Create: `apps/app-admin/src/components/menu/CategoryForm.tsx`
- Create: `apps/app-admin/src/components/menu/CategoryTable.tsx`

- [ ] **10.1** Create `apps/app-admin/src/app/menu/layout.tsx`

  - Nav tabs: **Categorías** / **Productos** / **Combos** / **Happy Hour**
  - All tabs are links to their respective routes under `/menu`

- [ ] **10.2** Create `apps/app-admin/src/components/menu/CategoryForm.tsx`

  - Fields: `name` (text), `color` (color picker input type="color"), `icon` (text, e.g. emoji or Lucide icon name), `sort_order` (number)
  - Validation via `react-hook-form` + `zod` resolver
  - Used both for create (dialog) and edit (inline row editing)

- [ ] **10.3** Create `apps/app-admin/src/components/menu/CategoryTable.tsx`

  - TanStack Table with columns: drag handle (sort_order), colored swatch + name, icon, active toggle, product count, edit button, delete button
  - Row drag-and-drop for `sort_order` reordering (use `@dnd-kit/sortable`)
  - Inline row edit → opens `CategoryForm` in a sheet/dialog
  - Delete with confirmation dialog; shows error toast if products reference it

- [ ] **10.4** Create `apps/app-admin/src/app/menu/categories/page.tsx`

  - Fetches categories via `useCategories`
  - "Nueva categoría" button → opens `CategoryForm` in dialog
  - Renders `<CategoryTable />`

- [ ] **10.5** Create `apps/app-admin/src/app/menu/page.tsx`

  - Redirect to `/menu/categories`

- [ ] **10.6** Test: create category → appears in table; drag to reorder → sort_order updates; delete → removed

- [ ] **10.7** Commit

```bash
git add apps/app-admin/src/app/menu/ apps/app-admin/src/components/menu/CategoryForm.tsx apps/app-admin/src/components/menu/CategoryTable.tsx
git commit -m "feat(app-admin): add category management UI with sortable table and form"
```

---

## Task 11: Menu section — Product management UI

**Files:**
- Create: `apps/app-admin/src/app/menu/products/page.tsx`
- Create: `apps/app-admin/src/app/menu/products/new/page.tsx`
- Create: `apps/app-admin/src/app/menu/products/[id]/page.tsx`
- Create: `apps/app-admin/src/components/menu/ProductForm.tsx`
- Create: `apps/app-admin/src/components/menu/ProductTable.tsx`
- Create: `apps/app-admin/src/components/menu/ProductImageUpload.tsx`
- Create: `apps/app-admin/src/components/menu/PriceHistoryDrawer.tsx`

- [ ] **11.1** Create `apps/app-admin/src/components/menu/ProductImageUpload.tsx`

  - Drag-and-drop zone + click-to-select
  - Shows preview of current image (from `image_url`) if it exists
  - On file select: validates type (jpg/png/webp) and size (max 2MB)
  - Does NOT upload directly — returns the `File` object to the parent form
  - Parent form calls `updateProduct(..., imageFile)` which invokes `uploadProductImage`

- [ ] **11.2** Create `apps/app-admin/src/components/menu/PriceHistoryDrawer.tsx`

  - Sheet that opens when clicking a product's price cell
  - Fetches `usePriceHistory(productId)`
  - Shows table: old price → new price, date, changed by (staff name)
  - Empty state: "No hay historial de precios"

- [ ] **11.3** Create `apps/app-admin/src/components/menu/ProductForm.tsx`

  - Fields:
    - `name` (text, required)
    - `description` (textarea, optional)
    - `category_id` (select from `useCategories`)
    - `price` (number, positive, required)
    - `target` (radio: Cocina / Barra)
    - `station` (text, optional — appears when target=kitchen: grill/cold/desserts/default)
    - `is_pool_chip` (checkbox — only visible when target=bar)
    - `is_available` (toggle)
    - `allergens_json` (multi-select checkboxes: gluten, dairy, eggs, fish, shellfish, tree_nuts, peanuts, soy, sesame)
    - `sort_order` (number)
    - `<ProductImageUpload />` component
  - Full `react-hook-form` + `zod` validation
  - Submit calls `createProduct` or `updateProduct` depending on mode

- [ ] **11.4** Create `apps/app-admin/src/components/menu/ProductTable.tsx`

  - TanStack Table with columns: image thumbnail, name, category badge, price (clickable → PriceHistoryDrawer), target badge, availability toggle, actions (edit, delete)
  - Filter row: category select, target select, availability select, text search
  - Pagination: 25 rows per page
  - Availability toggle calls `toggleAvailability` mutation with optimistic update
  - Delete with confirmation

- [ ] **11.5** Create `apps/app-admin/src/app/menu/products/page.tsx`

  - Renders `<ProductTable />` with filter controls
  - "Nuevo producto" button → navigates to `/menu/products/new`

- [ ] **11.6** Create `apps/app-admin/src/app/menu/products/new/page.tsx`

  - Renders `<ProductForm />` in create mode
  - On success: redirect to `/menu/products`

- [ ] **11.7** Create `apps/app-admin/src/app/menu/products/[id]/page.tsx`

  - Fetches product by id
  - Renders `<ProductForm />` in edit mode pre-filled
  - Nav links: **Editar** / **Modificadores** / **Receta**

- [ ] **11.8** Test: create product with image → image appears in Supabase Storage + `image_url` set; change price → `price_history` row created; toggle availability → updates instantly

- [ ] **11.9** Commit

```bash
git add apps/app-admin/src/app/menu/products/ \
        apps/app-admin/src/components/menu/ProductForm.tsx \
        apps/app-admin/src/components/menu/ProductTable.tsx \
        apps/app-admin/src/components/menu/ProductImageUpload.tsx \
        apps/app-admin/src/components/menu/PriceHistoryDrawer.tsx
git commit -m "feat(app-admin): add product management UI with image upload and price history"
```

---

## Task 12: Menu section — Modifier groups UI

**Files:**
- Create: `apps/app-admin/src/app/menu/products/[id]/modifiers/page.tsx`
- Create: `apps/app-admin/src/components/menu/ModifierGroupForm.tsx`
- Create: `apps/app-admin/src/components/menu/ModifierGroupList.tsx`

- [ ] **12.1** Create `apps/app-admin/src/components/menu/ModifierGroupForm.tsx`

  - Fields: `name` (text), `is_required` (checkbox), `max_selections` (number, min 1)
  - Dynamic options list: each option has `label` (text) + `extraPrice` (number, optional, default 0)
  - "Agregar opción" button adds a new option row; delete button per row
  - Minimum 1 option enforced
  - Example: Group "Temperatura" with options ["Sin hielo", "Con hielo", "Extra hielo"]

- [ ] **12.2** Create `apps/app-admin/src/components/menu/ModifierGroupList.tsx`

  - Lists all modifier groups for a product with their options shown as badges
  - Edit button per group → opens `ModifierGroupForm` in a sheet
  - Delete button per group with confirmation

- [ ] **12.3** Create `apps/app-admin/src/app/menu/products/[id]/modifiers/page.tsx`

  - Fetches `useProductModifiers(productId)`
  - "Agregar grupo de modificadores" button → opens `ModifierGroupForm` in dialog
  - Renders `<ModifierGroupList />`

- [ ] **12.4** Test: add modifier group with 3 options → appears in list; web-customer's ModifierSelector renders these options when ordering

- [ ] **12.5** Commit

```bash
git add apps/app-admin/src/app/menu/products/\[id\]/modifiers/ \
        apps/app-admin/src/components/menu/ModifierGroupForm.tsx \
        apps/app-admin/src/components/menu/ModifierGroupList.tsx
git commit -m "feat(app-admin): add modifier group management UI per product"
```

---

## Task 13: Menu section — Combos & Happy Hours UI

**Files:**
- Create: `apps/app-admin/src/app/menu/combos/page.tsx`
- Create: `apps/app-admin/src/components/menu/ComboForm.tsx`
- Create: `apps/app-admin/src/components/menu/ComboTable.tsx`
- Create: `apps/app-admin/src/app/menu/happy-hours/page.tsx`
- Create: `apps/app-admin/src/components/menu/HappyHourForm.tsx`
- Create: `apps/app-admin/src/components/menu/HappyHourTable.tsx`

- [ ] **13.1** Create `apps/app-admin/src/components/menu/ComboForm.tsx`

  - Fields: `name`, `description`, `price`
  - Product picker: searchable multi-select with quantity per product
  - Live price suggestion: shows sum of individual prices vs custom combo price
  - `is_active` toggle

- [ ] **13.2** Create `apps/app-admin/src/components/menu/ComboTable.tsx`

  - TanStack Table: name, products list (as badges), price vs original price, active toggle, edit/delete

- [ ] **13.3** Create `apps/app-admin/src/app/menu/combos/page.tsx`

  - "Nuevo combo" button + `<ComboTable />`

- [ ] **13.4** Create `apps/app-admin/src/components/menu/HappyHourForm.tsx`

  - Fields: `name`, `start_time` (time picker), `end_time` (time picker), `days_of_week` (checkboxes: L M M J V S D), `discount_type` (radio: Porcentaje / Monto fijo), `discount_value`, `is_active`
  - Real-time preview: "Lunes a Viernes de 18:00 a 20:00 — 20% de descuento"

- [ ] **13.5** Create `apps/app-admin/src/components/menu/HappyHourTable.tsx`

  - Shows: name, schedule summary, discount summary, active toggle, edit/delete

- [ ] **13.6** Create `apps/app-admin/src/app/menu/happy-hours/page.tsx`

  - "Nueva regla" button + `<HappyHourTable />`

- [ ] **13.7** Test: create combo → appears in web-customer; create happy hour → price adjusts during configured hours

- [ ] **13.8** Commit

```bash
git add apps/app-admin/src/app/menu/combos/ \
        apps/app-admin/src/app/menu/happy-hours/ \
        apps/app-admin/src/components/menu/ComboForm.tsx \
        apps/app-admin/src/components/menu/ComboTable.tsx \
        apps/app-admin/src/components/menu/HappyHourForm.tsx \
        apps/app-admin/src/components/menu/HappyHourTable.tsx
git commit -m "feat(app-admin): add combo and happy hour management UI"
```

---

## Task 14: Inventory section — Ingredient management UI

**Files:**
- Create: `apps/app-admin/src/app/inventory/layout.tsx`
- Create: `apps/app-admin/src/app/inventory/page.tsx`
- Create: `apps/app-admin/src/app/inventory/ingredients/page.tsx`
- Create: `apps/app-admin/src/app/inventory/ingredients/new/page.tsx`
- Create: `apps/app-admin/src/app/inventory/ingredients/[id]/page.tsx`
- Create: `apps/app-admin/src/app/inventory/ingredients/[id]/adjust/page.tsx`
- Create: `apps/app-admin/src/components/inventory/IngredientForm.tsx`
- Create: `apps/app-admin/src/components/inventory/IngredientTable.tsx`
- Create: `apps/app-admin/src/components/inventory/StockAdjustmentForm.tsx`
- Create: `apps/app-admin/src/components/inventory/StockMovementHistory.tsx`

- [ ] **14.1** Create `apps/app-admin/src/app/inventory/layout.tsx`

  - Nav tabs: **Stock** / **Ingredientes** / **Desperdicios** / **Reposiciones** / **Reportes**

- [ ] **14.2** Create `apps/app-admin/src/components/inventory/IngredientForm.tsx`

  - Fields: `name`, `unit` (select: ml / gr / unidades), `stock_current` (number, 3 decimal places), `stock_alert_threshold` (number, 3 decimal places), `cost_per_unit` (number, 4 decimal places, label adapts: "costo por ml" / "costo por gr" / "costo por unidad")
  - Inline margin preview: "A este costo, un Gin Tónico tiene 38% de margen" (only shown when ingredient is used in at least one recipe)

- [ ] **14.3** Create `apps/app-admin/src/components/inventory/IngredientTable.tsx`

  - TanStack Table: name, unit, stock bar (colored: green/amber/red by status), current stock + unit, alert threshold, cost per unit, edit/delete/adjust buttons
  - Stock bar is a `<progress>`-like visual: 0% to 200% relative to threshold
  - Below-threshold rows highlighted with amber background
  - Critical rows (below 50% of threshold) highlighted with red background

- [ ] **14.4** Create `apps/app-admin/src/components/inventory/StockAdjustmentForm.tsx`

  - Fields: `type` (select: Compra / Ajuste), `quantity` (number, allows negative for adjustments), `notes` (textarea required)
  - Shows current stock level prominently
  - Preview: "Stock actual: 450 ml → Nuevo stock: 950 ml"

- [ ] **14.5** Create `apps/app-admin/src/components/inventory/StockMovementHistory.tsx`

  - TanStack Table: date, type badge (purchase/sale/waste/adjustment with color), quantity (+/-), notes, staff name
  - Paginated: 20 rows, load more button

- [ ] **14.6** Create route pages:
  - `apps/app-admin/src/app/inventory/ingredients/page.tsx` — "Nuevo ingrediente" + `<IngredientTable />`
  - `apps/app-admin/src/app/inventory/ingredients/new/page.tsx` — `<IngredientForm />` create mode
  - `apps/app-admin/src/app/inventory/ingredients/[id]/page.tsx` — `<IngredientForm />` edit mode + `<StockMovementHistory />`
  - `apps/app-admin/src/app/inventory/ingredients/[id]/adjust/page.tsx` — `<StockAdjustmentForm />`
  - `apps/app-admin/src/app/inventory/page.tsx` — redirect to `/inventory/stock`

- [ ] **14.7** Test: create ingredient → appears in table; adjust stock → movement history shows the entry; stock bar updates immediately

- [ ] **14.8** Commit

```bash
git add apps/app-admin/src/app/inventory/ \
        apps/app-admin/src/components/inventory/IngredientForm.tsx \
        apps/app-admin/src/components/inventory/IngredientTable.tsx \
        apps/app-admin/src/components/inventory/StockAdjustmentForm.tsx \
        apps/app-admin/src/components/inventory/StockMovementHistory.tsx
git commit -m "feat(app-admin): add ingredient management UI with stock adjustment and movement history"
```

---

## Task 15: Recipe editor UI

**Files:**
- Create: `apps/app-admin/src/app/menu/products/[id]/recipe/page.tsx`
- Create: `apps/app-admin/src/components/inventory/RecipeEditor.tsx`
- Create: `apps/app-admin/src/components/inventory/RecipeCostCalculator.tsx`

- [ ] **15.1** Create `apps/app-admin/src/components/inventory/RecipeEditor.tsx`

  - Shows current recipe items: ingredient name, quantity, unit
  - "Agregar ingrediente" row: searchable ingredient select + quantity input + unit label (auto-filled from ingredient) + add button
  - Each row has: quantity input (editable inline), delete button
  - "Notas de preparación" textarea at the bottom

- [ ] **15.2** Create `apps/app-admin/src/components/inventory/RecipeCostCalculator.tsx`

  - Reads `computeRecipeCost` result from `useRecipes(productId)`
  - Displays:
    - Cost breakdown table: ingredient name | quantity | unit | cost/unit | line cost
    - **Costo de producción total**: ARS X.XX
    - **Precio de venta**: ARS X.XX (from product.price)
    - **Margen estimado**: XX% (color: green ≥ 60%, amber 40–60%, red < 40%)
  - Updates live as items are added/removed/modified

- [ ] **15.3** Create `apps/app-admin/src/app/menu/products/[id]/recipe/page.tsx`

  - Fetches product + recipe
  - Left panel: `<RecipeEditor />` (2/3 width)
  - Right panel: `<RecipeCostCalculator />` (1/3 width, sticky)
  - "Guardar receta" saves all pending changes in a single `upsertRecipe` + bulk `addRecipeItem` call

- [ ] **15.4** Test: add 3 ingredients to recipe → cost calculator updates; save → changes persisted; margin shown in correct color

- [ ] **15.5** Commit

```bash
git add apps/app-admin/src/app/menu/products/\[id\]/recipe/ \
        apps/app-admin/src/components/inventory/RecipeEditor.tsx \
        apps/app-admin/src/components/inventory/RecipeCostCalculator.tsx
git commit -m "feat(app-admin): add recipe editor with live cost and margin calculator"
```

---

## Task 16: Stock dashboard + low-stock alerts

**Files:**
- Create: `apps/app-admin/src/app/inventory/stock/page.tsx`
- Create: `apps/app-admin/src/components/inventory/StockDashboard.tsx`
- Create: `apps/app-admin/src/components/inventory/LowStockAlert.tsx`

- [ ] **16.1** Create `apps/app-admin/src/components/inventory/LowStockAlert.tsx`

  - Card per ingredient below threshold
  - Red border for critical (< threshold), amber for low (1–1.5× threshold)
  - Shows: name, current stock, unit, threshold, "Ajustar stock" quick-action button
  - Empty state (all good): green checkmark "Todo el stock está OK"

- [ ] **16.2** Create `apps/app-admin/src/components/inventory/StockDashboard.tsx`

  - Top section: `<LowStockAlert />` showing all ingredients at risk
  - Main section: full `<IngredientTable />` (read-only variant — no edit/delete, but has "Ajustar" button)
  - Summary bar at top: total ingredients | OK count | Low count | Critical count

- [ ] **16.3** Create `apps/app-admin/src/app/inventory/stock/page.tsx`

  - Renders `<StockDashboard />`
  - Auto-refreshes every 60 seconds via `refetchInterval` in TanStack Query

- [ ] **16.4** Test: lower an ingredient's stock below threshold → it appears in LowStockAlert with correct color; summary counts update

- [ ] **16.5** Commit

```bash
git add apps/app-admin/src/app/inventory/stock/ \
        apps/app-admin/src/components/inventory/StockDashboard.tsx \
        apps/app-admin/src/components/inventory/LowStockAlert.tsx
git commit -m "feat(app-admin): add stock dashboard with low-stock alert cards"
```

---

## Task 17: Waste log UI

**Files:**
- Create: `apps/app-admin/src/app/inventory/waste/page.tsx`
- Create: `apps/app-admin/src/components/inventory/WasteLogTable.tsx`
- Create: `apps/app-admin/src/components/inventory/WasteEntryForm.tsx`

- [ ] **17.1** Create `apps/app-admin/src/components/inventory/WasteEntryForm.tsx`

  - Fields: `ingredient_id` OR `product_id` (toggle selector: "¿Es un ingrediente o un producto?"), `quantity`, `unit` (auto-filled from ingredient when ingredient mode), `reason` (select: Vencimiento / Accidente / Error de preparación / Otro), `notes` (required when reason=other), `estimated_cost` (auto-calculated from ingredient cost when possible, editable)
  - "Registrar desperdicio" submit

- [ ] **17.2** Create `apps/app-admin/src/components/inventory/WasteLogTable.tsx`

  - TanStack Table: date, ingredient/product name, quantity + unit, reason badge (with color), estimated cost, notes, registered by
  - Date range filter: last 7 / 30 / 90 days or custom
  - Summary row at top: total entries, total estimated cost, most wasted ingredient

- [ ] **17.3** Create `apps/app-admin/src/app/inventory/waste/page.tsx`

  - "Registrar desperdicio" button → opens `WasteEntryForm` in dialog
  - Renders `<WasteLogTable />`

- [ ] **17.4** Test: create waste entry for an ingredient → `ingredient_stock_movements` row created with `type=waste`; stock_current decreases

- [ ] **17.5** Commit

```bash
git add apps/app-admin/src/app/inventory/waste/ \
        apps/app-admin/src/components/inventory/WasteLogTable.tsx \
        apps/app-admin/src/components/inventory/WasteEntryForm.tsx
git commit -m "feat(app-admin): add waste log UI with stock auto-deduction"
```

---

## Task 18: Restock request management UI

**Files:**
- Create: `apps/app-admin/src/app/inventory/restock-requests/page.tsx`
- Create: `apps/app-admin/src/components/inventory/RestockRequestTable.tsx`

- [ ] **18.1** Create `apps/app-admin/src/components/inventory/RestockRequestTable.tsx`

  - TanStack Table: date, ingredient name + current stock bar, requested by (staff name + role badge), quantity requested + unit, status badge, notes, approve/reject buttons
  - Approve button: calls `approveRestockRequest` → row status changes to "approved" with green badge, buttons disabled
  - Reject button: opens a small input popover asking for rejection reason → calls `rejectRestockRequest`
  - Approved rows show a "Convertir en orden de compra" link (navigates to Plan 9's `/procurement/purchase-orders/new?from=restock&id=...`)
  - Filter tabs: Pendientes | Aprobadas | Rechazadas | Todas
  - Badge count on "Pendientes" tab

- [ ] **18.2** Create `apps/app-admin/src/app/inventory/restock-requests/page.tsx`

  - Renders `<RestockRequestTable />`
  - Auto-refreshes every 30 seconds (kitchen/bar staff can send requests at any time)
  - Toast notification when new pending requests arrive (subscribe to Supabase Realtime `restock_requests` INSERT)

- [ ] **18.3** Test: approve a pending request → status changes; reject with reason → reason stored in `notes`

- [ ] **18.4** Commit

```bash
git add apps/app-admin/src/app/inventory/restock-requests/ \
        apps/app-admin/src/components/inventory/RestockRequestTable.tsx
git commit -m "feat(app-admin): add restock request management with approve/reject UI"
```

---

## Task 19: Consumption reports + restock suggestion

**Files:**
- Create: `apps/app-admin/src/app/inventory/reports/page.tsx`
- Create: `apps/app-admin/src/components/inventory/ConsumptionReport.tsx`
- Create: `apps/app-admin/src/components/inventory/RestockSuggestion.tsx`

- [ ] **19.1** Write test: `computeRestockSuggestion(ingredientId, weeklyConsumption=500, stockCurrent=200, targetWeeks=2)` returns 800

- [ ] **19.2** Run test — verify PASS (it tests a pure function from stock-calculations.ts)

- [ ] **19.3** Create `apps/app-admin/src/components/inventory/ConsumptionReport.tsx`

  - Aggregates `ingredient_stock_movements` where `type=sale` for the selected period
  - Period selector: última semana / últimas 2 semanas / último mes
  - Bar chart (recharts or tremor): one bar per ingredient, sorted by consumption descending
  - Table below chart: ingredient name | unit | total consumed | avg per day | cost of consumption
  - Export to CSV button

- [ ] **19.4** Create `apps/app-admin/src/components/inventory/RestockSuggestion.tsx`

  - Uses `computeRestockSuggestion` for each ingredient
  - Based on last 7 days of actual consumption (`type=sale` movements)
  - Table: ingredient | weekly avg consumption | stock current | suggested order qty | estimated cost
  - "Generar orden de compra" button: pre-fills Plan 9's purchase order with all suggested quantities
  - Ingredients with 0 consumption in period are hidden (not suggested)

- [ ] **19.5** Create `apps/app-admin/src/app/inventory/reports/page.tsx`

  - Two tabs: **Consumo** (ConsumptionReport) / **Sugerencias de compra** (RestockSuggestion)

- [ ] **19.6** Test: after selling products with recipes, consumption report shows correct ml/gr used

- [ ] **19.7** Commit

```bash
git add apps/app-admin/src/app/inventory/reports/ \
        apps/app-admin/src/components/inventory/ConsumptionReport.tsx \
        apps/app-admin/src/components/inventory/RestockSuggestion.tsx
git commit -m "feat(app-admin): add consumption report and auto-restock suggestion UI"
```

---

## Task 20: Integration test — full menu-to-order-to-stock flow

- [ ] **20.1** E2E test (Playwright or manual verification):

  1. In app-admin:
     - Create category "Tragos" (color #6366f1, icon 🍹)
     - Create product "Gin Tónico" (target=bar, price=1200)
     - Upload product image
     - Create recipe: Gin 60ml + Tónica 150ml + Lima 10ml
     - Verify cost calculator shows ~38% margin at configured ingredient costs
     - Create modifier group "Hielo" (options: Normal / Sin hielo / Doble hielo)
     - Change price to 1400 → verify `price_history` row exists with old=1200, new=1400

  2. In web-customer (QR flow):
     - Product "Gin Tónico" appears in menu under "Tragos" with the uploaded image
     - Modifier selector shows "Hielo" group
     - Place order

  3. In app-bar:
     - Order appears as bar ticket (target=bar)

  4. Back in app-admin (inventory):
     - After order is marked as delivered in app-bar:
       - `ingredient_stock_movements` has 3 new `type=sale` rows (gin -60, tónica -150, lima -10)
       - `ingredients.stock_current` decreased accordingly
     - Consumption report shows today's consumption includes these amounts
     - Restock suggestion reflects the depletion

  5. Log waste entry (gin 100ml, reason=accident):
     - `waste_log` row created
     - gin stock decreases by additional 100ml
     - movement row with `type=waste` created

  6. Kitchen sends restock request for "Limones" via app-kitchen:
     - Appears in admin's restock-requests with status=pending
     - Approve it → status changes to approved

- [ ] **20.2** Commit: `test: add end-to-end menu, recipe, and stock integration test`

---

## Verification Checklist

- [ ] `pnpm build --filter app-admin` — zero TypeScript errors
- [ ] `pnpm test --filter app-admin` — all unit tests pass
- [ ] Category CRUD: create, rename, reorder (drag), delete (blocked when products exist)
- [ ] Product CRUD: create with image → image visible in Supabase Storage dashboard
- [ ] Price change on any product → `price_history` row auto-created by DB trigger
- [ ] `PriceHistoryDrawer` shows at least one entry after a price change
- [ ] Modifier group with options appears in web-customer product modal
- [ ] Combo appears in web-customer menu as a separate orderable item
- [ ] Happy hour active during configured hours — web-customer shows discounted price
- [ ] Ingredient CRUD: create with `unit=ml`, set threshold at 200ml
- [ ] Stock adjustment (purchase +500ml) → `stock_current` updated + movement row inserted
- [ ] Stock bar in dashboard goes from red to green after adjustment
- [ ] Recipe for "Gin Tónico": add 3 items, verify cost calculator shows correct total
- [ ] Sell "Gin Tónico" order → stock deducted for all 3 recipe ingredients automatically
  - **Note:** The deduction logic lives in `apps/local-server/src/services/stock.service.ts` (Plan 1 Task 3.6). It triggers when an order item is marked `delivered`. This checklist item verifies that the recipe data set up here (Plan 7) connects correctly with the deduction service from Plan 1. Ensure Plan 1 is complete before running this check.
- [ ] Waste entry for ingredient → stock decreases + waste_log row + movement row created
- [ ] Low-stock dashboard shows correct ingredients in amber/red with correct counts
- [ ] Consumption report shows correct ml consumed in selected period
- [ ] Restock suggestion shows non-zero values for ingredients used this week
- [ ] Restock request from app-kitchen/app-bar appears in admin's pending list
- [ ] Approve/reject restock request → status updates, buttons disabled
- [ ] Supabase Realtime: menu change in admin propagates to web-customer without page refresh
- [ ] RLS: Supabase anon key cannot modify products (only service role can)

---

*Previous: [Plan 6 — Admin Panel & Analytics](2026-03-21-plan-6-admin-analytics.md)*
*Next: [Plan 8 — Employee Management](2026-03-21-plan-8-employee-management.md)*
