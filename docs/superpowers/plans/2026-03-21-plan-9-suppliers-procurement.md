# My Way — Plan 9: Suppliers & Procurement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete suppliers and procurement module inside `app-admin`: supplier CRUD with assigned ingredients, restock request approval workflow, purchase order lifecycle (create → send → receive → auto-update stock), expense management with receipt photo upload, and a full P&L view exportable as PDF.

**Architecture:** `app-admin` is a cloud-only Next.js app (Vercel + Supabase). All data operations go directly to Supabase via server actions or route handlers using the service role client. Receipt photos are uploaded to Supabase Storage. P&L PDF generation runs client-side via `@react-pdf/renderer`. Realtime subscriptions on `restock_requests` keep the pending-requests view live.

**Tech Stack:** Next.js 15 (App Router), Supabase (PostgreSQL + Storage + Realtime), `@react-pdf/renderer`, TanStack Query 5, shadcn/ui, Zustand, `@myway/types`, `@myway/db`, `@myway/auth`

**Depends on:** Plan 7 (Admin Panel & Analytics — establishes `app-admin` scaffold, auth, and `daily_accounting` data)

---

## File Map

```
apps/app-admin/src/
│
├── app/
│   ├── suppliers/
│   │   ├── page.tsx                          # Supplier list + "New supplier" CTA
│   │   ├── new/page.tsx                      # Create supplier form
│   │   ├── [id]/page.tsx                     # Supplier detail: info + assigned ingredients
│   │   └── [id]/edit/page.tsx                # Edit supplier form
│   │
│   ├── procurement/
│   │   ├── page.tsx                          # Procurement hub: tabs for Restock / POs
│   │   ├── restock/page.tsx                  # Pending restock requests list
│   │   ├── purchase-orders/page.tsx          # All purchase orders list
│   │   ├── purchase-orders/new/page.tsx      # Create PO manually or from restock request
│   │   └── purchase-orders/[id]/page.tsx     # PO detail: items, status, receive flow
│   │
│   ├── expenses/
│   │   ├── page.tsx                          # Expense list + filters
│   │   ├── new/page.tsx                      # Register expense form (with receipt upload)
│   │   ├── [id]/page.tsx                     # Expense detail + receipt preview
│   │   ├── categories/page.tsx               # Expense category CRUD
│   │   └── categories/new/page.tsx           # Create category form
│   │
│   └── profit-loss/
│       └── page.tsx                          # Full P&L view + PDF export
│
├── components/
│   ├── suppliers/
│   │   ├── SupplierForm.tsx                  # Shared create/edit form
│   │   ├── SupplierCard.tsx                  # Card in list view
│   │   ├── SupplierIngredientTable.tsx       # Assigned ingredients + unit costs
│   │   └── AssignIngredientDialog.tsx        # Dialog to link ingredient → supplier
│   │
│   ├── procurement/
│   │   ├── RestockRequestCard.tsx            # Single restock request with approve/reject
│   │   ├── RejectReasonDialog.tsx            # Modal to enter rejection reason
│   │   ├── PurchaseOrderForm.tsx             # PO create/edit form
│   │   ├── PurchaseOrderItemRow.tsx          # One ingredient row in PO
│   │   ├── PurchaseOrderStatusBadge.tsx      # Status pill (pending/received/cancelled)
│   │   └── ReceiveOrderDialog.tsx            # Confirm received quantities per item
│   │
│   ├── expenses/
│   │   ├── ExpenseForm.tsx                   # Register expense + receipt upload
│   │   ├── ExpenseFilters.tsx                # Date range, category, amount filter bar
│   │   ├── ExpenseTable.tsx                  # Paginated expense list
│   │   ├── ExpenseCategoryForm.tsx           # Create/edit category
│   │   ├── ReceiptUploader.tsx               # Supabase Storage upload widget
│   │   └── MonthlyCategoryChart.tsx          # Bar chart: monthly expenses by category
│   │
│   └── profit-loss/
│       ├── PLSummaryCard.tsx                 # Revenue / Expenses / Net profit cards
│       ├── PLMonthlyTable.tsx                # Month-by-month breakdown table
│       ├── PLCostBreakdown.tsx               # Ingredient cost vs other expenses
│       └── PLPdfDocument.tsx                 # @react-pdf/renderer document template
│
├── lib/
│   ├── suppliers.ts                          # Supabase queries: suppliers + supplier_products
│   ├── restock.ts                            # Supabase queries: restock_requests
│   ├── purchase-orders.ts                    # Supabase queries: purchase_orders + items
│   ├── expenses.ts                           # Supabase queries: expenses + categories
│   ├── profit-loss.ts                        # Aggregate revenue + expense + cost data
│   └── storage.ts                            # Supabase Storage: upload/delete receipts
│
└── types/
    └── procurement.ts                        # Local TS types for this module
```

---

## Task 1: Types + DB helpers for procurement module

**Files:**
- Create: `apps/app-admin/src/types/procurement.ts`
- Create: `apps/app-admin/src/lib/suppliers.ts`
- Create: `apps/app-admin/src/lib/restock.ts`
- Create: `apps/app-admin/src/lib/purchase-orders.ts`
- Create: `apps/app-admin/src/lib/expenses.ts`
- Create: `apps/app-admin/src/lib/profit-loss.ts`
- Create: `apps/app-admin/src/lib/storage.ts`

