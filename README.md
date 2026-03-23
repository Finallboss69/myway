# My Way Olivos — Sistema Integral de Gestion para Bar & Pool

Sistema completo de gestion operativa, administrativa y contable para bares con mesas de pool. Cubre el ciclo operativo end-to-end: mozos tomando pedidos con notas, cocina y bar preparando con KDS en tiempo real, caja cerrando mesas, delivery con seguimiento GPS, facturacion electronica AFIP, y administracion contable completa.

---

## Stack tecnologico

| Tecnologia | Version | Uso |
|-----------|---------|-----|
| Next.js | 16.2.1 | Framework full-stack, App Router, React 19 |
| TypeScript | 5 | Tipado estatico en todo el proyecto |
| Prisma | 7.5 | ORM, migraciones, schema declarativo |
| PostgreSQL | - | Base de datos en produccion (Supabase) |
| NextAuth v5 | 5.0 beta | Autenticacion Google OAuth para delivery |
| SWR | 2.4 | Data fetching con revalidacion |
| Zustand | 5 | Estado global del cliente (carrito delivery) |
| Tailwind CSS | 4 | Estilos utilitarios + design tokens custom |
| Leaflet | 1.9 | Mapas interactivos (seguimiento GPS repartidores) |
| Lucide React | 0.577 | Iconos SVG |

---

## Modulos del sistema

### Operaciones (dia a dia)

| Modulo | URL | Descripcion |
|--------|-----|-------------|
| **Landing Page** | `/` | Pagina publica con menu, video intro, acceso a delivery |
| **POS (Cajero)** | `/pos` | Login por PIN, plano de mesas interactivo, cierre de mesas |
| **Mozo** | `/waiter` | Tomar pedidos por mesa con notas, ver items listos, cancelar items |
| **Cocina (KDS)** | `/kitchen` | Kitchen Display System con alertas sonoras, wake lock, ordenamiento por urgencia |
| **Bar (KDS)** | `/bar` | Bar Display System, mismas funciones que cocina para bebidas/pool |
| **Login** | `/login` | Login con Google OAuth para clientes de delivery |

### Delivery

| Modulo | URL | Descripcion |
|--------|-----|-------------|
| **Delivery (cliente)** | `/delivery` | Catalogo con carrito, checkout con Google Auth |
| **Seguimiento** | `/track/[orderId]` | Mapa en tiempo real con ubicacion del repartidor |
| **App repartidor** | `/repartidor/[orderId]` | Vista del repartidor con GPS activo y estado del pedido |
| **Menu digital** | `/customer/menu` | Menu publico navegable por categorias |
| **Estado pedido** | `/customer/order-status` | Seguimiento del pedido del cliente |

### Administracion

| Pagina | URL | Seccion |
|--------|-----|---------|
| **Dashboard** | `/admin` | GESTION |
| **Contabilidad** | `/admin/accounting` | GESTION |
| **Delivery** | `/admin/delivery` | GESTION |
| **Menu** | `/admin/menu` | GESTION |
| **Mesas & QR** | `/admin/tables` | GESTION |
| **Empleados** | `/admin/employees` | GESTION |
| **Proveedores** | `/admin/suppliers` | ADMINISTRACION |
| **Facturacion AFIP** | `/admin/invoices` | ADMINISTRACION |
| **Gastos** | `/admin/expenses` | ADMINISTRACION |
| **Caja** | `/admin/cash-register` | ADMINISTRACION |
| **Config AFIP** | `/admin/afip-config` | ADMINISTRACION |
| **Analiticas** | `/admin/analytics` | REPORTES |
| **Mapa GPS** | `/admin/repartidores` | REPORTES |

---

## Inicio rapido

### 1. Clonar e instalar

```bash
git clone <url-del-repo>
cd myway/apps/app
npm install
```

### 2. Variables de entorno

Crear `.env` en `apps/app/`:

```env
# Base de datos (Supabase PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Google OAuth (para delivery con login)
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"

# NextAuth
AUTH_SECRET="openssl rand -base64 32"

# Opcional: deshabilitar restriccion horaria del menu
SKIP_HOURS_CHECK="true"
```

### 3. Base de datos

```bash
npx prisma generate
npx prisma db push    # o npx prisma migrate dev
npm run seed          # datos iniciales
```

### 4. Servidor de desarrollo

```bash
npm run dev
```

