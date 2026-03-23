"use client";

import { useState, useEffect, useCallback } from "react";
import {
	DollarSign,
	TrendingUp,
	TrendingDown,
	Vault,
	Plus,
	Minus,
	Lock,
	Unlock,
	X,
	Clock,
	ChevronDown,
	ChevronUp,
	AlertTriangle,
	Banknote,
	CreditCard,
	Smartphone,
	ArrowRightLeft,
	History,
	Printer,
	CircleDot,
	Receipt,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { printDocument, printCurrency } from "@/lib/print";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CashMovement {
	id: string;
	registerId: string;
	type: "income" | "expense";
	amount: number;
	concept: string;
	paymentMethod: string | null;
	orderId: string | null;
	expenseId: string | null;
	createdAt: string;
}

interface CashRegister {
	id: string;
	date: string;
	status: "open" | "closed";
	openingBalance: number;
	closingBalance: number | null;
	closedAt: string | null;
	movements?: CashMovement[];
	_count?: { movements: number };
}

type ModalType = "income" | "expense" | "close" | null;

const PAYMENT_METHODS = [
	{ value: "cash", label: "Efectivo", icon: Banknote, color: "#10b981" },
	{
		value: "mercadopago",
		label: "MercadoPago",
		icon: Smartphone,
		color: "#3b82f6",
	},
	{ value: "card", label: "Tarjeta", icon: CreditCard, color: "#8b5cf6" },
	{
		value: "transfer",
		label: "Transferencia",
		icon: ArrowRightLeft,
		color: "#f59e0b",
	},
];

// ─── Icon Box ─────────────────────────────────────────────────────────────────

function IconBox({
	icon: Icon,
	color,
	size = 36,
	iconSize = 16,
	glow = false,
}: {
	icon: React.ElementType;
	color: string;
	size?: number;
	iconSize?: number;
	glow?: boolean;
}) {
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: size * 0.3,
				background: `${color}14`,
				border: `1px solid ${color}28`,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flexShrink: 0,
				boxShadow: glow
					? `0 0 20px ${color}25, 0 0 40px ${color}10`
					: undefined,
			}}
		>
			<Icon size={iconSize} style={{ color }} />
		</div>
	);
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<div
			className="font-display text-ink-disabled uppercase"
			style={{ fontSize: 9, letterSpacing: "0.25em", marginBottom: 12 }}
		>
			{children}
		</div>
	);
}

// ─── Status Indicator ─────────────────────────────────────────────────────────

function StatusIndicator({
	isOpen,
	since,
}: {
	isOpen: boolean;
	since?: string;
}) {
	const color = isOpen ? "#10b981" : "#6b7280";
	const label = isOpen ? "Caja Abierta" : "Caja Cerrada";
	const time = since
		? new Date(since).toLocaleTimeString("es-AR", {
				hour: "2-digit",
				minute: "2-digit",
			})
		: null;

	return (
		<div
			className="flex items-center gap-3"
			style={{
				padding: "10px 18px",
				borderRadius: 14,
				background: `${color}0a`,
				border: `1px solid ${color}20`,
			}}
		>
			<div
				style={{ position: "relative", display: "flex", alignItems: "center" }}
			>
				<CircleDot size={18} style={{ color }} />
				{isOpen && (
					<div
						style={{
							position: "absolute",
							inset: -3,
							borderRadius: "50%",
							border: `2px solid ${color}40`,
							animation: "pulse 2s infinite",
						}}
					/>
				)}
			</div>
			<div>
				<div
					className="font-display uppercase"
					style={{
						fontSize: 11,
						letterSpacing: "0.15em",
						fontWeight: 700,
						color,
					}}
				>
					{label}
				</div>
				{time && (
					<div className="font-body text-ink-disabled" style={{ fontSize: 11 }}>
						Desde las {time}
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
	label,
	value,
	icon: Icon,
	color,
	highlight = false,
}: {
	label: string;
	value: number;
	icon: React.ElementType;
	color: string;
	highlight?: boolean;
}) {
	return (
		<div
			className="card animate-fade-in"
			style={{
				padding: "20px 22px",
				flex: 1,
				minWidth: 170,
				position: "relative",
				overflow: "hidden",
				borderColor: highlight ? `${color}30` : undefined,
			}}
		>
			{/* Gradient glow */}
			<div
				style={{
					position: "absolute",
					top: -30,
					right: -30,
					width: 80,
					height: 80,
					borderRadius: "50%",
					background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
					pointerEvents: "none",
				}}
			/>
			<div
				className="flex items-center gap-3 mb-3"
				style={{ position: "relative" }}
			>
				<IconBox icon={Icon} color={color} size={34} iconSize={15} />
				<div
					className="font-display text-ink-disabled uppercase"
					style={{ fontSize: 9, letterSpacing: "0.2em" }}
				>
					{label}
				</div>
			</div>
			<div
				className="font-kds"
				style={{
					fontSize: 30,
					lineHeight: 1,
					color,
					position: "relative",
					letterSpacing: "0.02em",
				}}
			>
				{formatCurrency(value)}
			</div>
		</div>
	);
}

// ─── Movement row ─────────────────────────────────────────────────────────────

function MovementRow({ movement }: { movement: CashMovement }) {
	const isIncome = movement.type === "income";
	const color = isIncome ? "#10b981" : "#ef4444";
	const time = new Date(movement.createdAt).toLocaleTimeString("es-AR", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const method = PAYMENT_METHODS.find(
		(m) => m.value === movement.paymentMethod,
	);

	return (
		<div
			className="transition-all"
			style={{
				padding: "14px 18px",
				background: "var(--s1)",
				borderRadius: 12,
				borderLeft: `3px solid ${color}`,
				display: "flex",
				alignItems: "center",
				gap: 14,
				cursor: "default",
			}}
			onMouseEnter={(e) => {
				(e.currentTarget as HTMLDivElement).style.background = "var(--s2)";
				(e.currentTarget as HTMLDivElement).style.transform = "translateX(2px)";
			}}
			onMouseLeave={(e) => {
				(e.currentTarget as HTMLDivElement).style.background = "var(--s1)";
				(e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
			}}
		>
			{/* Time */}
			<div className="flex items-center gap-1.5" style={{ minWidth: 56 }}>
				<Clock size={10} style={{ color: "#555" }} />
				<span className="font-kds text-ink-disabled" style={{ fontSize: 14 }}>
					{time}
				</span>
			</div>

			{/* Type indicator */}
			<div
				style={{
					width: 24,
					height: 24,
					borderRadius: 6,
					background: `${color}12`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				{isIncome ? (
					<TrendingUp size={12} style={{ color }} />
				) : (
					<TrendingDown size={12} style={{ color }} />
				)}
			</div>

			{/* Concept */}
			<div
				className="font-body text-ink-secondary flex-1"
				style={{ fontSize: 13 }}
			>
				{movement.concept}
			</div>

			{/* Payment method badge */}
			{method && (
				<span
					className="font-display uppercase"
					style={{
						fontSize: 8,
						padding: "3px 10px",
						borderRadius: 99,
						fontWeight: 700,
						letterSpacing: "0.12em",
						color: method.color,
						background: `${method.color}12`,
						border: `1px solid ${method.color}25`,
					}}
				>
					{method.label}
				</span>
			)}

			{/* Amount */}
			<div
				className="font-kds"
				style={{ fontSize: 20, color, minWidth: 110, textAlign: "right" }}
			>
				{isIncome ? "+" : "-"} {formatCurrency(movement.amount)}
			</div>
		</div>
	);
}

// ─── New movement modal ───────────────────────────────────────────────────────

function NewMovementModal({
	type,
	onClose,
	onSubmit,
	submitting,
}: {
	type: "income" | "expense";
	onClose: () => void;
	onSubmit: (data: {
		type: string;
		amount: number;
		concept: string;
		paymentMethod: string;
	}) => void;
	submitting: boolean;
}) {
	const [amount, setAmount] = useState("");
	const [concept, setConcept] = useState("");
	const [paymentMethod, setPaymentMethod] = useState("cash");

	const isIncome = type === "income";
	const color = isIncome ? "#10b981" : "#ef4444";
	const title = isIncome ? "Registrar Ingreso" : "Registrar Egreso";

	const handleSubmit = () => {
		const num = parseFloat(amount);
		if (!num || num <= 0 || !concept.trim()) return;
		onSubmit({ type, amount: num, concept: concept.trim(), paymentMethod });
	};

	const valid = !!amount && parseFloat(amount) > 0 && !!concept.trim();

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.7)",
				backdropFilter: "blur(8px)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget && !submitting) onClose();
			}}
		>
			<div
				className="card-gold animate-scale-in"
				style={{ width: 460, padding: "32px 32px 28px" }}
			>
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<IconBox
							icon={isIncome ? Plus : Minus}
							color={color}
							size={38}
							iconSize={18}
						/>
						<div>
							<div
								className="font-display text-ink-primary uppercase"
								style={{
									fontSize: 14,
									letterSpacing: "0.18em",
									fontWeight: 700,
								}}
							>
								{title}
							</div>
							<div
								className="font-body text-ink-disabled"
								style={{ fontSize: 11 }}
							>
								{isIncome ? "Agregar fondos a la caja" : "Registrar un gasto"}
							</div>
						</div>
					</div>
					<button
						className="btn-ghost"
						style={{ padding: 8, borderRadius: 8 }}
						onClick={onClose}
					>
						<X size={16} />
					</button>
				</div>

				<div className="divider mb-5" />

				{/* Amount */}
				<SectionLabel>Monto</SectionLabel>
				<div
					style={{
						background: "var(--s1)",
						borderRadius: 14,
						border: `1px solid ${color}20`,
						padding: "20px 24px",
						marginBottom: 22,
						textAlign: "center",
					}}
				>
					<div className="flex items-center justify-center gap-2">
						<span
							className="font-kds text-ink-disabled"
							style={{ fontSize: 28 }}
						>
							$
						</span>
						<input
							type="number"
							placeholder="0"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							className="font-kds"
							style={{
								fontSize: 52,
								lineHeight: 1,
								color,
								background: "transparent",
								border: "none",
								outline: "none",
								textAlign: "center",
								width: "100%",
								maxWidth: 240,
							}}
							autoFocus
						/>
					</div>
				</div>

				{/* Concept */}
				<SectionLabel>Concepto</SectionLabel>
				<input
					type="text"
					placeholder={
						isIncome ? "Ej: Venta de producto" : "Ej: Compra de insumos"
					}
					value={concept}
					onChange={(e) => setConcept(e.target.value)}
					className="input-base font-body"
					style={{
						width: "100%",
						padding: "13px 16px",
						fontSize: 13,
						marginBottom: 22,
						borderRadius: 12,
					}}
				/>

				{/* Payment method */}
				<SectionLabel>Medio de pago</SectionLabel>
				<div className="grid grid-cols-2 gap-2 mb-7">
					{PAYMENT_METHODS.map(({ value, label, icon: Icon, color: mc }) => {
						const selected = paymentMethod === value;
						return (
							<button
								key={value}
								onClick={() => setPaymentMethod(value)}
								className="flex items-center gap-2.5 transition-all"
								style={{
									padding: "12px 14px",
									borderRadius: 12,
									background: selected ? `${mc}14` : "var(--s1)",
									border: `1.5px solid ${selected ? mc : "var(--s3)"}`,
									color: selected ? mc : "#666",
									textAlign: "left",
									cursor: "pointer",
									transform: selected ? "scale(1.02)" : "scale(1)",
								}}
							>
								<IconBox
									icon={Icon}
									color={selected ? mc : "#555"}
									size={28}
									iconSize={13}
								/>
								<span
									className="font-display uppercase"
									style={{
										fontSize: 10,
										fontWeight: 700,
										letterSpacing: "0.1em",
									}}
								>
									{label}
								</span>
							</button>
						);
					})}
				</div>

				{/* Submit */}
				<button
					onClick={handleSubmit}
					disabled={submitting || !valid}
					className="flex items-center justify-center gap-2"
					style={{
						width: "100%",
						padding: "15px 0",
						borderRadius: 14,
						background: valid ? color : `${color}40`,
						color: "#fff",
						fontFamily: "var(--font-syne)",
						fontWeight: 700,
						fontSize: 13,
						letterSpacing: "0.15em",
						textTransform: "uppercase",
						border: "none",
						cursor: submitting || !valid ? "not-allowed" : "pointer",
						opacity: submitting ? 0.6 : 1,
						transition: "all 0.2s ease",
					}}
				>
					{submitting ? (
						"Registrando..."
					) : (
						<>
							{isIncome ? <Plus size={15} /> : <Minus size={15} />}
							Confirmar {isIncome ? "Ingreso" : "Egreso"}
						</>
					)}
				</button>
			</div>
		</div>
	);
}

// ─── Close register modal ─────────────────────────────────────────────────────

function CloseRegisterModal({
	register,
	income,
	expenses,
	onClose,
	onConfirm,
	submitting,
}: {
	register: CashRegister;
	income: number;
	expenses: number;
	onClose: () => void;
	onConfirm: (actualBalance: number) => void;
	submitting: boolean;
}) {
	const calculatedBalance = register.openingBalance + income - expenses;
	const [actualBalance, setActualBalance] = useState(
		calculatedBalance.toString(),
	);
	const actual = parseFloat(actualBalance) || 0;
	const diff = actual - calculatedBalance;

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.7)",
				backdropFilter: "blur(8px)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget && !submitting) onClose();
			}}
		>
			<div
				className="card-gold animate-scale-in"
				style={{ width: 480, padding: "32px 32px 28px" }}
			>
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<IconBox icon={Lock} color="#f59e0b" size={38} iconSize={18} glow />
						<div>
							<div
								className="font-display text-ink-primary uppercase"
								style={{
									fontSize: 14,
									letterSpacing: "0.18em",
									fontWeight: 700,
								}}
							>
								Cerrar Caja
							</div>
							<div
								className="font-body text-ink-disabled"
								style={{ fontSize: 11 }}
							>
								Resumen del dia y cierre final
							</div>
						</div>
					</div>
					<button
						className="btn-ghost"
						style={{ padding: 8, borderRadius: 8 }}
						onClick={onClose}
					>
						<X size={16} />
					</button>
				</div>

				<div className="divider-gold mb-5" />

				{/* Summary */}
				<div
					style={{
						background: "var(--s1)",
						borderRadius: 14,
						padding: 22,
						marginBottom: 22,
					}}
				>
					<SectionLabel>Resumen del dia</SectionLabel>
					<div className="flex flex-col gap-4">
						{[
							{
								label: "Saldo Inicial",
								value: register.openingBalance,
								color: "#888",
								icon: Vault,
							},
							{
								label: "Ingresos",
								value: income,
								color: "#10b981",
								icon: TrendingUp,
							},
							{
								label: "Egresos",
								value: expenses,
								color: "#ef4444",
								icon: TrendingDown,
							},
						].map(({ label, value, color: c, icon: Icon }) => (
							<div key={label} className="flex items-center justify-between">
								<div className="flex items-center gap-2.5">
									<IconBox icon={Icon} color={c} size={26} iconSize={12} />
									<span
										className="font-body text-ink-disabled"
										style={{ fontSize: 13 }}
									>
										{label}
									</span>
								</div>
								<span className="font-kds" style={{ fontSize: 20, color: c }}>
									{formatCurrency(value)}
								</span>
							</div>
						))}
						<div
							style={{
								borderTop: "1px solid var(--s3)",
								paddingTop: 14,
								marginTop: 4,
							}}
							className="flex items-center justify-between"
						>
							<span
								className="font-display text-ink-primary uppercase"
								style={{
									fontSize: 11,
									letterSpacing: "0.15em",
									fontWeight: 700,
								}}
							>
								Saldo Calculado
							</span>
							<span
								className="font-kds"
								style={{ fontSize: 28, lineHeight: 1, color: "var(--gold)" }}
							>
								{formatCurrency(calculatedBalance)}
							</span>
						</div>
					</div>
				</div>

				{/* Actual balance input */}
				<SectionLabel>Saldo real en caja</SectionLabel>
				<div
					style={{
						background: "var(--s1)",
						borderRadius: 14,
						border: "1px solid var(--s3)",
						padding: "16px 20px",
						marginBottom: 10,
						textAlign: "center",
					}}
				>
					<div className="flex items-center justify-center gap-2">
						<span
							className="font-kds text-ink-disabled"
							style={{ fontSize: 24 }}
						>
							$
						</span>
						<input
							type="number"
							value={actualBalance}
							onChange={(e) => setActualBalance(e.target.value)}
							className="font-kds"
							style={{
								fontSize: 40,
								lineHeight: 1,
								color: "var(--gold)",
								background: "transparent",
								border: "none",
								outline: "none",
								textAlign: "center",
								width: "100%",
								maxWidth: 220,
							}}
						/>
					</div>
				</div>

				{/* Difference */}
				{diff !== 0 && (
					<div
						className="flex items-center gap-2.5 mb-6"
						style={{
							padding: "12px 16px",
							borderRadius: 12,
							background:
								diff > 0 ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
							border: `1px solid ${diff > 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
						}}
					>
						<AlertTriangle
							size={15}
							style={{ color: diff > 0 ? "#10b981" : "#ef4444" }}
						/>
						<span
							className="font-body"
							style={{ fontSize: 12, color: diff > 0 ? "#10b981" : "#ef4444" }}
						>
							Diferencia de {formatCurrency(Math.abs(diff))} (
							{diff > 0 ? "sobrante" : "faltante"})
						</span>
					</div>
				)}

				{diff === 0 && <div style={{ marginBottom: 24 }} />}

				{/* Confirm */}
				<button
					onClick={() => onConfirm(actual)}
					disabled={submitting}
					className="flex items-center justify-center gap-2"
					style={{
						width: "100%",
						padding: "15px 0",
						borderRadius: 14,
						background: "var(--gold)",
						color: "#000",
						fontFamily: "var(--font-syne)",
						fontWeight: 700,
						fontSize: 13,
						letterSpacing: "0.15em",
						textTransform: "uppercase",
						border: "none",
						cursor: submitting ? "not-allowed" : "pointer",
						opacity: submitting ? 0.6 : 1,
						transition: "all 0.2s ease",
					}}
				>
					{submitting ? (
						"Cerrando..."
					) : (
						<>
							<Lock size={14} />
							Confirmar Cierre de Caja
						</>
					)}
				</button>
			</div>
		</div>
	);
}

// ─── History row ──────────────────────────────────────────────────────────────

function HistoryRow({ register }: { register: CashRegister }) {
	const [expanded, setExpanded] = useState(false);
	const [movements, setMovements] = useState<CashMovement[]>([]);
	const [loading, setLoading] = useState(false);

	const date = new Date(register.date).toLocaleDateString("es-AR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

	const closedTime = register.closedAt
		? new Date(register.closedAt).toLocaleTimeString("es-AR", {
				hour: "2-digit",
				minute: "2-digit",
			})
		: null;

	const toggleExpand = async () => {
		if (expanded) {
			setExpanded(false);
			return;
		}
		if (movements.length === 0) {
			setLoading(true);
			try {
				const data = await apiFetch<CashRegister>(
					`/api/cash-register/${register.id}`,
				);
				setMovements(data.movements ?? []);
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		}
		setExpanded(true);
	};

	const count = register._count?.movements ?? movements.length;
	const balance = (register.closingBalance ?? 0) - register.openingBalance;
	const balanceColor = balance >= 0 ? "#10b981" : "#ef4444";

	return (
		<div
			className="card transition-all"
			style={{
				marginBottom: 8,
				overflow: "hidden",
				borderColor: expanded ? "var(--s3)" : undefined,
			}}
		>
			<button
				onClick={toggleExpand}
				className="w-full transition-colors"
				style={{
					padding: "16px 20px",
					display: "flex",
					alignItems: "center",
					gap: 16,
					background: "transparent",
					border: "none",
					color: "inherit",
					cursor: "pointer",
					textAlign: "left",
				}}
			>
				<IconBox icon={Receipt} color="#6b7280" size={34} iconSize={15} />

				<div style={{ minWidth: 90 }}>
					<div
						className="font-kds text-ink-secondary"
						style={{ fontSize: 18, lineHeight: 1 }}
					>
						{date}
					</div>
					{closedTime && (
						<div
							className="font-body text-ink-disabled"
							style={{ fontSize: 10, marginTop: 3 }}
						>
							Cerrada a las {closedTime}
						</div>
					)}
				</div>

				<div style={{ flex: 1, display: "flex", gap: 28 }}>
					<div>
						<div
							className="font-display text-ink-disabled uppercase"
							style={{ fontSize: 8, letterSpacing: "0.2em", marginBottom: 2 }}
						>
							Apertura
						</div>
						<div
							className="font-kds text-ink-tertiary"
							style={{ fontSize: 16 }}
						>
							{formatCurrency(register.openingBalance)}
						</div>
					</div>
					<div>
						<div
							className="font-display text-ink-disabled uppercase"
							style={{ fontSize: 8, letterSpacing: "0.2em", marginBottom: 2 }}
						>
							Cierre
						</div>
						<div
							className="font-kds text-ink-tertiary"
							style={{ fontSize: 16 }}
						>
							{formatCurrency(register.closingBalance ?? 0)}
						</div>
					</div>
					<div>
						<div
							className="font-display text-ink-disabled uppercase"
							style={{ fontSize: 8, letterSpacing: "0.2em", marginBottom: 2 }}
						>
							Resultado
						</div>
						<div
							className="font-kds"
							style={{ fontSize: 16, color: balanceColor }}
						>
							{balance >= 0 ? "+" : ""}
							{formatCurrency(balance)}
						</div>
					</div>
					<div>
						<div
							className="font-display text-ink-disabled uppercase"
							style={{ fontSize: 8, letterSpacing: "0.2em", marginBottom: 2 }}
						>
							Movimientos
						</div>
						<div
							className="font-kds text-ink-tertiary"
							style={{ fontSize: 16 }}
						>
							{count}
						</div>
					</div>
				</div>

				{expanded ? (
					<ChevronUp size={16} style={{ color: "#555" }} />
				) : (
					<ChevronDown size={16} style={{ color: "#555" }} />
				)}
			</button>

			{expanded && (
				<div
					style={{ padding: "0 20px 18px", borderTop: "1px solid var(--s3)" }}
				>
					{loading ? (
						<div
							className="font-body text-ink-disabled text-center py-8"
							style={{ fontSize: 12 }}
						>
							Cargando movimientos...
						</div>
					) : movements.length === 0 ? (
						<div className="flex flex-col items-center py-8 gap-2">
							<IconBox icon={Receipt} color="#555" size={32} iconSize={14} />
							<div
								className="font-body text-ink-disabled"
								style={{ fontSize: 12 }}
							>
								Sin movimientos registrados
							</div>
						</div>
					) : (
						<div className="flex flex-col gap-2 mt-4">
							{movements.map((m) => (
								<MovementRow key={m.id} movement={m} />
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── Open register card ───────────────────────────────────────────────────────

function OpenRegisterCard({ onOpen }: { onOpen: (balance: number) => void }) {
	const [balance, setBalance] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleOpen = () => {
		setSubmitting(true);
		onOpen(parseFloat(balance) || 0);
	};

	return (
		<div
			className="card-gold animate-scale-in"
			style={{
				maxWidth: 480,
				margin: "48px auto",
				padding: "48px 40px",
				textAlign: "center",
			}}
		>
			<IconBox icon={Unlock} color="#f59e0b" size={72} iconSize={32} glow />
			<div style={{ marginTop: 24 }}>
				<div
					className="font-display text-ink-primary uppercase"
					style={{
						fontSize: 22,
						letterSpacing: "0.15em",
						fontWeight: 700,
						marginBottom: 8,
					}}
				>
					Abrir Caja
				</div>
				<div
					className="font-body text-ink-disabled"
					style={{ fontSize: 13, lineHeight: 1.5 }}
				>
					Ingresa el saldo inicial para comenzar el dia
				</div>
			</div>

			<div className="divider-gold" style={{ margin: "28px 0" }} />

			<SectionLabel>Saldo Inicial</SectionLabel>
			<div
				style={{
					background: "var(--s1)",
					borderRadius: 14,
					border: "1px solid rgba(245,158,11,0.15)",
					padding: "20px 24px",
					marginBottom: 28,
				}}
			>
				<div className="flex items-center justify-center gap-2">
					<span className="font-kds text-ink-disabled" style={{ fontSize: 28 }}>
						$
					</span>
					<input
						type="number"
						placeholder="0"
						value={balance}
						onChange={(e) => setBalance(e.target.value)}
						className="font-kds"
						style={{
							fontSize: 52,
							lineHeight: 1,
							color: "var(--gold)",
							background: "transparent",
							border: "none",
							outline: "none",
							textAlign: "center",
							width: "100%",
							maxWidth: 240,
						}}
						autoFocus
					/>
				</div>
			</div>

			<button
				onClick={handleOpen}
				disabled={submitting}
				className="flex items-center justify-center gap-2"
				style={{
					width: "100%",
					padding: "16px 0",
					borderRadius: 14,
					background: "var(--gold)",
					color: "#000",
					fontFamily: "var(--font-syne)",
					fontWeight: 700,
					fontSize: 14,
					letterSpacing: "0.15em",
					textTransform: "uppercase",
					border: "none",
					cursor: submitting ? "not-allowed" : "pointer",
					opacity: submitting ? 0.6 : 1,
					transition: "all 0.2s ease",
				}}
			>
				{submitting ? (
					"Abriendo..."
				) : (
					<>
						<Unlock size={16} />
						Abrir Caja
					</>
				)}
			</button>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CashRegisterPage() {
	const [activeRegister, setActiveRegister] = useState<CashRegister | null>(
		null,
	);
	const [history, setHistory] = useState<CashRegister[]>([]);
	const [loading, setLoading] = useState(true);
	const [modal, setModal] = useState<ModalType>(null);
	const [submitting, setSubmitting] = useState(false);

	const fetchData = useCallback(async () => {
		try {
			const all = await apiFetch<CashRegister[]>("/api/cash-register");
			const open = all.find((r) => r.status === "open");
			if (open) {
				const full = await apiFetch<CashRegister>(
					`/api/cash-register/${open.id}`,
				);
				setActiveRegister(full);
			} else {
				setActiveRegister(null);
			}
			setHistory(all.filter((r) => r.status === "closed"));
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
		const id = setInterval(fetchData, 15000);
		return () => clearInterval(id);
	}, [fetchData]);

	// ─── Computed values ────────────────────────────────────────────────────

	const movements = activeRegister?.movements ?? [];
	const income = movements
		.filter((m) => m.type === "income")
		.reduce((s, m) => s + m.amount, 0);
	const expenses = movements
		.filter((m) => m.type === "expense")
		.reduce((s, m) => s + m.amount, 0);
	const currentBalance =
		(activeRegister?.openingBalance ?? 0) + income - expenses;

	// ─── Handlers ───────────────────────────────────────────────────────────

	const handleOpenRegister = async (balance: number) => {
		try {
			await apiFetch("/api/cash-register", {
				method: "POST",
				body: JSON.stringify({ openingBalance: balance }),
			});
			await fetchData();
		} catch (e) {
			console.error(e);
		}
	};

	const handleNewMovement = async (data: {
		type: string;
		amount: number;
		concept: string;
		paymentMethod: string;
	}) => {
		if (!activeRegister) return;
		setSubmitting(true);
		try {
			await apiFetch(`/api/cash-register/${activeRegister.id}/movements`, {
				method: "POST",
				body: JSON.stringify(data),
			});
			setModal(null);
			await fetchData();
		} catch (e) {
			console.error(e);
		} finally {
			setSubmitting(false);
		}
	};

	const handleCloseRegister = async (actualBalance: number) => {
		if (!activeRegister) return;
		setSubmitting(true);
		try {
			await apiFetch(`/api/cash-register/${activeRegister.id}`, {
				method: "PATCH",
				body: JSON.stringify({
					status: "closed",
					closingBalance: actualBalance,
				}),
			});
			setModal(null);
			await fetchData();
		} catch (e) {
			console.error(e);
		} finally {
			setSubmitting(false);
		}
	};

	const handlePrint = () => {
		if (!activeRegister && history.length === 0) return;
		const reg = activeRegister;
		if (reg) {
			const mvRows = movements
				.map(
					(m) => `<tr>
						<td>${new Date(m.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</td>
						<td>${m.concept}</td>
						<td>${m.paymentMethod ?? "\u2014"}</td>
						<td class="amount" style="color:${m.type === "income" ? "#166534" : "#991b1b"}">${m.type === "income" ? "+" : "-"} ${printCurrency(m.amount)}</td>
					</tr>`,
				)
				.join("");
			printDocument({
				title: "Caja",
				subtitle: `${reg.status === "open" ? "Abierta" : "Cerrada"} \u2014 ${new Date(reg.date).toLocaleDateString("es-AR")}`,
				content: `
					<div class="stat-row"><span class="stat-label">Apertura</span><span class="stat-value">${printCurrency(reg.openingBalance)}</span></div>
					<div class="stat-row"><span class="stat-label">Ingresos</span><span class="stat-value" style="color:#166534">+ ${printCurrency(income)}</span></div>
					<div class="stat-row"><span class="stat-label">Egresos</span><span class="stat-value" style="color:#991b1b">- ${printCurrency(expenses)}</span></div>
					<div class="stat-row" style="border-top:2px solid #333;padding-top:8px;margin-top:4px"><span class="stat-label" style="font-weight:700">Saldo actual</span><span class="stat-value">${printCurrency(currentBalance)}</span></div>
					<div class="section-title" style="margin-top:24px">Movimientos (${movements.length})</div>
					<table>
						<thead><tr><th>Hora</th><th>Concepto</th><th>Medio</th><th style="text-align:right">Monto</th></tr></thead>
						<tbody>${mvRows}</tbody>
					</table>`,
			});
		} else if (history.length > 0) {
			const rows = history
				.map(
					(r) => `<tr>
						<td>${new Date(r.date).toLocaleDateString("es-AR")}</td>
						<td class="amount">${printCurrency(r.openingBalance)}</td>
						<td class="amount">${printCurrency(r.closingBalance ?? 0)}</td>
						<td class="amount">${r._count?.movements ?? 0}</td>
					</tr>`,
				)
				.join("");
			printDocument({
				title: "Historial de Cajas",
				subtitle: `${history.length} cajas cerradas`,
				content: `<table>
					<thead><tr><th>Fecha</th><th style="text-align:right">Apertura</th><th style="text-align:right">Cierre</th><th style="text-align:right">Movimientos</th></tr></thead>
					<tbody>${rows}</tbody></table>`,
			});
		}
	};

	// ─── Loading state ──────────────────────────────────────────────────────

	if (loading) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ background: "var(--s0)" }}
			>
				<div className="flex flex-col items-center gap-3 animate-fade-in">
					<IconBox icon={Vault} color="#f59e0b" size={48} iconSize={22} glow />
					<div
						className="font-display text-ink-disabled uppercase"
						style={{ fontSize: 11, letterSpacing: "0.2em" }}
					>
						Cargando caja...
					</div>
				</div>
			</div>
		);
	}

	// ─── Render ─────────────────────────────────────────────────────────────

	return (
		<div
			className="min-h-screen p-5 md:p-7 pb-10"
			style={{ background: "var(--s0)" }}
		>
			{/* Pulse animation for status indicator */}
			<style>{`
				@keyframes pulse {
					0%, 100% { opacity: 1; transform: scale(1); }
					50% { opacity: 0.4; transform: scale(1.3); }
				}
			`}</style>

			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-4 mb-6 animate-fade-in">
				<div>
					<div className="flex items-center gap-3 mb-3">
						<div
							style={{
								width: 3,
								height: 24,
								borderRadius: 3,
								background: "var(--gold)",
							}}
						/>
						<h1
							className="font-display text-ink-primary uppercase"
							style={{ fontSize: 22, letterSpacing: "0.15em", fontWeight: 700 }}
						>
							Caja Registradora
						</h1>
					</div>
					<div
						className="font-body text-ink-disabled"
						style={{ fontSize: 12, marginLeft: 15 }}
					>
						Gestion de caja diaria
					</div>
				</div>

				<div className="flex items-center gap-3">
					<StatusIndicator
						isOpen={!!activeRegister}
						since={activeRegister?.date}
					/>
					{(activeRegister || history.length > 0) && (
						<button
							className="btn-ghost flex items-center gap-1.5"
							style={{ padding: "10px 16px", borderRadius: 10 }}
							onClick={handlePrint}
						>
							<Printer size={14} />
							<span
								className="font-display uppercase"
								style={{ fontSize: 10, letterSpacing: "0.1em" }}
							>
								Imprimir
							</span>
						</button>
					)}
				</div>
			</div>

			<div className="divider-gold mb-7" />

			{/* No register open */}
			{!activeRegister && (
				<>
					<OpenRegisterCard onOpen={handleOpenRegister} />

					{history.length > 0 && (
						<div style={{ maxWidth: 740, margin: "48px auto 0" }}>
							<div className="flex items-center gap-2.5 mb-5">
								<IconBox
									icon={History}
									color="#6b7280"
									size={28}
									iconSize={13}
								/>
								<div
									className="font-display text-ink-disabled uppercase"
									style={{
										fontSize: 11,
										letterSpacing: "0.2em",
										fontWeight: 700,
									}}
								>
									Historial de Cajas
								</div>
								<div
									className="font-kds text-ink-disabled"
									style={{ fontSize: 14, marginLeft: 4 }}
								>
									({history.length})
								</div>
							</div>
							{history.map((r) => (
								<HistoryRow key={r.id} register={r} />
							))}
						</div>
					)}
				</>
			)}

			{/* Active register */}
			{activeRegister && (
				<>
					{/* Stats row */}
					<div className="flex flex-wrap gap-3 mb-7">
						<StatCard
							label="Saldo Inicial"
							value={activeRegister.openingBalance}
							icon={Vault}
							color="#888"
						/>
						<StatCard
							label="Ingresos"
							value={income}
							icon={TrendingUp}
							color="#10b981"
						/>
						<StatCard
							label="Egresos"
							value={expenses}
							icon={TrendingDown}
							color="#ef4444"
						/>
						<StatCard
							label="Saldo Actual"
							value={currentBalance}
							icon={DollarSign}
							color="var(--gold)"
							highlight
						/>
					</div>

					{/* Quick actions */}
					<div className="flex flex-wrap gap-3 mb-7 animate-slide-up">
						<button
							onClick={() => setModal("income")}
							className="btn-green flex items-center gap-2"
							style={{
								padding: "13px 22px",
								borderRadius: 12,
								fontSize: 11,
								letterSpacing: "0.12em",
							}}
						>
							<Plus size={15} />
							Registrar Ingreso
						</button>
						<button
							onClick={() => setModal("expense")}
							className="flex items-center gap-2"
							style={{
								padding: "13px 22px",
								borderRadius: 12,
								background: "rgba(239,68,68,0.08)",
								border: "1px solid rgba(239,68,68,0.2)",
								color: "#ef4444",
								fontFamily: "var(--font-syne)",
								fontWeight: 700,
								fontSize: 11,
								letterSpacing: "0.12em",
								textTransform: "uppercase",
								cursor: "pointer",
								transition: "all 0.2s ease",
							}}
						>
							<Minus size={15} />
							Registrar Egreso
						</button>
						<div style={{ flex: 1 }} />
						<button
							onClick={() => setModal("close")}
							className="btn-primary flex items-center gap-2"
							style={{
								padding: "13px 22px",
								borderRadius: 12,
								fontSize: 11,
								letterSpacing: "0.12em",
							}}
						>
							<Lock size={14} />
							Cerrar Caja
						</button>
					</div>

					{/* Movements list */}
					<div className="flex items-center gap-2.5 mb-4">
						<IconBox
							icon={ArrowRightLeft}
							color="#888"
							size={28}
							iconSize={13}
						/>
						<div
							className="font-display text-ink-disabled uppercase"
							style={{ fontSize: 11, letterSpacing: "0.2em", fontWeight: 700 }}
						>
							Movimientos del dia
						</div>
						<div
							className="font-kds text-ink-disabled"
							style={{ fontSize: 14, marginLeft: 4 }}
						>
							({movements.length})
						</div>
					</div>

					{movements.length === 0 ? (
						<div className="card flex flex-col items-center justify-center gap-4 py-20">
							<IconBox icon={DollarSign} color="#555" size={52} iconSize={22} />
							<div className="text-center">
								<p
									className="font-display text-ink-secondary uppercase"
									style={{
										fontSize: 13,
										letterSpacing: "0.12em",
										fontWeight: 700,
									}}
								>
									Sin movimientos
								</p>
								<p
									className="font-body text-ink-disabled mt-2"
									style={{ fontSize: 12, lineHeight: 1.5 }}
								>
									Registra ingresos y egresos para llevar el control
								</p>
							</div>
						</div>
					) : (
						<div className="flex flex-col gap-2 mb-8">
							{[...movements]
								.sort(
									(a, b) =>
										new Date(b.createdAt).getTime() -
										new Date(a.createdAt).getTime(),
								)
								.map((m) => (
									<MovementRow key={m.id} movement={m} />
								))}
						</div>
					)}

					{/* History */}
					{history.length > 0 && (
						<div style={{ marginTop: 48 }}>
							<div className="flex items-center gap-2.5 mb-5">
								<IconBox
									icon={History}
									color="#6b7280"
									size={28}
									iconSize={13}
								/>
								<div
									className="font-display text-ink-disabled uppercase"
									style={{
										fontSize: 11,
										letterSpacing: "0.2em",
										fontWeight: 700,
									}}
								>
									Historial de Cajas
								</div>
								<div
									className="font-kds text-ink-disabled"
									style={{ fontSize: 14, marginLeft: 4 }}
								>
									({history.length})
								</div>
							</div>
							{history.map((r) => (
								<HistoryRow key={r.id} register={r} />
							))}
						</div>
					)}
				</>
			)}

			{/* Modals */}
			{(modal === "income" || modal === "expense") && (
				<NewMovementModal
					type={modal}
					onClose={() => !submitting && setModal(null)}
					onSubmit={handleNewMovement}
					submitting={submitting}
				/>
			)}

			{modal === "close" && activeRegister && (
				<CloseRegisterModal
					register={activeRegister}
					income={income}
					expenses={expenses}
					onClose={() => !submitting && setModal(null)}
					onConfirm={handleCloseRegister}
					submitting={submitting}
				/>
			)}
		</div>
	);
}
