"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	LayoutGrid,
	ListOrdered,
	LogOut,
	TrendingUp,
	Clock,
	Users,
	ChevronRight,
	ChevronDown,
	Check,
	ShoppingCart,
	GripVertical,
} from "lucide-react";
import { formatCurrency, elapsedMinutes } from "@/lib/utils";
import type {
	Table,
	Order,
	Zone,
	TableShape,
	Product,
	Category,
} from "@/lib/types";
import { apiFetch } from "@/lib/api";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_PAD = 60;
const CANVAS_MIN_W = 800;
const CANVAS_MIN_H = 500;

const STATUS_COLORS: Record<
	string,
	{ border: string; glow: string; bg: string; text: string }
> = {
	available: {
		border: "#10b981",
		glow: "rgba(16,185,129,0.35)",
		bg: "rgba(16,185,129,0.06)",
		text: "#10b981",
	},
	occupied: {
		border: "#f59e0b",
		glow: "rgba(245,158,11,0.40)",
		bg: "rgba(245,158,11,0.08)",
		text: "#f59e0b",
	},
	reserved: {
		border: "#8b5cf6",
		glow: "rgba(139,92,246,0.35)",
		bg: "rgba(139,92,246,0.06)",
		text: "#8b5cf6",
	},
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function POSSidebar({
	activePath,
	staffName,
}: {
	activePath: string;
	staffName?: string;
}) {
	const displayName = staffName || "Cajero";
	const initials = displayName
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<nav
			className="sidebar top-accent"
			style={{ width: 240, position: "relative" }}
		>
			<div
				style={{
					padding: "24px 20px 18px",
					borderBottom: "1px solid var(--s3)",
				}}
			>
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
				<div
					className="font-display text-ink-disabled uppercase"
					style={{ fontSize: 9, letterSpacing: "0.35em", marginTop: 5 }}
				>
					Punto de Venta
				</div>
			</div>

			<div className="flex flex-col gap-0.5 p-2 flex-1 mt-1">
				<Link
					href="/pos/salon"
					className={`sidebar-item ${activePath === "salon" ? "active" : ""}`}
					style={
						activePath === "salon"
							? { borderLeft: "2px solid var(--gold)", paddingLeft: 14 }
							: {}
					}
				>
					<LayoutGrid size={15} />
					Salon
				</Link>
				<Link
					href="/pos/orders"
					className={`sidebar-item ${activePath === "orders" ? "active" : ""}`}
					style={
						activePath === "orders"
							? { borderLeft: "2px solid var(--gold)", paddingLeft: 14 }
							: {}
					}
				>
					<ListOrdered size={15} />
					Pedidos
				</Link>
			</div>

			<div
				style={{ padding: "12px 12px 16px", borderTop: "1px solid var(--s3)" }}
			>
				<div
					className="flex items-center gap-2.5 rounded-xl mb-2"
					style={{
						padding: "10px 12px",
						background: "var(--s2)",
						border: "1px solid var(--s3)",
					}}
				>
					<div
						className="flex items-center justify-center flex-shrink-0"
						style={{
							width: 34,
							height: 34,
							borderRadius: "50%",
							background: "rgba(245,158,11,0.15)",
							border: "1px solid rgba(245,158,11,0.3)",
						}}
					>
						<span
							className="font-kds text-brand-500"
							style={{ fontSize: 13, lineHeight: 1 }}
						>
							{initials}
						</span>
					</div>
					<div className="flex-1 min-w-0">
						<div
							className="font-display text-ink-primary truncate"
							style={{ fontSize: 12, fontWeight: 600 }}
						>
							{displayName}
						</div>
						<div
							className="font-body text-ink-tertiary"
							style={{ fontSize: 10 }}
						>
							Cajera
						</div>
					</div>
				</div>
				<Link
					href="/pos"
					className="sidebar-item"
					style={{ padding: "8px 10px", fontSize: 10 }}
				>
					<LogOut size={13} />
					Cerrar sesion
				</Link>
			</div>
		</nav>
	);
}

// ─── Pool table pocket dots ──────────────────────────────────────────────────

function PoolPockets({ w, h }: { w: number; h: number }) {
	const r = 4;
	const inset = 6;
	const pockets = [
		[inset, inset],
		[w / 2, inset],
		[w - inset, inset],
		[inset, h - inset],
		[w / 2, h - inset],
		[w - inset, h - inset],
	];
	return (
		<>
			{pockets.map(([cx, cy], i) => (
				<div
					key={i}
					style={{
						position: "absolute",
						left: cx - r,
						top: cy - r,
						width: r * 2,
						height: r * 2,
						borderRadius: "50%",
						background: "#0a3d1c",
						border: "1px solid #0d4f24",
					}}
				/>
			))}
		</>
	);
}

