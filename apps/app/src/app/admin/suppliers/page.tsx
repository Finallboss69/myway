"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Truck,
	FileText,
	Plus,
	X,
	Trash2,
	Phone,
	Mail,
	MapPin,
	CheckCircle,
	AlertCircle,
	Clock,
	ChevronDown,
	ChevronUp,
	Edit3,
	Printer,
	DollarSign,
	Package,
	Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { printDocument, printCurrency } from "@/lib/print";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Supplier {
	id: string;
	name: string;
	cuit: string | null;
	address: string | null;
	phone: string | null;
	email: string | null;
	notes: string | null;
	createdAt: string;
	_count?: { invoices: number };
}

interface InvoiceItem {
	id?: string;
	description: string;
	quantity: number;
	unitPrice: number;
	ivaRate: number;
	subtotal: number;
}

interface SupplierInvoice {
	id: string;
	supplierId: string;
	supplier: Supplier;
	number: string;
	date: string;
	dueDate: string | null;
	subtotal: number;
	iva: number;
	iibb: number;
	otherTaxes: number;
	total: number;
	photoUrl: string | null;
	status: string;
	paidAt: string | null;
	paymentMethod: string | null;
	notes: string | null;
	items: InvoiceItem[];
}

type Tab = "suppliers" | "invoices";

const EMPTY_SUPPLIER = {
	name: "",
	cuit: "",
	address: "",
	phone: "",
	email: "",
	notes: "",
};
const EMPTY_LINE: InvoiceItem = {
	description: "",
	quantity: 1,
	unitPrice: 0,
	ivaRate: 21,
	subtotal: 0,
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-AR");

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
	icon: Icon,
	color,
	value,
	label,
}: {
	icon: React.ComponentType<{ size?: number }>;
	color: string;
	value: string | number;
	label: string;
}) {
	return (
		<div className="card animate-fade-in flex items-center gap-4 px-5 py-4 min-w-[180px]">
			<div
				className="flex items-center justify-center rounded-xl"
				style={{
					width: 42,
					height: 42,
					background: `${color}15`,
				}}
			>
				<Icon size={20} />
			</div>
			<div>
				<p
					className="font-display text-xl font-bold leading-none"
					style={{ color }}
				>
					{value}
				</p>
				<p className="font-body text-xs text-ink-tertiary mt-0.5 uppercase tracking-wider">
					{label}
				</p>
			</div>
		</div>
	);
}

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, string> = {
		pending: "badge-pending",
		paid: "badge-available",
		overdue: "badge-cancelled",
	};
	const labels: Record<string, string> = {
		pending: "Pendiente",
		paid: "Pagada",
		overdue: "Vencida",
	};
	return (
		<span className={`badge ${map[status] ?? "badge-pending"}`}>
			{labels[status] ?? "Pendiente"}
		</span>
	);
}

// ─── Field label ─────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
	return (
		<label className="font-body text-xs font-medium text-ink-secondary uppercase tracking-wider block mb-1.5">
			{children}
		</label>
	);
}

// ─── Modal shell ─────────────────────────────────────────────────────────────