- [ ] **1.1** Write tests for `lib/suppliers.ts`:
  - `getSuppliers(venueId)` returns array sorted by name
  - `getSupplierById(id)` returns supplier with `supplier_products` joined (ingredient name, unit, unit_cost)
  - `createSupplier(data)` inserts and returns the new row
  - `updateSupplier(id, data)` returns updated row
  - `deleteSupplier(id)` soft-deletes by setting `is_active = false`
  - `assignIngredientToSupplier(supplierId, ingredientId, unitCost)` upserts `supplier_products`
  - `removeIngredientFromSupplier(supplierId, ingredientId)` deletes from `supplier_products`

- [ ] **1.2** Run tests — verify FAIL

- [ ] **1.3** Create `apps/app-admin/src/types/procurement.ts`

```typescript
export type RestockRequestStatus = 'pending' | 'approved' | 'rejected' | 'purchased'
export type PurchaseOrderStatus = 'pending' | 'received' | 'cancelled'
export type ExpensePaymentMethod = 'cash' | 'transfer' | 'mp' | 'card'

export interface Supplier {
  id: string
  venueId: string
  name: string
  contactName: string | null
  phone: string | null
  email: string | null
  notes: string | null
  isActive: boolean
  createdAt: Date
}

export interface SupplierProduct {
  id: string
  supplierId: string
  ingredientId: string
  ingredientName: string
  ingredientUnit: 'ml' | 'gr' | 'units'
  unitCost: number | null
  notes: string | null
}

export interface SupplierWithProducts extends Supplier {
  products: SupplierProduct[]
}

export interface RestockRequest {
  id: string
  venueId: string
  ingredientId: string
  ingredientName: string
  ingredientUnit: 'ml' | 'gr' | 'units'
  stockCurrent: number
  requestedBy: string
  requestedByName: string
  quantityRequested: number
  status: RestockRequestStatus
  notes: string | null
  resolvedBy: string | null
  createdAt: Date
  resolvedAt: Date | null
}

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  ingredientId: string
  ingredientName: string
  ingredientUnit: 'ml' | 'gr' | 'units'
  quantityOrdered: number
  quantityReceived: number | null
  unitCost: number
  totalCost: number
}

export interface PurchaseOrder {
  id: string
  venueId: string
  supplierId: string
  supplierName: string
  status: PurchaseOrderStatus
  totalCost: number
  orderedBy: string | null
  orderedByName: string | null
  orderedAt: Date
  receivedAt: Date | null
  notes: string | null
  items: PurchaseOrderItem[]
}

export interface ExpenseCategory {
  id: string
  venueId: string
  name: string
  color: string
  icon: string | null
}

export interface Expense {
  id: string
  venueId: string
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  description: string
  amount: number
  date: string
  paymentMethod: ExpensePaymentMethod | null
  receiptUrl: string | null
  registeredBy: string | null
  registeredByName: string | null
  createdAt: Date
}

export interface PLMonth {
  month: string          // 'YYYY-MM'
  revenue: number
  ingredientCost: number
  otherExpenses: number
  totalExpenses: number
  netProfit: number
  grossMarginPct: number
}

export interface PLSummary {
  revenueTotal: number
  ingredientCostTotal: number
  otherExpensesTotal: number
  totalExpenses: number
  netProfit: number
  months: PLMonth[]
}
```

- [ ] **1.4** Create `apps/app-admin/src/lib/suppliers.ts`
  - Use `@myway/auth` `createServerClient()` (service role) for all queries
  - `getSuppliers`: `SELECT * FROM suppliers WHERE venue_id = $1 AND is_active = true ORDER BY name`
  - `getSupplierById`: join `supplier_products` → `ingredients` to include ingredient details
  - `createSupplier` / `updateSupplier`: validate required `name` field before insert/update
  - `deleteSupplier`: set `is_active = false`, never hard-delete
  - `assignIngredientToSupplier`: upsert on `(supplier_id, ingredient_id)` unique constraint
  - `removeIngredientFromSupplier`: hard delete from `supplier_products` (no history needed here)

- [ ] **1.5** Run supplier tests — verify PASS

- [ ] **1.6** Write tests for `lib/restock.ts`:
  - `getPendingRestockRequests(venueId)` returns only `status = 'pending'`, joined with ingredient + staff names
  - `approveRestockRequest(id, resolvedBy)` sets `status = 'approved'`, `resolved_by`, `resolved_at = NOW()`
  - `rejectRestockRequest(id, resolvedBy, reason)` sets `status = 'rejected'`, appends reason to notes
  - `markRestockPurchased(id)` sets `status = 'purchased'`

- [ ] **1.7** Run tests — verify FAIL

- [ ] **1.8** Create `apps/app-admin/src/lib/restock.ts` implementing the above functions

- [ ] **1.9** Run restock tests — verify PASS

- [ ] **1.10** Write tests for `lib/purchase-orders.ts`:
  - `getPurchaseOrders(venueId)` returns all POs with supplier name, ordered by `ordered_at DESC`
  - `getPurchaseOrderById(id)` returns PO with all items joined with ingredient details
  - `createPurchaseOrder(data)` inserts PO header + items, computes `total_cost` as `SUM(qty * unit_cost)`
  - `updatePurchaseOrderStatus(id, status)` validates transition (`pending → received | cancelled`)
  - `receivePurchaseOrder(id, itemReceipts)` where `itemReceipts` is `{ itemId, quantityReceived }[]`:
    - Sets each item's `quantity_received`
    - Updates `ingredients.stock_current += quantity_received` for each item
    - Inserts `ingredient_stock_movements` row per item (`type = 'purchase'`, positive quantity)
    - Sets PO `status = 'received'`, `received_at = NOW()`
    - All operations in a single Supabase RPC transaction

