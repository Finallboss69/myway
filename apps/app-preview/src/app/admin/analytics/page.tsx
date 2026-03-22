"use client";

import { useState } from "react";
import {
	TrendingUp,
	DollarSign,
	ShoppingBag,
	Receipt,
	Clock,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ANALYTICS, formatCurrency } from "@/data/mock";
import { useLiveClock } from "@/hooks/useLiveClock";

// ─── Period tabs ──────────────────────────────────────────────────────────────

const PERIODS = ["Hoy", "Esta semana", "Este mes"] as const;
type Period = (typeof PERIODS)[number];

// ─── Computed monthly mock (deterministic) ────────────────────────────────────

const MONTHLY_DAYS = Array.from({ length: 28 }, (_, i) => {
	const base = 95000 + Math.sin(i * 0.7) * 30000 + i * 1800;
	const noise = ((i * 7919) % 15000) - 7500;
	return Math.round(base + noise);
});
MONTHLY_DAYS[27] = ANALYTICS.today.revenue;
const MONTHLY_TOTAL = MONTHLY_DAYS.reduce((a, b) => a + b, 0);
const MONTHLY_ORDERS = Math.round(ANALYTICS.week.orders * 4.2);
const MONTHLY_AVG_TICKET = Math.round(MONTHLY_TOTAL / MONTHLY_ORDERS);

// ─── Period data selector ─────────────────────────────────────────────────────