// ─── Table card on canvas ────────────────────────────────────────────────────

function FloorTable({
	table,
	order,
	selected,
	onSelect,
	onDropProduct,
}: {
	table: Table;
	order?: Order;
	selected: boolean;
	onSelect: (tableId: string) => void;
	onDropProduct: (tableId: string, productId: string) => void;
}) {
	const [hovered, setHovered] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const elapsed = order ? elapsedMinutes(order.createdAt) : 0;

	const shape: TableShape =
		(table as Table & { shape?: TableShape }).shape ??
		(table.type === "pool" ? "pool" : "square");
	const rotation: number =
		(table as Table & { rotation?: number }).rotation ?? 0;

	const status = table.status;
	const colors = STATUS_COLORS[status] ?? STATUS_COLORS.available;

	const isRound = shape === "round";
	const isPool = shape === "pool";
	const isRect = shape === "rect";

	const borderRadius = isRound ? "50%" : isPool ? 8 : isRect ? 10 : 12;
	const poolBg =
		"linear-gradient(145deg, #1a5c2e 0%, #145025 40%, #0f4420 100%)";

	const baseScale = hovered || dragOver ? 1.06 : 1;
	const glowIntensity = hovered || dragOver ? 1.4 : 1;

	const borderColor = dragOver
		? "#60a5fa"
		: selected
			? "#f59e0b"
			: colors.border;
	const glowColor = dragOver
		? "rgba(96,165,250,0.5)"
		: selected
			? "rgba(245,158,11,0.6)"
			: colors.glow;

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onSelect(table.id)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onSelect(table.id);
			}}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			onDragOver={(e) => {
				e.preventDefault();
				e.dataTransfer.dropEffect = "copy";
				setDragOver(true);
			}}
			onDragLeave={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget as Node)) {
					setDragOver(false);
				}
			}}
			onDrop={(e) => {
				e.preventDefault();
				setDragOver(false);
				const productId = e.dataTransfer.getData("application/x-product-id");
				if (productId) onDropProduct(table.id, productId);
			}}
			style={{
				position: "absolute",
				left: table.x,
				top: table.y,
				width: table.w,
				height: table.h,
				transform: `rotate(${rotation}deg) scale(${baseScale})`,
				transformOrigin: "center center",
				transition:
					"transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
				borderRadius,
				border: `2px solid ${borderColor}`,
				boxShadow: [
					`0 0 ${hovered || dragOver ? 28 : 18}px ${glowColor.replace(/[\d.]+\)$/, `${0.35 * glowIntensity})`)}`,
					selected ? `0 0 0 2px ${borderColor}40` : "",
					`0 4px 16px rgba(0,0,0,0.5)`,
					`inset 0 1px 0 rgba(255,255,255,0.06)`,
				]
					.filter(Boolean)
					.join(", "),
				background: dragOver
					? "rgba(96,165,250,0.12)"
					: isPool
						? poolBg
						: colors.bg,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 2,
				cursor: "pointer",
				overflow: "hidden",
				zIndex: hovered || selected ? 10 : 1,
				outline: "none",
			}}
		>
			{isPool && <PoolPockets w={table.w} h={table.h} />}
			{isPool && (
				<div
					style={{
						position: "absolute",
						inset: 5,
						borderRadius: 4,
						border: "1px solid rgba(255,255,255,0.08)",
						pointerEvents: "none",
					}}
				/>
			)}

			<div
				style={{
					fontFamily: "var(--font-bebas)",
					fontSize: isRound
						? Math.min(Math.min(table.w, table.h) * 0.4, 56)
						: Math.min(table.w * 0.45, 64),
					lineHeight: 0.9,
					color: isPool ? "#4ade80" : colors.text,
					letterSpacing: "0.04em",
					textShadow: `0 0 20px ${isPool ? "#4ade80" : colors.text}60`,
					position: "relative",
					zIndex: 2,
				}}
			>
				{table.number}
			</div>

			<div style={{ position: "relative", zIndex: 2 }}>
				{dragOver ? (
					<div
						style={{
							fontFamily: "var(--font-syne)",
							fontSize: 7,
							fontWeight: 700,
							letterSpacing: "0.22em",
							color: "#60a5fa",
							textTransform: "uppercase",
						}}
					>
						SOLTAR
					</div>
				) : status === "available" ? (
					<div
						style={{
							fontFamily: "var(--font-syne)",
							fontSize: 7,
							fontWeight: 700,
							letterSpacing: "0.22em",
							color: isPool ? "#4ade80" : "#10b981",
							textTransform: "uppercase",
						}}
					>
						LIBRE
					</div>
				) : status === "occupied" && elapsed > 0 ? (
					<div
						style={{
							fontFamily: "var(--font-bebas)",
							fontSize: 15,
							lineHeight: 1,
							color: elapsed > 20 ? "#ef4444" : "#f59e0b",
							letterSpacing: "0.06em",
						}}
					>
						{elapsed}m
					</div>
				) : status === "reserved" ? (
					<div
						style={{
							fontFamily: "var(--font-syne)",
							fontSize: 7,
							fontWeight: 700,
							letterSpacing: "0.22em",
							color: "#a78bfa",
							textTransform: "uppercase",
						}}
					>
						RESERV.
					</div>
				) : null}
			</div>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 2,
					color: isPool ? "rgba(255,255,255,0.35)" : "#555",
					fontSize: 9,
					position: "relative",
					zIndex: 2,
				}}
			>
				<Users size={8} />
				<span style={{ fontFamily: "var(--font-dm-sans)" }}>{table.seats}</span>
			</div>
		</div>
	);
}

