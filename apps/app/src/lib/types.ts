// ─── Shared domain types ──────────────────────────────────────────────────────

export type TableStatus = "available" | "occupied" | "reserved";
export type TableType = "bar" | "pool";
export type TableShape = "square" | "round" | "rect" | "pool";
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
export type DeliveryStatus =
	| "pending"
	| "preparing"
	| "ready"
	| "en_camino"
	| "delivered"
	| "cancelled";
export type PaymentMethod = "cash" | "mercadopago" | "card" | "transfer";
export type StaffRole =
	| "waiter"
	| "bar"
	| "kitchen"
	| "cashier"
	| "admin"
	| "manager"
	| "repartidor";

export interface Zone {
	id: string;
	name: string;
	order: number;
}

export interface Table {
	id: string;
	number: number;
	zoneId: string;
	type: TableType;
	status: TableStatus;
	seats: number;
	x: number;
	y: number;
	w: number;
	h: number;
	shape: TableShape;
	rotation: number;
}

export interface Category {
	id: string;
	name: string;
	icon: string;
	order: number;
}

export interface Product {
	id: string;
	name: string;
	description: string | null;
	price: number;
	categoryId: string;
	target: "bar" | "kitchen";
	isAvailable: boolean;
	isPoolChip: boolean;
}

export interface Staff {
	id: string;
	name: string;
	role: StaffRole;
	avatar: string;
	pin: string;
}

export interface OrderItem {
	id: string;
	orderId: string;
	productId: string;
	name: string;
	qty: number;
	price: number;
	status: ItemStatus;
	target: "bar" | "kitchen";
	notes: string | null;
}

export interface Order {
	id: string;
	tableId: string;
	tableNumber: number;
	zoneId: string;
	status: OrderStatus;
	waiterName: string | null;
	paymentMethod: string | null;
	createdAt: string; // ISO string
	closedAt: string | null;
	items: OrderItem[];
}

export interface CartItem {
	productId: string;
	name: string;
	price: number;
	qty: number;
	target: "bar" | "kitchen";
	notes?: string;
}

export interface DeliveryOrderItem {
	id: string;
	name: string;
	qty: number;
	price: number;
}

export interface DeliveryOrder {
	id: string;
	customerName: string;
	address: string;
	phone: string | null;
	total: number;
	status: DeliveryStatus;
	paymentMethod: string;
	notes: string | null;
	createdAt: string;
	repartidorLat: number | null;
	repartidorLng: number | null;
	repartidorUpdatedAt: string | null;
	items: DeliveryOrderItem[];
}

export interface TrackingData {
	id: string;
	status: DeliveryStatus;
	repartidorLat: number | null;
	repartidorLng: number | null;
	items: { name: string; qty: number; price: number }[];
	total: number;
	customerName: string;
}

export interface Ingredient {
	id: string;
	name: string;
	unit: string;
	stockCurrent: number;
	alertThreshold: number;
	costPerUnit: number;
}

// ─── API response helpers ─────────────────────────────────────────────────────

export type ApiResponse<T> =
	| { ok: true; data: T }
	| { ok: false; error: string };
