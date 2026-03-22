"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, ChevronRight } from "lucide-react";
import { PRODUCTS, CATEGORIES, formatCurrency } from "@/data/mock";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ProductAvailability = Record<string, boolean>;

// ─── Target badge ─────────────────────────────────────────────────────────────

function TargetBadge({ target }: { target: string }) {
	if (target === "bar") {
		return (
			<span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20 font-display text-[10px] font-700 text-brand-500 uppercase tracking-wider">
				Bar
			</span>
		);
	}
	return (
		<span className="inline-flex items-center px-2 py-0.5 rounded-md bg-pool-500/10 border border-pool-500/20 font-display text-[10px] font-700 text-pool-500 uppercase tracking-wider">
			Cocina
		</span>
	);
}

// ─── CSS Toggle ───────────────────────────────────────────────────────────────

function AvailabilityToggle({
	on,
	onChange,
}: {
	on: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<button
			onClick={() => onChange(!on)}
			className={[
				"relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0",
				on ? "bg-pool-500" : "bg-surface-4",
			].join(" ")}
			aria-label={on ? "Disponible" : "No disponible"}
		>
			<span
				className={[
					"absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
					on ? "translate-x-[18px]" : "translate-x-0.5",
				].join(" ")}
			/>
		</button>
	);
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

function TopBar({
	search,
	onSearch,
}: {
	search: string;
	onSearch: (s: string) => void;
}) {
	return (
		<div className="flex items-center justify-between px-8 py-5 border-b border-surface-3 bg-surface-1/60 backdrop-blur-sm sticky top-0 z-10">
			<div>
				<h1 className="font-display text-xl font-700 text-ink-primary tracking-tight">
					Menú
				</h1>
				<p className="font-body text-xs text-ink-tertiary mt-0.5">
					{PRODUCTS.length} productos · {CATEGORIES.length} categorías
				</p>
			</div>

			<div className="flex items-center gap-3">
				<div className="relative">
					<Search
						size={13}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none"
					/>
					<input
						type="text"
						placeholder="Buscar producto..."
						value={search}
						onChange={(e) => onSearch(e.target.value)}
						className="input-base pl-8 py-2 text-xs w-[220px]"
					/>
				</div>
				<button className="btn-secondary py-2 px-4 text-xs">
					<Plus size={12} />
					Nueva categoría
				</button>
				<button className="btn-primary py-2 px-4 text-xs">
					<Plus size={12} />
					Nuevo producto
				</button>
			</div>
		</div>
	);
}

// ─── Products table ───────────────────────────────────────────────────────────

function ProductsTable({
	categoryId,
	search,
	availability,
	onToggle,
}: {
	categoryId: string | null;
	search: string;
	availability: ProductAvailability;
	onToggle: (id: string, v: boolean) => void;
}) {
	let filtered = PRODUCTS;

	if (search.trim()) {
		const q = search.toLowerCase();
		filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
	} else if (categoryId !== null) {
		filtered = filtered.filter((p) => p.categoryId === categoryId);
	}

	if (filtered.length === 0) {
		return (
			<div className="card p-12 text-center text-ink-tertiary font-body text-sm">
				Sin productos{search ? ` para "${search}"` : " en esta categoría"}.
			</div>
		);
	}

	return (
		<div className="card overflow-hidden">
			<table className="w-full">
				<thead>
					<tr className="border-b border-surface-3 bg-surface-2/40">
						{[
							"Producto",
							"Descripción",
							"Precio",
							"Destino",
							"Disponible",
							"",
						].map((h) => (
							<th
								key={h}
								className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest px-5 py-3 text-left last:text-right"
							>
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-surface-3">
					{filtered.map((p) => {
						const isOn = availability[p.id] ?? p.isAvailable;
						const cat = CATEGORIES.find((c) => c.id === p.categoryId);
						const isPoolChip = p.isPoolChip;

						return (
							<tr
								key={p.id}
								className={[
									"hover:bg-surface-2/50 transition-colors group",
									isPoolChip ? "border-l-2 border-l-brand-500/40" : "",
								].join(" ")}
							>
								{/* Name */}
								<td className="px-5 py-3.5">
									<div className="flex items-center gap-3">
										<div
											className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
											style={{
												background: `${cat?.color}18`,
												border: `1px solid ${cat?.color}30`,
											}}
										>
											{cat?.icon}
										</div>
										<div>
											<div className="font-display text-sm font-600 text-ink-primary leading-tight">
												{p.name}
											</div>
											{isPoolChip && (
												<span className="pool-chip-badge font-display text-[9px] font-700 uppercase tracking-wider block mt-0.5">
													POOL CHIP
												</span>
											)}
										</div>
									</div>
								</td>

								{/* Description */}
								<td className="px-5 py-3.5 max-w-[200px]">
									<span className="font-body text-xs text-ink-tertiary truncate block">
										{p.description}
									</span>
								</td>

								{/* Price */}
								<td className="px-5 py-3.5">
									<span
										className={[
											"font-kds text-xl leading-none",
											isPoolChip ? "text-brand-500" : "text-ink-primary",
										].join(" ")}
									>
										{formatCurrency(p.price)}
									</span>
								</td>

								{/* Target */}
								<td className="px-5 py-3.5">
									<TargetBadge target={p.target} />
								</td>

								{/* Toggle */}
								<td className="px-5 py-3.5">
									<AvailabilityToggle
										on={isOn}
										onChange={(v) => onToggle(p.id, v)}
									/>
								</td>

								{/* Actions */}
								<td className="px-5 py-3.5 text-right">
									<div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button className="btn-ghost p-1.5" title="Editar">
											<Edit2 size={13} />
										</button>
										<button
											className="btn-ghost p-1.5 hover:text-status-cancelled hover:bg-status-cancelled/10"
											title="Eliminar"
										>
											<Trash2 size={13} />
										</button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>

			<div className="px-5 py-3 border-t border-surface-3 bg-surface-2/20 flex items-center justify-between">
				<span className="font-body text-[10px] text-ink-tertiary">
					{filtered.length} producto{filtered.length !== 1 ? "s" : ""}
				</span>
			</div>
		</div>
	);
}

// ─── Category manager ─────────────────────────────────────────────────────────

function CategoryManager() {
	return (
		<div className="card p-6">
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Categorías del menú
					</h3>
					<p className="font-body text-xs text-ink-tertiary mt-0.5">
						Gestión de categorías
					</p>
				</div>
				<button className="btn-secondary py-2 px-4 text-xs">
					<Plus size={12} />
					Nueva
				</button>
			</div>

			<div className="grid grid-cols-4 gap-3">
				{CATEGORIES.map((cat) => {
					const count = PRODUCTS.filter((p) => p.categoryId === cat.id).length;
					return (
						<div
							key={cat.id}
							className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-2 border border-surface-3 hover:border-surface-4 transition-all cursor-pointer group"
						>
							<div
								className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
								style={{
									background: `${cat.color}15`,
									border: `1px solid ${cat.color}25`,
								}}
							>
								{cat.icon}
							</div>
							<div className="flex-1 min-w-0">
								<div className="font-display text-xs font-700 text-ink-primary">
									{cat.name}
								</div>
								<div className="font-body text-[10px] text-ink-tertiary">
									{count} producto{count !== 1 ? "s" : ""}
								</div>
							</div>
							<ChevronRight
								size={13}
								className="text-ink-tertiary group-hover:text-ink-secondary transition-colors flex-shrink-0"
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage() {
	const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [availability, setAvailability] = useState<ProductAvailability>({});

	const handleToggle = (id: string, v: boolean) => {
		setAvailability((prev) => ({ ...prev, [id]: v }));
	};

	return (
		<div className="flex flex-col min-h-screen">
			<TopBar search={search} onSearch={setSearch} />

			<div className="flex-1 px-8 py-6 space-y-5 animate-fade-in">
				{/* Category tabs — only show when not searching */}
				{!search.trim() && (
					<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
						<button
							onClick={() => setActiveCategoryId(null)}
							className={[
								"flex items-center gap-2 px-4 py-2 rounded-xl font-display text-xs font-600 transition-all whitespace-nowrap flex-shrink-0 border",
								activeCategoryId === null
									? "bg-brand-500 text-surface-0 border-brand-500 shadow-gold-sm"
									: "bg-surface-2 border-surface-3 text-ink-tertiary hover:text-ink-primary hover:border-surface-4",
							].join(" ")}
						>
							Todos
							<span
								className={[
									"font-kds text-sm leading-none",
									activeCategoryId === null
										? "text-surface-0/70"
										: "text-ink-tertiary",
								].join(" ")}
							>
								{PRODUCTS.length}
							</span>
						</button>

						{CATEGORIES.map((cat) => {
							const count = PRODUCTS.filter(
								(p) => p.categoryId === cat.id,
							).length;
							const isActive = activeCategoryId === cat.id;
							return (
								<button
									key={cat.id}
									onClick={() => setActiveCategoryId(cat.id)}
									className={[
										"flex items-center gap-2 px-4 py-2 rounded-xl font-display text-xs font-600 transition-all whitespace-nowrap flex-shrink-0 border",
										isActive
											? "text-surface-0 border-transparent"
											: "bg-surface-2 text-ink-tertiary hover:text-ink-primary border-surface-3 hover:border-surface-4",
									].join(" ")}
									style={
										isActive
											? {
													background: cat.color,
													borderColor: "transparent",
													boxShadow: `0 0 16px ${cat.color}40`,
												}
											: {}
									}
								>
									<span>{cat.icon}</span>
									{cat.name}
									<span
										className={[
											"font-kds text-sm leading-none",
											isActive ? "text-white/70" : "text-ink-tertiary",
										].join(" ")}
									>
										{count}
									</span>
								</button>
							);
						})}
					</div>
				)}

				{/* Products table */}
				<ProductsTable
					categoryId={activeCategoryId}
					search={search}
					availability={availability}
					onToggle={handleToggle}
				/>

				{/* Category manager */}
				<CategoryManager />
			</div>
		</div>
	);
}
