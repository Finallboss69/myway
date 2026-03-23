"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Plus,
	Pencil,
	Trash2,
	Check,
	X,
	UtensilsCrossed,
	LayoutGrid,
	List,
	Wine,
	ChefHat,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// --- Field helper -----------------------------------------------------------

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
				className="font-display uppercase block mb-1.5"
				style={{ fontSize: 9, letterSpacing: "0.2em", color: "#888" }}
			>
				{label}
			</label>
			{children}
		</div>
	);
}

// --- Product form -----------------------------------------------------------

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
			onClick={onCancel}
		>
			<div
				className="animate-slide-up"
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
					}}
				>
					<h2
						className="font-display"
						style={{ fontSize: 16, fontWeight: 700, color: "#f5f5f5" }}
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
						className="grid gap-3"
						style={{ gridTemplateColumns: "1fr 1fr" }}
					>
						<Field label="Nombre">
							<input
								className="input-base w-full"
								value={draft.name}
								onChange={(e) => onChange({ ...draft, name: e.target.value })}
								placeholder="Ej: Cerveza Quilmes"
							/>
						</Field>
						<Field label="Precio">
							<input
								className="input-base w-full"
								type="number"
								value={draft.price}
								onChange={(e) => onChange({ ...draft, price: e.target.value })}
								placeholder="0"
							/>
						</Field>
						<Field label="Categoria">
							<select
								className="input-base w-full"
								value={draft.categoryId}
								onChange={(e) =>
									onChange({ ...draft, categoryId: e.target.value })
								}
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
								className="input-base w-full"
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
					</div>
					<Field label="Descripcion">
						<input
							className="input-base w-full"
							value={draft.description}
							onChange={(e) =>
								onChange({ ...draft, description: e.target.value })
							}
							placeholder="Opcional"
						/>
					</Field>
					<div className="flex items-center gap-6">
						<label
							className="flex items-center gap-2.5 cursor-pointer font-body"
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
							className="flex items-center gap-2.5 cursor-pointer font-body"
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
				<div className="flex gap-2" style={{ padding: "0 20px 20px" }}>
					<button
						className="btn-ghost flex-1"
						style={{ padding: "10px" }}
						onClick={onCancel}
					>
						Cancelar
					</button>
					<button
						className="btn-primary flex-1"
						onClick={onSave}
						disabled={saving || !draft.name || !draft.price}
						style={{
							padding: "10px",
							opacity: saving || !draft.name || !draft.price ? 0.4 : 1,
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
	);
}

// --- Category form ----------------------------------------------------------

interface CategoryDraft {
	name: string;
	icon: string;
	order: string;
}

const emptyCategoryDraft = (): CategoryDraft => ({
	name: "",
	icon: "",
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
			onClick={onCancel}
		>
			<div
				className="animate-slide-up"
				style={{
					background: "var(--s1)",
					border: "1px solid var(--s4)",
					borderRadius: 16,
					width: "100%",
					maxWidth: 480,
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
					}}
				>
					<h2
						className="font-display"
						style={{ fontSize: 16, fontWeight: 700, color: "#f5f5f5" }}
					>
						{editId ? "Editar categoria" : "Nueva categoria"}
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
						className="grid gap-3"
						style={{ gridTemplateColumns: "1fr 1fr 80px" }}
					>
						<Field label="Nombre">
							<input
								className="input-base w-full"
								value={draft.name}
								onChange={(e) => onChange({ ...draft, name: e.target.value })}
								placeholder="Ej: Bebidas"
							/>
						</Field>
						<Field label="Icono (emoji)">
							<input
								className="input-base w-full"
								value={draft.icon}
								onChange={(e) => onChange({ ...draft, icon: e.target.value })}
								style={{ fontSize: 20 }}
							/>
						</Field>
						<Field label="Orden">
							<input
								className="input-base w-full"
								type="number"
								value={draft.order}
								onChange={(e) => onChange({ ...draft, order: e.target.value })}
							/>
						</Field>
					</div>
				</div>
				<div className="flex gap-2" style={{ padding: "0 20px 20px" }}>
					<button
						className="btn-ghost flex-1"
						style={{ padding: "10px" }}
						onClick={onCancel}
					>
						Cancelar
					</button>
					<button
						className="btn-primary flex-1"
						onClick={onSave}
						disabled={saving || !draft.name}
						style={{
							padding: "10px",
							opacity: saving || !draft.name ? 0.4 : 1,
						}}
					>
						{saving ? "Guardando..." : editId ? "Guardar" : "Crear categoria"}
					</button>
				</div>
			</div>
		</div>
	);
}