- [ ] **1.11** Run tests — verify FAIL

- [ ] **1.12** Create `apps/app-admin/src/lib/purchase-orders.ts`
  - `receivePurchaseOrder` calls a Supabase RPC `receive_purchase_order(po_id, item_receipts_json)` to keep stock update atomic
  - Write the migration SQL for this function in `supabase/migrations/20260321000009_receive_po_fn.sql`

- [ ] **1.13** Run purchase order tests — verify PASS

- [ ] **1.14** Write tests for `lib/expenses.ts`:
  - `getExpenseCategories(venueId)` returns all categories
  - `createExpenseCategory(data)` inserts, validates unique name per venue
  - `updateExpenseCategory(id, data)` updates name/color/icon
  - `deleteExpenseCategory(id)` hard-deletes only if no expenses reference it; else returns error
  - `getExpenses(venueId, filters)` where filters = `{ from?, to?, categoryId?, minAmount?, maxAmount? }` — returns paginated results (20 per page)
  - `createExpense(data)` inserts expense, returns full row with category joined
  - `deleteExpense(id)` hard-deletes the expense row and its receipt from Storage (call `deleteReceipt(receiptUrl)` if `receipt_url` is set); returns void
  - `getMonthlyCategoryTotals(venueId, year)` returns `{ month, categoryName, total }[]`

- [ ] **1.15** Run tests — verify FAIL

- [ ] **1.16** Create `apps/app-admin/src/lib/expenses.ts` implementing the above functions

- [ ] **1.17** Run expense tests — verify PASS

- [ ] **1.18** Write tests for `lib/profit-loss.ts`:
  - `getPLSummary(venueId, from, to)` aggregates `daily_accounting.revenue_total`, `daily_accounting.cost_ingredients`, and `SUM(expenses.amount)` by month
  - Returns `PLSummary` with per-month breakdown and totals

- [ ] **1.19** Run tests — verify FAIL

- [ ] **1.20** Create `apps/app-admin/src/lib/profit-loss.ts`

- [ ] **1.21** Run P&L tests — verify PASS

- [ ] **1.22** Create `apps/app-admin/src/lib/storage.ts`
  - `uploadReceipt(file: File, expenseId: string, venueId: string): Promise<string>` — uploads to `receipts/{venueId}/{expenseId}/{filename}` bucket path, returns public URL; `venueId` comes from the auth session (read from Supabase `auth.users` metadata or the `venues` table for the admin user)
  - `deleteReceipt(receiptUrl: string): Promise<void>` — extracts path from URL, removes from Storage
  - Bucket name: `expense-receipts` (public bucket with RLS allowing admin uploads only)

- [ ] **1.23** Commit: `feat(app-admin): add procurement types + DB helpers (suppliers, restock, POs, expenses, P&L)`

---

## Task 2: Supabase migration — `receive_purchase_order` RPC

**Files:**
- Create: `supabase/migrations/20260321000009_receive_po_fn.sql`

- [ ] **2.1** Create `supabase/migrations/20260321000009_receive_po_fn.sql`

```sql
-- receive_purchase_order(po_id UUID, item_receipts JSONB)
-- item_receipts format: [{"item_id": "uuid", "quantity_received": 2.5}, ...]
-- Atomically: update each POI quantity_received, update ingredient stock, insert movements, close PO
CREATE OR REPLACE FUNCTION receive_purchase_order(
  p_po_id UUID,
  p_item_receipts JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receipt JSONB;
  v_item_id UUID;
  v_qty DECIMAL(10,3);
  v_ingredient_id UUID;
  v_unit_cost DECIMAL(10,4);
  v_ordered_by UUID;
BEGIN
  -- Validate PO exists and is in pending status
  IF NOT EXISTS (
    SELECT 1 FROM purchase_orders WHERE id = p_po_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Purchase order % not found or not in pending status', p_po_id;
  END IF;

  -- Get ordered_by for stock movement attribution
  SELECT ordered_by INTO v_ordered_by FROM purchase_orders WHERE id = p_po_id;

  -- Process each item receipt
  FOR v_receipt IN SELECT * FROM jsonb_array_elements(p_item_receipts)
  LOOP
    v_item_id     := (v_receipt->>'item_id')::UUID;
    v_qty         := (v_receipt->>'quantity_received')::DECIMAL;

    -- Fetch ingredient_id and unit_cost from the PO item
    SELECT ingredient_id, unit_cost
      INTO v_ingredient_id, v_unit_cost
      FROM purchase_order_items
     WHERE id = v_item_id AND purchase_order_id = p_po_id;

    IF v_ingredient_id IS NULL THEN
      RAISE EXCEPTION 'PO item % not found in PO %', v_item_id, p_po_id;
    END IF;

    -- Update quantity_received on the PO item
    UPDATE purchase_order_items
       SET quantity_received = v_qty
     WHERE id = v_item_id;

    -- Update ingredient stock
    UPDATE ingredients
       SET stock_current = stock_current + v_qty,
           updated_at    = NOW()
     WHERE id = v_ingredient_id;

    -- Insert stock movement (type = purchase, positive quantity)
    INSERT INTO ingredient_stock_movements
      (ingredient_id, type, quantity, notes, created_by, created_at)
    VALUES
      (v_ingredient_id, 'purchase', v_qty,
       'Recibido en OC #' || p_po_id::TEXT, v_ordered_by, NOW());
  END LOOP;

  -- Close the purchase order
  UPDATE purchase_orders
     SET status      = 'received',
         received_at = NOW()
   WHERE id = p_po_id;
END;
$$;

-- Add indexes to support procurement queries
CREATE INDEX IF NOT EXISTS idx_restock_requests_venue_status
  ON restock_requests(venue_id, status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_venue_status
  ON purchase_orders(venue_id, status);

CREATE INDEX IF NOT EXISTS idx_expenses_venue_date
  ON expenses(venue_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_category
  ON expenses(category_id);

-- Add unique constraint on supplier_products to enable upsert
ALTER TABLE supplier_products
  ADD CONSTRAINT uq_supplier_ingredient UNIQUE (supplier_id, ingredient_id);
```

