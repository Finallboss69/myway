"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
import {
	CheckCircle,
	Clock,
	Circle,
	Bell,
	UtensilsCrossed,
	ShoppingCart,
	Truck,
	RefreshCw,
} from "lucide-react";
import { formatCurrency, formatTime } from "@/lib/utils";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
type StepStatus = "done" | "current" | "pending";

interface OrderItem {
	id: string;
	name: string;
	qty: number;
	price: number;
	status: ItemStatus;
	target: "bar" | "kitchen";
}

interface Order {
	id: string;
	tableId: string;
	status: string;
	createdAt: string;
	items: OrderItem[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
	ItemStatus,
	{ label: string; color: string; bg: string; border: string }
> = {
	pending: {
		label: "Pendiente",
		color: "#fbbf24",
		bg: "rgba(245,158,11,0.1)",
		border: "rgba(245,158,11,0.25)",
	},
	preparing: {
		label: "Preparando",
		color: "#60a5fa",
		bg: "rgba(59,130,246,0.1)",
		border: "rgba(59,130,246,0.25)",
	},
	ready: {
		label: "Listo",
		color: "#34d399",
		bg: "rgba(16,185,129,0.1)",
		border: "rgba(16,185,129,0.25)",
	},
	delivered: {
		label: "Entregado",
		color: "#6b7280",
		bg: "rgba(107,114,128,0.1)",
		border: "rgba(107,114,128,0.2)",
	},
	cancelled: {
		label: "Cancelado",
		color: "#f87171",
		bg: "rgba(239,68,68,0.1)",
		border: "rgba(239,68,68,0.2)",
	},
};

// ─── Step icon ────────────────────────────────────────────────────────────────

function StepIcon({ status }: { status: StepStatus }) {
	if (status === "done") {
		return (
			<div
				className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
				style={{
					background: "rgba(16,185,129,0.15)",
					border: "1px solid rgba(16,185,129,0.4)",
					boxShadow: "0 0 10px rgba(16,185,129,0.15)",
				}}
			>
				<CheckCircle size={15} style={{ color: "#10b981" }} />
			</div>
		);
	}
	if (status === "current") {
		return (
			<div
				className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
				style={{
					background: "rgba(245,158,11,0.15)",
					border: "2px solid rgba(245,158,11,0.55)",
					boxShadow: "0 0 14px rgba(245,158,11,0.22)",
				}}
			>
				<Clock size={14} className="text-brand-500 animate-pulse" />
			</div>
		);
	}
	return (
		<div
			className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
			style={{ background: "#161616", border: "1px solid #272727" }}
		>
			<Circle size={12} style={{ color: "#404040" }} />
		</div>
	);
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────

function BottomNav({ tableId }: { tableId: string }) {
	return (
		<nav className="mobile-nav">
			<Link
				href={`/customer/menu?tableId=${tableId}`}
				className="mobile-nav-item"
			>
				<UtensilsCrossed size={20} />
				<span>Menú</span>
			</Link>
			<Link
				href={`/customer/menu/cart?tableId=${tableId}`}
				className="mobile-nav-item"
			>
				<ShoppingCart size={20} />
				<span>Mi pedido</span>
			</Link>
			<Link
				href={`/customer/order-status?tableId=${tableId}`}
				className="mobile-nav-item active"
			>
				<Clock size={20} />
				<span>Estado</span>
			</Link>
			<Link href="/customer/delivery" className="mobile-nav-item">
				<Truck size={20} />
				<span>Delivery</span>
			</Link>
		</nav>
	);
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
	const allItems = order.items;
	const hasItems = allItems.length > 0;

	const anyPreparing = allItems.some((i) => i.status === "preparing");
	const anyReady = allItems.some((i) => i.status === "ready");
	const allDelivered =
		hasItems &&
		allItems.every((i) => i.status === "delivered" || i.status === "cancelled");

	const getStep1Status = (): StepStatus => (hasItems ? "done" : "current");
	const getStep2Status = (): StepStatus => {
		if (!hasItems) return "pending";
		if (anyPreparing || anyReady || allDelivered) return "done";
		return "current";
	};
	const getStep3Status = (): StepStatus => {
		if (!hasItems) return "pending";
		if (allDelivered) return "done";
		if (anyReady) return "current";
		return "pending";
	};
	const getStep4Status = (): StepStatus => {
		if (allDelivered) return "current";
		return "pending";
	};

	const receivedTime = formatTime(order.createdAt);
	const preparingTime =
		anyPreparing || anyReady || allDelivered
			? formatTime(
					new Date(
						new Date(order.createdAt).getTime() + 2 * 60000,
					).toISOString(),
				)
			: null;

	const steps = [
		{ label: "Pedido recibido", time: receivedTime, status: getStep1Status() },
		{ label: "En preparación", time: preparingTime, status: getStep2Status() },
		{ label: "Listo para servir", time: null, status: getStep3Status() },
		{ label: "Entregado", time: null, status: getStep4Status() },
	];

	const totalAmount = allItems.reduce((s, i) => s + i.price * i.qty, 0);

	const statusOrder: Record<string, number> = {
		ready: 0,
		preparing: 1,
		pending: 2,
		delivered: 3,
		cancelled: 4,
	};
	const sortedItems = [...allItems].sort(
		(a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5),
	);

	const orderBorderColor = allDelivered
		? "border-l-[#6b7280]"
		: anyReady
			? "border-l-emerald-500"
			: anyPreparing
				? "border-l-blue-500"
				: "border-l-amber-500";

	return (
		<div
			className={clsx(
				"card rounded-2xl overflow-hidden border-l-4 animate-slide-up",
				orderBorderColor,
			)}
		>
			{/* Order header */}
			<div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-surface-3">
				<div>
					<p className="font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest">
						Orden
					</p>
					<p className="font-kds text-brand-500 text-xl leading-none tracking-wide mt-0.5">
						#{order.id.slice(0, 8).toUpperCase()}
					</p>
				</div>
				<div className="text-right">
					<p className="font-body text-ink-tertiary text-[11px]">Recibido</p>
					<p className="font-display font-medium text-ink-secondary text-[13px]">
						{formatTime(order.createdAt)}
					</p>
				</div>
			</div>

			{/* Progress stepper */}
			<div className="px-4 pt-4 pb-2">
				<h3 className="font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest mb-3">
					Progreso
				</h3>
				<div className="space-y-0">
					{steps.map((step, idx) => (
						<div key={step.label} className="flex gap-3">
							<div className="flex flex-col items-center">
								<StepIcon status={step.status} />
								{idx < steps.length - 1 && (
									<div
										className="w-[2px] flex-1 my-1"
										style={{
											minHeight: "20px",
											background:
												step.status === "done"
													? "rgba(16,185,129,0.3)"
													: "#1e1e1e",
										}}
									/>
								)}
							</div>
							<div
								className="pb-4 flex-1 flex items-start justify-between gap-2"
								style={{ paddingTop: "6px" }}
							>
								<p
									className="font-body text-[13px] leading-tight"
									style={{
										color:
											step.status === "done"
												? "#f5f5f5"
												: step.status === "current"
													? "#f59e0b"
													: "#404040",
										fontWeight: step.status === "current" ? 600 : 400,
									}}
								>
									{step.label}
								</p>
								{step.time ? (
									<span className="font-body text-ink-tertiary text-[11px] shrink-0">
										{step.time}
									</span>
								) : step.status === "current" ? (
									<span className="font-body text-brand-500 text-[11px] shrink-0 animate-pulse">
										esperando…
									</span>
								) : null}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Items */}
			<div className="border-t border-surface-3">
				{sortedItems.map((item, idx) => {
					const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
					const isReady = item.status === "ready";

					return (
						<div key={item.id}>
							<div
								className="px-4 py-3 flex items-center justify-between gap-3"
								style={isReady ? { background: "rgba(16,185,129,0.04)" } : {}}
							>
								<div className="flex items-center gap-3 min-w-0">
									<span
										className="font-kds text-ink-secondary shrink-0"
										style={{ fontSize: "17px", lineHeight: 1 }}
									>
										{item.qty}×
									</span>
									<div className="min-w-0">
										<p className="font-display text-ink-primary text-[13px] font-bold uppercase truncate">
											{item.name}
										</p>
										<p className="font-body text-ink-tertiary text-[11px]">
											{formatCurrency(item.price * item.qty)}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<span
										className="w-1.5 h-1.5 rounded-full"
										style={{
											background: cfg.color,
											boxShadow:
												item.status !== "delivered" &&
												item.status !== "cancelled"
													? `0 0 5px ${cfg.color}`
													: "none",
										}}
									/>
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
								</div>
							</div>
							{idx < sortedItems.length - 1 && <div className="divider mx-4" />}
						</div>
					);
				})}

				{/* Total */}
				<div
					className="px-4 py-3 flex items-center justify-between"
					style={{ background: "#0c0c0c", borderTop: "1px solid #1e1e1e" }}
				>
					<span className="font-body text-ink-secondary text-[13px]">
						Total acumulado
					</span>
					<span
						className="font-kds text-brand-500"
						style={{ fontSize: "22px", lineHeight: 1 }}
					>
						{formatCurrency(totalAmount)}
					</span>
				</div>
			</div>
		</div>
	);
}

// ─── Inner content ────────────────────────────────────────────────────────────

function OrderStatusContent() {
	const searchParams = useSearchParams();
	const tableId = searchParams.get("tableId") ?? "t2";

	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	const fetchOrders = useCallback(async () => {
		try {
			const res = await fetch(`/api/orders?tableId=${tableId}`);
			if (!res.ok) throw new Error("Error al cargar los pedidos");
			const data = (await res.json()) as Order[];
			const active = data.filter(
				(o) => o.status !== "closed" && o.status !== "cancelled",
			);
			setOrders(active);
			setLastUpdated(new Date());
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error desconocido");
		} finally {
			setLoading(false);
		}
	}, [tableId]);

	useEffect(() => {
		fetchOrders();
		const interval = setInterval(fetchOrders, 10000);
		return () => clearInterval(interval);
	}, [fetchOrders]);

	const hasOrders = orders.length > 0;
	const allActiveItems = orders.flatMap((o) => o.items);
	const readyCount = allActiveItems.filter((i) => i.status === "ready").length;

	return (
		<div className="min-h-screen bg-surface-0 pb-24 relative">
			{/* Noise */}
			<div
				className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
				aria-hidden
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
					mixBlendMode: "overlay",
				}}
			/>

			{/* ── Header ── */}
			<div
				className="border-b border-surface-3 relative overflow-hidden"
				style={{
					background: "linear-gradient(180deg, #100900 0%, #080808 100%)",
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

				<div className="max-w-md mx-auto px-5 pt-6 pb-5 relative z-10">
					<div className="flex items-start justify-between">
						<div>
							<p
								className="font-kds text-brand-500 tracking-[0.2em] mb-1"
								style={{ fontSize: "18px" }}
							>
								MY WAY
							</p>
							<h1 className="font-display font-bold text-ink-primary text-[18px] tracking-wide">
								Estado del pedido
							</h1>
							<p className="font-body text-ink-tertiary text-[12px] mt-1">
								Mesa {tableId.replace("t", "")}
							</p>
						</div>

						{/* Live indicator + refresh */}
						<div className="flex flex-col items-end gap-2 pt-1">
							<div className="flex items-center gap-1.5">
								<span
									className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
									style={{ boxShadow: "0 0 4px #10b981" }}
								/>
								<span className="font-body text-[10px] text-ink-tertiary">
									En vivo
								</span>
							</div>
							{lastUpdated && (
								<button
									onClick={fetchOrders}
									className="flex items-center gap-1 text-[10px] font-body text-ink-tertiary hover:text-ink-secondary transition-colors"
								>
									<RefreshCw size={10} />
									Actualizar
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-md mx-auto px-4 mt-5 space-y-4 animate-fade-in relative z-10">
				{/* ── Loading ── */}
				{loading && (
					<div className="flex items-center justify-center py-16">
						<div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
					</div>
				)}

				{/* ── Error ── */}
				{!loading && error && (
					<div className="card rounded-2xl p-8 text-center">
						<p className="font-display font-bold text-ink-secondary uppercase tracking-wide mb-2">
							Error
						</p>
						<p className="font-body text-ink-tertiary text-[13px] mb-5">
							{error}
						</p>
						<button onClick={fetchOrders} className="btn-primary rounded-xl">
							Reintentar
						</button>
					</div>
				)}

				{/* ── Ready alert banner ── */}
				{!loading && readyCount > 0 && (
					<div
						className="flex items-center gap-3 rounded-xl px-4 py-3.5 animate-pulse-glow"
						style={{
							background: "rgba(16,185,129,0.1)",
							border: "1px solid rgba(16,185,129,0.3)",
							boxShadow: "0 0 20px rgba(16,185,129,0.12)",
						}}
					>
						<CheckCircle
							size={18}
							style={{ color: "#10b981" }}
							className="shrink-0"
						/>
						<div>
							<p className="font-display font-bold text-emerald-400 text-[13px] uppercase tracking-wide">
								{readyCount === 1
									? "¡Un ítem listo para servir!"
									: `¡${readyCount} ítems listos para servir!`}
							</p>
							<p className="font-body text-emerald-400/70 text-[11px]">
								Llamá al mozo para que lo traiga
							</p>
						</div>
					</div>
				)}

				{/* ── No orders ── */}
				{!loading && !error && !hasOrders && (
					<div className="card rounded-2xl p-10 text-center mt-4">
						<Clock size={36} className="text-ink-tertiary mx-auto mb-4" />
						<p className="font-display font-bold text-ink-secondary uppercase tracking-wide mb-1">
							Sin pedidos activos
						</p>
						<p className="font-body text-ink-tertiary text-[13px] mb-6">
							Tu mesa no tiene pedidos en curso
						</p>
						<Link href={`/customer/menu?tableId=${tableId}`}>
							<button className="btn-primary rounded-xl">Ver el menú</button>
						</Link>
					</div>
				)}

				{/* ── Orders list ── */}
				{!loading &&
					!error &&
					orders.map((order) => <OrderCard key={order.id} order={order} />)}

				{/* ── Actions ── */}
				{!loading && hasOrders && (
					<div className="flex gap-3">
						<Link href={`/customer/menu?tableId=${tableId}`} className="flex-1">
							<button className="btn-primary w-full justify-center rounded-xl py-3.5 text-[13px]">
								Pedir más
							</button>
						</Link>
						<button className="btn-secondary flex-1 justify-center rounded-xl py-3.5 text-[13px]">
							<Bell size={14} />
							Llamar mozo
						</button>
					</div>
				)}

				{/* ── Support note ── */}
				<div
					className="rounded-xl px-4 py-3 flex items-center gap-2"
					style={{ background: "#0f0f0f", border: "1px solid #1e1e1e" }}
				>
					<Bell size={13} className="text-ink-tertiary shrink-0" />
					<p className="font-body text-ink-tertiary text-[12px]">
						¿Necesitás ayuda?{" "}
						<span className="text-ink-secondary font-medium">
							Llamá al mozo o acercate a la barra
						</span>
					</p>
				</div>

				<p className="text-center font-body text-ink-tertiary text-[11px] pb-4">
					<RefreshCw size={10} className="inline mr-1" />
					Actualiza automáticamente cada 10 segundos
				</p>
			</div>

			{/* ── Bottom nav ── */}
			<BottomNav tableId={tableId} />
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrderStatusPage() {
	return (
		<>
			<Suspense
				fallback={
					<div className="min-h-screen bg-surface-0 flex items-center justify-center">
						<div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
					</div>
				}
			>
				<OrderStatusContent />
			</Suspense>
			<HelpButton {...helpContent.customerOrderStatus} variant="float" />
		</>
	);
}
