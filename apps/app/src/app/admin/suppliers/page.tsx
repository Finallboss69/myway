"use client";

import { useState, useCallback } from "react";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
import useSWR from "swr";
import {
	Truck,
	Package,
	Tags,
	TrendingUp,
	Plus,
	X,
	Trash2,
	Edit3,
	Search,
	Phone,
	Mail,
	FileText,
	AlertTriangle,
	DollarSign,
	Clock,
	Filter,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getAdminPin, staffHeaders } from "@/lib/admin-pin";

/* ── Types ─────────────────────────────────────────────────── */

interface SupplierCategory {
	id: string;
	name: string;
	icon: string;
	order: number;
	suppliers: { id: string; name: string }[];
}
interface Supplier {
	id: string;
	name: string;
	cuit: string | null;
	address: string | null;
	phone: string | null;
	email: string | null;
	notes: string | null;
	categoryId: string | null;
	category: SupplierCategory | null;
	createdAt: string;
	_count?: { invoices: number; ingredients: number };
}
interface IngredientCategory {
	id: string;
	name: string;
	icon: string;
	order: number;
	ingredients: { id: string; name: string; unit: string }[];
}
interface Ingredient {
	id: string;
	name: string;
	unit: string;
	stockCurrent: number;
	alertThreshold: number;
	costPerUnit: number;
	categoryId: string | null;
	category: IngredientCategory | null;
	supplierId: string | null;
	supplier: { id: string; name: string } | null;
	recipeIngredients: { id: string }[];
}
interface PriceHistory {
	id: string;
	ingredientId: string;
	ingredient: { name: string; unit: string };
	costPerUnit: number;
	supplierId: string | null;
	date: string;
	notes: string | null;
}
interface SupplierInvoice {
	id: string;
	supplierId: string;
	status: string;
	total: number;
}

type Tab = "proveedores" | "categorias" | "ingredientes" | "historial";
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
	{ key: "proveedores", label: "PROVEEDORES", icon: Truck },
	{ key: "categorias", label: "CATEGORÍAS", icon: Tags },
	{ key: "ingredientes", label: "INGREDIENTES", icon: Package },
	{ key: "historial", label: "HISTORIAL PRECIOS", icon: TrendingUp },
];

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-AR");

/* ── Shared Components ─────────────────────────────────────── */

function KpiCard({
	label,
	value,
	sub,
	color,
	icon: Icon,
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
				border: `1px solid ${color}25`,
				borderRadius: 16,
				padding: "24px 22px 20px",
				position: "relative",
				overflow: "hidden",
				animation: `slideUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 80}ms both`,
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
					background: `radial-gradient(circle at top right, ${color}08, transparent 70%)`,
				}}
			/>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 14,
					marginBottom: 14,
				}}
			>
				<div
					style={{
						width: 40,
						height: 40,
						borderRadius: 10,
						background: `${color}15`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Icon size={20} style={{ color }} />
				</div>
				<span
					style={{
						fontSize: 12,
						color: "#999",
						textTransform: "uppercase",
						letterSpacing: 1.2,
						fontFamily: "var(--font-syne)",
					}}
				>
					{label}
				</span>
			</div>
			<div
				style={{
					fontSize: 32,
					fontWeight: 700,
					fontFamily: "var(--font-bebas)",
					letterSpacing: 1,
					color: "#fff",
				}}
			>
				{value}
			</div>
			{sub && (
				<div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{sub}</div>
			)}
		</div>
	);
}

