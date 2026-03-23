# Manual de Usuario — My Way Olivos

Sistema integral de gestion para bar & pool. Esta guia cubre todas las funciones del sistema organizadas por rol.

---

## 1. Introduccion

### Que es My Way

My Way es un sistema completo para gestionar un bar con mesas de pool. Cubre desde la toma de pedidos hasta la facturacion, delivery con seguimiento GPS, control de stock, costos de recetas y reportes diarios.

### Como acceder

- **URL de produccion**: https://myway-pi.vercel.app
- **Dispositivos recomendados**:
  - Admin: PC o tablet (pantalla grande)
  - Cajero (POS): PC o tablet
  - Mozo: celular o tablet
  - Cocina/Bar: tablet (pantalla fija)
  - Repartidor: celular
  - Cliente: celular

### Roles del sistema

| Rol | Acceso | Descripcion |
|-----|--------|-------------|
| Admin | `/admin` | Control total: menu, proveedores, gastos, empleados, analiticas |
| Cajero | `/pos` | Cobrar mesas, ver pedidos, cerrar turnos |
| Mozo | `/waiter` | Tomar pedidos, ver items listos, entregar |
| Cocina | `/kitchen` | Pantalla de pedidos de cocina con alertas |
| Bar | `/bar` | Pantalla de pedidos de bar/pool con alertas |
| Repartidor | `/repartidor` | Ver pedido asignado, compartir GPS |
| Cliente | `/delivery` | Pedir delivery con cuenta Google |

---

## 2. Guia del Administrador (/admin)

### 2.1 Dashboard

**URL**: `/admin`

La pantalla principal muestra:
- **KPIs en vivo**: pedidos activos, mesas ocupadas, alertas de stock bajo, ingresos
- **Pedidos activos**: lista de pedidos en curso con estado y tiempo transcurrido
- **Mesas**: estado visual de todas las mesas
- **Alertas de stock**: ingredientes por debajo del umbral

**Colores de estado**:
- Amarillo: pendiente
- Azul: preparando
- Verde: listo
- Gris: entregado
- Rojo: cancelado

**Acciones rapidas** (al pie): links directos a Analiticas, Caja, Gastos, Facturacion.

---

### 2.2 Menu (Productos)

**URL**: `/admin/menu`

3 pestanas:

#### Pestana PRODUCTOS
- **Ver productos**: lista con nombre, categoria, precio, margen, disponibilidad
- **Agregar producto**: boton "+" abre modal con campos: nombre, precio, categoria, destino (bar/cocina), descripcion, imagen, disponibilidad
- **Editar**: click en el icono de edicion de cada producto
- **Cambiar disponibilidad**: toggle directo en cada producto (sin abrir modal)
- **Buscar**: barra de busqueda por nombre
- **Filtrar**: dropdown de categorias
- **Operaciones masivas**: botones "Todos disp." / "Todos no disp."

#### Pestana RECETAS
Aca se define la composicion de cada producto (cuantos ml de cada bebida, gramos de cada ingrediente).

1. Seleccionar un producto del dropdown
2. Ver la receta actual: lista de ingredientes con cantidad y unidad
3. Agregar ingrediente: elegir ingrediente, cantidad, unidad (ml/gr/kg/lt/unidad)
4. El costo se calcula automaticamente

**Ejemplo: cargar la receta de un Fernet con Coca**
1. Seleccionar "Fernet con Coca" en el dropdown
2. Agregar: Fernet Branca, 60 ml
3. Agregar: Coca Cola, 200 ml
4. Agregar: Hielo, 100 gr
5. El sistema calcula: Costo = (60ml x $costo_fernet) + (200ml x $costo_coca) + (100gr x $costo_hielo)
6. Muestra: Precio Venta, Costo, Ganancia, Margen %

#### Pestana ANALISIS COSTOS
- Tabla de todos los productos con: precio venta, costo, ganancia, margen %
- **Colores de margen**: rojo (<30%), amarillo (30-50%), verde (>50%)
- Productos sin receta resaltados en rojo ("SIN RECETA")
- Resumen: margen promedio, productos con/sin receta

---

### 2.3 Proveedores

**URL**: `/admin/suppliers`

4 pestanas:

#### Pestana PROVEEDORES
- **KPIs**: total proveedores, facturas pendientes, deuda total, ingredientes registrados
- **Lista**: nombre, categoria, CUIT, telefono, email, cant. facturas, cant. ingredientes
- **Agregar**: modal con nombre, CUIT, direccion, telefono, email, notas, categoria
- **Editar/Eliminar**: iconos en cada fila
- **Filtrar por categoria**: dropdown

