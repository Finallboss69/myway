"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import clsx from "clsx";
import {
	Clock,
	ChefHat,
	CheckCircle2,
	Flame,
	Package,
	AlertCircle,
	Zap,
	UtensilsCrossed,
	Wifi,
	WifiOff,
} from "lucide-react";
import { elapsedMinutes } from "@/lib/utils";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
	id: string;
	name: string;
	qty: number;
	price: number;
	status: string;
	target: string;
	notes?: string;
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
type FilterTab = "all" | "pending" | "preparing" | "ready";

// ─── Sound notification ──────────────────────────────────────────────────────

function playBeep() {
	try {
		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.frequency.value = 880;
		gain.gain.value = 0.3;
		osc.start();
		osc.stop(ctx.currentTime + 0.15);
	} catch {
		/* audio not available */
	}
}

// ─── Polling hook ─────────────────────────────────────────────────────────────

function usePolling<T>(url: string, interval = 3000) {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	useEffect(() => {
		let active = true;
		const fetch_ = async () => {
			try {
				const res = await fetch(url);
				if (!active) return;
				if (res.ok) {
					setData(await res.json());
					setError(false);
					setLastUpdated(new Date());
				} else {
					setError(true);
				}
			} catch {
				if (active) setError(true);
			} finally {
				if (active) setLoading(false);
			}
		};
		fetch_();
		const id = setInterval(fetch_, interval);
		return () => {
			active = false;
			clearInterval(id);
		};
	}, [url, interval]);

	return { data, loading, error, lastUpdated };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elapsedColor(mins: number): string {
	if (mins > 10) return "text-red-400";
	if (mins > 5) return "text-amber-400";
	return "text-emerald-400";
}

function urgencyTableColor(mins: number): string {
	if (mins > 10) return "text-red-400";
	if (mins > 5) return "text-amber-400";
	return "text-pool-500";
}

function deriveOrderStatus(order: Order): "pending" | "preparing" | "ready" {
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

/** Sort items: pending first, then preparing, then rest */
function sortItemsByStatus(items: OrderItem[]): OrderItem[] {
	const priority: Record<string, number> = {
		pending: 0,
		preparing: 1,
		ready: 2,
		delivered: 3,
		cancelled: 4,
	};
	return [...items].sort(
		(a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9),
	);
}

/** Sort orders: oldest pending first (by createdAt ascending) */
function sortOrdersByUrgency<
	T extends { createdAt: string; derivedStatus: string },
>(orders: T[]): T[] {
	const statusPriority: Record<string, number> = {
		pending: 0,
		preparing: 1,
		ready: 2,
	};
	return [...orders].sort((a, b) => {
		const pa = statusPriority[a.derivedStatus] ?? 9;
		const pb = statusPriority[b.derivedStatus] ?? 9;
		if (pa !== pb) return pa - pb;
		return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
	});
}

// ─── Live clock ───────────────────────────────────────────────────────────────

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

// ─── Elapsed badge ────────────────────────────────────────────────────────────

function ElapsedBadge({ createdAt }: { createdAt: string }) {
	const [mins, setMins] = useState(() => elapsedMinutes(createdAt));
	useEffect(() => {
		const id = setInterval(() => setMins(elapsedMinutes(createdAt)), 10000);
		return () => clearInterval(id);
	}, [createdAt]);

	return (
		<div
			className={clsx(
				"flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold",
				mins > 10
					? "bg-red-500/10 border-red-500/30"
					: mins > 5
						? "bg-amber-500/10 border-amber-500/30"
						: "bg-emerald-500/10 border-emerald-500/30",
			)}
		>
			<Clock className={clsx("w-3.5 h-3.5", elapsedColor(mins))} />
			<span
				className={clsx("font-kds text-2xl leading-none", elapsedColor(mins))}
			>
				{mins}
				<span className="text-xs font-body ml-0.5 font-normal">min</span>
			</span>
		</div>
	);
}

// ─── Item status chip ─────────────────────────────────────────────────────────

function ItemStatusChip({ status }: { status: string }) {
	const cls = clsx(
		"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-display font-bold uppercase tracking-wide border",
		{
			"bg-amber-500/15 text-amber-400 border-amber-500/30":
				status === "pending",
			"bg-blue-500/15 text-blue-400 border-blue-500/30": status === "preparing",
			"bg-emerald-500/15 text-emerald-400 border-emerald-500/30":
				status === "ready",
			"bg-surface-3 text-ink-tertiary border-surface-4": status === "delivered",
			"bg-red-500/10 text-red-400 border-red-500/20": status === "cancelled",
		},
	);
	const labels: Record<string, string> = {
		pending: "Pendiente",
		preparing: "Preparando",
		ready: "Listo",
		delivered: "Entregado",
		cancelled: "Cancelado",
	};
	return (
		<span className={cls}>
			<span
				className={clsx("w-1.5 h-1.5 rounded-full", {
					"bg-amber-400": status === "pending",
					"bg-blue-400 animate-pulse": status === "preparing",
					"bg-emerald-400": status === "ready",
					"bg-surface-5": status === "delivered",
					"bg-red-400": status === "cancelled",
				})}
			/>
			{labels[status] ?? status}
		</span>
	);
}

// ─── Error toast ──────────────────────────────────────────────────────────────

function ErrorToast({
	message,
	onDismiss,
}: {
	message: string;
	onDismiss: () => void;
}) {
	useEffect(() => {
		const t = setTimeout(onDismiss, 3000);
		return () => clearTimeout(t);
	}, [onDismiss]);

	return (
		<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-red-500/90 text-white font-display text-sm font-bold shadow-lg backdrop-blur-md border border-red-400/50 animate-slide-up">
			{message}
		</div>
	);
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({
	order,
	onUpdateItem,
}: {
	order: Order;
	onUpdateItem: (orderId: string, itemId: string, next: ItemStatus) => void;
}) {
	const derived = deriveOrderStatus(order);
	const mins = elapsedMinutes(order.createdAt);
	const isReady = derived === "ready";
	const isUrgent = mins > 10;
	const isWarning = mins > 5 && !isUrgent;

	const sortedItems = useMemo(
		() => sortItemsByStatus(order.items),
		[order.items],
	);

	const cardCls = clsx(
		"flex flex-col overflow-hidden rounded-2xl border-l-[5px] bg-surface-1 transition-all duration-300 animate-slide-up",
		{
			"border-l-brand-500": derived === "pending",
			"border-l-blue-500": derived === "preparing",
			"border-l-emerald-500": derived === "ready",
		},
		isReady && "ring-ok",
		isUrgent && !isReady && "ring-urgent animate-pulse",
		isWarning && !isReady && "ring-warning",
	);

	function handleItemToggle(itemId: string, currentStatus: string) {
		const next: Record<string, ItemStatus> = {
			pending: "preparing",
			preparing: "ready",
			ready: "delivered",
			delivered: "delivered",
		};
		onUpdateItem(
			order.id,
			itemId,
			next[currentStatus] ?? ("pending" as ItemStatus),
		);
	}

	function handleAllStart() {
		order.items
			.filter((i) => i.status === "pending")
			.forEach((i) => onUpdateItem(order.id, i.id, "preparing"));
	}

	function handleAllReady() {
		order.items
			.filter((i) => i.status === "preparing")
			.forEach((i) => onUpdateItem(order.id, i.id, "ready"));
	}

	function handleAllDelivered() {
		order.items
			.filter((i) => i.status === "ready")
			.forEach((i) => onUpdateItem(order.id, i.id, "delivered"));
	}

	return (
		<div className={cardCls}>
			{/* Card header */}
			<div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-surface-3 bg-surface-2/40">
				<div className="flex items-baseline gap-3">
					<div className="flex flex-col items-start">
						<span className="font-display text-[10px] uppercase tracking-[0.2em] text-ink-tertiary mb-0.5">
							Mesa
						</span>
						<span
							className={clsx(
								"font-kds leading-none text-7xl",
								urgencyTableColor(mins),
							)}
						>
							{order.tableNumber}
						</span>
					</div>
					<div className="flex flex-col gap-1.5 mt-auto pb-1">
						<span
							className={clsx(
								"inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-display font-bold uppercase tracking-wider border",
								derived === "pending"
									? "bg-amber-500/10 text-amber-400 border-amber-500/25"
									: derived === "preparing"
										? "bg-blue-500/10 text-blue-400 border-blue-500/25"
										: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
							)}
						>
							{derived === "pending" ? (
								<Zap className="w-3 h-3" />
							) : derived === "preparing" ? (
								<Flame className="w-3 h-3" />
							) : (
								<CheckCircle2 className="w-3 h-3" />
							)}
							{derived === "pending"
								? "Pendiente"
								: derived === "preparing"
									? "Preparando"
									: "Listo"}
						</span>
						<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-display font-bold uppercase tracking-wider border bg-surface-3 text-ink-secondary border-surface-4">
							<Flame className="w-2.5 h-2.5" />
							Cocina
						</span>
					</div>
				</div>
				<div className="flex flex-col items-end gap-2">
					<ElapsedBadge createdAt={order.createdAt} />
					{isReady && (
						<span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-display font-bold uppercase tracking-widest animate-blink">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
							Listo para servir
						</span>
					)}
					{isUrgent && !isReady && (
						<span className="flex items-center gap-1.5 text-[10px] text-red-400 font-display font-bold uppercase tracking-widest animate-blink">
							<AlertCircle className="w-3 h-3" />
							Urgente
						</span>
					)}
				</div>
			</div>

			{/* Items list — sorted: pending first, then preparing */}
			<div className="flex flex-col divide-y divide-surface-3 flex-1">
				{sortedItems.map((item) => (
					<div
						key={item.id}
						className={clsx(
							"flex items-center gap-3 px-4 py-3 transition-colors",
							item.status === "ready" && "bg-emerald-500/5",
							item.status === "delivered" && "opacity-40",
						)}
					>
						{/* Qty */}
						<span className="font-kds text-4xl leading-none text-brand-500 w-10 text-center shrink-0">
							{item.qty}
						</span>

						{/* Name + status */}
						<div className="flex-1 min-w-0">
							<p className="font-display text-sm font-bold uppercase tracking-wide text-ink-primary truncate">
								{item.name}
							</p>
							{item.notes && (
								<p
									className="font-display text-xs mt-0.5 truncate"
									style={{
										color: "#fbbf24",
										fontStyle: "italic",
									}}
								>
									* {item.notes}
								</p>
							)}
							<div className="mt-1">
								<ItemStatusChip status={item.status} />
							</div>
						</div>

						{/* Toggle — large touch target on mobile */}
						{item.status !== "delivered" && item.status !== "cancelled" && (
							<button
								onClick={() => handleItemToggle(item.id, item.status)}
								className={clsx(
									"shrink-0 min-h-[44px] px-3 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wide transition-all active:scale-95",
									item.status === "ready"
										? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
										: item.status === "preparing"
											? "btn-green text-xs px-3 rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.3)]"
											: "btn-blue text-xs px-3 rounded-xl shadow-[0_0_12px_rgba(59,130,246,0.3)]",
								)}
							>
								{item.status === "ready"
									? "✓ Listo"
									: item.status === "preparing"
										? "LISTO ✓"
										: "PREPARANDO →"}
							</button>
						)}
					</div>
				))}
			</div>

			{/* Card footer — full-width action button */}
			<div className="flex gap-2 px-4 py-3 bg-surface-2/60 border-t border-surface-3">
				{derived === "pending" && (
					<button
						onClick={handleAllStart}
						className="btn-blue flex-1 justify-center min-h-[48px] text-sm rounded-xl"
					>
						<Flame className="w-4 h-4" />
						INICIAR TODO
					</button>
				)}
				{derived === "preparing" && (
					<button
						onClick={handleAllReady}
						className="btn-green flex-1 justify-center min-h-[48px] text-sm rounded-xl shadow-[0_0_16px_rgba(16,185,129,0.2)]"
					>
						<CheckCircle2 className="w-4 h-4" />
						TODO LISTO ✓
					</button>
				)}
				{derived === "ready" && (
					<button
						onClick={handleAllDelivered}
						className="flex-1 flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-surface-3 text-ink-secondary border border-surface-4 font-display font-bold text-sm uppercase tracking-widest hover:bg-surface-4 transition-all"
					>
						<UtensilsCrossed className="w-4 h-4" />
						ENTREGADO
					</button>
				)}
			</div>
		</div>
	);
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterTab; label: string }[] = [
	{ key: "all", label: "Todos" },
	{ key: "pending", label: "Pendiente" },
	{ key: "preparing", label: "Preparando" },
	{ key: "ready", label: "Listo" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KitchenKDSPage() {
	const {
		data: rawOrders,
		error: pollError,
		lastUpdated,
	} = usePolling<Order[]>("/api/orders", 3000);
	const [optimisticOrders, setOptimisticOrders] = useState<Order[] | null>(
		null,
	);
	const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
	const [updateError, setUpdateError] = useState<string | null>(null);
	const currentTime = useLiveClock();

	const orders = optimisticOrders ?? rawOrders ?? [];

	// Track previous pending count + order IDs for sound notification
	const prevPendingCountRef = useRef(0);
	const prevOrderIdsRef = useRef<Set<string>>(new Set());
	const initialLoadRef = useRef(true);

	useEffect(() => {
		if (rawOrders) setOptimisticOrders(rawOrders);
	}, [rawOrders]);

	// ─── Wake lock for KDS displays ──────────────────────────────────────
	useEffect(() => {
		let wakeLock: WakeLockSentinel | null = null;
		async function requestWakeLock() {
			try {
				if ("wakeLock" in navigator) {
					wakeLock = await navigator.wakeLock.request("screen");
				}
			} catch {
				/* wake lock not available */
			}
		}
		requestWakeLock();
		const handleVisibility = () => {
			if (document.visibilityState === "visible") requestWakeLock();
		};
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			wakeLock?.release();
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, []);

	const [kitchenStaff, setKitchenStaff] = useState<{
		name: string;
		avatar: string;
	} | null>(null);
	useEffect(() => {
		fetch("/api/staff")
			.then((r) => r.json())
			.then((staff: Array<{ role: string; name: string; avatar: string }>) => {
				const found = staff.find((s) => s.role === "kitchen");
				if (found) setKitchenStaff(found);
			})
			.catch(() => {
				/* staff fetch failed, non-critical */
			});
	}, []);

	const kitchenOrders = useMemo(
		() =>
			orders
				.filter((o) => o.status !== "closed" && o.status !== "cancelled")
				.map((o) => ({
					...o,
					items: o.items.filter(
						(i) =>
							i.target === "kitchen" &&
							i.status !== "cancelled" &&
							i.status !== "delivered",
					),
				}))
				.filter((o) => o.items.length > 0),
		[orders],
	);

	const ordersWithStatus = kitchenOrders.map((o) => ({
		...o,
		derivedStatus: deriveOrderStatus(o),
	}));

	const visibleOrders = ordersWithStatus.filter(
		(o) => o.derivedStatus !== ("delivered" as string),
	);

	// ─── Sort orders by urgency: oldest pending first ─────────────────────
	const sortedVisibleOrders = useMemo(
		() => sortOrdersByUrgency(visibleOrders),
		[visibleOrders],
	);

	const filteredOrders =
		activeFilter === "all"
			? sortedVisibleOrders
			: sortedVisibleOrders.filter((o) => o.derivedStatus === activeFilter);

	const countByDerived = useCallback(
		(status: string) =>
			visibleOrders.filter((o) => o.derivedStatus === status).length,
		[visibleOrders],
	);

	const pendingCount = countByDerived("pending");
	const preparingCount = countByDerived("preparing");
	const readyCount = countByDerived("ready");

	// ─── Sound notification when new pending items appear ─────────────────
	useEffect(() => {
		if (initialLoadRef.current) {
			// Don't beep on first load
			prevPendingCountRef.current = pendingCount;
			const ids = new Set(kitchenOrders.map((o) => o.id));
			prevOrderIdsRef.current = ids;
			initialLoadRef.current = false;
			return;
		}

		const currentIds = new Set(kitchenOrders.map((o) => o.id));
		const hasNewOrder = [...currentIds].some(
			(id) => !prevOrderIdsRef.current.has(id),
		);
		const pendingIncreased = pendingCount > prevPendingCountRef.current;

		if (pendingIncreased || hasNewOrder) {
			playBeep();
		}

		prevPendingCountRef.current = pendingCount;
		prevOrderIdsRef.current = currentIds;
	}, [pendingCount, kitchenOrders]);

	const avgMins =
		visibleOrders.length > 0
			? Math.round(
					visibleOrders.reduce(
						(sum, o) => sum + elapsedMinutes(o.createdAt),
						0,
					) / visibleOrders.length,
				)
			: 0;

	async function handleUpdateItem(
		orderId: string,
		itemId: string,
		next: ItemStatus,
	) {
		// Save previous state for rollback
		const previousOrders = optimisticOrders;

		// Optimistic update
		setOptimisticOrders((prev) => {
			if (!prev) return prev;
			return prev.map((o) => {
				if (o.id !== orderId) return o;
				return {
					...o,
					items: o.items.map((item) =>
						item.id === itemId ? { ...item, status: next } : item,
					),
				};
			});
		});

		try {
			const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: next }),
			});
			if (!res.ok) throw new Error("update failed");
		} catch {
			// Rollback on failure
			setOptimisticOrders(previousOrders);
			setUpdateError("Error al actualizar — reintentando...");
		}
	}

	// Format last updated time
	const lastUpdatedStr = lastUpdated
		? lastUpdated.toLocaleTimeString("es-AR", {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			})
		: null;

	return (
		<div className="min-h-screen bg-surface-0 flex flex-col noise-overlay">
			{/* ── Error toast ── */}
			{updateError && (
				<ErrorToast
					message={updateError}
					onDismiss={() => setUpdateError(null)}
				/>
			)}

			{/* ── Connection error banner ── */}
			{pollError && (
				<div className="sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/90 text-white font-display text-sm font-bold backdrop-blur-md">
					<WifiOff className="w-4 h-4" />
					Error de conexión — reintentando...
				</div>
			)}

			{/* ── Header ── */}
			<header className="sticky top-0 z-40 bg-surface-1/95 backdrop-blur-md border-b border-surface-3 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
				<div className="relative flex items-center px-4 sm:px-6 py-3 gap-3">
					{/* Left: Brand */}
					<div className="flex items-center gap-3 min-w-0 flex-1 max-w-[40%]">
						<div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-500/10 border border-brand-500/25 shadow-gold-sm shrink-0">
							<ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" />
						</div>
						<div className="min-w-0">
							<div className="flex items-baseline gap-2">
								<span className="font-kds text-3xl sm:text-5xl leading-none text-brand-500 tracking-widest">
									COCINA
								</span>
							</div>
							<div className="flex items-center gap-2 mt-0.5">
								<p className="font-display text-[9px] sm:text-[10px] text-ink-tertiary uppercase tracking-[0.2em] hidden sm:block">
									My Way · Kitchen Display System
								</p>
								{/* Connection indicator */}
								<span
									className={clsx(
										"w-2 h-2 rounded-full shrink-0",
										pollError
											? "bg-red-500 shadow-[0_0_6px_#ef4444]"
											: "bg-emerald-500 shadow-[0_0_6px_#10b981]",
									)}
									title={pollError ? "Desconectado" : "Conectado"}
								/>
							</div>
						</div>
					</div>

					{/* Center: Live clock — hidden on small phones */}
					<div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 flex-col items-center">
						<span
							className="font-kds text-4xl leading-none text-ink-secondary tracking-[0.1em]"
							suppressHydrationWarning
						>
							{currentTime}
						</span>
						<span className="font-display text-[9px] text-ink-tertiary uppercase tracking-[0.2em] mt-0.5">
							En vivo
							{lastUpdatedStr && (
								<span className="ml-2 text-ink-tertiary/60">
									· Actualizado {lastUpdatedStr}
								</span>
							)}
						</span>
					</div>

					{/* Right: Badge + Staff */}
					<div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
						<div
							className="flex items-center justify-center min-w-[44px] h-11 px-3 rounded-2xl bg-brand-500 shadow-gold-sm"
							title="Órdenes activas"
						>
							<span className="font-kds text-3xl leading-none text-surface-0">
								{visibleOrders.length}
							</span>
						</div>
						<div className="flex items-center gap-2.5 px-3 py-2 bg-surface-2 border border-surface-3 rounded-2xl">
							<div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0">
								<span className="font-display text-xs font-bold text-brand-500">
									{kitchenStaff?.avatar ?? "CH"}
								</span>
							</div>
							<div className="hidden sm:flex flex-col">
								<span className="font-display text-xs font-semibold text-ink-primary leading-tight">
									{kitchenStaff?.name ?? "Cocina"}
								</span>
								<span className="font-display text-[9px] text-ink-tertiary uppercase tracking-wider leading-tight">
									Jefa de Cocina
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Filter tabs — scrollable on mobile */}
				<div className="flex items-center gap-2 px-4 sm:px-6 pb-3 pt-2 border-t border-surface-3/50 bg-surface-2/20 overflow-x-auto">
					{FILTER_TABS.map((tab) => {
						const count =
							tab.key === "all"
								? visibleOrders.length
								: tab.key === "pending"
									? pendingCount
									: tab.key === "preparing"
										? preparingCount
										: readyCount;
						const isActive = activeFilter === tab.key;
						return (
							<button
								key={tab.key}
								onClick={() => setActiveFilter(tab.key)}
								className={clsx(
									"relative flex items-center gap-2 px-4 sm:px-5 rounded-xl font-display text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap shrink-0",
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
					<div className="ml-auto flex items-center gap-1.5 text-xs text-ink-tertiary font-display shrink-0 pl-2">
						<Package className="w-3.5 h-3.5" />
						<span>
							{filteredOrders.length} orden
							{filteredOrders.length !== 1 ? "es" : ""}
						</span>
					</div>
				</div>
			</header>

			{/* ── Orders grid ── */}
			<main className="flex-1 p-3 sm:p-4 pb-24">
				{filteredOrders.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-64 gap-5">
						<div className="w-20 h-20 rounded-3xl bg-surface-2 border border-surface-3 flex items-center justify-center">
							<ChefHat className="w-9 h-9 text-ink-tertiary" />
						</div>
						<div className="text-center">
							<p className="font-kds text-3xl text-ink-secondary tracking-wider">
								SIN ÓRDENES
							</p>
							<p className="font-body text-sm text-ink-tertiary mt-1">
								No hay pedidos en esta categoría
							</p>
						</div>
					</div>
				) : (
					<div
						className="grid gap-3 sm:gap-4"
						style={{
							gridTemplateColumns:
								"repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
						}}
					>
						{filteredOrders.map((order) => (
							<OrderCard
								key={order.id}
								order={order}
								onUpdateItem={handleUpdateItem}
							/>
						))}
					</div>
				)}
			</main>

			{/* ── Stats bar (fixed bottom) ── */}
			<footer className="fixed bottom-0 inset-x-0 z-30 border-t border-surface-3 bg-surface-1/95 backdrop-blur-md px-4 sm:px-6 py-3">
				<div className="flex items-center gap-3 sm:gap-5 overflow-x-auto">
					<div className="flex items-center gap-2 shrink-0">
						<span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
						<span className="font-display text-[10px] uppercase tracking-widest text-ink-tertiary hidden sm:block">
							Pendientes
						</span>
						<span className="font-kds text-3xl leading-none text-amber-400 ml-1">
							{pendingCount}
						</span>
					</div>

					<div className="w-px h-5 bg-surface-3 shrink-0" />

					<div className="flex items-center gap-2 shrink-0">
						<span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
						<span className="font-display text-[10px] uppercase tracking-widest text-ink-tertiary hidden sm:block">
							Preparando
						</span>
						<span className="font-kds text-3xl leading-none text-blue-400 ml-1">
							{preparingCount}
						</span>
					</div>

					<div className="w-px h-5 bg-surface-3 shrink-0" />

					<div className="flex items-center gap-2 shrink-0">
						<span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
						<span className="font-display text-[10px] uppercase tracking-widest text-ink-tertiary hidden sm:block">
							Listos
						</span>
						<span className="font-kds text-3xl leading-none text-emerald-400 ml-1">
							{readyCount}
						</span>
					</div>

					<div className="w-px h-5 bg-surface-3 shrink-0" />

					<div className="flex items-center gap-2 shrink-0">
						<Clock className="w-3.5 h-3.5 text-ink-tertiary" />
						<span className="font-display text-[10px] uppercase tracking-widest text-ink-tertiary hidden sm:block">
							Tiempo promedio
						</span>
						<span className="font-kds text-3xl leading-none text-brand-500 ml-1">
							{avgMins}
							<span className="text-xs font-body text-ink-tertiary ml-0.5">
								min
							</span>
						</span>
					</div>

					<div className="ml-auto flex items-center gap-2 text-ink-tertiary shrink-0 hidden sm:flex">
						{/* Connection status dot */}
						<span
							className={clsx(
								"w-2 h-2 rounded-full",
								pollError
									? "bg-red-500 shadow-[0_0_6px_#ef4444]"
									: "bg-emerald-500 shadow-[0_0_6px_#10b981]",
							)}
						/>
						<span className="font-display text-[10px] uppercase tracking-widest">
							KDS — My Way Bar &amp; Pool
						</span>
					</div>
				</div>
			</footer>
			<HelpButton {...helpContent.kitchenBoard} variant="float" />
		</div>
	);
}