function SectionCard({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon: React.ElementType;
	children: React.ReactNode;
}) {
	return (
		<div
			style={{
				background: "var(--s1)",
				border: "1px solid var(--s4)",
				borderRadius: 16,
				overflow: "hidden",
			}}
		>
			<div
				style={{
					background: "var(--s2)",
					padding: "14px 20px",
					display: "flex",
					alignItems: "center",
					gap: 10,
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<Icon size={16} style={{ color: "#f59e0b" }} />
				<span
					style={{
						fontSize: 13,
						fontWeight: 600,
						textTransform: "uppercase",
						letterSpacing: 1,
						fontFamily: "var(--font-syne)",
						color: "#ccc",
					}}
				>
					{title}
				</span>
			</div>
			<div style={{ padding: 20 }}>{children}</div>
		</div>
	);
}

const inputStyle: React.CSSProperties = {
	width: "100%",
	padding: "10px 14px",
	background: "var(--s3)",
	border: "1px solid var(--s5)",
	borderRadius: 8,
	color: "#fff",
	fontSize: 14,
	fontFamily: "var(--font-dm-sans)",
	outline: "none",
};
const selectStyle: React.CSSProperties = {
	...inputStyle,
	appearance: "none" as const,
};
const btnPrimary: React.CSSProperties = {
	padding: "10px 20px",
	background: "#f59e0b",
	color: "#000",
	border: "none",
	borderRadius: 8,
	fontWeight: 600,
	cursor: "pointer",
	fontSize: 13,
	fontFamily: "var(--font-syne)",
};
const btnDanger: React.CSSProperties = {
	...btnPrimary,
	background: "#ef4444",
	color: "#fff",
};
const btnGhost: React.CSSProperties = {
	padding: "8px 14px",
	background: "transparent",
	border: "1px solid var(--s5)",
	borderRadius: 8,
	color: "#999",
	cursor: "pointer",
	fontSize: 13,
};

function Modal({
	title,
	onClose,
	children,
}: {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
}) {
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.7)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
			}}
			onClick={onClose}
		>
			<div
				style={{
					background: "var(--s1)",
					border: "1px solid var(--s4)",
					borderRadius: 16,
					width: "100%",
					maxWidth: 520,
					maxHeight: "85vh",
					overflow: "auto",
					padding: 28,
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 24,
					}}
				>
					<span
						style={{
							fontSize: 18,
							fontWeight: 700,
							fontFamily: "var(--font-syne)",
							color: "#fff",
						}}
					>
						{title}
					</span>
					<button
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							color: "#666",
						}}
						onClick={onClose}
					>
						<X size={20} />
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function SuppliersPage() {
	const [tab, setTab] = useState<Tab>("proveedores");

	return (
		<div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
			<div style={{ marginBottom: 28 }}>
				<h1
					style={{
						fontSize: 28,
						fontWeight: 700,
						fontFamily: "var(--font-syne)",
						color: "#fff",
						margin: 0,
					}}
				>
					Proveedores & Stock
				</h1>
				<p
					style={{
						color: "#666",
						fontSize: 13,
						marginTop: 4,
						fontFamily: "var(--font-dm-sans)",
					}}
				>
					Gestion integral de proveedores, ingredientes y costos
				</p>
				<HelpButton {...helpContent.suppliers} />
			</div>
			<div
				style={{
					display: "flex",
					gap: 4,
					marginBottom: 28,
					background: "var(--s2)",
					borderRadius: 12,
					padding: 4,
				}}
			>
				{TABS.map((t) => (
					<button
						key={t.key}
						onClick={() => setTab(t.key)}
						style={{
							flex: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
							padding: "12px 16px",
							borderRadius: 8,
							border: "none",
							cursor: "pointer",
							fontSize: 12,
							fontWeight: 600,
							letterSpacing: 1,
							fontFamily: "var(--font-syne)",
							transition: "all 0.2s",
							background: tab === t.key ? "#f59e0b" : "transparent",
							color: tab === t.key ? "#000" : "#888",
						}}
					>
						<t.icon size={15} />
						{t.label}
					</button>
				))}
			</div>
			{tab === "proveedores" && <TabProveedores />}
			{tab === "categorias" && <TabCategorias />}
			{tab === "ingredientes" && <TabIngredientes />}
			{tab === "historial" && <TabHistorial />}
		</div>
	);
}

/* ── Tab 1: Proveedores ────────────────────────────────────── */

