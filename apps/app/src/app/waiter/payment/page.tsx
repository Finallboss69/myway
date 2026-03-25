"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	Home,
	CheckCircle2,
	CreditCard,
	Banknote,
	Smartphone,
	Terminal,
	Loader2,
} from "lucide-react";
import clsx from "clsx";
import { formatCurrency } from "@/lib/utils";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type PaymentMethod = "cash" | "mercadopago" | "card";

const IVA_RATE = 0.21;

// ─── QR Placeholder ───────────────────────────────────────────────────────────

function QRPlaceholder() {
	return (
		<div className="flex flex-col items-center gap-3 py-4">
			<div
				className="rounded-2xl p-4 flex items-center justify-center"
				style={{ background: "#fff" }}
			>
				<svg
					width="140"
					height="140"
					viewBox="0 0 140 140"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					{/* Outer finder patterns */}
					<rect x="10" y="10" width="40" height="40" rx="4" fill="#1a1a1a" />
					<rect x="16" y="16" width="28" height="28" rx="2" fill="#fff" />
					<rect x="22" y="22" width="16" height="16" rx="1" fill="#1a1a1a" />

					<rect x="90" y="10" width="40" height="40" rx="4" fill="#1a1a1a" />
					<rect x="96" y="16" width="28" height="28" rx="2" fill="#fff" />
					<rect x="102" y="22" width="16" height="16" rx="1" fill="#1a1a1a" />

					<rect x="10" y="90" width="40" height="40" rx="4" fill="#1a1a1a" />
					<rect x="16" y="96" width="28" height="28" rx="2" fill="#fff" />
					<rect x="22" y="102" width="16" height="16" rx="1" fill="#1a1a1a" />

					{/* Data modules (simplified) */}
					{[60, 68, 76, 84].map((x) =>
						[10, 18, 26, 34, 42].map((y) => (
							<rect
								key={`${x}-${y}`}
								x={x}
								y={y}
								width="6"
								height="6"
								rx="1"
								fill={Math.random() > 0.5 ? "#1a1a1a" : "#fff"}
							/>
						)),
					)}
					{[10, 18, 26, 34, 42, 50].map((x) =>
						[60, 68, 76, 84, 92, 100, 108, 116].map((y) => (
							<rect
								key={`d-${x}-${y}`}
								x={x}
								y={y}
								width="6"
								height="6"
								rx="1"
								fill={Math.random() > 0.5 ? "#1a1a1a" : "#fff"}
							/>
						)),
					)}
					{[60, 68, 76, 84, 92, 100, 108, 116, 124].map((x) =>
						[60, 68, 76, 84, 92, 100, 108, 116].map((y) => (
							<rect
								key={`e-${x}-${y}`}
								x={x}
								y={y}
								width="6"
								height="6"
								rx="1"
								fill={Math.random() > 0.5 ? "#1a1a1a" : "#fff"}
							/>
						)),
					)}
				</svg>
			</div>
			<p className="font-display text-xs text-ink-tertiary text-center">
				Escanear con MercadoPago
			</p>
			<div
				className="px-3 py-1 rounded-lg"
				style={{
					background: "rgba(0,158,227,0.1)",
					border: "1px solid rgba(0,158,227,0.25)",
				}}
			>
				<span
					className="font-display text-xs font-bold"
					style={{ color: "#009ee3" }}
				>
					MercadoPago
				</span>
			</div>
		</div>
	);
}

// ─── Confetti dots overlay ────────────────────────────────────────────────────

function ConfettiOverlay() {
	const dots = useMemo(() => {
		return Array.from({ length: 30 }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			delay: Math.random() * 1.5,
			size: Math.random() * 8 + 4,
			color: ["#f59e0b", "#10b981", "#3b82f6", "#a78bfa", "#f87171"][
				Math.floor(Math.random() * 5)
			],
		}));
	}, []);

	return (
		<div className="absolute inset-0 pointer-events-none overflow-hidden">
			{dots.map((dot) => (
				<div
					key={dot.id}
					className="absolute rounded-full"
					style={{
						left: `${dot.x}%`,
						top: "-10px",
						width: dot.size,
						height: dot.size,
						background: dot.color,
						animation: `confettiFall 2s ease-in ${dot.delay}s forwards`,
					}}
				/>
			))}
			<style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
		</div>
	);
}

// ─── Payment content (needs useSearchParams) ─────────────────────────────────

function PaymentContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const tableId = searchParams.get("tableId");

	const [orders, setOrders] = useState<Order[]>([]);
	const [loadingOrders, setLoadingOrders] = useState(true);
	const [method, setMethod] = useState<PaymentMethod>("cash");
	const [cashReceived, setCashReceived] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (!tableId) {
			setLoadingOrders(false);
			return;
		}
		fetch(`/api/orders?tableId=${tableId}`)
			.then((r) => r.json())
			.then((data: Order[]) => {
				setOrders(
					data.filter((o) => o.status !== "closed" && o.status !== "cancelled"),
				);
				setLoadingOrders(false);
			})
			.catch(() => setLoadingOrders(false));
	}, [tableId]);

	const subtotal = useMemo(
		() =>
			orders.reduce(
				(sum, o) => sum + o.items.reduce((s, i) => s + i.qty * i.price, 0),
				0,
			),
		[orders],
	);

	const iva = Math.round(subtotal * IVA_RATE);
	const total = subtotal + iva;

	const cashReceivedNum = parseFloat(cashReceived.replace(",", ".")) || 0;
	const change = Math.max(0, cashReceivedNum - total);

	async function handleConfirm() {
		if (orders.length === 0) return;
		setSubmitting(true);
		try {
			// Close all active orders for the table
			await Promise.all(
				orders.map((o) =>
					fetch(`/api/orders/${o.id}/close`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ paymentMethod: method }),
					}),
				),
			);
			setSuccess(true);
			setTimeout(() => router.push("/waiter/tables"), 2500);
		} finally {
			setSubmitting(false);
		}
	}

	// Ready count for bottom nav badge
	const readyCount = useMemo(
		() =>
			orders.reduce(
				(count, o) =>
					count + o.items.filter((i) => i.status === "ready").length,
				0,
			),
		[orders],
	);

	const tableNumber = orders.length > 0 ? orders[0].tableNumber : null;

	if (loadingOrders) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ background: "var(--s0)" }}
			>
				<Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
			</div>
		);
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
				<Link
					href={tableId ? `/waiter/table/${tableId}` : "/waiter/tables"}
					className="btn-ghost p-2 rounded-xl shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
					aria-label="Volver"
				>
					<ArrowLeft className="w-5 h-5" />
				</Link>

				<div className="flex items-center gap-3 flex-1 min-w-0">
					{tableNumber !== null && (
						<span
							className="font-kds leading-none text-brand-500"
							style={{ fontSize: 44 }}
						>
							{tableNumber}
						</span>
					)}
					<div className="flex flex-col min-w-0">
						<h1 className="font-kds text-2xl leading-none text-ink-primary tracking-widest">
							CUENTA
						</h1>
						{tableNumber !== null && (
							<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
								Mesa {tableNumber}
							</p>
						)}
					</div>
				</div>

				<CreditCard className="w-5 h-5 text-ink-tertiary shrink-0" />
			</header>

			{/* Content */}
			<main className="flex-1 overflow-y-auto pb-safe">
				{!tableId ? (
					<div className="flex flex-col items-center gap-4 pt-20 px-6">
						<p className="font-display text-sm text-ink-tertiary text-center">
							Seleccioná una mesa para ver la cuenta.
						</p>
						<Link href="/waiter/tables" className="btn-secondary">
							Ver mesas
						</Link>
					</div>
				) : orders.length === 0 ? (
					<div className="flex flex-col items-center gap-4 pt-20 px-6">
						<p className="font-display text-sm text-ink-tertiary text-center">
							No hay pedidos activos para esta mesa.
						</p>
					</div>
				) : (
					<div className="p-4 flex flex-col gap-4">
						{/* Order summary */}
						<div className="card overflow-hidden">
							<div className="px-4 py-3 border-b border-surface-3 bg-surface-2/50">
								<span className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
									Resumen del pedido
								</span>
							</div>
							<div className="divide-y divide-surface-3">
								{orders.flatMap((o) =>
									o.items
										.filter((i) => i.status !== "cancelled")
										.map((item) => (
											<div
												key={`${o.id}-${item.id}`}
												className="flex items-center gap-3 px-4"
												style={{
													minHeight: 52,
													paddingTop: 10,
													paddingBottom: 10,
												}}
											>
												<span
													className="font-kds leading-none text-brand-500 shrink-0 text-center"
													style={{ fontSize: 28, width: 28 }}
												>
													{item.qty}
												</span>
												<p className="flex-1 font-display text-sm font-bold text-ink-primary truncate">
													{item.name}
												</p>
												<span
													className="font-kds leading-none text-ink-secondary shrink-0"
													style={{ fontSize: 18 }}
												>
													{formatCurrency(item.qty * item.price)}
												</span>
											</div>
										)),
								)}
							</div>

							{/* Subtotal + IVA */}
							<div className="px-4 pt-3 pb-1 border-t border-surface-3 bg-surface-2/50 flex flex-col gap-2">
								<div className="flex justify-between">
									<span className="font-display text-xs text-ink-tertiary">
										Subtotal
									</span>
									<span className="font-display text-xs text-ink-secondary">
										{formatCurrency(subtotal)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="font-display text-xs text-ink-tertiary">
										IVA (21%)
									</span>
									<span className="font-display text-xs text-ink-secondary">
										{formatCurrency(iva)}
									</span>
								</div>
							</div>

							{/* Total — large and gold, centered */}
							<div
								className="flex flex-col items-center justify-center py-5 border-t border-surface-3"
								style={{ background: "rgba(245,158,11,0.05)" }}
							>
								<span className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest mb-1">
									Total
								</span>
								<span
									className="font-kds leading-none text-brand-500"
									style={{
										fontSize: 64,
										textShadow: "0 0 28px rgba(245,158,11,0.35)",
									}}
								>
									{formatCurrency(total)}
								</span>
							</div>
						</div>

						{/* Payment method — 3 large tiles */}
						<div className="card overflow-hidden">
							<div className="px-4 py-3 border-b border-surface-3 bg-surface-2/50">
								<span className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
									Método de pago
								</span>
							</div>
							<div className="p-3 grid grid-cols-3 gap-2.5">
								{(
									[
										{ key: "cash" as const, icon: Banknote, label: "Efectivo" },
										{
											key: "mercadopago" as const,
											icon: Smartphone,
											label: "MercadoPago",
										},
										{ key: "card" as const, icon: Terminal, label: "Tarjeta" },
									] as const
								).map(({ key, icon: Icon, label }) => {
									const isActive = method === key;
									return (
										<button
											key={key}
											onClick={() => setMethod(key)}
											className="flex flex-col items-center justify-center gap-2.5 rounded-2xl transition-all active:scale-95"
											style={{
												minHeight: 90,
												padding: "16px 10px",
												background: isActive ? "var(--gold)" : "var(--s2)",
												border: isActive
													? "1px solid rgba(245,158,11,0.7)"
													: "1px solid var(--s3)",
												boxShadow: isActive
													? "0 0 28px rgba(245,158,11,0.4), 0 2px 12px rgba(0,0,0,0.4)"
													: "none",
											}}
										>
											<div
												className="w-11 h-11 rounded-xl flex items-center justify-center"
												style={{
													background: isActive
														? "rgba(0,0,0,0.2)"
														: "var(--s3)",
													border: isActive ? "none" : "1px solid var(--s4)",
												}}
											>
												<Icon
													style={{
														width: 20,
														height: 20,
														color: isActive ? "#080808" : "#6b6b6b",
													}}
												/>
											</div>
											<span
												className="font-display font-bold text-[11px] uppercase tracking-wider text-center leading-tight"
												style={{ color: isActive ? "#080808" : "#6b6b6b" }}
											>
												{label}
											</span>
										</button>
									);
								})}
							</div>

							{/* Cash: amount + change */}
							{method === "cash" && (
								<div className="px-4 pb-4 flex flex-col gap-3 animate-slide-down">
									<div className="divider" />
									<label className="flex flex-col gap-1.5">
										<span className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest">
											Monto recibido
										</span>
										<input
											type="number"
											inputMode="decimal"
											placeholder="0"
											value={cashReceived}
											onChange={(e) => setCashReceived(e.target.value)}
											className="input-base"
											style={{ fontSize: 16 }}
										/>
									</label>
									{cashReceivedNum > 0 && (
										<div
											className={clsx(
												"flex justify-between items-center px-4 py-3.5 rounded-xl",
												change >= 0
													? "bg-emerald-500/10 border border-emerald-500/25"
													: "bg-red-500/10 border border-red-500/25",
											)}
										>
											<span className="font-display text-xs text-ink-secondary uppercase tracking-widest">
												Vuelto
											</span>
											<span
												className={clsx(
													"font-kds leading-none",
													change >= 0 ? "text-emerald-400" : "text-red-400",
												)}
												style={{ fontSize: 28 }}
											>
												{formatCurrency(change)}
											</span>
										</div>
									)}
								</div>
							)}

							{/* MercadoPago: QR */}
							{method === "mercadopago" && (
								<div className="px-4 pb-4 animate-slide-down">
									<div className="divider mb-4" />
									<QRPlaceholder />
								</div>
							)}

							{/* Card: terminal info */}
							{method === "card" && (
								<div className="px-4 pb-4 animate-slide-down">
									<div className="divider mb-4" />
									<div className="flex items-center gap-4 p-4 rounded-xl border border-surface-3 bg-surface-2">
										<div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center shrink-0">
											<Terminal className="w-6 h-6 text-blue-400" />
										</div>
										<div>
											<p className="font-display text-sm font-semibold text-ink-primary">
												Usar terminal
											</p>
											<p className="font-display text-xs text-ink-tertiary mt-0.5">
												Procesá el pago con la lectora
											</p>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Confirm button — full-width, large and gold */}
						<button
							onClick={handleConfirm}
							disabled={submitting || orders.length === 0}
							className="btn-primary w-full justify-center"
							style={{
								minHeight: 64,
								fontSize: 16,
								borderRadius: 16,
								boxShadow:
									"0 0 32px rgba(245,158,11,0.3), 0 4px 18px rgba(0,0,0,0.4)",
							}}
						>
							{submitting ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								<>
									<CheckCircle2 className="w-5 h-5" />
									COBRAR &nbsp;·&nbsp; {formatCurrency(total)}
								</>
							)}
						</button>
					</div>
				)}
			</main>

			{/* Bottom nav */}
			<nav className="mobile-nav">
				<Link href="/waiter/tables" className="mobile-nav-item">
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
				<Link
					href={
						tableId ? `/waiter/payment?tableId=${tableId}` : "/waiter/payment"
					}
					className="mobile-nav-item active"
				>
					<CreditCard size={20} />
					Cuenta
				</Link>
			</nav>

			{/* Success overlay */}
			{success && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-0/85 backdrop-blur-md animate-fade-in overflow-hidden">
					<ConfettiOverlay />
					<div className="card-gold p-10 flex flex-col items-center gap-5 animate-scale-in relative z-10">
						<div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
							<CheckCircle2 className="w-10 h-10 text-emerald-400" />
						</div>
						<div className="text-center">
							<p className="font-kds text-3xl text-emerald-400 tracking-wider">
								PAGO CONFIRMADO
							</p>
							<p className="font-display text-xs text-ink-tertiary uppercase tracking-widest mt-2">
								Redirigiendo...
							</p>
						</div>
						<p
							className="font-kds leading-none text-brand-500"
							style={{ fontSize: 44 }}
						>
							{formatCurrency(total)}
						</p>
					</div>
				</div>
			)}
			<HelpButton {...helpContent.waiterPayment} variant="float" />
		</div>
	);
}

// ─── Page with Suspense boundary (required for useSearchParams) ───────────────

export default function PaymentPage() {
	return (
		<Suspense
			fallback={
				<div
					className="min-h-screen flex items-center justify-center"
					style={{ background: "var(--s0)" }}
				>
					<Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
				</div>
			}
		>
			<PaymentContent />
		</Suspense>
	);
}
