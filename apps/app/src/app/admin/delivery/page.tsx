"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Truck,
	Clock,
	Plus,
	MapPin,
	CreditCard,
	Package,
	CheckCircle2,
	Flame,
	Zap,
	X,
} from "lucide-react";
import { formatCurrency, elapsedMinutes } from "@/lib/utils";
import type { DeliveryOrder, DeliveryStatus } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
	DeliveryStatus,
	{
		label: string;
		color: string;
		bg: string;
		border: string;
		icon: React.ReactNode;
	}
> = {
	pending: {
		label: "Pendiente",
		color: "#f59e0b",
		bg: "rgba(245,158,11,0.1)",
		border: "rgba(245,158,11,0.25)",
		icon: <Zap size={11} />,
	},
	preparing: {
		label: "Preparando",
		color: "#3b82f6",
		bg: "rgba(59,130,246,0.1)",
		border: "rgba(59,130,246,0.25)",
		icon: <Flame size={11} />,
	},
	on_the_way: {
		label: "En camino",
		color: "#f59e0b",
		bg: "rgba(245,158,11,0.1)",
		border: "rgba(245,158,11,0.25)",
		icon: <Truck size={11} />,
	},
	delivered: {
		label: "Entregado",
		color: "#10b981",
		bg: "rgba(16,185,129,0.1)",
		border: "rgba(16,185,129,0.25)",
		icon: <CheckCircle2 size={11} />,
	},
};

const NEXT_STATUS: Record<
	Exclude<DeliveryStatus, "delivered">,
	DeliveryStatus
> = {
	pending: "preparing",
	preparing: "on_the_way",
	on_the_way: "delivered",
};

const PAYMENT_LABELS: Record<string, string> = {
	cash: "Efectivo",
	mercadopago: "MercadoPago",
	card: "Tarjeta",
};

// ─── Elapsed badge ────────────────────────────────────────────────────────────

function ElapsedBadge({ createdAt }: { createdAt: string }) {
	const [mins, setMins] = useState(() => elapsedMinutes(createdAt));

	useEffect(() => {
		const id = setInterval(() => setMins(elapsedMinutes(createdAt)), 15000);
		return () => clearInterval(id);
	}, [createdAt]);

	const urgent = mins >= 30;
	const warning = mins >= 15 && !urgent;

	return (
		<span
			className="flex items-center gap-1.5"
			style={{
				padding: "4px 10px",
				borderRadius: 8,
				border: `1px solid ${urgent ? "rgba(239,68,68,0.25)" : warning ? "rgba(245,158,11,0.25)" : "var(--s4)"}`,
				background: urgent
					? "rgba(239,68,68,0.1)"
					: warning
						? "rgba(245,158,11,0.1)"
						: "var(--s3)",
				color: urgent ? "#ef4444" : warning ? "#f59e0b" : "#666",
				fontFamily: "monospace",
				fontSize: 12,
				fontWeight: 700,
			}}
		>
			<Clock size={11} />
			{mins}m
		</span>
	);
}

// ─── Delivery card ────────────────────────────────────────────────────────────

