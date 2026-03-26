# MyWay - Sistema de Gestion de Bar & Pool

## Documentacion Completa para el Cliente

---

## 1. Descripcion General

**MyWay** es un sistema integral de gestion para bar y pool que abarca:

- Punto de venta (POS) con plano visual de mesas
- Gestion de pedidos en tiempo real (cocina, barra, mozos)
- Delivery con seguimiento GPS en vivo
- Menu digital para clientes con carrito y checkout
- Facturacion electronica AFIP
- Inventario y control de costos
- Reportes y analitica financiera
- Integracion con MercadoPago (QR y transferencias)
- Gestion de empleados con PIN de acceso
- Caja registradora con apertura/cierre diario

**Stack tecnologico**: Next.js 15, React, TypeScript, PostgreSQL (Supabase), Prisma ORM, Tailwind CSS, MercadoPago API, AFIP Web Services.

**Hosting**: Vercel (produccion)

**URL de produccion**: https://myway-pi.vercel.app

---

## 2. Roles de Usuario

El sistema maneja 7 roles de empleado + 1 rol de cliente:

| Rol | Icono | Acceso | Descripcion |
|-----|-------|--------|-------------|
| **Admin** | Amarillo | Todo el sistema | Control total: configuracion, empleados, reportes, facturacion |
| **Manager** | Amarillo | Admin + Operaciones | Gestion del local: reportes, empleados, finanzas |
| **Cajero (Cashier)** | Amarillo | POS | Cobra pedidos, gestiona caja, cierra mesas |
| **Mozo (Waiter)** | Azul | Waiter | Toma pedidos, lleva a mesas, cobra |
| **Barra (Bar)** | Violeta | Bar | Prepara tragos, controla stock de bebidas |
| **Cocina (Kitchen)** | Verde | Kitchen | Prepara comida, controla stock de ingredientes |
| **Repartidor** | Rosa | Delivery | Entrega pedidos, comparte ubicacion GPS |
| **Cliente (Customer)** | - | Menu + Delivery | Navega menu, hace pedidos delivery, rastrea envios |

### Sistema de autenticacion

- **Empleados**: PIN de 4-6 digitos (ingreso rapido sin teclado completo)
- **Clientes**: Google OAuth (inicio de sesion con cuenta de Google)
- **Seguridad**: Bloqueo automatico tras 5 intentos fallidos (5 minutos)
- **Sesion**: Dura 8 horas (un turno completo)

---

## 3. Modulos del Sistema

### 3.1 Punto de Venta (POS) - `/pos/salon`

**Quien lo usa**: Cajero, Admin, Manager

El POS es el centro de operaciones del local. Muestra un plano visual interactivo con todas las mesas.

**Funcionalidades**:
- Plano visual de mesas con zoom, arrastre y colores de estado
- Crear pedidos tocando una mesa
- Agregar productos al pedido por categoria
- Ver total de cada mesa en tiempo real
- Cobrar pedidos (efectivo, tarjeta, MercadoPago QR, transferencia)
- Cerrar mesas automaticamente al cobrar
- Actualizacion automatica cada 5 segundos

**Estados de mesa**:
| Estado | Color | Significado |
|--------|-------|-------------|
| Disponible | Verde | Mesa libre, sin pedidos |
| Ocupada | Rojo/Naranja | Mesa con pedido abierto |
| Reservada | Azul | Mesa reservada manualmente |

**Metodos de pago**:
| Metodo | Descripcion |
|--------|-------------|
| Efectivo | Registro manual, se suma a la caja |
| Tarjeta | Registro manual (lectora externa) |
| MercadoPago | Genera QR que el cliente escanea con su celular |
| Transferencia | Muestra el alias bancario para que el cliente transfiera |

**Flujo de cobro con MercadoPago QR**:
1. Tocar "MercadoPago" en la mesa
2. El sistema genera un QR unico para esa mesa
3. El cliente escanea con la app de MercadoPago
4. Cuando paga, el webhook confirma automaticamente
5. La mesa se libera sola

