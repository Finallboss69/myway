"use client";

import {
	useState,
	useEffect,
	useMemo,
	useRef,
	useCallback,
	Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
	ArrowLeft,
	Home,
	CheckCircle2,
	CreditCard,
	Banknote,
	Smartphone,
	Terminal,
	Loader2,
	RefreshCw,
	ArrowRightLeft,
	Copy,
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

import type { PaymentMethod } from "@/lib/types";
import { getWaiterPin } from "@/lib/admin-pin";

const IVA_RATE = 0.21;

// ─── MercadoPago QR Component ─────────────────────────────────────────────────

function MercadoPagoQR({
	orderIds,
	onPaid,
}: {
	orderIds: string[];
	onPaid: () => void;
}) {
	const [qrData, setQrData] = useState<string | null>(null);
	const [extRef, setExtRef] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const generateQR = useCallback(async () => {
		setLoading(true);
		setError(null);
		setQrData(null);
		setExtRef(null);
		try {
			const res = await fetch("/api/payments/mp", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-staff-pin": getWaiterPin(),
				},
				body: JSON.stringify({ orderIds }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error ?? "Error al generar QR");
				return;
			}
			setQrData(data.qrData);
			setExtRef(data.externalReference);
		} catch {
			setError("Error de conexión");
		} finally {
			setLoading(false);
		}
	}, [orderIds]);

	// Auto-generate on mount
	useEffect(() => {
		if (orderIds.length > 0) generateQR();
	}, [orderIds, generateQR]);

	// Poll for payment status
	useEffect(() => {
		if (!extRef) return;
		const check = async () => {
			try {
				const res = await fetch(
					`/api/payments/mp?externalReference=${encodeURIComponent(extRef)}`,
					{
						headers: { "x-staff-pin": getWaiterPin() },
					},
				);
				if (res.ok) {
					const data = await res.json();
					if (data.status === "paid") {
						if (pollRef.current) clearInterval(pollRef.current);
						onPaid();
					}
				}
			} catch {
				/* ignore polling errors */
			}
		};
		pollRef.current = setInterval(check, 3000);
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [extRef, onPaid]);

	if (loading) {
		return (
			<div className="flex flex-col items-center gap-3 py-6">
				<Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
				<p className="font-display text-xs text-ink-tertiary">
					Generando QR de pago...
				</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center gap-3 py-4">
				<p className="font-display text-xs text-red-400 text-center">{error}</p>
				<button
					onClick={generateQR}
					className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-surface-3 font-display text-xs text-ink-secondary hover:bg-surface-3 transition-colors"
				>
					<RefreshCw size={14} />
					Reintentar
				</button>
			</div>
		);
	}

	if (!qrData) return null;

	return (
		<div className="flex flex-col items-center gap-3 py-4">
			<div className="rounded-2xl p-4" style={{ background: "#fff" }}>
				<QRCode value={qrData} size={180} level="M" />
			</div>
			<p className="font-display text-xs text-ink-tertiary text-center">
				Escaneá con la app de MercadoPago
			</p>
			<div className="flex items-center gap-2">
				<div
					className="w-2 h-2 rounded-full animate-pulse"
					style={{ background: "#009ee3" }}
				/>
				<span className="font-display text-[11px]" style={{ color: "#009ee3" }}>
					Esperando pago...
				</span>
			</div>
			<button
				onClick={generateQR}
				className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-display text-[10px] text-ink-tertiary hover:text-ink-secondary transition-colors"
			>
				<RefreshCw size={12} />
				Regenerar QR
			</button>
		</div>
	);
}

// ─── Point (posnet / tarjeta) Component ──────────────────────────────────────

function PointTerminal({
	orderIds,
	onPaid,
}: {
	orderIds: string[];
	onPaid: () => void;
}) {
	const [intentId, setIntentId] = useState<string | null>(null);
	const [state, setState] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const createIntent = useCallback(async () => {
		setLoading(true);
		setError(null);
		setIntentId(null);
		setState("");
		try {
			const res = await fetch("/api/payments/point", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-staff-pin": getWaiterPin(),
				},
				body: JSON.stringify({ orderIds }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error ?? "Error al enviar al posnet");
				return;
			}
			setIntentId(data.intentId);
			setState(data.state);
		} catch {
			setError("Error de conexión");
		} finally {
			setLoading(false);
		}
	}, [orderIds]);

	// Auto-create on mount
	useEffect(() => {
		if (orderIds.length > 0) createIntent();
	}, [orderIds, createIntent]);

	// Poll status (5 min timeout)
	const onPaidRef = useRef(onPaid);
	onPaidRef.current = onPaid;

	useEffect(() => {
		if (!intentId) return;
		let closed = false;
		const startedAt = Date.now();
		const check = async () => {
			if (closed) return;
			if (Date.now() - startedAt > 5 * 60 * 1000) {
				if (pollRef.current) clearInterval(pollRef.current);
				setError("Tiempo de espera agotado — intentá de nuevo");
				return;
			}
			try {
				const res = await fetch(
					`/api/payments/point?intentId=${encodeURIComponent(intentId)}`,
					{ headers: { "x-staff-pin": getWaiterPin() } },
				);
				if (res.ok) {
					const data = await res.json();
					setState(data.state);
					if (data.state === "FINISHED" || data.state === "PROCESSED") {
						closed = true;
						if (pollRef.current) clearInterval(pollRef.current);
						onPaidRef.current();
					} else if (data.state === "CANCELED" || data.state === "ERROR") {
						if (pollRef.current) clearInterval(pollRef.current);
						setError(
							data.state === "CANCELED"
								? "Pago cancelado desde el terminal"
								: "Error en el terminal",
						);
					}
				}
			} catch {
				/* ignore */
			}
		};
		pollRef.current = setInterval(check, 3000);
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [intentId]);

	// Cancel intent on unmount
	useEffect(() => {
		return () => {
			if (intentId) {
				fetch(`/api/payments/point?intentId=${intentId}`, {
					method: "DELETE",
					headers: { "x-staff-pin": getWaiterPin() },
				}).catch(() => {});
			}
		};
	}, [intentId]);

	if (loading) {
		return (
			<div className="flex flex-col items-center gap-3 py-6">
				<Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
				<p className="font-display text-xs text-ink-tertiary">
					Enviando al posnet...
				</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center gap-3 py-4">
				<p className="font-display text-xs text-red-400 text-center">{error}</p>
				<button
					onClick={createIntent}
					className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-surface-3 font-display text-xs text-ink-secondary hover:bg-surface-3 transition-colors"
				>
					<RefreshCw size={14} />
					Reintentar
				</button>
			</div>
		);
	}

	if (!intentId) return null;

	return (
		<div className="flex flex-col items-center gap-3 py-4">
			<div
				className="w-16 h-16 rounded-2xl flex items-center justify-center"
				style={{
					background: "rgba(139,92,246,0.1)",
					border: "1px solid rgba(139,92,246,0.25)",
				}}
			>
				<Terminal className="w-8 h-8 text-purple-400" />
			</div>
			<p className="font-display text-sm font-semibold text-ink-primary">
				{state === "OPEN" || state === "ON_TERMINAL"
					? "Pasá la tarjeta por el posnet"
					: state === "PROCESSING"
						? "Procesando pago..."
						: "Esperando terminal..."}
			</p>
			<div className="flex items-center gap-2">
				<div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
				<span className="font-display text-[11px] text-purple-400">
					Esperando respuesta
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
	const [transferAlias, setTransferAlias] = useState("");
	const [aliasCopied, setAliasCopied] = useState(false);

	useEffect(() => {
		fetch("/api/settings/public")
			.then((r) => (r.ok ? r.json() : []))
			.then((data: { key: string; value: string }[]) => {
				const found = Array.isArray(data)
					? data.find((s) => s.key === "transfer_alias")
					: null;
				if (found) setTransferAlias(found.value);
			})
			.catch(() => {});
	}, []);

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
			const responses = await Promise.all(
				orders.map((o) =>
					fetch(`/api/orders/${o.id}/close`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"x-staff-pin": getWaiterPin(),
						},
						body: JSON.stringify({ paymentMethod: method }),
					}),
				),
			);
			const failed = responses.filter((r) => !r.ok);
			if (failed.length > 0) {
				const err = await failed[0]
					.json()
					.catch(() => ({ error: "Error al cerrar orden" }));
				throw new Error(err.error ?? "Error al cerrar orden");
			}
			setSuccess(true);
			setTimeout(() => router.push("/waiter/tables"), 2500);
		} catch (e) {
			alert(e instanceof Error ? e.message : "Error al cerrar la orden");
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
							<div className="p-3 grid grid-cols-2 gap-2.5">
								{(
									[
										{ key: "cash" as const, icon: Banknote, label: "Efectivo" },
										{
											key: "mercadopago" as const,
											icon: Smartphone,
											label: "MercadoPago",
										},
										{ key: "card" as const, icon: Terminal, label: "Tarjeta" },
										{
											key: "transfer" as const,
											icon: ArrowRightLeft,
											label: "Transferencia",
										},
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
									<MercadoPagoQR
										orderIds={orders.map((o) => o.id)}
										onPaid={() => {
											setSuccess(true);
											setTimeout(() => router.push("/waiter/tables"), 2500);
										}}
									/>
								</div>
							)}

							{/* Card: Point terminal */}
							{method === "card" && (
								<div className="px-4 pb-4 animate-slide-down">
									<div className="divider mb-4" />
									<PointTerminal
										orderIds={orders.map((o) => o.id)}
										onPaid={() => {
											setSuccess(true);
											setTimeout(() => router.push("/waiter/tables"), 2500);
										}}
									/>
								</div>
							)}

							{/* Transfer: show alias */}
							{method === "transfer" && (
								<div className="px-4 pb-4 animate-slide-down">
									<div className="divider mb-4" />
									{transferAlias ? (
										<div className="flex flex-col items-center gap-3">
											<div className="w-full p-4 rounded-xl border border-surface-3 bg-surface-2 text-center">
												<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest mb-2">
													Alias para transferir
												</p>
												<p
													className="font-kds text-2xl text-brand-500 tracking-wider select-all"
													style={{
														textShadow: "0 0 20px rgba(245,158,11,0.3)",
													}}
												>
													{transferAlias}
												</p>
											</div>
											<button
												onClick={async () => {
													try {
														await navigator.clipboard.writeText(transferAlias);
														setAliasCopied(true);
														setTimeout(() => setAliasCopied(false), 2000);
													} catch {
														/* clipboard not available */
													}
												}}
												className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-surface-3 font-display text-xs text-ink-secondary hover:bg-surface-3 transition-colors"
											>
												{aliasCopied ? (
													<CheckCircle2
														size={14}
														className="text-emerald-400"
													/>
												) : (
													<Copy size={14} />
												)}
												{aliasCopied ? "Copiado" : "Copiar alias"}
											</button>
											<p className="font-display text-[10px] text-ink-tertiary text-center">
												El cliente transfiere a este alias y confirmás el pago
											</p>
										</div>
									) : (
										<div className="text-center py-4">
											<p className="font-display text-xs text-ink-tertiary">
												Alias no configurado
											</p>
											<p className="font-display text-[10px] text-ink-tertiary mt-1">
												Pedile al admin que configure el alias en Ajustes
											</p>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Confirm button — hidden when MP is selected (QR handles payment) */}
						{method !== "mercadopago" && (
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
						)}
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
