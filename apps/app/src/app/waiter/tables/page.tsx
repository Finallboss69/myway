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

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
	const cls = clsx("badge", {
		"badge-available": status === "available",
		"badge-occupied": status === "occupied",
		"badge-reserved": status === "reserved",
	});
	const labels: Record<string, string> = {
		available: "Libre",
		occupied: "Ocupada",
		reserved: "Reservada",
	};
	return <span className={cls}>{labels[status] ?? status}</span>;
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

	const oldestOrder = ordersForTable.reduce<Order | null>((oldest, o) => {
		if (!oldest) return o;
		return new Date(o.createdAt) < new Date(oldest.createdAt) ? o : oldest;
	}, null);

	const elapsed = oldestOrder ? elapsedMinutes(oldestOrder.createdAt) : 0;

	const borderColor =
		table.status === "available"
			? "rgba(16,185,129,0.3)"
			: table.status === "occupied"
				? "rgba(245,158,11,0.35)"
				: "rgba(139,92,246,0.35)";

	const bgColor =
		table.status === "available"
			? "rgba(16,185,129,0.04)"
			: table.status === "occupied"
				? "rgba(245,158,11,0.05)"
				: "rgba(139,92,246,0.05)";

	return (
		<button
			onClick={() => router.push(`/waiter/table/${table.id}`)}
			className="flex flex-col p-4 rounded-2xl border transition-all duration-150 active:scale-95 text-left w-full"
			style={{
				background: bgColor,
				borderColor: borderColor,
			}}
		>
			{/* Top row: number + type icon */}
			<div className="flex items-start justify-between w-full mb-2">
				<div className="flex items-baseline gap-2">
					<span className="font-kds text-5xl leading-none text-ink-primary">
						{table.number}
					</span>
					<span className="text-xl" title={table.type}>
						{table.type === "pool" ? "🎱" : table.type === "bar" ? "🍺" : ""}
					</span>
				</div>
				<StatusBadge status={table.status} />
			</div>

			{/* Seats */}
			<div className="flex items-center gap-1.5 mb-2">
				<Users className="w-3 h-3 text-ink-tertiary" />
				<span className="font-display text-[10px] text-ink-tertiary uppercase tracking-wide">
					{table.seats} lugares
				</span>
			</div>

			{/* Occupied details */}
			{table.status === "occupied" && oldestOrder && (
				<div className="mt-auto pt-2 border-t border-surface-3 w-full flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<Clock className="w-3 h-3 text-brand-500" />
						<span className="font-kds text-lg leading-none text-brand-500">
							{elapsed}
							<span className="text-[10px] font-body text-ink-tertiary ml-0.5">
								min
							</span>
						</span>
					</div>
					{total > 0 && (
						<span className="font-kds text-lg leading-none text-ink-secondary">
							{formatCurrency(total)}
						</span>
					)}
				</div>
			)}

			{/* Reserved time */}
			{table.status === "reserved" && oldestOrder && (
				<div className="mt-auto pt-2 border-t border-surface-3 w-full">
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
			setWaiterName(localStorage.getItem("myway_waiter_name") ?? "Mozo");
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
			className="min-h-screen flex flex-col"
			style={{ background: "var(--s0)" }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
				style={{
					background: "rgba(10,10,10,0.92)",
					backdropFilter: "blur(20px)",
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<div className="flex items-center gap-3">
					<div
						className="font-kds text-brand-500 select-none"
						style={{ fontSize: 28, letterSpacing: "0.15em", lineHeight: 1 }}
					>
						MY WAY
					</div>
					<div className="h-5 w-px bg-surface-4" />
					<div className="flex flex-col">
						<span className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
							Hola,
						</span>
						<span className="font-display text-sm font-semibold text-ink-primary leading-tight">
							{waiterName}
						</span>
					</div>
				</div>

				<button
					className="btn-ghost p-2 rounded-xl"
					aria-label="Notificaciones"
				>
					<Bell className="w-5 h-5 text-ink-tertiary" />
				</button>
			</header>

			{/* Zone tabs */}
			{zones.length > 0 && (
				<div
					className="flex gap-2 px-4 py-3 overflow-x-auto"
					style={{ borderBottom: "1px solid var(--s3)" }}
				>
					{zones.map((zone) => (
						<button
							key={zone.id}
							onClick={() => setActiveZoneId(zone.id)}
							className={clsx(
								"shrink-0 px-4 py-2 rounded-xl font-display text-xs font-bold uppercase tracking-widest transition-all",
								activeZoneId === zone.id
									? "bg-brand-500 text-surface-0 shadow-gold-sm"
									: "bg-surface-2 text-ink-secondary border border-surface-3 hover:border-brand-500/30 hover:text-ink-primary",
							)}
						>
							{zone.name}
						</button>
					))}
				</div>
			)}

			{/* Tables grid */}
			<main className="flex-1 p-4 pb-safe">
				{!tables ? (
					<div className="flex justify-center pt-16">
						<div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
					</div>
				) : filteredTables.length === 0 ? (
					<div className="flex flex-col items-center gap-3 pt-20">
						<span className="text-4xl">🍽️</span>
						<p className="font-display text-sm text-ink-tertiary">
							No hay mesas en esta zona
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-3">
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
		</div>
	);
}
