"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	Home,
	CheckCircle2,
	CreditCard,
	Bell,
	Users,
	Clock,
} from "lucide-react";
import clsx from "clsx";
import { formatCurrency, formatTime, elapsedMinutes } from "@/lib/utils";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Zone {
	id: string;
	name: string;
	order: number;
}

interface Table {
	id: string;
	number: number;
	zoneId: string;
	zone: Zone;
	type: string;
	status: "available" | "occupied" | "reserved";
	seats: number;
	x: number;
	y: number;
	w: number;
	h: number;
}

interface OrderItem {
	id: string;
	name: string;
	qty: number;
	price: number;
	status: string;
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

// ─── Table card ───────────────────────────────────────────────────────────────

function TableCard({
	table,
	ordersForTable,
}: {
	table: Table;
	ordersForTable: Order[];
}) {
	const router = useRouter();
	const total = useMemo(() => {
		return ordersForTable.reduce((sum, o) => {
			return sum + o.items.reduce((s, i) => s + i.qty * i.price, 0);
		}, 0);
	}, [ordersForTable]);

	const itemCount = useMemo(() => {
		return ordersForTable.reduce(
			(sum, o) => sum + o.items.filter((i) => i.status !== "cancelled").length,
			0,
		);
	}, [ordersForTable]);

	const oldestOrder = ordersForTable.reduce<Order | null>((oldest, o) => {
		if (!oldest) return o;
		return new Date(o.createdAt) < new Date(oldest.createdAt) ? o : oldest;
	}, null);

	const elapsed = oldestOrder ? elapsedMinutes(oldestOrder.createdAt) : 0;

	const isAvailable = table.status === "available";
	const isOccupied = table.status === "occupied";
	const isReserved = table.status === "reserved";

	// Status-based left border color
	const leftBorderColor = isAvailable
		? "#10b981"
		: isOccupied
			? "#f59e0b"
			: "#8b5cf6";

	const bgColor = isAvailable
		? "rgba(16,185,129,0.05)"
		: isOccupied
			? "rgba(245,158,11,0.08)"
			: "rgba(139,92,246,0.07)";

	const boxShadow = isOccupied
		? "0 0 24px rgba(245,158,11,0.12), 0 2px 14px rgba(0,0,0,0.45)"
		: isReserved
			? "0 0 20px rgba(139,92,246,0.1), 0 2px 14px rgba(0,0,0,0.45)"
			: "0 2px 12px rgba(0,0,0,0.35)";

	const statusLabels: Record<string, string> = {
		available: "Libre",
		occupied: "Ocupada",
		reserved: "Reservada",
	};

	return (
		<button
			onClick={() => router.push(`/waiter/table/${table.id}`)}
			className="flex flex-col rounded-2xl border transition-all duration-150 active:scale-95 text-left w-full"
			style={{
				background: bgColor,
				borderColor: "rgba(255,255,255,0.06)",
				borderLeftColor: leftBorderColor,
				borderLeftWidth: 4,
				boxShadow,
				padding: "14px 14px 12px",
				minHeight: 130,
			}}
		>
			{/* Top row: number + status */}
			<div className="flex items-start justify-between w-full mb-1.5">
				<div className="flex items-baseline gap-1.5">
					<span
						className="font-kds leading-none text-ink-primary"
						style={{ fontSize: "clamp(48px,10vw,64px)" }}
					>
						{table.number}
					</span>
					{table.type === "pool" && (
						<span
							className="pool-chip-badge font-display font-bold text-[9px] uppercase tracking-widest"
							style={{ letterSpacing: "0.15em" }}
						>
							POOL
						</span>
					)}
				</div>
				<span
					className={clsx("badge mt-0.5", {
						"badge-available": isAvailable,
						"badge-occupied": isOccupied,
						"badge-reserved": isReserved,
					})}
				>
					{statusLabels[table.status] ?? table.status}
				</span>
			</div>

			{/* Zone + seats */}
			<div className="flex items-center gap-2 mb-auto">
				<div
					className="font-display uppercase tracking-widest rounded-lg px-2 py-0.5"
					style={{
						fontSize: 9,
						letterSpacing: "0.25em",
						color: "#6b6b6b",
						background: "rgba(255,255,255,0.04)",
						border: "1px solid rgba(255,255,255,0.07)",
					}}
				>
					{table.zone?.name ?? "Salón"}
				</div>
				<div className="flex items-center gap-1">
					<Users className="w-3 h-3 text-ink-disabled" />
					<span className="font-display text-[10px] text-ink-disabled">
						{table.seats}
					</span>
				</div>
			</div>

			{/* Available: LIBRE label */}
			{isAvailable && (
				<div
					className="mt-2 pt-2 border-t w-full"
					style={{ borderColor: "rgba(16,185,129,0.2)" }}
				>
					<span
						className="font-kds tracking-widest"
						style={{ fontSize: 14, color: "#10b981", letterSpacing: "0.2em" }}
					>
						LIBRE
					</span>
				</div>
			)}

			{/* Occupied: elapsed + items + total */}
			{isOccupied && oldestOrder && (
				<div
					className="mt-2.5 pt-2.5 border-t w-full flex items-center justify-between"
					style={{ borderColor: "rgba(245,158,11,0.2)" }}
				>
					<div className="flex items-center gap-1.5">
						<Clock className="w-3.5 h-3.5 text-brand-500" />
						<span
							className="font-kds text-brand-500 leading-none"
							style={{ fontSize: 24 }}
						>
							{elapsed}
							<span className="text-[10px] font-body text-ink-tertiary ml-0.5">
								min
							</span>
						</span>
						{itemCount > 0 && (
							<span className="font-display text-[10px] text-ink-disabled ml-1">
								· {itemCount} ítems
							</span>
						)}
					</div>
					{total > 0 && (
						<span
							className="font-kds text-ink-secondary leading-none"
							style={{ fontSize: 16 }}
						>
							{formatCurrency(total)}
						</span>
					)}
				</div>
			)}

			{/* Reserved time */}
			{isReserved && oldestOrder && (
				<div
					className="mt-2.5 pt-2.5 border-t w-full"
					style={{ borderColor: "rgba(139,92,246,0.2)" }}
				>
					<span className="font-display text-[10px] text-purple-400 uppercase tracking-wide">
						{formatTime(oldestOrder.createdAt)}
					</span>
				</div>
			)}
		</button>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WaiterTablesPage() {
	const tables = usePolling<Table[]>("/api/tables", 5000);
	const orders = usePolling<Order[]>("/api/orders", 5000);
	const [zones, setZones] = useState<Zone[]>([]);
	const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
	const [waiterName, setWaiterName] = useState<string>("");

	useEffect(() => {
		if (typeof window !== "undefined") {
			try {
				const stored = localStorage.getItem("myway-waiter-staff");
				if (stored) {
					const staff = JSON.parse(stored) as { name: string };
					setWaiterName(staff.name);
				} else {
					setWaiterName("Mozo");
				}
			} catch {
				setWaiterName("Mozo");
			}
		}
	}, []);

	useEffect(() => {
		fetch("/api/zones")
			.then((r) => r.json())
			.then((data: Zone[]) => {
				const sorted = [...data].sort((a, b) => a.order - b.order);
				setZones(sorted);
				if (sorted.length > 0 && activeZoneId === null) {
					setActiveZoneId(sorted[0].id);
				}
			});
	}, []);

	const readyCount = useMemo(() => {
		if (!orders) return 0;
		return orders.reduce((count, o) => {
			return count + o.items.filter((i) => i.status === "ready").length;
		}, 0);
	}, [orders]);

	const filteredTables = useMemo(() => {
		if (!tables) return [];
		if (!activeZoneId) return tables;
		return tables.filter((t) => t.zoneId === activeZoneId);
	}, [tables, activeZoneId]);

	const availableCount = filteredTables.filter(
		(t) => t.status === "available",
	).length;
	const occupiedCount = filteredTables.filter(
		(t) => t.status === "occupied",
	).length;

	function getOrdersForTable(tableId: string): Order[] {
		if (!orders) return [];
		return orders.filter(
			(o) =>
				o.tableId === tableId &&
				o.status !== "closed" &&
				o.status !== "cancelled",
		);
	}

	return (
		<div
			className="noise-overlay min-h-screen flex flex-col"
			style={{ background: "var(--s0)" }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center justify-between px-4 top-accent"
				style={{
					height: 60,
					background: "rgba(8,8,8,0.95)",
					backdropFilter: "blur(24px)",
					borderBottom: "1px solid var(--s3)",
					position: "sticky",
				}}
			>
				<div className="flex items-center gap-3">
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
					<div className="h-4 w-px bg-surface-4" />
					<span className="font-kds text-3xl leading-none text-ink-primary tracking-widest">
						MESAS
					</span>
				</div>

				<div className="flex items-center gap-2.5">
					{/* Stats pills — bigger and more vibrant */}
					<div className="flex items-center gap-2 mr-1">
						<div
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
							style={{
								background: "rgba(16,185,129,0.12)",
								border: "1px solid rgba(16,185,129,0.3)",
							}}
						>
							<span
								style={{
									width: 7,
									height: 7,
									borderRadius: "50%",
									background: "#10b981",
									display: "inline-block",
									boxShadow: "0 0 6px rgba(16,185,129,0.7)",
								}}
							/>
							<span
								className="font-display font-bold text-[11px] uppercase tracking-wide"
								style={{ color: "#34d399" }}
							>
								{availableCount} libres
							</span>
						</div>
						<div
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
							style={{
								background: "rgba(245,158,11,0.12)",
								border: "1px solid rgba(245,158,11,0.3)",
							}}
						>
							<span
								style={{
									width: 7,
									height: 7,
									borderRadius: "50%",
									background: "#f59e0b",
									display: "inline-block",
									boxShadow: "0 0 6px rgba(245,158,11,0.7)",
								}}
							/>
							<span
								className="font-display font-bold text-[11px] uppercase tracking-wide"
								style={{ color: "#fbbf24" }}
							>
								{occupiedCount} ocupadas
							</span>
						</div>
					</div>

					{/* Waiter name */}
					<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-surface-3">
						<div
							className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
							style={{
								background: "rgba(245,158,11,0.15)",
								border: "1px solid rgba(245,158,11,0.3)",
							}}
						>
							<span className="font-kds text-xs leading-none text-brand-500">
								{waiterName.slice(0, 1).toUpperCase()}
							</span>
						</div>
						<span className="font-display text-xs font-semibold text-ink-primary">
							{waiterName}
						</span>
					</div>

					{/* Bell with ready badge */}
					<Link
						href="/waiter/ready"
						className="relative p-2 rounded-xl transition-all hover:bg-surface-3"
						aria-label="Items listos"
						style={{
							minWidth: 40,
							minHeight: 40,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Bell
							className={clsx(
								"w-5 h-5",
								readyCount > 0 ? "text-brand-500" : "text-ink-tertiary",
							)}
						/>
						{readyCount > 0 && (
							<span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-500 text-surface-0 font-kds text-[9px] leading-none flex items-center justify-center animate-pulse-glow">
								{readyCount}
							</span>
						)}
					</Link>
				</div>
			</header>

			{/* Zone tabs — bigger pill-style */}
			{zones.length > 0 && (
				<div
					className="flex gap-2.5 px-4 py-3.5 overflow-x-auto"
					style={{
						borderBottom: "1px solid var(--s3)",
						scrollbarWidth: "none",
						background: "rgba(12,12,12,0.8)",
					}}
				>
					{zones.map((zone) => {
						const isActive = activeZoneId === zone.id;
						return (
							<button
								key={zone.id}
								onClick={() => setActiveZoneId(zone.id)}
								className="shrink-0 px-6 rounded-full font-display font-bold uppercase tracking-widest transition-all active:scale-95"
								style={{
									minHeight: 44,
									fontSize: 12,
									background: isActive ? "var(--gold)" : "var(--s2)",
									color: isActive ? "#080808" : "#a3a3a3",
									border: isActive
										? "1px solid rgba(245,158,11,0.7)"
										: "1px solid var(--s4)",
									boxShadow: isActive
										? "0 0 16px rgba(245,158,11,0.3)"
										: "none",
								}}
							>
								{zone.name}
							</button>
						);
					})}
				</div>
			)}

			{/* Tables grid */}
			<main className="flex-1 p-3 pb-safe">
				{!tables ? (
					<div className="flex flex-col items-center gap-3 pt-20">
						<div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
						<p className="font-display text-xs text-ink-disabled uppercase tracking-widest">
							Cargando mesas...
						</p>
					</div>
				) : filteredTables.length === 0 ? (
					<div className="flex flex-col items-center gap-3 pt-20">
						<div
							className="w-16 h-16 rounded-2xl flex items-center justify-center"
							style={{ background: "var(--s2)", border: "1px solid var(--s3)" }}
						>
							<Users className="w-8 h-8 text-ink-disabled" />
						</div>
						<p className="font-display text-sm text-ink-tertiary">
							No hay mesas en esta zona
						</p>
					</div>
				) : (
					<div
						className="grid gap-3"
						style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
					>
						{filteredTables.map((table) => (
							<TableCard
								key={table.id}
								table={table}
								ordersForTable={getOrdersForTable(table.id)}
							/>
						))}
					</div>
				)}
			</main>

			{/* Bottom nav */}
			<nav className="mobile-nav">
				<Link href="/waiter/tables" className="mobile-nav-item active">
					<Home size={20} />
					Mesas
				</Link>
				<Link href="/waiter/ready" className="mobile-nav-item relative">
					<div className="relative">
						<CheckCircle2 size={20} />
						{readyCount > 0 && (
							<span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-surface-0 font-kds text-[10px] leading-none flex items-center justify-center">
								{readyCount}
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

			<style>{`
        @media (min-width: 640px) {
          main .grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (min-width: 900px) {
          main .grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
			<HelpButton {...helpContent.waiterTables} variant="float" />
		</div>
	);
}
