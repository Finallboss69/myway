"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import {
	AlertTriangle,
	CheckCircle2,
	Package,
	TrendingDown,
	DollarSign,
	Search,
	Plus,
	RefreshCw,
	ChevronRight,
	FlaskConical,
	Zap,
	ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ingredient {
	id: string;
	name: string;
	unit: string;
	stockCurrent: number;
	alertThreshold: number;
	costPerUnit: number;
}

type IngStatus = "ok" | "low" | "critical";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(ing: Ingredient): IngStatus {
	if (ing.stockCurrent <= ing.alertThreshold * 0.6) return "critical";
	if (ing.stockCurrent <= ing.alertThreshold) return "low";
	return "ok";
}

function stockPct(ing: Ingredient): number {
	const max = Math.max(ing.alertThreshold * 3, ing.stockCurrent);
	return Math.round((ing.stockCurrent / max) * 100);
}

function formatUnit(value: number, unit: string): string {
	if (unit === "ml")
		return value >= 1000 ? `${(value / 1000).toFixed(1)} L` : `${value} ml`;
	if (unit === "gr")
		return value >= 1000 ? `${(value / 1000).toFixed(2)} kg` : `${value} gr`;
	if (unit === "units") return `${value} u.`;
	return `${value} ${unit}`;
}

// ─── Bar sidebar nav ──────────────────────────────────────────────────────────

function BarNav() {
	return (
		<aside className="w-56 shrink-0 flex flex-col gap-1 py-6 px-3 bg-surface-1 border-r border-surface-3 min-h-screen sticky top-0 self-start h-screen overflow-y-auto">
			<div className="flex items-center gap-2.5 px-3 mb-6">
				<div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-lg leading-none">
					🍸
				</div>
				<div>
					<p className="font-display text-xs font-bold uppercase tracking-widest text-brand-500">
						Bar
					</p>
					<p className="font-body text-xs text-ink-tertiary">My Way</p>
				</div>
			</div>

			<Link
				href="/bar"
				className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-semibold transition-all text-ink-secondary hover:bg-surface-2 hover:text-ink-primary"
			>
				<Zap className="w-4 h-4" />
				Pedidos
				<ChevronRight className="w-3 h-3 ml-auto opacity-40" />
			</Link>
			<Link
				href="/bar/stock"
				className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-semibold transition-all bg-brand-500/10 text-brand-500 border border-brand-500/20"
			>
				<Package className="w-4 h-4" />
				Stock
				<ArrowRight className="w-3 h-3 ml-auto" />
			</Link>

			<div className="mt-auto pt-6 px-3 border-t border-surface-3">
				<Link
					href="/"
					className="flex items-center gap-2 text-xs text-ink-tertiary hover:text-ink-secondary transition-colors font-display uppercase tracking-widest"
				>
					← Todas las apps
				</Link>
			</div>
		</aside>
	);
}

// ─── Status chip ──────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: IngStatus }) {
	const config = {
		ok: { label: "OK", cls: "badge-ready", icon: <CheckCircle2 size={11} /> },
		low: {
			label: "BAJO",
			cls: "badge-pending",
			icon: <TrendingDown size={11} />,
		},
		critical: {
			label: "CRÍTICO",
			cls: "badge-cancelled",
			icon: <AlertTriangle size={11} />,
		},
	}[status];
	return (
		<span className={clsx("badge", config.cls)}>
			{config.icon}
			{config.label}
		</span>
	);
}

// ─── Stock bar ────────────────────────────────────────────────────────────────

