"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Clock,
	LayoutGrid,
	ListOrdered,
	LogOut,
	ChevronRight,
	Layers,
	TrendingUp,
	ReceiptText,
} from "lucide-react";
import { ZONES, STAFF, formatCurrency, elapsedMinutes } from "@/data/mock";
import { useAppStore, type Order } from "@/store/useAppStore";

const cashier = STAFF.find((s) => s.id === "s1")!;

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function POSSidebar({ activePath }: { activePath: string }) {
	return (
		<nav className="sidebar" style={{ width: 220 }}>
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

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
	pending: "#f59e0b",
	preparing: "#3b82f6",
	ready: "#10b981",
	delivered: "#6b7280",
	cancelled: "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
	pending: "Pendiente",
	preparing: "Preparando",
	ready: "Listo",
	delivered: "Entregado",
	cancelled: "Cancelado",
};

const ORDER_STATUS_BORDER: Record<string, string> = {
	pending: "#f59e0b",
	preparing: "#3b82f6",
	ready: "#10b981",
	closed: "#333",
	cancelled: "#ef4444",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
	pending: "Pendiente",
	preparing: "En preparación",
	ready: "Listo para entregar",
	closed: "Cerrado",
	cancelled: "Cancelado",
};

const FILTER_TABS = [
	{ key: "all", label: "Todos" },
	{ key: "pending", label: "Pendiente" },
	{ key: "preparing", label: "Preparando" },
	{ key: "ready", label: "Listo" },
];

// ─── Item status pill ─────────────────────────────────────────────────────────

function ItemStatusPill({ status }: { status: string }) {
	const color = STATUS_COLOR[status] ?? "#6b7280";
	return (
		<span
			className="font-display uppercase rounded-full"
			style={{
				fontSize: 9,
				padding: "2px 8px",
				letterSpacing: "0.15em",
				color,
				background: `${color}18`,
				border: `1px solid ${color}30`,
				whiteSpace: "nowrap",
			}}
		>
			{STATUS_LABEL[status] ?? status}
		</span>
	);
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
	const elapsed = elapsedMinutes(order.createdAt);
	const orderTotal = order.items.reduce((s, i) => s + i.qty * i.price, 0);
	const borderColor = ORDER_STATUS_BORDER[order.status] ?? "#333";

	const allReady = order.items.every(
		(i) =>
			i.status === "ready" ||
			i.status === "delivered" ||
			i.status === "cancelled",
	);
	const hasReady = order.items.some((i) => i.status === "ready");
	const zone = ZONES.find((z) => z.id === order.zoneId);

	const urgencyRing =
		elapsed > 25 ? "ring-urgent" : elapsed > 15 ? "ring-warning" : "";

	return (
		<div
			className={`card animate-slide-up ${urgencyRing}`}
			style={{
				borderLeft: `3px solid ${borderColor}`,
				overflow: "hidden",
			}}
		>
			{/* Card header */}
			<div
				className="flex items-center justify-between"
				style={{ padding: "14px 18px 12px" }}
			>
				<div className="flex items-center gap-3">
					{/* Table number */}
					<div
						className="font-kds text-ink-primary"
						style={{ fontSize: 36, lineHeight: 1 }}
					>
						{order.tableNumber}
					</div>
					<div>
						<div className="flex items-center gap-2 flex-wrap">
							<span
								className="font-display text-ink-secondary uppercase"
								style={{ fontSize: 11, letterSpacing: "0.12em" }}
							>
								Mesa {order.tableNumber}
							</span>
							{zone && (
								<span
									className="font-body text-ink-tertiary"
									style={{ fontSize: 11 }}
								>
									· {zone.name}
								</span>
							)}
							{allReady && (
								<span
									className="font-display uppercase rounded-full"
									style={{
										fontSize: 9,
										padding: "2px 8px",
										letterSpacing: "0.15em",
										color: "#34d399",
										background: "rgba(16,185,129,0.12)",
										border: "1px solid rgba(16,185,129,0.3)",
									}}
								>
									Todo listo
								</span>
							)}
						</div>
						<div className="flex items-center gap-2 mt-0.5">
							<Clock
								size={11}
								style={{
									color:
										elapsed > 20
											? "#ef4444"
											: elapsed > 10
												? "#f59e0b"
												: "#6b6b6b",
								}}
							/>
							<span
								className="font-body text-ink-tertiary"
								style={{ fontSize: 11 }}
							>
								<span
									style={{
										color:
											elapsed > 20
												? "#f87171"
												: elapsed > 10
													? "#fbbf24"
													: "#6b6b6b",
										fontFamily: "var(--font-bebas)",
										fontSize: 15,
									}}
								>
									{elapsed}m
								</span>{" "}
								· {order.items.length} ítem
								{order.items.length !== 1 ? "s" : ""}
								{order.waiterName && (
									<span className="text-ink-disabled">
										{" "}
										· {order.waiterName}
									</span>
								)}
							</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3">
					{/* Order status badge */}
					<span
						className="font-display uppercase rounded-full"
						style={{
							fontSize: 9,
							padding: "4px 11px",
							letterSpacing: "0.12em",
							color: borderColor,
							background: `${borderColor}12`,
							border: `1px solid ${borderColor}30`,
						}}
					>
						{ORDER_STATUS_LABEL[order.status] ?? order.status}
					</span>

					{/* Total */}
					<div className="text-right">
						<div
							className="font-kds text-brand-500"
							style={{ fontSize: 24, lineHeight: 1 }}
						>
							{formatCurrency(orderTotal)}
						</div>
					</div>

					{/* Navigate */}
					<Link
						href={`/pos/salon/${order.tableId}`}
						style={{ textDecoration: "none" }}
					>
						<div
							className="font-display uppercase rounded-lg flex items-center gap-1.5 transition-all"
							style={{
								fontSize: 9,
								padding: "7px 11px",
								color: "#6b6b6b",
								background: "var(--s3)",
								border: "1px solid var(--s4)",
								cursor: "pointer",
								letterSpacing: "0.12em",
							}}
							onMouseEnter={(e) => {
								const el = e.currentTarget as HTMLDivElement;
								el.style.color = "#f59e0b";
								el.style.borderColor = "rgba(245,158,11,0.35)";
								el.style.background = "rgba(245,158,11,0.08)";
							}}
							onMouseLeave={(e) => {
								const el = e.currentTarget as HTMLDivElement;
								el.style.color = "#6b6b6b";
								el.style.borderColor = "var(--s4)";
								el.style.background = "var(--s3)";
							}}
						>
							Ver mesa
							<ChevronRight size={12} />
						</div>
					</Link>
				</div>
			</div>

			{/* Items list */}
			<div style={{ borderTop: "1px solid var(--s3)" }}>
				{order.items.map((item, idx) => (
					<div
						key={item.id}
						className="flex items-center gap-3"
						style={{
							padding: "10px 18px",
							borderBottom:
								idx < order.items.length - 1 ? "1px solid var(--s2)" : "none",
							background:
								item.status === "ready"
									? "rgba(16,185,129,0.03)"
									: "transparent",
						}}
					>
						{/* Status dot */}
						<div
							style={{
								width: 7,
								height: 7,
								borderRadius: "50%",
								background: STATUS_COLOR[item.status] ?? "#6b7280",
								boxShadow: `0 0 5px ${STATUS_COLOR[item.status] ?? "#6b7280"}70`,
								flexShrink: 0,
							}}
						/>

						{/* Target */}
						<span style={{ fontSize: 13, flexShrink: 0 }}>
							{item.target === "kitchen" ? "🍳" : "🍹"}
						</span>

						{/* Name */}
						<div className="flex-1 min-w-0">
							<span
								className={`font-body ${item.isPoolChip ? "pool-chip-badge" : "text-ink-secondary"}`}
								style={{ fontSize: 12, fontWeight: 500 }}
							>
								{item.qty}× {item.name}
							</span>
						</div>

						{/* Status pill */}
						<ItemStatusPill status={item.status} />

						{/* Price */}
						<span
							className="font-body text-ink-tertiary"
							style={{ fontSize: 11, minWidth: 68, textAlign: "right" }}
						>
							{formatCurrency(item.qty * item.price)}
						</span>
					</div>
				))}
			</div>

			{/* Footer hint if some items ready */}
			{hasReady && !allReady && (
				<div
					className="flex items-center gap-2"
					style={{
						padding: "8px 18px",
						background: "rgba(16,185,129,0.05)",
						borderTop: "1px solid rgba(16,185,129,0.12)",
					}}
				>
					<div
						className="dot-ready"
						style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0 }}
					/>
					<span
						className="font-display uppercase"
						style={{
							fontSize: 9,
							color: "#34d399",
							letterSpacing: "0.18em",
						}}
					>
						Hay ítems listos para entregar
					</span>
				</div>
			)}
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
	const [activeFilter, setActiveFilter] = useState("all");
		const orders = useAppStore((s) => s.orders);
	const todayRevenue = useAppStore((s) => s.todayRevenue);
	const todayOrderCount = useAppStore((s) => s.todayOrderCount);

	const allActive = orders.filter(o => o.status !== "closed" && o.status !== "cancelled");

	const filtered =
		activeFilter === "all"
			? allActive
			: allActive.filter((o) => o.status === activeFilter);

	const pendingCount = allActive.filter((o) => o.status === "pending").length;
	const preparingCount = allActive.filter(
		(o) => o.status === "preparing",
	).length;
	const readyCount = allActive.filter((o) => o.status === "ready").length;

	const totalValue = allActive.reduce(
		(sum, o) => sum + o.items.reduce((s, i) => s + i.qty * i.price, 0),
		0,
	);
	const avgTicket =
		allActive.length > 0 ? Math.round(totalValue / allActive.length) : 0;

	const itemsReady = allActive
		.flatMap((o) => o.items)
		.filter((i) => i.status === "ready").length;

	return (
		<div className="min-h-screen bg-surface-0" style={{ display: "flex" }}>
			<POSSidebar activePath="orders" />

			<div
				className="flex flex-col"
				style={{ marginLeft: 220, flex: 1, minHeight: "100vh" }}
			>
				{/* Header */}
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
					<div className="flex items-center gap-3">
						<ReceiptText size={16} className="text-ink-tertiary" />
						<div
							className="font-display text-ink-primary uppercase tracking-widest"
							style={{ fontSize: 13, letterSpacing: "0.2em" }}
						>
							Pedidos Activos
						</div>
						{allActive.length > 0 && (
							<span
								style={{
									background: "rgba(245,158,11,0.15)",
									color: "#f59e0b",
									border: "1px solid rgba(245,158,11,0.3)",
									fontFamily: "var(--font-syne)",
									fontWeight: 700,
									fontSize: 10,
									borderRadius: "99px",
									padding: "2px 9px",
									letterSpacing: "0.08em",
								}}
							>
								{allActive.length}
							</span>
						)}
					</div>
					<div
						className="font-kds text-ink-disabled"
						style={{ fontSize: 18, letterSpacing: "0.05em" }}
					>
						{new Date().toLocaleTimeString("es-AR", {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</div>
				</header>

				<div className="flex flex-col gap-5" style={{ padding: "24px" }}>
					{/* Summary stats */}
					<div
						className="grid gap-3"
						style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
					>
						{[
							{
								label: "Activos ahora",
								value: allActive.length,
								color: "#f5f5f5",
								sub: `${pendingCount} pend · ${preparingCount} prep`,
								icon: <Layers size={14} />,
							},
							{
								label: "Listos para entregar",
								value: readyCount,
								color: "#10b981",
								sub: `${itemsReady} ítem${itemsReady !== 1 ? "s" : ""} listos`,
								icon: <span style={{ fontSize: 14 }}>✅</span>,
							},
							{
								label: "Valor en mesa",
								value: formatCurrency(totalValue),
								color: "#f59e0b",
								sub: `ticket prom. ${formatCurrency(avgTicket)}`,
								isAmount: true,
								icon: <TrendingUp size={14} />,
							},
							{
								label: "Ingresos hoy",
								value: formatCurrency(todayRevenue),
								color: "#f59e0b",
								sub: `${todayOrderCount} pedidos cerrados`,
								isAmount: true,
								icon: <TrendingUp size={14} />,
							},
						].map((stat) => (
							<div
								key={stat.label}
								className="card"
								style={{ padding: "16px 18px" }}
							>
								<div className="flex items-center gap-2 mb-2">
									<span style={{ color: "#444" }}>{stat.icon}</span>
									<div
										className="font-display text-ink-disabled uppercase tracking-widest"
										style={{ fontSize: 9, letterSpacing: "0.22em" }}
									>
										{stat.label}
									</div>
								</div>
								<div
									className="font-kds"
									style={{
										fontSize: stat.isAmount ? 20 : 38,
										lineHeight: 1,
										color: stat.color,
										textShadow:
											stat.color === "#f59e0b"
												? "0 0 16px rgba(245,158,11,0.2)"
												: undefined,
									}}
								>
									{stat.value}
								</div>
								<div
									className="text-ink-tertiary font-body mt-1"
									style={{ fontSize: 11 }}
								>
									{stat.sub}
								</div>
							</div>
						))}
					</div>

					{/* Filter tabs */}
					<div
						className="flex items-center"
						style={{ borderBottom: "1px solid var(--s3)" }}
					>
						{FILTER_TABS.map((tab) => {
							const isActive = activeFilter === tab.key;
							const count =
								tab.key === "all"
									? allActive.length
									: allActive.filter((o) => o.status === tab.key).length;
							return (
								<button
									key={tab.key}
									onClick={() => setActiveFilter(tab.key)}
									style={{
										padding: "0 20px",
										height: 46,
										border: "none",
										background: "transparent",
										cursor: "pointer",
										fontFamily: "var(--font-syne)",
										fontWeight: 600,
										fontSize: 11,
										letterSpacing: "0.18em",
										textTransform: "uppercase",
										color: isActive ? "#f59e0b" : "#6b6b6b",
										position: "relative",
										transition: "color 0.15s",
										display: "flex",
										alignItems: "center",
										gap: 7,
									}}
								>
									{tab.label}
									{count > 0 && (
										<span
											style={{
												background: isActive
													? "#f59e0b"
													: "rgba(255,255,255,0.07)",
												color: isActive ? "#080808" : "#6b6b6b",
												fontFamily: "var(--font-syne)",
												fontWeight: 700,
												fontSize: 9,
												borderRadius: "99px",
												padding: "1px 6px",
												transition: "all 0.15s",
											}}
										>
											{count}
										</span>
									)}
									{isActive && (
										<div
											style={{
												position: "absolute",
												bottom: 0,
												left: 0,
												right: 0,
												height: 2,
												background: "#f59e0b",
												borderRadius: "2px 2px 0 0",
												boxShadow: "0 0 8px rgba(245,158,11,0.55)",
											}}
										/>
									)}
								</button>
							);
						})}
						<div style={{ flex: 1 }} />
						<div className="flex items-center gap-2 pb-0 pr-2">
							<Layers size={12} style={{ color: "#444" }} />
							<span
								className="font-body text-ink-tertiary"
								style={{ fontSize: 11 }}
							>
								{filtered.length} pedido{filtered.length !== 1 ? "s" : ""}
							</span>
						</div>
					</div>

					{/* Orders list */}
					<div className="flex flex-col gap-3">
						{filtered.length === 0 ? (
							<div
								className="card flex flex-col items-center justify-center py-16 text-center"
								style={{ minHeight: 200 }}
							>
								<div style={{ fontSize: 36, marginBottom: 12 }}>🍹</div>
								<div
									className="font-display uppercase text-ink-disabled tracking-widest"
									style={{ fontSize: 11, letterSpacing: "0.3em" }}
								>
									Sin pedidos{" "}
									{activeFilter !== "all"
										? ORDER_STATUS_LABEL[activeFilter]?.toLowerCase()
										: "activos"}
								</div>
								<div
									className="text-ink-disabled font-body mt-2"
									style={{ fontSize: 12 }}
								>
									Los nuevos pedidos aparecerán aquí en tiempo real
								</div>
							</div>
						) : (
							filtered.map((order) => (
								<OrderCard key={order.id} order={order} />
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
