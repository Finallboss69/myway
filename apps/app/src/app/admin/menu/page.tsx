"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
	title,
	count,
	onAdd,
}: {
	title: string;
	count: number;
	onAdd: () => void;
}) {
	return (
		<div className="flex items-center justify-between mb-4">
			<div className="flex items-center gap-3">
				<h2
					className="font-display text-ink-primary uppercase"
					style={{ fontSize: 13, letterSpacing: "0.2em", fontWeight: 600 }}
				>
					{title}
				</h2>
				<span
					style={{
						background: "rgba(245,158,11,0.12)",
						color: "#f59e0b",
						border: "1px solid rgba(245,158,11,0.2)",
						fontFamily: "var(--font-syne)",
						fontSize: 9,
						fontWeight: 700,
						borderRadius: "99px",
						padding: "2px 8px",
					}}
				>
					{count}
				</span>
			</div>
			<button
				className="btn-primary"
				style={{ padding: "8px 16px" }}
				onClick={onAdd}
			>
				<Plus size={14} />
				Agregar
			</button>
		</div>
	);
}

// ─── Input helper ─────────────────────────────────────────────────────────────

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label
				className="font-display text-ink-disabled uppercase block mb-1"
				style={{ fontSize: 9, letterSpacing: "0.2em" }}
			>
				{label}
			</label>
			{children}
		</div>
	);
}

// ─── Add / Edit Product form ──────────────────────────────────────────────────

interface ProductDraft {
	name: string;
	price: string;
	categoryId: string;
	target: "bar" | "kitchen";
	description: string;
	isAvailable: boolean;
	isPoolChip: boolean;
}

const emptyProductDraft = (): ProductDraft => ({
	name: "",
	price: "",
	categoryId: "",
	target: "bar",
	description: "",
	isAvailable: true,
	isPoolChip: false,
});

function ProductForm({
	draft,
	categories,
	onChange,
	onSave,
	onCancel,
	saving,
	editId,
}: {
	draft: ProductDraft;
	categories: Category[];
	onChange: (d: ProductDraft) => void;
	onSave: () => void;
	onCancel: () => void;
	saving: boolean;
	editId: string | null;
}) {
	return (
		<div
			className="card-sm animate-slide-up"
			style={{ padding: 20, marginBottom: 16 }}
		>
			<div
				className="font-display text-ink-disabled uppercase mb-4"
				style={{ fontSize: 10, letterSpacing: "0.25em" }}
			>
				{editId ? "Editar producto" : "Nuevo producto"}
			</div>
			<div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
				<Field label="Nombre">
					<input
						className="input-base"
						value={draft.name}
						onChange={(e) => onChange({ ...draft, name: e.target.value })}
						placeholder="Ej: Cerveza Quilmes"
					/>
				</Field>
				<Field label="Precio">
					<input
						className="input-base"
						type="number"
						value={draft.price}
						onChange={(e) => onChange({ ...draft, price: e.target.value })}
						placeholder="0"
					/>
				</Field>
				<Field label="Categoría">
					<select
						className="input-base"
						value={draft.categoryId}
						onChange={(e) => onChange({ ...draft, categoryId: e.target.value })}
						style={{ cursor: "pointer" }}
					>
						<option value="">Seleccionar...</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>
								{c.icon} {c.name}
							</option>
						))}
					</select>
				</Field>
				<Field label="Destino">
					<select
						className="input-base"
						value={draft.target}
						onChange={(e) =>
							onChange({
								...draft,
								target: e.target.value as "bar" | "kitchen",
							})
						}
						style={{ cursor: "pointer" }}
					>
						<option value="bar">Bar</option>
						<option value="kitchen">Cocina</option>
					</select>
				</Field>
				<Field label="Descripción">
					<input
						className="input-base"
						value={draft.description}
						onChange={(e) =>
							onChange({ ...draft, description: e.target.value })
						}
						placeholder="Opcional"
					/>
				</Field>
				<div className="flex flex-col gap-2" style={{ paddingTop: 20 }}>
					<label
						className="flex items-center gap-2 cursor-pointer"
						style={{ fontSize: 13, color: "#e5e5e5" }}
					>
						<input
							type="checkbox"
							checked={draft.isAvailable}
							onChange={(e) =>
								onChange({ ...draft, isAvailable: e.target.checked })
							}
							style={{ accentColor: "#f59e0b" }}
						/>
						Disponible
					</label>
					<label
						className="flex items-center gap-2 cursor-pointer"
						style={{ fontSize: 13, color: "#e5e5e5" }}
					>
						<input
							type="checkbox"
							checked={draft.isPoolChip}
							onChange={(e) =>
								onChange({ ...draft, isPoolChip: e.target.checked })
							}
							style={{ accentColor: "#f59e0b" }}
						/>
						Es ficha de pool
					</label>
				</div>
			</div>
			<div className="flex items-center gap-2 mt-4">
				<button
					className="btn-primary"
					onClick={onSave}
					disabled={saving || !draft.name || !draft.price}
				>
					<Check size={14} />
					{saving
						? "Guardando..."
						: editId
							? "Guardar cambios"
							: "Crear producto"}
				</button>
				<button className="btn-ghost" onClick={onCancel}>
					<X size={14} />
					Cancelar
				</button>
			</div>
		</div>
	);
}

