# Referencia de la API REST — My Way Olivos

Base URL: `https://myway-pi.vercel.app/api`

Todas las respuestas son JSON. Los errores devuelven `{ "error": "mensaje" }` con el status code correspondiente.

---

## Autenticacion

El sistema usa NextAuth v5 con Google OAuth. La autenticacion se maneja via `proxy.ts`:

| Nivel | Rutas | Requisito |
|-------|-------|-----------|
| Publico | GET `/api/categories`, `/api/products`, `/api/delivery`, `/api/delivery/[id]/tracking` | Ninguno |
| Publico | POST `/api/delivery` | Ninguno (validacion interna) |
| Semi-protegido | Todas las demas `/api/*` | Sesion activa |
| Admin | `/api/admin/*` | Rol "admin" |

---

## Pedidos (Orders)

### GET /api/orders
Lista pedidos. Query params: `?status=pending&tableId=xxx`

Respuesta: array de pedidos con items incluidos.

### POST /api/orders
Crea un pedido nuevo.

```json
{
  "tableId": "string",
  "tableNumber": 1,
  "zoneId": "string",
  "waiterName": "string",
  "items": [
    { "productId": "string", "name": "string", "qty": 1, "price": 100, "target": "bar", "notes": "sin hielo" }
  ]
}
```

### PATCH /api/orders/[id]
Actualizar estado del pedido.

```json
{ "status": "preparing" }
```

Estados validos: `pending`, `preparing`, `ready`, `closed`, `cancelled`

### POST /api/orders/[id]/close
Cerrar pedido (cobrar).

```json
{ "paymentMethod": "efectivo" }
```

### PATCH /api/orders/[id]/items/[itemId]
Actualizar estado de un item.

```json
{ "status": "preparing" }
```

---

## Delivery

### GET /api/delivery
Lista pedidos de delivery. Semi-protegido.

### POST /api/delivery
Crear pedido de delivery. **Publico** pero con validaciones:
- Horario: Mar-Dom 19:00-03:00 (Argentina). Bypass: `SKIP_HOURS_CHECK=true`
- Telefono obligatorio
- Precios recalculados server-side si se incluye `productId`

```json
{
  "customerName": "Juan",
  "address": "Calle 123, Olivos",
  "phone": "1155551234",
  "paymentMethod": "efectivo",
  "notes": "timbre 2B",
  "userId": "optional-user-id",
  "items": [
    { "productId": "clx123", "name": "Fernet con Coca", "qty": 2, "price": 5000 }
  ]
}
```

`paymentMethod` validos: `efectivo`, `transferencia`, `mercadopago`, `card`, `cash`

### PATCH /api/delivery/[id]
Actualizar estado.

```json
{ "status": "preparing" }
```

Estados: `pending` -> `preparing` -> `on_the_way` -> `delivered`

### PATCH /api/delivery/[id]/location
Actualizar ubicacion GPS del repartidor.

```json
{ "lat": -34.123, "lng": -58.456 }
```

### GET /api/delivery/[id]/tracking
Obtener info de seguimiento. **Publico**.

Respuesta: `{ id, status, customerName, address, repartidorLat, repartidorLng, repartidorUpdatedAt, items }`

---

## Productos y Menu

### GET /api/products
Lista todos los productos. **Publico** (GET).

### POST /api/products
Crear producto.

```json
{
  "name": "Fernet con Coca",
  "price": 5000,
  "categoryId": "string",
  "target": "bar",
  "description": "optional",
  "isAvailable": true,
  "isPoolChip": false,
  "image": "url-optional"
}
```

### PUT /api/products/[id]
Campos permitidos: `name`, `description`, `price`, `categoryId`, `target`, `isAvailable`, `isPoolChip`, `image`, `costPrice`

### DELETE /api/products/[id]

### GET /api/categories
Lista categorias del menu. **Publico**.

### POST /api/categories
```json
{ "name": "Tragos", "icon": "🍹", "order": 1, "parentId": "optional" }
```

### PUT /api/categories/[id]
Campos permitidos: `name`, `icon`, `order`, `parentId`

### DELETE /api/categories/[id]

---

## Ingredientes y Recetas

### GET /api/ingredients
Lista ingredientes con categoria, proveedor y recetas vinculadas.

### POST /api/ingredients
```json
{
  "name": "Fernet Branca",
  "unit": "ml",
  "stockCurrent": 5000,
  "alertThreshold": 1000,
  "costPerUnit": 2.5,
  "categoryId": "optional",
  "supplierId": "optional"
}
```

### PATCH /api/ingredients/[id]
Campos: `name`, `unit`, `stockCurrent`, `alertThreshold`, `costPerUnit`, `categoryId`, `supplierId`

### PATCH /api/ingredients (batch)
```json
{ "updates": [{ "id": "xxx", "stockCurrent": 4500 }] }
```

### GET /api/ingredient-categories
### POST /api/ingredient-categories
### PUT /api/ingredient-categories/[id]
Campos: `name`, `icon`, `order`

### DELETE /api/ingredient-categories/[id]

### GET /api/recipe-ingredients
Query: `?productId=xxx`

### POST /api/recipe-ingredients
Auto-recalcula `costPrice` del producto.

```json
{ "productId": "xxx", "ingredientId": "yyy", "quantity": 60, "unit": "ml" }
```

### PUT /api/recipe-ingredients/[id]
Campos: `quantity`, `unit`, `ingredientId`. Recalcula costo.

### DELETE /api/recipe-ingredients/[id]
Recalcula costo del producto.

### GET /api/cost-calculator
Devuelve analisis de costos de todos los productos.

