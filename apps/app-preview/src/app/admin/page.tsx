"use client";

import { useState, useEffect, useCallback } from "react";
import {
	TrendingUp,
	TrendingDown,
	ShoppingBag,
	DollarSign,
	Grid3X3,
	AlertTriangle,
	RefreshCw,
	Clock,
	ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ANALYTICS, formatCurrency } from "@/data/mock";
import { useLiveClock } from "@/hooks/useLiveClock";

// ─── Top bar ─────────────────────────────────────────────────────────────────

function TopBar({ onRefresh }: { onRefresh: () => void }) {
	const { time, date } = useLiveClock();

	return (
		<div className="flex items-center justify-between px-8 py-5 border-b border-surface-3 bg-surface-1/60 backdrop-blur-sm sticky top-0 z-10">
			<div>
				<h1 className="font-display text-xl font-700 text-ink-primary tracking-tight">
					Dashboard
				</h1>
				<p className="font-body text-xs text-ink-tertiary mt-0.5 capitalize">
					{date}
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
					onClick={onRefresh}
					className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5"
				>
					<RefreshCw size={13} />
					Actualizar
				</button>
			</div>
		</div>
	);
}

// ─── KPI Stat Card ────────────────────────────────────────────────────────────

function StatCard({
	label,
	value,
	delta,
	deltaLabel,
	icon: Icon,
	iconBg,
	iconColor,
	accent = false,
}: {
	label: string;
	value: string;
	delta?: number;
	deltaLabel?: string;
	icon: React.ElementType;
	iconBg: string;
	iconColor: string;
	accent?: boolean;
}) {
	const positive = delta !== undefined && delta >= 0;

	return (
		<div
			className={[
				"stat-card relative overflow-hidden",
				accent ? "border-brand-500/25 shadow-gold-sm" : "",
			].join(" ")}
		>
			{accent && (
				<div className="absolute inset-0 bg-gold-glow opacity-60 pointer-events-none" />
			)}
			<div className="relative z-10">
				<div className="flex items-center justify-between mb-4">
					<span className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest">
						{label}
					</span>
					<div
						className={[
							"w-8 h-8 rounded-lg flex items-center justify-center",
							iconBg,
						].join(" ")}
					>
						<Icon size={14} className={iconColor} />
					</div>
				</div>
				<div
					className={[
						"font-kds leading-none mb-2",
						accent ? "text-brand-500 text-5xl" : "text-ink-primary text-4xl",
					].join(" ")}
				>
					{value}
				</div>
				{delta !== undefined && (
					<div
						className={[
							"flex items-center gap-1 text-[11px] font-display font-600",
							positive ? "text-pool-500" : "text-status-cancelled",
						].join(" ")}
					>
						{positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
						<span>
							{positive ? "+" : ""}
							{delta}% {deltaLabel}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Revenue by hour chart ────────────────────────────────────────────────────

function RevenueByHourChart({ todayRevenue }: { todayRevenue: number }) {
	const data = ANALYTICS.today.revenueByHour;
	const max = Math.max(...data.map((d) => d.value));
	const { time } = useLiveClock();
	const currentHour = time.split(":")[0] + ":00";

	return (
		<div className="card p-6">
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Ingresos por hora
					</h3>
					<p className="font-body text-xs text-ink-tertiary mt-0.5">
						Hoy — rango operativo 18:00 – 02:00
					</p>
				</div>
				<div className="flex items-center gap-4">
					<div className="text-right">
						<div className="font-kds text-2xl text-brand-500 leading-none">
							{formatCurrency(todayRevenue)}
						</div>
						<div className="font-body text-[10px] text-ink-tertiary">
							total hoy
						</div>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="w-2 h-2 rounded-full bg-brand-500" />
						<span className="font-body text-[10px] text-ink-tertiary">
							Hora actual
						</span>
					</div>
				</div>
			</div>

			{/* Chart */}
			<div className="flex items-end gap-2 h-[160px]">
				{data.map((d) => {
					const heightPct = (d.value / max) * 100;
					const isCurrent = d.hour === currentHour;
					return (
						<div
							key={d.hour}
							className="flex-1 flex flex-col items-center gap-1.5"
						>
							<div
								className="w-full flex items-end"
								style={{ height: "120px" }}
							>
								<div
									className={[
										"w-full rounded-t-md transition-all duration-500 relative",
										isCurrent
											? "bg-brand-500 shadow-gold-sm"
											: "bg-surface-4 hover:bg-surface-5",
									].join(" ")}
									style={{ height: `${heightPct}%` }}
								>
									{isCurrent && (
										<div className="absolute inset-0 bg-brand-500/30 rounded-t-md blur-sm" />
									)}
								</div>
							</div>
							<span
								className={[
									"font-body text-[10px] whitespace-nowrap",
									isCurrent ? "text-brand-500 font-600" : "text-ink-tertiary",
								].join(" ")}
								suppressHydrationWarning
							>
								{d.hour}
							</span>
						</div>
					);
				})}
			</div>

			<div className="mt-4 pt-4 border-t border-surface-3 flex items-center justify-between">
				<span className="font-body text-xs text-ink-tertiary">
					Pico: <span className="text-ink-secondary font-500">22:00 hs</span>
				</span>
				<span className="font-body text-xs text-ink-tertiary">
					Máx hora:{" "}
					<span className="text-brand-500 font-500">{formatCurrency(max)}</span>
				</span>
			</div>
		</div>
	);
}

// ─── Active orders ────────────────────────────────────────────────────────────

function ActiveOrders({
	orders,
}: {
	orders: ReturnType<typeof useAppStore.getState>["orders"];
}) {
	const [mounted, setMounted] = useState(false);
	const [tick, setTick] = useState(0);

	useEffect(() => {
		setMounted(true);
		const interval = setInterval(() => setTick((t) => t + 1), 30000);
		return () => clearInterval(interval);
	}, []);

	const statusColor: Record<string, string> = {
		pending: "text-status-pending",
		preparing: "text-status-preparing",
		ready: "text-pool-500",
		closed: "text-ink-tertiary",
	};
	const statusLabel: Record<string, string> = {
		pending: "Pendiente",
		preparing: "Preparando",
		ready: "Listo",
		closed: "Cerrado",
	};

	const activeOrders = orders.filter(
		(o) => o.status !== "closed" && o.status !== "cancelled",
	);

	return (
		<div className="card p-6 flex flex-col">
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Pedidos activos
					</h3>
					<p className="font-body text-xs text-ink-tertiary mt-0.5">
						En curso ahora mismo
					</p>
				</div>
				<span className="font-kds text-3xl text-brand-500 leading-none">
					{activeOrders.length}
				</span>
			</div>

			<div className="space-y-2 flex-1" key={tick}>
				{activeOrders.length === 0 && (
					<div className="text-center py-8 text-ink-tertiary font-body text-sm">
						Sin pedidos activos
					</div>
				)}
				{activeOrders.map((order) => {
					const elapsed = mounted
						? Math.floor((Date.now() - order.createdAt.getTime()) / 60000)
						: 0;
					const isUrgent = mounted && elapsed >= 10;
					const total = order.items.reduce((s, i) => s + i.price * i.qty, 0);
					return (
						<div
							key={order.id}
							className={[
								"flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors",
								isUrgent
									? "bg-status-cancelled/5 border-status-cancelled/20"
									: "bg-surface-2 border-surface-3 hover:border-surface-4",
							].join(" ")}
						>
							<div
								className={[
									"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
									isUrgent ? "bg-status-cancelled/15" : "bg-surface-3",
								].join(" ")}
							>
								<span
									className={[
										"font-kds text-base leading-none",
										isUrgent ? "text-status-cancelled" : "text-ink-secondary",
									].join(" ")}
								>
									{order.tableNumber}
								</span>
							</div>
							<div className="flex-1 min-w-0">
								<div className="font-display text-xs font-600 text-ink-primary">
									Mesa {order.tableNumber}
								</div>
								<div className="font-body text-[10px] text-ink-tertiary">
									{order.items.length} item
									{order.items.length !== 1 ? "s" : ""} ·{" "}
									{order.waiterName ? order.waiterName.split(" ")[0] : "–"}
								</div>
							</div>
							<div className="text-right flex-shrink-0">
								<div
									className={[
										"font-display text-[10px] font-700 uppercase tracking-wider",
										statusColor[order.status] ?? "text-ink-tertiary",
									].join(" ")}
								>
									{statusLabel[order.status] ?? order.status}
								</div>
								<div className="flex items-center gap-1 justify-end mt-0.5">
									<span className="font-mono text-[10px] text-ink-tertiary">
										{formatCurrency(total)}
									</span>
									<span
										className={[
											"font-mono text-[10px]",
											isUrgent ? "text-status-cancelled" : "text-ink-tertiary",
										].join(" ")}
										suppressHydrationWarning
									>
										· {elapsed}m
									</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="mt-4 pt-4 border-t border-surface-3 flex items-center justify-between">
				<span className="font-body text-xs text-ink-tertiary">
					<span
						className="text-status-cancelled font-600"
						suppressHydrationWarning
					>
						{mounted
							? activeOrders.filter((o) => {
									const el = Math.floor(
										(Date.now() - o.createdAt.getTime()) / 60000,
									);
									return el >= 10;
								}).length
							: 0}
					</span>{" "}
					urgentes
				</span>
				<a
					href="/pos/orders"
					className="flex items-center gap-1 font-display text-[10px] font-600 text-ink-tertiary hover:text-brand-500 transition-colors uppercase tracking-wide"
				>
					Ver todos <ChevronRight size={11} />
				</a>
			</div>
		</div>
	);
}

// ─── Tables map ───────────────────────────────────────────────────────────────

function TablesMap({
	tables,
}: {
	tables: ReturnType<typeof useAppStore.getState>["tables"];
}) {
	const occupied = tables.filter((t) => t.status === "occupied").length;
	const reserved = tables.filter((t) => t.status === "reserved").length;
	const available = tables.filter((t) => t.status === "available").length;

	const statusStyle: Record<string, string> = {
		available: "bg-pool-500/15 border-pool-500/35 text-pool-500",
		occupied:
			"bg-status-occupied/15 border-status-occupied/35 text-status-occupied",
		reserved:
			"bg-status-reserved/15 border-status-reserved/35 text-status-reserved",
	};

	return (
		<div className="card p-6 flex flex-col">
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Mapa de mesas
					</h3>
					<p className="font-body text-xs text-ink-tertiary mt-0.5">
						Estado en tiempo real
					</p>
				</div>
				<span className="font-body text-xs text-ink-tertiary">
					<span className="text-status-occupied font-600">{occupied}</span>
					<span className="text-ink-tertiary">/{tables.length}</span> ocupadas
				</span>
			</div>

			<div className="grid grid-cols-6 gap-2 flex-1">
				{tables.map((table) => (
					<div
						key={table.id}
						className={[
							"aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition-all",
							statusStyle[table.status] ??
								"bg-surface-2 border-surface-4 text-ink-tertiary",
						].join(" ")}
					>
						<span className="font-kds text-lg leading-none">
							{table.number}
						</span>
						{table.type === "pool" && (
							<span className="text-[7px] font-display font-700 opacity-60 uppercase tracking-wider">
								POOL
							</span>
						)}
					</div>
				))}
			</div>

			<div className="flex items-center gap-5 mt-4 pt-4 border-t border-surface-3">
				{[
					{
						label: "Libre",
						count: available,
						cls: "bg-pool-500",
					},
					{
						label: "Ocupada",
						count: occupied,
						cls: "bg-status-occupied",
					},
					{
						label: "Reservada",
						count: reserved,
						cls: "bg-status-reserved",
					},
				].map(({ label, count, cls }) => (
					<div key={label} className="flex items-center gap-1.5">
						<div className={`w-2 h-2 rounded-full ${cls}`} />
						<span className="font-body text-[10px] text-ink-tertiary">
							<span className="font-600 text-ink-secondary">{count}</span>{" "}
							{label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Payment methods bar ──────────────────────────────────────────────────────

function PaymentMethodsBar() {
	const methods = ANALYTICS.today.paymentMethods;

	const COLORS = [
		{
			bar: "bg-brand-500",
			text: "text-brand-500",
			dot: "bg-brand-500",
		},
		{
			bar: "bg-blue-500",
			text: "text-blue-400",
			dot: "bg-blue-500",
		},
		{
			bar: "bg-purple-500",
			text: "text-purple-400",
			dot: "bg-purple-500",
		},
	];

	return (
		<div className="card p-6">
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Métodos de pago
					</h3>
					<p className="font-body text-xs text-ink-tertiary mt-0.5">
						Distribución de hoy
					</p>
				</div>
				<span className="font-kds text-2xl text-brand-500 leading-none">
					{formatCurrency(methods.reduce((s, m) => s + m.amount, 0))}
				</span>
			</div>

			{/* Segmented bar */}
			<div className="flex h-3 rounded-full overflow-hidden gap-px mb-5">
				{methods.map((m, i) => (
					<div
						key={m.method}
						className={[
							COLORS[i].bar,
							"first:rounded-l-full last:rounded-r-full",
						].join(" ")}
						style={{ width: `${m.pct}%` }}
					/>
				))}
			</div>

			{/* Legend */}
			<div className="space-y-3">
				{methods.map((m, i) => (
					<div key={m.method} className="flex items-center gap-3">
						<div
							className={[
								"w-2.5 h-2.5 rounded-full flex-shrink-0",
								COLORS[i].dot,
							].join(" ")}
						/>
						<span className="font-body text-sm text-ink-secondary flex-1">
							{m.method}
						</span>
						<span
							className={["font-display text-sm font-700", COLORS[i].text].join(
								" ",
							)}
						>
							{m.pct}%
						</span>
						<span className="font-mono text-xs text-ink-tertiary w-24 text-right">
							{formatCurrency(m.amount)}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Stock alerts ─────────────────────────────────────────────────────────────

function StockAlerts() {
	const ingredients = useAppStore((s) => s.ingredients);
	const lowStock = ingredients.filter(
		(ing) => ing.stockCurrent < ing.alertThreshold,
	);

	if (lowStock.length === 0) {
		return (
			<div className="card p-6 flex flex-col items-center justify-center gap-3 text-center">
				<div className="w-10 h-10 rounded-xl bg-pool-500/10 border border-pool-500/20 flex items-center justify-center">
					<span className="text-xl">✓</span>
				</div>
				<div>
					<div className="font-display text-sm font-600 text-ink-primary">
						Stock en orden
					</div>
					<div className="font-body text-xs text-ink-tertiary mt-0.5">
						Todos los ingredientes por encima del umbral
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="card p-6">
			<div className="flex items-center gap-2.5 mb-5">
				<div className="w-7 h-7 rounded-lg bg-status-cancelled/10 border border-status-cancelled/20 flex items-center justify-center flex-shrink-0">
					<AlertTriangle size={13} className="text-status-cancelled" />
				</div>
				<h3 className="font-display text-sm font-700 text-ink-primary flex-1">
					Alertas de stock
				</h3>
				<span className="badge badge-cancelled">
					{lowStock.length} crítico{lowStock.length !== 1 ? "s" : ""}
				</span>
			</div>

			<div className="space-y-3">
				{lowStock.map((ing) => {
					const pct = Math.round((ing.stockCurrent / ing.alertThreshold) * 100);
					const isCritical = pct < 80;
					return (
						<div
							key={ing.id}
							className={[
								"px-4 py-3 rounded-xl border",
								isCritical
									? "bg-status-cancelled/5 border-status-cancelled/20"
									: "bg-status-pending/5 border-status-pending/20",
							].join(" ")}
						>
							<div className="flex items-center gap-2 mb-2">
								<span className="font-display text-sm font-600 text-ink-primary flex-1">
									{ing.name}
								</span>
								<span
									className={[
										"badge",
										isCritical ? "badge-cancelled" : "badge-pending",
									].join(" ")}
								>
									{isCritical ? "Crítico" : "Bajo"}
								</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="flex-1 h-1.5 progress-track overflow-hidden">
									<div
										className={[
											"progress-bar h-full",
											isCritical ? "bg-status-cancelled" : "bg-status-pending",
										].join(" ")}
										style={{ width: `${Math.min(pct, 100)}%` }}
									/>
								</div>
								<span className="font-mono text-[10px] text-ink-tertiary flex-shrink-0">
									{ing.stockCurrent}
									{ing.unit} / {ing.alertThreshold}
									{ing.unit}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
	const tables = useAppStore((s) => s.tables);
	const orders = useAppStore((s) => s.orders);
	const todayRevenue = useAppStore((s) => s.todayRevenue);
	const todayOrderCount = useAppStore((s) => s.todayOrderCount);
	const [refreshKey, setRefreshKey] = useState(0);

	const handleRefresh = useCallback(() => {
		setRefreshKey((k) => k + 1);
	}, []);

	const occupiedCount = tables.filter((t) => t.status === "occupied").length;
	const avgTicket =
		todayOrderCount > 0 ? Math.round(todayRevenue / todayOrderCount) : 0;

	return (
		<div className="flex flex-col min-h-screen" key={refreshKey}>
			<TopBar onRefresh={handleRefresh} />

			<div className="flex-1 px-8 py-6 space-y-6 animate-fade-in">
				{/* KPI row */}
				<div className="grid grid-cols-4 gap-4">
					<StatCard
						label="Ingresos hoy"
						value={formatCurrency(todayRevenue)}
						delta={12}
						deltaLabel="vs ayer"
						icon={DollarSign}
						iconBg="bg-brand-500/15"
						iconColor="text-brand-500"
						accent
					/>
					<StatCard
						label="Pedidos hoy"
						value={String(todayOrderCount)}
						delta={8}
						deltaLabel="vs ayer"
						icon={ShoppingBag}
						iconBg="bg-blue-500/10"
						iconColor="text-blue-400"
					/>
					<StatCard
						label="Ticket promedio"
						value={formatCurrency(avgTicket)}
						delta={4}
						deltaLabel="vs ayer"
						icon={TrendingUp}
						iconBg="bg-pool-500/10"
						iconColor="text-pool-500"
					/>
					<StatCard
						label="Mesas ocupadas"
						value={`${occupiedCount}/${tables.length}`}
						icon={Grid3X3}
						iconBg="bg-purple-500/10"
						iconColor="text-purple-400"
					/>
				</div>

				{/* Revenue by hour — full width */}
				<RevenueByHourChart todayRevenue={todayRevenue} />

				{/* Active orders + Tables map */}
				<div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>
					<ActiveOrders orders={orders} />
					<TablesMap tables={tables} />
				</div>

				{/* Payment methods + Stock alerts */}
				<div className="grid grid-cols-2 gap-4">
					<PaymentMethodsBar />
					<StockAlerts />
				</div>
			</div>
		</div>
	);
}
