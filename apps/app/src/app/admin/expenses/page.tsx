"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Plus,
	Pencil,
	Trash2,
	X,
	Settings,
	ShoppingCart,
	Users,
	Zap,
	Home,
	Receipt,
	Wrench,
	MoreHorizontal,
	DollarSign,
	CalendarDays,
	Tag,
	ChevronUp,
	ChevronDown,
	Printer,
	Loader2,
	Wallet,
	AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { printDocument, printCurrency } from "@/lib/print";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExpenseCategory {
	id: string;
	name: string;
	icon: string;
	order: number;
}

interface Expense {
	id: string;
	categoryId: string;
	category?: ExpenseCategory;
	description: string;
	amount: number;
	date: string;
	supplierId?: string | null;
	supplier?: { id: string; name: string } | null;
	paymentMethod: string;
	notes?: string | null;
	createdAt: string;
}

interface Supplier {
	id: string;
	name: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PERIODS = ["Hoy", "Esta Semana", "Este Mes", "Custom"] as const;
type Period = (typeof PERIODS)[number];

const PAYMENT_METHODS = ["Efectivo", "MercadoPago", "Tarjeta", "Transferencia"];

const PAYMENT_COLORS: Record<string, string> = {
	Efectivo: "#22c55e",
	MercadoPago: "#3b82f6",
	Tarjeta: "#8b5cf6",
	Transferencia: "#f97316",
};

const ICON_MAP: Record<
	string,
	React.ComponentType<{ size?: number; style?: React.CSSProperties }>
> = {
	ShoppingCart,
	Users,
	Zap,
	Home,
	Receipt,
	Wrench,
	MoreHorizontal,
	DollarSign,
	Tag,
	Settings,
};

const CAT_COLORS: string[] = [
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

function CategoryIcon({
	iconName,
	size = 14,
	style,
}: {
	iconName: string;
	size?: number;
	style?: React.CSSProperties;
}) {
	const Icon = ICON_MAP[iconName] ?? Tag;
	return <Icon size={size} style={style} />;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateRange(
	period: Period,
	customFrom: string,
	customTo: string,
): { from: string; to: string } {
	const now = new Date();
	const todayStr = now.toISOString().slice(0, 10);

	if (period === "Hoy") return { from: todayStr, to: todayStr };
	if (period === "Esta Semana") {
		const day = now.getDay();
		const diff = day === 0 ? 6 : day - 1;
		const monday = new Date(now);
		monday.setDate(now.getDate() - diff);
		return { from: monday.toISOString().slice(0, 10), to: todayStr };
	}
	if (period === "Este Mes") {
		const first = new Date(now.getFullYear(), now.getMonth(), 1);
		return { from: first.toISOString().slice(0, 10), to: todayStr };
	}
	return { from: customFrom || todayStr, to: customTo || todayStr };
}

function formatDate(dateStr: string): string {
	const d = new Date(dateStr + "T12:00:00");
	return d.toLocaleDateString("es-AR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
	label,
	value,
	Icon,
	color,
	sub,
}: {
	label: string;
	value: string;
	Icon: React.ElementType;
	color: string;
	sub?: string;
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
				{sub && (
					<div
						className="font-body"
						style={{ fontSize: 11, color: "#666", marginTop: 4 }}
					>
						{sub}
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Modal Shell ─────────────────────────────────────────────────────────────

function Modal({
	open,
	onClose,
	title,
	children,
	width = 560,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	width?: number;
}) {
	if (!open) return null;
	return (
		<div
			className="animate-fade-in"
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 50,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(0,0,0,0.7)",
				backdropFilter: "blur(8px)",
			}}
			onClick={onClose}
		>
			<div
				style={{
					width: "100%",
					maxWidth: width,
					maxHeight: "90vh",
					overflow: "auto",
					background: "var(--s1)",
					border: "1px solid var(--s4)",
					borderRadius: 16,
					boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
				}}
				onClick={(e) => e.stopPropagation()}
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
						<div
							style={{
								width: 3,
								height: 16,
								borderRadius: 2,
								background: "var(--gold)",
							}}
						/>
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
					<button
						onClick={onClose}
						className="btn-ghost"
						style={{ padding: 6, borderRadius: 8 }}
					>
						<X size={16} />
					</button>
				</div>
				<div style={{ padding: 24 }}>{children}</div>
			</div>
		</div>
	);
}

// ─── Nuevo Gasto Modal ───────────────────────────────────────────────────────

function NuevoGastoModal({
	open,
	onClose,
	categories,
	suppliers,
	onSaved,
	editing,
}: {
	open: boolean;
	onClose: () => void;
	categories: ExpenseCategory[];
	suppliers: Supplier[];
	onSaved: () => void;
	editing: Expense | null;
}) {
	const [categoryId, setCategoryId] = useState("");
	const [description, setDescription] = useState("");
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [supplierId, setSupplierId] = useState("");
	const [paymentMethod, setPaymentMethod] = useState("Efectivo");
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (editing) {
			setCategoryId(editing.categoryId);
			setDescription(editing.description);
			setAmount(String(editing.amount));
			setDate(editing.date.slice(0, 10));
			setSupplierId(editing.supplierId ?? "");
			setPaymentMethod(editing.paymentMethod);
			setNotes(editing.notes ?? "");
		} else {
			setCategoryId(categories[0]?.id ?? "");
			setDescription("");
			setAmount("");
			setDate(new Date().toISOString().slice(0, 10));
			setSupplierId("");
			setPaymentMethod("Efectivo");
			setNotes("");
		}
		setError("");
	}, [editing, open, categories]);

	const handleSubmit = async () => {
		if (!categoryId || !description.trim() || !amount || Number(amount) <= 0) {
			setError("Completar categoria, descripcion y monto valido.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			const body = {
				categoryId,
				description: description.trim(),
				amount: Number(amount),
				date,
				supplierId: supplierId || null,
				paymentMethod,
				notes: notes.trim() || null,
			};
			if (editing) {
				await apiFetch(`/api/expenses/${editing.id}`, {
					method: "PATCH",
					body: JSON.stringify(body),
				});
			} else {
				await apiFetch("/api/expenses", {
					method: "POST",
					body: JSON.stringify(body),
				});
			}
			onSaved();
			onClose();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error al guardar");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={editing ? "EDITAR GASTO" : "NUEVO GASTO"}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
				{/* Category selector */}
				<div>
					<div
						className="font-display uppercase"
						style={{
							fontSize: 10,
							letterSpacing: "0.2em",
							color: "#888",
							fontWeight: 600,
							marginBottom: 8,
						}}
					>
						Categoria
					</div>
					<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
						{categories
							.sort((a, b) => a.order - b.order)
							.map((c, idx) => {
								const isSelected = categoryId === c.id;
								const color = CAT_COLORS[idx % CAT_COLORS.length];
								return (
									<button
										key={c.id}
										onClick={() => setCategoryId(c.id)}
										style={{
											padding: "10px 8px",
											borderRadius: 10,
											border: isSelected
												? `1px solid ${color}66`
												: "1px solid var(--s3)",
											background: isSelected ? `${color}15` : "var(--s2)",
											cursor: "pointer",
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											gap: 6,
											transition: "all 0.15s",
										}}
									>
										<div
											style={{
												width: 28,
												height: 28,
												borderRadius: 8,
												background: isSelected ? `${color}25` : "var(--s3)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<CategoryIcon
												iconName={c.icon}
												size={13}
												style={{ color: isSelected ? color : "#888" }}
											/>
										</div>
										<span
											className="font-body"
											style={{
												fontSize: 10,
												color: isSelected ? color : "#888",
												fontWeight: isSelected ? 600 : 400,
											}}
										>
											{c.name}
										</span>
									</button>
								);
							})}
					</div>
				</div>

				{/* Description */}
				<div>
					<div
						className="font-display uppercase"
						style={{
							fontSize: 10,
							letterSpacing: "0.2em",
							color: "#888",
							fontWeight: 600,
							marginBottom: 6,
						}}
					>
						Descripcion
					</div>
					<input
						className="input-base"
						style={{ width: "100%" }}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Ej: Compra de insumos"
					/>
				</div>

				{/* Amount + Date */}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<div
							className="font-display uppercase"
							style={{
								fontSize: 10,
								letterSpacing: "0.2em",
								color: "#888",
								fontWeight: 600,
								marginBottom: 6,
							}}
						>
							Monto (ARS)
						</div>
						<input
							className="input-base"
							style={{ width: "100%" }}
							type="number"
							min={0}
							step={1}
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="0"
						/>
					</div>
					<div>
						<div
							className="font-display uppercase"
							style={{
								fontSize: 10,
								letterSpacing: "0.2em",
								color: "#888",
								fontWeight: 600,
								marginBottom: 6,
							}}
						>
							Fecha
						</div>
						<input
							className="input-base"
							style={{ width: "100%" }}
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					</div>
				</div>

				{/* Supplier */}
				<div>
					<div
						className="font-display uppercase"
						style={{
							fontSize: 10,
							letterSpacing: "0.2em",
							color: "#888",
							fontWeight: 600,
							marginBottom: 6,
						}}
					>
						Proveedor (opcional)
					</div>
					<select
						className="input-base"
						style={{ width: "100%" }}
						value={supplierId}
						onChange={(e) => setSupplierId(e.target.value)}
					>
						<option value="">Sin proveedor</option>
						{suppliers.map((s) => (
							<option key={s.id} value={s.id}>
								{s.name}
							</option>
						))}
					</select>
				</div>

				{/* Payment method pills */}
				<div>
					<div
						className="font-display uppercase"
						style={{
							fontSize: 10,
							letterSpacing: "0.2em",
							color: "#888",
							fontWeight: 600,
							marginBottom: 8,
						}}
					>
						Metodo de Pago
					</div>
					<div className="flex gap-2 flex-wrap">
						{PAYMENT_METHODS.map((m) => {
							const isActive = paymentMethod === m;
							const color = PAYMENT_COLORS[m] ?? "#888";
							return (
								<button
									key={m}
									onClick={() => setPaymentMethod(m)}
									style={{
										padding: "7px 16px",
										borderRadius: 10,
										fontSize: 11,
										fontWeight: 600,
										fontFamily: "var(--font-syne)",
										letterSpacing: "0.05em",
										border: isActive
											? `1px solid ${color}66`
											: "1px solid var(--s4)",
										background: isActive ? `${color}18` : "var(--s2)",
										color: isActive ? color : "#666",
										cursor: "pointer",
										transition: "all 0.15s",
										boxShadow: isActive ? `0 0 8px ${color}20` : "none",
									}}
								>
									{m}
								</button>
							);
						})}
					</div>
				</div>

				{/* Notes */}
				<div>
					<div
						className="font-display uppercase"
						style={{
							fontSize: 10,
							letterSpacing: "0.2em",
							color: "#888",
							fontWeight: 600,
							marginBottom: 6,
						}}
					>
						Notas (opcional)
					</div>
					<textarea
						className="input-base"
						style={{ width: "100%", minHeight: 60, resize: "vertical" }}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Observaciones..."
					/>
				</div>

				{/* Error */}
				{error && (
					<div
						className="flex items-center gap-2"
						style={{
							padding: "10px 14px",
							borderRadius: 10,
							background: "rgba(239,68,68,0.08)",
							border: "1px solid rgba(239,68,68,0.2)",
						}}
					>
						<AlertCircle
							size={14}
							style={{ color: "#ef4444", flexShrink: 0 }}
						/>
						<span
							className="font-body"
							style={{ color: "#ef4444", fontSize: 12 }}
						>
							{error}
						</span>
					</div>
				)}

				{/* Submit */}
				<button
					className="btn-primary"
					style={{
						width: "100%",
						marginTop: 4,
						padding: "12px 0",
						fontSize: 13,
						fontWeight: 700,
						letterSpacing: "0.05em",
					}}
					onClick={handleSubmit}
					disabled={saving}
				>
					{saving
						? "Guardando..."
						: editing
							? "Guardar cambios"
							: "Registrar gasto"}
				</button>
			</div>
		</Modal>
	);
}

// ─── Gestionar Categorias Modal ──────────────────────────────────────────────

function CategoriasModal({
	open,
	onClose,
	categories,
	onChanged,
}: {
	open: boolean;
	onClose: () => void;
	categories: ExpenseCategory[];
	onChanged: () => void;
}) {
	const [name, setName] = useState("");
	const [icon, setIcon] = useState("Tag");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	const iconOptions = Object.keys(ICON_MAP);

	const resetForm = () => {
		setName("");
		setIcon("Tag");
		setEditingId(null);
		setError("");
	};

	const handleSave = async () => {
		if (!name.trim()) {
			setError("Nombre requerido.");
			return;
		}
		setBusy(true);
		setError("");
		try {
			const body = { name: name.trim(), icon, order: categories.length };
			if (editingId) {
				await apiFetch(`/api/expense-categories/${editingId}`, {
					method: "PATCH",
					body: JSON.stringify(body),
				});
			} else {
				await apiFetch("/api/expense-categories", {
					method: "POST",
					body: JSON.stringify(body),
				});
			}
			resetForm();
			onChanged();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error");
		} finally {
			setBusy(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Eliminar esta categoria?")) return;
		try {
			await apiFetch(`/api/expense-categories/${id}`, { method: "DELETE" });
			onChanged();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error al eliminar");
		}
	};

	const startEdit = (cat: ExpenseCategory) => {
		setEditingId(cat.id);
		setName(cat.name);
		setIcon(cat.icon);
	};

	const sorted = [...categories].sort((a, b) => a.order - b.order);

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="GESTIONAR CATEGORIAS"
			width={480}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
				{sorted.map((cat, idx) => {
					const color = CAT_COLORS[idx % CAT_COLORS.length];
					const isEditing = editingId === cat.id;
					return (
						<div
							key={cat.id}
							className="flex items-center gap-3"
							style={{
								padding: "12px 14px",
								borderRadius: 12,
								background: isEditing ? "rgba(245,158,11,0.06)" : "var(--s2)",
								border: isEditing
									? "1px solid rgba(245,158,11,0.3)"
									: "1px solid var(--s3)",
								transition: "all 0.15s",
							}}
						>
							<div
								style={{
									width: 32,
									height: 32,
									borderRadius: 9,
									background: `${color}18`,
									border: `1px solid ${color}30`,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									flexShrink: 0,
								}}
							>
								<CategoryIcon iconName={cat.icon} size={14} style={{ color }} />
							</div>
							<span
								className="font-body flex-1"
								style={{ fontSize: 13, fontWeight: 500, color: "#f5f5f5" }}
							>
								{cat.name}
							</span>
							<span
								className="font-body"
								style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}
							>
								#{cat.order}
							</span>
							<button
								onClick={() => startEdit(cat)}
								className="btn-ghost"
								style={{ padding: 6, borderRadius: 8 }}
							>
								<Pencil size={12} style={{ color: "#888" }} />
							</button>
							<button
								onClick={() => handleDelete(cat.id)}
								className="btn-ghost"
								style={{ padding: 6, borderRadius: 8 }}
							>
								<Trash2 size={12} style={{ color: "#ef4444" }} />
							</button>
						</div>
					);
				})}

				{sorted.length === 0 && (
					<div
						className="flex flex-col items-center justify-center"
						style={{ padding: "32px 16px" }}
					>
						<Tag size={24} style={{ color: "#333", marginBottom: 8 }} />
						<span className="font-body" style={{ fontSize: 12, color: "#666" }}>
							No hay categorias definidas
						</span>
					</div>
				)}

				{/* Add/Edit form */}
				<div
					style={{
						borderTop: "1px solid var(--s3)",
						paddingTop: 16,
						marginTop: 8,
					}}
				>
					<div
						className="font-display uppercase"
						style={{
							fontSize: 10,
							letterSpacing: "0.2em",
							color: "#888",
							fontWeight: 600,
							marginBottom: 10,
						}}
					>
						{editingId ? "Editar categoria" : "Nueva categoria"}
					</div>
					<div className="flex gap-2">
						<div
							style={{
								position: "relative",
								width: 44,
								height: 40,
								borderRadius: 10,
								background: "var(--s2)",
								border: "1px solid var(--s4)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
							}}
						>
							<CategoryIcon
								iconName={icon}
								size={16}
								style={{ color: "#888" }}
							/>
							<select
								className="input-base"
								style={{
									position: "absolute",
									inset: 0,
									opacity: 0,
									cursor: "pointer",
								}}
								value={icon}
								onChange={(e) => setIcon(e.target.value)}
							>
								{iconOptions.map((ic) => (
									<option key={ic} value={ic}>
										{ic}
									</option>
								))}
							</select>
						</div>
						<input
							className="input-base flex-1"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Nombre de la categoria"
							style={{ fontSize: 13 }}
						/>
						<button
							className="btn-primary"
							style={{
								padding: "8px 18px",
								fontSize: 12,
								fontWeight: 700,
							}}
							onClick={handleSave}
							disabled={busy}
						>
							{editingId ? "Guardar" : "Agregar"}
						</button>
						{editingId && (
							<button
								className="btn-ghost"
								style={{ padding: "8px 12px" }}
								onClick={resetForm}
							>
								<X size={14} />
							</button>
						)}
					</div>
					{error && (
						<div
							className="flex items-center gap-2 mt-2"
							style={{
								padding: "8px 12px",
								borderRadius: 8,
								background: "rgba(239,68,68,0.08)",
								border: "1px solid rgba(239,68,68,0.2)",
							}}
						>
							<AlertCircle size={12} style={{ color: "#ef4444" }} />
							<span style={{ color: "#ef4444", fontSize: 11 }}>{error}</span>
						</div>
					)}
				</div>
			</div>
		</Modal>
	);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
	const [period, setPeriod] = useState<Period>("Este Mes");
	const [customFrom, setCustomFrom] = useState("");
	const [customTo, setCustomTo] = useState("");
	const [categories, setCategories] = useState<ExpenseCategory[]>([]);
	const [expenses, setExpenses] = useState<Expense[]>([]);
	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [filterCat, setFilterCat] = useState<string>("");
	const [showNewModal, setShowNewModal] = useState(false);
	const [showCatModal, setShowCatModal] = useState(false);
	const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
	const [loading, setLoading] = useState(true);
	const [sortField, setSortField] = useState<"date" | "amount">("date");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

	const fetchCategories = useCallback(async () => {
		try {
			const data = await apiFetch<ExpenseCategory[]>("/api/expense-categories");
			setCategories(data);
		} catch {
			setCategories([]);
		}
	}, []);

	const fetchExpenses = useCallback(async () => {
		try {
			const { from, to } = getDateRange(period, customFrom, customTo);
			const params = new URLSearchParams({ from, to });
			if (filterCat) params.set("categoryId", filterCat);
			const data = await apiFetch<Expense[]>(`/api/expenses?${params}`);
			setExpenses(data);
		} catch {
			setExpenses([]);
		}
	}, [period, customFrom, customTo, filterCat]);

	const fetchSuppliers = useCallback(async () => {
		try {
			const data = await apiFetch<Supplier[]>("/api/suppliers");
			setSuppliers(data);
		} catch {
			setSuppliers([]);
		}
	}, []);

	useEffect(() => {
		Promise.all([fetchCategories(), fetchExpenses(), fetchSuppliers()]).finally(
			() => setLoading(false),
		);
	}, [fetchCategories, fetchExpenses, fetchSuppliers]);

	useEffect(() => {
		fetchExpenses();
	}, [fetchExpenses]);

	const handleDelete = async (id: string) => {
		if (!confirm("Eliminar este gasto?")) return;
		try {
			await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
			fetchExpenses();
		} catch {
			// ignore
		}
	};

	// Computed KPIs
	const totalMes = expenses.reduce((s, e) => s + e.amount, 0);
	const todayStr = new Date().toISOString().slice(0, 10);
	const gastosHoy = expenses
		.filter((e) => e.date.slice(0, 10) === todayStr)
		.reduce((s, e) => s + e.amount, 0);
	const uniqueCats = new Set(expenses.map((e) => e.categoryId)).size;

	// Category summaries
	const catSummaries = categories
		.map((cat, idx) => {
			const catExpenses = expenses.filter((e) => e.categoryId === cat.id);
			return {
				...cat,
				total: catExpenses.reduce((s, e) => s + e.amount, 0),
				count: catExpenses.length,
				color: CAT_COLORS[idx % CAT_COLORS.length],
			};
		})
		.filter((c) => c.count > 0)
		.sort((a, b) => b.total - a.total);

	// Sorted expenses
	const sortedExpenses = [...expenses].sort((a, b) => {
		const mul = sortDir === "asc" ? 1 : -1;
		if (sortField === "date")
			return mul * (new Date(a.date).getTime() - new Date(b.date).getTime());
		return mul * (a.amount - b.amount);
	});

	const toggleSort = (field: "date" | "amount") => {
		if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortField(field);
			setSortDir("desc");
		}
	};

	const SortIcon = ({ field }: { field: "date" | "amount" }) => {
		if (sortField !== field) return null;
		return sortDir === "desc" ? (
			<ChevronDown size={10} />
		) : (
			<ChevronUp size={10} />
		);
	};

	const catName = (id: string) =>
		categories.find((c) => c.id === id)?.name ?? "--";
	const catIcon = (id: string) =>
		categories.find((c) => c.id === id)?.icon ?? "Tag";
	const catColor = (id: string) => {
		const idx = categories.findIndex((c) => c.id === id);
		return idx >= 0 ? CAT_COLORS[idx % CAT_COLORS.length] : "#888";
	};

	const handlePrint = () => {
		const rows = sortedExpenses
			.map(
				(e) => `<tr>
					<td>${formatDate(e.date)}</td>
					<td>${catName(e.categoryId)}</td>
					<td>${e.description}</td>
					<td>${e.paymentMethod}</td>
					<td class="amount">${printCurrency(e.amount)}</td>
				</tr>`,
			)
			.join("");
		const periodLabel =
			period === "Custom" ? `${customFrom} -- ${customTo}` : period;
		printDocument({
			title: "Gastos",
			subtitle: `${periodLabel} -- ${sortedExpenses.length} gastos -- Total: ${printCurrency(totalMes)}`,
			content: `<table>
				<thead><tr><th>Fecha</th><th>Categoria</th><th>Descripcion</th><th>Medio</th><th style="text-align:right">Monto</th></tr></thead>
				<tbody>${rows}
				<tr class="total-row"><td colspan="4">Total</td><td class="amount">${printCurrency(totalMes)}</td></tr>
				</tbody></table>`,
		});
	};

	if (loading) {
		return (
			<div
				className="flex items-center justify-center"
				style={{ minHeight: "100vh", background: "var(--s0)" }}
			>
				<Loader2
					size={28}
					className="animate-spin"
					style={{ color: "var(--gold)" }}
				/>
			</div>
		);
	}

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
								GASTOS
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								Control y registro de gastos operativos
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<button
							className="btn-ghost flex items-center gap-1.5"
							onClick={handlePrint}
						>
							<Printer size={13} />
							<span
								className="font-display"
								style={{ fontSize: 10, letterSpacing: "0.1em" }}
							>
								Imprimir
							</span>
						</button>
						<button
							className="btn-secondary flex items-center gap-1.5"
							onClick={() => setShowCatModal(true)}
						>
							<Settings size={13} />
							<span
								className="font-display"
								style={{ fontSize: 10, letterSpacing: "0.1em" }}
							>
								Categorias
							</span>
						</button>
						<button
							className="btn-primary flex items-center gap-1.5"
							onClick={() => {
								setEditingExpense(null);
								setShowNewModal(true);
							}}
						>
							<Plus size={14} />
							<span
								className="font-display"
								style={{ fontSize: 10, letterSpacing: "0.1em" }}
							>
								Nuevo Gasto
							</span>
						</button>
					</div>
				</div>

				{/* Period Selector */}
				<div
					className="flex flex-wrap items-center gap-3 animate-fade-in"
					style={{ marginBottom: 12 }}
				>
					<div
						className="flex items-center gap-0.5 p-1 rounded-xl"
						style={{ background: "var(--s2)", border: "1px solid var(--s3)" }}
					>
						{PERIODS.map((p) => (
							<button
								key={p}
								onClick={() => setPeriod(p)}
								style={{
									padding: "7px 16px",
									borderRadius: 10,
									background: period === p ? "#f59e0b" : "transparent",
									color: period === p ? "#0a0a0a" : "#666",
									fontFamily: "var(--font-syne)",
									fontWeight: 700,
									fontSize: 11,
									letterSpacing: "0.1em",
									border: "none",
									cursor: "pointer",
									transition: "all 0.15s",
									boxShadow:
										period === p ? "0 0 10px rgba(245,158,11,0.3)" : "none",
								}}
							>
								{p}
							</button>
						))}
					</div>
					{period === "Custom" && (
						<div className="flex items-center gap-2">
							<input
								className="input-base"
								type="date"
								value={customFrom}
								onChange={(e) => setCustomFrom(e.target.value)}
								style={{ fontSize: 12 }}
							/>
							<span style={{ fontSize: 12, color: "#666" }}>a</span>
							<input
								className="input-base"
								type="date"
								value={customTo}
								onChange={(e) => setCustomTo(e.target.value)}
								style={{ fontSize: 12 }}
							/>
						</div>
					)}
				</div>

				<div className="divider-gold" style={{ marginBottom: 28 }} />

				{/* KPI Cards */}
				<div
					className="grid gap-4 grid-cols-2 md:grid-cols-3"
					style={{ marginBottom: 28 }}
				>
					<KpiCard
						label="Gasto Total Periodo"
						value={formatCurrency(totalMes)}
						Icon={DollarSign}
						color="#f59e0b"
						sub={`${expenses.length} registro${expenses.length !== 1 ? "s" : ""}`}
					/>
					<KpiCard
						label="Gastos Hoy"
						value={formatCurrency(gastosHoy)}
						Icon={CalendarDays}
						color="#60a5fa"
					/>
					<KpiCard
						label="Categorias Activas"
						value={String(uniqueCats)}
						Icon={Tag}
						color="#8b5cf6"
					/>
				</div>

				{/* Category Summary */}
				{catSummaries.length > 0 && (
					<div className="animate-fade-in" style={{ marginBottom: 28 }}>
						<div
							className="font-display uppercase"
							style={{
								fontSize: 10,
								letterSpacing: "0.2em",
								color: "#888",
								fontWeight: 600,
								marginBottom: 12,
							}}
						>
							Resumen por Categoria
						</div>
						<div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{catSummaries.map((cat) => {
								const isActive = filterCat === cat.id;
								const pct =
									totalMes > 0
										? ((cat.total / totalMes) * 100).toFixed(1)
										: "0";
								return (
									<button
										key={cat.id}
										onClick={() => setFilterCat(isActive ? "" : cat.id)}
										style={{
											padding: 16,
											borderRadius: 14,
											cursor: "pointer",
											textAlign: "left",
											border: isActive
												? `1px solid ${cat.color}55`
												: "1px solid var(--s3)",
											background: isActive ? `${cat.color}08` : "var(--s1)",
											transition: "all 0.2s",
											position: "relative",
											overflow: "hidden",
										}}
									>
										<div
											style={{
												position: "absolute",
												top: 0,
												left: 0,
												right: 0,
												height: 2,
												background: cat.color,
												opacity: isActive ? 0.6 : 0.2,
												transition: "opacity 0.2s",
											}}
										/>
										<div
											className="flex items-center gap-2.5"
											style={{ marginBottom: 12 }}
										>
											<div
												style={{
													width: 30,
													height: 30,
													borderRadius: 9,
													background: `${cat.color}18`,
													border: `1px solid ${cat.color}30`,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<CategoryIcon
													iconName={cat.icon}
													size={14}
													style={{ color: cat.color }}
												/>
											</div>
											<div style={{ flex: 1, minWidth: 0 }}>
												<span
													className="font-body"
													style={{
														fontSize: 12,
														fontWeight: 500,
														display: "block",
														color: "#f5f5f5",
													}}
												>
													{cat.name}
												</span>
												<span
													className="font-body"
													style={{ fontSize: 10, color: "#666" }}
												>
													{cat.count} gasto{cat.count !== 1 ? "s" : ""} / {pct}%
												</span>
											</div>
										</div>
										<div
											className="font-kds"
											style={{
												fontSize: 22,
												lineHeight: 1,
												color: isActive ? cat.color : "#e5e5e5",
											}}
										>
											{formatCurrency(cat.total)}
										</div>
										<div
											style={{
												marginTop: 8,
												width: "100%",
												height: 3,
												borderRadius: 2,
												background: "var(--s3)",
												overflow: "hidden",
											}}
										>
											<div
												style={{
													width: `${totalMes > 0 ? (cat.total / totalMes) * 100 : 0}%`,
													height: "100%",
													borderRadius: 2,
													background: cat.color,
													transition: "width 0.3s",
												}}
											/>
										</div>
									</button>
								);
							})}
						</div>
						{filterCat && (
							<button
								className="btn-ghost flex items-center gap-1.5"
								style={{
									fontSize: 11,
									padding: "6px 12px",
									borderRadius: 8,
									marginTop: 12,
								}}
								onClick={() => setFilterCat("")}
							>
								<X size={10} />
								Limpiar filtro
							</button>
						)}
					</div>
				)}

				{/* Expense List */}
				<div
					style={{
						background: "var(--s1)",
						border: "1px solid var(--s4)",
						borderRadius: 16,
						overflow: "hidden",
						boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
					}}
				>
					{/* List header */}
					<div
						className="flex items-center justify-between"
						style={{
							padding: "14px 20px",
							borderBottom: "1px solid var(--s3)",
							background: "var(--s2)",
						}}
					>
						<div className="flex items-center gap-2.5">
							<Wallet size={14} style={{ color: "var(--gold)" }} />
							<span
								className="font-display uppercase"
								style={{
									fontSize: 11,
									letterSpacing: "0.15em",
									color: "#ccc",
									fontWeight: 600,
								}}
							>
								LISTADO DE GASTOS
							</span>
							<span
								className="font-body"
								style={{ fontSize: 11, color: "#666" }}
							>
								{expenses.length} registro{expenses.length !== 1 ? "s" : ""}
								{filterCat ? ` -- ${catName(filterCat)}` : ""}
							</span>
						</div>
						{sortedExpenses.length > 0 && (
							<div
								className="font-kds"
								style={{ fontSize: 22, color: "var(--gold)" }}
							>
								{formatCurrency(totalMes)}
							</div>
						)}
					</div>

					{sortedExpenses.length === 0 ? (
						<div
							className="flex flex-col items-center justify-center"
							style={{ padding: "48px 20px" }}
						>
							<Wallet size={32} style={{ color: "#333", marginBottom: 12 }} />
							<span
								className="font-body"
								style={{ fontSize: 13, color: "#666" }}
							>
								No hay gastos registrados en este periodo
							</span>
							<button
								className="btn-primary flex items-center gap-1.5"
								style={{ padding: "8px 20px", fontSize: 12, marginTop: 16 }}
								onClick={() => {
									setEditingExpense(null);
									setShowNewModal(true);
								}}
							>
								<Plus size={13} />
								Registrar gasto
							</button>
						</div>
					) : (
						<>
							{/* Desktop table */}
							<div className="hidden md:block" style={{ overflowX: "auto" }}>
								<table style={{ width: "100%", borderCollapse: "collapse" }}>
									<thead>
										<tr style={{ borderBottom: "1px solid var(--s3)" }}>
											{[
												{ label: "Categoria", field: null, align: "left" },
												{ label: "Descripcion", field: null, align: "left" },
												{ label: "Proveedor", field: null, align: "left" },
												{
													label: "Fecha",
													field: "date" as const,
													align: "left",
												},
												{
													label: "Monto",
													field: "amount" as const,
													align: "right",
												},
												{ label: "Pago", field: null, align: "center" },
											].map((col) => (
												<th
													key={col.label}
													className="font-display uppercase"
													style={{
														fontSize: 9,
														letterSpacing: "0.25em",
														padding: "12px 16px",
														textAlign: col.align as "left" | "right" | "center",
														fontWeight: 600,
														color: "#888",
														cursor: col.field ? "pointer" : "default",
														userSelect: "none",
													}}
													onClick={
														col.field ? () => toggleSort(col.field!) : undefined
													}
												>
													<span
														className="flex items-center gap-1"
														style={{
															justifyContent:
																col.align === "right"
																	? "flex-end"
																	: col.align === "center"
																		? "center"
																		: "flex-start",
														}}
													>
														{col.label}
														{col.field && <SortIcon field={col.field} />}
													</span>
												</th>
											))}
											<th style={{ width: 72 }} />
										</tr>
									</thead>
									<tbody>
										{sortedExpenses.map((exp) => (
											<tr
												key={exp.id}
												style={{
													borderBottom: "1px solid var(--s3)",
													transition: "background 0.1s",
												}}
												onMouseEnter={(e) =>
													(e.currentTarget.style.background = "var(--s2)")
												}
												onMouseLeave={(e) =>
													(e.currentTarget.style.background = "transparent")
												}
											>
												<td style={{ padding: "12px 16px" }}>
													<div className="flex items-center gap-2.5">
														<div
															style={{
																width: 26,
																height: 26,
																borderRadius: 7,
																background: `${catColor(exp.categoryId)}18`,
																border: `1px solid ${catColor(exp.categoryId)}30`,
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																flexShrink: 0,
															}}
														>
															<CategoryIcon
																iconName={catIcon(exp.categoryId)}
																size={11}
																style={{ color: catColor(exp.categoryId) }}
															/>
														</div>
														<span
															className="font-body"
															style={{ fontSize: 12, color: "#aaa" }}
														>
															{catName(exp.categoryId)}
														</span>
													</div>
												</td>
												<td style={{ padding: "12px 16px" }}>
													<span
														className="font-body"
														style={{ fontSize: 13, color: "#f5f5f5" }}
													>
														{exp.description}
													</span>
													{exp.notes && (
														<div
															className="font-body"
															style={{
																fontSize: 10,
																color: "#666",
																marginTop: 2,
															}}
														>
															{exp.notes}
														</div>
													)}
												</td>
												<td style={{ padding: "12px 16px" }}>
													<span
														className="font-body"
														style={{ fontSize: 12, color: "#666" }}
													>
														{exp.supplier?.name ?? "--"}
													</span>
												</td>
												<td style={{ padding: "12px 16px" }}>
													<span
														className="font-body"
														style={{
															fontSize: 12,
															color: "#aaa",
															fontFamily: "monospace",
														}}
													>
														{formatDate(exp.date)}
													</span>
												</td>
												<td
													style={{ padding: "12px 16px", textAlign: "right" }}
												>
													<span
														className="font-kds"
														style={{ fontSize: 20, color: "#e5e5e5" }}
													>
														{formatCurrency(exp.amount)}
													</span>
												</td>
												<td
													style={{
														padding: "12px 16px",
														textAlign: "center",
													}}
												>
													<span
														className="badge"
														style={{
															fontSize: 10,
															padding: "4px 12px",
															borderRadius: 8,
															background: `${PAYMENT_COLORS[exp.paymentMethod] ?? "#555"}15`,
															color:
																PAYMENT_COLORS[exp.paymentMethod] ?? "#888",
															border: `1px solid ${PAYMENT_COLORS[exp.paymentMethod] ?? "#555"}30`,
															fontWeight: 600,
														}}
													>
														{exp.paymentMethod}
													</span>
												</td>
												<td style={{ padding: "12px 8px" }}>
													<div className="flex items-center gap-1">
														<button
															className="btn-ghost"
															style={{ padding: 6, borderRadius: 8 }}
															onClick={() => {
																setEditingExpense(exp);
																setShowNewModal(true);
															}}
														>
															<Pencil size={12} style={{ color: "#888" }} />
														</button>
														<button
															className="btn-ghost"
															style={{ padding: 6, borderRadius: 8 }}
															onClick={() => handleDelete(exp.id)}
														>
															<Trash2 size={12} style={{ color: "#ef4444" }} />
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
									<tfoot>
										<tr style={{ borderTop: "2px solid var(--s4)" }}>
											<td
												colSpan={4}
												className="font-display"
												style={{
													padding: "16px 16px",
													fontSize: 12,
													fontWeight: 700,
													color: "#f5f5f5",
												}}
											>
												Total
											</td>
											<td style={{ padding: "16px 16px", textAlign: "right" }}>
												<span
													className="font-kds"
													style={{ fontSize: 24, color: "#f59e0b" }}
												>
													{formatCurrency(totalMes)}
												</span>
											</td>
											<td colSpan={2} />
										</tr>
									</tfoot>
								</table>
							</div>

							{/* Mobile card list */}
							<div className="md:hidden" style={{ padding: 8 }}>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: 6,
									}}
								>
									{sortedExpenses.map((exp) => {
										const color = catColor(exp.categoryId);
										return (
											<div
												key={exp.id}
												style={{
													padding: "14px 16px",
													borderRadius: 12,
													background: "var(--s2)",
													border: "1px solid var(--s3)",
													position: "relative",
													overflow: "hidden",
												}}
											>
												<div
													style={{
														position: "absolute",
														top: 0,
														left: 0,
														bottom: 0,
														width: 3,
														background: color,
														borderRadius: "3px 0 0 3px",
														opacity: 0.5,
													}}
												/>
												<div className="flex items-start justify-between gap-3">
													<div style={{ flex: 1, minWidth: 0 }}>
														<div
															className="flex items-center gap-2"
															style={{ marginBottom: 4 }}
														>
															<CategoryIcon
																iconName={catIcon(exp.categoryId)}
																size={12}
																style={{ color, flexShrink: 0 }}
															/>
															<span
																className="font-body"
																style={{ fontSize: 10, color: "#666" }}
															>
																{catName(exp.categoryId)}
															</span>
															<span
																className="badge"
																style={{
																	fontSize: 9,
																	padding: "2px 8px",
																	borderRadius: 6,
																	background: `${PAYMENT_COLORS[exp.paymentMethod] ?? "#555"}15`,
																	color:
																		PAYMENT_COLORS[exp.paymentMethod] ?? "#888",
																	border: `1px solid ${PAYMENT_COLORS[exp.paymentMethod] ?? "#555"}30`,
																}}
															>
																{exp.paymentMethod}
															</span>
														</div>
														<div
															className="font-body"
															style={{
																fontSize: 13,
																fontWeight: 500,
																color: "#f5f5f5",
															}}
														>
															{exp.description}
														</div>
														<div
															className="font-body"
															style={{
																fontSize: 11,
																color: "#666",
																fontFamily: "monospace",
																marginTop: 2,
															}}
														>
															{formatDate(exp.date)}
															{exp.supplier?.name
																? ` / ${exp.supplier.name}`
																: ""}
														</div>
													</div>
													<div style={{ textAlign: "right", flexShrink: 0 }}>
														<div
															className="font-kds"
															style={{
																fontSize: 20,
																color: "#e5e5e5",
																lineHeight: 1,
															}}
														>
															{formatCurrency(exp.amount)}
														</div>
														<div
															className="flex items-center gap-1"
															style={{
																justifyContent: "flex-end",
																marginTop: 8,
															}}
														>
															<button
																className="btn-ghost"
																style={{ padding: 4, borderRadius: 6 }}
																onClick={() => {
																	setEditingExpense(exp);
																	setShowNewModal(true);
																}}
															>
																<Pencil size={11} style={{ color: "#888" }} />
															</button>
															<button
																className="btn-ghost"
																style={{ padding: 4, borderRadius: 6 }}
																onClick={() => handleDelete(exp.id)}
															>
																<Trash2
																	size={11}
																	style={{ color: "#ef4444" }}
																/>
															</button>
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
								<div
									className="flex items-center justify-between"
									style={{
										padding: "16px 16px 8px",
										borderTop: "2px solid var(--s4)",
										marginTop: 8,
									}}
								>
									<span
										className="font-display"
										style={{
											fontSize: 12,
											fontWeight: 700,
											color: "#f5f5f5",
										}}
									>
										Total
									</span>
									<span
										className="font-kds"
										style={{ fontSize: 24, color: "#f59e0b" }}
									>
										{formatCurrency(totalMes)}
									</span>
								</div>
							</div>
						</>
					)}
				</div>

				{/* Modals */}
				<NuevoGastoModal
					open={showNewModal}
					onClose={() => {
						setShowNewModal(false);
						setEditingExpense(null);
					}}
					categories={categories}
					suppliers={suppliers}
					onSaved={() => {
						fetchExpenses();
						fetchCategories();
					}}
					editing={editingExpense}
				/>
				<CategoriasModal
					open={showCatModal}
					onClose={() => setShowCatModal(false)}
					categories={categories}
					onChanged={() => {
						fetchCategories();
						fetchExpenses();
					}}
				/>
			</div>
		</div>
	);
}
