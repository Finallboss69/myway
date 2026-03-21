# My Way — Bar & Pool Management System
## Master Design Specification

**Date:** 2026-03-21
**Status:** Approved
**Version:** 1.2 (accounting, ML recipes, employee management, admin-only menu)

---

## 1. Overview

My Way is a full-stack bar and pool hall management platform for a single venue. It handles table ordering via QR, delivery ordering, kitchen and bar display systems, waiter operations including mobile payments, a drag-and-drop salon layout editor, and an owner analytics dashboard.

The system operates in two modes simultaneously:
- **Cloud mode** — customer-facing apps (QR ordering, delivery) hosted on Vercel + Supabase
- **Local mode** — staff apps (POS, kitchen, bar, waiter) running on a local Node.js server inside the bar's WiFi network, with offline-first SQLite and 15-minute bidirectional sync to Supabase

---

## 2. Architecture

### 2.1 Approach: Turborepo Monorepo

A Turborepo monorepo with pnpm workspaces. Each app is independently deployable. Shared packages (UI, types, DB, sync engine, auth, config, utils) are consumed by all apps.

**Why this approach:** With 7 apps and multiple shared concerns, a monorepo with isolated apps is the only architecture that scales without coupling. Changes to the kitchen display cannot break the POS. Each app deploys independently to Vercel.

### 2.2 Repository Structure

```
myway/
├── apps/
│   ├── web-customer/        # Cliente: QR mesa + delivery
│   ├── app-pos/             # Caja / POS
│   ├── app-kitchen/         # Cocina (KDS)
│   ├── app-bar/             # Barra de bebidas
│   ├── app-waiter/          # App del mozo
│   ├── app-admin/           # Panel dueños (analytics)
│   └── local-server/        # Servidor Node.js en PC del bar
│
├── packages/
│   ├── ui/                  # Componentes shadcn/ui customizados (tema oscuro)
│   ├── types/               # TypeScript interfaces compartidas
│   ├── db/                  # Prisma schema + cliente (cloud y local)
│   ├── sync-engine/         # Lógica paridad local ↔ Supabase (15 min)
│   ├── auth/                # Helpers NextAuth + Supabase Auth
│   ├── config/              # Configs compartidas: tailwind, eslint, tsconfig
│   └── utils/               # Funciones utilitarias compartidas
│
├── supabase/
│   ├── migrations/          # Migraciones SQL versionadas
│   ├── seed.sql             # Datos iniciales (menú, roles, mesas)
│   └── config.toml
│
├── docs/
│   └── superpowers/specs/   # Especificaciones del sistema
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 2.3 Network Architecture

```
Internet (Vercel + Supabase)
    ├── web-customer  → pedidos.myway.com
    └── app-admin     → admin.myway.com

Bar WiFi Network (local-server en PC del bar)
    ├── app-pos       → http://192.168.x.x:3001  (también pos.myway.com)
    ├── app-kitchen   → http://192.168.x.x:3001  (también kitchen.myway.com)
    ├── app-bar       → http://192.168.x.x:3001  (también bar.myway.com)
    └── app-waiter    → http://192.168.x.x:3001  (PWA en celular del mozo)

QR inteligente:
    ├── QR apunta siempre a pedidos.myway.com (Vercel)
    ├── web-customer intenta fetch a http://myway.local:3001/health (timeout 800ms)
    ├── Si responde → redirige a IP local (requests van al local-server)
    └── Si no responde → opera contra Vercel/Supabase directamente

Nota: la PC del bar debe tener IP estática (DHCP reservation) y hostname
mDNS configurado como `myway.local` para que la detección de red local funcione.
El script de instalación del local-server configura esto automáticamente.
```

---

## 3. Tech Stack

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 15 | Todas las web apps (App Router) |
| React | 19 | UI framework |
| TypeScript | 5.x | Todo el codebase |
| Tailwind CSS | v4 | Estilos — tema oscuro premium |
| shadcn/ui | latest | Componentes base customizados |
| Zustand | 5.x | Estado global por app |
| TanStack Query | 5.x | Fetching + cache de datos |
| Socket.io client | 4.x | Tiempo real |
| next-pwa | latest | PWA para apps del bar (offline) |
| NextAuth.js | v5 | Google OAuth para clientes delivery |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 22 LTS | Runtime |
| Express | 5.x | API local-server |
| Socket.io | 4.x | WebSocket server (tiempo real local) |
| Prisma | 5.x | ORM (mismos schemas, local y cloud) |
| BullMQ | 5.x | Cola de trabajos + sync scheduler |
| node-cron | 3.x | Job de sync cada 15 min |

### Base de Datos
| Tecnología | Uso |
|---|---|
| Supabase (PostgreSQL) | Cloud — fuente de verdad |
| Supabase Realtime | Eventos cloud → local-server |
| Supabase Auth | Auth de staff y dueños |
| Supabase Storage | Imágenes de productos y logos |
| SQLite (better-sqlite3) | Local — offline-first en PC del bar |
| Row Level Security (RLS) | Aislamiento de datos por rol |

### Infraestructura
| Tecnología | Uso |
|---|---|
| Vercel | Deploy de todas las apps cloud |
| Turborepo | Monorepo + builds incrementales |
| pnpm workspaces | Package manager |
| MercadoPago SDK | Pagos online (delivery) + QR cobro en mesa |
| QRCode.js | Generación de QR por mesa |
| ESC/POS | Protocolo impresora térmica |

---

## 4. Database Schema

### Core Entities

```sql
-- Venue (el bar)
venues (id, name, address, logo_url, settings_json, created_at)

