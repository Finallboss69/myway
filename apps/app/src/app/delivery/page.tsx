"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Category {
	id: string;
	name: string;
	icon: string;
	order: number;
}

interface Product {
	id: string;
	name: string;
	description: string | null;
	price: number;
	categoryId: string;
	isAvailable: boolean;
}

interface CartItem {
	productId: string;
	name: string;
	price: number;
	qty: number;
}

function formatCurrency(n: number) {
	return "$" + Math.round(n).toLocaleString("es-AR");
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────

interface CheckoutModalProps {
	onClose: () => void;
	name: string;
	setName: (v: string) => void;
	address: string;
	setAddress: (v: string) => void;
	phone: string;
	setPhone: (v: string) => void;
	notes: string;
	setNotes: (v: string) => void;
	payment: "efectivo" | "transferencia";
	setPayment: (v: "efectivo" | "transferencia") => void;
	canSubmit: boolean;
	submitting: boolean;
	submitError: string | null;
	handleSubmit: () => void;
	cartTotal: number;
	cartCount: number;
}

function CheckoutModal({
	onClose,
	name,
	setName,
	address,
	setAddress,
	phone,
	setPhone,
	notes,
	setNotes,
	payment,
	setPayment,
	canSubmit,
	submitting,
	submitError,
	handleSubmit,
	cartTotal,
	cartCount,
}: CheckoutModalProps) {
	const inputStyle: React.CSSProperties = {
		width: "100%",
		boxSizing: "border-box",
		background: "#161616",
		border: "1px solid #1e1e1e",
		borderRadius: 10,
		color: "#f5f5f5",
		padding: "11px 14px",
		fontSize: 14,
		outline: "none",
		fontFamily: '"DM Sans", system-ui, sans-serif',
	};
	const labelStyle: React.CSSProperties = {
		fontSize: 10,
		color: "#888",
		display: "block",
		marginBottom: 5,
		letterSpacing: "0.05em",
		textTransform: "uppercase" as const,
	};

	return (
		<>
			<style>{`
				@keyframes slideUp {
					from { transform: translateY(100%); opacity: 0; }
					to   { transform: translateY(0);    opacity: 1; }
				}
				@keyframes fadeIn {
					from { opacity: 0; }
					to   { opacity: 1; }
				}
				@media (min-width: 768px) {
					.checkout-card {
						animation: fadeIn 0.2s ease !important;
						border-radius: 20px !important;
						max-height: 90vh;
						overflow-y: auto;
					}
				}
				@media (max-width: 767px) {
					.checkout-card {
						animation: slideUp 0.3s ease !important;
						border-radius: 20px 20px 0 0 !important;
						max-height: 92vh;
						overflow-y: auto;
					}
				}
			`}</style>

			{/* Backdrop */}
			<div
				onClick={onClose}
				style={{
					position: "fixed",
					inset: 0,
					background: "rgba(0,0,0,0.75)",
					zIndex: 100,
					display: "flex",
					alignItems: "flex-end",
					justifyContent: "center",
					padding: "0",
				}}
			>
				{/* Card */}
				<div
					className="checkout-card"
					onClick={(e) => e.stopPropagation()}
					style={{
						background: "#101010",
						width: "100%",
						maxWidth: 520,
						padding: "28px 24px 32px",
						fontFamily: '"DM Sans", system-ui, sans-serif',
						display: "flex",
						flexDirection: "column",
						gap: 20,
					}}
				>
					{/* Header */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<div>
							<div
								style={{
									fontSize: 18,
									fontWeight: 700,
									color: "#f5f5f5",
									letterSpacing: "-0.01em",
								}}
							>
								Finalizar pedido
							</div>
							<div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
								{cartCount} {cartCount === 1 ? "producto" : "productos"} ·{" "}
								{formatCurrency(cartTotal)}
							</div>
						</div>
						<button
							onClick={onClose}
							style={{
								width: 32,
								height: 32,
								borderRadius: "50%",
								background: "#161616",
								border: "1px solid #1e1e1e",
								color: "#888",
								fontSize: 18,
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								lineHeight: 1,
								flexShrink: 0,
							}}
						>
							×
						</button>
					</div>

					{/* Fields */}
					<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
						<div>
							<label style={labelStyle}>Nombre *</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Tu nombre completo"
								style={inputStyle}
							/>
						</div>
						<div>
							<label style={labelStyle}>Dirección *</label>
							<input
								type="text"
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								placeholder="Calle, número, piso..."
								style={inputStyle}
							/>
						</div>
						<div>
							<label style={labelStyle}>Teléfono (opcional)</label>
							<input
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="11 XXXX-XXXX"
								style={inputStyle}
							/>
						</div>
					</div>

					{/* Payment */}
					<div>
						<p
							style={{
								fontSize: 10,
								letterSpacing: "0.05em",
								textTransform: "uppercase",
								color: "#888",
								marginBottom: 10,
							}}
						>
							Método de pago
						</p>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: 10,
							}}
						>
							{(
								[
									{ id: "efectivo", label: "Efectivo", sub: "Contra entrega" },
									{
										id: "transferencia",
										label: "Transferencia",
										sub: "Bancaria",
									},
								] as const
							).map((m) => (
								<button
									key={m.id}
									onClick={() => setPayment(m.id)}
									style={{
										padding: "14px 12px",
										borderRadius: 12,
										border: `2px solid ${payment === m.id ? "rgba(245,158,11,0.5)" : "#1e1e1e"}`,
										background:
											payment === m.id ? "rgba(245,158,11,0.08)" : "#161616",
										cursor: "pointer",
										textAlign: "center",
									}}
								>
									<div
										style={{
											fontSize: 13,
											fontWeight: 700,
											color: payment === m.id ? "#f59e0b" : "#aaa",
										}}
									>
										{m.label}
									</div>
									<div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>
										{m.sub}
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Notes */}
					<div>
						<label style={labelStyle}>Notas (opcional)</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Instrucciones especiales, alergias..."
							rows={2}
							style={{
								...inputStyle,
								resize: "none",
							}}
						/>
					</div>

					{/* Error */}
					{submitError && (
						<div
							style={{
								background: "rgba(239,68,68,0.1)",
								border: "1px solid rgba(239,68,68,0.25)",
								borderRadius: 10,
								padding: "12px 16px",
							}}
						>
							<p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>
								{submitError}
							</p>
						</div>
					)}

					{/* Submit */}
					<button
						onClick={handleSubmit}
						disabled={!canSubmit}
						style={{
							width: "100%",
							padding: "15px",
							borderRadius: 12,
							border: "none",
							background: "#f59e0b",
							color: "#080808",
							fontSize: 15,
							fontWeight: 700,
							cursor: canSubmit ? "pointer" : "not-allowed",
							opacity: canSubmit ? 1 : 0.4,
							letterSpacing: "0.03em",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
						}}
					>
						{submitting ? (
							"Enviando..."
						) : (
							<>
								Confirmar pedido
								<span style={{ opacity: 0.7 }}>·</span>
								{formatCurrency(cartTotal)}
							</>
						)}
					</button>
				</div>
			</div>
		</>
	);
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function SkeletonCards() {
	return (
		<>
			<style>{`
				@keyframes pulse {
					0%, 100% { opacity: 0.4; }
					50%       { opacity: 0.9; }
				}
				.skeleton-pulse { animation: pulse 1.4s ease-in-out infinite; }
			`}</style>
			{Array.from({ length: 5 }).map((_, i) => (
				<div
					key={i}
					style={{
						display: "flex",
						gap: 14,
						padding: "14px 0",
						borderBottom: "1px solid #1e1e1e",
					}}
				>
					<div
						className="skeleton-pulse"
						style={{
							width: 90,
							height: 70,
							borderRadius: 10,
							background: "#1e1e1e",
							flexShrink: 0,
						}}
					/>
					<div
						style={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							gap: 8,
							justifyContent: "center",
						}}
					>
						<div
							className="skeleton-pulse"
							style={{
								height: 14,
								width: "60%",
								borderRadius: 6,
								background: "#1e1e1e",
							}}
						/>
						<div
							className="skeleton-pulse"
							style={{
								height: 11,
								width: "80%",
								borderRadius: 6,
								background: "#1e1e1e",
							}}
						/>
						<div
							className="skeleton-pulse"
							style={{
								height: 14,
								width: "25%",
								borderRadius: 6,
								background: "#1e1e1e",
							}}
						/>
					</div>
				</div>
			))}
		</>
	);
}

// ─── QtyControl ───────────────────────────────────────────────────────────────

function QtyControl({
	qty,
	onAdd,
	onRemove,
}: {
	qty: number;
	onAdd: () => void;
	onRemove: () => void;
}) {
	const btnBase: React.CSSProperties = {
		width: 30,
		height: 30,
		background: "none",
		border: "none",
		color: "#f59e0b",
		cursor: "pointer",
		fontSize: 18,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		lineHeight: 1,
	};

	if (qty === 0) {
		return (
			<button
				onClick={onAdd}
				style={{
					width: 32,
					height: 32,
					borderRadius: "50%",
					background: "rgba(245,158,11,0.1)",
					border: "1px solid rgba(245,158,11,0.35)",
					color: "#f59e0b",
					fontSize: 20,
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				+
			</button>
		);
	}
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				background: "#161616",
				border: "1px solid #272727",
				borderRadius: 8,
				overflow: "hidden",
				flexShrink: 0,
			}}
		>
			<button onClick={onRemove} style={btnBase}>
				−
			</button>
			<span
				style={{
					padding: "0 6px",
					fontSize: 13,
					fontWeight: 700,
					color: "#f5f5f5",
					minWidth: 20,
					textAlign: "center",
				}}
			>
				{qty}
			</span>
			<button onClick={onAdd} style={btnBase}>
				+
			</button>
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PublicDeliveryPage() {
	const router = useRouter();

	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [phone, setPhone] = useState("");
	const [notes, setNotes] = useState("");
	const [payment, setPayment] = useState<"efectivo" | "transferencia">(
		"efectivo",
	);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [activeCategory, setActiveCategory] = useState("all");
	const [categories, setCategories] = useState<Category[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [showCheckout, setShowCheckout] = useState(false);

	useEffect(() => {
		Promise.all([
			fetch("/api/categories").then((r) => r.json()),
			fetch("/api/products?available=true").then((r) => r.json()),
		])
			.then(([cats, prods]) => {
				setCategories(Array.isArray(cats) ? cats : []);
				setProducts(Array.isArray(prods) ? prods : []);
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	const addToCart = (p: Product) => {
		setCart((prev) => {
			const ex = prev.find((i) => i.productId === p.id);
			if (ex)
				return prev.map((i) =>
					i.productId === p.id ? { ...i, qty: i.qty + 1 } : i,
				);
			return [
				...prev,
				{ productId: p.id, name: p.name, price: p.price, qty: 1 },
			];
		});
	};

	const removeFromCart = (productId: string) => {
		setCart((prev) => {
			const ex = prev.find((i) => i.productId === productId);
			if (!ex) return prev;
			if (ex.qty <= 1) return prev.filter((i) => i.productId !== productId);
			return prev.map((i) =>
				i.productId === productId ? { ...i, qty: i.qty - 1 } : i,
			);
		});
	};

	const getQty = (id: string) => cart.find((i) => i.productId === id)?.qty ?? 0;

	const cartTotal = useMemo(
		() => cart.reduce((s, i) => s + i.price * i.qty, 0),
		[cart],
	);
	const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

	const canSubmit =
		name.trim().length >= 2 &&
		address.trim().length > 0 &&
		cartCount > 0 &&
		!submitting;

	const handleSubmit = async () => {
		if (!canSubmit) return;
		setSubmitting(true);
		setSubmitError(null);
		try {
			const res = await fetch("/api/delivery", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					customerName: name.trim(),
					address: address.trim(),
					phone: phone.trim() || null,
					total: cartTotal,
					paymentMethod: payment,
					notes: notes.trim() || null,
					items: cart.map((i) => ({
						name: i.name,
						qty: i.qty,
						price: i.price,
					})),
				}),
			});
			if (!res.ok) throw new Error("Error al enviar el pedido");
			const order = (await res.json()) as { id: string };
			router.push(`/track/${order.id}`);
		} catch (e) {
			setSubmitError(e instanceof Error ? e.message : "Error desconocido");
			setSubmitting(false);
		}
	};

	const allCategories = useMemo(
		() => [{ id: "all", name: "Todos", icon: "", order: -1 }, ...categories],
		[categories],
	);

	// Group categories under parent sections for sidebar display
	const categoryGroups = useMemo(() => {
		const tragos = categories.filter((c) =>
			["c1", "c1b", "c1c", "c1d"].includes(c.id),
		);
		const bebidas = categories.filter((c) =>
			["c2", "c4", "c4b", "c3", "c6"].includes(c.id),
		);
		const comida = categories.filter((c) =>
			["c5a", "c5b", "c5c", "c5d", "c5e", "c5f"].includes(c.id),
		);
		const otros = categories.filter((c) => ["c7"].includes(c.id));
		return [
			{ label: "Tragos", cats: tragos },
			{ label: "Bebidas", cats: bebidas },
			{ label: "Comida", cats: comida },
			{ label: "Otros", cats: otros },
		].filter((g) => g.cats.length > 0);
	}, [categories]);

	// Group filtered products by category for "all" view
	const groupedProducts = useMemo(() => {
		const avail = products.filter((p) => p.isAvailable);
		if (activeCategory !== "all") {
			const cat = categories.find((c) => c.id === activeCategory);
			return cat
				? [
						{
							category: cat,
							items: avail.filter((p) => p.categoryId === cat.id),
						},
					]
				: [];
		}
		return categories
			.map((cat) => ({
				category: cat,
				items: avail.filter((p) => p.categoryId === cat.id),
			}))
			.filter((g) => g.items.length > 0);
	}, [products, categories, activeCategory]);

	return (
		<>
			<style>{`
				@keyframes spin   { to { transform: rotate(360deg); } }
				@keyframes pulse  { 0%,100% { opacity:.4 } 50% { opacity:.9 } }

				* { box-sizing: border-box; }

				body { margin: 0; }

				/* scrollbar */
				.cat-pills::-webkit-scrollbar { display: none; }
				.cat-pills { -ms-overflow-style: none; scrollbar-width: none; }

				/* Desktop layout */
				@media (min-width: 768px) {
					.delivery-layout {
						display: grid;
						grid-template-columns: 240px 1fr 320px;
						gap: 0;
						max-width: 1200px;
						margin: 0 auto;
						min-height: calc(100vh - 64px);
						align-items: start;
					}
					.sidebar-left {
						position: sticky;
						top: 64px;
						padding: 24px 0 24px 24px;
					}
					.main-content {
						padding: 24px;
						border-left: 1px solid #1e1e1e;
						border-right: 1px solid #1e1e1e;
						min-height: calc(100vh - 64px);
					}
					.sidebar-right {
						position: sticky;
						top: 64px;
						padding: 24px 24px 24px 24px;
					}
					.mobile-only  { display: none !important; }
					.desktop-only { display: block !important; }
				}

				/* Mobile layout */
				@media (max-width: 767px) {
					.delivery-layout {
						display: block;
					}
					.sidebar-left  { display: none; }
					.sidebar-right { display: none; }
					.main-content  { padding: 16px; }
					.mobile-only  { display: flex !important; }
					.desktop-only { display: none !important; }
				}

				/* Product card hover */
				.product-card:hover { background: #141414 !important; }

				/* Category item hover */
				.cat-item:hover { background: rgba(245,158,11,0.08) !important; }
			`}</style>

			<div
				style={{
					minHeight: "100vh",
					background: "#080808",
					color: "#f5f5f5",
					fontFamily: '"DM Sans", system-ui, sans-serif',
					paddingBottom: 80,
				}}
			>
				{/* ── Header ─────────────────────────────────────────── */}
				<div
					style={{
						background: "#101010",
						borderBottom: "1px solid #1e1e1e",
						padding: "0 24px",
						height: 64,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						position: "sticky",
						top: 0,
						zIndex: 40,
					}}
				>
					<div>
						<a
							href="/"
							style={{
								textDecoration: "none",
								display: "block",
								marginBottom: 1,
							}}
						>
							<img
								src="/logo.svg"
								alt="My Way"
								style={{
									height: 24,
									width: "auto",
									filter: "invert(1)",
									display: "block",
								}}
							/>
						</a>
						<div
							style={{
								fontSize: 15,
								fontWeight: 700,
								letterSpacing: "-0.01em",
							}}
						>
							Delivery
						</div>
					</div>
					<div style={{ fontSize: 11, color: "#555" }}>Olivos · GBA Norte</div>
				</div>

				{/* ── 3-column layout ────────────────────────────────── */}
				<div className="delivery-layout">
					{/* ── Left sidebar: categories ───────────────────── */}
					<div className="sidebar-left">
						<p
							style={{
								fontSize: 9,
								letterSpacing: "0.25em",
								textTransform: "uppercase",
								color: "#555",
								marginBottom: 12,
								paddingLeft: 12,
							}}
						>
							Categorías
						</p>
						<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
							{/* Todos button */}
							<button
								className="cat-item"
								onClick={() => setActiveCategory("all")}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 10,
									padding: "9px 12px",
									borderRadius: 10,
									border: "none",
									background:
										activeCategory === "all"
											? "rgba(245,158,11,0.12)"
											: "transparent",
									color: activeCategory === "all" ? "#f59e0b" : "#888",
									fontSize: 13,
									fontWeight: activeCategory === "all" ? 700 : 400,
									cursor: "pointer",
									textAlign: "left",
									width: "100%",
									transition: "background 0.15s, color 0.15s",
									marginBottom: 8,
								}}
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<rect x="3" y="3" width="7" height="7" />
									<rect x="14" y="3" width="7" height="7" />
									<rect x="3" y="14" width="7" height="7" />
									<rect x="14" y="14" width="7" height="7" />
								</svg>
								Todos
							</button>

							{/* Grouped categories */}
							{categoryGroups.map((group) => (
								<div key={group.label} style={{ marginBottom: 12 }}>
									<p
										style={{
											fontSize: 9,
											letterSpacing: "0.2em",
											textTransform: "uppercase",
											color: "#444",
											margin: "0 0 4px 12px",
											fontWeight: 700,
										}}
									>
										{group.label}
									</p>
									{group.cats.map((cat) => {
										const active = activeCategory === cat.id;
										return (
											<button
												key={cat.id}
												className="cat-item"
												onClick={() => setActiveCategory(cat.id)}
												style={{
													display: "flex",
													alignItems: "center",
													gap: 10,
													padding: "8px 12px",
													borderRadius: 10,
													border: "none",
													background: active
														? "rgba(245,158,11,0.12)"
														: "transparent",
													color: active ? "#f59e0b" : "#888",
													fontSize: 13,
													fontWeight: active ? 700 : 400,
													cursor: "pointer",
													textAlign: "left",
													width: "100%",
													transition: "background 0.15s, color 0.15s",
												}}
											>
												<span style={{ fontSize: 15, lineHeight: 1 }}>
													{cat.icon}
												</span>
												{cat.name}
											</button>
										);
									})}
								</div>
							))}
						</div>
					</div>

					{/* ── Center: product list ────────────────────────── */}
					<div className="main-content">
						{/* Mobile category pills */}
						<div
							className="cat-pills mobile-only"
							style={{
								gap: 8,
								overflowX: "auto",
								paddingBottom: 12,
								marginBottom: 12,
							}}
						>
							{allCategories.map((cat) => {
								const active = activeCategory === cat.id;
								return (
									<button
										key={cat.id}
										onClick={() => setActiveCategory(cat.id)}
										style={{
											flexShrink: 0,
											padding: "7px 14px",
											borderRadius: 99,
											border: `1px solid ${active ? "#f59e0b" : "#1e1e1e"}`,
											background: active ? "#f59e0b" : "#101010",
											color: active ? "#080808" : "#888",
											fontSize: 12,
											fontWeight: 700,
											cursor: "pointer",
											whiteSpace: "nowrap",
										}}
									>
										{cat.icon ? `${cat.icon} ` : ""}
										{cat.name}
									</button>
								);
							})}
						</div>

						{/* Products grouped by category */}
						{loading ? (
							<SkeletonCards />
						) : groupedProducts.length === 0 ? (
							<div
								style={{
									padding: "48px 16px",
									textAlign: "center",
									color: "#444",
									fontSize: 14,
								}}
							>
								No hay productos disponibles
							</div>
						) : (
							<div
								style={{ display: "flex", flexDirection: "column", gap: 28 }}
							>
								{groupedProducts.map(({ category, items }) => (
									<div key={category.id}>
										{/* Category header */}
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: 10,
												marginBottom: 14,
												paddingBottom: 10,
												borderBottom: "1px solid #1a1a1a",
											}}
										>
											<span style={{ fontSize: 22 }}>{category.icon}</span>
											<div>
												<p
													style={{
														fontSize: 18,
														fontWeight: 700,
														color: "#f5f5f5",
														margin: 0,
														letterSpacing: "-0.02em",
													}}
												>
													{category.name}
												</p>
												<p
													style={{
														fontSize: 11,
														color: "#555",
														margin: "2px 0 0",
													}}
												>
													{items.length} producto{items.length !== 1 ? "s" : ""}
												</p>
											</div>
										</div>
										{/* Products in this category */}
										<div style={{ display: "flex", flexDirection: "column" }}>
											{items.map((product, i) => {
												const qty = getQty(product.id);
												return (
													<div
														key={product.id}
														className="product-card"
														style={{
															display: "flex",
															alignItems: "center",
															gap: 14,
															padding: "12px 0",
															borderBottom:
																i < items.length - 1
																	? "1px solid #1e1e1e"
																	: "none",
															background: "transparent",
															transition: "background 0.15s",
														}}
													>
														{/* Info */}
														<div style={{ flex: 1, minWidth: 0 }}>
															<p
																style={{
																	fontSize: 14,
																	fontWeight: 700,
																	margin: 0,
																	color: "#f5f5f5",
																	letterSpacing: "-0.01em",
																}}
															>
																{product.name}
															</p>
															{product.description && (
																<p
																	style={{
																		fontSize: 12,
																		color: "#888",
																		margin: "3px 0 6px",
																		overflow: "hidden",
																		textOverflow: "ellipsis",
																		display: "-webkit-box",
																		WebkitLineClamp: 2,
																		WebkitBoxOrient: "vertical",
																	}}
																>
																	{product.description}
																</p>
															)}
															<p
																style={{
																	fontSize: 15,
																	fontWeight: 700,
																	color: "#f59e0b",
																	margin: 0,
																}}
															>
																{formatCurrency(product.price)}
															</p>
														</div>

														{/* Qty control */}
														<QtyControl
															qty={qty}
															onAdd={() => addToCart(product)}
															onRemove={() => removeFromCart(product.id)}
														/>
													</div>
												);
											})}
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* ── Right sidebar: cart (desktop) ──────────────── */}
					<div className="sidebar-right desktop-only">
						<div
							style={{
								background: "#101010",
								border: "1px solid #1e1e1e",
								borderRadius: 16,
								padding: "20px",
								display: "flex",
								flexDirection: "column",
								gap: 16,
							}}
						>
							<div
								style={{
									fontSize: 15,
									fontWeight: 700,
									letterSpacing: "-0.01em",
								}}
							>
								Tu pedido
							</div>

							{cartCount === 0 ? (
								<div
									style={{
										padding: "24px 0",
										textAlign: "center",
										color: "#444",
										fontSize: 13,
									}}
								>
									<div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>
										🛒
									</div>
									Tu carrito está vacío
								</div>
							) : (
								<>
									{/* Cart items */}
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: 10,
										}}
									>
										{cart.map((item) => (
											<div
												key={item.productId}
												style={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													gap: 8,
												}}
											>
												<div style={{ flex: 1, minWidth: 0 }}>
													<span
														style={{
															fontSize: 12,
															color: "#aaa",
															display: "block",
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
													>
														{item.qty}× {item.name}
													</span>
												</div>
												<span
													style={{
														fontSize: 13,
														fontWeight: 600,
														color: "#f5f5f5",
														flexShrink: 0,
													}}
												>
													{formatCurrency(item.price * item.qty)}
												</span>
											</div>
										))}
									</div>

									{/* Total */}
									<div
										style={{
											borderTop: "1px solid #1e1e1e",
											paddingTop: 14,
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
										}}
									>
										<span style={{ fontSize: 12, color: "#666" }}>Total</span>
										<span
											style={{
												fontSize: 22,
												fontWeight: 700,
												color: "#f59e0b",
												letterSpacing: "-0.02em",
											}}
										>
											{formatCurrency(cartTotal)}
										</span>
									</div>

									{/* Checkout button */}
									<button
										onClick={() => setShowCheckout(true)}
										style={{
											width: "100%",
											padding: "13px",
											borderRadius: 12,
											border: "none",
											background: "#f59e0b",
											color: "#080808",
											fontSize: 14,
											fontWeight: 700,
											cursor: "pointer",
											letterSpacing: "0.02em",
										}}
									>
										Ir al checkout →
									</button>
								</>
							)}
						</div>
					</div>
				</div>

				{/* ── Mobile: floating cart bar ──────────────────────── */}
				{cartCount > 0 && (
					<div
						className="mobile-only"
						style={{
							position: "fixed",
							bottom: 16,
							left: 16,
							right: 16,
							zIndex: 50,
							background: "#f59e0b",
							borderRadius: 14,
							padding: "14px 18px",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
							cursor: "pointer",
						}}
						onClick={() => setShowCheckout(true)}
					>
						<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
							<span style={{ fontSize: 16 }}>🛒</span>
							<span
								style={{
									background: "#080808",
									color: "#f59e0b",
									fontSize: 11,
									fontWeight: 700,
									borderRadius: 99,
									padding: "2px 8px",
								}}
							>
								{cartCount}
							</span>
						</div>
						<span
							style={{
								fontSize: 14,
								fontWeight: 700,
								color: "#080808",
								letterSpacing: "0.01em",
							}}
						>
							{formatCurrency(cartTotal)} · Ir al checkout
						</span>
					</div>
				)}
			</div>

			{/* ── Checkout modal ──────────────────────────────────────── */}
			{showCheckout && (
				<CheckoutModal
					onClose={() => setShowCheckout(false)}
					name={name}
					setName={setName}
					address={address}
					setAddress={setAddress}
					phone={phone}
					setPhone={setPhone}
					notes={notes}
					setNotes={setNotes}
					payment={payment}
					setPayment={setPayment}
					canSubmit={canSubmit}
					submitting={submitting}
					submitError={submitError}
					handleSubmit={handleSubmit}
					cartTotal={cartTotal}
					cartCount={cartCount}
				/>
			)}
		</>
	);
}
