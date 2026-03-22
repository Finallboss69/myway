"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	Home,
	CheckCircle2,
	CreditCard,
	Loader2,
} from "lucide-react";
import clsx from "clsx";

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
			style={{ padding: "12px 16px", minHeight: 64 }}
		>
			<div
				className="font-kds text-brand-500 leading-none text-center shrink-0"
				style={{ fontSize: 28, width: 32 }}
			>
				{item.qty}
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-display text-sm font-semibold text-ink-primary leading-tight">
					{item.name}
				</p>
				<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest mt-0.5">
					Mesa {tableNumber}
				</p>
			</div>
			<button
				onClick={handleDeliver}
				disabled={loading}
				className="shrink-0 btn-green rounded-xl shadow-green-sm active:scale-95"
				style={{
					minWidth: 90,
					minHeight: 44,
					fontSize: 12,
					padding: "10px 14px",
				}}
			>
				{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entregar ✓"}
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

	useEffect(() => {
		if (rawOrders) setOptimisticOrders(rawOrders);
	}, [rawOrders]);

	const orders = optimisticOrders ?? rawOrders ?? [];

	// Groups: tableNumber → { tableNumber, items: { orderId, item }[] }
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

	return (
		<div
			className="min-h-screen flex flex-col"
			style={{ background: "var(--s0)" }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3"
				style={{
					background: "rgba(10,10,10,0.92)",
					backdropFilter: "blur(20px)",
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<Link
					href="/waiter/tables"
					className="btn-ghost p-2 rounded-xl shrink-0"
					aria-label="Volver"
				>
					<ArrowLeft className="w-5 h-5" />
				</Link>

				<div className="flex-1 min-w-0">
					<h1 className="font-display text-sm font-semibold text-ink-primary leading-tight">
						Listos para servir
					</h1>
					<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
						{totalReadyCount}{" "}
						{totalReadyCount === 1 ? "item listo" : "items listos"}
					</p>
				</div>

				{totalReadyCount > 0 && (
					<div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/30 shrink-0">
						<span className="font-kds text-xl leading-none text-brand-500">
							{totalReadyCount}
						</span>
					</div>
				)}
			</header>

			{/* Content */}
			<main className="flex-1 p-3 pb-safe">
				{!rawOrders ? (
					<div className="flex flex-col items-center gap-3 pt-20">
						<div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
						<p className="font-display text-xs text-ink-disabled uppercase tracking-widest">Cargando...</p>
					</div>
				) : groupedByTable.length === 0 ? (
					<div className="flex flex-col items-center gap-4 pt-20">
						<div
							className="w-16 h-16 rounded-2xl flex items-center justify-center"
							style={{ background: "var(--s2)", border: "1px solid var(--s3)" }}
						>
							<CheckCircle2 className="w-8 h-8 text-ink-disabled" />
						</div>
						<div className="text-center">
							<p className="font-kds text-2xl text-ink-secondary tracking-widest">
								TODO ENTREGADO
							</p>
							<p className="font-display text-sm text-ink-tertiary mt-1">
								No hay items listos para servir
							</p>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{groupedByTable.map((group) => (
							<div key={group.tableNumber} className="card-sm overflow-hidden">
								{/* Table header */}
								<div
									className="flex items-center justify-between px-4 py-3 border-b border-surface-3"
									style={{ background: "rgba(16,185,129,0.06)" }}
								>
									<div className="flex items-center gap-3">
										<span
											className="font-kds text-4xl leading-none"
											style={{ color: "#10b981" }}
										>
											{group.tableNumber}
										</span>
										<div>
											<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
												Mesa
											</p>
											<p className="font-display text-xs text-pool-400 font-semibold">
												{group.entries.length}{" "}
												{group.entries.length === 1
													? "item listo"
													: "items listos"}
											</p>
										</div>
									</div>
									<span
										className={clsx("badge", "badge-ready")}
										style={{ animation: "blink 1.5s ease-in-out infinite" }}
									>
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
							</div>
						))}
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
		</div>
	);
}
