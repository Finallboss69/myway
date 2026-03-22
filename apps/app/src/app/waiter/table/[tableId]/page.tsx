"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	Home,
	CheckCircle2,
	CreditCard,
	Plus,
	Minus,
	Send,
	ShoppingCart,
	Loader2,
} from "lucide-react";
import clsx from "clsx";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
	id: string;
	name: string;
	qty: number;
	price: number;
	status: string;
	target: string;
	notes?: string;
}

interface Order {
	id: string;
	tableId: string;
	tableNumber: number;
	status: string;
	createdAt: string;
	items: OrderItem[];
}

interface Product {
	id: string;
	name: string;
	price: number;
	available: boolean;
	target: string;
	categoryId: string;
	category: { id: string; name: string };
}

interface CartItem {
	productId: string;
	name: string;
	qty: number;
	price: number;
	target: string;
}

interface TableInfo {
	id: string;
	number: number;
	status: string;
	type: string;
}

// ─── Polling hook ─────────────────────────────────────────────────────────────

function usePolling<T>(url: string, interval = 5000) {
	const [data, setData] = useState<T | null>(null);
	useEffect(() => {
		let active = true;
		const go = async () => {
			const res = await fetch(url);
			if (active && res.ok) setData(await res.json());
		};
		go();
		const id = setInterval(go, interval);
		return () => {
			active = false;
			clearInterval(id);
		};
	}, [url, interval]);
	return data;
}

// ─── Item status chip ─────────────────────────────────────────────────────────

function ItemStatusChip({ status }: { status: string }) {
	const labels: Record<string, string> = {
		pending: "Pendiente",
		preparing: "Preparando",
		ready: "Listo",
		delivered: "Entregado",
		cancelled: "Cancelado",
	};
	return (
		<span
			className={clsx("badge", {
				"badge-pending": status === "pending",
				"badge-preparing": status === "preparing",
				"badge-ready": status === "ready",
				"badge-delivered": status === "delivered",
				"badge-cancelled": status === "cancelled",
			})}
		>
			{labels[status] ?? status}
		</span>
	);
}

// ─── Pedido tab ───────────────────────────────────────────────────────────────

