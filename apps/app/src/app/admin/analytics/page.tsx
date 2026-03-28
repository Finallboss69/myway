"use client";
import { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
import {
	DollarSign,
	ShoppingBag,
	Receipt,
	Truck,
	TrendingUp,
	AlertTriangle,
	Loader2,
	BarChart3,
	CreditCard,
	Package,
	Clock,
	Percent,
	FileText,
	Printer,
	Calendar,
	ArrowUpDown,
	ChefHat,
	AlertCircle,
	PieChart,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { staffHeaders } from "@/lib/admin-pin";

const f = (u: string) => fetch(u).then((r) => r.json());
type E = React.ElementType;
type N = React.ReactNode;

interface OI {
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
	items: OI[];
}
interface DO {
	id: string;
	status: string;
	total: number;
	createdAt: string;
}
interface CP {
	id: string;
	name: string;
	category: string;
	salePrice: number;
	costPrice: number;
	profit: number;
	marginPercent: number;
	ingredientCount: number;
	hasRecipe: boolean;
}
interface CD {
	products: CP[];
	summary: {
		totalProducts: number;
		withRecipe: number;
		withoutRecipe: number;
		avgMargin: number;
	};
}
interface DR {
	id: string;
	date: string;
	totalRevenue: number;
	totalCost: number;
	totalExpenses: number;
	grossProfit: number;
	netProfit: number;
	ordersCount: number;
	deliveryCount: number;
	avgTicket: number;
	topProducts: string | null;
	paymentBreakdown: string | null;
}
type Tab = "dashboard" | "costos" | "reportes";
type Per = "Hoy" | "Semana" | "Mes";
type SK =
	| "name"
	| "category"
	| "salePrice"
	| "costPrice"
	| "profit"
	| "marginPercent";

const sod = (d: Date) => {
	const n = new Date(d);
	n.setHours(0, 0, 0, 0);
	return n;
};
const pStart = (p: Per) => {
	const d = new Date();
	if (p === "Hoy") return sod(d);
	if (p === "Semana") {
		const w = d.getDay();
		d.setDate(d.getDate() - (w === 0 ? 6 : w - 1));
		return sod(d);
	}
	d.setDate(1);
	return sod(d);
};
const inP = (ds: string | null, s: Date) => (ds ? new Date(ds) >= s : false);
const oT = (o: Ord) => o.items.reduce((s, i) => s + i.qty * i.price, 0);
const fD = (d: string | Date) =>
	new Date(d).toLocaleDateString("es-AR", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
const mc = (m: number) =>
	m > 50 ? "#22c55e" : m >= 30 ? "#f59e0b" : "#ef4444";
const PL: Record<string, string> = {
	cash: "Efectivo",
	mercadopago: "MercadoPago",
	card: "Tarjeta",
	sin_definir: "Sin definir",
};
const PC: Record<string, string> = {
	cash: "#f59e0b",
	mercadopago: "#3b82f6",
	card: "#8b5cf6",
	sin_definir: "#64748b",
};
const CL = [
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
const pill = (on: boolean): React.CSSProperties => ({
	padding: "6px 16px",
	borderRadius: 10,
	background: on ? "#f59e0b" : "transparent",
	color: on ? "#0a0a0a" : "#666",
	fontFamily: "var(--font-syne)",
	fontWeight: 600,
	fontSize: 11,
	letterSpacing: "0.1em",
	border: "none",
	cursor: "pointer",
	transition: "all .15s",
	boxShadow: on ? "0 0 8px rgba(245,158,11,0.3)" : "none",
});

function Kpi({
	label,
	value,
	Icon,
	color = "#e5e5e5",
}: {
	label: string;
	value: string;
	Icon: E;
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
					background: `linear-gradient(90deg,transparent,${color}50,transparent)`,
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 0,
					right: 0,
					width: 120,
					height: 120,
					background: `radial-gradient(circle at 100% 0%,${color}12 0%,transparent 70%)`,
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

function SC({
	title,
	Icon,
	children,
	rh,
}: {
	title: string;
	Icon: E;
	children: N;
	rh?: N;
}) {
	return (
		<div
			className="print-section"
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
				{rh}
			</div>
			{children}
		</div>
	);
}

function Bar({ w, c }: { w: string; c: string }) {
	return (
		<div
			style={{
				width: "100%",
				height: 7,
				borderRadius: 4,
				background: "var(--s3)",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					width: w,
					height: "100%",
					borderRadius: 4,
					background: c,
					boxShadow: `0 0 8px ${c}40`,
					transition: "width .3s",
				}}
			/>
		</div>
	);
}

function RR({ l, v, c }: { l: string; v: string; c: string }) {
	return (
		<div
			className="flex items-center justify-between pr"
			style={{ padding: "8px 0" }}
		>
			<span className="font-body" style={{ fontSize: 13, color: "#bbb" }}>
				{l}
			</span>
			<span
				className="font-body"
				style={{ fontSize: 14, fontFamily: "monospace", color: c }}
			>
				{v}
			</span>
		</div>
	);
}

const PCSS = `@media print{body{background:#fff!important;color:#000!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}nav,.no-print,.sidebar,[data-sidebar],header{display:none!important}.print-page{background:#fff!important;padding:0!important}.print-page *{color:#000!important;border-color:#ddd!important;background:transparent!important;box-shadow:none!important}.print-section{border:1px solid #ddd!important;break-inside:avoid;margin-bottom:16px}.ph{display:block!important;font-size:24px;font-weight:700;text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:4px}.ps{display:block!important;font-size:14px;text-align:center;margin-bottom:24px;color:#444!important}}`;

export default function AnalyticsPage() {
	const [tab, setTab] = useState<Tab>("dashboard");
	const [period, setPeriod] = useState<Per>("Hoy");
	const [sk, setSk] = useState<SK>("marginPercent");
	const [sd, setSd] = useState<"asc" | "desc">("asc");
	const [rDate, setRDate] = useState(() => {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	});
	const [rpt, setRpt] = useState<DR | null>(null);
	const [gen, setGen] = useState(false);
	const { data: orders, isLoading: lo } = useSWR<Ord[]>(
		"/api/orders?includeClosed=true",
		f,
	);
	const { data: dD, isLoading: ld } = useSWR<{ orders: DO[] }>(
		"/api/delivery",
		f,
	);
	const { data: cd, isLoading: lc } = useSWR<CD>(
		tab === "costos" ? "/api/cost-calculator" : null,
		f,
	);
	const loading = lo || ld;
	const start = useMemo(() => pStart(period), [period]);
	const closed = useMemo(
		() =>
			(orders ?? []).filter(
				(o) => o.status === "closed" && o.closedAt && inP(o.closedAt, start),
			),
		[orders, start],
	);
	const dels = useMemo(
		() => (dD?.orders ?? []).filter((d) => inP(d.createdAt, start)),
		[dD, start],
	);
	const rev = useMemo(() => closed.reduce((a, o) => a + oT(o), 0), [closed]);
	const cnt = closed.length;
	const avg = cnt > 0 ? Math.round(rev / cnt) : 0;

	const pmB = useMemo(() => {
		const m: Record<string, { amt: number; n: number }> = {};
		for (const o of closed) {
			const k = o.paymentMethod || "cash";
			const t = oT(o);
			if (!m[k]) m[k] = { amt: 0, n: 0 };
			m[k].amt += t;
			m[k].n++;
		}
		return Object.entries(m)
			.map(([k, v]) => ({ k, l: PL[k] || k, c: PC[k] || "#64748b", ...v }))
			.sort((a, b) => b.amt - a.amt);
	}, [closed]);

	const hourly = useMemo(() => {
		if (period !== "Hoy") return [];
		const h: Record<number, number> = {};
		for (const o of closed) {
			if (!o.closedAt) continue;
			const hr = new Date(o.closedAt).getHours();
			h[hr] = (h[hr] || 0) + oT(o);
		}
		return Object.entries(h)
			.map(([k, v]) => ({ hr: Number(k), v }))
			.sort((a, b) => a.hr - b.hr);
	}, [closed, period]);

	const top10 = useMemo(() => {
		const m: Record<string, { qty: number; rev: number }> = {};
		for (const o of closed)
			for (const i of o.items) {
				if (!m[i.name]) m[i.name] = { qty: 0, rev: 0 };
				m[i.name].qty += i.qty;
				m[i.name].rev += i.qty * i.price;
			}
		return Object.entries(m)
			.map(([n, v]) => ({ name: n, ...v }))
			.sort((a, b) => b.rev - a.rev)
			.slice(0, 10);
	}, [closed]);

	const sorted = useMemo(() => {
		if (!cd) return [];
		const a = [...cd.products];
		a.sort((x, y) => {
			const xv = x[sk],
				yv = y[sk];
			if (typeof xv === "string" && typeof yv === "string")
				return sd === "asc" ? xv.localeCompare(yv) : yv.localeCompare(xv);
			return sd === "asc"
				? (xv as number) - (yv as number)
				: (yv as number) - (xv as number);
		});
		return a;
	}, [cd, sk, sd]);

	const estP = useMemo(
		() =>
			cd
				? cd.products
						.filter((p) => p.hasRecipe)
						.reduce((a, p) => a + p.profit, 0)
				: 0,
		[cd],
	);
	const togSort = useCallback(
		(k: SK) => {
			if (sk === k) setSd((d) => (d === "asc" ? "desc" : "asc"));
			else {
				setSk(k);
				setSd("asc");
			}
		},
		[sk],
	);

	const genRpt = useCallback(async () => {
		setGen(true);
		try {
			const r = await fetch("/api/daily-reports", {
				method: "POST",
				headers: staffHeaders(),
				body: JSON.stringify({ date: rDate }),
			});
			if (!r.ok) throw new Error("e");
			setRpt(await r.json());
		} catch {
			/* */
		} finally {
			setGen(false);
		}
	}, [rDate]);

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

	const TBS: [Tab, string, E][] = [
		["dashboard", "DASHBOARD", BarChart3],
		["costos", "COSTOS & GANANCIAS", PieChart],
		["reportes", "REPORTES", FileText],
	];

	return (
		<div
			className="print-page"
			style={{ minHeight: "100vh", background: "var(--s0)" }}
		>
			<style>{PCSS}</style>
			<div
				style={{ padding: "28px 24px 48px", maxWidth: 1200, margin: "0 auto" }}
			>
				<div
					className="no-print flex items-center gap-3"
					style={{ marginBottom: 8 }}
				>
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
						<HelpButton {...helpContent.analytics} />
					</div>
				</div>
				<div className="divider-gold no-print" style={{ marginBottom: 20 }} />

				<div
					className="no-print"
					style={{
						display: "flex",
						gap: 2,
						padding: 4,
						borderRadius: 12,
						background: "var(--s2)",
						border: "1px solid var(--s3)",
						marginBottom: 24,
						width: "fit-content",
					}}
				>
					{TBS.map(([id, l, I]) => (
						<button
							key={id}
							onClick={() => setTab(id)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								...pill(tab === id),
							}}
						>
							<I size={13} />
							{l}
						</button>
					))}
				</div>

				{/* ═══ DASHBOARD ═══ */}
				{tab === "dashboard" && (
					<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
						<div className="flex items-center justify-between">
							<div
								className="flex items-center gap-0.5"
								style={{
									padding: 4,
									borderRadius: 12,
									background: "var(--s2)",
									border: "1px solid var(--s3)",
								}}
							>
								{(["Hoy", "Semana", "Mes"] as Per[]).map((p) => (
									<button
										key={p}
										onClick={() => setPeriod(p)}
										style={pill(period === p)}
									>
										{p}
									</button>
								))}
							</div>
							<span
								className="font-body"
								style={{ fontSize: 11, color: "#555" }}
							>
								{cnt} pedidos cerrados
							</span>
						</div>
						<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
							<Kpi
								label="Ventas Hoy"
								value={formatCurrency(rev)}
								Icon={DollarSign}
								color="#f59e0b"
							/>
							<Kpi
								label="Pedidos Hoy"
								value={String(cnt)}
								Icon={ShoppingBag}
								color="#22c55e"
							/>
							<Kpi
								label="Ticket Promedio"
								value={formatCurrency(avg)}
								Icon={Receipt}
								color="#8b5cf6"
							/>
							<Kpi
								label="Delivery Hoy"
								value={String(dels.length)}
								Icon={Truck}
								color="#06b6d4"
							/>
						</div>

						{pmB.length > 0 && (
							<SC title="Ingresos por Metodo de Pago" Icon={CreditCard}>
								<div style={{ padding: "12px 20px 16px" }}>
									{(() => {
										const tot = pmB.reduce((a, p) => a + p.amt, 0);
										const mx = Math.max(...pmB.map((p) => p.amt), 1);
										return (
											<div
												style={{
													display: "flex",
													flexDirection: "column",
													gap: 12,
												}}
											>
												{pmB.map((pm) => (
													<div key={pm.k}>
														<div
															className="flex items-center justify-between"
															style={{ marginBottom: 5 }}
														>
															<div className="flex items-center gap-2">
																<div
																	style={{
																		width: 10,
																		height: 10,
																		borderRadius: "50%",
																		background: pm.c,
																	}}
																/>
																<span
																	className="font-body"
																	style={{ fontSize: 13, color: "#ddd" }}
																>
																	{pm.l}
																</span>
																<span
																	className="font-body"
																	style={{ fontSize: 11, color: "#666" }}
																>
																	({pm.n})
																</span>
															</div>
															<span
																className="font-body"
																style={{
																	fontSize: 13,
																	fontFamily: "monospace",
																	color: "#bbb",
																}}
															>
																{formatCurrency(pm.amt)}{" "}
																<span style={{ fontSize: 11, color: "#666" }}>
																	(
																	{tot > 0
																		? ((pm.amt / tot) * 100).toFixed(1)
																		: "0"}
																	%)
																</span>
															</span>
														</div>
														<Bar w={`${(pm.amt / mx) * 100}%`} c={pm.c} />
													</div>
												))}
											</div>
										);
									})()}
								</div>
							</SC>
						)}

						{period === "Hoy" &&
							hourly.length > 0 &&
							(() => {
								const mx = Math.max(...hourly.map((h) => h.v), 1);
								const now = new Date().getHours();
								return (
									<SC
										title="Pedidos por Hora"
										Icon={Clock}
										rh={
											<span
												className="font-kds"
												style={{ fontSize: 18, color: "var(--gold)" }}
											>
												{formatCurrency(rev)}
											</span>
										}
									>
										<div style={{ padding: "20px 20px 16px" }}>
											<div
												className="flex items-end gap-2"
												style={{ height: 200 }}
											>
												{hourly.map((h) => {
													const cur = h.hr === now;
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
																className="font-body"
																style={{
																	fontSize: 10,
																	color: cur ? "#f59e0b" : "#555",
																	fontFamily: "monospace",
																}}
															>
																{String(h.hr).padStart(2, "0")}
															</span>
														</div>
													);
												})}
											</div>
										</div>
									</SC>
								);
							})()}

						{top10.length > 0 && (
							<SC title="Top 10 Productos" Icon={Package}>
								<div style={{ padding: "12px 20px 16px" }}>
									{(() => {
										const mx = Math.max(...top10.map((p) => p.rev), 1);
										return (
											<div
												style={{
													display: "flex",
													flexDirection: "column",
													gap: 10,
												}}
											>
												{top10.map((p, i) => (
													<div key={p.name}>
														<div
															className="flex items-center justify-between"
															style={{ marginBottom: 4 }}
														>
															<div className="flex items-center gap-2">
																<span
																	className="font-kds"
																	style={{
																		fontSize: 14,
																		color: CL[i % CL.length],
																		minWidth: 20,
																	}}
																>
																	#{i + 1}
																</span>
																<span
																	className="font-body"
																	style={{ fontSize: 12, color: "#bbb" }}
																>
																	{p.name}
																</span>
																<span
																	className="font-body"
																	style={{ fontSize: 10, color: "#555" }}
																>
																	x{p.qty}
																</span>
															</div>
															<span
																className="font-body"
																style={{
																	fontSize: 12,
																	fontFamily: "monospace",
																	color: "#888",
																}}
															>
																{formatCurrency(p.rev)}
															</span>
														</div>
														<Bar
															w={`${(p.rev / mx) * 100}%`}
															c={CL[i % CL.length]}
														/>
													</div>
												))}
											</div>
										);
									})()}
								</div>
							</SC>
						)}

						{orders &&
							(() => {
								const active = orders.filter(
									(o) => o.status !== "closed",
								).length;
								return (
									<div
										style={{
											background: "var(--s1)",
											border: "1px solid var(--s4)",
											borderRadius: 16,
											padding: "16px 20px",
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
										}}
									>
										<div className="flex items-center gap-2">
											<TrendingUp size={14} style={{ color: "#22c55e" }} />
											<span
												className="font-body"
												style={{ fontSize: 13, color: "#bbb" }}
											>
												Pedidos activos ahora
											</span>
										</div>
										<span
											className="font-kds"
											style={{
												fontSize: 28,
												color: active > 0 ? "#22c55e" : "#555",
											}}
										>
											{active}
										</span>
									</div>
								);
							})()}

						{cnt === 0 && (
							<div
								style={{
									background: "var(--s1)",
									border: "1px solid var(--s4)",
									borderRadius: 16,
									padding: 40,
									textAlign: "center",
								}}
							>
								<TrendingUp
									size={32}
									style={{ color: "#555", margin: "0 auto 12px" }}
								/>
								<p
									className="font-body"
									style={{ fontSize: 13, color: "#666" }}
								>
									No hay datos para este periodo
								</p>
							</div>
						)}
					</div>
				)}

				{/* ═══ COSTOS & GANANCIAS ═══ */}
				{tab === "costos" && (
					<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
						{lc ? (
							<div
								className="flex items-center justify-center"
								style={{ padding: 60 }}
							>
								<Loader2
									size={28}
									className="animate-spin"
									style={{ color: "var(--gold)" }}
								/>
							</div>
						) : cd ? (
							<>
								<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
									<Kpi
										label="Margen Promedio"
										value={`${cd.summary.avgMargin}%`}
										Icon={Percent}
										color={mc(cd.summary.avgMargin)}
									/>
									<Kpi
										label="Con Receta"
										value={String(cd.summary.withRecipe)}
										Icon={ChefHat}
										color="#22c55e"
									/>
									<Kpi
										label="Sin Receta"
										value={String(cd.summary.withoutRecipe)}
										Icon={AlertCircle}
										color={cd.summary.withoutRecipe > 0 ? "#f59e0b" : "#555"}
									/>
									<Kpi
										label="Ganancia Estimada"
										value={formatCurrency(estP)}
										Icon={DollarSign}
										color="#22c55e"
									/>
								</div>

								<SC title="Analisis de Costos por Producto" Icon={BarChart3}>
									<div style={{ overflowX: "auto" }}>
										<table
											style={{ width: "100%", borderCollapse: "collapse" }}
										>
											<thead>
												<tr>
													{(
														[
															["name", "Producto"],
															["category", "Categoria"],
															["salePrice", "Precio"],
															["costPrice", "Costo"],
															["profit", "Ganancia"],
															["marginPercent", "Margen %"],
														] as [SK, string][]
													).map(([k, l]) => (
														<th
															key={k}
															onClick={() => togSort(k)}
															style={{
																padding: "12px 14px",
																textAlign:
																	k === "name" || k === "category"
																		? "left"
																		: "right",
																fontSize: 10,
																fontWeight: 600,
																letterSpacing: "0.15em",
																color: sk === k ? "#f59e0b" : "#888",
																borderBottom: "1px solid var(--s3)",
																cursor: "pointer",
																userSelect: "none",
																fontFamily: "var(--font-syne)",
																textTransform: "uppercase",
																whiteSpace: "nowrap",
															}}
														>
															<span
																className="flex items-center gap-1"
																style={{
																	justifyContent:
																		k === "name" || k === "category"
																			? "flex-start"
																			: "flex-end",
																}}
															>
																{l}
																<ArrowUpDown
																	size={10}
																	style={{ opacity: sk === k ? 1 : 0.3 }}
																/>
															</span>
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{sorted.map((p) => (
													<tr
														key={p.id}
														style={{
															borderBottom: "1px solid var(--s3)",
															background: !p.hasRecipe
																? "rgba(245,158,11,0.05)"
																: "transparent",
														}}
													>
														<td
															style={{
																padding: "10px 14px",
																fontSize: 12,
																color: "#ddd",
															}}
														>
															<div className="flex items-center gap-2">
																{!p.hasRecipe && (
																	<AlertTriangle
																		size={12}
																		style={{ color: "#f59e0b", flexShrink: 0 }}
																	/>
																)}
																{p.name}
															</div>
														</td>
														<td
															style={{
																padding: "10px 14px",
																fontSize: 11,
																color: "#888",
															}}
														>
															{p.category}
														</td>
														<td
															style={{
																padding: "10px 14px",
																fontSize: 12,
																fontFamily: "monospace",
																color: "#bbb",
																textAlign: "right",
															}}
														>
															{formatCurrency(p.salePrice)}
														</td>
														<td
															style={{
																padding: "10px 14px",
																fontSize: 12,
																fontFamily: "monospace",
																color: p.hasRecipe ? "#ef4444" : "#555",
																textAlign: "right",
															}}
														>
															{p.hasRecipe ? formatCurrency(p.costPrice) : "—"}
														</td>
														<td
															style={{
																padding: "10px 14px",
																fontSize: 12,
																fontFamily: "monospace",
																color: p.hasRecipe ? "#22c55e" : "#555",
																textAlign: "right",
															}}
														>
															{p.hasRecipe ? formatCurrency(p.profit) : "—"}
														</td>
														<td
															style={{
																padding: "10px 14px",
																textAlign: "right",
															}}
														>
															{p.hasRecipe ? (
																<span
																	style={{
																		display: "inline-block",
																		padding: "2px 10px",
																		borderRadius: 6,
																		fontSize: 11,
																		fontWeight: 700,
																		fontFamily: "monospace",
																		color: mc(p.marginPercent),
																		background: `${mc(p.marginPercent)}15`,
																	}}
																>
																	{p.marginPercent}%
																</span>
															) : (
																<span
																	style={{ fontSize: 11, color: "#f59e0b" }}
																>
																	Sin receta
																</span>
															)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</SC>

								<SC title="Resumen & Recomendaciones" Icon={TrendingUp}>
									<div style={{ padding: "20px 24px" }}>
										<div
											className="flex items-center justify-between"
											style={{ marginBottom: 14 }}
										>
											<span
												className="font-body"
												style={{ fontSize: 13, color: "#bbb" }}
											>
												Ganancia potencial total
											</span>
											<span
												className="font-kds"
												style={{ fontSize: 24, color: "#22c55e" }}
											>
												{formatCurrency(estP)}
											</span>
										</div>
										<div
											style={{
												borderTop: "1px solid var(--s3)",
												paddingTop: 14,
											}}
										>
											<div
												className="font-display uppercase"
												style={{
													fontSize: 10,
													letterSpacing: "0.15em",
													color: "#888",
													marginBottom: 10,
												}}
											>
												Recomendaciones
											</div>
											{cd.summary.withoutRecipe > 0 && (
												<div
													className="flex items-start gap-2"
													style={{ marginBottom: 8 }}
												>
													<AlertTriangle
														size={14}
														style={{
															color: "#f59e0b",
															flexShrink: 0,
															marginTop: 2,
														}}
													/>
													<span
														className="font-body"
														style={{ fontSize: 12, color: "#bbb" }}
													>
														<strong style={{ color: "#f59e0b" }}>
															{cd.summary.withoutRecipe} productos
														</strong>{" "}
														sin receta. Agrega recetas para analisis completo.
													</span>
												</div>
											)}
											{cd.products.filter(
												(p) => p.hasRecipe && p.marginPercent < 30,
											).length > 0 && (
												<div
													className="flex items-start gap-2"
													style={{ marginBottom: 8 }}
												>
													<AlertCircle
														size={14}
														style={{
															color: "#ef4444",
															flexShrink: 0,
															marginTop: 2,
														}}
													/>
													<span
														className="font-body"
														style={{ fontSize: 12, color: "#bbb" }}
													>
														<strong style={{ color: "#ef4444" }}>
															{
																cd.products.filter(
																	(p) => p.hasRecipe && p.marginPercent < 30,
																).length
															}{" "}
															productos
														</strong>{" "}
														con margen &lt;30%. Ajustar precios o costos.
													</span>
												</div>
											)}
											{cd.summary.avgMargin >= 50 && (
												<div className="flex items-start gap-2">
													<TrendingUp
														size={14}
														style={{
															color: "#22c55e",
															flexShrink: 0,
															marginTop: 2,
														}}
													/>
													<span
														className="font-body"
														style={{ fontSize: 12, color: "#bbb" }}
													>
														Margen promedio saludable:{" "}
														<strong style={{ color: "#22c55e" }}>
															{cd.summary.avgMargin}%
														</strong>
													</span>
												</div>
											)}
										</div>
									</div>
								</SC>
							</>
						) : (
							<div
								style={{
									background: "var(--s1)",
									border: "1px solid var(--s4)",
									borderRadius: 16,
									padding: 40,
									textAlign: "center",
								}}
							>
								<AlertTriangle
									size={32}
									style={{ color: "#ef4444", margin: "0 auto 12px" }}
								/>
								<p
									className="font-body"
									style={{ fontSize: 13, color: "#666" }}
								>
									Error cargando datos de costos
								</p>
							</div>
						)}
					</div>
				)}

				{/* ═══ REPORTES ═══ */}
				{tab === "reportes" && (
					<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
						<div className="no-print flex items-center gap-4 flex-wrap">
							<div className="flex items-center gap-2">
								<Calendar size={14} style={{ color: "#888" }} />
								<input
									type="date"
									value={rDate}
									onChange={(e) => setRDate(e.target.value)}
									style={{
										background: "var(--s2)",
										border: "1px solid var(--s4)",
										borderRadius: 10,
										padding: "8px 14px",
										color: "#ddd",
										fontSize: 13,
										fontFamily: "var(--font-dm-sans)",
										outline: "none",
									}}
								/>
							</div>
							<button
								onClick={genRpt}
								disabled={gen}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 8,
									padding: "8px 22px",
									borderRadius: 10,
									background: "#f59e0b",
									color: "#0a0a0a",
									fontFamily: "var(--font-syne)",
									fontWeight: 700,
									fontSize: 12,
									letterSpacing: "0.1em",
									border: "none",
									cursor: gen ? "wait" : "pointer",
									opacity: gen ? 0.7 : 1,
									boxShadow: "0 0 12px rgba(245,158,11,0.3)",
								}}
							>
								{gen ? (
									<Loader2 size={14} className="animate-spin" />
								) : (
									<FileText size={14} />
								)}
								GENERAR REPORTE
							</button>
							{rpt && (
								<button
									onClick={() => window.print()}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
										padding: "8px 22px",
										borderRadius: 10,
										background: "transparent",
										color: "#bbb",
										fontFamily: "var(--font-syne)",
										fontWeight: 700,
										fontSize: 12,
										letterSpacing: "0.1em",
										border: "1px solid var(--s4)",
										cursor: "pointer",
									}}
								>
									<Printer size={14} />
									IMPRIMIR
								</button>
							)}
						</div>

						{rpt ? (
							<div
								style={{ display: "flex", flexDirection: "column", gap: 20 }}
							>
								<div className="ph" style={{ display: "none" }}>
									MY WAY OLIVOS — Reporte Diario
								</div>
								<div className="ps" style={{ display: "none" }}>
									{fD(rpt.date)}
								</div>
								<div
									style={{
										background: "var(--s1)",
										border: "1px solid var(--s4)",
										borderRadius: 16,
										padding: "24px 28px",
										textAlign: "center",
									}}
								>
									<div
										className="font-display"
										style={{
											fontSize: 18,
											fontWeight: 700,
											color: "#f5f5f5",
											letterSpacing: "0.1em",
										}}
									>
										MY WAY OLIVOS
									</div>
									<div
										className="font-body"
										style={{ fontSize: 13, color: "#888", marginTop: 4 }}
									>
										Reporte Diario — {fD(rpt.date)}
									</div>
								</div>
								<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
									<Kpi
										label="Ingresos Totales"
										value={formatCurrency(rpt.totalRevenue)}
										Icon={DollarSign}
										color="#f59e0b"
									/>
									<Kpi
										label="Pedidos"
										value={String(rpt.ordersCount)}
										Icon={ShoppingBag}
										color="#22c55e"
									/>
									<Kpi
										label="Delivery"
										value={String(rpt.deliveryCount)}
										Icon={Truck}
										color="#06b6d4"
									/>
									<Kpi
										label="Ticket Promedio"
										value={formatCurrency(rpt.avgTicket)}
										Icon={Receipt}
										color="#8b5cf6"
									/>
								</div>
								<SC title="Desglose de Ingresos" Icon={DollarSign}>
									<div style={{ padding: "16px 24px" }}>
										<RR
											l="Ingresos totales"
											v={formatCurrency(rpt.totalRevenue)}
											c="#22c55e"
										/>
										<RR
											l="- Costo de mercaderia"
											v={formatCurrency(rpt.totalCost)}
											c="#ef4444"
										/>
										<div
											className="flex items-center justify-between"
											style={{
												borderTop: "1px solid var(--s4)",
												padding: "10px 0",
											}}
										>
											<span
												className="font-display"
												style={{
													fontSize: 13,
													fontWeight: 700,
													color: "#f5f5f5",
												}}
											>
												= Ganancia Bruta
											</span>
											<span
												className="font-kds"
												style={{
													fontSize: 24,
													color: rpt.grossProfit >= 0 ? "#22c55e" : "#ef4444",
												}}
											>
												{formatCurrency(rpt.grossProfit)}
											</span>
										</div>
										<RR
											l="- Gastos operativos"
											v={formatCurrency(rpt.totalExpenses)}
											c="#ef4444"
										/>
										<div
											className="flex items-center justify-between"
											style={{
												borderTop: "2px solid var(--gold)",
												padding: "12px 0 0",
											}}
										>
											<span
												className="font-display"
												style={{
													fontSize: 14,
													fontWeight: 700,
													color: "#f5f5f5",
												}}
											>
												= Ganancia Neta
											</span>
											<span
												className="font-kds"
												style={{
													fontSize: 32,
													color: rpt.netProfit >= 0 ? "#22c55e" : "#ef4444",
												}}
											>
												{formatCurrency(rpt.netProfit)}
											</span>
										</div>
									</div>
								</SC>

								{rpt.paymentBreakdown &&
									(() => {
										const pb: Record<string, number> = JSON.parse(
											rpt.paymentBreakdown,
										);
										const en = Object.entries(pb).sort((a, b) => b[1] - a[1]);
										const tot = en.reduce((a, [, v]) => a + v, 0);
										return en.length > 0 ? (
											<SC title="Metodos de Pago" Icon={CreditCard}>
												<div style={{ padding: "12px 24px 16px" }}>
													{en.map(([m, amt]) => (
														<div
															key={m}
															className="flex items-center justify-between pr"
															style={{
																padding: "8px 0",
																borderBottom: "1px solid var(--s3)",
															}}
														>
															<div className="flex items-center gap-2">
																<div
																	style={{
																		width: 10,
																		height: 10,
																		borderRadius: "50%",
																		background: PC[m] || "#64748b",
																	}}
																/>
																<span
																	className="font-body"
																	style={{ fontSize: 13, color: "#bbb" }}
																>
																	{PL[m] || m}
																</span>
															</div>
															<span
																className="font-body"
																style={{
																	fontSize: 13,
																	fontFamily: "monospace",
																	color: "#ddd",
																}}
															>
																{formatCurrency(amt)}
																<span
																	style={{
																		fontSize: 11,
																		color: "#666",
																		marginLeft: 8,
																	}}
																>
																	(
																	{tot > 0
																		? ((amt / tot) * 100).toFixed(1)
																		: "0"}
																	%)
																</span>
															</span>
														</div>
													))}
												</div>
											</SC>
										) : null;
									})()}

								{rpt.topProducts &&
									(() => {
										const tp: { name: string; qty: number }[] = JSON.parse(
											rpt.topProducts,
										);
										return tp.length > 0 ? (
											<SC title="Top Productos del Dia" Icon={Package}>
												<div style={{ padding: "12px 24px 16px" }}>
													{tp.map((p, i) => (
														<div
															key={p.name}
															className="flex items-center justify-between pr"
															style={{
																padding: "8px 0",
																borderBottom: "1px solid var(--s3)",
															}}
														>
															<div className="flex items-center gap-3">
																<span
																	className="font-kds"
																	style={{
																		fontSize: 16,
																		color: CL[i % CL.length],
																		minWidth: 24,
																	}}
																>
																	#{i + 1}
																</span>
																<span
																	className="font-body"
																	style={{ fontSize: 13, color: "#bbb" }}
																>
																	{p.name}
																</span>
															</div>
															<span
																className="font-kds"
																style={{ fontSize: 18, color: "#ddd" }}
															>
																{p.qty}
															</span>
														</div>
													))}
												</div>
											</SC>
										) : null;
									})()}

								<SC title="Indicadores Clave" Icon={TrendingUp}>
									<div style={{ padding: "20px 24px" }}>
										<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
											{[
												{
													l: "Margen Bruto",
													v:
														rpt.totalRevenue > 0
															? `${((rpt.grossProfit / rpt.totalRevenue) * 100).toFixed(1)}%`
															: "—",
													c: rpt.grossProfit >= 0 ? "#22c55e" : "#ef4444",
												},
												{
													l: "Margen Neto",
													v:
														rpt.totalRevenue > 0
															? `${((rpt.netProfit / rpt.totalRevenue) * 100).toFixed(1)}%`
															: "—",
													c: rpt.netProfit >= 0 ? "#22c55e" : "#ef4444",
												},
												{
													l: "Food Cost %",
													v:
														rpt.totalRevenue > 0
															? `${((rpt.totalCost / rpt.totalRevenue) * 100).toFixed(1)}%`
															: "—",
													c:
														rpt.totalRevenue > 0 &&
														rpt.totalCost / rpt.totalRevenue <= 0.3
															? "#22c55e"
															: "#ef4444",
												},
												{
													l: "Pedidos Totales",
													v: String(rpt.ordersCount + rpt.deliveryCount),
													c: "#f59e0b",
												},
											].map((it) => (
												<div key={it.l} style={{ textAlign: "center" }}>
													<div
														className="font-kds"
														style={{ fontSize: 28, color: it.c, lineHeight: 1 }}
													>
														{it.v}
													</div>
													<div
														className="font-display uppercase"
														style={{
															fontSize: 9,
															letterSpacing: "0.15em",
															color: "#888",
															marginTop: 6,
														}}
													>
														{it.l}
													</div>
												</div>
											))}
										</div>
									</div>
								</SC>
							</div>
						) : (
							<div
								style={{
									background: "var(--s1)",
									border: "1px solid var(--s4)",
									borderRadius: 16,
									padding: 60,
									textAlign: "center",
								}}
							>
								<FileText
									size={40}
									style={{ color: "#333", margin: "0 auto 16px" }}
								/>
								<p
									className="font-display"
									style={{
										fontSize: 14,
										color: "#666",
										letterSpacing: "0.1em",
									}}
								>
									Selecciona una fecha y genera el reporte
								</p>
								<p
									className="font-body"
									style={{ fontSize: 12, color: "#444", marginTop: 8 }}
								>
									El reporte incluye ingresos, costos, gastos, y ganancia neta
									del dia
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
