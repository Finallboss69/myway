"use client";

import { useState, useMemo } from "react";
import {
	Truck,
	MapPin,
	Phone,
	User,
	Plus,
	Minus,
	X,
	ChevronDown,
	ChevronUp,
	Clock,
	UtensilsCrossed,
	ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import {
	CATEGORIES,
	PRODUCTS,
	VENUE,
	formatCurrency,
	elapsedMinutes,
} from "@/data/mock";
import { useAppStore } from "@/store/useAppStore";
import type { DeliveryStatus } from "@/store/useAppStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE_ID = "t2";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
	DeliveryStatus,
	{ label: string; color: string; bg: string; border: string }
> = {
	pending: {
		label: "Pendiente",
		color: "#fbbf24",
		bg: "rgba(245,158,11,0.1)",
		border: "rgba(245,158,11,0.3)",
	},
	preparing: {
		label: "Preparando",
		color: "#60a5fa",
		bg: "rgba(59,130,246,0.1)",
		border: "rgba(59,130,246,0.3)",
	},
	on_the_way: {
		label: "En camino 🛵",
		color: "#34d399",
		bg: "rgba(16,185,129,0.1)",
		border: "rgba(16,185,129,0.3)",
	},
	delivered: {
		label: "Entregado",
		color: "#6b7280",
		bg: "rgba(107,114,128,0.1)",
		border: "rgba(107,114,128,0.2)",
	},
};

const DELIVERY_STATUS_OPTIONS: { value: DeliveryStatus; label: string }[] = [
	{ value: "pending", label: "Pendiente" },
	{ value: "preparing", label: "Preparando" },
	{ value: "on_the_way", label: "En camino 🛵" },
	{ value: "delivered", label: "Entregado" },
];

// ─── Cart item type ───────────────────────────────────────────────────────────

interface LocalCartItem {
	productId: string;
	name: string;
	price: number;
	qty: number;
}

// ─── Active delivery card ─────────────────────────────────────────────────────

function ActiveDeliveryCard({
	order,
	onUpdateStatus,
}: {
	order: {
		id: string;
		customerName: string;
		address: string;
		items: { name: string; qty: number; price: number }[];
		total: number;
		status: DeliveryStatus;
		paymentMethod: string;
		createdAt: Date;
	};
	onUpdateStatus: (status: DeliveryStatus) => void;
}) {
	const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.pending;
	const elapsed = elapsedMinutes(order.createdAt);
	const isOnTheWay = order.status === "on_the_way";

	return (
		<div
			className="card-sm rounded-2xl overflow-hidden animate-slide-up relative"
			style={
				isOnTheWay
					? {
							background: "#0a0f0a",
							borderColor: "rgba(16,185,129,0.25)",
							boxShadow:
								"0 0 0 1px rgba(16,185,129,0.1), 0 4px 16px rgba(0,0,0,0.4)",
						}
					: {}
			}
		>
			{/* Status top bar */}
			<div
				className="h-[2px] w-full"
				style={{
					background: `linear-gradient(90deg, transparent, ${cfg.color}80, ${cfg.color}, ${cfg.color}80, transparent)`,
				}}
			/>

			<div className="p-4">
				<div className="flex items-start justify-between gap-3 mb-3">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap mb-0.5">
							<p className="font-display font-bold text-ink-primary text-[14px] uppercase tracking-wide">
								{order.customerName}
							</p>
							{isOnTheWay && (
								<span
									className="badge animate-pulse-slow"
									style={{
										color: cfg.color,
										background: cfg.bg,
										border: `1px solid ${cfg.border}`,
									}}
								>
									{cfg.label}
								</span>
							)}
							{!isOnTheWay && (
								<span
									className="badge"
									style={{
										color: cfg.color,
										background: cfg.bg,
										border: `1px solid ${cfg.border}`,
									}}
								>
									{cfg.label}
								</span>
							)}
						</div>
						<div className="flex items-center gap-1 text-ink-tertiary">
							<MapPin size={11} />
							<p className="font-body text-[12px] truncate max-w-[200px]">
								{order.address}
							</p>
						</div>
					</div>
					<div className="text-right shrink-0">
						<p
							className="font-kds text-brand-500"
							style={{ fontSize: "20px", lineHeight: 1 }}
						>
							{formatCurrency(order.total)}
						</p>
						<p className="font-body text-ink-tertiary text-[11px] mt-0.5">
							hace {elapsed}min
						</p>
					</div>
				</div>

				{/* Items */}
				<div className="space-y-1 mb-3">
					{order.items.map((item, i) => (
						<div key={i} className="flex items-center justify-between gap-2">
							<span className="font-body text-ink-secondary text-[12px]">
								{item.qty}× {item.name}
							</span>
							<span className="font-body text-ink-tertiary text-[11px]">
								{formatCurrency(item.price * item.qty)}
							</span>
						</div>
					))}
				</div>

				{/* Payment + status update */}
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-1.5">
						<span className="text-[11px]">
							{order.paymentMethod === "mercadopago" ? "💳" : "💵"}
						</span>
						<span className="font-body text-ink-tertiary text-[11px]">
							{order.paymentMethod === "mercadopago"
								? "MercadoPago"
								: "Efectivo"}
						</span>
					</div>
					<select
						value={order.status}
						onChange={(e) => onUpdateStatus(e.target.value as DeliveryStatus)}
						className="text-[11px] font-display font-bold uppercase rounded-lg px-2 py-1.5 cursor-pointer outline-none"
						style={{
							background: cfg.bg,
							color: cfg.color,
							border: `1px solid ${cfg.border}`,
							minWidth: "120px",
						}}
					>
						{DELIVERY_STATUS_OPTIONS.map((opt) => (
							<option
								key={opt.value}
								value={opt.value}
								style={{ background: "#161616", color: "#f5f5f5" }}
							>
								{opt.label}
							</option>
						))}
					</select>
				</div>
			</div>
		</div>
	);
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessDelivery({
	address,
	onReset,
}: {
	address: string;
	onReset: () => void;
}) {
	return (
		<div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center px-6 text-center relative">
			<div
				aria-hidden
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse 300px 300px at 50% 45%, rgba(16,185,129,0.07) 0%, transparent 70%)",
				}}
			/>
			<div
				className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-fade-in"
				style={{
					background: "rgba(16,185,129,0.12)",
					border: "1px solid rgba(16,185,129,0.35)",
					boxShadow: "0 0 40px rgba(16,185,129,0.18)",
				}}
			>
				<Truck size={32} className="text-pool-500" />
			</div>
			<h2
				className="font-kds text-ink-primary mb-2 animate-fade-in relative z-10"
				style={{ fontSize: "36px", letterSpacing: "0.06em" }}
			>
				¡Pedido confirmado!
			</h2>
			<p className="font-body text-ink-secondary text-[14px] mb-1 animate-fade-in relative z-10">
				Tu pedido está siendo preparado
			</p>
			<p className="font-body text-ink-tertiary text-[13px] mb-2 animate-fade-in relative z-10">
				Entrega en ~40 minutos a
			</p>
			<p className="font-body text-brand-500 text-[13px] font-medium mb-8 animate-fade-in relative z-10">
				{address}
			</p>
			<button
				onClick={onReset}
				className="btn-primary rounded-xl relative z-10"
			>
				Hacer otro pedido
			</button>
		</div>
	);
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────

