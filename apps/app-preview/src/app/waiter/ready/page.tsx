"use client";

import { useMemo, useEffect, useState } from "react";
import {
	Home,
	CheckCircle2,
	CreditCard,
	BellRing,
	Utensils,
	GlassWater,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import clsx from "clsx";

const WAITER_NAME = "Lucía Fernández";

export default function WaiterReadyPage() {
	const _rawOrders = useAppStore((s) => s.orders);
	const updateItemStatus = useAppStore((s) => s.updateItemStatus);
	const notifications = useAppStore((s) => s.notifications);
	const markNotificationRead = useAppStore((s) => s.markNotificationRead);

	// Toast for new ready notifications
	const [toast, setToast] = useState<{ id: string; message: string } | null>(
		null,
	);
	const latestNotif = notifications[0];
	useEffect(() => {
		if (
			latestNotif &&
			!latestNotif.read &&
			latestNotif.type === "order_ready"
		) {
			setToast({ id: latestNotif.id, message: latestNotif.message });
			markNotificationRead(latestNotif.id);
			const t = setTimeout(() => setToast(null), 4500);
			return () => clearTimeout(t);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [latestNotif?.id]);

	// Collect all ready items grouped by table
	const readyGroups = useMemo(() => {
		const activeOrders = _rawOrders.filter(
			(o) => o.status !== "closed" && o.status !== "cancelled",
		);

		// Group ready items by tableNumber
		const byTable: Record<
			string,
			{
				tableId: string;
				tableNumber: number;
				items: Array<{
					orderId: string;
					itemId: string;
					name: string;
					qty: number;
					target: "bar" | "kitchen";
				}>;
			}
		> = {};

		for (const order of activeOrders) {
			const readyItems = order.items.filter((i) => i.status === "ready");
			if (!readyItems.length) continue;

			const key = order.tableId;
			if (!byTable[key]) {
				byTable[key] = {
					tableId: order.tableId,
					tableNumber: order.tableNumber,
					items: [],
				};
			}
			for (const item of readyItems) {
				byTable[key].items.push({
					orderId: order.id,
					itemId: item.id,
					name: item.name,
					qty: item.qty,
					target: item.target,
				});
			}
		}

		return Object.values(byTable).sort((a, b) => a.tableNumber - b.tableNumber);
	}, [_rawOrders]);

	const totalReadyItems = readyGroups.reduce((s, g) => s + g.items.length, 0);

	function handleDeliver(orderId: string, itemId: string) {
		updateItemStatus(orderId, itemId, "delivered");
	}

	function handleDeliverAll(group: (typeof readyGroups)[number]) {
		for (const item of group.items) {
			updateItemStatus(item.orderId, item.itemId, "delivered");
		}
	}

	return (
		<div className="min-h-screen bg-surface-0 flex flex-col max-w-md mx-auto">
			{/* ── Header ── */}
			<div
				className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
				style={{
					background: "rgba(8,8,8,0.92)",
					backdropFilter: "blur(16px)",
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<div className="flex items-center gap-2.5">
					<div
						className="font-display font-bold flex items-center justify-center rounded-full flex-shrink-0 text-white"
						style={{
							width: 34,
							height: 34,
							background: "#7c3aed",
							fontSize: 12,
						}}
					>
						LF
					</div>
					<div>
						<div
							className="font-display font-semibold text-ink-primary leading-tight"
							style={{ fontSize: 13 }}
						>
							{WAITER_NAME}
						</div>
						<div
							className="font-body text-ink-tertiary"
							style={{ fontSize: 10 }}
						>
							Mozo
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<div
						className="font-kds text-brand-500"
						style={{ fontSize: 18, letterSpacing: "0.12em" }}
					>
						MY WAY
					</div>
				</div>
			</div>

			{/* ── Page title ── */}
			<div
				className="flex items-center gap-3 px-4 py-4"
				style={{ borderBottom: "1px solid var(--s3)" }}
			>
				<div
					className="flex items-center justify-center w-10 h-10 rounded-2xl"
					style={{
						background: "rgba(16,185,129,0.12)",
						border: "1px solid rgba(16,185,129,0.3)",
					}}
				>
					<CheckCircle2 size={18} className="text-pool-400" />
				</div>
				<div>
					<div
						className="font-display font-bold text-ink-primary uppercase"
						style={{ fontSize: 13, letterSpacing: "0.08em" }}
					>
						Listos para servir
					</div>
					<div className="font-body text-ink-tertiary" style={{ fontSize: 11 }}>
						{totalReadyItems === 0
							? "Todo entregado"
							: `${totalReadyItems} ítem${totalReadyItems !== 1 ? "s" : ""} esperando`}
					</div>
				</div>
				{totalReadyItems > 0 && (
					<div
						className="ml-auto flex items-center justify-center rounded-full bg-pool-500 text-surface-0 font-kds"
						style={{ minWidth: 32, height: 32, fontSize: 18 }}
					>
						{totalReadyItems}
					</div>
				)}
			</div>

			{/* ── Content ── */}
			<main className="flex-1 px-3 py-4 pb-24 overflow-y-auto">
				{readyGroups.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4 opacity-60">
						<div style={{ fontSize: 52 }}>✅</div>
						<div className="text-center">
							<div
								className="font-display uppercase text-ink-secondary"
								style={{ fontSize: 13, letterSpacing: "0.12em" }}
							>
								Todo entregado
							</div>
							<div
								className="font-body text-ink-tertiary mt-1"
								style={{ fontSize: 12 }}
							>
								No hay ítems listos pendientes
							</div>
						</div>
					</div>
				) : (
					<div className="space-y-3">
						{readyGroups.map((group) => (
							<div
								key={group.tableId}
								className="overflow-hidden rounded-2xl animate-slide-up"
								style={{
									border: "1px solid rgba(16,185,129,0.25)",
									background: "var(--s1)",
								}}
							>
								{/* Table header */}
								<div
									className="flex items-center justify-between px-4 py-3"
									style={{
										background: "rgba(16,185,129,0.06)",
										borderBottom: "1px solid rgba(16,185,129,0.15)",
									}}
								>
									<div className="flex items-center gap-2.5">
										<span
											className="font-kds text-pool-400 leading-none"
											style={{ fontSize: 36 }}
										>
											{group.tableNumber}
										</span>
										<div>
											<div
												className="font-display font-bold text-ink-primary"
												style={{ fontSize: 12, letterSpacing: "0.06em" }}
											>
												Mesa {group.tableNumber}
											</div>
											<div
												className="font-body text-pool-400"
												style={{ fontSize: 10 }}
											>
												{group.items.length} ítem
												{group.items.length !== 1 ? "s" : ""} listo
												{group.items.length !== 1 ? "s" : ""}
											</div>
										</div>
									</div>
									<button
										onClick={() => handleDeliverAll(group)}
										className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-display font-bold uppercase transition-all active:scale-95"
										style={{
											fontSize: 10,
											letterSpacing: "0.08em",
											background: "rgba(16,185,129,0.15)",
											border: "1px solid rgba(16,185,129,0.4)",
											color: "#34d399",
										}}
									>
										<CheckCircle2 size={13} />
										Entregar todo
									</button>
								</div>

								{/* Items */}
								<div className="divide-y divide-surface-3">
									{group.items.map((item) => (
										<div
											key={item.itemId}
											className="flex items-center gap-3 px-4 py-3"
										>
											{/* Target icon */}
											<div
												className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
												style={{
													background:
														item.target === "bar"
															? "rgba(245,158,11,0.12)"
															: "rgba(59,130,246,0.12)",
													border: `1px solid ${item.target === "bar" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.3)"}`,
												}}
											>
												{item.target === "bar" ? (
													<GlassWater size={14} className="text-brand-400" />
												) : (
													<Utensils size={14} className="text-blue-400" />
												)}
											</div>

											{/* Qty + name */}
											<div className="flex-1 min-w-0">
												<div className="flex items-baseline gap-2">
													<span
														className="font-kds text-pool-400 leading-none"
														style={{ fontSize: 22 }}
													>
														{item.qty}
													</span>
													<span
														className="font-body text-ink-primary font-medium truncate"
														style={{ fontSize: 13 }}
													>
														{item.name}
													</span>
												</div>
												<div
													className="font-body text-ink-tertiary"
													style={{ fontSize: 10 }}
												>
													{item.target === "bar" ? "Barra" : "Cocina"}
												</div>
											</div>

											{/* Deliver button */}
											<button
												onClick={() => handleDeliver(item.orderId, item.itemId)}
												className={clsx(
													"flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-display font-bold uppercase transition-all active:scale-95",
												)}
												style={{
													fontSize: 10,
													letterSpacing: "0.06em",
													background: "rgba(16,185,129,0.12)",
													border: "1px solid rgba(16,185,129,0.35)",
													color: "#34d399",
												}}
											>
												<CheckCircle2 size={12} />
												Entregado
											</button>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</main>

			{/* ── Bottom nav ── */}
			<nav className="mobile-nav">
				<a href="/waiter/tables" className="mobile-nav-item">
					<Home size={20} />
					<span>Mesas</span>
				</a>
				<a href="/waiter/ready" className="mobile-nav-item active relative">
					<CheckCircle2 size={20} />
					{totalReadyItems > 0 && (
						<span
							className="font-display font-bold bg-pool-500 text-surface-0 rounded-full absolute"
							style={{
								fontSize: 8,
								minWidth: 15,
								height: 15,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								top: 8,
								right: "calc(50% - 18px)",
								padding: "0 3px",
							}}
						>
							{totalReadyItems}
						</span>
					)}
					<span>Listos</span>
				</a>
				<a href="/waiter/payment?tableId=t2" className="mobile-nav-item">
					<CreditCard size={20} />
					<span>Cuenta</span>
				</a>
			</nav>

			{/* ── Ready notification toast ── */}
			{toast && (
				<div
					className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up"
					style={{ minWidth: 260, maxWidth: 320 }}
				>
					<div
						className="flex items-center gap-3 px-4 py-3 rounded-2xl"
						style={{
							background: "rgba(16,185,129,0.12)",
							border: "1px solid rgba(16,185,129,0.4)",
							backdropFilter: "blur(16px)",
							boxShadow: "0 0 24px rgba(16,185,129,0.2)",
						}}
					>
						<BellRing size={18} className="text-pool-400 flex-shrink-0" />
						<div className="flex-1 min-w-0">
							<div
								className="font-display font-bold text-pool-400"
								style={{ fontSize: 11, letterSpacing: "0.08em" }}
							>
								¡LISTO PARA SERVIR!
							</div>
							<div
								className="text-ink-secondary font-body truncate"
								style={{ fontSize: 12 }}
							>
								{toast.message}
							</div>
						</div>
						<button
							onClick={() => setToast(null)}
							className="text-ink-tertiary hover:text-ink-primary ml-1 flex-shrink-0"
							style={{ fontSize: 16 }}
						>
							×
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
