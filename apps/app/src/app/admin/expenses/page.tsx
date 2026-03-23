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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

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

const DEFAULT_CATEGORIES: Omit<ExpenseCategory, "id">[] = [
	{ name: "Mercadería", icon: "ShoppingCart", order: 0 },
	{ name: "Personal", icon: "Users", order: 1 },
	{ name: "Servicios", icon: "Zap", order: 2 },
	{ name: "Alquiler", icon: "Home", order: 3 },
	{ name: "Impuestos", icon: "Receipt", order: 4 },
	{ name: "Mantenimiento", icon: "Wrench", order: 5 },
	{ name: "Otros", icon: "MoreHorizontal", order: 6 },
];

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
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

function CategoryIcon({ iconName, size = 14, style }: { iconName: string; size?: number; style?: React.CSSProperties }) {
	const Icon = ICON_MAP[iconName] ?? Tag;
	return <Icon size={size} style={style} />;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } {
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
	return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Section Label ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<span
			className="font-display text-ink-disabled uppercase"
			style={{ fontSize: 9, letterSpacing: "0.25em" }}
		>
			{children}
		</span>
	);
}

// ─── Modal Shell ─────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
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
				background: "rgba(0,0,0,0.7)",
				backdropFilter: "blur(4px)",
			}}
			onClick={onClose}
		>
			<div
				className="card"
				style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", padding: 0 }}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--s3)" }}>
					<h2 className="font-display text-ink-primary" style={{ fontSize: 15, fontWeight: 700 }}>{title}</h2>
					<button onClick={onClose} className="btn-ghost" style={{ padding: 6, borderRadius: 8 }}>
						<X size={16} />
					</button>
				</div>
				<div style={{ padding: 20 }}>{children}</div>
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
			setError("Completar categoría, descripción y monto válido.");
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
				await apiFetch(`/api/expenses/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
			} else {
				await apiFetch("/api/expenses", { method: "POST", body: JSON.stringify(body) });
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
		<Modal open={open} onClose={onClose} title={editing ? "Editar Gasto" : "Nuevo Gasto"}>
			<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
				{/* Category */}
				<div>
					<SectionLabel>Categoría</SectionLabel>
					<select className="input-base mt-1" style={{ width: "100%" }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
						<option value="">Seleccionar...</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>{c.name}</option>
						))}
					</select>
				</div>
				{/* Description */}
				<div>
					<SectionLabel>Descripción</SectionLabel>
					<input className="input-base mt-1" style={{ width: "100%" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Compra de insumos" />
				</div>
				{/* Amount + Date */}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<SectionLabel>Monto (ARS)</SectionLabel>
						<input className="input-base mt-1" style={{ width: "100%" }} type="number" min={0} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
					</div>
					<div>
						<SectionLabel>Fecha</SectionLabel>
						<input className="input-base mt-1" style={{ width: "100%" }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
					</div>
				</div>
				{/* Supplier */}
				<div>
					<SectionLabel>Proveedor (opcional)</SectionLabel>
					<select className="input-base mt-1" style={{ width: "100%" }} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
						<option value="">Sin proveedor</option>
						{suppliers.map((s) => (
							<option key={s.id} value={s.id}>{s.name}</option>
						))}
					</select>
				</div>
				{/* Payment method */}
				<div>
					<SectionLabel>Método de Pago</SectionLabel>
					<div className="flex gap-2 mt-1 flex-wrap">
						{PAYMENT_METHODS.map((m) => (
							<button
								key={m}
								onClick={() => setPaymentMethod(m)}
								style={{
									padding: "5px 12px",
									borderRadius: 8,
									fontSize: 12,
									fontWeight: 600,
									border: paymentMethod === m ? "1px solid var(--gold)" : "1px solid var(--s4)",
									background: paymentMethod === m ? "rgba(245,158,11,0.15)" : "var(--s2)",
									color: paymentMethod === m ? "#f59e0b" : "#888",
									cursor: "pointer",
								}}
							>
								{m}
							</button>
						))}
					</div>
				</div>
				{/* Notes */}
				<div>
					<SectionLabel>Notas (opcional)</SectionLabel>
					<textarea className="input-base mt-1" style={{ width: "100%", minHeight: 60, resize: "vertical" }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones..." />
				</div>
				{/* Error */}
				{error && <div style={{ color: "#ef4444", fontSize: 12 }}>{error}</div>}
				{/* Submit */}
				<button className="btn-primary" style={{ width: "100%", marginTop: 4 }} onClick={handleSubmit} disabled={saving}>
					{saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar gasto"}
				</button>
			</div>
		</Modal>
	);
}

// ─── Gestionar Categorías Modal ──────────────────────────────────────────────

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
				await apiFetch(`/api/expense-categories/${editingId}`, { method: "PATCH", body: JSON.stringify(body) });
			} else {
				await apiFetch("/api/expense-categories", { method: "POST", body: JSON.stringify(body) });
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
		if (!confirm("Eliminar esta categoría?")) return;
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
		<Modal open={open} onClose={onClose} title="Gestionar Categorías">
			<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
				{/* List */}
				{sorted.map((cat) => (
					<div
						key={cat.id}
						className="flex items-center gap-3"
						style={{
							padding: "10px 12px",
							borderRadius: 10,
							background: editingId === cat.id ? "rgba(245,158,11,0.08)" : "var(--s2)",
							border: editingId === cat.id ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--s3)",
						}}
					>
						<div
							style={{
								width: 28,
								height: 28,
								borderRadius: 7,
								background: "var(--s3)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<CategoryIcon iconName={cat.icon} size={13} style={{ color: "#888" }} />
						</div>
						<span className="font-body text-ink-primary flex-1" style={{ fontSize: 13 }}>{cat.name}</span>
						<span className="font-body text-ink-disabled" style={{ fontSize: 10 }}>#{cat.order}</span>
						<button onClick={() => startEdit(cat)} className="btn-ghost" style={{ padding: 4 }}><Pencil size={12} /></button>
						<button onClick={() => handleDelete(cat.id)} className="btn-ghost" style={{ padding: 4, color: "#ef4444" }}><Trash2 size={12} /></button>
					</div>
				))}

				{/* Add/Edit form */}
				<div style={{ borderTop: "1px solid var(--s3)", paddingTop: 12, marginTop: 4 }}>
					<SectionLabel>{editingId ? "Editar categoría" : "Nueva categoría"}</SectionLabel>
					<div className="flex gap-2 mt-2">
						<select className="input-base" style={{ width: 80 }} value={icon} onChange={(e) => setIcon(e.target.value)}>
							{iconOptions.map((ic) => (
								<option key={ic} value={ic}>{ic}</option>
							))}
						</select>
						<input className="input-base flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
						<button className="btn-primary" style={{ padding: "6px 14px" }} onClick={handleSave} disabled={busy}>
							{editingId ? "Guardar" : "Agregar"}
						</button>
						{editingId && (
							<button className="btn-ghost" style={{ padding: "6px 10px" }} onClick={resetForm}>
								<X size={14} />
							</button>
						)}
					</div>
					{error && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 6 }}>{error}</div>}
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

	// ── Fetch categories ─────────────────────────────────────────────────────
	const fetchCategories = useCallback(async () => {
		try {
			const data = await apiFetch<ExpenseCategory[]>("/api/expense-categories");
			setCategories(data);
		} catch {
			// If API doesn't exist yet or is empty, seed defaults
			setCategories([]);
		}
	}, []);

	// ── Fetch expenses ───────────────────────────────────────────────────────
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

	// ── Fetch suppliers ──────────────────────────────────────────────────────
	const fetchSuppliers = useCallback(async () => {
		try {
			const data = await apiFetch<Supplier[]>("/api/suppliers");
			setSuppliers(data);
		} catch {
			setSuppliers([]);
		}
	}, []);

	// ── Initial load ─────────────────────────────────────────────────────────
	useEffect(() => {
		Promise.all([fetchCategories(), fetchExpenses(), fetchSuppliers()]).finally(() => setLoading(false));
	}, [fetchCategories, fetchExpenses, fetchSuppliers]);

	// ── Refetch expenses on filter change ────────────────────────────────────
	useEffect(() => {
		fetchExpenses();
	}, [fetchExpenses]);

	// ── Delete expense ───────────────────────────────────────────────────────
	const handleDelete = async (id: string) => {
		if (!confirm("Eliminar este gasto?")) return;
		try {
			await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
			fetchExpenses();
		} catch {
			// ignore
		}
	};

	// ── Computed KPIs ────────────────────────────────────────────────────────
	const totalMes = expenses.reduce((s, e) => s + e.amount, 0);
	const todayStr = new Date().toISOString().slice(0, 10);
	const gastosHoy = expenses.filter((e) => e.date.slice(0, 10) === todayStr).reduce((s, e) => s + e.amount, 0);
	const uniqueCats = new Set(expenses.map((e) => e.categoryId)).size;

	// ── Category summaries ───────────────────────────────────────────────────
	const catSummaries = categories
		.map((cat) => {
			const catExpenses = expenses.filter((e) => e.categoryId === cat.id);
			return {
				...cat,
				total: catExpenses.reduce((s, e) => s + e.amount, 0),
				count: catExpenses.length,
			};
		})
		.filter((c) => c.count > 0)
		.sort((a, b) => b.total - a.total);

	// ── Sorted expenses ──────────────────────────────────────────────────────
	const sortedExpenses = [...expenses].sort((a, b) => {
		const mul = sortDir === "asc" ? 1 : -1;
		if (sortField === "date") return mul * (new Date(a.date).getTime() - new Date(b.date).getTime());
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
		return sortDir === "desc" ? <ChevronDown size={10} /> : <ChevronUp size={10} />;
	};

	// ── Category name resolver ───────────────────────────────────────────────
	const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";
	const catIcon = (id: string) => categories.find((c) => c.id === id)?.icon ?? "Tag";

	return (
		<div className="min-h-screen p-5 md:p-7 pb-10" style={{ background: "var(--s0)" }}>
			{/* ── Header ──────────────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-5">
				<div>
					<div className="flex items-center gap-2 mb-1">
						<div style={{ width: 3, height: 20, borderRadius: 3, background: "var(--gold)" }} />
						<h1 className="font-kds" style={{ fontSize: 40, lineHeight: 1, color: "#e5e5e5" }}>GASTOS</h1>
					</div>
					<div className="font-body text-ink-disabled" style={{ fontSize: 12 }}>
						Control y registro de gastos operativos
					</div>
				</div>
				<div className="flex gap-2">
					<button className="btn-secondary" onClick={() => setShowCatModal(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
						<Settings size={13} /> Categorías
					</button>
					<button className="btn-primary" onClick={() => { setEditingExpense(null); setShowNewModal(true); }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
						<Plus size={14} /> Nuevo Gasto
					</button>
				</div>
			</div>

			{/* ── KPI pills ───────────────────────────────────────────────────── */}
			<div className="grid gap-4 grid-cols-3 mb-6">
				{[
					{ label: "Gasto Total Período", value: formatCurrency(totalMes), accent: true, icon: DollarSign },
					{ label: "Gastos Hoy", value: formatCurrency(gastosHoy), accent: false, icon: CalendarDays },
					{ label: "Categorías", value: String(uniqueCats), accent: false, icon: Tag },
				].map(({ label, value, accent, icon: Icon }) => (
					<div
						key={label}
						className="card p-5"
						style={{
							position: "relative",
							overflow: "hidden",
							...(accent ? { borderColor: "rgba(245,158,11,0.25)", boxShadow: "0 0 24px rgba(245,158,11,0.08)" } : {}),
						}}
					>
						{accent && (
							<div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 300px 200px at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
						)}
						<div className="flex items-center justify-between mb-3" style={{ position: "relative", zIndex: 1 }}>
							<SectionLabel>{label}</SectionLabel>
							<div style={{ width: 28, height: 28, borderRadius: 7, background: accent ? "rgba(245,158,11,0.2)" : "var(--s3)", border: accent ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--s4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
								<Icon size={13} style={{ color: accent ? "#f59e0b" : "#888" }} />
							</div>
						</div>
						<div className="font-kds" style={{ fontSize: accent ? 32 : 26, lineHeight: 1, color: accent ? "#f59e0b" : "#e5e5e5", position: "relative", zIndex: 1 }}>
							{value}
						</div>
					</div>
				))}
			</div>

			{/* ── Period Selector ──────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-center gap-3 mb-6">
				<div className="flex items-center gap-0.5 p-1 rounded-xl" style={{ background: "var(--s2)", border: "1px solid var(--s3)" }}>
					{PERIODS.map((p) => (
						<button
							key={p}
							onClick={() => setPeriod(p)}
							style={{
								padding: "6px 14px",
								borderRadius: 10,
								background: period === p ? "#f59e0b" : "transparent",
								color: period === p ? "#0a0a0a" : "#666",
								fontFamily: "var(--font-syne)",
								fontWeight: 600,
								fontSize: 11,
								letterSpacing: "0.1em",
								border: "none",
								cursor: "pointer",
								transition: "all 0.15s",
								boxShadow: period === p ? "0 0 8px rgba(245,158,11,0.3)" : "none",
							}}
						>
							{p}
						</button>
					))}
				</div>
				{period === "Custom" && (
					<div className="flex items-center gap-2">
						<input className="input-base" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={{ fontSize: 12 }} />
						<span className="text-ink-disabled" style={{ fontSize: 12 }}>a</span>
						<input className="input-base" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={{ fontSize: 12 }} />
					</div>
				)}
			</div>

			<div className="divider-gold mb-6" />

			{loading ? (
				<div className="flex items-center justify-center" style={{ minHeight: 200 }}>
					<span className="font-body text-ink-disabled" style={{ fontSize: 14 }}>Cargando...</span>
				</div>
			) : (
				<>
					{/* ── Category Summary Cards ──────────────────────────────────── */}
					{catSummaries.length > 0 && (
						<div className="mb-6">
							<div className="mb-3"><SectionLabel>Resumen por Categoría</SectionLabel></div>
							<div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
								{catSummaries.map((cat) => (
									<button
										key={cat.id}
										onClick={() => setFilterCat(filterCat === cat.id ? "" : cat.id)}
										className="card"
										style={{
											padding: "14px 16px",
											cursor: "pointer",
											textAlign: "left",
											border: filterCat === cat.id ? "1px solid rgba(245,158,11,0.4)" : undefined,
											background: filterCat === cat.id ? "rgba(245,158,11,0.05)" : undefined,
										}}
									>
										<div className="flex items-center gap-2.5 mb-2">
											<div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--s3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
												<CategoryIcon iconName={cat.icon} size={13} style={{ color: "#888" }} />
											</div>
											<span className="font-body text-ink-primary" style={{ fontSize: 13, fontWeight: 500 }}>{cat.name}</span>
										</div>
										<div className="font-kds" style={{ fontSize: 22, lineHeight: 1, color: "#e5e5e5" }}>
											{formatCurrency(cat.total)}
										</div>
										<div className="font-body text-ink-disabled mt-1" style={{ fontSize: 11 }}>
											{cat.count} gasto{cat.count !== 1 ? "s" : ""}
										</div>
									</button>
								))}
							</div>
							{filterCat && (
								<button
									className="btn-ghost mt-2"
									style={{ fontSize: 11 }}
									onClick={() => setFilterCat("")}
								>
									Limpiar filtro
								</button>
							)}
						</div>
					)}

					{/* ── Expense List ────────────────────────────────────────────── */}
					<div className="card" style={{ padding: 0, overflow: "hidden" }}>
						<div style={{ padding: "14px 20px", borderBottom: "1px solid var(--s3)" }} className="flex items-center justify-between">
							<div>
								<h3 className="font-display text-ink-primary" style={{ fontSize: 13, fontWeight: 700 }}>
									Listado de Gastos
								</h3>
								<div className="font-body text-ink-disabled" style={{ fontSize: 11 }}>
									{expenses.length} registro{expenses.length !== 1 ? "s" : ""}{filterCat ? ` — ${catName(filterCat)}` : ""}
								</div>
							</div>
						</div>

						{sortedExpenses.length === 0 ? (
							<div className="flex items-center justify-center" style={{ padding: "40px 20px" }}>
								<span className="font-body text-ink-disabled" style={{ fontSize: 13 }}>No hay gastos registrados en este período.</span>
							</div>
						) : (
							<div style={{ overflowX: "auto" }}>
								<table style={{ width: "100%", borderCollapse: "collapse" }}>
									<thead>
										<tr style={{ borderBottom: "1px solid var(--s3)" }}>
											<th className="font-display text-ink-disabled uppercase" style={{ fontSize: 9, letterSpacing: "0.25em", padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Categoría</th>
											<th className="font-display text-ink-disabled uppercase" style={{ fontSize: 9, letterSpacing: "0.25em", padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Descripción</th>
											<th className="font-display text-ink-disabled uppercase" style={{ fontSize: 9, letterSpacing: "0.25em", padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Proveedor</th>
											<th className="font-display text-ink-disabled uppercase" style={{ fontSize: 9, letterSpacing: "0.25em", padding: "12px 16px", textAlign: "left", fontWeight: 600, cursor: "pointer" }} onClick={() => toggleSort("date")}>
												<span className="flex items-center gap-1">Fecha <SortIcon field="date" /></span>
											</th>
											<th className="font-display text-ink-disabled uppercase" style={{ fontSize: 9, letterSpacing: "0.25em", padding: "12px 16px", textAlign: "right", fontWeight: 600, cursor: "pointer" }} onClick={() => toggleSort("amount")}>
												<span className="flex items-center justify-end gap-1">Monto <SortIcon field="amount" /></span>
											</th>
											<th className="font-display text-ink-disabled uppercase" style={{ fontSize: 9, letterSpacing: "0.25em", padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>Pago</th>
											<th style={{ width: 72 }} />
										</tr>
									</thead>
									<tbody>
										{sortedExpenses.map((exp) => (
											<tr key={exp.id} style={{ borderBottom: "1px solid var(--s3)" }}>
												{/* Category */}
												<td style={{ padding: "12px 16px" }}>
													<div className="flex items-center gap-2">
														<div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--s3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
															<CategoryIcon iconName={catIcon(exp.categoryId)} size={11} style={{ color: "#888" }} />
														</div>
														<span className="font-body text-ink-secondary" style={{ fontSize: 12 }}>{catName(exp.categoryId)}</span>
													</div>
												</td>
												{/* Description */}
												<td style={{ padding: "12px 16px" }}>
													<span className="font-body text-ink-primary" style={{ fontSize: 13 }}>{exp.description}</span>
												</td>
												{/* Supplier */}
												<td style={{ padding: "12px 16px" }}>
													<span className="font-body text-ink-disabled" style={{ fontSize: 12 }}>{exp.supplier?.name ?? "—"}</span>
												</td>
												{/* Date */}
												<td style={{ padding: "12px 16px" }}>
													<span className="font-body text-ink-secondary" style={{ fontSize: 12, fontFamily: "monospace" }}>{formatDate(exp.date)}</span>
												</td>
												{/* Amount */}
												<td style={{ padding: "12px 16px", textAlign: "right" }}>
													<span className="font-kds" style={{ fontSize: 20, color: "#e5e5e5" }}>{formatCurrency(exp.amount)}</span>
												</td>
												{/* Payment method badge */}
												<td style={{ padding: "12px 16px", textAlign: "center" }}>
													<span
														className="badge"
														style={{
															fontSize: 10,
															padding: "3px 10px",
															borderRadius: 6,
															background: `${PAYMENT_COLORS[exp.paymentMethod] ?? "#555"}22`,
															color: PAYMENT_COLORS[exp.paymentMethod] ?? "#888",
															border: `1px solid ${PAYMENT_COLORS[exp.paymentMethod] ?? "#555"}44`,
														}}
													>
														{exp.paymentMethod}
													</span>
												</td>
												{/* Actions */}
												<td style={{ padding: "12px 8px" }}>
													<div className="flex items-center gap-1">
														<button
															className="btn-ghost"
															style={{ padding: 4 }}
															onClick={() => {
																setEditingExpense(exp);
																setShowNewModal(true);
															}}
														>
															<Pencil size={12} />
														</button>
														<button
															className="btn-ghost"
															style={{ padding: 4, color: "#ef4444" }}
															onClick={() => handleDelete(exp.id)}
														>
															<Trash2 size={12} />
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
									{/* Footer total */}
									<tfoot>
										<tr style={{ borderTop: "2px solid var(--s4)" }}>
											<td colSpan={4} className="font-display text-ink-primary" style={{ padding: "14px 16px", fontSize: 12, fontWeight: 700 }}>Total</td>
											<td style={{ padding: "14px 16px", textAlign: "right" }}>
												<span className="font-kds" style={{ fontSize: 22, color: "#f59e0b" }}>{formatCurrency(totalMes)}</span>
											</td>
											<td colSpan={2} />
										</tr>
									</tfoot>
								</table>
							</div>
						)}
					</div>
				</>
			)}

			{/* ── Modals ──────────────────────────────────────────────────────── */}
			<NuevoGastoModal
				open={showNewModal}
				onClose={() => { setShowNewModal(false); setEditingExpense(null); }}
				categories={categories}
				suppliers={suppliers}
				onSaved={() => { fetchExpenses(); fetchCategories(); }}
				editing={editingExpense}
			/>
			<CategoriasModal
				open={showCatModal}
				onClose={() => setShowCatModal(false)}
				categories={categories}
				onChanged={() => { fetchCategories(); fetchExpenses(); }}
			/>
		</div>
	);
}
