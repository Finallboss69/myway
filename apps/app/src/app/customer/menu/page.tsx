"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { InstallPrompt } from "@/components/InstallPrompt";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
	ShoppingCart,
	Plus,
	Minus,
	Clock,
	Truck,
	UtensilsCrossed,
	ChevronRight,
	CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
	id: string;
	name: string;
	icon: string;
	order: number;
}

interface Product {
	id: string;
	name: string;
	description: string | null;
	price: number;
	categoryId: string;
	target: "bar" | "kitchen";
	isAvailable: boolean;
	isPoolChip: boolean;
	category?: Category;
}

interface CartItem {
	productId: string;
	name: string;
	price: number;
	qty: number;
	target: "bar" | "kitchen";
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
	status: string;
	createdAt: string;
	items: OrderItem[];
}

// ─── Cart storage helpers ─────────────────────────────────────────────────────

function loadCart(tableId: string): CartItem[] {
	try {
		return JSON.parse(
			localStorage.getItem(`myway_cart_${tableId}`) || "[]",
		) as CartItem[];
	} catch {
		return [];
	}
}

function saveCart(tableId: string, items: CartItem[]): void {
	localStorage.setItem(`myway_cart_${tableId}`, JSON.stringify(items));
}

// ─── Polling hook ─────────────────────────────────────────────────────────────

function usePolling<T>(url: string, interval = 5000) {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		let active = true;
		const fetch_ = async () => {
			const res = await fetch(url);
			if (active && res.ok) setData((await res.json()) as T);
			setLoading(false);
		};
		fetch_();
		const id = setInterval(fetch_, interval);
		return () => {
			active = false;
			clearInterval(id);
		};
	}, [url, interval]);
	return { data, loading };
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────

