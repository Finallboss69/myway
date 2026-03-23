"use client";

import { useState, useEffect, useCallback } from "react";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
import Link from "next/link";
import {
	AlertTriangle,
	Clock,
	ShoppingBag,
	BarChart3,
	CheckCircle2,
	Flame,
	Grid3X3,
	Package,
	ArrowUpRight,
	CircleDot,
} from "lucide-react";
import { formatCurrency, elapsedMinutes } from "@/lib/utils";
import type { Order, Table, Ingredient } from "@/lib/types";
import { apiFetch } from "@/lib/api";

/* ─── KPI Card ────────────────────────────────────────────────────────────── */

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
			{/* Top glow line */}
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
			{/* Corner gradient */}
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
				{/* Icon + Label row */}
				<div
					className="flex items-center justify-between"
					style={{ marginBottom: 16 }}
				>
					<div
						className="font-display uppercase"
						style={{
							fontSize: 10,
							letterSpacing: "0.2em",
							color: "#888",
							fontWeight: 600,
						}}
					>
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
				{/* Value */}
				<div
					className="font-kds"
					style={{
						fontSize: 36,
						lineHeight: 1,
						color,
						marginBottom: sub ? 6 : 0,
					}}
				>
					{value}
				</div>
				{sub && (
					<div className="font-body" style={{ fontSize: 11, color: "#666" }}>
						{sub}
					</div>
				)}
			</div>
		</div>
	);
}

/* ─── Status Badge ────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, { cls: string; label: string }> = {
		pending: { cls: "badge-pending", label: "Pendiente" },
		preparing: { cls: "badge-preparing", label: "Preparando" },
		ready: { cls: "badge-ready", label: "Listo" },
		delivered: { cls: "badge-delivered", label: "Entregado" },
	};
	const s = map[status] ?? { cls: "badge-pending", label: status };
	return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

/* ─── Section Card ────────────────────────────────────────────────────────── */

