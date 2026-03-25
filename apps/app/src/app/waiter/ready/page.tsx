"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
	Home,
	CheckCircle2,
	CreditCard,
	Bell,
	Loader2,
	PackageCheck,
} from "lucide-react";
import clsx from "clsx";
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
}

interface Order {
	id: string;
	tableId: string;
	tableNumber: number;
	status: string;
	createdAt: string;
	items: OrderItem[];
}

// ─── Polling hook ─────────────────────────────────────────────────────────────

function usePolling<T>(url: string, interval = 5000) {
	const [data, setData] = useState<T | null>(null);
	useEffect(() => {
		let active = true;
		const go = async () => {
			const res = await fetch(url);
			if (active && res.ok) setData(await res.json());
		};
		go();
		const id = setInterval(go, interval);
		return () => {
			active = false;
			clearInterval(id);
		};
	}, [url, interval]);
	return data;
}

// ─── Ready item row ───────────────────────────────────────────────────────────

function ReadyItemRow({
	orderId,
	tableNumber,
	item,
	onDeliver,
}: {
	orderId: string;
	tableNumber: number;
	item: OrderItem;
	onDeliver: (orderId: string, itemId: string) => void;
}) {
	const [loading, setLoading] = useState(false);

	async function handleDeliver() {
		setLoading(true);
		onDeliver(orderId, item.id);
		try {
			await fetch(`/api/orders/${orderId}/items/${item.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "delivered" }),
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<div
			className="flex items-center gap-3"
			style={{ padding: "14px 16px", minHeight: 76 }}
		>
			<div
				className="font-kds leading-none text-center shrink-0"
				style={{ fontSize: 34, width: 36, color: "#10b981" }}
			>
				{item.qty}
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-display text-sm font-bold text-ink-primary leading-tight">
					{item.name}
				</p>
				<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest mt-0.5">
					Mesa {tableNumber}
				</p>
			</div>
			<button
				onClick={handleDeliver}
				disabled={loading}
				className="shrink-0 btn-green rounded-xl active:scale-95"
				style={{
					minWidth: 110,
					minHeight: 52,
					fontSize: 13,
					padding: "12px 18px",
					boxShadow: "0 0 18px rgba(16,185,129,0.35)",
				}}
			>
				{loading ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					<>
						<CheckCircle2 className="w-4 h-4" />
						ENTREGADO
					</>
				)}
			</button>
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReadyPage() {
	const rawOrders = usePolling<Order[]>("/api/orders", 5000);
	const [optimisticOrders, setOptimisticOrders] = useState<Order[] | null>(
		null,
	);
	const [deliveringAll, setDeliveringAll] = useState<Set<number>>(new Set());

	useEffect(() => {
		if (rawOrders) setOptimisticOrders(rawOrders);
	}, [rawOrders]);

	const orders = optimisticOrders ?? rawOrders ?? [];

	// Groups: tableNumber -> { tableNumber, items: { orderId, item }[] }
	const groupedByTable = useMemo(() => {
		const activeOrders = orders.filter(
			(o) => o.status !== "closed" && o.status !== "cancelled",
		);
		const map = new Map<
			number,
			{
				tableNumber: number;
				tableId: string;
				entries: { orderId: string; item: OrderItem }[];
			}
		>();
		for (const order of activeOrders) {
			for (const item of order.items) {
				if (item.status !== "ready") continue;
				const existing = map.get(order.tableNumber);
				if (existing) {
					existing.entries.push({ orderId: order.id, item });
				} else {
					map.set(order.tableNumber, {
						tableNumber: order.tableNumber,
						tableId: order.tableId,
						entries: [{ orderId: order.id, item }],
					});
				}
			}
		}
		return Array.from(map.values()).sort(
			(a, b) => a.tableNumber - b.tableNumber,
		);
	}, [orders]);

	const totalReadyCount = useMemo(
		() => groupedByTable.reduce((sum, g) => sum + g.entries.length, 0),
		[groupedByTable],
	);

	function handleOptimisticDeliver(orderId: string, itemId: string) {
		setOptimisticOrders((prev) => {
			if (!prev) return prev;
			return prev.map((o) => {
				if (o.id !== orderId) return o;
				return {
					...o,
					items: o.items.map((item) =>
						item.id === itemId ? { ...item, status: "delivered" } : item,
					),
				};
			});
		});
	}

	async function handleDeliverAll(
		tableNumber: number,
		entries: { orderId: string; item: OrderItem }[],
	) {
		setDeliveringAll((prev) => new Set(prev).add(tableNumber));

		// Optimistic update: mark all items as delivered
		setOptimisticOrders((prev) => {
			if (!prev) return prev;
			const itemIds = new Set(entries.map((e) => e.item.id));
			return prev.map((o) => ({
				...o,
				items: o.items.map((item) =>
					itemIds.has(item.id) ? { ...item, status: "delivered" } : item,
				),
			}));
		});

		// Fire all PATCH requests in parallel
		try {
			await Promise.all(
				entries.map(({ orderId, item }) =>
					fetch(`/api/orders/${orderId}/items/${item.id}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ status: "delivered" }),
					}),
				),
			);
		} finally {
			setDeliveringAll((prev) => {
				const next = new Set(prev);
				next.delete(tableNumber);
				return next;
			});
		}
	}

	return (
		<div
			className="noise-overlay min-h-screen flex flex-col"
			style={{ background: "var(--s0)" }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center gap-3 px-4 top-accent"
				style={{
					background: "rgba(10,10,10,0.95)",
					backdropFilter: "blur(24px)",
					borderBottom: "1px solid var(--s3)",
					position: "sticky",
					paddingTop: 14,
					paddingBottom: 14,
				}}
			>
				{/* Bell icon */}
				<div
					className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
					style={{
						background:
							totalReadyCount > 0
								? "rgba(16,185,129,0.15)"
								: "rgba(255,255,255,0.05)",
						border:
							totalReadyCount > 0
								? "1px solid rgba(16,185,129,0.4)"
								: "1px solid rgba(255,255,255,0.08)",
						boxShadow:
							totalReadyCount > 0 ? "0 0 16px rgba(16,185,129,0.2)" : undefined,
					}}
				>
					<Bell
						className={clsx(
							"w-6 h-6",
							totalReadyCount > 0 ? "text-emerald-400" : "text-ink-disabled",
						)}
					/>
				</div>

				<div className="flex-1 min-w-0">
					<h1
						className="font-kds leading-none text-ink-primary tracking-widest"
						style={{ fontSize: 32 }}
					>
						LISTOS PARA SERVIR
					</h1>
					<p className="font-display text-[11px] text-ink-tertiary uppercase tracking-widest mt-1">
						{totalReadyCount}{" "}
						{totalReadyCount === 1 ? "item listo" : "items listos"}
					</p>
				</div>

				{totalReadyCount > 0 && (
					<div
						className="flex items-center justify-center rounded-xl shrink-0"
						style={{
							width: 52,
							height: 52,
							background: "rgba(16,185,129,0.15)",
							border: "1px solid rgba(16,185,129,0.4)",
							boxShadow: "0 0 20px rgba(16,185,129,0.3)",
						}}
					>
						<span
							className="font-kds leading-none text-emerald-400"
							style={{ fontSize: 28 }}
						>
							{totalReadyCount}
						</span>
					</div>
				)}
			</header>

			{/* Content */}
			<main className="flex-1 p-3 pb-safe">
				{!rawOrders ? (
					<div className="flex flex-col items-center gap-3 pt-20">
						<div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
						<p className="font-display text-xs text-ink-disabled uppercase tracking-widest">
							Cargando...
						</p>
					</div>
				) : groupedByTable.length === 0 ? (
					<div className="flex flex-col items-center gap-5 pt-24">
						<div
							className="w-24 h-24 rounded-3xl flex items-center justify-center"
							style={{
								background: "rgba(16,185,129,0.1)",
								border: "1px solid rgba(16,185,129,0.25)",
								boxShadow: "0 0 32px rgba(16,185,129,0.15)",
							}}
						>
							<CheckCircle2 className="w-12 h-12 text-emerald-400" />
						</div>
						<div className="text-center">
							<p
								className="font-kds text-emerald-400 tracking-widest"
								style={{ fontSize: 32 }}
							>
								TODO ENTREGADO
							</p>
							<p className="font-display text-sm text-ink-tertiary mt-2">
								No hay items listos para servir
							</p>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{groupedByTable.map((group) => {
							const isDeliveringAll = deliveringAll.has(group.tableNumber);
							return (
								<div
									key={group.tableNumber}
									className="card-green overflow-hidden animate-slide-up"
									style={{
										boxShadow:
											"0 0 28px rgba(16,185,129,0.14), 0 2px 18px rgba(0,0,0,0.45)",
									}}
								>
									{/* Table header */}
									<div
										className="flex items-center justify-between px-4 py-3 border-b border-surface-3"
										style={{ background: "rgba(16,185,129,0.09)" }}
									>
										<div className="flex items-center gap-3">
											<span
												className="font-kds leading-none"
												style={{
													fontSize: 56,
													color: "#10b981",
													textShadow: "0 0 20px rgba(16,185,129,0.5)",
												}}
											>
												{group.tableNumber}
											</span>
											<div>
												<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
													Mesa
												</p>
												<p
													className="font-display text-xs font-bold"
													style={{ color: "#34d399" }}
												>
													{group.entries.length}{" "}
													{group.entries.length === 1
														? "item listo"
														: "items listos"}
												</p>
											</div>
										</div>
										<span className="badge badge-ready animate-blink">
											<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
											Listo
										</span>
									</div>

									{/* Items */}
									<div className="divide-y divide-surface-3">
										{group.entries.map(({ orderId, item }) => (
											<ReadyItemRow
												key={`${orderId}-${item.id}`}
												orderId={orderId}
												tableNumber={group.tableNumber}
												item={item}
												onDeliver={handleOptimisticDeliver}
											/>
										))}
									</div>

									{/* Entregar Todo button */}
									{group.entries.length > 1 && (
										<div
											className="px-4 py-3 border-t border-surface-3"
											style={{ background: "rgba(16,185,129,0.05)" }}
										>
											<button
												onClick={() =>
													handleDeliverAll(group.tableNumber, group.entries)
												}
												disabled={isDeliveringAll}
												className="w-full flex items-center justify-center gap-2 rounded-xl font-display font-bold text-sm uppercase tracking-widest transition-all active:scale-95"
												style={{
													minHeight: 52,
													background: "rgba(16,185,129,0.2)",
													color: "#34d399",
													border: "1px solid rgba(16,185,129,0.4)",
													boxShadow: "0 0 16px rgba(16,185,129,0.2)",
												}}
											>
												{isDeliveringAll ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<>
														<PackageCheck className="w-4 h-4" />
														ENTREGAR TODO
													</>
												)}
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</main>

			{/* Bottom nav */}
			<nav className="mobile-nav">
				<Link href="/waiter/tables" className="mobile-nav-item">
					<Home size={20} />
					Mesas
				</Link>
				<Link href="/waiter/ready" className="mobile-nav-item active">
					<div className="relative">
						<CheckCircle2 size={20} />
						{totalReadyCount > 0 && (
							<span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-surface-0 font-kds text-[10px] leading-none flex items-center justify-center">
								{totalReadyCount}
							</span>
						)}
					</div>
					Listos
				</Link>
				<Link href="/waiter/payment" className="mobile-nav-item">
					<CreditCard size={20} />
					Cuenta
				</Link>
			</nav>
			<HelpButton {...helpContent.waiterReady} variant="float" />
		</div>
	);
}