// ─── Category form ────────────────────────────────────────────────────────────

interface CategoryDraft {
	name: string;
	icon: string;
	order: string;
}

const emptyCategoryDraft = (): CategoryDraft => ({
	name: "",
	icon: "🍽️",
	order: "0",
});

function CategoryForm({
	draft,
	onChange,
	onSave,
	onCancel,
	saving,
	editId,
}: {
	draft: CategoryDraft;
	onChange: (d: CategoryDraft) => void;
	onSave: () => void;
	onCancel: () => void;
	saving: boolean;
	editId: string | null;
}) {
	return (
		<div
			className="card-sm animate-slide-up"
			style={{ padding: 20, marginBottom: 16 }}
		>
			<div
				className="font-display text-ink-disabled uppercase mb-4"
				style={{ fontSize: 10, letterSpacing: "0.25em" }}
			>
				{editId ? "Editar categoría" : "Nueva categoría"}
			</div>
			<div
				className="grid gap-3"
				style={{ gridTemplateColumns: "1fr 1fr 80px" }}
			>
				<Field label="Nombre">
					<input
						className="input-base"
						value={draft.name}
						onChange={(e) => onChange({ ...draft, name: e.target.value })}
						placeholder="Ej: Bebidas"
					/>
				</Field>
				<Field label="Ícono (emoji)">
					<input
						className="input-base"
						value={draft.icon}
						onChange={(e) => onChange({ ...draft, icon: e.target.value })}
						placeholder="🍺"
						style={{ fontSize: 20 }}
					/>
				</Field>
				<Field label="Orden">
					<input
						className="input-base"
						type="number"
						value={draft.order}
						onChange={(e) => onChange({ ...draft, order: e.target.value })}
					/>
				</Field>
			</div>
			<div className="flex items-center gap-2 mt-4">
				<button
					className="btn-primary"
					onClick={onSave}
					disabled={saving || !draft.name}
				>
					<Check size={14} />
					{saving ? "Guardando..." : editId ? "Guardar" : "Crear categoría"}
				</button>
				<button className="btn-ghost" onClick={onCancel}>
					<X size={14} />
					Cancelar
				</button>
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [activeTab, setActiveTab] = useState<"products" | "categories">(
		"products",
	);

	// product form state
	const [showProductForm, setShowProductForm] = useState(false);
	const [editProductId, setEditProductId] = useState<string | null>(null);
	const [productDraft, setProductDraft] = useState<ProductDraft>(
		emptyProductDraft(),
	);
	const [savingProduct, setSavingProduct] = useState(false);

	// category form state
	const [showCatForm, setShowCatForm] = useState(false);
	const [editCatId, setEditCatId] = useState<string | null>(null);
	const [catDraft, setCatDraft] = useState<CategoryDraft>(emptyCategoryDraft());
	const [savingCat, setSavingCat] = useState(false);

	// filter
	const [catFilter, setCatFilter] = useState<string>("all");

	const fetchData = useCallback(async () => {
		try {
			const [p, c] = await Promise.all([
				apiFetch<Product[]>("/api/products"),
				apiFetch<Category[]>("/api/categories"),
			]);
			setProducts(p);
			setCategories(c);
		} catch (e) {
			console.error(e);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// ── Product CRUD ────────────────────────────────────────────────────────────

	const openNewProduct = () => {
		setEditProductId(null);
		setProductDraft(emptyProductDraft());
		setShowProductForm(true);
	};

	const openEditProduct = (p: Product) => {
		setEditProductId(p.id);
		setProductDraft({
			name: p.name,
			price: String(p.price),
			categoryId: p.categoryId,
			target: p.target,
			description: p.description ?? "",
			isAvailable: p.isAvailable,
			isPoolChip: p.isPoolChip,
		});
		setShowProductForm(true);
	};

	const saveProduct = async () => {
		setSavingProduct(true);
		try {
			const body = {
				name: productDraft.name,
				price: Number(productDraft.price),
				categoryId: productDraft.categoryId,
				target: productDraft.target,
				description: productDraft.description || null,
				isAvailable: productDraft.isAvailable,
				isPoolChip: productDraft.isPoolChip,
			};
			if (editProductId) {
				await apiFetch(`/api/products/${editProductId}`, {
					method: "PATCH",
					body: JSON.stringify(body),
				});
			} else {
				await apiFetch("/api/products", {
					method: "POST",
					body: JSON.stringify(body),
				});
			}
			setShowProductForm(false);
			setEditProductId(null);
			await fetchData();
		} catch (e) {
			console.error(e);
		} finally {
			setSavingProduct(false);
		}
	};

	const deleteProduct = async (id: string) => {
		if (!confirm("¿Eliminar este producto?")) return;
		try {
			await apiFetch(`/api/products/${id}`, { method: "DELETE" });
			setProducts((prev) => prev.filter((p) => p.id !== id));
		} catch (e) {
			console.error(e);
		}
	};

	const toggleAvailable = async (p: Product) => {
		const updated = { ...p, isAvailable: !p.isAvailable };
		setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
		try {
			await apiFetch(`/api/products/${p.id}`, {
				method: "PATCH",
				body: JSON.stringify({ isAvailable: !p.isAvailable }),
			});
		} catch (e) {
			console.error(e);
			setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
		}
	};

	// ── Category CRUD ───────────────────────────────────────────────────────────

	const openNewCat = () => {
		setEditCatId(null);
		setCatDraft(emptyCategoryDraft());
		setShowCatForm(true);
	};

	const openEditCat = (c: Category) => {
		setEditCatId(c.id);
		setCatDraft({ name: c.name, icon: c.icon, order: String(c.order) });
		setShowCatForm(true);
	};

	const saveCat = async () => {
		setSavingCat(true);
		try {
			const body = {
				name: catDraft.name,
				icon: catDraft.icon,
				order: Number(catDraft.order),
			};
			if (editCatId) {
				await apiFetch(`/api/categories/${editCatId}`, {
					method: "PATCH",
					body: JSON.stringify(body),
				});
			} else {
				await apiFetch("/api/categories", {
					method: "POST",
					body: JSON.stringify(body),
				});
			}
			setShowCatForm(false);
			setEditCatId(null);
			await fetchData();
		} catch (e) {
			console.error(e);
		} finally {
			setSavingCat(false);
		}
	};

	const deleteCat = async (id: string) => {
		if (!confirm("¿Eliminar esta categoría?")) return;
		try {
			await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
			setCategories((prev) => prev.filter((c) => c.id !== id));
		} catch (e) {
			console.error(e);
		}
	};

	const filteredProducts =
		catFilter === "all"
			? products
			: products.filter((p) => p.categoryId === catFilter);

	const getCategoryName = (catId: string) =>
		categories.find((c) => c.id === catId)?.name ?? "Sin cat.";

	return (
		<div className="p-5 md:p-7">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-7">
				<div>
					<h1
						className="font-display text-ink-primary"
						style={{ fontSize: 20, fontWeight: 700 }}
					>
						Gestión de Menú
					</h1>
					<div
						className="font-body text-ink-disabled mt-1"
						style={{ fontSize: 12 }}
					>
						Productos y categorías
					</div>
				</div>

				{/* Tabs */}
				<div className="flex items-center gap-1">
					{(["products", "categories"] as const).map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							style={{
								padding: "8px 20px",
								borderRadius: 10,
								border:
									activeTab === tab
										? "1px solid rgba(245,158,11,0.3)"
										: "1px solid var(--s3)",
								background:
									activeTab === tab ? "rgba(245,158,11,0.1)" : "transparent",
								color: activeTab === tab ? "#f59e0b" : "#666",
								fontFamily: "var(--font-syne)",
								fontWeight: 600,
								fontSize: 11,
								letterSpacing: "0.15em",
								textTransform: "uppercase",
								cursor: "pointer",
								transition: "all 0.15s",
							}}
						>
							{tab === "products" ? "Productos" : "Categorías"}
						</button>
					))}
				</div>
			</div>

			{/* Products tab */}
			{activeTab === "products" && (
				<div>
					<SectionHeader
						title="Productos"
						count={filteredProducts.length}
						onAdd={openNewProduct}
					/>

					{/* Category filter */}
					<div className="flex items-center gap-2 mb-4 flex-wrap">
						<button
							onClick={() => setCatFilter("all")}
							style={{
								padding: "5px 14px",
								borderRadius: 8,
								border:
									catFilter === "all"
										? "1px solid rgba(245,158,11,0.3)"
										: "1px solid var(--s3)",
								background:
									catFilter === "all" ? "rgba(245,158,11,0.1)" : "transparent",
								color: catFilter === "all" ? "#f59e0b" : "#555",
								fontFamily: "var(--font-syne)",
								fontWeight: 600,
								fontSize: 10,
								letterSpacing: "0.1em",
								textTransform: "uppercase",
								cursor: "pointer",
							}}
						>
							Todos
						</button>
						{categories.map((c) => (
							<button
								key={c.id}
								onClick={() => setCatFilter(c.id)}
								style={{
									padding: "5px 14px",
									borderRadius: 8,
									border:
										catFilter === c.id
											? "1px solid rgba(245,158,11,0.3)"
											: "1px solid var(--s3)",
									background:
										catFilter === c.id ? "rgba(245,158,11,0.1)" : "transparent",
									color: catFilter === c.id ? "#f59e0b" : "#555",
									fontFamily: "var(--font-syne)",
									fontWeight: 600,
									fontSize: 10,
									letterSpacing: "0.1em",
									textTransform: "uppercase",
									cursor: "pointer",
								}}
							>
								{c.icon} {c.name}
							</button>
						))}
					</div>

					{showProductForm && (
						<ProductForm
							draft={productDraft}
							categories={categories}
							onChange={setProductDraft}
							onSave={saveProduct}
							onCancel={() => {
								setShowProductForm(false);
								setEditProductId(null);
							}}
							saving={savingProduct}
							editId={editProductId}
						/>
					)}

					<div className="card" style={{ padding: 0, overflow: "hidden" }}>
						{filteredProducts.length === 0 ? (
							<div
								className="text-center py-12 text-ink-disabled font-body"
								style={{ fontSize: 13 }}
							>
								No hay productos
							</div>
						) : (
							filteredProducts.map((p, idx) => (
								<div
									key={p.id}
									className="flex items-center gap-4"
									style={{
										padding: "12px 20px",
										borderBottom:
											idx < filteredProducts.length - 1
												? "1px solid var(--s3)"
												: "none",
									}}
								>
									{/* Available toggle */}
									<button
										onClick={() => toggleAvailable(p)}
										style={{
											width: 18,
											height: 18,
											borderRadius: 5,
											border: `2px solid ${p.isAvailable ? "#10b981" : "var(--s4)"}`,
											background: p.isAvailable
												? "rgba(16,185,129,0.2)"
												: "transparent",
											cursor: "pointer",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											flexShrink: 0,
											transition: "all 0.15s",
										}}
										title={p.isAvailable ? "Marcar no disponible" : "Activar"}
									>
										{p.isAvailable && (
											<Check size={10} style={{ color: "#10b981" }} />
										)}
									</button>

									{/* Name + desc */}
									<div style={{ flex: 1 }}>
										<div
											className="font-body text-ink-primary"
											style={{
												fontSize: 14,
												fontWeight: 500,
												opacity: p.isAvailable ? 1 : 0.4,
											}}
										>
											{p.name}
											{p.isPoolChip && (
												<span
													className="pool-chip-badge ml-2"
													style={{ fontSize: 10 }}
												>
													FICHA
												</span>
											)}
										</div>
										{p.description && (
											<div
												className="font-body text-ink-disabled"
												style={{ fontSize: 11, marginTop: 1 }}
											>
												{p.description}
											</div>
										)}
									</div>

									{/* Category */}
									<span
										className="font-display text-ink-disabled uppercase"
										style={{ fontSize: 10, letterSpacing: "0.1em" }}
									>
										{getCategoryName(p.categoryId)}
									</span>

									{/* Target */}
									<span
										style={{
											fontSize: 9,
											padding: "2px 8px",
											borderRadius: 99,
											fontFamily: "var(--font-syne)",
											fontWeight: 600,
											letterSpacing: "0.12em",
											textTransform: "uppercase",
											color: p.target === "bar" ? "#3b82f6" : "#f59e0b",
											background:
												p.target === "bar"
													? "rgba(59,130,246,0.12)"
													: "rgba(245,158,11,0.12)",
											border: `1px solid ${p.target === "bar" ? "rgba(59,130,246,0.25)" : "rgba(245,158,11,0.25)"}`,
										}}
									>
										{p.target === "bar" ? "Bar" : "Cocina"}
									</span>

									{/* Price */}
									<span
										className="font-kds text-brand-500"
										style={{ fontSize: 16, minWidth: 80, textAlign: "right" }}
									>
										{formatCurrency(p.price)}
									</span>

									{/* Actions */}
									<button
										className="btn-ghost"
										style={{ padding: "6px 10px" }}
										onClick={() => openEditProduct(p)}
									>
										<Pencil size={13} />
									</button>
									<button
										className="btn-ghost"
										style={{ padding: "6px 10px", color: "#ef4444" }}
										onClick={() => deleteProduct(p.id)}
									>
										<Trash2 size={13} />
									</button>
								</div>
							))
						)}
					</div>
				</div>
			)}

			{/* Categories tab */}
			{activeTab === "categories" && (
				<div>
					<SectionHeader
						title="Categorías"
						count={categories.length}
						onAdd={openNewCat}
					/>

					{showCatForm && (
						<CategoryForm
							draft={catDraft}
							onChange={setCatDraft}
							onSave={saveCat}
							onCancel={() => {
								setShowCatForm(false);
								setEditCatId(null);
							}}
							saving={savingCat}
							editId={editCatId}
						/>
					)}

					<div className="card" style={{ padding: 0, overflow: "hidden" }}>
						{categories.length === 0 ? (
							<div
								className="text-center py-12 text-ink-disabled font-body"
								style={{ fontSize: 13 }}
							>
								No hay categorías
							</div>
						) : (
							categories
								.slice()
								.sort((a, b) => a.order - b.order)
								.map((c, idx) => (
									<div
										key={c.id}
										className="flex items-center gap-4"
										style={{
											padding: "14px 20px",
											borderBottom:
												idx < categories.length - 1
													? "1px solid var(--s3)"
													: "none",
										}}
									>
										<span style={{ fontSize: 24 }}>{c.icon}</span>
										<div style={{ flex: 1 }}>
											<div
												className="font-body text-ink-primary"
												style={{ fontSize: 14, fontWeight: 500 }}
											>
												{c.name}
											</div>
											<div
												className="font-body text-ink-disabled"
												style={{ fontSize: 11, marginTop: 1 }}
											>
												{products.filter((p) => p.categoryId === c.id).length}{" "}
												productos · orden {c.order}
											</div>
										</div>
										<button
											className="btn-ghost"
											style={{ padding: "6px 10px" }}
											onClick={() => openEditCat(c)}
										>
											<Pencil size={13} />
										</button>
										<button
											className="btn-ghost"
											style={{ padding: "6px 10px", color: "#ef4444" }}
											onClick={() => deleteCat(c.id)}
										>
											<Trash2 size={13} />
										</button>
									</div>
								))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