-- Zones (Salón Principal / Afuera)
zones (id, venue_id, name, order, created_at)

-- Tables (mesas de bar y de pool)
tables (
  id, venue_id, zone_id, number, type ENUM(bar|pool),
  x, y, width, height, rotation, seats,
  status ENUM(available|occupied|reserved),
  merged_into_id REFERENCES tables(id),
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMP,
  created_at, updated_at
)

-- Layout snapshots (versiones guardadas del salón)
layout_snapshots (id, venue_id, name, snapshot_json, created_at)

-- Table sessions (sesión activa de una mesa)
table_sessions (
  id, table_id, opened_by REFERENCES staff(id),
  opened_at, closed_at, closed_by REFERENCES staff(id),
  status ENUM(open|closed|paid),
  notes,
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMP
)

-- Orders (pedidos — mesa y delivery)
orders (
  id, venue_id, type ENUM(table|delivery),
  status ENUM(pending|confirmed|preparing|ready|delivered|cancelled),
  table_session_id REFERENCES table_sessions(id),
  customer_id REFERENCES customers(id),
  total, discount_amount, discount_reason,
  created_by REFERENCES staff(id),
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMP,
  created_at, updated_at
)
-- Regla de conflicto de status: el estado solo puede avanzar en la máquina de estados.
-- pending→confirmed→preparing→ready→delivered|cancelled
-- Si local tiene "preparing" y cloud tiene "confirmed", se mantiene "preparing" (local wins en avance).

-- Order items
order_items (
  id, order_id, product_id, quantity, unit_price,
  notes, modifiers_json,
  status ENUM(pending|preparing|ready|delivered|cancelled),
  target ENUM(kitchen|bar),
  station VARCHAR,  -- sub-estación en cocina: grill|cold|desserts|default (nullable)
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMP,
  created_at, updated_at
)
-- order_items es APPEND-ONLY en sync: nunca se sobreescriben filas existentes,
-- solo se insertan filas nuevas. Conflicto de status: cloud puede solo avanzar
-- el estado (pending→preparing→ready→delivered), nunca retrocederlo.

-- Products (menú)
products (
  id, venue_id, category_id, name, description, price,
  image_url, is_available, is_pool_chip BOOLEAN DEFAULT false,
  target ENUM(kitchen|bar), sort_order,
  stock_count, stock_alert_threshold,
  allergens_json, created_at, updated_at
)

-- Product modifiers (sin hielo, doble, etc.)
product_modifiers (
  id, product_id, name, options_json, is_required, max_selections
)

-- Product categories
product_categories (
  id, venue_id, name, color, icon, sort_order, is_active
)

-- Product combos
product_combos (
  id, venue_id, name, description, price, items_json, is_active
)

-- Happy hour
happy_hours (
  id, venue_id, name, start_time, end_time, days_of_week,
  discount_type ENUM(percentage|fixed), discount_value, is_active
)

-- Staff (empleados)
staff (
  id, venue_id, name, email,
  role ENUM(superadmin|admin|cashier|waiter|kitchen|bar),
  pin_hash, is_active,
  failed_pin_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at
)

-- Customers (usuarios delivery)
customers (
  id, google_id, email, name, avatar_url,
  phone, loyalty_points, created_at
)

-- Loyalty transactions
loyalty_transactions (
  id, customer_id, order_id,
  type ENUM(earn|redeem),
  points, description, created_at
)
-- Reglas: 1 punto por cada $100 ARS gastados. Mínimo 100 puntos para canjear.
-- 100 puntos = $50 ARS de descuento. Gestionable desde app-admin.

-- Delivery orders
delivery_orders (
  id, order_id, customer_id,
  address, lat, lng,
  delivery_zone_id,
  payment_method ENUM(cash|mercadopago),
  mp_payment_id, mp_preference_id,
  delivery_status ENUM(pending|confirmed|preparing|on_the_way|delivered),
  assigned_to REFERENCES staff(id),
  estimated_minutes, delivered_at,
  received_at_local TIMESTAMP  -- seteado cuando local-server procesa la fila por primera vez
  -- Si NOW() - received_at_local > 10 min, POS/cocina muestra advertencia de pedido potencialmente desactualizado
)

-- Delivery zones
delivery_zones (
  id, venue_id, name, polygon_json,
  delivery_fee, is_active
)

