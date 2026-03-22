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
	UtensilsCrossed,
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
	isPoolChip?: boolean;
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
	zone?: { name: string };
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
				<div
					className="w-16 h-16 rounded-2xl flex items-center justify-center"
					style={{ background: "var(--s2)", border: "1px solid var(--s3)" }}
				>
					<ShoppingCart className="w-8 h-8 text-ink-disabled" />
				</div>
				<p className="font-display text-sm text-ink-tertiary text-center">
					No hay pedidos activos para esta mesa
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 p-4">
			{activeOrders.map((order) => (
				<div key={order.id} className="card overflow-hidden">
					<div className="px-4 py-3 border-b border-surface-3 bg-surface-2/50 flex items-center justify-between">
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
											item.status === "ready" && "bg-emerald-500/5",
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
												className="shrink-0 btn-green text-[11px] px-3 rounded-xl min-h-[44px]"
												style={{ boxShadow: "0 0 12px rgba(16,185,129,0.25)" }}
											>
												{isDelivering ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													<>
														<UtensilsCrossed className="w-3 h-3" />
														Entregar
													</>
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
					<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest mb-0.5">
						Total
					</p>
					<p
						className="font-kds leading-none text-brand-500"
						style={{ fontSize: 32 }}
					>
						{formatCurrency(total)}
					</p>
				</div>
				<button
					onClick={() => router.push(`/waiter/payment?tableId=${tableId}`)}
					className="btn-primary min-h-[44px]"
				>
					<CreditCard className="w-4 h-4" />
					Solicitar cuenta
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
			<div className="flex flex-col items-center gap-3 pt-16">
				<div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
				<p className="font-display text-xs text-ink-disabled uppercase tracking-widest">
					Cargando menú...
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			{/* Category chips — sticky horizontal scroll */}
			<div
				className="sticky top-0 z-10 flex gap-2 px-4 py-3 overflow-x-auto border-b border-surface-3"
				style={{
					scrollbarWidth: "none",
					background: "rgba(16,16,16,0.97)",
					backdropFilter: "blur(12px)",
				}}
			>
				{categories.map((cat) => (
					<button
						key={cat.id}
						onClick={() => setActiveCategoryId(cat.id)}
						className={clsx(
							"shrink-0 px-4 rounded-full font-display text-xs font-bold uppercase tracking-wider transition-all active:scale-95",
							activeCategoryId === cat.id
								? "bg-brand-500 text-surface-0 shadow-gold-sm"
								: "bg-surface-2 text-ink-secondary border border-surface-3 hover:border-brand-500/30",
						)}
						style={{ minHeight: 36 }}
					>
						{cat.name}
					</button>
				))}
			</div>

			{/* Product list */}
			<div className="p-3 flex flex-col gap-2 pb-4">
				{filteredProducts.map((product) => {
					const inCart = cart.get(product.id);
					return (
						<div
							key={product.id}
							className={clsx(
								"flex items-center gap-3 rounded-2xl border transition-all",
								inCart
									? "border-brand-500/45 bg-brand-500/08"
									: "border-surface-3 bg-surface-1",
								product.isPoolChip && "pool-chip-border",
							)}
							style={{ padding: "12px 14px", minHeight: 68 }}
						>
							<div className="flex-1 min-w-0">
								<p
									className={clsx(
										"font-display text-sm font-semibold leading-tight",
										product.isPoolChip ? "pool-chip-badge" : "text-ink-primary",
									)}
								>
									{product.name}
								</p>
								<p
									className="font-kds text-brand-500 mt-0.5 leading-none"
									style={{ fontSize: 16 }}
								>
									{formatCurrency(product.price)}
								</p>
							</div>

							{inCart ? (
								<div className="flex items-center gap-2 shrink-0">
									<button
										onClick={() => removeFromCart(product.id)}
										className="rounded-xl bg-surface-3 border border-surface-4 flex items-center justify-center text-ink-secondary hover:bg-surface-4 transition-all active:scale-90"
										style={{ width: 44, height: 44 }}
									>
										<Minus className="w-4 h-4" />
									</button>
									<span
										className="font-kds text-brand-500 text-center leading-none"
										style={{ width: 32, fontSize: 28 }}
									>
										{inCart.qty}
									</span>
									<button
										onClick={() => addToCart(product)}
										className="rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-500 hover:bg-brand-500/25 transition-all active:scale-90"
										style={{ width: 44, height: 44 }}
									>
										<Plus className="w-4 h-4" />
									</button>
								</div>
							) : (
								<button
									onClick={() => addToCart(product)}
									className="shrink-0 rounded-xl bg-surface-3 border border-surface-4 flex items-center justify-center text-ink-secondary hover:bg-brand-500/15 hover:border-brand-500/30 hover:text-brand-500 transition-all active:scale-90"
									style={{ width: 44, height: 44 }}
								>
									<Plus className="w-5 h-5" />
								</button>
							)}
						</div>
					);
				})}
			</div>

			{/* Cart summary bar — sticky above bottom nav */}
			{cart.size > 0 && (
				<div
					className="sticky bottom-16 mx-3 mb-3 card-gold animate-slide-up"
					style={{
						padding: "14px 16px",
						boxShadow:
							"0 0 32px rgba(245,158,11,0.18), 0 4px 24px rgba(0,0,0,0.5)",
					}}
				>
					<div className="flex items-center justify-between gap-4">
						<div>
							<div className="flex items-center gap-2 mb-0.5">
								<ShoppingCart className="w-3.5 h-3.5 text-brand-500" />
								<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
									{cartCount} {cartCount === 1 ? "item" : "items"}
								</p>
							</div>
							<p
								className="font-kds text-brand-500 leading-none"
								style={{ fontSize: 24 }}
							>
								{formatCurrency(cartTotal)}
							</p>
						</div>
						<button
							onClick={handleSend}
							disabled={sending}
							className="btn-primary shrink-0 min-h-[48px]"
							style={{ paddingLeft: 20, paddingRight: 20 }}
						>
							{sending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<>
									<Send className="w-4 h-4" />
									ENVIAR PEDIDO
								</>
							)}
						</button>
					</div>
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

	const tableTypeIcon =
		tableInfo?.type === "pool"
			? "POOL"
			: tableInfo?.type === "bar"
				? "BAR"
				: null;

	return (
		<div
			className="noise-overlay min-h-screen flex flex-col"
			style={{ background: "var(--s0)" }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 top-accent"
				style={{
					background: "rgba(10,10,10,0.95)",
					backdropFilter: "blur(24px)",
					borderBottom: "1px solid var(--s3)",
					position: "sticky",
				}}
			>
				<Link
					href="/waiter/tables"
					className="btn-ghost p-2 rounded-xl shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
					aria-label="Volver"
				>
					<ArrowLeft className="w-5 h-5" />
				</Link>

				<div className="flex items-center gap-2.5 flex-1 min-w-0">
					{/* Large table number */}
					<span
						className="font-kds leading-none text-ink-primary"
						style={{ fontSize: 44 }}
					>
						{tableInfo ? tableInfo.number : "—"}
					</span>
					<div className="flex flex-col gap-1 min-w-0">
						{tableTypeIcon && (
							<span
								className={clsx(
									"font-display font-bold text-[9px] uppercase tracking-[0.2em]",
									tableInfo?.type === "pool"
										? "pool-chip-badge"
										: "text-ink-tertiary",
								)}
							>
								{tableTypeIcon}
							</span>
						)}
						{tableInfo?.zone?.name && (
							<span className="font-display text-[10px] text-ink-disabled uppercase tracking-widest truncate">
								{tableInfo.zone.name}
							</span>
						)}
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
				</div>

				<span className="font-display text-[10px] text-ink-disabled uppercase tracking-[0.3em] shrink-0">
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
							"flex-1 py-3.5 font-display text-xs font-bold uppercase tracking-widest transition-all border-b-2 min-h-[48px]",
							activeTab === tab
								? "text-brand-500 border-brand-500"
								: "text-ink-tertiary border-transparent hover:text-ink-secondary",
						)}
					>
						{tab === "pedido" ? "Pedido Actual" : "Agregar Items"}
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
						<div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
							<CheckCircle2 className="w-8 h-8 text-emerald-400" />
						</div>
						<p className="font-kds text-2xl text-emerald-400 tracking-wider">
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