// ─── Grid dots SVG pattern ───────────────────────────────────────────────────

function GridDotsPattern() {
	return (
		<svg
			style={{
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
			}}
		>
			<defs>
				<pattern
					id="grid-dots"
					x="0"
					y="0"
					width="40"
					height="40"
					patternUnits="userSpaceOnUse"
				>
					<circle cx="20" cy="20" r="0.8" fill="rgba(255,255,255,0.06)" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid-dots)" />
		</svg>
	);
}

// ─── Canvas with auto-scaling ────────────────────────────────────────────────

function FloorCanvas({
	tables,
	getTableOrder,
	selectedTableId,
	onSelectTable,
	onDropProduct,
}: {
	tables: Table[];
	getTableOrder: (tableId: string) => Order | undefined;
	selectedTableId: string | null;
	onSelectTable: (tableId: string) => void;
	onDropProduct: (tableId: string, productId: string) => void;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				setContainerSize({ w: width, h: height });
			}
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const { canvasW, canvasH, scale } = useMemo(() => {
		if (tables.length === 0) {
			return { canvasW: CANVAS_MIN_W, canvasH: CANVAS_MIN_H, scale: 1 };
		}
		const maxX = Math.max(...tables.map((t) => t.x + t.w));
		const maxY = Math.max(...tables.map((t) => t.y + t.h));
		const cw = Math.max(maxX + CANVAS_PAD, CANVAS_MIN_W);
		const ch = Math.max(maxY + CANVAS_PAD, CANVAS_MIN_H);
		if (containerSize.w === 0 || containerSize.h === 0) {
			return { canvasW: cw, canvasH: ch, scale: 1 };
		}
		const s = Math.min(containerSize.w / cw, containerSize.h / ch, 1);
		return { canvasW: cw, canvasH: ch, scale: s };
	}, [tables, containerSize]);

	return (
		<div
			ref={containerRef}
			className="animate-fade-in"
			style={{
				flex: 1,
				position: "relative",
				overflow: "hidden",
				borderRadius: 16,
				border: "1px solid var(--s3)",
				background: "var(--s1)",
				boxShadow:
					"0 0 0 1px rgba(255,255,255,0.02) inset, 0 8px 32px rgba(0,0,0,0.4)",
			}}
		>
			<div
				style={{
					width: canvasW,
					height: canvasH,
					position: "relative",
					transform: `scale(${scale})`,
					transformOrigin: "top left",
				}}
			>
				<GridDotsPattern />
				<div
					style={{
						position: "absolute",
						bottom: 14,
						right: 18,
						fontFamily: "var(--font-syne)",
						fontSize: 10,
						color: "rgba(255,255,255,0.04)",
						letterSpacing: "0.35em",
						textTransform: "uppercase",
						userSelect: "none",
						pointerEvents: "none",
					}}
				>
					PLANO
				</div>
				{tables.map((table) => (
					<FloorTable
						key={table.id}
						table={table}
						order={getTableOrder(table.id)}
						selected={selectedTableId === table.id}
						onSelect={onSelectTable}
						onDropProduct={onDropProduct}
					/>
				))}
			</div>
		</div>
	);
}

