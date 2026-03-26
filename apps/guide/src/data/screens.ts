export interface TutorialStep {
	/** Element ID to highlight in the simulated screen */
	target: string;
	/** Title of this step */
	title: string;
	/** Detailed explanation */
	description: string;
	/** Position of the tooltip relative to the target */
	position: "top" | "bottom" | "left" | "right";
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
				position: "bottom",
			},
			{
				target: "table-card-available",
				title: "Mesa Disponible",
				description:
					"Las mesas en verde estan libres. Toca una mesa libre para crear un nuevo pedido y empezar a atenderla.",
				position: "bottom",
			},
			{
				target: "table-total",
				title: "Total de la Mesa",
				description:
					"Aca ves el monto total del pedido de la mesa. Se actualiza automaticamente cada 5 segundos sin necesidad de recargar.",
				position: "left",
			},
			{
				target: "table-timer",
				title: "Tiempo Transcurrido",
				description:
					"Indica cuanto tiempo lleva la mesa ocupada. Util para saber si una mesa esta demorando mucho.",
				position: "left",
			},
			{
				target: "zone-tabs",
				title: "Filtro por Zonas",
				description:
					'Filtra las mesas por zona: "Salon Principal", "Afuera", etc. Asi encontras rapidamente la mesa que buscas.',
				position: "bottom",
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
				position: "bottom",
			},
			{
				target: "product-grid",
				title: "Productos",
				description:
					"Cada tarjeta es un producto con nombre y precio. Toca para agregarlo al pedido. Si esta gris, no esta disponible.",
				position: "bottom",
			},
			{
				target: "product-item",
				title: "Agregar Producto",
				description:
					"Toca un producto para sumarlo al pedido. Se agrega con cantidad 1. Si lo tocas de nuevo, suma otra unidad.",
				position: "right",
			},
			{
				target: "order-summary",
				title: "Resumen del Pedido",
				description:
					"Abajo ves los items agregados, con cantidad y precio. Podes ajustar cantidades con + y - o eliminar un item.",
				position: "top",
			},
			{
				target: "notes-field",
				title: "Notas Especiales",
				description:
					'Si el cliente pide algo especial (ej: "sin cebolla", "bien cocido"), escribilo aca. La cocina/barra lo ve en su pantalla.',
				position: "top",
			},
			{
				target: "send-button",
				title: "Enviar Pedido",
				description:
					"Cuando esta todo, toca este boton. Los items de comida van a Cocina y los de bebida van a Barra automaticamente.",
				position: "top",
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
				position: "bottom",
			},
			{
				target: "ready-item",
				title: "Item Listo",
				description:
					"Cada tarjeta es un item listo para llevar. Muestra el nombre, la mesa destino y el tiempo de espera. Los mas viejos van primero.",
				position: "right",
			},
			{
				target: "ready-table-badge",
				title: "Numero de Mesa",
				description:
					"Este badge te indica a que mesa va el item. Agrupa mentalmente los items por mesa para hacer un solo viaje.",
				position: "left",
			},
			{
				target: "ready-timer",
				title: "Tiempo Esperando",
				description:
					"Cuanto tiempo lleva el item listo sin ser retirado. Si se pone rojo, hay que apurarse para que no se enfrie.",
				position: "left",
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
				position: "bottom",
			},
			{
				target: "payment-total",
				title: "Total a Cobrar",
				description:
					"El monto total del pedido de la mesa. Verificalo con el cliente antes de cobrar.",
				position: "bottom",
			},
			{
				target: "payment-cash",
				title: "Pago en Efectivo",
				description:
					"Toca para cobrar en efectivo. Se confirma el pago y la mesa se cierra automaticamente.",
				position: "right",
			},
			{
				target: "payment-card",
				title: "Pago con Tarjeta",
				description:
					"Toca para registrar pago con tarjeta. Pasa la tarjeta por la lectora y luego confirma aca.",
				position: "left",
			},
			{
				target: "payment-mp",
				title: "MercadoPago QR",
				description:
					"Genera un codigo QR unico para esta mesa. El cliente lo escanea con la app de MercadoPago. Cuando paga, la mesa se cierra sola.",
				position: "right",
			},
			{
				target: "payment-transfer",
				title: "Transferencia Bancaria",
				description:
					'Muestra el alias bancario del local. Toca "Copiar" para copiar el alias y compartirlo con el cliente. Confirma cuando recibas la transferencia.',
				position: "left",
			},
			{
				target: "payment-qr-display",
				title: "Codigo QR",
				description:
					"Cuando elegis MercadoPago, aparece el QR aca. Mostraselo al cliente para que lo escanee con su celular.",
				position: "top",
			},
			{
				target: "payment-alias-display",
				title: "Alias para Transferir",
				description:
					'Cuando elegis Transferencia, aparece el alias bancario. Toca el boton "Copiar" para copiarlo y enviarselo al cliente por WhatsApp o mostrarselo.',
				position: "top",
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
				position: "right",
			},
			{
				target: "kds-preparing-column",
				title: "Columna: En Preparacion",
				description:
					"Cuando empezas a preparar un pedido, lo moves aca tocandolo. Asi el sistema sabe que ya estas trabajando en el.",
				position: "left",
			},
			{
				target: "kds-order-card",
				title: "Tarjeta de Pedido",
				description:
					"Cada tarjeta muestra: numero de mesa, items del pedido, notas del cliente y el tiempo transcurrido. Las notas son importantes (alergias, preferencias).",
				position: "right",
			},
			{
				target: "kds-item-notes",
				title: "Notas del Cliente",
				description:
					'Las notas aparecen en cursiva debajo del item. Ej: "sin cebolla", "bien cocido". Siempre leelas antes de cocinar.',
				position: "bottom",
			},
			{
				target: "kds-timer",
				title: "Temporizador",
				description:
					"Muestra cuanto tiempo lleva el pedido. Si se pone rojo, esta demorando mucho. Prioriza los mas viejos.",
				position: "left",
			},
			{
				target: "kds-mark-ready",
				title: "Marcar como Listo",
				description:
					'Cuando el pedido esta terminado, toca "Listo". El item aparece en la pantalla del mozo para que lo retire.',
				position: "top",
			},
			{
				target: "kds-sound-indicator",
				title: "Notificacion Sonora",
				description:
					"Cuando llega un pedido nuevo, suena un BEEP. Si no escuchas el sonido, verifica que el volumen del dispositivo este alto.",
				position: "bottom",
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
				position: "bottom",
			},
			{
				target: "stock-bar-green",
				title: "Stock OK (Verde)",
				description:
					"El ingrediente esta por encima del umbral de alerta. No hay que hacer nada.",
				position: "right",
			},
			{
				target: "stock-bar-yellow",
				title: "Stock Bajo (Amarillo)",
				description:
					"El ingrediente esta cerca del umbral. Avisar al admin para que pida reposicion pronto.",
				position: "right",
			},
			{
				target: "stock-bar-red",
				title: "Stock Critico (Rojo)",
				description:
					"El ingrediente esta por debajo del minimo. Avisar al admin urgente. Considerar desactivar platos que lo usan.",
				position: "right",
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
				position: "right",
			},
			{
				target: "kds-preparing-column",
				title: "En Preparacion",
				description:
					"Toca un pedido pendiente para moverlo aca cuando empezas a preparar los tragos.",
				position: "left",
			},
			{
				target: "kds-order-card",
				title: "Pedido de Barra",
				description:
					'Muestra los tragos/bebidas pedidos. Las notas pueden indicar preferencias: "con hielo", "sin azucar", etc.',
				position: "right",
			},
			{
				target: "kds-mark-ready",
				title: "Marcar Listo",
				description:
					"Cuando los tragos estan servidos, toca para marcarlo como listo. El mozo lo ve y viene a buscarlo.",
				position: "top",
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
				position: "bottom",
			},
			{
				target: "stock-bar-green",
				title: "Disponible",
				description: "Hay suficiente stock de este ingrediente. Todo bien.",
				position: "right",
			},
			{
				target: "stock-bar-red",
				title: "Reponer Urgente",
				description:
					"Stock critico. Avisar al manager inmediatamente. Los tragos que usan este ingrediente pueden quedar sin stock.",
				position: "right",
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
				position: "bottom",
			},
			{
				target: "pos-table-green",
				title: "Mesa Libre",
				description:
					"Las mesas verdes estan disponibles. Toca para crear un pedido nuevo directamente.",
				position: "right",
			},
			{
				target: "pos-table-red",
				title: "Mesa Ocupada",
				description:
					"Las mesas rojas tienen pedido abierto. Toca para ver el detalle, agregar items o cobrar.",
				position: "left",
			},
			{
				target: "pos-panel",
				title: "Panel Lateral",
				description:
					"Al tocar una mesa ocupada, se abre este panel con: items del pedido, total, y botones de cobro.",
				position: "left",
			},
			{
				target: "pos-pay-buttons",
				title: "Botones de Cobro",
				description:
					"Cuatro opciones: Efectivo, Tarjeta, MercadoPago (QR) y Transferencia. Toca uno para iniciar el cobro.",
				position: "top",
			},
			{
				target: "pos-qr-area",
				title: "QR y Alias",
				description:
					"Si elegis MercadoPago, aparece el QR. Si elegis Transferencia, aparece el alias con boton de copiar.",
				position: "top",
			},
			{
				target: "pos-zoom-controls",
				title: "Controles de Zoom",
				description:
					"Usa estos botones para acercar/alejar el plano, o usa pinch en pantalla tactil.",
				position: "left",
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
				position: "bottom",
			},
			{
				target: "orders-list",
				title: "Lista de Pedidos",
				description:
					"Cada pedido muestra: mesa, estado, total, mozo, hora. Toca para ver detalle completo.",
				position: "bottom",
			},
			{
				target: "orders-status-badge",
				title: "Estado del Pedido",
				description:
					"El color indica el estado: amarillo=pendiente, azul=preparando, verde=listo, gris=cerrado, rojo=cancelado.",
				position: "left",
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
				position: "bottom",
			},
			{
				target: "delivery-items",
				title: "Items del Pedido",
				description:
					"Lista de todo lo que llevas: producto, cantidad y precio. Verifica antes de salir que no falte nada.",
				position: "bottom",
			},
			{
				target: "delivery-total",
				title: "Total y Metodo de Pago",
				description:
					'Monto total y como paga el cliente. Si dice "efectivo", tenes que cobrar al entregar.',
				position: "top",
			},
			{
				target: "delivery-gps",
				title: "GPS en Vivo",
				description:
					"Tu ubicacion se comparte automaticamente con el cliente. El te puede ver en un mapa en tiempo real.",
				position: "top",
			},
			{
				target: "delivery-complete",
				title: "Marcar Entregado",
				description:
					'Cuando entregas el pedido, toca este boton. El pedido pasa a "entregado" y se cierra.',
				position: "top",
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
				position: "bottom",
			},
			{
				target: "admin-kpi-revenue",
				title: "Facturacion",
				description:
					"Total cobrado en el dia sumando todos los metodos de pago.",
				position: "bottom",
			},
			{
				target: "admin-kpi-costs",
				title: "Costos",
				description:
					"Costo estimado de ingredientes usados, calculado desde las recetas de cada producto.",
				position: "bottom",
			},
			{
				target: "admin-kpi-margin",
				title: "Margen",
				description:
					"Facturacion menos costos. Indica la rentabilidad bruta del dia.",
				position: "bottom",
			},
			{
				target: "admin-quick-links",
				title: "Accesos Rapidos",
				description:
					"Links directos a cada modulo: Menu, Mesas, Empleados, Gastos, Caja, etc.",
				position: "top",
			},
			{
				target: "admin-sidebar",
				title: "Menu Lateral",
				description:
					"Navegacion completa a todos los modulos de administracion. En celular, se abre con el icono de hamburguesa.",
				position: "right",
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
				position: "right",
			},
			{
				target: "menu-product-list",
				title: "Lista de Productos",
				description:
					"Productos de la categoria seleccionada. Cada uno muestra nombre, precio y estado de disponibilidad.",
				position: "bottom",
			},
			{
				target: "menu-add-product",
				title: "Agregar Producto",
				description:
					"Crea un nuevo producto con: nombre, descripcion, precio de venta, precio de costo, destino (cocina/barra), y categoria.",
				position: "bottom",
			},
			{
				target: "menu-toggle-available",
				title: "Activar/Desactivar",
				description:
					"El toggle activa o desactiva un producto. Los desactivados no aparecen en el menu del mozo ni del cliente.",
				position: "left",
			},
			{
				target: "menu-recipe",
				title: "Receta (Ingredientes)",
				description:
					'Vincula ingredientes a un producto. Ej: "Gin Tonic" usa 60ml Gin + 200ml Tonica. Esto permite calcular costos automaticamente.',
				position: "top",
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
				position: "bottom",
			},
			{
				target: "tables-add",
				title: "Agregar Mesa",
				description:
					"Crea una mesa nueva con numero, zona, tipo y cantidad de asientos.",
				position: "bottom",
			},
			{
				target: "tables-zones",
				title: "Zonas",
				description:
					'Gestiona zonas del local: "Salon Principal", "Terraza", "VIP". Cada mesa pertenece a una zona.',
				position: "right",
			},
			{
				target: "tables-qr",
				title: "Generar QR",
				description:
					"Genera un codigo QR unico por mesa. El cliente lo escanea para ver el menu o hacer pedidos directos.",
				position: "top",
			},
			{
				target: "tables-qr-download",
				title: "Descargar QRs",
				description:
					"Descarga QRs individuales o todos en un ZIP. Imprimilos y pegalos en cada mesa.",
				position: "top",
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
				position: "bottom",
			},
			{
				target: "emp-add",
				title: "Nuevo Empleado",
				description:
					"Crea un empleado con nombre y rol. El sistema genera un PIN automaticamente, o podes elegir uno.",
				position: "bottom",
			},
			{
				target: "emp-pin",
				title: "PIN de Acceso",
				description:
					"Este es el PIN que el empleado usa para ingresar al sistema. Compartilo de forma segura.",
				position: "left",
			},
			{
				target: "emp-role",
				title: "Rol",
				description:
					"Define que pantallas puede ver: admin, manager, cajero, mozo, cocina, barra o repartidor.",
				position: "right",
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
				position: "bottom",
			},
			{
				target: "supplier-add",
				title: "Nuevo Proveedor",
				description:
					"Agrega un proveedor con: nombre, CUIT, direccion, telefono, email y categoria.",
				position: "bottom",
			},
			{
				target: "supplier-invoices",
				title: "Facturas del Proveedor",
				description:
					"Cada proveedor tiene sus facturas vinculadas. Podes ver historial de compras y montos.",
				position: "top",
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
				position: "bottom",
			},
			{
				target: "expense-add",
				title: "Registrar Gasto",
				description:
					"Nuevo gasto con: monto, categoria, descripcion, fecha, proveedor (opcional) y metodo de pago.",
				position: "bottom",
			},
			{
				target: "expense-recurring",
				title: "Gasto Recurrente",
				description:
					"Marca un gasto como recurrente (ej: alquiler dia 1 de cada mes). El sistema lo recuerda.",
				position: "right",
			},
			{
				target: "expense-filter",
				title: "Filtrar por Fecha",
				description:
					"Selecciona un rango de fechas para ver gastos de un periodo especifico.",
				position: "bottom",
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
				position: "bottom",
			},
			{
				target: "cash-movements",
				title: "Movimientos",
				description:
					"Cada cobro en efectivo y cada gasto se registra automaticamente. Tambien podes agregar movimientos manuales.",
				position: "bottom",
			},
			{
				target: "cash-balance",
				title: "Saldo Actual",
				description:
					"El saldo teorico calculado: apertura + ingresos - egresos. Deberia coincidir con lo que hay en la caja.",
				position: "right",
			},
			{
				target: "cash-close",
				title: "Cerrar Caja",
				description:
					"Al final del turno: conta el dinero, ingresa el monto real, y el sistema calcula la diferencia (cuadre).",
				position: "top",
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
				position: "bottom",
			},
			{
				target: "accounting-budget",
				title: "Presupuesto vs Real",
				description:
					"Compara lo presupuestado con lo gastado realmente. Las barras rojas indican que se excedio el presupuesto.",
				position: "bottom",
			},
			{
				target: "accounting-payment-breakdown",
				title: "Desglose por Metodo de Pago",
				description:
					"Cuanto entro por efectivo, tarjeta, MercadoPago y transferencia. Util para negociar comisiones.",
				position: "top",
			},
			{
				target: "accounting-date-filter",
				title: "Filtro de Fechas",
				description:
					"Selecciona el periodo a analizar: dia, semana, mes o rango personalizado.",
				position: "bottom",
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
				position: "bottom",
			},
			{
				target: "invoice-create",
				title: "Nueva Factura",
				description:
					"Crea una factura: selecciona tipo (A/B/C), datos del cliente, items con IVA. El total se calcula automaticamente.",
				position: "bottom",
			},
			{
				target: "invoice-send-afip",
				title: "Enviar a AFIP",
				description:
					"Envia la factura a AFIP. Si todo esta bien, recibis el CAE (Codigo de Autorizacion Electronico) y la factura queda emitida.",
				position: "top",
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
				position: "bottom",
			},
			{
				target: "mp-user-id",
				title: "User ID",
				description:
					"El ID del vendedor/cobrador en MercadoPago. Se usa para generar QRs de punto de venta.",
				position: "bottom",
			},
			{
				target: "mp-pos-id",
				title: "POS ID",
				description:
					"Identificador del punto de venta fisico. Se crea en MP para habilitar cobros QR presenciales.",
				position: "bottom",
			},
			{
				target: "mp-webhook",
				title: "Webhook Secret",
				description:
					"Clave secreta para verificar las notificaciones de pago. Garantiza que solo MP pueda confirmar pagos.",
				position: "bottom",
			},
			{
				target: "mp-transfer-alias",
				title: "Alias de Transferencia",
				description:
					"El alias bancario (CVU/CBU) que se muestra a clientes cuando eligen pagar por transferencia. Ej: myway.bar",
				position: "bottom",
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
				position: "bottom",
			},
			{
				target: "afip-razon",
				title: "Razon Social",
				description: "Nombre legal del negocio como figura en AFIP.",
				position: "bottom",
			},
			{
				target: "afip-regime",
				title: "Regimen Fiscal",
				description:
					"Monotributo o Responsable Inscripto. Define que tipos de factura podes emitir.",
				position: "bottom",
			},
			{
				target: "afip-certs",
				title: "Certificados",
				description:
					"Archivos PEM (certificado + clave privada) que se obtienen de AFIP. Necesarios para firmar facturas.",
				position: "bottom",
			},
			{
				target: "afip-auto",
				title: "Auto-Facturacion",
				description:
					"Activa para que se genere factura automaticamente al cobrar con cada metodo de pago.",
				position: "top",
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
				position: "bottom",
			},
			{
				target: "admin-delivery-assign",
				title: "Asignar Repartidor",
				description:
					"Selecciona un repartidor para cada pedido. Aparecen los repartidores disponibles.",
				position: "right",
			},
			{
				target: "admin-delivery-map",
				title: "Mapa de Flota",
				description:
					"Mapa en tiempo real con la ubicacion de todos los repartidores activos.",
				position: "top",
			},
		],
	},
];