function TabProveedores() {
	const { data: suppliers = [], mutate: mutS } = useSWR<Supplier[]>(
		"/api/suppliers",
		fetcher,
	);
	const { data: categories = [] } = useSWR<SupplierCategory[]>(
		"/api/supplier-categories",
		fetcher,
	);
	const { data: invoices = [] } = useSWR<SupplierInvoice[]>(
		"/api/supplier-invoices",
		fetcher,
	);
	const [search, setSearch] = useState("");
	const [filterCat, setFilterCat] = useState("");
	const [modal, setModal] = useState<Supplier | null | "new">(null);
	const [hovered, setHovered] = useState("");

	const pendingInvoices = invoices.filter((i) => i.status === "pending");
	const deudaTotal = pendingInvoices.reduce((s, i) => s + i.total, 0);
	const totalIngredients = suppliers.reduce(
		(s, sup) => s + (sup._count?.ingredients ?? 0),
		0,
	);

	const filtered = suppliers.filter((s) => {
		if (filterCat && s.categoryId !== filterCat) return false;
		if (
			search &&
			!s.name.toLowerCase().includes(search.toLowerCase()) &&
			!(s.cuit ?? "").includes(search)
		)
			return false;
		return true;
	});

	const save = useCallback(
		async (form: Record<string, string>) => {
			if (modal === "new") {
				await apiFetch("/api/suppliers", {
					method: "POST",
					headers: staffHeaders(),
					body: JSON.stringify(form),
				});
			} else if (modal && typeof modal === "object") {
				await apiFetch(`/api/suppliers/${modal.id}`, {
					method: "PATCH",
					headers: staffHeaders(),
					body: JSON.stringify(form),
				});
			}
			setModal(null);
			mutS();
		},
		[modal, mutS],
	);

	const del = useCallback(
		async (id: string) => {
			if (!confirm("Eliminar proveedor?")) return;
			await apiFetch(`/api/suppliers/${id}`, {
				method: "DELETE",
				headers: staffHeaders(),
			});
			mutS();
		},
		[mutS],
	);

	return (
		<>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<KpiCard
					label="Total Proveedores"
					value={suppliers.length}
					icon={Truck}
					color="#f59e0b"
					idx={0}
				/>
				<KpiCard
					label="Facturas Pendientes"
					value={pendingInvoices.length}
					icon={FileText}
					color="#3b82f6"
					idx={1}
				/>
				<KpiCard
					label="Deuda Total"
					value={formatCurrency(deudaTotal)}
					icon={DollarSign}
					color="#ef4444"
					idx={2}
				/>
				<KpiCard
					label="Ingredientes Registrados"
					value={totalIngredients}
					icon={Package}
					color="#10b981"
					idx={3}
				/>
			</div>
			<SectionCard title="Listado de Proveedores" icon={Truck}>
				<div
					style={{
						display: "flex",
						gap: 12,
						marginBottom: 16,
						flexWrap: "wrap",
					}}
				>
					<div style={{ flex: 1, minWidth: 200, position: "relative" }}>
						<Search
							size={14}
							style={{ position: "absolute", left: 12, top: 12, color: "#666" }}
						/>
						<input
							placeholder="Buscar por nombre o CUIT..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							style={{ ...inputStyle, paddingLeft: 34 }}
						/>
					</div>
					<select
						value={filterCat}
						onChange={(e) => setFilterCat(e.target.value)}
						style={{ ...selectStyle, width: 200, flex: "none" }}
					>
						<option value="">Todas las categorias</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>
								{c.icon} {c.name}
							</option>
						))}
					</select>
					<button style={btnPrimary} onClick={() => setModal("new")}>
						<Plus size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
						Nuevo Proveedor
					</button>
				</div>
				<div style={{ overflowX: "auto" }}>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr style={{ borderBottom: "1px solid var(--s4)" }}>
								{[
									"Nombre",
									"Categoría",
									"CUIT",
									"Teléfono",
									"Email",
									"Facturas",
									"Ingredientes",
									"",
								].map((h) => (
									<th
										key={h}
										style={{
											padding: "10px 12px",
											fontSize: 11,
											color: "#666",
											textTransform: "uppercase",
											letterSpacing: 1,
											fontFamily: "var(--font-syne)",
											textAlign: "left",
											fontWeight: 600,
										}}
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filtered.map((s) => (
								<tr
									key={s.id}
									style={{
										borderBottom: "1px solid var(--s3)",
										cursor: "pointer",
										background: hovered === s.id ? "var(--s2)" : "transparent",
										transition: "background 0.15s",
									}}
									onMouseEnter={() => setHovered(s.id)}
									onMouseLeave={() => setHovered("")}
									onClick={() => setModal(s)}
								>
									<td
										style={{
											padding: "12px",
											fontSize: 14,
											color: "#fff",
											fontWeight: 600,
										}}
									>
										{s.name}
									</td>
									<td style={{ padding: "12px", fontSize: 13, color: "#999" }}>
										{s.category ? `${s.category.icon} ${s.category.name}` : "—"}
									</td>
									<td
										style={{
											padding: "12px",
											fontSize: 13,
											color: "#999",
											fontFamily: "var(--font-geist-mono)",
										}}
									>
										{s.cuit || "—"}
									</td>
									<td style={{ padding: "12px", fontSize: 13, color: "#999" }}>
										{s.phone ? (
											<span>
												<Phone
													size={12}
													style={{ marginRight: 4, verticalAlign: -1 }}
												/>
												{s.phone}
											</span>
										) : (
											"—"
										)}
									</td>
									<td style={{ padding: "12px", fontSize: 13, color: "#999" }}>
										{s.email ? (
											<span>
												<Mail
													size={12}
													style={{ marginRight: 4, verticalAlign: -1 }}
												/>
												{s.email}
											</span>
										) : (
											"—"
										)}
									</td>
									<td
										style={{
											padding: "12px",
											fontSize: 13,
											color: "#f59e0b",
											fontWeight: 600,
										}}
									>
										{s._count?.invoices ?? 0}
									</td>
									<td
										style={{
											padding: "12px",
											fontSize: 13,
											color: "#10b981",
											fontWeight: 600,
										}}
									>
										{s._count?.ingredients ?? 0}
									</td>
									<td style={{ padding: "12px", textAlign: "right" }}>
										<button
											style={{
												background: "none",
												border: "none",
												cursor: "pointer",
												color: "#666",
												padding: 4,
											}}
											onClick={(e) => {
												e.stopPropagation();
												del(s.id);
											}}
										>
											<Trash2 size={14} />
										</button>
									</td>
								</tr>
							))}
							{filtered.length === 0 && (
								<tr>
									<td
										colSpan={8}
										style={{
											padding: 40,
											textAlign: "center",
											color: "#555",
											fontSize: 14,
										}}
									>
										No se encontraron proveedores
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</SectionCard>
			{modal !== null && (
				<SupplierModal
					supplier={modal === "new" ? null : modal}
					categories={categories}
					onClose={() => setModal(null)}
					onSave={save}
				/>
			)}
		</>
	);
}

function SupplierModal({
	supplier,
	categories,
	onClose,
	onSave,
}: {
	supplier: Supplier | null;
	categories: SupplierCategory[];
	onClose: () => void;
	onSave: (f: Record<string, string>) => void;
}) {
	const [form, setForm] = useState({
		name: supplier?.name ?? "",
		cuit: supplier?.cuit ?? "",
		address: supplier?.address ?? "",
		phone: supplier?.phone ?? "",
		email: supplier?.email ?? "",
		notes: supplier?.notes ?? "",
		categoryId: supplier?.categoryId ?? "",
	});
	const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

	return (
		<Modal
			title={supplier ? "Editar Proveedor" : "Nuevo Proveedor"}
			onClose={onClose}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
				<label style={{ fontSize: 12, color: "#999" }}>
					Nombre *
					<input
						style={inputStyle}
						value={form.name}
						onChange={(e) => set("name", e.target.value)}
					/>
				</label>
				<label style={{ fontSize: 12, color: "#999" }}>
					CUIT
					<input
						style={inputStyle}
						value={form.cuit}
						onChange={(e) => set("cuit", e.target.value)}
						placeholder="XX-XXXXXXXX-X"
					/>
				</label>
				<label style={{ fontSize: 12, color: "#999" }}>
					Categoría
					<select
						style={selectStyle}
						value={form.categoryId}
						onChange={(e) => set("categoryId", e.target.value)}
					>
						<option value="">Sin categoría</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>
								{c.icon} {c.name}
							</option>
						))}
					</select>
				</label>
				<label style={{ fontSize: 12, color: "#999" }}>
					Dirección
					<input
						style={inputStyle}
						value={form.address}
						onChange={(e) => set("address", e.target.value)}
					/>
				</label>
				<div
					style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
				>
					<label style={{ fontSize: 12, color: "#999" }}>
						Teléfono
						<input
							style={inputStyle}
							value={form.phone}
							onChange={(e) => set("phone", e.target.value)}
						/>
					</label>
					<label style={{ fontSize: 12, color: "#999" }}>
						Email
						<input
							style={inputStyle}
							value={form.email}
							onChange={(e) => set("email", e.target.value)}
						/>
					</label>
				</div>
				<label style={{ fontSize: 12, color: "#999" }}>
					Notas
					<textarea
						style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
						value={form.notes}
						onChange={(e) => set("notes", e.target.value)}
					/>
				</label>
				<div
					style={{
						display: "flex",
						gap: 12,
						justifyContent: "flex-end",
						marginTop: 8,
					}}
				>
					<button style={btnGhost} onClick={onClose}>
						Cancelar
					</button>
					<button
						style={btnPrimary}
						onClick={() => {
							if (!form.name.trim()) return;
							onSave(form);
						}}
					>
						Guardar
					</button>
				</div>
			</div>
		</Modal>
	);
}