function StockBar({ pct, status }: { pct: number; status: IngStatus }) {
	const fill = {
		ok: "bg-emerald-500",
		low: "bg-amber-500",
		critical: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]",
	}[status];
	return (
		<div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden">
			<div
				className={clsx(
					"h-full rounded-full transition-all duration-500",
					fill,
				)}
				style={{ width: `${Math.min(pct, 100)}%` }}
			/>
		</div>
	);
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
	icon,
	label,
	value,
	sub,
	accent,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	sub?: string;
	accent?: "gold" | "red" | "green";
}) {
	const valueColor =
		{
			gold: "text-brand-500",
			red: "text-red-400",
			green: "text-emerald-400",
		}[accent ?? "gold"] ?? "text-ink-primary";

	return (
		<div className="card-sm p-4 flex flex-col gap-2.5">
			<div className="flex items-center justify-between">
				<span className="font-display text-[10px] uppercase tracking-widest text-ink-tertiary">
					{label}
				</span>
				<div className="w-8 h-8 rounded-lg bg-surface-2 border border-surface-3 flex items-center justify-center text-ink-secondary">
					{icon}
				</div>
			</div>
			<div>
				<span className={clsx("font-kds text-4xl leading-none", valueColor)}>
					{value}
				</span>
				{sub && (
					<div className="text-ink-tertiary font-body text-xs mt-1">{sub}</div>
				)}
			</div>
		</div>
	);
}

// ─── Adjust modal ─────────────────────────────────────────────────────────────

