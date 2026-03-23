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
	BarChart3,
	CreditCard,
	Package,
	FolderOpen,
	Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface OItem {
	id: string;
	name: string;
	qty: number;
	price: number;
	target: string;
}
interface Ord {
	id: string;
	status: string;
	paymentMethod: string | null;
	createdAt: string;
	closedAt: string | null;
	items: OItem[];
}
interface Exp {
	id: string;
	amount: number;
	date: string;
	category: { id: string; name: string } | null;
}
interface Inv {
	id: string;
	status: string;
	total: number;
	cae: string | null;
	createdAt: string;
}
interface CReg {
	id: string;
	date: string;
	status: string;
	openingBalance: number;
	closingBalance: number | null;
	closedAt: string | null;
}

const PERIODS = ["Hoy", "Esta Semana", "Este Mes"] as const;
type Period = (typeof PERIODS)[number];

function sod(d: Date) {
	d.setHours(0, 0, 0, 0);
	return d;
}
function periodStart(p: Period): Date {
	const d = new Date();
	if (p === "Hoy") return sod(d);
	if (p === "Esta Semana") {
		const day = d.getDay();
		d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
		return sod(d);
	}
	d.setDate(1);
	return sod(d);
}
function inP(ds: string | null, s: Date) {
	return ds ? new Date(ds) >= s : false;
}
function orderTotal(o: Ord) {
	return o.items.reduce((s, i) => s + i.qty * i.price, 0);
}

