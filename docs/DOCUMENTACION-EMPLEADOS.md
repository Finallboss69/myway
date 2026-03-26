# MyWay - Guia de Uso para Empleados

## Manual por Pantalla

---

## Indice

1. [Ingreso al Sistema (todas las pantallas)](#1-ingreso-al-sistema)
2. [Mozo - Mesas](#2-mozo---mesas)
3. [Mozo - Tomar Pedido](#3-mozo---tomar-pedido)
4. [Mozo - Pedidos Listos](#4-mozo---pedidos-listos)
5. [Mozo - Cobrar](#5-mozo---cobrar)
6. [Cocina - Pantalla de Pedidos](#6-cocina---pantalla-de-pedidos)
7. [Cocina - Stock](#7-cocina---stock)
8. [Barra - Pantalla de Pedidos](#8-barra---pantalla-de-pedidos)
9. [Barra - Stock](#9-barra---stock)
10. [Cajero/POS - Salon](#10-cajeroplos---salon)
11. [Cajero/POS - Pedidos](#11-cajeroplos---pedidos)
12. [Repartidor](#12-repartidor)
13. [Admin - Dashboard](#13-admin---dashboard)
14. [Admin - Menu](#14-admin---menu)
15. [Admin - Mesas](#15-admin---mesas)
16. [Admin - Empleados](#16-admin---empleados)
17. [Admin - Proveedores](#17-admin---proveedores)
18. [Admin - Gastos](#18-admin---gastos)
19. [Admin - Caja Registradora](#19-admin---caja-registradora)
20. [Admin - Contabilidad](#20-admin---contabilidad)
21. [Admin - Facturacion AFIP](#21-admin---facturacion-afip)
22. [Admin - Configuracion MercadoPago](#22-admin---configuracion-mercadopago)
23. [Admin - Configuracion AFIP](#23-admin---configuracion-afip)
24. [Admin - Delivery](#24-admin---delivery)
25. [Admin - Repartidores](#25-admin---repartidores)
26. [Admin - Analitica](#26-admin---analitica)

---

## 1. Ingreso al Sistema

**URL**: https://myway-pi.vercel.app

### Como ingresar

1. Abrir el navegador en el celular o tablet
2. Ir a la URL del sistema
3. Seleccionar tu seccion (ej: `/waiter`, `/kitchen`, `/bar`, `/pos`)
4. Aparece la pantalla de PIN
5. Ingresar tu PIN de 4 digitos
6. Si el PIN es correcto, entras a tu pantalla

### Reglas del PIN

- Tu PIN te lo da el administrador
- Es de 4 a 6 digitos
- Si lo ingresas mal 5 veces, se bloquea por 5 minutos
- La sesion dura 8 horas (un turno completo)
- Si te olvidaste el PIN, pedile al admin que lo vea en `/admin/employees`

### Instalar como App

El sistema se puede instalar como app en el celular:
1. Abrir en Chrome
2. Tocar "Agregar a pantalla de inicio"
3. Ahora se abre como una app independiente

---

## 2. Mozo - Mesas

**URL**: `/waiter/tables`
**Rol requerido**: Mozo, Admin, Manager

### Que ves en esta pantalla

Una lista de todas las mesas del local con:
- **Numero de mesa**
- **Estado**: disponible (verde), ocupada (naranja/rojo)
- **Total del pedido** (si tiene pedido abierto)
- **Tiempo** que lleva la mesa ocupada
- **Cantidad de items** del pedido

### Que podes hacer

| Accion | Como |
|--------|------|
| Ver mesa | Tocar la mesa |
| Crear pedido | Tocar una mesa disponible -> se abre la pantalla de pedido |
| Ver pedido existente | Tocar una mesa ocupada |

### Tips

- Las mesas se actualizan automaticamente cada 5 segundos
- Si la pantalla muestra un icono de WiFi tachado, hay problemas de conexion
- Las mesas con pedidos "listos" tienen una marca especial

---

## 3. Mozo - Tomar Pedido

**URL**: `/waiter/table/[tableId]`
**Rol requerido**: Mozo, Admin, Manager

### Que ves en esta pantalla

- Lista de categorias del menu (arriba)
- Productos de la categoria seleccionada
- Pedido actual de la mesa (abajo)

### Como tomar un pedido

1. Seleccionar una categoria (ej: "Tragos", "Pizzas")
2. Tocar un producto para agregarlo
3. Ajustar cantidad con los botones + y -
4. Si el cliente tiene un pedido especial, agregar una nota (ej: "sin cebolla")
5. Tocar "Enviar pedido"

### Que pasa despues

- Los items de **comida** van a la pantalla de **Cocina**
- Los items de **bebida** van a la pantalla de **Barra**
- Cada item empieza en estado "pendiente"

### Agregar items a un pedido existente

1. Tocar la mesa que ya tiene pedido
2. Agregar mas items
3. Enviar — se suman al pedido existente

---

## 4. Mozo - Pedidos Listos

**URL**: `/waiter/ready`
**Rol requerido**: Mozo, Admin, Manager

### Que ves en esta pantalla

Lista de items que **Cocina o Barra marcaron como "listos"** y estan esperando ser llevados a la mesa.

Cada item muestra:
- Nombre del producto
- Numero de mesa
- Tiempo que lleva listo

### Que hacer

1. Ver que items estan listos
2. Ir a la cocina/barra a buscarlos
3. Llevarlos a la mesa correspondiente
4. Los items pasan a estado "entregado" automaticamente o al tocar

### Tips

- Esta pantalla se actualiza sola cada 5 segundos
- Priorizar los items que llevan mas tiempo listos
- Si suena un beep, hay items nuevos listos

---

## 5. Mozo - Cobrar

**URL**: `/waiter/payment`
**Rol requerido**: Mozo, Admin, Manager

### Que ves en esta pantalla

- Seleccion de mesa a cobrar
- Total del pedido
- 4 metodos de pago: Efectivo, Tarjeta, MercadoPago, Transferencia

### Como cobrar

#### Efectivo
1. Tocar "Efectivo"
2. Confirmar el cobro
3. La mesa se cierra automaticamente

#### Tarjeta
1. Tocar "Tarjeta"
2. Pasar la tarjeta por la lectora (proceso externo)
3. Confirmar el cobro en el sistema
4. La mesa se cierra

#### MercadoPago (QR)
1. Tocar "MercadoPago"
2. Se genera un codigo QR en tu pantalla
3. Mostrarle el QR al cliente
4. El cliente lo escanea con la app de MercadoPago y paga
5. Cuando el pago se confirma, la mesa se cierra sola
6. No hace falta tocar nada mas

#### Transferencia
1. Tocar "Transferencia"
2. Se muestra el alias bancario del local
3. Tocar "Copiar" para copiar el alias
4. Compartir el alias con el cliente (por WhatsApp, mostrarlo, etc.)
5. El cliente transfiere desde su banco
6. Confirmar manualmente cuando recibis la transferencia
7. La mesa se cierra

---

## 6. Cocina - Pantalla de Pedidos

**URL**: `/kitchen`
**Rol requerido**: Cocina, Admin, Manager

### Que ves en esta pantalla

Dos columnas:
- **Pendientes**: Pedidos nuevos que hay que preparar
- **En preparacion**: Pedidos que ya estas haciendo

Cada pedido muestra:
- Numero de mesa
- Items a preparar (solo comida, no tragos)
- Notas especiales del cliente
- Tiempo transcurrido desde que se pidio

### Como usar

| Accion | Como |
|--------|------|
| Empezar a preparar | Tocar el pedido en "Pendiente" -> pasa a "En preparacion" |
| Marcar como listo | Tocar el pedido en "En preparacion" -> pasa a "Listo" |

### Que pasa cuando marcas "listo"

- El item aparece en la pantalla del mozo (`/waiter/ready`)
- El mozo sabe que tiene que venir a buscarlo

### Tips

- Suena un **beep** cuando llega un pedido nuevo
- La pantalla se actualiza cada 8 segundos
- Priorizar pedidos por tiempo (los mas viejos primero)
- Leer las notas — pueden tener alergias o preferencias

---

## 7. Cocina - Stock

**URL**: `/kitchen/stock`
**Rol requerido**: Cocina, Admin, Manager

### Que ves en esta pantalla

Lista de ingredientes con:
- Nombre del ingrediente
- Stock actual (ej: "2.5 kg")
- Umbral de alerta (ej: "1 kg")
- Estado visual con colores

### Colores de stock

| Color | Significado |
|-------|-------------|
| Verde | Stock OK, por encima del umbral |
| Amarillo | Stock bajo, cerca del umbral |
| Rojo | Stock critico, por debajo del umbral |

### Que hacer si un ingrediente esta en rojo

1. Avisar al admin/manager
2. Si no se puede reponer ahora, desactivar los productos que usan ese ingrediente

---

## 8. Barra - Pantalla de Pedidos

**URL**: `/bar`
**Rol requerido**: Bar, Admin, Manager

### Que ves en esta pantalla

Igual que la pantalla de cocina pero solo muestra items de **barra** (tragos, cervezas, bebidas).

Dos columnas:
- **Pendientes**: Tragos nuevos por preparar
- **En preparacion**: Tragos que estas haciendo

### Como usar

1. Llega un pedido nuevo (suena beep)
2. Tocar para empezar a preparar -> pasa a "En preparacion"
3. Cuando esta listo, tocar -> pasa a "Listo"
4. El mozo lo ve en su pantalla y viene a buscarlo

---

## 9. Barra - Stock

**URL**: `/bar/stock`
**Rol requerido**: Bar, Admin, Manager

Igual que el stock de cocina pero muestra ingredientes de barra: botellas de alcohol, jugos, gaseosas, hielo, etc.

- **Verde**: Hay suficiente stock
- **Amarillo**: Quedan pocas unidades
- **Rojo**: Hay que reponer urgente

---

## 10. Cajero/POS - Salon

**URL**: `/pos/salon`
**Rol requerido**: Cajero, Admin, Manager, Mozo, Cocina, Bar

### Que ves en esta pantalla

Un **plano visual** del salon con todas las mesas dibujadas. Cada mesa muestra:
- Numero
- Color segun estado (verde = libre, rojo = ocupada)
- Total del pedido (si tiene)

### Controles del plano

| Accion | Como |
|--------|------|
| Mover el plano | Arrastrar con un dedo |
| Zoom | Pinch (dos dedos) o rueda del mouse |
| Seleccionar mesa | Tocar la mesa |

### Que podes hacer al tocar una mesa

Se abre un panel lateral con:
- Detalle del pedido (items, cantidades, total)
- Boton para agregar items
- Botones de cobro: Efectivo, Tarjeta, MercadoPago, Transferencia
- Para MercadoPago: genera QR
- Para Transferencia: muestra alias con boton copiar

### Crear pedido nuevo

1. Tocar una mesa libre (verde)
2. Se abre el formulario de pedido
3. Seleccionar productos por categoria
4. Confirmar pedido

### Cobrar desde el POS

1. Tocar una mesa ocupada
2. Ver el detalle del pedido en el panel lateral
3. Elegir metodo de pago
4. Confirmar — la mesa se cierra

---

## 11. Cajero/POS - Pedidos

**URL**: `/pos/orders`
**Rol requerido**: Cajero, Admin, Manager

### Que ves en esta pantalla

Lista de todos los pedidos del dia con filtros:
- Por estado (pendiente, preparando, listo, cerrado, cancelado)
- Busqueda por mesa

Cada pedido muestra:
- Numero de mesa
- Estado actual
- Total
- Nombre del mozo
- Hora del pedido

---

## 12. Repartidor

**URL**: `/repartidor/[orderId]`
**Rol requerido**: Repartidor, Admin, Manager

### Que ves en esta pantalla

Detalle del pedido a entregar:
- Nombre del cliente
- Direccion de entrega
- Telefono
- Items del pedido
- Total
- Metodo de pago
- Notas especiales

### Como hacer una entrega

1. Te asignan un pedido desde admin
2. Abris la pantalla del pedido
3. El GPS de tu celular comparte tu ubicacion en tiempo real
4. El cliente puede verte en un mapa en vivo
5. Cuando entregas, tocas "Marcar como entregado"

### Tips

- Mantener el GPS activado durante toda la entrega
- Si el navegador pide permiso de ubicacion, aceptar
- La ubicacion se actualiza automaticamente

---

## 13. Admin - Dashboard

**URL**: `/admin`
**Rol requerido**: Admin, Manager

### Que ves en esta pantalla

Resumen general del dia:
- **Pedidos del dia**: Cantidad total
- **Facturacion**: Total cobrado
- **Costos**: Total de costos de ingredientes
- **Margen**: Diferencia entre facturacion y costos

Contadores rapidos:
- Pedidos pendientes
- Pedidos en preparacion
- Pedidos listos
- Mesas ocupadas

Accesos directos a todos los modulos de admin.

---

## 14. Admin - Menu

**URL**: `/admin/menu`
**Rol requerido**: Admin, Manager

### Que podes hacer

#### Gestionar Categorias
1. Crear categorias con nombre e icono emoji
2. Las categorias pueden tener subcategorias (jerarquia)
3. Cambiar el orden arrastrando
4. Editar o eliminar categorias

#### Gestionar Productos
1. **Crear producto**: nombre, descripcion, precio, precio de costo, categoria, destino
2. **Destino**: "cocina" (comida) o "barra" (bebidas)
3. **Disponibilidad**: activar/desactivar con un toggle
4. **Ficha de pool**: marcar si es una ficha especial
5. **Imagen**: subir foto del producto (opcional)

#### Vincular Recetas
1. Seleccionar un producto
2. Agregar ingredientes con cantidad y unidad
3. Esto permite calcular el costo automaticamente

---

## 15. Admin - Mesas

**URL**: `/admin/tables`
**Rol requerido**: Admin, Manager

### Que podes hacer

#### Editor Visual
- Arrastrar mesas para posicionarlas en el plano
- Cambiar tamano y forma (cuadrada, redonda, rectangular, pool)
- Rotar mesas
- Organizar por zonas

#### Crear Mesa
1. Tocar "Agregar mesa"
2. Ingresar numero, zona, tipo, cantidad de asientos
3. Posicionar en el plano

#### Generar QR
1. Seleccionar una mesa
2. Tocar "Generar QR"
3. Se genera un codigo QR unico para esa mesa
4. Descargar individual o en lote (ZIP con todos los QRs)
5. Imprimir y pegar en la mesa

#### Zonas
1. Crear zonas (ej: "Salon Principal", "Terraza", "VIP")
2. Asignar mesas a zonas
3. Cambiar orden y nombre de zonas

---

## 16. Admin - Empleados

**URL**: `/admin/employees`
**Rol requerido**: Admin, Manager

### Que podes hacer

#### Crear Empleado
1. Tocar "Nuevo empleado"
2. Ingresar nombre
3. Seleccionar rol (admin, manager, cajero, mozo, cocina, barra, repartidor)
4. El sistema genera un PIN automaticamente
5. Opcionalmente: elegir avatar y PIN personalizado

#### Ver PINs
- Los PINs se muestran en la lista de empleados
- Compartir el PIN con cada empleado

#### Editar/Eliminar
- Tocar un empleado para editar datos o rol
- Eliminar empleados que ya no trabajan

### Colores por Rol
| Rol | Color |
|-----|-------|
| Admin | Amarillo |
| Manager | Amarillo |
| Cajero | Amarillo |
| Mozo | Azul |
| Barra | Violeta |
| Cocina | Verde |
| Repartidor | Rosa |

---

## 17. Admin - Proveedores

**URL**: `/admin/suppliers`
**Rol requerido**: Admin, Manager

### Que podes hacer

1. **Crear proveedor**: nombre, CUIT, direccion, telefono, email, notas
2. **Categorizar**: asignar categoria (ej: "Bebidas", "Alimentos", "Limpieza")
3. **Ver facturas**: cada proveedor tiene sus facturas vinculadas
4. **Editar/Eliminar**: actualizar datos del proveedor

---

## 18. Admin - Gastos

**URL**: `/admin/expenses`
**Rol requerido**: Admin, Manager

### Que podes hacer

1. **Registrar gasto**: monto, categoria, descripcion, fecha, metodo de pago
2. **Vincular a proveedor**: asociar gasto con un proveedor
3. **Vincular a factura**: asociar gasto con una factura de proveedor
4. **Gastos recurrentes**: marcar gastos que se repiten cada mes (ej: alquiler dia 1)
5. **Filtrar**: por categoria, rango de fechas, proveedor

### Categorias de Gastos
Las categorias son jerarquicas (ej: "Servicios" > "Electricidad") y cada una puede tener un presupuesto mensual para comparar real vs. presupuestado.

---

## 19. Admin - Caja Registradora

**URL**: `/admin/cash-register`
**Rol requerido**: Admin, Manager

### Como funciona

#### Abrir Caja
1. Ir a la pantalla de caja
2. Tocar "Abrir caja"
3. Ingresar saldo inicial (lo que hay fisicamente en la caja)
4. Solo puede haber una caja abierta a la vez

#### Durante el Dia
- Cada cobro en efectivo se registra automaticamente
- Los gastos en efectivo tambien se registran
- Podes agregar movimientos manuales (ingresos/egresos)

#### Cerrar Caja
1. Contar fisicamente el dinero en caja
2. Tocar "Cerrar caja"
3. Ingresar el saldo contado
4. El sistema muestra la diferencia (cuadre)
5. Si hay diferencia, investigar posibles errores

#### Historial
- Ver todos los movimientos del dia
- Cada movimiento tiene: tipo, monto, concepto, metodo de pago

---

## 20. Admin - Contabilidad

**URL**: `/admin/accounting`
**Rol requerido**: Admin, Manager

### Que ves

- **Resumen de gastos** por categoria
- **Presupuesto vs. Real**: cuanto se presupuesto vs. cuanto se gasto
- **Desglose por metodo de pago**: cuanto entro por efectivo, tarjeta, MercadoPago, transferencia
- **Filtros por fecha**: seleccionar rango de fechas para analizar

### Como usar

1. Seleccionar rango de fechas
2. Ver los totales por categoria
3. Comparar con presupuestos mensuales
4. Identificar categorias que se exceden

---

## 21. Admin - Facturacion AFIP

**URL**: `/admin/invoices`
**Rol requerido**: Admin, Manager

### Que podes hacer

#### Crear Factura
1. Tocar "Nueva factura"
2. Seleccionar tipo (A, B, C segun regimen)
3. Ingresar datos del cliente (CUIT, nombre) si es factura A
4. Agregar items con descripcion, cantidad, precio, tasa de IVA
5. El sistema calcula IVA y total automaticamente
6. Guardar como borrador o enviar a AFIP directamente

#### Enviar a AFIP
1. Seleccionar una factura en borrador
2. Tocar "Enviar a AFIP"
3. El sistema envia los datos y recibe el CAE
4. La factura queda "emitida" con numero oficial

#### Historial
- Ver todas las facturas emitidas
- Filtrar por estado (borrador, emitida, cancelada)
- Filtrar por fecha y tipo

---

## 22. Admin - Configuracion MercadoPago

**URL**: `/admin/mercadopago`
**Rol requerido**: Admin, Manager

### Campos a configurar

| Campo | Que es | De donde se saca |
|-------|--------|-----------------|
| Access Token | Credencial de la API de MP | Panel de desarrolladores de MercadoPago |
| User ID | ID del vendedor/cobrador | Panel de MP |
| POS ID | Identificador del punto de venta | Se crea en MP para QR presencial |
| Webhook Secret | Clave para verificar notificaciones | Panel de desarrolladores de MP |
| Alias de Transferencia | Alias bancario (CVU/CBU) | Tu banco o billetera virtual |

### Como configurar

1. Entrar a la pantalla
2. Completar cada campo
3. Guardar
4. Probar generando un QR desde el POS

---

## 23. Admin - Configuracion AFIP

**URL**: `/admin/afip-config`
**Rol requerido**: Admin, Manager

### Campos a configurar

| Campo | Que es |
|-------|--------|
| CUIT | Numero de CUIT del negocio |
| Razon Social | Nombre legal del negocio |
| Regimen | Monotributo o Responsable Inscripto |
| Punto de Venta | Numero habilitado en AFIP |
| Certificado PEM | Archivo .pem del certificado digital |
| Clave PEM | Archivo .pem de la clave privada |
| Ambiente | Testing (pruebas) o Produccion (real) |

### Auto-facturacion

Se puede activar facturacion automatica por metodo de pago:
- Auto-facturar cobros con MercadoPago
- Auto-facturar cobros en efectivo
- Auto-facturar cobros con tarjeta

---

## 24. Admin - Delivery

**URL**: `/admin/delivery`
**Rol requerido**: Admin, Manager

### Que ves

- Lista de todos los pedidos delivery activos
- Estado de cada pedido
- Datos del cliente (nombre, direccion, telefono)
- Repartidor asignado

### Que podes hacer

1. Ver pedidos nuevos
2. Asignar repartidor a cada pedido
3. Cambiar estado del pedido manualmente si es necesario
4. Ver en el mapa la ubicacion de los repartidores
5. Cancelar pedidos si es necesario

---

## 25. Admin - Repartidores

**URL**: `/admin/repartidores`
**Rol requerido**: Admin, Manager

### Que ves

- Lista de todos los repartidores
- Ubicacion en tiempo real en un mapa
- Entregas activas de cada uno
- Metricas de entregas

### Que podes hacer

1. Ver donde esta cada repartidor en el mapa
2. Asignar nuevos pedidos
3. Ver historial de entregas

---

## 26. Admin - Analitica

**URL**: `/admin/analytics`
**Rol requerido**: Admin, Manager

### Que ves

- **Tendencias de facturacion**: grafico con evolucion diaria/semanal/mensual
- **Productos mas vendidos**: ranking de los items mas pedidos
- **Performance por empleado**: metricas por mozo/cajero
- **Analisis de delivery**: pedidos, tiempos, zonas

### Como usar

1. Seleccionar periodo de analisis
2. Ver los graficos y metricas
3. Usar la informacion para tomar decisiones:
   - Que productos agregar o sacar del menu
   - Que horarios reforzar con personal
   - Que zonas de delivery son mas rentables

---

## Preguntas Frecuentes

### Mi PIN no funciona
- Verificar que ingresas los digitos correctos
- Si lo ingresaste mal 5 veces, esperar 5 minutos
- Pedirle al admin que verifique tu PIN en `/admin/employees`

### No me aparecen los pedidos nuevos
- Verificar la conexion a internet
- Si aparece el icono de WiFi tachado, hay problemas de red
- Los pedidos se actualizan automaticamente cada 5-8 segundos
- Recargar la pagina manualmente si es necesario

### El QR de MercadoPago no funciona
- Verificar que MercadoPago esta configurado en `/admin/mercadopago`
- Verificar que el Access Token es valido
- Verificar que el POS ID esta correcto
- Si el cliente no puede escanear, usar otro metodo de pago

### No puedo crear pedidos delivery fuera de horario
- El sistema solo acepta delivery de Martes a Domingo, 19:00 a 03:00
- Los pedidos presenciales (en mesa) no tienen restriccion de horario

### El stock muestra rojo
- Significa que un ingrediente esta por debajo del umbral de alerta
- Avisar al admin/manager para reponerlo
- Si no se puede reponer, desactivar los productos que lo usan

### Como instalar la app en el celular
1. Abrir https://myway-pi.vercel.app en Chrome
2. Tocar el menu (tres puntos)
3. Seleccionar "Agregar a pantalla de inicio"
4. Confirmar
5. Ahora se abre como una app

---

## Tabla de Accesos Rapidos

| Rol | URL | Funcion |
|-----|-----|---------|
| Mozo | `/waiter` | Ver mesas, tomar pedidos, cobrar |
| Cocina | `/kitchen` | Ver pedidos de comida, marcar listos |
| Barra | `/bar` | Ver pedidos de tragos, marcar listos |
| Cajero | `/pos/salon` | Plano de mesas, cobrar, gestionar pedidos |
| Repartidor | `/delivery` | Ver pedidos de delivery asignados |
| Admin | `/admin` | Gestion completa del local |
| Cliente | `/customer/menu` | Ver menu y pedir delivery |
