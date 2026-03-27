"use client";
import { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
import {
	Plus,
	Pencil,
	Trash2,
	X,
	DollarSign,
	CalendarDays,
	TrendingUp,
	TrendingDown,
	BarChart3,
	PieChart,
	Layers,
	Repeat,
	Filter,
	ChevronDown,
	ChevronRight,
	Truck,
	FileText,
	Check,
	AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getAdminPin } from "@/lib/admin-pin";

interface ExpenseCategory {
	id: string;
	name: string;
	icon: string;
	order: number;
	parentId: string | null;
	budgetMonthly: number | null;
	children?: ExpenseCategory[];
	_count?: { expenses: number };
}
interface Expense {
	id: string;
	categoryId: string;
	category?: ExpenseCategory;
	supplierId: string | null;
	supplier?: { id: string; name: string } | null;
	description: string;
	amount: number;
	date: string;
	paymentMethod: string | null;
	notes: string | null;
	isRecurring: boolean;
	recurringDay: number | null;
	createdAt: string;
}
interface Supplier {
	id: string;
	name: string;
}

type Tab = "GASTOS" | "CATEGORÍAS" | "POR PROVEEDOR" | "RESUMEN";
const TABS: Tab[] = ["GASTOS", "CATEGORÍAS", "POR PROVEEDOR", "RESUMEN"];
const PAY = ["Efectivo", "Transferencia", "Tarjeta", "MercadoPago"];
const PCOL: Record<string, string> = {
	Efectivo: "#22c55e",
	Transferencia: "#f97316",
	Tarjeta: "#8b5cf6",
	MercadoPago: "#3b82f6",
};
const CC = [
	"#f59e0b",
	"#3b82f6",
	"#8b5cf6",
	"#22c55e",
	"#f97316",
	"#ec4899",
	"#06b6d4",
	"#ef4444",
	"#14b8a6",
	"#64748b",
];

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const td = () => new Date().toISOString().slice(0, 10);
const som = () => {
	const d = new Date();
	d.setDate(1);
	d.setHours(0, 0, 0, 0);
	return d;
};
const sow = () => {
	const d = new Date();
	d.setDate(d.getDate() - d.getDay());
	d.setHours(0, 0, 0, 0);
	return d;
};
const fd = (d: string) =>
	new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
const pc = (c: number, p: number) => {
	if (!p) return c > 0 ? "+100%" : "0%";
	const v = ((c - p) / p) * 100;
	return `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`;
};
const IS: React.CSSProperties = {
	width: "100%",
	padding: "10px 14px",
	borderRadius: 10,
	border: "1px solid var(--s4)",
	background: "var(--s2)",
	color: "#eee",
	fontSize: 13,
	fontFamily: "'DM Sans',sans-serif",
	outline: "none",
};
const LS: React.CSSProperties = {
	fontSize: 10,
	letterSpacing: "0.15em",
	color: "#888",
	fontWeight: 600,
	marginBottom: 6,
	display: "block",
	fontFamily: "'Syne',sans-serif",
	textTransform: "uppercase",
};
const BP: React.CSSProperties = {
	padding: "10px 24px",
	borderRadius: 10,
	border: "none",
	cursor: "pointer",
	background: "#f59e0b",
	color: "#080808",
	fontWeight: 700,
	fontSize: 13,
	fontFamily: "'DM Sans',sans-serif",
};
const BS: React.CSSProperties = {
	padding: "10px 24px",
	borderRadius: 10,
	border: "1px solid var(--s4)",
	cursor: "pointer",
	background: "transparent",
	color: "#aaa",
	fontWeight: 600,
	fontSize: 13,
	fontFamily: "'DM Sans',sans-serif",
};
const hv = (e: React.MouseEvent<HTMLElement>, bg: string) => {
	e.currentTarget.style.background = bg;
};

function Kpi({
	label,
	value,
	sub,
	color: c,
	icon: I,
	idx,
}: {
	label: string;
	value: string | number;
	sub?: string;
	color: string;
	icon: React.ElementType;
	idx: number;
}) {
	return (
		<div
			style={{
				background: "var(--s1)",
				border: `1px solid ${c}25`,
				borderRadius: 16,
				padding: "24px 22px 20px",
				position: "relative",
				overflow: "hidden",
				animation: `slideUp .5s cubic-bezier(.16,1,.3,1) ${idx * 80}ms both`,
			}}
		>
			<div
				style={{
					position: "absolute",
					top: 0,
					left: "20%",
					right: "20%",
					height: 1,
					background: `linear-gradient(90deg,transparent,${c}50,transparent)`,
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 0,
					right: 0,
					width: 120,
					height: 120,
					background: `radial-gradient(circle at 100% 0%,${c}12 0%,transparent 70%)`,
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
							background: `${c}15`,
							border: `1px solid ${c}30`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<I size={16} style={{ color: c }} />
					</div>
				</div>
				<div
					className="font-kds"
					style={{
						fontSize: 36,
						lineHeight: 1,
						color: c,
						marginBottom: sub ? 6 : 0,
					}}
				>
					{value}
				</div>
				{sub && (
					<div className="font-body" style={{ fontSize: 11, color: "#666" }}>
						{sub}
					</div>
				)}
			</div>
		</div>
	);
}

function Sec({
	title,
	icon: I,
	right,
	children,
	delay,
}: {
	title: string;
	icon: React.ElementType;
	right?: React.ReactNode;
	children: React.ReactNode;
	delay: number;
}) {
	return (
		<div
			style={{
				background: "var(--s1)",
				border: "1px solid var(--s4)",
				borderRadius: 16,
				overflow: "hidden",
				boxShadow: "0 8px 32px rgba(0,0,0,.4)",
				animation: `slideUp .5s cubic-bezier(.16,1,.3,1) ${delay}ms both`,
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
					<I size={14} style={{ color: "var(--gold)" }} />
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
				{right}
			</div>
			{children}
		</div>
	);
}

function Mdl({
	title,
	onClose,
	children,
	width,
}: {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
	width?: number;
}) {
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 999,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(0,0,0,.7)",
				backdropFilter: "blur(4px)",
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				style={{
					background: "var(--s1)",
					border: "1px solid var(--s4)",
					borderRadius: 16,
					width: width ?? 480,
					maxWidth: "90vw",
					maxHeight: "85vh",
					overflow: "auto",
					boxShadow: "0 24px 64px rgba(0,0,0,.6)",
					animation: "slideUp .3s cubic-bezier(.16,1,.3,1)",
				}}
			>
				<div
					className="flex items-center justify-between"
					style={{
						padding: "16px 20px",
						borderBottom: "1px solid var(--s3)",
						background: "var(--s2)",
					}}
				>
					<span
						className="font-display uppercase"
						style={{
							fontSize: 12,
							letterSpacing: "0.15em",
							color: "#ccc",
							fontWeight: 600,
						}}
					>
						{title}
					</span>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							padding: 4,
						}}
					>
						<X size={16} style={{ color: "#666" }} />
					</button>
				</div>
				<div style={{ padding: 20 }}>{children}</div>
			</div>
		</div>
	);
}

export default function ExpensesPage() {
	const [tab, setTab] = useState<Tab>("GASTOS");
	const { data: exps = [], mutate: mE } = useSWR<Expense[]>(
		"/api/expenses",
		fetcher,
	);
	const { data: cats = [], mutate: mC } = useSWR<ExpenseCategory[]>(
		"/api/expense-categories",
		fetcher,
	);
	const { data: sups = [] } = useSWR<Supplier[]>("/api/suppliers", fetcher);
	const [expMdl, setExpMdl] = useState(false);
	const [edE, setEdE] = useState<Expense | null>(null);
	const [ef, setEf] = useState({
		description: "",
		amount: "",
		date: td(),
		categoryId: "",
		supplierId: "",
		paymentMethod: "Efectivo",
		notes: "",
		isRecurring: false,
		recurringDay: "",
	});
	const [delId, setDelId] = useState<string | null>(null);
	const [catMdl, setCatMdl] = useState(false);
	const [edC, setEdC] = useState<ExpenseCategory | null>(null);
	const [cf, setCf] = useState({
		name: "",
		icon: "",
		order: "0",
		budgetMonthly: "",
		parentId: "",
	});
	const [dF, setDF] = useState(() => {
		const d = new Date();
		d.setDate(1);
		return d.toISOString().slice(0, 10);
	});
	const [dT, setDT] = useState(td());
	const [fC, setFC] = useState("");
	const [fS, setFS] = useState("");
	const [fP, setFP] = useState("");
	const [xS, setXS] = useState<string | null>(null);

	const filt = useMemo(
		() =>
			exps.filter((e) => {
				const d = e.date.slice(0, 10);
				return (
					d >= dF &&
					d <= dT &&
					(!fC || e.categoryId === fC) &&
					(!fS || e.supplierId === fS) &&
					(!fP || e.paymentMethod === fP)
				);
			}),
		[exps, dF, dT, fC, fS, fP],
	);
	const now = new Date();
	const mEx = useMemo(
		() => exps.filter((e) => new Date(e.date) >= som()),
		[exps],
	);
	const wEx = useMemo(
		() => exps.filter((e) => new Date(e.date) >= sow()),
		[exps],
	);
	const tM = mEx.reduce((s, e) => s + e.amount, 0);
	const tW = wEx.reduce((s, e) => s + e.amount, 0);
	const dim = now.getDate();
	const avg = dim > 0 ? tM / dim : 0;
	const rN = exps.filter((e) => e.isRecurring).length;
	const pC = useMemo(() => cats.filter((c) => !c.parentId), [cats]);
	const kOf = useCallback(
		(pid: string) => cats.filter((c) => c.parentId === pid),
		[cats],
	);
	const sG = useMemo(() => {
		const m = new Map<
			string,
			{ s: Supplier; e: Expense[]; t: number; l: string }
		>();
		for (const e of mEx) {
			const id = e.supplierId ?? "_";
			const n = e.supplier?.name ?? "Sin proveedor";
			if (!m.has(id)) m.set(id, { s: { id, name: n }, e: [], t: 0, l: e.date });
			const g = m.get(id)!;
			g.e.push(e);
			g.t += e.amount;
			if (e.date > g.l) g.l = e.date;
		}
		return [...m.values()].sort((a, b) => b.t - a.t);
	}, [mEx]);
	const cS = useMemo(() => {
		const m = new Map<string, number>();
		for (const e of mEx)
			m.set(e.categoryId, (m.get(e.categoryId) ?? 0) + e.amount);
		return m;
	}, [mEx]);
	const pmE = useMemo(() => {
		const p = new Date();
		p.setMonth(p.getMonth() - 1);
		p.setDate(1);
		p.setHours(0, 0, 0, 0);
		const pe = new Date();
		pe.setDate(0);
		pe.setHours(23, 59, 59, 999);
		return exps.filter((e) => {
			const d = new Date(e.date);
			return d >= p && d <= pe;
		});
	}, [exps]);
	const pmT = pmE.reduce((s, e) => s + e.amount, 0);
	const rT = filt.reduce((s, e) => s + e.amount, 0);
	const dFull = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
	const proj = dim > 0 ? (tM / dim) * dFull : 0;
	const t5 = useMemo(
		() =>
			[...cS.entries()]
				.map(([id, t]) => ({ cat: cats.find((c) => c.id === id), total: t }))
				.filter((x) => x.cat)
				.sort((a, b) => b.total - a.total)
				.slice(0, 5),
		[cS, cats],
	);
	const mCT = t5[0]?.total ?? 1;

	const oNE = () => {
		setEdE(null);
		setEf({
			description: "",
			amount: "",
			date: td(),
			categoryId: cats[0]?.id ?? "",
			supplierId: "",
			paymentMethod: "Efectivo",
			notes: "",
			isRecurring: false,
			recurringDay: "",
		});
		setExpMdl(true);
	};
	const oEE = (e: Expense) => {
		setEdE(e);
		setEf({
			description: e.description,
			amount: String(e.amount),
			date: e.date.slice(0, 10),
			categoryId: e.categoryId,
			supplierId: e.supplierId ?? "",
			paymentMethod: e.paymentMethod ?? "Efectivo",
			notes: e.notes ?? "",
			isRecurring: e.isRecurring,
			recurringDay: e.recurringDay ? String(e.recurringDay) : "",
		});
		setExpMdl(true);
	};
	const sE = async () => {
		const b = {
			description: ef.description,
			amount: parseFloat(ef.amount) || 0,
			date: ef.date,
			categoryId: ef.categoryId,
			supplierId: ef.supplierId || null,
			paymentMethod: ef.paymentMethod,
			notes: ef.notes || null,
			isRecurring: ef.isRecurring,
			recurringDay: ef.recurringDay ? parseInt(ef.recurringDay) : null,
		};
		const h = {
			"Content-Type": "application/json",
			"x-staff-pin": getAdminPin(),
		};
		if (edE)
			await fetch(`/api/expenses/${edE.id}`, {
				method: "PATCH",
				headers: h,
				body: JSON.stringify(b),
			});
		else
			await fetch("/api/expenses", {
				method: "POST",
				headers: h,
				body: JSON.stringify(b),
			});
		setExpMdl(false);
		mE();
	};
	const dE = async (id: string) => {
		await fetch(`/api/expenses/${id}`, {
			method: "DELETE",
			headers: { "x-staff-pin": getAdminPin() },
		});
		setDelId(null);
		mE();
	};
	const oNC = () => {
		setEdC(null);
		setCf({ name: "", icon: "", order: "0", budgetMonthly: "", parentId: "" });
		setCatMdl(true);
	};
	const oEC = (c: ExpenseCategory) => {
		setEdC(c);
		setCf({
			name: c.name,
			icon: c.icon,
			order: String(c.order),
			budgetMonthly: c.budgetMonthly ? String(c.budgetMonthly) : "",
			parentId: c.parentId ?? "",
		});
		setCatMdl(true);
	};
	const sC = async () => {
		const b = {
			name: cf.name,
			icon: cf.icon || undefined,
			order: parseInt(cf.order) || 0,
			budgetMonthly: cf.budgetMonthly ? parseFloat(cf.budgetMonthly) : null,
			parentId: cf.parentId || null,
		};
		const h = {
			"Content-Type": "application/json",
			"x-staff-pin": getAdminPin(),
		};
		if (edC)
			await fetch(`/api/expense-categories/${edC.id}`, {
				method: "PATCH",
				headers: h,
				body: JSON.stringify(b),
			});
		else
			await fetch("/api/expense-categories", {
				method: "POST",
				headers: h,
				body: JSON.stringify(b),
			});
		setCatMdl(false);
		mC();
	};
	const dC = async (id: string) => {
		await fetch(`/api/expense-categories/${id}`, {
			method: "DELETE",
			headers: { "x-staff-pin": getAdminPin() },
		});
		mC();
	};

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
								Control de Gastos
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								Seguimiento completo de egresos
							</p>
							<HelpButton {...helpContent.expenses} />
						</div>
					</div>
					{tab === "GASTOS" && (
						<button
							onClick={oNE}
							style={{
								...BP,
								display: "flex",
								alignItems: "center",
								gap: 6,
								fontSize: 12,
							}}
						>
							<Plus size={14} /> Nuevo Gasto
						</button>
					)}
					{tab === "CATEGORÍAS" && (
						<button
							onClick={oNC}
							style={{
								...BP,
								display: "flex",
								alignItems: "center",
								gap: 6,
								fontSize: 12,
							}}
						>
							<Plus size={14} /> Nueva Categoría
						</button>
					)}
				</div>
				<div className="divider-gold" style={{ marginBottom: 20 }} />
				{/* Tabs */}
				<div
					className="flex items-center gap-1"
					style={{
						marginBottom: 24,
						background: "var(--s1)",
						borderRadius: 12,
						padding: 4,
						border: "1px solid var(--s3)",
					}}
				>
					{TABS.map((t) => (
						<button
							key={t}
							onClick={() => setTab(t)}
							style={{
								flex: 1,
								padding: "10px 8px",
								borderRadius: 10,
								border: "none",
								cursor: "pointer",
								fontFamily: "'Syne',sans-serif",
								fontSize: 11,
								fontWeight: 700,
								letterSpacing: "0.1em",
								textTransform: "uppercase",
								transition: "all .2s",
								background: tab === t ? "#f59e0b" : "transparent",
								color: tab === t ? "#080808" : "#888",
							}}
						>
							{t}
						</button>
					))}
				</div>

				{/* ── TAB 1: GASTOS ── */}
				{tab === "GASTOS" && (
					<>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
								gap: 16,
								marginBottom: 24,
							}}
						>
							<Kpi
								label="Total Mes"
								value={formatCurrency(tM)}
								sub={pc(tM, pmT) + " vs mes anterior"}
								color="#3b82f6"
								icon={DollarSign}
								idx={0}
							/>
							<Kpi
								label="Total Semana"
								value={formatCurrency(tW)}
								color="#f59e0b"
								icon={CalendarDays}
								idx={1}
							/>
							<Kpi
								label="Promedio Diario"
								value={formatCurrency(avg)}
								sub={`${dim} días transcurridos`}
								color="#8b5cf6"
								icon={BarChart3}
								idx={2}
							/>
							<Kpi
								label="Gastos Recurrentes"
								value={rN}
								sub="Gastos fijos mensuales"
								color="#10b981"
								icon={Repeat}
								idx={3}
							/>
						</div>
						<Sec title="Filtros" icon={Filter} delay={300}>
							<div
								style={{
									padding: "14px 20px",
									display: "flex",
									flexWrap: "wrap",
									gap: 12,
									alignItems: "end",
								}}
							>
								<div>
									<label style={LS}>Desde</label>
									<input
										type="date"
										value={dF}
										onChange={(e) => setDF(e.target.value)}
										style={{ ...IS, width: 150 }}
									/>
								</div>
								<div>
									<label style={LS}>Hasta</label>
									<input
										type="date"
										value={dT}
										onChange={(e) => setDT(e.target.value)}
										style={{ ...IS, width: 150 }}
									/>
								</div>
								<div>
									<label style={LS}>Categoría</label>
									<select
										value={fC}
										onChange={(e) => setFC(e.target.value)}
										style={{ ...IS, width: 170 }}
									>
										<option value="">Todas</option>
										{cats.map((c) => (
											<option key={c.id} value={c.id}>
												{c.icon} {c.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<label style={LS}>Proveedor</label>
									<select
										value={fS}
										onChange={(e) => setFS(e.target.value)}
										style={{ ...IS, width: 170 }}
									>
										<option value="">Todos</option>
										{sups.map((s) => (
											<option key={s.id} value={s.id}>
												{s.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<label style={LS}>Pago</label>
									<select
										value={fP}
										onChange={(e) => setFP(e.target.value)}
										style={{ ...IS, width: 150 }}
									>
										<option value="">Todos</option>
										{PAY.map((m) => (
											<option key={m} value={m}>
												{m}
											</option>
										))}
									</select>
								</div>
							</div>
						</Sec>
						<div style={{ marginTop: 20 }}>
							<Sec
								title={`Gastos (${filt.length})`}
								icon={FileText}
								delay={400}
								right={
									<span
										className="font-kds"
										style={{ fontSize: 18, color: "var(--gold)" }}
									>
										{formatCurrency(rT)}
									</span>
								}
							>
								{filt.length === 0 ? (
									<div
										className="flex flex-col items-center justify-center"
										style={{ padding: "48px 20px" }}
									>
										<DollarSign
											size={28}
											style={{ color: "#333", marginBottom: 8 }}
										/>
										<span
											className="font-body"
											style={{ fontSize: 13, color: "#555" }}
										>
											Sin gastos para este período
										</span>
									</div>
								) : (
									<div style={{ overflowX: "auto" }}>
										<table
											style={{ width: "100%", borderCollapse: "collapse" }}
										>
											<thead>
												<tr style={{ borderBottom: "1px solid var(--s3)" }}>
													{[
														"Fecha",
														"Descripción",
														"Categoría",
														"Proveedor",
														"Monto",
														"Pago",
														"",
													].map((h) => (
														<th
															key={h}
															style={{
																padding: "10px 16px",
																textAlign: "left",
																fontSize: 9,
																fontWeight: 700,
																letterSpacing: "0.15em",
																color: "#666",
																fontFamily: "'Syne',sans-serif",
																textTransform: "uppercase",
															}}
														>
															{h}
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{filt.map((e) => {
													const pm = PCOL[e.paymentMethod ?? ""] ?? "#666";
													return (
														<tr
															key={e.id}
															style={{
																borderBottom: "1px solid var(--s3)",
																cursor: "pointer",
																transition: "background .15s",
															}}
															onMouseEnter={(ev) => hv(ev, "var(--s2)")}
															onMouseLeave={(ev) => hv(ev, "transparent")}
														>
															<td style={{ padding: "12px 16px" }}>
																<span
																	className="font-body"
																	style={{ fontSize: 13, color: "#bbb" }}
																>
																	{fd(e.date)}
																</span>
															</td>
															<td style={{ padding: "12px 16px" }}>
																<div
																	className="font-body"
																	style={{ fontSize: 13, color: "#eee" }}
																>
																	{e.description}
																	{e.isRecurring && (
																		<Repeat
																			size={11}
																			style={{
																				color: "#f59e0b",
																				marginLeft: 6,
																				verticalAlign: "middle",
																			}}
																		/>
																	)}
																</div>
																{e.notes && (
																	<div
																		className="font-body"
																		style={{
																			fontSize: 11,
																			color: "#555",
																			marginTop: 2,
																		}}
																	>
																		{e.notes}
																	</div>
																)}
															</td>
															<td style={{ padding: "12px 16px" }}>
																<span
																	style={{
																		fontSize: 11,
																		padding: "3px 10px",
																		borderRadius: 20,
																		background: "var(--s3)",
																		color: "#bbb",
																		fontFamily: "'DM Sans',sans-serif",
																	}}
																>
																	{e.category?.icon} {e.category?.name ?? "—"}
																</span>
															</td>
															<td style={{ padding: "12px 16px" }}>
																<span
																	className="font-body"
																	style={{ fontSize: 12, color: "#999" }}
																>
																	{e.supplier?.name ?? "—"}
																</span>
															</td>
															<td style={{ padding: "12px 16px" }}>
																<span
																	className="font-kds"
																	style={{ fontSize: 16, color: "#ef4444" }}
																>
																	{formatCurrency(e.amount)}
																</span>
															</td>
															<td style={{ padding: "12px 16px" }}>
																<span
																	style={{
																		fontSize: 10,
																		padding: "3px 10px",
																		borderRadius: 20,
																		background: `${pm}15`,
																		color: pm,
																		border: `1px solid ${pm}30`,
																		fontFamily: "'DM Sans',sans-serif",
																		fontWeight: 600,
																	}}
																>
																	{e.paymentMethod ?? "—"}
																</span>
															</td>
															<td style={{ padding: "12px 16px" }}>
																<div className="flex items-center gap-2">
																	<button
																		onClick={() => oEE(e)}
																		style={{
																			background: "none",
																			border: "none",
																			cursor: "pointer",
																			padding: 4,
																		}}
																	>
																		<Pencil
																			size={14}
																			style={{ color: "#666" }}
																		/>
																	</button>
																	<button
																		onClick={() => setDelId(e.id)}
																		style={{
																			background: "none",
																			border: "none",
																			cursor: "pointer",
																			padding: 4,
																		}}
																	>
																		<Trash2
																			size={14}
																			style={{ color: "#666" }}
																		/>
																	</button>
																</div>
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								)}
							</Sec>
						</div>
					</>
				)}

				{/* ── TAB 2: CATEGORÍAS ── */}
				{tab === "CATEGORÍAS" && (
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
							gap: 16,
						}}
					>
						{pC.map((cat, ci) => {
							const sp = cS.get(cat.id) ?? 0;
							const bu = cat.budgetMonthly ?? 0;
							const r = bu > 0 ? Math.min(sp / bu, 1) : 0;
							const bc = r > 0.9 ? "#ef4444" : r > 0.7 ? "#f59e0b" : "#10b981";
							const co = CC[ci % CC.length];
							const kids = kOf(cat.id);
							return (
								<div
									key={cat.id}
									style={{
										background: "var(--s1)",
										border: `1px solid ${co}20`,
										borderRadius: 16,
										overflow: "hidden",
										animation: `slideUp .5s cubic-bezier(.16,1,.3,1) ${ci * 60}ms both`,
									}}
								>
									<div
										style={{
											padding: "18px 20px",
											borderBottom:
												kids.length > 0 ? "1px solid var(--s3)" : "none",
											position: "relative",
											overflow: "hidden",
										}}
									>
										<div
											style={{
												position: "absolute",
												top: 0,
												right: 0,
												width: 100,
												height: 100,
												background: `radial-gradient(circle at 100% 0%,${co}10 0%,transparent 70%)`,
												pointerEvents: "none",
											}}
										/>
										<div
											className="flex items-center justify-between"
											style={{ marginBottom: 12 }}
										>
											<div className="flex items-center gap-3">
												<span style={{ fontSize: 28 }}>{cat.icon}</span>
												<div>
													<div
														className="font-display"
														style={{
															fontSize: 14,
															color: "#eee",
															fontWeight: 700,
														}}
													>
														{cat.name}
													</div>
													<div
														className="font-body"
														style={{ fontSize: 11, color: "#666" }}
													>
														{cat._count?.expenses ?? 0} gastos
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<button
													onClick={() => oEC(cat)}
													style={{
														background: "none",
														border: "none",
														cursor: "pointer",
														padding: 4,
													}}
												>
													<Pencil size={13} style={{ color: "#666" }} />
												</button>
												<button
													onClick={() => dC(cat.id)}
													style={{
														background: "none",
														border: "none",
														cursor: "pointer",
														padding: 4,
													}}
												>
													<Trash2 size={13} style={{ color: "#666" }} />
												</button>
											</div>
										</div>
										{bu > 0 ? (
											<>
												<div
													className="flex items-center justify-between"
													style={{ marginBottom: 4 }}
												>
													<span
														className="font-body"
														style={{ fontSize: 11, color: "#888" }}
													>
														{formatCurrency(sp)} / {formatCurrency(bu)}
													</span>
													<span
														className="font-kds"
														style={{ fontSize: 13, color: bc }}
													>
														{(r * 100).toFixed(0)}%
													</span>
												</div>
												<div
													style={{
														height: 6,
														borderRadius: 3,
														background: "var(--s3)",
														overflow: "hidden",
													}}
												>
													<div
														style={{
															width: `${r * 100}%`,
															height: "100%",
															borderRadius: 3,
															background: bc,
															boxShadow: `0 0 8px ${bc}50`,
															transition: "width .5s",
														}}
													/>
												</div>
											</>
										) : (
											<div
												className="font-kds"
												style={{ fontSize: 22, color: co }}
											>
												{formatCurrency(sp)}
											</div>
										)}
									</div>
									{kids.length > 0 && (
										<div style={{ padding: "8px 16px 12px" }}>
											<div
												className="font-display uppercase"
												style={{
													fontSize: 9,
													letterSpacing: "0.15em",
													color: "#555",
													marginBottom: 6,
												}}
											>
												Subcategorías
											</div>
											{kids.map((k) => {
												const ks = cS.get(k.id) ?? 0;
												return (
													<div
														key={k.id}
														className="flex items-center justify-between"
														style={{
															padding: "6px 8px",
															borderRadius: 8,
															transition: "background .15s",
														}}
														onMouseEnter={(ev) => hv(ev, "var(--s2)")}
														onMouseLeave={(ev) => hv(ev, "transparent")}
													>
														<div className="flex items-center gap-2">
															<span style={{ fontSize: 14 }}>{k.icon}</span>
															<span
																className="font-body"
																style={{ fontSize: 12, color: "#bbb" }}
															>
																{k.name}
															</span>
														</div>
														<div className="flex items-center gap-2">
															<span
																className="font-kds"
																style={{ fontSize: 13, color: "#999" }}
															>
																{formatCurrency(ks)}
															</span>
															<button
																onClick={() => oEC(k)}
																style={{
																	background: "none",
																	border: "none",
																	cursor: "pointer",
																	padding: 2,
																}}
															>
																<Pencil size={11} style={{ color: "#555" }} />
															</button>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}

				{/* ── TAB 3: POR PROVEEDOR ── */}
				{tab === "POR PROVEEDOR" && (
					<Sec title="Gastos por Proveedor" icon={Truck} delay={200}>
						{sG.length === 0 ? (
							<div
								className="flex flex-col items-center justify-center"
								style={{ padding: "48px 20px" }}
							>
								<Truck size={28} style={{ color: "#333", marginBottom: 8 }} />
								<span
									className="font-body"
									style={{ fontSize: 13, color: "#555" }}
								>
									Sin gastos este mes
								</span>
							</div>
						) : (
							sG.map((g, gi) => {
								const op = xS === g.s.id;
								const co = CC[gi % CC.length];
								return (
									<div key={g.s.id}>
										<div
											className="flex items-center gap-3"
											style={{
												padding: "14px 20px",
												borderBottom: "1px solid var(--s3)",
												cursor: "pointer",
												transition: "background .15s",
											}}
											onClick={() => setXS(op ? null : g.s.id)}
											onMouseEnter={(ev) => hv(ev, "var(--s2)")}
											onMouseLeave={(ev) => hv(ev, "transparent")}
										>
											{op ? (
												<ChevronDown size={14} style={{ color: "#666" }} />
											) : (
												<ChevronRight size={14} style={{ color: "#666" }} />
											)}
											<div
												style={{
													width: 8,
													height: 8,
													borderRadius: "50%",
													background: co,
													flexShrink: 0,
												}}
											/>
											<div style={{ flex: 1, minWidth: 0 }}>
												<div
													className="font-body"
													style={{
														fontSize: 14,
														color: "#eee",
														fontWeight: 600,
													}}
												>
													{g.s.name}
												</div>
												<div
													className="font-body"
													style={{ fontSize: 11, color: "#666" }}
												>
													{g.e.length} gastos — Último: {fd(g.l)}
												</div>
											</div>
											<span
												className="font-kds"
												style={{ fontSize: 20, color: co }}
											>
												{formatCurrency(g.t)}
											</span>
										</div>
										{op && (
											<div style={{ background: "var(--s0)" }}>
												{g.e.map((e) => (
													<div
														key={e.id}
														className="flex items-center"
														style={{
															padding: "10px 20px 10px 48px",
															borderBottom: "1px solid var(--s3)",
														}}
													>
														<span
															className="font-body"
															style={{ fontSize: 12, color: "#888", width: 70 }}
														>
															{fd(e.date)}
														</span>
														<span
															className="font-body"
															style={{ fontSize: 12, color: "#bbb", flex: 1 }}
														>
															{e.description}
														</span>
														<span
															className="font-body"
															style={{
																fontSize: 11,
																color: "#666",
																marginRight: 12,
															}}
														>
															{e.paymentMethod ?? ""}
														</span>
														<span
															className="font-kds"
															style={{ fontSize: 14, color: "#ef4444" }}
														>
															{formatCurrency(e.amount)}
														</span>
													</div>
												))}
											</div>
										)}
									</div>
								);
							})
						)}
					</Sec>
				)}

				{/* ── TAB 4: RESUMEN ── */}
				{tab === "RESUMEN" && (
					<>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
								gap: 16,
								marginBottom: 24,
							}}
						>
							<Kpi
								label="Total Mes"
								value={formatCurrency(tM)}
								sub={pc(tM, pmT) + " vs anterior"}
								color="#3b82f6"
								icon={DollarSign}
								idx={0}
							/>
							<Kpi
								label="Promedio Diario"
								value={formatCurrency(avg)}
								color="#8b5cf6"
								icon={BarChart3}
								idx={1}
							/>
							<Kpi
								label="Proyección Mensual"
								value={formatCurrency(proj)}
								sub={`Basado en ${dim} días`}
								color="#f59e0b"
								icon={TrendingUp}
								idx={2}
							/>
							<Kpi
								label="Mes Anterior"
								value={formatCurrency(pmT)}
								sub={tM > pmT ? "Mes actual mayor" : "Mes actual menor"}
								color={tM > pmT ? "#ef4444" : "#10b981"}
								icon={tM > pmT ? TrendingUp : TrendingDown}
								idx={3}
							/>
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: 20,
							}}
						>
							{/* Top 5 */}
							<Sec title="Top 5 Categorías" icon={PieChart} delay={300}>
								<div style={{ padding: "16px 20px" }}>
									{t5.length === 0 ? (
										<div
											className="font-body"
											style={{
												fontSize: 13,
												color: "#555",
												textAlign: "center",
												padding: 20,
											}}
										>
											Sin datos
										</div>
									) : (
										t5.map((it, i) => {
											const c = it.cat!;
											const p = mCT > 0 ? (it.total / mCT) * 100 : 0;
											const co = CC[i % CC.length];
											return (
												<div key={c.id} style={{ marginBottom: 14 }}>
													<div
														className="flex items-center justify-between"
														style={{ marginBottom: 4 }}
													>
														<div className="flex items-center gap-2">
															<span style={{ fontSize: 16 }}>{c.icon}</span>
															<span
																className="font-body"
																style={{ fontSize: 13, color: "#ccc" }}
															>
																{c.name}
															</span>
														</div>
														<span
															className="font-kds"
															style={{ fontSize: 15, color: co }}
														>
															{formatCurrency(it.total)}
														</span>
													</div>
													<div
														style={{
															height: 6,
															borderRadius: 3,
															background: "var(--s3)",
															overflow: "hidden",
														}}
													>
														<div
															style={{
																width: `${p}%`,
																height: "100%",
																borderRadius: 3,
																background: co,
																boxShadow: `0 0 8px ${co}40`,
																transition: "width .6s",
															}}
														/>
													</div>
												</div>
											);
										})
									)}
								</div>
							</Sec>
							{/* Budget vs Actual */}
							<Sec title="Presupuesto vs Real" icon={Layers} delay={380}>
								<div style={{ padding: "16px 20px" }}>
									{pC.filter((c) => c.budgetMonthly && c.budgetMonthly > 0)
										.length === 0 ? (
										<div
											className="flex flex-col items-center justify-center"
											style={{ padding: "30px 20px" }}
										>
											<AlertCircle
												size={24}
												style={{ color: "#555", marginBottom: 8 }}
											/>
											<span
												className="font-body"
												style={{ fontSize: 13, color: "#555" }}
											>
												Sin presupuestos configurados
											</span>
										</div>
									) : (
										pC
											.filter((c) => c.budgetMonthly && c.budgetMonthly > 0)
											.map((cat) => {
												const sp = cS.get(cat.id) ?? 0;
												const b = cat.budgetMonthly!;
												const r = Math.min(sp / b, 1);
												const ov = sp > b;
												const bc = ov
													? "#ef4444"
													: r > 0.7
														? "#f59e0b"
														: "#10b981";
												return (
													<div key={cat.id} style={{ marginBottom: 16 }}>
														<div
															className="flex items-center justify-between"
															style={{ marginBottom: 4 }}
														>
															<div className="flex items-center gap-2">
																<span style={{ fontSize: 14 }}>{cat.icon}</span>
																<span
																	className="font-body"
																	style={{ fontSize: 12, color: "#ccc" }}
																>
																	{cat.name}
																</span>
															</div>
															<div className="flex items-center gap-2">
																<span
																	className="font-kds"
																	style={{
																		fontSize: 13,
																		color: ov ? "#ef4444" : "#eee",
																	}}
																>
																	{formatCurrency(sp)}
																</span>
																<span
																	className="font-body"
																	style={{ fontSize: 11, color: "#555" }}
																>
																	/ {formatCurrency(b)}
																</span>
															</div>
														</div>
														<div
															style={{
																height: 6,
																borderRadius: 3,
																background: "var(--s3)",
																overflow: "hidden",
															}}
														>
															<div
																style={{
																	width: `${r * 100}%`,
																	height: "100%",
																	borderRadius: 3,
																	background: bc,
																	boxShadow: `0 0 6px ${bc}40`,
																	transition: "width .5s",
																}}
															/>
														</div>
														{ov && (
															<div
																className="font-body"
																style={{
																	fontSize: 10,
																	color: "#ef4444",
																	marginTop: 2,
																}}
															>
																Excedido por {formatCurrency(sp - b)}
															</div>
														)}
													</div>
												);
											})
									)}
								</div>
							</Sec>
						</div>
						{/* Trend */}
						<div style={{ marginTop: 20 }}>
							<Sec title="Tendencia Mensual" icon={TrendingUp} delay={460}>
								<div style={{ padding: "16px 20px" }}>
									<div
										className="flex items-center gap-4"
										style={{ marginBottom: 12 }}
									>
										<div style={{ flex: 1 }}>
											<div
												className="font-display uppercase"
												style={{
													fontSize: 9,
													letterSpacing: "0.15em",
													color: "#666",
													marginBottom: 4,
												}}
											>
												Mes actual
											</div>
											<div
												className="font-kds"
												style={{ fontSize: 28, color: "#3b82f6" }}
											>
												{formatCurrency(tM)}
											</div>
										</div>
										<div
											style={{
												padding: "8px 16px",
												borderRadius: 10,
												background:
													tM > pmT
														? "rgba(239,68,68,.1)"
														: "rgba(16,185,129,.1)",
												border: `1px solid ${tM > pmT ? "rgba(239,68,68,.25)" : "rgba(16,185,129,.25)"}`,
											}}
										>
											<div className="flex items-center gap-1">
												{tM > pmT ? (
													<TrendingUp size={14} style={{ color: "#ef4444" }} />
												) : (
													<TrendingDown
														size={14}
														style={{ color: "#10b981" }}
													/>
												)}
												<span
													className="font-kds"
													style={{
														fontSize: 18,
														color: tM > pmT ? "#ef4444" : "#10b981",
													}}
												>
													{pc(tM, pmT)}
												</span>
											</div>
										</div>
										<div style={{ flex: 1, textAlign: "right" }}>
											<div
												className="font-display uppercase"
												style={{
													fontSize: 9,
													letterSpacing: "0.15em",
													color: "#666",
													marginBottom: 4,
												}}
											>
												Mes anterior
											</div>
											<div
												className="font-kds"
												style={{ fontSize: 28, color: "#666" }}
											>
												{formatCurrency(pmT)}
											</div>
										</div>
									</div>
									{t5.map((it, i) => {
										const c = it.cat!;
										const pv = pmE
											.filter((e) => e.categoryId === c.id)
											.reduce((s, e) => s + e.amount, 0);
										const co = CC[i % CC.length];
										const ch = pc(it.total, pv);
										const up = it.total > pv;
										return (
											<div
												key={c.id}
												className="flex items-center justify-between"
												style={{
													padding: "8px 0",
													borderBottom: "1px solid var(--s3)",
												}}
											>
												<div className="flex items-center gap-2">
													<span style={{ fontSize: 14 }}>{c.icon}</span>
													<span
														className="font-body"
														style={{ fontSize: 12, color: "#bbb" }}
													>
														{c.name}
													</span>
												</div>
												<div className="flex items-center gap-3">
													<span
														className="font-kds"
														style={{ fontSize: 13, color: co }}
													>
														{formatCurrency(it.total)}
													</span>
													<span
														style={{
															fontSize: 10,
															padding: "2px 8px",
															borderRadius: 10,
															background: up
																? "rgba(239,68,68,.1)"
																: "rgba(16,185,129,.1)",
															color: up ? "#ef4444" : "#10b981",
															fontFamily: "'DM Sans',sans-serif",
															fontWeight: 600,
														}}
													>
														{ch}
													</span>
												</div>
											</div>
										);
									})}
								</div>
							</Sec>
						</div>
					</>
				)}
			</div>

			{/* EXPENSE MODAL */}
			{expMdl && (
				<Mdl
					title={edE ? "Editar Gasto" : "Nuevo Gasto"}
					onClose={() => setExpMdl(false)}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
						<div>
							<label style={LS}>Descripción</label>
							<input
								value={ef.description}
								onChange={(e) => setEf({ ...ef, description: e.target.value })}
								style={IS}
								placeholder="Ej: Compra de insumos"
							/>
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: 12,
							}}
						>
							<div>
								<label style={LS}>Monto</label>
								<input
									type="number"
									value={ef.amount}
									onChange={(e) => setEf({ ...ef, amount: e.target.value })}
									style={IS}
									placeholder="0"
								/>
							</div>
							<div>
								<label style={LS}>Fecha</label>
								<input
									type="date"
									value={ef.date}
									onChange={(e) => setEf({ ...ef, date: e.target.value })}
									style={IS}
								/>
							</div>
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: 12,
							}}
						>
							<div>
								<label style={LS}>Categoría</label>
								<select
									value={ef.categoryId}
									onChange={(e) => setEf({ ...ef, categoryId: e.target.value })}
									style={IS}
								>
									<option value="">Seleccionar...</option>
									{cats.map((c) => (
										<option key={c.id} value={c.id}>
											{c.icon} {c.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<label style={LS}>Proveedor</label>
								<select
									value={ef.supplierId}
									onChange={(e) => setEf({ ...ef, supplierId: e.target.value })}
									style={IS}
								>
									<option value="">Sin proveedor</option>
									{sups.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name}
										</option>
									))}
								</select>
							</div>
						</div>
						<div>
							<label style={LS}>Método de Pago</label>
							<div
								className="flex items-center gap-2"
								style={{ flexWrap: "wrap" }}
							>
								{PAY.map((m) => {
									const a = ef.paymentMethod === m;
									const c = PCOL[m];
									return (
										<button
											key={m}
											onClick={() => setEf({ ...ef, paymentMethod: m })}
											style={{
												padding: "7px 14px",
												borderRadius: 10,
												fontSize: 12,
												cursor: "pointer",
												fontFamily: "'DM Sans',sans-serif",
												fontWeight: 600,
												transition: "all .15s",
												border: `1px solid ${a ? c : "var(--s4)"}`,
												background: a ? `${c}15` : "transparent",
												color: a ? c : "#888",
											}}
										>
											{m}
										</button>
									);
								})}
							</div>
						</div>
						<div>
							<label style={LS}>Notas</label>
							<textarea
								value={ef.notes}
								onChange={(e) => setEf({ ...ef, notes: e.target.value })}
								style={{ ...IS, minHeight: 60, resize: "vertical" }}
								placeholder="Notas opcionales..."
							/>
						</div>
						<div className="flex items-center gap-4">
							<label
								className="flex items-center gap-2"
								style={{ cursor: "pointer" }}
							>
								<div
									onClick={() => setEf({ ...ef, isRecurring: !ef.isRecurring })}
									style={{
										width: 20,
										height: 20,
										borderRadius: 6,
										border: `1px solid ${ef.isRecurring ? "#f59e0b" : "var(--s4)"}`,
										background: ef.isRecurring ? "#f59e0b15" : "transparent",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										cursor: "pointer",
									}}
								>
									{ef.isRecurring && (
										<Check size={12} style={{ color: "#f59e0b" }} />
									)}
								</div>
								<span
									className="font-body"
									style={{ fontSize: 12, color: "#bbb" }}
								>
									Gasto recurrente
								</span>
							</label>
							{ef.isRecurring && (
								<div className="flex items-center gap-2">
									<label style={{ ...LS, marginBottom: 0 }}>Día</label>
									<input
										type="number"
										min={1}
										max={31}
										value={ef.recurringDay}
										onChange={(e) =>
											setEf({ ...ef, recurringDay: e.target.value })
										}
										style={{ ...IS, width: 70 }}
										placeholder="1-31"
									/>
								</div>
							)}
						</div>
						<div
							className="flex items-center justify-end gap-3"
							style={{ marginTop: 8 }}
						>
							<button onClick={() => setExpMdl(false)} style={BS}>
								Cancelar
							</button>
							<button onClick={sE} style={BP}>
								{edE ? "Guardar" : "Crear Gasto"}
							</button>
						</div>
					</div>
				</Mdl>
			)}

			{/* CATEGORY MODAL */}
			{catMdl && (
				<Mdl
					title={edC ? "Editar Categoría" : "Nueva Categoría"}
					onClose={() => setCatMdl(false)}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr auto",
								gap: 12,
							}}
						>
							<div>
								<label style={LS}>Nombre</label>
								<input
									value={cf.name}
									onChange={(e) => setCf({ ...cf, name: e.target.value })}
									style={IS}
									placeholder="Ej: Insumos de cocina"
								/>
							</div>
							<div>
								<label style={LS}>Icono</label>
								<input
									value={cf.icon}
									onChange={(e) => setCf({ ...cf, icon: e.target.value })}
									style={{
										...IS,
										width: 60,
										textAlign: "center",
										fontSize: 20,
									}}
									placeholder=""
								/>
							</div>
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: 12,
							}}
						>
							<div>
								<label style={LS}>Orden</label>
								<input
									type="number"
									value={cf.order}
									onChange={(e) => setCf({ ...cf, order: e.target.value })}
									style={IS}
								/>
							</div>
							<div>
								<label style={LS}>Presupuesto Mensual</label>
								<input
									type="number"
									value={cf.budgetMonthly}
									onChange={(e) =>
										setCf({ ...cf, budgetMonthly: e.target.value })
									}
									style={IS}
									placeholder="0 = sin límite"
								/>
							</div>
						</div>
						<div>
							<label style={LS}>Categoría Padre</label>
							<select
								value={cf.parentId}
								onChange={(e) => setCf({ ...cf, parentId: e.target.value })}
								style={IS}
							>
								<option value="">Ninguna (principal)</option>
								{pC
									.filter((c) => c.id !== edC?.id)
									.map((c) => (
										<option key={c.id} value={c.id}>
											{c.icon} {c.name}
										</option>
									))}
							</select>
						</div>
						<div
							className="flex items-center justify-end gap-3"
							style={{ marginTop: 8 }}
						>
							<button onClick={() => setCatMdl(false)} style={BS}>
								Cancelar
							</button>
							<button onClick={sC} style={BP}>
								{edC ? "Guardar" : "Crear"}
							</button>
						</div>
					</div>
				</Mdl>
			)}

			{/* DELETE CONFIRM */}
			{delId && (
				<Mdl
					title="Confirmar Eliminación"
					onClose={() => setDelId(null)}
					width={380}
				>
					<div className="flex flex-col items-center" style={{ gap: 16 }}>
						<div
							style={{
								width: 48,
								height: 48,
								borderRadius: 14,
								background: "rgba(239,68,68,.1)",
								border: "1px solid rgba(239,68,68,.25)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Trash2 size={20} style={{ color: "#ef4444" }} />
						</div>
						<p
							className="font-body"
							style={{ fontSize: 14, color: "#ccc", textAlign: "center" }}
						>
							Estás seguro de eliminar este gasto? No se puede deshacer.
						</p>
						<div className="flex items-center gap-3">
							<button onClick={() => setDelId(null)} style={BS}>
								Cancelar
							</button>
							<button
								onClick={() => dE(delId)}
								style={{ ...BP, background: "#ef4444", color: "#fff" }}
							>
								Eliminar
							</button>
						</div>
					</div>
				</Mdl>
			)}
		</div>
	);
}