-- Payments (múltiples por sesión para split payments)
payments (
  id, table_session_id, order_id,
  method ENUM(cash|mercadopago_qr|mercadopago_online|card|transfer),
  amount, mp_payment_id, received_by REFERENCES staff(id),
  created_at
)
-- El total pagado se computa sumando payments.amount para una table_session.
-- La UI muestra: total de la cuenta - total pagado = saldo pendiente.
-- La mesa se puede cerrar cuando saldo pendiente = 0.
-- Si webhook MP llega tarde en split payment: el sistema acepta el pago
-- y recalcula el saldo. La sesión no se cierra automáticamente hasta saldo = 0.

-- QR codes (por mesa)
qr_codes (
  id, table_id, code, token_hash,
  generated_at, generated_by REFERENCES staff(id),
  image_url, is_active
)

-- Sync state (singleton — registra último sync exitoso)
sync_state (
  id INT DEFAULT 1,  -- siempre una sola fila
  last_sync_at TIMESTAMP,
  last_successful_sync_at TIMESTAMP
)

-- Sync log
sync_log (
  id, started_at, finished_at,
  status ENUM(success|partial|failed),
  records_pushed, records_pulled, error_message
)

-- Cash register closes (cierre de caja diario)
cash_register_closes (
  id, venue_id, staff_id, opened_at, closed_at,
  opening_amount, closing_amount,
  total_cash_sales, total_mp_sales, total_card_sales, total_transfer_sales,
  total_sales, total_discounts, total_cancellations,
  notes, created_at
)

-- =====================
-- RECETAS Y CONTROL DE ML
-- =====================

-- Ingredients (insumos: gin, vodka, tónica, limón, etc.)
ingredients (
  id, venue_id, name,
  unit ENUM(ml|gr|units),   -- unidad de medida
  stock_current DECIMAL,    -- stock actual
  stock_alert_threshold DECIMAL,  -- alerta de stock bajo
  cost_per_unit DECIMAL,    -- costo por ml/gr/unidad para calcular margen
  created_at, updated_at
)

-- Recipes (receta de un producto)
recipes (
  id, product_id,           -- cada producto puede tener una receta
  notes,                    -- instrucciones de preparación (opcional)
  created_at, updated_at
)

-- Recipe items (ingredientes de una receta con cantidad)
recipe_items (
  id, recipe_id, ingredient_id,
  quantity DECIMAL,         -- cantidad en la unidad del ingrediente (ej: 60 ml)
  created_at
)

-- Ingredient stock movements (movimientos de stock)
ingredient_stock_movements (
  id, ingredient_id,
  type ENUM(purchase|sale|waste|adjustment),
  quantity DECIMAL,         -- positivo = entrada, negativo = salida
  order_item_id REFERENCES order_items(id),  -- si viene de una venta
  notes, created_by REFERENCES staff(id),
  created_at
)

-- =====================
-- CONTABILIDAD
-- =====================

-- Daily accounting snapshots (resumen diario generado automáticamente a medianoche)
daily_accounting (
  id, venue_id, date DATE,
  -- Ingresos por categoría
  revenue_food DECIMAL DEFAULT 0,
  revenue_drinks DECIMAL DEFAULT 0,
  revenue_cocktails DECIMAL DEFAULT 0,
  revenue_pool_chips DECIMAL DEFAULT 0,
  revenue_delivery DECIMAL DEFAULT 0,
  revenue_other DECIMAL DEFAULT 0,
  revenue_total DECIMAL DEFAULT 0,
  -- Por método de pago
  paid_cash DECIMAL DEFAULT 0,
  paid_mp DECIMAL DEFAULT 0,
  paid_card DECIMAL DEFAULT 0,
  paid_transfer DECIMAL DEFAULT 0,
  -- Descuentos y anulaciones
  total_discounts DECIMAL DEFAULT 0,
  total_cancellations DECIMAL DEFAULT 0,
  -- Costos (basado en recetas)
  cost_ingredients DECIMAL DEFAULT 0,
  gross_margin DECIMAL DEFAULT 0,
  -- Órdenes
  orders_count INT DEFAULT 0,
  delivery_orders_count INT DEFAULT 0,
  average_ticket DECIMAL DEFAULT 0,
  created_at
)

-- =====================
-- EMPLEADOS — PAGOS Y ADELANTOS
-- =====================

-- Staff contracts (información laboral de cada empleado)
staff_contracts (
  id, staff_id,
  salary_type ENUM(monthly|hourly),
  salary_amount DECIMAL,    -- monto mensual o tarifa por hora
  currency VARCHAR DEFAULT 'ARS',
  effective_from DATE,
  effective_to DATE,        -- null = contrato activo
  created_by REFERENCES staff(id),
  created_at
)

-- Staff advances (adelantos de sueldo)
staff_advances (
  id, staff_id, venue_id,
  amount DECIMAL,
  reason TEXT,
  date DATE,
  authorized_by REFERENCES staff(id),
  created_at
)