function AdjustModal({
	ingredient,
	onClose,
	onSave,
}: {
	ingredient: Ingredient;
	onClose: () => void;
	onSave: (id: string, stockCurrent: number) => Promise<void>;
}) {
	const [value, setValue] = useState(String(ingredient.stockCurrent));
	const [saving, setSaving] = useState(false);

	async function handleSave() {
		const num = Number(value);
		if (isNaN(num) || num < 0) return;
		setSaving(true);
		await onSave(ingredient.id, num);
		setSaving(false);
		onClose();
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
			style={{ background: "rgba(8,8,8,0.85)", backdropFilter: "blur(8px)" }}
			onClick={onClose}
		>
			<div
				className="card p-6 w-80 flex flex-col gap-4 animate-slide-up"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between">
					<h3 className="font-display font-bold text-ink-primary text-sm uppercase tracking-wider">
						Ajustar Stock
					</h3>
					<button
						onClick={onClose}
						className="text-ink-tertiary hover:text-ink-primary text-lg leading-none"
					>
						×
					</button>
				</div>
				<div>
					<p className="font-body text-sm text-ink-secondary mb-1">
						{ingredient.name}
					</p>
					<p className="font-body text-xs text-ink-tertiary">
						Unidad: {ingredient.unit}
					</p>
				</div>
				<div>
					<label className="font-display text-[10px] uppercase tracking-widest text-ink-tertiary mb-1.5 block">
						Stock actual
					</label>
					<input
						type="number"
						className="input-base w-full text-sm"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						min={0}
					/>
				</div>
				<div className="flex gap-2">
					<button
						onClick={onClose}
						className="btn-ghost flex-1 justify-center text-xs py-2.5"
					>
						Cancelar
					</button>
					<button
						onClick={handleSave}
						disabled={saving}
						className="btn-primary flex-1 justify-center text-xs py-2.5"
					>
						{saving ? "Guardando..." : "Guardar"}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BarStockPage() {
	const [ingredients, setIngredients] = useState<Ingredient[]>([]);
	const [query, setQuery] = useState("");
	const [adjusting, setAdjusting] = useState<Ingredient | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		const load = () =>
			fetch("/api/ingredients")
				.then((r) => r.json())
				.then((data: Ingredient[]) => {
					if (active) {
						setIngredients(data);
						setLoading(false);
					}
				})
				.catch(() => {
					if (active) setLoading(false);
				});
		load();
		const id = setInterval(load, 30000);
		return () => {
			active = false;
			clearInterval(id);
		};
	}, []);

	const filteredIngredients = query.trim()
		? ingredients.filter((i) =>
				i.name.toLowerCase().includes(query.toLowerCase()),
			)
		: ingredients;

	const criticalIngredients = ingredients.filter(
		(i) => getStatus(i) === "critical",
	);
	const lowIngredients = ingredients.filter((i) => getStatus(i) === "low");
	const okIngredients = ingredients.filter((i) => getStatus(i) === "ok");

	const totalValue = ingredients.reduce(
		(sum, ing) => sum + ing.stockCurrent * ing.costPerUnit,
		0,
	);

	async function handleAdjust(id: string, stockCurrent: number) {
		const res = await fetch(`/api/ingredients/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ stockCurrent }),
		});
		if (res.ok) {
			const updated: Ingredient = await res.json();
			setIngredients((prev) =>
				prev.map((ing) =>
					ing.id === id ? { ...ing, stockCurrent: updated.stockCurrent } : ing,
				),
			);
		}
	}

	return (
		<div className="flex min-h-screen bg-surface-0">
			<BarNav />

			<div className="flex-1 flex flex-col min-w-0">
				{/* ── Page header ── */}
				<div className="sticky top-0 z-20 flex items-center justify-between px-8 py-5 border-b border-surface-3 bg-surface-1/95 backdrop-blur-md">
					<div>
						<div className="flex items-center gap-2.5 mb-0.5">
							<div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-lg leading-none">
								🍶
							</div>
							<h1 className="font-display text-xl font-bold text-ink-primary uppercase tracking-wide">
								Stock del Bar
							</h1>
						</div>
						<p className="font-body text-sm text-ink-tertiary ml-11">
							Ingredientes y disponibilidad ·{" "}
							{criticalIngredients.length > 0 ? (
								<span className="text-red-400 font-semibold">
									{criticalIngredients.length} críticos
								</span>
							) : (
								<span className="text-emerald-400">Todo en orden</span>
							)}
						</p>
					</div>

					<div className="flex items-center gap-3">
						<div className="relative hidden sm:block">
							<Search
								size={14}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
							/>
							<input
								type="text"
								placeholder="Buscar ingrediente..."
								className="input-base pl-9 w-56 text-sm"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</div>
						<button className="btn-primary text-xs px-4 py-2.5">
							<Plus size={14} />
							Nuevo ítem
						</button>
					</div>
				</div>

				<div className="flex-1 p-8 space-y-6">
					{/* ── Critical alert ── */}
					{criticalIngredients.length > 0 && (
						<div
							className="rounded-2xl p-4 flex items-start gap-4"
							style={{
								background: "rgba(239,68,68,0.07)",
								border: "1px solid rgba(239,68,68,0.22)",
							}}
						>
							<div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
								<AlertTriangle size={18} className="text-red-400" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-display font-bold text-red-400 text-sm uppercase tracking-wider">
									⚠ Ingredientes críticos — requieren reposición inmediata
								</p>
								<div className="mt-2 flex flex-wrap gap-2">
									{criticalIngredients.map((ing) => (
										<span
											key={ing.id}
											className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-body"
											style={{
												background: "rgba(239,68,68,0.09)",
												border: "1px solid rgba(239,68,68,0.18)",
											}}
										>
											<span className="text-red-300 font-semibold">
												{ing.name}
											</span>
											<span className="text-ink-tertiary text-xs">
												{formatUnit(ing.stockCurrent, ing.unit)} actual
											</span>
											<span className="text-red-500 text-xs font-mono">
												/ {formatUnit(ing.alertThreshold, ing.unit)} mín.
											</span>
										</span>
									))}
								</div>
							</div>
						</div>
					)}

					{/* ── Low stock notice ── */}
					{lowIngredients.length > 0 && (
						<div
							className="rounded-2xl px-4 py-3 flex items-center gap-3"
							style={{
								background: "rgba(245,158,11,0.06)",
								border: "1px solid rgba(245,158,11,0.18)",
							}}
						>
							<TrendingDown size={15} className="text-amber-400 shrink-0" />
							<span className="text-amber-300 font-body text-sm">
								<span className="font-display font-bold">
									{lowIngredients.length}{" "}
									{lowIngredients.length === 1
										? "ingrediente bajo"
										: "ingredientes bajos"}
									:
								</span>{" "}
								{lowIngredients.map((i) => i.name).join(", ")}
							</span>
						</div>
					)}

					{/* ── Stats row ── */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<StatCard
							icon={<Package size={15} />}
							label="Total ítems"
							value={loading ? "…" : String(ingredients.length)}
							sub="ingredientes activos"
							accent="gold"
						/>
						<StatCard
							icon={<AlertTriangle size={15} />}
							label="Críticos"
							value={String(criticalIngredients.length)}
							sub="bajo umbral mínimo"
							accent="red"
						/>
						<StatCard
							icon={<TrendingDown size={15} />}
							label="Stock bajo"
							value={String(lowIngredients.length)}
							sub="cerca del umbral"
							accent="gold"
						/>
						<StatCard
							icon={<DollarSign size={15} />}
							label="Valor estimado"
							value={formatCurrency(Math.round(totalValue))}
							sub="inventario actual"
							accent="green"
						/>
					</div>

					{/* ── Ingredients table ── */}
					<div className="card rounded-2xl overflow-hidden">
						<div className="px-5 py-4 border-b border-surface-3 flex items-center justify-between bg-surface-2/20">
							<div className="flex items-center gap-2">
								<FlaskConical size={15} className="text-brand-500" />
								<h2 className="font-display font-bold text-sm uppercase tracking-wider text-ink-primary">
									Inventario de Ingredientes
								</h2>
							</div>
							<div className="flex items-center gap-3">
								<span className="text-ink-tertiary font-body text-xs">
									{filteredIngredients.length} registros
								</span>
								<button
									className="btn-ghost text-xs flex items-center gap-1.5 py-1"
									onClick={() => {
										setLoading(true);
										fetch("/api/ingredients")
											.then((r) => r.json())
											.then((data: Ingredient[]) => {
												setIngredients(data);
												setLoading(false);
											});
									}}
								>
									<RefreshCw size={11} />
									Actualizar
								</button>
							</div>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-surface-3 bg-surface-2/20">
										<th className="text-left px-5 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-ink-tertiary">
											Ingrediente
										</th>
										<th className="text-left px-4 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-ink-tertiary w-52">
											Stock
										</th>
										<th className="text-right px-4 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-ink-tertiary">
											Alerta
										</th>
										<th className="text-center px-4 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-ink-tertiary">
											Estado
										</th>
										<th className="text-right px-4 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-ink-tertiary hidden lg:table-cell">
											Costo/u
										</th>
										<th className="text-right px-5 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-ink-tertiary">
											Acciones
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredIngredients.map((ing, idx) => {
										const status = getStatus(ing);
										const pct = stockPct(ing);
										const isLast = idx === filteredIngredients.length - 1;
										return (
											<tr
												key={ing.id}
												className={clsx(
													"group transition-colors duration-100 hover:bg-surface-2/50",
													!isLast && "border-b border-surface-3/60",
													status === "critical" && "bg-red-500/[0.03]",
													status === "low" && "bg-amber-500/[0.03]",
												)}
											>
												{/* Name */}
												<td className="px-5 py-3.5">
													<div className="flex items-center gap-2.5">
														{status === "critical" && (
															<AlertTriangle
																size={13}
																className="text-red-400 shrink-0"
															/>
														)}
														{status === "low" && (
															<TrendingDown
																size={13}
																className="text-amber-400 shrink-0"
															/>
														)}
														{status === "ok" && (
															<CheckCircle2
																size={13}
																className="text-emerald-400/40 shrink-0"
															/>
														)}
														<span className="font-body text-sm text-ink-primary">
															{ing.name}
														</span>
													</div>
												</td>
												{/* Stock bar */}
												<td className="px-4 py-3.5">
													<div className="flex flex-col gap-1.5 w-44">
														<div className="flex items-baseline justify-between">
															<span
																className={clsx(
																	"font-mono font-bold text-sm",
																	status === "critical"
																		? "text-red-400"
																		: status === "low"
																			? "text-amber-400"
																			: "text-ink-primary",
																)}
															>
																{ing.stockCurrent.toLocaleString("es-AR")}
															</span>
															<span className="text-ink-tertiary text-xs font-body">
																{ing.unit}
															</span>
														</div>
														<StockBar pct={pct} status={status} />
													</div>
												</td>
												{/* Threshold */}
												<td className="px-4 py-3.5 text-right">
													<span className="font-mono text-xs text-ink-tertiary">
														{ing.alertThreshold.toLocaleString("es-AR")}{" "}
														{ing.unit}
													</span>
												</td>
												{/* Status */}
												<td className="px-4 py-3.5 text-center">
													<StatusChip status={status} />
												</td>
												{/* Cost */}
												<td className="px-4 py-3.5 text-right hidden lg:table-cell">
													<span className="font-mono text-xs text-ink-secondary">
														$
														{ing.costPerUnit.toLocaleString("es-AR", {
															minimumFractionDigits: 3,
														})}
													</span>
													<span className="text-ink-tertiary text-[10px] block">
														/{ing.unit}
													</span>
												</td>
												{/* Actions */}
												<td className="px-5 py-3.5">
													<div className="flex items-center justify-end gap-2">
														<button
															className="btn-ghost text-[11px] px-2.5 py-1.5 rounded-lg"
															onClick={() => setAdjusting(ing)}
														>
															<RefreshCw size={11} />
															Ajustar
														</button>
													</div>
												</td>
											</tr>
										);
									})}
									{filteredIngredients.length === 0 && (
										<tr>
											<td colSpan={6} className="px-5 py-10 text-center">
												<p className="font-body text-sm text-ink-tertiary">
													{loading
														? "Cargando..."
														: `No se encontraron ingredientes para "${query}"`}
												</p>
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* ── Critical restock cards ── */}
					{criticalIngredients.length > 0 && (
						<div
							className="rounded-2xl overflow-hidden"
							style={{
								border: "1px solid rgba(239,68,68,0.18)",
								background: "rgba(239,68,68,0.02)",
							}}
						>
							<div
								className="px-5 py-4 border-b flex items-center justify-between"
								style={{
									borderColor: "rgba(239,68,68,0.15)",
									background: "rgba(239,68,68,0.05)",
								}}
							>
								<div className="flex items-center gap-2.5">
									<div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
										<AlertTriangle size={14} className="text-red-400" />
									</div>
									<div>
										<h2 className="font-display text-sm font-bold uppercase tracking-wider text-red-400">
											Reabastecer urgente
										</h2>
										<p className="font-body text-xs text-ink-tertiary">
											{criticalIngredients.length} ítem
											{criticalIngredients.length !== 1 ? "s" : ""} bajo el
											mínimo
										</p>
									</div>
								</div>
								<span className="font-kds text-4xl text-red-400 leading-none">
									{criticalIngredients.length}
								</span>
							</div>
							<div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{criticalIngredients.map((ing) => {
									const pct = stockPct(ing);
									const deficit = ing.alertThreshold - ing.stockCurrent;
									return (
										<div
											key={ing.id}
											className="flex flex-col gap-3 p-4 rounded-xl"
											style={{
												background: "rgba(239,68,68,0.05)",
												border: "1px solid rgba(239,68,68,0.15)",
											}}
										>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-display text-sm font-bold text-ink-primary">
														{ing.name}
													</p>
													<p className="font-body text-xs text-ink-tertiary uppercase tracking-wide">
														{ing.unit}
													</p>
												</div>
												<span className="badge badge-cancelled">
													<span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
													Crítico
												</span>
											</div>
											<div className="space-y-1.5">
												<div className="flex items-baseline justify-between">
													<span className="text-xs text-ink-tertiary">
														Actual
													</span>
													<span className="font-kds text-2xl text-red-400 leading-none">
														{formatUnit(ing.stockCurrent, ing.unit)}
													</span>
												</div>
												<StockBar pct={pct} status="critical" />
											</div>
											<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/15">
												<span className="font-display text-xs text-red-300/70 uppercase tracking-wide">
													Déficit
												</span>
												<span className="font-kds text-xl text-red-300">
													{formatUnit(deficit, ing.unit)}
												</span>
											</div>
											<button
												className="btn-primary w-full justify-center text-xs py-2"
												onClick={() => setAdjusting(ing)}
											>
												<Plus size={13} />
												Reabastecer
											</button>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* ── Footer ── */}
					<div className="flex items-center justify-between text-ink-tertiary text-xs font-body pb-4">
						<div className="flex items-center gap-1.5">
							<RefreshCw size={11} />
							<span>Última sincronización: hoy · Sistema My Way</span>
						</div>
						<button className="btn-ghost text-xs px-3 py-1.5">
							<ChevronRight size={12} />
							Ver historial completo
						</button>
					</div>
				</div>
			</div>

			{/* ── Adjust modal ── */}
			{adjusting && (
				<AdjustModal
					ingredient={adjusting}
					onClose={() => setAdjusting(null)}
					onSave={handleAdjust}
				/>
			)}
		</div>
	);
}
