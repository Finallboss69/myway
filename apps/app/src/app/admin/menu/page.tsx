"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import {
	UtensilsCrossed,
	Package,
	Search,
	Plus,
	Pencil,
	Trash2,
	Check,
	ChefHat,
	BarChart3,
	Eye,
	EyeOff,
	ArrowUpDown,
	FlaskConical,
	TrendingUp,
	AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface Category {
	id: string;
	name: string;
	icon: string;
	order: number;
}
interface Product {
	id: string;
	name: string;
	description: string | null;
	price: number;
	costPrice: number;
	categoryId: string;
	category?: Category;
	target: "bar" | "kitchen";
	isAvailable: boolean;
	isPoolChip: boolean;
	image: string | null;
}
interface IngData {
	id: string;
	name: string;
	unit: string;
	costPerUnit: number;
	stockCurrent: number;
	alertThreshold: number;
}
interface RecipeIng {
	id: string;
	productId: string;
	ingredientId: string;
	quantity: number;
	unit: string;
	ingredient: IngData;
}
interface CostProduct {
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
interface CostAnalysis {
	products: CostProduct[];
	summary: {
		totalProducts: number;
		withRecipe: number;
		withoutRecipe: number;
		avgMargin: number;
	};
}

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const mc = (m: number) => (m < 30 ? "#ef4444" : m < 50 ? "#f59e0b" : "#10b981");
type TabKey = "productos" | "recetas" | "costos";

/* ─── Shared styles ───────────────────────────────────────────────────────── */
const iS: React.CSSProperties = {
	width: "100%",
	padding: "9px 12px",
	borderRadius: 8,
	border: "1px solid var(--s4)",
	background: "var(--s2)",
	color: "#f5f5f5",
	fontFamily: "var(--font-dm)",
	fontSize: 13,
	outline: "none",
};
const sS: React.CSSProperties = { ...iS, cursor: "pointer" };
const lS: React.CSSProperties = {
	fontFamily: "var(--font-syne)",
	fontSize: 9,
	letterSpacing: "0.2em",
	color: "#888",
	textTransform: "uppercase",
	display: "block",
	marginBottom: 6,
};
const syne = (
	sz: number,
	c: string,
	extra?: React.CSSProperties,
): React.CSSProperties => ({
	fontFamily: "var(--font-syne)",
	fontSize: sz,
	letterSpacing: "0.15em",
	color: c,
	fontWeight: 600,
	textTransform: "uppercase",
	...extra,
});
const bebas = (sz: number, c: string): React.CSSProperties => ({
	fontFamily: "var(--font-bebas)",
	fontSize: sz,
	lineHeight: 1,
	color: c,
});
const dm = (sz: number, c: string, w = 400): React.CSSProperties => ({
	fontFamily: "var(--font-dm)",
	fontSize: sz,
	color: c,
	fontWeight: w,
});
const ghostBtn: React.CSSProperties = {
	padding: "6px 10px",
	borderRadius: 8,
	border: "1px solid var(--s4)",
	background: "transparent",
	cursor: "pointer",
	display: "flex",
	alignItems: "center",
};
const goldBtn = (disabled?: boolean): React.CSSProperties => ({
	padding: "9px 18px",
	borderRadius: 8,
	border: "1px solid rgba(245,158,11,0.4)",
	background: "rgba(245,158,11,0.15)",
	color: "#f59e0b",
	...syne(11, "#f59e0b"),
	cursor: disabled ? "not-allowed" : "pointer",
	opacity: disabled ? 0.4 : 1,
	display: "flex",
	alignItems: "center",
	gap: 6,
});

/* ─── KpiCard ─────────────────────────────────────────────────────────────── */
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
					background: `radial-gradient(circle at 100% 0%, ${color}12 0%, transparent 70%)`,
					pointerEvents: "none",
				}}
			/>
			<div style={{ position: "relative", zIndex: 1 }}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: 16,
					}}
				>
					<div style={syne(10, "#888", { letterSpacing: "0.2em" })}>
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
				<div style={bebas(36, color)}>{value}</div>
				{sub && <div style={{ ...dm(11, "#666"), marginTop: 6 }}>{sub}</div>}
			</div>
		</div>
	);
}

