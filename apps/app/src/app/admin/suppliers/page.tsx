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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

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

// ─── Section label ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<span
			className="font-display"
			style={{
				fontSize: 9,
				textTransform: "uppercase",
				letterSpacing: "0.25em",
				opacity: 0.5,
			}}
		>
			{children}
		</span>
	);
}

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
	const cfg: Record<string, { bg: string; text: string; label: string }> = {
		pending: {
			bg: "rgba(245,158,11,0.15)",
			text: "#f59e0b",
			label: "Pendiente",
		},
		paid: { bg: "rgba(34,197,94,0.15)", text: "#22c55e", label: "Pagada" },
		overdue: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", label: "Vencida" },
	};
	const c = cfg[status] ?? cfg.pending;
	return (
		<span
			className="badge"
			style={{
				background: c.bg,
				color: c.text,
				fontSize: 11,
				padding: "2px 10px",
				borderRadius: 999,
			}}
		>
			{c.label}
		</span>
	);
}

// ─── Modal shell ─────────────────────────────────────────────────────────────

function Modal({
	open,
	onClose,
	title,
	children,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
}) {
	if (!open) return null;
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 100,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(0,0,0,0.7)",
			}}
			onClick={onClose}
		>
			<div
				className="card"
				style={{
					width: "100%",
					maxWidth: 560,
					maxHeight: "90vh",
					overflow: "auto",
					padding: 24,
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between mb-5">
					<h3 className="font-kds text-xl" style={{ color: "var(--gold)" }}>
						{title}
					</h3>
					<button className="btn-ghost p-1" onClick={onClose}>
						<X size={18} />
					</button>
				</div>
				{children}
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
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 110,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(0,0,0,0.7)",
			}}
			onClick={onCancel}
		>
			<div
				className="card"
				style={{ padding: 24, maxWidth: 400, width: "100%" }}
				onClick={(e) => e.stopPropagation()}
			>
				<p className="font-body text-sm mb-5">{message}</p>
				<div className="flex gap-3 justify-end">
					<button className="btn-ghost text-sm" onClick={onCancel}>
						Cancelar
					</button>
					<button className="btn-primary text-sm" onClick={onConfirm}>
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
				<div className="font-body text-sm" style={{ opacity: 0.5 }}>
					Cargando proveedores...
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
			{/* ── Header ──────────────────────────────────────────────────────── */}
			<div className="flex flex-col md:flex-row md:items-end gap-4">
				<h1
					className="font-kds"
					style={{ fontSize: 40, lineHeight: 1, color: "var(--gold)" }}
				>
					PROVEEDORES
				</h1>
				<div className="flex gap-3 flex-wrap">
					<div className="card px-4 py-2 flex items-center gap-2">
						<Truck size={14} style={{ color: "var(--gold)" }} />
						<span className="font-kds text-lg" style={{ color: "var(--gold)" }}>
							{suppliers.length}
						</span>
						<SectionLabel>proveedores</SectionLabel>
					</div>
					<div className="card px-4 py-2 flex items-center gap-2">
						<Clock size={14} style={{ color: "#f59e0b" }} />
						<span className="font-kds text-lg" style={{ color: "#f59e0b" }}>
							{pendingInvoices.length}
						</span>
						<SectionLabel>pendientes</SectionLabel>
					</div>
					<div className="card px-4 py-2 flex items-center gap-2">
						<AlertCircle size={14} style={{ color: "#ef4444" }} />
						<span className="font-kds text-lg" style={{ color: "#ef4444" }}>
							{formatCurrency(totalOwed)}
						</span>
						<SectionLabel>deuda total</SectionLabel>
					</div>
				</div>
			</div>

			{/* ── Tabs ────────────────────────────────────────────────────────── */}
			<div
				className="flex gap-1"
				style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
			>
				{(
					[
						["suppliers", "Proveedores"],
						["invoices", "Facturas Proveedor"],
					] as const
				).map(([key, label]) => (
					<button
						key={key}
						className="font-display px-4 py-2 text-sm transition-colors"
						style={{
							textTransform: "uppercase",
							letterSpacing: "0.12em",
							borderBottom:
								tab === key ? "2px solid var(--gold)" : "2px solid transparent",
							color: tab === key ? "var(--gold)" : "rgba(255,255,255,0.4)",
						}}
						onClick={() => setTab(key)}
					>
						{label}
					</button>
				))}
			</div>

			{/* ── Suppliers tab ────────────────────────────────────────────────── */}
			{tab === "suppliers" && (
				<>
					<div className="flex justify-end">
						<button
							className="btn-primary flex items-center gap-2 text-sm"
							onClick={openNewSupplier}
						>
							<Plus size={14} /> Nuevo Proveedor
						</button>
					</div>

					{suppliers.length === 0 ? (
						<div className="card p-12 text-center">
							<Truck size={40} style={{ margin: "0 auto", opacity: 0.2 }} />
							<p className="font-body text-sm mt-3" style={{ opacity: 0.4 }}>
								No hay proveedores registrados
							</p>
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{suppliers.map((s) => {
								const isExpanded = expandedSupplierId === s.id;
								return (
									<div key={s.id} className="card p-0 overflow-hidden">
										<div
											className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
											onClick={() =>
												setExpandedSupplierId(isExpanded ? null : s.id)
											}
										>
											<div className="flex items-start justify-between">
												<div>
													<h3 className="font-display text-sm font-semibold">
														{s.name}
													</h3>
													{s.cuit && (
														<span
															className="font-body text-xs"
															style={{ opacity: 0.4 }}
														>
															CUIT: {s.cuit}
														</span>
													)}
												</div>
												{isExpanded ? (
													<ChevronUp size={14} style={{ opacity: 0.3 }} />
												) : (
													<ChevronDown size={14} style={{ opacity: 0.3 }} />
												)}
											</div>
											<div className="flex gap-4 mt-3">
												<div>
													<SectionLabel>facturas</SectionLabel>
													<p
														className="font-kds text-lg"
														style={{ color: "var(--gold)" }}
													>
														{s._count?.invoices ?? 0}
													</p>
												</div>
											</div>
										</div>
										{isExpanded && (
											<div
												className="px-4 pb-4 space-y-3"
												style={{
													borderTop: "1px solid rgba(255,255,255,0.04)",
												}}
											>
												{s.phone && (
													<div
														className="flex items-center gap-2 text-xs font-body"
														style={{ opacity: 0.6 }}
													>
														<Phone size={12} /> {s.phone}
													</div>
												)}
												{s.email && (
													<div
														className="flex items-center gap-2 text-xs font-body"
														style={{ opacity: 0.6 }}
													>
														<Mail size={12} /> {s.email}
													</div>
												)}
												{s.address && (
													<div
														className="flex items-center gap-2 text-xs font-body"
														style={{ opacity: 0.6 }}
													>
														<MapPin size={12} /> {s.address}
													</div>
												)}
												{s.notes && (
													<p
														className="font-body text-xs"
														style={{ opacity: 0.4, fontStyle: "italic" }}
													>
														{s.notes}
													</p>
												)}
												<div className="flex gap-2 pt-2">
													<button
														className="btn-ghost text-xs flex items-center gap-1"
														onClick={() => openEditSupplier(s)}
													>
														<Edit3 size={12} /> Editar
													</button>
													<button
														className="btn-ghost text-xs flex items-center gap-1"
														style={{ color: "#ef4444" }}
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
				</>
			)}

			{/* ── Invoices tab ─────────────────────────────────────────────────── */}
			{tab === "invoices" && (
				<>
					<div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
						<div className="flex gap-3 flex-wrap">
							<select
								className="input-base text-sm"
								value={filterSupplier}
								onChange={(e) => setFilterSupplier(e.target.value)}
								style={{ minWidth: 180 }}
							>
								<option value="">Todos los proveedores</option>
								{suppliers.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name}
									</option>
								))}
							</select>
							<select
								className="input-base text-sm"
								value={filterStatus}
								onChange={(e) => setFilterStatus(e.target.value)}
								style={{ minWidth: 140 }}
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
							<Plus size={14} /> Nueva Factura
						</button>
					</div>

					{invoices.length === 0 ? (
						<div className="card p-12 text-center">
							<FileText size={40} style={{ margin: "0 auto", opacity: 0.2 }} />
							<p className="font-body text-sm mt-3" style={{ opacity: 0.4 }}>
								No hay facturas registradas
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{/* Header row - desktop */}
							<div
								className="hidden md:grid font-display text-xs px-4 py-2"
								style={{
									gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 1fr 0.7fr 0.8fr",
									textTransform: "uppercase",
									letterSpacing: "0.2em",
									opacity: 0.35,
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
							{invoices.map((inv) => (
								<div key={inv.id} className="card p-4 md:p-0">
									<div
										className="md:grid md:items-center md:px-4 md:py-3"
										style={{
											gridTemplateColumns:
												"1.5fr 1fr 0.8fr 0.8fr 1fr 0.7fr 0.8fr",
										}}
									>
										<span className="font-body text-sm font-medium">
											{inv.supplier?.name ?? "—"}
										</span>
										<span
											className="font-body text-sm"
											style={{ opacity: 0.7 }}
										>
											{inv.number}
										</span>
										<span
											className="font-body text-xs"
											style={{ opacity: 0.5 }}
										>
											{fmtDate(inv.date)}
										</span>
										<span
											className="font-body text-xs"
											style={{ opacity: 0.5 }}
										>
											{inv.dueDate ? fmtDate(inv.dueDate) : "—"}
										</span>
										<span
											className="font-kds text-base text-right"
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
													className="btn-ghost text-xs flex items-center gap-1"
													style={{ color: "#22c55e" }}
													onClick={() => {
														setPayInvoiceId(inv.id);
														setPayMethod("efectivo");
													}}
												>
													<CheckCircle size={12} /> Pagar
												</button>
											)}
											<button
												className="btn-ghost text-xs p-1"
												style={{ color: "#ef4444" }}
												onClick={() => deleteInvoice(inv)}
											>
												<Trash2 size={12} />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</>
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
							<SectionLabel>{label}</SectionLabel>
							<input
								className="input-base w-full mt-1 text-sm"
								type={type}
								value={supplierForm[key]}
								onChange={(e) =>
									setSupplierForm((f) => ({ ...f, [key]: e.target.value }))
								}
							/>
						</div>
					))}
					<div>
						<SectionLabel>Notas</SectionLabel>
						<textarea
							className="input-base w-full mt-1 text-sm"
							rows={3}
							value={supplierForm.notes}
							onChange={(e) =>
								setSupplierForm((f) => ({ ...f, notes: e.target.value }))
							}
						/>
					</div>
					<div className="flex justify-end gap-3 pt-2">
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
			>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="col-span-2">
							<SectionLabel>Proveedor *</SectionLabel>
							<select
								className="input-base w-full mt-1 text-sm"
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
							<SectionLabel>Nro Factura *</SectionLabel>
							<input
								className="input-base w-full mt-1 text-sm"
								value={invForm.number}
								onChange={(e) =>
									setInvForm((f) => ({ ...f, number: e.target.value }))
								}
							/>
						</div>
						<div>
							<SectionLabel>Fecha *</SectionLabel>
							<input
								className="input-base w-full mt-1 text-sm"
								type="date"
								value={invForm.date}
								onChange={(e) =>
									setInvForm((f) => ({ ...f, date: e.target.value }))
								}
							/>
						</div>
						<div>
							<SectionLabel>Vencimiento</SectionLabel>
							<input
								className="input-base w-full mt-1 text-sm"
								type="date"
								value={invForm.dueDate}
								onChange={(e) =>
									setInvForm((f) => ({ ...f, dueDate: e.target.value }))
								}
							/>
						</div>
						<div>
							<SectionLabel>Foto URL</SectionLabel>
							<input
								className="input-base w-full mt-1 text-sm"
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
						<div className="flex items-center justify-between mb-2">
							<SectionLabel>Items</SectionLabel>
							<button
								className="btn-ghost text-xs flex items-center gap-1"
								onClick={addLine}
							>
								<Plus size={12} /> Agregar linea
							</button>
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
										className="btn-ghost p-1"
										onClick={() => removeLine(idx)}
										style={{ color: "#ef4444" }}
									>
										<X size={14} />
									</button>
								</div>
							))}
						</div>
					</div>

					{/* Totals */}
					<div
						className="space-y-1 text-right text-sm font-body"
						style={{
							borderTop: "1px solid rgba(255,255,255,0.06)",
							paddingTop: 12,
						}}
					>
						<div className="flex justify-end gap-4">
							<span style={{ opacity: 0.5 }}>Subtotal:</span>
							<span>{formatCurrency(invSubtotal)}</span>
						</div>
						<div className="flex justify-end gap-4">
							<span style={{ opacity: 0.5 }}>IVA:</span>
							<span>{formatCurrency(invIva)}</span>
						</div>
						<div className="flex justify-end gap-4 font-semibold">
							<span style={{ color: "var(--gold)" }}>Total:</span>
							<span
								className="font-kds text-lg"
								style={{ color: "var(--gold)" }}
							>
								{formatCurrency(invTotal)}
							</span>
						</div>
					</div>

					<div>
						<SectionLabel>Notas</SectionLabel>
						<textarea
							className="input-base w-full mt-1 text-sm"
							rows={2}
							value={invForm.notes}
							onChange={(e) =>
								setInvForm((f) => ({ ...f, notes: e.target.value }))
							}
						/>
					</div>

					<div className="flex justify-end gap-3 pt-2">
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
				<div className="space-y-4">
					<div>
						<SectionLabel>Metodo de pago</SectionLabel>
						<select
							className="input-base w-full mt-1 text-sm"
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
					<div className="flex justify-end gap-3">
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
