"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Home, CheckCircle2, CreditCard, Bell, Loader2 } from "lucide-react";
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
			style={{ padding: "13px 16px", minHeight: 68 }}
		>
			<div
				className="font-kds leading-none text-center shrink-0"
				style={{ fontSize: 30, width: 34, color: "#10b981" }}
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
				className="shrink-0 btn-green rounded-xl active:scale-95 min-h-[44px]"
				style={{
					minWidth: 100,
					fontSize: 12,
					padding: "10px 16px",
					boxShadow: "0 0 14px rgba(16,185,129,0.25)",
				}}
			>
				{loading ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					<>
						<CheckCircle2 className="w-3.5 h-3.5" />
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
			className="noise-overlay min-h-screen flex flex-col"
			style={{ background: "var(--s0)" }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 top-accent"
				style={{
					background: "rgba(10,10,10,0.95)",
					backdropFilter: "blur(24px)",
					borderBottom: "1px solid var(--s3)",
					position: "sticky",
				}}
			>
				{/* Bell icon */}
				<div
					className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
					style={{
						background:
							totalReadyCount > 0
								? "rgba(16,185,129,0.12)"
								: "rgba(255,255,255,0.04)",
						border:
							totalReadyCount > 0
								? "1px solid rgba(16,185,129,0.3)"
								: "1px solid rgba(255,255,255,0.07)",
					}}
				>
					<Bell
						className={clsx(
							"w-5 h-5",
							totalReadyCount > 0 ? "text-emerald-400" : "text-ink-disabled",
						)}
					/>
				</div>

				<div className="flex-1 min-w-0">
					<h1 className="font-kds text-2xl leading-none text-ink-primary tracking-widest">
						LISTOS PARA SERVIR
					</h1>
					<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest mt-0.5">
						{totalReadyCount}{" "}
						{totalReadyCount === 1 ? "item listo" : "items listos"}
					</p>
				</div>

				{totalReadyCount > 0 && (
					<div
						className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
						style={{
							background: "rgba(16,185,129,0.12)",
							border: "1px solid rgba(16,185,129,0.3)",
						}}
					>
						<span className="font-kds text-2xl leading-none text-emerald-400">
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
					<div className="flex flex-col items-center gap-4 pt-20">
						<div
							className="w-20 h-20 rounded-3xl flex items-center justify-center"
							style={{
								background: "rgba(16,185,129,0.08)",
								border: "1px solid rgba(16,185,129,0.2)",
							}}
						>
							<CheckCircle2 className="w-10 h-10 text-emerald-400" />
						</div>
						<div className="text-center">
							<p className="font-kds text-2xl text-emerald-400 tracking-widest">
								TODO ENTREGADO
							</p>
							<p className="font-display text-sm text-ink-tertiary mt-1.5">
								No hay items listos para servir
							</p>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{groupedByTable.map((group) => (
							<div
								key={group.tableNumber}
								className="card-green overflow-hidden animate-slide-up"
								style={{
									boxShadow:
										"0 0 24px rgba(16,185,129,0.1), 0 2px 16px rgba(0,0,0,0.4)",
								}}
							>
								{/* Table header */}
								<div
									className="flex items-center justify-between px-4 py-3 border-b border-surface-3"
									style={{ background: "rgba(16,185,129,0.07)" }}
								>
									<div className="flex items-center gap-3">
										<span
											className="font-kds leading-none"
											style={{ fontSize: 44, color: "#10b981" }}
										>
											{group.tableNumber}
										</span>
										<div>
											<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
												Mesa
											</p>
											<p
												className="font-display text-xs font-semibold"
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
