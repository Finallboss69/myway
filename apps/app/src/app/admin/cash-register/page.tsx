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

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
	label,
	value,
	icon: Icon,
	color,
}: {
	label: string;
	value: number;
	icon: React.ElementType;
	color: string;
}) {
	return (
		<div
			className="card"
			style={{ padding: "18px 20px", flex: 1, minWidth: 160 }}
		>
			<div className="flex items-center gap-2 mb-2">
				<div
					style={{
						width: 30,
						height: 30,
						borderRadius: 8,
						background: `${color}18`,
						border: `1px solid ${color}30`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
					}}
				>
					<Icon size={14} style={{ color }} />
				</div>
				<div
					className="font-display text-ink-disabled uppercase"
					style={{ fontSize: 9, letterSpacing: "0.25em" }}
				>
					{label}
				</div>
			</div>
			<div className="font-kds" style={{ fontSize: 28, lineHeight: 1, color }}>
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
			style={{
				padding: "12px 18px",
				background: "var(--s1)",
				borderRadius: 10,
				borderLeft: `3px solid ${color}`,
				display: "flex",
				alignItems: "center",
				gap: 12,
			}}
		>
			{/* Time */}
			<div className="flex items-center gap-1" style={{ minWidth: 52 }}>
				<Clock size={10} style={{ color: "#555" }} />
				<span className="font-kds text-ink-disabled" style={{ fontSize: 14 }}>
					{time}
				</span>
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
					style={{
						fontSize: 8,
						padding: "2px 8px",
						borderRadius: 99,
						fontFamily: "var(--font-syne)",
						fontWeight: 700,
						letterSpacing: "0.1em",
						textTransform: "uppercase",
						color: method.color,
						background: `${method.color}18`,
						border: `1px solid ${method.color}30`,
					}}
				>
					{method.label}
				</span>
			)}

			{/* Amount */}
			<div
				className="font-kds"
				style={{ fontSize: 20, color, minWidth: 100, textAlign: "right" }}
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

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.7)",
				backdropFilter: "blur(6px)",
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
				style={{ width: 440, padding: "28px 28px 24px" }}
			>
				{/* Header */}
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2">
						<div
							style={{
								width: 32,
								height: 32,
								borderRadius: 8,
								background: `${color}18`,
								border: `1px solid ${color}30`,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{isIncome ? (
								<Plus size={16} style={{ color }} />
							) : (
								<Minus size={16} style={{ color }} />
							)}
						</div>
						<div
							className="font-display text-ink-primary uppercase"
							style={{ fontSize: 13, letterSpacing: "0.2em", fontWeight: 600 }}
						>
							{title}
						</div>
					</div>
					<button
						className="btn-ghost"
						style={{ padding: 8 }}
						onClick={onClose}
					>
						<X size={16} />
					</button>
				</div>

				{/* Amount */}
				<SectionLabel>Monto</SectionLabel>
				<div
					style={{
						background: "var(--s1)",
						borderRadius: 12,
						border: `1px solid ${color}30`,
						padding: "16px 20px",
						marginBottom: 20,
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
								fontSize: 48,
								lineHeight: 1,
								color,
								background: "transparent",
								border: "none",
								outline: "none",
								textAlign: "center",
								width: "100%",
								maxWidth: 220,
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
						padding: "12px 16px",
						fontSize: 13,
						marginBottom: 20,
					}}
				/>

				{/* Payment method */}
				<SectionLabel>Metodo de pago</SectionLabel>
				<div className="grid grid-cols-2 gap-2 mb-6">
					{PAYMENT_METHODS.map(({ value, label, icon: Icon, color: mc }) => {
						const selected = paymentMethod === value;
						return (
							<button
								key={value}
								onClick={() => setPaymentMethod(value)}
								className="flex items-center gap-2 rounded-lg transition-all"
								style={{
									padding: "10px 12px",
									background: selected ? `${mc}18` : "var(--s2)",
									border: `1px solid ${selected ? mc : "var(--s3)"}`,
									color: selected ? mc : "#888",
									textAlign: "left",
								}}
							>
								<Icon size={14} />
								<span
									className="font-display"
									style={{ fontSize: 11, fontWeight: 600 }}
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
					disabled={submitting || !amount || !concept.trim()}
					style={{
						width: "100%",
						padding: "14px 0",
						borderRadius: 12,
						background: color,
						color: "#fff",
						fontFamily: "var(--font-syne)",
						fontWeight: 700,
						fontSize: 13,
						letterSpacing: "0.15em",
						textTransform: "uppercase",
						border: "none",
						cursor: submitting ? "not-allowed" : "pointer",
						opacity: submitting || !amount || !concept.trim() ? 0.5 : 1,
					}}
				>
					{submitting
						? "Registrando..."
						: `Confirmar ${isIncome ? "Ingreso" : "Egreso"}`}
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
				backdropFilter: "blur(6px)",
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
				style={{ width: 460, padding: "28px 28px 24px" }}
			>
				{/* Header */}
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2">
						<div
							style={{
								width: 32,
								height: 32,
								borderRadius: 8,
								background: "rgba(245,158,11,0.15)",
								border: "1px solid rgba(245,158,11,0.3)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Lock size={16} style={{ color: "var(--gold)" }} />
						</div>
						<div
							className="font-display text-ink-primary uppercase"
							style={{ fontSize: 13, letterSpacing: "0.2em", fontWeight: 600 }}
						>
							Cerrar Caja
						</div>
					</div>
					<button
						className="btn-ghost"
						style={{ padding: 8 }}
						onClick={onClose}
					>
						<X size={16} />
					</button>
				</div>

				{/* Summary */}
				<div
					style={{
						background: "var(--s1)",
						borderRadius: 12,
						padding: 20,
						marginBottom: 20,
					}}
				>
					<SectionLabel>Resumen del dia</SectionLabel>
					<div className="flex flex-col gap-3">
						{[
							{
								label: "Saldo Inicial",
								value: register.openingBalance,
								color: "#888",
							},
							{ label: "Ingresos", value: income, color: "#10b981" },
							{ label: "Egresos", value: expenses, color: "#ef4444" },
						].map(({ label, value, color }) => (
							<div key={label} className="flex items-center justify-between">
								<span
									className="font-body text-ink-disabled"
									style={{ fontSize: 13 }}
								>
									{label}
								</span>
								<span className="font-kds" style={{ fontSize: 20, color }}>
									{formatCurrency(value)}
								</span>
							</div>
						))}
						<div
							style={{
								borderTop: "1px solid var(--s3)",
								paddingTop: 12,
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
								className="font-kds text-brand-500"
								style={{ fontSize: 26, lineHeight: 1 }}
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
						borderRadius: 12,
						border: "1px solid var(--s3)",
						padding: "14px 20px",
						marginBottom: 8,
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
								fontSize: 36,
								lineHeight: 1,
								color: "var(--gold)",
								background: "transparent",
								border: "none",
								outline: "none",
								textAlign: "center",
								width: "100%",
								maxWidth: 200,
							}}
						/>
					</div>
				</div>

				{/* Difference */}
				{diff !== 0 && (
					<div
						className="flex items-center gap-2 mb-6"
						style={{
							padding: "10px 14px",
							borderRadius: 10,
							background: "rgba(239,68,68,0.08)",
							border: "1px solid rgba(239,68,68,0.2)",
						}}
					>
						<AlertTriangle size={14} style={{ color: "#ef4444" }} />
						<span
							className="font-body"
							style={{ fontSize: 12, color: "#ef4444" }}
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
					style={{
						width: "100%",
						padding: "14px 0",
						borderRadius: 12,
						background: "var(--gold)",
						color: "#000",
						fontFamily: "var(--font-syne)",
						fontWeight: 700,
						fontSize: 13,
						letterSpacing: "0.15em",
						textTransform: "uppercase",
						border: "none",
						cursor: submitting ? "not-allowed" : "pointer",
						opacity: submitting ? 0.5 : 1,
					}}
				>
					{submitting ? "Cerrando..." : "Confirmar Cierre de Caja"}
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

	return (
		<div className="card" style={{ marginBottom: 8, overflow: "hidden" }}>
			<button
				onClick={toggleExpand}
				className="w-full"
				style={{
					padding: "14px 18px",
					display: "flex",
					alignItems: "center",
					gap: 14,
					background: "transparent",
					border: "none",
					color: "inherit",
					cursor: "pointer",
					textAlign: "left",
				}}
			>
				<div
					style={{
						width: 3,
						height: 36,
						borderRadius: 3,
						background: "#6b7280",
						flexShrink: 0,
					}}
				/>
				<div style={{ minWidth: 80 }}>
					<div
						className="font-kds text-ink-secondary"
						style={{ fontSize: 18, lineHeight: 1 }}
					>
						{date}
					</div>
				</div>
				<div style={{ flex: 1, display: "flex", gap: 24 }}>
					<div>
						<div
							className="font-display text-ink-disabled uppercase"
							style={{ fontSize: 8, letterSpacing: "0.2em" }}
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
							style={{ fontSize: 8, letterSpacing: "0.2em" }}
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
							style={{ fontSize: 8, letterSpacing: "0.2em" }}
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
					style={{
						padding: "0 18px 16px",
						borderTop: "1px solid var(--s3)",
					}}
				>
					{loading ? (
						<div
							className="font-body text-ink-disabled text-center py-6"
							style={{ fontSize: 12 }}
						>
							Cargando movimientos...
						</div>
					) : movements.length === 0 ? (
						<div
							className="font-body text-ink-disabled text-center py-6"
							style={{ fontSize: 12 }}
						>
							Sin movimientos
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
			className="card-gold"
			style={{
				maxWidth: 460,
				margin: "60px auto",
				padding: "40px 36px",
				textAlign: "center",
			}}
		>
			<div
				style={{
					width: 64,
					height: 64,
					borderRadius: 16,
					background: "rgba(245,158,11,0.12)",
					border: "1px solid rgba(245,158,11,0.25)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					margin: "0 auto 20px",
				}}
			>
				<Unlock size={28} style={{ color: "var(--gold)" }} />
			</div>
			<div
				className="font-kds text-ink-primary"
				style={{ fontSize: 32, letterSpacing: "0.08em", marginBottom: 6 }}
			>
				ABRIR CAJA
			</div>
			<div
				className="font-body text-ink-disabled"
				style={{ fontSize: 13, marginBottom: 28 }}
			>
				Ingresa el saldo inicial para comenzar el dia
			</div>

			<SectionLabel>Saldo Inicial</SectionLabel>
			<div
				style={{
					background: "var(--s1)",
					borderRadius: 12,
					border: "1px solid rgba(245,158,11,0.2)",
					padding: "18px 20px",
					marginBottom: 24,
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
							fontSize: 48,
							lineHeight: 1,
							color: "var(--gold)",
							background: "transparent",
							border: "none",
							outline: "none",
							textAlign: "center",
							width: "100%",
							maxWidth: 220,
						}}
						autoFocus
					/>
				</div>
			</div>

			<button
				onClick={handleOpen}
				disabled={submitting}
				style={{
					width: "100%",
					padding: "16px 0",
					borderRadius: 12,
					background: "var(--gold)",
					color: "#000",
					fontFamily: "var(--font-syne)",
					fontWeight: 700,
					fontSize: 14,
					letterSpacing: "0.15em",
					textTransform: "uppercase",
					border: "none",
					cursor: submitting ? "not-allowed" : "pointer",
					opacity: submitting ? 0.5 : 1,
				}}
			>
				{submitting ? "Abriendo..." : "Abrir Caja"}
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
						<td>${m.paymentMethod ?? "—"}</td>
						<td class="amount" style="color:${m.type === "income" ? "#166534" : "#991b1b"}">${m.type === "income" ? "+" : "-"} ${printCurrency(m.amount)}</td>
					</tr>`,
				)
				.join("");
			printDocument({
				title: "Caja",
				subtitle: `${reg.status === "open" ? "Abierta" : "Cerrada"} — ${new Date(reg.date).toLocaleDateString("es-AR")}`,
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
				<div className="font-kds text-ink-disabled" style={{ fontSize: 20 }}>
					CARGANDO...
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
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-4 mb-7">
				<div>
					<div className="flex items-center gap-3 mb-1">
						<div
							style={{
								width: 3,
								height: 28,
								borderRadius: 3,
								background: "var(--gold)",
							}}
						/>
						<h1
							className="font-kds text-ink-primary"
							style={{ fontSize: 40, lineHeight: 1, letterSpacing: "0.08em" }}
						>
							CAJA
						</h1>
						{/* Status badge */}
						{activeRegister ? (
							<span
								style={{
									fontSize: 9,
									padding: "4px 12px",
									borderRadius: 99,
									fontFamily: "var(--font-syne)",
									fontWeight: 700,
									letterSpacing: "0.15em",
									textTransform: "uppercase",
									color: "#10b981",
									background: "rgba(16,185,129,0.12)",
									border: "1px solid rgba(16,185,129,0.3)",
								}}
							>
								Abierta
							</span>
						) : (
							<span
								style={{
									fontSize: 9,
									padding: "4px 12px",
									borderRadius: 99,
									fontFamily: "var(--font-syne)",
									fontWeight: 700,
									letterSpacing: "0.15em",
									textTransform: "uppercase",
									color: "#ef4444",
									background: "rgba(239,68,68,0.12)",
									border: "1px solid rgba(239,68,68,0.3)",
								}}
							>
								Cerrada
							</span>
						)}
					</div>
					<div className="font-body text-ink-disabled" style={{ fontSize: 12 }}>
						Gestion de caja diaria
					</div>
				</div>

				{activeRegister && (
					<div
						className="font-body text-ink-disabled"
						style={{ fontSize: 11, paddingTop: 6 }}
					>
						Abierta desde{" "}
						{new Date(activeRegister.date).toLocaleTimeString("es-AR", {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</div>
				)}
			</div>

			<div className="divider-gold mb-7" />

			{/* No register open */}
			{!activeRegister && (
				<>
					<OpenRegisterCard onOpen={handleOpenRegister} />

					{/* History below */}
					{history.length > 0 && (
						<div style={{ maxWidth: 700, margin: "48px auto 0" }}>
							<div className="flex items-center gap-2 mb-4">
								<History size={14} style={{ color: "#555" }} />
								<SectionLabel>Historial de Cajas</SectionLabel>
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
						/>
					</div>

					{/* Quick actions */}
					<div className="flex flex-wrap gap-3 mb-7">
						<button
							onClick={() => setModal("income")}
							className="flex items-center gap-2"
							style={{
								padding: "12px 20px",
								borderRadius: 12,
								background: "rgba(16,185,129,0.1)",
								border: "1px solid rgba(16,185,129,0.25)",
								color: "#10b981",
								fontFamily: "var(--font-syne)",
								fontWeight: 700,
								fontSize: 11,
								letterSpacing: "0.12em",
								textTransform: "uppercase",
								cursor: "pointer",
							}}
						>
							<Plus size={14} />
							Registrar Ingreso
						</button>
						<button
							onClick={() => setModal("expense")}
							className="flex items-center gap-2"
							style={{
								padding: "12px 20px",
								borderRadius: 12,
								background: "rgba(239,68,68,0.1)",
								border: "1px solid rgba(239,68,68,0.25)",
								color: "#ef4444",
								fontFamily: "var(--font-syne)",
								fontWeight: 700,
								fontSize: 11,
								letterSpacing: "0.12em",
								textTransform: "uppercase",
								cursor: "pointer",
							}}
						>
							<Minus size={14} />
							Registrar Egreso
						</button>
						<div style={{ flex: 1 }} />
						<button
							onClick={() => setModal("close")}
							className="flex items-center gap-2"
							style={{
								padding: "12px 20px",
								borderRadius: 12,
								background: "rgba(245,158,11,0.1)",
								border: "1px solid rgba(245,158,11,0.25)",
								color: "var(--gold)",
								fontFamily: "var(--font-syne)",
								fontWeight: 700,
								fontSize: 11,
								letterSpacing: "0.12em",
								textTransform: "uppercase",
								cursor: "pointer",
							}}
						>
							<Lock size={14} />
							Cerrar Caja
						</button>
					</div>

					{/* Movements list */}
					<SectionLabel>Movimientos del dia</SectionLabel>
					{movements.length === 0 ? (
						<div className="card flex flex-col items-center justify-center gap-3 py-16">
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: 12,
									background: "var(--s2)",
									border: "1px solid var(--s3)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<DollarSign size={20} style={{ color: "#555" }} />
							</div>
							<div className="text-center">
								<p
									className="font-kds text-ink-secondary"
									style={{ fontSize: 18, letterSpacing: "0.05em" }}
								>
									SIN MOVIMIENTOS
								</p>
								<p
									className="font-body text-ink-disabled mt-1"
									style={{ fontSize: 12 }}
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
						<div style={{ marginTop: 40 }}>
							<div className="flex items-center gap-2 mb-4">
								<History size={14} style={{ color: "#555" }} />
								<SectionLabel>Historial de Cajas</SectionLabel>
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
