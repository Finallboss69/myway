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

	const filtered = useMemo(() => {
		const avail = products.filter((p) => p.isAvailable);
		return activeCategory === "all"
			? avail
			: avail.filter((p) => p.categoryId === activeCategory);
	}, [products, activeCategory]);

	const canSubmit =
		name.trim().length >= 2 && address.trim() && cartCount > 0 && !submitting;

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

	return (
		<div
			style={{
				minHeight: "100vh",
				background: "#080808",
				color: "#f0f0f0",
				fontFamily: "'Segoe UI', system-ui, sans-serif",
				paddingBottom: 60,
			}}
		>
			{/* Header */}
			<div
				style={{
					background: "#0a0a0a",
					borderBottom: "1px solid #1a1a1a",
					padding: "16px 20px 14px",
					position: "sticky",
					top: 0,
					zIndex: 40,
				}}
			>
				<div style={{ maxWidth: 480, margin: "0 auto" }}>
					<a
						href="/"
						style={{
							fontSize: 9,
							letterSpacing: "0.3em",
							textTransform: "uppercase",
							color: "#f59e0b",
							textDecoration: "none",
							display: "block",
							marginBottom: 2,
						}}
					>
						MY WAY
					</a>
					<div style={{ fontSize: 16, fontWeight: 700 }}>Delivery</div>
					<div style={{ fontSize: 11, color: "#555" }}>Olivos · GBA Norte</div>
				</div>
			</div>

			<div
				style={{
					maxWidth: 480,
					margin: "0 auto",
					padding: "20px 16px",
					display: "flex",
					flexDirection: "column",
					gap: 20,
				}}
			>
				{/* Your data */}
				<div>
					<p
						style={{
							fontSize: 9,
							letterSpacing: "0.2em",
							textTransform: "uppercase",
							color: "#555",
							marginBottom: 12,
						}}
					>
						Tus datos
					</p>
					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
						{(
							[
								{
									label: "Nombre",
									value: name,
									set: setName,
									placeholder: "Tu nombre completo",
									type: "text",
								},
								{
									label: "Dirección",
									value: address,
									set: setAddress,
									placeholder: "Calle, número, piso...",
									type: "text",
								},
								{
									label: "Teléfono",
									value: phone,
									set: setPhone,
									placeholder: "Opcional",
									type: "tel",
								},
							] as const
						).map(({ label, value, set, placeholder, type }) => (
							<div key={label}>
								<label
									style={{
										fontSize: 10,
										color: "#666",
										display: "block",
										marginBottom: 4,
									}}
								>
									{label}
								</label>
								<input
									type={type}
									value={value}
									onChange={(e) => (set as (v: string) => void)(e.target.value)}
									placeholder={placeholder}
									style={{
										width: "100%",
										background: "#0e0e0e",
										border: "1px solid #1e1e1e",
										borderRadius: 10,
										color: "#f0f0f0",
										padding: "11px 14px",
										fontSize: 14,
										outline: "none",
									}}
								/>
							</div>
						))}
					</div>
				</div>

				{/* Menu */}
				<div>
					<p
						style={{
							fontSize: 9,
							letterSpacing: "0.2em",
							textTransform: "uppercase",
							color: "#555",
							marginBottom: 12,
						}}
					>
						Elegí tu pedido
					</p>

					{/* Category pills */}
					<div
						style={{
							display: "flex",
							gap: 8,
							overflowX: "auto",
							paddingBottom: 8,
							marginBottom: 12,
						}}
					>
						{[{ id: "all", name: "Todos", icon: "" }, ...categories].map(
							(cat) => {
								const active = activeCategory === cat.id;
								return (
									<button
										key={cat.id}
										onClick={() => setActiveCategory(cat.id)}
										style={{
											flexShrink: 0,
											padding: "6px 14px",
											borderRadius: 99,
											border: `1px solid ${active ? "#f59e0b" : "#1e1e1e"}`,
											background: active ? "#f59e0b" : "#0e0e0e",
											color: active ? "#080808" : "#888",
											fontSize: 11,
											fontWeight: 700,
											cursor: "pointer",
										}}
									>
										{cat.icon ? `${cat.icon} ` : ""}
										{cat.name}
									</button>
								);
							},
						)}
					</div>

					{/* Products */}
					{loading ? (
						<div
							style={{
								display: "flex",
								justifyContent: "center",
								padding: 32,
							}}
						>
							<div
								style={{
									width: 28,
									height: 28,
									borderRadius: "50%",
									border: "2px solid #f59e0b",
									borderTopColor: "transparent",
									animation: "spin 0.8s linear infinite",
								}}
							/>
							<style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
						</div>
					) : (
						<div
							style={{
								background: "#0e0e0e",
								border: "1px solid #1e1e1e",
								borderRadius: 16,
								overflow: "hidden",
							}}
						>
							{filtered.length === 0 ? (
								<div
									style={{
										padding: "32px 16px",
										textAlign: "center",
										color: "#555",
										fontSize: 13,
									}}
								>
									No hay productos disponibles
								</div>
							) : (
								filtered.map((product, i) => {
									const qty = getQty(product.id);
									return (
										<div
											key={product.id}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												gap: 12,
												padding: "12px 16px",
												borderTop: i > 0 ? "1px solid #1a1a1a" : "none",
											}}
										>
											<div style={{ flex: 1, minWidth: 0 }}>
												<p
													style={{
														fontSize: 13,
														fontWeight: 700,
														margin: 0,
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
													}}
												>
													{product.name}
												</p>
												{product.description && (
													<p
														style={{
															fontSize: 11,
															color: "#666",
															margin: "2px 0 0",
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
													>
														{product.description}
													</p>
												)}
											</div>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: 10,
													flexShrink: 0,
												}}
											>
												<span
													style={{
														fontSize: 14,
														fontWeight: 700,
														color: "#f59e0b",
													}}
												>
													{formatCurrency(product.price)}
												</span>
												{qty === 0 ? (
													<button
														onClick={() => addToCart(product)}
														style={{
															width: 28,
															height: 28,
															borderRadius: "50%",
															background: "rgba(245,158,11,0.1)",
															border: "1px solid rgba(245,158,11,0.3)",
															color: "#f59e0b",
															fontSize: 18,
															cursor: "pointer",
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
														}}
													>
														+
													</button>
												) : (
													<div
														style={{
															display: "flex",
															alignItems: "center",
															background: "#161616",
															border: "1px solid #272727",
															borderRadius: 8,
															overflow: "hidden",
														}}
													>
														<button
															onClick={() => removeFromCart(product.id)}
															style={{
																width: 28,
																height: 28,
																background: "none",
																border: "none",
																color: "#aaa",
																cursor: "pointer",
																fontSize: 16,
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
															}}
														>
															−
														</button>
														<span
															style={{
																padding: "0 6px",
																fontSize: 13,
																fontWeight: 700,
																color: "#f0f0f0",
																minWidth: 20,
																textAlign: "center",
															}}
														>
															{qty}
														</span>
														<button
															onClick={() => addToCart(product)}
															style={{
																width: 28,
																height: 28,
																background: "none",
																border: "none",
																color: "#aaa",
																cursor: "pointer",
																fontSize: 16,
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
															}}
														>
															+
														</button>
													</div>
												)}
											</div>
										</div>
									);
								})
							)}
						</div>
					)}
				</div>

				{/* Cart summary */}
				{cartCount > 0 && (
					<div
						style={{
							background: "#0e0e0e",
							border: "1px solid rgba(245,158,11,0.2)",
							borderRadius: 16,
							padding: "14px 16px",
						}}
					>
						<p
							style={{
								fontSize: 9,
								letterSpacing: "0.2em",
								textTransform: "uppercase",
								color: "#555",
								marginBottom: 10,
							}}
						>
							Tu pedido
						</p>
						{cart.map((item) => (
							<div
								key={item.productId}
								style={{
									display: "flex",
									justifyContent: "space-between",
									marginBottom: 6,
								}}
							>
								<span style={{ fontSize: 12, color: "#aaa" }}>
									{item.qty}× {item.name}
								</span>
								<span style={{ fontSize: 12, color: "#f0f0f0" }}>
									{formatCurrency(item.price * item.qty)}
								</span>
							</div>
						))}
						<div
							style={{
								borderTop: "1px solid #1e1e1e",
								marginTop: 10,
								paddingTop: 10,
								display: "flex",
								justifyContent: "space-between",
							}}
						>
							<span style={{ fontSize: 12, color: "#666" }}>Total</span>
							<span
								style={{
									fontSize: 20,
									fontWeight: 700,
									color: "#f59e0b",
									lineHeight: 1,
								}}
							>
								{formatCurrency(cartTotal)}
							</span>
						</div>
					</div>
				)}

				{/* Notes */}
				<div>
					<label
						style={{
							fontSize: 10,
							color: "#666",
							display: "block",
							marginBottom: 4,
						}}
					>
						Notas (opcional)
					</label>
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Instrucciones especiales, alergias..."
						rows={2}
						style={{
							width: "100%",
							background: "#0e0e0e",
							border: "1px solid #1e1e1e",
							borderRadius: 10,
							color: "#f0f0f0",
							padding: "11px 14px",
							fontSize: 13,
							outline: "none",
							resize: "none",
						}}
					/>
				</div>

				{/* Payment */}
				<div>
					<p
						style={{
							fontSize: 9,
							letterSpacing: "0.2em",
							textTransform: "uppercase",
							color: "#555",
							marginBottom: 12,
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
								{
									id: "efectivo",
									label: "Efectivo",
									sub: "Contra entrega",
								},
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
									borderRadius: 14,
									border: `2px solid ${payment === m.id ? "rgba(245,158,11,0.5)" : "#1e1e1e"}`,
									background:
										payment === m.id ? "rgba(245,158,11,0.08)" : "#0e0e0e",
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
						<p style={{ fontSize: 13, color: "#f87171" }}>{submitError}</p>
					</div>
				)}

				{/* Submit */}
				<button
					onClick={handleSubmit}
					disabled={!canSubmit}
					style={{
						width: "100%",
						padding: "15px",
						borderRadius: 14,
						border: "none",
						background: "#f59e0b",
						color: "#080808",
						fontSize: 14,
						fontWeight: 700,
						cursor: canSubmit ? "pointer" : "not-allowed",
						opacity: canSubmit ? 1 : 0.4,
						letterSpacing: "0.05em",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 8,
					}}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M5 12h14M12 5l7 7-7 7" />
					</svg>
					{submitting
						? "Enviando..."
						: `Confirmar pedido${cartCount > 0 ? ` · ${formatCurrency(cartTotal)}` : ""}`}
				</button>
			</div>
		</div>
	);
}
