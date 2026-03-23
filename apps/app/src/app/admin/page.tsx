"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
	LayoutDashboard,
	AlertTriangle,
	Clock,
	TrendingUp,
	Package,
	ShoppingBag,
	Armchair,
	BarChart3,
	CheckCircle2,
} from "lucide-react";
import { formatCurrency, elapsedMinutes } from "@/lib/utils";
import type { Order, Table, Ingredient } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// ─── Section label ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<div
			className="font-display text-ink-tertiary uppercase mb-3"
			style={{ fontSize: 9, letterSpacing: "0.25em" }}
		>
			{children}
		</div>
	);
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
	label,
	value,
	sub,
	color,
	icon: Icon,
	delay,
}: {
	label: string;
	value: string | number;
	sub?: string;
	color: string;
	icon: React.ElementType;
	delay: number;
}) {
	return (
		<div
			className="card p-5 relative overflow-hidden group transition-all duration-200 hover:-translate-y-0.5"
			style={{
				animation: `slideUp 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
			}}
		>
			{/* gradient glow */}
			<div
				className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity duration-300"
				style={{
					background: `radial-gradient(ellipse 220px 160px at 100% 0%, ${color}15 0%, transparent 60%)`,
					pointerEvents: "none",
				}}
			/>
			{/* bottom edge glow on hover */}
			<div
				className="absolute bottom-0 left-[15%] right-[15%] h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
				style={{ background: `${color}40` }}
			/>
			<div className="relative z-10">
				<div className="flex items-center gap-2.5 mb-4">
					<div
						className="flex items-center justify-center shrink-0 transition-shadow duration-300"
						style={{
							width: 36,
							height: 36,
							borderRadius: 10,
							background: `${color}14`,
							border: `1px solid ${color}28`,
							boxShadow: `0 0 0 rgba(0,0,0,0)`,
						}}
					>
						<Icon size={16} style={{ color }} />
					</div>
					<span
						className="font-display text-ink-tertiary uppercase"
						style={{ fontSize: 9, letterSpacing: "0.25em" }}
					>
						{label}
					</span>
				</div>
				<div
					className="font-kds transition-colors duration-200"
					style={{ fontSize: 40, lineHeight: 1, color }}
				>
					{value}
				</div>
				{sub && (
					<div
						className="font-body text-ink-tertiary mt-1.5"
						style={{ fontSize: 11 }}
					>
						{sub}
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Status badge (inline) ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, string> = {
		pending: "badge-pending",
		preparing: "badge-preparing",
		ready: "badge-ready",
		delivered: "badge-delivered",
		closed: "badge-closed",
		cancelled: "badge-cancelled",
	};
	const labels: Record<string, string> = {
		pending: "Pendiente",
		preparing: "Preparando",
		ready: "Listo",
		delivered: "Entregado",
		closed: "Cerrado",
		cancelled: "Cancelado",
	};
	return (
		<span className={`badge ${map[status] ?? "badge-pending"}`}>
			{labels[status] ?? status}
		</span>
	);
}

// ─── Stock progress bar ─────────────────────────────────────────────────────

function StockBar({
	current,
	threshold,
}: {
	current: number;
	threshold: number;
}) {
	const ratio = Math.min(current / Math.max(threshold, 1), 1);
	const barColor =
		ratio < 0.3 ? "#ef4444" : ratio < 0.6 ? "#f59e0b" : "#10b981";
	return (
		<div className="progress-track" style={{ height: 4, width: 64 }}>
			<div
				className="progress-bar"
				style={{
					width: `${ratio * 100}%`,
					background: barColor,
					boxShadow: `0 0 6px ${barColor}60`,
				}}
			/>
		</div>
	);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [tables, setTables] = useState<Table[]>([]);
	const [ingredients, setIngredients] = useState<Ingredient[]>([]);

	const fetchAll = useCallback(async () => {
		try {
			const [o, t, ing] = await Promise.all([
				apiFetch<Order[]>("/api/orders"),
				apiFetch<Table[]>("/api/tables"),
				apiFetch<Ingredient[]>("/api/ingredients"),
			]);
			setOrders(o);
			setTables(t);
			setIngredients(ing);
		} catch (e) {
			console.error(e);
		}
	}, []);

	useEffect(() => {
		fetchAll();
		const id = setInterval(fetchAll, 10000);
		return () => clearInterval(id);
	}, [fetchAll]);

	const activeOrders = orders.filter(
		(o) => o.status !== "closed" && o.status !== "cancelled",
	);
	const occupiedTables = tables.filter((t) => t.status === "occupied").length;
	const lowStock = ingredients.filter(
		(i) => i.stockCurrent <= i.alertThreshold,
	);

	const totalRevenue = activeOrders.reduce(
		(s, o) => s + o.items.reduce((si, i) => si + i.qty * i.price, 0),
		0,
	);

	const tableColorMap: Record<string, string> = {
		available: "#10b981",
		occupied: "#f59e0b",
		reserved: "#8b5cf6",
	};

	return (
		<div
			className="min-h-screen noise-overlay"
			style={{ background: "var(--s0)" }}
		>
			<div className="p-5 md:p-7 pb-10">
				{/* ── Page header ── */}
				<div className="flex items-center justify-between mb-2 animate-fade-in">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<div
								style={{
									width: 3,
									height: 20,
									borderRadius: 3,
									background: "var(--gold)",
								}}
							/>
							<h1
								className="font-display text-ink-primary"
								style={{ fontSize: 22, fontWeight: 700 }}
							>
								Dashboard
							</h1>
						</div>
						<div
							className="font-body text-ink-tertiary"
							style={{ fontSize: 12 }}
						>
							Vista general del sistema en tiempo real
						</div>
					</div>
					<div className="flex items-center gap-2">
						<div
							className="w-1.5 h-1.5 rounded-full animate-pulse"
							style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }}
						/>
						<span
							className="font-body text-ink-tertiary"
							style={{ fontSize: 11 }}
						>
							En vivo
						</span>
					</div>
				</div>

				{/* ── Gold accent divider ── */}
				<div className="divider-gold mb-7" />

				{/* ── KPI stats ── */}
				<SectionLabel>Indicadores clave</SectionLabel>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
					<StatCard
						label="Pedidos activos"
						value={activeOrders.length}
						sub={`${orders.filter((o) => o.status === "preparing").length} preparando`}
						color="#3b82f6"
						icon={ShoppingBag}
						delay={0}
					/>
					<StatCard
						label="Mesas ocupadas"
						value={`${occupiedTables}/${tables.length}`}
						sub={`${tables.length - occupiedTables} disponibles`}
						color="#f59e0b"
						icon={Armchair}
						delay={60}
					/>
					<StatCard
						label="Stock bajo"
						value={lowStock.length}
						sub={lowStock.length > 0 ? "Requieren atencion" : "Todo en orden"}
						color={lowStock.length > 0 ? "#ef4444" : "#10b981"}
						icon={AlertTriangle}
						delay={120}
					/>
					<StatCard
						label="Ingresos activos"
						value={formatCurrency(totalRevenue)}
						sub="pedidos abiertos"
						color="#10b981"
						icon={BarChart3}
						delay={180}
					/>
				</div>

				{/* ── Main grid ── */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					{/* Active orders */}
					<div
						className="card overflow-hidden"
						style={{
							animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) 240ms both",
						}}
					>
						<div className="flex items-center justify-between px-5 py-4 border-b border-[var(--s3)]">
							<div className="flex items-center gap-2">
								<TrendingUp size={13} className="text-brand-500" />
								<h2
									className="font-display text-ink-primary uppercase"
									style={{ fontSize: 11, letterSpacing: "0.2em" }}
								>
									Pedidos activos
								</h2>
							</div>
							<span
								className="font-kds text-brand-500"
								style={{ fontSize: 22, lineHeight: 1 }}
							>
								{activeOrders.length}
							</span>
						</div>
						<div style={{ maxHeight: 360, overflowY: "auto" }}>
							{activeOrders.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 gap-2">
									<CheckCircle2 size={28} style={{ color: "#333" }} />
									<span
										className="font-body text-ink-tertiary"
										style={{ fontSize: 12 }}
									>
										Sin pedidos activos
									</span>
								</div>
							) : (
								activeOrders.map((order) => {
									const total = order.items.reduce(
										(s, i) => s + i.qty * i.price,
										0,
									);
									const elapsed = elapsedMinutes(order.createdAt);
									const sColor =
										order.status === "preparing"
											? "#3b82f6"
											: order.status === "ready"
												? "#10b981"
												: "#f59e0b";
									return (
										<div
											key={order.id}
											className="flex items-center gap-3 px-5 py-3 border-b border-[var(--s3)] transition-all duration-150 hover:bg-[var(--s2)]"
											style={{ borderLeft: `3px solid ${sColor}` }}
										>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-0.5">
													<span
														className="font-kds text-ink-primary"
														style={{ fontSize: 16, lineHeight: 1 }}
													>
														Mesa {order.tableNumber}
													</span>
													<StatusBadge status={order.status} />
												</div>
												<span
													className="font-body text-ink-tertiary"
													style={{ fontSize: 11 }}
												>
													{order.items.length} items
												</span>
											</div>
											<div className="flex items-center gap-1 shrink-0">
												<Clock size={10} style={{ color: "#555" }} />
												<span
													className="font-kds"
													style={{
														fontSize: 13,
														color:
															elapsed > 20
																? "#ef4444"
																: elapsed > 10
																	? "#f59e0b"
																	: "#555",
													}}
												>
													{elapsed}m
												</span>
											</div>
											<span
												className="font-kds text-brand-500 shrink-0"
												style={{
													fontSize: 14,
													minWidth: 72,
													textAlign: "right",
												}}
											>
												{formatCurrency(total)}
											</span>
										</div>
									);
								})
							)}
						</div>
					</div>

					{/* Right column */}
					<div className="flex flex-col gap-5">
						{/* Tables mini map */}
						<div
							className="card overflow-hidden"
							style={{
								animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) 300ms both",
							}}
						>
							<div className="flex items-center justify-between px-5 py-4 border-b border-[var(--s3)]">
								<div className="flex items-center gap-2">
									<LayoutDashboard size={13} className="text-brand-500" />
									<h2
										className="font-display text-ink-primary uppercase"
										style={{ fontSize: 11, letterSpacing: "0.2em" }}
									>
										Estado de mesas
									</h2>
								</div>
								<div className="flex items-center gap-3">
									{[
										{ label: "Libre", color: "#10b981" },
										{ label: "Ocupada", color: "#f59e0b" },
										{ label: "Reservada", color: "#8b5cf6" },
									].map(({ label, color }) => (
										<div key={label} className="flex items-center gap-1">
											<span
												style={{
													width: 6,
													height: 6,
													borderRadius: "50%",
													background: color,
													boxShadow: `0 0 4px ${color}60`,
												}}
											/>
											<span
												className="font-display text-ink-tertiary"
												style={{ fontSize: 9, letterSpacing: "0.1em" }}
											>
												{label}
											</span>
										</div>
									))}
								</div>
							</div>
							<div className="flex flex-wrap gap-2 p-4">
								{tables.length === 0 ? (
									<div className="flex flex-col items-center justify-center w-full py-8 gap-2">
										<Armchair size={24} style={{ color: "#333" }} />
										<span
											className="font-body text-ink-tertiary"
											style={{ fontSize: 12 }}
										>
											Cargando mesas...
										</span>
									</div>
								) : (
									tables.map((t) => {
										const c = tableColorMap[t.status] ?? "#333";
										return (
											<Link
												key={t.id}
												href={`/pos/salon/${t.id}`}
												style={{ textDecoration: "none" }}
											>
												<div
													className="transition-all duration-150 hover:scale-110"
													style={{
														width: 52,
														height: 52,
														borderRadius: 12,
														border: `2px solid ${c}40`,
														background: `${c}10`,
														display: "flex",
														flexDirection: "column",
														alignItems: "center",
														justifyContent: "center",
														cursor: "pointer",
													}}
												>
													<span
														className="font-kds"
														style={{
															fontSize: 20,
															color: c,
															lineHeight: 1,
														}}
													>
														{t.number}
													</span>
													<span
														className="font-display uppercase"
														style={{
															fontSize: 7,
															letterSpacing: "0.1em",
															color: `${c}90`,
															marginTop: 2,
														}}
													>
														{t.type === "pool" ? "POOL" : "BAR"}
													</span>
												</div>
											</Link>
										);
									})
								)}
							</div>
						</div>

						{/* Stock alerts */}
						<div
							className="card overflow-hidden"
							style={{
								animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) 360ms both",
							}}
						>
							<div className="flex items-center justify-between px-5 py-4 border-b border-[var(--s3)]">
								<div className="flex items-center gap-2">
									<Package
										size={13}
										style={{
											color: lowStock.length > 0 ? "#ef4444" : "#555",
										}}
									/>
									<h2
										className="font-display text-ink-primary uppercase"
										style={{ fontSize: 11, letterSpacing: "0.2em" }}
									>
										Alertas de stock
									</h2>
								</div>
								{lowStock.length > 0 && (
									<span className="badge badge-cancelled">
										{lowStock.length}
									</span>
								)}
							</div>
							<div style={{ maxHeight: 200, overflowY: "auto" }}>
								{lowStock.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-8 gap-2">
										<CheckCircle2 size={24} style={{ color: "#10b981" }} />
										<span
											className="font-body"
											style={{ fontSize: 12, color: "#10b981" }}
										>
											Inventario en orden
										</span>
									</div>
								) : (
									lowStock.map((ing) => (
										<div
											key={ing.id}
											className="flex items-center gap-3 px-5 py-3 border-b border-[var(--s3)] hover:bg-[var(--s2)] transition-all duration-150"
										>
											<div
												style={{
													width: 6,
													height: 6,
													borderRadius: "50%",
													background: "#ef4444",
													boxShadow: "0 0 6px rgba(239,68,68,0.4)",
													flexShrink: 0,
												}}
											/>
											<span
												className="font-body text-ink-secondary flex-1"
												style={{ fontSize: 13 }}
											>
												{ing.name}
											</span>
											<StockBar
												current={ing.stockCurrent}
												threshold={ing.alertThreshold}
											/>
											<span
												className="font-kds shrink-0"
												style={{ fontSize: 14, color: "#ef4444" }}
											>
												{ing.stockCurrent}
											</span>
											<span
												className="font-body text-ink-tertiary shrink-0"
												style={{ fontSize: 11 }}
											>
												/ {ing.alertThreshold} {ing.unit}
											</span>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
