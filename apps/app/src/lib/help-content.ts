interface HelpItem {
	title: string;
	description: string;
}

export const helpContent: Record<
	string,
	{ sectionTitle: string; items: HelpItem[] }
> = {
	dashboard: {
		sectionTitle: "Dashboard",
		items: [
			{
				title: "Ver métricas del día",
				description:
					"Acá ves los indicadores principales: pedidos del día, ingresos, costos y ganancia. Se actualizan en tiempo real.",
			},
			{
				title: "Estado de mesas",
				description:
					"Muestra cuántas mesas están ocupadas, libres y en espera. Te da un panorama rápido del salón.",
			},
			{
				title: "Pedidos activos",
				description:
					"Conteo de pedidos en preparación, listos para servir y pendientes de cobro.",
			},
			{
				title: "Stock bajo",
				description:
					"Alertas de ingredientes que están por debajo del mínimo. Te avisa qué hay que reponer.",
			},
		],
	},

	menu: {
		sectionTitle: "Menú",
		items: [
			{
				title: "Agregar productos",
				description:
					"Creá nuevos platos, bebidas o ítems. Asignalos a una categoría (Bar o Cocina) y poné el precio.",
			},
			{
				title: "Editar / eliminar productos",
				description:
					"Tocá cualquier producto para cambiar nombre, precio, descripción o categoría. También podés eliminarlo.",
			},
			{
				title: "Activar / desactivar disponibilidad",
				description:
					"Si un producto se agotó, desactivalo sin eliminarlo. Cuando vuelva a estar disponible, activalo de nuevo.",
			},
			{
				title: "Gestionar categorías",
				description:
					"Creá, editá o reordená las categorías del menú (Entradas, Platos, Bebidas, etc.).",
			},
			{
				title: "Recetas e ingredientes",
				description:
					"Asigná ingredientes a cada producto con sus cantidades. Así el sistema calcula el costo automáticamente.",
			},
			{
				title: "Análisis de costos",
				description:
					"Visualizá el margen de ganancia de cada producto basado en sus ingredientes. Identificá los más y menos rentables.",
			},
		],
	},

	employees: {
		sectionTitle: "Empleados",
		items: [
			{
				title: "Agregar empleados",
				description:
					"Creá nuevos miembros del equipo con nombre, rol (Mozo, Cocina, Bar, Cajero, Admin, Repartidor) y avatar.",
			},
			{
				title: "Asignar PIN de acceso",
				description:
					"Cada empleado tiene un PIN de 4 dígitos para entrar a su sección. Desde acá podés ver o cambiar el PIN.",
			},
			{
				title: "Cambiar roles",
				description:
					"Si alguien cambia de puesto, editá su rol. Solo los roles 'admin' y 'manager' pueden entrar al panel de administración.",
			},
			{
				title: "Eliminar empleados",
				description:
					"Si alguien ya no trabaja, eliminalo de la lista. Su PIN dejará de funcionar automáticamente.",
			},
		],
	},

	tables: {
		sectionTitle: "Mesas & QR",
		items: [
			{
				title: "Agregar mesas",
				description:
					"Creá nuevas mesas indicando número, capacidad (cantidad de sillas) y zona del salón.",
			},
			{
				title: "Gestionar zonas",
				description:
					"Organizá las mesas por zonas (Salón, Terraza, VIP, etc.). Cada zona agrupa sus mesas.",
			},
			{
				title: "Descargar QR individual",
				description:
					"Cada mesa tiene un código QR único. Al escanearlo, el cliente ve el menú y puede pedir desde su celular.",
			},
			{
				title: "Descargar todos los QR",
				description:
					"Descargá todos los códigos QR en un archivo ZIP para imprimirlos de una sola vez.",
			},
		],
	},

	suppliers: {
		sectionTitle: "Proveedores",
		items: [
			{
				title: "Agregar proveedores",
				description:
					"Registrá proveedores con CUIT, teléfono, email y dirección. Organizalos por categoría.",
			},
			{
				title: "Gestionar ingredientes",
				description:
					"Cargá los ingredientes que comprás a cada proveedor con su precio y unidad de medida.",
			},
			{
				title: "Historial de precios",
				description:
					"El sistema guarda el historial de precios de cada ingrediente para que puedas comparar y negociar.",
			},
			{
				title: "Alertas de stock bajo",
				description:
					"Configurá el stock mínimo de cada ingrediente. Cuando baje, el sistema te avisa.",
			},
			{
				title: "Facturas de proveedores",
				description:
					"Registrá las facturas de compra para llevar el control de lo que gastás con cada proveedor.",
			},
		],
	},

	expenses: {
		sectionTitle: "Gastos",
		items: [
			{
				title: "Registrar gastos",
				description:
					"Anotá cada gasto con monto, categoría, método de pago (Efectivo, Transferencia, Tarjeta, MercadoPago) y fecha.",
			},
			{
				title: "Categorías de gastos",
				description:
					"Organizá los gastos por categoría (Servicios, Alquiler, Sueldos, Insumos, etc.) para mejor control.",
			},
			{
				title: "Ver gastos por proveedor",
				description:
					"Filtrá los gastos por proveedor para ver cuánto le estás pagando a cada uno.",
			},
			{
				title: "Resumen y presupuesto",
				description:
					"Visualizá un resumen con gráficos de tus gastos por categoría y compará contra tu presupuesto mensual.",
			},
		],
	},

	delivery: {
		sectionTitle: "Delivery",
		items: [
			{
				title: "Ver pedidos de delivery",
				description:
					"Listado de todos los pedidos de delivery con estado actual: Pendiente, Preparando, En camino, Entregado.",
			},
			{
				title: "Cambiar estado de pedidos",
				description:
					"Avanzá el estado de cada pedido. El cliente puede seguir el progreso en tiempo real desde su link de tracking.",
			},
			{
				title: "Ver datos del cliente",
				description:
					"Consultá nombre, dirección, teléfono y método de pago de cada pedido.",
			},
			{
				title: "Tiempo de entrega",
				description:
					"El sistema muestra cuánto tiempo pasó desde que se hizo el pedido para controlar los tiempos.",
			},
		],
	},

	cashRegister: {
		sectionTitle: "Caja",
		items: [
			{
				title: "Abrir / cerrar caja",
				description:
					"Abrí la caja al inicio del turno con el monto inicial. Al cerrar, el sistema calcula la diferencia.",
			},
			{
				title: "Registrar movimientos",
				description:
					"Anotá ingresos y egresos con concepto, monto y método de pago. Se vinculan automáticamente con pedidos y gastos.",
			},
			{
				title: "Ver historial por día",
				description:
					"Consultá todos los movimientos de un día específico con el balance final.",
			},
			{
				title: "Imprimir cierre de caja",
				description:
					"Generá e imprimí el resumen de caja del día con todos los movimientos y totales.",
			},
		],
	},

	analytics: {
		sectionTitle: "Analíticas",
		items: [
			{
				title: "Ingresos y ganancias",
				description:
					"Gráficos de ingresos, costos y ganancia neta por día, semana o mes. Identificá tendencias.",
			},
			{
				title: "Productos más vendidos",
				description:
					"Ranking de productos por cantidad vendida e ingresos generados. Sabé qué funciona mejor.",
			},
			{
				title: "Métodos de pago",
				description:
					"Distribución de ventas por método de pago (Efectivo, Tarjeta, MercadoPago, Transferencia).",
			},
			{
				title: "Márgenes por producto",
				description:
					"Compará precio de venta vs costo de ingredientes. Encontrá productos con bajo margen.",
			},
			{
				title: "Reportes diarios",
				description:
					"Resumen automático de cada día: ingresos, costos, gastos, ganancia bruta y neta.",
			},
		],
	},

	invoices: {
		sectionTitle: "Facturación",
		items: [
			{
				title: "Crear facturas",
				description:
					"Generá facturas tipo A, B o C con detalle de ítems, cantidades y precios. Calcula IVA automáticamente.",
			},
			{
				title: "Enviar a AFIP",
				description:
					"Las facturas se envían a AFIP para obtener el CAE (Código de Autorización Electrónica). Requiere configurar AFIP primero.",
			},
			{
				title: "Ver estado de facturas",
				description:
					"Cada factura muestra su estado: Borrador, Autorizada o Rechazada por AFIP.",
			},
			{
				title: "Buscar e imprimir",
				description:
					"Buscá facturas por número, fecha o estado. Podés imprimir o descargar cada una.",
			},
		],
	},

	accounting: {
		sectionTitle: "Contabilidad",
		items: [
			{
				title: "Cobrar pedidos",
				description:
					"Seleccioná el método de pago (Efectivo, MercadoPago, Tarjeta) y cerrá el pedido. Se registra automáticamente en caja.",
			},
			{
				title: "Historial de pagos",
				description:
					"Consultá el historial de todos los cobros realizados con detalle de monto y método.",
			},
			{
				title: "Resumen financiero",
				description:
					"Vista general de ingresos, gastos, facturas y balance. Todos los números en un solo lugar.",
			},
		],
	},

	afipConfig: {
		sectionTitle: "Configuración AFIP",
		items: [
			{
				title: "Datos fiscales",
				description:
					"Configurá tu CUIT, razón social y régimen fiscal (Responsable Inscripto, Monotributista, Exento).",
			},
			{
				title: "Punto de venta",
				description:
					"Ingresá el número de punto de venta asignado por AFIP para la facturación electrónica.",
			},
			{
				title: "Certificado digital",
				description:
					"Subí el certificado (.pem) y la clave privada que te da AFIP para firmar facturas electrónicas.",
			},
			{
				title: "Entorno de pruebas",
				description:
					"Probá la facturación en modo testing antes de usar producción. Así verificás que todo funciona sin riesgos.",
			},
			{
				title: "Auto-facturación",
				description:
					"Activá la facturación automática por método de pago: MercadoPago, Efectivo o Tarjeta. Se genera la factura sola al cobrar.",
			},
		],
	},

	repartidores: {
		sectionTitle: "Mapa GPS",
		items: [
			{
				title: "Seguimiento en tiempo real",
				description:
					"Mapa interactivo con la ubicación actual de cada repartidor. Se actualiza cada 5 segundos.",
			},
			{
				title: "Pedidos en camino",
				description:
					"Cada pin en el mapa muestra el pedido que está llevando: cliente, dirección y monto total.",
			},
			{
				title: "Estado de conexión",
				description:
					"Identificá repartidores que perdieron señal GPS para tomar acción rápidamente.",
			},
		],
	},
};
