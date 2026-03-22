# My Way App — Guía de instalación y configuración

Sistema de gestión operativa para bar & pool. Esta es la aplicación principal construida con Next.js 16, Prisma v7 y SQLite.

---

## Requisitos

- **Node.js** 18 o superior
- **npm** 9 o superior (o pnpm/yarn)
- No requiere base de datos externa — usa SQLite embebido

---

## Instalación local

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repo>
cd myway/apps/app
npm install
```

### 2. Variables de entorno

Crear un archivo `.env` en `apps/app/`:

```env
# URL de la base de datos SQLite
DATABASE_URL="file:./dev.db"

# Solo si se activa autenticación con next-auth
# NEXTAUTH_SECRET="una-clave-secreta-aleatoria"
# NEXTAUTH_URL="http://localhost:3000"
```

> Para producción en Vercel, estas variables se configuran en el panel de Vercel → Settings → Environment Variables.

### 3. Crear la base de datos y ejecutar migraciones

```bash
npx prisma migrate dev
```

Esto crea el archivo `dev.db` con todas las tablas.

### 4. Poblar con datos iniciales (seed)

```bash
npm run seed
```

Esto carga:
- 2 zonas (Salón Principal, Afuera)
- 12 mesas (8 en salón, 4 afuera)
- 7 categorías con íconos
- 20 productos del menú
- 6 empleados de ejemplo
- 10 ingredientes de bar con stock inicial

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Build de producción |
| `npm start` | Inicia el servidor de producción (requiere build previo) |
| `npm run lint` | Ejecuta ESLint |
| `npm run seed` | Puebla la base de datos con datos iniciales |
| `npx prisma migrate dev` | Crea/actualiza la base de datos |
| `npx prisma studio` | Interfaz visual para explorar la BD |

---

## Vistas de la aplicación

Todas las vistas son accesibles directamente por URL — no hay autenticación activa por defecto (usa PIN visual para roles).

### Panel de Administración — `/admin`

| Ruta | Vista |
|------|-------|
| `/admin` | Menú principal de administración |
| `/admin/accounting` | Contabilidad — pedidos activos para cerrar, cobrar por método de pago |
| `/admin/analytics` | Analíticas — ingresos del día, top productos, distribución por categoría |
| `/admin/employees` | Gestión de empleados — crear, editar, roles y PINs |
| `/admin/menu` | Gestión del menú — productos, categorías, disponibilidad y precios |
| `/admin/delivery` | Gestión de delivery — crear y avanzar pedidos de entrega a domicilio |

### Punto de Venta (Cajero) — `/pos`

| Ruta | Vista |
|------|-------|
| `/pos` | Login por PIN (cajero/admin) |
| `/pos/salon` | Plano interactivo de mesas con estado en tiempo real |
| `/pos/salon/:tableId` | Detalle de mesa — ver pedido activo, iniciar nuevo pedido |
| `/pos/orders` | Lista de todos los pedidos activos |

### Mozo — `/waiter`

| Ruta | Vista |
|------|-------|
| `/waiter` | Login por PIN |
| `/waiter/tables` | Lista de mesas del turno |
| `/waiter/table/:tableId` | Tomar pedido — selector de productos por categoría |
| `/waiter/ready` | Ítems listos para entregar — marcar como entregado |
| `/waiter/payment` | Confirmación de pedido |

### Cocina — `/kitchen`

| Ruta | Vista |
|------|-------|
| `/kitchen` | KDS — pedidos de comida en tiempo real, avanzar estado por ítem |
| `/kitchen/stock` | Stock de ingredientes — tabla completa con alertas y ajuste |

### Bar — `/bar`

| Ruta | Vista |
|------|-------|
| `/bar` | KDS — pedidos de bebidas y pool en tiempo real |
| `/bar/stock` | Stock de ingredientes del bar |

### Cliente — `/customer`

| Ruta | Vista |
|------|-------|
| `/customer/menu` | Menú digital — navegar por categorías y productos |
| `/customer/menu/cart` | Carrito — revisar y confirmar pedido |
| `/customer/order-status` | Estado del pedido en tiempo real |
| `/customer/delivery` | Formulario de pedido de delivery |

---

## Datos de ejemplo (seed)

### Empleados cargados

| Nombre | Rol | PIN |
|--------|-----|-----|
| Martín García | cashier | 0000 |
| Lucía Fernández | waiter | 0000 |
| Diego López | waiter | 0000 |
| Ana Torres | kitchen | 0000 |
| Carlos Ruiz | bar | 0000 |
| Valentina Paz | admin | 0000 |

> Los PINs por defecto son `0000`. Cambiarlos desde `/admin/employees` antes de usar en producción.

### Mesas

- **Zona "Salón Principal":** 8 mesas (t1–t8), mezcla de tipo `bar` y `pool`
- **Zona "Afuera":** 4 mesas (t9–t12)

### Productos

20 productos en 7 categorías: Tragos, Cervezas, Vinos, Coctelería, Comida, Pool y Sin Alcohol.

---

## Despliegue en producción

### Vercel (recomendado)

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Configurar **Root Directory** como `apps/app`
3. Agregar variables de entorno:
   - `DATABASE_URL` — ver nota abajo
4. Deploy automático en cada push a `main`

> **Importante sobre SQLite en Vercel:** Vercel usa un filesystem efímero. Para persistencia real en producción, migrar a **PostgreSQL** (por ejemplo, Vercel Postgres, Neon, o Supabase). Cambiar el `provider` en `prisma/schema.prisma` de `"sqlite"` a `"postgresql"` y actualizar `DATABASE_URL`.

### Servidor propio (VPS/Linux)

```bash
# Instalar dependencias
npm install

