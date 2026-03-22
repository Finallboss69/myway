"use client";
import { create } from "zustand";
import {
	TABLES as MOCK_TABLES,
	ORDERS as MOCK_ORDERS,
	INGREDIENTS as MOCK_INGREDIENTS,
	DELIVERY_ORDERS as MOCK_DELIVERY,
	PRODUCTS,
} from "@/data/mock";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TableStatus = "available" | "occupied" | "reserved";
export type TableType = "bar" | "pool";
export type ItemStatus =
	| "pending"
	| "preparing"
	| "ready"
	| "delivered"
	| "cancelled";
export type OrderStatus =
	| "pending"
	| "preparing"
	| "ready"
	| "closed"
	| "cancelled";
export type PaymentMethod = "cash" | "mercadopago" | "card";
export type DeliveryStatus =
	| "pending"
	| "preparing"
	| "on_the_way"
	| "delivered";

export interface Table {
	id: string;
	zoneId: string;
	number: number;
	type: TableType;
	status: TableStatus;
	seats: number;
	x: number;
	y: number;
	w: number;
	h: number;
	currentOrderId?: string;
}

export interface OrderItem {
	id: string;
	productId: string;
	name: string;
	qty: number;
	price: number;
	status: ItemStatus;
	target: "bar" | "kitchen";
	isPoolChip?: boolean;
	notes?: string;
}

export interface Order {
	id: string;
	tableId: string;
	tableNumber: number;
	zoneId: string;
	status: OrderStatus;
	createdAt: Date;
	items: OrderItem[];
	waiterName?: string;
	paymentMethod?: PaymentMethod;
	closedAt?: Date;
}

export interface CartItem {
	productId: string;
	name: string;
	price: number;
	qty: number;
	target: "bar" | "kitchen";
	isPoolChip?: boolean;
	notes?: string;
}

export interface Notification {
	id: string;
	type: "order_ready" | "new_order" | "payment" | "low_stock";
	message: string;
	tableNumber?: number;
	createdAt: Date;
	read: boolean;
}

export interface Ingredient {
	id: string;
	name: string;
	unit: string;
	stockCurrent: number;
	alertThreshold: number;
	costPerUnit: number;
}

