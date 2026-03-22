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

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
	const colors: Record<string, string> = {
		available: "#10b981",
		occupied: "#f59e0b",
		reserved: "#8b5cf6",
	};
	const color = colors[status] ?? "#6b7280";
	return (
		<span
			style={{
				display: "inline-block",
				width: 8,
				height: 8,
				borderRadius: "50%",
				background: color,
				boxShadow: `0 0 6px ${color}`,
				flexShrink: 0,
			}}
		/>
	);
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
			? "rgba(16,185,129,0.35)"
			: table.status === "occupied"
				? "rgba(245,158,11,0.4)"
				: "rgba(139,92,246,0.4)";

	const bgColor =
		table.status === "available"
			? "rgba(16,185,129,0.04)"
			: table.status === "occupied"
				? "rgba(245,158,11,0.06)"
				: "rgba(139,92,246,0.06)";

	const statusLabels: Record<string, string> = {
		available: "Libre",
		occupied: "Ocupada",
		reserved: "Reservada",
	};

	const statusTextColor =
		table.status === "available"
			? "#10b981"
			: table.status === "occupied"
				? "#f59e0b"
				: "#8b5cf6";

	return (
		<button
			onClick={() => router.push(`/waiter/table/${table.id}`)}
			className="flex flex-col rounded-2xl border transition-all duration-150 active:scale-95 text-left w-full"
			style={{
				background: bgColor,
				borderColor: borderColor,
				padding: "14px 14px 12px",
				minHeight: 120,
			}}
		>
			{/* Top row: number + status */}
			<div className="flex items-start justify-between w-full mb-2">
				<div className="flex items-baseline gap-1.5">
					<span
						className="font-kds leading-none text-ink-primary"
						style={{ fontSize: "clamp(36px,8vw,52px)" }}
					>
						{table.number}
					</span>
					{table.type === "pool" && (
						<span className="text-base" title="Mesa de pool">
							🎱
						</span>
					)}
				</div>
				<div className="flex items-center gap-1.5 mt-0.5">
					<StatusDot status={table.status} />
					<span
						className="font-display font-bold uppercase tracking-widest"
						style={{
							fontSize: 9,
							color: statusTextColor,
							letterSpacing: "0.3em",
						}}
					>
						{statusLabels[table.status] ?? table.status}
					</span>
				</div>
			</div>

			{/* Zone badge + seats */}
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

			{/* Occupied details */}
			{table.status === "occupied" && oldestOrder && (
				<div
					className="mt-3 pt-2.5 border-t w-full flex items-center justify-between"
					style={{ borderColor: "rgba(245,158,11,0.2)" }}
				>
					<div className="flex items-center gap-1.5">
						<Clock className="w-3 h-3 text-brand-500" />
						<span
							className="font-kds text-brand-500 leading-none"
							style={{ fontSize: 18 }}
						>
							{elapsed}
							<span className="text-[10px] font-body text-ink-tertiary ml-0.5">
								min
							</span>
						</span>
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
			{table.status === "reserved" && oldestOrder && (
				<div
					className="mt-3 pt-2.5 border-t w-full"
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
			className="min-h-screen flex flex-col"
			style={{ background: "var(--s0)" }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center justify-between px-4"
				style={{
					height: 56,
					background: "rgba(8,8,8,0.94)",
					backdropFilter: "blur(20px)",
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<div className="flex items-center gap-3">
					<img
						src="/logo.svg"
						alt="My Way"
						style={{ height: 22, width: 'auto', filter: 'invert(1)', display: 'block' }}
					/>
					<div className="h-4 w-px bg-surface-4" />
					<div className="flex flex-col">
						<span className="font-display text-[9px] text-ink-disabled uppercase tracking-widest">
							Hola,
						</span>
						<span className="font-display text-xs font-semibold text-ink-primary leading-tight">
							{waiterName}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{/* Quick stats */}
					<div className="hidden sm:flex items-center gap-3 mr-2">
						<div className="flex items-center gap-1.5">
							<span
								style={{
									width: 6,
									height: 6,
									borderRadius: "50%",
									background: "#10b981",
									boxShadow: "0 0 5px #10b981",
									display: "inline-block",
								}}
							/>
							<span className="font-display text-[10px] text-ink-tertiary uppercase tracking-wide">
								{availableCount} libres
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span
								style={{
									width: 6,
									height: 6,
									borderRadius: "50%",
									background: "#f59e0b",
									boxShadow: "0 0 5px #f59e0b",
									display: "inline-block",
								}}
							/>
							<span className="font-display text-[10px] text-ink-tertiary uppercase tracking-wide">
								{occupiedCount} ocupadas
							</span>
						</div>
					</div>
					<button
						className="btn-ghost p-2 rounded-xl relative"
						aria-label="Notificaciones"
					>
						<Bell className="w-4 h-4 text-ink-tertiary" />
						{readyCount > 0 && (
							<span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-brand-500 text-surface-0 font-kds text-[9px] leading-none flex items-center justify-center">
								{readyCount}
							</span>
						)}
					</button>
				</div>
			</header>

			{/* Zone tabs */}
			{zones.length > 0 && (
				<div
					className="flex gap-2 px-4 py-2.5 overflow-x-auto"
					style={{
						borderBottom: "1px solid var(--s3)",
						scrollbarWidth: "none",
					}}
				>
					{zones.map((zone) => (
						<button
							key={zone.id}
							onClick={() => setActiveZoneId(zone.id)}
							className={clsx(
								"shrink-0 px-4 py-2 rounded-xl font-display text-[11px] font-bold uppercase tracking-widest transition-all",
								activeZoneId === zone.id
									? "bg-brand-500 text-surface-0 shadow-gold-sm"
									: "bg-surface-2 text-ink-secondary border border-surface-3 hover:border-brand-500/30 hover:text-ink-primary active:scale-95",
							)}
						>
							{zone.name}
						</button>
					))}
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
		</div>
	);
}