/* ── Tab 2: Categorías ─────────────────────────────────────── */

function TabCategorias() {
	const { data: categories = [], mutate } = useSWR<SupplierCategory[]>(
		"/api/supplier-categories",
		fetcher,
	);
	const [modal, setModal] = useState<SupplierCategory | null | "new">(null);

	const save = useCallback(
		async (form: { name: string; icon: string; order: number }) => {
			if (modal === "new") {
				await apiFetch("/api/supplier-categories", {
					method: "POST",
					headers: staffHeaders(),
					body: JSON.stringify(form),
				});
			} else if (modal && typeof modal === "object") {
				await apiFetch(`/api/supplier-categories/${modal.id}`, {
					method: "PUT",
					headers: staffHeaders(),
					body: JSON.stringify(form),
				});
			}
			setModal(null);
			mutate();
		},
		[modal, mutate],
	);

	const del = useCallback(
		async (id: string) => {
			if (!confirm("Eliminar categoría?")) return;
			await apiFetch(`/api/supplier-categories/${id}`, {
				method: "DELETE",
				headers: staffHeaders(),
			});
			mutate();
		},
		[mutate],
	);

	return (
		<SectionCard title="Categorías de Proveedores" icon={Tags}>
			<div
				style={{
					display: "flex",
					justifyContent: "flex-end",
					marginBottom: 16,
				}}
			>
				<button style={btnPrimary} onClick={() => setModal("new")}>
					<Plus size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
					Nueva Categoría
				</button>
			</div>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
					gap: 14,
				}}
			>
				{categories.map((c, i) => (
					<div
						key={c.id}
						style={{
							background: "var(--s2)",
							border: "1px solid var(--s4)",
							borderRadius: 12,
							padding: 20,
							position: "relative",
							animation: `slideUp 0.4s ease ${i * 60}ms both`,
						}}
					>
						<div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
						<div
							style={{
								fontSize: 15,
								fontWeight: 700,
								color: "#fff",
								fontFamily: "var(--font-syne)",
								marginBottom: 4,
							}}
						>
							{c.name}
						</div>
						<div style={{ fontSize: 12, color: "#666" }}>
							{c.suppliers.length} proveedor
							{c.suppliers.length !== 1 ? "es" : ""}
						</div>
						<div
							style={{
								position: "absolute",
								top: 12,
								right: 12,
								display: "flex",
								gap: 6,
							}}
						>
							<button
								style={{
									background: "none",
									border: "none",
									cursor: "pointer",
									color: "#888",
								}}
								onClick={() => setModal(c)}
							>
								<Edit3 size={14} />
							</button>
							<button
								style={{
									background: "none",
									border: "none",
									cursor: "pointer",
									color: "#666",
								}}
								onClick={() => del(c.id)}
							>
								<Trash2 size={14} />
							</button>
						</div>
					</div>
				))}
				{categories.length === 0 && (
					<div style={{ color: "#555", fontSize: 14, padding: 20 }}>
						No hay categorías creadas
					</div>
				)}
			</div>
			{modal !== null && (
				<CategoryModal
					cat={modal === "new" ? null : modal}
					onClose={() => setModal(null)}
					onSave={save}
				/>
			)}
		</SectionCard>
	);
}

