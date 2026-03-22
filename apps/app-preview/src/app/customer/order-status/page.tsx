"use client";

import Link from "next/link";
import {
	CheckCircle,
	Clock,
	Circle,
	Bell,
	UtensilsCrossed,
} from "lucide-react";
import { VENUE, formatCurrency, formatTime } from "@/data/mock";
import { useAppStore } from "@/store/useAppStore";
import type { ItemStatus } from "@/store/useAppStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE_ID = "t2";

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

function StepIcon({ status }: { status: "done" | "current" | "pending" }) {
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
				<CheckCircle size={15} className="text-pool-500" />
			</div>
		);
	}
	if (status === "current") {
		return (
			<div
				className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 animate-pulse-slow"
				style={{
					background: "rgba(245,158,11,0.15)",
					border: "2px solid rgba(245,158,11,0.55)",
					boxShadow: "0 0 14px rgba(245,158,11,0.22)",
				}}
			>
				<Clock size={14} className="text-brand-500" />
			</div>
		);
	}
	return (
		<div
			className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
			style={{ background: "#161616", border: "1px solid #272727" }}
		>
			<Circle size={12} className="text-ink-disabled" />
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
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="8" cy="21" r="1" />
						<circle cx="19" cy="21" r="1" />
						<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
					</svg>
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
			<Link href="/customer/order-status" className="mobile-nav-item active">
				<Clock size={20} />
				<span>Estado</span>
			</Link>
			<Link href="/customer/delivery" className="mobile-nav-item">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
					<polyline points="12,17 16,17 22,14 22,20 16,20 12,20" />
					<circle cx="7" cy="20" r="1.5" />
					<circle cx="17" cy="20" r="1.5" />
					<line x1="16" y1="8" x2="22" y2="8" />
					<line x1="19" y1="5" x2="22" y2="8" />
				</svg>
				<span>Delivery</span>
			</Link>
		</nav>
	);
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function OrderStatusPage() {
	const allOrders = useAppStore((s) => s.orders);
	const orders = allOrders.filter(o => o.tableId === TABLE_ID && o.status !== "closed");

	// Derive stepper state from real orders
	const hasOrders = orders.length > 0;
	const anyPreparing = orders.some((o) =>
		o.items.some((i) => i.status === "preparing"),
	);
	const anyReady = orders.some((o) =>
		o.items.some((i) => i.status === "ready"),
	);
	const allDelivered =
		hasOrders &&
		orders.every((o) =>
			o.items.every(
				(i) => i.status === "delivered" || i.status === "cancelled",
			),
		);

	type StepStatus = "done" | "current" | "pending";

	const getStep1Status = (): StepStatus => (hasOrders ? "done" : "current");
	const getStep2Status = (): StepStatus => {
		if (!hasOrders) return "pending";
		if (anyPreparing || anyReady || allDelivered) return "done";
		return "current";
	};
	const getStep3Status = (): StepStatus => {
		if (!hasOrders) return "pending";
		if (allDelivered) return "done";
		if (anyReady) return "current";
		return "pending";
	};
	const getStep4Status = (): StepStatus => {
		if (allDelivered) return "current";
		return "pending";
	};

	const firstOrder = orders[0];
	const receivedTime = firstOrder ? formatTime(firstOrder.createdAt) : null;
	const preparingTime =
		firstOrder && (anyPreparing || anyReady || allDelivered)
			? formatTime(new Date(firstOrder.createdAt.getTime() + 2 * 60000))
			: null;

	const steps = [
		{
			label: "Pedido recibido",
			time: receivedTime,
			status: getStep1Status(),
		},
		{
			label: "En preparación",
			time: preparingTime,
			status: getStep2Status(),
		},
		{
			label: "Listo para servir",
			time: null,
			status: getStep3Status(),
		},
		{
			label: "Entregado",
			time: null,
			status: getStep4Status(),
		},
	];

	// All items across all orders for t2
	const allItems = orders.flatMap((o) => o.items);
	const totalAmount = allItems.reduce((s, i) => s + i.price * i.qty, 0);

	// Sort: ready first, then preparing, then pending, then delivered
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

				<div className="max-w-md mx-auto px-5 pt-6 pb-5 text-center relative z-10">
					<p
						className="font-kds text-brand-500 tracking-[0.2em] mb-1"
						style={{ fontSize: "20px" }}
					>
						{VENUE.name.toUpperCase()}
					</p>
					<h1 className="font-display font-bold text-ink-primary text-[18px] tracking-wide">
						Estado de tu pedido
					</h1>
					{firstOrder && (
						<p className="font-body text-ink-tertiary text-[12px] mt-1">
							Mesa {firstOrder.tableNumber} · Orden #
							{firstOrder.id.toUpperCase()}
						</p>
					)}
				</div>
			</div>

			<div className="max-w-md mx-auto px-4 mt-5 space-y-4 animate-fade-in relative z-10">
				{/* ── No orders state ────────────────────────────────────────── */}
				{!hasOrders && (
					<div className="card rounded-2xl p-8 text-center">
						<Clock size={32} className="text-ink-tertiary mx-auto mb-3" />
						<p className="font-display font-bold text-ink-secondary uppercase tracking-wide mb-1">
							Sin pedidos activos
						</p>
						<p className="font-body text-ink-tertiary text-[13px] mb-5">
							Tu mesa no tiene pedidos en curso
						</p>
						<Link href="/customer/menu">
							<button className="btn-primary rounded-xl">Ver el menú</button>
						</Link>
					</div>
				)}

				{/* ── Estimated time banner ──────────────────────────────────── */}
				{hasOrders && (
					<div
						className="flex items-center justify-center gap-2 rounded-xl py-3"
						style={{
							background: "rgba(16,185,129,0.08)",
							border: "1px solid rgba(16,185,129,0.2)",
						}}
					>
						<Clock size={15} className="text-pool-500" />
						<span className="font-display font-bold text-pool-500 text-[13px] tracking-wide uppercase">
							Tiempo estimado: ~10 minutos
						</span>
					</div>
				)}

				{/* ── Progress stepper ──────────────────────────────────────── */}
				{hasOrders && (
					<div className="card rounded-2xl p-5">
						<h2 className="font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest mb-4">
							Progreso del pedido
						</h2>

						<div className="space-y-0">
							{steps.map((step, idx) => (
								<div key={step.label} className="flex gap-3">
									{/* Icon + connector line */}
									<div className="flex flex-col items-center">
										<StepIcon status={step.status} />
										{idx < steps.length - 1 && (
											<div
												className="w-[2px] flex-1 my-1"
												style={{
													minHeight: "24px",
													background:
														step.status === "done"
															? "rgba(16,185,129,0.3)"
															: "#1e1e1e",
												}}
											/>
										)}
									</div>

									{/* Content */}
									<div
										className="pb-5 flex-1 flex items-start justify-between gap-2"
										style={{ paddingTop: "6px" }}
									>
										<p
											className="font-body text-[14px] leading-tight"
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
											<span className="font-body text-ink-tertiary text-[12px] shrink-0">
												{step.time}
											</span>
										) : step.status === "current" ? (
											<span className="font-body text-brand-500 text-[11px] shrink-0 animate-pulse-slow">
												esperando…
											</span>
										) : null}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* ── Items with individual status ───────────────────────────── */}
				{hasOrders && sortedItems.length > 0 && (
					<div className="card rounded-2xl overflow-hidden">
						<div className="px-4 pt-4 pb-2">
							<h2 className="font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest">
								Ítems del pedido
							</h2>
						</div>

						{sortedItems.map((item, idx) => {
							const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
							const isReady = item.status === "ready";

							return (
								<div key={item.id}>
									<div
										className="px-4 py-3 flex items-center justify-between gap-3"
										style={
											isReady
												? {
														background: "rgba(16,185,129,0.05)",
													}
												: {}
										}
									>
										<div className="flex items-center gap-3 min-w-0">
											<span
												className="font-kds text-ink-secondary shrink-0"
												style={{ fontSize: "18px", lineHeight: 1 }}
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
									{idx < sortedItems.length - 1 && (
										<div className="divider mx-4" />
									)}
								</div>
							);
						})}

						{/* Total row */}
						<div
							className="px-4 py-3 flex items-center justify-between border-t border-surface-3"
							style={{ background: "#0c0c0c" }}
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
				)}

				{/* ── Actions ────────────────────────────────────────────────── */}
				{hasOrders && (
					<div className="flex gap-3">
						<Link href="/customer/menu" className="flex-1">
							<button className="btn-primary w-full justify-center rounded-xl py-3.5 text-[13px]">
								Pedir más
							</button>
						</Link>
						<button className="btn-secondary flex-1 justify-center rounded-xl py-3.5 text-[13px]">
							<Bell size={14} />
							Llamar mozo 🔔
						</button>
					</div>
				)}

				{/* ── Support note ───────────────────────────────────────────── */}
				<div
					className="rounded-xl px-4 py-3 flex items-center gap-2"
					style={{ background: "#0f0f0f", border: "1px solid #1e1e1e" }}
				>
					<Bell size={13} className="text-ink-tertiary shrink-0" />
					<p className="font-body text-ink-tertiary text-[12px]">
						¿Necesitás ayuda?{" "}
						<span className="text-ink-secondary font-medium">
							Llama al mozo 🔔
						</span>
					</p>
				</div>

				<p className="text-center font-body text-ink-tertiary text-[11px]">
					🔄 Estado en tiempo real
				</p>
			</div>

			{/* ── Bottom nav ─────────────────────────────────────────────────── */}
			<BottomNav />
		</div>
	);
}
