# My Way — Implementation Plans Index

Cada plan es un subsistema independiente. Ejecutar en orden de dependencias.

| # | Plan | Depende de | Estado |
|---|---|---|---|
| 0 | [Foundation](2026-03-21-plan-0-foundation.md) | — | 📋 Ready |
| 1 | [Core Bar Operations](2026-03-21-plan-1-core-bar.md) | Plan 0 | 📋 Ready |
| 2 | [Customer QR Ordering](2026-03-21-plan-2-qr-ordering.md) | Plan 1 | 📋 Ready |
| 3 | [Payments & Waiter App](2026-03-21-plan-3-payments-waiter.md) | Plan 2 | 📋 Ready |
| 4 | [Delivery System](2026-03-21-plan-4-delivery.md) | Plan 0 *(paralelo con 1-3)* | 📋 Ready |
| 5 | [Salon Editor](2026-03-21-plan-5-salon-editor.md) | Plan 1 | 📋 Ready |
| 6 | [Admin Panel & Analytics](2026-03-21-plan-6-admin-analytics.md) | Plan 3 | 📋 Ready |
| 7 | [Menu, Recipes & Stock](2026-03-21-plan-7-menu-recipes-stock.md) | Plan 6 | 📋 Ready |
| 8 | [Employee Management](2026-03-21-plan-8-employee-management.md) | Plan 6 | 📋 Ready |
| 9 | [Suppliers & Procurement](2026-03-21-plan-9-suppliers-procurement.md) | Plan 7 | 📋 Ready |
| 10 | [Reservations](2026-03-21-plan-10-reservations.md) | Plan 1 | 📋 Ready |

## Spec
`docs/superpowers/specs/2026-03-21-myway-bar-pool-system-design.md`

## Execution Order

```
Plan 0 (Foundation)
├── Plan 1 (Core Bar) → Plan 2 (QR) → Plan 3 (Payments/Waiter) → Plan 6 (Admin) → Plan 7 → Plan 8 → Plan 9
├── Plan 4 (Delivery) [paralelo con 1-3, desde Plan 0]
├── Plan 5 (Salon Editor) [desde Plan 1]
└── Plan 10 (Reservations) [desde Plan 1]
```
