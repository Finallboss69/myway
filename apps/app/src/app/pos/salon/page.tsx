"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
	LayoutGrid,
	ListOrdered,
	LogOut,
	TrendingUp,
	Clock,
	Users,
	ChevronRight,
} from "lucide-react";
import { formatCurrency, elapsedMinutes } from "@/lib/utils";
import type { Table, Order, Zone } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function POSSidebar({
	activePath,
	staffName,
}: {
	activePath: string;
	staffName?: string;
}) {
	const displayName = staffName || "Cajero";
	const initials = displayName
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<nav
			className="sidebar top-accent"
			style={{ width: 240, position: "relative" }}
		>
			<div
				style={{
					padding: "24px 20px 18px",
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<img
					src="/logo.svg"
					alt="My Way"
					style={{
						height: 22,
						width: "auto",
						filter: "invert(1)",
						display: "block",
					}}
				/>
				<div
					className="font-display text-ink-disabled uppercase"
					style={{ fontSize: 9, letterSpacing: "0.35em", marginTop: 5 }}
				>
					Punto de Venta
				</div>
			</div>

			<div className="flex flex-col gap-0.5 p-2 flex-1 mt-1">
				<Link
					href="/pos/salon"
					className={`sidebar-item ${activePath === "salon" ? "active" : ""}`}
					style={
						activePath === "salon"
							? { borderLeft: "2px solid var(--gold)", paddingLeft: 14 }
							: {}
					}
				>
					<LayoutGrid size={15} />
					Salón
				</Link>
				<Link
					href="/pos/orders"
					className={`sidebar-item ${activePath === "orders" ? "active" : ""}`}
					style={
						activePath === "orders"
							? { borderLeft: "2px solid var(--gold)", paddingLeft: 14 }
							: {}
					}
				>
					<ListOrdered size={15} />
					Pedidos
				</Link>
			</div>

			<div
				style={{ padding: "12px 12px 16px", borderTop: "1px solid var(--s3)" }}
			>
				<div
					className="flex items-center gap-2.5 rounded-xl mb-2"
					style={{
						padding: "10px 12px",
						background: "var(--s2)",
						border: "1px solid var(--s3)",
					}}
				>
					<div
						className="flex items-center justify-center flex-shrink-0"
						style={{
							width: 34,
							height: 34,
							borderRadius: "50%",
							background: "rgba(245,158,11,0.15)",
							border: "1px solid rgba(245,158,11,0.3)",
						}}
					>
						<span
							className="font-kds text-brand-500"
							style={{ fontSize: 13, lineHeight: 1 }}
						>
							{initials}
						</span>
					</div>
					<div className="flex-1 min-w-0">
						<div
							className="font-display text-ink-primary truncate"
							style={{ fontSize: 12, fontWeight: 600 }}
						>
							{displayName}
						</div>
						<div
							className="font-body text-ink-tertiary"
							style={{ fontSize: 10 }}
						>
							Cajera
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

function TableBox({ table, order }: { table: Table; order?: Order }) {
	const elapsed = order ? elapsedMinutes(order.createdAt) : 0;
	const isPool = table.type === "pool";
	const isOccupied = table.status === "occupied";
	const isAvailable = table.status === "available";

	const glowColor = isOccupied
		? "rgba(245,158,11,0.35)"
		: isAvailable
			? "rgba(16,185,129,0.30)"
			: "rgba(139,92,246,0.25)";

	const borderColor = isOccupied
		? "rgba(245,158,11,0.55)"
		: isAvailable
			? "rgba(16,185,129,0.45)"
			: "rgba(139,92,246,0.45)";

	const numColor = isAvailable ? "#10b981" : isOccupied ? "#f59e0b" : "#8b5cf6";

	return (
		<Link href={`/pos/salon/${table.id}`} style={{ textDecoration: "none" }}>
			<div
				className={`table-box ${table.status}`}
				style={{
					position: "absolute",
					left: table.x,
					top: table.y,
					width: table.w,
					height: Math.max(table.h, 120),
					borderRadius: isPool ? 10 : 12,
					border: `2px solid ${borderColor}`,
					boxShadow: `0 0 18px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: "8px 6px",
					gap: 3,
					background: isOccupied
						? "rgba(245,158,11,0.06)"
						: isAvailable
							? "rgba(16,185,129,0.04)"
							: "rgba(139,92,246,0.04)",
				}}
			>
				{/* Status dot */}
				<div
					style={{
						position: "absolute",
						top: 7,
						right: 7,
						width: 8,
						height: 8,
						borderRadius: "50%",
					}}
					className={`dot-${table.status}`}
				/>

				{/* Table number — big and bold */}
				<div
					style={{
						fontFamily: "var(--font-bebas)",
						fontSize: isPool
							? Math.min(table.w * 0.45, 64)
							: Math.min(table.w * 0.5, 68),
						lineHeight: 0.9,
						color: numColor,
						letterSpacing: "0.04em",
						textShadow: `0 0 20px ${numColor}60`,
					}}
				>
					{table.number}
				</div>

				{/* Status label */}
				{isAvailable ? (
					<div
						style={{
							fontFamily: "var(--font-syne)",
							fontSize: 8,
							fontWeight: 700,
							letterSpacing: "0.22em",
							color: "#10b981",
							textTransform: "uppercase",
						}}
					>
						LIBRE
					</div>
				) : isOccupied && elapsed > 0 ? (
					<div
						style={{
							fontFamily: "var(--font-bebas)",
							fontSize: 16,
							lineHeight: 1,
							color: elapsed > 20 ? "#ef4444" : "#f59e0b",
							letterSpacing: "0.06em",
						}}
					>
						{elapsed}m
					</div>
				) : table.status === "reserved" ? (
					<div
						style={{
							fontFamily: "var(--font-syne)",
							fontSize: 8,
							fontWeight: 700,
							letterSpacing: "0.22em",
							color: "#a78bfa",
							textTransform: "uppercase",
						}}
					>
						RESERV.
					</div>
				) : null}

				{/* Seats */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 2,
						color: "#555",
						fontSize: 9,
					}}
				>
					<Users size={8} />
					<span style={{ fontFamily: "var(--font-dm-sans)" }}>
						{table.seats}
					</span>
				</div>
			</div>
		</Link>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalonPage() {
	const [activeZone, setActiveZone] = useState("");
	const [tables, setTables] = useState<Table[]>([]);
	const [zones, setZones] = useState<Zone[]>([]);
	const [orders, setOrders] = useState<Order[]>([]);
	const zoneInitialized = useRef(false);
	const [staffName, setStaffName] = useState<string>("");

	useEffect(() => {
		try {
			const stored = sessionStorage.getItem("pos-staff");
			if (stored) {
				const staff = JSON.parse(stored) as { name?: string };
				if (staff.name) setStaffName(staff.name);
			}
		} catch {
			/* ignore */
		}
	}, []);

	const fetchData = useCallback(async () => {
		try {
			const [t, z, o] = await Promise.all([
				apiFetch<Table[]>("/api/tables"),
				apiFetch<Zone[]>("/api/zones"),
				apiFetch<Order[]>("/api/orders"),
			]);
			setTables(t);
			setZones(z);
			setOrders(o);
			if (!zoneInitialized.current && z.length > 0) {
				setActiveZone(z[0].id);
				zoneInitialized.current = true;
			}
		} catch (e) {
			console.error(e);
		}
	}, []);

	useEffect(() => {
		fetchData();
		const id = setInterval(fetchData, 5000);
		return () => clearInterval(id);
	}, [fetchData]);

	const activeOrders = orders.filter(
		(o) => o.status !== "closed" && o.status !== "cancelled",
	);
	const zoneTables = tables.filter((t) => t.zoneId === activeZone);

	const available = tables.filter((t) => t.status === "available").length;
	const occupied = tables.filter((t) => t.status === "occupied").length;
	const reserved = tables.filter((t) => t.status === "reserved").length;

	const todayRevenue = orders
		.filter((o) => o.status === "closed")
		.reduce(
			(s, o) => s + o.items.reduce((si, i) => si + i.qty * i.price, 0),
			0,
		);
	const todayOrderCount = orders.filter((o) => o.status === "closed").length;
	const avgTicket =
		todayOrderCount > 0 ? Math.round(todayRevenue / todayOrderCount) : 0;

	const getTableOrder = (tableId: string) =>
		orders.find((o) => o.tableId === tableId && o.status !== "closed");

	return (
		<div
			className="min-h-screen bg-surface-0 noise-overlay"
			style={{ display: "flex" }}
		>
			<POSSidebar activePath="salon" staffName={staffName} />

			<div
				className="pos-main-content flex flex-col"
				style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}
			>
				<style>{`
        @media (max-width: 900px) {
          .pos-main-content { margin-left: 0 !important; }
          nav.sidebar { display: none; }
          .pos-right-panel { display: none; }
        }
        @media (max-width: 1100px) {
          .pos-right-panel { width: 220px !important; }
        }
      `}</style>

				{/* Top bar */}
				<header
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "0 24px",
						height: 64,
						borderBottom: "1px solid var(--s3)",
						background: "var(--s1)",
						position: "sticky",
						top: 0,
						zIndex: 20,
					}}
				>
					{/* Zone tab pills — bigger, bolder */}
					<div className="flex items-center gap-1">
						{zones.map((zone) => {
							const isActive = activeZone === zone.id;
							return (
								<button
									key={zone.id}
									onClick={() => setActiveZone(zone.id)}
									style={{
										padding: "0 20px",
										height: 64,
										border: "none",
										background: "transparent",
										cursor: "pointer",
										fontFamily: "var(--font-syne)",
										fontWeight: 700,
										fontSize: 12,
										letterSpacing: "0.2em",
										textTransform: "uppercase",
										color: isActive ? "#f59e0b" : "#6b6b6b",
										position: "relative",
										transition: "color 0.15s",
									}}
								>
									{zone.name}
									{isActive && (
										<div
											style={{
												position: "absolute",
												bottom: 0,
												left: 0,
												right: 0,
												height: 3,
												background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
												borderRadius: "2px 2px 0 0",
												boxShadow: "0 0 12px rgba(245,158,11,0.7)",
											}}
										/>
									)}
								</button>
							);
						})}
					</div>

					{/* Status stats — more prominent */}
					<div className="flex items-center gap-6">
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
										width: 8,
										height: 8,
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
									style={{
										fontSize: 24,
										color: stat.color,
										lineHeight: 1,
										textShadow: `0 0 12px ${stat.color}50`,
									}}
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
								{zones.find((z) => z.id === activeZone)?.name} — Plano de mesas
							</div>
							<div className="flex items-center gap-3">
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
												width: 8,
												height: 8,
												borderRadius: "50%",
												background: l.color,
												display: "inline-block",
												boxShadow: `0 0 6px ${l.color}90`,
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
								height: 420,
								background:
									"repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.013) 39px, rgba(255,255,255,0.013) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.013) 39px, rgba(255,255,255,0.013) 40px), var(--s1)",
								borderRadius: 16,
								border: "1px solid var(--s3)",
								overflow: "hidden",
								boxShadow:
									"0 0 0 1px rgba(255,255,255,0.02) inset, 0 8px 32px rgba(0,0,0,0.4)",
							}}
						>
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
							<Link
								href="/pos/orders"
								className="btn-secondary"
								style={{
									paddingTop: 13,
									paddingBottom: 13,
									paddingLeft: 22,
									paddingRight: 22,
									textDecoration: "none",
									fontSize: 13,
								}}
							>
								<ListOrdered size={16} />
								Ver Pedidos
								{activeOrders.length > 0 && (
									<span
										style={{
											background: "#f59e0b",
											color: "#080808",
											fontFamily: "var(--font-syne)",
											fontWeight: 700,
											fontSize: 11,
											borderRadius: "99px",
											padding: "2px 8px",
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
						className="pos-right-panel"
						style={{
							width: 290,
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
									fontSize: 40,
									lineHeight: 1,
									textShadow: "0 0 24px rgba(245,158,11,0.3)",
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
											border: "1px solid rgba(245,158,11,0.3)",
											fontFamily: "var(--font-syne)",
											fontWeight: 700,
											fontSize: 9,
											borderRadius: "99px",
											padding: "2px 8px",
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
												className="rounded-xl mb-2 transition-all"
												style={{
													padding: "12px 14px",
													background: "var(--s2)",
													border: `1px solid var(--s3)`,
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
												<div className="flex items-center justify-between mb-1.5">
													<div className="flex items-center gap-2">
														<span
															className="font-kds text-ink-primary"
															style={{ fontSize: 26, lineHeight: 1 }}
														>
															Mesa {order.tableNumber}
														</span>
													</div>
													<div className="flex items-center gap-1.5">
														<Clock size={10} style={{ color: "#6b6b6b" }} />
														<span
															className="font-kds"
															style={{
																fontSize: 16,
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
															style={{ fontSize: 15 }}
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

// Responsive overrides injected via style — keeps the sidebar collapsible on narrow viewports
// without touching the useRef/useCallback logic
