"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	ChevronLeft,
	Plus,
	Minus,
	Clock,
	CreditCard,
	Banknote,
	Smartphone,
	X,
	ShoppingCart,
	Send,
	Check,
	LayoutGrid,
	ListOrdered,
	LogOut,
	ArrowRightLeft,
} from "lucide-react";
import { formatCurrency, elapsedMinutes } from "@/lib/utils";
import type {
	Table,
	Order,
	CartItem,
	Product,
	Category,
	Zone,
	PaymentMethod,
} from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { posHeaders } from "@/lib/admin-pin";
import QRCode from "react-qr-code";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function POSSidebar({
	activePath,
	staffName,
}: {
	activePath: string;
	staffName?: string;
}) {
	const displayName = staffName || "Cajero";
	const initials = displayName
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<nav
			className="sidebar top-accent"
			style={{ width: 240, position: "relative" }}
		>
			<div
				style={{
					padding: "24px 20px 18px",
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<img
					src="/logo.svg"
					alt="My Way"
					style={{
						height: 22,
						width: "auto",
						filter: "invert(1)",
						display: "block",
					}}
				/>
				<div
					className="font-display text-ink-disabled uppercase"
					style={{ fontSize: 9, letterSpacing: "0.35em", marginTop: 5 }}
				>
					Punto de Venta
				</div>
			</div>
			<div className="flex flex-col gap-0.5 p-2 flex-1 mt-1">
				<Link
					href="/pos/salon"
					className={`sidebar-item ${activePath === "salon" ? "active" : ""}`}
					style={
						activePath === "salon"
							? { borderLeft: "2px solid var(--gold)", paddingLeft: 14 }
							: {}
					}
				>
					<LayoutGrid size={15} />
					Salón
				</Link>
				<Link
					href="/pos/orders"
					className={`sidebar-item ${activePath === "orders" ? "active" : ""}`}
					style={
						activePath === "orders"
							? { borderLeft: "2px solid var(--gold)", paddingLeft: 14 }
							: {}
					}
				>
					<ListOrdered size={15} />
					Pedidos
				</Link>
			</div>
			<div
				style={{ padding: "12px 12px 16px", borderTop: "1px solid var(--s3)" }}
			>
				<div
					className="flex items-center gap-2.5 rounded-xl mb-2"
					style={{
						padding: "10px 12px",
						background: "var(--s2)",
						border: "1px solid var(--s3)",
					}}
				>
					<div
						className="flex items-center justify-center flex-shrink-0"
						style={{
							width: 34,
							height: 34,
							borderRadius: "50%",
							background: "rgba(245,158,11,0.15)",
							border: "1px solid rgba(245,158,11,0.3)",
						}}
					>
						<span
							className="font-kds text-brand-500"
							style={{ fontSize: 13, lineHeight: 1 }}
						>
							{initials}
						</span>
					</div>
					<div className="flex-1 min-w-0">
						<div
							className="font-display text-ink-primary truncate"
							style={{ fontSize: 12, fontWeight: 600 }}
						>
							{displayName}
						</div>
						<div
							className="font-body text-ink-tertiary"
							style={{ fontSize: 10 }}
						>
							Cajera
						</div>
					</div>
				</div>
				<Link
					href="/pos"
					className="sidebar-item"
					style={{ padding: "8px 10px", fontSize: 10 }}
				>
					<LogOut size={13} />
					Cerrar sesión
				</Link>
			</div>
		</nav>
	);
}

// ─── Item status badge ────────────────────────────────────────────────────────

const ITEM_STATUS_LABEL: Record<string, string> = {
	preparing: "Preparando",
	pending: "Pendiente",
	ready: "Listo",
	delivered: "Entregado",
	cancelled: "Cancelado",
};

const ITEM_STATUS_COLOR: Record<string, string> = {
	preparing: "#3b82f6",
	pending: "#f59e0b",
	ready: "#10b981",
	delivered: "#6b7280",
	cancelled: "#ef4444",
};

function ItemStatusBadge({ status }: { status: string }) {
	const color = ITEM_STATUS_COLOR[status] ?? "#6b7280";
	return (
		<span
			className="font-display uppercase rounded-full"
			style={{
				fontSize: 9,
				padding: "2px 9px",
				letterSpacing: "0.15em",
				color,
				background: `${color}18`,
				border: `1px solid ${color}30`,
				whiteSpace: "nowrap",
			}}
		>
			{ITEM_STATUS_LABEL[status] ?? status}
		</span>
	);
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
	return (
		<div
			style={{
				position: "fixed",
				bottom: 28,
				left: "50%",
				transform: visible
					? "translateX(-50%) translateY(0)"
					: "translateX(-50%) translateY(20px)",
				opacity: visible ? 1 : 0,
				transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
				background: "#10b981",
				color: "#fff",
				borderRadius: 12,
				padding: "12px 22px",
				fontFamily: "var(--font-syne)",
				fontWeight: 700,
				fontSize: 12,
				letterSpacing: "0.08em",
				textTransform: "uppercase",
				display: "flex",
				alignItems: "center",
				gap: 8,
				zIndex: 9999,
				boxShadow: "0 0 24px rgba(16,185,129,0.4), 0 4px 16px rgba(0,0,0,0.4)",
				pointerEvents: "none",
			}}
		>
			<Check size={15} />
			{message}
		</div>
	);
}

// ─── Payment button ───────────────────────────────────────────────────────────

function PayButton({
	icon,
	label,
	sub,
	amount,
	accentColor,
	onClick,
}: {
	icon: React.ReactNode;
	label: string;
	sub: string;
	amount: number;
	accentColor: string;
	onClick: () => void;
}) {
	return (
		<button
			className="flex items-center gap-3 rounded-xl w-full transition-all"
			style={{
				padding: "14px 16px",
				background: "var(--s2)",
				border: "1px solid var(--s3)",
				cursor: "pointer",
				textAlign: "left",
				color: "#f5f5f5",
			}}
			onMouseEnter={(e) => {
				const el = e.currentTarget;
				el.style.borderColor = accentColor;
				el.style.background = `${accentColor}0e`;
				el.style.boxShadow = `0 0 16px ${accentColor}20`;
			}}
			onMouseLeave={(e) => {
				const el = e.currentTarget;
				el.style.borderColor = "var(--s3)";
				el.style.background = "var(--s2)";
				el.style.boxShadow = "none";
			}}
			onClick={onClick}
		>
			<div
				style={{
					width: 42,
					height: 42,
					borderRadius: 12,
					background: `${accentColor}18`,
					border: `1px solid ${accentColor}30`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				{icon}
			</div>
			<div className="flex-1">
				<div
					className="font-display"
					style={{ fontSize: 13, fontWeight: 600, color: "#f5f5f5" }}
				>
					{label}
				</div>
				<div className="text-ink-tertiary font-body" style={{ fontSize: 11 }}>
					{sub}
				</div>
			</div>
			<span
				className="font-kds"
				style={{ fontSize: 18, color: accentColor, lineHeight: 1 }}
			>
				{formatCurrency(amount)}
			</span>
		</button>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TableDetailPage({
	params,
}: {
	params: Promise<{ tableId: string }>;
}) {
	const router = useRouter();
	const { tableId } = use(params);

	const [table, setTable] = useState<Table | null>(null);
	const [zone, setZone] = useState<Zone | null>(null);
	const [activeOrders, setActiveOrders] = useState<Order[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMsg, setToastMsg] = useState("");
	const [sending, setSending] = useState(false);
	const [closing, setClosing] = useState(false);
	const [staffName, setStaffName] = useState<string>("");
	const [mpModal, setMpModal] = useState(false);
	const [mpQrData, setMpQrData] = useState<string | null>(null);
	const [mpRef, setMpRef] = useState<string | null>(null);
	const [mpLoading, setMpLoading] = useState(false);
	const [mpError, setMpError] = useState("");
	const mpPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
	// Point (posnet / tarjeta)
	const [pointModal, setPointModal] = useState(false);
	const [pointIntentId, setPointIntentId] = useState<string | null>(null);
	const [pointState, setPointState] = useState<string>("");
	const [pointLoading, setPointLoading] = useState(false);
	const [pointError, setPointError] = useState("");
	const pointPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
	useEffect(() => {
		try {
			const stored = localStorage.getItem("pos-staff");
			if (stored) {
				const staff = JSON.parse(stored) as { name?: string };
				if (staff.name) setStaffName(staff.name);
			}
		} catch {
			/* ignore */
		}
	}, []);

	const fetchOrders = useCallback(async () => {
		try {
			const orders = await apiFetch<Order[]>(`/api/orders?tableId=${tableId}`);
			setActiveOrders(
				orders.filter((o) => o.status !== "closed" && o.status !== "cancelled"),
			);
		} catch (e) {
			console.error(e);
		}
	}, [tableId]);

	useEffect(() => {
		const init = async () => {
			try {
				const [tables, zones, prods, cats] = await Promise.all([
					apiFetch<Table[]>("/api/tables"),
					apiFetch<Zone[]>("/api/zones"),
					apiFetch<Product[]>("/api/products"),
					apiFetch<Category[]>("/api/categories"),
				]);
				const t = tables.find((t) => t.id === tableId) ?? null;
				setTable(t);
				if (t) setZone(zones.find((z) => z.id === t.zoneId) ?? null);
				setProducts(prods);
				setCategories(cats);
			} catch (e) {
				console.error(e);
			}
		};
		init();
		fetchOrders();
		const id = setInterval(fetchOrders, 12000);
		return () => clearInterval(id);
	}, [tableId, fetchOrders]);

	const allOrderItems = activeOrders.flatMap((o) => o.items);
	const filteredProducts = activeCategory
		? products.filter((p) => p.categoryId === activeCategory)
		: products;

	const orderSubtotal = allOrderItems.reduce((s, i) => s + i.qty * i.price, 0);
	const cartSubtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
	const combinedSubtotal = orderSubtotal + cartSubtotal;
	const iva = Math.round(combinedSubtotal * 0.21);
	const total = combinedSubtotal + iva;

	const elapsed =
		activeOrders.length > 0
			? elapsedMinutes(
					activeOrders.reduce(
						(oldest, o) => (o.createdAt < oldest ? o.createdAt : oldest),
						activeOrders[0].createdAt,
					),
				)
			: 0;

	const showToast = (msg: string) => {
		setToastMsg(msg);
		setToastVisible(true);
		setTimeout(() => setToastVisible(false), 2200);
	};

	const handleAddToCart = (product: Product) => {
		setCart((prev) => {
			const existing = prev.find((i) => i.productId === product.id);
			if (existing) {
				return prev.map((i) =>
					i.productId === product.id ? { ...i, qty: i.qty + 1 } : i,
				);
			}
			return [
				...prev,
				{
					productId: product.id,
					name: product.name,
					price: product.price,
					qty: 1,
					target: product.target,
				},
			];
		});
	};

	const handleUpdateCartQty = (productId: string, qty: number) => {
		if (qty <= 0) {
			setCart((prev) => prev.filter((i) => i.productId !== productId));
		} else {
			setCart((prev) =>
				prev.map((i) => (i.productId === productId ? { ...i, qty } : i)),
			);
		}
	};

	const handleRemoveFromCart = (productId: string) => {
		setCart((prev) => prev.filter((i) => i.productId !== productId));
	};

	const handleSubmitCart = async () => {
		if (!cart.length || sending) return;
		setSending(true);
		try {
			await apiFetch("/api/orders", {
				method: "POST",
				headers: posHeaders(),
				body: JSON.stringify({
					tableId,
					waiterName: "Cajero",
					items: cart.map((i) => ({
						productId: i.productId,
						name: i.name,
						qty: i.qty,
						price: i.price,
						target: i.target,
					})),
				}),
			});
			setCart([]);
			await fetchOrders();
			showToast(
				`${cart.length} ítem${cart.length !== 1 ? "s" : ""} enviado${cart.length !== 1 ? "s" : ""} a cocina/bar`,
			);
		} catch (e) {
			console.error(e);
		} finally {
			setSending(false);
		}
	};

	const handleCloseTable = async (method: PaymentMethod) => {
		if (closing) return;
		const order = activeOrders[0];
		if (!order) return;
		setClosing(true);
		try {
			await apiFetch(`/api/orders/${order.id}/close`, {
				method: "POST",
				headers: posHeaders(),
				body: JSON.stringify({ paymentMethod: method }),
			});
			showToast("Mesa cerrada — ¡Hasta pronto!");
			setTimeout(() => router.push("/pos/salon"), 900);
		} catch (e) {
			console.error(e);
			setClosing(false);
		}
	};

	// ── MercadoPago QR flow ──
	const stopMpPoll = useCallback(() => {
		if (mpPollRef.current) {
			clearInterval(mpPollRef.current);
			mpPollRef.current = null;
		}
	}, []);

	const handleMpPayment = async () => {
		if (activeOrders.length === 0) return;
		setMpLoading(true);
		setMpError("");
		setMpQrData(null);
		setMpModal(true);

		try {
			const res = await apiFetch<{
				qrData: string;
				externalReference: string;
				amount: number;
			}>("/api/payments/mp", {
				method: "POST",
				headers: posHeaders(),
				body: JSON.stringify({
					orderIds: activeOrders.map((o) => o.id),
				}),
			});
			setMpQrData(res.qrData);
			setMpRef(res.externalReference);

			// Poll payment status every 4 seconds
			mpPollRef.current = setInterval(async () => {
				try {
					const status = await apiFetch<{ status: string }>(
						`/api/payments/mp?externalReference=${res.externalReference}`,
						{ headers: posHeaders() },
					);
					if (status.status === "approved" || status.status === "paid") {
						stopMpPoll();
						// Close the orders
						for (const o of activeOrders) {
							await apiFetch(`/api/orders/${o.id}/close`, {
								method: "POST",
								headers: posHeaders(),
								body: JSON.stringify({ paymentMethod: "mercadopago" }),
							});
						}
						setMpModal(false);
						showToast("Pago con MercadoPago confirmado");
						setTimeout(() => router.push("/pos/salon"), 900);
					}
				} catch {
					// keep polling
				}
			}, 4000);
		} catch (e) {
			setMpError(e instanceof Error ? e.message : "Error al generar QR");
		} finally {
			setMpLoading(false);
		}
	};

	const handleCloseMpModal = () => {
		stopMpPoll();
		setMpModal(false);
		setMpQrData(null);
		setMpRef(null);
		setMpError("");
	};

	// Cleanup poll on unmount
	useEffect(() => stopMpPoll, [stopMpPoll]);

	// ── Point (posnet / tarjeta) flow ──
	const stopPointPoll = useCallback(() => {
		if (pointPollRef.current) {
			clearInterval(pointPollRef.current);
			pointPollRef.current = null;
		}
	}, []);

	const handlePointPayment = async () => {
		if (activeOrders.length === 0) return;
		setPointLoading(true);
		setPointError("");
		setPointIntentId(null);
		setPointState("");
		setPointModal(true);

		try {
			const res = await apiFetch<{
				intentId: string;
				deviceId: string;
				amount: number;
				state: string;
			}>("/api/payments/point", {
				method: "POST",
				headers: posHeaders(),
				body: JSON.stringify({
					orderIds: activeOrders.map((o) => o.id),
				}),
			});
			setPointIntentId(res.intentId);
			setPointState(res.state);

			// Poll status every 3 seconds, timeout after 5 minutes
			let pointClosing = false;
			const startedAt = Date.now();
			pointPollRef.current = setInterval(async () => {
				if (pointClosing) return;
				if (Date.now() - startedAt > 5 * 60 * 1000) {
					stopPointPoll();
					setPointError("Tiempo de espera agotado — intentá de nuevo");
					return;
				}
				try {
					const status = await apiFetch<{
						state: string;
						payment?: { id: number };
					}>(
						`/api/payments/point?intentId=${encodeURIComponent(res.intentId)}`,
						{
							headers: posHeaders(),
						},
					);
					setPointState(status.state);

					if (status.state === "FINISHED" || status.state === "PROCESSED") {
						pointClosing = true;
						stopPointPoll();
						for (const o of activeOrders) {
							await apiFetch(`/api/orders/${o.id}/close`, {
								method: "POST",
								headers: posHeaders(),
								body: JSON.stringify({ paymentMethod: "card" }),
							});
						}
						setPointModal(false);
						showToast("Pago con tarjeta confirmado");
						setTimeout(() => router.push("/pos/salon"), 900);
					} else if (status.state === "CANCELED" || status.state === "ERROR") {
						stopPointPoll();
						setPointError(
							status.state === "CANCELED"
								? "Pago cancelado desde el posnet"
								: "Error en el posnet",
						);
					}
				} catch {
					// keep polling
				}
			}, 3000);
		} catch (e) {
			setPointError(
				e instanceof Error ? e.message : "Error al enviar al posnet",
			);
		} finally {
			setPointLoading(false);
		}
	};

	const handleClosePointModal = async () => {
		if (pointIntentId) {
			try {
				await apiFetch(`/api/payments/point?intentId=${pointIntentId}`, {
					method: "DELETE",
					headers: posHeaders(),
				});
			} catch {
				// ignore cancel errors
			}
		}
		stopPointPoll();
		setPointModal(false);
		setPointIntentId(null);
		setPointError("");
	};

	useEffect(() => stopPointPoll, [stopPointPoll]);

	if (!table) {
		return (
			<div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center gap-3">
				<div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
				<div className="text-ink-disabled font-display text-xs uppercase tracking-widest">
					Cargando mesa...
				</div>
			</div>
		);
	}

	return (
		<div
			className="min-h-screen bg-surface-0 noise-overlay"
			style={{ display: "flex" }}
		>
			<POSSidebar activePath="salon" />

			<div
				className="flex flex-col"
				style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}
			>
				{/* Header bar */}
				<header
					style={{
						display: "flex",
						alignItems: "center",
						gap: 16,
						padding: "0 24px",
						height: 64,
						borderBottom: "1px solid var(--s3)",
						background: "var(--s1)",
						position: "sticky",
						top: 0,
						zIndex: 20,
						flexShrink: 0,
					}}
				>
					<Link
						href="/pos/salon"
						className="btn-ghost flex items-center gap-1.5"
						style={{
							padding: "7px 11px",
							textDecoration: "none",
							fontSize: 11,
						}}
					>
						<ChevronLeft size={15} />
						<span
							className="font-display uppercase tracking-widest"
							style={{ fontSize: 10, letterSpacing: "0.2em" }}
						>
							Salón
						</span>
					</Link>

					<div
						style={{
							width: 1,
							height: 24,
							background: "var(--s3)",
							flexShrink: 0,
						}}
					/>

					<div className="flex items-center gap-3 flex-1 min-w-0">
						<div
							className="font-kds text-ink-primary"
							style={{
								fontSize: 32,
								lineHeight: 1,
								textShadow: "0 0 20px rgba(245,158,11,0.2)",
							}}
						>
							Mesa {table.number}
						</div>
						<div
							className="font-display text-ink-tertiary uppercase"
							style={{ fontSize: 11, letterSpacing: "0.2em" }}
						>
							— {zone?.name ?? "Salón Principal"}
						</div>
						<span
							className={`badge badge-${table.status}`}
							style={{ fontSize: 9 }}
						>
							{table.status === "occupied"
								? "Ocupada"
								: table.status === "available"
									? "Libre"
									: "Reservada"}
						</span>
					</div>

					{elapsed > 0 && (
						<div className="flex items-center gap-2 text-ink-tertiary">
							<Clock
								size={13}
								style={{
									color:
										elapsed > 20
											? "#ef4444"
											: elapsed > 10
												? "#f59e0b"
												: "#6b6b6b",
								}}
							/>
							<span
								className="font-kds"
								style={{
									fontSize: 22,
									lineHeight: 1,
									color:
										elapsed > 20
											? "#ef4444"
											: elapsed > 10
												? "#f59e0b"
												: "#a3a3a3",
								}}
							>
								{elapsed}m
							</span>
							<span className="text-ink-tertiary" style={{ fontSize: 11 }}>
								abierta
							</span>
						</div>
					)}
				</header>

				{/* Body: 2 columns */}
				<div
					className="flex flex-1"
					style={{ overflow: "hidden", minHeight: 0 }}
				>
					{/* ─── LEFT column ─── */}
					<div
						className="flex flex-col gap-0 overflow-y-auto"
						style={{
							flex: "0 0 58%",
							borderRight: "1px solid var(--s3)",
							minWidth: 0,
						}}
					>
						{/* Current order items */}
						<section style={{ padding: "20px 20px 0" }}>
							<div className="flex items-center justify-between mb-3">
								<div
									className="font-display text-ink-tertiary uppercase tracking-widest"
									style={{ fontSize: 9, letterSpacing: "0.3em" }}
								>
									Orden confirmada
									{activeOrders.length > 0 && (
										<span style={{ color: "#444", marginLeft: 6 }}>
											#{activeOrders[0]?.id.slice(-6)}
										</span>
									)}
								</div>
								{activeOrders.length > 0 && (
									<span
										className={`badge badge-${activeOrders[0].status}`}
										style={{ fontSize: 9 }}
									>
										{activeOrders[0].status === "preparing"
											? "En preparación"
											: activeOrders[0].status === "ready"
												? "Listo"
												: "Pendiente"}
									</span>
								)}
							</div>

							{allOrderItems.length === 0 && cart.length === 0 ? (
								<div
									className="flex flex-col items-center justify-center text-center rounded-xl"
									style={{
										padding: "28px",
										background: "var(--s2)",
										border: "1px dashed var(--s4)",
										marginBottom: 16,
									}}
								>
									<div style={{ fontSize: 26, marginBottom: 6 }}>🛒</div>
									<div
										className="font-display uppercase text-ink-disabled"
										style={{ fontSize: 10, letterSpacing: "0.2em" }}
									>
										Mesa sin pedidos
									</div>
									<div
										className="text-ink-disabled font-body mt-1"
										style={{ fontSize: 11 }}
									>
										Añadí productos del menú abajo
									</div>
								</div>
							) : (
								<div className="flex flex-col gap-1.5 mb-3">
									{allOrderItems.map((item) => {
										const borderColor =
											item.status === "preparing"
												? "#3b82f6"
												: item.status === "ready"
													? "#10b981"
													: item.status === "delivered"
														? "#333"
														: "#f59e0b";
										return (
											<div
												key={item.id}
												className="flex items-center gap-3 rounded-xl"
												style={{
													padding: "10px 12px",
													background:
														item.status === "delivered"
															? "rgba(255,255,255,0.015)"
															: "var(--s2)",
													border: "1px solid var(--s3)",
													borderLeft: `3px solid ${borderColor}`,
													opacity: item.status === "delivered" ? 0.55 : 1,
												}}
											>
												<span style={{ fontSize: 14, flexShrink: 0 }}>
													{item.target === "kitchen" ? "🍳" : "🍹"}
												</span>

												<div className="flex-1 min-w-0">
													<div
														className="font-body text-ink-primary"
														style={{
															fontSize: 13,
															fontWeight: 500,
															color: "#f5f5f5",
														}}
													>
														{item.name}
													</div>
													<div className="flex items-center gap-2 mt-0.5">
														<ItemStatusBadge status={item.status} />
													</div>
												</div>

												<span
													className="font-kds text-ink-tertiary"
													style={{
														fontSize: 17,
														lineHeight: 1,
														minWidth: 24,
														textAlign: "center",
													}}
												>
													×{item.qty}
												</span>

												<div className="text-right" style={{ minWidth: 72 }}>
													<div
														className="font-kds text-ink-secondary"
														style={{ fontSize: 15 }}
													>
														{formatCurrency(item.qty * item.price)}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</section>

						{/* Cart items (unsent) */}
						{cart.length > 0 && (
							<section style={{ padding: "0 20px" }}>
								<div className="divider-gold my-3" />
								<div
									className="font-display text-ink-tertiary uppercase tracking-widest mb-2"
									style={{ fontSize: 9, letterSpacing: "0.3em" }}
								>
									En carrito — sin enviar
								</div>
								<div className="flex flex-col gap-2">
									{cart.map((item) => (
										<div
											key={item.productId}
											className="flex items-center gap-3 rounded-xl"
											style={{
												padding: "10px 12px",
												background: "rgba(245,158,11,0.05)",
												border: "1px solid rgba(245,158,11,0.22)",
											}}
										>
											<span style={{ fontSize: 14, flexShrink: 0 }}>
												{item.target === "kitchen" ? "🍳" : "🍹"}
											</span>

											<div className="flex-1 min-w-0">
												<div
													className="font-body text-ink-primary"
													style={{ fontSize: 13, fontWeight: 500 }}
												>
													{item.name}
												</div>
											</div>

											{/* Qty controls — bigger */}
											<div className="flex items-center gap-1.5">
												<button
													style={{
														width: 30,
														height: 30,
														borderRadius: 8,
														border: "1px solid var(--s4)",
														background: "var(--s3)",
														color: "#a3a3a3",
														cursor: "pointer",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
													onClick={() =>
														handleUpdateCartQty(item.productId, item.qty - 1)
													}
												>
													<Minus size={11} />
												</button>
												<span
													className="font-kds text-ink-primary"
													style={{
														width: 26,
														textAlign: "center",
														fontSize: 20,
														lineHeight: 1,
													}}
												>
													{item.qty}
												</span>
												<button
													style={{
														width: 30,
														height: 30,
														borderRadius: 8,
														border: "1px solid rgba(245,158,11,0.3)",
														background: "rgba(245,158,11,0.1)",
														color: "#f59e0b",
														cursor: "pointer",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
													onClick={() =>
														handleUpdateCartQty(item.productId, item.qty + 1)
													}
												>
													<Plus size={11} />
												</button>
											</div>

											<div className="text-right" style={{ minWidth: 68 }}>
												<div
													className="font-kds text-brand-500"
													style={{ fontSize: 16 }}
												>
													{formatCurrency(item.qty * item.price)}
												</div>
											</div>

											<button
												style={{
													width: 24,
													height: 24,
													borderRadius: 4,
													border: "none",
													background: "transparent",
													color: "#555",
													cursor: "pointer",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													flexShrink: 0,
												}}
												onMouseEnter={(e) => {
													(e.currentTarget as HTMLButtonElement).style.color =
														"#ef4444";
												}}
												onMouseLeave={(e) => {
													(e.currentTarget as HTMLButtonElement).style.color =
														"#555";
												}}
												onClick={() => handleRemoveFromCart(item.productId)}
											>
												<X size={12} />
											</button>
										</div>
									))}
								</div>

								{/* Send cart CTA */}
								<button
									className="btn-primary w-full justify-center mt-3"
									style={{
										paddingTop: 14,
										paddingBottom: 14,
										background: "#10b981",
										fontSize: 13,
										opacity: sending ? 0.7 : 1,
									}}
									onClick={handleSubmitCart}
									disabled={sending}
								>
									<Send size={15} />
									Enviar {cart.length} ítem{cart.length !== 1 ? "s" : ""} a
									cocina / bar
								</button>
							</section>
						)}

						<div className="divider mx-5 my-4" />

						{/* Product picker */}
						<section style={{ padding: "0 20px 24px" }}>
							<div
								className="font-display text-ink-tertiary uppercase tracking-widest mb-4"
								style={{ fontSize: 9, letterSpacing: "0.3em" }}
							>
								Añadir productos
							</div>

							{/* Category tiles — large grid */}
							<div
								className="grid gap-2 mb-4"
								style={{
									gridTemplateColumns: "repeat(3, 1fr)",
								}}
							>
								{/* "Todo" tile */}
								<button
									onClick={() => setActiveCategory(null)}
									style={{
										padding: "12px 8px",
										minHeight: 64,
										borderRadius: 12,
										border:
											activeCategory === null
												? "2px solid rgba(245,158,11,0.6)"
												: "1px solid var(--s4)",
										background:
											activeCategory === null ? "#f59e0b" : "var(--s2)",
										color: activeCategory === null ? "#080808" : "#6b6b6b",
										fontFamily: "var(--font-syne)",
										fontSize: 11,
										fontWeight: 700,
										letterSpacing: "0.1em",
										textTransform: "uppercase",
										cursor: "pointer",
										transition: "all 0.12s",
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										justifyContent: "center",
										gap: 4,
										boxShadow:
											activeCategory === null
												? "0 0 16px rgba(245,158,11,0.3)"
												: "none",
									}}
								>
									<span style={{ fontSize: 16 }}>☰</span>
									<span>Todo</span>
								</button>

								{categories.map((cat) => {
									const active = activeCategory === cat.id;
									return (
										<button
											key={cat.id}
											onClick={() => setActiveCategory(active ? null : cat.id)}
											style={{
												padding: "12px 8px",
												minHeight: 64,
												borderRadius: 12,
												border: active
													? "2px solid rgba(245,158,11,0.6)"
													: "1px solid var(--s4)",
												background: active ? "#f59e0b" : "var(--s2)",
												color: active ? "#080808" : "#6b6b6b",
												fontFamily: "var(--font-syne)",
												fontSize: 11,
												fontWeight: 700,
												letterSpacing: "0.1em",
												textTransform: "uppercase",
												cursor: "pointer",
												transition: "all 0.12s",
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												justifyContent: "center",
												gap: 4,
												boxShadow: active
													? "0 0 16px rgba(245,158,11,0.3)"
													: "none",
											}}
										>
											<span style={{ fontSize: 16 }}>{cat.icon}</span>
											<span>{cat.name}</span>
										</button>
									);
								})}
							</div>

							{/* Product grid — bold and large */}
							<div
								className="grid gap-2"
								style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
							>
								{filteredProducts
									.filter((p) => p.isAvailable)
									.map((product) => {
										const inCart = cart.find((i) => i.productId === product.id);
										return (
											<button
												key={product.id}
												style={{
													padding: "14px 14px",
													minHeight: 96,
													borderRadius: 14,
													border: inCart
														? "2px solid rgba(245,158,11,0.5)"
														: "1px solid var(--s3)",
													background: inCart
														? "rgba(245,158,11,0.06)"
														: "var(--s2)",
													cursor: "pointer",
													textAlign: "left",
													transition: "all 0.12s",
													position: "relative",
													display: "flex",
													flexDirection: "column",
													gap: 6,
													boxShadow: inCart
														? "0 0 14px rgba(245,158,11,0.18)"
														: "none",
												}}
												onMouseEnter={(e) => {
													const el = e.currentTarget;
													if (!inCart) {
														el.style.borderColor = "rgba(245,158,11,0.3)";
														el.style.background = "var(--s3)";
													}
												}}
												onMouseLeave={(e) => {
													const el = e.currentTarget;
													if (!inCart) {
														el.style.borderColor = "var(--s3)";
														el.style.background = "var(--s2)";
													}
												}}
												onClick={() => handleAddToCart(product)}
											>
												<div
													className="font-body text-ink-primary"
													style={{
														fontSize: 13,
														fontWeight: 600,
														lineHeight: 1.3,
													}}
												>
													{product.name}
												</div>
												<div className="flex items-center justify-between mt-auto">
													<div
														className="font-kds text-brand-500"
														style={{
															fontSize: 24,
															lineHeight: 1,
															textShadow: "0 0 12px rgba(245,158,11,0.25)",
														}}
													>
														{formatCurrency(product.price)}
													</div>
													<div
														style={{
															display: "flex",
															alignItems: "center",
															gap: 6,
														}}
													>
														<span
															className="font-display uppercase"
															style={{
																fontSize: 9,
																letterSpacing: "0.12em",
																color:
																	product.target === "kitchen"
																		? "#10b981"
																		: "#60a5fa",
															}}
														>
															{product.target === "kitchen" ? "Cocina" : "Bar"}
														</span>
														<div
															style={{
																width: 28,
																height: 28,
																borderRadius: 8,
																background: inCart
																	? "#f59e0b"
																	: "rgba(245,158,11,0.12)",
																border: inCart
																	? "none"
																	: "1px solid rgba(245,158,11,0.25)",
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																color: inCart ? "#080808" : "#f59e0b",
															}}
														>
															<Plus size={13} />
														</div>
													</div>
												</div>

												{/* Cart count badge */}
												{inCart && (
													<div
														style={{
															position: "absolute",
															top: 8,
															right: 8,
															background: "#f59e0b",
															color: "#080808",
															fontFamily: "var(--font-bebas)",
															fontSize: 14,
															lineHeight: 1,
															borderRadius: "99px",
															padding: "2px 7px",
														}}
													>
														{inCart.qty}
													</div>
												)}
											</button>
										);
									})}
							</div>
						</section>
					</div>

					{/* ─── RIGHT column ─── */}
					<div
						className="flex flex-col gap-0 overflow-y-auto"
						style={{
							flex: "0 0 42%",
							background: "var(--s1)",
							minWidth: 0,
						}}
					>
						{/* Order summary card */}
						<div
							className="card-gold animate-fade-in"
							style={{ margin: "20px 20px 0", padding: "20px 20px 18px" }}
						>
							<div
								className="font-display text-ink-tertiary uppercase tracking-widest mb-3"
								style={{ fontSize: 9, letterSpacing: "0.3em" }}
							>
								Resumen del pedido
							</div>

							{/* Line items */}
							{allOrderItems.length === 0 && cart.length === 0 ? (
								<div
									className="text-ink-disabled font-body text-center py-4"
									style={{ fontSize: 12 }}
								>
									Sin ítems aún
								</div>
							) : (
								<div className="flex flex-col gap-1.5 mb-3">
									{[
										...allOrderItems,
										...cart.map((c) => ({
											...c,
											id: `cart-${c.productId}`,
											orderId: "",
											status: "pending" as const,
											notes: null,
											isNew: true,
										})),
									].map((item, idx) => (
										<div
											key={`${item.id}-${idx}`}
											className="flex items-center justify-between"
										>
											<span
												className="font-body text-ink-secondary"
												style={{ fontSize: 12 }}
											>
												{"isNew" in item && item.isNew ? (
													<span
														style={{
															color: "#f59e0b",
															fontFamily: "var(--font-syne)",
															fontWeight: 700,
															fontSize: 9,
															letterSpacing: "0.1em",
															marginRight: 4,
														}}
													>
														●
													</span>
												) : null}
												{item.qty}× {item.name}
											</span>
											<span
												className="font-body"
												style={{ fontSize: 12, color: "#f5f5f5" }}
											>
												{formatCurrency(item.qty * item.price)}
											</span>
										</div>
									))}
								</div>
							)}

							<div className="divider-gold mb-3" />

							{/* Totals */}
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between">
									<span
										className="text-ink-tertiary font-body"
										style={{ fontSize: 12 }}
									>
										Subtotal
									</span>
									<span
										className="text-ink-secondary font-body"
										style={{ fontSize: 12 }}
									>
										{formatCurrency(combinedSubtotal)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span
										className="text-ink-tertiary font-body"
										style={{ fontSize: 12 }}
									>
										IVA (21%)
									</span>
									<span
										className="text-ink-secondary font-body"
										style={{ fontSize: 12 }}
									>
										{formatCurrency(iva)}
									</span>
								</div>
								<div className="divider my-1" />
								<div className="flex items-center justify-between">
									<span
										className="font-display text-ink-primary uppercase tracking-widest"
										style={{ fontSize: 12, letterSpacing: "0.2em" }}
									>
										TOTAL
									</span>
									<span
										className="font-kds text-brand-500"
										style={{
											fontSize: 42,
											lineHeight: 1,
											textShadow: "0 0 20px rgba(245,158,11,0.35)",
										}}
									>
										{formatCurrency(total)}
									</span>
								</div>
							</div>
						</div>

						{/* Time open */}
						{elapsed > 0 && (
							<div
								className="flex items-center gap-3 rounded-xl mx-5 mt-3"
								style={{
									padding: "12px 14px",
									background: "var(--s2)",
									border: "1px solid var(--s3)",
								}}
							>
								<Clock
									size={14}
									style={{
										color:
											elapsed > 20
												? "#ef4444"
												: elapsed > 10
													? "#f59e0b"
													: "#6b6b6b",
										flexShrink: 0,
									}}
								/>
								<div>
									<div
										className="text-ink-tertiary font-body"
										style={{ fontSize: 11 }}
									>
										Mesa abierta hace
									</div>
									<div
										className="font-kds"
										style={{
											fontSize: 24,
											lineHeight: 1,
											color:
												elapsed > 20
													? "#ef4444"
													: elapsed > 10
														? "#f59e0b"
														: "#a3a3a3",
										}}
									>
										{elapsed} minutos
									</div>
								</div>
							</div>
						)}

						{/* Send cart shortcut */}
						{cart.length > 0 && (
							<div style={{ padding: "12px 20px 0" }}>
								<button
									className="w-full justify-center rounded-xl font-display uppercase"
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
										padding: "13px 16px",
										background: "rgba(16,185,129,0.12)",
										border: "1px solid rgba(16,185,129,0.35)",
										color: "#34d399",
										fontSize: 12,
										fontWeight: 700,
										letterSpacing: "0.1em",
										cursor: "pointer",
										transition: "all 0.15s",
										opacity: sending ? 0.7 : 1,
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLButtonElement).style.background =
											"rgba(16,185,129,0.2)";
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLButtonElement).style.background =
											"rgba(16,185,129,0.12)";
									}}
									onClick={handleSubmitCart}
									disabled={sending}
								>
									<ShoppingCart size={15} />
									{cart.length} en carrito — Enviar pedido
								</button>
							</div>
						)}

						{/* Payment */}
						{(allOrderItems.length > 0 || cart.length > 0) && (
							<div style={{ padding: "16px 20px 0" }}>
								<div
									className="font-display text-ink-tertiary uppercase tracking-widest mb-3"
									style={{ fontSize: 9, letterSpacing: "0.3em" }}
								>
									Cobrar con
								</div>
								<div className="flex flex-col gap-2">
									<PayButton
										icon={<Banknote size={20} style={{ color: "#34d399" }} />}
										label="Efectivo"
										sub="Pago en mano"
										amount={total}
										accentColor="#10b981"
										onClick={() => handleCloseTable("cash")}
									/>
									<PayButton
										icon={<Smartphone size={20} style={{ color: "#60a5fa" }} />}
										label="MercadoPago"
										sub="QR / Link de pago"
										amount={total}
										accentColor="#3b82f6"
										onClick={handleMpPayment}
									/>
									<PayButton
										icon={<CreditCard size={20} style={{ color: "#a78bfa" }} />}
										label="Tarjeta"
										sub="Point / Posnet"
										amount={total}
										accentColor="#8b5cf6"
										onClick={handlePointPayment}
									/>
									<PayButton
										icon={
											<ArrowRightLeft size={20} style={{ color: "#fbbf24" }} />
										}
										label="Transferencia"
										sub="Alias bancario"
										amount={total}
										accentColor="#f59e0b"
										onClick={() => handleCloseTable("transfer")}
									/>
								</div>
							</div>
						)}

						{/* Close table */}
						{allOrderItems.length > 0 && (
							<div style={{ padding: "14px 20px 24px" }}>
								<div className="divider mb-4" />
								<button
									className="btn-primary w-full justify-center"
									style={{
										paddingTop: 16,
										paddingBottom: 16,
										fontSize: 13,
										fontWeight: 700,
										opacity: closing ? 0.7 : 1,
									}}
									onClick={() => handleCloseTable("cash")}
									disabled={closing}
								>
									Cerrar Mesa — {formatCurrency(total)}
								</button>
								<div
									className="text-center text-ink-disabled font-body mt-2"
									style={{ fontSize: 10 }}
								>
									Seleccioná método de pago arriba para confirmar
								</div>
							</div>
						)}

						<div style={{ height: 24 }} />
					</div>
				</div>
			</div>

			{/* MercadoPago QR Modal */}
			{mpModal && (
				<div
					style={{
						position: "fixed",
						inset: 0,
						zIndex: 9999,
						background: "rgba(0,0,0,0.7)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
					onClick={handleCloseMpModal}
				>
					<div
						style={{
							background: "var(--s1)",
							borderRadius: 20,
							padding: "32px 28px",
							maxWidth: 380,
							width: "90%",
							textAlign: "center",
							border: "1px solid var(--s3)",
							boxShadow: "0 0 60px rgba(59,130,246,0.2)",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div
							className="font-display uppercase tracking-widest text-ink-secondary"
							style={{ fontSize: 11, letterSpacing: "0.25em", marginBottom: 6 }}
						>
							MercadoPago
						</div>
						<div
							className="font-kds"
							style={{ fontSize: 36, color: "#3b82f6", lineHeight: 1.1 }}
						>
							{formatCurrency(total)}
						</div>
						<div
							className="text-ink-tertiary font-body"
							style={{ fontSize: 12, marginBottom: 20 }}
						>
							Mesa {table?.number} — Escaneá el QR para pagar
						</div>

						{mpLoading && (
							<div style={{ padding: "40px 0" }}>
								<div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
								<div className="text-ink-disabled text-xs mt-3">
									Generando QR...
								</div>
							</div>
						)}

						{mpError && (
							<div
								style={{
									padding: "20px 16px",
									background: "rgba(239,68,68,0.1)",
									borderRadius: 12,
									color: "#ef4444",
									fontSize: 13,
									marginBottom: 16,
								}}
							>
								{mpError}
							</div>
						)}

						{mpQrData && (
							<>
								<div
									style={{
										background: "#fff",
										borderRadius: 16,
										padding: 20,
										display: "inline-block",
										marginBottom: 16,
									}}
								>
									<QRCode value={mpQrData} size={220} />
								</div>
								<div
									className="flex items-center justify-center gap-2 text-blue-400"
									style={{ fontSize: 12 }}
								>
									<div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
									Esperando pago...
								</div>
							</>
						)}

						<button
							onClick={handleCloseMpModal}
							style={{
								marginTop: 20,
								padding: "10px 24px",
								borderRadius: 10,
								border: "1px solid var(--s3)",
								background: "transparent",
								color: "var(--ink-secondary)",
								fontSize: 12,
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							Cancelar
						</button>
					</div>
				</div>
			)}

			{/* Point / Posnet Modal */}
			{pointModal && (
				<div
					style={{
						position: "fixed",
						inset: 0,
						zIndex: 9999,
						background: "rgba(0,0,0,0.7)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
					onClick={handleClosePointModal}
				>
					<div
						style={{
							background: "var(--s1)",
							borderRadius: 20,
							padding: "32px 28px",
							maxWidth: 380,
							width: "90%",
							textAlign: "center",
							border: "1px solid var(--s3)",
							boxShadow: "0 0 60px rgba(139,92,246,0.2)",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div
							className="font-display uppercase tracking-widest text-ink-secondary"
							style={{ fontSize: 11, letterSpacing: "0.25em", marginBottom: 6 }}
						>
							Pago con Tarjeta
						</div>
						<div
							className="font-kds"
							style={{ fontSize: 36, color: "#8b5cf6", lineHeight: 1.1 }}
						>
							{formatCurrency(total)}
						</div>
						<div
							className="text-ink-tertiary font-body"
							style={{ fontSize: 12, marginBottom: 20 }}
						>
							Mesa {table?.number} — Esperando posnet
						</div>

						{pointLoading && (
							<div style={{ padding: "40px 0" }}>
								<div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
								<div className="text-ink-disabled text-xs mt-3">
									Enviando al posnet...
								</div>
							</div>
						)}

						{pointError && (
							<div
								style={{
									padding: "20px 16px",
									background: "rgba(239,68,68,0.1)",
									borderRadius: 12,
									color: "#ef4444",
									fontSize: 13,
									marginBottom: 16,
								}}
							>
								{pointError}
							</div>
						)}

						{pointIntentId && !pointError && !pointLoading && (
							<>
								<div
									style={{
										padding: "24px 16px",
										background: "rgba(139,92,246,0.08)",
										borderRadius: 16,
										border: "1px solid rgba(139,92,246,0.2)",
										marginBottom: 16,
									}}
								>
									<CreditCard
										size={40}
										className="mx-auto mb-3"
										style={{ color: "#a78bfa" }}
									/>
									<div className="font-display text-sm font-semibold text-ink-primary mb-1">
										{pointState === "OPEN" || pointState === "ON_TERMINAL"
											? "Pasá la tarjeta por el posnet"
											: pointState === "PROCESSING"
												? "Procesando pago..."
												: pointState}
									</div>
									<div
										className="flex items-center justify-center gap-2 text-purple-400"
										style={{ fontSize: 12 }}
									>
										<div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
										Esperando respuesta del terminal
									</div>
								</div>
							</>
						)}

						<button
							onClick={handleClosePointModal}
							style={{
								marginTop: 8,
								padding: "10px 24px",
								borderRadius: 10,
								border: "1px solid var(--s3)",
								background: "transparent",
								color: "var(--ink-secondary)",
								fontSize: 12,
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							Cancelar
						</button>
					</div>
				</div>
			)}

			<Toast message={toastMsg} visible={toastVisible} />
			<HelpButton {...helpContent.posTableDetail} variant="float" />
		</div>
	);
}