#### Pestana CATEGORIAS
- Grilla de categorias con icono, nombre, cantidad de proveedores
- Agregar/editar/eliminar categorias
- Categorias sugeridas: Bebidas Alcoholicas, Bebidas sin Alcohol, Carnes, Verduras/Frutas, Lacteos, Panaderia, Limpieza, Descartables

#### Pestana INGREDIENTES
- **KPIs**: total ingredientes, stock bajo (alerta), costo promedio, sin proveedor
- **Lista completa**: nombre, unidad, stock actual, umbral de alerta, costo por unidad, categoria, proveedor
- **Alertas de stock**: fila en rojo si el stock esta por debajo del umbral
- **Agregar**: modal con todos los campos + dropdowns para categoria y proveedor
- **Filtrar por categoria**: dropdown

**Ejemplo: cargar un nuevo ingrediente**
1. Ir a pestana INGREDIENTES
2. Click "Agregar"
3. Nombre: "Fernet Branca", Unidad: "ml", Stock actual: 5000, Alerta en: 1000, Costo por ml: $X
4. Categoria: "Bebidas Alcoholicas", Proveedor: "Distribuidora Tal"
5. Guardar

#### Pestana HISTORIAL PRECIOS
- Linea de tiempo de cambios de precio de ingredientes
- Filtrar por ingrediente
- Muestra: fecha, ingrediente, costo, notas

---

### 2.4 Gastos

**URL**: `/admin/expenses`

4 pestanas:

#### Pestana GASTOS
- **KPIs**: total mes, total semana, promedio diario, gastos recurrentes
- **Filtros**: rango de fecha, categoria, proveedor, metodo de pago
- **Lista**: fecha, descripcion, categoria, proveedor, monto, metodo de pago
- **Agregar gasto**: descripcion, monto, fecha, categoria, proveedor (opcional), metodo de pago, notas
- **Gasto recurrente**: activar toggle + dia del mes para gastos fijos (alquiler, servicios)

#### Pestana CATEGORIAS
- Categorias con icono, nombre, cantidad de gastos, presupuesto mensual
- Subcategorias (categorias dentro de categorias)
- Barra de presupuesto: usado vs disponible por categoria

#### Pestana POR PROVEEDOR
- Gastos agrupados por proveedor
- Total por proveedor, cantidad de gastos, ultimo gasto

#### Pestana RESUMEN
- Totales mensuales por categoria (barras visuales)
- Presupuesto vs gasto real
- Top 5 categorias de gasto
- Proyeccion mensual

---

### 2.5 Empleados

**URL**: `/admin/employees`

- **KPIs**: total empleados, por rol
- **Agregar empleado**: nombre, rol (admin/cajero/mozo/cocina/bar/repartidor), avatar, PIN de 4 digitos
- **Editar**: click en "Editar", modifica datos en el modal
- **Eliminar**: click en "Eliminar", confirmar
- **PIN**: campo enmascarado (se muestra con dots, click para revelar). El PIN se usa para ingresar al POS

---

### 2.6 Mesas

**URL**: `/admin/tables`

- **Zonas**: organizar mesas por zona (Salon, Terraza, Pool, etc.)
- **Agregar mesa**: numero, zona, tipo, asientos
- **Estados**: disponible (verde), ocupada (amarillo), reservada (violeta)
- **QR codes**: cada mesa tiene un codigo QR para acceso rapido

---

### 2.7 Analiticas

**URL**: `/admin/analytics`

3 pestanas:

#### Pestana DASHBOARD
- **KPIs**: ventas hoy, pedidos hoy, ticket promedio, delivery hoy
- **Selector de periodo**: Hoy, Semana, Mes
- **Ingresos por metodo de pago**: barras horizontales
- **Pedidos por hora**: grafico de barras
- **Top 10 productos vendidos**

#### Pestana COSTOS Y GANANCIAS
- Usa los datos del calculador de costos
- **KPIs**: margen promedio, productos con receta, sin receta, ganancia estimada
- **Tabla**: producto, categoria, precio venta, costo, ganancia, margen %
- **Colores de margen**: rojo/amarillo/verde
- Productos sin receta resaltados

#### Pestana REPORTES (imprimibles)
1. Elegir fecha
2. Click "GENERAR REPORTE"
3. El sistema calcula: ingresos, costos, gastos, ganancia bruta y neta
4. Click "IMPRIMIR" — se abre la vista de impresion con diseno profesional:
   - Encabezado: "MY WAY OLIVOS — Reporte Diario"
   - Desglose de ingresos, costos, gastos
   - Cantidad de pedidos (salon + delivery)
   - Top productos
   - Metodos de pago

