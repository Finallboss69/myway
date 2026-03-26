export interface Role {
	id: string;
	name: string;
	icon: string;
	color: string;
	description: string;
	screens: string[];
}

export const roles: Role[] = [
	{
		id: "waiter",
		name: "Mozo",
		icon: "ConciergeBell",
		color: "#60a5fa",
		description: "Toma pedidos, atiende mesas y cobra a los clientes",
		screens: [
			"waiter-tables",
			"waiter-order",
			"waiter-ready",
			"waiter-payment",
		],
	},
	{
		id: "kitchen",
		name: "Cocina",
		icon: "ChefHat",
		color: "#34d399",
		description: "Prepara los pedidos de comida y controla el stock",
		screens: ["kitchen-board", "kitchen-stock"],
	},
	{
		id: "bar",
		name: "Barra",
		icon: "Wine",
		color: "#c084fc",
		description: "Prepara tragos y bebidas, controla stock de barra",
		screens: ["bar-board", "bar-stock"],
	},
	{
		id: "cashier",
		name: "Cajero / POS",
		icon: "Monitor",
		color: "#fbbf24",
		description: "Gestiona el salon desde el punto de venta visual",
		screens: ["pos-salon", "pos-orders"],
	},
	{
		id: "delivery",
		name: "Repartidor",
		icon: "Bike",
		color: "#f472b6",
		description: "Entrega pedidos y comparte ubicacion GPS",
		screens: ["repartidor-delivery"],
	},
	{
		id: "admin",
		name: "Admin / Manager",
		icon: "Shield",
		color: "#fbbf24",
		description: "Gestion completa: menu, empleados, finanzas, config",
		screens: [
			"admin-dashboard",
			"admin-menu",
			"admin-tables",
			"admin-employees",
			"admin-suppliers",
			"admin-expenses",
			"admin-cash",
			"admin-accounting",
			"admin-invoices",
			"admin-mercadopago",
			"admin-afip",
			"admin-delivery",
		],
	},
];
