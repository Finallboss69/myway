# My Way — Sistema de Gestión para Bar & Pool

Sistema de punto de venta y gestión operativa diseñado para bares con mesas de pool. Cubre todo el flujo operativo: mozos tomando pedidos, cocina/bar preparando, caja cerrando mesas, y clientes viendo el menú o haciendo delivery.

---

## Vistas del sistema

| Vista | URL | Descripción |
|-------|-----|-------------|
| **POS (Cajero)** | `/pos` | Plano de mesas, estado en tiempo real, cierre desde caja |
| **Mozo** | `/waiter` | Tomar pedidos por mesa, ver listos para entregar |
| **Cocina** | `/kitchen` | KDS con pedidos de comida, cambio de estado por ítem |
| **Bar** | `/bar` | KDS con pedidos de bebidas/pool, stock de ingredientes |
| **Admin** | `/admin` | Contabilidad, analíticas, empleados, menú, delivery |
| **Cliente** | `/customer` | Menú digital, carrito, estado del pedido, delivery |

---

## Stack tecnológico

- **Framework:** Next.js 16 (App Router, React 19)
- **Base de datos:** SQLite vía Prisma v7 + `better-sqlite3`
- **Estado del cliente:** Zustand + polling nativo (`fetch` + `setInterval`)
- **Estilos:** Tailwind CSS v4 + CSS custom properties
- **Deploy:** Vercel (recomendado) o cualquier servidor Node.js

---

## Inicio rápido

```bash
cd apps/app
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

Ver [`apps/app/README.md`](apps/app/README.md) para la guía completa de instalación.

---

## Documentación

- [`apps/app/README.md`](apps/app/README.md) — Instalación, configuración, despliegue
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — Modelo de datos, flujos de negocio
- [`docs/API.md`](docs/API.md) — Referencia completa de la API REST

---

## Estructura del repositorio

```
myway/
├── apps/
│   └── app/          # Aplicación principal Next.js
│       ├── prisma/   # Schema, migraciones y seed
│       ├── src/
│       │   ├── app/  # Rutas (App Router)
│       │   │   ├── api/       # API REST
│       │   │   ├── admin/     # Panel de administración
│       │   │   ├── bar/       # Vista del bar
│       │   │   ├── customer/  # Vista del cliente
│       │   │   ├── kitchen/   # Vista de cocina
│       │   │   ├── pos/       # Punto de venta
│       │   │   └── waiter/    # Vista del mozo
│       │   └── lib/  # Utilidades, tipos, cliente DB
│       └── public/
└── docs/             # Documentación técnica
```