function CategoryModal({
	cat,
	onClose,
	onSave,
}: {
	cat: SupplierCategory | null;
	onClose: () => void;
	onSave: (f: { name: string; icon: string; order: number }) => void;
}) {
	const [name, setName] = useState(cat?.name ?? "");
	const [icon, setIcon] = useState(cat?.icon ?? "📦");
	const [order, setOrder] = useState(cat?.order ?? 0);

	return (
		<Modal
			title={cat ? "Editar Categoría" : "Nueva Categoría"}
			onClose={onClose}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
				<label style={{ fontSize: 12, color: "#999" }}>
					Nombre *
					<input
						style={inputStyle}
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</label>
				<div
					style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
				>
					<label style={{ fontSize: 12, color: "#999" }}>
						Icono Emoji
						<input
							style={inputStyle}
							value={icon}
							onChange={(e) => setIcon(e.target.value)}
						/>
					</label>
					<label style={{ fontSize: 12, color: "#999" }}>
						Orden
						<input
							style={inputStyle}
							type="number"
							value={order}
							onChange={(e) => setOrder(Number(e.target.value))}
						/>
					</label>
				</div>
				<div
					style={{
						display: "flex",
						gap: 12,
						justifyContent: "flex-end",
						marginTop: 8,
					}}
				>
					<button style={btnGhost} onClick={onClose}>
						Cancelar
					</button>
					<button
						style={btnPrimary}
						onClick={() => {
							if (!name.trim()) return;
							onSave({ name, icon, order });
						}}
					>
						Guardar
					</button>
				</div>
			</div>
		</Modal>
	);
}

/* ── Tab 3: Ingredientes ───────────────────────────────────── */