**Flujo de cobro con Transferencia**:
1. Tocar "Transferencia" en la mesa
2. Se muestra el alias bancario configurado
3. Boton de "Copiar" para compartir el alias
4. El mozo/cajero confirma el cobro manualmente

---

### 3.2 Modulo Mozo (Waiter) - `/waiter`

**Quien lo usa**: Mozo, Admin, Manager

Interfaz optimizada para celular que usan los mozos en el salon.

**Pantallas**:

#### Mesas (`/waiter/tables`)
- Lista de todas las mesas con estado y total
- Toque para ver detalle del pedido
- Indicador de tiempo transcurrido

#### Tomar Pedido (`/waiter/table/[tableId]`)
- Seleccionar productos del menu por categoria
- Agregar notas especiales (ej: "sin cebolla")
- Modificar cantidades
- Enviar pedido a cocina/barra

#### Pedidos Listos (`/waiter/ready`)
- Muestra items marcados como "listos" por cocina/barra
- El mozo sabe que llevar a cada mesa
- Polling automatico cada 5 segundos

#### Cobrar (`/waiter/payment`)
- Seleccionar metodo de pago (efectivo, tarjeta, MercadoPago, transferencia)
- Para MercadoPago: genera QR en pantalla
- Para transferencia: muestra alias con boton copiar
- Cierra la mesa al confirmar

---

### 3.3 Cocina (Kitchen Display) - `/kitchen`

**Quien lo usa**: Cocina, Admin, Manager

Pantalla tipo KDS (Kitchen Display System) que muestra los pedidos pendientes.

**Funcionalidades**:
- Muestra solo items con destino "kitchen" (comida)
- Columnas: Pendiente y En Preparacion
- Toque para cambiar estado: pendiente -> preparando -> listo
- Notificacion sonora (beep) cuando llega un nuevo pedido
- Actualizacion automatica cada 8 segundos
- Tiempo transcurrido visible en cada pedido

#### Stock de Cocina (`/kitchen/stock`)
- Niveles de ingredientes actuales
- Alertas cuando el stock baja del umbral
- Colores: verde (OK), amarillo (bajo), rojo (critico)

---

### 3.4 Barra (Bar Display) - `/bar`

**Quien lo usa**: Bar, Admin, Manager

Identico al KDS de cocina pero filtra solo items con destino "bar" (tragos, bebidas).

**Funcionalidades**:
- Muestra solo items con destino "bar"
- Mismos estados: pendiente -> preparando -> listo
- Beep sonoro en pedidos nuevos
- Polling cada 8 segundos

#### Stock de Barra (`/bar/stock`)
- Niveles de ingredientes de barra (bebidas, hielo, etc.)
- Alertas de stock bajo

---

### 3.5 Delivery - `/delivery`

**Quien lo usa**: Repartidor, Admin, Manager

#### Menu del Cliente (`/customer/menu`)
- Menu publico navegable sin login
- Busqueda por nombre
- Categorias con iconos
- Detalle de producto con descripcion

#### Carrito (`/customer/menu/cart`)
- Revisar items seleccionados
- Formulario: nombre, direccion, telefono
- Seleccion de metodo de pago: efectivo, transferencia, MercadoPago
- Campo de notas
- Validacion de horario de atencion (Martes a Domingo, 19:00 a 03:00)

#### Estado del Pedido (`/customer/order-status`)
- Seguimiento en tiempo real del pedido
- Estados: pendiente -> preparando -> listo -> en camino -> entregado

#### Seguimiento GPS (`/track/[orderId]`)
- Mapa en vivo con la ubicacion del repartidor
- Actualizacion GPS en tiempo real
- Accesible desde link compartible

#### Panel del Repartidor (`/repartidor/[orderId]`)
- Ver detalle del pedido a entregar
- Compartir ubicacion GPS automaticamente
- Marcar como entregado

#### Panel Admin Delivery (`/admin/delivery`)
- Todos los pedidos de delivery activos
- Asignar repartidor
- Mapa de flota con ubicaciones

---

### 3.6 Administracion - `/admin`

**Quien lo usa**: Admin, Manager

