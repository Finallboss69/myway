"use client";

import { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import { Clock, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { elapsedMinutes } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
	id: string;
	name: string;
	qty: number;
	price: number;
	status: string;
	target: string;
}

interface Order {
	id: string;
	tableId: string;
	tableNumber: number;
	status: string;
	createdAt: string;
	items: OrderItem[];
}

type ItemStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
type ColumnType = "pending" | "preparing" | "ready";

// ─── Polling hook ─────────────────────────────────────────────────────────────

function usePolling<T>(url: string, interval = 3000) {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		let active = true;
		const fetch_ = async () => {
			const res = await fetch(url);
			if (active && res.ok) setData(await res.json());
			setLoading(false);
		};
		fetch_();
		const id = setInterval(fetch_, interval);
		return () => {
			active = false;
			clearInterval(id);
		};
	}, [url, interval]);
	return { data, loading };
}

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

function deriveItemStatus(order: Order): ColumnType {
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

// ─── Elapsed badge ─────────────────────────────────────────────────────────────

function ElapsedBadge({ date }: { date: string }) {
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
			icon: <ArrowRight size={16} />,
			next: "preparing",
			cls: "btn-blue text-sm min-h-[48px] rounded-xl w-full justify-center",
		},
		preparing: {
			label: "LISTO ✓",
			icon: <CheckCircle2 size={16} />,
			next: "ready",
			cls: "btn-green text-sm min-h-[48px] rounded-xl w-full justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]",
		},
		ready: {
			label: "ENTREGADO",
			icon: <CheckCircle2 size={16} />,
			next: "delivered",
			cls: "flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-surface-3 text-ink-secondary border border-surface-4 font-display font-bold text-sm uppercase tracking-widest hover:bg-surface-4 transition-all w-full active:scale-95",
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
			{/* Table number + elapsed time */}
			<div className="flex items-center justify-between">
				<div className="flex items-baseline gap-2">
					<span
						className={clsx(
							"font-kds leading-none tracking-wider",
							"text-6xl sm:text-7xl",
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

			{/* Items list */}
			<div className="flex flex-col gap-2.5">
				{order.items.map((item) => (
					<div
						key={item.id}
						className="flex items-center justify-between gap-2"
					>
						<div className="flex items-center gap-2.5 min-w-0">
							{column === "ready" ? (
								<CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
							) : (
								<span
									className={clsx(
										"w-2.5 h-2.5 rounded-full shrink-0",
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
						{/* Qty badge — large for visibility */}
						<span className="font-kds text-2xl sm:text-3xl text-brand-500 leading-none shrink-0 bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20">
							×{item.qty}
						</span>
					</div>
				))}
			</div>

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
		},
		preparing: {
			badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
			dot: "bg-blue-500 shadow-[0_0_8px_#3b82f6]",
			title: "text-blue-400",
		},
		ready: {
			badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
			dot: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
			title: "text-emerald-400",
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

			{/* Cards — scrollable within the column */}
			<div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-260px)] pr-0.5">
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
	const { data: rawOrders } = usePolling<Order[]>("/api/orders", 3000);
	const [optimisticOrders, setOptimisticOrders] = useState<Order[] | null>(
		null,
	);
	const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
	const currentTime = useLiveClock();

	// Use optimistic state if available, otherwise use polled data
	const orders = optimisticOrders ?? rawOrders ?? [];

	// Sync optimistic state when new data arrives
	useEffect(() => {
		if (rawOrders) setOptimisticOrders(rawOrders);
	}, [rawOrders]);

	const [barStaff, setBarStaff] = useState<{
		name: string;
		avatar: string;
	} | null>(null);
	useEffect(() => {
		fetch("/api/staff")
			.then((r) => r.json())
			.then((staff: Array<{ role: string; name: string; avatar: string }>) => {
				const found = staff.find((s) => s.role === "bar");
				if (found) setBarStaff(found);
			});
	}, []);

	const barOrders = useMemo(
		() =>
			orders
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
		[orders],
	);

	// Derive column placement from item statuses
	const ordersWithColumn = barOrders.map((o) => ({
		...o,
		column: deriveItemStatus(o) as ColumnType,
	}));

	const pending = ordersWithColumn.filter((o) => o.column === "pending");
	const preparing = ordersWithColumn.filter((o) => o.column === "preparing");
	const ready = ordersWithColumn.filter((o) => o.column === "ready");
	const pendingCount = pending.length;
	const allOrders = ordersWithColumn;

	// For mobile single-column filtered view
	const filteredOrders =
		activeFilter === "all"
			? allOrders
			: allOrders.filter((o) => o.column === activeFilter);

	async function handleAction(
		orderId: string,
		itemIds: string[],
		next: ItemStatus,
	) {
		// Optimistic update
		setOptimisticOrders((prev) => {
			if (!prev) return prev;
			return prev.map((o) => {
				if (o.id !== orderId) return o;
				return {
					...o,
					items: o.items.map((item) =>
						itemIds.includes(item.id) ? { ...item, status: next } : item,
					),
				};
			});
		});

		// Fire API calls for each item
		await Promise.all(
			itemIds.map((itemId) =>
				fetch(`/api/orders/${orderId}/items/${itemId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: next }),
				}),
			),
		);
	}

	return (
		<div className="noise-overlay min-h-screen bg-surface-0 flex flex-col pb-10">
			{/* ── Header ── */}
			<header className="sticky top-0 z-10 bg-surface-1/95 backdrop-blur-md border-b border-surface-3 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
				<div className="flex items-center justify-between px-4 sm:px-6 py-3">
					{/* Left: BAR brand */}
					<div className="flex items-center gap-3">
						<span className="font-kds text-4xl sm:text-5xl text-brand-500 leading-none tracking-widest">
							BAR
						</span>
					</div>

					{/* Center: live clock — hidden on small phones */}
					<div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 flex-col items-center">
						<span
							className="font-kds text-3xl sm:text-4xl text-ink-secondary leading-none tracking-[0.1em]"
							suppressHydrationWarning
						>
							{currentTime}
						</span>
						<span className="font-display text-[9px] text-ink-tertiary uppercase tracking-[0.2em]">
							En vivo
						</span>
					</div>

					{/* Right: pending badge + staff */}
					<div className="flex items-center gap-3">
						{pendingCount > 0 && (
							<div className="flex items-center gap-2">
								<div className="relative">
									<div className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center animate-pulse">
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

				{/* Filter tabs — scrollable on mobile, aligned with kanban on desktop */}
				<div className="flex items-center gap-2 px-4 sm:px-6 pb-3 border-t border-surface-3/50 bg-surface-2/20 pt-2 overflow-x-auto">
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
									"flex items-center gap-2 px-4 rounded-xl font-display text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap shrink-0",
									"min-h-[44px]",
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
						<div className="ml-auto flex items-center gap-1.5 text-xs font-display text-red-400 uppercase tracking-wider animate-blink shrink-0 pl-2">
							<AlertCircle className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">
								{pendingCount} orden{pendingCount !== 1 ? "es" : ""} esperando
							</span>
							<span className="sm:hidden">{pendingCount}</span>
						</div>
					)}
				</div>
			</header>

			{/* ── Main content ── */}
			<main className="flex-1 px-3 sm:px-4 pt-4 sm:pt-5 pb-6">
				{/*
				  Mobile/tablet portrait: single column filtered view
				  Tablet landscape / desktop: 3-column kanban
				  We use CSS grid with breakpoints to switch layouts.
				*/}

				{/* Mobile filtered list (shown when a specific tab is active) */}
				<div className="lg:hidden">
					{activeFilter === "all" ? (
						/* "All" on mobile: stack columns with headers */
						<div className="flex flex-col gap-6">
							{pending.length > 0 && (
								<div className="flex flex-col gap-3">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-kds text-xl tracking-widest">
											<span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
											PENDIENTE
										</span>
										<span className="font-kds text-2xl leading-none px-3 py-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
											{pending.length}
										</span>
									</div>
									<div
										className="grid gap-3"
										style={{
											gridTemplateColumns:
												"repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
										}}
									>
										{pending.map((order) => (
											<BarOrderCard
												key={order.id}
												order={order}
												column="pending"
												onAction={handleAction}
											/>
										))}
									</div>
								</div>
							)}
							{preparing.length > 0 && (
								<div className="flex flex-col gap-3">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 font-kds text-xl tracking-widest">
											<span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
											PREPARANDO
										</span>
										<span className="font-kds text-2xl leading-none px-3 py-1 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
											{preparing.length}
										</span>
									</div>
									<div
										className="grid gap-3"
										style={{
											gridTemplateColumns:
												"repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
										}}
									>
										{preparing.map((order) => (
											<BarOrderCard
												key={order.id}
												order={order}
												column="preparing"
												onAction={handleAction}
											/>
										))}
									</div>
								</div>
							)}
							{ready.length > 0 && (
								<div className="flex flex-col gap-3">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-kds text-xl tracking-widest">
											<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
											LISTO
										</span>
										<span className="font-kds text-2xl leading-none px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
											{ready.length}
										</span>
									</div>
									<div
										className="grid gap-3"
										style={{
											gridTemplateColumns:
												"repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
										}}
									>
										{ready.map((order) => (
											<BarOrderCard
												key={order.id}
												order={order}
												column="ready"
												onAction={handleAction}
											/>
										))}
									</div>
								</div>
							)}
							{allOrders.length === 0 && (
								<div className="flex flex-col items-center justify-center h-64 gap-4 text-ink-tertiary">
									<CheckCircle2 size={40} className="opacity-20" />
									<span className="font-display text-sm uppercase tracking-widest opacity-40">
										Sin pedidos activos
									</span>
								</div>
							)}
						</div>
					) : (
						/* Specific tab on mobile: single filtered grid */
						<div>
							{filteredOrders.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-64 gap-4 text-ink-tertiary">
									<CheckCircle2 size={40} className="opacity-20" />
									<span className="font-display text-sm uppercase tracking-widest opacity-40">
										Sin pedidos
									</span>
								</div>
							) : (
								<div
									className="grid gap-3"
									style={{
										gridTemplateColumns:
											"repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
									}}
								>
									{filteredOrders.map((order) => (
										<BarOrderCard
											key={order.id}
											order={order}
											column={order.column}
											onAction={handleAction}
										/>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Desktop: always 3-column kanban */}
				<div className="hidden lg:grid lg:grid-cols-3 gap-4">
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

			{/* ── Bottom ticker ── */}
			<TickerStrip />
		</div>
	);
}
