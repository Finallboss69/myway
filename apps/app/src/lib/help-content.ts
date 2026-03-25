export interface HelpItem {
	title: string;
	description: string;
}

export interface HelpSection {
	sectionTitle: string;
	items: HelpItem[];
	role?: string;
}

export const helpContent: Record<string, HelpSection> = {
	// ═══════════════════════════════════════════════════════════════════════════
	// ADMIN — Panel de administración (Dueño / Manager)
	// ═══════════════════════════════════════════════════════════════════════════

	dashboard: {
		sectionTitle: "Dashboard",
		role: "Admin",
		items: [
			{
				title: "Métricas del día en tiempo real",
				description:
					"Todos los indicadores principales se actualizan automáticamente: pedidos abiertos, ingresos del día, costos estimados y ganancia bruta. No necesitás refrescar la página.",
			},
			{
				title: "Estado de mesas del salón",
				description:
					"Muestra cuántas mesas están disponibles (verde), ocupadas (dorado) y reservadas (violeta). Hacé clic en cualquier indicador para ir al plano del salón.",
			},
			{
				title: "Pedidos activos por estado",
				description:
					"Conteo de pedidos según su estado: pendientes de preparar, en preparación, listos para servir y pendientes de cobro. Permite detectar cuellos de botella.",
			},
			{
				title: "Alertas de stock bajo",
				description:
					"Cuando un ingrediente baja del mínimo configurado, aparece una alerta roja. Hacé clic para ir directamente a Proveedores y gestionar la reposición.",
			},
		],
	},

	menu: {
		sectionTitle: "Gestión del Menú",
		role: "Admin",
		items: [
			{
				title: "Agregar productos al menú",
				description:
					'Hacé clic en "+ Nuevo Producto" para crear un plato, bebida o ítem. Ingresá nombre, precio, descripción y seleccioná la categoría. Elegí si va a Cocina o Bar según dónde se prepara.',
			},
			{
				title: "Editar o eliminar productos",
				description:
					"Hacé clic en cualquier producto para abrir el editor. Podés cambiar nombre, precio, descripción, categoría o destino (Cocina/Bar). Para eliminar, usá el botón rojo de la tarjeta.",
			},
			{
				title: "Activar o desactivar disponibilidad",
				description:
					"Si un producto se agotó, usá el switch para desactivarlo. Aparecerá tachado en el menú del cliente pero no se borra. Cuando vuelva, activalo de nuevo.",
			},
			{
				title: "Organizar categorías",
				description:
					"Creá, editá o reordená las categorías del menú (Entradas, Platos, Tragos, Cervezas, etc.). Arrastrá para cambiar el orden. El ícono de cada categoría se muestra en el menú del cliente.",
			},
			{
				title: "Recetas e ingredientes",
				description:
					"Asigná ingredientes a cada producto con la cantidad necesaria. El sistema calcula automáticamente el costo de elaboración y actualiza cuando cambian los precios de los proveedores.",
			},
			{
				title: "Análisis de rentabilidad",
				description:
					"Visualizá el margen de ganancia de cada producto: precio de venta vs costo de ingredientes. Los productos con margen menor al 30% se resaltan en rojo para que puedas ajustar precios.",
			},
		],
	},

	employees: {
		sectionTitle: "Gestión de Empleados",
		role: "Admin",
		items: [
			{
				title: "Agregar empleados",
				description:
					'Hacé clic en "+ Nuevo empleado" para crear un miembro del equipo. Ingresá nombre, seleccioná un avatar y asigná el rol: Mozo, Cocina, Bar, Cajero, Admin, Manager o Repartidor.',
			},
			{
				title: "PIN de acceso",
				description:
					"Cada empleado recibe un PIN de 4-6 dígitos para ingresar a su sección. El PIN se genera automáticamente pero podés cambiarlo. Solo los roles Admin y Manager acceden al panel de administración.",
			},
			{
				title: "Cambiar roles",
				description:
					"Editá el rol de cualquier empleado si cambia de puesto. El rol determina a qué secciones puede acceder: Mozo ve mesas, Cocina ve pedidos de cocina, etc.",
			},
			{
				title: "Eliminar empleados",
				description:
					"Eliminá empleados que ya no trabajan. Su PIN deja de funcionar inmediatamente. Esta acción no se puede deshacer.",
			},
		],
	},

	tables: {
		sectionTitle: "Plano de Mesas & QR",
		role: "Admin",
		items: [
			{
				title: "Agregar mesas al plano",
				description:
					'Hacé clic en "+ Mesa" para crear una nueva mesa en la zona activa. Aparece en el centro del canvas. Arrastrala a la posición deseada.',
			},
			{
				title: "Arrastrar y posicionar",
				description:
					"Hacé clic y arrastrá cualquier mesa para moverla. La posición se guarda automáticamente con un sistema de grilla de 20px para mantener todo alineado.",
			},
			{
				title: "Cambiar forma y tamaño",
				description:
					"Seleccioná una mesa y usá el panel derecho para cambiar su forma (Cuadrada, Redonda, Rectangular, Pool), número de sillas, y tamaño. Arrastrá la esquina inferior derecha para redimensionar.",
			},
			{
				title: "Gestionar zonas del salón",
				description:
					'Creá zonas como "Salón Principal", "Terraza", "VIP", etc. Cada zona tiene su propio plano. Las mesas se asignan a una zona y aparecen en el mapa correspondiente.',
			},
			{
				title: "Descargar QR individual",
				description:
					"Seleccioná una mesa y hacé clic en el botón de descarga del QR. El código QR lleva al menú digital con el número de mesa ya cargado para que el cliente pida directo.",
			},
			{
				title: "Descargar todos los QR en ZIP",
				description:
					'Usá el botón "QR ZIP" en la barra superior para descargar TODOS los códigos QR en un archivo comprimido. Cada imagen incluye el nombre de la zona y el número de mesa. Ideal para imprimir.',
			},
			{
				title: "Zoom del canvas",
				description:
					"Usá los controles de zoom (+/-) en la esquina superior para acercar o alejar el plano. El botón de reset vuelve al 100%.",
			},
		],
	},

	suppliers: {
		sectionTitle: "Proveedores",
		role: "Admin",
		items: [
			{
				title: "Registrar proveedores",
				description:
					"Cargá cada proveedor con CUIT, teléfono, email, dirección y categoría (Bebidas, Carnes, Verduras, etc.). Esto permite trackear a quién le comprás cada ingrediente.",
			},
			{
				title: "Gestionar ingredientes",
				description:
					"Cada proveedor tiene su lista de ingredientes con precio unitario y unidad de medida (kg, litro, unidad). Al actualizar un precio acá, se recalculan automáticamente los costos de los productos.",
			},
			{
				title: "Historial de precios",
				description:
					"El sistema guarda cada cambio de precio con fecha. Podés ver la evolución y detectar aumentos para negociar mejores condiciones.",
			},
			{
				title: "Alertas de stock bajo",
				description:
					"Configurá el stock mínimo de cada ingrediente. Cuando baje de ese nivel, aparece una alerta en el Dashboard y acá con el proveedor correspondiente.",
			},
			{
				title: "Facturas de compra",
				description:
					"Registrá las facturas de cada compra con fecha, monto y detalle. Permite llevar control de lo que gastás con cada proveedor por período.",
			},
		],
	},

	expenses: {
		sectionTitle: "Control de Gastos",
		role: "Admin",
		items: [
			{
				title: "Registrar un gasto",
				description:
					'Hacé clic en "+ Nuevo Gasto" e ingresá: categoría, monto, método de pago, fecha y descripción. Opcionalmente podés vincularlo a un proveedor.',
			},
			{
				title: "Categorías de gastos",
				description:
					"Los gastos se organizan en categorías: Servicios, Alquiler, Sueldos, Insumos, Mantenimiento, etc. Esto permite analizar en qué gastás más.",
			},
			{
				title: "Filtrar por proveedor y fecha",
				description:
					"Usá los filtros para ver gastos de un proveedor específico o un rango de fechas. Ideal para conciliar pagos y controlar el presupuesto mensual.",
			},
			{
				title: "Resumen y presupuesto",
				description:
					"Visualizá un resumen con gráficos de gastos por categoría. Compará contra el presupuesto mensual para detectar desvíos a tiempo.",
			},
		],
	},

	delivery: {
		sectionTitle: "Gestión de Delivery",
		role: "Admin",
		items: [
			{
				title: "Panel de pedidos activos",
				description:
					"Ves todos los pedidos de delivery organizados por estado: Pendiente → Preparando → Listo → En camino → Entregado. Cada tarjeta muestra cliente, dirección, monto y tiempo transcurrido.",
			},
			{
				title: "Avanzar estado de un pedido",
				description:
					"Hacé clic en el botón de avance de cada tarjeta para cambiar el estado. El cliente recibe actualización en tiempo real en su link de tracking.",
			},
			{
				title: "Filtrar por estado",
				description:
					"Usá las pestañas de filtro para ver solo pedidos de un estado específico: Pendientes, Preparando, Listos, En camino, Entregados o Cancelados.",
			},
			{
				title: "Datos del cliente y tiempos",
				description:
					"Cada pedido muestra nombre, dirección, teléfono, método de pago y el tiempo desde que se creó. Los tiempos mayores a 20 minutos se resaltan en rojo.",
			},
			{
				title: "KPIs de delivery",
				description:
					"En la parte superior ves los números clave: facturación total, pedidos pendientes, en preparación, en camino y entregados del día.",
			},
		],
	},

	cashRegister: {
		sectionTitle: "Caja Registradora",
		role: "Admin",
		items: [
			{
				title: "Abrir caja del turno",
				description:
					'Al inicio del turno, hacé clic en "Abrir caja" e ingresá el monto inicial con el que arrancás. Solo puede haber una caja abierta a la vez.',
			},
			{
				title: "Registrar movimientos",
				description:
					"Anotá ingresos (cobros) y egresos (gastos, vueltos) con concepto, monto y método de pago. Los pedidos cobrados se registran automáticamente.",
			},
			{
				title: "Cerrar caja",
				description:
					"Al final del turno, cerrá la caja. El sistema calcula: monto inicial + ingresos - egresos = monto esperado. Ingresá el conteo real para ver la diferencia.",
			},
			{
				title: "Historial de cajas",
				description:
					"Consultá el historial de aperturas y cierres de caja con todos los movimientos detallados. Podés filtrar por fecha.",
			},
		],
	},

	analytics: {
		sectionTitle: "Analíticas y Reportes",
		role: "Admin",
		items: [
			{
				title: "Ingresos y ganancias",
				description:
					"Gráficos de ingresos, costos y ganancia neta por día, semana o mes. Identificá tendencias de crecimiento o caída rápidamente.",
			},
			{
				title: "Ranking de productos",
				description:
					"Top productos por cantidad vendida e ingresos generados. Identificá qué funciona mejor y qué productos podrías descontinuar.",
			},
			{
				title: "Distribución de métodos de pago",
				description:
					"Qué porcentaje se cobra en efectivo, tarjeta, MercadoPago o transferencia. Útil para negociar comisiones con procesadores de pago.",
			},
			{
				title: "Márgenes por producto",
				description:
					"Compará precio de venta vs costo de ingredientes de cada producto. Encontrá los de mayor y menor rentabilidad.",
			},
			{
				title: "Reportes diarios automáticos",
				description:
					"Cada día se genera un resumen con: total facturado, costos de ingredientes, gastos operativos, ganancia bruta y neta.",
			},
		],
	},

	invoices: {
		sectionTitle: "Facturación Electrónica",
		role: "Admin",
		items: [
			{
				title: "Crear facturas",
				description:
					"Generá facturas tipo A, B o C. Ingresá los ítems con cantidades y precios. El sistema calcula IVA según el tipo de factura y régimen fiscal configurado.",
			},
			{
				title: "Enviar a AFIP",
				description:
					"Las facturas se transmiten a AFIP electrónicamente para obtener el CAE (Código de Autorización Electrónica). Requiere tener el certificado configurado en Config AFIP.",
			},
			{
				title: "Estados de factura",
				description:
					"Cada factura muestra su estado: Borrador (sin enviar), Autorizada (CAE obtenido) o Rechazada (error de AFIP con detalle del motivo).",
			},
			{
				title: "Buscar e imprimir",
				description:
					"Buscá facturas por número, fecha, cliente o estado. Podés imprimir o descargar en PDF cada una con todos los datos fiscales.",
			},
		],
	},

	accounting: {
		sectionTitle: "Contabilidad",
		role: "Admin",
		items: [
			{
				title: "Cobrar pedidos",
				description:
					"Seleccioná el método de pago (Efectivo, MercadoPago, Tarjeta, Transferencia) y cerrá el pedido. Se registra automáticamente como ingreso en la caja.",
			},
			{
				title: "Historial de cobros",
				description:
					"Consultá todos los cobros realizados con fecha, monto, método de pago y pedido asociado. Filtrá por rango de fechas.",
			},
			{
				title: "Resumen financiero",
				description:
					"Vista consolidada de ingresos, gastos, facturas emitidas y balance general. Todos los números del negocio en un solo lugar.",
			},
		],
	},

	afipConfig: {
		sectionTitle: "Configuración AFIP",
		role: "Admin",
		items: [
			{
				title: "Datos fiscales del negocio",
				description:
					"Configurá CUIT, razón social, dirección fiscal e Ingresos Brutos. Seleccioná tu régimen: Responsable Inscripto, Monotributista o Exento.",
			},
			{
				title: "Número de punto de venta",
				description:
					"Ingresá el número de punto de venta asignado por AFIP (ej: 0001). Este número aparece en todas las facturas electrónicas.",
			},
			{
				title: "Certificado digital",
				description:
					"Subí el certificado (.pem) y clave privada que emite AFIP para firmar facturas. Sin esto no podés facturar electrónicamente.",
			},
			{
				title: "Modo de pruebas (Homologación)",
				description:
					"Activá el entorno de testing de AFIP para probar la facturación sin generar documentos reales. Desactivalo cuando estés listo para producción.",
			},
			{
				title: "Auto-facturación por método de pago",
				description:
					"Configurá facturación automática: cuando un pedido se cobra con MercadoPago, efectivo o tarjeta, el sistema genera la factura correspondiente sin intervención manual.",
			},
		],
	},

	repartidores: {
		sectionTitle: "Mapa GPS de Repartidores",
		role: "Admin",
		items: [
			{
				title: "Mapa en tiempo real",
				description:
					"Mapa interactivo con la ubicación de cada repartidor activo. Los pins se actualizan cada 5 segundos. Hacé clic en un pin para ver el detalle del pedido.",
			},
			{
				title: "Pedidos en tránsito",
				description:
					"Cada marcador muestra: nombre del repartidor, pedido que lleva, dirección de entrega y monto total. Identificá rápidamente quién lleva qué.",
			},
			{
				title: "Estado de conexión GPS",
				description:
					"Si un repartidor pierde la señal GPS, su pin se muestra gris. Esto permite detectar problemas de conectividad y tomar acción.",
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// POS — Punto de Venta (Cajero)
	// ═══════════════════════════════════════════════════════════════════════════

	posSalon: {
		sectionTitle: "Salón — Punto de Venta",
		role: "Cajero",
		items: [
			{
				title: "Plano visual del salón",
				description:
					"Ves las mesas organizadas por zona tal como están en el local. Cada mesa muestra su número, estado (Libre/Ocupada/Reservada) y cantidad de sillas.",
			},
			{
				title: "Colores de estado",
				description:
					"Verde = Libre (disponible para clientes). Dorado = Ocupada (tiene un pedido activo, muestra el tiempo transcurrido). Violeta = Reservada.",
			},
			{
				title: "Abrir una mesa",
				description:
					"Hacé clic en cualquier mesa para ir a su detalle. Si está libre, podés crear un pedido nuevo. Si está ocupada, ves el pedido actual y podés agregar ítems o cobrar.",
			},
			{
				title: "Cambiar de zona",
				description:
					"Usá las pestañas en la barra superior para cambiar entre zonas (Salón, Terraza, VIP, etc.). Cada zona muestra solo sus mesas.",
			},
			{
				title: "Panel derecho — Resumen del día",
				description:
					"A la derecha ves los ingresos del día, ticket promedio, y la lista de pedidos activos con tiempo transcurrido. Hacé clic en un pedido para ir a la mesa.",
			},
			{
				title: "Ver lista de pedidos",
				description:
					'Hacé clic en "Ver Pedidos" en la parte inferior para ir a la vista de lista de todos los pedidos activos con más detalle.',
			},
		],
	},

	posOrders: {
		sectionTitle: "Lista de Pedidos — POS",
		role: "Cajero",
		items: [
			{
				title: "Todos los pedidos activos",
				description:
					"Vista de lista con todos los pedidos abiertos ordenados por antigüedad. Cada tarjeta muestra: mesa, estado, ítems, monto total y tiempo.",
			},
			{
				title: "Filtrar por estado",
				description:
					"Filtrá pedidos por estado: Pendiente (sin preparar), Preparando, Listo (para servir/cobrar) o todos. Ideal para priorizar.",
			},
			{
				title: "Ir al detalle de mesa",
				description:
					"Hacé clic en cualquier pedido para ir al detalle de esa mesa donde podés agregar ítems, ver el estado de cada plato o cobrar.",
			},
			{
				title: "Tiempos de espera",
				description:
					"Los tiempos se muestran en minutos. Después de 10 min se ponen amarillos, después de 20 min rojos. Esto ayuda a detectar demoras.",
			},
		],
	},

	posTableDetail: {
		sectionTitle: "Detalle de Mesa — POS",
		role: "Cajero",
		items: [
			{
				title: "Ver pedido actual",
				description:
					"Todos los ítems del pedido con nombre, cantidad, precio y estado individual (Pendiente, Preparando, Listo, Entregado). El total se calcula automáticamente.",
			},
			{
				title: "Agregar productos",
				description:
					"Seleccioná categoría, elegí productos y ajustá cantidades. Cada producto se envía automáticamente a Cocina o Bar según su configuración.",
			},
			{
				title: "Notas para cocina/bar",
				description:
					'Agregá notas especiales a cualquier ítem: "sin TACC", "bien cocido", "extra hielo", etc. La nota aparece en la pantalla de Cocina/Bar.',
			},
			{
				title: "Cobrar el pedido",
				description:
					'Cuando todo esté listo, hacé clic en "Cobrar". Seleccioná el método de pago (Efectivo, Tarjeta, MercadoPago, Transferencia). El pedido se cierra y la mesa queda libre.',
			},
			{
				title: "Cancelar ítems",
				description:
					'Si el cliente cancela algo, cambiá el estado del ítem a "Cancelado". Se descuenta del total automáticamente. Los ítems ya preparados requieren confirmación.',
			},
			{
				title: "Transferir mesa",
				description:
					"Si el cliente se cambia de mesa, podés mover el pedido a otra mesa sin perder los ítems ni el tiempo transcurrido.",
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// COCINA — Pantalla de Cocina
	// ═══════════════════════════════════════════════════════════════════════════

	kitchenBoard: {
		sectionTitle: "Pantalla de Cocina",
		role: "Cocina",
		items: [
			{
				title: "Pedidos en tiempo real",
				description:
					"Los pedidos nuevos aparecen automáticamente apenas el mozo o cajero los carga. No necesitás refrescar la pantalla. Se actualiza cada 3 segundos.",
			},
			{
				title: "Solo ítems de cocina",
				description:
					'Esta pantalla muestra SOLO los productos marcados como "Cocina" en el menú. Las bebidas y tragos van a la pantalla del Bar.',
			},
			{
				title: "Columnas por estado",
				description:
					"Los pedidos se organizan en columnas: PENDIENTE (nuevos, sin empezar), PREPARANDO (en proceso) y LISTO (terminados, esperando mozo). Arrastrá entre columnas o usá los botones.",
			},
			{
				title: "Cambiar estado de un ítem",
				description:
					'Hacé clic en el botón de avance de cada ítem para moverlo al siguiente estado. "Iniciar" lo pasa a Preparando, "Listo" indica que está terminado.',
			},
			{
				title: "Notas especiales",
				description:
					"Las notas del mozo aparecen resaltadas debajo de cada ítem: alergias, preferencias de cocción, etc. Prestá especial atención a las notas en rojo.",
			},
			{
				title: "Tiempos por pedido",
				description:
					"Cada tarjeta muestra el tiempo desde que se hizo el pedido. Los tiempos mayores a 15 min se ponen amarillos, mayores a 25 min rojos.",
			},
			{
				title: "Indicador de conexión",
				description:
					"Arriba a la derecha hay un indicador: verde = conectado y recibiendo actualizaciones. Rojo = sin conexión, los pedidos nuevos no aparecerán hasta que se reconecte.",
			},
		],
	},

	kitchenStock: {
		sectionTitle: "Stock de Cocina",
		role: "Cocina",
		items: [
			{
				title: "Inventario de ingredientes",
				description:
					"Lista de todos los ingredientes que usa la cocina con stock actual, unidad de medida y nivel de alerta. Los que están por debajo del mínimo aparecen en rojo.",
			},
			{
				title: "Actualizar stock",
				description:
					"Cuando recibís mercadería, actualizá las cantidades. Ingresá la cantidad recibida y el sistema suma al stock actual.",
			},
			{
				title: "Alertas de reposición",
				description:
					"Los ingredientes con stock bajo al mínimo configurado se resaltan. Esta información también aparece en el Dashboard del administrador.",
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// BAR — Pantalla del Bar
	// ═══════════════════════════════════════════════════════════════════════════

	barBoard: {
		sectionTitle: "Pantalla del Bar",
		role: "Bar",
		items: [
			{
				title: "Pedidos de bebidas en tiempo real",
				description:
					'Aparecen automáticamente todos los pedidos de tragos y bebidas. Solo se muestran ítems marcados como "Bar" en el menú. La pantalla se refresca sola cada 3 segundos.',
			},
			{
				title: "Columnas por estado",
				description:
					"PENDIENTE = pedidos nuevos. PREPARANDO = en proceso de preparación. LISTO = terminado, esperando que el mozo lo retire. Avanzá el estado con los botones de cada ítem.",
			},
			{
				title: "Identificar la mesa de cada pedido",
				description:
					"Cada tarjeta muestra el número de mesa. Los pedidos de pool (mesas de billar) se identifican con un ícono verde especial.",
			},
			{
				title: "Notas del mozo",
				description:
					'Las notas especiales del mozo aparecen resaltadas: "con hielo", "sin alcohol", "doble", etc. Revisalas antes de preparar.',
			},
			{
				title: "Tiempos de preparación",
				description:
					"El reloj muestra cuánto tiempo pasó desde el pedido. Las bebidas deberían salir rápido — los tiempos mayores a 5 min se marcan en amarillo.",
			},
			{
				title: "Indicador de conexión",
				description:
					"El ícono WiFi arriba indica el estado de la conexión. Verde = recibiendo pedidos. Rojo = desconectado, verificá la red.",
			},
		],
	},

	barStock: {
		sectionTitle: "Stock del Bar",
		role: "Bar",
		items: [
			{
				title: "Inventario de bebidas e insumos",
				description:
					"Control de stock de todos los insumos del bar: botellas, mixers, hielo, frutas, etc. con cantidad actual y nivel de alerta.",
			},
			{
				title: "Registrar mercadería",
				description:
					"Cuando recibís botellas o insumos, actualizá el stock acá. El sistema lleva el historial de movimientos.",
			},
			{
				title: "Alertas de faltantes",
				description:
					"Los productos con stock bajo aparecen en rojo. Avisá al encargado para que gestione la reposición con el proveedor.",
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// MOZO — Sección del Mozo
	// ═══════════════════════════════════════════════════════════════════════════

	waiterTables: {
		sectionTitle: "Mis Mesas",
		role: "Mozo",
		items: [
			{
				title: "Vista de mesas asignadas",
				description:
					"Ves todas las mesas del salón con su estado actual. Las mesas ocupadas muestran el tiempo desde que se abrió el pedido y la cantidad de ítems.",
			},
			{
				title: "Tomar un nuevo pedido",
				description:
					"Tocá una mesa libre para crear un pedido nuevo. Seleccioná los productos del menú, ajustá cantidades y agregá notas especiales para cocina o bar.",
			},
			{
				title: "Agregar ítems a mesa ocupada",
				description:
					"Tocá una mesa ocupada para ver el pedido actual. Podés agregar más productos al pedido en cualquier momento.",
			},
			{
				title: "Colores de estado",
				description:
					"Verde = mesa libre, disponible. Dorado = ocupada con pedido activo. Violeta = reservada. El tiempo en minutos aparece para mesas ocupadas.",
			},
		],
	},

	waiterTableDetail: {
		sectionTitle: "Detalle de Mesa — Mozo",
		role: "Mozo",
		items: [
			{
				title: "Ver ítems del pedido",
				description:
					"Cada ítem muestra: nombre, cantidad, precio y estado de preparación. Sabés exactamente qué está pendiente, qué se está haciendo y qué ya está listo.",
			},
			{
				title: "Agregar productos",
				description:
					"Usá el menú de categorías para agregar más productos. Tocá + para sumar cantidad, - para restar. Confirmá para enviar a cocina/bar.",
			},
			{
				title: "Notas especiales",
				description:
					"Escribí notas para la cocina o bar: alergias, preferencias, modificaciones. Aparecen resaltadas en la pantalla de preparación.",
			},
			{
				title: "Estado de cada ítem",
				description:
					"Pendiente = enviado, esperando. Preparando = la cocina/bar está trabajando. Listo = terminado, hay que servirlo. Entregado = ya se lo diste al cliente.",
			},
			{
				title: "Marcar como entregado",
				description:
					'Cuando servís un plato o bebida, marcalo como "Entregado". Esto actualiza el estado general del pedido y avisa al sistema.',
			},
		],
	},

	waiterReady: {
		sectionTitle: "Pedidos Listos",
		role: "Mozo",
		items: [
			{
				title: "Ítems listos para servir",
				description:
					"Acá aparecen todos los ítems que Cocina o Bar terminaron de preparar y están esperando ser servidos. Organizados por mesa para que los busques eficientemente.",
			},
			{
				title: "Marcar como entregado",
				description:
					"Cuando le llevás el plato o trago al cliente, marcalo como entregado. Desaparece de esta lista y se actualiza en el pedido.",
			},
			{
				title: "Prioridad por tiempo",
				description:
					"Los ítems más antiguos aparecen primero. Los que llevan mucho tiempo esperando se resaltan para que los atiendas con prioridad.",
			},
		],
	},

	waiterPayment: {
		sectionTitle: "Cobro de Pedidos",
		role: "Mozo",
		items: [
			{
				title: "Resumen del pedido",
				description:
					"Ves el detalle completo del pedido: cada ítem con cantidad y precio, subtotal y total. Verificá con el cliente antes de cobrar.",
			},
			{
				title: "Seleccionar método de pago",
				description:
					"Elegí cómo paga el cliente: Efectivo, Tarjeta de débito/crédito, MercadoPago o Transferencia. Podés dividir entre métodos si el cliente lo pide.",
			},
			{
				title: "Confirmar cobro",
				description:
					"Al confirmar, el pedido se cierra, la mesa queda libre, y el ingreso se registra automáticamente en la caja del turno.",
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// CLIENTE — Menú digital y Delivery
	// ═══════════════════════════════════════════════════════════════════════════

	customerMenu: {
		sectionTitle: "Menú Digital",
		role: "Cliente",
		items: [
			{
				title: "Navegar el menú",
				description:
					"Explorá las categorías tocando las pestañas arriba: Entradas, Platos, Tragos, Cervezas, Postres, etc. Cada producto muestra foto, nombre, descripción y precio.",
			},
			{
				title: "Agregar al carrito",
				description:
					'Tocá el botón "+" de cualquier producto para sumarlo al carrito. Usá "+" y "-" para ajustar la cantidad. El carrito se muestra abajo con el total.',
			},
			{
				title: "Pedir desde la mesa",
				description:
					"Si escaneaste el QR de tu mesa, el pedido ya sabe a qué mesa va. Solo elegí lo que querés y confirmá. El mozo te lo trae cuando esté listo.",
			},
			{
				title: "Pedir delivery",
				description:
					"Si entraste sin código de mesa, podés pedir delivery. Completá tus datos (nombre, dirección, teléfono) y el método de pago. ¡Te lo llevamos!",
			},
			{
				title: "Productos no disponibles",
				description:
					"Los productos agotados se muestran deshabilitados y no se pueden agregar al carrito. Esto se actualiza en tiempo real.",
			},
		],
	},

	customerCart: {
		sectionTitle: "Tu Carrito",
		role: "Cliente",
		items: [
			{
				title: "Revisar tu pedido",
				description:
					"Ves todos los productos que agregaste con cantidad y precio. El total se calcula automáticamente.",
			},
			{
				title: "Modificar cantidades",
				description:
					"Usá los botones + y - para cambiar la cantidad de cada producto. Para eliminar un ítem, bajá la cantidad a 0.",
			},
			{
				title: "Confirmar pedido",
				description:
					'Tocá "Confirmar pedido" para enviarlo. Si estás en mesa, el pedido va directo a cocina/bar. Si es delivery, te pide los datos de entrega primero.',
			},
			{
				title: "Volver al menú",
				description:
					"Podés volver al menú para seguir agregando productos sin perder lo que ya tenés en el carrito.",
			},
		],
	},

	customerDelivery: {
		sectionTitle: "Datos de Entrega",
		role: "Cliente",
		items: [
			{
				title: "Completar dirección",
				description:
					'Ingresá tu dirección completa con calle, número, piso/depto y referencias ("timbre roto", "portón azul", etc.).',
			},
			{
				title: "Datos de contacto",
				description:
					"Ingresá tu nombre y número de teléfono para que el repartidor pueda contactarte cuando esté cerca.",
			},
			{
				title: "Método de pago",
				description:
					"Elegí cómo querés pagar: Efectivo (al recibir), MercadoPago (link de pago), Tarjeta o Transferencia.",
			},
			{
				title: "Confirmar y enviar",
				description:
					"Revisá el resumen y confirmá. Vas a recibir un link de tracking para seguir tu pedido en tiempo real.",
			},
		],
	},

	customerOrderStatus: {
		sectionTitle: "Estado de tu Pedido",
		role: "Cliente",
		items: [
			{
				title: "Seguimiento en tiempo real",
				description:
					"Tu pedido pasa por estas etapas: Recibido → Preparando → Listo → En camino → Entregado. Cada cambio se actualiza automáticamente.",
			},
			{
				title: "Detalle de tu pedido",
				description:
					"Ves el listado de todo lo que pediste con cantidades, precios y el total. Verificá que esté todo correcto.",
			},
			{
				title: "Tiempo estimado",
				description:
					"El temporizador muestra cuánto tiempo pasó desde que hiciste el pedido. El tiempo promedio de entrega depende de la distancia.",
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// REPARTIDOR — App del repartidor
	// ═══════════════════════════════════════════════════════════════════════════

	repartidorOrder: {
		sectionTitle: "Pedido en Entrega",
		role: "Repartidor",
		items: [
			{
				title: "Ver datos de entrega",
				description:
					"Ves nombre del cliente, dirección completa, teléfono de contacto, método de pago y monto total a cobrar (si es efectivo).",
			},
			{
				title: "Detalle de productos",
				description:
					"Lista de todo lo que lleva el pedido con cantidades. Verificá que el paquete esté completo antes de salir.",
			},
			{
				title: "Avanzar estado del pedido",
				description:
					'Usá los botones para cambiar el estado: "Salir a entregar" cuando salgas del local, "Confirmar entrega" cuando el cliente reciba el pedido.',
			},
			{
				title: "GPS y ubicación",
				description:
					"Tu ubicación se comparte con el cliente y el administrador en tiempo real. Mantené el GPS del celular activado para que el seguimiento funcione.",
			},
			{
				title: "Contactar al cliente",
				description:
					"Si necesitás contactar al cliente, tocá el número de teléfono para llamarlo directamente desde el celular.",
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// TRACKING — Seguimiento público del pedido
	// ═══════════════════════════════════════════════════════════════════════════

	trackOrder: {
		sectionTitle: "Seguimiento de Pedido",
		role: "Cliente",
		items: [
			{
				title: "Barra de progreso",
				description:
					"Arriba ves en qué etapa está tu pedido: Recibido → Preparando → En camino → Entregado. La etapa actual se ilumina.",
			},
			{
				title: "Mapa en vivo",
				description:
					"Cuando tu pedido está en camino, aparece un mapa con la ubicación del repartidor actualizada en tiempo real. Sabés exactamente dónde está.",
			},
			{
				title: "Detalle del pedido",
				description:
					"Abajo ves todos los ítems de tu pedido con cantidades, precios y el total. Esta página se actualiza sola, no hace falta refrescar.",
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// DELIVERY — Dashboard de entregas
	// ═══════════════════════════════════════════════════════════════════════════

	deliveryDashboard: {
		sectionTitle: "Panel de Delivery",
		role: "Repartidor",
		items: [
			{
				title: "Pedidos asignados",
				description:
					"Ves los pedidos que te asignaron ordenados por prioridad. Cada tarjeta muestra: dirección, cliente, monto y tiempo desde la creación.",
			},
			{
				title: "Tomar un pedido",
				description:
					'Tocá un pedido para ver el detalle completo y aceptar la entrega. Una vez que salgas, cambiá el estado a "En camino".',
			},
			{
				title: "Historial de entregas",
				description:
					"Ves tus entregas completadas del día con horarios y montos. Útil para llevar control de tu trabajo.",
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════════
	// LOGIN — Pantalla de inicio
	// ═══════════════════════════════════════════════════════════════════════════

	login: {
		sectionTitle: "Ingreso al Sistema",
		role: "Admin",
		items: [
			{
				title: "Seleccionar tu sección",
				description:
					"Elegí a qué parte del sistema querés acceder según tu rol: Administración, Punto de Venta (Caja), Cocina, Bar, Mozo o Delivery.",
			},
			{
				title: "Ingresar tu PIN",
				description:
					"Cada sección te pide un PIN de 4-6 dígitos que te asignó el administrador. El PIN es personal y determina tus permisos.",
			},
			{
				title: "Roles y acceso",
				description:
					"Admin/Manager → Panel de administración completo. Cajero → Punto de venta. Mozo → Mesas y pedidos. Cocina/Bar → Pantalla de preparación. Repartidor → Entregas.",
			},
		],
	},
};