function PedidoTab({
	tableId,
	orders,
	onOptimisticUpdate,
}: {
	tableId: string;
	orders: Order[];
	onOptimisticUpdate: (orderId: string, itemId: string) => void;
}) {
	const router = useRouter();
	const [delivering, setDelivering] = useState<Set<string>>(new Set());

	const activeOrders = orders.filter(
		(o) => o.status !== "closed" && o.status !== "cancelled",
	);

	const total = useMemo(
		() =>
			activeOrders.reduce(
				(sum, o) => sum + o.items.reduce((s, i) => s + i.qty * i.price, 0),
				0,
			),
		[activeOrders],
	);

	async function handleDeliver(orderId: string, itemId: string) {
		const key = `${orderId}-${itemId}`;
		setDelivering((prev) => new Set(prev).add(key));
		onOptimisticUpdate(orderId, itemId);
		try {
			await fetch(`/api/orders/${orderId}/items/${itemId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "delivered" }),
			});
		} finally {
			setDelivering((prev) => {
				const next = new Set(prev);
				next.delete(key);
				return next;
			});
		}
	}

	if (activeOrders.length === 0) {
		return (
			<div className="flex flex-col items-center gap-4 pt-20 px-6">
				<ShoppingCart className="w-12 h-12 text-ink-disabled" />
				<p className="font-display text-sm text-ink-tertiary text-center">
					No hay pedidos activos para esta mesa
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 p-4">
			{activeOrders.map((order) => (
				<div key={order.id} className="card-sm overflow-hidden">
					<div className="px-4 py-3 border-b border-surface-3 bg-surface-2/40 flex items-center justify-between">
						<span className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
							Orden
						</span>
						<span className="font-display text-[10px] text-ink-tertiary">
							{new Date(order.createdAt).toLocaleTimeString("es-AR", {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</span>
					</div>

					<div className="divide-y divide-surface-3">
						{order.items
							.filter((i) => i.status !== "cancelled")
							.map((item) => {
								const key = `${order.id}-${item.id}`;
								const isDelivering = delivering.has(key);
								return (
									<div
										key={item.id}
										className={clsx(
											"flex items-center gap-3 px-4 py-3 transition-opacity",
											item.status === "delivered" && "opacity-40",
										)}
									>
										<span className="font-kds text-3xl leading-none text-brand-500 w-8 text-center shrink-0">
											{item.qty}
										</span>
										<div className="flex-1 min-w-0">
											<p className="font-display text-sm font-semibold text-ink-primary truncate">
												{item.name}
											</p>
											<div className="flex items-center gap-2 mt-1">
												<ItemStatusChip status={item.status} />
												<span className="font-display text-[10px] text-ink-tertiary">
													{formatCurrency(item.qty * item.price)}
												</span>
											</div>
										</div>

										{item.status === "ready" && (
											<button
												onClick={() => handleDeliver(order.id, item.id)}
												disabled={isDelivering}
												className="shrink-0 btn-green text-[11px] px-3 py-2 rounded-xl shadow-green-sm"
											>
												{isDelivering ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													"✓ Entregar"
												)}
											</button>
										)}
									</div>
								);
							})}
					</div>
				</div>
			))}

			{/* Total + account button */}
			<div className="card-gold p-4 flex items-center justify-between">
				<div>
					<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
						Total
					</p>
					<p className="font-kds text-3xl text-brand-500 leading-none">
						{formatCurrency(total)}
					</p>
				</div>
				<button
					onClick={() => router.push(`/waiter/payment?tableId=${tableId}`)}
					className="btn-primary"
				>
					Solicitar cuenta →
				</button>
			</div>
		</div>
	);
}

// ─── Agregar tab ──────────────────────────────────────────────────────────────

function AgregarTab({
	tableId,
	onSuccess,
}: {
	tableId: string;
	onSuccess: () => void;
}) {
	const [products, setProducts] = useState<Product[]>([]);
	const [loadingProducts, setLoadingProducts] = useState(true);
	const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
	const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
	const [sending, setSending] = useState(false);

	useEffect(() => {
		fetch("/api/products?available=true")
			.then((r) => r.json())
			.then((data: Product[]) => {
				setProducts(data);
				if (data.length > 0 && activeCategoryId === null) {
					setActiveCategoryId(data[0].category.id);
				}
				setLoadingProducts(false);
			})
			.catch(() => setLoadingProducts(false));
	}, []);

	const categories = useMemo(() => {
		const seen = new Map<string, { id: string; name: string }>();
		for (const p of products) {
			if (!seen.has(p.category.id)) {
				seen.set(p.category.id, p.category);
			}
		}
		return Array.from(seen.values());
	}, [products]);

	const filteredProducts = useMemo(() => {
		if (!activeCategoryId) return products;
		return products.filter((p) => p.category.id === activeCategoryId);
	}, [products, activeCategoryId]);

	function addToCart(product: Product) {
		setCart((prev) => {
			const next = new Map(prev);
			const existing = next.get(product.id);
			if (existing) {
				next.set(product.id, { ...existing, qty: existing.qty + 1 });
			} else {
				next.set(product.id, {
					productId: product.id,
					name: product.name,
					qty: 1,
					price: product.price,
					target: product.target,
				});
			}
			return next;
		});
	}

	function removeFromCart(productId: string) {
		setCart((prev) => {
			const next = new Map(prev);
			const existing = next.get(productId);
			if (!existing) return prev;
			if (existing.qty <= 1) {
				next.delete(productId);
			} else {
				next.set(productId, { ...existing, qty: existing.qty - 1 });
			}
			return next;
		});
	}

	const cartTotal = useMemo(
		() => Array.from(cart.values()).reduce((s, i) => s + i.qty * i.price, 0),
		[cart],
	);

	const cartCount = useMemo(
		() => Array.from(cart.values()).reduce((s, i) => s + i.qty, 0),
		[cart],
	);

	async function handleSend() {
		if (cart.size === 0) return;
		setSending(true);
		const waiterName =
			typeof window !== "undefined"
				? (localStorage.getItem("myway_waiter_name") ?? undefined)
				: undefined;

		const items = Array.from(cart.values()).map((i) => ({
			productId: i.productId,
			name: i.name,
			qty: i.qty,
			price: i.price,
			target: i.target,
		}));

		try {
			const res = await fetch("/api/orders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ tableId, waiterName, items }),
			});
			if (res.ok) {
				setCart(new Map());
				onSuccess();
			}
		} finally {
			setSending(false);
		}
	}

	if (loadingProducts) {
		return (
			<div className="flex justify-center pt-16">
				<Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			{/* Category chips */}
			<div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-surface-3">
				{categories.map((cat) => (
					<button
						key={cat.id}
						onClick={() => setActiveCategoryId(cat.id)}
						className={clsx(
							"shrink-0 px-3 py-1.5 rounded-xl font-display text-xs font-bold uppercase tracking-wider transition-all",
							activeCategoryId === cat.id
								? "bg-brand-500 text-surface-0"
								: "bg-surface-2 text-ink-secondary border border-surface-3 hover:border-brand-500/30",
						)}
					>
						{cat.name}
					</button>
				))}
			</div>

			{/* Product grid */}
			<div className="p-4 grid grid-cols-1 gap-2">
				{filteredProducts.map((product) => {
					const inCart = cart.get(product.id);
					return (
						<div
							key={product.id}
							className={clsx(
								"flex items-center gap-3 p-3 rounded-xl border transition-all",
								inCart
									? "border-brand-500/40 bg-brand-500/05"
									: "border-surface-3 bg-surface-1",
							)}
						>
							<div className="flex-1 min-w-0">
								<p className="font-display text-sm font-semibold text-ink-primary truncate">
									{product.name}
								</p>
								<p className="font-display text-xs text-ink-tertiary mt-0.5">
									{formatCurrency(product.price)}
								</p>
							</div>

							{inCart ? (
								<div className="flex items-center gap-2 shrink-0">
									<button
										onClick={() => removeFromCart(product.id)}
										className="w-8 h-8 rounded-lg bg-surface-3 border border-surface-4 flex items-center justify-center text-ink-secondary hover:bg-surface-4 transition-all active:scale-95"
									>
										<Minus className="w-3 h-3" />
									</button>
									<span className="font-kds text-2xl leading-none text-brand-500 w-6 text-center">
										{inCart.qty}
									</span>
									<button
										onClick={() => addToCart(product)}
										className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-500 hover:bg-brand-500/25 transition-all active:scale-95"
									>
										<Plus className="w-3 h-3" />
									</button>
								</div>
							) : (
								<button
									onClick={() => addToCart(product)}
									className="shrink-0 w-8 h-8 rounded-lg bg-surface-3 border border-surface-4 flex items-center justify-center text-ink-secondary hover:bg-brand-500/15 hover:border-brand-500/30 hover:text-brand-500 transition-all active:scale-95"
								>
									<Plus className="w-3.5 h-3.5" />
								</button>
							)}
						</div>
					);
				})}
			</div>

			{/* Cart summary + send */}
			{cart.size > 0 && (
				<div className="sticky bottom-16 mx-4 mb-4 card-gold p-4 flex items-center justify-between gap-4 animate-slide-up">
					<div>
						<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
							{cartCount} {cartCount === 1 ? "item" : "items"} ·{" "}
							{formatCurrency(cartTotal)}
						</p>
					</div>
					<button
						onClick={handleSend}
						disabled={sending}
						className="btn-primary shrink-0"
					>
						{sending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<>
								<Send className="w-4 h-4" />
								Enviar
							</>
						)}
					</button>
				</div>
			)}
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TableDetailPage() {
	const params = useParams<{ tableId: string }>();
	const tableId = params.tableId;

	const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
	const [activeTab, setActiveTab] = useState<"pedido" | "agregar">("pedido");
	const [showSuccess, setShowSuccess] = useState(false);

	const orders = usePolling<Order[]>(`/api/orders?tableId=${tableId}`, 5000);

	// Also compute ready count across all orders for bottom nav badge
	const [allOrders, setAllOrders] = useState<Order[]>([]);
	useEffect(() => {
		fetch("/api/orders")
			.then((r) => r.json())
			.then((data: Order[]) => setAllOrders(data))
			.catch(() => {});
	}, []);

	const readyCount = useMemo(
		() =>
			allOrders.reduce(
				(count, o) =>
					count + o.items.filter((i) => i.status === "ready").length,
				0,
			),
		[allOrders],
	);

	useEffect(() => {
		fetch("/api/tables")
			.then((r) => r.json())
			.then((tables: TableInfo[]) => {
				const found = tables.find((t) => t.id === tableId);
				if (found) setTableInfo(found);
			})
			.catch(() => {});
	}, [tableId]);

	const [optimisticOrders, setOptimisticOrders] = useState<Order[] | null>(
		null,
	);

	useEffect(() => {
		if (orders) setOptimisticOrders(orders);
	}, [orders]);

	const handleOptimisticDeliver = useCallback(
		(orderId: string, itemId: string) => {
			setOptimisticOrders((prev) => {
				if (!prev) return prev;
				return prev.map((o) => {
					if (o.id !== orderId) return o;
					return {
						...o,
						items: o.items.map((item) =>
							item.id === itemId ? { ...item, status: "delivered" } : item,
						),
					};
				});
			});
		},
		[],
	);

	function handleSendSuccess() {
		setShowSuccess(true);
		setTimeout(() => {
			setShowSuccess(false);
			setActiveTab("pedido");
		}, 2000);
	}

	const displayOrders = optimisticOrders ?? orders ?? [];

	const statusLabel =
		tableInfo?.status === "available"
			? "Libre"
			: tableInfo?.status === "occupied"
				? "Ocupada"
				: tableInfo?.status === "reserved"
					? "Reservada"
					: "";

	return (
		<div
			className="min-h-screen flex flex-col"
			style={{ background: "var(--s0)" }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3"
				style={{
					background: "rgba(10,10,10,0.92)",
					backdropFilter: "blur(20px)",
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<Link
					href="/waiter/tables"
					className="btn-ghost p-2 rounded-xl shrink-0"
					aria-label="Volver"
				>
					<ArrowLeft className="w-5 h-5" />
				</Link>

				<div className="flex items-center gap-3 flex-1 min-w-0">
					<span className="font-kds text-4xl leading-none text-ink-primary">
						{tableInfo ? tableInfo.number : "—"}
					</span>
					{tableInfo?.type === "pool" && <span className="text-xl">🎱</span>}
					{tableInfo?.type === "bar" && <span className="text-xl">🍺</span>}
					{tableInfo && (
						<span
							className={clsx("badge", {
								"badge-available": tableInfo.status === "available",
								"badge-occupied": tableInfo.status === "occupied",
								"badge-reserved": tableInfo.status === "reserved",
							})}
						>
							{statusLabel}
						</span>
					)}
				</div>

				<span className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest shrink-0">
					Mesa
				</span>
			</header>

			{/* Tabs */}
			<div
				className="flex border-b border-surface-3"
				style={{ background: "var(--s1)" }}
			>
				{(["pedido", "agregar"] as const).map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={clsx(
							"flex-1 py-3 font-display text-xs font-bold uppercase tracking-widest transition-all border-b-2",
							activeTab === tab
								? "text-brand-500 border-brand-500"
								: "text-ink-tertiary border-transparent hover:text-ink-secondary",
						)}
					>
						{tab === "pedido" ? "Pedido" : "Agregar"}
					</button>
				))}
			</div>

			{/* Tab content */}
			<main className="flex-1 pb-safe overflow-y-auto">
				{activeTab === "pedido" ? (
					<PedidoTab
						tableId={tableId}
						orders={displayOrders}
						onOptimisticUpdate={handleOptimisticDeliver}
					/>
				) : (
					<AgregarTab tableId={tableId} onSuccess={handleSendSuccess} />
				)}
			</main>

			{/* Success overlay */}
			{showSuccess && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-0/80 backdrop-blur-md animate-fade-in">
					<div className="card-gold p-8 flex flex-col items-center gap-4 animate-scale-in">
						<div className="w-16 h-16 rounded-2xl bg-pool-500/15 border border-pool-500/30 flex items-center justify-center">
							<CheckCircle2 className="w-8 h-8 text-pool-500" />
						</div>
						<p className="font-kds text-2xl text-pool-500 tracking-wider">
							PEDIDO ENVIADO
						</p>
					</div>
				</div>
			)}

			{/* Bottom nav */}
			<nav className="mobile-nav">
				<Link href="/waiter/tables" className="mobile-nav-item">
					<Home size={20} />
					Mesas
				</Link>
				<Link href="/waiter/ready" className="mobile-nav-item relative">
					<div className="relative">
						<CheckCircle2 size={20} />
						{readyCount > 0 && (
							<span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-surface-0 font-kds text-[10px] leading-none flex items-center justify-center">
								{readyCount}
							</span>
						)}
					</div>
					Listos
				</Link>
				<Link
					href={`/waiter/payment?tableId=${tableId}`}
					className="mobile-nav-item"
				>
					<CreditCard size={20} />
					Cuenta
				</Link>
			</nav>
		</div>
	);
}