Respuesta:
```json
{
  "products": [
    { "id": "x", "name": "Fernet", "category": "Tragos", "salePrice": 5000, "costPrice": 1500, "profit": 3500, "marginPercent": 70, "hasRecipe": true }
  ],
  "summary": { "totalProducts": 50, "withRecipe": 30, "withoutRecipe": 20, "avgMargin": 65.2 }
}
```

---

## Proveedores

### GET /api/suppliers
Incluye categoria y conteo de facturas/ingredientes.

### POST /api/suppliers
```json
{ "name": "Distribuidora X", "cuit": "20-12345678-9", "phone": "1155551234", "categoryId": "optional" }
```

### PUT /api/suppliers/[id]
Campos: `name`, `cuit`, `address`, `phone`, `email`, `notes`, `categoryId`

### DELETE /api/suppliers/[id]

### GET/POST /api/supplier-categories
### PUT /api/supplier-categories/[id]
Campos: `name`, `icon`, `order`

### DELETE /api/supplier-categories/[id]

### GET/POST /api/supplier-invoices
### PUT/DELETE /api/supplier-invoices/[id]

---

## Historial de Precios

### GET /api/price-history
Query: `?ingredientId=xxx`

### POST /api/price-history
Actualiza el costo del ingrediente automaticamente.

```json
{ "ingredientId": "xxx", "costPerUnit": 3.0, "supplierId": "optional", "notes": "aumento marzo" }
```

---

## Gastos

### GET /api/expenses
Query params: `?from=2024-01-01&to=2024-01-31&categoryId=xxx&supplierId=yyy`

### POST /api/expenses
```json
{
  "categoryId": "xxx",
  "description": "Compra de insumos",
  "amount": 15000,
  "date": "2024-03-15T00:00:00Z",
  "paymentMethod": "efectivo",
  "supplierId": "optional",
  "isRecurring": false,
  "recurringDay": null,
  "notes": "optional"
}
```

### PUT /api/expenses/[id]
Campos: `categoryId`, `supplierId`, `description`, `amount`, `date`, `paymentMethod`, `notes`, `isRecurring`, `recurringDay`

### DELETE /api/expenses/[id]

### GET/POST /api/expense-categories
### PUT /api/expense-categories/[id]
Campos: `name`, `icon`, `order`, `parentId`, `budgetMonthly`

### DELETE /api/expense-categories/[id]

---

## Facturacion

### GET /api/invoices
### POST /api/invoices
Numero de factura generado automaticamente dentro de una transaccion (anti duplicados).

### PUT /api/invoices/[id]
Campos: `status`, `cae`, `caeExpiry`, `afipResponse`

### DELETE /api/invoices/[id]

### POST /api/afip/invoice
Emitir factura electronica via AFIP WSFE.

### GET /api/afip-config
Devuelve configuracion AFIP (PEM keys ocultas).

### PUT /api/afip-config
Actualizar configuracion AFIP.

---

## Caja Registradora

### GET /api/cash-register
### POST /api/cash-register
```json
{ "date": "2024-03-15T00:00:00Z", "openingBalance": 50000 }
```

### PATCH /api/cash-register/[id]
Campos: `closingBalance`, `status`, `closedAt`

### GET /api/cash-register/[id]/movements
### POST /api/cash-register/[id]/movements
```json
{ "type": "ingreso", "amount": 5000, "concept": "Venta mesa 3", "paymentMethod": "efectivo" }
```

---

## Staff

### GET /api/staff
Devuelve lista de empleados **sin PIN**.

### POST /api/staff
```json
{ "name": "Juan", "role": "mozo", "avatar": "", "pin": "1234" }
```

### PATCH /api/staff/[id]
Campos: `name`, `role`, `avatar`, `pin`

### DELETE /api/staff/[id]

### POST /api/staff/verify-pin
Verificar PIN sin exponer datos.

```json
{ "pin": "1234" }
```

Respuesta exito: `{ "id": "x", "name": "Juan", "role": "mozo", "avatar": "" }`
Respuesta error: `{ "error": "PIN incorrecto" }` (401)

---

## Mesas y Zonas

### GET /api/tables
### POST /api/tables
### PATCH /api/tables/[id]
Campos: `number`, `zoneId`, `type`, `status`, `seats`, `x`, `y`, `w`, `h`

### DELETE /api/tables/[id]

### GET /api/zones
### POST /api/zones

---

## Reportes Diarios

### GET /api/daily-reports
Query: `?from=2024-03-01&to=2024-03-31&limit=30`

### POST /api/daily-reports
Genera reporte para una fecha (calcula ingresos, costos, gastos, ganancias, top productos).

```json
{ "date": "2024-03-15" }
```

Respuesta:
```json
{
  "date": "2024-03-15",
  "totalRevenue": 500000,
  "totalCost": 150000,
  "totalExpenses": 50000,
  "grossProfit": 350000,
  "netProfit": 300000,
  "ordersCount": 45,
  "deliveryCount": 12,
  "avgTicket": 8771,
  "topProducts": "[{\"name\":\"Fernet\",\"qty\":25}]",
  "paymentBreakdown": "{\"efectivo\":200000,\"tarjeta\":300000}"
}
```

---

## Auth

### GET/POST /api/auth/[...nextauth]
Handlers de NextAuth v5. **Publico**.

Endpoints internos:
- `/api/auth/signin` — iniciar sesion
- `/api/auth/signout` — cerrar sesion
- `/api/auth/session` — obtener sesion actual
- `/api/auth/callback/google` — callback de Google OAuth

---

## Codigos de Error Comunes

| Status | Significado |
|--------|-------------|
| 400 | Datos invalidos o faltantes |
| 401 | No autenticado o PIN incorrecto |
| 403 | Sin permisos (rol insuficiente) |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |
