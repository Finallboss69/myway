"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
import {
	ArrowLeft,
	Plus,
	Minus,
	X,
	ShoppingBag,
	Lock,
	Clock,
	CheckCircle,
	UtensilsCrossed,
	ShoppingCart,
	Truck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
	productId: string;
	name: string;
	price: number;
	qty: number;
	target: "bar" | "kitchen";
	notes?: string;
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

function clearCart(tableId: string): void {
	localStorage.removeItem(`myway_cart_${tableId}`);
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────

function BottomNav({ tableId }: { tableId: string }) {
	return (
		<nav className="mobile-nav">
			<Link
				href={`/customer/menu?tableId=${tableId}`}
				className="mobile-nav-item"
			>
				<UtensilsCrossed size={20} />
				<span>Menú</span>
			</Link>
			<Link
				href={`/customer/menu/cart?tableId=${tableId}`}
				className="mobile-nav-item active"
			>
				<ShoppingCart size={20} />
				<span>Mi pedido</span>
			</Link>
			<Link
				href={`/customer/order-status?tableId=${tableId}`}
				className="mobile-nav-item"
			>
				<Clock size={20} />
				<span>Estado</span>
			</Link>
			<Link href="/customer/delivery" className="mobile-nav-item">
				<Truck size={20} />
				<span>Delivery</span>
			</Link>
		</nav>
	);
}

// ─── Qty control ──────────────────────────────────────────────────────────────

function QuantityControl({
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
			style={{ border: "1px solid #272727", background: "#161616" }}
		>
			<button
				onClick={onDecrease}
				className="w-9 h-9 flex items-center justify-center text-ink-secondary transition-colors hover:text-brand-500 active:scale-95"
			>
				<Minus size={13} />
			</button>
			<span
				className="font-kds text-ink-primary px-3 min-w-[28px] text-center"
				style={{ fontSize: "18px" }}
			>
				{qty}
			</span>
			<button
				onClick={onIncrease}
				className="w-9 h-9 flex items-center justify-center text-ink-secondary transition-colors hover:text-brand-500 active:scale-95"
			>
				<Plus size={13} />
			</button>
		</div>
	);
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({
	orderId,
	tableId,
}: {
	orderId: string;
	tableId: string;
}) {
	return (
		<div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center px-6 text-center relative">
			{/* Noise */}
			<div
				className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
				aria-hidden
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
					mixBlendMode: "overlay",
				}}
			/>

			{/* Green glow */}
			<div
				aria-hidden
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse 320px 320px at 50% 45%, rgba(16,185,129,0.09) 0%, transparent 70%)",
				}}
			/>

			<div
				className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-fade-in relative z-10"
				style={{
					background: "rgba(16,185,129,0.12)",
					border: "1px solid rgba(16,185,129,0.35)",
					boxShadow: "0 0 40px rgba(16,185,129,0.18)",
				}}
			>
				<CheckCircle size={40} style={{ color: "#10b981" }} />
			</div>

			<h2
				className="font-kds text-ink-primary mb-2 animate-fade-in relative z-10"
				style={{ fontSize: "48px", letterSpacing: "0.06em" }}
			>
				¡Pedido enviado!
			</h2>
			<p className="font-body text-ink-secondary text-[14px] mb-1 animate-fade-in relative z-10">
				Estamos preparando tu pedido
			</p>
			<p className="font-body text-ink-tertiary text-[13px] mb-10 animate-fade-in relative z-10">
				Orden #{orderId.slice(0, 8).toUpperCase()} · ~15 min
			</p>

			<div className="flex flex-col gap-3 w-full max-w-xs animate-slide-up relative z-10">
				<Link href={`/customer/order-status?tableId=${tableId}`}>
					<button className="btn-primary w-full justify-center rounded-xl py-4 text-[13px]">
						Ver estado del pedido →
					</button>
				</Link>
				<Link href={`/customer/menu?tableId=${tableId}`}>
					<button className="btn-secondary w-full justify-center rounded-xl py-4 text-[13px]">
						Seguir pidiendo →
					</button>
				</Link>
			</div>
		</div>
	);
}

// ─── Cart inner content ───────────────────────────────────────────────────────

function CartContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tableId = searchParams.get("tableId") ?? "t2";
	const tableNumber = searchParams.get("table") ?? tableId.replace("t", "");

	const [cart, setCart] = useState<CartItem[]>([]);
	const [notes, setNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [orderId, setOrderId] = useState<string | null>(null);
	const [mounted, setMounted] = useState(false);

	// Load cart from localStorage on mount
	useEffect(() => {
		setCart(loadCart(tableId));
		setMounted(true);
	}, [tableId]);

	// Persist cart to localStorage on change (only after mount)
	useEffect(() => {
		if (mounted) {
			saveCart(tableId, cart);
		}
	}, [cart, tableId, mounted]);

	const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
	const itemCount = cart.reduce((s, i) => s + i.qty, 0);

	const handleIncrease = (productId: string) => {
		setCart((prev) =>
			prev.map((i) =>
				i.productId === productId ? { ...i, qty: i.qty + 1 } : i,
			),
		);
	};

	const handleDecrease = (productId: string) => {
		setCart((prev) => {
			const item = prev.find((i) => i.productId === productId);
			if (!item) return prev;
			if (item.qty <= 1) return prev.filter((i) => i.productId !== productId);
			return prev.map((i) =>
				i.productId === productId ? { ...i, qty: i.qty - 1 } : i,
			);
		});
	};

	const handleRemove = (productId: string) => {
		setCart((prev) => prev.filter((i) => i.productId !== productId));
	};

	const handleConfirm = async () => {
		if (cart.length === 0) return;
		try {
			setSubmitting(true);
			setSubmitError(null);
			const res = await fetch("/api/orders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					tableId,
					items: cart.map((i) => ({
						productId: i.productId,
						name: i.name,
						qty: i.qty,
						price: i.price,
						target: i.target,
						...(notes.trim() ? { notes: notes.trim() } : {}),
					})),
				}),
			});
			if (!res.ok) throw new Error("Error al enviar el pedido");
			const order = (await res.json()) as { id: string };
			clearCart(tableId);
			setCart([]);
			setOrderId(order.id);
		} catch (e) {
			setSubmitError(e instanceof Error ? e.message : "Error desconocido");
		} finally {
			setSubmitting(false);
		}
	};

	if (orderId) {
		return <SuccessScreen orderId={orderId} tableId={tableId} />;
	}

	return (
		<div
			className={clsx(
				"min-h-screen bg-surface-0 relative",
				cart.length > 0 ? "pb-40" : "pb-24",
			)}
		>
			{/* Noise */}
			<div
				className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
				aria-hidden
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
					mixBlendMode: "overlay",
				}}
			/>

			{/* ── Header ── */}
			<div
				className="sticky top-0 z-20 border-b border-surface-3"
				style={{
					background: "rgba(8,8,8,0.95)",
					backdropFilter: "blur(14px)",
					WebkitBackdropFilter: "blur(14px)",
					paddingTop: "env(safe-area-inset-top, 0px)",
				}}
			>
				<div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
					<Link
						href={`/customer/menu?tableId=${tableId}`}
						className="btn-ghost -ml-2 text-[13px]"
					>
						<ArrowLeft size={15} />
						Menú
					</Link>
					<div className="text-right">
						<p className="font-display text-ink-primary font-bold text-[15px] tracking-wide uppercase">
							Tu Pedido
						</p>
						<p className="font-body text-ink-tertiary text-[11px]">
							Mesa {tableNumber}
							{itemCount > 0 &&
								` · ${itemCount} ${itemCount === 1 ? "ítem" : "ítems"}`}
						</p>
					</div>
				</div>
			</div>

			<div className="max-w-md mx-auto px-4 mt-5 space-y-4 relative z-10">
				{/* ── Empty state ── */}
				{cart.length === 0 && (
					<div className="card rounded-2xl p-10 text-center mt-8 animate-fade-in">
						<ShoppingBag size={36} className="text-ink-tertiary mx-auto mb-4" />
						<p className="font-display font-bold text-ink-secondary text-[15px] uppercase tracking-wide mb-1">
							Tu carrito está vacío
						</p>
						<p className="font-body text-ink-tertiary text-[13px] mb-6">
							Agregá productos desde el menú
						</p>
						<Link href={`/customer/menu?tableId=${tableId}`}>
							<button className="btn-primary rounded-xl">Ver el menú</button>
						</Link>
					</div>
				)}

				{/* ── Cart items ── */}
				{cart.length > 0 && (
					<div className="card rounded-2xl overflow-hidden">
						{cart.map((item, idx) => (
							<div key={item.productId}>
								<div className="px-4 py-3.5 flex items-center gap-3">
									<QuantityControl
										qty={item.qty}
										onIncrease={() => handleIncrease(item.productId)}
										onDecrease={() => handleDecrease(item.productId)}
									/>
									<div className="flex-1 min-w-0">
										<p className="font-display text-ink-primary text-[13px] font-bold uppercase truncate">
											{item.name}
										</p>
										<p className="font-body text-ink-tertiary text-[11px] mt-0.5">
											{formatCurrency(item.price)} c/u
										</p>
									</div>
									<div className="flex flex-col items-end gap-1.5 shrink-0">
										<span
											className="font-kds text-brand-500"
											style={{ fontSize: "20px", lineHeight: 1 }}
										>
											{formatCurrency(item.price * item.qty)}
										</span>
										<button
											onClick={() => handleRemove(item.productId)}
											className="text-ink-tertiary hover:text-red-400 transition-colors p-0.5"
											aria-label="Eliminar"
										>
											<X size={13} />
										</button>
									</div>
								</div>
								{idx < cart.length - 1 && <div className="divider mx-4" />}
							</div>
						))}
					</div>
				)}

				{/* ── Notes ── */}
				{cart.length > 0 && (
					<div className="card rounded-2xl p-4">
						<label className="block font-display font-bold text-[11px] text-ink-tertiary uppercase tracking-widest mb-2">
							Notas para el pedido
						</label>
						<textarea
							className="input-base resize-none text-[13px]"
							rows={3}
							placeholder="Sin cebolla, extra salsa, alergias..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</div>
				)}

				{/* ── Summary ── */}
				{cart.length > 0 && (
					<div className="card rounded-2xl overflow-hidden">
						<div className="px-4 py-3 flex items-center justify-between">
							<span className="font-body text-ink-secondary text-[13px]">
								Subtotal ({itemCount} {itemCount === 1 ? "ítem" : "ítems"})
							</span>
							<span className="font-body text-ink-primary text-[14px] font-medium">
								{formatCurrency(subtotal)}
							</span>
						</div>
						<div className="divider" />
						<div className="px-4 py-3 flex items-center justify-between">
							<span className="font-body text-ink-secondary text-[13px]">
								Servicio
							</span>
							<span
								style={{ color: "#10b981" }}
								className="font-body text-[12px]"
							>
								Sin cargo
							</span>
						</div>
						<div className="divider" />
						<div className="px-4 py-4 flex items-center justify-between">
							<span className="font-display font-bold text-ink-primary text-[14px] uppercase tracking-wide">
								Total
							</span>
							<span
								className="font-kds text-brand-500"
								style={{ fontSize: "26px", lineHeight: 1 }}
							>
								{formatCurrency(subtotal)}
							</span>
						</div>
						<div
							className="px-4 py-2.5 flex items-center gap-2"
							style={{
								background: "rgba(245,158,11,0.05)",
								borderTop: "1px solid rgba(245,158,11,0.1)",
							}}
						>
							<span className="text-brand-500 text-[13px]">💳</span>
							<p className="font-body text-ink-secondary text-[12px]">
								Pago al cerrar la mesa
							</p>
						</div>
					</div>
				)}

				{/* ── Trust signals ── */}
				{cart.length > 0 && (
					<div className="flex gap-3">
						<div
							className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
							style={{ background: "#0f0f0f", border: "1px solid #1e1e1e" }}
						>
							<Lock
								size={13}
								style={{ color: "#10b981" }}
								className="shrink-0"
							/>
							<p className="font-body text-ink-tertiary text-[11px] leading-tight">
								Pedido seguro
							</p>
						</div>
						<div
							className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
							style={{ background: "#0f0f0f", border: "1px solid #1e1e1e" }}
						>
							<Clock size={13} className="text-brand-500 shrink-0" />
							<p className="font-body text-ink-tertiary text-[11px] leading-tight">
								~15 min estimado
							</p>
						</div>
					</div>
				)}

				{/* ── Submit error ── */}
				{submitError && (
					<div
						className="rounded-xl px-4 py-3 flex items-center gap-3"
						style={{
							background: "rgba(239,68,68,0.12)",
							border: "1px solid rgba(239,68,68,0.3)",
						}}
					>
						<p className="font-body text-red-400 text-[13px] flex-1">
							{submitError}
						</p>
						<button
							onClick={() => setSubmitError(null)}
							className="text-red-400 hover:text-red-300 shrink-0"
						>
							<X size={13} />
						</button>
					</div>
				)}
			</div>

			{/* ── Sticky confirm bar ── */}
			{cart.length > 0 && (
				<div
					className="fixed bottom-16 left-0 right-0 z-30 animate-slide-up"
					style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
				>
					<div
						className="border-t border-surface-3"
						style={{
							background: "rgba(8,8,8,0.96)",
							backdropFilter: "blur(14px)",
							WebkitBackdropFilter: "blur(14px)",
						}}
					>
						<div className="max-w-md mx-auto px-4 py-3">
							<button
								onClick={handleConfirm}
								disabled={submitting}
								className="btn-primary w-full justify-center rounded-2xl"
								style={{
									padding: "15px 20px",
									fontSize: "14px",
									letterSpacing: "0.06em",
									boxShadow:
										"0 0 32px rgba(245,158,11,0.35), 0 8px 24px rgba(0,0,0,0.6)",
									opacity: submitting ? 0.7 : 1,
									cursor: submitting ? "not-allowed" : "pointer",
								}}
							>
								{submitting
									? "Enviando…"
									: `Confirmar pedido · ${formatCurrency(subtotal)}`}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ── Bottom nav ── */}
			<BottomNav tableId={tableId} />
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CartPage() {
	return (
		<>
			<Suspense
				fallback={
					<div className="min-h-screen bg-surface-0 flex items-center justify-center">
						<div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
					</div>
				}
			>
				<CartContent />
			</Suspense>
			<HelpButton {...helpContent.customerCart} variant="float" />
		</>
	);
}