function getPeriodData(
	period: Period,
	todayRevenue: number,
	todayOrderCount: number,
) {
	if (period === "Hoy") {
		return {
			revenue: todayRevenue,
			orders: todayOrderCount,
			avgTicket:
				todayOrderCount > 0 ? Math.round(todayRevenue / todayOrderCount) : 0,
			bestLabel: ANALYTICS.today.revenueByHour.reduce(
				(b, h) => (h.value > b.value ? h : b),
				ANALYTICS.today.revenueByHour[0],
			).hour,
			deltaRevenue: "+12%",
			deltaOrders: "+8%",
		};
	}
	if (period === "Esta semana") {
		const bestDay = ANALYTICS.week.days.reduce((b, d) =>
			d.revenue > b.revenue ? d : b,
		);
		return {
			revenue: ANALYTICS.week.revenue,
			orders: ANALYTICS.week.orders,
			avgTicket: ANALYTICS.week.avgTicket,
			bestLabel: bestDay.day,
			deltaRevenue: "+9%",
			deltaOrders: "+7%",
		};
	}
	// Este mes
	const bestDayIdx = MONTHLY_DAYS.indexOf(Math.max(...MONTHLY_DAYS));
	return {
		revenue: MONTHLY_TOTAL,
		orders: MONTHLY_ORDERS,
		avgTicket: MONTHLY_AVG_TICKET,
		bestLabel: `Día ${bestDayIdx + 1}`,
		deltaRevenue: "+15%",
		deltaOrders: "+11%",
	};
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

function TopBar({
	period,
	onPeriod,
}: {
	period: Period;
	onPeriod: (p: Period) => void;
}) {
	const { time, date } = useLiveClock();

	return (
		<div className="flex items-center justify-between px-8 py-5 border-b border-surface-3 bg-surface-1/60 backdrop-blur-sm sticky top-0 z-10">
			<div>
				<h1 className="font-display text-xl font-700 text-ink-primary tracking-tight">
					Analíticas
				</h1>
				<p className="font-body text-xs text-ink-tertiary mt-0.5 capitalize">
					{date}
				</p>
			</div>
			<div className="flex items-center gap-4">
				{/* Period tabs */}
				<div className="flex items-center gap-0.5 p-1 rounded-xl bg-surface-2 border border-surface-3">
					{PERIODS.map((p) => (
						<button
							key={p}
							onClick={() => onPeriod(p)}
							className={[
								"px-4 py-1.5 rounded-lg font-display text-xs font-600 transition-all duration-150",
								period === p
									? "bg-brand-500 text-surface-0 shadow-gold-sm"
									: "text-ink-tertiary hover:text-ink-primary",
							].join(" ")}
						>
							{p}
						</button>
					))}
				</div>
				<div className="flex items-center gap-1.5 pl-4 border-l border-surface-3 text-ink-tertiary">
					<Clock size={13} />
					<span className="font-mono text-xs" suppressHydrationWarning>
						{time}
					</span>
				</div>
			</div>
		</div>
	);
}

// ─── KPI row ──────────────────────────────────────────────────────────────────

function KpiRow({
	revenue,
	orders,
	avgTicket,
	bestLabel,
	deltaRevenue,
	deltaOrders,
}: {
	revenue: number;
	orders: number;
	avgTicket: number;
	bestLabel: string;
	deltaRevenue: string;
	deltaOrders: string;
}) {
	const kpis = [
		{
			label: "Ingresos",
			value: formatCurrency(revenue),
			delta: deltaRevenue,
			icon: DollarSign,
			accent: true,
		},
		{
			label: "Pedidos",
			value: String(orders),
			delta: deltaOrders,
			icon: ShoppingBag,
			accent: false,
		},
		{
			label: "Ticket promedio",
			value: formatCurrency(avgTicket),
			delta: "+4%",
			icon: Receipt,
			accent: false,
		},
		{
			label: "Mejor hora/día",
			value: bestLabel,
			delta: "+3%",
			icon: TrendingUp,
			accent: false,
		},
	];

	return (
		<div className="grid grid-cols-4 gap-4">
			{kpis.map(({ label, value, delta, icon: Icon, accent }) => (
				<div
					key={label}
					className={[
						"stat-card relative overflow-hidden",
						accent ? "border-brand-500/25 shadow-gold-sm" : "",
					].join(" ")}
				>
					{accent && (
						<div className="absolute inset-0 bg-gold-glow opacity-60 pointer-events-none" />
					)}
					<div className="relative z-10 flex items-center justify-between mb-3">
						<span className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest">
							{label}
						</span>
						<div
							className={[
								"w-7 h-7 rounded-lg flex items-center justify-center",
								accent
									? "bg-brand-500/20"
									: "bg-surface-3 border border-surface-4",
							].join(" ")}
						>
							<Icon
								size={13}
								className={accent ? "text-brand-500" : "text-ink-secondary"}
							/>
						</div>
					</div>
					<div className="relative z-10">
						<div
							className={[
								"font-kds leading-none mb-1.5",
								accent
									? "text-brand-500 text-4xl"
									: "text-ink-primary text-3xl",
							].join(" ")}
						>
							{value}
						</div>
						<div className="flex items-center gap-1">
							<TrendingUp size={10} className="text-pool-500" />
							<span className="font-display text-[10px] font-600 text-pool-500">
								{delta} vs período anterior
							</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Revenue by hour chart (Hoy) ──────────────────────────────────────────────

function RevenueByHourChart({ revenue }: { revenue: number }) {
	const data = ANALYTICS.today.revenueByHour;
	const max = Math.max(...data.map((d) => d.value));
	const { time } = useLiveClock();
	const currentHour = time.split(":")[0] + ":00";
	const yLabels = [0, 10000, 20000, 30000];

	return (
		<div className="card p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Ingresos por hora
					</h3>
					<p className="font-body text-xs text-ink-tertiary mt-0.5">
						Rango completo del día operativo · 18:00 – 02:00
					</p>
				</div>
				<div className="text-right">
					<div className="font-kds text-2xl text-brand-500 leading-none">
						{formatCurrency(revenue)}
					</div>
					<div className="font-body text-[10px] text-ink-tertiary">
						total hoy
					</div>
				</div>
			</div>

			<div className="flex gap-4">
				{/* Y-axis */}
				<div
					className="flex flex-col justify-between items-end flex-shrink-0 pb-7"
					style={{ height: "300px" }}
				>
					{[...yLabels].reverse().map((v) => (
						<span key={v} className="font-mono text-[9px] text-ink-tertiary">
							{v === 0 ? "0" : `${v / 1000}k`}
						</span>
					))}
				</div>

				{/* Bars */}
				<div
					className="flex-1 flex items-end gap-2"
					style={{ height: "300px" }}
				>
					{data.map((d) => {
						const heightPct = (d.value / max) * 100;
						const isCurrent = d.hour === currentHour;
						return (
							<div
								key={d.hour}
								className="flex-1 flex flex-col items-center gap-2 h-full"
							>
								<div className="flex-1 w-full flex flex-col items-center justify-end gap-1">
									<span
										className={[
											"font-mono text-[9px] leading-none",
											isCurrent ? "text-brand-500" : "text-ink-tertiary",
										].join(" ")}
									>
										{Math.round(d.value / 1000)}k
									</span>
									<div
										className={[
											"w-full rounded-t-lg relative overflow-hidden transition-all duration-700",
											isCurrent
												? "bg-brand-500 shadow-gold-md"
												: "bg-surface-4 hover:bg-surface-5",
										].join(" ")}
										style={{ height: `${heightPct}%` }}
									>
										{isCurrent && (
											<>
												<div className="absolute inset-0 bg-brand-500/40 blur-sm" />
												<div className="absolute top-0 left-0 right-0 h-px bg-brand-300" />
											</>
										)}
									</div>
								</div>
								<span
									className={[
										"font-body text-[10px] whitespace-nowrap flex-shrink-0",
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
			</div>

			<div className="mt-4 pt-4 border-t border-surface-3 grid grid-cols-3 gap-4">
				<div>
					<div className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
						Pico
					</div>
					<div className="font-kds text-lg text-brand-500 mt-0.5">22:00 hs</div>
				</div>
				<div>
					<div className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
						Máx hora
					</div>
					<div className="font-kds text-lg text-ink-primary mt-0.5">
						{formatCurrency(max)}
					</div>
				</div>
				<div>
					<div className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
						Promedio/hora
					</div>
					<div className="font-kds text-lg text-ink-primary mt-0.5">
						{formatCurrency(Math.round(revenue / data.length))}
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Revenue by category donut ────────────────────────────────────────────────

const CATEGORY_COLORS = [
	"#f59e0b", // Tragos
	"#f97316", // Cervezas
	"#ec4899", // Coctelería
	"#22c55e", // Comida
	"#8b5cf6", // Vinos
	"#06b6d4", // Pool
];

function RevenueByCategoryDonut() {
	const data = ANALYTICS.today.revenueByCategory;
	const total = data.reduce((s, d) => s + d.value, 0);

	let cumPct = 0;
	const stops = data.map((d, i) => {
		const pct = (d.value / total) * 100;
		const start = cumPct;
		cumPct += pct;
		return `${CATEGORY_COLORS[i]} ${start.toFixed(1)}% ${cumPct.toFixed(1)}%`;
	});
	const gradient = `conic-gradient(from -90deg, ${stops.join(", ")})`;

	return (
		<div className="card p-6">
			<div className="mb-5">
				<h3 className="font-display text-sm font-700 text-ink-primary">
					Ingresos por categoría
				</h3>
				<p className="font-body text-xs text-ink-tertiary mt-0.5">
					Distribución de ventas hoy
				</p>
			</div>

			<div className="flex items-center gap-8">
				{/* Donut */}
				<div className="relative flex-shrink-0">
					<div
						className="w-[160px] h-[160px] rounded-full"
						style={{ background: gradient }}
					/>
					<div className="absolute inset-[20px] rounded-full bg-surface-1 flex flex-col items-center justify-center">
						<span className="font-kds text-lg text-ink-primary leading-none">
							{formatCurrency(total)}
						</span>
						<span className="font-body text-[9px] text-ink-tertiary mt-0.5">
							total
						</span>
					</div>
				</div>

				{/* Legend */}
				<div className="flex-1 space-y-2">
					{data.map((d, i) => {
						const pct = ((d.value / total) * 100).toFixed(1);
						return (
							<div key={d.name} className="flex items-center gap-3">
								<div
									className="w-2 h-2 rounded-full flex-shrink-0"
									style={{ background: CATEGORY_COLORS[i] }}
								/>
								<span className="font-body text-xs text-ink-secondary flex-1">
									{d.name}
								</span>
								<span className="font-display text-[10px] font-600 text-ink-tertiary">
									{pct}%
								</span>
								<span className="font-mono text-xs text-ink-secondary w-[88px] text-right">
									{formatCurrency(d.value)}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

// ─── Weekly revenue bars ──────────────────────────────────────────────────────

function WeeklyRevenueChart() {
	const data = ANALYTICS.week.days;
	const max = Math.max(...data.map((d) => d.revenue));
	const bestDay = data.reduce((b, d) => (d.revenue > b.revenue ? d : b));

	return (
		<div className="card p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Ingresos — Esta semana
					</h3>
					<p className="font-body text-xs text-ink-tertiary mt-0.5">
						Lunes a Domingo
					</p>
				</div>
				<div className="text-right">
					<div className="font-kds text-2xl text-ink-primary leading-none">
						{formatCurrency(ANALYTICS.week.revenue)}
					</div>
					<div className="font-body text-[10px] text-ink-tertiary">
						total semana
					</div>
				</div>
			</div>

			<div className="flex items-end gap-3 h-[160px]">
				{data.map((d) => {
					const heightPct = (d.revenue / max) * 100;
					const isToday = d.day === "Dom";
					const isBest = d.day === bestDay.day;
					return (
						<div
							key={d.day}
							className="flex-1 flex flex-col items-center gap-1.5 h-full"
						>
							<div className="flex-1 w-full flex items-end">
								<div
									className={[
										"w-full rounded-t-md relative transition-all duration-500",
										isToday
											? "bg-brand-500 shadow-gold-sm"
											: isBest
												? "bg-brand-500/60"
												: "bg-surface-4 hover:bg-surface-5",
									].join(" ")}
									style={{ height: `${heightPct}%` }}
								>
									{isToday && (
										<div className="absolute inset-0 bg-brand-500/30 blur-sm rounded-t-md" />
									)}
								</div>
							</div>
							<span
								className={[
									"font-display text-xs font-600",
									isToday
										? "text-brand-500"
										: isBest
											? "text-brand-400"
											: "text-ink-tertiary",
								].join(" ")}
							>
								{d.day}
							</span>
						</div>
					);
				})}
			</div>

			<div className="mt-4 pt-4 border-t border-surface-3 flex items-center justify-between">
				<span className="font-body text-xs text-ink-tertiary">
					Mejor día:{" "}
					<span className="text-ink-secondary font-500">
						{bestDay.day} {formatCurrency(bestDay.revenue)}
					</span>
				</span>
				<span className="font-body text-xs text-ink-tertiary">
					Promedio/día:{" "}
					<span className="text-ink-secondary font-500">
						{formatCurrency(Math.round(ANALYTICS.week.revenue / 7))}
					</span>
				</span>
			</div>
		</div>
	);
}

// ─── Monthly trend chart ──────────────────────────────────────────────────────

function MonthlyTrendChart() {
	const max = Math.max(...MONTHLY_DAYS);
	const today = MONTHLY_DAYS.length - 1;

	return (
		<div className="card p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Tendencia mensual — Marzo
					</h3>
					<p className="font-body text-xs text-ink-tertiary mt-0.5">
						28 días · Ingresos diarios
					</p>
				</div>
				<div className="text-right">
					<div className="font-kds text-2xl text-brand-500 leading-none">
						{formatCurrency(MONTHLY_TOTAL)}
					</div>
					<div className="font-body text-[10px] text-ink-tertiary">
						acumulado mes
					</div>
				</div>
			</div>

			<div className="flex items-end gap-px h-[120px]">
				{MONTHLY_DAYS.map((v, i) => {
					const heightPct = (v / max) * 100;
					const isToday = i === today;
					const isRecent = i >= today - 2 && i < today;
					return (
						<div
							key={i}
							className={[
								"flex-1 rounded-t-sm transition-all",
								isToday
									? "bg-brand-500 shadow-gold-sm"
									: isRecent
										? "bg-brand-500/50"
										: "bg-surface-4",
							].join(" ")}
							style={{ height: `${heightPct}%` }}
						/>
					);
				})}
			</div>

			<div className="flex items-center justify-between mt-2">
				<span className="font-mono text-[10px] text-ink-tertiary">1 Mar</span>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						<div className="w-2 h-2 rounded-sm bg-brand-500" />
						<span className="font-mono text-[10px] text-brand-500">
							Hoy (21)
						</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="w-2 h-2 rounded-sm bg-brand-500/50" />
						<span className="font-mono text-[10px] text-ink-tertiary">
							Recientes
						</span>
					</div>
				</div>
				<span className="font-mono text-[10px] text-ink-tertiary">31 Mar</span>
			</div>

			<div className="mt-4 pt-4 border-t border-surface-3 grid grid-cols-3 gap-4">
				<div>
					<div className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
						Total mes
					</div>
					<div className="font-kds text-lg text-brand-500 mt-0.5">
						{formatCurrency(MONTHLY_TOTAL)}
					</div>
				</div>
				<div>
					<div className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
						Promedio diario
					</div>
					<div className="font-kds text-lg text-ink-primary mt-0.5">
						{formatCurrency(Math.round(MONTHLY_TOTAL / 28))}
					</div>
				</div>
				<div>
					<div className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
						Mejor día
					</div>
					<div className="font-kds text-lg text-ink-primary mt-0.5">
						{formatCurrency(max)}
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Payment methods table ────────────────────────────────────────────────────

function PaymentMethodsTable() {
	const methods = ANALYTICS.today.paymentMethods;
	const transactions = [22, 19, 6];
	const COLORS = ["bg-brand-500", "bg-blue-500", "bg-purple-500"];

	return (
		<div className="card p-6">
			<div className="mb-5">
				<h3 className="font-display text-sm font-700 text-ink-primary">
					Desglose por método de pago
				</h3>
				<p className="font-body text-xs text-ink-tertiary mt-0.5">
					Hoy — totales y promedios
				</p>
			</div>
			<table className="w-full">
				<thead>
					<tr className="border-b border-surface-3">
						{[
							"Método",
							"Monto",
							"Participación",
							"Transacciones",
							"Ticket promedio",
						].map((h) => (
							<th
								key={h}
								className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest pb-3 text-left last:text-right"
							>
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-surface-3">
					{methods.map((m, i) => (
						<tr
							key={m.method}
							className="hover:bg-surface-2/40 transition-colors"
						>
							<td className="py-3.5 pr-4">
								<div className="flex items-center gap-2.5">
									<div className={`w-2.5 h-2.5 rounded-full ${COLORS[i]}`} />
									<span className="font-body text-sm text-ink-primary">
										{m.method}
									</span>
								</div>
							</td>
							<td className="py-3.5 pr-4">
								<span className="font-mono text-sm text-ink-secondary">
									{formatCurrency(m.amount)}
								</span>
							</td>
							<td className="py-3.5 pr-4">
								<div className="flex items-center gap-3">
									<div className="w-28 h-1.5 rounded-full bg-surface-3 overflow-hidden">
										<div
											className={`h-full rounded-full ${COLORS[i]}`}
											style={{ width: `${m.pct}%` }}
										/>
									</div>
									<span className="font-display text-xs font-700 text-ink-secondary">
										{m.pct}%
									</span>
								</div>
							</td>
							<td className="py-3.5 pr-4">
								<span className="font-kds text-2xl text-ink-primary">
									{transactions[i]}
								</span>
							</td>
							<td className="py-3.5 text-right">
								<span className="font-mono text-sm text-ink-tertiary">
									{formatCurrency(Math.round(m.amount / transactions[i]))}
								</span>
							</td>
						</tr>
					))}
				</tbody>
				<tfoot>
					<tr className="border-t-2 border-surface-4">
						<td className="pt-3.5 font-display text-xs font-700 text-ink-primary">
							Total
						</td>
						<td className="pt-3.5">
							<span className="font-mono text-sm font-700 text-brand-500">
								{formatCurrency(ANALYTICS.today.revenue)}
							</span>
						</td>
						<td className="pt-3.5">
							<span className="font-display text-xs font-600 text-ink-tertiary">
								100%
							</span>
						</td>
						<td className="pt-3.5">
							<span className="font-kds text-2xl text-brand-500">
								{transactions.reduce((a, b) => a + b, 0)}
							</span>
						</td>
						<td className="pt-3.5 text-right">
							<span className="font-mono text-sm text-ink-tertiary">
								{formatCurrency(ANALYTICS.today.avgTicket)}
							</span>
						</td>
					</tr>
				</tfoot>
			</table>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
	const [period, setPeriod] = useState<Period>("Hoy");
	const todayRevenue = useAppStore((s) => s.todayRevenue);
	const todayOrderCount = useAppStore((s) => s.todayOrderCount);

	const data = getPeriodData(period, todayRevenue, todayOrderCount);

	return (
		<div className="flex flex-col min-h-screen">
			<TopBar period={period} onPeriod={setPeriod} />

			<div className="flex-1 px-8 py-6 space-y-6 animate-fade-in">
				{/* KPI row — reacts to period */}
				<KpiRow
					revenue={data.revenue}
					orders={data.orders}
					avgTicket={data.avgTicket}
					bestLabel={data.bestLabel}
					deltaRevenue={data.deltaRevenue}
					deltaOrders={data.deltaOrders}
				/>

				{/* Main chart — switches by period */}
				{period === "Hoy" && <RevenueByHourChart revenue={data.revenue} />}
				{period === "Esta semana" && (
					<div className="grid grid-cols-2 gap-6">
						<WeeklyRevenueChart />
						<RevenueByCategoryDonut />
					</div>
				)}
				{period === "Este mes" && <MonthlyTrendChart />}

				{/* Secondary charts (always shown) */}
				{period === "Hoy" && (
					<div className="grid grid-cols-2 gap-4">
						<RevenueByCategoryDonut />
						<WeeklyRevenueChart />
					</div>
				)}

				{/* Payment methods table */}
				<PaymentMethodsTable />
			</div>
		</div>
	);
}
