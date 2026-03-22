"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Bell,
	LogOut,
	Home,
	List,
	CreditCard,
	Users,
	BellRing,
	X,
	Check,
	CheckCircle2,
} from "lucide-react";
import { ZONES, formatCurrency, elapsedMinutes } from "@/data/mock";
import { useAppStore } from "@/store/useAppStore";
import clsx from "clsx";

const WAITER_NAME = "Lucía Fernández";
const WAITER_AVATAR = "LF";
const AVATAR_BG = "#7c3aed";

type StatusKey = "available" | "occupied" | "reserved";

const STATUS_STRIP: Record<StatusKey, string> = {
	available: "linear-gradient(90deg, #10b981 0%, transparent 100%)",
	occupied: "linear-gradient(90deg, #f59e0b 0%, transparent 100%)",
	reserved: "linear-gradient(90deg, #8b5cf6 0%, transparent 100%)",
};

const STATUS_BORDER: Record<StatusKey, string> = {
	available: "rgba(16,185,129,0.3)",
	occupied: "rgba(245,158,11,0.3)",
	reserved: "rgba(139,92,246,0.3)",
};

export default function WaiterTablesPage() {
	const router = useRouter();
	const [activeZone, setActiveZone] = useState("z1");
	const [showNotifs, setShowNotifs] = useState(false);
	const [toast, setToast] = useState<{ id: string; message: string } | null>(
		null,
	);

	const tables = useAppStore((s) => s.tables);
	const orders = useAppStore((s) => s.orders);
	const notifications = useAppStore((s) => s.notifications);
	const markNotificationRead = useAppStore((s) => s.markNotificationRead);
	const unreadCount = useAppStore(
		(s) => s.notifications.filter((n) => !n.read).length,
	);

	// Toast for kitchen/bar ready notifications
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

	const zoneTables = tables.filter((t) => t.zoneId === activeZone);

	// Count ready items across all active orders
	const readyCount = useMemo(
		() =>
			orders
				.filter((o) => o.status !== "closed" && o.status !== "cancelled")
				.flatMap((o) => o.items)
				.filter((i) => i.status === "ready").length,
		[orders],
	);

	const getTableTotal = (tableId: string) => {
		const tableOrders = orders.filter(
			(o) => o.tableId === tableId && o.status !== "closed",
		);
		return tableOrders.reduce(
			(sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.qty, 0),
			0,
		);
	};

	const getTableItemCount = (tableId: string) => {
		const tableOrders = orders.filter(
			(o) => o.tableId === tableId && o.status !== "closed",
		);
		return tableOrders.reduce(
			(sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
			0,
		);
	};

	const getOldestOrderTime = (tableId: string) => {
		const tableOrders = orders.filter(
			(o) => o.tableId === tableId && o.status !== "closed",
		);
		if (!tableOrders.length) return null;
		return tableOrders.reduce((oldest, o) =>
			o.createdAt < oldest.createdAt ? o : oldest,
		).createdAt;
	};

	return (
		<div className="min-h-screen bg-surface-0 flex flex-col">
			{/* ── Top bar ── */}
			<div
				className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
				style={{
					background: "rgba(8,8,8,0.88)",
					backdropFilter: "blur(16px)",
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<div className="flex items-center gap-2.5">
					<div
						className="font-display font-bold flex items-center justify-center rounded-full flex-shrink-0 text-white"
						style={{
							width: 36,
							height: 36,
							background: AVATAR_BG,
							fontSize: 13,
						}}
					>
						{WAITER_AVATAR}
					</div>
					<div>
						<div
							className="text-ink-primary font-display font-semibold leading-tight"
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

				<div className="flex items-center gap-1">
					<div
						className="font-kds text-brand-500"
						style={{ fontSize: 20, letterSpacing: "0.12em" }}
					>
						MY WAY
					</div>

					{/* Bell with badge */}
					<button
						className="btn-ghost relative ml-1"
						style={{ padding: 8 }}
						onClick={() => setShowNotifs((v) => !v)}
					>
						<Bell
							size={17}
							className={
								unreadCount > 0 ? "text-brand-500" : "text-ink-secondary"
							}
						/>
						{unreadCount > 0 && (
							<span
								className="font-display font-bold text-surface-0 bg-brand-500 rounded-full absolute"
								style={{
									fontSize: 8,
									minWidth: 16,
									height: 16,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									top: 2,
									right: 2,
									padding: "0 3px",
								}}
							>
								{unreadCount}
							</span>
						)}
					</button>

					<button
						className="btn-ghost"
						style={{ padding: 8 }}
						onClick={() => router.push("/waiter")}
					>
						<LogOut size={16} className="text-ink-tertiary" />
					</button>
				</div>
			</div>

			{/* ── Zone tabs ── */}
			<div
				className="flex px-4 pt-2.5 gap-1"
				style={{ borderBottom: "1px solid var(--s3)" }}
			>
				{ZONES.map((zone) => {
					const isActive = activeZone === zone.id;
					return (
						<button
							key={zone.id}
							onClick={() => setActiveZone(zone.id)}
							className={clsx(
								"relative font-display uppercase px-4 py-2.5 transition-all duration-150",
								isActive
									? "text-brand-500"
									: "text-ink-tertiary hover:text-ink-secondary",
							)}
							style={{ fontSize: 11, letterSpacing: "0.1em" }}
						>
							{zone.name}
							{isActive && (
								<span
									style={{
										position: "absolute",
										bottom: 0,
										left: 8,
										right: 8,
										height: 2,
										background: "#f59e0b",
										borderRadius: "2px 2px 0 0",
										boxShadow: "0 0 8px rgba(245,158,11,0.6)",
									}}
								/>
							)}
						</button>
					);
				})}
			</div>

			{/* ── Table grid ── */}
			<main className="flex-1 px-3 py-4 pb-safe" style={{ overflowY: "auto" }}>
				<div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
					{zoneTables.map((table, idx) => {
						const status = table.status as StatusKey;
						const total = getTableTotal(table.id);
						const itemCount = getTableItemCount(table.id);
						const oldestTime = getOldestOrderTime(table.id);
						const elapsed = oldestTime ? elapsedMinutes(oldestTime) : 0;

						return (
							<a
								key={table.id}
								href={`/waiter/table/${table.id}`}
								className="animate-slide-up block"
								style={{
									textDecoration: "none",
									animationDelay: `${idx * 40}ms`,
								}}
							>
								<div
									className="card-sm flex flex-col overflow-hidden cursor-pointer transition-all duration-150 active:scale-95"
									style={{
										borderColor: STATUS_BORDER[status],
										minHeight: 138,
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLElement).style.boxShadow =
											status === "occupied"
												? "0 0 20px rgba(245,158,11,0.14)"
												: status === "available"
													? "0 0 20px rgba(16,185,129,0.1)"
													: "0 0 20px rgba(139,92,246,0.1)";
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLElement).style.boxShadow = "";
									}}
								>
									{/* Status strip */}
									<div
										style={{ height: 4, background: STATUS_STRIP[status] }}
									/>

									<div className="flex flex-col gap-1.5 p-3 flex-1">
										{/* Number + icon */}
										<div className="flex items-start justify-between">
											<div
												className="font-kds text-ink-primary leading-none"
												style={{ fontSize: 44 }}
											>
												{table.number}
											</div>
											<div
												style={{ fontSize: 20, lineHeight: 1, marginTop: 3 }}
											>
												{table.type === "pool" ? "🎱" : "🍺"}
											</div>
										</div>

										{/* Seats */}
										<div className="flex items-center gap-1 text-ink-tertiary">
											<Users size={11} />
											<span className="font-body" style={{ fontSize: 10 }}>
												{table.seats} personas
											</span>
										</div>

										{/* Status badge + elapsed */}
										<div className="flex items-center gap-1.5 mt-0.5">
											<div
												className={`dot-${status}`}
												style={{
													width: 6,
													height: 6,
													borderRadius: "50%",
													flexShrink: 0,
												}}
											/>
											<span
												className={clsx("badge", `badge-${status}`)}
												style={{ fontSize: 9, padding: "2px 8px" }}
											>
												{status === "available"
													? "Libre"
													: status === "occupied"
														? "Ocupada"
														: "Reservada"}
											</span>
											{status === "occupied" && (
												<span
													className="text-ink-tertiary font-body ml-auto"
													style={{ fontSize: 10 }}
													suppressHydrationWarning
												>
													{elapsed}m
												</span>
											)}
										</div>

										{/* Occupied detail */}
										{status === "occupied" && (
											<div
												className="mt-1.5 pt-2 flex items-center justify-between"
												style={{ borderTop: "1px solid var(--s3)" }}
											>
												<div>
													<div
														className="text-brand-500 font-display font-bold"
														style={{ fontSize: 13 }}
													>
														{formatCurrency(total)}
													</div>
													<div
														className="text-ink-tertiary font-body"
														style={{ fontSize: 10 }}
													>
														{itemCount} ítems
													</div>
												</div>
												<span
													className="text-ink-tertiary font-body"
													style={{ fontSize: 12 }}
												>
													Ver →
												</span>
											</div>
										)}

										{/* Available hint */}
										{status === "available" && (
											<div
												className="text-pool-500 font-body mt-auto"
												style={{ fontSize: 11 }}
											>
												Sentar aquí →
											</div>
										)}

										{/* Reserved hint */}
										{status === "reserved" && (
											<div
												className="font-body mt-auto"
												style={{ fontSize: 11, color: "#a78bfa" }}
											>
												Reservada →
											</div>
										)}
									</div>
								</div>
							</a>
						);
					})}
				</div>
			</main>

			{/* ── Bottom nav ── */}
			<nav className="mobile-nav">
				<a href="/waiter/tables" className="mobile-nav-item active">
					<Home size={20} />
					<span>Mesas</span>
				</a>
				<a href="/waiter/ready" className="mobile-nav-item relative">
					<CheckCircle2 size={20} />
					{readyCount > 0 && (
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
							{readyCount}
						</span>
					)}
					<span>Listos</span>
				</a>
				<a href="/waiter/payment?tableId=t2" className="mobile-nav-item">
					<CreditCard size={20} />
					<span>Cuenta</span>
				</a>
			</nav>

			{/* ── Notification drawer ── */}
			{showNotifs && (
				<div
					className="fixed inset-0 z-50 flex flex-col justify-end animate-fade-in"
					onClick={() => setShowNotifs(false)}
				>
					<div
						className="animate-slide-up rounded-t-3xl overflow-hidden max-h-[70vh] flex flex-col"
						style={{
							background: "rgba(16,16,16,0.97)",
							backdropFilter: "blur(20px)",
							border: "1px solid var(--s3)",
							borderBottom: "none",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div
							className="flex items-center justify-between px-5 py-4"
							style={{ borderBottom: "1px solid var(--s3)" }}
						>
							<div className="flex items-center gap-2">
								<BellRing size={15} className="text-brand-500" />
								<span
									className="font-display font-bold text-ink-primary uppercase"
									style={{ fontSize: 12, letterSpacing: "0.1em" }}
								>
									Notificaciones
								</span>
								{unreadCount > 0 && (
									<span
										className="font-display font-bold text-surface-0 bg-brand-500 rounded-full flex items-center justify-center"
										style={{
											fontSize: 9,
											minWidth: 18,
											height: 18,
											padding: "0 4px",
										}}
									>
										{unreadCount}
									</span>
								)}
							</div>
							<button
								onClick={() => setShowNotifs(false)}
								className="btn-ghost p-1.5"
							>
								<X size={16} className="text-ink-tertiary" />
							</button>
						</div>
						<div className="overflow-y-auto flex-1">
							{notifications.length === 0 ? (
								<div className="flex flex-col items-center gap-2 py-10 text-ink-tertiary">
									<Bell size={28} />
									<span className="font-display text-xs uppercase tracking-widest">
										Sin notificaciones
									</span>
								</div>
							) : (
								notifications.slice(0, 15).map((notif) => (
									<div
										key={notif.id}
										className="flex items-start gap-3 px-5 py-3 transition-colors"
										style={{
											borderBottom: "1px solid var(--s3)",
											background: notif.read
												? "transparent"
												: "rgba(245,158,11,0.04)",
										}}
									>
										<div
											className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center"
											style={{
												background:
													notif.type === "order_ready"
														? "rgba(16,185,129,0.15)"
														: notif.type === "payment"
															? "rgba(245,158,11,0.15)"
															: "rgba(59,130,246,0.15)",
												border: `1px solid ${notif.type === "order_ready" ? "rgba(16,185,129,0.3)" : notif.type === "payment" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.3)"}`,
											}}
										>
											{notif.type === "order_ready" ? (
												<Check size={12} className="text-pool-400" />
											) : notif.type === "payment" ? (
												<CreditCard size={12} className="text-brand-400" />
											) : (
												<List size={12} className="text-blue-400" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div
												className="font-body text-ink-primary"
												style={{ fontSize: 13 }}
											>
												{notif.message}
											</div>
											<div
												className="font-body text-ink-tertiary mt-0.5"
												style={{ fontSize: 10 }}
												suppressHydrationWarning
											>
												{Math.floor(
													(Date.now() - notif.createdAt.getTime()) / 60000,
												)}
												m atrás
											</div>
										</div>
										{!notif.read && (
											<span className="flex-shrink-0 w-2 h-2 rounded-full bg-brand-500 mt-1.5" />
										)}
									</div>
								))
							)}
						</div>
					</div>
				</div>
			)}

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