/* ─── SectionCard ─────────────────────────────────────────────────────────── */
function SC({
	title,
	icon: Icon,
	right,
	children,
}: {
	title: string;
	icon: React.ElementType;
	right?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div
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
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "14px 20px",
					borderBottom: "1px solid var(--s3)",
					background: "var(--s2)",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
					<Icon size={14} style={{ color: "#f59e0b" }} />
					<span style={syne(11, "#ccc")}>{title}</span>
				</div>
				{right}
			</div>
			{children}
		</div>
	);
}

/* ─── Row hover helper ────────────────────────────────────────────────────── */
const hoverRow = (bg = "transparent") => ({
	onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
		e.currentTarget.style.background = "var(--s2)";
	},
	onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
		e.currentTarget.style.background = bg;
	},
});

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function MenuPage() {
	const [tab, setTab] = useState<TabKey>("productos");
	const { data: products = [] } = useSWR<Product[]>("/api/products", fetcher);
	const { data: categories = [] } = useSWR<Category[]>(
		"/api/categories",
		fetcher,
	);
	const { data: ingredients = [] } = useSWR<IngData[]>(
		"/api/ingredients",
		fetcher,
	);
	const { data: costData } = useSWR<CostAnalysis>(
		"/api/cost-calculator",
		fetcher,
	);

	// Product state
	const [catFilter, setCatFilter] = useState("all");
	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState({
		name: "",
		description: "",
		price: "",
		categoryId: "",
		target: "bar" as "bar" | "kitchen",
		isAvailable: true,
		isPoolChip: false,
		image: "",
	});

	// Recipe state
	const [recProdId, setRecProdId] = useState("");
	const { data: recItems = [] } = useSWR<RecipeIng[]>(
		recProdId ? `/api/recipe-ingredients?productId=${recProdId}` : null,
		fetcher,
	);
	const [addingRI, setAddingRI] = useState(false);
	const [riForm, setRiForm] = useState({
		ingredientId: "",
		quantity: "",
		unit: "ml",
	});

	// Cost sort
	const [cSort, setCSort] = useState<{ key: string; asc: boolean }>({
		key: "name",
		asc: true,
	});

	// Derived
	const avail = products.filter((p) => p.isAvailable).length;
	const uniqueCats = new Set(products.map((p) => p.categoryId)).size;
	const filtered = useMemo(() => {
		let l = products;
		if (catFilter !== "all") l = l.filter((p) => p.categoryId === catFilter);
		if (search.trim()) {
			const q = search.toLowerCase();
			l = l.filter((p) => p.name.toLowerCase().includes(q));
		}
		return l;
	}, [products, catFilter, search]);

	const recProd = products.find((p) => p.id === recProdId);
	const recCost = recItems.reduce(
		(s, ri) => s + ri.quantity * ri.ingredient.costPerUnit,
		0,
	);
	const recMargin =
		recProd && recProd.price > 0
			? ((recProd.price - recCost) / recProd.price) * 100
			: 0;

	const sortedCost = useMemo(() => {
		if (!costData) return [];
		const l = [...costData.products];
		l.sort((a, b) => {
			const av = a[cSort.key as keyof CostProduct] ?? "";
			const bv = b[cSort.key as keyof CostProduct] ?? "";
			if (typeof av === "number" && typeof bv === "number")
				return cSort.asc ? av - bv : bv - av;
			return cSort.asc
				? String(av).localeCompare(String(bv))
				: String(bv).localeCompare(String(av));
		});
		return l;
	}, [costData, cSort]);

	const getCat = (id: string) =>
		categories.find((c) => c.id === id)?.name ?? "Sin cat.";
	const mut = (...keys: string[]) => Promise.all(keys.map((k) => mutate(k)));
	const resetForm = () => {
		setForm({
			name: "",
			description: "",
			price: "",
			categoryId: "",
			target: "bar",
			isAvailable: true,
			isPoolChip: false,
			image: "",
		});
		setEditId(null);
		setShowForm(false);
	};

	const openEdit = (p: Product) => {
		setEditId(p.id);
		setForm({
			name: p.name,
			description: p.description ?? "",
			price: String(p.price),
			categoryId: p.categoryId,
			target: p.target,
			isAvailable: p.isAvailable,
			isPoolChip: p.isPoolChip,
			image: p.image ?? "",
		});
		setShowForm(true);
	};

	const saveProduct = async () => {
		setSaving(true);
		try {
			const body = {
				name: form.name,
				description: form.description || null,
				price: Number(form.price),
				categoryId: form.categoryId,
				target: form.target,
				isAvailable: form.isAvailable,
				isPoolChip: form.isPoolChip,
				image: form.image || null,
			};
			if (editId)
				await apiFetch(`/api/products/${editId}`, {
					method: "PATCH",
					body: JSON.stringify(body),
				});
			else
				await apiFetch("/api/products", {
					method: "POST",
					body: JSON.stringify(body),
				});
			resetForm();
			await mut("/api/products", "/api/cost-calculator");
		} catch (e) {
			console.error(e);
		} finally {
			setSaving(false);
		}
	};

	const delProduct = async (id: string) => {
		if (!confirm("Eliminar este producto?")) return;
		await apiFetch(`/api/products/${id}`, { method: "DELETE" });
		await mut("/api/products", "/api/cost-calculator");
	};
	const toggleAvail = async (p: Product) => {
		await apiFetch(`/api/products/${p.id}`, {
			method: "PATCH",
			body: JSON.stringify({ isAvailable: !p.isAvailable }),
		});
		await mutate("/api/products");
	};
	const bulkAvail = async (v: boolean) => {
		await Promise.all(
			products.map((p) =>
				apiFetch(`/api/products/${p.id}`, {
					method: "PATCH",
					body: JSON.stringify({ isAvailable: v }),
				}),
			),
		);
		await mutate("/api/products");
	};

	const addRI = async () => {
		if (!recProdId || !riForm.ingredientId || !riForm.quantity) return;
		setAddingRI(true);
		try {
			await apiFetch("/api/recipe-ingredients", {
				method: "POST",
				body: JSON.stringify({
					productId: recProdId,
					ingredientId: riForm.ingredientId,
					quantity: Number(riForm.quantity),
					unit: riForm.unit,
				}),
			});
			setRiForm({ ingredientId: "", quantity: "", unit: "ml" });
			await mut(
				`/api/recipe-ingredients?productId=${recProdId}`,
				"/api/products",
				"/api/cost-calculator",
			);
		} catch (e) {
			console.error(e);
		} finally {
			setAddingRI(false);
		}
	};

	const removeRI = async (riId: string) => {
		await apiFetch(`/api/recipe-ingredients/${riId}`, { method: "DELETE" });
		await mut(
			`/api/recipe-ingredients?productId=${recProdId}`,
			"/api/products",
			"/api/cost-calculator",
		);
	};

	const tabs: { key: TabKey; label: string }[] = [
		{ key: "productos", label: "Productos" },
		{ key: "recetas", label: "Recetas" },
		{ key: "costos", label: "Analisis Costos" },
	];
	const pMargin = (p: Product) =>
		p.price > 0 ? ((p.price - p.costPrice) / p.price) * 100 : 0;

	return (
		<div style={{ minHeight: "100vh", background: "var(--s0)" }}>
			<div
				style={{ padding: "28px 24px 48px", maxWidth: 1200, margin: "0 auto" }}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: 8,
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
						<div
							style={{
								width: 3,
								height: 24,
								borderRadius: 2,
								background: "#f59e0b",
							}}
						/>
						<div>
							<h1
								style={{
									...syne(22, "#f5f5f5"),
									lineHeight: 1.1,
									margin: 0,
									letterSpacing: 0,
								}}
							>
								Gestion de Menu
							</h1>
							<p style={{ ...dm(12, "#666"), margin: 0, marginTop: 2 }}>
								Productos, recetas e ingredientes
							</p>
						</div>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
							padding: 4,
							borderRadius: 12,
							background: "var(--s2)",
							border: "1px solid var(--s3)",
						}}
					>
						{tabs.map((t) => (
							<button
								key={t.key}
								onClick={() => setTab(t.key)}
								style={{
									padding: "7px 20px",
									borderRadius: 10,
									border:
										tab === t.key
											? "1px solid rgba(245,158,11,0.3)"
											: "1px solid transparent",
									background:
										tab === t.key ? "rgba(245,158,11,0.1)" : "transparent",
									...syne(11, tab === t.key ? "#f59e0b" : "#666"),
									cursor: "pointer",
									transition: "all 0.15s",
								}}
							>
								{t.label}
							</button>
						))}
					</div>
				</div>
				<div
					style={{
						height: 1,
						background:
							"linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)",
						marginBottom: 28,
					}}
				/>

				{/* ── TAB 1: PRODUCTOS ──────────────────────────────────────────── */}
				{tab === "productos" && (
					<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
								gap: 16,
							}}
						>
							<KpiCard
								label="Total Productos"
								value={products.length}
								sub={`${uniqueCats} categorias`}
								color="#3b82f6"
								icon={Package}
								idx={0}
							/>
							<KpiCard
								label="Disponibles"
								value={avail}
								sub="activos en menu"
								color="#10b981"
								icon={Eye}
								idx={1}
							/>
							<KpiCard
								label="No Disponibles"
								value={products.length - avail}
								sub="ocultos del menu"
								color="#ef4444"
								icon={EyeOff}
								idx={2}
							/>
							<KpiCard
								label="Categorias"
								value={categories.length}
								sub="agrupaciones activas"
								color="#f59e0b"
								icon={UtensilsCrossed}
								idx={3}
							/>
						</div>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 12,
								flexWrap: "wrap",
							}}
						>
							<div
								style={{
									position: "relative",
									flex: "1 1 200px",
									maxWidth: 320,
								}}
							>
								<Search
									size={14}
									style={{
										position: "absolute",
										left: 12,
										top: "50%",
										transform: "translateY(-50%)",
										color: "#555",
									}}
								/>
								<input
									placeholder="Buscar producto..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									style={{ ...iS, paddingLeft: 34 }}
								/>
							</div>
							<select
								value={catFilter}
								onChange={(e) => setCatFilter(e.target.value)}
								style={{ ...sS, width: "auto", maxWidth: 200 }}
							>
								<option value="all">Todas las categorias</option>
								{categories.map((c) => (
									<option key={c.id} value={c.id}>
										{c.icon} {c.name}
									</option>
								))}
							</select>
							<button
								onClick={() => bulkAvail(true)}
								style={{
									padding: "8px 14px",
									borderRadius: 8,
									border: "1px solid rgba(16,185,129,0.3)",
									background: "rgba(16,185,129,0.08)",
									...syne(10, "#10b981"),
									cursor: "pointer",
								}}
							>
								Todos disp.
							</button>
							<button
								onClick={() => bulkAvail(false)}
								style={{
									padding: "8px 14px",
									borderRadius: 8,
									border: "1px solid rgba(239,68,68,0.3)",
									background: "rgba(239,68,68,0.08)",
									...syne(10, "#ef4444"),
									cursor: "pointer",
								}}
							>
								Todos no disp.
							</button>
							<button
								onClick={() => {
									resetForm();
									setShowForm(true);
								}}
								style={{ ...goldBtn(), marginLeft: "auto" }}
							>
								<Plus size={14} /> Agregar
							</button>
						</div>
						<SC title={`Productos (${filtered.length})`} icon={UtensilsCrossed}>
							{filtered.length === 0 ? (
								<div style={{ padding: "48px 20px", textAlign: "center" }}>
									<UtensilsCrossed
										size={32}
										style={{ color: "#333", marginBottom: 8 }}
									/>
									<div style={dm(13, "#555")}>No hay productos</div>
								</div>
							) : (
								filtered.map((p, idx) => (
									<div
										key={p.id}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 14,
											padding: "12px 20px",
											borderBottom:
												idx < filtered.length - 1
													? "1px solid var(--s3)"
													: "none",
											transition: "background 0.15s",
										}}
										{...hoverRow()}
									>
										<button
											onClick={() => toggleAvail(p)}
											style={{
												width: 22,
												height: 22,
												borderRadius: 6,
												border: `2px solid ${p.isAvailable ? "#10b981" : "var(--s4)"}`,
												background: p.isAvailable
													? "rgba(16,185,129,0.2)"
													: "transparent",
												cursor: "pointer",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												flexShrink: 0,
											}}
										>
											{p.isAvailable && (
												<Check size={12} style={{ color: "#10b981" }} />
											)}
										</button>
										<div style={{ flex: 1, minWidth: 0 }}>
											<div
												style={{
													...dm(14, "#f5f5f5", 500),
													opacity: p.isAvailable ? 1 : 0.4,
												}}
											>
												{p.name}
												{p.isPoolChip && (
													<span
														style={{
															marginLeft: 8,
															padding: "2px 6px",
															borderRadius: 4,
															background: "rgba(139,92,246,0.15)",
															border: "1px solid rgba(139,92,246,0.3)",
															...syne(9, "#8b5cf6"),
														}}
													>
														FICHA
													</span>
												)}
											</div>
											{p.description && (
												<div style={{ ...dm(11, "#555"), marginTop: 1 }}>
													{p.description}
												</div>
											)}
										</div>
										<span style={syne(10, "#666")}>{getCat(p.categoryId)}</span>
										<span
											style={{
												padding: "3px 9px",
												borderRadius: 99,
												...syne(9, p.target === "bar" ? "#3b82f6" : "#f59e0b"),
												background:
													p.target === "bar"
														? "rgba(59,130,246,0.12)"
														: "rgba(245,158,11,0.12)",
												border: `1px solid ${p.target === "bar" ? "rgba(59,130,246,0.25)" : "rgba(245,158,11,0.25)"}`,
											}}
										>
											{p.target === "bar" ? "Bar" : "Cocina"}
										</span>
										{p.costPrice > 0 && (
											<span
												style={{
													padding: "3px 8px",
													borderRadius: 99,
													...syne(9, mc(pMargin(p))),
													background: `${mc(pMargin(p))}15`,
													border: `1px solid ${mc(pMargin(p))}30`,
												}}
											>
												{Math.round(pMargin(p))}%
											</span>
										)}
										<span
											style={{
												...bebas(16, "#f59e0b"),
												minWidth: 80,
												textAlign: "right",
											}}
										>
											{formatCurrency(p.price)}
										</span>
										<div
											style={{ display: "flex", alignItems: "center", gap: 4 }}
										>
											<button
												onClick={() => openEdit(p)}
												style={{ ...ghostBtn, color: "#888" }}
											>
												<Pencil size={13} />
											</button>
											<button
												onClick={() => delProduct(p.id)}
												style={{ ...ghostBtn, color: "#ef4444" }}
											>
												<Trash2 size={13} />
											</button>
										</div>
									</div>
								))
							)}
						</SC>
					</div>
				)}

				{/* ── TAB 2: RECETAS ───────────────────────────────────────────── */}
				{tab === "recetas" && (
					<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
						<SC title="Seleccionar Producto" icon={ChefHat}>
							<div style={{ padding: 20 }}>
								<select
									value={recProdId}
									onChange={(e) => setRecProdId(e.target.value)}
									style={{ ...sS, maxWidth: 400 }}
								>
									<option value="">-- Elegir producto --</option>
									{products.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name} — {formatCurrency(p.price)}
										</option>
									))}
								</select>
							</div>
						</SC>
						{recProd && (
							<>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
										gap: 16,
									}}
								>
									<KpiCard
										label="Precio Venta"
										value={formatCurrency(recProd.price)}
										color="#3b82f6"
										icon={UtensilsCrossed}
										idx={0}
									/>
									<KpiCard
										label="Costo"
										value={formatCurrency(recCost)}
										sub={`${recItems.length} ingredientes`}
										color="#ef4444"
										icon={FlaskConical}
										idx={1}
									/>
									<KpiCard
										label="Ganancia"
										value={formatCurrency(recProd.price - recCost)}
										color="#10b981"
										icon={TrendingUp}
										idx={2}
									/>
									<KpiCard
										label="Margen"
										value={`${Math.round(recMargin)}%`}
										sub={
											recMargin < 30
												? "Margen bajo"
												: recMargin < 50
													? "Moderado"
													: "Saludable"
										}
										color={mc(recMargin)}
										icon={BarChart3}
										idx={3}
									/>
								</div>
								{recItems.length > 0 && (
									<div
										style={{
											background: "var(--s1)",
											border: "1px solid var(--s4)",
											borderRadius: 16,
											padding: 20,
										}}
									>
										<div
											style={{
												...syne(10, "#888", { letterSpacing: "0.15em" }),
												marginBottom: 12,
											}}
										>
											Desglose Costo vs Ganancia
										</div>
										<div
											style={{
												height: 28,
												borderRadius: 8,
												overflow: "hidden",
												display: "flex",
												background: "var(--s3)",
											}}
										>
											<div
												style={{
													width: `${recProd.price > 0 ? (recCost / recProd.price) * 100 : 0}%`,
													background:
														"linear-gradient(90deg, #ef4444, #f87171)",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													transition: "width 0.3s",
													minWidth: recCost > 0 ? 60 : 0,
												}}
											>
												<span
													style={{
														...syne(9, "#fff"),
														letterSpacing: "0.05em",
													}}
												>
													COSTO{" "}
													{recProd.price > 0
														? Math.round((recCost / recProd.price) * 100)
														: 0}
													%
												</span>
											</div>
											<div
												style={{
													flex: 1,
													background:
														"linear-gradient(90deg, #10b981, #34d399)",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<span
													style={{
														...syne(9, "#fff"),
														letterSpacing: "0.05em",
													}}
												>
													GANANCIA {Math.round(recMargin)}%
												</span>
											</div>
										</div>
									</div>
								)}
								<SC
									title="Ingredientes de la Receta"
									icon={FlaskConical}
									right={
										<span style={bebas(20, "#f59e0b")}>{recItems.length}</span>
									}
								>
									{recItems.length === 0 ? (
										<div style={{ padding: "40px 20px", textAlign: "center" }}>
											<FlaskConical
												size={32}
												style={{ color: "#333", marginBottom: 8 }}
											/>
											<div style={dm(13, "#555")}>
												Sin ingredientes — agrega para calcular costos
											</div>
										</div>
									) : (
										recItems.map((ri, idx) => (
											<div
												key={ri.id}
												style={{
													display: "flex",
													alignItems: "center",
													gap: 14,
													padding: "12px 20px",
													borderBottom:
														idx < recItems.length - 1
															? "1px solid var(--s3)"
															: "none",
													transition: "background 0.15s",
												}}
												{...hoverRow()}
											>
												<div
													style={{
														width: 8,
														height: 8,
														borderRadius: "50%",
														background: "#f59e0b",
														flexShrink: 0,
													}}
												/>
												<div style={{ flex: 1 }}>
													<div style={dm(14, "#f5f5f5", 500)}>
														{ri.ingredient.name}
													</div>
													<div style={{ ...dm(11, "#666"), marginTop: 1 }}>
														{ri.quantity} {ri.unit} x{" "}
														{formatCurrency(ri.ingredient.costPerUnit)}/
														{ri.ingredient.unit}
													</div>
												</div>
												<span
													style={{
														...bebas(16, "#f59e0b"),
														minWidth: 80,
														textAlign: "right",
													}}
												>
													{formatCurrency(
														ri.quantity * ri.ingredient.costPerUnit,
													)}
												</span>
												<button
													onClick={() => removeRI(ri.id)}
													style={{ ...ghostBtn, color: "#ef4444" }}
												>
													<Trash2 size={13} />
												</button>
											</div>
										))
									)}
									<div
										style={{
											padding: "14px 20px",
											borderTop: "1px solid var(--s3)",
											background: "var(--s2)",
											display: "flex",
											alignItems: "flex-end",
											gap: 10,
											flexWrap: "wrap",
										}}
									>
										<div style={{ flex: "1 1 180px" }}>
											<div style={lS}>Ingrediente</div>
											<select
												value={riForm.ingredientId}
												onChange={(e) =>
													setRiForm({ ...riForm, ingredientId: e.target.value })
												}
												style={sS}
											>
												<option value="">Seleccionar...</option>
												{ingredients.map((i) => (
													<option key={i.id} value={i.id}>
														{i.name} ({formatCurrency(i.costPerUnit)}/{i.unit})
													</option>
												))}
											</select>
										</div>
										<div style={{ flex: "0 0 100px" }}>
											<div style={lS}>Cantidad</div>
											<input
												type="number"
												value={riForm.quantity}
												onChange={(e) =>
													setRiForm({ ...riForm, quantity: e.target.value })
												}
												placeholder="0"
												style={iS}
											/>
										</div>
										<div style={{ flex: "0 0 100px" }}>
											<div style={lS}>Unidad</div>
											<select
												value={riForm.unit}
												onChange={(e) =>
													setRiForm({ ...riForm, unit: e.target.value })
												}
												style={sS}
											>
												{["ml", "gr", "kg", "lt", "unidad"].map((u) => (
													<option key={u} value={u}>
														{u}
													</option>
												))}
											</select>
										</div>
										<button
											onClick={addRI}
											disabled={
												addingRI || !riForm.ingredientId || !riForm.quantity
											}
											style={goldBtn(
												addingRI || !riForm.ingredientId || !riForm.quantity,
											)}
										>
											<Plus size={14} /> {addingRI ? "Agregando..." : "Agregar"}
										</button>
									</div>
								</SC>
							</>
						)}
					</div>
				)}

				{/* ── TAB 3: ANALISIS COSTOS ───────────────────────────────────── */}
				{tab === "costos" && costData && (
					<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
								gap: 16,
							}}
						>
							<KpiCard
								label="Margen Promedio"
								value={`${costData.summary.avgMargin}%`}
								sub="productos con receta"
								color={mc(costData.summary.avgMargin)}
								icon={TrendingUp}
								idx={0}
							/>
							<KpiCard
								label="Con Receta"
								value={costData.summary.withRecipe}
								sub={`de ${costData.summary.totalProducts} productos`}
								color="#10b981"
								icon={FlaskConical}
								idx={1}
							/>
							<KpiCard
								label="Sin Receta"
								value={costData.summary.withoutRecipe}
								sub="necesitan composicion"
								color="#ef4444"
								icon={AlertTriangle}
								idx={2}
							/>
							<KpiCard
								label="Total Productos"
								value={costData.summary.totalProducts}
								color="#3b82f6"
								icon={Package}
								idx={3}
							/>
						</div>
						<SC title="Analisis por Producto" icon={BarChart3}>
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
									padding: "10px 20px",
									borderBottom: "1px solid var(--s3)",
									background: "var(--s2)",
								}}
							>
								{(
									[
										["Producto", "name"],
										["Categoria", "category"],
										["Venta", "salePrice"],
										["Costo", "costPrice"],
										["Ganancia", "profit"],
										["Margen", "marginPercent"],
									] as const
								).map(([l, k]) => (
									<button
										key={k}
										onClick={() =>
											setCSort((prev) =>
												prev.key === k
													? { key: k, asc: !prev.asc }
													: { key: k, asc: true },
											)
										}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 4,
											background: "none",
											border: "none",
											cursor: "pointer",
											...syne(9, cSort.key === k ? "#f59e0b" : "#888"),
											padding: 0,
										}}
									>
										{l} <ArrowUpDown size={10} />
									</button>
								))}
							</div>
							{sortedCost.length === 0 ? (
								<div style={{ padding: "48px 20px", textAlign: "center" }}>
									<div style={dm(13, "#555")}>No hay datos de costos</div>
								</div>
							) : (
								sortedCost.map((cp, idx) => {
									const bg = !cp.hasRecipe
										? "rgba(239,68,68,0.04)"
										: "transparent";
									return (
										<div
											key={cp.id}
											style={{
												display: "grid",
												gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
												padding: "11px 20px",
												borderBottom:
													idx < sortedCost.length - 1
														? "1px solid var(--s3)"
														: "none",
												transition: "background 0.15s",
												background: bg,
											}}
											{...hoverRow(bg)}
										>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: 8,
												}}
											>
												<span style={dm(13, "#f5f5f5", 500)}>{cp.name}</span>
												{!cp.hasRecipe && (
													<span
														style={{
															padding: "2px 6px",
															borderRadius: 4,
															background: "rgba(239,68,68,0.15)",
															border: "1px solid rgba(239,68,68,0.3)",
															...syne(8, "#ef4444"),
														}}
													>
														SIN RECETA
													</span>
												)}
											</div>
											<span
												style={{
													...dm(12, "#888"),
													display: "flex",
													alignItems: "center",
												}}
											>
												{cp.category}
											</span>
											<span
												style={{
													...bebas(15, "#f5f5f5"),
													display: "flex",
													alignItems: "center",
												}}
											>
												{formatCurrency(cp.salePrice)}
											</span>
											<span
												style={{
													...bebas(15, cp.hasRecipe ? "#ef4444" : "#555"),
													display: "flex",
													alignItems: "center",
												}}
											>
												{cp.hasRecipe ? formatCurrency(cp.costPrice) : "-"}
											</span>
											<span
												style={{
													...bebas(15, cp.hasRecipe ? "#10b981" : "#555"),
													display: "flex",
													alignItems: "center",
												}}
											>
												{cp.hasRecipe ? formatCurrency(cp.profit) : "-"}
											</span>
											<div style={{ display: "flex", alignItems: "center" }}>
												{cp.hasRecipe ? (
													<span
														style={{
															...bebas(16, mc(cp.marginPercent)),
															padding: "2px 10px",
															borderRadius: 6,
															background: `${mc(cp.marginPercent)}15`,
															border: `1px solid ${mc(cp.marginPercent)}30`,
														}}
													>
														{cp.marginPercent}%
													</span>
												) : (
													<span style={dm(11, "#555")}>-</span>
												)}
											</div>
										</div>
									);
								})
							)}
						</SC>
					</div>
				)}

				{/* ── PRODUCT MODAL ────────────────────────────────────────────── */}
				{showForm && (
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
						onClick={resetForm}
					>
						<div
							style={{
								background: "var(--s1)",
								border: "1px solid var(--s4)",
								borderRadius: 16,
								width: "100%",
								maxWidth: 560,
								maxHeight: "90vh",
								overflowY: "auto",
								boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
							}}
							onClick={(e) => e.stopPropagation()}
						>
							<div
								style={{
									padding: "16px 20px",
									borderBottom: "1px solid var(--s3)",
									background: "var(--s2)",
									borderRadius: "16px 16px 0 0",
								}}
							>
								<h2
									style={{
										...syne(16, "#f5f5f5"),
										margin: 0,
										letterSpacing: 0,
									}}
								>
									{editId ? "Editar producto" : "Nuevo producto"}
								</h2>
							</div>
							<div
								style={{
									padding: 20,
									display: "flex",
									flexDirection: "column",
									gap: 16,
								}}
							>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 1fr",
										gap: 12,
									}}
								>
									<div>
										<div style={lS}>Nombre</div>
										<input
											value={form.name}
											onChange={(e) =>
												setForm({ ...form, name: e.target.value })
											}
											placeholder="Ej: Cerveza Quilmes"
											style={iS}
										/>
									</div>
									<div>
										<div style={lS}>Precio</div>
										<input
											type="number"
											value={form.price}
											onChange={(e) =>
												setForm({ ...form, price: e.target.value })
											}
											placeholder="0"
											style={iS}
										/>
									</div>
									<div>
										<div style={lS}>Categoria</div>
										<select
											value={form.categoryId}
											onChange={(e) =>
												setForm({ ...form, categoryId: e.target.value })
											}
											style={sS}
										>
											<option value="">Seleccionar...</option>
											{categories.map((c) => (
												<option key={c.id} value={c.id}>
													{c.icon} {c.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<div style={lS}>Destino</div>
										<select
											value={form.target}
											onChange={(e) =>
												setForm({
													...form,
													target: e.target.value as "bar" | "kitchen",
												})
											}
											style={sS}
										>
											<option value="bar">Bar</option>
											<option value="kitchen">Cocina</option>
										</select>
									</div>
								</div>
								<div>
									<div style={lS}>Descripcion</div>
									<input
										value={form.description}
										onChange={(e) =>
											setForm({ ...form, description: e.target.value })
										}
										placeholder="Opcional"
										style={iS}
									/>
								</div>
								<div>
									<div style={lS}>Imagen URL</div>
									<input
										value={form.image}
										onChange={(e) =>
											setForm({ ...form, image: e.target.value })
										}
										placeholder="https://..."
										style={iS}
									/>
								</div>
								<div style={{ display: "flex", alignItems: "center", gap: 24 }}>
									<label
										style={{
											display: "flex",
											alignItems: "center",
											gap: 8,
											cursor: "pointer",
											...dm(13, "#e5e5e5"),
										}}
									>
										<input
											type="checkbox"
											checked={form.isAvailable}
											onChange={(e) =>
												setForm({ ...form, isAvailable: e.target.checked })
											}
											style={{ accentColor: "#f59e0b" }}
										/>
										Disponible
									</label>
									<label
										style={{
											display: "flex",
											alignItems: "center",
											gap: 8,
											cursor: "pointer",
											...dm(13, "#e5e5e5"),
										}}
									>
										<input
											type="checkbox"
											checked={form.isPoolChip}
											onChange={(e) =>
												setForm({ ...form, isPoolChip: e.target.checked })
											}
											style={{ accentColor: "#f59e0b" }}
										/>
										Ficha de pool
									</label>
								</div>
							</div>
							<div style={{ display: "flex", gap: 8, padding: "0 20px 20px" }}>
								<button
									onClick={resetForm}
									style={{
										flex: 1,
										padding: 10,
										borderRadius: 10,
										border: "1px solid var(--s4)",
										background: "transparent",
										...syne(12, "#888"),
										cursor: "pointer",
										letterSpacing: 0,
									}}
								>
									Cancelar
								</button>
								<button
									onClick={saveProduct}
									disabled={saving || !form.name || !form.price}
									style={{
										flex: 1,
										padding: 10,
										borderRadius: 10,
										border: "1px solid rgba(245,158,11,0.4)",
										background: "rgba(245,158,11,0.15)",
										...syne(12, "#f59e0b"),
										cursor:
											saving || !form.name || !form.price
												? "not-allowed"
												: "pointer",
										opacity: saving || !form.name || !form.price ? 0.4 : 1,
										letterSpacing: 0,
									}}
								>
									{saving
										? "Guardando..."
										: editId
											? "Guardar cambios"
											: "Crear producto"}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
