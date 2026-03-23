"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
	FileText,
	Plus,
	Search,
	ChevronDown,
	ChevronUp,
	X,
	Trash2,
	AlertCircle,
	CheckCircle2,
	Clock,
	Send,
	Loader2,
	Printer,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { printDocument, printCurrency } from "@/lib/print";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InvoiceItem {
	id: string;
	description: string;
	quantity: number;
	unitPrice: number;
	ivaRate: number;
	subtotal: number;
}

interface Invoice {
	id: string;
	number: number;
	type: "A" | "B" | "C";
	puntoVenta: number;
	customerCuit: string | null;
	customerName: string | null;
	subtotal: number;
	iva21: number;
	iva105: number;
	total: number;
	status: "draft" | "authorized" | "rejected";
	cae: string | null;
	caeExpiry: string | null;
	afipResponse: string | null;
	createdAt: string;
	items: InvoiceItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<
	string,
	{ label: string; color: string; bg: string }
> = {
	A: { label: "A", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
	B: { label: "B", color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
	C: { label: "C", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
};

const STATUS_MAP: Record<
	string,
	{ label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
	draft: {
		label: "Borrador",
		color: "#a1a1aa",
		bg: "rgba(161,161,170,0.15)",
		icon: Clock,
	},
	authorized: {
		label: "Autorizada",
		color: "#4ade80",
		bg: "rgba(74,222,128,0.15)",
		icon: CheckCircle2,
	},
	rejected: {
		label: "Rechazada",
		color: "#f87171",
		bg: "rgba(248,113,113,0.15)",
		icon: AlertCircle,
	},
};

function padNumber(pv: number, num: number): string {
	return `${String(pv).padStart(4, "0")}-${String(num).padStart(8, "0")}`;
}

function formatDate(d: string): string {
	return new Date(d).toLocaleDateString("es-AR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function todayStr(): string {
	return new Date().toISOString().slice(0, 10);
}

// ─── Section Label ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<span
			className="font-display"
			style={{
				fontSize: 9,
				textTransform: "uppercase",
				letterSpacing: "0.25em",
				color: "var(--s5)",
			}}
		>
			{children}
		</span>
	);
}

// ─── New Invoice Line Item (for modal) ───────────────────────────────────────

interface LineItem {
	key: number;
	description: string;
	quantity: number;
	unitPrice: number;
	ivaRate: number;
}

const EMPTY_LINE = (): LineItem => ({
	key: Date.now() + Math.random(),
	description: "",
	quantity: 1,
	unitPrice: 0,
	ivaRate: 21,
});

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function InvoicesPage() {
	// Data
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [loading, setLoading] = useState(true);

	// Filters
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [typeFilter, setTypeFilter] = useState<"" | "A" | "B" | "C">("");
	const [statusFilter, setStatusFilter] = useState<
		"" | "draft" | "authorized" | "rejected"
	>("");

	// UI
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [showModal, setShowModal] = useState(false);

	// ── Fetch ─────────────────────────────────────────────────────────────────

	const fetchInvoices = useCallback(async () => {
		try {
			const params = new URLSearchParams();
			if (typeFilter) params.set("type", typeFilter);
			if (statusFilter) params.set("status", statusFilter);
			if (dateFrom) params.set("from", dateFrom);
			if (dateTo) params.set("to", dateTo);
			const qs = params.toString();
			const data = await apiFetch<Invoice[]>(
				`/api/invoices${qs ? `?${qs}` : ""}`,
			);
			setInvoices(data);
		} catch {
			/* silent */
		} finally {
			setLoading(false);
		}
	}, [typeFilter, statusFilter, dateFrom, dateTo]);

	useEffect(() => {
		fetchInvoices();
	}, [fetchInvoices]);

	// ── KPIs ──────────────────────────────────────────────────────────────────

	const today = todayStr();
	const kpis = useMemo(() => {
		const todayInvoices = invoices.filter(
			(i) => i.createdAt.slice(0, 10) === today,
		);
		return {
			hoy: todayInvoices.length,
			montoHoy: todayInvoices.reduce((s, i) => s + i.total, 0),
			pendientes: invoices.filter((i) => i.status === "draft").length,
		};
	}, [invoices, today]);

	const handlePrint = () => {
		const statusLabel = (s: string) => STATUS_MAP[s]?.label ?? s;
		const badgeClass = (s: string) =>
			s === "authorized"
				? "badge-green"
				: s === "rejected"
					? "badge-red"
					: "badge-amber";
		const rows = invoices
			.map(
				(inv) => `<tr>
					<td>${inv.type}</td>
					<td>${padNumber(inv.puntoVenta, inv.number)}</td>
					<td>${inv.customerName || "Consumidor Final"}</td>
					<td class="amount">${printCurrency(inv.total)}</td>
					<td>${inv.cae ?? "—"}</td>
					<td><span class="badge ${badgeClass(inv.status)}">${statusLabel(inv.status)}</span></td>
				</tr>`,
			)
			.join("");
		const total = invoices.reduce((s, i) => s + i.total, 0);
		const filtersDesc =
			[
				typeFilter && `Tipo ${typeFilter}`,
				statusFilter && statusLabel(statusFilter),
				dateFrom && `Desde ${dateFrom}`,
				dateTo && `Hasta ${dateTo}`,
			]
				.filter(Boolean)
				.join(" | ") || "Sin filtros";
		printDocument({
			title: "Facturación",
			subtitle: `${invoices.length} facturas — ${filtersDesc}`,
			content: `<table>
				<thead><tr><th>Tipo</th><th>Número</th><th>Cliente</th><th style="text-align:right">Total</th><th>CAE</th><th>Estado</th></tr></thead>
				<tbody>${rows}
				<tr class="total-row"><td colspan="3">Total</td><td class="amount">${printCurrency(total)}</td><td colspan="2"></td></tr>
				</tbody></table>`,
		});
	};

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div
			className="min-h-screen p-4 md:p-8 space-y-6"
			style={{ maxWidth: 1100, margin: "0 auto" }}
		>
			{/* Header */}
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<SectionLabel>Administración</SectionLabel>
					<div className="flex items-end gap-3">
						<h1
							className="font-kds"
							style={{ fontSize: 40, lineHeight: 1, color: "var(--gold)" }}
						>
							FACTURACIÓN
						</h1>
						<button
							className="btn-ghost flex items-center gap-1.5"
							onClick={handlePrint}
						>
							<Printer size={14} />
							<span className="font-display" style={{ fontSize: 10 }}>
								Imprimir
							</span>
						</button>
					</div>
				</div>
				<div className="flex gap-3 flex-wrap">
					<KpiPill label="Facturas hoy" value={String(kpis.hoy)} />
					<KpiPill
						label="Monto total"
						value={formatCurrency(kpis.montoHoy)}
						gold
					/>
					<KpiPill
						label="Pendientes AFIP"
						value={String(kpis.pendientes)}
						warn={kpis.pendientes > 0}
					/>
				</div>
			</div>

			{/* Filter bar */}
			<div className="card p-4 flex flex-wrap gap-3 items-end">
				<div className="space-y-1">
					<SectionLabel>Desde</SectionLabel>
					<input
						type="date"
						className="input-base"
						value={dateFrom}
						onChange={(e) => setDateFrom(e.target.value)}
					/>
				</div>
				<div className="space-y-1">
					<SectionLabel>Hasta</SectionLabel>
					<input
						type="date"
						className="input-base"
						value={dateTo}
						onChange={(e) => setDateTo(e.target.value)}
					/>
				</div>
				<div className="space-y-1">
					<SectionLabel>Tipo</SectionLabel>
					<select
						className="input-base"
						value={typeFilter}
						onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
					>
						<option value="">Todas</option>
						<option value="A">A</option>
						<option value="B">B</option>
						<option value="C">C</option>
					</select>
				</div>
				<div className="space-y-1">
					<SectionLabel>Estado</SectionLabel>
					<select
						className="input-base"
						value={statusFilter}
						onChange={(e) =>
							setStatusFilter(e.target.value as typeof statusFilter)
						}
					>
						<option value="">Todos</option>
						<option value="draft">Borrador</option>
						<option value="authorized">Autorizada</option>
						<option value="rejected">Rechazada</option>
					</select>
				</div>
				<button
					className="btn-primary flex items-center gap-2"
					onClick={() => setShowModal(true)}
				>
					<Plus size={16} /> Nueva Factura
				</button>
			</div>

			{/* Invoice list */}
			{loading ? (
				<div className="card p-12 text-center" style={{ color: "var(--s4)" }}>
					<Loader2 size={32} className="animate-spin mx-auto mb-2" />
					Cargando facturas...
				</div>
			) : invoices.length === 0 ? (
				<div className="card p-12 text-center" style={{ color: "var(--s4)" }}>
					<FileText size={40} className="mx-auto mb-3 opacity-40" />
					<p className="font-body">
						No hay facturas
						{typeFilter || statusFilter ? " con estos filtros" : ""}.
					</p>
					<button className="btn-ghost mt-4" onClick={() => setShowModal(true)}>
						Crear primera factura
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{invoices.map((inv) => (
						<InvoiceRow
							key={inv.id}
							invoice={inv}
							expanded={expandedId === inv.id}
							onToggle={() =>
								setExpandedId(expandedId === inv.id ? null : inv.id)
							}
							onRefresh={fetchInvoices}
						/>
					))}
				</div>
			)}

			{/* Modal */}
			{showModal && (
				<NewInvoiceModal
					onClose={() => setShowModal(false)}
					onCreated={() => {
						setShowModal(false);
						fetchInvoices();
					}}
				/>
			)}
		</div>
	);
}

// ─── KPI Pill ────────────────────────────────────────────────────────────────

function KpiPill({
	label,
	value,
	gold,
	warn,
}: {
	label: string;
	value: string;
	gold?: boolean;
	warn?: boolean;
}) {
	const color = warn ? "#f87171" : gold ? "var(--gold)" : "var(--s5)";
	return (
		<div
			className="card px-4 py-2 flex flex-col items-center"
			style={
				gold
					? { borderColor: "rgba(245,158,11,0.25)" }
					: warn
						? { borderColor: "rgba(248,113,113,0.25)" }
						: {}
			}
		>
			<SectionLabel>{label}</SectionLabel>
			<span className="font-kds" style={{ fontSize: 22, color }}>
				{value}
			</span>
		</div>
	);
}

// ─── Invoice Row ─────────────────────────────────────────────────────────────

function InvoiceRow({
	invoice: inv,
	expanded,
	onToggle,
	onRefresh,
}: {
	invoice: Invoice;
	expanded: boolean;
	onToggle: () => void;
	onRefresh: () => void;
}) {
	const typeStyle = TYPE_LABELS[inv.type];
	const statusStyle = STATUS_MAP[inv.status];
	const StatusIcon = statusStyle.icon;
	const [authorizing, setAuthorizing] = useState(false);

	const handleAuthorize = async () => {
		setAuthorizing(true);
		try {
			await apiFetch("/api/afip/invoice", {
				method: "POST",
				body: JSON.stringify({
					type: inv.type,
					customerCuit: inv.customerCuit,
					customerName: inv.customerName,
					items: inv.items.map((it) => ({
						description: it.description,
						quantity: it.quantity,
						unitPrice: it.unitPrice,
						ivaRate: it.ivaRate,
					})),
				}),
			});
			onRefresh();
		} catch {
			/* silent */
		} finally {
			setAuthorizing(false);
		}
	};

	return (
		<div className="card overflow-hidden">
			{/* Main row */}
			<button
				className="w-full text-left p-4 flex flex-wrap items-center gap-3 hover:bg-white/[0.02] transition-colors"
				onClick={onToggle}
			>
				{/* Type badge */}
				<span
					className="font-kds"
					style={{
						fontSize: 18,
						width: 32,
						height: 32,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						borderRadius: 6,
						color: typeStyle.color,
						background: typeStyle.bg,
					}}
				>
					{typeStyle.label}
				</span>

				{/* Number */}
				<span
					className="font-kds text-brand-500"
					style={{ fontSize: 18, minWidth: 140 }}
				>
					{padNumber(inv.puntoVenta, inv.number)}
				</span>

				{/* Customer */}
				<span
					className="font-body text-sm flex-1 truncate"
					style={{ color: "var(--s5)" }}
				>
					{inv.customerName || "Consumidor Final"}
					{inv.customerCuit && (
						<span style={{ color: "var(--s4)", marginLeft: 8, fontSize: 12 }}>
							CUIT {inv.customerCuit}
						</span>
					)}
				</span>

				{/* Date */}
				<span
					className="font-body text-xs"
					style={{ color: "var(--s4)", minWidth: 80 }}
				>
					{formatDate(inv.createdAt)}
				</span>

				{/* Amounts */}
				<div className="text-right" style={{ minWidth: 100 }}>
					<div className="font-kds text-brand-500" style={{ fontSize: 18 }}>
						{formatCurrency(inv.total)}
					</div>
					<div
						className="font-body"
						style={{ fontSize: 10, color: "var(--s4)" }}
					>
						Neto {formatCurrency(inv.subtotal)}
					</div>
				</div>

				{/* Status badge */}
				<span
					className="badge font-body"
					style={{
						color: statusStyle.color,
						background: statusStyle.bg,
						display: "flex",
						alignItems: "center",
						gap: 4,
						minWidth: 100,
						justifyContent: "center",
					}}
				>
					<StatusIcon size={12} />
					{statusStyle.label}
				</span>

				{/* Expand chevron */}
				{expanded ? (
					<ChevronUp size={16} style={{ color: "var(--s4)" }} />
				) : (
					<ChevronDown size={16} style={{ color: "var(--s4)" }} />
				)}
			</button>

			{/* Expanded detail */}
			{expanded && (
				<div
					className="border-t border-white/5 p-4 space-y-4"
					style={{ background: "rgba(255,255,255,0.01)" }}
				>
					{/* Items table */}
					<div>
						<SectionLabel>Detalle de ítems</SectionLabel>
						<div className="mt-2 space-y-1">
							<div
								className="grid font-body text-xs"
								style={{
									gridTemplateColumns: "1fr 70px 90px 60px 90px",
									color: "var(--s4)",
									padding: "0 4px",
								}}
							>
								<span>Descripción</span>
								<span className="text-right">Cant.</span>
								<span className="text-right">P. Unit.</span>
								<span className="text-right">IVA</span>
								<span className="text-right">Subtotal</span>
							</div>
							{inv.items.map((item) => (
								<div
									key={item.id}
									className="grid font-body text-sm"
									style={{
										gridTemplateColumns: "1fr 70px 90px 60px 90px",
										padding: "4px",
										color: "var(--s5)",
									}}
								>
									<span className="truncate">{item.description}</span>
									<span className="text-right font-kds">{item.quantity}</span>
									<span className="text-right font-kds">
										{formatCurrency(item.unitPrice)}
									</span>
									<span className="text-right" style={{ fontSize: 12 }}>
										{item.ivaRate}%
									</span>
									<span className="text-right font-kds text-brand-500">
										{formatCurrency(item.subtotal)}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Totals */}
					<div className="flex justify-end">
						<div className="space-y-1 text-right" style={{ minWidth: 200 }}>
							<div
								className="flex justify-between font-body text-sm"
								style={{ color: "var(--s4)" }}
							>
								<span>Neto gravado</span>
								<span className="font-kds">{formatCurrency(inv.subtotal)}</span>
							</div>
							{inv.iva21 > 0 && (
								<div
									className="flex justify-between font-body text-sm"
									style={{ color: "var(--s4)" }}
								>
									<span>IVA 21%</span>
									<span className="font-kds">{formatCurrency(inv.iva21)}</span>
								</div>
							)}
							{inv.iva105 > 0 && (
								<div
									className="flex justify-between font-body text-sm"
									style={{ color: "var(--s4)" }}
								>
									<span>IVA 10.5%</span>
									<span className="font-kds">{formatCurrency(inv.iva105)}</span>
								</div>
							)}
							<div
								className="flex justify-between font-body text-sm pt-1 border-t border-white/10"
								style={{ color: "var(--gold)" }}
							>
								<span
									className="font-display"
									style={{
										fontSize: 9,
										textTransform: "uppercase",
										letterSpacing: "0.25em",
									}}
								>
									Total
								</span>
								<span className="font-kds" style={{ fontSize: 20 }}>
									{formatCurrency(inv.total)}
								</span>
							</div>
						</div>
					</div>

					{/* CAE info */}
					{inv.status === "authorized" && inv.cae && (
						<div
							className="card p-3 space-y-1"
							style={{ borderColor: "rgba(74,222,128,0.2)" }}
						>
							<SectionLabel>Datos AFIP</SectionLabel>
							<div className="font-body text-sm" style={{ color: "var(--s5)" }}>
								<span style={{ color: "var(--s4)" }}>CAE: </span>
								<span className="font-kds" style={{ color: "#4ade80" }}>
									{inv.cae}
								</span>
							</div>
							{inv.caeExpiry && (
								<div
									className="font-body text-xs"
									style={{ color: "var(--s4)" }}
								>
									Vencimiento CAE: {formatDate(inv.caeExpiry)}
								</div>
							)}
						</div>
					)}

					{/* AFIP Response raw */}
					{inv.afipResponse && (
						<details>
							<summary
								className="font-body text-xs cursor-pointer"
								style={{ color: "var(--s4)" }}
							>
								Respuesta AFIP (JSON)
							</summary>
							<pre
								className="mt-2 p-3 rounded-lg font-body text-xs overflow-auto"
								style={{
									background: "var(--s1)",
									color: "var(--s4)",
									maxHeight: 200,
								}}
							>
								{JSON.stringify(JSON.parse(inv.afipResponse), null, 2)}
							</pre>
						</details>
					)}

					{/* Authorize draft button */}
					{inv.status === "draft" && (
						<div className="flex gap-2 justify-end">
							<button
								className="btn-primary flex items-center gap-2"
								onClick={handleAuthorize}
								disabled={authorizing}
							>
								{authorizing ? (
									<Loader2 size={14} className="animate-spin" />
								) : (
									<Send size={14} />
								)}
								Emitir con AFIP
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── New Invoice Modal ───────────────────────────────────────────────────────

function NewInvoiceModal({
	onClose,
	onCreated,
}: {
	onClose: () => void;
	onCreated: () => void;
}) {
	const [type, setType] = useState<"A" | "B" | "C">("B");
	const [customerCuit, setCustomerCuit] = useState("");
	const [customerName, setCustomerName] = useState("");
	const [lines, setLines] = useState<LineItem[]>([EMPTY_LINE()]);
	const [saving, setSaving] = useState(false);
	const [emitting, setEmitting] = useState(false);
	const [error, setError] = useState("");

	const TYPE_DESCRIPTIONS: Record<string, string> = {
		A: "Responsable Inscripto → Responsable Inscripto. Discrimina IVA. Requiere CUIT.",
		B: "Responsable Inscripto → Consumidor Final / Monotributo. No discrimina IVA al cliente.",
		C: "Monotributo → Cualquier receptor. No discrimina IVA.",
	};

	const updateLine = (
		idx: number,
		field: keyof LineItem,
		value: string | number,
	) => {
		setLines((prev) =>
			prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
		);
	};

	const removeLine = (idx: number) => {
		setLines((prev) =>
			prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx),
		);
	};

	const addLine = () => setLines((prev) => [...prev, EMPTY_LINE()]);

	// Calculations
	const summary = useMemo(() => {
		let neto = 0;
		let iva21 = 0;
		let iva105 = 0;
		for (const l of lines) {
			const sub = l.quantity * l.unitPrice;
			neto += sub;
			if (l.ivaRate === 21) iva21 += sub * 0.21;
			else if (l.ivaRate === 10.5) iva105 += sub * 0.105;
		}
		return { neto, iva21, iva105, total: neto + iva21 + iva105 };
	}, [lines]);

	const buildItems = () =>
		lines
			.filter((l) => l.description && l.unitPrice > 0)
			.map((l) => ({
				description: l.description,
				quantity: l.quantity,
				unitPrice: l.unitPrice,
				ivaRate: l.ivaRate,
				subtotal: l.quantity * l.unitPrice,
			}));

	const handleSaveDraft = async () => {
		setError("");
		const items = buildItems();
		if (!items.length) {
			setError("Agregá al menos un ítem con descripción y precio.");
			return;
		}
		if (type === "A" && !customerCuit) {
			setError("Factura tipo A requiere CUIT del cliente.");
			return;
		}
		setSaving(true);
		try {
			await apiFetch("/api/invoices", {
				method: "POST",
				body: JSON.stringify({
					type,
					customerCuit: customerCuit || undefined,
					customerName: customerName || undefined,
					items,
				}),
			});
			onCreated();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error al guardar");
		} finally {
			setSaving(false);
		}
	};

	const handleEmit = async () => {
		setError("");
		const items = buildItems();
		if (!items.length) {
			setError("Agregá al menos un ítem con descripción y precio.");
			return;
		}
		if (type === "A" && !customerCuit) {
			setError("Factura tipo A requiere CUIT del cliente.");
			return;
		}
		setEmitting(true);
		try {
			await apiFetch("/api/afip/invoice", {
				method: "POST",
				body: JSON.stringify({
					type,
					customerCuit: customerCuit || undefined,
					customerName: customerName || undefined,
					items,
				}),
			});
			onCreated();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error al emitir");
		} finally {
			setEmitting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
		>
			<div
				className="card w-full overflow-y-auto"
				style={{ maxWidth: 680, maxHeight: "90vh", background: "var(--s1)" }}
			>
				{/* Modal header */}
				<div className="flex items-center justify-between p-5 border-b border-white/5">
					<h2
						className="font-kds"
						style={{ fontSize: 28, color: "var(--gold)" }}
					>
						NUEVA FACTURA
					</h2>
					<button className="btn-ghost p-2" onClick={onClose}>
						<X size={18} />
					</button>
				</div>

				<div className="p-5 space-y-5">
					{/* Type selector */}
					<div>
						<SectionLabel>Tipo de comprobante</SectionLabel>
						<div className="flex gap-2 mt-2">
							{(["A", "B", "C"] as const).map((t) => {
								const active = type === t;
								const style = TYPE_LABELS[t];
								return (
									<button
										key={t}
										className="flex-1 p-3 rounded-lg border transition-colors"
										style={{
											borderColor: active ? style.color : "var(--s2)",
											background: active ? style.bg : "transparent",
											color: active ? style.color : "var(--s4)",
										}}
										onClick={() => setType(t)}
									>
										<span className="font-kds text-2xl block">{t}</span>
									</button>
								);
							})}
						</div>
						<p
							className="font-body text-xs mt-2"
							style={{ color: "var(--s4)" }}
						>
							{TYPE_DESCRIPTIONS[type]}
						</p>
					</div>

					{/* Customer */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<SectionLabel>CUIT{type === "A" ? " *" : ""}</SectionLabel>
							<input
								type="text"
								className="input-base w-full"
								placeholder="20-12345678-9"
								value={customerCuit}
								onChange={(e) => setCustomerCuit(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<SectionLabel>Razón social / Nombre</SectionLabel>
							<input
								type="text"
								className="input-base w-full"
								placeholder="Consumidor Final"
								value={customerName}
								onChange={(e) => setCustomerName(e.target.value)}
							/>
						</div>
					</div>

					{/* Line items */}
					<div>
						<SectionLabel>Ítems</SectionLabel>
						<div className="mt-2 space-y-2">
							{lines.map((line, idx) => (
								<div key={line.key} className="flex gap-2 items-start">
									<input
										type="text"
										className="input-base flex-1"
										placeholder="Descripción"
										value={line.description}
										onChange={(e) =>
											updateLine(idx, "description", e.target.value)
										}
									/>
									<input
										type="number"
										className="input-base"
										style={{ width: 60 }}
										min={1}
										value={line.quantity}
										onChange={(e) =>
											updateLine(
												idx,
												"quantity",
												Math.max(1, Number(e.target.value)),
											)
										}
									/>
									<input
										type="number"
										className="input-base"
										style={{ width: 100 }}
										min={0}
										step={0.01}
										placeholder="Precio"
										value={line.unitPrice || ""}
										onChange={(e) =>
											updateLine(idx, "unitPrice", Number(e.target.value))
										}
									/>
									<select
										className="input-base"
										style={{ width: 80 }}
										value={line.ivaRate}
										onChange={(e) =>
											updateLine(idx, "ivaRate", Number(e.target.value))
										}
									>
										<option value={21}>21%</option>
										<option value={10.5}>10.5%</option>
										<option value={0}>0%</option>
									</select>
									<span
										className="font-kds text-brand-500 self-center"
										style={{ fontSize: 14, minWidth: 70, textAlign: "right" }}
									>
										{formatCurrency(line.quantity * line.unitPrice)}
									</span>
									<button
										className="btn-ghost p-1 self-center"
										onClick={() => removeLine(idx)}
										style={{ color: "var(--s4)" }}
									>
										<Trash2 size={14} />
									</button>
								</div>
							))}
						</div>
						<button
							className="btn-ghost mt-2 text-xs flex items-center gap-1"
							onClick={addLine}
						>
							<Plus size={12} /> Agregar ítem
						</button>
					</div>

					{/* Summary */}
					<div
						className="card p-4 space-y-2"
						style={{ borderColor: "rgba(245,158,11,0.15)" }}
					>
						<SectionLabel>Resumen</SectionLabel>
						<div
							className="flex justify-between font-body text-sm"
							style={{ color: "var(--s5)" }}
						>
							<span>Neto gravado</span>
							<span className="font-kds">{formatCurrency(summary.neto)}</span>
						</div>
						{summary.iva21 > 0 && (
							<div
								className="flex justify-between font-body text-sm"
								style={{ color: "var(--s4)" }}
							>
								<span>IVA 21%</span>
								<span className="font-kds">
									{formatCurrency(summary.iva21)}
								</span>
							</div>
						)}
						{summary.iva105 > 0 && (
							<div
								className="flex justify-between font-body text-sm"
								style={{ color: "var(--s4)" }}
							>
								<span>IVA 10.5%</span>
								<span className="font-kds">
									{formatCurrency(summary.iva105)}
								</span>
							</div>
						)}
						<div
							className="flex justify-between items-center pt-2 border-t border-white/10"
							style={{ color: "var(--gold)" }}
						>
							<span
								className="font-display"
								style={{
									fontSize: 9,
									textTransform: "uppercase",
									letterSpacing: "0.25em",
								}}
							>
								Total
							</span>
							<span className="font-kds" style={{ fontSize: 26 }}>
								{formatCurrency(summary.total)}
							</span>
						</div>
					</div>

					{/* Error */}
					{error && (
						<div
							className="flex items-center gap-2 text-sm font-body"
							style={{ color: "#f87171" }}
						>
							<AlertCircle size={14} /> {error}
						</div>
					)}

					{/* Actions */}
					<div className="flex gap-3 justify-end">
						<button className="btn-ghost" onClick={onClose}>
							Cancelar
						</button>
						<button
							className="btn-secondary flex items-center gap-2"
							onClick={handleSaveDraft}
							disabled={saving || emitting}
						>
							{saving ? (
								<Loader2 size={14} className="animate-spin" />
							) : (
								<FileText size={14} />
							)}
							Crear Borrador
						</button>
						<button
							className="btn-primary flex items-center gap-2"
							onClick={handleEmit}
							disabled={saving || emitting}
						>
							{emitting ? (
								<Loader2 size={14} className="animate-spin" />
							) : (
								<Send size={14} />
							)}
							Emitir con AFIP
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