- [ ] **2.2** Test: call `receive_purchase_order` with valid data → ingredient `stock_current` increases, movement created, PO status = `received`
- [ ] **2.3** Test: call with already-received PO → raises exception, no partial updates
- [ ] **2.4** Commit: `feat(supabase): add receive_purchase_order RPC + procurement indexes`

---

## Task 3: Supplier management UI

**Files:**
- Create: `apps/app-admin/src/components/suppliers/SupplierForm.tsx`
- Create: `apps/app-admin/src/components/suppliers/SupplierCard.tsx`
- Create: `apps/app-admin/src/components/suppliers/SupplierIngredientTable.tsx`
- Create: `apps/app-admin/src/components/suppliers/AssignIngredientDialog.tsx`
- Create: `apps/app-admin/src/app/suppliers/page.tsx`
- Create: `apps/app-admin/src/app/suppliers/new/page.tsx`
- Create: `apps/app-admin/src/app/suppliers/[id]/page.tsx`
- Create: `apps/app-admin/src/app/suppliers/[id]/edit/page.tsx`

- [ ] **3.1** Write test: `SupplierForm` renders all fields (name, contact, phone, email, notes); submitting with empty name shows validation error
- [ ] **3.2** Run test — verify FAIL

- [ ] **3.3** Create `apps/app-admin/src/components/suppliers/SupplierForm.tsx`
  - Fields: name (required), contact_name, phone, email, notes (textarea)
  - Controlled form with local state; onSubmit calls `createSupplier` or `updateSupplier`
  - Shows field-level validation errors (name required)
  - Submit button shows spinner while saving

- [ ] **3.4** Run SupplierForm test — verify PASS

- [ ] **3.5** Create `apps/app-admin/src/components/suppliers/SupplierCard.tsx`
  - Shows: supplier name (bold), contact name, phone, email (as mailto link), "active" badge
  - Action buttons: "Ver detalle" (→ `/suppliers/[id]`), "Editar" (→ `/suppliers/[id]/edit`)
  - "Desactivar" button calls `deleteSupplier` with confirmation dialog; greys out card on success

- [ ] **3.6** Create `apps/app-admin/src/components/suppliers/SupplierIngredientTable.tsx`
  - Table columns: Ingrediente | Unidad | Costo unitario | Notas | Acciones
  - "Acciones" column: "Editar costo" (inline edit) + "Quitar" (calls `removeIngredientFromSupplier`)
  - Inline cost edit: click pencil icon → input becomes editable → confirm on blur/enter
  - Empty state: "Sin insumos asignados" + "Asignar insumo" button

- [ ] **3.7** Create `apps/app-admin/src/components/suppliers/AssignIngredientDialog.tsx`
  - Dialog triggered from SupplierIngredientTable
  - Searchable combobox of all ingredients (filtered to those NOT yet assigned to this supplier)
  - Unit cost input (decimal, required)
  - Optional notes field
  - On save: calls `assignIngredientToSupplier`, closes dialog, refreshes table

- [ ] **3.8** Create `apps/app-admin/src/app/suppliers/page.tsx`
  - Server component: fetches `getSuppliers(venueId)` directly
  - Renders grid of `SupplierCard` components
  - "Nuevo proveedor" button → `/suppliers/new`
  - Empty state: "Sin proveedores registrados"

- [ ] **3.9** Create `apps/app-admin/src/app/suppliers/new/page.tsx`
  - Renders `SupplierForm` in create mode
  - On success → redirect to `/suppliers/[newId]`

- [ ] **3.10** Create `apps/app-admin/src/app/suppliers/[id]/page.tsx`
  - Server component: fetch `getSupplierById(id)`
  - Shows supplier info card at top (name, contact, phone, email, notes)
  - "Editar" button → `/suppliers/[id]/edit`
  - "Historial de OCs" section: list of purchase orders for this supplier (date, total, status)
  - `SupplierIngredientTable` below with full assignment management
  - "Asignar insumo" CTA opens `AssignIngredientDialog`

- [ ] **3.11** Create `apps/app-admin/src/app/suppliers/[id]/edit/page.tsx`
  - Renders `SupplierForm` pre-populated with existing data
  - On success → redirect to `/suppliers/[id]`

- [ ] **3.12** Test: create supplier → appears in list; assign ingredient with cost → appears in table; remove ingredient → gone from table
- [ ] **3.13** Commit: `feat(app-admin): add supplier management UI (CRUD + ingredient assignment)`

---

## Task 4: Restock request approval workflow