// --- Page -------------------------------------------------------------------

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

	// -- Product CRUD --------------------------------------------------------

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
		if (!confirm("Eliminar este producto?")) return;
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

	// -- Category CRUD -------------------------------------------------------

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
		if (!confirm("Eliminar esta categoria?")) return;
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
								Gestion de Menu
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								Productos y categorias
							</p>
						</div>
					</div>

					{/* Tabs */}
					<div
						className="flex items-center gap-1 p-1 rounded-xl"
						style={{ background: "var(--s2)", border: "1px solid var(--s3)" }}
					>
						{(["products", "categories"] as const).map((tab) => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								style={{
									padding: "7px 20px",
									borderRadius: 10,
									border:
										activeTab === tab
											? "1px solid rgba(245,158,11,0.3)"
											: "1px solid transparent",
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
								{tab === "products"
									? `Productos (${products.length})`
									: `Categorias (${categories.length})`}
							</button>
						))}
					</div>
				</div>
				<div className="divider-gold" style={{ marginBottom: 28 }} />

				{/* Products tab */}
				{activeTab === "products" && (
					<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
						{/* Section header */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<UtensilsCrossed size={14} style={{ color: "var(--gold)" }} />
								<span
									className="font-display uppercase"
									style={{
										fontSize: 11,
										letterSpacing: "0.15em",
										color: "#ccc",
										fontWeight: 600,
									}}
								>
									Productos
								</span>
								<span
									className="font-kds"
									style={{ fontSize: 14, color: "var(--gold)" }}
								>
									{filteredProducts.length}
								</span>
							</div>
							<button
								className="btn-primary"
								style={{ padding: "8px 16px" }}
								onClick={openNewProduct}
							>
								<Plus size={14} />
								Agregar
							</button>
						</div>

						{/* Category filter pills */}
						<div className="flex items-center gap-2 flex-wrap">
							{(["all", ...categories.map((c) => c.id)] as const).map((id) => {
								const isAll = id === "all";
								const cat = categories.find((c) => c.id === id);
								const isActive = catFilter === id;
								return (
									<button
										key={id}
										onClick={() => setCatFilter(id)}
										style={{
											padding: "5px 14px",
											borderRadius: 8,
											border: isActive
												? "1px solid rgba(245,158,11,0.3)"
												: "1px solid var(--s3)",
											background: isActive
												? "rgba(245,158,11,0.1)"
												: "transparent",
											color: isActive ? "#f59e0b" : "#555",
											fontFamily: "var(--font-syne)",
											fontWeight: 600,
											fontSize: 10,
											letterSpacing: "0.1em",
											textTransform: "uppercase",
											cursor: "pointer",
											transition: "all 0.15s",
										}}
									>
										{isAll ? "Todos" : `${cat?.icon ?? ""} ${cat?.name ?? ""}`}
									</button>
								);
							})}
						</div>

						{/* Products list */}
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
								className="flex items-center justify-between"
								style={{
									padding: "14px 20px",
									borderBottom: "1px solid var(--s3)",
									background: "var(--s2)",
								}}
							>
								<div className="flex items-center gap-2.5">
									<List size={14} style={{ color: "var(--gold)" }} />
									<span
										className="font-display uppercase"
										style={{
											fontSize: 11,
											letterSpacing: "0.15em",
											color: "#ccc",
											fontWeight: 600,
										}}
									>
										Listado
									</span>
								</div>
							</div>
							{filteredProducts.length === 0 ? (
								<div
									className="flex flex-col items-center justify-center"
									style={{ padding: "48px 20px" }}
								>
									<UtensilsCrossed
										size={32}
										style={{ color: "#333", marginBottom: 8 }}
									/>
									<span
										className="font-body"
										style={{ fontSize: 13, color: "#555" }}
									>
										No hay productos
									</span>
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
											transition: "background 0.15s",
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.background = "var(--s2)")
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.background = "transparent")
										}
									>
										{/* Available toggle */}
										<button
											onClick={() => toggleAvailable(p)}
											style={{
												width: 20,
												height: 20,
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
												transition: "all 0.15s",
											}}
											title={p.isAvailable ? "Marcar no disponible" : "Activar"}
										>
											{p.isAvailable && (
												<Check size={11} style={{ color: "#10b981" }} />
											)}
										</button>

										{/* Name + desc */}
										<div style={{ flex: 1, minWidth: 0 }}>
											<div
												className="font-body"
												style={{
													fontSize: 14,
													fontWeight: 500,
													color: "#f5f5f5",
													opacity: p.isAvailable ? 1 : 0.4,
												}}
											>
												{p.name}
												{p.isPoolChip && (
													<span
														className="font-display uppercase"
														style={{
															marginLeft: 8,
															fontSize: 9,
															padding: "2px 6px",
															borderRadius: 4,
															background: "rgba(139,92,246,0.15)",
															border: "1px solid rgba(139,92,246,0.3)",
															color: "#8b5cf6",
															letterSpacing: "0.1em",
														}}
													>
														FICHA
													</span>
												)}
											</div>
											{p.description && (
												<div
													className="font-body"
													style={{
														fontSize: 11,
														color: "#555",
														marginTop: 1,
													}}
												>
													{p.description}
												</div>
											)}
										</div>

										{/* Category badge */}
										<span
											className="font-display uppercase hidden md:block"
											style={{
												fontSize: 10,
												letterSpacing: "0.1em",
												color: "#666",
											}}
										>
											{getCategoryName(p.categoryId)}
										</span>

										{/* Target badge */}
										<span
											style={{
												fontSize: 9,
												padding: "3px 9px",
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
											className="font-kds"
											style={{
												fontSize: 16,
												color: "var(--gold)",
												minWidth: 80,
												textAlign: "right",
											}}
										>
											{formatCurrency(p.price)}
										</span>

										{/* Actions */}
										<div className="flex items-center gap-1">
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
									</div>
								))
							)}
						</div>
					</div>
				)}

				{/* Categories tab */}
				{activeTab === "categories" && (
					<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
						{/* Section header */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<LayoutGrid size={14} style={{ color: "var(--gold)" }} />
								<span
									className="font-display uppercase"
									style={{
										fontSize: 11,
										letterSpacing: "0.15em",
										color: "#ccc",
										fontWeight: 600,
									}}
								>
									Categorias
								</span>
								<span
									className="font-kds"
									style={{ fontSize: 14, color: "var(--gold)" }}
								>
									{categories.length}
								</span>
							</div>
							<button
								className="btn-primary"
								style={{ padding: "8px 16px" }}
								onClick={openNewCat}
							>
								<Plus size={14} />
								Agregar
							</button>
						</div>

						{categories.length === 0 ? (
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
									className="flex flex-col items-center justify-center"
									style={{ padding: "48px 20px" }}
								>
									<LayoutGrid
										size={32}
										style={{ color: "#333", marginBottom: 8 }}
									/>
									<span
										className="font-body"
										style={{ fontSize: 13, color: "#555" }}
									>
										No hay categorias
									</span>
								</div>
							</div>
						) : (
							<div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
								{categories
									.slice()
									.sort((a, b) => a.order - b.order)
									.map((c) => {
										const productCount = products.filter(
											(p) => p.categoryId === c.id,
										).length;
										return (
											<div
												key={c.id}
												style={{
													background: "var(--s1)",
													border: "1px solid var(--s4)",
													borderRadius: 16,
													padding: 16,
													display: "flex",
													alignItems: "center",
													gap: 16,
													transition: "border-color 0.15s",
													boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
												}}
												onMouseEnter={(e) =>
													(e.currentTarget.style.borderColor =
														"rgba(245,158,11,0.3)")
												}
												onMouseLeave={(e) =>
													(e.currentTarget.style.borderColor = "var(--s4)")
												}
											>
												{/* Icon circle */}
												<div
													style={{
														width: 48,
														height: 48,
														borderRadius: 14,
														background: "var(--s3)",
														border: "1px solid var(--s4)",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														flexShrink: 0,
														fontSize: 22,
													}}
												>
													{c.icon}
												</div>

												<div style={{ flex: 1, minWidth: 0 }}>
													<div
														className="font-body"
														style={{
															fontSize: 14,
															fontWeight: 600,
															color: "#f5f5f5",
														}}
													>
														{c.name}
													</div>
													<div className="flex items-center gap-2 mt-1">
														<span
															className="font-display uppercase"
															style={{
																fontSize: 9,
																letterSpacing: "0.1em",
																color: "var(--gold)",
															}}
														>
															{productCount} productos
														</span>
														<span
															className="font-display uppercase"
															style={{
																fontSize: 9,
																letterSpacing: "0.1em",
																color: "#555",
															}}
														>
															orden {c.order}
														</span>
													</div>
												</div>

												<div className="flex items-center gap-1">
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
											</div>
										);
									})}
							</div>
						)}
					</div>
				)}

				{/* Product form modal */}
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

				{/* Category form modal */}
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
			</div>
		</div>
	);
}
