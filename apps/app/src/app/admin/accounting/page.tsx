"use client";

import { useState, useEffect, useCallback } from "react";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
import {
	Clock,
	Banknote,
	CreditCard,
	Smartphone,
	Check,
	X,
	Receipt,
	DollarSign,
	Users,
	AlertTriangle,
} from "lucide-react";
import { formatCurrency, elapsedMinutes, formatTime } from "@/lib/utils";
import type { Order, PaymentMethod } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// ─── Payment modal ────────────────────────────────────────────────────────────

function PaymentModal({
	order,
	onClose,
	onConfirm,
	closing,
}: {
	order: Order;
	onClose: () => void;
	onConfirm: (method: PaymentMethod) => void;
	closing: boolean;
}) {
	const total = order.items.reduce((s, i) => s + i.qty * i.price, 0);

	const METHODS: {
		method: PaymentMethod;
		label: string;
		sub: string;
		icon: React.ElementType;
		color: string;
	}[] = [
		{
			method: "cash",
			label: "Efectivo",
			sub: "Pago en mano",
			icon: Banknote,
			color: "#10b981",
		},
		{
			method: "mercadopago",
			label: "MercadoPago",
			sub: "QR o transferencia",
			icon: Smartphone,
			color: "#3b82f6",
		},
		{
			method: "card",
			label: "Tarjeta",
			sub: "Debito o credito",
			icon: CreditCard,
			color: "#8b5cf6",
		},
	];

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 50,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 16,
				background: "rgba(0,0,0,0.7)",
				backdropFilter: "blur(8px)",
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				className="animate-scale-in"
				style={{
					background: "var(--s1)",
					border: "1px solid var(--s4)",
					borderRadius: 16,
					width: "100%",
					maxWidth: 560,
					maxHeight: "90vh",
					overflowY: "auto",
					boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
				}}
			>
				{/* Modal header */}
				<div
					className="flex items-center justify-between"
					style={{
						padding: "16px 20px",
						borderBottom: "1px solid var(--s3)",
						background: "var(--s2)",
					}}
				>
					<div>
						<h2
							className="font-display"
							style={{ fontSize: 16, fontWeight: 700, color: "#f5f5f5" }}
						>
							Cerrar Mesa {order.tableNumber}
						</h2>
						<p
							className="font-body"
							style={{ fontSize: 11, color: "#666", marginTop: 2 }}
						>
							{order.items.length} items · {order.waiterName ?? "Sin mozo"}
						</p>
					</div>
					<button
						className="btn-ghost"
						style={{ padding: 8 }}
						onClick={onClose}
					>
						<X size={16} />
					</button>
				</div>

				<div style={{ padding: 20 }}>
					{/* Total */}
					<div
						className="text-center"
						style={{
							padding: "20px 16px",
							marginBottom: 20,
							borderRadius: 12,
							background: "rgba(245,158,11,0.06)",
							border: "1px solid rgba(245,158,11,0.15)",
						}}
					>
						<div
							className="font-display uppercase"
							style={{
								fontSize: 9,
								letterSpacing: "0.3em",
								color: "#888",
								marginBottom: 8,
							}}
						>
							Total a cobrar
						</div>
						<div
							className="font-kds"
							style={{
								fontSize: 48,
								lineHeight: 1,
								color: "var(--gold)",
								textShadow: "0 0 20px rgba(245,158,11,0.3)",
							}}
						>
							{formatCurrency(total)}
						</div>
					</div>

					{/* Payment methods */}
					<div className="flex flex-col gap-2">
						{METHODS.map(({ method, label, sub, icon: Icon, color }) => (
							<button
								key={method}
								className="flex items-center gap-3 w-full"
								style={{
									padding: "13px 16px",
									borderRadius: 12,
									background: "var(--s2)",
									border: "1px solid var(--s3)",
									cursor: closing ? "not-allowed" : "pointer",
									textAlign: "left",
									color: "#f5f5f5",
									opacity: closing ? 0.6 : 1,
									transition: "all 0.15s",
								}}
								onMouseEnter={(e) => {
									if (!closing) {
										const el = e.currentTarget;
										el.style.borderColor = color;
										el.style.background = `${color}0e`;
									}
								}}
								onMouseLeave={(e) => {
									const el = e.currentTarget;
									el.style.borderColor = "var(--s3)";
									el.style.background = "var(--s2)";
								}}
								onClick={() => !closing && onConfirm(method)}
							>
								<div
									style={{
										width: 38,
										height: 38,
										borderRadius: 10,
										background: `${color}18`,
										border: `1px solid ${color}30`,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexShrink: 0,
									}}
								>
									<Icon size={18} style={{ color }} />
								</div>
								<div style={{ flex: 1 }}>
									<div
										className="font-display"
										style={{ fontSize: 14, fontWeight: 600 }}
									>
										{label}
									</div>
									<div
										className="font-body"
										style={{ fontSize: 11, color: "#666" }}
									>
										{sub}
									</div>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Order row ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
	pending: "#f59e0b",
	preparing: "#3b82f6",
	ready: "#10b981",
	closed: "#6b7280",
	cancelled: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
	pending: "Pendiente",
	preparing: "Preparando",
	ready: "Listo",
	closed: "Cerrado",
	cancelled: "Cancelado",
};

function OrderRow({
	order,
	onClose,
}: {
	order: Order;
	onClose: (order: Order) => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const elapsed = elapsedMinutes(order.createdAt);
	const total = order.items.reduce((s, i) => s + i.qty * i.price, 0);
	const color = STATUS_COLORS[order.status] ?? "#666";

	return (
		<div
			style={{
				background: "var(--s1)",
				border: "1px solid var(--s4)",
				borderRadius: 16,
				overflow: "hidden",
				marginBottom: 8,
				boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
			}}
		>
			<div style={{ padding: "14px 20px" }}>
				<div className="flex items-center gap-3">
					{/* Left accent */}
					<div
						style={{
							width: 3,
							height: 40,
							borderRadius: 3,
							background: color,
							flexShrink: 0,
						}}
					/>

					{/* Table + waiter */}
					<div style={{ minWidth: 80 }}>
						<div
							className="font-kds"
							style={{ fontSize: 22, lineHeight: 1, color: "#f5f5f5" }}
						>
							Mesa {order.tableNumber}
						</div>
						<div
							className="font-display uppercase"
							style={{
								fontSize: 9,
								letterSpacing: "0.2em",
								marginTop: 2,
								color: "#666",
							}}
						>
							{order.waiterName ?? "---"}
						</div>
					</div>

					{/* Status */}
					<span
						className="font-display uppercase"
						style={{
							fontSize: 9,
							padding: "3px 10px",
							borderRadius: 99,
							fontWeight: 700,
							letterSpacing: "0.12em",
							color,
							background: `${color}18`,
							border: `1px solid ${color}30`,
						}}
					>
						{STATUS_LABELS[order.status] ?? order.status}
					</span>

					<div style={{ flex: 1 }} />

					{/* Time + started */}
					<div className="flex items-center gap-1 text-right">
						<Clock size={11} style={{ color: "#555" }} />
						<span
							className="font-kds"
							style={{
								fontSize: 14,
								color:
									elapsed > 20 ? "#ef4444" : elapsed > 10 ? "#f59e0b" : "#666",
							}}
						>
							{elapsed}m
						</span>
						<span className="font-body" style={{ fontSize: 11, color: "#555" }}>
							· {formatTime(order.createdAt)}
						</span>
					</div>

					{/* Total */}
					<span
						className="font-kds"
						style={{
							fontSize: 18,
							minWidth: 90,
							textAlign: "right",
							color: "var(--gold)",
						}}
					>
						{formatCurrency(total)}
					</span>

					{/* Actions */}
					<div className="flex items-center gap-2">
						<button
							className="btn-ghost"
							style={{ padding: "5px 10px", fontSize: 11 }}
							onClick={() => setExpanded((p) => !p)}
						>
							{order.items.length} items
						</button>
						{order.status !== "closed" && order.status !== "cancelled" && (
							<button
								className="btn-primary"
								style={{ padding: "7px 14px", fontSize: 10 }}
								onClick={() => onClose(order)}
							>
								<Check size={12} />
								Cerrar mesa
							</button>
						)}
					</div>
				</div>

				{/* Expanded items */}
				{expanded && (
					<div
						style={{
							marginTop: 12,
							paddingTop: 12,
							borderTop: "1px solid var(--s3)",
							paddingLeft: 16,
						}}
					>
						{order.items.map((item) => {
							const ic = STATUS_COLORS[item.status] ?? "#555";
							return (
								<div
									key={item.id}
									className="flex items-center gap-3"
									style={{ padding: "5px 0" }}
								>
									<span
										className="font-kds"
										style={{ fontSize: 14, minWidth: 24, color: "#666" }}
									>
										{item.qty}x
									</span>
									<span
										className="font-body flex-1"
										style={{ fontSize: 13, color: "#ccc" }}
									>
										{item.name}
									</span>
									<span
										className="font-display uppercase"
										style={{
											fontSize: 8,
											padding: "1px 7px",
											borderRadius: 99,
											fontWeight: 600,
											letterSpacing: "0.1em",
											color: ic,
											background: `${ic}18`,
											border: `1px solid ${ic}25`,
										}}
									>
										{STATUS_LABELS[item.status] ?? item.status}
									</span>
									<span
										className="font-kds"
										style={{ fontSize: 13, color: "#888" }}
									>
										{formatCurrency(item.qty * item.price)}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountingPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [paymentModal, setPaymentModal] = useState<Order | null>(null);
	const [closing, setClosing] = useState(false);

	const fetchOrders = useCallback(async () => {
		try {
			const data = await apiFetch<Order[]>("/api/orders");
			setOrders(data);
		} catch (e) {
			console.error(e);
		}
	}, []);

	useEffect(() => {
		fetchOrders();
		const id = setInterval(fetchOrders, 10000);
		return () => clearInterval(id);
	}, [fetchOrders]);

	const activeOrders = orders.filter(
		(o) => o.status !== "closed" && o.status !== "cancelled",
	);

	const totalOpen = activeOrders.reduce(
		(s, o) => s + o.items.reduce((si, i) => si + i.qty * i.price, 0),
		0,
	);

	const confirmClose = async (method: PaymentMethod) => {
		if (!paymentModal) return;
		setClosing(true);
		try {
			await apiFetch(`/api/orders/${paymentModal.id}/close`, {
				method: "POST",
				body: JSON.stringify({ paymentMethod: method }),
			});
			setPaymentModal(null);
			await fetchOrders();
		} catch (e) {
			console.error(e);
		} finally {
			setClosing(false);
		}
	};

	const urgentOrders = activeOrders.filter(
		(o) => elapsedMinutes(o.createdAt) > 20,
	);

	return (
		<div style={{ minHeight: "100vh", background: "var(--s0)" }}>
			<div
				style={{ padding: "28px 24px 48px", maxWidth: 1200, margin: "0 auto" }}
			>
				{/* Header */}
				<div
					className="flex items-center justify-between animate-fade-in"
					style={{ marginBottom: 8 }}
				>
					<div className="flex items-center gap-3">
						<div
							style={{
								width: 3,
								height: 24,
								borderRadius: 2,
								background: "var(--gold)",
							}}
						/>
						<div>
							<h1
								className="font-display"
								style={{
									fontSize: 22,
									fontWeight: 700,
									color: "#f5f5f5",
									lineHeight: 1.1,
								}}
							>
								Contabilidad
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								Pedidos activos para cierre
							</p>
							<HelpButton {...helpContent.accounting} />
						</div>
					</div>
				</div>
				<div className="divider-gold" style={{ marginBottom: 28 }} />

				{/* KPI Cards */}
				<div
					className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
					style={{ marginBottom: 28 }}
				>
					{/* Total pendiente */}
					<div
						style={{
							background: "var(--s1)",
							border: "1px solid #f59e0b25",
							borderRadius: 16,
							padding: "24px 22px 20px",
							position: "relative",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								position: "absolute",
								top: 0,
								left: "20%",
								right: "20%",
								height: 1,
								background:
									"linear-gradient(90deg, transparent, #f59e0b50, transparent)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								top: 0,
								right: 0,
								width: 120,
								height: 120,
								background:
									"radial-gradient(circle at 100% 0%, #f59e0b12 0%, transparent 70%)",
								pointerEvents: "none",
							}}
						/>
						<div style={{ position: "relative", zIndex: 1 }}>
							<div
								className="flex items-center justify-between"
								style={{ marginBottom: 16 }}
							>
								<div
									className="font-display uppercase"
									style={{
										fontSize: 10,
										letterSpacing: "0.2em",
										color: "#888",
										fontWeight: 600,
									}}
								>
									Total pendiente
								</div>
								<div
									style={{
										width: 34,
										height: 34,
										borderRadius: 10,
										background: "#f59e0b15",
										border: "1px solid #f59e0b30",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<DollarSign size={16} style={{ color: "#f59e0b" }} />
								</div>
							</div>
							<div
								className="font-kds"
								style={{ fontSize: 36, lineHeight: 1, color: "#f59e0b" }}
							>
								{formatCurrency(totalOpen)}
							</div>
							<div
								className="font-body"
								style={{ fontSize: 11, color: "#666", marginTop: 4 }}
							>
								Por cobrar
							</div>
						</div>
					</div>

					{/* Mesas abiertas */}
					<div
						style={{
							background: "var(--s1)",
							border: "1px solid #3b82f625",
							borderRadius: 16,
							padding: "24px 22px 20px",
							position: "relative",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								position: "absolute",
								top: 0,
								left: "20%",
								right: "20%",
								height: 1,
								background:
									"linear-gradient(90deg, transparent, #3b82f650, transparent)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								top: 0,
								right: 0,
								width: 120,
								height: 120,
								background:
									"radial-gradient(circle at 100% 0%, #3b82f612 0%, transparent 70%)",
								pointerEvents: "none",
							}}
						/>
						<div style={{ position: "relative", zIndex: 1 }}>
							<div
								className="flex items-center justify-between"
								style={{ marginBottom: 16 }}
							>
								<div
									className="font-display uppercase"
									style={{
										fontSize: 10,
										letterSpacing: "0.2em",
										color: "#888",
										fontWeight: 600,
									}}
								>
									Mesas abiertas
								</div>
								<div
									style={{
										width: 34,
										height: 34,
										borderRadius: 10,
										background: "#3b82f615",
										border: "1px solid #3b82f630",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Users size={16} style={{ color: "#3b82f6" }} />
								</div>
							</div>
							<div
								className="font-kds"
								style={{ fontSize: 36, lineHeight: 1, color: "#3b82f6" }}
							>
								{activeOrders.length}
							</div>
							<div
								className="font-body"
								style={{ fontSize: 11, color: "#666", marginTop: 4 }}
							>
								Pedidos activos
							</div>
						</div>
					</div>

					{/* Total pedidos */}
					<div
						style={{
							background: "var(--s1)",
							border: "1px solid #10b98125",
							borderRadius: 16,
							padding: "24px 22px 20px",
							position: "relative",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								position: "absolute",
								top: 0,
								left: "20%",
								right: "20%",
								height: 1,
								background:
									"linear-gradient(90deg, transparent, #10b98150, transparent)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								top: 0,
								right: 0,
								width: 120,
								height: 120,
								background:
									"radial-gradient(circle at 100% 0%, #10b98112 0%, transparent 70%)",
								pointerEvents: "none",
							}}
						/>
						<div style={{ position: "relative", zIndex: 1 }}>
							<div
								className="flex items-center justify-between"
								style={{ marginBottom: 16 }}
							>
								<div
									className="font-display uppercase"
									style={{
										fontSize: 10,
										letterSpacing: "0.2em",
										color: "#888",
										fontWeight: 600,
									}}
								>
									Total pedidos
								</div>
								<div
									style={{
										width: 34,
										height: 34,
										borderRadius: 10,
										background: "#10b98115",
										border: "1px solid #10b98130",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Receipt size={16} style={{ color: "#10b981" }} />
								</div>
							</div>
							<div
								className="font-kds"
								style={{ fontSize: 36, lineHeight: 1, color: "#10b981" }}
							>
								{orders.length}
							</div>
							<div
								className="font-body"
								style={{ fontSize: 11, color: "#666", marginTop: 4 }}
							>
								Hoy en total
							</div>
						</div>
					</div>

					{/* Urgentes */}
					<div
						style={{
							background: "var(--s1)",
							border: `1px solid ${urgentOrders.length > 0 ? "#ef444425" : "#88888815"}`,
							borderRadius: 16,
							padding: "24px 22px 20px",
							position: "relative",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								position: "absolute",
								top: 0,
								left: "20%",
								right: "20%",
								height: 1,
								background: `linear-gradient(90deg, transparent, ${urgentOrders.length > 0 ? "#ef444450" : "#88888830"}, transparent)`,
							}}
						/>
						<div
							style={{
								position: "absolute",
								top: 0,
								right: 0,
								width: 120,
								height: 120,
								background: `radial-gradient(circle at 100% 0%, ${urgentOrders.length > 0 ? "#ef444412" : "#88888808"} 0%, transparent 70%)`,
								pointerEvents: "none",
							}}
						/>
						<div style={{ position: "relative", zIndex: 1 }}>
							<div
								className="flex items-center justify-between"
								style={{ marginBottom: 16 }}
							>
								<div
									className="font-display uppercase"
									style={{
										fontSize: 10,
										letterSpacing: "0.2em",
										color: "#888",
										fontWeight: 600,
									}}
								>
									Urgentes (+20m)
								</div>
								<div
									style={{
										width: 34,
										height: 34,
										borderRadius: 10,
										background:
											urgentOrders.length > 0 ? "#ef444415" : "#88888810",
										border: `1px solid ${urgentOrders.length > 0 ? "#ef444430" : "#88888820"}`,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<AlertTriangle
										size={16}
										style={{
											color: urgentOrders.length > 0 ? "#ef4444" : "#888",
										}}
									/>
								</div>
							</div>
							<div
								className="font-kds"
								style={{
									fontSize: 36,
									lineHeight: 1,
									color: urgentOrders.length > 0 ? "#ef4444" : "#888",
								}}
							>
								{urgentOrders.length}
							</div>
							<div
								className="font-body"
								style={{ fontSize: 11, color: "#666", marginTop: 4 }}
							>
								Requieren atencion
							</div>
						</div>
					</div>
				</div>

				{/* Orders section */}
				<div
					style={{
						background: "var(--s1)",
						border: "1px solid var(--s4)",
						borderRadius: 16,
						overflow: "hidden",
						boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
					}}
				>
					{/* Section header */}
					<div
						className="flex items-center justify-between"
						style={{
							padding: "14px 20px",
							borderBottom: "1px solid var(--s3)",
							background: "var(--s2)",
						}}
					>
						<div className="flex items-center gap-2.5">
							<Receipt size={14} style={{ color: "var(--gold)" }} />
							<span
								className="font-display uppercase"
								style={{
									fontSize: 11,
									letterSpacing: "0.15em",
									color: "#ccc",
									fontWeight: 600,
								}}
							>
								Pedidos activos
							</span>
						</div>
						<span className="font-body" style={{ fontSize: 11, color: "#666" }}>
							{activeOrders.length} mesas
						</span>
					</div>

					{/* Content */}
					{activeOrders.length === 0 ? (
						<div
							className="flex flex-col items-center justify-center"
							style={{ padding: "48px 20px" }}
						>
							<Check size={32} style={{ color: "#333", marginBottom: 8 }} />
							<span
								className="font-body"
								style={{ fontSize: 13, color: "#555" }}
							>
								Todo cobrado
							</span>
							<span
								className="font-body"
								style={{ fontSize: 11, color: "#444", marginTop: 2 }}
							>
								No hay pedidos activos en este momento
							</span>
						</div>
					) : (
						<div style={{ padding: 16 }}>
							{activeOrders.map((order) => (
								<OrderRow
									key={order.id}
									order={order}
									onClose={(o) => setPaymentModal(o)}
								/>
							))}
						</div>
					)}
				</div>

				{/* Payment modal */}
				{paymentModal && (
					<PaymentModal
						order={paymentModal}
						onClose={() => !closing && setPaymentModal(null)}
						onConfirm={confirmClose}
						closing={closing}
					/>
				)}
			</div>
		</div>
	);
}