La aplicacion estara en [http://localhost:3000](http://localhost:3000).

---

## Comandos disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Build de produccion |
| `npm start` | Servidor de produccion (requiere build previo) |
| `npm run lint` | ESLint |
| `npm run seed` | Poblar BD con datos iniciales |
| `npx prisma generate` | Generar cliente Prisma |
| `npx prisma db push` | Sincronizar schema con la BD |
| `npx prisma studio` | UI visual para explorar la BD |

---

## Estructura del repositorio

```
myway/
├── README.md                          # Este archivo
├── GOOGLE_AUTH_SETUP.md               # Guia de configuracion Google OAuth
├── apps/
│   └── app/                           # Aplicacion principal Next.js
│       ├── prisma/
│       │   ├── schema.prisma          # Schema completo (29 modelos)
│       │   └── seed.ts                # Datos iniciales
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx           # Landing page con menu y video
│       │   │   ├── layout.tsx         # Layout raiz, fuentes, metadata
│       │   │   ├── globals.css        # Design tokens, componentes CSS
│       │   │   ├── api/               # 45 route handlers (REST API)
│       │   │   ├── admin/             # 13 paginas de administracion
│       │   │   ├── bar/               # KDS del bar + stock
│       │   │   ├── customer/          # Menu digital, carrito, delivery
│       │   │   ├── delivery/          # Landing de delivery con carrito
│       │   │   ├── kitchen/           # KDS de cocina + stock
│       │   │   ├── login/             # Login con Google OAuth
│       │   │   ├── pos/               # Punto de venta (cajero)
│       │   │   ├── repartidor/        # App del repartidor (GPS)
│       │   │   ├── track/             # Seguimiento de delivery (cliente)
│       │   │   └── waiter/            # App del mozo
│       │   └── lib/
│       │       ├── afip/index.ts      # Modulo AFIP WSFE (facturacion)
│       │       ├── api.ts             # Helper apiFetch con manejo de errores
│       │       ├── auth.ts            # Configuracion NextAuth v5
│       │       ├── db.ts              # Singleton del cliente Prisma
│       │       ├── print.ts           # Utilidades de impresion
│       │       ├── types.ts           # Tipos TypeScript compartidos
│       │       └── utils.ts           # Formateo de moneda, tiempo, fechas
│       └── public/                    # Assets estaticos
└── docs/
    ├── API.md                         # Referencia de la API REST
    └── ARQUITECTURA.md                # Modelo de datos y flujos
```

---

## Deploy en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Configurar **Root Directory** como `apps/app`
3. Build command: `prisma generate && next build` (o usar el script `vercel-build`)
4. Agregar variables de entorno:
   - `DATABASE_URL` (Supabase PostgreSQL)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `AUTH_SECRET`
5. Deploy automatico en cada push a `main`

La base de datos de produccion es **Supabase PostgreSQL**. No se usa SQLite en produccion.

---

## Seguridad

- **Proxy de autenticacion** (`src/proxy.ts`): protege rutas admin (rol "admin"), APIs semi-protegidas (sesion requerida), endpoints publicos solo lectura
- **Field whitelisting**: 12 endpoints PATCH/PUT filtran campos permitidos (anti mass-assignment)
- **PIN de staff**: nunca expuesto via GET, verificado server-side via `/api/staff/verify-pin`
- **Precios server-side**: delivery recalcula precios desde la BD, no confia en el cliente
- **Validacion de horarios**: delivery solo acepta pedidos Mar-Dom 19:00-03:00 (bypass con `SKIP_HOURS_CHECK=true`)
- **Invoice transaction**: numeros de factura generados dentro de `$transaction` para evitar duplicados
- **Error handling**: try/catch en todas las rutas API con respuestas consistentes

---

## Modelo de datos (29 modelos Prisma)

| Grupo | Modelos |
|-------|---------|
| Auth | User, Account, Session, VerificationToken |
| Restaurant | Zone, Table, Category, Product, Staff |
| Orders | Order, OrderItem |
| Delivery | DeliveryOrder, DeliveryOrderItem |
| Inventory | IngredientCategory, Ingredient, RecipeIngredient, PriceHistory |
| Suppliers | SupplierCategory, Supplier, SupplierInvoice, SupplierInvoiceItem |
| AFIP | AfipConfig, Invoice, InvoiceItem |
| Expenses | ExpenseCategory, Expense |
| Cash | CashRegister, CashMovement |
| Reports | DailyReport |

22 indexes de performance en 11 modelos. Schema completo en `apps/app/prisma/schema.prisma`.

---

## Documentacion adicional

- [`docs/MANUAL_USUARIO.md`](docs/MANUAL_USUARIO.md) — Guia completa de uso por rol (admin, cajero, mozo, cocina, bar, repartidor, cliente)
- [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) — Referencia completa de la API REST (45+ endpoints)
- [`GOOGLE_AUTH_SETUP.md`](GOOGLE_AUTH_SETUP.md) — Configuracion paso a paso de Google OAuth
