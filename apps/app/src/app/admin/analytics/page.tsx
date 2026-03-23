"use client";

import { useState, useEffect, useMemo } from "react";
import {
	DollarSign,
	ShoppingBag,
	Receipt,
	Wallet,
	FileText,
	Landmark,
	TrendingUp,
	AlertTriangle,
	Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
	id: string;
	name: string;
	qty: number;
	price: number;
	target: string;
}

interface Order {
	id: string;
	status: string;
	paymentMethod: string | null;
	createdAt: string;
	closedAt: string | null;
	items: OrderItem[];
}

interface Expense {
	id: string;
	amount: number;
	date: string;
	category: { id: string; name: string } | null;
}

interface Invoice {
	id: string;
	status: string;
	total: number;
	cae: string | null;
	createdAt: string;
}

interface CashRegister {
	id: string;
	date: string;
	status: string;
	openingBalance: number;
	closingBalance: number | null;
	openedAt: string;
	closedAt: string | null;
	_count?: { movements: number };
}

// ─── Period logic ────────────────────────────────────────────────────────────

const PERIODS = ["Hoy", "Esta Semana", "Este Mes"] as const;
type Period = (typeof PERIODS)[number];

function startOfToday(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

function startOfWeek(): Date {
	const d = new Date();
	const day = d.getDay();
	const diff = day === 0 ? 6 : day - 1; // Monday start
	d.setDate(d.getDate() - diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function startOfMonth(): Date {
	const d = new Date();
	d.setDate(1);
	d.setHours(0, 0, 0, 0);
	return d;
}

function periodStart(p: Period): Date {
	if (p === "Hoy") return startOfToday();
	if (p === "Esta Semana") return startOfWeek();
	return startOfMonth();
}

function inPeriod(dateStr: string | null, start: Date): boolean {
	if (!dateStr) return false;
	return new Date(dateStr) >= start;
}

// ─── Bar colors ──────────────────────────────────────────────────────────────

const BAR_COLORS = [
	"#f59e0b",
	"#f97316",
	"#ec4899",
	"#22c55e",
	"#8b5cf6",
	"#06b6d4",
	"#ef4444",
	"#14b8a6",
	"#a855f7",
	"#64748b",
];

const PAYMENT_COLORS: Record<string, string> = {
	cash: "#f59e0b",
	mercadopago: "#3b82f6",
	card: "#8b5cf6",
};

const PAYMENT_LABELS: Record<string, string> = {
	cash: "Efectivo",
	mercadopago: "MercadoPago",
	card: "Tarjeta",
};

// ─── Horizontal bar helper ───────────────────────────────────────────────────

function HBar({
	items,
	title,
	subtitle,
}: {
	items: { label: string; value: number; color: string }[];
	title: string;
	subtitle: string;
}) {
	const max = Math.max(...items.map((i) => i.value), 1);
	const total = items.reduce((s, i) => s + i.value, 0);

	return (
		<div className="card" style={{ padding: 24 }}>
			<h3
				className="font-display text-ink-primary"
				style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}
			>
				{title}
			</h3>
			<div
				className="font-body text-ink-disabled"
				style={{ fontSize: 11, marginBottom: 16 }}
			>
				{subtitle}
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
				{items.map((item) => {
					const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
					return (
						<div key={item.label}>
							<div
								className="flex items-center justify-between"
								style={{ marginBottom: 4 }}
							>
								<span
									className="font-body text-ink-secondary"
									style={{ fontSize: 12 }}
								>
									{item.label}
								</span>
								<span
									className="font-body text-ink-disabled"
									style={{ fontSize: 11, fontFamily: "monospace" }}
								>
									{formatCurrency(item.value)} ({pct}%)
								</span>
							</div>
							<div
								style={{
									width: "100%",
									height: 8,
									borderRadius: 4,
									background: "var(--s3)",
									overflow: "hidden",
								}}
							>
								<div
									style={{
										width: `${(item.value / max) * 100}%`,
										height: "100%",
										borderRadius: 4,
										background: item.color,
										transition: "width 0.3s",
									}}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
	const [period, setPeriod] = useState<Period>("Hoy");
	const [orders, setOrders] = useState<Order[]>([]);
	const [expenses, setExpenses] = useState<Expense[]>([]);
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [registers, setRegisters] = useState<CashRegister[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			setLoading(true);
			setError(null);
			try {
				const [o, e, i, r] = await Promise.all([
					apiFetch<Order[]>("/api/orders?includeClosed=true"),
					apiFetch<Expense[]>("/api/expenses"),
					apiFetch<Invoice[]>("/api/invoices"),
					apiFetch<CashRegister[]>("/api/cash-register"),
				]);
				if (!cancelled) {
					setOrders(o);
					setExpenses(e);
					setInvoices(i);
					setRegisters(r);
				}
			} catch (err) {
				if (!cancelled) setError(String(err));
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, []);

	// ─── Filtered data ────────────────────────────────────────────────────────

	const start = useMemo(() => periodStart(period), [period]);

	const closedOrders = useMemo(
		() =>
			orders.filter(
				(o) =>
					o.status === "closed" && o.closedAt && inPeriod(o.closedAt, start),
			),
		[orders, start],
	);

	const periodExpenses = useMemo(
		() => expenses.filter((e) => inPeriod(e.date, start)),
		[expenses, start],
	);

	const periodInvoices = useMemo(
		() => invoices.filter((i) => inPeriod(i.createdAt, start)),
		[invoices, start],
	);

	// ─── KPIs ─────────────────────────────────────────────────────────────────

	const revenue = useMemo(
		() =>
			closedOrders.reduce(
				(s, o) => s + o.items.reduce((si, i) => si + i.qty * i.price, 0),
				0,
			),
		[closedOrders],
	);

	const orderCount = closedOrders.length;
	const avgTicket = orderCount > 0 ? Math.round(revenue / orderCount) : 0;
	const totalExpenses = useMemo(
		() => periodExpenses.reduce((s, e) => s + e.amount, 0),
		[periodExpenses],
	);

	// ─── P&L ──────────────────────────────────────────────────────────────────

	const mercaderiaExpenses = useMemo(
		() =>
			periodExpenses
				.filter((e) => e.category?.name === "Mercadería")
				.reduce((s, e) => s + e.amount, 0),
		[periodExpenses],
	);

	const personalExpenses = useMemo(
		() =>
			periodExpenses
				.filter((e) => e.category?.name === "Personal")
				.reduce((s, e) => s + e.amount, 0),
		[periodExpenses],
	);

	const resultado = revenue - totalExpenses;
	const foodCostPct = revenue > 0 ? (mercaderiaExpenses / revenue) * 100 : 0;
	const primeCostPct =
		revenue > 0 ? ((mercaderiaExpenses + personalExpenses) / revenue) * 100 : 0;

	// ─── Payment method breakdown ─────────────────────────────────────────────

	const paymentBreakdown = useMemo(() => {
		const map: Record<string, { amount: number; count: number }> = {};
		for (const o of closedOrders) {
			const method = o.paymentMethod || "cash";
			const total = o.items.reduce((s, i) => s + i.qty * i.price, 0);
			if (!map[method]) map[method] = { amount: 0, count: 0 };
			map[method].amount += total;
			map[method].count += 1;
		}
		return Object.entries(map)
			.map(([method, data]) => ({
				method,
				label: PAYMENT_LABELS[method] || method,
				color: PAYMENT_COLORS[method] || "#64748b",
				...data,
			}))
			.sort((a, b) => b.amount - a.amount);
	}, [closedOrders]);

	const paymentTotal = paymentBreakdown.reduce((s, p) => s + p.amount, 0);

	// ─── Category breakdown ───────────────────────────────────────────────────

	const categoryBreakdown = useMemo(() => {
		const map: Record<string, number> = {};
		for (const o of closedOrders) {
			for (const item of o.items) {
				const cat = item.name; // use item name as proxy
				// group by product name — we don't have category name on order items
				// Actually let's accumulate by item name
				map[item.name] = (map[item.name] || 0) + item.qty * item.price;
			}
		}
		return Object.entries(map)
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value)
			.slice(0, 10);
	}, [closedOrders]);

	// ─── Expense breakdown by category ────────────────────────────────────────

	const expenseBreakdown = useMemo(() => {
		const map: Record<string, number> = {};
		for (const e of periodExpenses) {
			const cat = e.category?.name || "Sin categoría";
			map[cat] = (map[cat] || 0) + e.amount;
		}
		return Object.entries(map)
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);
	}, [periodExpenses]);

	// ─── Hourly revenue (today only) ─────────────────────────────────────────

	const hourlyRevenue = useMemo(() => {
		if (period !== "Hoy") return [];
		const hours: Record<number, number> = {};
		for (const o of closedOrders) {
			if (!o.closedAt) continue;
			const h = new Date(o.closedAt).getHours();
			const total = o.items.reduce((s, i) => s + i.qty * i.price, 0);
			hours[h] = (hours[h] || 0) + total;
		}
		// Return all 24 hours but only those with data, or range 10-03
		const entries = Object.entries(hours)
			.map(([h, v]) => ({ hour: Number(h), value: v }))
			.sort((a, b) => a.hour - b.hour);
		return entries;
	}, [closedOrders, period]);

	// ─── AFIP summary ─────────────────────────────────────────────────────────

	const afipAuthorized = useMemo(
		() => periodInvoices.filter((i) => i.status === "authorized").length,
		[periodInvoices],
	);
	const afipTotal = useMemo(
		() =>
			periodInvoices
				.filter((i) => i.status === "authorized")
				.reduce((s, i) => s + i.total, 0),
		[periodInvoices],
	);
	const afipPending = useMemo(
		() => periodInvoices.filter((i) => i.status === "draft").length,
		[periodInvoices],
	);

	// ─── Cash register ────────────────────────────────────────────────────────

	const todayRegister = useMemo(() => {
		const today = new Date().toDateString();
		return registers.find((r) => new Date(r.date).toDateString() === today);
	}, [registers]);

	const lastClosed = useMemo(
		() => registers.find((r) => r.status === "closed"),
		[registers],
	);

	// ─── Render ───────────────────────────────────────────────────────────────

	if (loading) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ background: "var(--s0)" }}
			>
				<Loader2
					size={32}
					className="animate-spin"
					style={{ color: "var(--gold)" }}
				/>
			</div>
		);
	}

	if (error) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ background: "var(--s0)" }}
			>
				<div
					className="card p-6"
					style={{ maxWidth: 400, textAlign: "center" }}
				>
					<AlertTriangle
						size={32}
						style={{ color: "#ef4444", margin: "0 auto 12px" }}
					/>
					<p className="font-body text-ink-secondary" style={{ fontSize: 13 }}>
						Error cargando datos
					</p>
					<p
						className="font-body text-ink-disabled mt-2"
						style={{ fontSize: 11 }}
					>
						{error}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className="min-h-screen p-5 md:p-7 pb-10"
			style={{ background: "var(--s0)" }}
		>
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-7">
				<div>
					<h1
						className="font-kds"
						style={{
							fontSize: 40,
							lineHeight: 1,
							color: "var(--gold)",
							letterSpacing: "0.04em",
						}}
					>
						ANALITICAS
					</h1>
					<div
						className="font-body text-ink-disabled mt-1"
						style={{ fontSize: 12 }}
					>
						Datos en tiempo real del sistema
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

			<div className="divider-gold mb-7" />

			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				{/* ── 1. KPI Row ──────────────────────────────────────────── */}
				<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
					{[
						{
							label: "Ingresos",
							value: formatCurrency(revenue),
							icon: DollarSign,
							accent: true,
						},
						{
							label: "Pedidos",
							value: String(orderCount),
							icon: ShoppingBag,
							accent: false,
						},
						{
							label: "Ticket Promedio",
							value: formatCurrency(avgTicket),
							icon: Receipt,
							accent: false,
						},
						{
							label: "Gastos del Período",
							value: formatCurrency(totalExpenses),
							icon: Wallet,
							accent: false,
						},
					].map(({ label, value, icon: Icon, accent }) => (
						<div
							key={label}
							className="card p-5"
							style={{
								position: "relative",
								overflow: "hidden",
								...(accent
									? {
											borderColor: "rgba(245,158,11,0.25)",
											boxShadow: "0 0 24px rgba(245,158,11,0.08)",
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
								className="flex items-center justify-between mb-4"
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
										width: 32,
										height: 32,
										borderRadius: 9,
										background: accent ? "rgba(245,158,11,0.2)" : "var(--s3)",
										border: accent
											? "1px solid rgba(245,158,11,0.3)"
											: "1px solid var(--s4)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Icon
										size={14}
										style={{ color: accent ? "#f59e0b" : "#888" }}
									/>
								</div>
							</div>
							<div style={{ position: "relative", zIndex: 1 }}>
								<div
									className="font-kds"
									style={{
										fontSize: accent ? 36 : 30,
										lineHeight: 1,
										color: accent ? "#f59e0b" : "#e5e5e5",
									}}
								>
									{value}
								</div>
							</div>
						</div>
					))}
				</div>

				{/* ── 2. P&L Summary ─────────────────────────────────────── */}
				<div className="card-gold" style={{ padding: 24, borderRadius: 14 }}>
					<h3
						className="font-display text-ink-primary"
						style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}
					>
						Resultado del Período
					</h3>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 10,
						}}
					>
						<div className="flex items-center justify-between">
							<span
								className="font-body text-ink-secondary"
								style={{ fontSize: 13 }}
							>
								Ingresos totales
							</span>
							<span
								className="font-body"
								style={{
									fontSize: 14,
									fontFamily: "monospace",
									color: "#22c55e",
								}}
							>
								{formatCurrency(revenue)}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span
								className="font-body text-ink-secondary"
								style={{ fontSize: 13 }}
							>
								- Gastos totales
							</span>
							<span
								className="font-body"
								style={{
									fontSize: 14,
									fontFamily: "monospace",
									color: "#ef4444",
								}}
							>
								{formatCurrency(totalExpenses)}
							</span>
						</div>
						<div
							style={{
								borderTop: "1px solid var(--s4)",
								paddingTop: 10,
								marginTop: 4,
							}}
						>
							<div className="flex items-center justify-between">
								<span
									className="font-display text-ink-primary"
									style={{ fontSize: 14, fontWeight: 700 }}
								>
									= Resultado
								</span>
								<span
									className="font-kds"
									style={{
										fontSize: 28,
										color: resultado >= 0 ? "#22c55e" : "#ef4444",
									}}
								>
									{formatCurrency(resultado)}
								</span>
							</div>
						</div>
						<div
							className="grid grid-cols-2 gap-4 mt-3 pt-3"
							style={{ borderTop: "1px solid var(--s3)" }}
						>
							<div>
								<div
									className="font-display text-ink-disabled uppercase"
									style={{ fontSize: 9, letterSpacing: "0.2em" }}
								>
									Food Cost %
								</div>
								<div className="flex items-center gap-2 mt-1">
									<span
										className="font-kds"
										style={{
											fontSize: 22,
											color: foodCostPct <= 30 ? "#22c55e" : "#ef4444",
										}}
									>
										{foodCostPct.toFixed(1)}%
									</span>
									<span
										className="font-body text-ink-disabled"
										style={{ fontSize: 10 }}
									>
										target &lt;30%
									</span>
								</div>
							</div>
							<div>
								<div
									className="font-display text-ink-disabled uppercase"
									style={{ fontSize: 9, letterSpacing: "0.2em" }}
								>
									Prime Cost %
								</div>
								<div className="flex items-center gap-2 mt-1">
									<span
										className="font-kds"
										style={{
											fontSize: 22,
											color: primeCostPct <= 60 ? "#22c55e" : "#ef4444",
										}}
									>
										{primeCostPct.toFixed(1)}%
									</span>
									<span
										className="font-body text-ink-disabled"
										style={{ fontSize: 10 }}
									>
										target &lt;60%
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* ── 3. Payment Methods ──────────────────────────────────── */}
				{paymentBreakdown.length > 0 && (
					<div className="card" style={{ padding: 24 }}>
						<h3
							className="font-display text-ink-primary"
							style={{
								fontSize: 13,
								fontWeight: 700,
								marginBottom: 2,
							}}
						>
							Ingresos por Método de Pago
						</h3>
						<div
							className="font-body text-ink-disabled"
							style={{ fontSize: 11, marginBottom: 16 }}
						>
							Desglose de pedidos cerrados
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 12,
							}}
						>
							{paymentBreakdown.map((pm) => {
								const pct =
									paymentTotal > 0
										? ((pm.amount / paymentTotal) * 100).toFixed(1)
										: "0";
								return (
									<div key={pm.method}>
										<div
											className="flex items-center justify-between"
											style={{ marginBottom: 6 }}
										>
											<div className="flex items-center gap-2">
												<div
													style={{
														width: 10,
														height: 10,
														borderRadius: "50%",
														background: pm.color,
														flexShrink: 0,
													}}
												/>
												<span
													className="font-body text-ink-primary"
													style={{ fontSize: 13 }}
												>
													{pm.label}
												</span>
												<span
													className="font-body text-ink-disabled"
													style={{ fontSize: 11 }}
												>
													({pm.count} {pm.count === 1 ? "pedido" : "pedidos"})
												</span>
											</div>
											<div className="flex items-center gap-3">
												<span
													className="font-display text-ink-secondary"
													style={{
														fontSize: 11,
														fontWeight: 700,
													}}
												>
													{pct}%
												</span>
												<span
													className="font-body text-ink-secondary"
													style={{
														fontSize: 13,
														fontFamily: "monospace",
														minWidth: 100,
														textAlign: "right",
													}}
												>
													{formatCurrency(pm.amount)}
												</span>
											</div>
										</div>
										<div
											style={{
												width: "100%",
												height: 8,
												borderRadius: 4,
												background: "var(--s3)",
												overflow: "hidden",
											}}
										>
											<div
												style={{
													width: `${paymentTotal > 0 ? (pm.amount / paymentTotal) * 100 : 0}%`,
													height: "100%",
													borderRadius: 4,
													background: pm.color,
													transition: "width 0.3s",
												}}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* ── 4. Revenue by Product ───────────────────────────────── */}
				{categoryBreakdown.length > 0 && (
					<HBar
						title="Ingresos por Producto"
						subtitle="Top 10 productos por monto vendido"
						items={categoryBreakdown.map((c, i) => ({
							label: c.name,
							value: c.value,
							color: BAR_COLORS[i % BAR_COLORS.length],
						}))}
					/>
				)}

				{/* ── 5. Expense Breakdown ────────────────────────────────── */}
				{expenseBreakdown.length > 0 && (
					<HBar
						title="Desglose de Gastos"
						subtitle="Gastos agrupados por categoría"
						items={expenseBreakdown.map((e, i) => ({
							label: e.name,
							value: e.value,
							color: BAR_COLORS[i % BAR_COLORS.length],
						}))}
					/>
				)}

				{/* ── 6. Hourly Revenue (Hoy only) ────────────────────────── */}
				{period === "Hoy" && hourlyRevenue.length > 0 && (
					<div className="card" style={{ padding: 24 }}>
						<div className="flex items-center justify-between mb-6">
							<div>
								<h3
									className="font-display text-ink-primary"
									style={{ fontSize: 13, fontWeight: 700 }}
								>
									Ingresos por Hora
								</h3>
								<div
									className="font-body text-ink-disabled mt-0.5"
									style={{ fontSize: 11 }}
								>
									Pedidos cerrados hoy por hora
								</div>
							</div>
							<div style={{ textAlign: "right" }}>
								<div
									className="font-kds"
									style={{
										fontSize: 22,
										lineHeight: 1,
										color: "var(--gold)",
									}}
								>
									{formatCurrency(revenue)}
								</div>
								<div
									className="font-body text-ink-disabled"
									style={{ fontSize: 10 }}
								>
									total hoy
								</div>
							</div>
						</div>
						{(() => {
							const maxH = Math.max(...hourlyRevenue.map((h) => h.value), 1);
							const nowHour = new Date().getHours();
							return (
								<div className="flex items-end gap-2" style={{ height: 200 }}>
									{hourlyRevenue.map((h) => {
										const heightPct = (h.value / maxH) * 100;
										const isCurrent = h.hour === nowHour;
										return (
											<div
												key={h.hour}
												className="flex-1 flex flex-col items-center gap-1.5 h-full"
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
														{Math.round(h.value / 1000)}k
													</span>
													<div
														style={{
															width: "100%",
															height: `${heightPct}%`,
															minHeight: 2,
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
													}}
												>
													{String(h.hour).padStart(2, "0")}
													:00
												</span>
											</div>
										);
									})}
								</div>
							);
						})()}
					</div>
				)}

				{/* ── 7. AFIP Summary ─────────────────────────────────────── */}
				<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
					<div className="card" style={{ padding: 24 }}>
						<div className="flex items-center gap-2 mb-4">
							<FileText size={16} style={{ color: "var(--gold)" }} />
							<h3
								className="font-display text-ink-primary"
								style={{ fontSize: 13, fontWeight: 700 }}
							>
								AFIP - Facturación
							</h3>
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 12,
							}}
						>
							<div className="flex items-center justify-between">
								<span
									className="font-body text-ink-secondary"
									style={{ fontSize: 12 }}
								>
									Facturas autorizadas
								</span>
								<span
									className="font-kds"
									style={{ fontSize: 24, color: "#22c55e" }}
								>
									{afipAuthorized}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span
									className="font-body text-ink-secondary"
									style={{ fontSize: 12 }}
								>
									Total facturado
								</span>
								<span
									className="font-body"
									style={{
										fontSize: 14,
										fontFamily: "monospace",
										color: "#e5e5e5",
									}}
								>
									{formatCurrency(afipTotal)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span
									className="font-body text-ink-secondary"
									style={{ fontSize: 12 }}
								>
									Pendientes (borrador)
								</span>
								<span
									className="font-kds"
									style={{
										fontSize: 24,
										color: afipPending > 0 ? "#f59e0b" : "#666",
									}}
								>
									{afipPending}
								</span>
							</div>
						</div>
					</div>

					{/* ── 8. Cash Register ────────────────────────────────── */}
					<div className="card" style={{ padding: 24 }}>
						<div className="flex items-center gap-2 mb-4">
							<Landmark size={16} style={{ color: "var(--gold)" }} />
							<h3
								className="font-display text-ink-primary"
								style={{ fontSize: 13, fontWeight: 700 }}
							>
								Caja Registradora
							</h3>
						</div>
						{todayRegister ? (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 12,
								}}
							>
								<div className="flex items-center justify-between">
									<span
										className="font-body text-ink-secondary"
										style={{ fontSize: 12 }}
									>
										Estado
									</span>
									<span
										className="badge"
										style={{
											background:
												todayRegister.status === "open"
													? "rgba(34,197,94,0.15)"
													: "rgba(100,116,139,0.15)",
											color:
												todayRegister.status === "open" ? "#22c55e" : "#94a3b8",
											fontSize: 11,
											padding: "3px 10px",
											borderRadius: 6,
										}}
									>
										{todayRegister.status === "open" ? "Abierta" : "Cerrada"}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span
										className="font-body text-ink-secondary"
										style={{ fontSize: 12 }}
									>
										Saldo apertura
									</span>
									<span
										className="font-body"
										style={{
											fontSize: 14,
											fontFamily: "monospace",
											color: "#e5e5e5",
										}}
									>
										{formatCurrency(todayRegister.openingBalance)}
									</span>
								</div>
								{todayRegister.closingBalance != null && (
									<div className="flex items-center justify-between">
										<span
											className="font-body text-ink-secondary"
											style={{ fontSize: 12 }}
										>
											Saldo cierre
										</span>
										<span
											className="font-kds"
											style={{
												fontSize: 24,
												color: "var(--gold)",
											}}
										>
											{formatCurrency(todayRegister.closingBalance)}
										</span>
									</div>
								)}
							</div>
						) : lastClosed ? (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 12,
								}}
							>
								<div
									className="font-body text-ink-disabled"
									style={{ fontSize: 12 }}
								>
									No hay caja abierta hoy
								</div>
								<div className="flex items-center justify-between">
									<span
										className="font-body text-ink-secondary"
										style={{ fontSize: 12 }}
									>
										Ultimo cierre
									</span>
									<span
										className="font-body"
										style={{
											fontSize: 13,
											fontFamily: "monospace",
											color: "#e5e5e5",
										}}
									>
										{formatCurrency(lastClosed.closingBalance ?? 0)}
									</span>
								</div>
								<div
									className="font-body text-ink-disabled"
									style={{ fontSize: 10 }}
								>
									{new Date(
										lastClosed.closedAt ?? lastClosed.date,
									).toLocaleDateString("es-AR")}
								</div>
							</div>
						) : (
							<div
								className="font-body text-ink-disabled"
								style={{ fontSize: 12 }}
							>
								Sin registros de caja
							</div>
						)}
					</div>
				</div>

				{/* ── Empty state ──────────────────────────────────────────── */}
				{orderCount === 0 &&
					totalExpenses === 0 &&
					periodInvoices.length === 0 && (
						<div className="card" style={{ padding: 40, textAlign: "center" }}>
							<TrendingUp
								size={32}
								style={{
									color: "#555",
									margin: "0 auto 12px",
								}}
							/>
							<p
								className="font-body text-ink-disabled"
								style={{ fontSize: 13 }}
							>
								No hay datos para este período
							</p>
						</div>
					)}
			</div>
		</div>
	);
}
