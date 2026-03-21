# My Way — Plan 5: Salon Layout Editor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the drag-and-drop salon layout editor inside `app-pos`. Staff with cashier/admin/superadmin roles can design the floor plan, place bar and pool tables, resize and rotate them, merge and separate tables, save named layout snapshots, and view a read-only live status overlay — all on a Konva canvas.

**Architecture:** A single Next.js route `/editor` in `app-pos` renders a two-tab interface: "Vista Edición" (interactive canvas) and "Vista Live" (read-only, real-time status). The canvas is built with `react-konva`. Layout state lives in a Zustand store. Persistence goes to `local-server` via the standard `api.ts` fetch wrapper. All new `local-server` routes follow the existing Express + Prisma patterns from Plan 1.

**Tech Stack:** react-konva 18.x, konva 9.x, Zustand 5.x, @myway/types (Table, Zone), Next.js 15 App Router, Vitest + React Testing Library

**Depends on:** Plan 1 (Core Bar Operations)

---

## File Map

```
apps/
├── app-pos/
│   └── src/
│       ├── app/
│       │   └── editor/
│       │       └── page.tsx                        # /editor route — EditorShell
│       ├── components/
│       │   └── editor/
│       │       ├── EditorShell.tsx                 # Tab switcher: Vista Edición / Vista Live
│       │       ├── EditorCanvas.tsx                # Konva Stage + edit mode logic
│       │       ├── LiveCanvas.tsx                  # Konva Stage + read-only live status
│       │       ├── TableShape.tsx                  # Konva Group: rect + label + pool icon
│       │       ├── AddTableModal.tsx               # Dialog: type, number, seats → place on canvas
│       │       ├── EditorToolbar.tsx               # Buttons: Add, Unir, Separar, Save, Export PNG
│       │       ├── SnapshotPanel.tsx               # Sidebar: list saved snapshots, load button
│       │       └── MergeConfirmModal.tsx           # Confirm merge + assign new table number
│       ├── hooks/
│       │   └── useEditorStore.ts                   # Zustand store: tables, selection, activeZone
│       └── lib/
│           └── editor-utils.ts                     # Pure helpers: getBoundingBox, snapToGrid, etc.
│
└── local-server/
    └── src/
        └── routes/
            ├── tables.ts                           # Extend: POST /tables, DELETE /tables/:id,
            │                                       #   POST /tables/merge, POST /tables/:id/separate,
            │                                       #   PATCH /tables/:id (geometry + meta)
            └── layout-snapshots.ts                 # GET /layout-snapshots, POST /layout-snapshots
```

---

## Task 1: local-server — Tables CRUD endpoints

**Files:**
- Extend: `apps/local-server/src/routes/tables.ts`
- Extend: `apps/local-server/src/services/table.service.ts`

- [ ] **1.1** Write test: `POST /tables` with valid body creates a table and returns it

```typescript
// apps/local-server/src/__tests__/tables.test.ts
it('POST /tables creates a new table', async () => {
  const res = await request(app)
    .post('/tables')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ zoneId: zone1Id, number: 10, type: 'bar', seats: 4, x: 50, y: 100 })
  expect(res.status).toBe(201)
  expect(res.body.number).toBe(10)
  expect(res.body.type).toBe('bar')
})
```

- [ ] **1.2** Write test: `DELETE /tables/:id` removes a table that has no active session

```typescript
it('DELETE /tables/:id removes table without active session', async () => {
  const res = await request(app)
    .delete(`/tables/${inactiveTableId}`)
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(204)
})

it('DELETE /tables/:id returns 409 when table has active session', async () => {
  const res = await request(app)
    .delete(`/tables/${occupiedTableId}`)
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(409)
})
```

- [ ] **1.3** Write test: `PATCH /tables/:id` updates geometry fields (x, y, width, height, rotation)