**Files:**
- Create: `apps/app-admin/src/components/procurement/RestockRequestCard.tsx`
- Create: `apps/app-admin/src/components/procurement/RejectReasonDialog.tsx`
- Create: `apps/app-admin/src/app/procurement/restock/page.tsx`

- [ ] **4.1** Write test: `RestockRequestCard` shows ingredient name, quantity, requester, timestamp, and "Aprobar" / "Rechazar" buttons; clicking "Aprobar" calls `approveRestockRequest`; clicking "Rechazar" opens `RejectReasonDialog`
- [ ] **4.2** Run test — verify FAIL

- [ ] **4.3** Create `apps/app-admin/src/components/procurement/RejectReasonDialog.tsx`
  - Dialog with a required textarea: "Motivo del rechazo"
  - "Confirmar rechazo" button — calls `rejectRestockRequest(id, resolvedBy, reason)` then closes
  - Validates reason is not empty before allowing submit

- [ ] **4.4** Create `apps/app-admin/src/components/procurement/RestockRequestCard.tsx`
  - Card layout:
    - Top: ingredient name (bold) + unit badge
    - Middle row: requested quantity | current stock | requested by name | timestamp (relative: "hace 2h")
    - Notes field if present (collapsible)
    - Bottom: "Aprobar" (green) + "Rechazar" (red outline) buttons
  - "Aprobar": calls `approveRestockRequest`, then shows "Crear OC" CTA linking to `/procurement/purchase-orders/new?restockId={id}`
  - "Rechazar": opens `RejectReasonDialog`
  - Approved/rejected cards show outcome badge and are visually muted (not removed from view)

- [ ] **4.5** Run RestockRequestCard test — verify PASS

- [ ] **4.6** Create `apps/app-admin/src/app/procurement/restock/page.tsx`
  - Server component with Supabase Realtime subscription on `restock_requests` (client component wrapper for RT)
  - Two tabs: "Pendientes" | "Historial" (all resolved requests)
  - "Pendientes" tab: list of `RestockRequestCard` sorted by `created_at ASC` (oldest first)
  - "Historial" tab: table with columns: Ingrediente | Solicitado por | Cantidad | Estado | Resuelto por | Fecha resolución
  - Empty state "Pendientes": "No hay solicitudes pendientes — todo en orden"

- [ ] **4.7** Test: staff creates restock request in kitchen/bar app → appears in admin "Pendientes" tab in real-time (Supabase Realtime)
- [ ] **4.8** Test: approve request → status badge changes to "aprobado"; "Crear OC" CTA appears
- [ ] **4.9** Test: reject request with reason → status changes to "rechazado"; reason visible in notes
- [ ] **4.10** Commit: `feat(app-admin): add restock request approval workflow`

---

## Task 5: Purchase order create & management

**Files:**
- Create: `apps/app-admin/src/components/procurement/PurchaseOrderForm.tsx`
- Create: `apps/app-admin/src/components/procurement/PurchaseOrderItemRow.tsx`
- Create: `apps/app-admin/src/components/procurement/PurchaseOrderStatusBadge.tsx`
- Create: `apps/app-admin/src/components/procurement/ReceiveOrderDialog.tsx`
- Create: `apps/app-admin/src/app/procurement/purchase-orders/page.tsx`
- Create: `apps/app-admin/src/app/procurement/purchase-orders/new/page.tsx`
- Create: `apps/app-admin/src/app/procurement/purchase-orders/[id]/page.tsx`

- [ ] **5.1** Write test: `PurchaseOrderForm` — selecting a supplier populates the ingredient rows with that supplier's assigned ingredients and their last known unit costs; adding an ingredient row with qty and cost updates the total automatically
- [ ] **5.2** Run test — verify FAIL

- [ ] **5.3** Create `apps/app-admin/src/components/procurement/PurchaseOrderStatusBadge.tsx`
  - `pending` → amber badge "Pendiente"
  - `received` → green badge "Recibido"
  - `cancelled` → gray badge "Cancelado"

- [ ] **5.4** Create `apps/app-admin/src/components/procurement/PurchaseOrderItemRow.tsx`
  - One row per ingredient: ingredient name (read-only) | unit | quantity (editable number input) | unit cost (editable decimal input) | total (computed, read-only)
  - "Eliminar fila" icon button (×)
  - Calls `onChange(updatedItem)` prop on any change so parent can recompute total

- [ ] **5.5** Create `apps/app-admin/src/components/procurement/PurchaseOrderForm.tsx`
  - Supplier selector (required) — on change: loads supplier's assigned ingredients into rows
  - Dynamic list of `PurchaseOrderItemRow` components
  - "+ Agregar insumo" button: adds empty row with searchable ingredient combobox
  - Notes textarea
  - Total display (computed from all rows): "Total estimado: $12,450.00"
  - "Crear orden" submit button
  - If `restockId` query param is present: pre-populate the ingredient from the restock request and disable the row's ingredient selector

- [ ] **5.6** Run PurchaseOrderForm test — verify PASS

- [ ] **5.7** Create `apps/app-admin/src/components/procurement/ReceiveOrderDialog.tsx`
  - Dialog opened from PO detail page for POs in `pending` status
  - For each PO item: shows ingredient name, qty ordered, and an editable "Cantidad recibida" input (pre-filled with qty ordered)
  - Validates all quantities are > 0 before enabling "Confirmar recepción"
  - On confirm: calls `receivePurchaseOrder(id, itemReceipts)` RPC
  - On success: shows success toast ("Stock actualizado correctamente"), closes dialog, invalidates PO query