#### Dashboard (`/admin`)
- KPIs principales: pedidos del dia, facturacion, costos, margen
- Conteo de pedidos por estado
- Accesos rapidos a cada modulo

#### Menu (`/admin/menu`)
- CRUD completo de productos
- Categorias jerarquicas con iconos emoji
- Precio de venta y precio de costo
- Destino: cocina o barra
- Toggle de disponibilidad (activar/desactivar productos)
- Vincular recetas (ingredientes que componen cada producto)
- Imagen del producto (opcional)
- Flag de "ficha de pool" para fichas especiales

#### Mesas (`/admin/tables`)
- Editor visual drag & drop del plano
- Crear/editar/eliminar mesas
- Configurar: numero, zona, tipo (bar/pool), forma, rotacion, asientos
- Posicionamiento visual: X, Y, ancho, alto
- Generar codigos QR por mesa
- Descargar QRs individuales o en lote (ZIP)
- Gestionar zonas (ej: "Salon Principal", "Afuera")

#### Empleados (`/admin/employees`)
- Crear/editar/eliminar empleados
- Asignar rol (admin, manager, cajero, mozo, cocina, barra, repartidor)
- PIN automatico o personalizado
- Seleccion de avatar
- Colores por rol para identificacion rapida

#### Proveedores (`/admin/suppliers`)
- CRUD de proveedores con datos de contacto
- CUIT, direccion, telefono, email, notas
- Categorias de proveedores
- Vincular facturas a proveedores

#### Facturas de Proveedores (`/admin/invoices` - supplier invoices)
- Registrar facturas de compra
- Campos: numero, fecha, vencimiento, subtotal, IVA, IIBB, otros impuestos
- Foto de factura (URL)
- Estado: pendiente o pagada
- Metodo de pago al liquidar

#### Gastos (`/admin/expenses`)
- Registrar gastos generales
- Categorias jerarquicas con presupuesto mensual
- Vincular a proveedor y factura
- Gastos recurrentes (dia del mes)
- Filtrar por rango de fechas

#### Caja Registradora (`/admin/cash-register`)
- Apertura con saldo inicial
- Registro de movimientos (ventas, gastos, ajustes)
- Cierre con saldo final para cuadre
- Historial de movimientos del dia
- Solo una caja abierta a la vez

#### Contabilidad (`/admin/accounting`)
- Resumen de gastos por categoria
- Presupuesto vs. real
- Desglose por metodo de pago (efectivo, tarjeta, MercadoPago, transferencia)
- Filtros por rango de fechas

#### Facturacion AFIP (`/admin/invoices`)
- Crear facturas electronicas
- Tipos: A, B, C segun regimen
- Enviar a AFIP para obtener CAE
- Historial con filtros por estado y fecha
- Items con calculo de IVA (21%, 10.5%)

#### Configuracion AFIP (`/admin/afip-config`)
- CUIT y razon social
- Regimen fiscal (monotributo / responsable inscripto)
- Punto de venta
- Certificados PEM (cert + key)
- Ambiente: testing o produccion
- Auto-facturacion por metodo de pago

#### Configuracion MercadoPago (`/admin/mercadopago`)
- Access token
- User ID del collector
- POS ID (punto de venta)
- Webhook secret (HMAC-SHA256)
- Alias de transferencia bancaria

#### Repartidores (`/admin/repartidores`)
- Lista de repartidores activos
- Mapa de flota en tiempo real
- Metricas de entregas

#### Analitica (`/admin/analytics`)
- Tendencias de facturacion
- Performance de productos (mas vendidos)
- Metricas por empleado
- Analisis de delivery

---

## 4. Flujos de Usuario Principales

### Flujo 1: Atencion en Mesa (presencial)

```
Cliente llega -> Mozo asigna mesa -> Mozo toma pedido en celular
   -> Pedido aparece en Cocina/Barra -> Se prepara
   -> Cocina/Barra marca "listo" -> Aparece en pantalla del Mozo
   -> Mozo lleva a mesa -> Cliente consume
   -> Mozo/Cajero cobra (efectivo/tarjeta/QR/transferencia)
   -> Mesa se libera automaticamente
```