-- Staff payments (pagos de sueldo)
staff_payments (
  id, staff_id, venue_id,
  amount DECIMAL,
  period_from DATE,
  period_to DATE,
  payment_method ENUM(cash|transfer|mp),
  notes,
  paid_by REFERENCES staff(id),
  created_at
)

-- Staff shifts (registro de turnos — apertura y cierre)
staff_shifts (
  id, staff_id, venue_id,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_minutes INT,     -- calculado al cerrar turno
  notes
)
```

---

## 5. Apps — Features Completos

### 5.1 `web-customer` — App del Cliente

**Vista Mesa (QR — anónimo)**
- Menú con categorías, búsqueda, filtros
- Detalle de producto con foto, descripción, alérgenos
- Modificadores por item (sin sal, doble, término)
- Carrito persistente (localStorage)
- Notas por item
- Botón "Llamar al mesero" (alerta al app-waiter)
- Estado del pedido en tiempo real
- Ficha de pool destacada con contador en mesas tipo pool
- Sin login requerido

**Vista Delivery (con login Google)**
- Autenticación con Google (NextAuth.js v5)
- Mismo menú que vista mesa
- Dirección de entrega con Google Maps Autocomplete
- Selección de zona → costo de envío automático
- Tiempo estimado de entrega
- Selección de pago: efectivo / MercadoPago
- Checkout MercadoPago (redirect o modal)
- Confirmación de pedido + tracking en tiempo real
- Historial de pedidos anteriores
- Opción "pedir de nuevo" desde historial
- Programa de fidelización: puntos acumulados y canjeables

---

### 5.2 `app-pos` — Caja

**Vista principal: Salón**
- Layout interactivo en tiempo real
- Mesas coloreadas por estado (verde=libre, rojo=ocupada, amarillo=con cuenta pendiente)
- Tiempo de ocupación visible en cada mesa
- Click en mesa → panel lateral con pedido activo
- Indicador online/offline

**Gestión de pedidos**
- Ver todos los pedidos activos (mesa + delivery)
- Agregar items a una mesa
- Modificar/cancelar items con motivo
- Ver estado por item (en preparación / listo)
- Aplicar descuentos (% o fijo) con motivo
- Anular pedido completo con motivo (log auditado)

**Cobro**
- Generar QR MercadoPago por el total
- Registrar pago en efectivo
- Múltiples métodos de pago (split: parte efectivo + parte MP)
- División de cuenta entre N personas
- Cierre de mesa con comprobante

**Editor de Salón**
- Canvas drag & drop con dos zonas (Salón Principal / Afuera)
- Agregar mesas (bar o pool), asignar número
- Redimensionar y rotar mesas
- Unir 2+ mesas → nueva mesa compuesta con número nuevo
- Separar mesas unidas → vuelven a estado original
- Guardar snapshot con nombre
- Cargar snapshot anterior
- Vista live vs vista edición

**Gestión de disponibilidad (tiempo real)**
- Toggle rápido de disponibilidad por item (ej: "se acabó el pollo")
- Ver stock actual por producto (solo lectura — el stock se gestiona en app-admin)
- **No puede modificar precios, categorías, ni crear/eliminar productos** — eso es exclusivo de app-admin

**Generador de QR**
- Generar QR por mesa (token firmado HMAC)
- Previsualizar e imprimir (PDF)
- Regenerar QR (invalida el anterior)

**Cierre de caja**
- Resumen del día (ventas por método de pago)
- Conteo de efectivo esperado vs contado
- Exportar reporte PDF
- Historial de cierres

**Impresora térmica**
- Imprimir ticket de pedido a cocina/barra
- Imprimir cuenta para el cliente
- Configuración de IP/puerto de impresora

---

### 5.3 `app-kitchen` — Cocina (KDS)

- Fichas de pedidos en tiempo real (solo `target=kitchen`)
- Cada ficha: número de mesa, tipo (mesa/delivery), items, notas, modificadores, tiempo transcurrido
- Estados: **Nuevo → En preparación → Listo**
- Temporizadores por ficha: amarillo a X min, rojo a Y min (configurable)
- Alerta visual + sonido configurable al nuevo pedido
- Filtro por estado
- Vista por estación: filtro por `station` del producto (parrilla / frío / postres / default)
- Bump bar: un tap grande avanza el estado (optimizado para guantes)
- Vista compacta para cocinas pequeñas
- Sin acceso a información financiera

---

### 5.4 `app-bar` — Barra de Bebidas

- Igual que KDS pero solo `target=bar`
- Fichas de bebidas por mesa
- **Ficha de pool destacada** — muestra contador de fichas acumuladas por mesa con botón "Agregar ficha" en tamaño grande
- Estados: **Nuevo → Preparando → Listo**
- Alerta con nuevo pedido (sonido configurable)
- Sin acceso a información financiera

---

### 5.5 `app-waiter` — App del Mozo (PWA Mobile-first)

**Gestión de mesas**
- Vista del salón (mismo layout que POS)
- Abrir mesa (inicia table_session asignada al mozo)
- Agregar items a una mesa desde el celular
- Ver estado de items de sus mesas
- Recibir alerta cuando cocina/barra tienen algo listo
- Confirmar entrega de items en mesa (tap por item)
- Botón "llamar al mesero" → vibración en su celular + alerta en pantalla

**Cobro**
- Generar cuenta de una mesa
- **Cobro con MercadoPago QR** → genera QR dinámico, cliente escanea, pago confirmado automáticamente
- **Cobro en efectivo** → registra monto recibido, cierra mesa
- Cierre de mesa (el mozo O la caja pueden hacerlo)
- Si caja cierra su mesa → notificación al mozo en tiempo real

**Delivery (modo repartidor)**
- Ver pedidos delivery asignados
- Marcar como "en camino" y "entregado"
- Registrar cobro en efectivo delivery

---

### 5.6 `app-admin` — Panel Dueños

> **Único lugar donde se gestiona el menú, precios, empleados y contabilidad.**
> El app-pos y app-waiter no tienen acceso a estas funciones.

---

#### Dashboard General
- KPIs del día: ventas totales, pedidos, ticket promedio, mesas atendidas
- Comparativa vs día anterior / semana anterior
- Mapa de calor del salón (mesas más activas)
- Resumen de métodos de pago (efectivo / MP) del día
- Alertas activas: stock bajo, errores de sync, anulaciones inusuales

---

#### Gestión de Menú (exclusivo admin)
- CRUD completo de categorías, productos, modificadores, combos
- **Precios** — solo editables desde aquí. Historial de cambios de precio con fecha.
- Subir fotos de productos (Supabase Storage)
- Toggle disponibilidad por item
- Gestión de happy hour (horario, días, descuento)
- Gestión de recetas con ML (ver sección Recetas más abajo)
- Publicar cambios al menú → se sincroniza a todos los dispositivos en segundos

---

#### Contabilidad Diaria
- **Balance del día** — ingresos vs egresos, ganancia neta
- **Desglose por categoría**: comidas, bebidas, tragos, fichas de pool, delivery
- **Desglose por método de pago**: efectivo cobrado, pagos MP, tarjeta, transferencia
- **Historial diario** — navegar por cualquier día anterior
- **Balance semanal / mensual / anual** con gráficos
- **Comparativa período vs período** (esta semana vs la semana pasada, etc.)
- **Cierre del día** — resumen completo con todos los movimientos del día, exportable en PDF
- **Libro de caja** — registro cronológico de todos los ingresos y egresos

---

#### Estadísticas de Ventas
- Ranking de productos más vendidos (global, por categoría, por período)
- Ventas por sección: comida / bebidas / tragos / fichas de pool / delivery — cada una con su propio gráfico
- Horarios pico (qué horas generan más ventas)
- Ranking de mesas más rentables
- Ticket promedio por mesa, por hora, por día de la semana
- Evolución de ventas en el tiempo (líneas de tendencia)
- Estadísticas de delivery: zonas más activas, tiempo promedio de entrega, tasa de cancelación

---

#### Recetas y Control de ML
- **CRUD de recetas por producto** — cada trago/bebida tiene su receta con ingredientes y cantidad en ml
- Por ej: "Gin Tónico" = Gin 60ml + Tónica 150ml + Lima 10ml
- **Ingredientes/insumos** con stock en ml/gr/unidades según tipo
- **Consumo automático**: al vender un producto con receta, se descuenta el stock de cada ingrediente
- **Estadística de consumo**: cuántos ml/gr se usaron de cada ingrediente por día/semana/mes
- **Alerta de stock bajo** por ingrediente (umbral configurable)
- **Reporte de consumo** — para hacer pedidos de reposición: "necesitás X litros de gin para la semana"
- **Costo de producción** por producto (suma del costo de cada ingrediente × cantidad) → margen de ganancia

---

#### Estadísticas de Empleados
- **Perfil por empleado**: total de mesas atendidas, pedidos tomados, ventas generadas, promedio de ticket
- **Ranking de empleados** por ventas, por mesas, por período
- **Horario y asistencia**: registro de ingreso/egreso de turno (staff abre/cierra turno desde su app)
- **Anulaciones y descuentos** por empleado (auditoría)

#### Sistema de Pagos a Empleados
- **Registro de sueldo** por empleado (monto mensual o por hora, configurable)
- **Registro de adelantos**: fecha, monto, motivo, quién lo autorizó
- **Registro de pagos de sueldo**: fecha, monto pagado, período cubierto
- **Balance por empleado**: sueldo devengado - adelantos - pagos realizados = saldo pendiente
- **Historial completo** de todos los movimientos de cada empleado
- **Exportar liquidación** por empleado en PDF
- Todos los pagos/adelantos requieren confirmación del `superadmin` o `admin`

---

#### Gestión General
- CRUD de staff y roles (con restricción de escalamiento de privilegios)
- Configuración del venue (logo, nombre, horarios, colores del tema)
- Gestión de zonas de delivery (polígonos en mapa, costo de envío)
- Gestión de fidelización: ver puntos de clientes, ajustar manualmente, configurar reglas
- Historial de cierres de caja (ver cualquier cierre anterior)

---

#### Sistema
- Log de sincronizaciones (fecha, registros, errores)
- Botón de backup manual (fuerza sync inmediato)
- Notificaciones push al dueño (ventas bajas, stock bajo, muchas anulaciones, errores de sync)
- Multi-idioma: español / inglés

---

### 5.7 `local-server` — Servidor Local del Bar

- Node.js + Express
- API REST completa para todas las apps del bar
- Socket.io server (hub central de eventos en tiempo real)
- SQLite con Prisma (mismo schema que cloud)
- Sync engine: push/pull contra Supabase cada 15 min + inmediato al reconectar
- Recibe pedidos de clientes QR (cloud) via Supabase Realtime WebSocket
- Impresora térmica: endpoint ESC/POS por USB o red local
- Health check endpoint (`/health`) para verificar estado
- Script de instalación: `npm run setup` (configura .env, inicializa DB, crea admin)
- Script de arranque: `npm start` (inicia servidor + scheduler de sync)

---

## 6. Tiempo Real — Eventos Socket.io

| Canal | Emisor | Receptores | Payload |
|---|---|---|---|
| `new_order` | local-server | pos, kitchen, bar, waiter | { order } |
| `order_updated` | pos/waiter | pos, kitchen, bar, waiter, customer | { orderId, status } |
| `item_ready` | kitchen/bar | pos, waiter, customer | { itemId, tableId } |
| `item_delivered` | waiter | pos, kitchen, bar | { itemId } |
| `table_status` | pos/waiter | pos, waiter | { tableId, status } |
| `table_paid` | pos/waiter | pos, waiter, kitchen, bar | { tableSessionId } |
| `table_closed` | pos/waiter | pos, kitchen, bar, waiter | { tableId } |
| `call_waiter` | customer | waiter, pos | { tableId } |
| `call_waiter_ack` | waiter | customer | { tableId, waiterId } |
| `delivery_new` | cloud→local | pos, kitchen | { deliveryOrder } |
| `delivery_updated` | pos/waiter | customer | { deliveryId, status } |
| `mp_payment_confirmed` | local-server | pos, waiter | { paymentId, amount } |
| `sync_status` | sync-engine | pos | { status, lastSync } |
| `stock_low` | sync-engine | pos, admin | { productId, stock } |

---

## 7. Sync Engine (Local ↔ Supabase)

### Estrategia
- **Frecuencia:** Cada 15 minutos + inmediato al reconectar internet
- **Tablas bidireccionales:** orders, order_items, tables, table_sessions, payments
- **Pull only (cloud → local):** products, categories, customers, delivery_zones
- **Push only (local → cloud):** sync_log, cash_register_closes
- **Solo cloud:** staff (auth), daily_accounting (generado en cloud a medianoche)
- **Pull only:** ingredients (admin los carga desde cloud), recipes, recipe_items
- **Push only:** ingredient_stock_movements, staff_shifts, staff_advances, staff_payments

### Reglas de Conflicto por Entidad
| Entidad | Estrategia |
|---|---|
| `order_items` | **Append-only**: nunca sobreescribir filas; solo insertar nuevas. Status solo avanza (state machine). |
| `orders` | State machine: `pending→confirmed→preparing→ready→delivered\|cancelled`. El estado más avanzado gana. |
| `tables` | Last-write-wins por `updated_at` (bajo conflicto, solo layout cambia). |
| `table_sessions` | Local wins para `status` (el bar controla apertura/cierre). Cloud solo puede cerrar. |
| `payments` | Append-only: solo inserciones, nunca modificaciones. |

### Flujo
```
1. PUSH: SELECT * FROM [tabla] WHERE synced = false
2. Upsert en Supabase (batch de 100 registros) con reglas de conflicto por entidad
3. Marcar synced = true, synced_at = NOW() en SQLite
4. PULL: SELECT * FROM supabase WHERE updated_at > sync_state.last_sync_at
5. Aplicar reglas de conflicto al hacer upsert en SQLite local
6. UPDATE sync_state SET last_sync_at = NOW(), last_successful_sync_at = NOW()
7. Emitir socket "sync_status" a apps del bar
8. Escribir en sync_log
```

### Migración de Schema en Local-Server
- En cada arranque (`npm start`), el server ejecuta `prisma migrate deploy` contra SQLite local.
- Si hay migraciones pendientes: se hace backup automático de `myway.db` → `myway.db.bak` antes de migrar.
- Si local está más de 5 versiones atrás del schema cloud: startup bloqueado con mensaje de error
  instructivo. El admin debe correr `npm run migrate:reset` que hace backup + re-sync completo desde cloud.
- La versión del schema se almacena en la tabla `_prisma_migrations` (Prisma nativo).

### Modo Offline
- Todas las apps del bar operan normalmente contra SQLite
- Pedidos delivery se pausan automáticamente (banner visible)
- Al recuperar internet: sync inmediato antes de reanudar operaciones
- QR del cliente apunta a IP local si está en la misma WiFi

---

## 8. Autenticación y Seguridad

### Auth por tipo de usuario

| Usuario | Método | Proveedor |
|---|---|---|
| Cliente delivery | Google OAuth | NextAuth.js v5 |
| Cliente en mesa | Anónimo (token firmado) | Custom HMAC |
| Staff (mozo, cocina, barra) | Email + PIN 4 dígitos | Supabase Auth |
| Admin/Dueños | Email + contraseña + 2FA opcional | Supabase Auth |

### Roles y permisos

| Rol | Puede | NO puede |
|---|---|---|
| `superadmin` | Todo | — |
| `admin` | Reportes, **menú y precios**, contabilidad, empleados y pagos, layout, anulaciones, descuentos, gestión de staff inferior | Crear/modificar otros admin/superadmin |
| `cashier` | POS completo, anulaciones, descuentos, cierre de caja, toggle disponibilidad de productos | Editar precios, crear productos, ver contabilidad, ver pagos a empleados |
| `waiter` | Sus mesas, cobro MP QR, cobro efectivo, cierre de mesa, toggle disponibilidad | Anulaciones, descuentos, cualquier dato financiero |
| `kitchen` | Ver y actualizar estado de items (target=kitchen) | Todo lo demás |
| `bar` | Ver y actualizar estado de items (target=bar) | Todo lo demás |
| `customer` | Solo su propio pedido | Todo lo demás |

### Seguridad del QR
- Token: `HMAC-SHA256({ table_id, venue_id, expires_at }, venue_secret)`
- Expiración: 8 horas
- Regenerable desde POS (invalida token anterior)

### Roles y Escalamiento de Privilegios
- `admin` puede crear/editar/desactivar staff con roles inferiores al suyo (cashier, waiter, kitchen, bar).
- `admin` **NO** puede crear ni modificar otros `admin` o `superadmin`. Solo `superadmin` puede hacerlo.
- Un staff no puede auto-modificar su propio rol.

### PIN Brute Force Protection
- 5 intentos fallidos de PIN consecutivos → cuenta bloqueada por 15 minutos (`locked_until`).
- `failed_pin_attempts` se resetea a 0 en login exitoso.
- Rate limiting adicional: máx 10 intentos de login por IP por minuto.

### Auth Offline (JWT sin internet)
- El `local-server` cachea la JWKS (clave pública de Supabase) en disco al iniciar.
- Refresca la JWKS cada hora cuando hay internet.
- En modo offline: verifica JWTs contra la JWKS cacheada. Acepta tokens con hasta 48hs de antigüedad.
- Al reconectar: refresca JWKS inmediatamente.
- El PIN login genera un JWT firmado localmente (con `VENUE_QR_SECRET` como fallback secret) cuando Supabase Auth es inaccesible.

### API Security
- JWT en todas las rutas (excepto `/health` y `/qr/:token`)
- Rate limiting: 100 req/min por IP en local-server
- CORS estricto: solo dominios `*.myway.com`
- Webhook MercadoPago: validación de firma `x-signature`
- Supabase RLS activo en todas las tablas
- Variables de entorno nunca expuestas al cliente

---

## 9. Integración MercadoPago

### Delivery (pago online)
1. Cliente elige MercadoPago en checkout
2. API crea `preference` en MP → devuelve `init_point`
3. Cliente es redirigido al checkout de MP
4. MP notifica webhook en `/api/webhooks/mp`
5. API valida firma, actualiza `delivery_order.status = confirmed`
6. Supabase Realtime → local-server → socket `delivery_new` → pos + kitchen

### Cobro en mesa con QR (mozo o caja)
1. Staff toca "Cobrar con MP" → `local-server` llama a MP API: crea payment QR dinámico con monto exacto
2. MP devuelve QR (imagen base64 o URL)
3. QR aparece en pantalla del dispositivo del staff
4. Cliente escanea con su app bancaria o MP
5. MP notifica webhook HTTPS → endpoint en **Vercel** (`/api/webhooks/mp`) — MP requiere URL pública
6. Vercel valida firma `x-signature`, upserta fila en `payments` en Supabase con `mp_payment_id`
7. Supabase Realtime → local-server recibe el evento de la nueva fila
8. local-server verifica el `mp_payment_id`, emite socket `mp_payment_confirmed` a pos + waiter
9. Mesa queda lista para cerrar (saldo pendiente = 0)
10. Fallback: si Supabase Realtime no entrega el evento en 30s, local-server hace polling a MP API
    cada 5s por el estado del payment_id hasta confirmar o timeout de 5 min.

---

## 10. Editor de Salón

### Tecnología
- Canvas con **Konva.js** (React-Konva) — renderer HTML5 Canvas optimizado para drag & drop
- Estado guardado como JSON (`snapshot_json`) en `layout_snapshots`

### Funciones
- Dos zonas en pestañas: "Salón Principal" / "Afuera"
- Agregar mesa (modal: tipo bar/pool, número, asientos)
- Drag & drop libre sobre el canvas
- Resize con handles en las esquinas
- Rotación con handle superior
- Selección múltiple (shift+click)
- Unir mesas: seleccionar 2+, botón "Unir" → nueva mesa compuesta, asignar número nuevo
- Separar mesa unida → vuelven las mesas originales
- Guardar layout con nombre
- Cargar snapshot anterior desde lista
- Vista "Live" (solo lectura, actualización en tiempo real) vs "Edición"
- Exportar layout como imagen PNG

---

## 11. Flujo de Consumo de Stock por ML

Cuando un `order_item` pasa a estado `delivered`:
```
local-server detecta status = "delivered" en order_item
  → busca recipe para ese product_id
  → si tiene receta:
      → por cada recipe_item: INSERT ingredient_stock_movement (type=sale, quantity=-X)
      → UPDATE ingredients SET stock_current = stock_current - X
      → si stock_current < stock_alert_threshold:
          → emite socket "stock_low" → pos, admin
          → si is_available y stock_current <= 0: SET is_available = false automáticamente
  → si no tiene receta: no hace nada (producto sin ingredientes rastreados)