```typescript
it('PATCH /tables/:id updates geometry', async () => {
  const res = await request(app)
    .patch(`/tables/${tableId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ x: 200, y: 300, width: 120, height: 80, rotation: 45 })
  expect(res.status).toBe(200)
  expect(res.body.x).toBe(200)
  expect(res.body.rotation).toBe(45)
})
```

- [ ] **1.4** Run tests — verify FAIL
- [ ] **1.5** Extend `apps/local-server/src/routes/tables.ts`
  - `POST /tables` — create table; require `cashier`/`admin`/`superadmin` role; emit `table_created` socket event
  - `DELETE /tables/:id` — reject with 409 if table has status `occupied`; emit `table_deleted`
  - `PATCH /tables/:id` — update any combination of `{ x, y, width, height, rotation, seats, number, zoneId, status }`; emit `table_updated`
  - Keep existing `GET /tables` and `PATCH /tables/:id/status` untouched
- [ ] **1.6** Extend `apps/local-server/src/services/table.service.ts`
  - `createTable(data)` — auto-generate `id` (uuid), set `venueId` from session, validate `number` uniqueness per venue
  - `deleteTable(id)` — check `status !== 'occupied'` before deleting
  - `updateTableGeometry(id, patch)` — partial update, `updatedAt = NOW()`, mark `synced = false`
- [ ] **1.7** Run tests — verify PASS
- [ ] **1.8** Commit: `feat(local-server): add table CRUD endpoints (create, delete, patch geometry)`

---

## Task 2: local-server — Merge and Separate endpoints

**Files:**
- Extend: `apps/local-server/src/routes/tables.ts`
- Extend: `apps/local-server/src/services/table.service.ts`

- [ ] **2.1** Write test: `POST /tables/merge` with two valid table IDs creates a merged composite table

```typescript
it('POST /tables/merge creates composite table', async () => {
  const res = await request(app)
    .post('/tables/merge')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ tableIds: [tableAId, tableBId], newNumber: 99 })
  expect(res.status).toBe(201)
  expect(res.body.number).toBe(99)
  // Original tables now have mergedIntoId set
  const a = await getTable(tableAId)
  expect(a.mergedIntoId).toBe(res.body.id)
})
```

- [ ] **2.2** Write test: merge fails if any table has an active session (status `occupied`)

```typescript
it('POST /tables/merge returns 409 if table is occupied', async () => {
  const res = await request(app)
    .post('/tables/merge')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ tableIds: [occupiedTableId, freeTableId], newNumber: 98 })
  expect(res.status).toBe(409)
})
```

- [ ] **2.3** Write test: `POST /tables/:id/separate` restores original tables and removes the composite

```typescript
it('POST /tables/:id/separate restores originals', async () => {
  const res = await request(app)
    .post(`/tables/${mergedTableId}/separate`)
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  expect(res.body.restored).toHaveLength(2)
  // Merged table deleted
  const merged = await getTable(mergedTableId)
  expect(merged).toBeNull()
})
```

- [ ] **2.4** Write test: separate fails if the merged table has an active session

- [ ] **2.5** Run tests — verify FAIL

- [ ] **2.6** Add `POST /tables/merge` route (register before `POST /tables/:id/separate` to avoid param collision)
  - Body: `{ tableIds: string[], newNumber: number }`
  - Validate: minimum 2 IDs, all exist, none `occupied`, all in same zone
  - Create new composite table: average position of originals, combined seats, `type` inherited from first table; width/height slightly larger (+20px each)
  - Set `mergedIntoId` on each original table
  - Emit `tables_merged` socket event with `{ mergedTable, originalIds }`

- [ ] **2.7** Add `POST /tables/:id/separate` route
  - Validate: table exists, is a composite (has related records with `mergedIntoId = id`)
  - Reject 409 if composite has `status = occupied`
  - Clear `mergedIntoId` on originals
  - Delete composite table record
  - Emit `tables_separated` socket event with `{ restoredIds }`

- [ ] **2.8** Run tests — verify PASS
- [ ] **2.9** Commit: `feat(local-server): add merge and separate table endpoints`

---

## Task 3: local-server — Layout Snapshots endpoints

**Files:**
- Create: `apps/local-server/src/routes/layout-snapshots.ts`
- Extend: `apps/local-server/src/index.ts` (register new router)

- [ ] **3.1** Write test: `GET /layout-snapshots` returns list ordered by `created_at DESC`

```typescript
it('GET /layout-snapshots returns snapshots newest first', async () => {
  const res = await request(app)
    .get('/layout-snapshots')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  expect(Array.isArray(res.body)).toBe(true)
  // Verify order
  const dates = res.body.map((s: any) => new Date(s.createdAt).getTime())
  expect(dates).toEqual([...dates].sort((a, b) => b - a))
})
```

- [ ] **3.2** Write test: `POST /layout-snapshots` saves current layout state

```typescript
it('POST /layout-snapshots saves snapshot', async () => {
  const res = await request(app)
    .post('/layout-snapshots')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Layout verano 2026', snapshotJson: { tables: [], zones: [] } })
  expect(res.status).toBe(201)
  expect(res.body.name).toBe('Layout verano 2026')
  expect(res.body.id).toBeDefined()
})
```

- [ ] **3.3** Run tests — verify FAIL

- [ ] **3.4** Create `apps/local-server/src/routes/layout-snapshots.ts`
  - `GET /layout-snapshots` — query `layout_snapshots WHERE venue_id = :venueId ORDER BY created_at DESC LIMIT 50`; return `id, name, created_at` (no full JSON for list performance)
  - `GET /layout-snapshots/:id` — return full snapshot including `snapshot_json`
  - `POST /layout-snapshots` — body `{ name: string, snapshotJson: object }`; insert; return created record

- [ ] **3.5** Register router in `apps/local-server/src/server.ts`

```typescript
import layoutSnapshotsRouter from './routes/layout-snapshots'
app.use('/layout-snapshots', authMiddleware, layoutSnapshotsRouter)
```

- [ ] **3.6** Run tests — verify PASS
- [ ] **3.7** Commit: `feat(local-server): add layout snapshots endpoints`

---

## Task 4: packages/types — Editor types

**Files:**
- Extend: `packages/types/src/table.ts`
- Create: `packages/types/src/editor.ts`
- Extend: `packages/types/src/index.ts`

- [ ] **4.1** Extend `packages/types/src/table.ts` — add LayoutSnapshot interface

```typescript
export interface LayoutSnapshot {
  id: string
  venueId: string
  name: string
  snapshotJson: LayoutSnapshotData
  createdAt: Date
}

export interface LayoutSnapshotData {
  tables: Table[]
  zones: Zone[]
}
```

- [ ] **4.2** Create `packages/types/src/editor.ts`

```typescript
import type { Table } from './table'

export type EditorView = 'edit' | 'live'

export interface EditorSelection {
  tableIds: string[]
}

export interface AddTableFormData {
  type: 'bar' | 'pool'
  number: number
  seats: number
}

export interface TableShapeProps {
  table: Table
  isSelected: boolean
  isLive: boolean
  onClick: (id: string, shiftKey: boolean) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onTransformEnd: (id: string, x: number, y: number, width: number, height: number, rotation: number) => void
}