- [ ] **5.8** Create `apps/app-admin/src/app/procurement/purchase-orders/page.tsx`
  - Table: Proveedor | Fecha | Items | Total | Estado | Acciones
  - Filter bar: supplier selector, status filter, date range
  - "Nueva OC" button → `/procurement/purchase-orders/new`
  - Each row action: "Ver detalle" → `/procurement/purchase-orders/[id]`

- [ ] **5.9** Create `apps/app-admin/src/app/procurement/purchase-orders/new/page.tsx`
  - Renders `PurchaseOrderForm`
  - Reads optional `?restockId=` query param and passes to form
  - On success: calls `markRestockPurchased(restockId)` if restockId was provided, then redirects to `/procurement/purchase-orders/[newId]`

- [ ] **5.10** Create `apps/app-admin/src/app/procurement/purchase-orders/[id]/page.tsx`
  - Server component: fetch `getPurchaseOrderById(id)`
  - Header: supplier name, status badge, ordered by, ordered at, received at (if received)
  - Items table: Ingrediente | Unidad | Cant. pedida | Cant. recibida | Costo unit. | Total
  - Total cost row at bottom
  - Notes section
  - Action buttons (context-dependent on status):
    - `pending` → "Recibir orden" (opens `ReceiveOrderDialog`) + "Cancelar OC" (calls `updatePurchaseOrderStatus` with `cancelled` + confirmation)
    - `received` → read-only view with green "Recibido" state
    - `cancelled` → read-only view with strikethrough styling

- [ ] **5.11** Test: create PO manually (no restock) → appears in list with `pending` status
- [ ] **5.12** Test: create PO from approved restock request → ingredient pre-populated, restock status becomes `purchased`
- [ ] **5.13** Test: receive PO → ingredient stock updates, stock movements created, PO status = `received`
- [ ] **5.14** Test: cancel PO → status = `cancelled`, stock unchanged
- [ ] **5.15** Commit: `feat(app-admin): add purchase order lifecycle (create, send, receive, cancel)`

---

## Task 6: Expense management

**Files:**
- Create: `apps/app-admin/src/components/expenses/ReceiptUploader.tsx`
- Create: `apps/app-admin/src/components/expenses/ExpenseForm.tsx`
- Create: `apps/app-admin/src/components/expenses/ExpenseFilters.tsx`
- Create: `apps/app-admin/src/components/expenses/ExpenseTable.tsx`
- Create: `apps/app-admin/src/components/expenses/ExpenseCategoryForm.tsx`
- Create: `apps/app-admin/src/components/expenses/MonthlyCategoryChart.tsx`
- Create: `apps/app-admin/src/app/expenses/page.tsx`
- Create: `apps/app-admin/src/app/expenses/new/page.tsx`
- Create: `apps/app-admin/src/app/expenses/[id]/page.tsx`
- Create: `apps/app-admin/src/app/expenses/categories/page.tsx`
- Create: `apps/app-admin/src/app/expenses/categories/new/page.tsx`

- [ ] **6.1** Write test: `ReceiptUploader` renders a file input accepting `image/*,application/pdf`; selecting a file calls `uploadReceipt` and displays a thumbnail on success; displays error toast on upload failure
- [ ] **6.2** Run test — verify FAIL

- [ ] **6.3** Create `apps/app-admin/src/components/expenses/ReceiptUploader.tsx`
  - Drag-and-drop zone + click-to-browse (accepts `image/*` and `application/pdf`)
  - On file selection: call `uploadReceipt(file, expenseId, venueId)` from `lib/storage.ts`; obtain `venueId` from the session (passed as prop or read from Supabase auth metadata)
  - While uploading: show progress spinner
  - On success: show thumbnail (if image) or PDF icon; display "Comprobante subido" text + delete icon
  - On error: show error toast ("Error al subir comprobante, intente de nuevo")
  - "Eliminar comprobante" icon: calls `deleteReceipt(receiptUrl)`, clears state

- [ ] **6.4** Run ReceiptUploader test — verify PASS

- [ ] **6.5** Write test: `ExpenseForm` — all required fields (description, amount, date) show validation errors when empty; selecting a category shows its color dot; submitting valid data calls `createExpense`
- [ ] **6.6** Run test — verify FAIL

- [ ] **6.7** Create `apps/app-admin/src/components/expenses/ExpenseForm.tsx`
  - Fields:
    - description (text, required)
    - amount (decimal, required, min 0.01)
    - date (date picker, required, defaults to today)
    - category (select with color dot, optional)
    - payment_method (select: Efectivo / Transferencia / MercadoPago / Tarjeta)
    - receipt_url (via `ReceiptUploader`, optional)
  - Category selector shows color dot + name; "Gestionar categorías" link → `/expenses/categories`
  - On submit: calls `createExpense(data)`, then redirects to `/expenses/[newId]`
  - Handles `receiptUrl` state: if upload happens before submit, stores URL in form state

- [ ] **6.8** Run ExpenseForm test — verify PASS

- [ ] **6.9** Create `apps/app-admin/src/components/expenses/ExpenseFilters.tsx`
  - Date range (from/to date pickers)
  - Category multi-select
  - Payment method multi-select
  - Amount range (min/max inputs)
  - "Limpiar filtros" button — resets all to defaults
  - Filters update URL search params (no full reload, using `useRouter().push` with shallow)

