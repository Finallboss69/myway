"use client";

import { useState, useEffect } from "react";
import {
	Truck,
	Clock,
	Plus,
	MapPin,
	CreditCard,
	ChevronRight,
	Package,
	CheckCircle2,
	Flame,
	Zap,
	RotateCcw,
	X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { DeliveryOrder, DeliveryStatus } from "@/store/useAppStore";
import { formatCurrency, formatTime, elapsedMinutes } from "@/data/mock";
import { useLiveClock } from "@/hooks/useLiveClock";

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
		color: "text-amber-400",
		bg: "bg-amber-500/10",
		border: "border-amber-500/25",
		icon: <Zap size={11} />,
	},
	preparing: {
		label: "Preparando",
		color: "text-blue-400",
		bg: "bg-blue-500/10",
		border: "border-blue-500/25",
		icon: <Flame size={11} />,
	},
	on_the_way: {
		label: "En camino",
		color: "text-brand-400",
		bg: "bg-brand-500/10",
		border: "border-brand-500/25",
		icon: <Truck size={11} />,
	},
	delivered: {
		label: "Entregado",
		color: "text-pool-400",
		bg: "bg-pool-500/10",
		border: "border-pool-500/25",
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

function ElapsedBadge({ createdAt }: { createdAt: Date }) {
	const [mins, setMins] = useState(() => elapsedMinutes(createdAt));
	useEffect(() => {
		const id = setInterval(() => setMins(elapsedMinutes(createdAt)), 15000);
		return () => clearInterval(id);
	}, [createdAt]);

	const urgent = mins >= 30;
	const warning = mins >= 15 && !urgent;

	return (
		<span
			className={[
				"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold",
				urgent
					? "bg-red-500/10 border-red-500/25 text-red-400"
					: warning
						? "bg-amber-500/10 border-amber-500/25 text-amber-400"
						: "bg-surface-3 border-surface-4 text-ink-tertiary",
			].join(" ")}
		>
			<Clock size={11} />
			{mins}m
		</span>
	);
}

// ─── Order card ───────────────────────────────────────────────────────────────

function DeliveryCard({ order }: { order: DeliveryOrder }) {
	const updateDeliveryStatus = useAppStore((s) => s.updateDeliveryStatus);
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

	const advanceCls: Record<Exclude<DeliveryStatus, "delivered">, string> = {
		pending: "btn-blue text-xs py-2.5 rounded-xl w-full justify-center",
		preparing: "btn-primary text-xs py-2.5 rounded-xl w-full justify-center",
		on_the_way:
			"btn-green text-xs py-2.5 rounded-xl w-full justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]",
	};

	return (
		<div
			className={[
				"card overflow-hidden flex flex-col transition-all duration-200",
				order.status === "delivered" ? "opacity-60" : "",
			].join(" ")}
		>
			{/* Card header */}
			<div className="px-4 pt-4 pb-3 border-b border-surface-3 bg-surface-2/30 flex items-start justify-between gap-3">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<span
							className={[
								"inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border font-display text-[10px] font-700 uppercase tracking-wider",
								cfg.bg,
								cfg.border,
								cfg.color,
							].join(" ")}
						>
							{cfg.icon}
							{cfg.label}
						</span>
					</div>
					<div className="font-display text-sm font-700 text-ink-primary leading-tight">
						{order.customerName}
					</div>
					<div className="flex items-center gap-1.5 mt-1 text-ink-tertiary">
						<MapPin size={11} className="flex-shrink-0" />
						<span className="font-body text-xs truncate">{order.address}</span>
					</div>
				</div>
				<ElapsedBadge createdAt={order.createdAt} />
			</div>

			{/* Items */}
			<div className="px-4 py-3 flex flex-col gap-1.5 flex-1">
				{order.items.map((item, i) => (
					<div key={i} className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2 min-w-0">
							<span className="font-kds text-xl leading-none text-brand-500 w-5 text-center flex-shrink-0">
								{item.qty}
							</span>
							<span className="font-display text-xs font-600 text-ink-primary truncate">
								{item.name}
							</span>
						</div>
						<span className="font-body text-xs text-ink-tertiary flex-shrink-0">
							{formatCurrency(item.price * item.qty)}
						</span>
					</div>
				))}
			</div>

			{/* Footer */}
			<div className="px-4 pb-3 pt-2 border-t border-surface-3 flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<CreditCard size={12} className="text-ink-tertiary" />
					<span className="font-body text-xs text-ink-tertiary">
						{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
					</span>
				</div>
				<span className="font-kds text-xl leading-none text-brand-500">
					{formatCurrency(order.total)}
				</span>
			</div>

			{/* Action */}
			{!isDelivered && nextStatus && (
				<div className="px-4 pb-4">
					<button
						onClick={() => updateDeliveryStatus(order.id, nextStatus)}
						className={
							advanceCls[order.status as Exclude<DeliveryStatus, "delivered">]
						}
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
	const total = orders.reduce(
		(s, o) => (o.status === "delivered" ? s + o.total : s),
		0,
	);

	return (
		<div className="grid grid-cols-5 gap-3">
			{/* Revenue card */}
			<div className="stat-card col-span-2 relative overflow-hidden border-brand-500/25 shadow-gold-sm">
				<div className="absolute inset-0 bg-gold-glow opacity-50 pointer-events-none" />
				<div className="relative z-10">
					<div className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest mb-3">
						Facturación delivery hoy
					</div>
					<div className="flex items-end gap-3">
						<span className="font-kds text-4xl text-brand-500 leading-none">
							{formatCurrency(total)}
						</span>
						<div className="pb-1">
							<div className="flex items-center gap-1.5">
								<div className="w-1.5 h-1.5 rounded-full bg-pool-500" />
								<span className="font-body text-[10px] text-pool-500">
									{delivered} entregados
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Status stats */}
			{[
				{
					label: "Pendiente",
					count: pending,
					color: "text-amber-400",
					dot: "bg-amber-500",
				},
				{
					label: "Preparando",
					count: preparing,
					color: "text-blue-400",
					dot: "bg-blue-500",
				},
				{
					label: "En camino",
					count: onTheWay,
					color: "text-brand-400",
					dot: "bg-brand-500",
				},
				{
					label: "Entregados",
					count: delivered,
					color: "text-pool-400",
					dot: "bg-pool-500",
				},
			].map(({ label, count, color, dot }) => (
				<div key={label} className="stat-card flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<span
							className={["w-2 h-2 rounded-full flex-shrink-0", dot].join(" ")}
						/>
						<span className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest">
							{label}
						</span>
					</div>
					<span className={["font-kds text-4xl leading-none", color].join(" ")}>
						{count}
					</span>
				</div>
			))}
		</div>
	);
}

// ─── New order modal ──────────────────────────────────────────────────────────

function NewOrderModal({ onClose }: { onClose: () => void }) {
	const addDeliveryOrder = useAppStore((s) => s.addDeliveryOrder);
	const [form, setForm] = useState({
		customerName: "",
		address: "",
		paymentMethod: "mercadopago",
	});

	const handleSubmit = () => {
		if (!form.customerName.trim() || !form.address.trim()) return;
		addDeliveryOrder({
			customerName: form.customerName,
			address: form.address,
			paymentMethod: form.paymentMethod,
			items: [],
			total: 0,
			status: "pending",
		});
		onClose();
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
			onClick={onClose}
		>
			<div
				className="card w-full max-w-sm mx-4 animate-slide-up"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-surface-3 flex items-center justify-between">
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Nueva orden de delivery
					</h3>
					<button onClick={onClose} className="btn-ghost p-1.5">
						<X size={15} className="text-ink-tertiary" />
					</button>
				</div>
				<div className="p-6 space-y-4">
					<div>
						<label className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest block mb-1.5">
							Cliente
						</label>
						<input
							type="text"
							placeholder="Nombre del cliente"
							value={form.customerName}
							onChange={(e) =>
								setForm((f) => ({ ...f, customerName: e.target.value }))
							}
							className="input-base w-full text-sm py-2.5"
						/>
					</div>
					<div>
						<label className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest block mb-1.5">
							Dirección
						</label>
						<input
							type="text"
							placeholder="Dirección de entrega"
							value={form.address}
							onChange={(e) =>
								setForm((f) => ({ ...f, address: e.target.value }))
							}
							className="input-base w-full text-sm py-2.5"
						/>
					</div>
					<div>
						<label className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest block mb-1.5">
							Método de pago
						</label>
						<div className="grid grid-cols-3 gap-2">
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
									className={[
										"py-2 px-3 rounded-xl border font-display text-xs font-600 transition-all",
										form.paymentMethod === m.id
											? "bg-brand-500 text-surface-0 border-brand-500 shadow-gold-sm"
											: "bg-surface-2 border-surface-3 text-ink-secondary hover:border-brand-500/30",
									].join(" ")}
								>
									{m.label}
								</button>
							))}
						</div>
					</div>
				</div>
				<div className="px-6 pb-6 flex gap-2">
					<button
						onClick={onClose}
						className="btn-secondary flex-1 text-sm py-2.5"
					>
						Cancelar
					</button>
					<button
						onClick={handleSubmit}
						disabled={!form.customerName.trim() || !form.address.trim()}
						className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
					>
						Crear orden
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

function TopBar({
	activeCount,
	onNew,
}: {
	activeCount: number;
	onNew: () => void;
}) {
	const { time, date } = useLiveClock();

	return (
		<div className="flex items-center justify-between px-8 py-5 border-b border-surface-3 bg-surface-1/60 backdrop-blur-sm sticky top-0 z-10">
			<div>
				<h1 className="font-display text-xl font-700 text-ink-primary tracking-tight">
					Delivery
				</h1>
				<p className="font-body text-xs text-ink-tertiary mt-0.5">
					{activeCount} pedidos activos ·{" "}
					<span className="capitalize" suppressHydrationWarning>
						{date}
					</span>
				</p>
			</div>
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5 text-ink-tertiary">
					<Clock size={13} />
					<span className="font-mono text-xs" suppressHydrationWarning>
						{time}
					</span>
				</div>
				<button
					onClick={onNew}
					className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
				>
					<Plus size={13} />
					Nueva orden
				</button>
			</div>
		</div>
	);
}

// ─── Orders grid ─────────────────────────────────────────────────────────────

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
	const deliveryOrders = useAppStore((s) => s.deliveryOrders);
	const [filter, setFilter] = useState<FilterKey>("all");
	const [showModal, setShowModal] = useState(false);

	const activeOrders = deliveryOrders.filter((o) => o.status !== "delivered");

	const filtered =
		filter === "all"
			? deliveryOrders
			: deliveryOrders.filter((o) => o.status === filter);

	const countFor = (key: FilterKey) =>
		key === "all"
			? deliveryOrders.length
			: deliveryOrders.filter((o) => o.status === key).length;

	return (
		<div className="flex flex-col min-h-screen">
			<TopBar
				activeCount={activeOrders.length}
				onNew={() => setShowModal(true)}
			/>

			<div className="flex-1 px-8 py-6 space-y-5 animate-fade-in">
				{/* Stats */}
				<StatsRow orders={deliveryOrders} />

				{/* Filter tabs */}
				<div className="flex items-center gap-1.5">
					{FILTER_TABS.map((tab) => {
						const count = countFor(tab.key);
						const isActive = filter === tab.key;
						return (
							<button
								key={tab.key}
								onClick={() => setFilter(tab.key)}
								className={[
									"flex items-center gap-2 px-4 py-2 rounded-xl font-display text-xs font-600 transition-all border",
									isActive
										? "bg-brand-500 text-surface-0 border-brand-500 shadow-gold-sm"
										: "bg-surface-2 border-surface-3 text-ink-tertiary hover:text-ink-primary hover:border-surface-4",
								].join(" ")}
							>
								{tab.label}
								<span
									className={[
										"font-kds text-sm leading-none",
										isActive ? "text-surface-0/70" : "text-ink-tertiary",
									].join(" ")}
								>
									{count}
								</span>
							</button>
						);
					})}
				</div>

				{/* Orders grid */}
				{filtered.length === 0 ? (
					<div className="card p-14 flex flex-col items-center justify-center gap-4">
						<div className="w-16 h-16 rounded-2xl bg-surface-2 border border-surface-3 flex items-center justify-center">
							<Truck size={28} className="text-ink-tertiary" />
						</div>
						<div className="text-center">
							<p className="font-display text-sm font-700 text-ink-secondary">
								Sin pedidos
							</p>
							<p className="font-body text-xs text-ink-tertiary mt-1">
								{filter === "all"
									? "No hay órdenes de delivery"
									: `No hay órdenes con estado "${FILTER_TABS.find((t) => t.key === filter)?.label}"`}
							</p>
						</div>
						<button
							onClick={() => setShowModal(true)}
							className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 mt-1"
						>
							<Plus size={13} />
							Crear primera orden
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{filtered.map((order) => (
							<DeliveryCard key={order.id} order={order} />
						))}
					</div>
				)}

				{/* Delivery info note */}
				<div className="card p-5 flex items-start gap-3">
					<div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
						<Package size={15} className="text-brand-500" />
					</div>
					<div>
						<div className="font-display text-xs font-700 text-ink-primary mb-1">
							Gestión de Delivery
						</div>
						<p className="font-body text-xs text-ink-tertiary leading-relaxed">
							Las órdenes de delivery se sincronizan con cocina y barra en
							tiempo real. Avanzá el estado de cada pedido para mantener al
							repartidor y al cliente informados. Los pedidos urgentes (&gt;30
							min) se marcan en rojo automáticamente.
						</p>
					</div>
				</div>
			</div>

			{showModal && <NewOrderModal onClose={() => setShowModal(false)} />}
		</div>
	);
}