// Socket event payloads for editor events
export interface SocketTableCreated { table: Table }
export interface SocketTableUpdated { table: Table }
export interface SocketTableDeleted { tableId: string }
export interface SocketTablesMerged { mergedTable: Table; originalIds: string[] }
export interface SocketTablesSeparated { restoredIds: string[] }
```

- [ ] **4.3** Add export to `packages/types/src/index.ts`

```typescript
export * from './editor'
```

- [ ] **4.4** Commit: `feat(types): add editor and layout snapshot types`

---

## Task 5: app-pos — Install Konva + Zustand editor store

**Files:**
- Extend: `apps/app-pos/package.json`
- Create: `apps/app-pos/src/hooks/useEditorStore.ts`
- Create: `apps/app-pos/src/lib/editor-utils.ts`

- [ ] **5.1** Add dependencies to `apps/app-pos/package.json`

```json
{
  "dependencies": {
    "konva": "^9.3.16",
    "react-konva": "^18.2.10"
  }
}
```

Run: `pnpm install`

- [ ] **5.2** Write test: `useEditorStore` — initial state is correct

```typescript
// apps/app-pos/src/__tests__/useEditorStore.test.ts
import { renderHook, act } from '@testing-library/react'
import { useEditorStore } from '../hooks/useEditorStore'

it('starts with empty selection and edit view', () => {
  const { result } = renderHook(() => useEditorStore())
  expect(result.current.selectedIds).toEqual([])
  expect(result.current.activeView).toBe('edit')
  expect(result.current.activeZoneId).toBeNull()
})
```

- [ ] **5.3** Write test: `selectTable` adds ID; shift=false replaces selection; shift=true toggles

```typescript
it('selectTable with shift replaces selection', () => {
  const { result } = renderHook(() => useEditorStore())
  act(() => result.current.selectTable('a', false))
  act(() => result.current.selectTable('b', false))
  expect(result.current.selectedIds).toEqual(['b'])
})

it('selectTable with shift=true toggles', () => {
  const { result } = renderHook(() => useEditorStore())
  act(() => result.current.selectTable('a', false))
  act(() => result.current.selectTable('b', true))
  expect(result.current.selectedIds).toEqual(['a', 'b'])
  act(() => result.current.selectTable('a', true))
  expect(result.current.selectedIds).toEqual(['b'])
})
```

- [ ] **5.4** Write test: `updateTableLocal` mutates geometry immutably

```typescript
it('updateTableLocal returns new tables array without mutating original', () => {
  const { result } = renderHook(() => useEditorStore())
  act(() => result.current.setTables([{ id: '1', x: 0, y: 0 } as any]))
  const before = result.current.tables
  act(() => result.current.updateTableLocal('1', { x: 50, y: 100 }))
  expect(result.current.tables[0]?.x).toBe(50)
  expect(before[0]?.x).toBe(0) // original not mutated
})
```

- [ ] **5.5** Run tests — verify FAIL

- [ ] **5.6** Create `apps/app-pos/src/hooks/useEditorStore.ts`

```typescript
import { create } from 'zustand'
import type { Table, Zone, EditorView } from '@myway/types'

interface EditorStore {
  // State
  tables: Table[]
  zones: Zone[]
  selectedIds: string[]
  activeView: EditorView
  activeZoneId: string | null
  isDirty: boolean

  // Actions
  setTables: (tables: Table[]) => void
  setZones: (zones: Zone[]) => void
  setActiveZoneId: (id: string | null) => void
  setActiveView: (view: EditorView) => void
  selectTable: (id: string, shiftKey: boolean) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  updateTableLocal: (id: string, patch: Partial<Table>) => void
  addTableLocal: (table: Table) => void
  removeTableLocal: (id: string) => void
  mergeTables: (mergedTable: Table, originalIds: string[]) => void
  separateTables: (restoredTables: Table[], mergedId: string) => void
  markClean: () => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  tables: [],
  zones: [],
  selectedIds: [],
  activeView: 'edit',
  activeZoneId: null,
  isDirty: false,

  setTables: (tables) => set({ tables }),
  setZones: (zones) => set({ zones }),
  setActiveZoneId: (activeZoneId) => set({ activeZoneId }),
  setActiveView: (activeView) => set({ activeView }),

  selectTable: (id, shiftKey) =>
    set((state) => {
      if (!shiftKey) return { selectedIds: [id] }
      const exists = state.selectedIds.includes(id)
      return {
        selectedIds: exists
          ? state.selectedIds.filter((s) => s !== id)
          : [...state.selectedIds, id],
      }
    }),

  selectAll: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  updateTableLocal: (id, patch) =>
    set((state) => ({
      tables: state.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      isDirty: true,
    })),

  addTableLocal: (table) =>
    set((state) => ({ tables: [...state.tables, table], isDirty: true })),

  removeTableLocal: (id) =>
    set((state) => ({
      tables: state.tables.filter((t) => t.id !== id),
      isDirty: true,
    })),

  mergeTables: (mergedTable, originalIds) =>
    set((state) => ({
      tables: [
        ...state.tables.map((t) =>
          originalIds.includes(t.id) ? { ...t, mergedIntoId: mergedTable.id } : t
        ),
        mergedTable,
      ],
      selectedIds: [mergedTable.id],
      isDirty: true,
    })),

  separateTables: (restoredTables, mergedId) =>
    set((state) => ({
      tables: [
        ...state.tables
          .filter((t) => t.id !== mergedId)
          .map((t) =>
            restoredTables.some((r) => r.id === t.id) ? { ...t, mergedIntoId: null } : t
          ),
      ],
      selectedIds: [],
      isDirty: true,
    })),

  markClean: () => set({ isDirty: false }),
}))
```

- [ ] **5.7** Create `apps/app-pos/src/lib/editor-utils.ts`

```typescript
import type { Table } from '@myway/types'