**Detalle paso a paso**:

1. El mozo entra a `/waiter/tables` y selecciona la mesa
2. En `/waiter/table/[id]` selecciona productos del menu
3. Agrega notas si es necesario y envia el pedido
4. Los items de comida aparecen en `/kitchen` (cocina)
5. Los items de bebida aparecen en `/bar` (barra)
6. Cocina/Barra tocan para cambiar a "preparando" y luego "listo"
7. En `/waiter/ready` el mozo ve que items estan listos
8. El mozo lleva los items a la mesa
9. Para cobrar, va a `/waiter/payment` y selecciona metodo de pago
10. Si es MercadoPago, se genera un QR que el cliente escanea
11. Al confirmar el pago, el pedido se cierra y la mesa queda disponible

### Flujo 2: Pedido Delivery (online)

```
Cliente entra al menu -> Agrega al carrito -> Completa datos
   -> Confirma pedido -> Cocina/Barra prepara
   -> Admin asigna repartidor -> Repartidor sale con el pedido
   -> Cliente rastrea en tiempo real -> Repartidor entrega
```

**Detalle paso a paso**:

1. El cliente navega `/customer/menu` (no necesita cuenta)
2. Agrega productos al carrito
3. En `/customer/menu/cart` completa: nombre, direccion, telefono
4. Selecciona metodo de pago y confirma
5. El sistema valida horario de atencion (Mar-Dom 19:00-03:00)
6. El pedido aparece en cocina/barra segun los items
7. El admin en `/admin/delivery` asigna un repartidor
8. El repartidor ve el pedido en `/repartidor/[orderId]`
9. Al salir, comparte su ubicacion GPS
10. El cliente sigue la entrega en `/track/[orderId]` con mapa en vivo
11. El repartidor marca "entregado" al finalizar

### Flujo 3: Cobro con MercadoPago QR

```
Mozo/Cajero toca "MercadoPago" -> Sistema genera QR unico
   -> Cliente escanea con app MP -> Paga desde su celular
   -> Webhook confirma pago -> Mesa se cierra automaticamente
```

1. El mozo o cajero selecciona "MercadoPago" como metodo de pago
2. El sistema llama a la API de MP y genera un QR con el monto exacto
3. Se muestra el QR en pantalla (celular del mozo o pantalla POS)
4. El cliente escanea con la app de MercadoPago
5. Realiza el pago desde su celular
6. MercadoPago envia un webhook al sistema
7. El sistema verifica la firma HMAC-SHA256
8. Marca el pago como "paid" automaticamente
9. Cierra el pedido y libera la mesa

### Flujo 4: Apertura y Cierre de Caja

```
Admin/Manager abre caja -> Se registran movimientos del dia
   -> Al final del turno: cierre con arqueo -> Cuadre
```

1. Al inicio del turno, ir a `/admin/cash-register`
2. Abrir caja con saldo inicial (ej: $10.000)
3. Durante el dia, cada cobro en efectivo genera un movimiento
4. Los gastos en efectivo tambien se registran
5. Al cerrar, se ingresa el saldo contado fisicamente
6. El sistema muestra la diferencia para cuadre

### Flujo 5: Gestion de Stock

```
Proveedor entrega mercaderia -> Se registra factura
   -> Se actualizan stocks -> Alertas si baja del umbral
```

1. Registrar proveedor en `/admin/suppliers`
2. Cargar factura en el sistema con items y montos
3. Actualizar stock de ingredientes en `/admin/menu` (seccion ingredientes)
4. Cocina y barra ven niveles en `/kitchen/stock` y `/bar/stock`
5. Alertas automaticas cuando el stock baja del umbral configurado

### Flujo 6: Facturacion AFIP

```
Configurar AFIP -> Crear factura con items -> Enviar a AFIP
   -> Recibir CAE -> Factura valida
```

1. Configurar datos fiscales en `/admin/afip-config`
2. Cargar certificados PEM
3. Crear factura en `/admin/invoices` con items y montos
4. Seleccionar tipo de comprobante (A, B, C)
5. Enviar a AFIP
6. Recibir numero de CAE (Codigo de Autorizacion Electronico)
7. La factura queda emitida y registrada