function BottomNav() {
	const carts = useAppStore((s) => s.carts);
	const cartCount = (carts[TABLE_ID] ?? []).reduce((s, i) => s + i.qty, 0);

	return (
		<nav className="mobile-nav">
			<Link href="/customer/menu" className="mobile-nav-item">
				<UtensilsCrossed size={20} />
				<span>Menú</span>
			</Link>
			<Link href="/customer/menu/cart" className="mobile-nav-item">
				<span className="relative">
					<ShoppingCart size={20} />
					{cartCount > 0 && (
						<span
							className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full flex items-center justify-center font-kds text-[10px] text-surface-0"
							style={{ background: "#f59e0b" }}
						>
							{cartCount > 9 ? "9+" : cartCount}
						</span>
					)}
				</span>
				<span>Mi pedido</span>
			</Link>
			<Link href="/customer/order-status" className="mobile-nav-item">
				<Clock size={20} />
				<span>Estado</span>
			</Link>
			<Link href="/customer/delivery" className="mobile-nav-item active">
				<Truck size={20} />
				<span>Delivery</span>
			</Link>
		</nav>
	);
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function DeliveryPage() {
	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [phone, setPhone] = useState("");
	const [payment, setPayment] = useState<"mercadopago" | "cash">("mercadopago");
	const [localCart, setLocalCart] = useState<LocalCartItem[]>([]);
	const [activeCategory, setActiveCategory] = useState("all");
	const [formOpen, setFormOpen] = useState(true);
	const [confirmed, setConfirmed] = useState(false);
	const [confirmedAddress, setConfirmedAddress] = useState("");

	const deliveryOrders = useAppStore((s) => s.deliveryOrders);
	const addDeliveryOrder = useAppStore((s) => s.addDeliveryOrder);
	const updateDeliveryStatus = useAppStore((s) => s.updateDeliveryStatus);

	// ─── Local cart helpers ───────────────────────────────────────────────────

	const addToLocalCart = (p: (typeof PRODUCTS)[number]) => {
		setLocalCart((prev) => {
			const existing = prev.find((i) => i.productId === p.id);
			if (existing) {
				return prev.map((i) =>
					i.productId === p.id ? { ...i, qty: i.qty + 1 } : i,
				);
			}
			return [
				...prev,
				{ productId: p.id, name: p.name, price: p.price, qty: 1 },
			];
		});
	};

	const decreaseLocalCart = (productId: string) => {
		setLocalCart((prev) => {
			const item = prev.find((i) => i.productId === productId);
			if (!item) return prev;
			if (item.qty <= 1) return prev.filter((i) => i.productId !== productId);
			return prev.map((i) =>
				i.productId === productId ? { ...i, qty: i.qty - 1 } : i,
			);
		});
	};

	const removeLocalCart = (productId: string) =>
		setLocalCart((prev) => prev.filter((i) => i.productId !== productId));

	const getLocalQty = (productId: string) =>
		localCart.find((i) => i.productId === productId)?.qty ?? 0;

	const cartTotal = useMemo(
		() => localCart.reduce((s, i) => s + i.price * i.qty, 0),
		[localCart],
	);
	const cartCount = useMemo(
		() => localCart.reduce((s, i) => s + i.qty, 0),
		[localCart],
	);

	const filtered = useMemo(
		() =>
			activeCategory === "all"
				? PRODUCTS.filter((p) => p.isAvailable)
				: PRODUCTS.filter(
						(p) => p.categoryId === activeCategory && p.isAvailable,
					),
		[activeCategory],
	);

	const canConfirm =
		name.trim() && address.trim() && phone.trim() && cartCount > 0;

	const handleConfirm = () => {
		if (!canConfirm) return;
		addDeliveryOrder({
			customerName: name.trim(),
			address: address.trim(),
			items: localCart.map((i) => ({
				name: i.name,
				qty: i.qty,
				price: i.price,
			})),
			total: cartTotal,
			status: "pending",
			paymentMethod: payment,
		});
		setConfirmedAddress(address.trim());
		setConfirmed(true);
	};

	const handleReset = () => {
		setConfirmed(false);
		setLocalCart([]);
		setName("");
		setAddress("");
		setPhone("");
		setPayment("mercadopago");
	};

	if (confirmed) {
		return <SuccessDelivery address={confirmedAddress} onReset={handleReset} />;
	}

	return (
		<div className="min-h-screen bg-surface-0 pb-24 relative">
			{/* Noise overlay */}
			<div
				className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
				aria-hidden
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
					mixBlendMode: "overlay",
				}}
			/>

			{/* ── Header ────────────────────────────────────────────────────── */}
			<div
				className="border-b border-surface-3 relative overflow-hidden"
				style={{
					background: "linear-gradient(180deg, #0a0800 0%, #080808 100%)",
					paddingTop: "env(safe-area-inset-top, 0px)",
				}}
			>
				<div
					aria-hidden
					className="absolute inset-0 pointer-events-none"
					style={{
						background:
							"radial-gradient(ellipse 250px 150px at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 70%)",
					}}
				/>
				<div
					aria-hidden
					className="absolute top-0 left-0 right-0 h-[1px]"
					style={{
						background:
							"linear-gradient(90deg, transparent, rgba(245,158,11,0.6) 50%, transparent)",
					}}
				/>

				<div className="max-w-md mx-auto px-5 pt-6 pb-5 text-center relative z-10">
					<p
						className="font-kds text-brand-500 tracking-[0.18em]"
						style={{ fontSize: "32px" }}
					>
						MY WAY DELIVERY
					</p>
					<p className="font-body text-ink-secondary text-[12px] mt-1">
						Pedidos a domicilio · Buenos Aires
					</p>
				</div>
			</div>

			<div className="max-w-md mx-auto px-4 mt-5 space-y-5 relative z-10">
				{/* ── Active deliveries ──────────────────────────────────────── */}
				{deliveryOrders.length > 0 && (
					<div>
						<h2 className="font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
							<Truck size={12} className="text-brand-500" />
							Pedidos activos
						</h2>
						<div className="space-y-3">
							{deliveryOrders.map((order) => (
								<ActiveDeliveryCard
									key={order.id}
									order={order}
									onUpdateStatus={(status) =>
										updateDeliveryStatus(order.id, status)
									}
								/>
							))}
						</div>
					</div>
				)}

				<div className="divider" />

				{/* ── New order form (collapsible) ────────────────────────────── */}
				<div>
					<button
						onClick={() => setFormOpen((o) => !o)}
						className="w-full flex items-center justify-between mb-4"
					>
						<h2 className="font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest flex items-center gap-2">
							<Plus size={12} className="text-brand-500" />
							Nuevo pedido
						</h2>
						{formOpen ? (
							<ChevronUp size={14} className="text-ink-tertiary" />
						) : (
							<ChevronDown size={14} className="text-ink-tertiary" />
						)}
					</button>

					{formOpen && (
						<div className="space-y-5 animate-fade-in">
							{/* Customer details */}
							<div className="card rounded-2xl p-4 space-y-3">
								<p className="font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest mb-1">
									Datos del cliente
								</p>
								<div className="relative">
									<User
										size={14}
										className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none"
									/>
									<input
										className="input-base pl-9"
										placeholder="Tu nombre"
										value={name}
										onChange={(e) => setName(e.target.value)}
									/>
								</div>
								<div className="relative">
									<MapPin
										size={14}
										className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none"
									/>
									<input
										className="input-base pl-9"
										placeholder="Dirección de entrega"
										value={address}
										onChange={(e) => setAddress(e.target.value)}
									/>
								</div>
								<div className="relative">
									<Phone
										size={14}
										className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none"
									/>
									<input
										className="input-base pl-9"
										placeholder="Teléfono de contacto"
										type="tel"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
									/>
								</div>
							</div>

							{/* Product selection */}
							<div>
								<p className="font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest mb-3">
									Seleccionar productos
								</p>

								{/* Category chips */}
								<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
									<button
										onClick={() => setActiveCategory("all")}
										className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-display font-bold uppercase transition-all"
										style={
											activeCategory === "all"
												? {
														background: "#f59e0b",
														color: "#080808",
														boxShadow: "0 0 10px rgba(245,158,11,0.3)",
													}
												: {
														background: "#161616",
														color: "#a3a3a3",
														border: "1px solid #272727",
													}
										}
									>
										✦ Todos
									</button>
									{CATEGORIES.map((cat) => (
										<button
											key={cat.id}
											onClick={() => setActiveCategory(cat.id)}
											className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-display font-bold uppercase transition-all"
											style={
												activeCategory === cat.id
													? {
															background: "#f59e0b",
															color: "#080808",
															boxShadow: "0 0 10px rgba(245,158,11,0.3)",
														}
													: {
															background: "#161616",
															color: "#a3a3a3",
															border: "1px solid #272727",
														}
											}
										>
											<span>{cat.icon}</span>
											{cat.name}
										</button>
									))}
								</div>

								{/* Product list */}
								<div className="card rounded-2xl overflow-hidden divide-y divide-surface-3">
									{filtered.map((product) => {
										const qty = getLocalQty(product.id);
										return (
											<div
												key={product.id}
												className="px-4 py-3 flex items-center justify-between gap-3"
											>
												<div className="flex-1 min-w-0">
													<p className="font-display text-ink-primary text-[13px] font-bold uppercase truncate">
														{product.name}
													</p>
													<p className="font-body text-ink-tertiary text-[11px] truncate">
														{product.description}
													</p>
												</div>
												<div className="flex items-center gap-2 shrink-0">
													<span
														className="font-kds text-brand-500"
														style={{ fontSize: "16px", lineHeight: 1 }}
													>
														{formatCurrency(product.price)}
													</span>
													{qty === 0 ? (
														<button
															onClick={() => addToLocalCart(product)}
															className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95"
															style={{
																background: "rgba(245,158,11,0.1)",
																border: "1px solid rgba(245,158,11,0.3)",
															}}
														>
															<Plus size={12} className="text-brand-500" />
														</button>
													) : (
														<div
															className="flex items-center rounded-lg overflow-hidden"
															style={{
																border: "1px solid #272727",
																background: "#161616",
															}}
														>
															<button
																onClick={() => decreaseLocalCart(product.id)}
																className="w-7 h-7 flex items-center justify-center text-ink-secondary hover:text-brand-500"
															>
																<Minus size={11} />
															</button>
															<span className="font-kds text-ink-primary px-1.5 text-[14px]">
																{qty}
															</span>
															<button
																onClick={() => addToLocalCart(product)}
																className="w-7 h-7 flex items-center justify-center text-ink-secondary hover:text-brand-500"
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

							{/* Cart summary */}
							{cartCount > 0 && (
								<div className="card rounded-2xl overflow-hidden animate-slide-up">
									<div className="px-4 pt-4 pb-2">
										<p className="font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest mb-3">
											Tu pedido
										</p>
										<div className="space-y-2">
											{localCart.map((item) => (
												<div
													key={item.productId}
													className="flex items-center justify-between gap-3"
												>
													<span className="font-body text-ink-secondary text-[12px] flex-1 truncate">
														{item.qty}× {item.name}
													</span>
													<span className="font-body text-ink-primary text-[12px] shrink-0">
														{formatCurrency(item.price * item.qty)}
													</span>
													<button
														onClick={() => removeLocalCart(item.productId)}
														className="text-ink-tertiary hover:text-red-400 transition-colors p-0.5"
													>
														<X size={12} />
													</button>
												</div>
											))}
										</div>
									</div>
									<div className="divider mx-4 my-2" />
									<div className="px-4 pb-3 flex items-center justify-between">
										<span className="font-display font-bold text-ink-primary text-[14px] uppercase tracking-wide">
											Total
										</span>
										<span
											className="font-kds text-brand-500"
											style={{ fontSize: "22px", lineHeight: 1 }}
										>
											{formatCurrency(cartTotal)}
										</span>
									</div>
								</div>
							)}

							{/* Payment method */}
							<div>
								<p className="font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest mb-3">
									Método de pago
								</p>
								<div className="grid grid-cols-2 gap-3">
									{(
										[
											{ id: "mercadopago", label: "MercadoPago", emoji: "💳" },
											{ id: "cash", label: "Efectivo", emoji: "💵" },
										] as const
									).map((method) => (
										<button
											key={method.id}
											onClick={() => setPayment(method.id)}
											className="flex flex-col items-center gap-2 rounded-xl py-4 transition-all"
											style={
												payment === method.id
													? {
															background: "rgba(245,158,11,0.1)",
															border: "2px solid rgba(245,158,11,0.5)",
															boxShadow: "0 0 12px rgba(245,158,11,0.15)",
														}
													: {
															background: "#0f0f0f",
															border: "2px solid #1e1e1e",
														}
											}
										>
											<span className="text-2xl">{method.emoji}</span>
											<span
												className="font-display font-bold text-[11px] tracking-wide uppercase"
												style={{
													color: payment === method.id ? "#f59e0b" : "#a3a3a3",
												}}
											>
												{method.label}
											</span>
											{method.id === "cash" && (
												<span className="font-body text-ink-tertiary text-[10px]">
													Contra entrega
												</span>
											)}
										</button>
									))}
								</div>
							</div>

							{/* Confirm button */}
							<button
								onClick={handleConfirm}
								className="btn-primary w-full justify-center rounded-2xl"
								disabled={!canConfirm}
								style={{
									padding: "15px 20px",
									fontSize: "14px",
									letterSpacing: "0.05em",
									opacity: canConfirm ? 1 : 0.4,
									cursor: canConfirm ? "pointer" : "not-allowed",
									boxShadow: canConfirm
										? "0 0 32px rgba(245,158,11,0.3), 0 8px 24px rgba(0,0,0,0.5)"
										: "none",
								}}
							>
								<Truck size={16} />
								Confirmar delivery
								{cartCount > 0 && ` · ${formatCurrency(cartTotal)}`}
							</button>

							<p className="text-center font-body text-ink-tertiary text-[11px] pb-4">
								{VENUE.name} · {VENUE.phone}
							</p>
						</div>
					)}
				</div>
			</div>

			{/* ── Bottom nav ─────────────────────────────────────────────────── */}
			<BottomNav />
		</div>
	);
}