// ─── Quick Panel Item (draggable) ────────────────────────────────────────────

function QuickItem({ product }: { product: Product }) {
	return (
		<div
			draggable
			onDragStart={(e) => {
				e.dataTransfer.setData("application/x-product-id", product.id);
				e.dataTransfer.effectAllowed = "copy";
			}}
			style={{
				padding: "8px 10px",
				borderRadius: 10,
				border: "1px solid var(--s3)",
				background: "var(--s2)",
				cursor: "grab",
				display: "flex",
				alignItems: "center",
				gap: 8,
				transition: "all 0.12s",
				userSelect: "none",
			}}
			onMouseEnter={(e) => {
				(e.currentTarget as HTMLDivElement).style.borderColor =
					"rgba(245,158,11,0.3)";
				(e.currentTarget as HTMLDivElement).style.background = "var(--s3)";
			}}
			onMouseLeave={(e) => {
				(e.currentTarget as HTMLDivElement).style.borderColor = "var(--s3)";
				(e.currentTarget as HTMLDivElement).style.background = "var(--s2)";
			}}
		>
			<GripVertical size={12} style={{ color: "#444", flexShrink: 0 }} />
			<div className="flex-1 min-w-0">
				<div
					className="font-body text-ink-primary truncate"
					style={{ fontSize: 12, fontWeight: 500 }}
				>
					{product.name}
				</div>
			</div>
			<span
				className="font-kds text-brand-500"
				style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}
			>
				{formatCurrency(product.price)}
			</span>
		</div>
	);
}

// ─── Quick Panels (Accordion by category) ───────────────────────────────────