---

## 5. Configuracion Inicial

### Paso 1: Configurar Empleados
1. Ir a `/admin/employees`
2. Crear al menos: 1 admin, 1 cajero, 1 mozo, 1 cocinero, 1 barman
3. Anotar los PINs generados (se muestran una vez)

### Paso 2: Configurar Mesas y Zonas
1. Ir a `/admin/tables`
2. Crear zonas (ej: "Salon Principal", "Terraza")
3. Agregar mesas con numero, tipo y posicion visual
4. Generar QRs para las mesas (opcional, para pedidos directos)

### Paso 3: Cargar Menu
1. Ir a `/admin/menu`
2. Crear categorias (ej: "Tragos", "Comidas", "Cervezas")
3. Agregar productos con precio, destino (cocina/barra), y descripcion
4. Configurar disponibilidad

### Paso 4: Configurar MercadoPago (opcional)
1. Ir a `/admin/mercadopago`
2. Ingresar Access Token de MP
3. Ingresar User ID y POS ID
4. Configurar Webhook Secret
5. Ingresar alias de transferencia bancaria

### Paso 5: Configurar AFIP (opcional)
1. Ir a `/admin/afip-config`
2. Ingresar CUIT y razon social
3. Seleccionar regimen fiscal
4. Cargar certificados
5. Elegir ambiente (testing primero, produccion despues)

### Paso 6: Cargar Ingredientes y Recetas (opcional)
1. Crear ingredientes con stock actual y umbral de alerta
2. Vincular ingredientes a productos (recetas)
3. Esto habilita el calculo automatico de costos

### Paso 7: Cargar Proveedores (opcional)
1. Registrar proveedores con datos de contacto
2. Vincular ingredientes a sus proveedores
3. Registrar facturas de compra

---

## 6. Horario de Operacion

- **Dias**: Martes a Domingo
- **Horario**: 19:00 a 03:00 (del dia siguiente)
- **Cerrado**: Lunes
- **Zona horaria**: America/Buenos_Aires

El sistema valida automaticamente el horario para pedidos delivery. Los pedidos presenciales no tienen restriccion de horario.

---

## 7. Integraciones

### MercadoPago
- **QR de punto de venta**: Genera codigos QR para cobrar en mesa
- **Webhook IPN**: Recibe notificaciones automaticas de pago
- **Seguridad**: Verificacion HMAC-SHA256 de webhooks

### AFIP
- **Facturacion electronica**: Emision de comprobantes con CAE
- **Regimenes**: Monotributo y Responsable Inscripto
- **Ambientes**: Testing y Produccion

### Google OAuth
- **Login de clientes**: Inicio de sesion con cuenta de Google
- **Uso**: Para pedidos delivery y seguimiento de ordenes

---

## 8. Datos Actuales del Sistema

| Dato | Cantidad |
|------|----------|
| Productos | 110 |
| Mesas | 12 |
| Zonas | 2 (Salon Principal, Afuera) |
| Empleados | 6 |
| Ingredientes | 21 |
| Categorias | 16 |

---

## 9. Soporte Tecnico

### Acceso al Sistema
- **URL**: https://myway-pi.vercel.app
- **Base de datos**: PostgreSQL en Supabase
- **Hosting**: Vercel
- **Repositorio**: GitHub (privado)

### Variables de Entorno Requeridas
- `DATABASE_URL` - Conexion a PostgreSQL
- `NEXTAUTH_SECRET` - Secreto de sesion
- `NEXTAUTH_URL` - URL base de la app
- `GOOGLE_CLIENT_ID` - OAuth de Google
- `GOOGLE_CLIENT_SECRET` - OAuth de Google
- `SKIP_HOURS_CHECK` - Bypass de horario (solo desarrollo)

### Mantenimiento
- Las actualizaciones se despliegan automaticamente via push a `master`
- La base de datos se gestiona con Prisma (migraciones)
- Los backups de la DB son responsabilidad de Supabase