function TabIngredientes() {
	const { data: ingredients = [], mutate: mutI } = useSWR<Ingredient[]>(
		"/api/ingredients",
		fetcher,
	);
	const { data: categories = [] } = useSWR<IngredientCategory[]>(
		"/api/ingredient-categories",
		fetcher,
	);
	const { data: suppliers = [] } = useSWR<Supplier[]>(
		"/api/suppliers",
		fetcher,
	);
	const [search, setSearch] = useState("");
	const [filterCat, setFilterCat] = useState("");
	const [modal, setModal] = useState<Ingredient | null | "new">(null);
	const [hovered, setHovered] = useState("");

	const lowStock = ingredients.filter(
		(i) => i.stockCurrent <= i.alertThreshold,
	);
	const avgCost = ingredients.length
		? ingredients.reduce((s, i) => s + i.costPerUnit, 0) / ingredients.length
		: 0;
	const noSupplier = ingredients.filter((i) => !i.supplierId).length;

	const filtered = ingredients.filter((i) => {
		if (filterCat && i.categoryId !== filterCat) return false;
		if (search && !i.name.toLowerCase().includes(search.toLowerCase()))
			return false;
		return true;
	});

	const save = useCallback(
		async (form: Record<string, unknown>) => {
			if (modal === "new") {
				await apiFetch("/api/ingredients", {
					method: "POST",
					headers: staffHeaders(),
					body: JSON.stringify(form),
				});
			} else if (modal && typeof modal === "object") {
				await apiFetch(`/api/ingredients/${modal.id}`, {
					method: "PATCH",
					headers: staffHeaders(),
					body: JSON.stringify(form),
				});
			}
			setModal(null);
			mutI();
		},
		[modal, mutI],
	);

	const del = useCallback(
		async (id: string) => {
			if (!confirm("Eliminar ingrediente?")) return;
			await apiFetch(`/api/ingredients/${id}`, {
				method: "DELETE",
				headers: staffHeaders(),
			});
			mutI();
		},
		[mutI],
	);

	const stockColor = (i: Ingredient) =>
		i.stockCurrent <= i.alertThreshold
			? "#ef4444"
			: i.stockCurrent <= i.alertThreshold * 2
				? "#f59e0b"
				: "#10b981";

	return (
		<>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<KpiCard
					label="Total Ingredientes"
					value={ingredients.length}
					icon={Package}
					color="#f59e0b"
					idx={0}
				/>
				<KpiCard
					label="Stock Bajo"
					value={lowStock.length}
					sub={lowStock.length > 0 ? "Requieren reposicion" : "Todo en orden"}
					icon={AlertTriangle}
					color="#ef4444"
					idx={1}
				/>
				<KpiCard
					label="Costo Promedio"
					value={formatCurrency(avgCost)}
					icon={DollarSign}
					color="#3b82f6"
					idx={2}
				/>
				<KpiCard
					label="Sin Proveedor"
					value={noSupplier}
					icon={Truck}
					color="#8b5cf6"
					idx={3}
				/>
			</div>
			<SectionCard title="Ingredientes" icon={Package}>
				<div
					style={{
						display: "flex",
						gap: 12,
						marginBottom: 16,
						flexWrap: "wrap",
					}}
				>
					<div style={{ flex: 1, minWidth: 200, position: "relative" }}>
						<Search
							size={14}
							style={{ position: "absolute", left: 12, top: 12, color: "#666" }}
						/>
						<input
							placeholder="Buscar ingrediente..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							style={{ ...inputStyle, paddingLeft: 34 }}
						/>
					</div>
					<select
						value={filterCat}
						onChange={(e) => setFilterCat(e.target.value)}
						style={{ ...selectStyle, width: 200, flex: "none" }}
					>
						<option value="">Todas las categorias</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>
								{c.icon} {c.name}
							</option>
						))}
					</select>
					<button style={btnPrimary} onClick={() => setModal("new")}>
						<Plus size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
						Nuevo Ingrediente
					</button>
				</div>
				<div style={{ overflowX: "auto" }}>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr style={{ borderBottom: "1px solid var(--s4)" }}>
								{[
									"Nombre",
									"Unidad",
									"Stock",
									"Alerta",
									"Costo/U",
									"Categoría",
									"Proveedor",
									"",
								].map((h) => (
									<th
										key={h}
										style={{
											padding: "10px 12px",
											fontSize: 11,
											color: "#666",
											textTransform: "uppercase",
											letterSpacing: 1,
											fontFamily: "var(--font-syne)",
											textAlign: "left",
											fontWeight: 600,
										}}
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filtered.map((ing) => (
								<tr
									key={ing.id}
									style={{
										borderBottom: "1px solid var(--s3)",
										cursor: "pointer",
										background:
											hovered === ing.id ? "var(--s2)" : "transparent",
										transition: "background 0.15s",
									}}
									onMouseEnter={() => setHovered(ing.id)}
									onMouseLeave={() => setHovered("")}
									onClick={() => setModal(ing)}
								>
									<td
										style={{
											padding: "12px",
											fontSize: 14,
											color: "#fff",
											fontWeight: 600,
										}}
									>
										{ing.name}
									</td>
									<td style={{ padding: "12px", fontSize: 13, color: "#999" }}>
										{ing.unit}
									</td>
									<td
										style={{
											padding: "12px",
											fontSize: 14,
											fontWeight: 700,
											color: stockColor(ing),
											fontFamily: "var(--font-bebas)",
											letterSpacing: 0.5,
										}}
									>
										{ing.stockCurrent.toFixed(1)}
									</td>
									<td style={{ padding: "12px", fontSize: 13, color: "#666" }}>
										{ing.alertThreshold}
									</td>
									<td
										style={{
											padding: "12px",
											fontSize: 13,
											color: "#f59e0b",
											fontWeight: 600,
										}}
									>
										{formatCurrency(ing.costPerUnit)}
									</td>
									<td style={{ padding: "12px", fontSize: 13, color: "#999" }}>
										{ing.category
											? `${ing.category.icon} ${ing.category.name}`
											: "—"}
									</td>
									<td style={{ padding: "12px", fontSize: 13, color: "#999" }}>
										{ing.supplier?.name ?? "—"}
									</td>
									<td style={{ padding: "12px", textAlign: "right" }}>
										<button
											style={{
												background: "none",
												border: "none",
												cursor: "pointer",
												color: "#666",
												padding: 4,
											}}
											onClick={(e) => {
												e.stopPropagation();
												del(ing.id);
											}}
										>
											<Trash2 size={14} />
										</button>
									</td>
								</tr>
							))}
							{filtered.length === 0 && (
								<tr>
									<td
										colSpan={8}
										style={{
											padding: 40,
											textAlign: "center",
											color: "#555",
											fontSize: 14,
										}}
									>
										No se encontraron ingredientes
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</SectionCard>
			{modal !== null && (
				<IngredientModal
					ingredient={modal === "new" ? null : modal}
					categories={categories}
					suppliers={suppliers}
					onClose={() => setModal(null)}
					onSave={save}
				/>
			)}
		</>
	);
}

function IngredientModal({
	ingredient,
	categories,
	suppliers,
	onClose,
	onSave,
}: {
	ingredient: Ingredient | null;
	categories: IngredientCategory[];
	suppliers: Supplier[];
	onClose: () => void;
	onSave: (f: Record<string, unknown>) => void;
}) {
	const [form, setForm] = useState({
		name: ingredient?.name ?? "",
		unit: ingredient?.unit ?? "unidad",
		stockCurrent: String(ingredient?.stockCurrent ?? 0),
		alertThreshold: String(ingredient?.alertThreshold ?? 0),
		costPerUnit: String(ingredient?.costPerUnit ?? 0),
		categoryId: ingredient?.categoryId ?? "",
		supplierId: ingredient?.supplierId ?? "",
	});
	const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

	const handleSave = () => {
		if (!form.name.trim()) return;
		onSave({
			name: form.name,
			unit: form.unit,
			stockCurrent: Number(form.stockCurrent),
			alertThreshold: Number(form.alertThreshold),
			costPerUnit: Number(form.costPerUnit),
			categoryId: form.categoryId || null,
			supplierId: form.supplierId || null,
		});
	};

	return (
		<Modal
			title={ingredient ? "Editar Ingrediente" : "Nuevo Ingrediente"}
			onClose={onClose}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
				<label style={{ fontSize: 12, color: "#999" }}>
					Nombre *
					<input
						style={inputStyle}
						value={form.name}
						onChange={(e) => set("name", e.target.value)}
					/>
				</label>
				<div
					style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
				>
					<label style={{ fontSize: 12, color: "#999" }}>
						Unidad
						<select
							style={selectStyle}
							value={form.unit}
							onChange={(e) => set("unit", e.target.value)}
						>
							{["unidad", "ml", "gr", "kg", "lt"].map((u) => (
								<option key={u} value={u}>
									{u}
								</option>
							))}
						</select>
					</label>
					<label style={{ fontSize: 12, color: "#999" }}>
						Costo por Unidad
						<input
							style={inputStyle}
							type="number"
							step="0.01"
							value={form.costPerUnit}
							onChange={(e) => set("costPerUnit", e.target.value)}
						/>
					</label>
				</div>
				<div
					style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
				>
					<label style={{ fontSize: 12, color: "#999" }}>
						Stock Actual
						<input
							style={inputStyle}
							type="number"
							step="0.1"
							value={form.stockCurrent}
							onChange={(e) => set("stockCurrent", e.target.value)}
						/>
					</label>
					<label style={{ fontSize: 12, color: "#999" }}>
						Umbral Alerta
						<input
							style={inputStyle}
							type="number"
							step="0.1"
							value={form.alertThreshold}
							onChange={(e) => set("alertThreshold", e.target.value)}
						/>
					</label>
				</div>
				<label style={{ fontSize: 12, color: "#999" }}>
					Categoría
					<select
						style={selectStyle}
						value={form.categoryId}
						onChange={(e) => set("categoryId", e.target.value)}
					>
						<option value="">Sin categoría</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>
								{c.icon} {c.name}
							</option>
						))}
					</select>
				</label>
				<label style={{ fontSize: 12, color: "#999" }}>
					Proveedor
					<select
						style={selectStyle}
						value={form.supplierId}
						onChange={(e) => set("supplierId", e.target.value)}
					>
						<option value="">Sin proveedor</option>
						{suppliers.map((s) => (
							<option key={s.id} value={s.id}>
								{s.name}
							</option>
						))}
					</select>
				</label>
				<div
					style={{
						display: "flex",
						gap: 12,
						justifyContent: "flex-end",
						marginTop: 8,
					}}
				>
					<button style={btnGhost} onClick={onClose}>
						Cancelar
					</button>
					<button style={btnPrimary} onClick={handleSave}>
						Guardar
					</button>
				</div>
			</div>
		</Modal>
	);
}