function SectionCard({
	title,
	icon: Icon,
	right,
	children,
	delay,
}: {
	title: string;
	icon: React.ElementType;
	right?: React.ReactNode;
	children: React.ReactNode;
	delay: number;
}) {
	return (
		<div
			style={{
				background: "var(--s1)",
				border: "1px solid var(--s4)",
				borderRadius: 16,
				overflow: "hidden",
				boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
				animation: `slideUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
			}}
		>
			{/* Header */}
			<div
				className="flex items-center justify-between"
				style={{
					padding: "14px 20px",
					borderBottom: "1px solid var(--s3)",
					background: "var(--s2)",
				}}
			>
				<div className="flex items-center gap-2.5">
					<Icon size={14} style={{ color: "var(--gold)" }} />
					<span
						className="font-display uppercase"
						style={{
							fontSize: 11,
							letterSpacing: "0.15em",
							color: "#ccc",
							fontWeight: 600,
						}}
					>
						{title}
					</span>
				</div>
				{right}
			</div>
			{children}
		</div>
	);
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

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

	const tableColor: Record<string, string> = {
		available: "#10b981",
		occupied: "#f59e0b",
		reserved: "#8b5cf6",
	};

	return (
		<div style={{ minHeight: "100vh", background: "var(--s0)" }}>
			<div
				style={{ padding: "28px 24px 48px", maxWidth: 1200, margin: "0 auto" }}
			>
				{/* ── Header ── */}
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
								Dashboard
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								Vista general del sistema
							</p>
							<HelpButton {...helpContent.dashboard} />
						</div>
					</div>
					<div
						className="flex items-center gap-2"
						style={{
							padding: "6px 14px",
							borderRadius: 20,
							background: "rgba(16,185,129,0.08)",
							border: "1px solid rgba(16,185,129,0.2)",
						}}
					>
						<div
							className="animate-pulse"
							style={{
								width: 6,
								height: 6,
								borderRadius: "50%",
								background: "#10b981",
								boxShadow: "0 0 8px #10b981",
							}}
						/>
						<span
							className="font-display"
							style={{ fontSize: 10, color: "#10b981", letterSpacing: "0.1em" }}
						>
							EN VIVO
						</span>
					</div>
				</div>

				<div className="divider-gold" style={{ marginBottom: 28 }} />

				{/* ── KPI Grid ── */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
						gap: 16,
						marginBottom: 28,
					}}
				>
					<KpiCard
						label="Pedidos activos"
						value={activeOrders.length}
						sub={`${orders.filter((o) => o.status === "preparing").length} preparando`}
						color="#3b82f6"
						icon={ShoppingBag}
						idx={0}
					/>
					<KpiCard
						label="Mesas ocupadas"
						value={`${occupiedTables} / ${tables.length}`}
						sub={`${tables.length - occupiedTables} disponibles`}
						color="#f59e0b"
						icon={Grid3X3}
						idx={1}
					/>
					<KpiCard
						label="Stock bajo"
						value={lowStock.length}
						sub={lowStock.length > 0 ? "Requieren atencion" : "Todo en orden"}
						color={lowStock.length > 0 ? "#ef4444" : "#10b981"}
						icon={AlertTriangle}
						idx={2}
					/>
					<KpiCard
						label="Ingresos activos"
						value={formatCurrency(totalRevenue)}
						sub="Pedidos abiertos"
						color="#10b981"
						icon={BarChart3}
						idx={3}
					/>
				</div>

				{/* ── Two Column Layout ── */}
				<div
					style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
				>
					{/* Left: Active Orders */}
					<SectionCard
						title="Pedidos activos"
						icon={Flame}
						delay={350}
						right={
							<span
								className="font-kds"
								style={{ fontSize: 20, color: "var(--gold)" }}
							>
								{activeOrders.length}
							</span>
						}
					>
						<div style={{ maxHeight: 400, overflowY: "auto" }}>
							{activeOrders.length === 0 ? (
								<div
									className="flex flex-col items-center justify-center"
									style={{ padding: "48px 20px" }}
								>
									<CheckCircle2
										size={32}
										style={{ color: "#333", marginBottom: 8 }}
									/>
									<span
										className="font-body"
										style={{ fontSize: 13, color: "#555" }}
									>
										Sin pedidos activos
									</span>
									<span
										className="font-body"
										style={{ fontSize: 11, color: "#444", marginTop: 2 }}
									>
										Los pedidos nuevos aparecen aqui
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
											className="flex items-center gap-3"
											style={{
												padding: "12px 20px",
												borderBottom: "1px solid var(--s3)",
												borderLeft: `3px solid ${sColor}`,
												cursor: "pointer",
												transition: "background 0.15s",
											}}
											onMouseEnter={(e) =>
												(e.currentTarget.style.background = "var(--s2)")
											}
											onMouseLeave={(e) =>
												(e.currentTarget.style.background = "transparent")
											}
										>
											<div style={{ flex: 1, minWidth: 0 }}>
												<div
													className="flex items-center gap-2"
													style={{ marginBottom: 2 }}
												>
													<span
														className="font-kds"
														style={{ fontSize: 16, color: "#f5f5f5" }}
													>
														Mesa {order.tableNumber}
													</span>
													<StatusBadge status={order.status} />
												</div>
												<span
													className="font-body"
													style={{ fontSize: 11, color: "#666" }}
												>
													{order.items.length} items
												</span>
											</div>
											<div
												className="flex items-center gap-1"
												style={{ flexShrink: 0 }}
											>
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
																	: "#666",
													}}
												>
													{elapsed}m
												</span>
											</div>
											<span
												className="font-kds"
												style={{
													fontSize: 15,
													color: "var(--gold)",
													minWidth: 80,
													textAlign: "right",
													flexShrink: 0,
												}}
											>
												{formatCurrency(total)}
											</span>
										</div>
									);
								})
							)}
						</div>
					</SectionCard>

					{/* Right column */}
					<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
						{/* Tables */}
						<SectionCard
							title="Mesas"
							icon={Grid3X3}
							delay={420}
							right={
								<div className="flex items-center gap-4">
									{(
										[
											["Libre", "#10b981"],
											["Ocupada", "#f59e0b"],
											["Reservada", "#8b5cf6"],
										] as const
									).map(([label, c]) => (
										<div key={label} className="flex items-center gap-1.5">
											<div
												style={{
													width: 7,
													height: 7,
													borderRadius: "50%",
													background: c,
													boxShadow: `0 0 6px ${c}60`,
												}}
											/>
											<span
												className="font-display"
												style={{
													fontSize: 9,
													color: "#888",
													letterSpacing: "0.08em",
												}}
											>
												{label}
											</span>
										</div>
									))}
								</div>
							}
						>
							<div
								style={{
									display: "flex",
									flexWrap: "wrap",
									gap: 10,
									padding: "16px 18px",
								}}
							>
								{tables.map((t) => {
									const c = tableColor[t.status] ?? "#444";
									return (
										<Link
											key={t.id}
											href={`/pos/salon/${t.id}`}
											style={{ textDecoration: "none" }}
										>
											<div
												style={{
													width: 56,
													height: 56,
													borderRadius: 12,
													border: `2px solid ${c}50`,
													background: `${c}10`,
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													justifyContent: "center",
													cursor: "pointer",
													transition: "all 0.15s",
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.transform = "scale(1.1)";
													e.currentTarget.style.boxShadow = `0 0 16px ${c}30`;
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.transform = "scale(1)";
													e.currentTarget.style.boxShadow = "none";
												}}
											>
												<span
													className="font-kds"
													style={{ fontSize: 20, color: c, lineHeight: 1 }}
												>
													{t.number}
												</span>
												<span
													className="font-display uppercase"
													style={{
														fontSize: 7,
														letterSpacing: "0.1em",
														color: `${c}90`,
														marginTop: 1,
													}}
												>
													{t.type === "pool" ? "POOL" : "BAR"}
												</span>
											</div>
										</Link>
									);
								})}
							</div>
						</SectionCard>

						{/* Stock Alerts */}
						<SectionCard
							title="Alertas de stock"
							icon={Package}
							delay={490}
							right={
								lowStock.length > 0 ? (
									<span
										className="font-display"
										style={{
											fontSize: 10,
											letterSpacing: "0.1em",
											padding: "3px 10px",
											borderRadius: 20,
											background: "rgba(239,68,68,0.12)",
											color: "#f87171",
											border: "1px solid rgba(239,68,68,0.25)",
										}}
									>
										{lowStock.length} ALERTA{lowStock.length > 1 ? "S" : ""}
									</span>
								) : undefined
							}
						>
							{lowStock.length === 0 ? (
								<div
									className="flex flex-col items-center justify-center"
									style={{ padding: "40px 20px" }}
								>
									<CheckCircle2
										size={28}
										style={{ color: "#10b981", marginBottom: 8 }}
									/>
									<span
										className="font-body"
										style={{ fontSize: 13, color: "#10b981" }}
									>
										Inventario en orden
									</span>
								</div>
							) : (
								<div>
									{lowStock.map((ing) => {
										const ratio = Math.min(
											ing.stockCurrent / Math.max(ing.alertThreshold, 1),
											1,
										);
										const barColor =
											ratio < 0.3
												? "#ef4444"
												: ratio < 0.6
													? "#f59e0b"
													: "#10b981";
										return (
											<div
												key={ing.id}
												className="flex items-center gap-3"
												style={{
													padding: "12px 20px",
													borderBottom: "1px solid var(--s3)",
													transition: "background 0.15s",
												}}
												onMouseEnter={(e) =>
													(e.currentTarget.style.background = "var(--s2)")
												}
												onMouseLeave={(e) =>
													(e.currentTarget.style.background = "transparent")
												}
											>
												<CircleDot
													size={10}
													style={{ color: barColor, flexShrink: 0 }}
												/>
												<span
													className="font-body"
													style={{ fontSize: 13, color: "#ccc", flex: 1 }}
												>
													{ing.name}
												</span>
												{/* Progress bar */}
												<div
													style={{
														width: 80,
														height: 5,
														borderRadius: 3,
														background: "var(--s3)",
														overflow: "hidden",
														flexShrink: 0,
													}}
												>
													<div
														style={{
															width: `${ratio * 100}%`,
															height: "100%",
															borderRadius: 3,
															background: barColor,
															boxShadow: `0 0 6px ${barColor}50`,
														}}
													/>
												</div>
												<span
													className="font-kds"
													style={{
														fontSize: 14,
														color: barColor,
														minWidth: 50,
														textAlign: "right",
														flexShrink: 0,
													}}
												>
													{ing.stockCurrent}
												</span>
												<span
													className="font-body"
													style={{ fontSize: 11, color: "#555", flexShrink: 0 }}
												>
													/ {ing.alertThreshold} {ing.unit}
												</span>
											</div>
										);
									})}
								</div>
							)}
						</SectionCard>
					</div>
				</div>

				{/* ── Quick Links ── */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
						gap: 12,
						marginTop: 24,
						animation: "slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 560ms both",
					}}
				>
					{[
						{
							href: "/admin/analytics",
							label: "Ver Analiticas",
							color: "#f59e0b",
						},
						{
							href: "/admin/cash-register",
							label: "Abrir Caja",
							color: "#10b981",
						},
						{
							href: "/admin/expenses",
							label: "Registrar Gasto",
							color: "#3b82f6",
						},
						{
							href: "/admin/invoices",
							label: "Nueva Factura",
							color: "#8b5cf6",
						},
					].map(({ href, label, color }) => (
						<Link
							key={href}
							href={href}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								padding: "14px 18px",
								borderRadius: 12,
								background: `${color}08`,
								border: `1px solid ${color}20`,
								textDecoration: "none",
								transition: "all 0.15s",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = `${color}15`;
								e.currentTarget.style.borderColor = `${color}40`;
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = `${color}08`;
								e.currentTarget.style.borderColor = `${color}20`;
							}}
						>
							<span
								className="font-display"
								style={{ fontSize: 12, color, fontWeight: 600 }}
							>
								{label}
							</span>
							<ArrowUpRight size={14} style={{ color }} />
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