function BottomNav({
	active,
	tableId,
	cartCount,
}: {
	active: "menu" | "order" | "status" | "delivery";
	tableId: string;
	cartCount: number;
}) {
	const items = [
		{
			key: "menu" as const,
			href: `/customer/menu?tableId=${tableId}`,
			icon: <UtensilsCrossed size={20} />,
			label: "Menú",
			badge: 0,
		},
		{
			key: "order" as const,
			href: `/customer/menu/cart?tableId=${tableId}`,
			icon: <ShoppingCart size={20} />,
			label: "Mi pedido",
			badge: cartCount,
		},
		{
			key: "status" as const,
			href: `/customer/order-status?tableId=${tableId}`,
			icon: <Clock size={20} />,
			label: "Estado",
			badge: 0,
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
					className={clsx("mobile-nav-item", active === item.key && "active")}
				>
					<span className="relative">
						{item.icon}
						{item.badge > 0 && (
							<span
								className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full flex items-center justify-center font-kds text-[10px]"
								style={{ background: "#f59e0b", color: "#080808" }}
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

// ─── Qty control ──────────────────────────────────────────────────────────────

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

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({
	product,
	category,
	qty,
	onAdd,
	onDecrease,
}: {
	product: Product;
	category: Category | undefined;
	qty: number;
	onAdd: () => void;
	onDecrease: () => void;
}) {
	return (
		<div
			className={clsx(
				"card-sm rounded-2xl overflow-hidden animate-slide-up transition-opacity",
				!product.isAvailable && "opacity-40",
				product.isPoolChip && "pool-chip-border",
			)}
		>
			<div className="p-3 flex items-center gap-3">
				{/* Category icon */}
				<div
					className="w-[60px] h-[60px] rounded-xl flex items-center justify-center text-2xl shrink-0"
					style={{
						background: "rgba(255,255,255,0.04)",
						border: "1px solid #272727",
					}}
				>
					{category?.icon ?? "·"}
				</div>

				{/* Info */}
				<div className="flex-1 min-w-0">
					<p
						className={clsx(
							"font-display text-sm uppercase font-bold leading-tight",
							product.isPoolChip ? "pool-chip-badge" : "text-ink-primary",
						)}
					>
						{product.name}
					</p>
					{product.description && (
						<p className="font-body text-ink-tertiary text-xs mt-0.5 leading-relaxed line-clamp-2">
							{product.description}
						</p>
					)}
					{product.isPoolChip && (
						<span className="inline-block text-[10px] font-body text-amber-500/70 mt-0.5">
							🎱 Ficha de pool
						</span>
					)}
				</div>

				{/* Price + controls */}
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

// ─── Active order pill ────────────────────────────────────────────────────────

function ActiveOrderPill({ orders }: { orders: Order[] }) {
	if (orders.length === 0) return null;

	const activeItems = orders.flatMap((o) => o.items);
	const readyCount = activeItems.filter((i) => i.status === "ready").length;
	const preparingCount = activeItems.filter(
		(i) => i.status === "preparing",
	).length;
	const pendingCount = activeItems.filter((i) => i.status === "pending").length;

	const hasReady = readyCount > 0;

	return (
		<div
			className={clsx(
				"flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-display font-bold uppercase tracking-wide transition-all",
				hasReady
					? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
					: "bg-amber-500/10 border border-amber-500/25 text-amber-400",
			)}
		>
			{hasReady ? (
				<CheckCircle2 size={12} className="text-emerald-400" />
			) : (
				<span
					className="w-2 h-2 rounded-full animate-pulse"
					style={{ background: "#f59e0b" }}
				/>
			)}
			{hasReady
				? `${readyCount} listo${readyCount !== 1 ? "s" : ""}`
				: preparingCount > 0
					? `${preparingCount} preparando`
					: `${pendingCount} pendiente${pendingCount !== 1 ? "s" : ""}`}
		</div>
	);
}

// ─── Category section header ──────────────────────────────────────────────────

function CategorySection({
	category,
	products,
	cart,
	onAdd,
	onDecrease,
	categories,
}: {
	category: Category;
	products: Product[];
	cart: CartItem[];
	onAdd: (p: Product) => void;
	onDecrease: (id: string) => void;
	categories: Category[];
}) {
	const getQty = (productId: string) =>
		cart.find((i) => i.productId === productId)?.qty ?? 0;

	return (
		<div className="mb-6">
			<div className="flex items-center gap-2 mb-3">
				<span className="text-xl">{category.icon}</span>
				<h2 className="font-display font-bold text-[12px] text-ink-secondary uppercase tracking-widest">
					{category.name}
				</h2>
				<span className="font-body text-[10px] text-ink-tertiary">
					({products.length})
				</span>
			</div>
			<div className="space-y-3">
				{products.map((product) => (
					<ProductCard
						key={product.id}
						product={product}
						category={categories.find((c) => c.id === product.categoryId)}
						qty={getQty(product.id)}
						onAdd={() => onAdd(product)}
						onDecrease={() => onDecrease(product.id)}
					/>
				))}
			</div>
		</div>
	);
}

// ─── Inner menu content ───────────────────────────────────────────────────────

function MenuContent() {
	const searchParams = useSearchParams();
	const tableId = searchParams.get("tableId") ?? "t2";

	const [activeCategory, setActiveCategory] = useState<string>("all");
	const [categories, setCategories] = useState<Category[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [cart, setCart] = useState<CartItem[]>([]);

	// Ordered active orders (polled)
	const { data: activeOrders } = usePolling<Order[]>(
		`/api/orders?tableId=${tableId}`,
		5000,
	);

	// Ref for category section scroll targets
	const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

	// Load cart from localStorage on mount
	useEffect(() => {
		setCart(loadCart(tableId));
	}, [tableId]);

	// Persist cart to localStorage on change
	useEffect(() => {
		saveCart(tableId, cart);
	}, [cart, tableId]);

	// Fetch categories + products once
	useEffect(() => {
		async function fetchData() {
			try {
				setLoading(true);
				setError(null);
				const [catRes, prodRes] = await Promise.all([
					fetch("/api/categories"),
					fetch("/api/products?available=true"),
				]);
				if (!catRes.ok || !prodRes.ok) throw new Error("Error al cargar datos");
				const [cats, prods] = await Promise.all([
					catRes.json() as Promise<Category[]>,
					prodRes.json() as Promise<Product[]>,
				]);
				const sorted = [...cats].sort((a, b) => a.order - b.order);
				setCategories(sorted);
				setProducts(prods);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Error desconocido");
			} finally {
				setLoading(false);
			}
		}
		fetchData();
	}, []);

	// Cart helpers (immutable)
	const addToCart = (product: Product) => {
		setCart((prev) => {
			const existing = prev.find((i) => i.productId === product.id);
			if (existing) {
				return prev.map((i) =>
					i.productId === product.id ? { ...i, qty: i.qty + 1 } : i,
				);
			}
			return [
				...prev,
				{
					productId: product.id,
					name: product.name,
					price: product.price,
					qty: 1,
					target: product.target,
				},
			];
		});
	};

	const removeFromCart = (productId: string) => {
		setCart((prev) => {
			const item = prev.find((i) => i.productId === productId);
			if (!item) return prev;
			if (item.qty <= 1) return prev.filter((i) => i.productId !== productId);
			return prev.map((i) =>
				i.productId === productId ? { ...i, qty: i.qty - 1 } : i,
			);
		});
	};

	const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
	const cartTotal = useMemo(
		() => cart.reduce((s, i) => s + i.price * i.qty, 0),
		[cart],
	);

	const productsByCategory = useMemo(() => {
		const map: Record<string, Product[]> = {};
		products.forEach((p) => {
			if (!map[p.categoryId]) map[p.categoryId] = [];
			map[p.categoryId].push(p);
		});
		return map;
	}, [products]);

	const productCountByCategory = useMemo(() => {
		const counts: Record<string, number> = {};
		products.forEach((p) => {
			counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1;
		});
		return counts;
	}, [products]);

	const filteredProducts = useMemo(() => {
		if (activeCategory === "all") return products;
		return products.filter((p) => p.categoryId === activeCategory);
	}, [activeCategory, products]);

	// Group filtered products by category for display
	const groupedFiltered = useMemo(() => {
		if (activeCategory !== "all") {
			const cat = categories.find((c) => c.id === activeCategory);
			if (!cat) return [];
			return [{ category: cat, products: filteredProducts }];
		}
		return categories
			.map((cat) => ({
				category: cat,
				products: productsByCategory[cat.id] ?? [],
			}))
			.filter((g) => g.products.length > 0);
	}, [activeCategory, categories, filteredProducts, productsByCategory]);

	const scrollToCategory = (catId: string) => {
		setActiveCategory(catId);
		if (catId !== "all") {
			setTimeout(() => {
				const el = categoryRefs.current[catId];
				if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
			}, 50);
		} else {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	const nonDeliveredOrders = (activeOrders ?? []).filter(
		(o) => o.status !== "closed" && o.status !== "cancelled",
	);

	if (loading) {
		return (
			<div className="min-h-screen bg-surface-0 flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4" />
					<p className="font-body text-ink-tertiary text-sm">Cargando menú…</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-surface-0 flex items-center justify-center px-6">
				<div className="text-center">
					<p className="font-display font-bold text-ink-primary text-lg mb-2 uppercase">
						Error al cargar
					</p>
					<p className="font-body text-ink-tertiary text-sm mb-6">{error}</p>
					<button
						onClick={() => window.location.reload()}
						className="btn-primary rounded-xl"
					>
						Reintentar
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-surface-0 pb-safe relative">
			{/* Noise overlay */}
			<div
				className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
				aria-hidden
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
					mixBlendMode: "overlay",
				}}
			/>

			{/* ── Hero header ── */}
			<div
				className="relative overflow-hidden bg-surface-1 border-b border-surface-3"
				style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
			>
				{/* Gold glow */}
				<div
					aria-hidden
					className="absolute inset-0 pointer-events-none"
					style={{
						background:
							"radial-gradient(ellipse 280px 180px at 80% 0%, rgba(245,158,11,0.18) 0%, transparent 70%)",
					}}
				/>
				{/* Top accent */}
				<div
					aria-hidden
					className="absolute top-0 left-0 right-0 h-[1px]"
					style={{
						background:
							"linear-gradient(90deg, transparent, rgba(245,158,11,0.7) 50%, transparent)",
					}}
				/>

				<div className="max-w-md mx-auto px-5 pt-7 pb-5 relative z-10">
					{/* Top row: cart button + active order */}
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							{nonDeliveredOrders.length > 0 && (
								<Link
									href={`/customer/order-status?tableId=${tableId}`}
									className="flex items-center"
								>
									<ActiveOrderPill orders={nonDeliveredOrders} />
								</Link>
							)}
						</div>
						<Link href={`/customer/menu/cart?tableId=${tableId}`}>
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
										className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-kds text-[11px]"
										style={{ background: "#f59e0b", color: "#080808" }}
									>
										{cartCount > 9 ? "9+" : cartCount}
									</span>
								)}
							</div>
						</Link>
					</div>

					{/* Brand + table */}
					<div className="text-center">
						<h1
							className="font-kds text-brand-500 animate-fade-in"
							style={{
								fontSize: "64px",
								lineHeight: 0.9,
								letterSpacing: "0.18em",
							}}
						>
							MY WAY
						</h1>
						<p className="font-display text-xs text-ink-secondary uppercase tracking-widest mt-3">
							Mesa {tableId.replace("t", "")} · Bar & Pool
						</p>
						<p className="font-body text-ink-tertiary text-[11px] mt-1">
							Hacé tu pedido directamente desde acá
						</p>
					</div>
				</div>
			</div>

			{/* ── Category tabs (sticky) ── */}
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
						{/* All tab */}
						<button
							onClick={() => scrollToCategory("all")}
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
								{products.length}
							</span>
						</button>

						{categories.map((cat) => {
							const isActive = activeCategory === cat.id;
							const count = productCountByCategory[cat.id] ?? 0;
							return (
								<button
									key={cat.id}
									onClick={() => scrollToCategory(cat.id)}
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

			{/* ── Product sections ── */}
			<div className="max-w-md mx-auto px-4 mt-5 relative z-10">
				{groupedFiltered.map(({ category, products: catProducts }) => (
					<div
						key={category.id}
						ref={(el) => {
							categoryRefs.current[category.id] = el;
						}}
					>
						<CategorySection
							category={category}
							products={catProducts}
							cart={cart}
							onAdd={addToCart}
							onDecrease={removeFromCart}
							categories={categories}
						/>
					</div>
				))}

				{/* Footer */}
				<div className="border-t border-surface-3 pt-4 pb-32 mt-4">
					<p className="font-body text-ink-tertiary text-[11px] text-center">
						My Way · Bar & Pool · Mesa {tableId.replace("t", "")}
					</p>
				</div>
			</div>

			{/* ── Sticky cart bar ── */}
			{cartCount > 0 && (
				<div
					className="fixed z-30 animate-slide-up"
					style={{
						bottom: "72px",
						left: 0,
						right: 0,
						padding: "0 16px 8px",
					}}
				>
					<div className="max-w-md mx-auto">
						<Link href={`/customer/menu/cart?tableId=${tableId}`}>
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
										className="inline-flex items-center justify-center w-6 h-6 rounded-full font-kds"
										style={{
											background: "rgba(0,0,0,0.25)",
											fontSize: "13px",
											color: "#080808",
										}}
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

			{/* ── Bottom nav ── */}
			<BottomNav active="menu" tableId={tableId} cartCount={cartCount} />

			<InstallPrompt />
		</div>
	);
}

// ─── Main page (Suspense for useSearchParams) ─────────────────────────────────

export default function CustomerMenuPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-surface-0 flex items-center justify-center">
					<div className="text-center">
						<div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4" />
						<p className="font-body text-ink-tertiary text-sm">Cargando…</p>
					</div>
				</div>
			}
		>
			<MenuContent />
		</Suspense>
	);
}