# Build de producción
npm run build

# Migrar BD
DATABASE_URL="file:/ruta/absoluta/prod.db" npx prisma migrate deploy

# Iniciar servidor (puerto 3000)
npm start

# O con PM2 para reinicio automático:
pm2 start npm --name "myway" -- start
pm2 save
```

Para servir en el puerto 80/443, usar **nginx** como reverse proxy hacia el puerto 3000.

---

## Estructura del código

```
src/
├── app/
│   ├── layout.tsx          # Layout raíz, fuentes, metadata
│   ├── page.tsx            # Home — hub de navegación entre vistas
│   ├── globals.css         # Tokens CSS, componentes globales, animaciones
│   ├── api/                # API Routes (Route Handlers)
│   │   ├── orders/         # GET, POST; /:id/close; /:id/items/:itemId PATCH
│   │   ├── tables/         # GET, PATCH; /:id GET, PATCH
│   │   ├── products/       # GET, POST; /:id PATCH, DELETE
│   │   ├── categories/     # GET; /:id PATCH
│   │   ├── staff/          # GET, POST; /:id PATCH, DELETE
│   │   ├── ingredients/    # GET, POST, PATCH; /:id PATCH
│   │   ├── zones/          # GET
│   │   └── delivery/       # GET, POST; /:id PATCH
│   ├── admin/              # Vistas de administración
│   ├── bar/                # KDS del bar + stock
│   ├── customer/           # Menú digital y delivery
│   ├── kitchen/            # KDS de cocina + stock
│   ├── pos/                # Punto de venta
│   └── waiter/             # Vista del mozo
└── lib/
    ├── db.ts               # Singleton del cliente Prisma
    ├── types.ts            # Tipos TypeScript compartidos
    ├── utils.ts            # Formateo de moneda, tiempo, fechas
    └── api.ts              # Helper `apiFetch` con manejo de errores
```

---

## Tecnologías utilizadas

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Next.js | 16.2.1 | Framework full-stack, App Router |
| React | 19.2 | UI |
| Prisma | 7.5 | ORM y migraciones |
| better-sqlite3 | 12 | Driver SQLite nativo |
| Tailwind CSS | 4 | Estilos utilitarios |
| Zustand | 5 | Estado global del cliente (delivery) |
| Lucide React | 0.577 | Íconos |
| TypeScript | 5 | Tipado estático |

---

## Base de datos

El schema completo está en [`prisma/schema.prisma`](prisma/schema.prisma).

Para explorar y editar la base de datos visualmente:

```bash
npx prisma studio
```

Se abre en [http://localhost:5555](http://localhost:5555).

Para resetear la base de datos a cero:

```bash
npx prisma migrate reset
npm run seed
```

> **Advertencia:** `migrate reset` borra todos los datos. Solo para desarrollo.
