"use client";

import { useCallback } from "react";
import {
	Download,
	FileText,
	TrendingUp,
	TrendingDown,
	CheckCircle2,
	AlertCircle,
	Receipt,
	Clock,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ANALYTICS, formatCurrency } from "@/data/mock";
import { useLiveClock } from "@/hooks/useLiveClock";

// ─── Mock data ────────────────────────────────────────────────────────────────

const EXPENSES = [
	{
		id: "e1",
		category: "Insumos bar",
		icon: "🍹",
		description: "Reposición de licores y mixers",
		date: "Hoy",
		amount: 12000,
		hasReceipt: true,
	},
	{
		id: "e2",
		category: "Insumos cocina",
		icon: "🍔",
		description: "Carnes, verduras y lácteos",
		date: "Hoy",
		amount: 8400,
		hasReceipt: true,
	},
	{
		id: "e3",
		category: "Gastos varios",
		icon: "🧹",
		description: "Mantenimiento, limpieza",
		date: "Hoy",
		amount: 3000,
		hasReceipt: false,
	},
];

const TOTAL_EXPENSES = EXPENSES.reduce((s, e) => s + e.amount, 0);

// 28-day trend (seeded, deterministic)
const MONTHLY = Array.from({ length: 28 }, (_, i) => {
	const base = 95000 + Math.sin(i * 0.7) * 30000 + i * 1800;
	const noise = ((i * 7919) % 15000) - 7500;
	return Math.round(base + noise);
});
MONTHLY[27] = ANALYTICS.today.revenue; // today is last

// ─── CSV export helper ────────────────────────────────────────────────────────