export interface DeliveryOrder {
	id: string;
	customerName: string;
	address: string;
	items: { name: string; qty: number; price: number }[];
	total: number;
	status: DeliveryStatus;
	paymentMethod: string;
	createdAt: Date;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AppStore {
	tables: Table[];
	orders: Order[];
	closedOrders: Order[];
	carts: Record<string, CartItem[]>;
	notifications: Notification[];
	ingredients: Ingredient[];
	deliveryOrders: DeliveryOrder[];
	todayRevenue: number;
	todayOrderCount: number;

	// Table actions
	updateTableStatus: (tableId: string, status: TableStatus) => void;

	// Cart actions
	getCart: (tableId: string) => CartItem[];
	addToCart: (tableId: string, item: CartItem) => void;
	removeFromCart: (tableId: string, productId: string) => void;
	updateCartQty: (tableId: string, productId: string, qty: number) => void;
	clearCart: (tableId: string) => void;

	// Order actions
	submitCart: (tableId: string, waiterName?: string) => string | null;
	createOrder: (
		tableId: string,
		items: CartItem[],
		waiterName?: string,
	) => string;
	updateItemStatus: (
		orderId: string,
		itemId: string,
		status: ItemStatus,
	) => void;
	updateOrderStatus: (orderId: string, status: OrderStatus) => void;
	closeTable: (tableId: string, paymentMethod: PaymentMethod) => void;

	// Delivery
	addDeliveryOrder: (order: Omit<DeliveryOrder, "id" | "createdAt">) => void;
	updateDeliveryStatus: (orderId: string, status: DeliveryStatus) => void;

	// Notifications
	markNotificationRead: (id: string) => void;
	clearNotifications: () => void;

	// Getters
	getTableOrders: (tableId: string) => Order[];
	getKitchenOrders: () => Order[];
	getBarOrders: () => Order[];
	getActiveOrders: () => Order[];
	getOrderById: (id: string) => Order | undefined;
	getUnreadCount: () => number;
}

let _orderId = 10;
let _itemId = 20;
let _notifId = 1;
let _deliveryId = 10;

const genOrderId = () => `o${++_orderId}`;
const genItemId = () => `item${++_itemId}`;
const genNotifId = () => `n${++_notifId}`;
const genDeliveryId = () => `d${++_deliveryId}`;

// Convert mock tables
const initTables: Table[] = MOCK_TABLES.map((t) => ({
	...t,
	type: t.type as TableType,
	status: t.status as TableStatus,
}));

// Convert mock orders
const initOrders: Order[] = MOCK_ORDERS.map((o) => ({
	id: o.id,
	tableId: o.tableId,
	tableNumber: o.tableNumber,
	zoneId: initTables.find((t) => t.id === o.tableId)?.zoneId ?? "z1",
	status: o.status as OrderStatus,
	createdAt: o.createdAt,
	items: o.items.map((i) => ({
		id: i.id,
		productId: i.id,
		name: i.name,
		qty: i.qty,
		price: i.price,
		status: i.status as ItemStatus,
		target: i.target as "bar" | "kitchen",
		isPoolChip: i.name === "Ficha de Pool",
	})),
	waiterName: "Lucía Fernández",
}));

// Set currentOrderId on occupied tables
const initTablesWithOrders = initTables.map((t) => {
	const order = initOrders.find(
		(o) => o.tableId === t.id && o.status !== "closed",
	);
	return order ? { ...t, currentOrderId: order.id } : t;
});

const initDelivery: DeliveryOrder[] = MOCK_DELIVERY.map((d) => ({
	...d,
	status: d.status as DeliveryStatus,
	createdAt: d.createdAt,
}));

export const useAppStore = create<AppStore>((set, get) => ({
	tables: initTablesWithOrders,
	orders: initOrders,
	closedOrders: [],
	carts: {},
	notifications: [
		{
			id: "n0",
			type: "order_ready",
			message: "Mesa 3 — Fichas de pool listas",
			tableNumber: 3,
			createdAt: new Date(Date.now() - 2 * 60000),
			read: false,
		},
	],
	ingredients: MOCK_INGREDIENTS.map((i) => ({ ...i })),
	deliveryOrders: initDelivery,
	todayRevenue: 142800,
	todayOrderCount: 47,

	// ─── Tables ─────────────────────────────────────────────────────────────
	updateTableStatus: (tableId, status) =>
		set((s) => ({
			tables: s.tables.map((t) => (t.id === tableId ? { ...t, status } : t)),
		})),

	// ─── Cart ────────────────────────────────────────────────────────────────
	getCart: (tableId) => get().carts[tableId] ?? [],

	addToCart: (tableId, item) =>
		set((s) => {
			const cart = s.carts[tableId] ?? [];
			const existing = cart.find((c) => c.productId === item.productId);
			if (existing) {
				return {
					carts: {
						...s.carts,
						[tableId]: cart.map((c) =>
							c.productId === item.productId
								? { ...c, qty: c.qty + item.qty }
								: c,
						),
					},
				};
			}
			return { carts: { ...s.carts, [tableId]: [...cart, item] } };
		}),

	removeFromCart: (tableId, productId) =>
		set((s) => ({
			carts: {
				...s.carts,
				[tableId]: (s.carts[tableId] ?? []).filter(
					(c) => c.productId !== productId,
				),
			},
		})),

	updateCartQty: (tableId, productId, qty) =>
		set((s) => ({
			carts: {
				...s.carts,
				[tableId]:
					qty <= 0
						? (s.carts[tableId] ?? []).filter((c) => c.productId !== productId)
						: (s.carts[tableId] ?? []).map((c) =>
								c.productId === productId ? { ...c, qty } : c,
							),
			},
		})),

	clearCart: (tableId) =>
		set((s) => ({ carts: { ...s.carts, [tableId]: [] } })),

	// ─── Orders ──────────────────────────────────────────────────────────────
	createOrder: (tableId, items, waiterName) => {
		const table = get().tables.find((t) => t.id === tableId);
		if (!table) return "";
		const orderId = genOrderId();
		const order: Order = {
			id: orderId,
			tableId,
			tableNumber: table.number,
			zoneId: table.zoneId,
			status: "pending",
			createdAt: new Date(),
			waiterName,
			items: items.map((i) => ({
				id: genItemId(),
				productId: i.productId,
				name: i.name,
				qty: i.qty,
				price: i.price,
				status: "pending",
				target: i.target,
				isPoolChip: i.isPoolChip,
				notes: i.notes,
			})),
		};
		const notif: Notification = {
			id: genNotifId(),
			type: "new_order",
			message: `Nuevo pedido — Mesa ${table.number}`,
			tableNumber: table.number,
			createdAt: new Date(),
			read: false,
		};
		set((s) => ({
			orders: [...s.orders, order],
			tables: s.tables.map((t) =>
				t.id === tableId
					? { ...t, status: "occupied", currentOrderId: orderId }
					: t,
			),
			notifications: [notif, ...s.notifications],
		}));
		return orderId;
	},

	submitCart: (tableId, waiterName) => {
		const cart = get().getCart(tableId);
		if (!cart.length) return null;
		const orderId = get().createOrder(tableId, cart, waiterName);
		get().clearCart(tableId);
		return orderId;
	},

	updateItemStatus: (orderId, itemId, status) =>
		set((s) => {
			const orders = s.orders.map((o) => {
				if (o.id !== orderId) return o;
				const items = o.items.map((i) =>
					i.id === itemId ? { ...i, status } : i,
				);
				const allDone = items.every(
					(i) => i.status === "delivered" || i.status === "cancelled",
				);
				const anyPreparing = items.some((i) => i.status === "preparing");
				const allReady = items.every(
					(i) =>
						i.status === "ready" ||
						i.status === "delivered" ||
						i.status === "cancelled",
				);
				const orderStatus: OrderStatus = allDone
					? "ready"
					: allReady
						? "ready"
						: anyPreparing
							? "preparing"
							: o.status;
				return { ...o, items, status: orderStatus };
			});
			const updatedOrder = orders.find((o) => o.id === orderId);
			const notifications = [...s.notifications];
			if (
				updatedOrder &&
				status === "ready" &&
				updatedOrder.items.every(
					(i) =>
						i.status === "ready" ||
						i.status === "delivered" ||
						i.status === "cancelled",
				)
			) {
				notifications.unshift({
					id: genNotifId(),
					type: "order_ready",
					message: `Mesa ${updatedOrder.tableNumber} — pedido listo`,
					tableNumber: updatedOrder.tableNumber,
					createdAt: new Date(),
					read: false,
				});
			}
			return { orders, notifications };
		}),

	updateOrderStatus: (orderId, status) =>
		set((s) => ({
			orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
		})),

	closeTable: (tableId, paymentMethod) => {
		const order = get().orders.find(
			(o) => o.tableId === tableId && o.status !== "closed",
		);
		const table = get().tables.find((t) => t.id === tableId);
		const total = order
			? order.items.reduce((sum, i) => sum + i.price * i.qty, 0)
			: 0;
		set((s) => ({
			orders: s.orders.map((o) =>
				o.tableId === tableId && o.status !== "closed"
					? { ...o, status: "closed", paymentMethod, closedAt: new Date() }
					: o,
			),
			closedOrders: order
				? [
						...s.closedOrders,
						{ ...order, status: "closed", paymentMethod, closedAt: new Date() },
					]
				: s.closedOrders,
			tables: s.tables.map((t) =>
				t.id === tableId
					? { ...t, status: "available", currentOrderId: undefined }
					: t,
			),
			todayRevenue: s.todayRevenue + total,
			todayOrderCount: s.todayOrderCount + 1,
			notifications: [
				{
					id: genNotifId(),
					type: "payment",
					message: `Mesa ${table?.number ?? "?"} cerrada — $${total.toLocaleString("es-AR")}`,
					tableNumber: table?.number,
					createdAt: new Date(),
					read: false,
				},
				...s.notifications,
			],
		}));
	},

	// ─── Delivery ────────────────────────────────────────────────────────────
	addDeliveryOrder: (order) =>
		set((s) => ({
			deliveryOrders: [
				{ ...order, id: genDeliveryId(), createdAt: new Date() },
				...s.deliveryOrders,
			],
		})),

	updateDeliveryStatus: (orderId, status) =>
		set((s) => ({
			deliveryOrders: s.deliveryOrders.map((o) =>
				o.id === orderId ? { ...o, status } : o,
			),
		})),

	// ─── Notifications ───────────────────────────────────────────────────────
	markNotificationRead: (id) =>
		set((s) => ({
			notifications: s.notifications.map((n) =>
				n.id === id ? { ...n, read: true } : n,
			),
		})),

	clearNotifications: () =>
		set((s) => ({
			notifications: s.notifications.map((n) => ({ ...n, read: true })),
		})),

	// ─── Getters ─────────────────────────────────────────────────────────────
	getTableOrders: (tableId) =>
		get().orders.filter((o) => o.tableId === tableId && o.status !== "closed"),

	getKitchenOrders: () =>
		get()
			.orders.filter((o) => o.status !== "closed" && o.status !== "cancelled")
			.map((o) => ({
				...o,
				items: o.items.filter(
					(i) => i.target === "kitchen" && i.status !== "cancelled",
				),
			}))
			.filter((o) => o.items.length > 0),

	getBarOrders: () =>
		get()
			.orders.filter((o) => o.status !== "closed" && o.status !== "cancelled")
			.map((o) => ({
				...o,
				items: o.items.filter(
					(i) => i.target === "bar" && i.status !== "cancelled",
				),
			}))
			.filter((o) => o.items.length > 0),

	getActiveOrders: () =>
		get().orders.filter(
			(o) => o.status !== "closed" && o.status !== "cancelled",
		),

	getOrderById: (id) => get().orders.find((o) => o.id === id),

	getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