const COLORS = [
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
const PM_C: Record<string, string> = {
	cash: "#f59e0b",
	mercadopago: "#3b82f6",
	card: "#8b5cf6",
};
const PM_L: Record<string, string> = {
	cash: "Efectivo",
	mercadopago: "MercadoPago",
	card: "Tarjeta",
};

/* ─── KPI Card ──────────────────────────────────────────────────────────── */
function Kpi({
	label,
	value,
	Icon,
	color = "#e5e5e5",
}: {
	label: string;
	value: string;
	Icon: React.ElementType;
	color?: string;
}) {
	return (
		<div
			style={{
				background: "var(--s1)",
				border: `1px solid ${color}25`,
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
					background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 0,
					right: 0,
					width: 120,
					height: 120,
					background: `radial-gradient(circle at 100% 0%, ${color}12 0%, transparent 70%)`,
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
						{label}
					</div>
					<div
						style={{
							width: 34,
							height: 34,
							borderRadius: 10,
							background: `${color}15`,
							border: `1px solid ${color}30`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Icon size={16} style={{ color }} />
					</div>
				</div>
				<div
					className="font-kds"
					style={{ fontSize: 36, lineHeight: 1, color }}
				>
					{value}
				</div>
			</div>
		</div>
	);
}

/* ─── Section Card ──────────────────────────────────────────────────────── */
function SectionCard({
	title,
	Icon,
	children,
	rightHeader,
}: {
	title: string;
	Icon: React.ElementType;
	children: React.ReactNode;
	rightHeader?: React.ReactNode;
}) {
	return (
		<div
			style={{
				background: "var(--s1)",
				border: "1px solid var(--s4)",
				borderRadius: 16,
				overflow: "hidden",
				boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
			}}
		>
			<div
				className="flex items-center justify-between"
				style={{
					padding: "14px 20px",
					borderBottom: "1px solid var(--s3)",
					background: "var(--s2)",
				}}
			>
				<div className="flex items-center gap-2.5">
					<Icon size={14} style={{ color: "var(--gold)" }} />
					<span
						className="font-display uppercase"
						style={{
							fontSize: 11,
							letterSpacing: "0.15em",
							color: "#ccc",
							fontWeight: 600,
						}}
					>
						{title}
					</span>
				</div>
				{rightHeader}
			</div>
			{children}
		</div>
	);
}

/* ─── Horizontal bars ────────────────────────────────────────────────────── */
function HBar({
	items,
	title,
	sub,
	Icon,
}: {
	items: { l: string; v: number; c: string }[];
	title: string;
	sub: string;
	Icon: React.ElementType;
}) {
	const mx = Math.max(...items.map((i) => i.v), 1);
	const tot = items.reduce((s, i) => s + i.v, 0);
	return (
		<SectionCard title={title} Icon={Icon}>
			<div style={{ padding: "6px 20px 8px" }}>
				<div
					className="font-body"
					style={{ fontSize: 11, color: "#666", marginBottom: 16 }}
				>
					{sub}
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
					{items.map((it) => (
						<div key={it.l}>
							<div
								className="flex items-center justify-between"
								style={{ marginBottom: 4 }}
							>
								<span
									className="font-body"
									style={{ fontSize: 12, color: "#bbb" }}
								>
									{it.l}
								</span>
								<span
									className="font-body"
									style={{
										fontSize: 11,
										fontFamily: "monospace",
										color: "#888",
									}}
								>
									{formatCurrency(it.v)} (
									{tot > 0 ? ((it.v / tot) * 100).toFixed(1) : "0"}%)
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
										width: `${(it.v / mx) * 100}%`,
										height: "100%",
										borderRadius: 4,
										background: it.c,
										boxShadow: `0 0 8px ${it.c}40`,
										transition: "width .3s",
									}}
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</SectionCard>
	);
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
	const [period, setPeriod] = useState<Period>("Hoy");
	const [orders, setOrders] = useState<Ord[]>([]);
	const [expenses, setExpenses] = useState<Exp[]>([]);
	const [invoices, setInvoices] = useState<Inv[]>([]);
	const [registers, setRegisters] = useState<CReg[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let c = false;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const [o, e, i, r] = await Promise.all([
					apiFetch<Ord[]>("/api/orders?includeClosed=true"),
					apiFetch<Exp[]>("/api/expenses"),
					apiFetch<Inv[]>("/api/invoices"),
					apiFetch<CReg[]>("/api/cash-register"),
				]);
				if (!c) {
					setOrders(o);
					setExpenses(e);
					setInvoices(i);
					setRegisters(r);
				}
			} catch (err) {
				if (!c) setError(String(err));
			} finally {
				if (!c) setLoading(false);
			}
		})();
		return () => {
			c = true;
		};
	}, []);

	const start = useMemo(() => periodStart(period), [period]);
	const closed = useMemo(
		() =>
			orders.filter(
				(o) => o.status === "closed" && o.closedAt && inP(o.closedAt, start),
			),
		[orders, start],
	);
	const pExp = useMemo(
		() => expenses.filter((e) => inP(e.date, start)),
		[expenses, start],
	);
	const pInv = useMemo(
		() => invoices.filter((i) => inP(i.createdAt, start)),
		[invoices, start],
	);

	const revenue = useMemo(
		() => closed.reduce((s, o) => s + orderTotal(o), 0),
		[closed],
	);
	const cnt = closed.length;
	const avgTicket = cnt > 0 ? Math.round(revenue / cnt) : 0;
	const totExp = useMemo(() => pExp.reduce((s, e) => s + e.amount, 0), [pExp]);

	const mercExp = useMemo(
		() =>
			pExp
				.filter((e) => e.category?.name === "Mercaderia")
				.reduce((s, e) => s + e.amount, 0),
		[pExp],
	);
	const persExp = useMemo(
		() =>
			pExp
				.filter((e) => e.category?.name === "Personal")
				.reduce((s, e) => s + e.amount, 0),
		[pExp],
	);
	const resultado = revenue - totExp;
	const foodPct = revenue > 0 ? (mercExp / revenue) * 100 : 0;
	const primePct = revenue > 0 ? ((mercExp + persExp) / revenue) * 100 : 0;

	const pmBreak = useMemo(() => {
		const m: Record<string, { amt: number; n: number }> = {};
		for (const o of closed) {
			const k = o.paymentMethod || "cash";
			const t = orderTotal(o);
			if (!m[k]) m[k] = { amt: 0, n: 0 };
			m[k].amt += t;
			m[k].n++;
		}
		return Object.entries(m)
			.map(([k, v]) => ({
				k,
				label: PM_L[k] || k,
				color: PM_C[k] || "#64748b",
				...v,
			}))
			.sort((a, b) => b.amt - a.amt);
	}, [closed]);
	const pmTotal = pmBreak.reduce((s, p) => s + p.amt, 0);

	const prodBreak = useMemo(() => {
		const m: Record<string, number> = {};
		for (const o of closed)
			for (const i of o.items) m[i.name] = (m[i.name] || 0) + i.qty * i.price;
		return Object.entries(m)
			.map(([n, v]) => ({ n, v }))
			.sort((a, b) => b.v - a.v)
			.slice(0, 10);
	}, [closed]);

	const expBreak = useMemo(() => {
		const m: Record<string, number> = {};
		for (const e of pExp) {
			const c = e.category?.name || "Sin categoria";
			m[c] = (m[c] || 0) + e.amount;
		}
		return Object.entries(m)
			.map(([n, v]) => ({ n, v }))
			.sort((a, b) => b.v - a.v);
	}, [pExp]);

	const hourly = useMemo(() => {
		if (period !== "Hoy") return [];
		const h: Record<number, number> = {};
		for (const o of closed) {
			if (!o.closedAt) continue;
			const hr = new Date(o.closedAt).getHours();
			h[hr] = (h[hr] || 0) + orderTotal(o);
		}
		return Object.entries(h)
			.map(([k, v]) => ({ hr: Number(k), v }))
			.sort((a, b) => a.hr - b.hr);
	}, [closed, period]);

	const afipAuth = useMemo(
		() => pInv.filter((i) => i.status === "authorized"),
		[pInv],
	);
	const afipPend = useMemo(
		() => pInv.filter((i) => i.status === "draft").length,
		[pInv],
	);

	const todayReg = useMemo(() => {
		const t = new Date().toDateString();
		return registers.find((r) => new Date(r.date).toDateString() === t);
	}, [registers]);
	const lastClosed = useMemo(
		() => registers.find((r) => r.status === "closed"),
		[registers],
	);

	if (loading)
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

	if (error)
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ background: "var(--s0)" }}
			>
				<div
					style={{
						background: "var(--s1)",
						border: "1px solid var(--s4)",
						borderRadius: 16,
						padding: 32,
						maxWidth: 400,
						textAlign: "center",
						boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
					}}
				>
					<AlertTriangle
						size={32}
						style={{ color: "#ef4444", margin: "0 auto 12px" }}
					/>
					<p className="font-body" style={{ fontSize: 13, color: "#bbb" }}>
						Error cargando datos
					</p>
					<p
						className="font-body"
						style={{ fontSize: 11, color: "#666", marginTop: 8 }}
					>
						{error}
					</p>
				</div>
			</div>
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
								ANALITICAS
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								Datos en tiempo real del sistema
							</p>
						</div>
					</div>
					{/* Period selector */}
					<div
						className="flex items-center gap-0.5"
						style={{
							padding: 4,
							borderRadius: 12,
							background: "var(--s2)",
							border: "1px solid var(--s3)",
						}}
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
									transition: "all .15s",
									boxShadow:
										period === p ? "0 0 8px rgba(245,158,11,0.3)" : "none",
								}}
							>
								{p}
							</button>
						))}
					</div>
				</div>
				<div className="divider-gold" style={{ marginBottom: 28 }} />

				<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
					{/* KPI Row */}
					<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
						<Kpi
							label="Ingresos"
							value={formatCurrency(revenue)}
							Icon={DollarSign}
							color="#f59e0b"
						/>
						<Kpi
							label="Pedidos"
							value={String(cnt)}
							Icon={ShoppingBag}
							color="#22c55e"
						/>
						<Kpi
							label="Ticket Promedio"
							value={formatCurrency(avgTicket)}
							Icon={Receipt}
							color="#8b5cf6"
						/>
						<Kpi
							label="Gastos del Periodo"
							value={formatCurrency(totExp)}
							Icon={Wallet}
							color="#ef4444"
						/>
					</div>

					{/* P&L */}
					<SectionCard title="Resultado del Periodo" Icon={BarChart3}>
						<div style={{ padding: "20px 24px" }}>
							<div
								style={{ display: "flex", flexDirection: "column", gap: 10 }}
							>
								<div className="flex items-center justify-between">
									<span
										className="font-body"
										style={{ fontSize: 13, color: "#bbb" }}
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
										className="font-body"
										style={{ fontSize: 13, color: "#bbb" }}
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
										{formatCurrency(totExp)}
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
											className="font-display"
											style={{
												fontSize: 14,
												fontWeight: 700,
												color: "#f5f5f5",
											}}
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
											className="font-display uppercase"
											style={{
												fontSize: 9,
												letterSpacing: "0.2em",
												color: "#888",
											}}
										>
											Food Cost %
										</div>
										<div className="flex items-center gap-2 mt-1">
											<span
												className="font-kds"
												style={{
													fontSize: 22,
													color: foodPct <= 30 ? "#22c55e" : "#ef4444",
												}}
											>
												{foodPct.toFixed(1)}%
											</span>
											<span
												className="font-body"
												style={{ fontSize: 10, color: "#666" }}
											>
												target &lt;30%
											</span>
										</div>
									</div>
									<div>
										<div
											className="font-display uppercase"
											style={{
												fontSize: 9,
												letterSpacing: "0.2em",
												color: "#888",
											}}
										>
											Prime Cost %
										</div>
										<div className="flex items-center gap-2 mt-1">
											<span
												className="font-kds"
												style={{
													fontSize: 22,
													color: primePct <= 60 ? "#22c55e" : "#ef4444",
												}}
											>
												{primePct.toFixed(1)}%
											</span>
											<span
												className="font-body"
												style={{ fontSize: 10, color: "#666" }}
											>
												target &lt;60%
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</SectionCard>

					{/* Payment Methods */}
					{pmBreak.length > 0 && (
						<SectionCard title="Ingresos por Metodo de Pago" Icon={CreditCard}>
							<div style={{ padding: "6px 20px 8px" }}>
								<div
									className="font-body"
									style={{ fontSize: 11, color: "#666", marginBottom: 16 }}
								>
									Desglose de pedidos cerrados
								</div>
								<div
									style={{ display: "flex", flexDirection: "column", gap: 12 }}
								>
									{pmBreak.map((pm) => {
										const pct =
											pmTotal > 0 ? ((pm.amt / pmTotal) * 100).toFixed(1) : "0";
										return (
											<div key={pm.k}>
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
															className="font-body"
															style={{ fontSize: 13, color: "#ddd" }}
														>
															{pm.label}
														</span>
														<span
															className="font-body"
															style={{ fontSize: 11, color: "#666" }}
														>
															({pm.n} {pm.n === 1 ? "pedido" : "pedidos"})
														</span>
													</div>
													<div className="flex items-center gap-3">
														<span
															className="font-display"
															style={{
																fontSize: 11,
																fontWeight: 700,
																color: "#bbb",
															}}
														>
															{pct}%
														</span>
														<span
															className="font-body"
															style={{
																fontSize: 13,
																fontFamily: "monospace",
																color: "#bbb",
																minWidth: 100,
																textAlign: "right" as const,
															}}
														>
															{formatCurrency(pm.amt)}
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
															width: `${pmTotal > 0 ? (pm.amt / pmTotal) * 100 : 0}%`,
															height: "100%",
															borderRadius: 4,
															background: pm.color,
															boxShadow: `0 0 8px ${pm.color}40`,
															transition: "width .3s",
														}}
													/>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</SectionCard>
					)}

					{/* Revenue by Product */}
					{prodBreak.length > 0 && (
						<HBar
							title="Ingresos por Producto"
							sub="Top 10 productos por monto vendido"
							Icon={Package}
							items={prodBreak.map((p, i) => ({
								l: p.n,
								v: p.v,
								c: COLORS[i % COLORS.length],
							}))}
						/>
					)}

					{/* Expense Breakdown */}
					{expBreak.length > 0 && (
						<HBar
							title="Desglose de Gastos"
							sub="Gastos agrupados por categoria"
							Icon={FolderOpen}
							items={expBreak.map((e, i) => ({
								l: e.n,
								v: e.v,
								c: COLORS[i % COLORS.length],
							}))}
						/>
					)}

					{/* Hourly Revenue */}
					{period === "Hoy" &&
						hourly.length > 0 &&
						(() => {
							const mx = Math.max(...hourly.map((h) => h.v), 1);
							const nowHr = new Date().getHours();
							return (
								<SectionCard
									title="Ingresos por Hora"
									Icon={Clock}
									rightHeader={
										<div style={{ textAlign: "right" }}>
											<span
												className="font-kds"
												style={{
													fontSize: 18,
													lineHeight: 1,
													color: "var(--gold)",
												}}
											>
												{formatCurrency(revenue)}
											</span>
											<span
												className="font-body"
												style={{ fontSize: 10, color: "#666", marginLeft: 6 }}
											>
												total hoy
											</span>
										</div>
									}
								>
									<div style={{ padding: "20px 20px 16px" }}>
										<div
											className="flex items-end gap-2"
											style={{ height: 200 }}
										>
											{hourly.map((h) => {
												const cur = h.hr === nowHr;
												return (
													<div
														key={h.hr}
														className="flex-1 flex flex-col items-center gap-1.5 h-full"
													>
														<div className="flex-1 w-full flex flex-col items-center justify-end gap-1">
															<span
																className="font-body"
																style={{
																	fontSize: 9,
																	color: cur ? "#f59e0b" : "#555",
																	fontFamily: "monospace",
																}}
															>
																{Math.round(h.v / 1000)}k
															</span>
															<div
																style={{
																	width: "100%",
																	height: `${(h.v / mx) * 100}%`,
																	minHeight: 2,
																	borderRadius: "4px 4px 0 0",
																	background: cur ? "#f59e0b" : "var(--s4)",
																	boxShadow: cur
																		? "0 0 12px rgba(245,158,11,0.4)"
																		: "none",
																	transition: "all .3s",
																}}
															/>
														</div>
														<span
															className="font-body flex-shrink-0"
															style={{
																fontSize: 10,
																color: cur ? "#f59e0b" : "#555",
																fontFamily: "monospace",
															}}
														>
															{String(h.hr).padStart(2, "0")}:00
														</span>
													</div>
												);
											})}
										</div>
									</div>
								</SectionCard>
							);
						})()}

					{/* AFIP + Cash Register */}
					<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
						<SectionCard title="AFIP - Facturacion" Icon={FileText}>
							<div style={{ padding: "16px 20px" }}>
								<div
									style={{ display: "flex", flexDirection: "column", gap: 12 }}
								>
									<div className="flex items-center justify-between">
										<span
											className="font-body"
											style={{ fontSize: 12, color: "#bbb" }}
										>
											Facturas autorizadas
										</span>
										<span
											className="font-kds"
											style={{ fontSize: 24, color: "#22c55e" }}
										>
											{afipAuth.length}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span
											className="font-body"
											style={{ fontSize: 12, color: "#bbb" }}
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
											{formatCurrency(
												afipAuth.reduce((s, i) => s + i.total, 0),
											)}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span
											className="font-body"
											style={{ fontSize: 12, color: "#bbb" }}
										>
											Pendientes (borrador)
										</span>
										<span
											className="font-kds"
											style={{
												fontSize: 24,
												color: afipPend > 0 ? "#f59e0b" : "#666",
											}}
										>
											{afipPend}
										</span>
									</div>
								</div>
							</div>
						</SectionCard>

						<SectionCard title="Caja Registradora" Icon={Landmark}>
							<div style={{ padding: "16px 20px" }}>
								{todayReg ? (
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: 12,
										}}
									>
										<div className="flex items-center justify-between">
											<span
												className="font-body"
												style={{ fontSize: 12, color: "#bbb" }}
											>
												Estado
											</span>
											<span
												style={{
													background:
														todayReg.status === "open"
															? "rgba(34,197,94,0.15)"
															: "rgba(100,116,139,0.15)",
													color:
														todayReg.status === "open" ? "#22c55e" : "#94a3b8",
													fontSize: 11,
													padding: "3px 10px",
													borderRadius: 6,
													fontWeight: 600,
												}}
											>
												{todayReg.status === "open" ? "Abierta" : "Cerrada"}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span
												className="font-body"
												style={{ fontSize: 12, color: "#bbb" }}
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
												{formatCurrency(todayReg.openingBalance)}
											</span>
										</div>
										{todayReg.closingBalance != null && (
											<div className="flex items-center justify-between">
												<span
													className="font-body"
													style={{ fontSize: 12, color: "#bbb" }}
												>
													Saldo cierre
												</span>
												<span
													className="font-kds"
													style={{ fontSize: 24, color: "var(--gold)" }}
												>
													{formatCurrency(todayReg.closingBalance)}
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
											className="font-body"
											style={{ fontSize: 12, color: "#666" }}
										>
											No hay caja abierta hoy
										</div>
										<div className="flex items-center justify-between">
											<span
												className="font-body"
												style={{ fontSize: 12, color: "#bbb" }}
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
											className="font-body"
											style={{ fontSize: 10, color: "#666" }}
										>
											{new Date(
												lastClosed.closedAt ?? lastClosed.date,
											).toLocaleDateString("es-AR")}
										</div>
									</div>
								) : (
									<div
										className="font-body"
										style={{ fontSize: 12, color: "#666" }}
									>
										Sin registros de caja
									</div>
								)}
							</div>
						</SectionCard>
					</div>

					{cnt === 0 && totExp === 0 && pInv.length === 0 && (
						<div
							style={{
								background: "var(--s1)",
								border: "1px solid var(--s4)",
								borderRadius: 16,
								padding: 40,
								textAlign: "center",
								boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
							}}
						>
							<TrendingUp
								size={32}
								style={{ color: "#555", margin: "0 auto 12px" }}
							/>
							<p className="font-body" style={{ fontSize: 13, color: "#666" }}>
								No hay datos para este periodo
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