---

### 2.8 Caja Registradora

**URL**: `/admin/cash-register`

- **Abrir caja**: monto de apertura
- **Movimientos**: registrar ingresos y egresos durante el turno
- **Cerrar caja**: monto de cierre, el sistema calcula la diferencia
- **Historial**: ver cajas anteriores con todos los movimientos

---

### 2.9 Facturacion AFIP

**URL**: `/admin/invoices` y `/admin/afip-config`

- **Configuracion AFIP** (`/admin/afip-config`): CUIT, razon social, regimen fiscal, punto de venta, certificados PEM, entorno (testing/produccion), facturacion automatica
- **Facturas** (`/admin/invoices`): lista de facturas emitidas, crear factura manual, tipos A/B/C, CAE

---

### 2.10 Delivery (Admin)

**URL**: `/admin/delivery`

- **Pedidos entrantes**: lista de pedidos de delivery con estado, cliente, total
- **Cambiar estado**: pendiente -> preparando -> en camino -> entregado
- **Asignar repartidor**: copiar link de repartidor y enviarlo por WhatsApp
- **Crear pedido manual**: para pedidos por telefono

---

### 2.11 Repartidores (GPS)

**URL**: `/admin/repartidores`

- **Mapa de flota**: mapa en tiempo real con la ubicacion de cada repartidor
- **Actualizacion cada 5 segundos**: los puntos se mueven en el mapa
- **Estado de pedidos**: ver que pedido lleva cada repartidor

---

## 3. Guia del Cajero (/pos)

**URL**: `/pos`

### Ingresar
1. Abrir `/pos` en el navegador
2. Ingresar el PIN de 4 digitos asignado por el admin
3. El sistema verifica contra la base de datos y muestra tu nombre

### Pantalla principal
- **Plano de mesas**: grilla con todas las mesas por zona
- Colores: verde (libre), amarillo (ocupada), rojo (con pedidos listos)

### Cerrar mesa (cobrar)
1. Click en una mesa ocupada
2. Ver el detalle de pedidos y total
3. Elegir metodo de pago (Efectivo, Tarjeta, MercadoPago, Transferencia)
4. Confirmar en el dialogo: "Cerrar mesa X? Total: $Y — Metodo: Z"
5. La mesa se libera automaticamente

---

## 4. Guia del Mozo (/waiter)

**URL**: `/waiter`

### Ingresar
1. Abrir `/waiter`
2. Seleccionar tu perfil de la lista de mozos

### Tomar un pedido
1. Tocar una mesa del listado
2. Ir a la pestana "Agregar"
3. **Buscar producto**: usar la barra de busqueda (busca en todas las categorias)
4. **Navegar por categoria**: tocar las pills de categoria
5. **Agregar items**: tocar "+" en cada producto
6. **Agregar notas**: tocar "Agregar nota" debajo del item (ej: "sin cebolla", "bien cocido")
7. **Enviar pedido**: el pedido va a cocina o bar segun el tipo de producto

### Cancelar un item
- En la lista de pedidos, tocar la X roja en items con estado "pendiente" o "preparando"
- Confirmar la cancelacion
- El item aparece tachado y en gris

### Entregar items listos
1. Ir a la pestana "Listos"
2. Ver items agrupados por mesa
3. **Entregar individual**: tocar "ENTREGADO" en cada item
4. **Entregar todo**: tocar "ENTREGAR TODO" al final del grupo de mesa (entrega todos los items de esa mesa de una vez)

### Cobrar
1. Ir a la pestana "Pago"
2. Ver el total de la mesa
3. Elegir metodo de pago
4. Confirmar

---

## 5. Guia de Cocina y Bar

### Cocina (/kitchen)

**URL**: `/kitchen`

### Bar (/bar)

**URL**: `/bar`

Ambas pantallas funcionan igual, filtradas por tipo de producto (cocina o bar).

### Pantalla de pedidos
- **Tarjetas de pedidos**: cada pedido es una tarjeta con numero de mesa, items y tiempos
- **Alerta sonora**: suena un beep cuando llegan pedidos nuevos
- **Pantalla siempre encendida**: el sistema mantiene la pantalla activa (wake lock)
- **Indicador de conexion**: punto verde (conectado) o rojo (sin conexion)

### Colores de estado
- **Amarillo**: pendiente (nuevo, sin tocar)
- **Azul**: preparando (ya estas trabajando en esto)
- **Verde**: listo (para entregar)

