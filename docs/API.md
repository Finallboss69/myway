# Referencia de API — My Way

Base URL: `/api`

Todas las respuestas son JSON. Los errores retornan `{ "error": "mensaje" }` con el código HTTP correspondiente.

---

## Zonas

### `GET /api/zones`
Retorna todas las zonas ordenadas por `order`.

**Respuesta:**
```json
[
  { "id": "z1", "name": "Salón Principal", "order": 0 },
  { "id": "z2", "name": "Afuera", "order": 1 }
]
```

---

## Mesas

### `GET /api/tables`
Retorna todas las mesas con su zona.

**Query params opcionales:**
- `?zoneId=z1` — filtra por zona

**Respuesta:** Array de `Table` con `zone` incluido.

### `GET /api/tables/:id`
Retorna una mesa específica con su zona.

### `PATCH /api/tables/:id`
Actualiza campos de una mesa (status, posición, etc.).

**Body:** Cualquier campo de `Table` (parcial).

---

## Pedidos

### `GET /api/orders`
Retorna pedidos activos (excluye `closed` por defecto).

**Query params opcionales:**
- `?tableId=t1` — filtra por mesa
- `?status=pending` — filtra por estado
- `?target=bar` — filtra ítems por estación
- `?includeClosed=true` — incluye pedidos cerrados (para analíticas)

**Respuesta:** Array de `Order` con `items` incluidos.

### `POST /api/orders`
Crea un nuevo pedido y marca la mesa como ocupada (transacción).

**Body:**
```json
{
  "tableId": "t1",
  "waiterName": "Lucía",
  "items": [
    {
      "productId": "p1",
      "name": "Fernet con Coca",
      "qty": 2,
      "price": 2800,
      "target": "bar",
      "notes": "Con hielo"
    }
  ]
}
```

**Respuesta:** `Order` creado con `items` (HTTP 201).

### `GET /api/orders/:id`
Retorna un pedido específico con sus ítems.

### `POST /api/orders/:id/close`
Cierra un pedido y libera la mesa (transacción).

**Body:**
```json
{ "paymentMethod": "cash" }
```

`paymentMethod` acepta: `"cash"` · `"card"` · `"mercadopago"`

**Respuesta:** `Order` actualizado.

### `PATCH /api/orders/:id/items/:itemId`
Actualiza el estado de un ítem y recalcula el estado del pedido automáticamente.

**Body:**
```json
{ "status": "preparing" }
```

Estados válidos: `pending` · `preparing` · `ready` · `delivered` · `cancelled`

**Respuesta:**
```json
{
  "order": { ...orderConItems },
  "notification": null
}
```

Si todos los ítems están en `delivered`/`cancelled`, `notification` contiene:
```json
{
  "type": "order_complete",
  "orderId": "...",
  "message": "Order ... is complete"
}
```

---

## Productos

### `GET /api/products`
Retorna todos los productos con su categoría.

**Query params opcionales:**
- `?categoryId=c1` — filtra por categoría
- `?target=bar` — filtra por estación
- `?available=true` — solo productos disponibles

### `POST /api/products`
Crea un nuevo producto.

**Body:**
```json
{
  "name": "Gin Tónico",
  "categoryId": "c1",
  "target": "bar",
  "price": 3500,
  "description": "Gin Bombay + tónica artesanal",
  "isAvailable": true,
  "isPoolChip": false
}
```

### `PATCH /api/products/:id`
Actualiza un producto (campos parciales).

### `DELETE /api/products/:id`
Elimina un producto.

---

## Categorías

### `GET /api/categories`
Retorna todas las categorías ordenadas por `order`.

### `PATCH /api/categories/:id`
Actualiza una categoría (nombre, icono, orden).

---

## Personal (Staff)

### `GET /api/staff`
Retorna todo el personal.

**Query params opcionales:**
- `?role=waiter` — filtra por rol

### `POST /api/staff`
Crea un nuevo empleado.

**Body:**
```json
{
  "name": "Lucía Fernández",
  "role": "waiter",
  "avatar": "LF",
  "pin": "1234"
}
```

Roles válidos: `admin` · `cashier` · `waiter` · `bar` · `kitchen`

### `PATCH /api/staff/:id`
Actualiza datos de un empleado.

### `DELETE /api/staff/:id`
Elimina un empleado.

---

## Ingredientes

### `GET /api/ingredients`
Retorna todos los ingredientes de stock.

### `POST /api/ingredients`
Crea un nuevo ingrediente.

**Body:**
```json
{
  "name": "Gin Bombay",
  "unit": "ml",
  "stockCurrent": 1000,
  "alertThreshold": 500,
  "costPerUnit": 0.038
}
```

Unidades válidas: `"ml"` · `"gr"` · `"units"`

### `PATCH /api/ingredients`
Actualiza el stock de múltiples ingredientes en una sola operación.

**Body:**
```json
{
  "updates": [
    { "id": "ing1", "stockCurrent": 2000 },
    { "id": "ing2", "stockCurrent": 500 }
  ]
}
```

### `PATCH /api/ingredients/:id`
Actualiza un ingrediente específico.

**Body:** Campos parciales del ingrediente.

---

## Delivery

### `GET /api/delivery`
Retorna pedidos de delivery.

**Query params opcionales:**
- `?status=pending` — filtra por estado
- `?includeClosed=true` — incluye entregados/cancelados

### `POST /api/delivery`
Crea un pedido de delivery.

**Body:**
```json
{
  "customerName": "Juan Pérez",
  "address": "Av. Corrientes 1234",
  "phone": "1150001234",
  "paymentMethod": "mercadopago",
  "notes": "Sin cebolla",
  "total": 8500,
  "items": [
    { "name": "Burger My Way", "qty": 1, "price": 5800 },
    { "name": "Agua s/gas", "qty": 2, "price": 800 }
  ]
}
```

**Respuesta:** `DeliveryOrder` creado (HTTP 201).

### `PATCH /api/delivery/:id`
Actualiza el estado de un pedido de delivery.

**Body:**
```json
{ "status": "on_the_way" }
```

Estados: `pending` · `preparing` · `on_the_way` · `delivered` · `cancelled`

---

## Códigos de error comunes

| Código | Significado |
|--------|-------------|
| 400 | Body inválido o campos requeridos faltantes |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor (ver logs del servidor) |
