# Arquitectura — My Way

## Modelo de datos

```
Zone ──< Table ──< Order ──< OrderItem
                              │
Category ──< Product ─────────┘ (productId + snapshot de name/price)

Staff
Ingredient
DeliveryOrder ──< DeliveryOrderItem
```

### Entidades principales

#### Zone
Agrupa mesas físicamente (ej. "Salón Principal", "Afuera").

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String | CUID |
| `name` | String | Nombre de la zona |
| `order` | Int | Orden de aparición en tabs |

#### Table
Mesa física del local.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String | CUID |
| `number` | Int | Número visible de la mesa |
| `zoneId` | String | Zona a la que pertenece |
| `type` | String | `"bar"` o `"pool"` |
| `status` | String | `available` · `occupied` · `reserved` |
| `seats` | Int | Capacidad de personas |
| `x, y, w, h` | Float | Posición y tamaño en el plano (px) |

#### Order
Pedido asociado a una mesa. Snapshot del número de mesa y zona al momento de creación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String | CUID |
| `tableId` | String | Referencia a la mesa |
| `tableNumber` | Int | Snapshot del número (no se pierde si cambia la mesa) |
| `zoneId` | String | Snapshot de la zona |
| `status` | String | `pending` · `preparing` · `ready` · `closed` · `cancelled` |
| `waiterName` | String? | Nombre del mozo que tomó el pedido |
| `paymentMethod` | String? | `cash` · `card` · `mercadopago` |
| `createdAt` | DateTime | |
| `closedAt` | DateTime? | Timestamp de cierre |

#### OrderItem
Ítem dentro de un pedido. Guarda snapshot de nombre y precio en el momento del pedido.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `productId` | String | Referencia al producto |
| `name` | String | Snapshot del nombre |
| `price` | Float | Snapshot del precio |
| `qty` | Int | Cantidad |
| `status` | String | `pending` · `preparing` · `ready` · `delivered` · `cancelled` |
| `target` | String | `"bar"` o `"kitchen"` — a qué estación va |
| `notes` | String? | Aclaraciones del cliente |

#### Product
Ítem del menú.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `categoryId` | String | Categoría del producto |
| `target` | String | `"bar"` o `"kitchen"` |
| `isAvailable` | Boolean | Si aparece en el menú activo |
| `isPoolChip` | Boolean | Si es ficha de pool (lógica especial) |

#### Staff
Personal del local.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `role` | String | `admin` · `cashier` · `waiter` · `bar` · `kitchen` |
| `pin` | String | PIN de 4 dígitos para login |
| `avatar` | String | Iniciales (ej. `"MG"`) |

#### Ingredient
Ingrediente de bar para control de stock.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `unit` | String | `"ml"` · `"gr"` · `"units"` |
| `stockCurrent` | Float | Stock actual |
| `alertThreshold` | Float | Umbral de alerta |
| `costPerUnit` | Float | Costo por unidad (para valorización) |

#### DeliveryOrder
Pedido de delivery (independiente del sistema de mesas).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `customerName` | String | Nombre del cliente |
| `address` | String | Dirección de entrega |
| `phone` | String? | Teléfono de contacto |
| `status` | String | `pending` · `preparing` · `on_the_way` · `delivered` · `cancelled` |
| `paymentMethod` | String | `cash` · `card` · `mercadopago` |
| `total` | Float | Total del pedido |

---

## Flujos de negocio

### Ciclo de vida de un pedido en mesa

```
[Mozo] Selecciona mesa → Agrega ítems → Confirma pedido
           ↓
[API POST /api/orders]
  · Crea Order (status: "pending")
  · Crea OrderItems (status: "pending")
  · Actualiza Table (status: "occupied")
           ↓
[Cocina/Bar] Ve ítems según target (kitchen/bar)
  · Marca ítem como "preparing" → order pasa a "preparing"
  · Marca ítem como "ready"
           ↓
[Mozo] Ve ítems listos en /waiter/ready
  · Marca ítem como "delivered"
           ↓
[Caja] Ve order en /admin/accounting
  · Click "Cerrar mesa" → elige método de pago
  · [API POST /api/orders/:id/close]
      · Order → "closed", Table → "available"
```

### Lógica de estado del Order (calculada automáticamente)

Cada vez que cambia el estado de un `OrderItem`:

| Condición | Estado del Order |
|-----------|-----------------|
| Todos los ítems en `delivered` o `cancelled` | `ready` |
| Todos en `ready`, `delivered` o `cancelled` | `ready` |
| Al menos uno en `preparing` o `ready` | `preparing` |
| Todo lo demás | `pending` |

### Ciclo de vida de un pedido de delivery

```
[Admin] Crea pedido → pending
  ↓ Admin avanza estado
preparing → on_the_way → delivered
           (o cancelled en cualquier punto)
```

---

## Arquitectura de la aplicación

### Patrón de datos en el cliente

Todas las vistas usan **polling** con `setInterval` en lugar de WebSockets:
- Intervalo típico: **5-10 segundos** para vistas operativas (cocina, bar, mozo)
- Intervalo de **30 segundos** para vistas de stock
- Sin estado global compartido entre vistas — cada vista es independiente

### Separación de estaciones (target)

Al crear un pedido, cada ítem tiene `target: "bar" | "kitchen"`:
- **Kitchen (`/kitchen`):** ve solo ítems con `target: "kitchen"` (comidas)
- **Bar (`/bar`):** ve solo ítems con `target: "bar"` (bebidas, pool)
- La API soporta filtro por `?target=bar|kitchen`

### Autenticación

Actualmente usa **PIN de 4 dígitos** por rol (sin sesión persistente entre recargas). `next-auth` está instalado pero la autenticación completa está preparada para implementar.

### Base de datos

SQLite vía `@prisma/adapter-better-sqlite3` — sin servidor externo, archivo `dev.db` en el directorio del proyecto. Para producción se puede migrar a PostgreSQL cambiando el `datasource` en `schema.prisma`.

---

## Convenciones de código

- **Componentes:** Archivos `.tsx` por ruta, componentes auxiliares en el mismo archivo si son exclusivos de esa vista
- **API Routes:** Un archivo `route.ts` por recurso, verbos HTTP estándar (GET/POST/PATCH/DELETE)
- **Tipos:** Definidos en `src/lib/types.ts`, compartidos entre cliente y servidor
- **Utilidades:** `src/lib/utils.ts` (formateo), `src/lib/api.ts` (fetch helper), `src/lib/db.ts` (cliente Prisma singleton)
- **Estilos:** Clases utilitarias de Tailwind + clases custom en `globals.css` para componentes reutilizables (`card`, `btn-primary`, `badge`, `sidebar-item`, etc.)