### Flujo de trabajo
1. Llega un pedido nuevo (suena beep, aparece tarjeta amarilla)
2. Tocar el item para marcarlo como "Preparando" (se pone azul)
3. Cuando esta listo, tocar para marcar "Listo" (se pone verde)
4. El mozo ve el item como "listo" y lo lleva a la mesa

### Orden de urgencia
- Los pedidos mas viejos aparecen primero
- Pedidos de mas de 10 minutos tienen un borde rojo pulsante
- Notas especiales del mozo aparecen en amarillo debajo del item (ej: *sin cebolla*)

### Recomendacion
- Usar una **tablet** montada en la pared de la cocina/barra
- Mantener el brillo al maximo
- El sistema impide que la pantalla se apague sola

---

## 6. Guia del Repartidor

**URL**: `/repartidor/[orderId]` (recibis el link del admin)

### Como funciona
1. El admin te envia un link por WhatsApp cuando hay un pedido de delivery
2. Abris el link en tu celular
3. Ves los detalles del pedido: cliente, direccion, items, total
4. **Activar GPS**: el boton activa el seguimiento de tu ubicacion
5. Tu ubicacion se envia cada 8 segundos al sistema
6. El cliente puede ver tu ubicacion en tiempo real en su mapa
7. Cuando entregas, marcar como "Entregado"

---

## 7. Guia del Cliente (Delivery)

**URL**: `/delivery`

### Crear cuenta
1. Ir a `/delivery` o `/login`
2. Click "Iniciar sesion con Google"
3. Elegir tu cuenta de Google
4. Listo — tu nombre se completa automaticamente

### Hacer un pedido
1. **Navegar el menu**: recorrer categorias o usar la barra de busqueda
2. **Agregar al carrito**: tocar "+" en cada producto, ajustar cantidad
3. **El carrito se guarda**: si refrescas la pagina, no se pierde
4. **Ir al checkout**: tocar "Ir al checkout"
5. **Completar datos**: nombre (precargado), direccion, telefono (obligatorio), notas
6. **Metodo de pago**: Efectivo, Transferencia o MercadoPago
7. **Confirmar pedido**: ver la pantalla de confirmacion con resumen y numero de pedido
8. **Seguimiento**: tocar "Ver seguimiento" para ver el estado en tiempo real

### Seguimiento del pedido (/track)
- **Estados**: Pendiente -> Preparando -> En camino -> Entregado
- **Mapa**: cuando el repartidor esta en camino, ves su ubicacion en el mapa en tiempo real

### Horarios
- **Delivery**: Martes a Domingo, 19:00 a 03:00
- Fuera de horario aparece un aviso y el sistema no acepta pedidos

---

## 8. Preguntas Frecuentes

**"No me deja hacer pedidos de delivery"**
- Verificar que sea dentro del horario (Mar-Dom 19:00 a 03:00)
- Verificar que hayas iniciado sesion con Google
- Verificar que el telefono este completo

**"El PIN del POS no funciona"**
- Contactar al administrador para que te asigne un PIN en la seccion Empleados
- El PIN es de 4 digitos y se verifica contra la base de datos

**"No veo pedidos en la pantalla de cocina/bar"**
- Verificar la conexion WiFi
- Ver el indicador de conexion: punto verde = conectado, punto rojo = sin conexion
- Si esta rojo, el sistema sigue intentando reconectarse automaticamente

**"Se perdio mi carrito de delivery"**
- El carrito se guarda automaticamente en el navegador
- Si usas modo incognito o borraste datos del navegador, se pierde
- Solucion: no usar modo incognito

**"Como cambio el precio de un producto"**
- Admin > Menu > pestana PRODUCTOS > click en editar > cambiar precio > guardar

**"Como cargo los ingredientes de un trago"**
- Admin > Menu > pestana RECETAS > seleccionar el producto > agregar ingredientes con cantidad y unidad

**"Como veo las ganancias del dia"**
- Admin > Analiticas > pestana REPORTES > seleccionar fecha > GENERAR REPORTE

**"Como agrego un empleado nuevo"**
- Admin > Empleados > "Agregar Empleado" > completar nombre, rol, PIN > guardar

**"El repartidor no aparece en el mapa"**
- Verificar que el repartidor haya abierto su link y activado el GPS
- Verificar que el pedido este en estado "en camino"
- El GPS se actualiza cada 8 segundos

**"Como imprimo un reporte"**
- Admin > Analiticas > REPORTES > generar reporte > IMPRIMIR
- Se abre la vista de impresion del navegador con formato profesional