- [ ] **6.10** Create `apps/app-admin/src/components/expenses/ExpenseTable.tsx`
  - Columns: Fecha | Descripción | Categoría (color dot + name) | Método pago | Monto | Comprobante | Acciones
  - "Comprobante" column: thumbnail if image, PDF icon if PDF, dash if none
  - "Acciones": "Ver" → `/expenses/[id]`
  - Paginated: 20 per page with "Anterior / Siguiente" controls
  - Total row at bottom: "Total: $XX,XXX.XX" for current filter/page set
  - Loading skeleton while fetching

- [ ] **6.11** Create `apps/app-admin/src/components/expenses/ExpenseCategoryForm.tsx`
  - Fields: name (required), color (color picker, required), icon (emoji input, optional)
  - Color picker: 8 preset brand-aligned colors + custom hex input
  - Preview: shows how the category badge will look
  - On submit: calls `createExpenseCategory` or `updateExpenseCategory`

- [ ] **6.12** Create `apps/app-admin/src/components/expenses/MonthlyCategoryChart.tsx`
  - Stacked bar chart (Recharts) with one bar per month
  - Each stack segment = one expense category, colored by `category.color`
  - Y-axis: amount in ARS
  - X-axis: month labels (Ene, Feb, Mar, …)
  - Tooltip: shows breakdown per category on hover
  - Year selector (defaults to current year)

- [ ] **6.13** Create `apps/app-admin/src/app/expenses/page.tsx`
  - `ExpenseFilters` at top (reads from URL search params)
  - `MonthlyCategoryChart` below (current year, collapsible)
  - `ExpenseTable` with current filter values
  - "Registrar gasto" button → `/expenses/new`

- [ ] **6.14** Create `apps/app-admin/src/app/expenses/new/page.tsx`
  - Renders `ExpenseForm` in create mode
  - Note: receipt upload needs an `expenseId` — generate a client-side UUID on mount and use it for the upload path; pass same UUID to `createExpense` as the `id`

- [ ] **6.15** Create `apps/app-admin/src/app/expenses/[id]/page.tsx`
  - Fetches expense by ID (joined with category + staff name)
  - Shows all fields read-only
  - If `receipt_url` is set: shows full-size image or embedded PDF
  - "Editar" button (reserved for future plan); "Eliminar" button with confirmation → calls `deleteExpense`, redirects to `/expenses`

- [ ] **6.16** Create `apps/app-admin/src/app/expenses/categories/page.tsx`
  - List of all expense categories with color dot, icon, name
  - Inline "Editar" (opens `ExpenseCategoryForm` in dialog) + "Eliminar" (with validation — blocks if categories have expenses)
  - "Nueva categoría" button → `/expenses/categories/new`

- [ ] **6.17** Create `apps/app-admin/src/app/expenses/categories/new/page.tsx`
  - Renders `ExpenseCategoryForm` in create mode
  - On success → redirects to `/expenses/categories`

- [ ] **6.18** Test: create expense category → appears in list + available in expense form category selector
- [ ] **6.19** Test: register expense with receipt → photo uploaded to Supabase Storage; receipt URL stored; visible in detail view
- [ ] **6.20** Test: expense list filters — filter by date range → only matching expenses shown; filter by category → correct subset
- [ ] **6.21** Test: delete category with existing expenses → blocked with error message
- [ ] **6.22** Commit: `feat(app-admin): add expense management with category CRUD and receipt upload`

---

## Task 7: P&L view + PDF export

**Files:**
- Create: `apps/app-admin/src/components/profit-loss/PLSummaryCard.tsx`
- Create: `apps/app-admin/src/components/profit-loss/PLMonthlyTable.tsx`
- Create: `apps/app-admin/src/components/profit-loss/PLCostBreakdown.tsx`
- Create: `apps/app-admin/src/components/profit-loss/PLPdfDocument.tsx`
- Create: `apps/app-admin/src/app/profit-loss/page.tsx`

- [ ] **7.1** Write test: `PLSummaryCard` renders revenue, total expenses, and net profit values; net profit is green when positive, red when negative
- [ ] **7.2** Run test — verify FAIL

- [ ] **7.3** Create `apps/app-admin/src/components/profit-loss/PLSummaryCard.tsx`
  - Three metric cards in a row:
    - "Ingresos totales" (green, revenue_total sum)
    - "Egresos totales" (red, ingredient_cost + other expenses)
    - "Ganancia neta" (green if positive, red if negative, with ▲/▼ indicator vs prior period)
  - Subtitle under each: period label (e.g., "Enero — Marzo 2026")
  - Compact number formatting: `$1,234,567` (ARS)

- [ ] **7.4** Run PLSummaryCard test — verify PASS

- [ ] **7.5** Create `apps/app-admin/src/components/profit-loss/PLMonthlyTable.tsx`
  - Table columns: Mes | Ingresos | Costo insumos | Otros egresos | Total egresos | Ganancia neta | Margen %
  - Each row: one month
  - Footer row: totals for the selected period
  - Color coding: green net profit rows, red negative rows
  - "Margen %" formatted as `62.3%` with same color coding

- [ ] **7.6** Create `apps/app-admin/src/components/profit-loss/PLCostBreakdown.tsx`
  - Donut chart (Recharts): shows proportion of total expenses broken down by:
    - Ingredient cost (from `daily_accounting.cost_ingredients`)
    - Each expense category (from `expenses` grouped by category)
  - Labeled with category name + percentage
  - Legend below chart

