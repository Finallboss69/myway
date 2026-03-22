"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import {
	ArrowLeft,
	Plus,
	Minus,
	Send,
	CheckCircle2,
	Home,
	List,
	CreditCard,
	BellRing,
} from "lucide-react";
import {
	TABLES,
	CATEGORIES,
	PRODUCTS,
	formatCurrency,
	elapsedMinutes,
} from "@/data/mock";
import { useAppStore } from "@/store/useAppStore";
import clsx from "clsx";

const WAITER_NAME = "Lucía Fernández";

const STATUS_LABEL: Record<string, string> = {
	pending: "Pendiente",
	preparing: "Preparando",
	ready: "Listo",
	delivered: "Entregado",
	cancelled: "Cancelado",
};

export default function WaiterTablePage() {
	const params = useParams();
	const tableId = (params?.tableId as string) ?? "t2";

	const [activeTab, setActiveTab] = useState<"order" | "add">("order");
	const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
	const [orderSent, setOrderSent] = useState(false);

	const table = TABLES.find((t) => t.id === tableId) ?? TABLES[1];

	const carts = useAppStore((s) => s.carts);
	const addToCart = useAppStore((s) => s.addToCart);
	const updateCartQty = useAppStore((s) => s.updateCartQty);
	const removeFromCart = useAppStore((s) => s.removeFromCart);
	const submitCart = useAppStore((s) => s.submitCart);
	const updateItemStatus = useAppStore((s) => s.updateItemStatus);
	const orders = useAppStore((s) => s.orders);
	const notifications = useAppStore((s) => s.notifications);
	const markNotificationRead = useAppStore((s) => s.markNotificationRead);

	// Toast for kitchen/bar ready notifications
	const [toast, setToast] = useState<{ id: string; message: string } | null>(
		null,
	);
	const latestNotif = notifications[0];
	useEffect(() => {
		if (
			latestNotif &&
			!latestNotif.read &&
			latestNotif.type === "order_ready"
		) {
			setToast({ id: latestNotif.id, message: latestNotif.message });
			markNotificationRead(latestNotif.id);
			const t = setTimeout(() => setToast(null), 4500);
			return () => clearTimeout(t);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [latestNotif?.id]);

	const tableOrders = orders.filter(
		(o) => o.tableId === tableId && o.status !== "closed",
	);
	const cart = carts[tableId] ?? [];

	// Aggregate all items across all active orders for this table (with orderId for actions)
	const allItems = tableOrders.flatMap((o) =>
		o.items.map((i) => ({ ...i, orderId: o.id })),
	);
	const orderTotal = allItems.reduce((sum, i) => sum + i.price * i.qty, 0);

	const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
	const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

	const oldestOrder = tableOrders.length
		? tableOrders.reduce((a, b) => (a.createdAt < b.createdAt ? a : b))
		: null;
	const elapsed = oldestOrder ? elapsedMinutes(oldestOrder.createdAt) : 0;

	const filteredProducts = activeCategoryId
		? PRODUCTS.filter((p) => p.categoryId === activeCategoryId && p.isAvailable)
		: PRODUCTS.filter((p) => p.isAvailable);

	const getCartQty = (productId: string) =>
		cart.find((i) => i.productId === productId)?.qty ?? 0;

	const handleAdd = (productId: string) => {
		const product = PRODUCTS.find((p) => p.id === productId);
		if (!product) return;
		addToCart(tableId, {
			productId: product.id,
			name: product.name,
			price: product.price,
			qty: 1,
			target: product.target as "bar" | "kitchen",
			isPoolChip: product.isPoolChip,
		});
	};

	const handleDecrement = (productId: string) => {
		const qty = getCartQty(productId);
		if (qty <= 1) {
			removeFromCart(tableId, productId);
		} else {
			updateCartQty(tableId, productId, qty - 1);
		}
	};

	const handleSendOrder = () => {
		if (!cartCount) return;
		submitCart(tableId, WAITER_NAME);
		setOrderSent(true);
		setTimeout(() => {
			setOrderSent(false);
			setActiveTab("order");
		}, 2000);
	};

	const tableStatus = table
		? (table.status as "available" | "occupied" | "reserved")
		: "available";

	return (
		<div className="min-h-screen bg-surface-0 flex flex-col max-w-md mx-auto">
			{/* ── Header ── */}
			<div
				className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
				style={{
					background: "rgba(8,8,8,0.92)",
					backdropFilter: "blur(16px)",
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<a
					href="/waiter/tables"
					className="flex items-center gap-1.5 text-ink-secondary hover:text-ink-primary transition-colors"
					style={{ textDecoration: "none" }}
				>
					<ArrowLeft size={16} />
					<span
						className="font-display uppercase"
						style={{ fontSize: 12, letterSpacing: "0.08em" }}
					>
						Mesas
					</span>
				</a>

				<div className="flex flex-col items-center">
					<div
						className="font-kds text-ink-primary leading-none"
						style={{ fontSize: 22 }}
					>
						Mesa {table?.number}
					</div>
					<div className="text-ink-tertiary font-body" style={{ fontSize: 10 }}>
						{table?.zoneId === "z1" ? "Salón Principal" : "Afuera"}
					</div>
				</div>

				<div className="flex flex-col items-end gap-1">
					<span
						className={clsx("badge", `badge-${tableStatus}`)}
						style={{ fontSize: 9, padding: "2px 8px" }}
					>
						{tableStatus === "available"
							? "Libre"
							: tableStatus === "occupied"
								? "Ocupada"
								: "Reservada"}
					</span>
					{tableStatus === "occupied" && (
						<span
							className="text-ink-tertiary font-body"
							style={{ fontSize: 10 }}
						>
							{elapsed}m
						</span>
					)}
				</div>
			</div>

			{/* ── Tabs ── */}
			<div
				className="flex"
				style={{ background: "#0a0a0a", borderBottom: "1px solid var(--s3)" }}
			>
				{(["order", "add"] as const).map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={clsx(
							"flex-1 py-3 font-display uppercase transition-colors relative",
							tab === activeTab
								? "text-brand-500"
								: "text-ink-tertiary hover:text-ink-secondary",
						)}
						style={{ fontSize: 11, letterSpacing: "0.08em" }}
					>
						{tab === "order" ? "Pedido" : "Agregar"}
						{tab === "add" && cartCount > 0 && (
							<span
								className="font-display font-bold text-surface-0 bg-brand-500 rounded-full ml-1.5 inline-flex items-center justify-center"
								style={{
									fontSize: 9,
									minWidth: 16,
									height: 16,
									padding: "0 4px",
									verticalAlign: "middle",
								}}
							>
								{cartCount}
							</span>
						)}
						{tab === activeTab && (
							<span
								style={{
									position: "absolute",
									bottom: 0,
									left: "20%",
									right: "20%",
									height: 2,
									background: "#f59e0b",
									borderRadius: "2px 2px 0 0",
									boxShadow: "0 0 8px rgba(245,158,11,0.6)",
								}}
							/>
						)}
					</button>
				))}
			</div>

			{/* ── Tab content ── */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* ══ PEDIDO tab ══ */}
				{activeTab === "order" && (
					<div className="flex flex-col flex-1 animate-fade-in">
						<div
							className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
							style={{ paddingBottom: 16 }}
						>
							{allItems.length === 0 ? (
								<div
									className="flex flex-col items-center justify-center py-16 gap-3"
									style={{ opacity: 0.5 }}
								>
									<div style={{ fontSize: 40 }}>🍽️</div>
									<div
										className="font-display uppercase text-ink-tertiary text-center"
										style={{ fontSize: 11, letterSpacing: "0.12em" }}
									>
										Mesa disponible
									</div>
									<div
										className="text-ink-disabled font-body text-center"
										style={{ fontSize: 12 }}
									>
										Agrega ítems para crear un pedido
									</div>
									<button
										className="btn-secondary mt-2"
										onClick={() => setActiveTab("add")}
										style={{ fontSize: 11, padding: "9px 18px" }}
									>
										<Plus size={13} />
										Agregar ítems
									</button>
								</div>
							) : (
								allItems.map((item) => {
									const isReady = item.status === "ready";
									return (
										<div
											key={item.id}
											className="card flex items-center gap-3 px-3 py-3"
											style={{
												borderColor: isReady
													? "rgba(16,185,129,0.3)"
													: "var(--s3)",
												background: isReady
													? "rgba(16,185,129,0.04)"
													: "var(--s1)",
											}}
										>
											<div
												className="font-kds text-brand-500 leading-none flex-shrink-0 text-center"
												style={{ fontSize: 26, minWidth: 28 }}
											>
												{item.qty}
											</div>
											<div
												style={{
													width: 1,
													height: 28,
													background: "var(--s3)",
													flexShrink: 0,
												}}
											/>
											<div className="flex-1 min-w-0">
												<div
													className="text-ink-primary font-body font-medium truncate"
													style={{ fontSize: 13 }}
												>
													{item.name}
												</div>
												<div
													className="text-ink-tertiary font-body"
													style={{ fontSize: 10 }}
												>
													{formatCurrency(item.price)} c/u
												</div>
											</div>
											<div className="flex flex-col items-end gap-1.5 flex-shrink-0">
												<div
													className="text-ink-primary font-display font-semibold"
													style={{ fontSize: 13 }}
												>
													{formatCurrency(item.price * item.qty)}
												</div>
												<span
													className={clsx("badge", `badge-${item.status}`)}
													style={{ fontSize: 9, padding: "2px 7px" }}
												>
													{STATUS_LABEL[item.status] ?? item.status}
												</span>
												{isReady && (
													<button
														onClick={() =>
															updateItemStatus(
																item.orderId,
																item.id,
																"delivered",
															)
														}
														className="btn-green"
														style={{
															fontSize: 10,
															padding: "4px 10px",
															borderRadius: 8,
														}}
													>
														✓ Entregar
													</button>
												)}
											</div>
										</div>
									);
								})
							)}
						</div>

						{allItems.length > 0 && (
							<div
								className="px-3 pb-safe pt-3 space-y-3"
								style={{
									borderTop: "1px solid var(--s3)",
									background:
										"linear-gradient(to top, #080808 80%, transparent)",
								}}
							>
								<div className="flex items-center justify-between px-1">
									<span
										className="text-ink-tertiary font-display uppercase"
										style={{ fontSize: 11, letterSpacing: "0.12em" }}
									>
										Total
									</span>
									<span
										className="font-kds text-brand-500"
										style={{ fontSize: 30 }}
									>
										{formatCurrency(orderTotal)}
									</span>
								</div>
								<a
									href={`/waiter/payment?tableId=${tableId}`}
									className="btn-primary w-full justify-center"
									style={{
										padding: "14px 20px",
										fontSize: 13,
										display: "flex",
										textDecoration: "none",
									}}
								>
									<CheckCircle2 size={15} />
									Solicitar cuenta →
								</a>
								<button
									className="btn-secondary w-full justify-center"
									onClick={() => setActiveTab("add")}
									style={{ padding: "11px 20px", fontSize: 12 }}
								>
									<Plus size={14} />
									Agregar más ítems
								</button>
							</div>
						)}
					</div>
				)}

				{/* ══ AGREGAR tab ══ */}
				{activeTab === "add" && (
					<div className="flex flex-col flex-1 animate-fade-in overflow-hidden">
						{/* Category scroll */}
						<div
							className="flex gap-2 px-3 py-3 overflow-x-auto"
							style={{
								borderBottom: "1px solid var(--s3)",
								scrollbarWidth: "none",
							}}
						>
							<button
								onClick={() => setActiveCategoryId(null)}
								className={clsx(
									"flex-shrink-0 font-display uppercase px-3 py-1.5 rounded-full border transition-all duration-150",
									activeCategoryId === null
										? "bg-brand-500 text-surface-0 border-brand-500"
										: "bg-transparent text-ink-tertiary border-surface-3 hover:text-ink-secondary",
								)}
								style={{ fontSize: 10, letterSpacing: "0.08em" }}
							>
								Todo
							</button>
							{CATEGORIES.map((cat) => (
								<button
									key={cat.id}
									onClick={() =>
										setActiveCategoryId(
											activeCategoryId === cat.id ? null : cat.id,
										)
									}
									className={clsx(
										"flex-shrink-0 flex items-center gap-1.5 font-display uppercase px-3 py-1.5 rounded-full border transition-all duration-150",
										activeCategoryId === cat.id
											? "bg-brand-500 text-surface-0 border-brand-500"
											: "bg-transparent text-ink-tertiary border-surface-3 hover:text-ink-secondary",
									)}
									style={{ fontSize: 10, letterSpacing: "0.08em" }}
								>
									<span>{cat.icon}</span>
									{cat.name}
								</button>
							))}
						</div>

						{/* Product grid */}
						<div
							className="flex-1 overflow-y-auto px-3 py-3"
							style={{ paddingBottom: cartCount > 0 ? 108 : 20 }}
						>
							<div className="grid grid-cols-2 gap-2.5">
								{filteredProducts.map((product) => {
									const qty = getCartQty(product.id);
									const isPoolChip = product.isPoolChip;
									return (
										<div
											key={product.id}
											className={clsx(
												"flex flex-col gap-2 p-3 transition-all duration-150",
												isPoolChip
													? "card-gold pool-chip-border"
													: qty > 0
														? "card"
														: "card-sm",
											)}
											style={{
												borderColor:
													qty > 0 && !isPoolChip ? "#f59e0b" : undefined,
												boxShadow:
													qty > 0 && !isPoolChip
														? "0 0 12px rgba(245,158,11,0.18)"
														: undefined,
												background: isPoolChip
													? "linear-gradient(135deg, #0f0f0f, #1a1200)"
													: "var(--s1)",
												position: "relative",
												overflow: "hidden",
											}}
										>
											{/* Pool chip shimmer overlay */}
											{isPoolChip && (
												<div
													style={{
														position: "absolute",
														inset: 0,
														background:
															"linear-gradient(135deg, transparent 35%, rgba(245,158,11,0.05) 55%, transparent 75%)",
														pointerEvents: "none",
													}}
												/>
											)}

											<div className="flex-1">
												<div
													className={clsx(
														"font-display uppercase leading-tight",
														isPoolChip ? "pool-chip-badge" : "text-ink-primary",
													)}
													style={{ fontSize: 11 }}
												>
													{product.name}
												</div>
												{product.description && (
													<div
														className="text-ink-tertiary font-body mt-0.5"
														style={{ fontSize: 10 }}
													>
														{product.description}
													</div>
												)}
											</div>

											<div className="flex items-center justify-between mt-1">
												<div
													className="font-kds text-brand-500"
													style={{ fontSize: 18 }}
												>
													{formatCurrency(product.price)}
												</div>

												{qty === 0 ? (
													<button
														onClick={() => handleAdd(product.id)}
														className="flex items-center justify-center bg-brand-500 text-surface-0 rounded-lg transition-all duration-100 active:scale-90"
														style={{ width: 28, height: 28 }}
													>
														<Plus size={14} />
													</button>
												) : (
													<div className="flex items-center gap-1.5">
														<button
															onClick={() => handleDecrement(product.id)}
															className="flex items-center justify-center rounded-md border border-surface-3 text-ink-secondary transition-all active:scale-90"
															style={{ width: 24, height: 24 }}
														>
															<Minus size={11} />
														</button>
														<span
															className="font-kds text-brand-500 leading-none text-center"
															style={{ fontSize: 18, minWidth: 16 }}
														>
															{qty}
														</span>
														<button
															onClick={() => handleAdd(product.id)}
															className="flex items-center justify-center bg-brand-500 text-surface-0 rounded-md transition-all active:scale-90"
															style={{ width: 24, height: 24 }}
														>
															<Plus size={11} />
														</button>
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* Sticky cart bar */}
						{cartCount > 0 && (
							<div
								className="sticky bottom-0 px-3 pb-safe pt-3 animate-slide-up"
								style={{
									background:
										"linear-gradient(to top, #080808 75%, transparent)",
								}}
							>
								<button
									onClick={handleSendOrder}
									className="btn-primary w-full justify-between"
									style={{ padding: "14px 18px", fontSize: 13 }}
								>
									<span className="flex items-center gap-2">
										<Send size={15} />
										{cartCount} {cartCount === 1 ? "ítem" : "ítems"}
									</span>
									<span>Enviar · {formatCurrency(cartTotal)}</span>
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			{/* ── Bottom nav ── */}
			<nav className="mobile-nav">
				<a href="/waiter/tables" className="mobile-nav-item">
					<Home size={20} />
					<span>Mesas</span>
				</a>
				<a href="/waiter/ready" className="mobile-nav-item relative">
					<CheckCircle2 size={20} />
					<span>Listos</span>
				</a>
				<a
					href={`/waiter/payment?tableId=${tableId}`}
					className="mobile-nav-item"
				>
					<CreditCard size={20} />
					<span>Cuenta</span>
				</a>
			</nav>

			{/* ── Order sent overlay ── */}
			{orderSent && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
					style={{
						background: "rgba(8,8,8,0.88)",
						backdropFilter: "blur(10px)",
					}}
				>
					<div
						className="card flex flex-col items-center gap-4 px-10 py-9 animate-scale-in"
						style={{ borderColor: "rgba(16,185,129,0.4)", maxWidth: 290 }}
					>
						<div
							className="flex items-center justify-center rounded-full"
							style={{
								width: 58,
								height: 58,
								background: "rgba(16,185,129,0.12)",
								border: "1.5px solid rgba(16,185,129,0.4)",
								boxShadow: "0 0 20px rgba(16,185,129,0.18)",
							}}
						>
							<Send size={22} style={{ color: "#34d399" }} />
						</div>
						<div className="text-center">
							<div
								className="font-kds text-pool-400"
								style={{ fontSize: 32, letterSpacing: "0.06em" }}
							>
								Pedido Enviado
							</div>
							<div
								className="text-ink-tertiary font-body mt-1"
								style={{ fontSize: 12 }}
							>
								Barra y cocina notificadas
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ── Ready notification toast ── */}
			{toast && (
				<div
					className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up"
					style={{ minWidth: 260, maxWidth: 320 }}
				>
					<div
						className="flex items-center gap-3 px-4 py-3 rounded-2xl"
						style={{
							background: "rgba(16,185,129,0.12)",
							border: "1px solid rgba(16,185,129,0.4)",
							backdropFilter: "blur(16px)",
							boxShadow: "0 0 24px rgba(16,185,129,0.2)",
						}}
					>
						<BellRing size={18} className="text-pool-400 flex-shrink-0" />
						<div className="flex-1 min-w-0">
							<div
								className="font-display font-bold text-pool-400"
								style={{ fontSize: 11, letterSpacing: "0.08em" }}
							>
								¡LISTO PARA SERVIR!
							</div>
							<div
								className="text-ink-secondary font-body truncate"
								style={{ fontSize: 12 }}
							>
								{toast.message}
							</div>
						</div>
						<button
							onClick={() => setToast(null)}
							className="text-ink-tertiary hover:text-ink-primary ml-1 flex-shrink-0"
							style={{ fontSize: 16 }}
						>
							×
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
