"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import {
	AlertTriangle,
	CheckCircle2,
	Package,
	TrendingDown,
	Search,
	Plus,
	Minus,
	RefreshCw,
	ChevronRight,
	Zap,
	ArrowRight,
	Wine,
} from "lucide-react";
import Link from "next/link";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";

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
	if (ing.stockCurrent < ing.alertThreshold) return "critical";
	if (ing.stockCurrent < ing.alertThreshold * 1.5) return "low";
	return "ok";
}

function stockPct(ing: Ingredient): number {
	const max = Math.max(ing.alertThreshold * 3, ing.stockCurrent);
	return Math.min(100, Math.round((ing.stockCurrent / max) * 100));
}

function formatUnit(value: number, unit: string): string {
	if (unit === "ml")
		return value >= 1000 ? `${(value / 1000).toFixed(1)} L` : `${value} ml`;
	if (unit === "gr")
		return value >= 1000 ? `${(value / 1000).toFixed(2)} kg` : `${value} gr`;
	if (unit === "units") return `${value} u.`;
	return `${value} ${unit}`;
}

// ─── Bar nav — responsive: sidebar on desktop, top bar on mobile ──────────────

function BarNav() {
	return (
		<>
			{/* Desktop sidebar */}
			<aside className="hidden lg:flex w-56 shrink-0 flex-col gap-1 py-6 px-3 bg-surface-1 border-r border-surface-3 min-h-screen sticky top-0 self-start h-screen overflow-y-auto">
				<div className="flex items-center gap-2.5 px-3 mb-6">
					<div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
						<Wine className="w-4 h-4 text-blue-400" />
					</div>
					<div>
						<p className="font-display text-xs font-bold uppercase tracking-widest text-blue-400">
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
					className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-semibold transition-all bg-blue-500/10 text-blue-400 border border-blue-500/20"
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
					<div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
						<Wine className="w-4 h-4 text-blue-400" />
					</div>
					<span className="font-display text-xs font-bold uppercase tracking-widest text-blue-400">
						Bar
					</span>
				</div>
				<Link
					href="/bar"
					className="flex items-center gap-2 px-3 min-h-[40px] rounded-xl text-xs font-display font-semibold text-ink-secondary bg-surface-2 border border-surface-3"
				>
					<Zap className="w-3.5 h-3.5" />
					Pedidos
				</Link>
				<Link
					href="/bar/stock"
					className="flex items-center gap-2 px-3 min-h-[40px] rounded-xl text-xs font-display font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"
				>
					<Package className="w-3.5 h-3.5" />
					Stock
				</Link>
			</nav>
		</>
	);
}

// ─── Stock progress bar ───────────────────────────────────────────────────────