function RepartidorLinkRow({ orderId }: { orderId: string }) {
	const [copied, setCopied] = useState(false);

	const getLink = () =>
		typeof window !== "undefined"
			? `${window.location.origin}/repartidor/${orderId}`
			: `/repartidor/${orderId}`;

	const handleCopy = () => {
		navigator.clipboard.writeText(getLink()).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	return (
		<div
			style={{
				padding: "10px 16px 14px",
				display: "flex",
				alignItems: "center",
				gap: 8,
				borderTop: "1px solid var(--s3)",
			}}
		>
			<span
				style={{
					flex: 1,
					fontSize: 10,
					color: "#444",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap" as const,
					fontFamily: "monospace",
				}}
			>
				/repartidor/{orderId.slice(0, 8)}…
			</span>
			<button
				onClick={handleCopy}
				title="Copiar link repartidor"
				style={{
					padding: "5px 10px",
					borderRadius: 8,
					border: "1px solid var(--s4)",
					background: copied ? "rgba(16,185,129,0.1)" : "var(--s2)",
					color: copied ? "#10b981" : "#888",
					fontSize: 10,
					fontWeight: 700,
					cursor: "pointer",
					fontFamily: "var(--font-syne)",
					letterSpacing: "0.08em",
					textTransform: "uppercase" as const,
					transition: "all 0.15s",
					display: "flex",
					alignItems: "center",
					gap: 5,
				}}
			>
				{copied ? (
					<svg
						width="11"
						height="11"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
					>
						<path d="M20 6L9 17l-5-5" />
					</svg>
				) : (
					<svg
						width="11"
						height="11"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<rect x="9" y="9" width="13" height="13" rx="2" />
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
					</svg>
				)}
				{copied ? "Copiado" : "Copiar"}
			</button>
		</div>
	);
}

function DeliveryCard({
	order,
	onAdvance,
}: {
	order: DeliveryOrder;
	onAdvance: (id: string, status: DeliveryStatus) => void;
}) {
	const cfg = STATUS_CONFIG[order.status];
	const isDelivered = order.status === "delivered";
	const nextStatus = isDelivered
		? null
		: NEXT_STATUS[order.status as Exclude<DeliveryStatus, "delivered">];

	const advanceLabel: Record<Exclude<DeliveryStatus, "delivered">, string> = {
		pending: "Iniciar preparación →",
		preparing: "Enviar a repartidor →",
		on_the_way: "Confirmar entrega ✓",
	};

	const advanceBg: Record<Exclude<DeliveryStatus, "delivered">, string> = {
		pending: "#3b82f6",
		preparing: "#f59e0b",
		on_the_way: "#10b981",
	};

	return (
		<div
			className="card overflow-hidden flex flex-col"
			style={{ opacity: isDelivered ? 0.6 : 1, transition: "opacity 0.2s" }}
		>
			{/* Header */}
			<div
				style={{
					padding: "14px 16px 12px",
					borderBottom: "1px solid var(--s3)",
					background: "var(--s2)",
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: 12,
				}}
			>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div className="flex items-center gap-2 mb-1">
						<span
							className="flex items-center gap-1.5"
							style={{
								padding: "3px 8px",
								borderRadius: 6,
								border: `1px solid ${cfg.border}`,
								background: cfg.bg,
								color: cfg.color,
								fontFamily: "var(--font-syne)",
								fontSize: 9,
								fontWeight: 700,
								letterSpacing: "0.1em",
								textTransform: "uppercase",
							}}
						>
							{cfg.icon}
							{cfg.label}
						</span>
					</div>
					<div
						className="font-display text-ink-primary"
						style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}
					>
						{order.customerName}
					</div>
					<div
						className="flex items-center gap-1.5 mt-1"
						style={{ color: "#555" }}
					>
						<MapPin size={11} style={{ flexShrink: 0 }} />
						<span
							className="font-body text-ink-disabled"
							style={{
								fontSize: 12,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{order.address}
						</span>
					</div>
				</div>
				<ElapsedBadge createdAt={order.createdAt} />
			</div>

			{/* Items */}
			<div
				style={{
					padding: "12px 16px",
					display: "flex",
					flexDirection: "column",
					gap: 6,
					flex: 1,
				}}
			>
				{order.items.length === 0 ? (
					<div className="font-body text-ink-disabled" style={{ fontSize: 12 }}>
						Sin ítems registrados
					</div>
				) : (
					order.items.map((item, i) => (
						<div key={i} className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2 min-w-0">
								<span
									className="font-kds text-brand-500"
									style={{
										fontSize: 18,
										lineHeight: 1,
										width: 20,
										textAlign: "center",
										flexShrink: 0,
									}}
								>
									{item.qty}
								</span>
								<span
									className="font-display text-ink-primary"
									style={{
										fontSize: 12,
										fontWeight: 600,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{item.name}
								</span>
							</div>
							<span
								className="font-body text-ink-disabled"
								style={{ fontSize: 12, flexShrink: 0 }}
							>
								{formatCurrency(item.price * item.qty)}
							</span>
						</div>
					))
				)}
			</div>

			{/* Footer */}
			<div
				style={{
					padding: "10px 16px",
					borderTop: "1px solid var(--s3)",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 12,
				}}
			>
				<div className="flex items-center gap-2">
					<CreditCard size={12} style={{ color: "#555" }} />
					<span
						className="font-body text-ink-disabled"
						style={{ fontSize: 12 }}
					>
						{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
					</span>
				</div>
				<span
					className="font-kds text-brand-500"
					style={{ fontSize: 20, lineHeight: 1 }}
				>
					{formatCurrency(order.total)}
				</span>
			</div>

			{/* Repartidor link — shown for active orders */}
			{!isDelivered && <RepartidorLinkRow orderId={order.id} />}

			{/* Advance button */}
			{!isDelivered && nextStatus && (
				<div style={{ padding: "0 16px 16px" }}>
					<button
						onClick={() => onAdvance(order.id, nextStatus)}
						style={{
							width: "100%",
							padding: "10px",
							borderRadius: 12,
							border: "none",
							background:
								advanceBg[order.status as Exclude<DeliveryStatus, "delivered">],
							color: order.status === "preparing" ? "#0a0a0a" : "#fff",
							fontFamily: "var(--font-syne)",
							fontWeight: 600,
							fontSize: 12,
							cursor: "pointer",
							transition: "all 0.15s",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{advanceLabel[order.status as Exclude<DeliveryStatus, "delivered">]}
					</button>
				</div>
			)}
		</div>
	);
}

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatsRow({ orders }: { orders: DeliveryOrder[] }) {
	const pending = orders.filter((o) => o.status === "pending").length;
	const preparing = orders.filter((o) => o.status === "preparing").length;
	const onTheWay = orders.filter((o) => o.status === "on_the_way").length;
	const delivered = orders.filter((o) => o.status === "delivered").length;
	const total = orders
		.filter((o) => o.status === "delivered")
		.reduce((s, o) => s + o.total, 0);

	return (
		<div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
			<div
				className="card col-span-2 sm:col-span-1 md:col-span-2 p-5"
				style={{
					position: "relative",
					overflow: "hidden",
					borderColor: "rgba(245,158,11,0.25)",
					boxShadow: "0 0 24px rgba(245,158,11,0.06)",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background:
							"radial-gradient(ellipse 300px 200px at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 60%)",
						pointerEvents: "none",
					}}
				/>
				<div style={{ position: "relative", zIndex: 1 }}>
					<div
						className="font-display text-ink-disabled uppercase mb-3"
						style={{ fontSize: 9, letterSpacing: "0.25em" }}
					>
						Facturación delivery hoy
					</div>
					<div className="flex items-end gap-3">
						<span
							className="font-kds text-brand-500"
							style={{ fontSize: 36, lineHeight: 1 }}
						>
							{formatCurrency(total)}
						</span>
						<div style={{ paddingBottom: 4 }}>
							<div className="flex items-center gap-1.5">
								<div
									style={{
										width: 6,
										height: 6,
										borderRadius: "50%",
										background: "#10b981",
									}}
								/>
								<span
									className="font-body"
									style={{ fontSize: 10, color: "#10b981" }}
								>
									{delivered} entregados
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{[
				{ label: "Pendiente", count: pending, color: "#f59e0b" },
				{ label: "Preparando", count: preparing, color: "#3b82f6" },
				{ label: "En camino", count: onTheWay, color: "#f59e0b" },
				{ label: "Entregados", count: delivered, color: "#10b981" },
			].map(({ label, count, color }) => (
				<div key={label} className="card p-4 flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<span
							style={{
								width: 8,
								height: 8,
								borderRadius: "50%",
								background: color,
								flexShrink: 0,
							}}
						/>
						<span
							className="font-display text-ink-disabled uppercase"
							style={{ fontSize: 9, letterSpacing: "0.2em" }}
						>
							{label}
						</span>
					</div>
					<span
						className="font-kds"
						style={{ fontSize: 36, lineHeight: 1, color }}
					>
						{count}
					</span>
				</div>
			))}
		</div>
	);
}

// ─── New order modal ──────────────────────────────────────────────────────────

function NewOrderModal({
	onClose,
	onCreated,
}: {
	onClose: () => void;
	onCreated: () => void;
}) {
	const [form, setForm] = useState({
		customerName: "",
		address: "",
		phone: "",
		paymentMethod: "mercadopago",
	});
	const [saving, setSaving] = useState(false);

	const handleSubmit = async () => {
		if (!form.customerName.trim() || !form.address.trim()) return;
		setSaving(true);
		try {
			await apiFetch("/api/delivery", {
				method: "POST",
				body: JSON.stringify({
					customerName: form.customerName,
					address: form.address,
					phone: form.phone || null,
					total: 0,
					paymentMethod: form.paymentMethod,
					items: [],
				}),
			});
			onCreated();
			onClose();
		} catch (e) {
			console.error(e);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 50,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(0,0,0,0.6)",
				backdropFilter: "blur(4px)",
			}}
			onClick={onClose}
		>
			<div
				className="card w-full animate-slide-up"
				style={{ maxWidth: 400, margin: "0 16px" }}
				onClick={(e) => e.stopPropagation()}
			>
				<div
					className="flex items-center justify-between"
					style={{ padding: "16px 20px", borderBottom: "1px solid var(--s3)" }}
				>
					<h3
						className="font-display text-ink-primary"
						style={{ fontSize: 14, fontWeight: 700 }}
					>
						Nueva orden de delivery
					</h3>
					<button
						className="btn-ghost"
						style={{ padding: "4px 6px" }}
						onClick={onClose}
					>
						<X size={15} style={{ color: "#555" }} />
					</button>
				</div>

				<div
					style={{
						padding: "20px",
						display: "flex",
						flexDirection: "column",
						gap: 16,
					}}
				>
					{[
						{
							label: "Cliente",
							key: "customerName",
							placeholder: "Nombre del cliente",
						},
						{
							label: "Dirección",
							key: "address",
							placeholder: "Dirección de entrega",
						},
						{ label: "Teléfono", key: "phone", placeholder: "Opcional" },
					].map(({ label, key, placeholder }) => (
						<div key={key}>
							<label
								className="font-display text-ink-disabled uppercase block mb-1.5"
								style={{ fontSize: 9, letterSpacing: "0.2em" }}
							>
								{label}
							</label>
							<input
								type="text"
								placeholder={placeholder}
								value={form[key as keyof typeof form]}
								onChange={(e) =>
									setForm((f) => ({ ...f, [key]: e.target.value }))
								}
								className="input-base w-full"
								style={{ fontSize: 13, padding: "10px 12px" }}
							/>
						</div>
					))}

					<div>
						<label
							className="font-display text-ink-disabled uppercase block mb-1.5"
							style={{ fontSize: 9, letterSpacing: "0.2em" }}
						>
							Método de pago
						</label>
						<div
							className="grid gap-2"
							style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
						>
							{[
								{ id: "mercadopago", label: "MercadoPago" },
								{ id: "cash", label: "Efectivo" },
								{ id: "card", label: "Tarjeta" },
							].map((m) => (
								<button
									key={m.id}
									onClick={() =>
										setForm((f) => ({ ...f, paymentMethod: m.id }))
									}
									style={{
										padding: "8px 12px",
										borderRadius: 12,
										border: `1px solid ${form.paymentMethod === m.id ? "#f59e0b" : "var(--s3)"}`,
										background:
											form.paymentMethod === m.id ? "#f59e0b" : "var(--s2)",
										color: form.paymentMethod === m.id ? "#0a0a0a" : "#888",
										fontFamily: "var(--font-syne)",
										fontWeight: 600,
										fontSize: 11,
										cursor: "pointer",
										transition: "all 0.15s",
									}}
								>
									{m.label}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="flex gap-2" style={{ padding: "0 20px 20px" }}>
					<button
						className="btn-ghost flex-1"
						style={{ padding: "10px" }}
						onClick={onClose}
					>
						Cancelar
					</button>
					<button
						onClick={handleSubmit}
						disabled={
							saving || !form.customerName.trim() || !form.address.trim()
						}
						className="btn-primary flex-1"
						style={{
							padding: "10px",
							opacity:
								saving || !form.customerName.trim() || !form.address.trim()
									? 0.4
									: 1,
						}}
					>
						{saving ? "Creando..." : "Crear orden"}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterKey = "all" | DeliveryStatus;

const FILTER_TABS: { key: FilterKey; label: string }[] = [
	{ key: "all", label: "Todos" },
	{ key: "pending", label: "Pendiente" },
	{ key: "preparing", label: "Preparando" },
	{ key: "on_the_way", label: "En camino" },
	{ key: "delivered", label: "Entregados" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeliveryPage() {
	const [orders, setOrders] = useState<DeliveryOrder[]>([]);
	const [filter, setFilter] = useState<FilterKey>("all");
	const [showModal, setShowModal] = useState(false);

	const fetchOrders = useCallback(async () => {
		try {
			const data = await apiFetch<{ orders: DeliveryOrder[] }>("/api/delivery");
			setOrders(data.orders ?? []);
		} catch (e) {
			console.error(e);
		}
	}, []);

	useEffect(() => {
		fetchOrders();
		const id = setInterval(fetchOrders, 10000);
		return () => clearInterval(id);
	}, [fetchOrders]);

	const advanceStatus = async (id: string, status: DeliveryStatus) => {
		setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
		try {
			await apiFetch(`/api/delivery/${id}`, {
				method: "PATCH",
				body: JSON.stringify({ status }),
			});
		} catch (e) {
			console.error(e);
			fetchOrders();
		}
	};

	const activeOrders = orders.filter((o) => o.status !== "delivered");

	const filtered =
		filter === "all" ? orders : orders.filter((o) => o.status === filter);

	const countFor = (key: FilterKey) =>
		key === "all"
			? orders.length
			: orders.filter((o) => o.status === key).length;

	return (
		<div
			className="min-h-screen p-5 md:p-7 pb-10"
			style={{ background: "var(--s0)" }}
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-7">
				<div>
					<div className="flex items-center gap-2 mb-1">
						<div
							style={{
								width: 3,
								height: 20,
								borderRadius: 3,
								background: "var(--gold)",
							}}
						/>
						<h1
							className="font-display text-ink-primary"
							style={{ fontSize: 22, fontWeight: 700 }}
						>
							Delivery
						</h1>
					</div>
					<div className="font-body text-ink-disabled" style={{ fontSize: 12 }}>
						{activeOrders.length} pedidos activos
					</div>
				</div>
				<button
					onClick={() => setShowModal(true)}
					className="btn-primary"
					style={{ padding: "10px 20px" }}
				>
					<Plus size={13} />
					Nueva orden
				</button>
			</div>

			<div className="divider-gold mb-7" />

			<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
				<StatsRow orders={orders} />

				{/* Filter tabs */}
				<div className="flex items-center gap-1.5 flex-wrap">
					{FILTER_TABS.map((tab) => {
						const count = countFor(tab.key);
						const isActive = filter === tab.key;
						return (
							<button
								key={tab.key}
								onClick={() => setFilter(tab.key)}
								className="flex items-center gap-2"
								style={{
									padding: "8px 16px",
									borderRadius: 12,
									border: `1px solid ${isActive ? "#f59e0b" : "var(--s3)"}`,
									background: isActive ? "#f59e0b" : "var(--s2)",
									color: isActive ? "#0a0a0a" : "#666",
									fontFamily: "var(--font-syne)",
									fontWeight: 600,
									fontSize: 11,
									cursor: "pointer",
									transition: "all 0.15s",
									boxShadow: isActive ? "0 0 8px rgba(245,158,11,0.3)" : "none",
								}}
							>
								{tab.label}
								<span
									className="font-kds"
									style={{
										fontSize: 14,
										lineHeight: 1,
										color: isActive ? "rgba(0,0,0,0.6)" : "#555",
									}}
								>
									{count}
								</span>
							</button>
						);
					})}
				</div>

				{/* Orders grid */}
				{filtered.length === 0 ? (
					<div
						className="card flex flex-col items-center justify-center gap-4"
						style={{ padding: 56 }}
					>
						<div
							style={{
								width: 64,
								height: 64,
								borderRadius: 16,
								background: "var(--s2)",
								border: "1px solid var(--s3)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Truck size={28} style={{ color: "#555" }} />
						</div>
						<div style={{ textAlign: "center" }}>
							<p
								className="font-display text-ink-secondary"
								style={{ fontSize: 14, fontWeight: 700 }}
							>
								Sin pedidos
							</p>
							<p
								className="font-body text-ink-disabled mt-1"
								style={{ fontSize: 12 }}
							>
								{filter === "all"
									? "No hay órdenes de delivery"
									: `No hay órdenes con estado "${FILTER_TABS.find((t) => t.key === filter)?.label}"`}
							</p>
						</div>
						<button
							onClick={() => setShowModal(true)}
							className="btn-primary mt-1"
							style={{ padding: "8px 20px", fontSize: 12 }}
						>
							<Plus size={13} />
							Crear primera orden
						</button>
					</div>
				) : (
					<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
						{filtered.map((order) => (
							<DeliveryCard
								key={order.id}
								order={order}
								onAdvance={advanceStatus}
							/>
						))}
					</div>
				)}

				{/* Info note */}
				<div className="card flex items-start gap-3" style={{ padding: 20 }}>
					<div
						style={{
							width: 36,
							height: 36,
							borderRadius: 10,
							background: "rgba(245,158,11,0.1)",
							border: "1px solid rgba(245,158,11,0.2)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
						}}
					>
						<Package size={15} style={{ color: "#f59e0b" }} />
					</div>
					<div>
						<div
							className="font-display text-ink-primary mb-1"
							style={{ fontSize: 12, fontWeight: 700 }}
						>
							Gestión de Delivery
						</div>
						<p
							className="font-body text-ink-disabled"
							style={{ fontSize: 12, lineHeight: 1.6 }}
						>
							Las órdenes de delivery se sincronizan con cocina y barra en
							tiempo real. Avanzá el estado de cada pedido para mantener al
							repartidor y al cliente informados. Los pedidos urgentes (&gt;30
							min) se marcan en rojo automáticamente.
						</p>
					</div>
				</div>
			</div>

			{showModal && (
				<NewOrderModal
					onClose={() => setShowModal(false)}
					onCreated={fetchOrders}
				/>
			)}
		</div>
	);
}