- [ ] **7.7** Create `apps/app-admin/src/components/profit-loss/PLPdfDocument.tsx`
  - `@react-pdf/renderer` document — exported as `<PLPdfDocument summary={PLSummary} period={string} venueName={string} />`
  - Page 1: venue logo + name, period label, three summary KPIs (revenue / expenses / net profit)
  - Page 2: monthly breakdown table (all months in the period)
  - Page 3: cost breakdown donut (rendered as data table in PDF since Recharts doesn't work in react-pdf)
  - Footer on each page: "My Way — Generado el {date}"
  - Uses `@react-pdf/renderer` primitives: `Document`, `Page`, `View`, `Text`, `StyleSheet`
  - Styling: dark-on-white, brand gold (`#f59e0b`) for headings, professional table borders

- [ ] **7.8** Create `apps/app-admin/src/app/profit-loss/page.tsx`
  - "client" component (for PDF download button and chart interactivity)
  - Period selector at top: month range pickers (from/to), quick presets: "Este mes", "Últimos 3 meses", "Este año"
  - Fetches `getPLSummary(venueId, from, to)` via TanStack Query on period change
  - Renders: `PLSummaryCard` → `PLMonthlyTable` → `PLCostBreakdown`
  - "Exportar PDF" button:
    - Calls `pdf(<PLPdfDocument .../>).toBlob()` from `@react-pdf/renderer`
    - Creates a temporary anchor element, sets `href` to blob URL, triggers download
    - Button shows spinner during generation ("Generando PDF…")
    - Filename: `myway-pl-{from}-{to}.pdf`

- [ ] **7.9** Test: select "Este año" preset → P&L summary loads for Jan–current month; net profit correctly equals revenue minus all expenses; margen % per month matches manual calculation
- [ ] **7.10** Test: click "Exportar PDF" → PDF downloads; contains all 3 pages; correct venue name and period
- [ ] **7.11** Commit: `feat(app-admin): add P&L view with monthly breakdown and PDF export`

---

## Task 8: Navigation wiring + procurement hub page

**Files:**
- Create: `apps/app-admin/src/app/procurement/page.tsx`
- Edit: `apps/app-admin/src/components/Sidebar.tsx` (add new nav items)

- [ ] **8.1** Create `apps/app-admin/src/app/procurement/page.tsx`
  - Hub page with two cards:
    - "Solicitudes de reposición" — shows count of pending requests (badge); links to `/procurement/restock`
    - "Órdenes de compra" — links to `/procurement/purchase-orders`
  - Quick-action CTA: "Nueva OC" → `/procurement/purchase-orders/new`

- [ ] **8.2** Edit `apps/app-admin/src/components/Sidebar.tsx`
  - Add nav section "Proveeduría" with items:
    - Proveedores → `/suppliers`
    - Compras → `/procurement`
    - Gastos → `/expenses`
    - Pérdidas y Ganancias → `/profit-loss`
  - Pending restock count badge on "Compras" nav item (fetched via server component or SWR)

- [ ] **8.3** Test: navigate to each new route in browser → no 404s; sidebar highlights active route correctly
- [ ] **8.4** Commit: `feat(app-admin): wire procurement navigation and hub page`

---

## Task 9: Integration tests

- [ ] **9.1** Write integration test: full procurement flow
  - Create supplier with 2 ingredients assigned
  - Staff creates restock request for one ingredient
  - Admin approves request → "Crear OC" appears
  - Admin creates PO from approved request → restock status becomes `purchased`
  - Admin receives PO → ingredient stock increases by ordered quantity; stock movement created
  - PO status = `received`

- [ ] **9.2** Write integration test: expense + P&L flow
  - Create 2 expense categories: "Insumos" and "Servicios"
  - Register 3 expenses (2 in Insumos, 1 in Servicios) across 2 months
  - Navigate to P&L with date range covering both months
  - Verify "Total egresos" = sum of all expenses + ingredient costs from `daily_accounting`
  - Verify monthly chart shows correct bars

- [ ] **9.3** Run integration tests — verify PASS

- [ ] **9.4** Commit: `test(app-admin): add integration tests for procurement and P&L flows`

---

## Verification Checklist

- [ ] `pnpm build` — zero TypeScript errors in `app-admin`
- [ ] `pnpm test --filter=app-admin` — all unit and integration tests pass
- [ ] Supplier CRUD: create, edit, deactivate a supplier; assign and remove ingredients with costs
- [ ] Restock request: submitted from kitchen/bar → appears in admin in real-time; approve → "Crear OC" CTA appears; reject with reason → reason visible
- [ ] Purchase order: create manually with 2 ingredients; receive PO; verify `ingredients.stock_current` incremented correctly in Supabase; verify `ingredient_stock_movements` rows created
- [ ] Purchase order created from approved restock: restock status updates to `purchased`
- [ ] Expense: register expense with receipt photo; photo visible in detail view; filters work correctly
- [ ] Delete expense category that has expenses → blocked with clear error
- [ ] P&L: select "Este año" → revenue/expense totals match sum of `daily_accounting` rows + expenses
- [ ] PDF export: downloads correctly; contains all 3 sections; filename has correct date range
- [ ] Sidebar navigation: "Compras" badge shows pending restock count; all routes accessible

---

*Previous: [Plan 8 — Staff & Payroll](2026-03-21-plan-8-staff-payroll.md)*
*Next: [Plan 10 — Reservations & Final Polish](2026-03-21-plan-10-reservations-polish.md)*
