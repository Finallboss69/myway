# My Way — Landing Page, Delivery & GPS Tracking

**Fecha:** 2026-03-22
**Estado:** Aprobado por el usuario
**Stack:** Next.js 16 App Router, Prisma v7, SQLite, Leaflet.js, Tailwind CSS v4

---

## Contexto

My Way es un bar & pool ubicado en Olivos, GBA Norte. La app ya tiene sistema operativo completo (POS, cocina, bar, mozos, admin). Faltan tres piezas orientadas al cliente externo:

1. **Landing page pública** — primera impresión del local, acceso al menú y delivery
2. **Página de delivery** — el cliente hace el pedido desde su celular
3. **Tracking GPS en tiempo real** — el cliente sigue al repartidor en un mapa

---

## Alcance

### Páginas nuevas

| Ruta | Audiencia | Descripción |
|------|-----------|-------------|
| `/` | Público general | Landing page completa del bar |
| `/delivery` | Cliente | Menú + carrito + formulario de pedido |
| `/track/[orderId]` | Cliente | Mapa en vivo + estado del pedido |
| `/repartidor/[orderId]` | Repartidor | Panel móvil: info del pedido + GPS |

### Páginas modificadas

| Ruta | Cambio |
|------|--------|
| `/admin/delivery` | Agregar columna con link del repartidor (copiar/compartir) |

---

## Diseño visual

- **Estilo:** Dark minimal — fondo `#080808`, acento dorado `#f59e0b`, texto `#f0f0f0`
- **Tipografía:** System UI / Segoe UI (ya definida en el sistema)
- **Iconos:** Solo SVG inline — sin emojis en ningún componente
- **Animaciones:** `animate-fade-in`, `animate-scale-in` (ya definidas en globals.css), transiciones CSS de 200-300ms
- **Mobile-first:** Todas las páginas nuevas diseñadas primero para celular

---

## Página 1 — Landing `/`

### Secciones (en orden)

#### 1.1 Video intro (pantalla de carga)
- Se muestra la primera vez que se abre la página (o siempre, durante 2-3 segundos)
- Video: `/media/intro.mp4` (mywayolivos_1755895568)
- Overlay con logo "MY WAY" centrado + tagline "Bar & Pool · Olivos"
- Barra de progreso animada en el borde inferior
- Fade out al terminar → aparece la landing

**Implementación:** Componente `IntroLoader` con `useState(true)`. Se oculta con `setTimeout` de 3000ms + clase CSS para fade. Se guarda en `sessionStorage` para no repetirlo en la misma sesión.

#### 1.2 Hero
- Imagen de fondo: `pool-hero.jpg` (jugador de pool, dramático)
- Gradient overlay de abajo hacia arriba
- Contenido: tag "Bar & Pool · Olivos, Buenos Aires", título "MY WAY", subtítulo "Comida · Tragos · Pool"
- Dos botones: "Ver menú" (scroll a sección menú) + "Pedir delivery" (link a `/delivery`)

#### 1.3 Galería / Ambiente
- Título "Viví la experiencia"
- Grid de 3 fotos: `cheers.jpg`, `drinks-hero.jpg`, `pool-ambiente.jpg` (wide)
- Animación de entrada con intersection observer (fade-in al hacer scroll)

#### 1.4 Menú interactivo
- Título "Menú" + subtítulo "Pedí en la mesa o llevátelo a casa"
- Categorías en scroll horizontal (pills): carga desde `/api/categories`
- Productos filtrados por categoría activa: carga desde `/api/products?categoryId=X&available=true`
- Cada producto: foto (si tiene) o placeholder, nombre, descripción, precio
- Botón "Pedir delivery" al pie de la sección

#### 1.5 Delivery CTA
- Banner con imagen de fondo `burger-hands.jpg`
- Texto: "Tu pedido, en tu puerta" + "Zona Olivos · GBA Norte"
- Botón "Pedir ahora" → `/delivery`

#### 1.6 Seguimiento
- Widget de entrada de código de pedido
- Input + botón "Rastrear" → `/track/[orderId]`
- Texto de apoyo: "Seguí tu pedido en tiempo real"

#### 1.7 Info del local
- Grid 2 columnas: Horarios (Mar–Dom, 19:00–03:00) + Ubicación (Olivos)
- Redes sociales: @mywayolivos

#### 1.8 Footer
- Logo MY WAY, links: Menú, Delivery, Instagram, WhatsApp

---

## Página 2 — Delivery `/delivery`

### Flujo
1. Cliente entra a `/delivery`
2. Navega el menú por categorías (mismo componente que landing, con carrito)
3. Completa form: nombre, dirección, teléfono, notas, método de pago
4. Confirma → `POST /api/delivery` → redirige a `/track/[orderId]`

### Componentes
- `MenuBrowser` — categorías + productos, reutilizable desde landing
- `CartDrawer` — carrito lateral deslizable (Zustand store)
- `CheckoutForm` — form de contacto y pago
- `OrderConfirmation` — pantalla de confirmación antes de enviar

