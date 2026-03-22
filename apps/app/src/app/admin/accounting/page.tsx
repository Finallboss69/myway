"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Clock,
	Banknote,
	CreditCard,
	Smartphone,
	Check,
	X,
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
			sub: "Débito o crédito",
			icon: CreditCard,
			color: "#8b5cf6",
		},
	];

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.7)",
				backdropFilter: "blur(6px)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				className="card-gold animate-scale-in"
				style={{ width: 420, padding: "28px 28px 24px" }}
			>
				<div className="flex items-center justify-between mb-5">
					<div>
						<div
							className="font-display text-ink-primary uppercase"
							style={{ fontSize: 13, letterSpacing: "0.2em", fontWeight: 600 }}
						>
							Cerrar Mesa {order.tableNumber}
						</div>
						<div
							className="font-body text-ink-disabled mt-0.5"
							style={{ fontSize: 11 }}
						>
							{order.items.length} ítems · {order.waiterName ?? "Sin mozo"}
						</div>
					</div>
					<button
						className="btn-ghost"
						style={{ padding: 8 }}
						onClick={onClose}
					>
						<X size={16} />
					</button>
				</div>

				{/* Total */}
				<div
					className="text-center py-4 mb-5 rounded-xl"
					style={{
						background: "rgba(245,158,11,0.06)",
						border: "1px solid rgba(245,158,11,0.15)",
					}}
				>
					<div
						className="font-display text-ink-disabled uppercase mb-1"
						style={{ fontSize: 9, letterSpacing: "0.3em" }}
					>
						Total a cobrar
					</div>
					<div
						className="font-kds text-brand-500"
						style={{
							fontSize: 48,
							lineHeight: 1,
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
							className="flex items-center gap-3 rounded-xl w-full transition-all"
							style={{
								padding: "13px 16px",
								background: "var(--s2)",
								border: "1px solid var(--s3)",
								cursor: closing ? "not-allowed" : "pointer",
								textAlign: "left",
								color: "#f5f5f5",
								opacity: closing ? 0.6 : 1,
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
									className="text-ink-disabled font-body"
									style={{ fontSize: 11 }}
								>
									{sub}
								</div>
							</div>
						</button>
					))}
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
		<div className="card-sm" style={{ marginBottom: 8, overflow: "hidden" }}>
			<div style={{ padding: "14px 18px" }}>
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
							className="font-kds text-ink-primary"
							style={{ fontSize: 22, lineHeight: 1 }}
						>
							Mesa {order.tableNumber}
						</div>
						<div
							className="font-display text-ink-disabled uppercase"
							style={{ fontSize: 9, letterSpacing: "0.2em", marginTop: 2 }}
						>
							{order.waiterName ?? "—"}
						</div>
					</div>

					{/* Status */}
					<span
						style={{
							fontSize: 9,
							padding: "3px 10px",
							borderRadius: 99,
							fontFamily: "var(--font-syne)",
							fontWeight: 700,
							letterSpacing: "0.12em",
							textTransform: "uppercase",
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
						<span
							className="font-body text-ink-disabled"
							style={{ fontSize: 11 }}
						>
							· {formatTime(order.createdAt)}
						</span>
					</div>

					{/* Total */}
					<span
						className="font-kds text-brand-500"
						style={{ fontSize: 18, minWidth: 90, textAlign: "right" }}
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
							{order.items.length} ítems
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
										className="font-kds text-ink-disabled"
										style={{ fontSize: 14, minWidth: 24 }}
									>
										{item.qty}×
									</span>
									<span
										className="font-body text-ink-secondary flex-1"
										style={{ fontSize: 13 }}
									>
										{item.name}
									</span>
									<span
										style={{
											fontSize: 8,
											padding: "1px 7px",
											borderRadius: 99,
											fontFamily: "var(--font-syne)",
											fontWeight: 600,
											letterSpacing: "0.1em",
											textTransform: "uppercase",
											color: ic,
											background: `${ic}18`,
											border: `1px solid ${ic}25`,
										}}
									>
										{STATUS_LABELS[item.status] ?? item.status}
									</span>
									<span
										className="font-kds text-ink-tertiary"
										style={{ fontSize: 13 }}
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

	return (
		<div style={{ padding: 28 }}>
			{/* Header */}
			<div className="flex items-center justify-between mb-7">
				<div>
					<h1
						className="font-display text-ink-primary"
						style={{ fontSize: 20, fontWeight: 700 }}
					>
						Contabilidad
					</h1>
					<div
						className="font-body text-ink-disabled mt-1"
						style={{ fontSize: 12 }}
					>
						Pedidos activos para cierre
					</div>
				</div>

				{/* Summary */}
				<div
					className="card-gold"
					style={{ padding: "14px 24px", textAlign: "right" }}
				>
					<div
						className="font-display text-ink-disabled uppercase"
						style={{ fontSize: 9, letterSpacing: "0.25em" }}
					>
						Total pendiente de cobro
					</div>
					<div
						className="font-kds text-brand-500 mt-1"
						style={{ fontSize: 28, lineHeight: 1 }}
					>
						{formatCurrency(totalOpen)}
					</div>
					<div
						className="font-body text-ink-disabled mt-0.5"
						style={{ fontSize: 11 }}
					>
						{activeOrders.length} mesas abiertas
					</div>
				</div>
			</div>

			{/* Orders list */}
			{activeOrders.length === 0 ? (
				<div
					className="text-center py-20 text-ink-disabled font-body"
					style={{ fontSize: 13 }}
				>
					No hay pedidos activos en este momento
				</div>
			) : (
				<div>
					{activeOrders.map((order) => (
						<OrderRow
							key={order.id}
							order={order}
							onClose={(o) => setPaymentModal(o)}
						/>
					))}
				</div>
			)}

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
	);
}
