"use client";

import { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import {
	Clock,
	CheckCircle2,
	ArrowRight,
	Zap,
	AlertCircle,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Order, ItemStatus } from "@/store/useAppStore";
import { STAFF, PRODUCTS, elapsedMinutes } from "@/data/mock";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useLiveClock() {
	const [time, setTime] = useState("--:--:--");
	useEffect(() => {
		const fmt = () =>
			new Date().toLocaleTimeString("es-AR", {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			});
		setTime(fmt());
		const id = setInterval(() => setTime(fmt()), 1000);
		return () => clearInterval(id);
	}, []);
	return time;
}

function deriveItemStatus(order: Order): "pending" | "preparing" | "ready" {
	const items = order.items;
	if (
		items.every(
			(i) =>
				i.status === "ready" ||
				i.status === "delivered" ||
				i.status === "cancelled",
		)
	)
		return "ready";
	if (items.some((i) => i.status === "preparing")) return "preparing";
	return "pending";
}

function elapsedColor(mins: number): string {
	if (mins > 10) return "text-red-400";
	if (mins > 5) return "text-amber-400";
	return "text-emerald-400";
}

function elapsedBg(mins: number): string {
	if (mins > 10) return "bg-red-500/20 text-red-400 border-red-500/30";
	if (mins > 5) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
	return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
}

const poolChipProductIds = new Set(
	PRODUCTS.filter((p) => p.isPoolChip).map((p) => p.id),
);

function isPoolChipItem(item: Order["items"][number]): boolean {
	return !!item.isPoolChip || item.name === "Ficha de Pool";
}

// ─── Elapsed badge ─────────────────────────────────────────────────────────────

function ElapsedBadge({ date }: { date: Date }) {
	const mins = elapsedMinutes(date);
	return (
		<span
			className={clsx(
				"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-kds font-bold",
				elapsedBg(mins),
			)}
		>
			<Clock className={clsx("w-3 h-3", elapsedColor(mins))} />
			{mins}
			<span className="text-[10px] font-body font-normal">min</span>
		</span>
	);
}

// ─── Order card ───────────────────────────────────────────────────────────────

type ColumnType = "pending" | "preparing" | "ready";

function BarOrderCard({
	order,
	column,
	onAction,
}: {
	order: Order;
	column: ColumnType;
	onAction: (orderId: string, itemIds: string[], next: ItemStatus) => void;
}) {
	const mins = elapsedMinutes(order.createdAt);
	const isUrgent = mins >= 8 && column !== "ready";

	const chipItems = order.items.filter(isPoolChipItem);
	const drinkItems = order.items.filter((i) => !isPoolChipItem(i));

	const borderAccent = {
		pending: "border-l-amber-500",
		preparing: "border-l-blue-500",
		ready: "border-l-emerald-500",
	}[column];

	const actionConfig: Record<
		ColumnType,
		{
			label: string;
			icon: React.ReactNode;
			next: ItemStatus;
			cls: string;
		}
	> = {
		pending: {
			label: "PREPARANDO →",
			icon: <ArrowRight size={14} />,
			next: "preparing",
			cls: "btn-blue text-xs py-2.5 rounded-xl w-full justify-center",
		},
		preparing: {
			label: "LISTO ✓",
			icon: <CheckCircle2 size={14} />,
			next: "ready",
			cls: "btn-green text-xs py-2.5 rounded-xl w-full justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]",
		},
		ready: {
			label: "ENTREGADO",
			icon: <CheckCircle2 size={14} />,
			next: "delivered",
			cls: "flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-3 text-ink-secondary border border-surface-4 font-display font-bold text-xs uppercase tracking-widest hover:bg-surface-4 transition-all w-full",
		},
	};

	const action = actionConfig[column];
	const itemIds = order.items.map((i) => i.id);

	return (
		<div
			className={clsx(
				"card border-l-[4px] rounded-2xl p-4 flex flex-col gap-3 animate-slide-up transition-all duration-200",
				borderAccent,
				isUrgent && "ring-urgent",
				column === "ready" && "ring-ok",
			)}
		>
			{/* Table + elapsed */}
			<div className="flex items-center justify-between">
				<div className="flex items-baseline gap-2">
					<span
						className={clsx(
							"font-kds text-5xl leading-none tracking-wider",
							isUrgent ? "text-red-400" : "text-ink-primary",
						)}
					>
						{order.tableNumber}
					</span>
					<span className="text-ink-tertiary font-display text-[10px] uppercase tracking-widest mt-1">
						Mesa
					</span>
				</div>
				<ElapsedBadge date={order.createdAt} />
			</div>

			{/* Divider */}
			<div className="divider" />

			{/* Drink items */}
			{drinkItems.length > 0 && (
				<div className="flex flex-col gap-2">
					{drinkItems.map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between gap-2"
						>
							<div className="flex items-center gap-2 min-w-0">
								{column === "ready" ? (
									<CheckCircle2
										size={12}
										className="text-emerald-400 shrink-0"
									/>
								) : (
									<span
										className={clsx(
											"w-2 h-2 rounded-full shrink-0",
											item.status === "preparing"
												? "bg-blue-400 animate-pulse"
												: item.status === "pending"
													? "bg-amber-400"
													: "bg-emerald-400",
										)}
									/>
								)}
								<span className="font-display text-sm font-semibold text-ink-primary truncate uppercase tracking-wide">
									{item.name}
								</span>
							</div>
							<span className="font-kds text-2xl text-brand-500 leading-none shrink-0">
								×{item.qty}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Pool chip items */}
			{chipItems.length > 0 && (
				<div className="flex flex-col gap-2">
					{chipItems.map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between gap-2"
						>
							<div className="flex items-center gap-2 min-w-0">
								<span className="text-sm shrink-0">🎱</span>
								<span className="pool-chip-badge font-display font-bold text-sm truncate">
									{item.name}
								</span>
							</div>
							<span className="font-kds text-2xl text-brand-500 leading-none shrink-0">
								×{item.qty}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Action button */}
			<div className="divider" />
			<button
				onClick={() => onAction(order.id, itemIds, action.next)}
				className={action.cls}
			>
				{action.icon}
				{action.label}
			</button>
		</div>
	);
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({
	title,
	orders,
	column,
	onAction,
}: {
	title: string;
	orders: Order[];
	column: ColumnType;
	onAction: (orderId: string, itemIds: string[], next: ItemStatus) => void;
}) {
	const headerStyle = {
		pending: {
			badge:
				"bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
			dot: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
			title: "text-amber-400",
			bar: "bg-amber-500/40",
		},
		preparing: {
			badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
			dot: "bg-blue-500 shadow-[0_0_8px_#3b82f6]",
			title: "text-blue-400",
			bar: "bg-blue-500/40",
		},
		ready: {
			badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
			dot: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
			title: "text-emerald-400",
			bar: "bg-emerald-500/40",
		},
	}[column];

	return (
		<div className="flex flex-col gap-3 min-w-0">
			{/* Column header */}
			<div className="flex items-center justify-between">
				<div
					className={clsx(
						"flex items-center gap-2.5 px-4 py-2.5 rounded-2xl",
						headerStyle.badge,
					)}
				>
					<span className={clsx("w-2.5 h-2.5 rounded-full", headerStyle.dot)} />
					<span
						className={clsx(
							"font-kds text-2xl tracking-widest",
							headerStyle.title,
						)}
					>
						{title}
					</span>
				</div>
				<span
					className={clsx(
						"font-kds text-3xl leading-none px-3 py-1 rounded-xl",
						headerStyle.badge,
					)}
				>
					{orders.length}
				</span>
			</div>

			{/* Cards */}
			<div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-300px)] pr-0.5">
				{orders.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-14 gap-3 text-ink-tertiary card rounded-2xl">
						<CheckCircle2 size={32} className="opacity-20" />
						<span className="font-display text-xs uppercase tracking-widest opacity-40">
							Sin pedidos
						</span>
					</div>
				) : (
					orders.map((order) => (
						<BarOrderCard
							key={order.id}
							order={order}
							column={column}
							onAction={onAction}
						/>
					))
				)}
			</div>
		</div>
	);
}

// ─── Pool chips panel ─────────────────────────────────────────────────────────

function PoolChipsPanel({
	orders,
	onDeliver,
}: {
	orders: Order[];
	onDeliver: (orderId: string, itemIds: string[]) => void;
}) {
	const chipOrders = orders.filter((o) => o.items.some(isPoolChipItem));
	if (chipOrders.length === 0) return null;

	return (
		<div className="card-gold pool-chip-border rounded-2xl overflow-hidden">
			{/* Header */}
			<div
				className="px-5 py-4 flex items-center justify-between"
				style={{
					background:
						"linear-gradient(90deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)",
					borderBottom: "1px solid rgba(245,158,11,0.18)",
				}}
			>
				<div className="flex items-center gap-3">
					<span className="text-2xl leading-none">🎱</span>
					<span className="pool-chip-badge font-kds text-3xl tracking-widest">
						FICHAS DE POOL
					</span>
				</div>
				<span
					className="font-kds text-2xl px-3 py-1 rounded-xl"
					style={{
						background: "rgba(245,158,11,0.15)",
						color: "#f59e0b",
						border: "1px solid rgba(245,158,11,0.30)",
					}}
				>
					{chipOrders.length}
				</span>
			</div>

			{/* Chip rows */}
			<div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
				{chipOrders.map((order) => {
					const chips = order.items.filter(isPoolChipItem);
					const totalChips = chips.reduce((s, i) => s + i.qty, 0);
					const chipItemIds = chips.map((c) => c.id);
					return (
						<div
							key={order.id}
							className="flex items-center justify-between rounded-2xl px-4 py-3.5 gap-4"
							style={{
								background: "rgba(245,158,11,0.06)",
								border: "1px solid rgba(245,158,11,0.18)",
							}}
						>
							<div className="flex items-center gap-3 min-w-0">
								<div className="flex flex-col items-start">
									<span className="font-display text-[9px] uppercase tracking-widest text-ink-tertiary">
										Mesa
									</span>
									<span className="font-kds text-4xl leading-none text-brand-500">
										{order.tableNumber}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-1 flex-wrap">
										{Array.from({ length: Math.min(totalChips, 6) }).map(
											(_, i) => (
												<span key={i} className="text-base leading-none">
													🎱
												</span>
											),
										)}
										{totalChips > 6 && (
											<span className="text-brand-500 font-bold text-sm">
												+{totalChips - 6}
											</span>
										)}
									</div>
									<span className="font-kds text-xl text-brand-500 leading-none">
										×{totalChips}{" "}
										<span className="text-xs font-body font-normal text-ink-tertiary">
											fichas
										</span>
									</span>
								</div>
							</div>
							<button
								onClick={() => onDeliver(order.id, chipItemIds)}
								className="btn-primary text-xs px-3 py-2 rounded-xl shrink-0"
							>
								Entregar
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ─── Bottom ticker ────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
	{ table: 8, text: "3× Pinta Quilmes + Copa de Malbec", time: "21:28" },
	{ table: 4, text: "2× Aperol Spritz", time: "21:22" },
	{ table: 11, text: "1× Negroni", time: "21:19" },
	{ table: 2, text: "2× Fernet con Coca", time: "21:15" },
	{ table: 7, text: "3× Mojito + Gin Tónico", time: "21:10" },
	{ table: 5, text: "2× Pinta Andes + Agua s/gas", time: "21:06" },
	{ table: 3, text: "3× Ficha de Pool entregada", time: "21:03" },
];

function TickerStrip() {
	return (
		<div className="fixed bottom-0 inset-x-0 z-30 bg-surface-1/95 backdrop-blur-md border-t border-surface-3 overflow-hidden h-10 flex items-center">
			<div className="flex items-center gap-3 px-4 shrink-0 border-r border-surface-4 h-full">
				<CheckCircle2 size={11} className="text-emerald-400" />
				<span className="font-display text-[10px] uppercase tracking-widest text-ink-tertiary whitespace-nowrap">
					Entregados
				</span>
			</div>
			<div className="overflow-hidden flex-1 relative">
				<div
					className="flex items-center gap-8 whitespace-nowrap"
					style={{ animation: "ticker-scroll 40s linear infinite" }}
				>
					{[...TICKER_ITEMS, ...TICKER_ITEMS].map((entry, i) => (
						<span
							key={i}
							className="flex items-center gap-2 text-xs font-body text-ink-secondary shrink-0"
						>
							<span className="font-kds text-base text-brand-500 leading-none">
								{entry.table}
							</span>
							<span className="text-ink-tertiary">·</span>
							<span>{entry.text}</span>
							<span className="text-ink-tertiary font-mono text-[10px]">
								{entry.time}
							</span>
						</span>
					))}
				</div>
			</div>
			<style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
		</div>
	);
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = "all" | ColumnType;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
	{ key: "all", label: "Todos" },
	{ key: "pending", label: "Pendiente" },
	{ key: "preparing", label: "Preparando" },
	{ key: "ready", label: "Listo" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BarDisplayPage() {
	const _rawOrders = useAppStore((s) => s.orders);
	const barOrders = useMemo(
		() =>
			_rawOrders
				.filter((o) => o.status !== "closed" && o.status !== "cancelled")
				.map((o) => ({
					...o,
					items: o.items.filter(
						(i) =>
							i.target === "bar" &&
							i.status !== "cancelled" &&
							i.status !== "delivered",
					),
				}))
				.filter((o) => o.items.length > 0),
		[_rawOrders],
	);
	const updateItemStatus = useAppStore((s) => s.updateItemStatus);
	const barStaff = STAFF.find((s) => s.role === "bar");
	const currentTime = useLiveClock();
	const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

	// Derive column placement from item statuses
	const ordersWithColumn = barOrders.map((o) => ({
		...o,
		column: deriveItemStatus(o) as ColumnType,
	}));

	const pending = ordersWithColumn.filter((o) => o.column === "pending");
	const preparing = ordersWithColumn.filter((o) => o.column === "preparing");
	const ready = ordersWithColumn.filter((o) => o.column === "ready");
	const pendingCount = pending.length;

	// Filtered view for filter tabs (mobile friendly)
	const allOrders = ordersWithColumn;

	function handleAction(orderId: string, itemIds: string[], next: ItemStatus) {
		itemIds.forEach((itemId) => updateItemStatus(orderId, itemId, next));
	}

	function handleDeliverChips(orderId: string, chipItemIds: string[]) {
		chipItemIds.forEach((itemId) =>
			updateItemStatus(orderId, itemId, "delivered"),
		);
	}

	return (
		<div className="noise-overlay min-h-screen bg-surface-0 flex flex-col pb-10">
			{/* ── Header ── */}
			<header className="sticky top-0 z-10 bg-surface-1/95 backdrop-blur-md border-b border-surface-3 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
				<div className="flex items-center justify-between px-6 py-3">
					{/* Left: BAR brand */}
					<div className="flex items-center gap-3">
						<span className="font-kds text-5xl text-brand-500 leading-none tracking-widest">
							🍸 BAR
						</span>
					</div>

					{/* Center: live clock */}
					<div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
						<span className="font-kds text-4xl text-ink-secondary leading-none tracking-[0.1em]" suppressHydrationWarning>
							{currentTime}
						</span>
						<span className="font-display text-[9px] text-ink-tertiary uppercase tracking-[0.2em]">
							En vivo
						</span>
					</div>

					{/* Right: pending badge + staff */}
					<div className="flex items-center gap-4">
						{pendingCount > 0 && (
							<div className="flex items-center gap-2">
								<div className="relative">
									<div className="w-9 h-9 rounded-2xl bg-red-500 flex items-center justify-center animate-pulse">
										<span className="font-kds text-2xl leading-none text-white">
											{pendingCount}
										</span>
									</div>
								</div>
								<span className="hidden md:block font-display text-xs text-red-400 uppercase tracking-widest animate-blink">
									Pendientes
								</span>
							</div>
						)}

						<span className="font-display text-xs text-ink-tertiary uppercase tracking-widest hidden sm:block">
							MY WAY
						</span>

						{barStaff && (
							<div className="flex items-center gap-2.5">
								<div
									className="w-10 h-10 rounded-2xl flex items-center justify-center font-display font-bold text-sm text-surface-0"
									style={{
										background:
											"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
										boxShadow:
											"0 0 0 2px rgba(245,158,11,0.3), 0 0 12px rgba(245,158,11,0.2)",
									}}
								>
									{barStaff.avatar}
								</div>
								<div className="hidden md:flex flex-col">
									<span className="text-ink-secondary font-display text-xs font-semibold leading-tight">
										{barStaff.name}
									</span>
									<span className="text-brand-500 font-display text-[9px] uppercase tracking-widest leading-tight">
										Bartender
									</span>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Filter tabs */}
				<div className="flex items-center gap-2 px-6 pb-3 border-t border-surface-3/50 bg-surface-2/20 pt-2">
					{FILTER_TABS.map((tab) => {
						const count =
							tab.key === "all"
								? allOrders.length
								: tab.key === "pending"
									? pendingCount
									: tab.key === "preparing"
										? preparing.length
										: ready.length;
						const isActive = activeFilter === tab.key;
						return (
							<button
								key={tab.key}
								onClick={() => setActiveFilter(tab.key)}
								className={clsx(
									"flex items-center gap-2 px-4 py-2 rounded-xl font-display text-xs font-bold uppercase tracking-widest transition-all",
									isActive
										? "bg-brand-500 text-surface-0 shadow-gold-sm"
										: "bg-surface-2 text-ink-secondary border border-surface-3 hover:border-brand-500/30 hover:text-ink-primary",
								)}
							>
								{tab.label}
								<span
									className={clsx(
										"flex items-center justify-center w-5 h-5 rounded-md text-xs font-kds leading-none",
										isActive
											? "bg-surface-0/30 text-surface-0"
											: "bg-surface-3 text-ink-tertiary",
									)}
								>
									{count}
								</span>
							</button>
						);
					})}
					{pendingCount > 0 && (
						<div className="ml-auto flex items-center gap-1.5 text-xs font-display text-red-400 uppercase tracking-wider animate-blink">
							<AlertCircle className="w-3.5 h-3.5" />
							{pendingCount} orden{pendingCount !== 1 ? "es" : ""} esperando
						</div>
					)}
				</div>
			</header>

			{/* ── Main: 3-column kanban ── */}
			<main className="flex-1 px-4 pt-5 pb-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<KanbanColumn
						title="PENDIENTE"
						orders={pending}
						column="pending"
						onAction={handleAction}
					/>
					<KanbanColumn
						title="PREPARANDO"
						orders={preparing}
						column="preparing"
						onAction={handleAction}
					/>
					<KanbanColumn
						title="LISTO"
						orders={ready}
						column="ready"
						onAction={handleAction}
					/>
				</div>
			</main>

			{/* ── Pool chips panel ── */}
			<div className="px-4 pb-6">
				<PoolChipsPanel orders={allOrders} onDeliver={handleDeliverChips} />
			</div>

			{/* ── Bottom ticker ── */}
			<TickerStrip />
		</div>
	);
}
