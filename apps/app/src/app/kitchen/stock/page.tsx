"use client";

import { useState, useEffect } from "react";
import {
	AlertTriangle,
	CheckCircle2,
	Package,
	Search,
	Plus,
	RefreshCw,
	TrendingDown,
	ChefHat,
	ArrowRight,
	Sliders,
	UtensilsCrossed,
	ChevronRight,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ingredient {
	id: string;
	name: string;
	unit: string;
	stockCurrent: number;
	alertThreshold: number;
	costPerUnit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_MULTIPLIER = 4;

function stockPct(ing: Ingredient): number {
	const max = ing.alertThreshold * MAX_MULTIPLIER;
	return Math.min(100, Math.round((ing.stockCurrent / max) * 100));
}

function isCritical(ing: Ingredient): boolean {
	return ing.stockCurrent < ing.alertThreshold;
}

function isLow(ing: Ingredient): boolean {
	return !isCritical(ing) && ing.stockCurrent < ing.alertThreshold * 1.5;
}

function formatUnit(value: number, unit: string): string {
	if (unit === "ml") {
		return value >= 1000 ? `${(value / 1000).toFixed(1)} L` : `${value} ml`;
	}
	if (unit === "gr") {
		return value >= 1000 ? `${(value / 1000).toFixed(2)} kg` : `${value} gr`;
	}
	if (unit === "units") {
		return `${value} u.`;
	}
	return `${value} ${unit}`;
}

// ─── Kitchen nav — responsive: sidebar on desktop, top bar on mobile ──────────

function KitchenNav() {
	return (
		<>
			{/* Desktop sidebar */}
			<aside className="hidden lg:flex w-56 shrink-0 flex-col gap-1 py-6 px-3 bg-surface-1 border-r border-surface-3 min-h-screen sticky top-0 self-start h-screen overflow-y-auto">
				{/* Logo */}
				<div className="flex items-center gap-2.5 px-3 mb-6">
					<div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
						<ChefHat className="w-4 h-4 text-brand-500" />
					</div>
					<div>
						<p className="font-display text-xs font-bold uppercase tracking-widest text-brand-500">
							Cocina
						</p>
						<p className="font-body text-xs text-ink-tertiary">My Way</p>
					</div>
				</div>

				{/* Nav links */}
				<Link
					href="/kitchen"
					className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-semibold transition-all text-ink-secondary hover:bg-surface-2 hover:text-ink-primary"
				>
					<UtensilsCrossed className="w-4 h-4" />
					KDS — Pedidos
					<ChevronRight className="w-3 h-3 ml-auto opacity-40" />
				</Link>
				<Link
					href="/kitchen/stock"
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

			{/* Mobile top nav bar */}
			<nav className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-surface-1/95 backdrop-blur-md border-b border-surface-3">
				<div className="flex items-center gap-2 mr-auto">
					<div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
						<ChefHat className="w-4 h-4 text-brand-500" />
					</div>
					<span className="font-display text-xs font-bold uppercase tracking-widest text-brand-500">
						Cocina
					</span>
				</div>
				<Link
					href="/kitchen"
					className="flex items-center gap-2 px-3 min-h-[40px] rounded-xl text-xs font-display font-semibold text-ink-secondary bg-surface-2 border border-surface-3"
				>
					<UtensilsCrossed className="w-3.5 h-3.5" />
					Pedidos
				</Link>
				<Link
					href="/kitchen/stock"
					className="flex items-center gap-2 px-3 min-h-[40px] rounded-xl text-xs font-display font-semibold bg-brand-500/10 text-brand-500 border border-brand-500/20"
				>
					<Package className="w-3.5 h-3.5" />
					Stock
				</Link>
			</nav>
		</>
	);
}

// ─── Stock progress bar ───────────────────────────────────────────────────────

function StockBar({
	pct,
	critical,
	low,
}: {
	pct: number;
	critical: boolean;
	low: boolean;
}) {
	const barColor = critical
		? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
		: low
			? "bg-amber-500"
			: "bg-emerald-500";
	return (
		<div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden">
			<div
				className={`h-full rounded-full transition-all duration-500 ${barColor}`}
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}

// ─── Ingredient card (replaces table row on mobile) ───────────────────────────

function IngredientCard({
	ingredient,
	onAdjust,
}: {
	ingredient: Ingredient;
	onAdjust: (ing: Ingredient) => void;
}) {
	const critical = isCritical(ingredient);
	const low = isLow(ingredient);
	const pct = stockPct(ingredient);

	return (
		<div
			className={clsx(
				"flex flex-col gap-3 p-4 rounded-2xl border transition-colors",
				critical
					? "bg-red-500/[0.04] border-red-500/25 hover:bg-red-500/[0.07]"
					: low
						? "bg-amber-500/[0.03] border-amber-500/20 hover:bg-amber-500/[0.06]"
						: "bg-surface-1 border-surface-3 hover:bg-surface-2/50",
			)}
		>
			{/* Header: name + status badge */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2.5 min-w-0">
					<div
						className={clsx(
							"w-2.5 h-2.5 rounded-full shrink-0 mt-0.5",
							critical
								? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)] animate-pulse"
								: low
									? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
									: "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.4)]",
						)}
					/>
					<span className="font-display text-sm font-bold text-ink-primary truncate">
						{ingredient.name}
					</span>
				</div>
				{critical ? (
					<span className="badge badge-cancelled shrink-0">
						<span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
						Crítico
					</span>
				) : low ? (
					<span className="badge badge-pending shrink-0">
						<TrendingDown className="w-2.5 h-2.5" />
						Bajo
					</span>
				) : (
					<span className="badge badge-ready shrink-0">
						<CheckCircle2 className="w-2.5 h-2.5" />
						OK
					</span>
				)}
			</div>

			{/* Stock value + bar */}
			<div className="flex flex-col gap-1.5">
				<div className="flex items-baseline justify-between">
					<span
						className={clsx(
							"font-mono text-sm font-bold",
							critical
								? "text-red-400"
								: low
									? "text-amber-400"
									: "text-ink-primary",
						)}
					>
						{formatUnit(ingredient.stockCurrent, ingredient.unit)}
					</span>
					<span className="font-body text-xs text-ink-tertiary">
						Umbral: {formatUnit(ingredient.alertThreshold, ingredient.unit)}
					</span>
				</div>
				<StockBar pct={pct} critical={critical} low={low} />
				<div className="flex items-center justify-between">
					<span
						className={clsx(
							"font-kds text-xl leading-none",
							pct <= 25
								? "text-red-400"
								: pct <= 50
									? "text-amber-400"
									: "text-emerald-400",
						)}
					>
						{pct}
						<span className="text-xs font-body text-ink-tertiary ml-0.5">
							%
						</span>
					</span>
					<span className="font-body text-xs text-ink-tertiary">
						{ingredient.unit}
					</span>
				</div>
			</div>

			{/* Action */}
			<button
				className="flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-surface-3 bg-surface-2 text-ink-secondary text-xs font-display font-bold uppercase tracking-wide hover:text-brand-500 hover:border-brand-500/30 transition-all active:scale-95"
				onClick={() => onAdjust(ingredient)}
			>
				<Sliders className="w-3.5 h-3.5" />
				Ajustar Stock
			</button>
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
			className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in px-4"
			style={{ background: "rgba(8,8,8,0.85)", backdropFilter: "blur(8px)" }}
			onClick={onClose}
		>
			<div
				className="card p-6 w-full max-w-sm flex flex-col gap-4 animate-slide-up"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between">
					<h3 className="font-display font-bold text-ink-primary text-sm uppercase tracking-wider">
						Ajustar Stock
					</h3>
					<button
						onClick={onClose}
						className="text-ink-tertiary hover:text-ink-primary text-lg leading-none min-w-[32px] min-h-[32px] flex items-center justify-center"
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
						className="btn-ghost flex-1 justify-center text-xs min-h-[44px]"
					>
						Cancelar
					</button>
					<button
						onClick={handleSave}
						disabled={saving}
						className="btn-primary flex-1 justify-center text-xs min-h-[44px]"
					>
						{saving ? "Guardando..." : "Guardar"}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Critical expanded card ───────────────────────────────────────────────────

function CriticalCard({
	ingredient,
	onAdjust,
}: {
	ingredient: Ingredient;
	onAdjust: (ing: Ingredient) => void;
}) {
	const pct = stockPct(ingredient);
	const deficit = ingredient.alertThreshold - ingredient.stockCurrent;

	return (
		<div className="p-5 flex flex-col gap-4 bg-red-500/[0.04] hover:bg-red-500/[0.07] transition-colors rounded-xl border border-red-500/20">
			<div className="flex items-start justify-between">
				<div>
					<p className="font-display text-base font-bold text-ink-primary">
						{ingredient.name}
					</p>
					<p className="font-body text-xs text-ink-tertiary mt-0.5 uppercase tracking-wide">
						{ingredient.unit}
					</p>
				</div>
				<span className="badge badge-cancelled">
					<span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
					Crítico
				</span>
			</div>

			<div className="space-y-2">
				<div className="flex justify-between items-baseline">
					<span className="font-body text-xs text-ink-tertiary">
						Stock actual
					</span>
					<span className="font-kds text-3xl leading-none text-red-400">
						{formatUnit(ingredient.stockCurrent, ingredient.unit)}
					</span>
				</div>
				<StockBar pct={pct} critical={true} low={false} />
				<div className="flex justify-between text-xs">
					<span className="font-body text-ink-tertiary">0</span>
					<span className="font-body text-red-400/70">
						Umbral: {formatUnit(ingredient.alertThreshold, ingredient.unit)}
					</span>
					<span className="font-body text-ink-tertiary">
						{formatUnit(
							ingredient.alertThreshold * MAX_MULTIPLIER,
							ingredient.unit,
						)}
					</span>
				</div>
			</div>

			<div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
				<span className="font-display text-xs font-semibold text-red-300/70 uppercase tracking-wide">
					Déficit
				</span>
				<span className="font-kds text-2xl text-red-300">
					{formatUnit(deficit, ingredient.unit)}
				</span>
			</div>

			<button
				className="btn-primary w-full justify-center text-xs min-h-[48px] rounded-xl"
				onClick={() => onAdjust(ingredient)}
			>
				<Plus className="w-3.5 h-3.5" />
				Reabastecer {ingredient.name}
			</button>
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KitchenStockPage() {
	const [ingredients, setIngredients] = useState<Ingredient[]>([]);
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [adjusting, setAdjusting] = useState<Ingredient | null>(null);

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

	const filtered = query.trim()
		? ingredients.filter((i) =>
				i.name.toLowerCase().includes(query.toLowerCase()),
			)
		: ingredients;
	const criticalItems = ingredients.filter(isCritical);
	const lowItems = ingredients.filter(isLow);
	const okItems = ingredients.filter((i) => !isCritical(i) && !isLow(i));
	const criticalCount = criticalItems.length;

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
		<div className="flex min-h-screen bg-surface-0 flex-col lg:flex-row">
			<KitchenNav />

			<div className="flex-1 flex flex-col min-w-0">
				{/* ── Page header ── */}
				<div className="sticky top-0 lg:top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-surface-3 bg-surface-1/95 backdrop-blur-md">
					<div>
						<div className="flex items-center gap-2.5 mb-0.5">
							<div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
								<Package className="w-4 h-4 text-brand-500" />
							</div>
							<h1 className="font-display text-lg sm:text-xl font-bold text-ink-primary uppercase tracking-wide">
								Stock de Cocina
							</h1>
						</div>
						<p className="font-body text-sm text-ink-tertiary ml-11">
							{loading ? "Cargando..." : `${ingredients.length} ingredientes`} ·{" "}
							{criticalCount > 0 ? (
								<span className="text-red-400 font-semibold">
									{criticalCount} en stock crítico
								</span>
							) : (
								<span className="text-emerald-400">Todo en orden</span>
							)}
						</p>
					</div>

					<div className="flex items-center gap-3 w-full sm:w-auto">
						<div className="relative flex-1 sm:flex-none">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
							<input
								type="text"
								placeholder="Buscar ingrediente..."
								className="input-base pl-9 w-full sm:w-56 text-sm"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</div>
						<button className="btn-primary flex items-center gap-2 text-xs min-h-[44px] shrink-0">
							<Plus className="w-3.5 h-3.5" />
							Agregar
						</button>
					</div>
				</div>

				<div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
					{/* ── Alert banner ── */}
					{criticalCount > 0 && (
						<div className="flex items-start sm:items-center gap-4 px-4 sm:px-5 py-4 rounded-2xl bg-amber-500/8 border border-amber-500/25">
							<div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
								<AlertTriangle className="w-5 h-5 text-amber-400" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-display text-sm font-bold text-amber-400 uppercase tracking-wide">
									Ingredientes críticos — {criticalCount} item
									{criticalCount !== 1 ? "s" : ""}
								</p>
								<p className="font-body text-xs text-ink-secondary mt-0.5 truncate">
									{criticalItems.map((i) => i.name).join(", ")} — Reabastecer
									antes del próximo servicio
								</p>
							</div>
							<div className="hidden sm:flex items-center gap-2 text-amber-400 text-xs font-display font-bold uppercase tracking-wide shrink-0">
								<TrendingDown className="w-4 h-4" />
								Acción requerida
							</div>
						</div>
					)}

					{/* ── Summary chips ── */}
					<div className="grid grid-cols-3 gap-3">
						<div className="card-sm p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
							<div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
								<AlertTriangle className="w-4 h-4 text-red-400" />
							</div>
							<div>
								<p className="font-display text-[9px] sm:text-[10px] uppercase tracking-wider text-ink-tertiary">
									Críticos
								</p>
								<p className="font-kds text-2xl sm:text-3xl leading-none text-red-400">
									{criticalCount}
								</p>
							</div>
						</div>
						<div className="card-sm p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
							<div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
								<TrendingDown className="w-4 h-4 text-amber-400" />
							</div>
							<div>
								<p className="font-display text-[9px] sm:text-[10px] uppercase tracking-wider text-ink-tertiary">
									Bajos
								</p>
								<p className="font-kds text-2xl sm:text-3xl leading-none text-amber-400">
									{lowItems.length}
								</p>
							</div>
						</div>
						<div className="card-sm p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
							<div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
								<CheckCircle2 className="w-4 h-4 text-emerald-400" />
							</div>
							<div>
								<p className="font-display text-[9px] sm:text-[10px] uppercase tracking-wider text-ink-tertiary">
									OK
								</p>
								<p className="font-kds text-2xl sm:text-3xl leading-none text-emerald-400">
									{okItems.length}
								</p>
							</div>
						</div>
					</div>

					{/* ── Ingredient cards grid (mobile) / table (desktop) ── */}
					<div className="card overflow-hidden">
						<div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-surface-3 bg-surface-2/20">
							<h2 className="font-display text-sm font-bold uppercase tracking-widest text-ink-secondary">
								Todos los ingredientes
							</h2>
							<button
								className="btn-ghost text-xs flex items-center gap-1.5"
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
								<RefreshCw className="w-3.5 h-3.5" />
								Actualizar
							</button>
						</div>

						{/* Card grid on mobile/tablet, table on large screens */}
						<div className="block lg:hidden p-4">
							{filtered.length === 0 ? (
								<p className="font-body text-sm text-ink-tertiary text-center py-8">
									{loading
										? "Cargando..."
										: `No se encontraron ingredientes para "${query}"`}
								</p>
							) : (
								<div
									className="grid gap-3"
									style={{
										gridTemplateColumns:
											"repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
									}}
								>
									{filtered.map((ingredient) => (
										<IngredientCard
											key={ingredient.id}
											ingredient={ingredient}
											onAdjust={setAdjusting}
										/>
									))}
								</div>
							)}
						</div>

						{/* Table on large screens */}
						<div className="hidden lg:block overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-surface-3 bg-surface-2/30">
										<th className="px-5 py-3 text-left font-display text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">
											Ingrediente
										</th>
										<th className="px-5 py-3 text-left font-display text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">
											Stock actual
										</th>
										<th className="px-5 py-3 text-left font-display text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">
											Alerta en
										</th>
										<th className="px-5 py-3 text-left font-display text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">
											Estado
										</th>
										<th className="px-5 py-3 text-left font-display text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">
											Nivel
										</th>
										<th className="px-5 py-3 text-left font-display text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">
											Acción
										</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((ingredient) => {
										const critical = isCritical(ingredient);
										const low = isLow(ingredient);
										const pct = stockPct(ingredient);
										return (
											<tr
												key={ingredient.id}
												className={`border-b border-surface-3 transition-colors ${
													critical
														? "bg-red-500/5 hover:bg-red-500/8"
														: "hover:bg-surface-2/50"
												}`}
											>
												{/* Name */}
												<td className="px-5 py-4">
													<div className="flex items-center gap-3">
														<div
															className={`w-2.5 h-2.5 rounded-full shrink-0 ${
																critical
																	? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)] animate-pulse"
																	: low
																		? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
																		: "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.4)]"
															}`}
														/>
														<span className="font-display text-sm font-semibold text-ink-primary">
															{ingredient.name}
														</span>
													</div>
												</td>
												{/* Stock + bar */}
												<td className="px-5 py-4 w-56">
													<div className="flex flex-col gap-1.5">
														<span
															className={`font-mono text-sm font-bold ${
																critical
																	? "text-red-400"
																	: low
																		? "text-amber-400"
																		: "text-ink-primary"
															}`}
														>
															{formatUnit(
																ingredient.stockCurrent,
																ingredient.unit,
															)}
														</span>
														<StockBar pct={pct} critical={critical} low={low} />
													</div>
												</td>
												{/* Threshold */}
												<td className="px-5 py-4">
													<span className="font-mono text-sm text-ink-secondary">
														{formatUnit(
															ingredient.alertThreshold,
															ingredient.unit,
														)}
													</span>
												</td>
												{/* Status badge */}
												<td className="px-5 py-4">
													{critical ? (
														<span className="badge badge-cancelled">
															<span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
															Crítico
														</span>
													) : low ? (
														<span className="badge badge-pending">
															<TrendingDown className="w-2.5 h-2.5" />
															Bajo
														</span>
													) : (
														<span className="badge badge-ready">
															<CheckCircle2 className="w-2.5 h-2.5" />
															OK
														</span>
													)}
												</td>
												{/* % level */}
												<td className="px-5 py-4">
													<span
														className={`font-kds text-2xl leading-none ${
															pct <= 25
																? "text-red-400"
																: pct <= 50
																	? "text-amber-400"
																	: "text-emerald-400"
														}`}
													>
														{pct}
														<span className="text-xs font-body text-ink-tertiary ml-0.5">
															%
														</span>
													</span>
												</td>
												{/* Actions */}
												<td className="px-5 py-4">
													<button
														className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 hover:text-brand-500 hover:border-brand-500/30 border border-transparent rounded-lg"
														onClick={() => setAdjusting(ingredient)}
													>
														<Sliders className="w-3.5 h-3.5" />
														Ajustar
													</button>
												</td>
											</tr>
										);
									})}
									{filtered.length === 0 && (
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

					{/* ── Critical section ── */}
					{criticalCount > 0 && (
						<div className="card border-red-500/15 overflow-hidden">
							<div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-red-500/15 bg-red-500/[0.04]">
								<div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
									<AlertTriangle className="w-4 h-4 text-red-400" />
								</div>
								<div>
									<h2 className="font-display text-sm font-bold uppercase tracking-widest text-red-400">
										Ingredientes Críticos
									</h2>
									<p className="font-body text-xs text-ink-tertiary mt-0.5">
										Requieren reabastecimiento inmediato
									</p>
								</div>
								<span className="ml-auto font-kds text-4xl leading-none text-red-400">
									{criticalCount}
								</span>
							</div>

							<div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
								{criticalItems.map((ingredient) => (
									<CriticalCard
										key={ingredient.id}
										ingredient={ingredient}
										onAdjust={setAdjusting}
									/>
								))}
							</div>
						</div>
					)}
				</div>

				{/* ── Footer ── */}
				<div className="flex items-center justify-between px-4 sm:px-8 py-4 border-t border-surface-3 bg-surface-1/50 flex-wrap gap-2">
					<div className="flex items-center gap-2 text-ink-tertiary">
						<RefreshCw className="w-3.5 h-3.5" />
						<span className="font-body text-xs">Última actualización: hoy</span>
					</div>
					<div className="flex items-center gap-4 text-xs font-display uppercase tracking-widest text-ink-tertiary flex-wrap">
						<span>
							Total:{" "}
							<span className="text-ink-secondary font-bold">
								{ingredients.length} ingredientes
							</span>
						</span>
						<span className="w-px h-3 bg-surface-3" />
						<span className="text-red-400">{criticalCount} críticos</span>
						<span className="w-px h-3 bg-surface-3" />
						<span className="text-emerald-400">{okItems.length} OK</span>
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