function Modal({
	open,
	onClose,
	title,
	wide,
	children,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	wide?: boolean;
	children: React.ReactNode;
}) {
	if (!open) return null;
	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
			style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
			onClick={onClose}
		>
			<div
				className="card animate-scale-in"
				style={{
					width: "100%",
					maxWidth: wide ? 680 : 520,
					maxHeight: "90vh",
					overflow: "auto",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					className="flex items-center justify-between px-6 py-4"
					style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
				>
					<h3 className="font-display text-base font-semibold text-ink-primary">
						{title}
					</h3>
					<button className="btn-ghost p-1.5 rounded-lg" onClick={onClose}>
						<X size={16} className="text-ink-tertiary" />
					</button>
				</div>
				{/* Body */}
				<div className="px-6 py-5">{children}</div>
			</div>
		</div>
	);
}

// ─── Confirm dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({
	open,
	message,
	onConfirm,
	onCancel,
}: {
	open: boolean;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	if (!open) return null;
	return (
		<div
			className="fixed inset-0 z-[110] flex items-center justify-center animate-fade-in"
			style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
			onClick={onCancel}
		>
			<div
				className="card animate-scale-in px-6 py-5"
				style={{ maxWidth: 400, width: "100%" }}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start gap-3 mb-5">
					<div
						className="flex items-center justify-center rounded-xl shrink-0"
						style={{
							width: 40,
							height: 40,
							background: "rgba(239,68,68,0.12)",
						}}
					>
						<AlertCircle size={20} className="text-red-400" />
					</div>
					<p className="font-body text-sm text-ink-secondary leading-relaxed pt-2">
						{message}
					</p>
				</div>
				<div className="flex gap-3 justify-end">
					<button className="btn-ghost text-sm" onClick={onCancel}>
						Cancelar
					</button>
					<button
						className="btn-primary text-sm"
						style={{ background: "#ef4444" }}
						onClick={onConfirm}
					>
						Confirmar
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SuppliersPage() {
	const [tab, setTab] = useState<Tab>("suppliers");
	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
	const [loading, setLoading] = useState(true);

	// supplier modal
	const [showSupplierModal, setShowSupplierModal] = useState(false);
	const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
	const [supplierForm, setSupplierForm] = useState(EMPTY_SUPPLIER);
	const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(
		null,
	);

	// invoice modal
	const [showInvoiceModal, setShowInvoiceModal] = useState(false);
	const [invForm, setInvForm] = useState({
		supplierId: "",
		number: "",
		date: "",
		dueDate: "",
		photoUrl: "",
		notes: "",
	});
	const [invLines, setInvLines] = useState<InvoiceItem[]>([{ ...EMPTY_LINE }]);

	// filters
	const [filterSupplier, setFilterSupplier] = useState("");
	const [filterStatus, setFilterStatus] = useState("");

	// confirm
	const [confirm, setConfirm] = useState<{
		message: string;
		action: () => void;
	} | null>(null);

	// pay modal
	const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
	const [payMethod, setPayMethod] = useState("efectivo");

	// ─── Fetchers ──────────────────────────────────────────────────────────────

	const fetchSuppliers = useCallback(async () => {
		try {
			const data = await apiFetch<Supplier[]>("/api/suppliers");
			setSuppliers(data);
		} catch {
			/* silent */
		}
	}, []);

	const fetchInvoices = useCallback(async () => {
		try {
			const params = new URLSearchParams();
			if (filterSupplier) params.set("supplierId", filterSupplier);
			if (filterStatus) params.set("status", filterStatus);
			const qs = params.toString();
			const data = await apiFetch<SupplierInvoice[]>(
				`/api/supplier-invoices${qs ? `?${qs}` : ""}`,
			);
			setInvoices(data);
		} catch {
			/* silent */
		}
	}, [filterSupplier, filterStatus]);

	useEffect(() => {
		Promise.all([fetchSuppliers(), fetchInvoices()]).finally(() =>
			setLoading(false),
		);
	}, [fetchSuppliers, fetchInvoices]);

	// ─── Stats ─────────────────────────────────────────────────────────────────

	const pendingInvoices = invoices.filter(
		(i) => i.status === "pending" || i.status === "overdue",
	);
	const totalOwed = pendingInvoices.reduce((s, i) => s + i.total, 0);
	const handlePrint = () => {
		const rows = suppliers
			.map((s) => {
				const sInvoices = invoices.filter(
					(i) =>
						i.supplier?.id === s.id &&
						(i.status === "pending" || i.status === "overdue"),
				);
				const owed = sInvoices.reduce((sum, i) => sum + i.total, 0);
				return `<tr>
					<td>${s.name}</td>
					<td>${s.cuit ?? "\u2014"}</td>
					<td class="amount">${s._count?.invoices ?? 0}</td>
					<td class="amount">${printCurrency(owed)}</td>
				</tr>`;
			})
			.join("");
		printDocument({
			title: "Proveedores",
			subtitle: `${suppliers.length} proveedores \u2014 Deuda total: ${printCurrency(totalOwed)}`,
			content: `<table>
				<thead><tr><th>Proveedor</th><th>CUIT</th><th style="text-align:right">Facturas</th><th style="text-align:right">Deuda</th></tr></thead>
				<tbody>${rows}
				<tr class="total-row"><td colspan="3">Total</td><td class="amount">${printCurrency(totalOwed)}</td></tr>
				</tbody></table>`,
		});
	};

	// ─── Supplier CRUD ─────────────────────────────────────────────────────────

	const openNewSupplier = () => {
		setEditingSupplier(null);
		setSupplierForm(EMPTY_SUPPLIER);
		setShowSupplierModal(true);
	};

	const openEditSupplier = (s: Supplier) => {
		setEditingSupplier(s);
		setSupplierForm({
			name: s.name,
			cuit: s.cuit ?? "",
			address: s.address ?? "",
			phone: s.phone ?? "",
			email: s.email ?? "",
			notes: s.notes ?? "",
		});
		setShowSupplierModal(true);
	};

	const saveSupplier = async () => {
		if (!supplierForm.name.trim()) return;
		try {
			if (editingSupplier) {
				await apiFetch(`/api/suppliers/${editingSupplier.id}`, {
					method: "PATCH",
					body: JSON.stringify(supplierForm),
				});
			} else {
				await apiFetch("/api/suppliers", {
					method: "POST",
					body: JSON.stringify(supplierForm),
				});
			}
			setShowSupplierModal(false);
			await fetchSuppliers();
		} catch {
			/* silent */
		}
	};

	const deleteSupplier = (s: Supplier) => {
		setConfirm({
			message: `Eliminar proveedor "${s.name}"? Se borran todas sus facturas.`,
			action: async () => {
				try {
					await apiFetch(`/api/suppliers/${s.id}`, { method: "DELETE" });
					setConfirm(null);
					await Promise.all([fetchSuppliers(), fetchInvoices()]);
				} catch {
					setConfirm(null);
				}
			},
		});
	};

	// ─── Invoice CRUD ──────────────────────────────────────────────────────────

	const openNewInvoice = () => {
		setInvForm({
			supplierId: suppliers[0]?.id ?? "",
			number: "",
			date: new Date().toISOString().slice(0, 10),
			dueDate: "",
			photoUrl: "",
			notes: "",
		});
		setInvLines([{ ...EMPTY_LINE }]);
		setShowInvoiceModal(true);
	};

	const updateLine = (
		idx: number,
		field: keyof InvoiceItem,
		value: string | number,
	) => {
		setInvLines((prev) => {
			const next = prev.map((l, i) => {
				if (i !== idx) return l;
				const updated = { ...l, [field]: value };
				updated.subtotal = updated.quantity * updated.unitPrice;
				return updated;
			});
			return next;
		});
	};

	const addLine = () => setInvLines((prev) => [...prev, { ...EMPTY_LINE }]);
	const removeLine = (idx: number) =>
		setInvLines((prev) => prev.filter((_, i) => i !== idx));

	const invSubtotal = invLines.reduce((s, l) => s + l.subtotal, 0);
	const invIva = invLines.reduce(
		(s, l) => s + l.subtotal * (l.ivaRate / 100),
		0,
	);
	const invTotal = invSubtotal + invIva;

	const saveInvoice = async () => {
		if (!invForm.supplierId || !invForm.number || !invForm.date) return;
		const validLines = invLines.filter(
			(l) => l.description.trim() && l.quantity > 0,
		);
		try {
			await apiFetch("/api/supplier-invoices", {
				method: "POST",
				body: JSON.stringify({
					...invForm,
					subtotal: invSubtotal,
					iva: invIva,
					total: invTotal,
					items: validLines,
				}),
			});
			setShowInvoiceModal(false);
			await fetchInvoices();
		} catch {
			/* silent */
		}
	};

	const markPaid = async () => {
		if (!payInvoiceId) return;
		try {
			await apiFetch(`/api/supplier-invoices/${payInvoiceId}`, {
				method: "PATCH",
				body: JSON.stringify({
					status: "paid",
					paidAt: new Date().toISOString(),
					paymentMethod: payMethod,
				}),
			});
			setPayInvoiceId(null);
			await fetchInvoices();
		} catch {
			/* silent */
		}
	};

	const deleteInvoice = (inv: SupplierInvoice) => {
		setConfirm({
			message: `Eliminar factura ${inv.number}?`,
			action: async () => {
				try {
					await apiFetch(`/api/supplier-invoices/${inv.id}`, {
						method: "DELETE",
					});
					setConfirm(null);
					await fetchInvoices();
				} catch {
					setConfirm(null);
				}
			},
		});
	};

	// ─── Render ────────────────────────────────────────────────────────────────

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="flex flex-col items-center gap-3 animate-fade-in">
					<div
						className="rounded-full animate-pulse"
						style={{
							width: 48,
							height: 48,
							background: "rgba(var(--gold-rgb, 212 175 55), 0.1)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Truck size={22} className="text-ink-tertiary" />
					</div>
					<p className="font-body text-sm text-ink-disabled">
						Cargando proveedores...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
			{/* ── Header ──────────────────────────────────────────────────────── */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div className="flex items-center gap-3">
					<div
						className="rounded-md"
						style={{
							width: 4,
							height: 28,
							background: "var(--gold)",
						}}
					/>
					<div>
						<h1 className="font-display text-[22px] font-bold text-ink-primary leading-none">
							Proveedores
						</h1>
						<p className="font-body text-xs text-ink-tertiary mt-1">
							Gestion de proveedores y cuentas por pagar
						</p>
					</div>
				</div>
				<button
					className="btn-ghost flex items-center gap-2 text-sm"
					onClick={handlePrint}
				>
					<Printer size={15} />
					Imprimir reporte
				</button>
			</div>

			{/* ── KPI Cards ───────────────────────────────────────────────────── */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<KpiCard
					icon={Truck}
					color="var(--gold)"
					value={suppliers.length}
					label="Proveedores"
				/>
				<KpiCard
					icon={FileText}
					color="#60a5fa"
					value={invoices.length}
					label="Facturas"
				/>
				<KpiCard
					icon={Clock}
					color="#f59e0b"
					value={pendingInvoices.length}
					label="Pendientes"
				/>
				<KpiCard
					icon={DollarSign}
					color="#ef4444"
					value={formatCurrency(totalOwed)}
					label="Deuda total"
				/>
			</div>

			{/* ── Tabs ────────────────────────────────────────────────────────── */}
			<div
				className="flex gap-0"
				style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
			>
				{(
					[
						["suppliers", "Proveedores", Truck],
						["invoices", "Facturas", FileText],
					] as const
				).map(([key, label, Icon]) => {
					const active = tab === key;
					return (
						<button
							key={key}
							className="relative font-display text-sm px-5 py-3 transition-colors"
							style={{
								color: active ? "var(--gold)" : "rgba(255,255,255,0.35)",
								letterSpacing: "0.08em",
							}}
							onClick={() => setTab(key)}
						>
							<span className="flex items-center gap-2">
								<Icon size={14} />
								{label}
							</span>
							{active && (
								<span
									className="absolute bottom-0 left-0 right-0 h-[2px]"
									style={{ background: "var(--gold)" }}
								/>
							)}
						</button>
					);
				})}
			</div>

			{/* ── Suppliers tab ────────────────────────────────────────────────── */}
			{tab === "suppliers" && (
				<div className="space-y-5 animate-slide-up">
					<div className="flex justify-end">
						<button
							className="btn-primary flex items-center gap-2 text-sm"
							onClick={openNewSupplier}
						>
							<Plus size={15} /> Nuevo Proveedor
						</button>
					</div>

					{suppliers.length === 0 ? (
						<div className="card p-16 text-center animate-fade-in">
							<div
								className="mx-auto mb-4 flex items-center justify-center rounded-2xl"
								style={{
									width: 64,
									height: 64,
									background: "rgba(255,255,255,0.03)",
								}}
							>
								<Package size={28} className="text-ink-disabled" />
							</div>
							<p className="font-display text-sm text-ink-tertiary">
								No hay proveedores registrados
							</p>
							<p className="font-body text-xs text-ink-disabled mt-1">
								Agrega tu primer proveedor para comenzar
							</p>
						</div>
					) : (
						<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
							{suppliers.map((s) => {
								const isExpanded = expandedSupplierId === s.id;
								const supplierInvoices = invoices.filter(
									(i) =>
										i.supplier?.id === s.id &&
										(i.status === "pending" || i.status === "overdue"),
								);
								const owed = supplierInvoices.reduce(
									(sum, i) => sum + i.total,
									0,
								);
								return (
									<div
										key={s.id}
										className="card p-0 overflow-hidden transition-all hover:ring-1 hover:ring-white/[0.06]"
									>
										<div
											className="p-5 cursor-pointer transition-colors hover:bg-white/[0.02]"
											onClick={() =>
												setExpandedSupplierId(isExpanded ? null : s.id)
											}
										>
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-3">
													<div
														className="flex items-center justify-center rounded-lg shrink-0"
														style={{
															width: 38,
															height: 38,
															background:
																"linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))",
														}}
													>
														<Truck size={16} style={{ color: "var(--gold)" }} />
													</div>
													<div>
														<h3 className="font-display text-sm font-semibold text-ink-primary">
															{s.name}
														</h3>
														{s.cuit && (
															<span className="font-body text-xs text-ink-disabled">
																CUIT: {s.cuit}
															</span>
														)}
													</div>
												</div>
												{isExpanded ? (
													<ChevronUp size={14} className="text-ink-disabled" />
												) : (
													<ChevronDown
														size={14}
														className="text-ink-disabled"
													/>
												)}
											</div>

											{/* Mini stats */}
											<div className="flex gap-5 mt-4">
												<div>
													<p className="font-body text-[10px] text-ink-disabled uppercase tracking-wider">
														Facturas
													</p>
													<p className="font-display text-sm font-bold text-ink-primary">
														{s._count?.invoices ?? 0}
													</p>
												</div>
												<div>
													<p className="font-body text-[10px] text-ink-disabled uppercase tracking-wider">
														Deuda
													</p>
													<p
														className="font-display text-sm font-bold"
														style={{
															color: owed > 0 ? "#f59e0b" : "var(--green)",
														}}
													>
														{formatCurrency(owed)}
													</p>
												</div>
											</div>
										</div>

										{isExpanded && (
											<div
												className="px-5 pb-5 space-y-2.5 animate-slide-up"
												style={{
													borderTop: "1px solid rgba(255,255,255,0.04)",
												}}
											>
												<div className="pt-3 space-y-2">
													{s.phone && (
														<div className="flex items-center gap-2.5 font-body text-xs text-ink-secondary">
															<Phone size={13} className="text-ink-disabled" />
															{s.phone}
														</div>
													)}
													{s.email && (
														<div className="flex items-center gap-2.5 font-body text-xs text-ink-secondary">
															<Mail size={13} className="text-ink-disabled" />
															{s.email}
														</div>
													)}
													{s.address && (
														<div className="flex items-center gap-2.5 font-body text-xs text-ink-secondary">
															<MapPin size={13} className="text-ink-disabled" />
															{s.address}
														</div>
													)}
													{s.notes && (
														<p className="font-body text-xs text-ink-disabled italic pl-[25px]">
															{s.notes}
														</p>
													)}
												</div>
												<div className="divider" />
												<div className="flex gap-2">
													<button
														className="btn-ghost text-xs flex items-center gap-1.5"
														onClick={() => openEditSupplier(s)}
													>
														<Edit3 size={12} /> Editar
													</button>
													<button
														className="btn-ghost text-xs flex items-center gap-1.5 text-red-400 hover:text-red-300"
														onClick={() => deleteSupplier(s)}
													>
														<Trash2 size={12} /> Eliminar
													</button>
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* ── Invoices tab ─────────────────────────────────────────────────── */}
			{tab === "invoices" && (
				<div className="space-y-5 animate-slide-up">
					<div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
						<div className="flex gap-3 flex-wrap">
							<div className="relative">
								<Search
									size={14}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-disabled pointer-events-none"
								/>
								<select
									className="input-base text-sm pl-9"
									value={filterSupplier}
									onChange={(e) => setFilterSupplier(e.target.value)}
									style={{ minWidth: 200 }}
								>
									<option value="">Todos los proveedores</option>
									{suppliers.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name}
										</option>
									))}
								</select>
							</div>
							<select
								className="input-base text-sm"
								value={filterStatus}
								onChange={(e) => setFilterStatus(e.target.value)}
								style={{ minWidth: 160 }}
							>
								<option value="">Todos los estados</option>
								<option value="pending">Pendiente</option>
								<option value="paid">Pagada</option>
								<option value="overdue">Vencida</option>
							</select>
						</div>
						<button
							className="btn-primary flex items-center gap-2 text-sm"
							onClick={openNewInvoice}
						>
							<Plus size={15} /> Nueva Factura
						</button>
					</div>

					{invoices.length === 0 ? (
						<div className="card p-16 text-center animate-fade-in">
							<div
								className="mx-auto mb-4 flex items-center justify-center rounded-2xl"
								style={{
									width: 64,
									height: 64,
									background: "rgba(255,255,255,0.03)",
								}}
							>
								<FileText size={28} className="text-ink-disabled" />
							</div>
							<p className="font-display text-sm text-ink-tertiary">
								No hay facturas registradas
							</p>
							<p className="font-body text-xs text-ink-disabled mt-1">
								Crea una factura desde el boton superior
							</p>
						</div>
					) : (
						<div className="card p-0 overflow-hidden">
							{/* Table header - desktop */}
							<div
								className="hidden md:grid font-body text-[10px] font-medium uppercase tracking-wider text-ink-disabled px-5 py-3"
								style={{
									gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 1fr 0.7fr 0.8fr",
									borderBottom: "1px solid rgba(255,255,255,0.04)",
								}}
							>
								<span>Proveedor</span>
								<span>Nro Factura</span>
								<span>Fecha</span>
								<span>Vencimiento</span>
								<span className="text-right">Total</span>
								<span className="text-center">Estado</span>
								<span />
							</div>

							{/* Rows */}
							{invoices.map((inv, idx) => (
								<div
									key={inv.id}
									className="transition-colors hover:bg-white/[0.02]"
									style={{
										borderBottom:
											idx < invoices.length - 1
												? "1px solid rgba(255,255,255,0.03)"
												: "none",
									}}
								>
									<div
										className="md:grid md:items-center px-5 py-3.5"
										style={{
											gridTemplateColumns:
												"1.5fr 1fr 0.8fr 0.8fr 1fr 0.7fr 0.8fr",
										}}
									>
										<span className="font-body text-sm font-medium text-ink-primary">
											{inv.supplier?.name ?? "\u2014"}
										</span>
										<span className="font-body text-sm text-ink-secondary">
											{inv.number}
										</span>
										<span className="font-body text-xs text-ink-tertiary">
											{fmtDate(inv.date)}
										</span>
										<span className="font-body text-xs text-ink-tertiary">
											{inv.dueDate ? fmtDate(inv.dueDate) : "\u2014"}
										</span>
										<span
											className="font-display text-sm font-bold text-right"
											style={{ color: "var(--gold)" }}
										>
											{formatCurrency(inv.total)}
										</span>
										<span className="text-center">
											<StatusBadge status={inv.status} />
										</span>
										<div className="flex gap-1 justify-end mt-2 md:mt-0">
											{inv.status !== "paid" && (
												<button
													className="btn-ghost text-xs flex items-center gap-1 text-green-400 hover:text-green-300"
													onClick={() => {
														setPayInvoiceId(inv.id);
														setPayMethod("efectivo");
													}}
												>
													<CheckCircle size={13} /> Pagar
												</button>
											)}
											<button
												className="btn-ghost text-xs p-1.5 text-red-400 hover:text-red-300"
												onClick={() => deleteInvoice(inv)}
											>
												<Trash2 size={13} />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* ── Supplier modal ───────────────────────────────────────────────── */}
			<Modal
				open={showSupplierModal}
				onClose={() => setShowSupplierModal(false)}
				title={editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
			>
				<div className="space-y-4">
					{(
						[
							["name", "Nombre *", "text"],
							["cuit", "CUIT", "text"],
							["address", "Direccion", "text"],
							["phone", "Telefono", "text"],
							["email", "Email", "email"],
						] as const
					).map(([key, label, type]) => (
						<div key={key}>
							<FieldLabel>{label}</FieldLabel>
							<input
								className="input-base w-full text-sm"
								type={type}
								value={supplierForm[key]}
								onChange={(e) =>
									setSupplierForm((f) => ({ ...f, [key]: e.target.value }))
								}
							/>
						</div>
					))}
					<div>
						<FieldLabel>Notas</FieldLabel>
						<textarea
							className="input-base w-full text-sm"
							rows={3}
							value={supplierForm.notes}
							onChange={(e) =>
								setSupplierForm((f) => ({ ...f, notes: e.target.value }))
							}
						/>
					</div>
					<div
						className="flex justify-end gap-3 pt-3"
						style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
					>
						<button
							className="btn-ghost text-sm"
							onClick={() => setShowSupplierModal(false)}
						>
							Cancelar
						</button>
						<button className="btn-primary text-sm" onClick={saveSupplier}>
							Guardar
						</button>
					</div>
				</div>
			</Modal>

			{/* ── Invoice modal ─────────────────────────────────────────────────── */}
			<Modal
				open={showInvoiceModal}
				onClose={() => setShowInvoiceModal(false)}
				title="Nueva Factura Proveedor"
				wide
			>
				<div className="space-y-5">
					<div className="grid grid-cols-2 gap-4">
						<div className="col-span-2">
							<FieldLabel>Proveedor *</FieldLabel>
							<select
								className="input-base w-full text-sm"
								value={invForm.supplierId}
								onChange={(e) =>
									setInvForm((f) => ({ ...f, supplierId: e.target.value }))
								}
							>
								<option value="">Seleccionar...</option>
								{suppliers.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name}
									</option>
								))}
							</select>
						</div>
						<div>
							<FieldLabel>Nro Factura *</FieldLabel>
							<input
								className="input-base w-full text-sm"
								value={invForm.number}
								onChange={(e) =>
									setInvForm((f) => ({ ...f, number: e.target.value }))
								}
							/>
						</div>
						<div>
							<FieldLabel>Fecha *</FieldLabel>
							<input
								className="input-base w-full text-sm"
								type="date"
								value={invForm.date}
								onChange={(e) =>
									setInvForm((f) => ({ ...f, date: e.target.value }))
								}
							/>
						</div>
						<div>
							<FieldLabel>Vencimiento</FieldLabel>
							<input
								className="input-base w-full text-sm"
								type="date"
								value={invForm.dueDate}
								onChange={(e) =>
									setInvForm((f) => ({ ...f, dueDate: e.target.value }))
								}
							/>
						</div>
						<div>
							<FieldLabel>Foto URL</FieldLabel>
							<input
								className="input-base w-full text-sm"
								value={invForm.photoUrl}
								onChange={(e) =>
									setInvForm((f) => ({ ...f, photoUrl: e.target.value }))
								}
								placeholder="https://..."
							/>
						</div>
					</div>

					{/* Line items */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<FieldLabel>Items</FieldLabel>
							<button
								className="btn-ghost text-xs flex items-center gap-1.5"
								onClick={addLine}
							>
								<Plus size={13} /> Agregar linea
							</button>
						</div>

						{/* Line header */}
						<div
							className="hidden md:grid gap-2 mb-2 font-body text-[10px] uppercase tracking-wider text-ink-disabled px-1"
							style={{ gridTemplateColumns: "2fr 0.6fr 1fr 0.6fr auto" }}
						>
							<span>Descripcion</span>
							<span className="text-center">Cant.</span>
							<span className="text-right">Precio unit.</span>
							<span className="text-center">IVA</span>
							<span style={{ width: 28 }} />
						</div>

						<div className="space-y-2">
							{invLines.map((line, idx) => (
								<div
									key={idx}
									className="grid gap-2"
									style={{ gridTemplateColumns: "2fr 0.6fr 1fr 0.6fr auto" }}
								>
									<input
										className="input-base text-xs"
										placeholder="Descripcion"
										value={line.description}
										onChange={(e) =>
											updateLine(idx, "description", e.target.value)
										}
									/>
									<input
										className="input-base text-xs text-center"
										type="number"
										min={0}
										step={1}
										value={line.quantity}
										onChange={(e) =>
											updateLine(idx, "quantity", Number(e.target.value))
										}
									/>
									<input
										className="input-base text-xs text-right"
										type="number"
										min={0}
										step={0.01}
										placeholder="Precio unit."
										value={line.unitPrice || ""}
										onChange={(e) =>
											updateLine(idx, "unitPrice", Number(e.target.value))
										}
									/>
									<select
										className="input-base text-xs"
										value={line.ivaRate}
										onChange={(e) =>
											updateLine(idx, "ivaRate", Number(e.target.value))
										}
									>
										<option value={0}>0%</option>
										<option value={10.5}>10.5%</option>
										<option value={21}>21%</option>
										<option value={27}>27%</option>
									</select>
									<button
										className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
										onClick={() => removeLine(idx)}
									>
										<X size={14} />
									</button>
								</div>
							))}
						</div>
					</div>

					{/* Totals */}
					<div className="divider" />
					<div className="space-y-1.5 text-right text-sm font-body">
						<div className="flex justify-end gap-6">
							<span className="text-ink-tertiary">Subtotal:</span>
							<span className="text-ink-secondary w-28">
								{formatCurrency(invSubtotal)}
							</span>
						</div>
						<div className="flex justify-end gap-6">
							<span className="text-ink-tertiary">IVA:</span>
							<span className="text-ink-secondary w-28">
								{formatCurrency(invIva)}
							</span>
						</div>
						<div className="flex justify-end gap-6 pt-1">
							<span
								className="font-display font-bold"
								style={{ color: "var(--gold)" }}
							>
								Total:
							</span>
							<span
								className="font-display text-lg font-bold w-28"
								style={{ color: "var(--gold)" }}
							>
								{formatCurrency(invTotal)}
							</span>
						</div>
					</div>

					<div>
						<FieldLabel>Notas</FieldLabel>
						<textarea
							className="input-base w-full text-sm"
							rows={2}
							value={invForm.notes}
							onChange={(e) =>
								setInvForm((f) => ({ ...f, notes: e.target.value }))
							}
						/>
					</div>

					<div
						className="flex justify-end gap-3 pt-3"
						style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
					>
						<button
							className="btn-ghost text-sm"
							onClick={() => setShowInvoiceModal(false)}
						>
							Cancelar
						</button>
						<button className="btn-primary text-sm" onClick={saveInvoice}>
							Guardar Factura
						</button>
					</div>
				</div>
			</Modal>

			{/* ── Pay modal ────────────────────────────────────────────────────── */}
			<Modal
				open={!!payInvoiceId}
				onClose={() => setPayInvoiceId(null)}
				title="Registrar Pago"
			>
				<div className="space-y-5">
					<div
						className="flex items-center justify-center rounded-xl mx-auto"
						style={{
							width: 52,
							height: 52,
							background: "rgba(34,197,94,0.1)",
						}}
					>
						<CheckCircle size={24} className="text-green-400" />
					</div>
					<div>
						<FieldLabel>Metodo de pago</FieldLabel>
						<select
							className="input-base w-full text-sm"
							value={payMethod}
							onChange={(e) => setPayMethod(e.target.value)}
						>
							<option value="efectivo">Efectivo</option>
							<option value="transferencia">Transferencia</option>
							<option value="cheque">Cheque</option>
							<option value="mercadopago">MercadoPago</option>
							<option value="tarjeta">Tarjeta</option>
						</select>
					</div>
					<div
						className="flex justify-end gap-3 pt-3"
						style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
					>
						<button
							className="btn-ghost text-sm"
							onClick={() => setPayInvoiceId(null)}
						>
							Cancelar
						</button>
						<button className="btn-primary text-sm" onClick={markPaid}>
							Confirmar Pago
						</button>
					</div>
				</div>
			</Modal>

			{/* ── Confirm dialog ───────────────────────────────────────────────── */}
			<ConfirmDialog
				open={!!confirm}
				message={confirm?.message ?? ""}
				onConfirm={() => confirm?.action()}
				onCancel={() => setConfirm(null)}
			/>
		</div>
	);
}
