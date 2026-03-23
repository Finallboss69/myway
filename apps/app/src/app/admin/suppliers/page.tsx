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

// --- Types ---

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

// --- KPI Card ---

function KpiCard({
	icon: Icon,
	color,
	value,
	label,
}: {
	icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
	color: string;
	value: string | number;
	label: string;
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

// --- Status badge ---

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, { label: string; color: string; bg: string }> = {
		pending: {
			label: "Pendiente",
			color: "#f59e0b",
			bg: "rgba(245,158,11,0.12)",
		},
		paid: { label: "Pagada", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
		overdue: { label: "Vencida", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
	};
	const s = map[status] ?? {
		label: "Pendiente",
		color: "#888",
		bg: "rgba(136,136,136,0.12)",
	};
	return (
		<span
			style={{
				background: s.bg,
				color: s.color,
				border: `1px solid ${s.color}33`,
				borderRadius: 99,
				fontSize: 9,
				fontFamily: "var(--font-syne)",
				fontWeight: 700,
				letterSpacing: "0.15em",
				padding: "2px 8px",
				textTransform: "uppercase",
			}}
		>
			{s.label}
		</span>
	);
}

// --- Field label ---

function FieldLabel({ children }: { children: React.ReactNode }) {
	return (
		<label
			className="font-display uppercase"
			style={{
				fontSize: 9,
				letterSpacing: "0.2em",
				color: "#888",
				fontWeight: 600,
				display: "block",
				marginBottom: 6,
			}}
		>
			{children}
		</label>
	);
}

// --- Modal shell ---

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
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 50,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 16,
				background: "rgba(0,0,0,0.7)",
				backdropFilter: "blur(8px)",
			}}
			onClick={onClose}
		>
			<div
				style={{
					background: "var(--s1)",
					border: "1px solid var(--s4)",
					borderRadius: 16,
					width: "100%",
					maxWidth: wide ? 680 : 560,
					maxHeight: "90vh",
					overflowY: "auto",
					boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div
					className="flex items-center justify-between"
					style={{
						padding: "16px 20px",
						borderBottom: "1px solid var(--s3)",
						background: "var(--s2)",
					}}
				>
					<h2
						className="font-display"
						style={{ fontSize: 16, fontWeight: 700, color: "#f5f5f5" }}
					>
						{title}
					</h2>
					<button
						className="btn-ghost"
						style={{ padding: 6 }}
						onClick={onClose}
					>
						<X size={16} style={{ color: "#666" }} />
					</button>
				</div>
				<div style={{ padding: 20 }}>{children}</div>
			</div>
		</div>
	);
}

// --- Confirm dialog ---

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
				zIndex: 60,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 16,
				background: "rgba(0,0,0,0.7)",
				backdropFilter: "blur(8px)",
			}}
			onClick={onCancel}
		>
			<div
				style={{
					background: "var(--s1)",
					border: "1px solid var(--s4)",
					borderRadius: 16,
					width: "100%",
					maxWidth: 400,
					boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
					padding: 20,
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start gap-3" style={{ marginBottom: 20 }}>
					<div
						style={{
							width: 40,
							height: 40,
							borderRadius: 12,
							background: "rgba(239,68,68,0.12)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
						}}
					>
						<AlertCircle size={20} style={{ color: "#ef4444" }} />
					</div>
					<p
						className="font-body"
						style={{
							fontSize: 13,
							color: "#aaa",
							lineHeight: 1.5,
							paddingTop: 8,
						}}
					>
						{message}
					</p>
				</div>
				<div className="flex gap-3 justify-end">
					<button
						className="btn-ghost"
						style={{ fontSize: 13 }}
						onClick={onCancel}
					>
						Cancelar
					</button>
					<button
						className="btn-primary"
						style={{ fontSize: 13, background: "#ef4444" }}
						onClick={onConfirm}
					>
						Confirmar
					</button>
				</div>
			</div>
		</div>
	);
}

