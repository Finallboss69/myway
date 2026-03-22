"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
	LayoutDashboard,
	AlertTriangle,
	Clock,
	TrendingUp,
	Package,
} from "lucide-react";
import { formatCurrency, elapsedMinutes } from "@/lib/utils";
import type { Order, Table, Ingredient } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
	label,
	value,
	sub,
	color,
	icon: Icon,
}: {
	label: string;
	value: string | number;
	sub?: string;
	color: string;
	icon: React.ElementType;
}) {
	return (
		<div className="card p-5 relative overflow-hidden">
			{/* subtle gradient glow */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `radial-gradient(ellipse 200px 140px at 100% 0%, ${color}08 0%, transparent 60%)`,
					pointerEvents: "none",
				}}
			/>
			<div className="relative z-10">
				<div className="flex items-center gap-2.5 mb-4">
					<div
						style={{
							width: 36,
							height: 36,
							borderRadius: 10,
							background: `${color}18`,
							border: `1px solid ${color}30`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
						}}
					>
						<Icon size={16} style={{ color }} />
					</div>
					<span
						className="font-display text-ink-disabled uppercase tracking-widest"
						style={{ fontSize: 9, letterSpacing: "0.25em" }}
					>
						{label}
					</span>
				</div>
				<div
					className="font-kds"
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
				<div className="flex items-center justify-between mb-7">
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
							className="font-body text-ink-disabled"
							style={{ fontSize: 12 }}
						>
							Vista general del sistema
						</div>
					</div>
					<span
						className="font-body text-ink-disabled"
						style={{ fontSize: 11 }}
					>
						Actualiza cada 10s
					</span>
				</div>

				{/* ── Gold accent divider ── */}
				<div className="divider-gold mb-7" />

				{/* ── KPI stats ── */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
					<StatCard
						label="Pedidos activos"
						value={activeOrders.length}
						sub={`${orders.filter((o) => o.status === "preparing").length} preparando`}
						color="#3b82f6"
						icon={TrendingUp}
					/>
					<StatCard
						label="Mesas ocupadas"
						value={occupiedTables}
						sub={`de ${tables.length} totales`}
						color="#f59e0b"
						icon={LayoutDashboard}
					/>
					<StatCard
						label="Stock bajo"
						value={lowStock.length}
						sub={lowStock.length > 0 ? "Requieren atención" : "Todo en orden"}
						color={lowStock.length > 0 ? "#ef4444" : "#10b981"}
						icon={AlertTriangle}
					/>
					<StatCard
						label="Ingresos activos"
						value={formatCurrency(totalRevenue)}
						sub="pedidos abiertos"
						color="#10b981"
						icon={Package}
					/>
				</div>

				{/* ── Main grid ── */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					{/* Active orders */}
					<div className="card overflow-hidden">
						<div className="flex items-center justify-between px-5 py-4 border-b border-[var(--s3)]">
							<h2
								className="font-display text-ink-primary uppercase"
								style={{ fontSize: 11, letterSpacing: "0.2em" }}
							>
								Pedidos activos
							</h2>
							<span
								className="font-kds text-brand-500"
								style={{ fontSize: 22, lineHeight: 1 }}
							>
								{activeOrders.length}
							</span>
						</div>
						<div style={{ maxHeight: 340, overflowY: "auto" }}>
							{activeOrders.length === 0 ? (
								<div
									className="text-center py-10 text-ink-disabled font-body"
									style={{ fontSize: 12 }}
								>
									Sin pedidos activos
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
											className="flex items-center gap-3 px-5 py-3 border-b border-[var(--s3)] hover:bg-[var(--s2)] transition-all duration-150"
										>
											<div
												style={{
													width: 3,
													height: 32,
													borderRadius: 3,
													background: sColor,
													flexShrink: 0,
												}}
											/>
											<span
												className="font-kds text-ink-primary"
												style={{ fontSize: 18, lineHeight: 1, minWidth: 70 }}
											>
												Mesa {order.tableNumber}
											</span>
											<span
												className="font-body text-ink-disabled flex-1"
												style={{ fontSize: 11 }}
											>
												{order.items.length} ítems
											</span>
											<div className="flex items-center gap-1">
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
												className="font-kds text-brand-500"
												style={{
													fontSize: 14,
													minWidth: 80,
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
						<div className="card overflow-hidden">
							<div className="flex items-center justify-between px-5 py-4 border-b border-[var(--s3)]">
								<h2
									className="font-display text-ink-primary uppercase"
									style={{ fontSize: 11, letterSpacing: "0.2em" }}
								>
									Estado de mesas
								</h2>
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
												}}
											/>
											<span
												className="font-display text-ink-disabled"
												style={{ fontSize: 9, letterSpacing: "0.1em" }}
											>
												{label}
											</span>
										</div>
									))}
								</div>
							</div>
							<div className="flex flex-wrap gap-2 p-4">
								{tables.map((t) => (
									<Link
										key={t.id}
										href={`/pos/salon/${t.id}`}
										style={{ textDecoration: "none" }}
									>
										<div
											className="transition-all duration-150 hover:scale-105"
											style={{
												width: 52,
												height: 52,
												borderRadius: 12,
												border: `2px solid ${tableColorMap[t.status] ?? "#333"}40`,
												background: `${tableColorMap[t.status] ?? "#333"}12`,
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
													fontSize: 18,
													color: tableColorMap[t.status] ?? "#555",
													lineHeight: 1,
												}}
											>
												{t.number}
											</span>
											<span style={{ fontSize: 9 }}>
												{t.type === "pool" ? "🎱" : "🍺"}
											</span>
										</div>
									</Link>
								))}
							</div>
						</div>

						{/* Stock alerts */}
						<div className="card overflow-hidden">
							<div className="flex items-center justify-between px-5 py-4 border-b border-[var(--s3)]">
								<h2
									className="font-display text-ink-primary uppercase flex items-center gap-2"
									style={{ fontSize: 11, letterSpacing: "0.2em" }}
								>
									<AlertTriangle
										size={12}
										style={{
											color: lowStock.length > 0 ? "#ef4444" : "#555",
										}}
									/>
									Stock bajo
								</h2>
								{lowStock.length > 0 && (
									<span className="badge badge-cancelled">
										{lowStock.length} alertas
									</span>
								)}
							</div>
							<div style={{ maxHeight: 180, overflowY: "auto" }}>
								{lowStock.length === 0 ? (
									<div
										className="text-center py-6 font-body"
										style={{ fontSize: 12, color: "#10b981" }}
									>
										Todo en orden ✓
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
													flexShrink: 0,
												}}
											/>
											<span
												className="font-body text-ink-secondary flex-1"
												style={{ fontSize: 13 }}
											>
												{ing.name}
											</span>
											<span
												className="font-kds"
												style={{ fontSize: 14, color: "#ef4444" }}
											>
												{ing.stockCurrent} {ing.unit}
											</span>
											<span
												className="font-body text-ink-disabled"
												style={{ fontSize: 11 }}
											>
												/ {ing.alertThreshold}
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