/* ── Tab 4: Historial Precios ──────────────────────────────── */

function TabHistorial() {
	const { data: ingredients = [] } = useSWR<Ingredient[]>(
		"/api/ingredients",
		fetcher,
	);
	const [filterIng, setFilterIng] = useState("");
	const url = filterIng
		? `/api/price-history?ingredientId=${filterIng}`
		: "/api/price-history";
	const { data: history = [] } = useSWR<PriceHistory[]>(url, fetcher);

	return (
		<SectionCard title="Historial de Precios" icon={TrendingUp}>
			<div
				style={{
					display: "flex",
					gap: 12,
					marginBottom: 20,
					alignItems: "center",
				}}
			>
				<Filter size={14} style={{ color: "#666" }} />
				<select
					value={filterIng}
					onChange={(e) => setFilterIng(e.target.value)}
					style={{ ...selectStyle, width: 280 }}
				>
					<option value="">Todos los ingredientes</option>
					{ingredients.map((i) => (
						<option key={i.id} value={i.id}>
							{i.name} ({i.unit})
						</option>
					))}
				</select>
			</div>
			{history.length === 0 ? (
				<div
					style={{
						padding: 40,
						textAlign: "center",
						color: "#555",
						fontSize: 14,
					}}
				>
					No hay registros de precios
				</div>
			) : (
				<div style={{ position: "relative", paddingLeft: 24 }}>
					<div
						style={{
							position: "absolute",
							left: 7,
							top: 0,
							bottom: 0,
							width: 2,
							background: "var(--s4)",
						}}
					/>
					{history.map((h, i) => (
						<div
							key={h.id}
							style={{
								position: "relative",
								paddingBottom: 20,
								paddingLeft: 24,
								animation: `slideUp 0.4s ease ${i * 40}ms both`,
							}}
						>
							<div
								style={{
									position: "absolute",
									left: -3,
									top: 4,
									width: 12,
									height: 12,
									borderRadius: "50%",
									background: "#f59e0b",
									border: "2px solid var(--s1)",
								}}
							/>
							<div
								style={{
									background: "var(--s2)",
									border: "1px solid var(--s4)",
									borderRadius: 10,
									padding: "14px 18px",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginBottom: 6,
									}}
								>
									<span
										style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}
									>
										{h.ingredient.name}
									</span>
									<span style={{ fontSize: 11, color: "#666" }}>
										<Clock
											size={11}
											style={{ marginRight: 4, verticalAlign: -1 }}
										/>
										{fmtDate(h.date)}
									</span>
								</div>
								<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
									<span
										style={{
											fontSize: 20,
											fontWeight: 700,
											fontFamily: "var(--font-bebas)",
											color: "#f59e0b",
										}}
									>
										{formatCurrency(h.costPerUnit)}
									</span>
									<span style={{ fontSize: 12, color: "#666" }}>
										/{h.ingredient.unit}
									</span>
								</div>
								{h.notes && (
									<div
										style={{
											fontSize: 12,
											color: "#888",
											marginTop: 6,
											fontStyle: "italic",
										}}
									>
										{h.notes}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</SectionCard>
	);
}