// --- Main page ---

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

	// --- Fetchers ---

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

	// --- Stats ---

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

	// --- Supplier CRUD ---

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

	// --- Invoice CRUD ---

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

	// --- Render ---

	if (loading) {
		return (
			<div
				style={{
					minHeight: "100vh",
					background: "var(--s0)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div className="flex flex-col items-center gap-3 animate-fade-in">
					<div
						style={{
							width: 48,
							height: 48,
							borderRadius: 99,
							background: "rgba(245,158,11,0.1)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
						className="animate-pulse"
					>
						<Truck size={22} style={{ color: "#666" }} />
					</div>
					<p className="font-body" style={{ fontSize: 13, color: "#555" }}>
						Cargando proveedores...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div style={{ minHeight: "100vh", background: "var(--s0)" }}>
			<div
				style={{ padding: "28px 24px 48px", maxWidth: 1200, margin: "0 auto" }}
			>
				{/* --- Header --- */}
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
								PROVEEDORES
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								Gestion de proveedores y cuentas por pagar
							</p>
						</div>
					</div>
					<button
						className="btn-ghost flex items-center gap-2"
						style={{ fontSize: 12 }}
						onClick={handlePrint}
					>
						<Printer size={14} />
						Imprimir reporte
					</button>
				</div>
				<div className="divider-gold" style={{ marginBottom: 28 }} />

				{/* --- KPI Cards --- */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
						gap: 16,
						marginBottom: 28,
					}}
				>
					<KpiCard
						icon={Truck}
						color="#f59e0b"
						value={suppliers.length}
						label="Proveedores"
					/>
					<KpiCard
						icon={FileText}
						color="#3b82f6"
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

				{/* --- Tabs --- */}
				<div
					className="flex gap-0"
					style={{ borderBottom: "1px solid var(--s3)", marginBottom: 24 }}
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
								style={{
									position: "relative",
									padding: "12px 20px",
									background: "transparent",
									border: "none",
									cursor: "pointer",
									color: active ? "var(--gold)" : "#555",
									letterSpacing: "0.08em",
									fontSize: 12,
									fontFamily: "var(--font-syne)",
									fontWeight: 600,
								}}
								onClick={() => setTab(key)}
							>
								<span className="flex items-center gap-2">
									<Icon size={14} />
									{label}
								</span>
								{active && (
									<span
										style={{
											position: "absolute",
											bottom: 0,
											left: 0,
											right: 0,
											height: 2,
											background: "var(--gold)",
										}}
									/>
								)}
							</button>
						);
					})}
				</div>

				{/* --- Suppliers tab --- */}
				{tab === "suppliers" && (
					<div className="animate-fade-in">
						<div className="flex justify-end" style={{ marginBottom: 16 }}>
							<button
								className="btn-primary flex items-center gap-2"
								style={{ fontSize: 12 }}
								onClick={openNewSupplier}
							>
								<Plus size={14} /> Nuevo Proveedor
							</button>
						</div>

						{suppliers.length === 0 ? (
							<div
								style={{
									background: "var(--s1)",
									border: "1px solid var(--s4)",
									borderRadius: 16,
									padding: "60px 32px",
									textAlign: "center",
								}}
							>
								<div
									style={{
										width: 64,
										height: 64,
										borderRadius: 16,
										background: "rgba(255,255,255,0.03)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										margin: "0 auto 16px",
									}}
								>
									<Package size={28} style={{ color: "#444" }} />
								</div>
								<p
									className="font-display"
									style={{ fontSize: 13, color: "#888" }}
								>
									No hay proveedores registrados
								</p>
								<p
									className="font-body"
									style={{ fontSize: 12, color: "#555", marginTop: 4 }}
								>
									Agrega tu primer proveedor para comenzar
								</p>
							</div>
						) : (
							<div
								style={{
									display: "grid",
									gap: 12,
									gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
								}}
							>
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
											style={{
												background: "var(--s1)",
												border: "1px solid var(--s4)",
												borderRadius: 16,
												overflow: "hidden",
												boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
											}}
										>
											<div
												style={{
													padding: "16px 20px",
													cursor: "pointer",
													transition: "background 0.15s",
												}}
												onClick={() =>
													setExpandedSupplierId(isExpanded ? null : s.id)
												}
												onMouseEnter={(e) =>
													(e.currentTarget.style.background = "var(--s2)")
												}
												onMouseLeave={(e) =>
													(e.currentTarget.style.background = "transparent")
												}
											>
												<div className="flex items-start justify-between">
													<div className="flex items-center gap-3">
														<div
															style={{
																width: 38,
																height: 38,
																borderRadius: 10,
																background:
																	"linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))",
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																flexShrink: 0,
															}}
														>
															<Truck
																size={16}
																style={{ color: "var(--gold)" }}
															/>
														</div>
														<div>
															<h3
																className="font-display"
																style={{
																	fontSize: 14,
																	fontWeight: 600,
																	color: "#f5f5f5",
																}}
															>
																{s.name}
															</h3>
															{s.cuit && (
																<span
																	className="font-body"
																	style={{ fontSize: 11, color: "#555" }}
																>
																	CUIT: {s.cuit}
																</span>
															)}
														</div>
													</div>
													{isExpanded ? (
														<ChevronUp size={14} style={{ color: "#555" }} />
													) : (
														<ChevronDown size={14} style={{ color: "#555" }} />
													)}
												</div>

												<div className="flex gap-5" style={{ marginTop: 14 }}>
													<div>
														<p
															className="font-display uppercase"
															style={{
																fontSize: 9,
																letterSpacing: "0.2em",
																color: "#555",
															}}
														>
															Facturas
														</p>
														<p
															className="font-kds"
															style={{ fontSize: 18, color: "#f5f5f5" }}
														>
															{s._count?.invoices ?? 0}
														</p>
													</div>
													<div>
														<p
															className="font-display uppercase"
															style={{
																fontSize: 9,
																letterSpacing: "0.2em",
																color: "#555",
															}}
														>
															Deuda
														</p>
														<p
															className="font-kds"
															style={{
																fontSize: 18,
																color: owed > 0 ? "#f59e0b" : "#10b981",
															}}
														>
															{formatCurrency(owed)}
														</p>
													</div>
												</div>
											</div>

											{isExpanded && (
												<div
													style={{
														padding: "0 20px 16px",
														borderTop: "1px solid var(--s3)",
													}}
												>
													<div
														style={{
															paddingTop: 12,
															display: "flex",
															flexDirection: "column",
															gap: 8,
														}}
													>
														{s.phone && (
															<div
																className="flex items-center gap-2.5 font-body"
																style={{ fontSize: 12, color: "#aaa" }}
															>
																<Phone size={13} style={{ color: "#555" }} />
																{s.phone}
															</div>
														)}
														{s.email && (
															<div
																className="flex items-center gap-2.5 font-body"
																style={{ fontSize: 12, color: "#aaa" }}
															>
																<Mail size={13} style={{ color: "#555" }} />
																{s.email}
															</div>
														)}
														{s.address && (
															<div
																className="flex items-center gap-2.5 font-body"
																style={{ fontSize: 12, color: "#aaa" }}
															>
																<MapPin size={13} style={{ color: "#555" }} />
																{s.address}
															</div>
														)}
														{s.notes && (
															<p
																className="font-body"
																style={{
																	fontSize: 11,
																	color: "#555",
																	fontStyle: "italic",
																	paddingLeft: 25,
																}}
															>
																{s.notes}
															</p>
														)}
													</div>
													<div
														style={{
															height: 1,
															background: "var(--s3)",
															margin: "12px 0",
														}}
													/>
													<div className="flex gap-2">
														<button
															className="btn-ghost flex items-center gap-1.5"
															style={{ fontSize: 11 }}
															onClick={() => openEditSupplier(s)}
														>
															<Edit3 size={12} /> Editar
														</button>
														<button
															className="btn-ghost flex items-center gap-1.5"
															style={{ fontSize: 11, color: "#ef4444" }}
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

				{/* --- Invoices tab --- */}
				{tab === "invoices" && (
					<div className="animate-fade-in">
						<div
							className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between"
							style={{ marginBottom: 16 }}
						>
							<div className="flex gap-3 flex-wrap">
								<div style={{ position: "relative" }}>
									<Search
										size={14}
										style={{
											position: "absolute",
											left: 12,
											top: "50%",
											transform: "translateY(-50%)",
											color: "#555",
											pointerEvents: "none",
										}}
									/>
									<select
										className="input-base"
										value={filterSupplier}
										onChange={(e) => setFilterSupplier(e.target.value)}
										style={{ minWidth: 200, fontSize: 12, paddingLeft: 34 }}
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
									className="input-base"
									value={filterStatus}
									onChange={(e) => setFilterStatus(e.target.value)}
									style={{ minWidth: 160, fontSize: 12 }}
								>
									<option value="">Todos los estados</option>
									<option value="pending">Pendiente</option>
									<option value="paid">Pagada</option>
									<option value="overdue">Vencida</option>
								</select>
							</div>
							<button
								className="btn-primary flex items-center gap-2"
								style={{ fontSize: 12 }}
								onClick={openNewInvoice}
							>
								<Plus size={14} /> Nueva Factura
							</button>
						</div>

						{invoices.length === 0 ? (
							<div
								style={{
									background: "var(--s1)",
									border: "1px solid var(--s4)",
									borderRadius: 16,
									padding: "60px 32px",
									textAlign: "center",
								}}
							>
								<div
									style={{
										width: 64,
										height: 64,
										borderRadius: 16,
										background: "rgba(255,255,255,0.03)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										margin: "0 auto 16px",
									}}
								>
									<FileText size={28} style={{ color: "#444" }} />
								</div>
								<p
									className="font-display"
									style={{ fontSize: 13, color: "#888" }}
								>
									No hay facturas registradas
								</p>
								<p
									className="font-body"
									style={{ fontSize: 12, color: "#555", marginTop: 4 }}
								>
									Crea una factura desde el boton superior
								</p>
							</div>
						) : (
							<div
								style={{
									background: "var(--s1)",
									border: "1px solid var(--s4)",
									borderRadius: 16,
									overflow: "hidden",
									boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
								}}
							>
								{/* Section header */}
								<div
									className="flex items-center gap-2.5"
									style={{
										padding: "14px 20px",
										borderBottom: "1px solid var(--s3)",
										background: "var(--s2)",
									}}
								>
									<FileText size={14} style={{ color: "var(--gold)" }} />
									<span
										className="font-display uppercase"
										style={{
											fontSize: 11,
											letterSpacing: "0.15em",
											color: "#ccc",
											fontWeight: 600,
										}}
									>
										LISTADO DE FACTURAS
									</span>
								</div>

								{/* Table header - desktop */}
								<div
									className="hidden md:grid font-display uppercase"
									style={{
										gridTemplateColumns:
											"1.5fr 1fr 0.8fr 0.8fr 1fr 0.7fr 0.8fr",
										padding: "10px 20px",
										fontSize: 9,
										letterSpacing: "0.2em",
										color: "#555",
										fontWeight: 600,
										borderBottom: "1px solid var(--s3)",
									}}
								>
									<span>Proveedor</span>
									<span>Nro Factura</span>
									<span>Fecha</span>
									<span>Vencimiento</span>
									<span style={{ textAlign: "right" }}>Total</span>
									<span style={{ textAlign: "center" }}>Estado</span>
									<span />
								</div>

								{/* Rows */}
								{invoices.map((inv) => (
									<div
										key={inv.id}
										style={{
											padding: "12px 20px",
											borderBottom: "1px solid var(--s3)",
											transition: "background 0.15s",
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.background = "var(--s2)")
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.background = "transparent")
										}
									>
										<div
											className="md:grid md:items-center"
											style={{
												gridTemplateColumns:
													"1.5fr 1fr 0.8fr 0.8fr 1fr 0.7fr 0.8fr",
											}}
										>
											<span
												className="font-body"
												style={{
													fontSize: 13,
													fontWeight: 500,
													color: "#f5f5f5",
												}}
											>
												{inv.supplier?.name ?? "\u2014"}
											</span>
											<span
												className="font-body"
												style={{ fontSize: 13, color: "#aaa" }}
											>
												{inv.number}
											</span>
											<span
												className="font-body"
												style={{ fontSize: 11, color: "#666" }}
											>
												{fmtDate(inv.date)}
											</span>
											<span
												className="font-body"
												style={{ fontSize: 11, color: "#666" }}
											>
												{inv.dueDate ? fmtDate(inv.dueDate) : "\u2014"}
											</span>
											<span
												className="font-kds"
												style={{
													fontSize: 14,
													textAlign: "right",
													color: "var(--gold)",
												}}
											>
												{formatCurrency(inv.total)}
											</span>
											<span style={{ textAlign: "center" }}>
												<StatusBadge status={inv.status} />
											</span>
											<div
												className="flex gap-1 justify-end"
												style={{ marginTop: 0 }}
											>
												{inv.status !== "paid" && (
													<button
														className="btn-ghost flex items-center gap-1"
														style={{ fontSize: 11, color: "#10b981" }}
														onClick={() => {
															setPayInvoiceId(inv.id);
															setPayMethod("efectivo");
														}}
													>
														<CheckCircle size={13} /> Pagar
													</button>
												)}
												<button
													className="btn-ghost"
													style={{ padding: 6, color: "#ef4444" }}
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

				{/* --- Supplier modal --- */}
				<Modal
					open={showSupplierModal}
					onClose={() => setShowSupplierModal(false)}
					title={editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
									className="input-base"
									type={type}
									value={supplierForm[key]}
									onChange={(e) =>
										setSupplierForm((f) => ({ ...f, [key]: e.target.value }))
									}
									style={{ width: "100%", fontSize: 13 }}
								/>
							</div>
						))}
						<div>
							<FieldLabel>Notas</FieldLabel>
							<textarea
								className="input-base"
								rows={3}
								value={supplierForm.notes}
								onChange={(e) =>
									setSupplierForm((f) => ({ ...f, notes: e.target.value }))
								}
								style={{ width: "100%", fontSize: 13 }}
							/>
						</div>
						<div
							className="flex justify-end gap-3"
							style={{ paddingTop: 12, borderTop: "1px solid var(--s3)" }}
						>
							<button
								className="btn-ghost"
								style={{ fontSize: 13 }}
								onClick={() => setShowSupplierModal(false)}
							>
								Cancelar
							</button>
							<button
								className="btn-primary"
								style={{ fontSize: 13 }}
								onClick={saveSupplier}
							>
								Guardar
							</button>
						</div>
					</div>
				</Modal>

				{/* --- Invoice modal --- */}
				<Modal
					open={showInvoiceModal}
					onClose={() => setShowInvoiceModal(false)}
					title="Nueva Factura Proveedor"
					wide
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: 16,
							}}
						>
							<div style={{ gridColumn: "1 / -1" }}>
								<FieldLabel>Proveedor *</FieldLabel>
								<select
									className="input-base"
									value={invForm.supplierId}
									onChange={(e) =>
										setInvForm((f) => ({ ...f, supplierId: e.target.value }))
									}
									style={{ width: "100%", fontSize: 13 }}
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
									className="input-base"
									value={invForm.number}
									onChange={(e) =>
										setInvForm((f) => ({ ...f, number: e.target.value }))
									}
									style={{ width: "100%", fontSize: 13 }}
								/>
							</div>
							<div>
								<FieldLabel>Fecha *</FieldLabel>
								<input
									className="input-base"
									type="date"
									value={invForm.date}
									onChange={(e) =>
										setInvForm((f) => ({ ...f, date: e.target.value }))
									}
									style={{ width: "100%", fontSize: 13 }}
								/>
							</div>
							<div>
								<FieldLabel>Vencimiento</FieldLabel>
								<input
									className="input-base"
									type="date"
									value={invForm.dueDate}
									onChange={(e) =>
										setInvForm((f) => ({ ...f, dueDate: e.target.value }))
									}
									style={{ width: "100%", fontSize: 13 }}
								/>
							</div>
							<div>
								<FieldLabel>Foto URL</FieldLabel>
								<input
									className="input-base"
									value={invForm.photoUrl}
									onChange={(e) =>
										setInvForm((f) => ({ ...f, photoUrl: e.target.value }))
									}
									placeholder="https://..."
									style={{ width: "100%", fontSize: 13 }}
								/>
							</div>
						</div>

						{/* Line items */}
						<div>
							<div
								className="flex items-center justify-between"
								style={{ marginBottom: 12 }}
							>
								<FieldLabel>Items</FieldLabel>
								<button
									className="btn-ghost flex items-center gap-1.5"
									style={{ fontSize: 11 }}
									onClick={addLine}
								>
									<Plus size={13} /> Agregar linea
								</button>
							</div>

							<div
								className="hidden md:grid font-display uppercase"
								style={{
									gridTemplateColumns: "2fr 0.6fr 1fr 0.6fr auto",
									gap: 8,
									marginBottom: 8,
									fontSize: 9,
									letterSpacing: "0.2em",
									color: "#555",
									fontWeight: 600,
									paddingLeft: 4,
								}}
							>
								<span>Descripcion</span>
								<span style={{ textAlign: "center" }}>Cant.</span>
								<span style={{ textAlign: "right" }}>Precio unit.</span>
								<span style={{ textAlign: "center" }}>IVA</span>
								<span style={{ width: 28 }} />
							</div>

							<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
								{invLines.map((line, idx) => (
									<div
										key={idx}
										style={{
											display: "grid",
											gridTemplateColumns: "2fr 0.6fr 1fr 0.6fr auto",
											gap: 8,
										}}
									>
										<input
											className="input-base"
											placeholder="Descripcion"
											value={line.description}
											onChange={(e) =>
												updateLine(idx, "description", e.target.value)
											}
											style={{ fontSize: 12 }}
										/>
										<input
											className="input-base"
											type="number"
											min={0}
											step={1}
											value={line.quantity}
											onChange={(e) =>
												updateLine(idx, "quantity", Number(e.target.value))
											}
											style={{ fontSize: 12, textAlign: "center" }}
										/>
										<input
											className="input-base"
											type="number"
											min={0}
											step={0.01}
											placeholder="Precio unit."
											value={line.unitPrice || ""}
											onChange={(e) =>
												updateLine(idx, "unitPrice", Number(e.target.value))
											}
											style={{ fontSize: 12, textAlign: "right" }}
										/>
										<select
											className="input-base"
											value={line.ivaRate}
											onChange={(e) =>
												updateLine(idx, "ivaRate", Number(e.target.value))
											}
											style={{ fontSize: 12 }}
										>
											<option value={0}>0%</option>
											<option value={10.5}>10.5%</option>
											<option value={21}>21%</option>
											<option value={27}>27%</option>
										</select>
										<button
											className="btn-ghost"
											style={{ padding: 6, color: "#ef4444" }}
											onClick={() => removeLine(idx)}
										>
											<X size={14} />
										</button>
									</div>
								))}
							</div>
						</div>

						{/* Totals */}
						<div style={{ height: 1, background: "var(--s3)" }} />
						<div
							style={{ textAlign: "right", fontSize: 13 }}
							className="font-body"
						>
							<div className="flex justify-end gap-6">
								<span style={{ color: "#666" }}>Subtotal:</span>
								<span style={{ color: "#aaa", width: 112 }}>
									{formatCurrency(invSubtotal)}
								</span>
							</div>
							<div className="flex justify-end gap-6" style={{ marginTop: 4 }}>
								<span style={{ color: "#666" }}>IVA:</span>
								<span style={{ color: "#aaa", width: 112 }}>
									{formatCurrency(invIva)}
								</span>
							</div>
							<div className="flex justify-end gap-6" style={{ marginTop: 8 }}>
								<span
									className="font-display"
									style={{ fontWeight: 700, color: "var(--gold)" }}
								>
									Total:
								</span>
								<span
									className="font-kds"
									style={{ fontSize: 18, color: "var(--gold)", width: 112 }}
								>
									{formatCurrency(invTotal)}
								</span>
							</div>
						</div>

						<div>
							<FieldLabel>Notas</FieldLabel>
							<textarea
								className="input-base"
								rows={2}
								value={invForm.notes}
								onChange={(e) =>
									setInvForm((f) => ({ ...f, notes: e.target.value }))
								}
								style={{ width: "100%", fontSize: 13 }}
							/>
						</div>

						<div
							className="flex justify-end gap-3"
							style={{ paddingTop: 12, borderTop: "1px solid var(--s3)" }}
						>
							<button
								className="btn-ghost"
								style={{ fontSize: 13 }}
								onClick={() => setShowInvoiceModal(false)}
							>
								Cancelar
							</button>
							<button
								className="btn-primary"
								style={{ fontSize: 13 }}
								onClick={saveInvoice}
							>
								Guardar Factura
							</button>
						</div>
					</div>
				</Modal>

				{/* --- Pay modal --- */}
				<Modal
					open={!!payInvoiceId}
					onClose={() => setPayInvoiceId(null)}
					title="Registrar Pago"
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
						<div
							style={{
								width: 52,
								height: 52,
								borderRadius: 12,
								background: "rgba(16,185,129,0.1)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								margin: "0 auto",
							}}
						>
							<CheckCircle size={24} style={{ color: "#10b981" }} />
						</div>
						<div>
							<FieldLabel>Metodo de pago</FieldLabel>
							<select
								className="input-base"
								value={payMethod}
								onChange={(e) => setPayMethod(e.target.value)}
								style={{ width: "100%", fontSize: 13 }}
							>
								<option value="efectivo">Efectivo</option>
								<option value="transferencia">Transferencia</option>
								<option value="cheque">Cheque</option>
								<option value="mercadopago">MercadoPago</option>
								<option value="tarjeta">Tarjeta</option>
							</select>
						</div>
						<div
							className="flex justify-end gap-3"
							style={{ paddingTop: 12, borderTop: "1px solid var(--s3)" }}
						>
							<button
								className="btn-ghost"
								style={{ fontSize: 13 }}
								onClick={() => setPayInvoiceId(null)}
							>
								Cancelar
							</button>
							<button
								className="btn-primary"
								style={{ fontSize: 13 }}
								onClick={markPaid}
							>
								Confirmar Pago
							</button>
						</div>
					</div>
				</Modal>

				{/* --- Confirm dialog --- */}
				<ConfirmDialog
					open={!!confirm}
					message={confirm?.message ?? ""}
					onConfirm={() => confirm?.action()}
					onCancel={() => setConfirm(null)}
				/>
			</div>
		</div>
	);
}
