export interface TutorialStep {
	/** Element ID to highlight in the simulated screen */
	target: string;
	/** Title of this step */
	title: string;
	/** Detailed explanation */
	description: string;
}

export interface Screen {
	id: string;
	roleId: string;
	name: string;
	url: string;
	description: string;
	steps: TutorialStep[];
}

export const screens: Screen[] = [
	// ─── MOZO ──────────────────────────────────────────────
	{
		id: "waiter-tables",
		roleId: "waiter",
		name: "Mesas",
		url: "/waiter/tables",
		description: "Vista de todas las mesas con su estado y pedido actual",
		steps: [
			{
				target: "table-card-occupied",
				title: "Mesa Ocupada",
				description:
					"Las mesas en naranja/rojo tienen un pedido abierto. Muestra el total actual, la cantidad de items y cuanto tiempo lleva ocupada. Toca para ver el detalle.",
			},
			{
				target: "table-card-available",
				title: "Mesa Disponible",
				description:
					"Las mesas en verde estan libres. Toca una mesa libre para crear un nuevo pedido y empezar a atenderla.",
			},
			{
				target: "table-total",
				title: "Total de la Mesa",
				description:
					"Aca ves el monto total del pedido de la mesa. Se actualiza automaticamente cada 5 segundos sin necesidad de recargar.",
			},
			{
				target: "table-timer",
				title: "Tiempo Transcurrido",
				description:
					"Indica cuanto tiempo lleva la mesa ocupada. Util para saber si una mesa esta demorando mucho.",
			},
			{
				target: "zone-tabs",
				title: "Filtro por Zonas",
				description:
					'Filtra las mesas por zona: "Salon Principal", "Afuera", etc. Asi encontras rapidamente la mesa que buscas.',
			},
		],
	},
	{
		id: "waiter-order",
		roleId: "waiter",
		name: "Tomar Pedido",
		url: "/waiter/table/[id]",
		description: "Armar el pedido de una mesa seleccionando productos",
		steps: [
			{
				target: "category-tabs",
				title: "Categorias del Menu",
				description:
					'Las categorias aparecen arriba con iconos. Toca una para ver sus productos: "Tragos", "Pizzas", "Cervezas", etc.',
			},
			{
				target: "product-grid",
				title: "Productos",
				description:
					"Cada tarjeta es un producto con nombre y precio. Toca para agregarlo al pedido. Si esta gris, no esta disponible.",
			},
			{
				target: "product-item",
				title: "Agregar Producto",
				description:
					"Toca un producto para sumarlo al pedido. Se agrega con cantidad 1. Si lo tocas de nuevo, suma otra unidad.",
			},
			{
				target: "order-summary",
				title: "Resumen del Pedido",
				description:
					"Abajo ves los items agregados, con cantidad y precio. Podes ajustar cantidades con + y - o eliminar un item.",
			},
			{
				target: "notes-field",
				title: "Notas Especiales",
				description:
					'Si el cliente pide algo especial (ej: "sin cebolla", "bien cocido"), escribilo aca. La cocina/barra lo ve en su pantalla.',
			},
			{
				target: "send-button",
				title: "Enviar Pedido",
				description:
					"Cuando esta todo, toca este boton. Los items de comida van a Cocina y los de bebida van a Barra automaticamente.",
			},
		],
	},
	{
		id: "waiter-ready",
		roleId: "waiter",
		name: "Pedidos Listos",
		url: "/waiter/ready",
		description: "Items que cocina o barra marcaron como listos para servir",
		steps: [
			{
				target: "ready-list",
				title: "Lista de Items Listos",
				description:
					"Aca aparecen todos los items que Cocina o Barra terminaron. Cada uno muestra el producto, la mesa y cuanto tiempo lleva esperando.",
			},
			{
				target: "ready-item",
				title: "Item Listo",
				description:
					"Cada tarjeta es un item listo para llevar. Muestra el nombre, la mesa destino y el tiempo de espera. Los mas viejos van primero.",
			},
			{
				target: "ready-table-badge",
				title: "Numero de Mesa",
				description:
					"Este badge te indica a que mesa va el item. Agrupa mentalmente los items por mesa para hacer un solo viaje.",
			},
			{
				target: "ready-timer",
				title: "Tiempo Esperando",
				description:
					"Cuanto tiempo lleva el item listo sin ser retirado. Si se pone rojo, hay que apurarse para que no se enfrie.",
			},
		],
	},
	{
		id: "waiter-payment",
		roleId: "waiter",
		name: "Cobrar",
		url: "/waiter/payment",
		description: "Procesar el cobro de una mesa con distintos metodos de pago",
		steps: [
			{
				target: "payment-table-select",
				title: "Seleccionar Mesa",
				description:
					"Primero elegis que mesa vas a cobrar. Solo aparecen mesas con pedidos abiertos.",
			},
			{
				target: "payment-total",
				title: "Total a Cobrar",
				description:
					"El monto total del pedido de la mesa. Verificalo con el cliente antes de cobrar.",
			},
			{
				target: "payment-cash",
				title: "Pago en Efectivo",
				description:
					"Toca para cobrar en efectivo. Se confirma el pago y la mesa se cierra automaticamente.",
			},
			{
				target: "payment-card",
				title: "Pago con Tarjeta",
				description:
					"Toca para registrar pago con tarjeta. Pasa la tarjeta por la lectora y luego confirma aca.",
			},
			{
				target: "payment-mp",
				title: "MercadoPago QR",
				description:
					"Genera un codigo QR unico para esta mesa. El cliente lo escanea con la app de MercadoPago. Cuando paga, la mesa se cierra sola.",
			},
			{
				target: "payment-transfer",
				title: "Transferencia Bancaria",
				description:
					'Muestra el alias bancario del local. Toca "Copiar" para copiar el alias y compartirlo con el cliente. Confirma cuando recibas la transferencia.',
			},
			{
				target: "payment-qr-display",
				title: "Codigo QR",
				description:
					"Cuando elegis MercadoPago, aparece el QR aca. Mostraselo al cliente para que lo escanee con su celular.",
			},
			{
				target: "payment-alias-display",
				title: "Alias para Transferir",
				description:
					'Cuando elegis Transferencia, aparece el alias bancario. Toca el boton "Copiar" para copiarlo y enviarselo al cliente por WhatsApp o mostrarselo.',
			},
		],
	},

	// ─── COCINA ────────────────────────────────────────────
	{
		id: "kitchen-board",
		roleId: "kitchen",
		name: "Pantalla de Pedidos",
		url: "/kitchen",
		description: "Pedidos de comida pendientes y en preparacion",
		steps: [
			{
				target: "kds-pending-column",
				title: "Columna: Pendientes",
				description:
					"Aca aparecen los pedidos nuevos que llegan de los mozos. Cada tarjeta tiene el numero de mesa, los items a preparar y las notas.",
			},
			{
				target: "kds-preparing-column",
				title: "Columna: En Preparacion",
				description:
					"Cuando empezas a preparar un pedido, lo moves aca tocandolo. Asi el sistema sabe que ya estas trabajando en el.",
			},
			{
				target: "kds-order-card",
				title: "Tarjeta de Pedido",
				description:
					"Cada tarjeta muestra: numero de mesa, items del pedido, notas del cliente y el tiempo transcurrido. Las notas son importantes (alergias, preferencias).",
			},
			{
				target: "kds-item-notes",
				title: "Notas del Cliente",
				description:
					'Las notas aparecen en cursiva debajo del item. Ej: "sin cebolla", "bien cocido". Siempre leelas antes de cocinar.',
			},
			{
				target: "kds-timer",
				title: "Temporizador",
				description:
					"Muestra cuanto tiempo lleva el pedido. Si se pone rojo, esta demorando mucho. Prioriza los mas viejos.",
			},
			{
				target: "kds-mark-ready",
				title: "Marcar como Listo",
				description:
					'Cuando el pedido esta terminado, toca "Listo". El item aparece en la pantalla del mozo para que lo retire.',
			},
			{
				target: "kds-sound-indicator",
				title: "Notificacion Sonora",
				description:
					"Cuando llega un pedido nuevo, suena un BEEP. Si no escuchas el sonido, verifica que el volumen del dispositivo este alto.",
			},
		],
	},
	{
		id: "kitchen-stock",
		roleId: "kitchen",
		name: "Stock de Cocina",
		url: "/kitchen/stock",
		description: "Niveles de ingredientes y alertas de stock bajo",
		steps: [
			{
				target: "stock-list",
				title: "Lista de Ingredientes",
				description:
					"Todos los ingredientes de cocina con su nivel actual. Cada fila muestra nombre, cantidad actual, unidad y estado.",
			},
			{
				target: "stock-bar-green",
				title: "Stock OK (Verde)",
				description:
					"El ingrediente esta por encima del umbral de alerta. No hay que hacer nada.",
			},
			{
				target: "stock-bar-yellow",
				title: "Stock Bajo (Amarillo)",
				description:
					"El ingrediente esta cerca del umbral. Avisar al admin para que pida reposicion pronto.",
			},
			{
				target: "stock-bar-red",
				title: "Stock Critico (Rojo)",
				description:
					"El ingrediente esta por debajo del minimo. Avisar al admin urgente. Considerar desactivar platos que lo usan.",
			},
		],
	},

	// ─── BARRA ─────────────────────────────────────────────
	{
		id: "bar-board",
		roleId: "bar",
		name: "Pantalla de Pedidos",
		url: "/bar",
		description: "Pedidos de tragos y bebidas pendientes y en preparacion",
		steps: [
			{
				target: "kds-pending-column",
				title: "Tragos Pendientes",
				description:
					"Los pedidos de bebidas nuevos aparecen aca. Cada tarjeta muestra mesa, tragos pedidos y notas especiales.",
			},
			{
				target: "kds-preparing-column",
				title: "En Preparacion",
				description:
					"Toca un pedido pendiente para moverlo aca cuando empezas a preparar los tragos.",
			},
			{
				target: "kds-order-card",
				title: "Pedido de Barra",
				description:
					'Muestra los tragos/bebidas pedidos. Las notas pueden indicar preferencias: "con hielo", "sin azucar", etc.',
			},
			{
				target: "kds-mark-ready",
				title: "Marcar Listo",
				description:
					"Cuando los tragos estan servidos, toca para marcarlo como listo. El mozo lo ve y viene a buscarlo.",
			},
		],
	},
	{
		id: "bar-stock",
		roleId: "bar",
		name: "Stock de Barra",
		url: "/bar/stock",
		description: "Niveles de botellas, bebidas e ingredientes de barra",
		steps: [
			{
				target: "stock-list",
				title: "Stock de Barra",
				description:
					"Todos los ingredientes de barra: botellas, jugos, gaseosas, hielo. Mismo sistema de colores que cocina.",
			},
			{
				target: "stock-bar-green",
				title: "Disponible",
				description: "Hay suficiente stock de este ingrediente. Todo bien.",
			},
			{
				target: "stock-bar-red",
				title: "Reponer Urgente",
				description:
					"Stock critico. Avisar al manager inmediatamente. Los tragos que usan este ingrediente pueden quedar sin stock.",
			},
		],
	},

	// ─── POS / CAJERO ──────────────────────────────────────
	{
		id: "pos-salon",
		roleId: "cashier",
		name: "Salon (Plano Visual)",
		url: "/pos/salon",
		description: "Plano interactivo del salon con todas las mesas",
		steps: [
			{
				target: "pos-floor-plan",
				title: "Plano del Salon",
				description:
					"Ves el salon completo con todas las mesas dibujadas en su posicion real. Podes hacer zoom (pinch) y arrastrar para moverte.",
			},
			{
				target: "pos-table-green",
				title: "Mesa Libre",
				description:
					"Las mesas verdes estan disponibles. Toca para crear un pedido nuevo directamente.",
			},
			{
				target: "pos-table-red",
				title: "Mesa Ocupada",
				description:
					"Las mesas rojas tienen pedido abierto. Toca para ver el detalle, agregar items o cobrar.",
			},
			{
				target: "pos-panel",
				title: "Panel Lateral",
				description:
					"Al tocar una mesa ocupada, se abre este panel con: items del pedido, total, y botones de cobro.",
			},
			{
				target: "pos-pay-buttons",
				title: "Botones de Cobro",
				description:
					"Cuatro opciones: Efectivo, Tarjeta, MercadoPago (QR) y Transferencia. Toca uno para iniciar el cobro.",
			},
			{
				target: "pos-qr-area",
				title: "QR y Alias",
				description:
					"Si elegis MercadoPago, aparece el QR. Si elegis Transferencia, aparece el alias con boton de copiar.",
			},
			{
				target: "pos-zoom-controls",
				title: "Controles de Zoom",
				description:
					"Usa estos botones para acercar/alejar el plano, o usa pinch en pantalla tactil.",
			},
		],
	},
	{
		id: "pos-orders",
		roleId: "cashier",
		name: "Lista de Pedidos",
		url: "/pos/orders",
		description: "Todos los pedidos del dia con filtros",
		steps: [
			{
				target: "orders-filter",
				title: "Filtros",
				description:
					"Filtra por estado: pendiente, preparando, listo, cerrado, cancelado. Tambien podes buscar por numero de mesa.",
			},
			{
				target: "orders-list",
				title: "Lista de Pedidos",
				description:
					"Cada pedido muestra: mesa, estado, total, mozo, hora. Toca para ver detalle completo.",
			},
			{
				target: "orders-status-badge",
				title: "Estado del Pedido",
				description:
					"El color indica el estado: amarillo=pendiente, azul=preparando, verde=listo, gris=cerrado, rojo=cancelado.",
			},
		],
	},

	// ─── REPARTIDOR ────────────────────────────────────────
	{
		id: "repartidor-delivery",
		roleId: "delivery",
		name: "Entrega de Pedido",
		url: "/repartidor/[orderId]",
		description: "Detalle del pedido a entregar con GPS en vivo",
		steps: [
			{
				target: "delivery-customer-info",
				title: "Datos del Cliente",
				description:
					"Nombre, direccion y telefono. Toca el telefono para llamar directamente si necesitas.",
			},
			{
				target: "delivery-items",
				title: "Items del Pedido",
				description:
					"Lista de todo lo que llevas: producto, cantidad y precio. Verifica antes de salir que no falte nada.",
			},
			{
				target: "delivery-total",
				title: "Total y Metodo de Pago",
				description:
					'Monto total y como paga el cliente. Si dice "efectivo", tenes que cobrar al entregar.',
			},
			{
				target: "delivery-gps",
				title: "GPS en Vivo",
				description:
					"Tu ubicacion se comparte automaticamente con el cliente. El te puede ver en un mapa en tiempo real.",
			},
			{
				target: "delivery-complete",
				title: "Marcar Entregado",
				description:
					'Cuando entregas el pedido, toca este boton. El pedido pasa a "entregado" y se cierra.',
			},
		],
	},

	// ─── ADMIN ─────────────────────────────────────────────
	{
		id: "admin-dashboard",
		roleId: "admin",
		name: "Dashboard",
		url: "/admin",
		description: "Panel principal con KPIs y accesos rapidos",
		steps: [
			{
				target: "admin-kpi-orders",
				title: "Pedidos del Dia",
				description:
					"Cantidad total de pedidos (en mesa + delivery) del dia actual.",
			},
			{
				target: "admin-kpi-revenue",
				title: "Facturacion",
				description:
					"Total cobrado en el dia sumando todos los metodos de pago.",
			},
			{
				target: "admin-kpi-costs",
				title: "Costos",
				description:
					"Costo estimado de ingredientes usados, calculado desde las recetas de cada producto.",
			},
			{
				target: "admin-kpi-margin",
				title: "Margen",
				description:
					"Facturacion menos costos. Indica la rentabilidad bruta del dia.",
			},
			{
				target: "admin-quick-links",
				title: "Accesos Rapidos",
				description:
					"Links directos a cada modulo: Menu, Mesas, Empleados, Gastos, Caja, etc.",
			},
			{
				target: "admin-sidebar",
				title: "Menu Lateral",
				description:
					"Navegacion completa a todos los modulos de administracion. En celular, se abre con el icono de hamburguesa.",
			},
		],
	},
	{
		id: "admin-menu",
		roleId: "admin",
		name: "Gestion de Menu",
		url: "/admin/menu",
		description: "Crear y editar productos, categorias y recetas",
		steps: [
			{
				target: "menu-categories",
				title: "Categorias",
				description:
					'Lista de categorias del menu con icono emoji. Podes crear, editar, reordenar y anidar subcategorias (ej: "Tragos" > "Gin").',
			},
			{
				target: "menu-product-list",
				title: "Lista de Productos",
				description:
					"Productos de la categoria seleccionada. Cada uno muestra nombre, precio y estado de disponibilidad.",
			},
			{
				target: "menu-add-product",
				title: "Agregar Producto",
				description:
					"Crea un nuevo producto con: nombre, descripcion, precio de venta, precio de costo, destino (cocina/barra), y categoria.",
			},
			{
				target: "menu-toggle-available",
				title: "Activar/Desactivar",
				description:
					"El toggle activa o desactiva un producto. Los desactivados no aparecen en el menu del mozo ni del cliente.",
			},
			{
				target: "menu-recipe",
				title: "Receta (Ingredientes)",
				description:
					'Vincula ingredientes a un producto. Ej: "Gin Tonic" usa 60ml Gin + 200ml Tonica. Esto permite calcular costos automaticamente.',
			},
		],
	},
	{
		id: "admin-tables",
		roleId: "admin",
		name: "Gestion de Mesas",
		url: "/admin/tables",
		description: "Editor visual del plano y generacion de QRs",
		steps: [
			{
				target: "tables-visual-editor",
				title: "Editor Visual",
				description:
					"Arrastra las mesas para posicionarlas en el plano. Cambia forma (cuadrada, redonda, pool), tamano y rotacion.",
			},
			{
				target: "tables-add",
				title: "Agregar Mesa",
				description:
					"Crea una mesa nueva con numero, zona, tipo y cantidad de asientos.",
			},
			{
				target: "tables-zones",
				title: "Zonas",
				description:
					'Gestiona zonas del local: "Salon Principal", "Terraza", "VIP". Cada mesa pertenece a una zona.',
			},
			{
				target: "tables-qr",
				title: "Generar QR",
				description:
					"Genera un codigo QR unico por mesa. El cliente lo escanea para ver el menu o hacer pedidos directos.",
			},
			{
				target: "tables-qr-download",
				title: "Descargar QRs",
				description:
					"Descarga QRs individuales o todos en un ZIP. Imprimilos y pegalos en cada mesa.",
			},
		],
	},
	{
		id: "admin-employees",
		roleId: "admin",
		name: "Empleados",
		url: "/admin/employees",
		description: "Crear empleados, asignar roles y PINs",
		steps: [
			{
				target: "emp-list",
				title: "Lista de Empleados",
				description:
					"Todos los empleados con nombre, rol, PIN y avatar. El color de fondo indica el rol.",
			},
			{
				target: "emp-add",
				title: "Nuevo Empleado",
				description:
					"Crea un empleado con nombre y rol. El sistema genera un PIN automaticamente, o podes elegir uno.",
			},
			{
				target: "emp-pin",
				title: "PIN de Acceso",
				description:
					"Este es el PIN que el empleado usa para ingresar al sistema. Compartilo de forma segura.",
			},
			{
				target: "emp-role",
				title: "Rol",
				description:
					"Define que pantallas puede ver: admin, manager, cajero, mozo, cocina, barra o repartidor.",
			},
		],
	},
	{
		id: "admin-suppliers",
		roleId: "admin",
		name: "Proveedores",
		url: "/admin/suppliers",
		description: "Gestionar proveedores y sus datos de contacto",
		steps: [
			{
				target: "supplier-list",
				title: "Lista de Proveedores",
				description:
					"Todos los proveedores organizados por categoria. Muestra nombre, CUIT y contacto.",
			},
			{
				target: "supplier-add",
				title: "Nuevo Proveedor",
				description:
					"Agrega un proveedor con: nombre, CUIT, direccion, telefono, email y categoria.",
			},
			{
				target: "supplier-invoices",
				title: "Facturas del Proveedor",
				description:
					"Cada proveedor tiene sus facturas vinculadas. Podes ver historial de compras y montos.",
			},
		],
	},
	{
		id: "admin-expenses",
		roleId: "admin",
		name: "Gastos",
		url: "/admin/expenses",
		description: "Registrar y categorizar gastos del negocio",
		steps: [
			{
				target: "expense-list",
				title: "Lista de Gastos",
				description:
					"Todos los gastos registrados con monto, categoria, fecha y metodo de pago.",
			},
			{
				target: "expense-add",
				title: "Registrar Gasto",
				description:
					"Nuevo gasto con: monto, categoria, descripcion, fecha, proveedor (opcional) y metodo de pago.",
			},
			{
				target: "expense-recurring",
				title: "Gasto Recurrente",
				description:
					"Marca un gasto como recurrente (ej: alquiler dia 1 de cada mes). El sistema lo recuerda.",
			},
			{
				target: "expense-filter",
				title: "Filtrar por Fecha",
				description:
					"Selecciona un rango de fechas para ver gastos de un periodo especifico.",
			},
		],
	},
	{
		id: "admin-cash",
		roleId: "admin",
		name: "Caja Registradora",
		url: "/admin/cash-register",
		description: "Abrir/cerrar caja y registrar movimientos",
		steps: [
			{
				target: "cash-open",
				title: "Abrir Caja",
				description:
					"Al inicio del turno, abri la caja con el saldo que hay fisicamente. Solo puede haber una caja abierta.",
			},
			{
				target: "cash-movements",
				title: "Movimientos",
				description:
					"Cada cobro en efectivo y cada gasto se registra automaticamente. Tambien podes agregar movimientos manuales.",
			},
			{
				target: "cash-balance",
				title: "Saldo Actual",
				description:
					"El saldo teorico calculado: apertura + ingresos - egresos. Deberia coincidir con lo que hay en la caja.",
			},
			{
				target: "cash-close",
				title: "Cerrar Caja",
				description:
					"Al final del turno: conta el dinero, ingresa el monto real, y el sistema calcula la diferencia (cuadre).",
			},
		],
	},
	{
		id: "admin-accounting",
		roleId: "admin",
		name: "Contabilidad",
		url: "/admin/accounting",
		description: "Reportes financieros y desglose por metodo de pago",
		steps: [
			{
				target: "accounting-summary",
				title: "Resumen de Gastos",
				description:
					"Total de gastos agrupado por categoria. Muestra cuanto se gasto en cada rubro.",
			},
			{
				target: "accounting-budget",
				title: "Presupuesto vs Real",
				description:
					"Compara lo presupuestado con lo gastado realmente. Las barras rojas indican que se excedio el presupuesto.",
			},
			{
				target: "accounting-payment-breakdown",
				title: "Desglose por Metodo de Pago",
				description:
					"Cuanto entro por efectivo, tarjeta, MercadoPago y transferencia. Util para negociar comisiones.",
			},
			{
				target: "accounting-date-filter",
				title: "Filtro de Fechas",
				description:
					"Selecciona el periodo a analizar: dia, semana, mes o rango personalizado.",
			},
		],
	},
	{
		id: "admin-invoices",
		roleId: "admin",
		name: "Facturacion AFIP",
		url: "/admin/invoices",
		description: "Emitir facturas electronicas con CAE",
		steps: [
			{
				target: "invoice-list",
				title: "Historial de Facturas",
				description:
					"Todas las facturas emitidas con numero, tipo, monto, estado y CAE. Filtra por fecha o estado.",
			},
			{
				target: "invoice-create",
				title: "Nueva Factura",
				description:
					"Crea una factura: selecciona tipo (A/B/C), datos del cliente, items con IVA. El total se calcula automaticamente.",
			},
			{
				target: "invoice-send-afip",
				title: "Enviar a AFIP",
				description:
					"Envia la factura a AFIP. Si todo esta bien, recibis el CAE (Codigo de Autorizacion Electronico) y la factura queda emitida.",
			},
		],
	},
	{
		id: "admin-mercadopago",
		roleId: "admin",
		name: "Config. MercadoPago",
		url: "/admin/mercadopago",
		description:
			"Configurar credenciales de MercadoPago y alias de transferencia",
		steps: [
			{
				target: "mp-access-token",
				title: "Access Token",
				description:
					"La credencial principal de MercadoPago. Se obtiene del panel de desarrolladores de MP. Sin esto, no funcionan los QR.",
			},
			{
				target: "mp-user-id",
				title: "User ID",
				description:
					"El ID del vendedor/cobrador en MercadoPago. Se usa para generar QRs de punto de venta.",
			},
			{
				target: "mp-pos-id",
				title: "POS ID",
				description:
					"Identificador del punto de venta fisico. Se crea en MP para habilitar cobros QR presenciales.",
			},
			{
				target: "mp-webhook",
				title: "Webhook Secret",
				description:
					"Clave secreta para verificar las notificaciones de pago. Garantiza que solo MP pueda confirmar pagos.",
			},
			{
				target: "mp-transfer-alias",
				title: "Alias de Transferencia",
				description:
					"El alias bancario (CVU/CBU) que se muestra a clientes cuando eligen pagar por transferencia. Ej: myway.bar",
			},
		],
	},
	{
		id: "admin-afip",
		roleId: "admin",
		name: "Config. AFIP",
		url: "/admin/afip-config",
		description: "Configurar datos fiscales y certificados para facturacion",
		steps: [
			{
				target: "afip-cuit",
				title: "CUIT",
				description: "Numero de CUIT del negocio. Formato: XX-XXXXXXXX-X.",
			},
			{
				target: "afip-razon",
				title: "Razon Social",
				description: "Nombre legal del negocio como figura en AFIP.",
			},
			{
				target: "afip-regime",
				title: "Regimen Fiscal",
				description:
					"Monotributo o Responsable Inscripto. Define que tipos de factura podes emitir.",
			},
			{
				target: "afip-certs",
				title: "Certificados",
				description:
					"Archivos PEM (certificado + clave privada) que se obtienen de AFIP. Necesarios para firmar facturas.",
			},
			{
				target: "afip-auto",
				title: "Auto-Facturacion",
				description:
					"Activa para que se genere factura automaticamente al cobrar con cada metodo de pago.",
			},
		],
	},
	{
		id: "admin-delivery",
		roleId: "admin",
		name: "Delivery",
		url: "/admin/delivery",
		description: "Gestionar pedidos delivery y asignar repartidores",
		steps: [
			{
				target: "admin-delivery-list",
				title: "Pedidos Activos",
				description:
					"Todos los pedidos delivery en curso. Muestra cliente, direccion, estado y repartidor asignado.",
			},
			{
				target: "admin-delivery-assign",
				title: "Asignar Repartidor",
				description:
					"Selecciona un repartidor para cada pedido. Aparecen los repartidores disponibles.",
			},
			{
				target: "admin-delivery-map",
				title: "Mapa de Flota",
				description:
					"Mapa en tiempo real con la ubicacion de todos los repartidores activos.",
			},
		],
	},
];
