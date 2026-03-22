"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, DollarSign, ShoppingBag, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// ─── Period tabs ──────────────────────────────────────────────────────────────

const PERIODS = ["Hoy", "Esta semana", "Este mes"] as const;
type Period = (typeof PERIODS)[number];

// ─── Deterministic mock data ──────────────────────────────────────────────────

const HOURS = [
	"18:00",
	"19:00",
	"20:00",
	"21:00",
	"22:00",
	"23:00",
	"00:00",
	"01:00",
	"02:00",
];

const HOUR_SEED = [8000, 14000, 22000, 28000, 31000, 26000, 18000, 12000, 6000];

const WEEK_DAYS = [
	{ day: "Lun", revenue: 142000 },
	{ day: "Mar", revenue: 118000 },
	{ day: "Mié", revenue: 135000 },
	{ day: "Jue", revenue: 161000 },
	{ day: "Vie", revenue: 198000 },
	{ day: "Sáb", revenue: 225000 },
	{ day: "Dom", revenue: 175000 },
];

const WEEK_REVENUE = WEEK_DAYS.reduce((s, d) => s + d.revenue, 0);
const WEEK_ORDERS = 312;
const WEEK_AVG_TICKET = Math.round(WEEK_REVENUE / WEEK_ORDERS);

const MONTHLY_DAYS = Array.from({ length: 28 }, (_, i) => {
	const base = 95000 + Math.sin(i * 0.7) * 30000 + i * 1800;
	const noise = ((i * 7919) % 15000) - 7500;
	return Math.round(base + noise);
});
const MONTHLY_TOTAL = MONTHLY_DAYS.reduce((a, b) => a + b, 0);
const MONTHLY_ORDERS = Math.round(WEEK_ORDERS * 4.2);
const MONTHLY_AVG_TICKET = Math.round(MONTHLY_TOTAL / MONTHLY_ORDERS);

const CATEGORY_DATA = [
	{ name: "Tragos", value: 68000 },
	{ name: "Cervezas", value: 52000 },
	{ name: "Coctelería", value: 38000 },
	{ name: "Comida", value: 29000 },
	{ name: "Vinos", value: 21000 },
	{ name: "Pool", value: 14000 },
];

const CATEGORY_COLORS = [
	"#f59e0b",
	"#f97316",
	"#ec4899",
	"#22c55e",
	"#8b5cf6",
	"#06b6d4",
];

const PAYMENT_METHODS = [
	{ method: "Efectivo", pct: 48 },
	{ method: "MercadoPago", pct: 38 },
	{ method: "Tarjeta", pct: 14 },
];
const PAYMENT_TRANSACTIONS = [22, 19, 6];
const PAYMENT_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6"];

// ─── Period data selector ─────────────────────────────────────────────────────

