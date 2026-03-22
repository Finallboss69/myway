"use client";

import { useState, useMemo, useEffect } from "react";
import {
	Truck,
	MapPin,
	Phone,
	User,
	Plus,
	Minus,
	X,
	Clock,
	UtensilsCrossed,
	ShoppingCart,
	Banknote,
	CreditCard,
	Smartphone,
	ChevronUp,
	ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
	id: string;
	name: string;
	icon: string;
	order: number;
}

interface Product {
	id: string;
	name: string;
	description: string;
	price: number;
	categoryId: string;
	target: "bar" | "kitchen";
	isAvailable: boolean;
	isPoolChip: boolean;
}

interface LocalCartItem {
	productId: string;
	name: string;
	price: number;
	qty: number;
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────

function BottomNav() {
	return (
		<nav className="mobile-nav">
			<Link href="/customer/menu" className="mobile-nav-item">
				<UtensilsCrossed size={20} />
				<span>Menú</span>
			</Link>
			<Link href="/customer/menu/cart" className="mobile-nav-item">
				<ShoppingCart size={20} />
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

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function DeliveryPage() {
	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [phone, setPhone] = useState("");
	const [notes, setNotes] = useState("");
	const [payment, setPayment] = useState<"mercadopago" | "cash">("mercadopago");
	const [localCart, setLocalCart] = useState<LocalCartItem[]>([]);
	const [activeCategory, setActiveCategory] = useState("all");
	const [formOpen, setFormOpen] = useState(true);
	const [confirmed, setConfirmed] = useState(false);
	const [confirmedAddress, setConfirmedAddress] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const [categories, setCategories] = useState<Category[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loadingData, setLoadingData] = useState(true);

	// Fetch products and categories
	useEffect(() => {
		async function fetchData() {
			try {
				const [catRes, prodRes] = await Promise.all([
					fetch("/api/categories"),
					fetch("/api/products?available=true"),
				]);
				if (!catRes.ok || !prodRes.ok) return;
				const [cats, prods] = await Promise.all([
					catRes.json(),
					prodRes.json(),
				]);
				setCategories(cats);
				setProducts(prods);
			} catch {
				// silently fail, products will just be empty
			} finally {
				setLoadingData(false);
			}
		}
		fetchData();
	}, []);

	// ─── Local cart helpers ───────────────────────────────────────────────────

	const addToLocalCart = (p: Product) => {
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
				? products.filter((p) => p.isAvailable)
				: products.filter(
						(p) => p.categoryId === activeCategory && p.isAvailable,
					),
		[activeCategory, products],
	);

	const canConfirm =
		name.trim() && address.trim() && phone.trim() && cartCount > 0;

	const handleConfirm = async () => {
		if (!canConfirm) return;
		try {
			setSubmitting(true);
			setSubmitError(null);
			const res = await fetch("/api/delivery", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					customerName: name.trim(),
					address: address.trim(),
					phone: phone.trim(),
					total: cartTotal,
					paymentMethod: payment,
					notes: notes.trim(),
					items: localCart.map((i) => ({
						name: i.name,
						qty: i.qty,
						price: i.price,
					})),
				}),
			});
			if (!res.ok) throw new Error("Error al enviar el pedido");
			setConfirmedAddress(address.trim());
			setConfirmed(true);
		} catch (e) {
			setSubmitError(e instanceof Error ? e.message : "Error desconocido");
		} finally {
			setSubmitting(false);
		}
	};

	const handleReset = () => {
		setConfirmed(false);
		setLocalCart([]);
		setName("");
		setAddress("");
		setPhone("");
		setNotes("");
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
									{categories.map((cat) => (
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
								{loadingData ? (
									<div className="flex items-center justify-center py-8">
										<div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
									</div>
								) : (
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
										{filtered.length === 0 && (
											<div className="px-4 py-8 text-center">
												<p className="font-body text-ink-tertiary text-[13px]">
													No hay productos disponibles
												</p>
											</div>
										)}
									</div>
								)}
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

							{/* Notes */}
							<div className="card rounded-2xl p-4">
								<label className="block font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest mb-2">
									Notas adicionales
								</label>
								<textarea
									className="input-base resize-none text-[13px]"
									rows={2}
									placeholder="Instrucciones especiales, alergias..."
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
							</div>

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

							{/* Submit error */}
							{submitError && (
								<div
									className="rounded-xl px-4 py-3"
									style={{
										background: "rgba(239,68,68,0.12)",
										border: "1px solid rgba(239,68,68,0.3)",
									}}
								>
									<p className="font-body text-red-400 text-[13px]">
										{submitError}
									</p>
								</div>
							)}

							{/* Confirm button */}
							<button
								onClick={handleConfirm}
								className="btn-primary w-full justify-center rounded-2xl"
								disabled={!canConfirm || submitting}
								style={{
									padding: "15px 20px",
									fontSize: "14px",
									letterSpacing: "0.05em",
									opacity: canConfirm && !submitting ? 1 : 0.4,
									cursor: canConfirm && !submitting ? "pointer" : "not-allowed",
									boxShadow:
										canConfirm && !submitting
											? "0 0 32px rgba(245,158,11,0.3), 0 8px 24px rgba(0,0,0,0.5)"
											: "none",
								}}
							>
								<Truck size={16} />
								{submitting
									? "Enviando…"
									: `Confirmar delivery${cartCount > 0 ? ` · ${formatCurrency(cartTotal)}` : ""}`}
							</button>

							<p className="text-center font-body text-ink-tertiary text-[11px] pb-4">
								My Way · Bar & Pool · Buenos Aires
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