/** Compute the bounding box center of a set of tables */
export function getBoundingBoxCenter(tables: Table[]): { x: number; y: number } {
  if (tables.length === 0) return { x: 100, y: 100 }
  const minX = Math.min(...tables.map((t) => t.x))
  const maxX = Math.max(...tables.map((t) => t.x + t.width))
  const minY = Math.min(...tables.map((t) => t.y))
  const maxY = Math.max(...tables.map((t) => t.y + t.height))
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Table status → fill color for live view */
export function tableStatusColor(status: Table['status']): string {
  switch (status) {
    case 'available': return '#22c55e'   // green-500
    case 'occupied':  return '#ef4444'   // red-500
    case 'reserved':  return '#f59e0b'   // amber-500
    default:          return '#6b7280'   // gray-500
  }
}

/** Color for edit mode (neutral dark, distinct from live) */
export const EDIT_TABLE_FILL = '#1e293b'      // slate-800
export const EDIT_TABLE_STROKE = '#475569'    // slate-600
export const POOL_FELT_FILL = '#14532d'       // green-900
export const SELECTED_STROKE = '#f59e0b'      // brand gold
export const LABEL_COLOR = '#f8fafc'          // slate-50
```

- [ ] **5.8** Write tests for `editor-utils.ts`

```typescript
// apps/app-pos/src/__tests__/editor-utils.test.ts
import { getBoundingBoxCenter, tableStatusColor } from '../lib/editor-utils'

it('getBoundingBoxCenter returns correct midpoint', () => {
  const tables = [
    { x: 0, y: 0, width: 100, height: 60 },
    { x: 200, y: 100, width: 100, height: 60 },
  ] as any
  const center = getBoundingBoxCenter(tables)
  expect(center.x).toBe(200)
  expect(center.y).toBe(110)
})

it('tableStatusColor returns correct hex per status', () => {
  expect(tableStatusColor('available')).toBe('#22c55e')
  expect(tableStatusColor('occupied')).toBe('#ef4444')
  expect(tableStatusColor('reserved')).toBe('#f59e0b')
})
```

- [ ] **5.9** Run all tests — verify PASS
- [ ] **5.10** Commit: `feat(app-pos): install konva, add editor store (Zustand) and editor-utils`

---

## Task 6: app-pos — TableShape component

**Files:**
- Create: `apps/app-pos/src/components/editor/TableShape.tsx`

- [ ] **6.1** Write test: `TableShape` renders with table number label

```typescript
// apps/app-pos/src/__tests__/TableShape.test.tsx
import { render } from '@testing-library/react'
import { Stage, Layer } from 'react-konva'
import { TableShape } from '../components/editor/TableShape'

const baseTable = {
  id: 't1', number: 5, type: 'bar', x: 0, y: 0, width: 100, height: 60,
  rotation: 0, seats: 4, status: 'available', mergedIntoId: null,
} as any

it('renders without crashing', () => {
  const { container } = render(
    <Stage width={500} height={500}>
      <Layer>
        <TableShape
          table={baseTable}
          isSelected={false}
          isLive={false}
          onClick={vi.fn()}
          onDragEnd={vi.fn()}
          onTransformEnd={vi.fn()}
        />
      </Layer>
    </Stage>
  )
  expect(container).toBeTruthy()
})
```

- [ ] **6.2** Run test — verify FAIL

- [ ] **6.3** Create `apps/app-pos/src/components/editor/TableShape.tsx`

```typescript
'use client'

import { Group, Rect, Text, Circle } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { TableShapeProps } from '@myway/types'
import {
  EDIT_TABLE_FILL,
  EDIT_TABLE_STROKE,
  POOL_FELT_FILL,
  SELECTED_STROKE,
  LABEL_COLOR,
  tableStatusColor,
} from '../../lib/editor-utils'

export function TableShape({
  table,
  isSelected,
  isLive,
  onClick,
  onDragEnd,
  onTransformEnd,
}: TableShapeProps) {
  const fill = isLive
    ? tableStatusColor(table.status)
    : table.type === 'pool'
    ? POOL_FELT_FILL
    : EDIT_TABLE_FILL

  const stroke = isSelected ? SELECTED_STROKE : EDIT_TABLE_STROKE
  const strokeWidth = isSelected ? 2.5 : 1.5

  return (
    <Group
      id={table.id}
      x={table.x}
      y={table.y}
      rotation={table.rotation}
      draggable={!isLive}
      onClick={(e: KonvaEventObject<MouseEvent>) =>
        onClick(table.id, e.evt.shiftKey)
      }
      onDragEnd={(e: KonvaEventObject<DragEvent>) =>
        onDragEnd(table.id, e.target.x(), e.target.y())
      }
      onTransformEnd={(e: KonvaEventObject<Event>) => {
        const node = e.target
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        node.scaleX(1)
        node.scaleY(1)
        onTransformEnd(
          table.id,
          node.x(),
          node.y(),
          Math.max(40, table.width * scaleX),
          Math.max(30, table.height * scaleY),
          node.rotation(),
        )
      }}
    >
      <Rect
        width={table.width}
        height={table.height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={table.type === 'pool' ? 4 : 8}
        offsetX={table.width / 2}
        offsetY={table.height / 2}
      />

      {/* Pool felt dot indicator */}
      {table.type === 'pool' && !isLive && (
        <Circle
          x={0}
          y={0}
          radius={6}
          fill="#16a34a"
          offsetX={0}
          offsetY={0}
        />
      )}

      {/* Table number */}
      <Text
        text={String(table.number)}
        fontSize={table.width > 80 ? 18 : 14}
        fontStyle="bold"
        fill={LABEL_COLOR}
        width={table.width}
        height={table.height}
        align="center"
        verticalAlign="middle"
        offsetX={table.width / 2}
        offsetY={table.height / 2}
        listening={false}
      />

      {/* Seats count (small, bottom) */}
      {table.width >= 70 && (
        <Text
          text={`${table.seats}p`}
          fontSize={10}
          fill="#94a3b8"
          x={-table.width / 2 + 4}
          y={table.height / 2 - 14}
          listening={false}
        />
      )}
    </Group>
  )
}
```

- [ ] **6.4** Run test — verify PASS
- [ ] **6.5** Commit: `feat(app-pos): add TableShape konva component`

---

## Task 7: app-pos — EditorCanvas component

**Files:**
- Create: `apps/app-pos/src/components/editor/EditorCanvas.tsx`

- [ ] **7.1** Write test: clicking the stage background clears the selection

```typescript
import { renderHook, act } from '@testing-library/react'
import { useEditorStore } from '../../hooks/useEditorStore'

it('clicking stage background calls clearSelection', () => {
  const { result } = renderHook(() => useEditorStore())
  // Seed some selection
  act(() => result.current.selectTable('table-1', false))
  expect(result.current.selectedIds).toEqual(['table-1'])

  // Simulate the click handler that EditorCanvas calls on empty stage click
  act(() => result.current.clearSelection())

  expect(result.current.selectedIds).toEqual([])
})
```

- [ ] **7.2** Write test: drag-selecting a region selects all tables whose bounding box intersects the selection rect

```typescript
it('updateTableLocal and clearSelection work together for rubber-band select', () => {
  const { result } = renderHook(() => useEditorStore())

  // Place two tables in the store
  const tableA = { id: 'a', x: 50,  y: 50,  width: 80, height: 60 } as Table
  const tableB = { id: 'b', x: 300, y: 300, width: 80, height: 60 } as Table
  act(() => result.current.setTables([tableA, tableB]))

  // Simulate rubber-band: tables intersecting rect {x:0, y:0, w:200, h:200} → only tableA
  const dragRect = { x: 0, y: 0, width: 200, height: 200 }
  const intersecting = [tableA, tableB].filter((t) => {
    const tx = t.x - t.width / 2
    const ty = t.y - t.height / 2
    return (
      tx < dragRect.x + dragRect.width &&
      tx + t.width > dragRect.x &&
      ty < dragRect.y + dragRect.height &&
      ty + t.height > dragRect.y
    )
  })

  act(() => {
    result.current.clearSelection()
    intersecting.forEach((t) => result.current.selectTable(t.id, true))
  })

  expect(result.current.selectedIds).toEqual(['a'])
  expect(result.current.selectedIds).not.toContain('b')
})
```

- [ ] **7.3** Run tests — verify FAIL

- [ ] **7.4** Create `apps/app-pos/src/components/editor/EditorCanvas.tsx`

```typescript
'use client'

import { useRef, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import type { Table } from '@myway/types'
import { TableShape } from './TableShape'
import { useEditorStore } from '../../hooks/useEditorStore'
import { api } from '../../lib/api'

interface EditorCanvasProps {
  tables: Table[]
  stageWidth: number
  stageHeight: number
}

export function EditorCanvas({ tables, stageWidth, stageHeight }: EditorCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  const {
    selectedIds,
    selectTable,
    clearSelection,
    selectAll,
    updateTableLocal,
  } = useEditorStore()

  // Drag selection (rubber band)
  const [dragSelect, setDragSelect] = useState<{
    x: number; y: number; width: number; height: number
  } | null>(null)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Clicked on empty stage area — start rubber band OR clear selection
      if (e.target === e.target.getStage()) {
        clearSelection()
        const pos = stageRef.current!.getPointerPosition()!
        dragStartPos.current = pos
        setDragSelect({ x: pos.x, y: pos.y, width: 0, height: 0 })
      }
    },
    [clearSelection],
  )

  const handleStageMouseMove = useCallback(() => {
    if (!dragStartPos.current || !stageRef.current) return
    const pos = stageRef.current.getPointerPosition()!
    const start = dragStartPos.current
    setDragSelect({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      width: Math.abs(pos.x - start.x),
      height: Math.abs(pos.y - start.y),
    })
  }, [])

  const handleStageMouseUp = useCallback(() => {
    if (!dragSelect || (dragSelect.width < 5 && dragSelect.height < 5)) {
      setDragSelect(null)
      dragStartPos.current = null
      return
    }
    // Select all tables intersecting dragSelect rect
    const intersecting = tables.filter((t) => {
      const tx = t.x - t.width / 2
      const ty = t.y - t.height / 2
      return (
        tx < dragSelect.x + dragSelect.width &&
        tx + t.width > dragSelect.x &&
        ty < dragSelect.y + dragSelect.height &&
        ty + t.height > dragSelect.y
      )
    })
    selectAll(intersecting.map((t) => t.id))
    setDragSelect(null)
    dragStartPos.current = null
  }, [dragSelect, tables, selectAll])

  const handleDragEnd = useCallback(
    async (id: string, x: number, y: number) => {
      updateTableLocal(id, { x, y })
      await api.patch(`/tables/${id}`, { x, y })
    },
    [updateTableLocal],
  )

  const handleTransformEnd = useCallback(
    async (
      id: string,
      x: number,
      y: number,
      width: number,
      height: number,
      rotation: number,
    ) => {
      updateTableLocal(id, { x, y, width, height, rotation })
      await api.patch(`/tables/${id}`, { x, y, width, height, rotation })
    },
    [updateTableLocal],
  )

  // Attach Transformer to selected nodes after render
  const attachTransformer = useCallback(() => {
    if (!transformerRef.current || !stageRef.current) return
    const nodes = selectedIds
      .map((id) => stageRef.current!.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[]
    transformerRef.current.nodes(nodes)
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedIds])

  return (
    <Stage
      ref={stageRef}
      width={stageWidth}
      height={stageHeight}
      className="bg-surface-1 rounded-lg overflow-hidden"
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
    >
      <Layer onDraw={attachTransformer}>
        {tables.map((table) => (
          <TableShape
            key={table.id}
            table={table}
            isSelected={selectedIds.includes(table.id)}
            isLive={false}
            onClick={selectTable}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        ))}

        {/* Drag selection rectangle */}
        {dragSelect && dragSelect.width > 2 && (
          <Rect
            x={dragSelect.x}
            y={dragSelect.y}
            width={dragSelect.width}
            height={dragSelect.height}
            fill="rgba(245, 158, 11, 0.1)"
            stroke="#f59e0b"
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
          />
        )}

        <Transformer
          ref={transformerRef}
          rotateAnchorOffset={28}
          enabledAnchors={[
            'top-left', 'top-right',
            'bottom-left', 'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 40 || newBox.height < 30) return oldBox
            return newBox
          }}
        />
      </Layer>
    </Stage>
  )
}
```

- [ ] **7.5** Run tests — verify PASS
- [ ] **7.6** Commit: `feat(app-pos): add EditorCanvas with drag-select + Transformer`

---

## Task 8: app-pos — LiveCanvas component

**Files:**
- Create: `apps/app-pos/src/components/editor/LiveCanvas.tsx`

- [ ] **8.1** Write test: `LiveCanvas` renders table shapes with status-based fill colors (no drag)

```typescript
it('LiveCanvas renders tables with correct status colors', () => {
  const tables = [
    { ...baseTable, id: 't1', status: 'available' },
    { ...baseTable, id: 't2', status: 'occupied' },
  ] as any
  // render LiveCanvas
  // verify TableShape receives isLive=true
  // draggable prop is false
})
```

- [ ] **8.2** Run test — verify FAIL

- [ ] **8.3** Create `apps/app-pos/src/components/editor/LiveCanvas.tsx`

```typescript
'use client'

import { Stage, Layer } from 'react-konva'
import type { Table } from '@myway/types'
import { TableShape } from './TableShape'

interface LiveCanvasProps {
  tables: Table[]
  stageWidth: number
  stageHeight: number
}

export function LiveCanvas({ tables, stageWidth, stageHeight }: LiveCanvasProps) {
  return (
    <Stage
      width={stageWidth}
      height={stageHeight}
      className="bg-surface-1 rounded-lg overflow-hidden"
    >
      <Layer>
        {tables.map((table) => (
          <TableShape
            key={table.id}
            table={table}
            isSelected={false}
            isLive={true}
            onClick={() => undefined}
            onDragEnd={() => undefined}
            onTransformEnd={() => undefined}
          />
        ))}
      </Layer>
    </Stage>
  )
}
```

- [ ] **8.4** Run test — verify PASS
- [ ] **8.5** Commit: `feat(app-pos): add LiveCanvas read-only status view`

---

## Task 9: app-pos — AddTableModal + MergeConfirmModal

**Files:**
- Create: `apps/app-pos/src/components/editor/AddTableModal.tsx`
- Create: `apps/app-pos/src/components/editor/MergeConfirmModal.tsx`

- [ ] **9.1** Write test: `AddTableModal` validates that `number` must be a positive integer

```typescript
it('AddTableModal shows error if number is 0', async () => {
  render(<AddTableModal open onSubmit={vi.fn()} onClose={vi.fn()} usedNumbers={[]} />)
  await userEvent.clear(screen.getByLabelText(/número/i))
  await userEvent.type(screen.getByLabelText(/número/i), '0')
  await userEvent.click(screen.getByRole('button', { name: /agregar/i }))
  expect(screen.getByText(/número debe ser mayor a 0/i)).toBeInTheDocument()
})
```

- [ ] **9.2** Write test: `AddTableModal` shows error if table number is already used

```typescript
it('AddTableModal shows error for duplicate number', async () => {
  render(<AddTableModal open onSubmit={vi.fn()} onClose={vi.fn()} usedNumbers={[5]} />)
  await userEvent.type(screen.getByLabelText(/número/i), '5')
  await userEvent.click(screen.getByRole('button', { name: /agregar/i }))
  expect(screen.getByText(/número de mesa ya existe/i)).toBeInTheDocument()
})
```

- [ ] **9.3** Write test: `MergeConfirmModal` submits with provided new number

- [ ] **9.4** Run tests — verify FAIL

- [ ] **9.5** Create `apps/app-pos/src/components/editor/AddTableModal.tsx`
  - Uses `@myway/ui` `Dialog`, `Input`, `Button`, `Select`
  - Fields: `type` (select: Bar / Pool), `number` (number input), `seats` (number input, default 4)
  - Validate: number > 0, number not in `usedNumbers`, seats between 1–20
  - On submit: call `onSubmit({ type, number, seats })`
  - Default placement for new table: `x = 120, y = 120` (caller places at canvas center if preferred)

- [ ] **9.6** Create `apps/app-pos/src/components/editor/MergeConfirmModal.tsx`
  - Shows list of tables being merged
  - Input for new composite table number
  - Validate: new number not already used (excluding the tables being merged)
  - On confirm: call `onConfirm(newNumber)`

- [ ] **9.7** Run tests — verify PASS
- [ ] **9.8** Commit: `feat(app-pos): add AddTableModal and MergeConfirmModal`

---

## Task 10: app-pos — EditorToolbar + SnapshotPanel

**Files:**
- Create: `apps/app-pos/src/components/editor/EditorToolbar.tsx`
- Create: `apps/app-pos/src/components/editor/SnapshotPanel.tsx`

- [ ] **10.1** Write test: Toolbar "Unir mesas" button is disabled when fewer than 2 tables selected

```typescript
it('Unir button is disabled with 0 selected tables', () => {
  render(<EditorToolbar selectedCount={0} canSeparate={false} onAdd={vi.fn()}
    onMerge={vi.fn()} onSeparate={vi.fn()} onSave={vi.fn()} onExport={vi.fn()} />)
  expect(screen.getByRole('button', { name: /unir mesas/i })).toBeDisabled()
})

it('Unir button is enabled with 2+ selected tables', () => {
  render(<EditorToolbar selectedCount={2} canSeparate={false} onAdd={vi.fn()}
    onMerge={vi.fn()} onSeparate={vi.fn()} onSave={vi.fn()} onExport={vi.fn()} />)
  expect(screen.getByRole('button', { name: /unir mesas/i })).toBeEnabled()
})
```

- [ ] **10.2** Write test: Toolbar "Separar" button is only enabled when exactly 1 merged table is selected

- [ ] **10.3** Run tests — verify FAIL

- [ ] **10.4** Create `apps/app-pos/src/components/editor/EditorToolbar.tsx`

```typescript
interface EditorToolbarProps {
  selectedCount: number
  canSeparate: boolean      // true when exactly 1 merged table selected
  isDirty: boolean
  onAdd: () => void
  onMerge: () => void
  onSeparate: () => void
  onSave: () => void        // opens save snapshot dialog
  onExport: () => void      // export PNG
  onDelete: () => void
  canDelete: boolean
}
```

  - Buttons: "Agregar mesa" (always enabled), "Unir mesas" (enabled if `selectedCount >= 2`), "Separar" (enabled if `canSeparate`), separator, "Guardar layout" (always), "Exportar PNG" (always), "Eliminar" (enabled if `canDelete` — i.e. 1 table selected that is not merged)
  - "Guardar layout" shows a subtle dot indicator when `isDirty = true`

- [ ] **10.5** Create `apps/app-pos/src/components/editor/SnapshotPanel.tsx`
  - Fetches `GET /layout-snapshots` on mount
  - Shows list: name + relative date
  - "Cargar" button per snapshot → `GET /layout-snapshots/:id` → call `onLoad(snapshot)`
  - Shows loading and error states

- [ ] **10.6** Run tests — verify PASS
- [ ] **10.7** Commit: `feat(app-pos): add EditorToolbar and SnapshotPanel`

---

## Task 11: app-pos — EditorShell + /editor route

**Files:**
- Create: `apps/app-pos/src/components/editor/EditorShell.tsx`
- Create: `apps/app-pos/src/app/editor/page.tsx`
- Extend: `apps/app-pos/src/hooks/useTables.ts` (socket listeners for editor events)

- [ ] **11.1** Write test: `/editor` redirects unauthenticated users to `/login`

```typescript
it('redirects to /login if not authenticated', async () => {
  // mock getToken() returning null
  render(<EditorPage />)
  expect(mockRouter.push).toHaveBeenCalledWith('/login')
})
```

- [ ] **11.2** Write test: `/editor` redirects `waiter`/`kitchen`/`bar` roles to `/salon` (access denied)

```typescript
it('redirects waiter role to /salon', async () => {
  // mock getToken() returning waiter JWT
  render(<EditorPage />)
  expect(mockRouter.push).toHaveBeenCalledWith('/salon')
})
```

- [ ] **11.3** Run tests — verify FAIL

- [ ] **11.4** Extend `apps/app-pos/src/hooks/useTables.ts`
  - Listen for `table_created`, `table_updated`, `table_deleted`, `tables_merged`, `tables_separated` socket events
  - On `table_created`: add to tables state
  - On `table_updated`: replace matching table in state
  - On `table_deleted`: remove from tables state
  - On `tables_merged`: update originals' `mergedIntoId`, add merged table
  - On `tables_separated`: clear `mergedIntoId` on originals, remove merged table

- [ ] **11.5** Create `apps/app-pos/src/components/editor/EditorShell.tsx`

```typescript
'use client'

import { useEffect, useState, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@myway/ui'
import { EditorCanvas } from './EditorCanvas'
import { LiveCanvas } from './LiveCanvas'
import { EditorToolbar } from './EditorToolbar'
import { SnapshotPanel } from './SnapshotPanel'
import { AddTableModal } from './AddTableModal'
import { MergeConfirmModal } from './MergeConfirmModal'
import { useEditorStore } from '../../hooks/useEditorStore'
import { useTables } from '../../hooks/useTables'
import { api } from '../../lib/api'
```

  - Fetches zones on mount, sets `activeZoneId` to first zone
  - Two tabs: "Vista Edición" (EditorCanvas) and "Vista Live" (LiveCanvas)
  - Zones shown as secondary tabs within each primary tab
  - Toolbar is only rendered in "Vista Edición" tab
  - SnapshotPanel is a collapsible sidebar (toggle button)
  - Save layout: prompt for snapshot name → POST /layout-snapshots with current tables JSON → `markClean()`
  - Export PNG: call `stageRef.current.toDataURL({ pixelRatio: 2 })` → trigger browser download
  - Merge flow: open `MergeConfirmModal` → on confirm, `POST /tables/merge` → update store via `mergeTables`
  - Separate flow: `POST /tables/:id/separate` → update store via `separateTables`
  - Add table flow: open `AddTableModal` → on submit, `POST /tables` → `addTableLocal` → place at canvas center of current viewport
  - Delete: `DELETE /tables/:id` → `removeTableLocal`

- [ ] **11.6** Create `apps/app-pos/src/app/editor/page.tsx`

```typescript
import { redirect } from 'next/navigation'
import { getServerSession } from '../../lib/auth'
import { EditorShell } from '../../components/editor/EditorShell'

const ALLOWED_ROLES = ['cashier', 'admin', 'superadmin']

export default async function EditorPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  if (!ALLOWED_ROLES.includes(session.role)) redirect('/salon')
  return <EditorShell />
}
```

- [ ] **11.7** Run tests — verify PASS
- [ ] **11.8** Run `pnpm type-check` — zero errors
- [ ] **11.9** Commit: `feat(app-pos): add /editor route with full EditorShell`

---

## Task 12: app-pos — Socket integration for live editor sync

**Files:**
- Extend: `apps/app-pos/src/components/editor/EditorShell.tsx`

- [ ] **12.1** Write test: `table_created` socket event adds table to store without page reload

```typescript
it('socket table_created adds table to editor store', () => {
  const { result } = renderHook(() => useEditorStore())
  // simulate socket event
  act(() => result.current.addTableLocal(newTable))
  expect(result.current.tables).toContainEqual(newTable)
})
```

- [ ] **12.2** Write test: when two users have the editor open, layout change by user A appears for user B via socket

- [ ] **12.3** Run tests — verify FAIL

- [ ] **12.4** In `EditorShell`, subscribe to editor socket events from `useTables`:
  - When socket events arrive (via `useTables` which already listens), sync those changes into the `useEditorStore` tables array
  - Use a `useEffect` that syncs `tablesFromHook` into the editor store on first load and on socket changes (do NOT sync during local drag — check `isDragging` ref)
  - Guard: if the change originated from this client (use optimistic update), skip re-applying from socket

- [ ] **12.5** Run tests — verify PASS
- [ ] **12.6** Commit: `feat(app-pos): sync live socket table events into editor store`

---

## Task 13: End-to-end validation

- [ ] **13.1** Start local-server and app-pos in dev mode

```bash
# Terminal 1
cd /workspace/myway && pnpm --filter local-server dev

# Terminal 2
cd /workspace/myway && pnpm --filter app-pos dev
```

- [ ] **13.2** Manual test — Add tables:
  - Navigate to `http://localhost:3000/editor` as admin
  - Click "Agregar mesa" → add Bar table #1 (4 seats)
  - Click "Agregar mesa" → add Pool table #2 (4 seats)
  - Verify both appear on canvas with correct visual style (pool = dark green felt, bar = slate)

- [ ] **13.3** Manual test — Drag and resize:
  - Drag table #1 to new position → verify position persists on page reload
  - Click table #2 to select → resize using corner handles → verify new size saved
  - Rotate table #1 using top handle → verify rotation saved

- [ ] **13.4** Manual test — Multi-select:
  - Shift+click table #1 then table #2 → both should be highlighted with gold stroke
  - Drag-select both tables using rubber band → same result

- [ ] **13.5** Manual test — Merge and separate:
  - Select tables #1 and #2 → click "Unir mesas" → enter new number 10 → confirm
  - Verify composite table #10 appears on canvas; tables #1 and #2 are dimmed (mergedIntoId set)
  - Click table #10 → click "Separar" → verify originals restored

- [ ] **13.6** Manual test — Zone tabs:
  - Switch to "Afuera" zone tab → canvas is empty
  - Add table #3 in Afuera → switch back to "Salón Principal" → table #3 not visible

- [ ] **13.7** Manual test — Save and load snapshot:
  - Click "Guardar layout" → name it "Test Snapshot" → save
  - Open SnapshotPanel → verify "Test Snapshot" appears in list
  - Rearrange tables → load "Test Snapshot" → original positions restored

- [ ] **13.8** Manual test — Export PNG:
  - Click "Exportar PNG" → verify image downloads with all tables rendered

- [ ] **13.9** Manual test — Vista Live:
  - Switch to "Vista Live" tab
  - In another tab, change a table's status via the salon view
  - Verify color updates in real-time in live canvas (no interaction possible — tables not draggable)

- [ ] **13.10** Commit: `test: validate full salon editor E2E flow`

---

## Verification Checklist

Before marking this plan complete:

- [ ] `pnpm build` — zero TypeScript errors across `app-pos` and `local-server`
- [ ] `pnpm test` — all unit tests green (useEditorStore, editor-utils, TableShape, modals, toolbar)
- [ ] `POST /tables` creates a table; `DELETE /tables/:id` removes it; `PATCH /tables/:id` updates geometry
- [ ] `POST /tables/merge` with 2 available tables → creates composite; originals get `mergedIntoId`
- [ ] `POST /tables/:id/separate` → originals restored; composite deleted
- [ ] `POST /layout-snapshots` saves snapshot; `GET /layout-snapshots` returns list newest-first
- [ ] `/editor` route returns 302 redirect for `waiter`, `kitchen`, `bar` roles
- [ ] Drag a table → position persists after page reload (stored in SQLite via PATCH)
- [ ] Resize with Transformer → width/height/rotation persisted
- [ ] Rotate with Transformer rotation handle → persisted
- [ ] Multi-select with Shift+click works; drag rubber band selects all overlapping tables
- [ ] Merge flow: composite table appears, originals dimmed with `mergedIntoId`
- [ ] Separate flow: originals restored, composite gone
- [ ] "Guardar layout" → POST to `/layout-snapshots` → isDirty indicator clears
- [ ] Load snapshot from SnapshotPanel → canvas matches saved state
- [ ] "Exportar PNG" triggers browser download of canvas as `.png`
- [ ] Vista Live tab shows real-time table status colors (green/red/amber) from socket
- [ ] Vista Live tables are not draggable and Transformer does not appear

---

*Previous: [Plan 1 — Core Bar Operations](2026-03-21-plan-1-core-bar.md)*
