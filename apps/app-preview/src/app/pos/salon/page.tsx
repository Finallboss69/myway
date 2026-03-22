"use client";

import { useState } from "react";
import Link from "next/link";
import {
	LayoutGrid,
	ListOrdered,
	LogOut,
	Plus,
	TrendingUp,
	Clock,
	Users,
	ChevronRight,
} from "lucide-react";
import { ZONES, STAFF, formatCurrency, elapsedMinutes } from "@/data/mock";
import { useAppStore, type Table, type Order } from "@/store/useAppStore";

const cashier = STAFF.find((s) => s.id === "s1")!;

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function POSSidebar({ activePath }: { activePath: string }) {
	return (
		<nav className="sidebar" style={{ width: 220 }}>
			{/* Logo */}
			<div
				style={{
					padding: "22px 20px 18px",
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<div
					className="font-kds text-brand-500"
					style={{ fontSize: 26, letterSpacing: "0.2em", lineHeight: 1 }}
				>
					MY WAY
				</div>
				<div
					className="font-display text-ink-disabled uppercase"
					style={{ fontSize: 9, letterSpacing: "0.35em", marginTop: 3 }}
				>
					Punto de Venta
				</div>
			</div>

			{/* Nav */}
			<div className="flex flex-col gap-0.5 p-2 flex-1 mt-1">
				<Link
					href="/pos/salon"
					className={`sidebar-item ${activePath === "salon" ? "active" : ""}`}
				>
					<LayoutGrid size={15} />
					Salón
				</Link>
				<Link
					href="/pos/orders"
					className={`sidebar-item ${activePath === "orders" ? "active" : ""}`}
				>
					<ListOrdered size={15} />
					Pedidos
				</Link>
			</div>

			{/* Staff + logout */}
			<div style={{ padding: "14px 16px", borderTop: "1px solid var(--s3)" }}>
				<div className="flex items-center gap-2 mb-3">
					<div
						style={{
							width: 32,
							height: 32,
							borderRadius: "50%",
							background: "#f59e0b",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontFamily: "var(--font-syne)",
							fontWeight: 700,
							fontSize: 10,
							color: "#080808",
							flexShrink: 0,
						}}
					>
						{cashier.avatar}
					</div>
					<div>
						<div
							className="font-display text-ink-primary"
							style={{ fontSize: 11, fontWeight: 600 }}
						>
							{cashier.name}
						</div>
						<div
							className="text-ink-disabled font-body"
							style={{ fontSize: 10, textTransform: "capitalize" }}
						>
							Cajero
						</div>
					</div>
				</div>
				<Link
					href="/pos"
					className="sidebar-item"
					style={{ padding: "8px 10px", fontSize: 10 }}
				>
					<LogOut size={13} />
					Cerrar sesión
				</Link>
			</div>
		</nav>
	);
}

// ─── Table box ───────────────────────────────────────────────────────────────

function TableBox({
	table,
	order,
}: {
	table: Table;
	order?: { createdAt: Date };
}) {
	const elapsed = order ? elapsedMinutes(order.createdAt) : 0;
	const isPool = table.type === "pool";

	return (
		<Link href={`/pos/salon/${table.id}`} style={{ textDecoration: "none" }}>
			<div
				className={`table-box ${table.status}`}
				style={{
					position: "absolute",
					left: table.x,
					top: table.y,
					width: table.w,
					height: table.h,
					borderRadius: isPool ? 8 : 10,
					...(table.status === "occupied"
						? {
								boxShadow:
									"0 0 16px rgba(245,158,11,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
							}
						: {
								boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
							}),
					gap: 2,
					padding: "6px 4px",
				}}
			>
				{/* Table number */}
				<div
					style={{
						fontFamily: "var(--font-bebas)",
						fontSize: isPool ? 28 : 24,
						lineHeight: 1,
						color:
							table.status === "available"
								? "#10b981"
								: table.status === "occupied"
									? "#f59e0b"
									: "#8b5cf6",
						letterSpacing: "0.05em",
					}}
				>
					{table.number}
				</div>

				{/* Type + elapsed */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 3,
						flexWrap: "nowrap",
					}}
				>
					<span style={{ fontSize: 10 }}>{isPool ? "🎱" : "🍺"}</span>
					{table.status === "occupied" && elapsed > 0 && (
						<span
							style={{
								fontFamily: "var(--font-dm-sans)",
								fontSize: 10,
								color: "#fbbf24",
							}}
						>
							{elapsed}m
						</span>
					)}
					{table.status === "reserved" && (
						<span
							style={{
								fontFamily: "var(--font-syne)",
								fontSize: 8,
								color: "#a78bfa",
								letterSpacing: "0.06em",
							}}
						>
							RES
						</span>
					)}
				</div>

				{/* Seats */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 2,
						color: "#444",
						fontSize: 10,
					}}
				>
					<Users size={8} />
					<span style={{ fontFamily: "var(--font-dm-sans)" }}>
						{table.seats}
					</span>
				</div>

				{/* Status dot */}
				<div
					style={{
						position: "absolute",
						top: 6,
						right: 6,
						width: 6,
						height: 6,
						borderRadius: "50%",
					}}
					className={`dot-${table.status}`}
				/>
			</div>
		</Link>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalonPage() {
	const [activeZone, setActiveZone] = useState("z1");
	const tables = useAppStore((s) => s.tables);
	const orders = useAppStore((s) => s.orders);
	const todayRevenue = useAppStore((s) => s.todayRevenue);
	const todayOrderCount = useAppStore((s) => s.todayOrderCount);
	
	const activeOrders = orders.filter(o => o.status !== "closed" && o.status !== "cancelled");
	const zoneTables = tables.filter((t) => t.zoneId === activeZone);

	const available = tables.filter((t) => t.status === "available").length;
	const occupied = tables.filter((t) => t.status === "occupied").length;
	const reserved = tables.filter((t) => t.status === "reserved").length;

	const avgTicket =
		todayOrderCount > 0 ? Math.round(todayRevenue / todayOrderCount) : 0;

	// Find order for a table
	const getTableOrder = (tableId: string) =>
		orders.find((o) => o.tableId === tableId && o.status !== "closed");

	return (
		<div className="min-h-screen bg-surface-0" style={{ display: "flex" }}>
			<POSSidebar activePath="salon" />

			{/* Main content */}
			<div
				className="flex flex-col"
				style={{ marginLeft: 220, flex: 1, minHeight: "100vh" }}
			>
				{/* Top bar */}
				<header
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "0 24px",
						height: 60,
						borderBottom: "1px solid var(--s3)",
						background: "var(--s1)",
						position: "sticky",
						top: 0,
						zIndex: 20,
					}}
				>
					{/* Zone tabs */}
					<div className="flex items-center gap-0">
						{ZONES.map((zone) => (
							<button
								key={zone.id}
								onClick={() => setActiveZone(zone.id)}
								style={{
									padding: "0 18px",
									height: 60,
									border: "none",
									background: "transparent",
									cursor: "pointer",
									fontFamily: "var(--font-syne)",
									fontWeight: 600,
									fontSize: 11,
									letterSpacing: "0.18em",
									textTransform: "uppercase",
									color: activeZone === zone.id ? "#f59e0b" : "#6b6b6b",
									position: "relative",
									transition: "color 0.15s",
								}}
							>
								{zone.name}
								{activeZone === zone.id && (
									<div
										style={{
											position: "absolute",
											bottom: 0,
											left: 0,
											right: 0,
											height: 2,
											background: "#f59e0b",
											borderRadius: "2px 2px 0 0",
											boxShadow: "0 0 8px rgba(245,158,11,0.6)",
										}}
									/>
								)}
							</button>
						))}
					</div>

					{/* Status stats */}
					<div className="flex items-center gap-5">
						{[
							{
								label: "Disponibles",
								value: available,
								color: "#10b981",
								dotClass: "dot-available",
							},
							{
								label: "Ocupadas",
								value: occupied,
								color: "#f59e0b",
								dotClass: "dot-occupied",
							},
							{
								label: "Reservadas",
								value: reserved,
								color: "#8b5cf6",
								dotClass: "dot-reserved",
							},
						].map((stat) => (
							<div key={stat.label} className="flex items-center gap-2">
								<div
									style={{
										width: 7,
										height: 7,
										borderRadius: "50%",
									}}
									className={stat.dotClass}
								/>
								<span
									className="font-display text-ink-tertiary uppercase"
									style={{ fontSize: 10, letterSpacing: "0.15em" }}
								>
									{stat.label}
								</span>
								<span
									className="font-kds"
									style={{ fontSize: 18, color: stat.color, lineHeight: 1 }}
								>
									{stat.value}
								</span>
							</div>
						))}
					</div>
				</header>

				{/* Body */}
				<div className="flex flex-1" style={{ gap: 0 }}>
					{/* Floor map area */}
					<div
						className="flex flex-col gap-5"
						style={{ flex: 1, padding: "24px" }}
					>
						<div className="flex items-center justify-between">
							<div
								className="font-display text-ink-tertiary uppercase tracking-widest"
								style={{ fontSize: 10, letterSpacing: "0.3em" }}
							>
								{ZONES.find((z) => z.id === activeZone)?.name} — Plano de mesas
							</div>
							<div className="flex items-center gap-2">
								{/* Legend */}
								{[
									{ label: "Libre", color: "#10b981" },
									{ label: "Ocupada", color: "#f59e0b" },
									{ label: "Reservada", color: "#8b5cf6" },
								].map((l) => (
									<span
										key={l.label}
										className="flex items-center gap-1.5"
										style={{
											fontSize: 10,
											color: "#6b6b6b",
											fontFamily: "var(--font-syne)",
											letterSpacing: "0.1em",
										}}
									>
										<span
											style={{
												width: 7,
												height: 7,
												borderRadius: "50%",
												background: l.color,
												display: "inline-block",
												boxShadow: `0 0 5px ${l.color}80`,
											}}
										/>
										{l.label}
									</span>
								))}
							</div>
						</div>

						{/* Map container */}
						<div
							className="animate-fade-in"
							style={{
								position: "relative",
								width: "100%",
								height: 400,
								background:
									"repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.013) 39px, rgba(255,255,255,0.013) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.013) 39px, rgba(255,255,255,0.013) 40px), var(--s1)",
								borderRadius: 16,
								border: "1px solid var(--s3)",
								overflow: "hidden",
								boxShadow:
									"0 0 0 1px rgba(255,255,255,0.02) inset, 0 8px 32px rgba(0,0,0,0.4)",
							}}
						>
							{/* Watermark */}
							<div
								style={{
									position: "absolute",
									bottom: 12,
									right: 16,
									fontFamily: "var(--font-syne)",
									fontSize: 10,
									color: "#1e1e1e",
									letterSpacing: "0.35em",
									textTransform: "uppercase",
									userSelect: "none",
									pointerEvents: "none",
								}}
							>
								PLANO
							</div>

							{zoneTables.map((table) => (
								<TableBox
									key={table.id}
									table={table}
									order={getTableOrder(table.id)}
								/>
							))}
						</div>

						{/* Quick actions */}
						<div className="flex items-center gap-3">
							<button
								className="btn-primary"
								style={{
									paddingTop: 13,
									paddingBottom: 13,
									paddingLeft: 20,
									paddingRight: 20,
								}}
								onClick={() => {}}
							>
								<Plus size={15} />
								Nueva Mesa
							</button>
							<Link
								href="/pos/orders"
								className="btn-secondary"
								style={{
									paddingTop: 12,
									paddingBottom: 12,
									paddingLeft: 20,
									paddingRight: 20,
									textDecoration: "none",
								}}
							>
								<ListOrdered size={15} />
								Ver Pedidos
								{activeOrders.length > 0 && (
									<span
										style={{
											background: "#f59e0b",
											color: "#080808",
											fontFamily: "var(--font-syne)",
											fontWeight: 700,
											fontSize: 10,
											borderRadius: "99px",
											padding: "1px 7px",
											marginLeft: 4,
										}}
									>
										{activeOrders.length}
									</span>
								)}
							</Link>
						</div>
					</div>

					{/* Right panel */}
					<aside
						style={{
							width: 280,
							borderLeft: "1px solid var(--s3)",
							background: "var(--s1)",
							display: "flex",
							flexDirection: "column",
							gap: 0,
							overflow: "hidden",
						}}
					>
						{/* Revenue block */}
						<div
							style={{
								padding: "22px 20px 18px",
								borderBottom: "1px solid var(--s3)",
							}}
						>
							<div className="flex items-center gap-2 mb-3">
								<TrendingUp size={13} className="text-ink-disabled" />
								<span
									className="font-display text-ink-disabled uppercase tracking-widest"
									style={{ fontSize: 9, letterSpacing: "0.3em" }}
								>
									Ingresos hoy
								</span>
							</div>
							<div
								className="font-kds text-brand-500"
								style={{
									fontSize: 36,
									lineHeight: 1,
									textShadow: "0 0 20px rgba(245,158,11,0.25)",
								}}
							>
								{formatCurrency(todayRevenue)}
							</div>
							<div
								className="font-body text-ink-tertiary mt-1.5"
								style={{ fontSize: 11 }}
							>
								{todayOrderCount} pedidos hoy ·{" "}
								<span className="text-ink-secondary">
									ticket {formatCurrency(avgTicket)}
								</span>
							</div>
						</div>

						{/* Active orders */}
						<div
							style={{
								padding: "16px 16px 8px",
								borderBottom: "1px solid var(--s3)",
							}}
						>
							<div
								className="font-display text-ink-disabled uppercase tracking-widest mb-3 flex items-center justify-between"
								style={{ fontSize: 9, letterSpacing: "0.3em" }}
							>
								<span>Pedidos activos</span>
								{activeOrders.length > 0 && (
									<span
										style={{
											background: "rgba(245,158,11,0.15)",
											color: "#f59e0b",
											border: "1px solid rgba(245,158,11,0.25)",
											fontFamily: "var(--font-syne)",
											fontWeight: 700,
											fontSize: 9,
											borderRadius: "99px",
											padding: "1px 7px",
											letterSpacing: "0.08em",
										}}
									>
										{activeOrders.length}
									</span>
								)}
							</div>
						</div>

						<div
							className="flex flex-col gap-0 overflow-y-auto"
							style={{ flex: 1, padding: "8px 10px" }}
						>
							{activeOrders.length === 0 ? (
								<div
									className="flex flex-col items-center justify-center text-center py-8"
									style={{ color: "#444" }}
								>
									<div style={{ fontSize: 28, marginBottom: 8 }}>🍹</div>
									<div
										className="font-display uppercase"
										style={{ fontSize: 10, letterSpacing: "0.2em" }}
									>
										Sin pedidos activos
									</div>
								</div>
							) : (
								activeOrders.map((order) => {
									const borderColor =
										order.status === "preparing"
											? "#3b82f6"
											: order.status === "ready"
												? "#10b981"
												: "#f59e0b";
									const elapsed = elapsedMinutes(order.createdAt);
									const orderTotal = order.items.reduce(
										(s, i) => s + i.qty * i.price,
										0,
									);
									return (
										<Link
											key={order.id}
											href={`/pos/salon/${order.tableId}`}
											style={{ textDecoration: "none" }}
										>
											<div
												className="rounded-xl mb-1.5 transition-all"
												style={{
													padding: "10px 12px",
													background: "var(--s2)",
													border: "1px solid var(--s3)",
													borderLeft: `3px solid ${borderColor}`,
													cursor: "pointer",
												}}
												onMouseEnter={(e) => {
													(e.currentTarget as HTMLDivElement).style.background =
														"var(--s3)";
												}}
												onMouseLeave={(e) => {
													(e.currentTarget as HTMLDivElement).style.background =
														"var(--s2)";
												}}
											>
												<div className="flex items-center justify-between mb-1">
													<div className="flex items-center gap-2">
														<span
															className="font-kds text-ink-primary"
															style={{ fontSize: 20, lineHeight: 1 }}
														>
															Mesa {order.tableNumber}
														</span>
													</div>
													<div className="flex items-center gap-1.5">
														<Clock size={10} style={{ color: "#6b6b6b" }} />
														<span
															className="font-kds"
															style={{
																fontSize: 14,
																color:
																	elapsed > 20
																		? "#ef4444"
																		: elapsed > 10
																			? "#f59e0b"
																			: "#6b6b6b",
															}}
														>
															{elapsed}m
														</span>
													</div>
												</div>
												<div className="flex items-center justify-between">
													<span
														className="font-body text-ink-tertiary"
														style={{ fontSize: 11 }}
													>
														{order.items.length} ítem
														{order.items.length !== 1 ? "s" : ""}
													</span>
													<div className="flex items-center gap-2">
														<span
															className="font-kds text-brand-500"
															style={{ fontSize: 14 }}
														>
															{formatCurrency(orderTotal)}
														</span>
														<ChevronRight size={12} style={{ color: "#444" }} />
													</div>
												</div>
											</div>
										</Link>
									);
								})
							)}
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
}
