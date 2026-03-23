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

/* ─── Horizontal bars ────────────────────────────────────────────────────── */
function HBar({
	items,
	title,
	sub,
}: {
	items: { l: string; v: number; c: string }[];
	title: string;
	sub: string;
}) {
	const mx = Math.max(...items.map((i) => i.v), 1);
	const tot = items.reduce((s, i) => s + i.v, 0);
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
								className="font-body text-ink-secondary"
								style={{ fontSize: 12 }}
							>
								{it.l}
							</span>
							<span
								className="font-body text-ink-disabled"
								style={{ fontSize: 11, fontFamily: "monospace" }}
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
									transition: "width .3s",
								}}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─── KPI card ───────────────────────────────────────────────────────────── */
function Kpi({
	label,
	value,
	Icon,
	accent,
}: {
	label: string;
	value: string;
	Icon: React.ElementType;
	accent?: boolean;
}) {
	return (
		<div
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
							"radial-gradient(ellipse 300px 200px at 50% 0%,rgba(245,158,11,0.06) 0%,transparent 60%)",
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
					<Icon size={14} style={{ color: accent ? "#f59e0b" : "#888" }} />
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
				.filter((e) => e.category?.name === "Mercadería")
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
			const c = e.category?.name || "Sin categoría";
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
						ANALÍTICAS
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
			<div className="divider-gold mb-7" />

			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				{/* KPI Row */}
				<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
					<Kpi
						label="Ingresos"
						value={formatCurrency(revenue)}
						Icon={DollarSign}
						accent
					/>
					<Kpi label="Pedidos" value={String(cnt)} Icon={ShoppingBag} />
					<Kpi
						label="Ticket Promedio"
						value={formatCurrency(avgTicket)}
						Icon={Receipt}
					/>
					<Kpi
						label="Gastos del Período"
						value={formatCurrency(totExp)}
						Icon={Wallet}
					/>
				</div>

				{/* P&L */}
				<div className="card-gold" style={{ padding: 24, borderRadius: 14 }}>
					<h3
						className="font-display text-ink-primary"
						style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}
					>
						Resultado del Período
					</h3>
					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
								− Gastos totales
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
											color: foodPct <= 30 ? "#22c55e" : "#ef4444",
										}}
									>
										{foodPct.toFixed(1)}%
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
											color: primePct <= 60 ? "#22c55e" : "#ef4444",
										}}
									>
										{primePct.toFixed(1)}%
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

				{/* Payment Methods */}
				{pmBreak.length > 0 && (
					<div className="card" style={{ padding: 24 }}>
						<h3
							className="font-display text-ink-primary"
							style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}
						>
							Ingresos por Método de Pago
						</h3>
						<div
							className="font-body text-ink-disabled"
							style={{ fontSize: 11, marginBottom: 16 }}
						>
							Desglose de pedidos cerrados
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
													className="font-body text-ink-primary"
													style={{ fontSize: 13 }}
												>
													{pm.label}
												</span>
												<span
													className="font-body text-ink-disabled"
													style={{ fontSize: 11 }}
												>
													({pm.n} {pm.n === 1 ? "pedido" : "pedidos"})
												</span>
											</div>
											<div className="flex items-center gap-3">
												<span
													className="font-display text-ink-secondary"
													style={{ fontSize: 11, fontWeight: 700 }}
												>
													{pct}%
												</span>
												<span
													className="font-body text-ink-secondary"
													style={{
														fontSize: 13,
														fontFamily: "monospace",
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
													transition: "width .3s",
												}}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Revenue by Product */}
				{prodBreak.length > 0 && (
					<HBar
						title="Ingresos por Producto"
						sub="Top 10 productos por monto vendido"
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
						sub="Gastos agrupados por categoría"
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
								<div className="flex items-end gap-2" style={{ height: 200 }}>
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
						);
					})()}

				{/* AFIP + Cash Register */}
				<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
					<div className="card" style={{ padding: 24 }}>
						<div className="flex items-center gap-2 mb-4">
							<FileText size={16} style={{ color: "var(--gold)" }} />
							<h3
								className="font-display text-ink-primary"
								style={{ fontSize: 13, fontWeight: 700 }}
							>
								AFIP — Facturación
							</h3>
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
									{afipAuth.length}
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
									{formatCurrency(afipAuth.reduce((s, i) => s + i.total, 0))}
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
										color: afipPend > 0 ? "#f59e0b" : "#666",
									}}
								>
									{afipPend}
								</span>
							</div>
						</div>
					</div>
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
						{todayReg ? (
							<div
								style={{ display: "flex", flexDirection: "column", gap: 12 }}
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
												todayReg.status === "open"
													? "rgba(34,197,94,0.15)"
													: "rgba(100,116,139,0.15)",
											color: todayReg.status === "open" ? "#22c55e" : "#94a3b8",
											fontSize: 11,
											padding: "3px 10px",
											borderRadius: 6,
										}}
									>
										{todayReg.status === "open" ? "Abierta" : "Cerrada"}
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
										{formatCurrency(todayReg.openingBalance)}
									</span>
								</div>
								{todayReg.closingBalance != null && (
									<div className="flex items-center justify-between">
										<span
											className="font-body text-ink-secondary"
											style={{ fontSize: 12 }}
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
								style={{ display: "flex", flexDirection: "column", gap: 12 }}
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
										Último cierre
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

				{cnt === 0 && totExp === 0 && pInv.length === 0 && (
					<div className="card" style={{ padding: 40, textAlign: "center" }}>
						<TrendingUp
							size={32}
							style={{ color: "#555", margin: "0 auto 12px" }}
						/>
						<p className="font-body text-ink-disabled" style={{ fontSize: 13 }}>
							No hay datos para este período
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