function QuickPanels({
	products,
	categories,
}: {
	products: Product[];
	categories: Category[];
}) {
	const [openCats, setOpenCats] = useState<Set<string>>(new Set());

	const available = useMemo(
		() => products.filter((p) => p.isAvailable),
		[products],
	);

	// Build ordered list of categories that have available products
	const catsWithProducts = useMemo(() => {
		const countMap = new Map<string, number>();
		for (const p of available) {
			countMap.set(p.categoryId, (countMap.get(p.categoryId) ?? 0) + 1);
		}
		return categories
			.filter((c) => (countMap.get(c.id) ?? 0) > 0)
			.map((c) => ({ ...c, count: countMap.get(c.id) ?? 0 }));
	}, [available, categories]);

	const toggleCat = (catId: string) => {
		setOpenCats((prev) => {
			const next = new Set(prev);
			if (next.has(catId)) next.delete(catId);
			else next.add(catId);
			return next;
		});
	};

	return (
		<div
			style={{
				width: 220,
				display: "flex",
				flexDirection: "column",
				borderRight: "1px solid var(--s3)",
				background: "var(--s1)",
				overflow: "hidden",
				flexShrink: 0,
			}}
		>
			{/* Header */}
			<div
				style={{
					padding: "14px 14px 10px",
					borderBottom: "1px solid var(--s3)",
					display: "flex",
					alignItems: "center",
					gap: 6,
				}}
			>
				<ShoppingCart size={13} style={{ color: "#f59e0b" }} />
				<span
					className="font-display uppercase tracking-widest"
					style={{
						fontSize: 9,
						letterSpacing: "0.3em",
						color: "#f59e0b",
					}}
				>
					Menú rápido
				</span>
				<span
					style={{
						marginLeft: "auto",
						background: "rgba(245,158,11,0.15)",
						color: "#f59e0b",
						fontFamily: "var(--font-syne)",
						fontWeight: 700,
						fontSize: 9,
						borderRadius: "99px",
						padding: "1px 6px",
					}}
				>
					{available.length}
				</span>
			</div>

			{/* Accordion list */}
			<div className="flex-1 overflow-y-auto" style={{ padding: "4px 0" }}>
				{catsWithProducts.map((cat) => {
					const isOpen = openCats.has(cat.id);
					const catProducts = available.filter((p) => p.categoryId === cat.id);
					const isKitchen = catProducts[0]?.target === "kitchen";
					const accentColor = isKitchen ? "#10b981" : "#60a5fa";

					return (
						<div key={cat.id}>
							{/* Category header — clickable */}
							<button
								onClick={() => toggleCat(cat.id)}
								style={{
									width: "100%",
									display: "flex",
									alignItems: "center",
									gap: 6,
									padding: "9px 12px",
									background: isOpen ? `${accentColor}0c` : "transparent",
									border: "none",
									borderBottom: "1px solid var(--s2)",
									cursor: "pointer",
									textAlign: "left",
									transition: "background 0.15s",
								}}
								onMouseEnter={(e) => {
									if (!isOpen) e.currentTarget.style.background = "var(--s2)";
								}}
								onMouseLeave={(e) => {
									if (!isOpen) e.currentTarget.style.background = "transparent";
								}}
							>
								<span style={{ fontSize: 14, flexShrink: 0 }}>{cat.icon}</span>
								<span
									className="font-display truncate"
									style={{
										flex: 1,
										fontSize: 11,
										fontWeight: 600,
										color: isOpen ? accentColor : "#a3a3a3",
										letterSpacing: "0.02em",
									}}
								>
									{cat.name}
								</span>
								<span
									style={{
										fontSize: 9,
										fontFamily: "var(--font-syne)",
										fontWeight: 700,
										color: "#555",
										marginRight: 2,
									}}
								>
									{cat.count}
								</span>
								<ChevronDown
									size={12}
									style={{
										color: isOpen ? accentColor : "#444",
										flexShrink: 0,
										transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
										transition: "transform 0.2s",
									}}
								/>
							</button>

							{/* Expanded product list */}
							{isOpen && (
								<div
									style={{
										padding: "6px 8px 8px",
										display: "flex",
										flexDirection: "column",
										gap: 4,
										borderBottom: `1px solid ${accentColor}20`,
									}}
								>
									{catProducts.map((p) => (
										<QuickItem key={p.id} product={p} />
									))}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
	return (
		<div
			style={{
				position: "fixed",
				bottom: 28,
				left: "50%",
				transform: visible
					? "translateX(-50%) translateY(0)"
					: "translateX(-50%) translateY(20px)",
				opacity: visible ? 1 : 0,
				transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
				background: "#10b981",
				color: "#fff",
				borderRadius: 12,
				padding: "12px 22px",
				fontFamily: "var(--font-syne)",
				fontWeight: 700,
				fontSize: 12,
				letterSpacing: "0.08em",
				textTransform: "uppercase",
				display: "flex",
				alignItems: "center",
				gap: 8,
				zIndex: 9999,
				boxShadow: "0 0 24px rgba(16,185,129,0.4), 0 4px 16px rgba(0,0,0,0.4)",
				pointerEvents: "none",
			}}
		>
			<Check size={15} />
			{message}
		</div>
	);
}

export default function SalonPage() {
	const router = useRouter();
	const [activeZone, setActiveZone] = useState("");
	const [tables, setTables] = useState<Table[]>([]);
	const [zones, setZones] = useState<Zone[]>([]);
	const [orders, setOrders] = useState<Order[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const zoneInitialized = useRef(false);
	const [staffName, setStaffName] = useState<string>("");

	const [toastVisible, setToastVisible] = useState(false);
	const [toastMsg, setToastMsg] = useState("");

	useEffect(() => {
		try {
			const stored = localStorage.getItem("pos-staff");
			if (stored) {
				const staff = JSON.parse(stored) as { name?: string };
				if (staff.name) setStaffName(staff.name);
			}
		} catch {
			/* ignore */
		}
	}, []);

	const fetchData = useCallback(async () => {
		try {
			const [t, z, o, p, c] = await Promise.all([
				apiFetch<Table[]>("/api/tables"),
				apiFetch<Zone[]>("/api/zones"),
				apiFetch<Order[]>("/api/orders"),
				apiFetch<Product[]>("/api/products"),
				apiFetch<Category[]>("/api/categories"),
			]);
			setTables(t);
			setZones(z);
			setOrders(o);
			setProducts(p);
			setCategories(c);
			if (!zoneInitialized.current && z.length > 0) {
				setActiveZone(z[0].id);
				zoneInitialized.current = true;
			}
		} catch (e) {
			console.error(e);
		}
	}, []);

	useEffect(() => {
		fetchData();
		const id = setInterval(fetchData, 12000);
		return () => clearInterval(id);
	}, [fetchData]);

	const activeOrders = orders.filter(
		(o) => o.status !== "closed" && o.status !== "cancelled",
	);
	const zoneTables = tables.filter((t) => t.zoneId === activeZone);

	const available = tables.filter((t) => t.status === "available").length;
	const occupied = tables.filter((t) => t.status === "occupied").length;
	const reserved = tables.filter((t) => t.status === "reserved").length;

	const todayRevenue = orders
		.filter((o) => o.status === "closed")
		.reduce(
			(s, o) => s + o.items.reduce((si, i) => si + i.qty * i.price, 0),
			0,
		);
	const todayOrderCount = orders.filter((o) => o.status === "closed").length;
	const avgTicket =
		todayOrderCount > 0 ? Math.round(todayRevenue / todayOrderCount) : 0;

	const getTableOrder = useCallback(
		(tableId: string) =>
			orders.find(
				(o) =>
					o.tableId === tableId &&
					o.status !== "closed" &&
					o.status !== "cancelled",
			),
		[orders],
	);

	const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const showToast = (msg: string) => {
		if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		setToastMsg(msg);
		setToastVisible(true);
		toastTimerRef.current = setTimeout(() => setToastVisible(false), 2200);
	};

	const handleSelectTable = (tableId: string) => {
		router.push(`/pos/salon/${tableId}`);
	};

	// Drag-and-drop: navigate to table detail page
	const handleDropProduct = (tableId: string, productId: string) => {
		const product = products.find((p) => p.id === productId);
		if (!product) return;
		showToast(
			`${product.name} → Mesa ${tables.find((t) => t.id === tableId)?.number}`,
		);
		router.push(`/pos/salon/${tableId}`);
	};

	return (
		<div
			className="min-h-screen bg-surface-0 noise-overlay"
			style={{ display: "flex" }}
		>
			<POSSidebar activePath="salon" staffName={staffName} />

			<div
				className="pos-main-content flex flex-col"
				style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}
			>
				<style>{`
					@media (max-width: 900px) {
						.pos-main-content { margin-left: 0 !important; }
						nav.sidebar { display: none; }
						.pos-right-panel { display: none; }
						.quick-panels { display: none !important; }
					}
					@media (max-width: 1100px) {
						.pos-right-panel { width: 220px !important; }
						.quick-panels { width: 170px !important; }
					}
					@keyframes slideInRight {
						from { transform: translateX(30px); opacity: 0; }
						to { transform: translateX(0); opacity: 1; }
					}
				`}</style>

				{/* Top bar */}
				<header
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "0 24px",
						height: 64,
						borderBottom: "1px solid var(--s3)",
						background: "var(--s1)",
						position: "sticky",
						top: 0,
						zIndex: 20,
					}}
				>
					{/* Zone tab pills */}
					<div className="flex items-center gap-1">
						{zones.map((zone) => {
							const isActive = activeZone === zone.id;
							return (
								<button
									key={zone.id}
									onClick={() => setActiveZone(zone.id)}
									style={{
										padding: "0 20px",
										height: 64,
										border: "none",
										background: "transparent",
										cursor: "pointer",
										fontFamily: "var(--font-syne)",
										fontWeight: 700,
										fontSize: 12,
										letterSpacing: "0.2em",
										textTransform: "uppercase",
										color: isActive ? "#f59e0b" : "#6b6b6b",
										position: "relative",
										transition: "color 0.15s",
									}}
								>
									{zone.name}
									{isActive && (
										<div
											style={{
												position: "absolute",
												bottom: 0,
												left: 0,
												right: 0,
												height: 3,
												background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
												borderRadius: "2px 2px 0 0",
												boxShadow: "0 0 12px rgba(245,158,11,0.7)",
											}}
										/>
									)}
								</button>
							);
						})}
					</div>

					{/* Status stats */}
					<div className="flex items-center gap-6">
						{[
							{
								label: "Disponibles",
								value: available,
								color: "#10b981",
								dotClass: "dot-available",
							},
							{
								label: "Ocupadas",
								value: occupied,
								color: "#f59e0b",
								dotClass: "dot-occupied",
							},
							{
								label: "Reservadas",
								value: reserved,
								color: "#8b5cf6",
								dotClass: "dot-reserved",
							},
						].map((stat) => (
							<div key={stat.label} className="flex items-center gap-2">
								<div
									style={{
										width: 8,
										height: 8,
										borderRadius: "50%",
									}}
									className={stat.dotClass}
								/>
								<span
									className="font-display text-ink-tertiary uppercase"
									style={{ fontSize: 10, letterSpacing: "0.15em" }}
								>
									{stat.label}
								</span>
								<span
									className="font-kds"
									style={{
										fontSize: 24,
										color: stat.color,
										lineHeight: 1,
										textShadow: `0 0 12px ${stat.color}50`,
									}}
								>
									{stat.value}
								</span>
							</div>
						))}
					</div>
				</header>

				{/* Body */}
				<div className="flex flex-1" style={{ gap: 0, overflow: "hidden" }}>
					{/* Quick panels: Comidas / Bebidas */}
					<div className="quick-panels">
						<QuickPanels products={products} categories={categories} />
					</div>

					{/* Floor map area */}
					<div
						className="flex flex-col gap-4"
						style={{
							flex: 1,
							padding: "20px 24px",
							display: "flex",
							minWidth: 0,
						}}
					>
						{/* Legend bar */}
						<div
							className="flex items-center justify-between"
							style={{ flexShrink: 0 }}
						>
							<div
								className="font-display text-ink-tertiary uppercase tracking-widest"
								style={{ fontSize: 10, letterSpacing: "0.3em" }}
							>
								{zones.find((z) => z.id === activeZone)?.name} — Plano de mesas
							</div>
							<div className="flex items-center gap-3">
								{[
									{ label: "Libre", color: "#10b981" },
									{ label: "Ocupada", color: "#f59e0b" },
									{ label: "Reservada", color: "#8b5cf6" },
								].map((l) => (
									<span
										key={l.label}
										className="flex items-center gap-1.5"
										style={{
											fontSize: 10,
											color: "#6b6b6b",
											fontFamily: "var(--font-syne)",
											letterSpacing: "0.1em",
										}}
									>
										<span
											style={{
												width: 8,
												height: 8,
												borderRadius: "50%",
												background: l.color,
												display: "inline-block",
												boxShadow: `0 0 6px ${l.color}90`,
											}}
										/>
										{l.label}
									</span>
								))}
							</div>
						</div>

						{/* Auto-scaling canvas */}
						<FloorCanvas
							tables={zoneTables}
							getTableOrder={getTableOrder}
							selectedTableId={null}
							onSelectTable={handleSelectTable}
							onDropProduct={handleDropProduct}
						/>

						{/* Quick actions */}
						<div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
							<Link
								href="/pos/orders"
								className="btn-secondary"
								style={{
									paddingTop: 13,
									paddingBottom: 13,
									paddingLeft: 22,
									paddingRight: 22,
									textDecoration: "none",
									fontSize: 13,
								}}
							>
								<ListOrdered size={16} />
								Ver Pedidos
								{activeOrders.length > 0 && (
									<span
										style={{
											background: "#f59e0b",
											color: "#080808",
											fontFamily: "var(--font-syne)",
											fontWeight: 700,
											fontSize: 11,
											borderRadius: "99px",
											padding: "2px 8px",
											marginLeft: 4,
										}}
									>
										{activeOrders.length}
									</span>
								)}
							</Link>

							{/* Revenue inline */}
							<div className="flex items-center gap-2 ml-auto">
								<TrendingUp size={13} className="text-ink-disabled" />
								<span
									className="font-kds text-brand-500"
									style={{ fontSize: 22, lineHeight: 1 }}
								>
									{formatCurrency(todayRevenue)}
								</span>
								<span
									className="text-ink-tertiary font-body"
									style={{ fontSize: 10 }}
								>
									({todayOrderCount} pedidos · ticket{" "}
									{formatCurrency(avgTicket)})
								</span>
							</div>
						</div>
					</div>

					{/* Right panel: Stats */}
					<aside
						className="pos-right-panel"
						style={{
							width: 290,
							borderLeft: "1px solid var(--s3)",
							background: "var(--s1)",
							display: "flex",
							flexDirection: "column",
							gap: 0,
							overflow: "hidden",
						}}
					>
						{/* Revenue block */}
						<div
							style={{
								padding: "22px 20px 18px",
								borderBottom: "1px solid var(--s3)",
							}}
						>
							<div className="flex items-center gap-2 mb-3">
								<TrendingUp size={13} className="text-ink-disabled" />
								<span
									className="font-display text-ink-disabled uppercase tracking-widest"
									style={{ fontSize: 9, letterSpacing: "0.3em" }}
								>
									Ingresos hoy
								</span>
							</div>
							<div
								className="font-kds text-brand-500"
								style={{
									fontSize: 40,
									lineHeight: 1,
									textShadow: "0 0 24px rgba(245,158,11,0.3)",
								}}
							>
								{formatCurrency(todayRevenue)}
							</div>
							<div
								className="font-body text-ink-tertiary mt-1.5"
								style={{ fontSize: 11 }}
							>
								{todayOrderCount} pedidos hoy ·{" "}
								<span className="text-ink-secondary">
									ticket {formatCurrency(avgTicket)}
								</span>
							</div>
						</div>

						{/* Active orders */}
						<div
							style={{
								padding: "16px 16px 8px",
								borderBottom: "1px solid var(--s3)",
							}}
						>
							<div
								className="font-display text-ink-disabled uppercase tracking-widest mb-3 flex items-center justify-between"
								style={{
									fontSize: 9,
									letterSpacing: "0.3em",
								}}
							>
								<span>Pedidos activos</span>
								{activeOrders.length > 0 && (
									<span
										style={{
											background: "rgba(245,158,11,0.15)",
											color: "#f59e0b",
											border: "1px solid rgba(245,158,11,0.3)",
											fontFamily: "var(--font-syne)",
											fontWeight: 700,
											fontSize: 9,
											borderRadius: "99px",
											padding: "2px 8px",
											letterSpacing: "0.08em",
										}}
									>
										{activeOrders.length}
									</span>
								)}
							</div>
						</div>

						<div
							className="flex flex-col gap-0 overflow-y-auto"
							style={{ flex: 1, padding: "8px 10px" }}
						>
							{activeOrders.length === 0 ? (
								<div
									className="flex flex-col items-center justify-center text-center py-8"
									style={{ color: "#444" }}
								>
									<div
										style={{
											fontSize: 28,
											marginBottom: 8,
										}}
									>
										<svg
											width="28"
											height="28"
											viewBox="0 0 24 24"
											fill="none"
											stroke="#444"
											strokeWidth="1.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
										</svg>
									</div>
									<div
										className="font-display uppercase"
										style={{
											fontSize: 10,
											letterSpacing: "0.2em",
										}}
									>
										Sin pedidos activos
									</div>
								</div>
							) : (
								activeOrders.map((order) => {
									const borderColor =
										order.status === "preparing"
											? "#3b82f6"
											: order.status === "ready"
												? "#10b981"
												: "#f59e0b";
									const elapsed = elapsedMinutes(order.createdAt);
									const orderTotal = order.items.reduce(
										(s, i) => s + i.qty * i.price,
										0,
									);
									return (
										<div
											key={order.id}
											className="rounded-xl mb-2 transition-all"
											style={{
												padding: "12px 14px",
												background: "var(--s2)",
												border: "1px solid var(--s3)",
												borderLeft: `3px solid ${borderColor}`,
												cursor: "pointer",
											}}
											onClick={() => handleSelectTable(order.tableId)}
											onMouseEnter={(e) => {
												(e.currentTarget as HTMLDivElement).style.background =
													"var(--s3)";
											}}
											onMouseLeave={(e) => {
												(e.currentTarget as HTMLDivElement).style.background =
													"var(--s2)";
											}}
										>
											<div className="flex items-center justify-between mb-1.5">
												<div className="flex items-center gap-2">
													<span
														className="font-kds text-ink-primary"
														style={{
															fontSize: 26,
															lineHeight: 1,
														}}
													>
														Mesa {order.tableNumber}
													</span>
												</div>
												<div className="flex items-center gap-1.5">
													<Clock
														size={10}
														style={{
															color: "#6b6b6b",
														}}
													/>
													<span
														className="font-kds"
														style={{
															fontSize: 16,
															color:
																elapsed > 20
																	? "#ef4444"
																	: elapsed > 10
																		? "#f59e0b"
																		: "#6b6b6b",
														}}
													>
														{elapsed}m
													</span>
												</div>
											</div>
											<div className="flex items-center justify-between">
												<span
													className="font-body text-ink-tertiary"
													style={{
														fontSize: 11,
													}}
												>
													{order.items.length} item
													{order.items.length !== 1 ? "s" : ""}
												</span>
												<div className="flex items-center gap-2">
													<span
														className="font-kds text-brand-500"
														style={{
															fontSize: 15,
														}}
													>
														{formatCurrency(orderTotal)}
													</span>
													<ChevronRight
														size={12}
														style={{
															color: "#444",
														}}
													/>
												</div>
											</div>
										</div>
									);
								})
							)}
						</div>
					</aside>
				</div>
			</div>

			<Toast message={toastMsg} visible={toastVisible} />
			<HelpButton {...helpContent.posSalon} variant="float" />
		</div>
	);
}
