"use client";

import { useState, useMemo } from "react";
import { InstallPrompt } from "@/components/InstallPrompt";
import Link from "next/link";
import {
	ShoppingCart,
	Plus,
	Minus,
	Clock,
	Truck,
	UtensilsCrossed,
	ChevronRight,
} from "lucide-react";
import { VENUE, CATEGORIES, PRODUCTS, formatCurrency } from "@/data/mock";
import { useAppStore } from "@/store/useAppStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE_ID = "t2";
const TABLE_NUMBER = 2;
const TABLE_ZONE = "Salón Principal";

// ─── Noise overlay (shared) ───────────────────────────────────────────────────

function NoiseOverlay() {
	return (
		<div
			className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
			aria-hidden
			style={{
				backgroundImage:
					"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
				mixBlendMode: "overlay",
			}}
		/>
	);
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────

function BottomNav({
	active,
}: {
	active: "menu" | "order" | "status" | "delivery";
}) {
	const carts = useAppStore((s) => s.carts);
	const allOrders = useAppStore((s) => s.orders);
	const cartCount = (carts[TABLE_ID] ?? []).reduce((s, i) => s + i.qty, 0);
	const orderCount = allOrders
		.filter((o) => o.tableId === TABLE_ID && o.status !== "closed")
		.reduce((s, o) => s + o.items.length, 0);

	const items = [
		{
			key: "menu" as const,
			href: "/customer/menu",
			icon: <UtensilsCrossed size={20} />,
			label: "Menú",
			badge: 0,
		},
		{
			key: "order" as const,
			href: "/customer/menu/cart",
			icon: <ShoppingCart size={20} />,
			label: "Mi pedido",
			badge: cartCount,
		},
		{
			key: "status" as const,
			href: "/customer/order-status",
			icon: <Clock size={20} />,
			label: "Estado",
			badge: orderCount,
		},
		{
			key: "delivery" as const,
			href: "/customer/delivery",
			icon: <Truck size={20} />,
			label: "Delivery",
			badge: 0,
		},
	];

	return (
		<nav className="mobile-nav">
			{items.map((item) => (
				<Link
					key={item.key}
					href={item.href}
					className={`mobile-nav-item${active === item.key ? " active" : ""}`}
				>
					<span className="relative">
						{item.icon}
						{item.badge > 0 && (
							<span
								className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full flex items-center justify-center font-kds text-[10px] text-surface-0"
								style={{ background: "#f59e0b" }}
							>
								{item.badge > 9 ? "9+" : item.badge}
							</span>
						)}
					</span>
					<span>{item.label}</span>
				</Link>
			))}
		</nav>
	);
}

// ─── Order status pill ────────────────────────────────────────────────────────

function OrderStatusPill() {
	const allOrders2 = useAppStore((s) => s.orders);
	const orders = allOrders2.filter(
		(o) => o.tableId === TABLE_ID && o.status !== "closed",
	);

	if (!orders.length) return null;

	const totalItems = orders.reduce((s, o) => s + o.items.length, 0);
	const overallStatus = orders[0].status;

	const statusColor: Record<string, string> = {
		preparing: "#60a5fa",
		pending: "#fbbf24",
		ready: "#4ade80",
		closed: "#6b7280",
	};
	const color = statusColor[overallStatus] ?? "#fbbf24";

	return (
		<Link href="/customer/order-status">
			<div
				className="mx-4 mb-3 rounded-xl px-4 py-3 flex items-center justify-between gap-3 animate-fade-in"
				style={{
					background: `${color}0f`,
					border: `1px solid ${color}30`,
				}}
			>
				<div className="flex items-center gap-2.5">
					<span
						className="w-2 h-2 rounded-full shrink-0"
						style={{ background: color, boxShadow: `0 0 6px ${color}` }}
					/>
					<span className="font-display text-[12px] font-bold text-ink-primary uppercase tracking-wider">
						Tu pedido: {totalItems} {totalItems === 1 ? "ítem" : "ítems"}
					</span>
				</div>
				<div className="flex items-center gap-1 shrink-0">
					<span className="font-body text-[11px]" style={{ color }}>
						Ver estado
					</span>
					<ChevronRight size={13} style={{ color }} />
				</div>
			</div>
		</Link>
	);
}

// ─── Allergen badge ───────────────────────────────────────────────────────────

const ALLERGEN_STYLES: Record<string, { bg: string; text: string }> = {
	gluten: { bg: "rgba(245,158,11,0.1)", text: "#fbbf24" },
	lácteos: { bg: "rgba(99,102,241,0.1)", text: "#a5b4fc" },
	sulfitos: { bg: "rgba(139,92,246,0.1)", text: "#c4b5fd" },
	mariscos: { bg: "rgba(239,68,68,0.1)", text: "#fca5a5" },
};

function AllergenBadge({ allergen }: { allergen: string }) {
	const style = ALLERGEN_STYLES[allergen] ?? {
		bg: "rgba(107,114,128,0.1)",
		text: "#9ca3af",
	};
	return (
		<span
			className="text-[10px] font-body font-medium rounded px-1.5 py-0.5"
			style={{ background: style.bg, color: style.text }}
		>
			{allergen}
		</span>
	);
}

// ─── Qty control (inline) ─────────────────────────────────────────────────────

function QtyControl({
	qty,
	onIncrease,
	onDecrease,
}: {
	qty: number;
	onIncrease: () => void;
	onDecrease: () => void;
}) {
	return (
		<div
			className="flex items-center rounded-xl overflow-hidden"
			style={{ border: "1px solid #2a2a2a", background: "#161616" }}
		>
			<button
				onClick={onDecrease}
				className="w-8 h-8 flex items-center justify-center text-ink-secondary transition-colors active:scale-95 hover:text-brand-500"
			>
				<Minus size={12} />
			</button>
			<span
				className="font-kds text-ink-primary min-w-[28px] text-center"
				style={{ fontSize: "17px", lineHeight: 1 }}
			>
				{qty}
			</span>
			<button
				onClick={onIncrease}
				className="w-8 h-8 flex items-center justify-center text-ink-secondary transition-colors active:scale-95 hover:text-brand-500"
			>
				<Plus size={12} />
			</button>
		</div>
	);
}

// ─── Pool chip product card ───────────────────────────────────────────────────

function PoolChipCard({
	product,
	qty,
	onAdd,
	onDecrease,
}: {
	product: (typeof PRODUCTS)[number];
	qty: number;
	onAdd: () => void;
	onDecrease: () => void;
}) {
	return (
		<div className="card-gold pool-chip-border rounded-2xl overflow-hidden animate-slide-up relative">
			{/* Shimmer bar */}
			<div
				aria-hidden
				className="absolute top-0 left-0 right-0 h-[2px]"
				style={{
					background:
						"linear-gradient(90deg, transparent, #f59e0b, #fcd34d, #f59e0b, transparent)",
					backgroundSize: "200% auto",
					animation: "shimmer 3s linear infinite",
				}}
			/>

			<div className="p-4 flex items-center gap-4">
				{/* Icon block */}
				<div
					className="w-[60px] h-[60px] rounded-xl flex items-center justify-center shrink-0 text-3xl"
					style={{
						background:
							"linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)",
						border: "1px solid rgba(245,158,11,0.2)",
					}}
				>
					🎱
				</div>

				{/* Info */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-0.5">
						<span className="pool-chip-badge font-display text-[10px] font-bold tracking-widest">
							FICHA DE POOL
						</span>
					</div>
					<p className="font-display text-ink-primary text-sm uppercase font-bold leading-tight">
						{product.name}
					</p>
					<p className="font-body text-ink-tertiary text-xs mt-0.5">
						{product.description}
					</p>
				</div>

				{/* Price + control */}
				<div className="flex flex-col items-end gap-2 shrink-0">
					<span
						className="font-kds text-brand-500"
						style={{ fontSize: "24px", lineHeight: 1 }}
					>
						{formatCurrency(product.price)}
					</span>
					{qty > 0 ? (
						<QtyControl qty={qty} onIncrease={onAdd} onDecrease={onDecrease} />
					) : (
						<button
							onClick={onAdd}
							className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
							style={{
								background: "rgba(245,158,11,0.15)",
								border: "1px solid rgba(245,158,11,0.4)",
							}}
						>
							<Plus size={16} className="text-brand-500" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

// ─── Regular product card ─────────────────────────────────────────────────────

function ProductCard({
	product,
	qty,
	onAdd,
	onDecrease,
}: {
	product: (typeof PRODUCTS)[number];
	qty: number;
	onAdd: () => void;
	onDecrease: () => void;
}) {
	const category = CATEGORIES.find((c) => c.id === product.categoryId);

	if (product.isPoolChip) {
		return (
			<PoolChipCard
				product={product}
				qty={qty}
				onAdd={onAdd}
				onDecrease={onDecrease}
			/>
		);
	}

	return (
		<div
			className={`card-sm rounded-2xl overflow-hidden animate-slide-up transition-opacity ${
				!product.isAvailable ? "opacity-40" : ""
			}`}
		>
			<div className="p-3 flex items-center gap-3">
				{/* Left: category color block */}
				<div
					className="w-[60px] h-[60px] rounded-xl flex items-center justify-center text-2xl shrink-0"
					style={{
						background: category?.color
							? `${category.color}18`
							: "rgba(255,255,255,0.04)",
						border: `1px solid ${category?.color ? `${category.color}25` : "#272727"}`,
					}}
				>
					{category?.icon ?? "·"}
				</div>

				{/* Middle: info */}
				<div className="flex-1 min-w-0">
					<p className="font-display text-ink-primary text-sm uppercase font-bold leading-tight">
						{product.name}
					</p>
					{product.description && (
						<p className="font-body text-ink-tertiary text-xs mt-0.5 leading-relaxed line-clamp-2">
							{product.description}
						</p>
					)}
					{product.allergens.length > 0 && (
						<div className="flex flex-wrap gap-1 mt-1.5">
							{product.allergens.map((a) => (
								<AllergenBadge key={a} allergen={a} />
							))}
						</div>
					)}
				</div>

				{/* Right: price + control */}
				<div className="flex flex-col items-end gap-2 shrink-0">
					<span
						className="font-kds text-brand-500"
						style={{ fontSize: "22px", lineHeight: 1 }}
					>
						{formatCurrency(product.price)}
					</span>
					{product.isAvailable ? (
						qty > 0 ? (
							<QtyControl
								qty={qty}
								onIncrease={onAdd}
								onDecrease={onDecrease}
							/>
						) : (
							<button
								onClick={onAdd}
								className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
								style={{
									background: "rgba(245,158,11,0.1)",
									border: "1px solid rgba(245,158,11,0.3)",
								}}
							>
								<Plus size={15} className="text-brand-500" />
							</button>
						)
					) : (
						<span className="text-[10px] font-body text-ink-tertiary border border-surface-3 rounded-full px-2 py-0.5">
							No disp.
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CustomerMenuPage() {
	const [activeCategory, setActiveCategory] = useState<string>("all");

	const carts3 = useAppStore((s) => s.carts);
	const addToCart = useAppStore((s) => s.addToCart);
	const updateCartQty = useAppStore((s) => s.updateCartQty);

	const cart = carts3[TABLE_ID] ?? [];

	const getQty = (productId: string) =>
		cart.find((i) => i.productId === productId)?.qty ?? 0;

	const handleAdd = (product: (typeof PRODUCTS)[number]) => {
		addToCart(TABLE_ID, {
			productId: product.id,
			name: product.name,
			price: product.price,
			qty: 1,
			target: product.target as "bar" | "kitchen",
			isPoolChip: product.isPoolChip,
		});
	};

	const handleDecrease = (product: (typeof PRODUCTS)[number]) => {
		const current = getQty(product.id);
		updateCartQty(TABLE_ID, product.id, current - 1);
	};

	const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
	const cartTotal = useMemo(
		() => cart.reduce((s, i) => s + i.price * i.qty, 0),
		[cart],
	);

	const productsByCategory = useMemo(() => {
		const counts: Record<string, number> = {};
		PRODUCTS.forEach((p) => {
			counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1;
		});
		return counts;
	}, []);

	const filtered = useMemo(() => {
		if (activeCategory === "all") return PRODUCTS;
		return PRODUCTS.filter((p) => p.categoryId === activeCategory);
	}, [activeCategory]);

	return (
		<div className="min-h-screen bg-surface-0 pb-safe relative">
			<NoiseOverlay />

			{/* ── Hero header ─────────────────────────────────────────────── */}
			<div
				className="relative overflow-hidden bg-surface-1 border-b border-surface-3"
				style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
			>
				{/* Gold glow from top-right */}
				<div
					aria-hidden
					className="absolute inset-0 pointer-events-none"
					style={{
						background:
							"radial-gradient(ellipse 280px 180px at 80% 0%, rgba(245,158,11,0.18) 0%, transparent 70%)",
					}}
				/>
				{/* Top accent line */}
				<div
					aria-hidden
					className="absolute top-0 left-0 right-0 h-[1px]"
					style={{
						background:
							"linear-gradient(90deg, transparent, rgba(245,158,11,0.7) 50%, transparent)",
					}}
				/>

				<div className="max-w-md mx-auto px-5 pt-7 pb-6 text-center relative z-10">
					{/* Cart button top-right */}
					<Link
						href="/customer/menu/cart"
						className="absolute right-4 top-5 z-20"
					>
						<div
							className="w-10 h-10 rounded-full flex items-center justify-center relative"
							style={{
								background: "rgba(245,158,11,0.12)",
								border: "1px solid rgba(245,158,11,0.3)",
							}}
						>
							<ShoppingCart size={18} className="text-brand-500" />
							{cartCount > 0 && (
								<span
									className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-kds text-[11px] text-surface-0"
									style={{ background: "#f59e0b" }}
								>
									{cartCount > 9 ? "9+" : cartCount}
								</span>
							)}
						</div>
					</Link>

					<h1
						className="font-kds text-brand-500 animate-fade-in"
						style={{
							fontSize: "72px",
							lineHeight: 0.9,
							letterSpacing: "0.18em",
						}}
					>
						MY WAY
					</h1>
					<p className="font-display text-xs text-ink-secondary uppercase tracking-widest mt-3">
						Mesa {TABLE_NUMBER} · {TABLE_ZONE}
					</p>
					<p className="font-body text-ink-tertiary text-[11px] mt-1">
						Bar · Pool · Coctelería
					</p>
				</div>
			</div>

			{/* ── Category tabs (sticky) ────────────────────────────────────── */}
			<div
				className="sticky top-0 z-20 border-b border-surface-3"
				style={{
					background: "rgba(8,8,8,0.94)",
					backdropFilter: "blur(14px)",
					WebkitBackdropFilter: "blur(14px)",
				}}
			>
				<div className="max-w-md mx-auto">
					<div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
						<button
							onClick={() => setActiveCategory("all")}
							className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-display font-bold tracking-wide uppercase transition-all"
							style={
								activeCategory === "all"
									? {
											background: "#f59e0b",
											color: "#080808",
											boxShadow: "0 0 14px rgba(245,158,11,0.4)",
										}
									: {
											background: "#161616",
											color: "#a3a3a3",
											border: "1px solid #272727",
										}
							}
						>
							✦ Todos
							<span
								className="text-[10px] rounded-full px-1.5 py-px"
								style={
									activeCategory === "all"
										? { background: "rgba(0,0,0,0.25)", color: "#080808" }
										: { background: "#272727", color: "#666" }
								}
							>
								{PRODUCTS.length}
							</span>
						</button>

						{CATEGORIES.map((cat) => {
							const isActive = activeCategory === cat.id;
							const count = productsByCategory[cat.id] ?? 0;
							return (
								<button
									key={cat.id}
									onClick={() => setActiveCategory(cat.id)}
									className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-display font-bold tracking-wide uppercase transition-all"
									style={
										isActive
											? {
													background: "#f59e0b",
													color: "#080808",
													boxShadow: "0 0 14px rgba(245,158,11,0.4)",
												}
											: {
													background: "#161616",
													color: "#a3a3a3",
													border: "1px solid #272727",
												}
									}
								>
									<span>{cat.icon}</span>
									{cat.name}
									<span
										className="text-[10px] rounded-full px-1.5 py-px"
										style={
											isActive
												? { background: "rgba(0,0,0,0.25)", color: "#080808" }
												: { background: "#272727", color: "#666" }
										}
									>
										{count}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* ── Order status pill ──────────────────────────────────────────── */}
			<div className="max-w-md mx-auto mt-4">
				<OrderStatusPill />
			</div>

			{/* ── Product list ───────────────────────────────────────────────── */}
			<div className="max-w-md mx-auto px-4">
				<div className="flex items-center justify-between mb-3">
					<h2 className="font-display text-[11px] font-bold text-ink-tertiary uppercase tracking-widest">
						{activeCategory === "all"
							? "Todo el menú"
							: CATEGORIES.find((c) => c.id === activeCategory)?.name}
					</h2>
					<span className="font-body text-[11px] text-ink-tertiary">
						{filtered.length} ítems
					</span>
				</div>

				<div className="space-y-3 pb-4">
					{filtered.map((product) => (
						<ProductCard
							key={product.id}
							product={product}
							qty={getQty(product.id)}
							onAdd={() => handleAdd(product)}
							onDecrease={() => handleDecrease(product)}
						/>
					))}
				</div>

				{/* Footer */}
				<div className="border-t border-surface-3 pt-4 pb-32 mt-4">
					<p className="font-body text-ink-tertiary text-[11px] text-center">
						{VENUE.name} · {VENUE.address}
					</p>
				</div>
			</div>

			{/* ── Sticky cart bar ────────────────────────────────────────────── */}
			{cartCount > 0 && (
				<div
					className="fixed z-30 animate-slide-up"
					style={{
						bottom: "64px",
						left: 0,
						right: 0,
						padding: "0 16px 8px",
					}}
				>
					<div className="max-w-md mx-auto">
						<Link href="/customer/menu/cart">
							<button
								className="w-full rounded-2xl flex items-center justify-between"
								style={{
									background: "#f59e0b",
									color: "#080808",
									padding: "14px 20px",
									boxShadow:
										"0 0 32px rgba(245,158,11,0.4), 0 8px 24px rgba(0,0,0,0.6)",
									fontFamily: "var(--font-syne)",
									fontWeight: 700,
									letterSpacing: "0.04em",
								}}
							>
								<span className="flex items-center gap-2.5">
									<span
										className="inline-flex items-center justify-center w-6 h-6 rounded-full font-kds text-brand-500"
										style={{ background: "rgba(0,0,0,0.25)", fontSize: "13px" }}
									>
										{cartCount}
									</span>
									<span className="font-display text-sm uppercase font-bold">
										{cartCount === 1 ? "1 ítem" : `${cartCount} ítems`}
									</span>
								</span>
								<span className="flex items-center gap-2">
									<span className="font-kds" style={{ fontSize: "18px" }}>
										{formatCurrency(cartTotal)}
									</span>
									<ChevronRight size={16} />
								</span>
							</button>
						</Link>
					</div>
				</div>
			)}

			{/* ── Bottom nav ─────────────────────────────────────────────────── */}
			<BottomNav active="menu" />
			<InstallPrompt />
		</div>
	);
}