### Método de pago
- Opciones: `"efectivo"` (Efectivo al recibir) / `"transferencia"` (Transferencia bancaria)
- Campo requerido en el form (selector, valor por defecto: efectivo)
- Se guarda en `DeliveryOrder.paymentMethod` (campo existente o nuevo string)
- No hay procesamiento de pago en línea; solo se registra la preferencia

### Validaciones
- Nombre requerido (mín. 2 chars)
- Dirección requerida
- Teléfono opcional pero recomendado
- Método de pago requerido (efectivo / transferencia)
- Carrito no vacío para poder confirmar

---

## Página 3 — Tracking `/track/[orderId]`

### Layout
- Header: logo MY WAY + número de pedido
- Mapa (Leaflet.js, OpenStreetMap): 55% de la pantalla en mobile
  - Tile: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
  - Marcador verde pulsante = repartidor (se actualiza con polling cada 5s)
  - Badge "Llega en ~X min" calculado con distancia Haversine, velocidad asumida 30 km/h
- Timeline de estados: Recibido → Preparando → En camino → Entregado
- Resumen del pedido (ítems + total)

### Polling
```
GET /api/delivery/[id]/tracking
→ { status, repartidorLat, repartidorLng, items, total, customerName }
```
Intervalo: 5000ms. Se detiene cuando `status === "delivered" || "cancelled"`.

### Estados del mapa
| Estado del pedido | Mapa |
|-------------------|------|
| `pending` / `preparing` | Mapa oculto, solo timeline |
| `on_the_way` | Mapa visible con punto del repartidor |
| `delivered` | Mapa oculto, mensaje "¡Entregado!" con animación |

---

## Página 4 — Repartidor `/repartidor/[orderId]`

### Layout (mobile-first)
- Header: logo + "Panel del repartidor"
- Card con datos del pedido: nombre cliente, dirección, teléfono, lista de ítems
- Card GPS: botón "Activar GPS" → solicita `navigator.geolocation.watchPosition()`
  - Cuando activo: muestra coordenadas actuales + badge "GPS activo"
  - Envía `PATCH /api/delivery/[id]/location` cada 8 segundos
- Botones de estado (secuenciales): Preparando → En camino → Entregado
- Nota: "Compartí el link de tracking con el cliente por WhatsApp"

### Geolocation
```js
navigator.geolocation.watchPosition(
  (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
  (err) => showError(err),
  { enableHighAccuracy: true, maximumAge: 5000 }
)
```
Throttle: solo envía al servidor si han pasado ≥8 segundos desde el último envío.

---

## Cambios en la base de datos

### Migración: agregar campos de GPS a DeliveryOrder

```prisma
model DeliveryOrder {
  // ... campos existentes ...
  repartidorLat Float?   // latitud GPS del repartidor
  repartidorLng Float?   // longitud GPS del repartidor
  repartidorUpdatedAt DateTime? // última actualización de GPS
}
```

---

## Nuevos endpoints de API

### `GET /api/delivery/[id]/tracking`
Retorna datos mínimos para el cliente de tracking (sin datos sensibles).

**Respuesta:**
```json
{
  "id": "...",
  "status": "on_the_way",
  "repartidorLat": -34.513,
  "repartidorLng": -58.507,
  "items": [{ "name": "Burger My Way", "qty": 2, "price": 5800 }],
  "total": 16600,
  "customerName": "Juan"
}
```

### `PATCH /api/delivery/[id]/location`
Solo actualiza lat/lng. Usado por el repartidor cada 8 segundos.

**Body:**
```json
{ "lat": -34.513, "lng": -58.507 }
```

**Respuesta:** `{ "ok": true }`

---

## Cambios en admin/delivery

- Nueva columna "Link repartidor" por cada pedido activo
- Botón "Copiar link" → copia `https://[dominio]/repartidor/[orderId]` al portapapeles
- Botón opcional "Compartir por WhatsApp" → abre `wa.me` con el link

---

## Dependencias nuevas

| Paquete | Versión | Uso |
|---------|---------|-----|
| `leaflet` | ^1.9 | Mapa interactivo |
| `react-leaflet` | ^4 | Wrapper React de Leaflet |

---

## Orden de implementación

1. **Instalar Leaflet** — `npm install leaflet react-leaflet @types/leaflet` (antes de las páginas que lo usan)
2. **Migración DB** — agregar `repartidorLat`, `repartidorLng`, `repartidorUpdatedAt`; verificar/agregar `paymentMethod` en `DeliveryOrder`
3. **API endpoints** — `/api/delivery/[id]/tracking` y `/api/delivery/[id]/location`
4. **Página repartidor** — `/repartidor/[orderId]` (funcional antes de tracking)
5. **Página tracking** — `/track/[orderId]` con Leaflet
6. **Página delivery** — `/delivery` con menú + carrito + form
7. **Landing page** — `/` con todas las secciones y video intro
8. **Admin delivery update** — agregar link del repartidor