function exportCSV(grossRevenue: number) {
	const rows = [
		["Concepto", "Monto"],
		["Ingresos brutos", grossRevenue],
		["", ""],
		["--- GASTOS ---", ""],
		...EXPENSES.map((e) => [e.category + " - " + e.description, -e.amount]),
		["", ""],
		["Utilidad neta", grossRevenue - TOTAL_EXPENSES],
	];
	const csv = rows.map((r) => r.join(",")).join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `myway-contabilidad-${new Date().toISOString().split("T")[0]}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

function TopBar({ grossRevenue }: { grossRevenue: number }) {
	const { time, date } = useLiveClock();

	const handleCSV = useCallback(() => exportCSV(grossRevenue), [grossRevenue]);

	return (
		<div className="flex items-center justify-between px-8 py-5 border-b border-surface-3 bg-surface-1/60 backdrop-blur-sm sticky top-0 z-10">
			<div>
				<h1 className="font-display text-xl font-700 text-ink-primary tracking-tight">
					Contabilidad
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
					onClick={handleCSV}
					className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5"
				>
					<FileText size={13} />
					Exportar CSV
				</button>
				<button
					onClick={() => window.print()}
					className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5"
				>
					<Download size={13} />
					Exportar PDF
				</button>
			</div>
		</div>
	);
}

// ─── Daily summary ────────────────────────────────────────────────────────────

function DailySummaryCard({ grossRevenue }: { grossRevenue: number }) {
	const netProfit = grossRevenue - TOTAL_EXPENSES;
	const marginNum = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
	const margin = marginNum.toFixed(1);

	return (
		<div className="card-gold p-6 relative overflow-hidden">
			<div className="absolute inset-0 bg-gold-glow opacity-40 pointer-events-none" />
			<div className="relative z-10">
				<div className="flex items-center justify-between mb-6">
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Resumen del día
					</h3>
					<span className="badge badge-ready">Cierre en curso</span>
				</div>

				<div className="grid grid-cols-4 gap-6">
					{/* Gross */}
					<div className="space-y-1">
						<div className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest">
							Ingresos brutos
						</div>
						<div className="font-kds text-5xl text-brand-500 leading-none">
							{formatCurrency(grossRevenue)}
						</div>
						<div className="flex items-center gap-1 text-pool-500">
							<TrendingUp size={11} />
							<span className="font-display text-[10px] font-600">
								+12% vs ayer
							</span>
						</div>
					</div>

					{/* Expenses */}
					<div className="space-y-1">
						<div className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest">
							Gastos operativos
						</div>
						<div className="font-kds text-4xl text-status-cancelled leading-none">
							−{formatCurrency(TOTAL_EXPENSES)}
						</div>
						<div className="flex items-center gap-1 text-ink-tertiary">
							<TrendingDown size={11} />
							<span className="font-display text-[10px] font-600">
								{EXPENSES.length} items registrados
							</span>
						</div>
					</div>

					{/* Net profit */}
					<div className="space-y-1 pl-6 border-l border-surface-3">
						<div className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest">
							Utilidad neta
						</div>
						<div className="font-kds text-4xl text-pool-500 leading-none">
							{formatCurrency(netProfit)}
						</div>
						<div className="flex items-center gap-1 text-pool-500">
							<TrendingUp size={11} />
							<span className="font-display text-[10px] font-600">
								+15% vs ayer
							</span>
						</div>
					</div>

					{/* Margin */}
					<div className="space-y-2">
						<div className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest">
							Margen neto
						</div>
						<div className="font-kds text-4xl text-brand-500 leading-none">
							{margin}%
						</div>
						<div className="h-2 progress-track overflow-hidden">
							<div
								className="progress-bar h-full bg-brand-500"
								style={{ width: `${marginNum}%` }}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Payment breakdown ────────────────────────────────────────────────────────

function PaymentBreakdownTable({ grossRevenue }: { grossRevenue: number }) {
	const methods = ANALYTICS.today.paymentMethods;
	const transactions = [22, 19, 6];
	const COLORS = ["bg-brand-500", "bg-blue-500", "bg-purple-500"];

	return (
		<div className="card p-6">
			<div className="flex items-center gap-2.5 mb-5">
				<Receipt size={14} className="text-brand-500" />
				<h3 className="font-display text-sm font-700 text-ink-primary">
					Desglose de cobros
				</h3>
			</div>
			<table className="w-full">
				<thead>
					<tr className="border-b border-surface-3">
						{[
							"Método",
							"Monto",
							"Participación",
							"Transacciones",
							"Promedio",
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
									<div className="w-20 h-1.5 rounded-full bg-surface-3 overflow-hidden">
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
								{formatCurrency(grossRevenue)}
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

// ─── Expenses table ───────────────────────────────────────────────────────────

function ExpensesTable() {
	return (
		<div className="card p-6">
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Gastos del día
					</h3>
					<p className="font-body text-xs text-ink-tertiary mt-0.5">
						{EXPENSES.length} registros
					</p>
				</div>
				<div className="font-kds text-2xl text-status-cancelled leading-none">
					−{formatCurrency(TOTAL_EXPENSES)}
				</div>
			</div>

			<table className="w-full">
				<thead>
					<tr className="border-b border-surface-3">
						{["Categoría", "Descripción", "Fecha", "Monto", "Comprobante"].map(
							(h) => (
								<th
									key={h}
									className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest pb-3 text-left last:text-center"
								>
									{h}
								</th>
							),
						)}
					</tr>
				</thead>
				<tbody className="divide-y divide-surface-3">
					{EXPENSES.map((e) => (
						<tr key={e.id} className="hover:bg-surface-2/40 transition-colors">
							<td className="py-3.5 pr-4">
								<div className="flex items-center gap-2.5">
									<span className="text-sm">{e.icon}</span>
									<span className="font-display text-sm font-600 text-ink-primary">
										{e.category}
									</span>
								</div>
							</td>
							<td className="py-3.5 pr-4">
								<span className="font-body text-sm text-ink-secondary">
									{e.description}
								</span>
							</td>
							<td className="py-3.5 pr-4">
								<span className="font-mono text-xs text-ink-tertiary">
									{e.date}
								</span>
							</td>
							<td className="py-3.5 pr-4">
								<span className="font-mono text-sm text-status-cancelled font-600">
									−{formatCurrency(e.amount)}
								</span>
							</td>
							<td className="py-3.5 text-center">
								{e.hasReceipt ? (
									<CheckCircle2 size={15} className="text-pool-500 mx-auto" />
								) : (
									<AlertCircle
										size={15}
										className="text-status-pending mx-auto"
									/>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

// ─── 28-day trend chart ───────────────────────────────────────────────────────

function MonthlyTrendChart({ grossRevenue }: { grossRevenue: number }) {
	const data = [...MONTHLY];
	data[data.length - 1] = grossRevenue;
	const max = Math.max(...data);
	const today = data.length - 1;
	const monthTotal = data.reduce((a, b) => a + b, 0);

	return (
		<div className="card p-6">
			<div className="flex items-center justify-between mb-5">
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
						{formatCurrency(monthTotal)}
					</div>
					<div className="font-body text-[10px] text-ink-tertiary">
						acumulado mes
					</div>
				</div>
			</div>

			<div className="flex items-end gap-px h-[100px]">
				{data.map((v, i) => {
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
				<div className="flex items-center gap-1.5">
					<div className="w-2 h-2 rounded-sm bg-brand-500" />
					<span className="font-mono text-[10px] text-brand-500">Hoy (21)</span>
					<div className="w-2 h-2 rounded-sm bg-brand-500/50 ml-2" />
					<span className="font-mono text-[10px] text-ink-tertiary">
						Recientes
					</span>
				</div>
				<span className="font-mono text-[10px] text-ink-tertiary">31 Mar</span>
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountingPage() {
	const todayRevenue = useAppStore((s) => s.todayRevenue);
	const grossRevenue =
		todayRevenue > 0 ? todayRevenue : ANALYTICS.today.revenue;

	return (
		<div className="flex flex-col min-h-screen">
			<TopBar grossRevenue={grossRevenue} />
			<div className="flex-1 px-8 py-6 space-y-5 animate-fade-in">
				<DailySummaryCard grossRevenue={grossRevenue} />

				<div className="grid grid-cols-2 gap-5">
					<PaymentBreakdownTable grossRevenue={grossRevenue} />
					<ExpensesTable />
				</div>

				<MonthlyTrendChart grossRevenue={grossRevenue} />
			</div>
		</div>
	);
}