function StockBar({ pct, status }: { pct: number; status: IngStatus }) {
	const fill = {
		ok: "bg-emerald-500",
		low: "bg-amber-500",
		critical: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]",
	}[status];
	return (
		<div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden">
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

// ─── Ingredient card ──────────────────────────────────────────────────────────

function IngredientCard({
	ing,
	onAdjust,
	onQuickAdjust,
}: {
	ing: Ingredient;
	onAdjust: (ing: Ingredient) => void;
	onQuickAdjust: (id: string, delta: number, current: number) => void;
}) {
	const status = getStatus(ing);
	const pct = stockPct(ing);

	const borderAccent = {
		ok: "border-surface-3 hover:border-emerald-500/20",
		low: "border-amber-500/25 hover:border-amber-500/40",
		critical: "border-red-500/30 hover:border-red-500/50",
	}[status];

	const bgAccent = {
		ok: "bg-surface-1",
		low: "bg-amber-500/[0.03]",
		critical: "bg-red-500/[0.04]",
	}[status];

	const dotCls = {
		ok: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
		low: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
		critical: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)] animate-pulse",
	}[status];

	return (
		<div
			className={clsx(
				"flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-200",
				bgAccent,
				borderAccent,
			)}
		>
			{/* Header row: name + status badge */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2.5 min-w-0">
					<span
						className={clsx("w-2.5 h-2.5 rounded-full shrink-0 mt-0.5", dotCls)}
					/>
					<span className="font-display text-sm font-bold text-ink-primary truncate uppercase tracking-wide">
						{ing.name}
					</span>
				</div>
				{status === "critical" ? (
					<span className="badge badge-cancelled shrink-0">
						<AlertTriangle className="w-2.5 h-2.5" />
						Crítico
					</span>
				) : status === "low" ? (
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

			{/* Large KDS stock number */}
			<div className="flex items-baseline gap-2">
				<span
					className={clsx(
						"font-kds leading-none",
						status === "critical"
							? "text-red-400 text-5xl"
							: status === "low"
								? "text-amber-400 text-5xl"
								: "text-ink-primary text-5xl",
					)}
				>
					{ing.stockCurrent.toLocaleString("es-AR")}
				</span>
				<span className="font-display text-xs text-ink-tertiary uppercase tracking-wider">
					{ing.unit}
				</span>
			</div>

			{/* Progress bar + threshold */}
			<div className="flex flex-col gap-1.5">
				<StockBar pct={pct} status={status} />
				<div className="flex items-center justify-between">
					<span className="font-body text-xs text-ink-tertiary">
						Umbral: {formatUnit(ing.alertThreshold, ing.unit)}
					</span>
					<span
						className={clsx(
							"font-kds text-lg leading-none",
							pct <= 30
								? "text-red-400"
								: pct <= 60
									? "text-amber-400"
									: "text-emerald-400",
						)}
					>
						{pct}
						<span className="text-xs font-body text-ink-tertiary ml-0.5">
							%
						</span>
					</span>
				</div>
			</div>

			{/* Quick +/- controls */}
			<div className="flex items-center gap-2">
				<button
					className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-3 border border-surface-4 text-ink-secondary hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all active:scale-95"
					onClick={() => onQuickAdjust(ing.id, -1, ing.stockCurrent)}
					title="Restar 1"
				>
					<Minus className="w-4 h-4" />
				</button>
				<button
					className="flex items-center justify-center flex-1 h-10 rounded-xl bg-surface-2 border border-surface-3 text-xs font-display font-bold uppercase tracking-wide text-ink-secondary hover:text-blue-400 hover:border-blue-500/30 transition-all active:scale-95"
					onClick={() => onAdjust(ing)}
				>
					Ajustar
				</button>
				<button
					className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-3 border border-surface-4 text-ink-secondary hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all active:scale-95"
					onClick={() => onQuickAdjust(ing.id, 1, ing.stockCurrent)}
					title="Sumar 1"
				>
					<Plus className="w-4 h-4" />
				</button>
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

	const status = getStatus(ingredient);

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
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
							<Wine className="w-4 h-4 text-blue-400" />
						</div>
						<h3 className="font-display font-bold text-ink-primary text-sm uppercase tracking-wider">
							Ajustar Stock
						</h3>
					</div>
					<button
						onClick={onClose}
						className="text-ink-tertiary hover:text-ink-primary text-lg leading-none min-w-[32px] min-h-[32px] flex items-center justify-center"
					>
						×
					</button>
				</div>

				<div className="p-3 rounded-xl bg-surface-2 border border-surface-3">
					<p className="font-display text-sm font-bold text-ink-primary uppercase tracking-wide">
						{ingredient.name}
					</p>
					<div className="flex items-baseline gap-3 mt-2">
						<span
							className={clsx(
								"font-kds text-4xl leading-none",
								status === "critical"
									? "text-red-400"
									: status === "low"
										? "text-amber-400"
										: "text-ink-primary",
							)}
						>
							{ingredient.stockCurrent.toLocaleString("es-AR")}
						</span>
						<span className="font-body text-xs text-ink-tertiary">
							{ingredient.unit} actual
						</span>
					</div>
					<StockBar pct={stockPct(ingredient)} status={status} />
					<p className="font-body text-xs text-ink-tertiary mt-1.5">
						Umbral de alerta:{" "}
						{formatUnit(ingredient.alertThreshold, ingredient.unit)}
					</p>
				</div>

				<div>
					<label className="font-display text-[10px] uppercase tracking-widest text-ink-tertiary mb-1.5 block">
						Nuevo stock ({ingredient.unit})
					</label>
					<input
						type="number"
						className="input-base w-full text-sm"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						min={0}
						autoFocus
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
	const alertCount = criticalIngredients.length + lowIngredients.length;

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

	async function handleQuickAdjust(id: string, delta: number, current: number) {
		const next = Math.max(0, current + delta);
		// Optimistic update
		setIngredients((prev) =>
			prev.map((ing) => (ing.id === id ? { ...ing, stockCurrent: next } : ing)),
		);
		const res = await fetch(`/api/ingredients/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ stockCurrent: next }),
		});
		if (!res.ok) {
			// Revert on failure
			setIngredients((prev) =>
				prev.map((ing) =>
					ing.id === id ? { ...ing, stockCurrent: current } : ing,
				),
			);
		}
	}

	return (
		<div className="flex min-h-screen bg-surface-0 flex-col lg:flex-row noise-overlay">
			<BarNav />

			<div className="flex-1 flex flex-col min-w-0">
				{/* ── Page header ── */}
				<header className="relative sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-surface-3 bg-surface-1/95 backdrop-blur-md top-accent">
					<div>
						<div className="flex items-center gap-3 mb-1">
							<div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/25 shrink-0">
								<Package className="w-5 h-5 text-blue-400" />
							</div>
							<div>
								<h1 className="font-kds text-3xl leading-none text-blue-400 tracking-widest">
									STOCK
								</h1>
								<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-[0.2em] mt-0.5">
									Bar · My Way
								</p>
							</div>
						</div>
					</div>

					{/* Summary badges */}
					<div className="flex items-center gap-2 flex-wrap">
						<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-surface-3">
							<span className="font-kds text-2xl leading-none text-ink-secondary">
								{loading ? "…" : ingredients.length}
							</span>
							<span className="font-display text-[10px] uppercase tracking-widest text-ink-tertiary">
								ítems
							</span>
						</div>
						{alertCount > 0 && (
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 animate-pulse">
								<AlertTriangle className="w-3.5 h-3.5 text-red-400" />
								<span className="font-kds text-2xl leading-none text-red-400">
									{alertCount}
								</span>
								<span className="font-display text-[10px] uppercase tracking-widest text-red-400/70">
									alerta
								</span>
							</div>
						)}
					</div>

					{/* Search + add */}
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
						<button className="btn-primary text-xs px-4 min-h-[44px] shrink-0">
							<Plus className="w-4 h-4" />
							Nuevo ítem
						</button>
					</div>
				</header>

				<div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
					{/* ── Alert banner (critical) ── */}
					{criticalIngredients.length > 0 && (
						<div className="rounded-2xl p-4 flex items-start gap-4 bg-red-500/[0.06] border border-red-500/25">
							<div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
								<AlertTriangle className="w-5 h-5 text-red-400" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-display font-bold text-red-400 text-sm uppercase tracking-wider">
									{criticalIngredients.length} ingrediente
									{criticalIngredients.length !== 1 ? "s" : ""} en stock crítico
									— reposición urgente
								</p>
								<div className="mt-2 flex flex-wrap gap-2">
									{criticalIngredients.map((ing) => (
										<span
											key={ing.id}
											className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-body bg-red-500/[0.09] border border-red-500/18"
										>
											<span className="text-red-300 font-semibold">
												{ing.name}
											</span>
											<span className="text-ink-tertiary text-xs">
												{formatUnit(ing.stockCurrent, ing.unit)} actual
											</span>
										</span>
									))}
								</div>
							</div>
						</div>
					)}

					{/* ── Low stock notice ── */}
					{lowIngredients.length > 0 && (
						<div className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-amber-500/[0.06] border border-amber-500/20">
							<TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />
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
									{criticalIngredients.length}
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
									{lowIngredients.length}
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
									{okIngredients.length}
								</p>
							</div>
						</div>
					</div>

					{/* ── Ingredient cards / table ── */}
					<div className="card overflow-hidden">
						<div className="px-4 sm:px-5 py-4 border-b border-surface-3 flex items-center justify-between bg-surface-2/20">
							<div className="flex items-center gap-2">
								<Package className="w-4 h-4 text-blue-400" />
								<h2 className="font-display font-bold text-sm uppercase tracking-wider text-ink-primary">
									Inventario del Bar
								</h2>
							</div>
							<div className="flex items-center gap-3">
								<span className="text-ink-tertiary font-body text-xs hidden sm:block">
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
									<RefreshCw className="w-3 h-3" />
									Actualizar
								</button>
							</div>
						</div>

						{/* Card grid on mobile/tablet */}
						<div className="block lg:hidden p-4">
							{filteredIngredients.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-16 gap-4 text-ink-tertiary">
									<div className="w-16 h-16 rounded-2xl bg-surface-2 border border-surface-3 flex items-center justify-center">
										<Package className="w-7 h-7 opacity-30" />
									</div>
									<p className="font-kds text-xl tracking-wider opacity-40">
										{loading ? "CARGANDO..." : "SIN INGREDIENTES"}
									</p>
									{!loading && query && (
										<p className="font-body text-sm text-ink-tertiary">
											No hay resultados para &ldquo;{query}&rdquo;
										</p>
									)}
								</div>
							) : (
								<div
									className="grid gap-3"
									style={{
										gridTemplateColumns:
											"repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
									}}
								>
									{filteredIngredients.map((ing) => (
										<IngredientCard
											key={ing.id}
											ing={ing}
											onAdjust={setAdjusting}
											onQuickAdjust={handleQuickAdjust}
										/>
									))}
								</div>
							)}
						</div>

						{/* Table on large screens */}
						<div className="hidden lg:block overflow-x-auto">
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
											Umbral
										</th>
										<th className="text-center px-4 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-ink-tertiary">
											Estado
										</th>
										<th className="text-center px-4 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-ink-tertiary">
											Nivel
										</th>
										<th className="text-right px-5 py-3 font-display font-bold text-[10px] uppercase tracking-wider text-ink-tertiary">
											Ajustar
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredIngredients.length === 0 && (
										<tr>
											<td colSpan={6} className="px-5 py-16 text-center">
												<div className="flex flex-col items-center gap-3 text-ink-tertiary">
													<Package className="w-8 h-8 opacity-20" />
													<p className="font-kds text-xl tracking-wider opacity-40">
														{loading ? "CARGANDO..." : `SIN RESULTADOS`}
													</p>
												</div>
											</td>
										</tr>
									)}
									{filteredIngredients.map((ing, idx) => {
										const status = getStatus(ing);
										const pct = stockPct(ing);
										const isLast = idx === filteredIngredients.length - 1;
										const dotCls = {
											ok: "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]",
											low: "bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]",
											critical:
												"bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.7)] animate-pulse",
										}[status];
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
														<span
															className={clsx(
																"w-2.5 h-2.5 rounded-full shrink-0",
																dotCls,
															)}
														/>
														<span className="font-display text-sm font-semibold text-ink-primary">
															{ing.name}
														</span>
													</div>
												</td>
												{/* Stock number + bar */}
												<td className="px-4 py-3.5">
													<div className="flex flex-col gap-1.5 w-44">
														<span
															className={clsx(
																"font-kds text-3xl leading-none",
																status === "critical"
																	? "text-red-400"
																	: status === "low"
																		? "text-amber-400"
																		: "text-ink-primary",
															)}
														>
															{ing.stockCurrent.toLocaleString("es-AR")}
															<span className="font-body text-xs text-ink-tertiary ml-1.5">
																{ing.unit}
															</span>
														</span>
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
													{status === "critical" ? (
														<span className="badge badge-cancelled">
															<AlertTriangle className="w-2.5 h-2.5" />
															Crítico
														</span>
													) : status === "low" ? (
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
												<td className="px-4 py-3.5 text-center">
													<span
														className={clsx(
															"font-kds text-2xl leading-none",
															pct <= 30
																? "text-red-400"
																: pct <= 60
																	? "text-amber-400"
																	: "text-emerald-400",
														)}
													>
														{pct}
														<span className="text-xs font-body text-ink-tertiary ml-0.5">
															%
														</span>
													</span>
												</td>
												{/* Quick adjust */}
												<td className="px-5 py-3.5">
													<div className="flex items-center justify-end gap-1.5">
														<button
															className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-3 border border-surface-4 text-ink-secondary hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95"
															onClick={() =>
																handleQuickAdjust(ing.id, -1, ing.stockCurrent)
															}
														>
															<Minus className="w-3.5 h-3.5" />
														</button>
														<button
															className="btn-ghost text-[11px] px-2.5 py-1.5 rounded-lg"
															onClick={() => setAdjusting(ing)}
														>
															Ajustar
														</button>
														<button
															className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-3 border border-surface-4 text-ink-secondary hover:text-emerald-400 hover:border-emerald-500/30 transition-all active:scale-95"
															onClick={() =>
																handleQuickAdjust(ing.id, 1, ing.stockCurrent)
															}
														>
															<Plus className="w-3.5 h-3.5" />
														</button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>

					{/* ── Critical restock cards ── */}
					{criticalIngredients.length > 0 && (
						<div className="card border-red-500/15 overflow-hidden">
							<div className="px-4 sm:px-5 py-4 border-b border-red-500/15 bg-red-500/[0.04] flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
										<AlertTriangle className="w-4 h-4 text-red-400" />
									</div>
									<div>
										<h2 className="font-display text-sm font-bold uppercase tracking-widest text-red-400">
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

							<div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{criticalIngredients.map((ing) => {
									const pct = stockPct(ing);
									const deficit = ing.alertThreshold - ing.stockCurrent;
									return (
										<div
											key={ing.id}
											className="flex flex-col gap-3 p-4 rounded-xl bg-red-500/[0.05] border border-red-500/15"
										>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-display text-sm font-bold text-ink-primary uppercase tracking-wide">
														{ing.name}
													</p>
													<p className="font-body text-xs text-ink-tertiary uppercase tracking-wide mt-0.5">
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
													<span className="font-kds text-3xl text-red-400 leading-none">
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
												className="btn-primary w-full justify-center text-xs min-h-[48px] rounded-xl"
												onClick={() => setAdjusting(ing)}
											>
												<Plus className="w-3.5 h-3.5" />
												Reabastecer
											</button>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* ── Footer ── */}
					<div className="flex items-center justify-between text-ink-tertiary text-xs font-body pb-4 flex-wrap gap-2">
						<div className="flex items-center gap-1.5">
							<RefreshCw className="w-3 h-3" />
							<span>Sincronización automática cada 30 s · Sistema My Way</span>
						</div>
						<button className="btn-ghost text-xs px-3 py-1.5">
							<ChevronRight className="w-3 h-3" />
							Ver historial
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
			<HelpButton {...helpContent.barStock} variant="float" />
		</div>
	);
}
