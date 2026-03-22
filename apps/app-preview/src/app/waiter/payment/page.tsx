"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	ArrowLeft,
	DollarSign,
	Smartphone,
	CreditCard,
	CheckCircle2,
} from "lucide-react";
import { TABLES, formatCurrency } from "@/data/mock";
import { useAppStore } from "@/store/useAppStore";
import type { PaymentMethod } from "@/store/useAppStore";
import clsx from "clsx";

const IVA_RATE = 0.21;

// Deterministic confetti
const CONFETTI = [
	{ x: 12, y: 18, color: "#f59e0b", size: 6, r: 45 },
	{ x: 82, y: 12, color: "#10b981", size: 5, r: 20 },
	{ x: 22, y: 78, color: "#8b5cf6", size: 7, r: 70 },
	{ x: 72, y: 72, color: "#f59e0b", size: 5, r: 30 },
	{ x: 50, y: 8, color: "#ec4899", size: 4, r: 55 },
	{ x: 88, y: 42, color: "#10b981", size: 6, r: 15 },
	{ x: 8, y: 52, color: "#f59e0b", size: 5, r: 80 },
	{ x: 62, y: 88, color: "#8b5cf6", size: 4, r: 40 },
	{ x: 32, y: 92, color: "#ec4899", size: 6, r: 65 },
	{ x: 88, y: 82, color: "#f59e0b", size: 5, r: 25 },
	{ x: 42, y: 28, color: "#10b981", size: 4, r: 50 },
	{ x: 4, y: 32, color: "#8b5cf6", size: 5, r: 10 },
];

type MethodId = "efectivo" | "mercadopago" | "tarjeta";
const STORE_METHOD: Record<MethodId, PaymentMethod> = {
	efectivo: "cash",
	mercadopago: "mercadopago",
	tarjeta: "card",
};

const METHODS: { id: MethodId; label: string; icon: React.ReactNode }[] = [
	{ id: "efectivo", label: "Efectivo", icon: <DollarSign size={22} /> },
	{ id: "mercadopago", label: "MercadoPago", icon: <Smartphone size={22} /> },
	{ id: "tarjeta", label: "Tarjeta", icon: <CreditCard size={22} /> },
];

function PaymentContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tableId = searchParams?.get("tableId") ?? "t2";

	const [selectedMethod, setSelectedMethod] = useState<MethodId | null>(null);
	const [amountReceived, setAmountReceived] = useState("");
	const [confirmed, setConfirmed] = useState(false);

	const allOrders = useAppStore((s) => s.orders);
	const closeTable = useAppStore((s) => s.closeTable);

	const table = TABLES.find((t) => t.id === tableId) ?? TABLES[1];
	const tableOrders = allOrders.filter(o => o.tableId === tableId && o.status !== "closed");
	const allItems = tableOrders.flatMap((o) => o.items);

	const subtotal = allItems.reduce((sum, i) => sum + i.price * i.qty, 0);
	const iva = Math.round(subtotal * IVA_RATE);
	const total = subtotal + iva;

	const amountNum = parseFloat(amountReceived.replace(/[^0-9.]/g, "")) || 0;
	const change = Math.max(0, amountNum - total);
	const hasChange = amountNum > 0 && amountNum >= total;
	const insufficient = amountNum > 0 && amountNum < total;

	const canConfirm =
		selectedMethod !== null &&
		(selectedMethod !== "efectivo" || amountNum >= total);

	const handleConfirm = () => {
		if (!canConfirm) return;
		closeTable(tableId, STORE_METHOD[selectedMethod!]);
		setConfirmed(true);
	};

	return (
		<div className="min-h-screen bg-surface-0 flex flex-col max-w-md mx-auto">
			{/* ── Header ── */}
			<div
				className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
				style={{
					background: "rgba(8,8,8,0.92)",
					backdropFilter: "blur(16px)",
					borderBottom: "1px solid var(--s3)",
				}}
			>
				<a
					href={`/waiter/table/${tableId}`}
					className="flex items-center gap-1.5 text-ink-secondary hover:text-ink-primary transition-colors"
					style={{ textDecoration: "none" }}
				>
					<ArrowLeft size={16} />
					<span
						className="font-display uppercase"
						style={{ fontSize: 12, letterSpacing: "0.08em" }}
					>
						Volver
					</span>
				</a>
				<div className="text-center">
					<div
						className="font-display uppercase text-ink-primary font-semibold"
						style={{ fontSize: 13, letterSpacing: "0.06em" }}
					>
						Cobrar Mesa {table?.number}
					</div>
				</div>
				<div
					className="font-kds text-brand-500"
					style={{ fontSize: 18, letterSpacing: "0.12em" }}
				>
					MY WAY
				</div>
			</div>

			{/* ── Scrollable body ── */}
			<div
				className="flex-1 overflow-y-auto px-3 py-4 space-y-4"
				style={{ paddingBottom: 100 }}
			>
				{/* Order summary card */}
				<div className="card overflow-hidden">
					<div
						className="px-4 py-3 flex items-center justify-between"
						style={{ borderBottom: "1px solid var(--s3)" }}
					>
						<span
							className="font-display uppercase text-ink-tertiary"
							style={{ fontSize: 10, letterSpacing: "0.2em" }}
						>
							Resumen del pedido
						</span>
						<span
							className="font-display uppercase text-ink-tertiary"
							style={{ fontSize: 10 }}
						>
							Mesa {table?.number}
						</span>
					</div>

					{allItems.length === 0 ? (
						<div className="px-4 py-6 text-center">
							<div
								className="text-ink-disabled font-body"
								style={{ fontSize: 12 }}
							>
								No hay ítems en esta mesa
							</div>
						</div>
					) : (
						<div className="px-4 py-2 space-y-1">
							{allItems.map((item) => (
								<div key={item.id} className="flex items-center gap-2 py-1.5">
									<span
										className="font-kds text-ink-tertiary leading-none flex-shrink-0"
										style={{ fontSize: 18, minWidth: 24 }}
									>
										{item.qty}×
									</span>
									<span className="text-ink-secondary font-body flex-1 text-sm">
										{item.name}
									</span>
									<span
										className="text-ink-primary font-body font-medium"
										style={{ fontSize: 13 }}
									>
										{formatCurrency(item.price * item.qty)}
									</span>
								</div>
							))}
						</div>
					)}

					{/* Totals */}
					<div
						className="px-4 py-3 space-y-2"
						style={{ borderTop: "1px solid var(--s3)" }}
					>
						<div className="flex justify-between">
							<span
								className="text-ink-tertiary font-body"
								style={{ fontSize: 12 }}
							>
								Subtotal
							</span>
							<span
								className="text-ink-secondary font-body"
								style={{ fontSize: 12 }}
							>
								{formatCurrency(subtotal)}
							</span>
						</div>
						<div className="flex justify-between">
							<span
								className="text-ink-tertiary font-body"
								style={{ fontSize: 12 }}
							>
								IVA (21%)
							</span>
							<span
								className="text-ink-secondary font-body"
								style={{ fontSize: 12 }}
							>
								{formatCurrency(iva)}
							</span>
						</div>
						<div className="divider" />
						<div className="flex justify-between items-baseline pt-1">
							<span
								className="font-display uppercase text-ink-secondary"
								style={{ fontSize: 11, letterSpacing: "0.12em" }}
							>
								Total
							</span>
							<span
								className="font-kds text-brand-500"
								style={{ fontSize: 32 }}
							>
								{formatCurrency(total)}
							</span>
						</div>
					</div>
				</div>

				{/* Payment method selection */}
				<div>
					<div
						className="font-display uppercase text-ink-tertiary mb-2.5 px-1"
						style={{ fontSize: 10, letterSpacing: "0.2em" }}
					>
						Método de pago
					</div>
					<div className="grid grid-cols-3 gap-2">
						{METHODS.map((method) => {
							const isSelected = selectedMethod === method.id;
							return (
								<button
									key={method.id}
									onClick={() => setSelectedMethod(method.id)}
									className="card-sm flex flex-col items-center gap-2.5 py-4 px-2 cursor-pointer transition-all duration-150 active:scale-95 relative"
									style={{
										borderColor: isSelected ? "#f59e0b" : "var(--s3)",
										boxShadow: isSelected
											? "0 0 18px rgba(245,158,11,0.2)"
											: undefined,
										background: isSelected
											? "rgba(245,158,11,0.06)"
											: "var(--s1)",
									}}
								>
									<div
										className={clsx("transition-colors", {
											"text-brand-500": isSelected,
											"text-ink-tertiary": !isSelected,
										})}
									>
										{method.icon}
									</div>
									<span
										className={clsx(
											"font-display uppercase transition-colors",
											{
												"text-brand-500": isSelected,
												"text-ink-tertiary": !isSelected,
											},
										)}
										style={{ fontSize: 9, letterSpacing: "0.08em" }}
									>
										{method.label}
									</span>
									{isSelected && (
										<div
											style={{
												position: "absolute",
												top: 6,
												right: 6,
												width: 6,
												height: 6,
												borderRadius: "50%",
												background: "#f59e0b",
												boxShadow: "0 0 6px rgba(245,158,11,0.8)",
											}}
										/>
									)}
								</button>
							);
						})}
					</div>
				</div>

				{/* MercadoPago QR */}
				{selectedMethod === "mercadopago" && (
					<div
						className="card flex flex-col items-center gap-4 py-6 animate-slide-up"
						style={{ borderColor: "rgba(245,158,11,0.2)" }}
					>
						<div
							className="font-display uppercase text-ink-tertiary"
							style={{ fontSize: 10, letterSpacing: "0.2em" }}
						>
							Escaneá para pagar
						</div>
						<div
							className="flex flex-col items-center justify-center gap-2 rounded-xl"
							style={{
								width: 148,
								height: 148,
								background: "#1a1a1a",
								border: "1px solid #272727",
							}}
						>
							<svg width="108" height="108" viewBox="0 0 100 100" fill="none">
								<rect
									x="5"
									y="5"
									width="28"
									height="28"
									rx="3"
									stroke="#f59e0b"
									strokeWidth="3"
									fill="none"
								/>
								<rect
									x="10"
									y="10"
									width="18"
									height="18"
									rx="1"
									fill="#f59e0b"
									opacity="0.7"
								/>
								<rect
									x="67"
									y="5"
									width="28"
									height="28"
									rx="3"
									stroke="#f59e0b"
									strokeWidth="3"
									fill="none"
								/>
								<rect
									x="72"
									y="10"
									width="18"
									height="18"
									rx="1"
									fill="#f59e0b"
									opacity="0.7"
								/>
								<rect
									x="5"
									y="67"
									width="28"
									height="28"
									rx="3"
									stroke="#f59e0b"
									strokeWidth="3"
									fill="none"
								/>
								<rect
									x="10"
									y="72"
									width="18"
									height="18"
									rx="1"
									fill="#f59e0b"
									opacity="0.7"
								/>
								{[40, 44, 48, 52, 56, 60, 64].map((x, i) =>
									[40, 44, 48, 52, 56, 60, 64].map((y, j) =>
										(i + j) % 3 !== 0 ? (
											<rect
												key={`${i}-${j}`}
												x={x}
												y={y}
												width="3"
												height="3"
												rx="0.5"
												fill="#a3a3a3"
												opacity="0.5"
											/>
										) : null,
									),
								)}
							</svg>
							<div
								className="text-ink-tertiary font-body"
								style={{ fontSize: 9 }}
							>
								QR demo
							</div>
						</div>
						<div
							className="text-ink-tertiary font-body text-center"
							style={{ fontSize: 11 }}
						>
							Total:{" "}
							<span className="text-brand-500 font-display font-semibold">
								{formatCurrency(total)}
							</span>
						</div>
					</div>
				)}

				{/* Efectivo */}
				{selectedMethod === "efectivo" && (
					<div
						className="card space-y-3 p-4 animate-slide-up"
						style={{ borderColor: "rgba(245,158,11,0.2)" }}
					>
						<div
							className="font-display uppercase text-ink-tertiary"
							style={{ fontSize: 10, letterSpacing: "0.2em" }}
						>
							Monto recibido
						</div>
						<div className="relative">
							<span
								className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary font-body"
								style={{ fontSize: 16 }}
							>
								$
							</span>
							<input
								type="number"
								className="input-base"
								style={{ paddingLeft: 26, fontSize: 20 }}
								placeholder="0"
								value={amountReceived}
								onChange={(e) => setAmountReceived(e.target.value)}
							/>
						</div>

						{insufficient && (
							<div
								className="flex items-center justify-between p-3 rounded-lg animate-fade-in"
								style={{
									background: "rgba(239,68,68,0.08)",
									border: "1px solid rgba(239,68,68,0.22)",
								}}
							>
								<span
									className="font-display uppercase"
									style={{
										fontSize: 10,
										color: "#f87171",
										letterSpacing: "0.08em",
									}}
								>
									Monto insuficiente
								</span>
								<span
									className="font-kds"
									style={{ color: "#f87171", fontSize: 20 }}
								>
									−{formatCurrency(total - amountNum)}
								</span>
							</div>
						)}

						{hasChange && (
							<div
								className="flex items-center justify-between p-3 rounded-lg animate-fade-in"
								style={{
									background: "rgba(16,185,129,0.08)",
									border: "1px solid rgba(16,185,129,0.22)",
								}}
							>
								<span
									className="font-display uppercase"
									style={{
										fontSize: 10,
										color: "#34d399",
										letterSpacing: "0.08em",
									}}
								>
									Vuelto
								</span>
								<span
									className="font-kds"
									style={{ color: "#34d399", fontSize: 26 }}
								>
									{formatCurrency(change)}
								</span>
							</div>
						)}
					</div>
				)}

				{/* Tarjeta */}
				{selectedMethod === "tarjeta" && (
					<div
						className="card flex flex-col items-center gap-3 py-6 animate-slide-up"
						style={{ borderColor: "rgba(245,158,11,0.2)" }}
					>
						<div
							className="flex items-center justify-center rounded-full"
							style={{
								width: 56,
								height: 56,
								background: "rgba(245,158,11,0.1)",
								border: "1px solid rgba(245,158,11,0.25)",
							}}
						>
							<CreditCard size={24} className="text-brand-500" />
						</div>
						<div className="text-center">
							<div
								className="font-display font-semibold text-ink-primary"
								style={{ fontSize: 14 }}
							>
								Usar terminal
							</div>
							<div
								className="text-ink-tertiary font-body mt-1"
								style={{ fontSize: 12 }}
							>
								Acercar tarjeta o insertar chip
							</div>
						</div>
						<div className="font-kds text-brand-500" style={{ fontSize: 28 }}>
							{formatCurrency(total)}
						</div>
					</div>
				)}
			</div>

			{/* ── Sticky confirm button ── */}
			<div
				className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-3 pb-6 pt-4"
				style={{
					background: "linear-gradient(to top, #080808 78%, transparent)",
				}}
			>
				<button
					className="btn-primary w-full justify-center"
					style={{
						padding: "15px 20px",
						fontSize: 14,
						opacity: canConfirm ? 1 : 0.35,
						cursor: canConfirm ? "pointer" : "not-allowed",
						transition: "opacity 0.2s",
					}}
					disabled={!canConfirm}
					onClick={handleConfirm}
				>
					<CheckCircle2 size={16} />
					Confirmar cobro
				</button>
			</div>

			{/* ── Success overlay ── */}
			{confirmed && (
				<div
					className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in overflow-hidden"
					style={{
						background: "rgba(8,8,8,0.94)",
						backdropFilter: "blur(12px)",
					}}
				>
					{/* Confetti */}
					{CONFETTI.map((dot, i) => (
						<div
							key={i}
							className="animate-slide-up"
							style={{
								position: "absolute",
								left: `${dot.x}%`,
								top: `${dot.y}%`,
								width: dot.size,
								height: dot.size * 1.6,
								borderRadius: 1,
								background: dot.color,
								transform: `rotate(${dot.r}deg)`,
								opacity: 0.85,
								animationDelay: `${i * 50}ms`,
							}}
						/>
					))}

					{/* Card */}
					<div
						className="card flex flex-col items-center gap-5 px-10 py-10 animate-scale-in"
						style={{
							borderColor: "rgba(16,185,129,0.45)",
							boxShadow: "0 0 48px rgba(16,185,129,0.12)",
							maxWidth: 300,
							position: "relative",
							zIndex: 1,
						}}
					>
						{/* Check circle */}
						<div
							className="flex items-center justify-center rounded-full"
							style={{
								width: 68,
								height: 68,
								background: "rgba(16,185,129,0.12)",
								border: "2px solid rgba(16,185,129,0.5)",
								boxShadow: "0 0 28px rgba(16,185,129,0.22)",
							}}
						>
							<CheckCircle2 size={32} style={{ color: "#34d399" }} />
						</div>

						<div className="text-center space-y-1.5">
							<div
								className="font-kds text-pool-400"
								style={{ fontSize: 36, letterSpacing: "0.06em" }}
							>
								Cobro Confirmado
							</div>
							<div className="font-kds text-brand-500" style={{ fontSize: 30 }}>
								{formatCurrency(total)}
							</div>
							<div
								className="text-ink-tertiary font-body"
								style={{ fontSize: 12 }}
							>
								Mesa {table?.number} liberada
							</div>
						</div>

						{/* Method pill */}
						<div
							className="font-display uppercase px-4 py-1.5 rounded-full"
							style={{
								fontSize: 10,
								letterSpacing: "0.12em",
								background: "rgba(16,185,129,0.1)",
								border: "1px solid rgba(16,185,129,0.3)",
								color: "#34d399",
							}}
						>
							{selectedMethod === "efectivo"
								? "Efectivo"
								: selectedMethod === "mercadopago"
									? "MercadoPago"
									: "Tarjeta"}
						</div>

						{/* Back to tables */}
						<button
							className="btn-secondary w-full justify-center mt-1"
							style={{ padding: "12px 20px", fontSize: 12 }}
							onClick={() => router.push("/waiter/tables")}
						>
							Volver a Mesas
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default function WaiterPaymentPage() {
	return (
		<Suspense>
			<PaymentContent />
		</Suspense>
	);
}