function getPeriodData(
	period: Period,
	todayRevenue: number,
	todayOrderCount: number,
) {
	if (period === "Hoy") {
		const bestHourIdx = HOUR_SEED.indexOf(Math.max(...HOUR_SEED));
		return {
			revenue: todayRevenue,
			orders: todayOrderCount,
			avgTicket:
				todayOrderCount > 0 ? Math.round(todayRevenue / todayOrderCount) : 0,
			bestLabel: HOURS[bestHourIdx] + " hs",
			deltaRevenue: "+12%",
			deltaOrders: "+8%",
		};
	}
	if (period === "Esta semana") {
		const bestDay = WEEK_DAYS.reduce((b, d) => (d.revenue > b.revenue ? d : b));
		return {
			revenue: WEEK_REVENUE,
			orders: WEEK_ORDERS,
			avgTicket: WEEK_AVG_TICKET,
			bestLabel: bestDay.day,
			deltaRevenue: "+9%",
			deltaOrders: "+7%",
		};
	}
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
		<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
			{kpis.map(({ label, value, delta, icon: Icon, accent }) => (
				<div
					key={label}
					className="stat-card"
					style={{
						position: "relative",
						overflow: "hidden",
						...(accent
							? {
									borderColor: "rgba(245,158,11,0.25)",
									boxShadow: "0 0 16px rgba(245,158,11,0.08)",
								}
							: {}),
					}}
				>
					{accent && (
						<div
							style={{
								position: "absolute",
								inset: 0,
								background:
									"radial-gradient(ellipse 300px 200px at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 60%)",
								pointerEvents: "none",
							}}
						/>
					)}
					<div
						className="flex items-center justify-between mb-3"
						style={{ position: "relative", zIndex: 1 }}
					>
						<span
							className="font-display text-ink-disabled uppercase"
							style={{ fontSize: 9, letterSpacing: "0.25em" }}
						>
							{label}
						</span>
						<div
							style={{
								width: 28,
								height: 28,
								borderRadius: 8,
								background: accent ? "rgba(245,158,11,0.2)" : "var(--s3)",
								border: accent ? "none" : "1px solid var(--s4)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Icon size={13} style={{ color: accent ? "#f59e0b" : "#888" }} />
						</div>
					</div>
					<div style={{ position: "relative", zIndex: 1 }}>
						<div
							className="font-kds"
							style={{
								fontSize: accent ? 34 : 28,
								lineHeight: 1,
								color: accent ? "#f59e0b" : "#e5e5e5",
								marginBottom: 6,
							}}
						>
							{value}
						</div>
						<div className="flex items-center gap-1">
							<TrendingUp size={10} style={{ color: "#10b981" }} />
							<span
								className="font-display"
								style={{ fontSize: 10, fontWeight: 600, color: "#10b981" }}
							>
								{delta} vs período anterior
							</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Revenue by hour chart ────────────────────────────────────────────────────

function RevenueByHourChart({
	revenue,
	currentHour,
}: {
	revenue: number;
	currentHour: string;
}) {
	const max = Math.max(...HOUR_SEED);

	return (
		<div className="card" style={{ padding: 24 }}>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3
						className="font-display text-ink-primary"
						style={{ fontSize: 13, fontWeight: 700 }}
					>
						Ingresos por hora
					</h3>
					<div
						className="font-body text-ink-disabled mt-0.5"
						style={{ fontSize: 11 }}
					>
						Rango completo del día operativo · 18:00 – 02:00
					</div>
				</div>
				<div style={{ textAlign: "right" }}>
					<div
						className="font-kds text-brand-500"
						style={{ fontSize: 22, lineHeight: 1 }}
					>
						{formatCurrency(revenue)}
					</div>
					<div className="font-body text-ink-disabled" style={{ fontSize: 10 }}>
						total hoy
					</div>
				</div>
			</div>

			<div className="flex gap-4">
				{/* Y-axis */}
				<div
					className="flex flex-col justify-between items-end flex-shrink-0"
					style={{ height: 240, paddingBottom: 28 }}
				>
					{[30000, 20000, 10000, 0].map((v) => (
						<span
							key={v}
							className="font-body text-ink-disabled"
							style={{ fontSize: 9, fontFamily: "monospace" }}
						>
							{v === 0 ? "0" : `${v / 1000}k`}
						</span>
					))}
				</div>

				{/* Bars */}
				<div className="flex items-end gap-2 flex-1" style={{ height: 240 }}>
					{HOURS.map((hour, i) => {
						const heightPct = (HOUR_SEED[i] / max) * 100;
						const isCurrent = hour === currentHour;
						return (
							<div
								key={hour}
								className="flex-1 flex flex-col items-center gap-2 h-full"
							>
								<div className="flex-1 w-full flex flex-col items-center justify-end gap-1">
									<span
										className="font-body"
										style={{
											fontSize: 9,
											color: isCurrent ? "#f59e0b" : "#555",
											fontFamily: "monospace",
										}}
									>
										{Math.round(HOUR_SEED[i] / 1000)}k
									</span>
									<div
										style={{
											width: "100%",
											height: `${heightPct}%`,
											borderRadius: "4px 4px 0 0",
											background: isCurrent ? "#f59e0b" : "var(--s4)",
											boxShadow: isCurrent
												? "0 0 12px rgba(245,158,11,0.4)"
												: "none",
											transition: "all 0.3s",
										}}
									/>
								</div>
								<span
									className="font-body flex-shrink-0"
									style={{
										fontSize: 10,
										color: isCurrent ? "#f59e0b" : "#555",
										fontFamily: "monospace",
										fontWeight: isCurrent ? 600 : 400,
									}}
									suppressHydrationWarning
								>
									{hour}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			<div
				className="grid gap-4 mt-4 pt-4"
				style={{
					gridTemplateColumns: "repeat(3, 1fr)",
					borderTop: "1px solid var(--s3)",
				}}
			>
				<div>
					<div
						className="font-display text-ink-disabled uppercase"
						style={{ fontSize: 9, letterSpacing: "0.2em" }}
					>
						Pico
					</div>
					<div
						className="font-kds text-brand-500 mt-0.5"
						style={{ fontSize: 18 }}
					>
						22:00 hs
					</div>
				</div>
				<div>
					<div
						className="font-display text-ink-disabled uppercase"
						style={{ fontSize: 9, letterSpacing: "0.2em" }}
					>
						Máx hora
					</div>
					<div
						className="font-kds text-ink-primary mt-0.5"
						style={{ fontSize: 18 }}
					>
						{formatCurrency(max)}
					</div>
				</div>
				<div>
					<div
						className="font-display text-ink-disabled uppercase"
						style={{ fontSize: 9, letterSpacing: "0.2em" }}
					>
						Promedio/hora
					</div>
					<div
						className="font-kds text-ink-primary mt-0.5"
						style={{ fontSize: 18 }}
					>
						{formatCurrency(Math.round(revenue / HOURS.length))}
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Weekly revenue chart ─────────────────────────────────────────────────────

function WeeklyRevenueChart() {
	const max = Math.max(...WEEK_DAYS.map((d) => d.revenue));
	const bestDay = WEEK_DAYS.reduce((b, d) => (d.revenue > b.revenue ? d : b));

	return (
		<div className="card" style={{ padding: 24 }}>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3
						className="font-display text-ink-primary"
						style={{ fontSize: 13, fontWeight: 700 }}
					>
						Ingresos — Esta semana
					</h3>
					<div
						className="font-body text-ink-disabled mt-0.5"
						style={{ fontSize: 11 }}
					>
						Lunes a Domingo
					</div>
				</div>
				<div style={{ textAlign: "right" }}>
					<div
						className="font-kds text-ink-primary"
						style={{ fontSize: 22, lineHeight: 1 }}
					>
						{formatCurrency(WEEK_REVENUE)}
					</div>
					<div className="font-body text-ink-disabled" style={{ fontSize: 10 }}>
						total semana
					</div>
				</div>
			</div>

			<div className="flex items-end gap-3" style={{ height: 160 }}>
				{WEEK_DAYS.map((d) => {
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
									style={{
										width: "100%",
										height: `${heightPct}%`,
										borderRadius: "4px 4px 0 0",
										background: isToday
											? "#f59e0b"
											: isBest
												? "rgba(245,158,11,0.5)"
												: "var(--s4)",
										boxShadow: isToday
											? "0 0 10px rgba(245,158,11,0.3)"
											: "none",
										transition: "height 0.3s",
									}}
								/>
							</div>
							<span
								className="font-display"
								style={{
									fontSize: 12,
									fontWeight: 600,
									color: isToday ? "#f59e0b" : isBest ? "#d97706" : "#555",
								}}
							>
								{d.day}
							</span>
						</div>
					);
				})}
			</div>

			<div
				className="flex items-center justify-between mt-4 pt-4"
				style={{ borderTop: "1px solid var(--s3)" }}
			>
				<span className="font-body text-ink-disabled" style={{ fontSize: 12 }}>
					Mejor día:{" "}
					<span style={{ color: "#aaa", fontWeight: 500 }}>
						{bestDay.day} {formatCurrency(bestDay.revenue)}
					</span>
				</span>
				<span className="font-body text-ink-disabled" style={{ fontSize: 12 }}>
					Promedio/día:{" "}
					<span style={{ color: "#aaa", fontWeight: 500 }}>
						{formatCurrency(Math.round(WEEK_REVENUE / 7))}
					</span>
				</span>
			</div>
		</div>
	);
}

// ─── Revenue by category donut ────────────────────────────────────────────────

function RevenueByCategoryDonut() {
	const total = CATEGORY_DATA.reduce((s, d) => s + d.value, 0);

	let cumPct = 0;
	const stops = CATEGORY_DATA.map((d, i) => {
		const pct = (d.value / total) * 100;
		const start = cumPct;
		cumPct += pct;
		return `${CATEGORY_COLORS[i]} ${start.toFixed(1)}% ${cumPct.toFixed(1)}%`;
	});
	const gradient = `conic-gradient(from -90deg, ${stops.join(", ")})`;

	return (
		<div className="card" style={{ padding: 24 }}>
			<div className="mb-5">
				<h3
					className="font-display text-ink-primary"
					style={{ fontSize: 13, fontWeight: 700 }}
				>
					Ingresos por categoría
				</h3>
				<div
					className="font-body text-ink-disabled mt-0.5"
					style={{ fontSize: 11 }}
				>
					Distribución de ventas hoy
				</div>
			</div>

			<div className="flex items-center gap-8">
				<div style={{ position: "relative", flexShrink: 0 }}>
					<div
						style={{
							width: 160,
							height: 160,
							borderRadius: "50%",
							background: gradient,
						}}
					/>
					<div
						style={{
							position: "absolute",
							inset: 20,
							borderRadius: "50%",
							background: "var(--s1)",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<span
							className="font-kds text-ink-primary"
							style={{ fontSize: 16, lineHeight: 1 }}
						>
							{formatCurrency(total)}
						</span>
						<span
							className="font-body text-ink-disabled"
							style={{ fontSize: 9, marginTop: 2 }}
						>
							total
						</span>
					</div>
				</div>

				<div
					className="flex-1"
					style={{ display: "flex", flexDirection: "column", gap: 8 }}
				>
					{CATEGORY_DATA.map((d, i) => {
						const pct = ((d.value / total) * 100).toFixed(1);
						return (
							<div key={d.name} className="flex items-center gap-3">
								<div
									style={{
										width: 8,
										height: 8,
										borderRadius: "50%",
										background: CATEGORY_COLORS[i],
										flexShrink: 0,
									}}
								/>
								<span
									className="font-body text-ink-secondary flex-1"
									style={{ fontSize: 12 }}
								>
									{d.name}
								</span>
								<span
									className="font-display text-ink-disabled"
									style={{ fontSize: 10, fontWeight: 600 }}
								>
									{pct}%
								</span>
								<span
									className="font-body text-ink-secondary"
									style={{
										fontSize: 12,
										fontFamily: "monospace",
										minWidth: 88,
										textAlign: "right",
									}}
								>
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

// ─── Monthly trend chart ──────────────────────────────────────────────────────

function MonthlyTrendChart() {
	const max = Math.max(...MONTHLY_DAYS);
	const today = MONTHLY_DAYS.length - 1;

	return (
		<div className="card" style={{ padding: 24 }}>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3
						className="font-display text-ink-primary"
						style={{ fontSize: 13, fontWeight: 700 }}
					>
						Tendencia mensual — Marzo
					</h3>
					<div
						className="font-body text-ink-disabled mt-0.5"
						style={{ fontSize: 11 }}
					>
						28 días · Ingresos diarios
					</div>
				</div>
				<div style={{ textAlign: "right" }}>
					<div
						className="font-kds text-brand-500"
						style={{ fontSize: 22, lineHeight: 1 }}
					>
						{formatCurrency(MONTHLY_TOTAL)}
					</div>
					<div className="font-body text-ink-disabled" style={{ fontSize: 10 }}>
						acumulado mes
					</div>
				</div>
			</div>

			<div className="flex items-end gap-px" style={{ height: 120 }}>
				{MONTHLY_DAYS.map((v, i) => {
					const heightPct = (v / max) * 100;
					const isToday = i === today;
					const isRecent = i >= today - 2 && i < today;
					return (
						<div
							key={i}
							style={{
								flex: 1,
								height: `${heightPct}%`,
								borderRadius: "2px 2px 0 0",
								background: isToday
									? "#f59e0b"
									: isRecent
										? "rgba(245,158,11,0.4)"
										: "var(--s4)",
								transition: "height 0.3s",
							}}
						/>
					);
				})}
			</div>

			<div className="flex items-center justify-between mt-2">
				<span
					className="font-body text-ink-disabled"
					style={{ fontSize: 10, fontFamily: "monospace" }}
				>
					1 Mar
				</span>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						<div
							style={{
								width: 8,
								height: 8,
								borderRadius: 2,
								background: "#f59e0b",
							}}
						/>
						<span
							className="font-body text-brand-500"
							style={{ fontSize: 10, fontFamily: "monospace" }}
						>
							Hoy (21)
						</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div
							style={{
								width: 8,
								height: 8,
								borderRadius: 2,
								background: "rgba(245,158,11,0.4)",
							}}
						/>
						<span
							className="font-body text-ink-disabled"
							style={{ fontSize: 10, fontFamily: "monospace" }}
						>
							Recientes
						</span>
					</div>
				</div>
				<span
					className="font-body text-ink-disabled"
					style={{ fontSize: 10, fontFamily: "monospace" }}
				>
					31 Mar
				</span>
			</div>

			<div
				className="grid gap-4 mt-4 pt-4"
				style={{
					gridTemplateColumns: "repeat(3, 1fr)",
					borderTop: "1px solid var(--s3)",
				}}
			>
				<div>
					<div
						className="font-display text-ink-disabled uppercase"
						style={{ fontSize: 9, letterSpacing: "0.2em" }}
					>
						Total mes
					</div>
					<div
						className="font-kds text-brand-500 mt-0.5"
						style={{ fontSize: 18 }}
					>
						{formatCurrency(MONTHLY_TOTAL)}
					</div>
				</div>
				<div>
					<div
						className="font-display text-ink-disabled uppercase"
						style={{ fontSize: 9, letterSpacing: "0.2em" }}
					>
						Promedio diario
					</div>
					<div
						className="font-kds text-ink-primary mt-0.5"
						style={{ fontSize: 18 }}
					>
						{formatCurrency(Math.round(MONTHLY_TOTAL / 28))}
					</div>
				</div>
				<div>
					<div
						className="font-display text-ink-disabled uppercase"
						style={{ fontSize: 9, letterSpacing: "0.2em" }}
					>
						Mejor día
					</div>
					<div
						className="font-kds text-ink-primary mt-0.5"
						style={{ fontSize: 18 }}
					>
						{formatCurrency(max)}
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Payment methods table ────────────────────────────────────────────────────

function PaymentMethodsTable({ totalRevenue }: { totalRevenue: number }) {
	const methods = PAYMENT_METHODS.map((m) => ({
		...m,
		amount: Math.round((m.pct / 100) * totalRevenue),
	}));

	return (
		<div className="card" style={{ padding: 0, overflow: "hidden" }}>
			<div
				style={{ padding: "16px 20px", borderBottom: "1px solid var(--s3)" }}
			>
				<h3
					className="font-display text-ink-primary"
					style={{ fontSize: 13, fontWeight: 700 }}
				>
					Desglose por método de pago
				</h3>
				<div
					className="font-body text-ink-disabled mt-0.5"
					style={{ fontSize: 11 }}
				>
					Hoy — totales y promedios
				</div>
			</div>
			<div style={{ padding: "0 4px" }}>
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ borderBottom: "1px solid var(--s3)" }}>
							{[
								"Método",
								"Monto",
								"Participación",
								"Transacciones",
								"Ticket promedio",
							].map((h) => (
								<th
									key={h}
									className="font-display text-ink-disabled uppercase"
									style={{
										fontSize: 9,
										letterSpacing: "0.2em",
										padding: "12px 16px",
										textAlign: "left",
										fontWeight: 600,
									}}
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{methods.map((m, i) => (
							<tr
								key={m.method}
								style={{ borderBottom: "1px solid var(--s3)" }}
							>
								<td style={{ padding: "14px 16px" }}>
									<div className="flex items-center gap-2.5">
										<div
											style={{
												width: 10,
												height: 10,
												borderRadius: "50%",
												background: PAYMENT_COLORS[i],
												flexShrink: 0,
											}}
										/>
										<span
											className="font-body text-ink-primary"
											style={{ fontSize: 13 }}
										>
											{m.method}
										</span>
									</div>
								</td>
								<td style={{ padding: "14px 16px" }}>
									<span
										className="font-body text-ink-secondary"
										style={{ fontSize: 13, fontFamily: "monospace" }}
									>
										{formatCurrency(m.amount)}
									</span>
								</td>
								<td style={{ padding: "14px 16px" }}>
									<div className="flex items-center gap-3">
										<div
											style={{
												width: 112,
												height: 6,
												borderRadius: 3,
												background: "var(--s3)",
												overflow: "hidden",
											}}
										>
											<div
												style={{
													width: `${m.pct}%`,
													height: "100%",
													background: PAYMENT_COLORS[i],
													borderRadius: 3,
												}}
											/>
										</div>
										<span
											className="font-display text-ink-secondary"
											style={{ fontSize: 11, fontWeight: 700 }}
										>
											{m.pct}%
										</span>
									</div>
								</td>
								<td style={{ padding: "14px 16px" }}>
									<span
										className="font-kds text-ink-primary"
										style={{ fontSize: 22 }}
									>
										{PAYMENT_TRANSACTIONS[i]}
									</span>
								</td>
								<td style={{ padding: "14px 16px", textAlign: "right" }}>
									<span
										className="font-body text-ink-disabled"
										style={{ fontSize: 12, fontFamily: "monospace" }}
									>
										{formatCurrency(
											Math.round(m.amount / PAYMENT_TRANSACTIONS[i]),
										)}
									</span>
								</td>
							</tr>
						))}
					</tbody>
					<tfoot>
						<tr style={{ borderTop: "2px solid var(--s4)" }}>
							<td
								className="font-display text-ink-primary"
								style={{ padding: "14px 16px", fontSize: 12, fontWeight: 700 }}
							>
								Total
							</td>
							<td style={{ padding: "14px 16px" }}>
								<span
									className="font-body text-brand-500"
									style={{
										fontSize: 13,
										fontWeight: 700,
										fontFamily: "monospace",
									}}
								>
									{formatCurrency(totalRevenue)}
								</span>
							</td>
							<td style={{ padding: "14px 16px" }}>
								<span
									className="font-display text-ink-disabled"
									style={{ fontSize: 11, fontWeight: 600 }}
								>
									100%
								</span>
							</td>
							<td style={{ padding: "14px 16px" }}>
								<span
									className="font-kds text-brand-500"
									style={{ fontSize: 22 }}
								>
									{PAYMENT_TRANSACTIONS.reduce((a, b) => a + b, 0)}
								</span>
							</td>
							<td style={{ padding: "14px 16px", textAlign: "right" }}>
								<span
									className="font-body text-ink-disabled"
									style={{ fontSize: 12, fontFamily: "monospace" }}
								>
									{formatCurrency(
										totalRevenue > 0
											? Math.round(
													totalRevenue /
														PAYMENT_TRANSACTIONS.reduce((a, b) => a + b, 0),
												)
											: 0,
									)}
								</span>
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
	const [period, setPeriod] = useState<Period>("Hoy");
	const [orders, setOrders] = useState<Order[]>([]);
	const [currentHour, setCurrentHour] = useState("");

	const fetchOrders = useCallback(async () => {
		try {
			const data = await apiFetch<Order[]>("/api/orders?includeClosed=true");
			setOrders(data);
		} catch (e) {
			console.error(e);
		}
	}, []);

	useEffect(() => {
		fetchOrders();
		const now = new Date();
		setCurrentHour(now.getHours().toString().padStart(2, "0") + ":00");
	}, [fetchOrders]);

	const today = new Date().toDateString();
	const todayOrders = orders.filter(
		(o) =>
			o.status === "closed" &&
			o.closedAt &&
			new Date(o.closedAt).toDateString() === today,
	);
	const todayRevenue = todayOrders.reduce(
		(s, o) => s + o.items.reduce((si, i) => si + i.qty * i.price, 0),
		0,
	);
	const todayOrderCount = todayOrders.length;

	const data = getPeriodData(period, todayRevenue, todayOrderCount);

	return (
		<div style={{ minHeight: "100vh" }} className="p-5 md:p-7">
			{/* Header with period tabs */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-7">
				<div>
					<h1
						className="font-display text-ink-primary"
						style={{ fontSize: 20, fontWeight: 700 }}
					>
						Analíticas
					</h1>
					<div
						className="font-body text-ink-disabled mt-1"
						style={{ fontSize: 12 }}
					>
						Métricas de rendimiento
					</div>
				</div>
				<div
					className="flex items-center gap-0.5 p-1 rounded-xl"
					style={{ background: "var(--s2)", border: "1px solid var(--s3)" }}
				>
					{PERIODS.map((p) => (
						<button
							key={p}
							onClick={() => setPeriod(p)}
							style={{
								padding: "6px 16px",
								borderRadius: 10,
								background: period === p ? "#f59e0b" : "transparent",
								color: period === p ? "#0a0a0a" : "#666",
								fontFamily: "var(--font-syne)",
								fontWeight: 600,
								fontSize: 11,
								letterSpacing: "0.1em",
								border: "none",
								cursor: "pointer",
								transition: "all 0.15s",
								boxShadow:
									period === p ? "0 0 8px rgba(245,158,11,0.3)" : "none",
							}}
						>
							{p}
						</button>
					))}
				</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				<KpiRow
					revenue={data.revenue}
					orders={data.orders}
					avgTicket={data.avgTicket}
					bestLabel={data.bestLabel}
					deltaRevenue={data.deltaRevenue}
					deltaOrders={data.deltaOrders}
				/>

				{period === "Hoy" && (
					<RevenueByHourChart
						revenue={data.revenue}
						currentHour={currentHour}
					/>
				)}
				{period === "Esta semana" && (
					<div className="grid gap-6 grid-cols-1 md:grid-cols-2">
						<WeeklyRevenueChart />
						<RevenueByCategoryDonut />
					</div>
				)}
				{period === "Este mes" && <MonthlyTrendChart />}

				{period === "Hoy" && (
					<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
						<RevenueByCategoryDonut />
						<WeeklyRevenueChart />
					</div>
				)}

				<PaymentMethodsTable totalRevenue={data.revenue} />
			</div>
		</div>
	);
}