```

El `daily_accounting` se genera vía cron job en Supabase a las 23:59 de cada día,
consolidando todos los `order_items` + `payments` + `ingredient_stock_movements` del día.

---

## 12. Ficha de Pool

Las mesas tipo `pool` son mesas normales con comportamiento especial:

- En `app-bar`: el item `is_pool_chip = true` aparece como botón grande destacado: **"+ Ficha de Pool"**
- Contador de fichas acumuladas en la sesión visible en la ficha de la mesa
- En `web-customer` (vista mesa): la sección de pool chips aparece al tope del menú si la mesa es tipo pool
- El precio de la ficha es configurable desde el menú como cualquier producto
- En reportes: las fichas de pool tienen su propia línea en analytics

---

## 12. Plan de Implementación por Fases

| Fase | Contenido | Depende de | Paralelizable con | Meta |
|---|---|---|---|---|
| **0 — Fundaciones** | Monorepo, schemas, Supabase, Vercel, local-server base | — | — | Semana 1 |
| **1 — Núcleo del bar** | app-pos básico, app-kitchen, app-bar, Socket.io, sync | Fase 0 | Fase 4 (parcial) | Semana 3 |
| **2 — Cliente QR** | web-customer mesa, generador QR, pedido en tiempo real | Fase 1 | — | Semana 4 |
| **3 — Cobros** | app-waiter completo, MP QR cobro, efectivo, split, impresora | Fase 2 | — | Semana 5 |
| **4 — Delivery** | web-customer delivery, Google OAuth, MP checkout, tracking | Fase 0 | Fases 1-3 | Semana 7 |
| **5 — Editor salón** | Canvas editor, zonas, unir/separar mesas, snapshots | Fase 1 | Fase 4 | Semana 8 |
| **6 — Admin** | app-admin, analytics, inventario, reportes, gestión staff | Fase 3 | Fase 5 | Semana 9 |
| **7 — Polish** | Fidelización, happy hour, i18n, PWA completo, tests E2E | Fase 6 | — | Semana 10 |

**Nota de paralelización:** Las Fases 1-3 (stack local, red interna) y la Fase 4 (delivery cloud)
pueden desarrollarse en paralelo por dos workstreams independientes desde la Fase 0.
La Fase 4 solo necesita Supabase + Vercel, sin depender del local-server.

---

## 13. Variables de Entorno

### Apps cloud — Variables Públicas (expuestas al browser)
```env
# Prefijo NEXT_PUBLIC_ = accesible en el cliente
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=   # necesario para el botón de Google en el cliente
```

### Apps cloud — Variables de Servidor (solo API routes / server components)
```env
# SIN prefijo NEXT_PUBLIC_ = nunca en el bundle del cliente
SUPABASE_SERVICE_ROLE_KEY=      # admin total a Supabase, NUNCA al cliente
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_SECRET=           # NUNCA al cliente
MP_ACCESS_TOKEN=                # NUNCA al cliente
MP_WEBHOOK_SECRET=              # validación de firma del webhook
VENUE_QR_SECRET=                # firmado HMAC de tokens QR
```

### local-server
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=file:./myway.db
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MP_ACCESS_TOKEN=
VENUE_QR_SECRET=
SYNC_INTERVAL_MINUTES=15
PRINTER_HOST=
PRINTER_PORT=9100
ALLOWED_NETWORK=192.168.1.0/24
```

---

## 14. URLs de Producción

| App | URL |
|---|---|
| Cliente (QR + delivery) | `pedidos.myway.com` |
| POS / Caja | `pos.myway.com` |
| Cocina | `kitchen.myway.com` |
| Barra | `bar.myway.com` |
| Mozos | `waiter.myway.com` |
| Admin / Dueños | `admin.myway.com` |
| Local (red interna) | `http://192.168.x.x:3001` |

---

*Spec aprobado en sesión de brainstorming — 2026-03-21*
