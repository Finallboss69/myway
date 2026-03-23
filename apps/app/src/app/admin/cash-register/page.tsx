"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
	Wallet,
	Plus,
	Minus,
	Lock,
	Clock,
	ChevronDown,
	ChevronRight,
	ArrowUpRight,
	ArrowDownRight,
	DollarSign,
	CreditCard,
	Smartphone,
	Banknote,
	Send,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────── */
interface Movement {
	id: string;
	type: "income" | "expense";
	amount: number;
	concept: string;
	paymentMethod: string | null;
	createdAt: string;
}
interface Register {
	id: string;
	date: string;
	openedAt: string;
	closedAt: string | null;
	openingBalance: number;
	closingBalance: number | null;
	status: "open" | "closed";
	movements?: Movement[];
	_count?: { movements: number };
}

const fmt = (n: number) =>
	"$\u00A0" +
	n.toLocaleString("es-AR", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});

const fmtTime = (iso: string) =>
	new Date(iso).toLocaleTimeString("es-AR", {
		hour: "2-digit",
		minute: "2-digit",
	});

const fmtDate = (iso: string) =>
	new Date(iso).toLocaleDateString("es-AR", {
		day: "2-digit",
		month: "2-digit",
	});

const PAY_METHODS = [
	{ value: "cash", label: "Efectivo", icon: Banknote },
	{ value: "mercadopago", label: "MercadoPago", icon: Smartphone },
	{ value: "card", label: "Tarjeta", icon: CreditCard },
	{ value: "transfer", label: "Transferencia", icon: Send },
];

/* ─── Component ──────────────────────────────────── */
export default function CashRegisterPage() {
	const [registers, setRegisters] = useState<Register[]>([]);
	const [activeRegister, setActiveRegister] = useState<Register | null>(null);
	const [loading, setLoading] = useState(true);

	// Open register
	const [openBalance, setOpenBalance] = useState(0);
	const [opening, setOpening] = useState(false);

	// Movement modal
	const [showMovement, setShowMovement] = useState(false);
	const [movType, setMovType] = useState<"income" | "expense">("income");
	const [movAmount, setMovAmount] = useState("");
	const [movConcept, setMovConcept] = useState("");
	const [movPayment, setMovPayment] = useState("cash");
	const [submitting, setSubmitting] = useState(false);

	// Close modal
	const [showClose, setShowClose] = useState(false);
	const [closing, setClosing] = useState(false);

	// History expand
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [expandedMovements, setExpandedMovements] = useState<Movement[]>([]);

	const fetchData = useCallback(async () => {
		try {
			const [allRes, openRes] = await Promise.all([
				fetch("/api/cash-register"),
				fetch("/api/cash-register?status=open"),
			]);
			const all: Register[] = await allRes.json();
			const openList: Register[] = await openRes.json();

			setRegisters(all.filter((r) => r.status === "closed"));

			if (openList.length > 0) {
				const detailRes = await fetch(`/api/cash-register/${openList[0].id}`);
				const detail: Register = await detailRes.json();
				setActiveRegister(detail);
			} else {
				setActiveRegister(null);
			}
		} catch {
			/* ignore */
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const { totalIncome, totalExpense, currentBalance } = useMemo(() => {
		if (!activeRegister?.movements)
			return { totalIncome: 0, totalExpense: 0, currentBalance: 0 };
		let inc = 0;
		let exp = 0;
		for (const m of activeRegister.movements) {
			if (m.type === "income") inc += m.amount;
			else exp += m.amount;
		}
		return {
			totalIncome: inc,
			totalExpense: exp,
			currentBalance: activeRegister.openingBalance + inc - exp,
		};
	}, [activeRegister]);

	const handleOpen = async () => {
		setOpening(true);
		try {
			const res = await fetch("/api/cash-register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ openingBalance: openBalance }),
			});
			if (res.ok) {
				await fetchData();
				setOpenBalance(0);
			}
		} finally {
			setOpening(false);
		}
	};

	const handleMovement = async () => {
		if (!activeRegister || !movAmount || !movConcept.trim()) return;
		setSubmitting(true);
		try {
			const res = await fetch(
				`/api/cash-register/${activeRegister.id}/movements`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						type: movType,
						amount: parseFloat(movAmount),
						concept: movConcept.trim(),
						paymentMethod: movPayment,
					}),
				},
			);
			if (res.ok) {
				setShowMovement(false);
				setMovAmount("");
				setMovConcept("");
				await fetchData();
			}
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = async () => {
		if (!activeRegister) return;
		setClosing(true);
		try {
			const res = await fetch(`/api/cash-register/${activeRegister.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "closed" }),
			});
			if (res.ok) {
				setShowClose(false);
				await fetchData();
			}
		} finally {
			setClosing(false);
		}
	};

	const expandHistory = async (id: string) => {
		if (expandedId === id) {
			setExpandedId(null);
			return;
		}
		setExpandedId(id);
		const res = await fetch(`/api/cash-register/${id}`);
		const data: Register = await res.json();
		setExpandedMovements(data.movements ?? []);
	};

	if (loading) {
		return (
			<div
				className="flex items-center justify-center"
				style={{ minHeight: "60vh" }}
			>
				<div
					className="font-display text-ink-tertiary"
					style={{ fontSize: 13 }}
				>
					Cargando caja...
				</div>
			</div>
		);
	}

	return (
		<div style={{ padding: "24px 20px 60px", maxWidth: 900, margin: "0 auto" }}>
			{/* Header */}
			<div
				className="flex items-center gap-4 flex-wrap"
				style={{ marginBottom: 28 }}
			>
				<div
					className="flex items-center justify-center"
					style={{
						width: 44,
						height: 44,
						borderRadius: 12,
						background: "rgba(245,158,11,0.12)",
						border: "1px solid rgba(245,158,11,0.25)",
					}}
				>
					<Wallet size={22} style={{ color: "var(--gold)" }} />
				</div>
				<h1
					className="font-kds text-ink-primary"
					style={{ fontSize: 40, lineHeight: 1 }}
				>
					CAJA
				</h1>
				{activeRegister ? (
					<div
						className="badge flex items-center gap-1.5"
						style={{
							background: "rgba(16,185,129,0.1)",
							border: "1px solid rgba(16,185,129,0.3)",
							color: "#10b981",
						}}
					>
						<div
							className="animate-pulse"
							style={{
								width: 6,
								height: 6,
								borderRadius: "50%",
								background: "#10b981",
							}}
						/>
						ABIERTA
					</div>
				) : (
					<div
						className="badge flex items-center gap-1.5"
						style={{
							background: "rgba(239,68,68,0.1)",
							border: "1px solid rgba(239,68,68,0.3)",
							color: "#ef4444",
						}}
					>
						<Lock size={10} />
						CERRADA
					</div>
				)}
			</div>

			{/* ─── No register open ─── */}
			{!activeRegister && (
				<div
					className="card-gold"
					style={{
						padding: 32,
						textAlign: "center",
						marginBottom: 32,
					}}
				>
					<Wallet
						size={40}
						style={{ color: "var(--gold)", margin: "0 auto 16px" }}
					/>
					<h2
						className="font-display text-ink-primary"
						style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}
					>
						Abrir Caja del Día
					</h2>
					<p
						className="font-body text-ink-tertiary"
						style={{ fontSize: 12, marginBottom: 20 }}
					>
						Ingresá el saldo inicial para comenzar a registrar movimientos
					</p>
					<div
						className="flex items-center gap-3 justify-center"
						style={{ marginBottom: 16 }}
					>
						<label
							className="font-display text-ink-tertiary uppercase"
							style={{ fontSize: 9, letterSpacing: "0.2em" }}
						>
							Saldo Inicial
						</label>
						<div className="flex items-center gap-1">
							<span
								className="font-kds text-brand-500"
								style={{ fontSize: 24 }}
							>
								$
							</span>
							<input
								className="input-base"
								type="number"
								min={0}
								value={openBalance}
								onChange={(e) =>
									setOpenBalance(parseFloat(e.target.value) || 0)
								}
								style={{
									width: 160,
									fontSize: 20,
									fontFamily: "var(--font-kds)",
								}}
							/>
						</div>
					</div>
					<button
						className="btn-primary"
						onClick={handleOpen}
						disabled={opening}
					>
						{opening ? "Abriendo..." : "Abrir Caja"}
					</button>
				</div>
			)}

			{/* ─── Active register ─── */}
			{activeRegister && (
				<>
					{/* Stats */}
					<div
						className="grid gap-4"
						style={{
							gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
							marginBottom: 24,
						}}
					>
						{[
							{
								label: "Saldo Inicial",
								value: activeRegister.openingBalance,
								color: "var(--ink-secondary)",
							},
							{ label: "Ingresos", value: totalIncome, color: "#10b981" },
							{ label: "Egresos", value: totalExpense, color: "#ef4444" },
							{
								label: "Saldo Actual",
								value: currentBalance,
								color: "var(--gold)",
							},
						].map((s) => (
							<div
								key={s.label}
								className="card"
								style={{ padding: "16px 18px" }}
							>
								<div
									className="font-display text-ink-disabled uppercase"
									style={{
										fontSize: 9,
										letterSpacing: "0.25em",
										marginBottom: 6,
									}}
								>
									{s.label}
								</div>
								<div
									className="font-kds"
									style={{ fontSize: 28, color: s.color, lineHeight: 1 }}
								>
									{fmt(s.value)}
								</div>
							</div>
						))}
					</div>

					{/* Quick actions */}
					<div className="flex gap-3 flex-wrap" style={{ marginBottom: 24 }}>
						<button
							className="btn-primary flex items-center gap-2"
							style={{
								background: "rgba(16,185,129,0.15)",
								border: "1px solid rgba(16,185,129,0.3)",
								color: "#10b981",
							}}
							onClick={() => {
								setMovType("income");
								setShowMovement(true);
							}}
						>
							<Plus size={14} />
							<span className="font-display" style={{ fontSize: 11 }}>
								Registrar Ingreso
							</span>
						</button>
						<button
							className="btn-primary flex items-center gap-2"
							style={{
								background: "rgba(239,68,68,0.15)",
								border: "1px solid rgba(239,68,68,0.3)",
								color: "#ef4444",
							}}
							onClick={() => {
								setMovType("expense");
								setShowMovement(true);
							}}
						>
							<Minus size={14} />
							<span className="font-display" style={{ fontSize: 11 }}>
								Registrar Egreso
							</span>
						</button>
						<button
							className="btn-primary flex items-center gap-2 ml-auto"
							onClick={() => setShowClose(true)}
						>
							<Lock size={14} />
							<span className="font-display" style={{ fontSize: 11 }}>
								Cerrar Caja
							</span>
						</button>
					</div>

					{/* Movements */}
					<div
						className="font-display text-ink-disabled uppercase"
						style={{ fontSize: 9, letterSpacing: "0.25em", marginBottom: 10 }}
					>
						MOVIMIENTOS ({activeRegister.movements?.length ?? 0})
					</div>

					{!activeRegister.movements ||
					activeRegister.movements.length === 0 ? (
						<div className="card" style={{ padding: 32, textAlign: "center" }}>
							<DollarSign
								size={28}
								style={{ color: "var(--ink-disabled)", margin: "0 auto 8px" }}
							/>
							<p
								className="font-body text-ink-tertiary"
								style={{ fontSize: 12 }}
							>
								No hay movimientos todavía
							</p>
						</div>
					) : (
						<div className="grid gap-2" style={{ marginBottom: 32 }}>
							{activeRegister.movements.map((m) => (
								<div
									key={m.id}
									className="card flex items-center gap-3"
									style={{
										padding: "12px 16px",
										borderLeft: `3px solid ${m.type === "income" ? "#10b981" : "#ef4444"}`,
									}}
								>
									{m.type === "income" ? (
										<ArrowUpRight
											size={16}
											style={{ color: "#10b981", flexShrink: 0 }}
										/>
									) : (
										<ArrowDownRight
											size={16}
											style={{ color: "#ef4444", flexShrink: 0 }}
										/>
									)}
									<div className="flex-1 min-w-0">
										<div
											className="font-body text-ink-primary truncate"
											style={{ fontSize: 13 }}
										>
											{m.concept}
										</div>
										<div className="flex items-center gap-2">
											<span
												className="font-body text-ink-tertiary"
												style={{ fontSize: 10 }}
											>
												<Clock
													size={9}
													style={{ display: "inline", marginRight: 3 }}
												/>
												{fmtTime(m.createdAt)}
											</span>
											{m.paymentMethod && (
												<span
													className="badge"
													style={{ fontSize: 8, padding: "1px 6px" }}
												>
													{m.paymentMethod}
												</span>
											)}
										</div>
									</div>
									<div
										className="font-kds flex-shrink-0"
										style={{
											fontSize: 20,
											color: m.type === "income" ? "#10b981" : "#ef4444",
										}}
									>
										{m.type === "income" ? "+" : "−"} {fmt(m.amount)}
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}

			{/* ─── History ─── */}
			<div
				className="font-display text-ink-disabled uppercase"
				style={{ fontSize: 9, letterSpacing: "0.25em", marginBottom: 10 }}
			>
				HISTORIAL DE CAJAS
			</div>

			{registers.length === 0 ? (
				<div className="card" style={{ padding: 24, textAlign: "center" }}>
					<p className="font-body text-ink-tertiary" style={{ fontSize: 12 }}>
						No hay registros anteriores
					</p>
				</div>
			) : (
				<div className="grid gap-2">
					{registers.map((r) => (
						<div key={r.id}>
							<button
								className="card flex items-center gap-3 w-full text-left transition-colors"
								style={{ padding: "12px 16px", cursor: "pointer" }}
								onClick={() => expandHistory(r.id)}
							>
								{expandedId === r.id ? (
									<ChevronDown
										size={14}
										style={{ color: "var(--ink-tertiary)", flexShrink: 0 }}
									/>
								) : (
									<ChevronRight
										size={14}
										style={{ color: "var(--ink-tertiary)", flexShrink: 0 }}
									/>
								)}
								<div className="flex-1 min-w-0">
									<div
										className="font-display text-ink-primary"
										style={{ fontSize: 13, fontWeight: 600 }}
									>
										{fmtDate(r.date)}
									</div>
									<div
										className="font-body text-ink-tertiary"
										style={{ fontSize: 10 }}
									>
										{r._count?.movements ?? 0} movimientos
									</div>
								</div>
								<div className="text-right">
									<div
										className="font-body text-ink-tertiary"
										style={{ fontSize: 9 }}
									>
										Apertura
									</div>
									<div
										className="font-kds text-ink-secondary"
										style={{ fontSize: 16 }}
									>
										{fmt(r.openingBalance)}
									</div>
								</div>
								<div className="text-right" style={{ marginLeft: 12 }}>
									<div
										className="font-body text-ink-tertiary"
										style={{ fontSize: 9 }}
									>
										Cierre
									</div>
									<div
										className="font-kds text-brand-500"
										style={{ fontSize: 16 }}
									>
										{fmt(r.closingBalance ?? 0)}
									</div>
								</div>
							</button>

							{expandedId === r.id && (
								<div style={{ padding: "8px 0 8px 32px" }}>
									{expandedMovements.length === 0 ? (
										<div
											className="font-body text-ink-tertiary"
											style={{ fontSize: 11, padding: 12 }}
										>
											Sin movimientos
										</div>
									) : (
										<div className="grid gap-1">
											{expandedMovements.map((m) => (
												<div
													key={m.id}
													className="flex items-center gap-2"
													style={{
														padding: "6px 12px",
														borderLeft: `2px solid ${m.type === "income" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
													}}
												>
													<span
														className="font-body text-ink-tertiary"
														style={{ fontSize: 10, width: 40 }}
													>
														{fmtTime(m.createdAt)}
													</span>
													<span
														className="font-body text-ink-primary flex-1 truncate"
														style={{ fontSize: 12 }}
													>
														{m.concept}
													</span>
													<span
														className="font-kds"
														style={{
															fontSize: 14,
															color:
																m.type === "income" ? "#10b981" : "#ef4444",
														}}
													>
														{m.type === "income" ? "+" : "−"}
														{fmt(m.amount)}
													</span>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* ─── Movement Modal ─── */}
			{showMovement && (
				<div
					style={{
						position: "fixed",
						inset: 0,
						zIndex: 300,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: "rgba(0,0,0,0.6)",
						backdropFilter: "blur(4px)",
					}}
					onClick={(e) =>
						e.target === e.currentTarget && setShowMovement(false)
					}
				>
					<div
						className="card"
						style={{ width: "100%", maxWidth: 420, padding: 24, margin: 16 }}
					>
						<h3
							className="font-display text-ink-primary"
							style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}
						>
							{movType === "income" ? "Registrar Ingreso" : "Registrar Egreso"}
						</h3>

						{/* Amount */}
						<div style={{ marginBottom: 16, textAlign: "center" }}>
							<label
								className="font-display text-ink-tertiary uppercase block"
								style={{ fontSize: 9, letterSpacing: "0.2em", marginBottom: 8 }}
							>
								MONTO
							</label>
							<div className="flex items-center gap-2 justify-center">
								<span
									className="font-kds"
									style={{
										fontSize: 32,
										color: movType === "income" ? "#10b981" : "#ef4444",
									}}
								>
									$
								</span>
								<input
									className="input-base"
									type="number"
									min={0}
									step={0.01}
									value={movAmount}
									onChange={(e) => setMovAmount(e.target.value)}
									placeholder="0"
									style={{
										width: 180,
										fontSize: 28,
										fontFamily: "var(--font-kds)",
										textAlign: "center",
										color: movType === "income" ? "#10b981" : "#ef4444",
									}}
									autoFocus
								/>
							</div>
						</div>

						{/* Concept */}
						<div style={{ marginBottom: 16 }}>
							<label
								className="font-display text-ink-tertiary uppercase block"
								style={{ fontSize: 9, letterSpacing: "0.2em", marginBottom: 6 }}
							>
								CONCEPTO
							</label>
							<input
								className="input-base w-full"
								value={movConcept}
								onChange={(e) => setMovConcept(e.target.value)}
								placeholder={
									movType === "income"
										? "Ej: Venta efectivo mesa 3"
										: "Ej: Compra hielo"
								}
							/>
						</div>

						{/* Payment method */}
						<div style={{ marginBottom: 20 }}>
							<label
								className="font-display text-ink-tertiary uppercase block"
								style={{ fontSize: 9, letterSpacing: "0.2em", marginBottom: 8 }}
							>
								MEDIO DE PAGO
							</label>
							<div className="grid grid-cols-2 gap-2">
								{PAY_METHODS.map((pm) => (
									<button
										key={pm.value}
										type="button"
										onClick={() => setMovPayment(pm.value)}
										className="flex items-center gap-2 rounded-lg transition-colors"
										style={{
											padding: "10px 12px",
											background:
												movPayment === pm.value
													? "rgba(245,158,11,0.1)"
													: "var(--s2)",
											border: `1px solid ${movPayment === pm.value ? "rgba(245,158,11,0.3)" : "var(--s3)"}`,
											cursor: "pointer",
										}}
									>
										<pm.icon
											size={14}
											style={{
												color:
													movPayment === pm.value
														? "var(--gold)"
														: "var(--ink-tertiary)",
											}}
										/>
										<span
											className="font-body"
											style={{
												fontSize: 11,
												color:
													movPayment === pm.value
														? "var(--ink-primary)"
														: "var(--ink-tertiary)",
											}}
										>
											{pm.label}
										</span>
									</button>
								))}
							</div>
						</div>

						<div className="flex gap-3">
							<button
								className="btn-ghost flex-1"
								onClick={() => setShowMovement(false)}
							>
								Cancelar
							</button>
							<button
								className="btn-primary flex-1"
								onClick={handleMovement}
								disabled={submitting || !movAmount || !movConcept.trim()}
								style={
									movType === "income"
										? {
												background: "rgba(16,185,129,0.2)",
												borderColor: "rgba(16,185,129,0.4)",
												color: "#10b981",
											}
										: {
												background: "rgba(239,68,68,0.2)",
												borderColor: "rgba(239,68,68,0.4)",
												color: "#ef4444",
											}
								}
							>
								{submitting ? "Guardando..." : "Confirmar"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ─── Close Modal ─── */}
			{showClose && activeRegister && (
				<div
					style={{
						position: "fixed",
						inset: 0,
						zIndex: 300,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: "rgba(0,0,0,0.6)",
						backdropFilter: "blur(4px)",
					}}
					onClick={(e) => e.target === e.currentTarget && setShowClose(false)}
				>
					<div
						className="card"
						style={{ width: "100%", maxWidth: 420, padding: 24, margin: 16 }}
					>
						<h3
							className="font-display text-ink-primary"
							style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}
						>
							Cerrar Caja
						</h3>

						<div className="grid gap-3" style={{ marginBottom: 20 }}>
							{[
								{
									label: "Saldo Inicial",
									value: activeRegister.openingBalance,
								},
								{
									label: "Total Ingresos",
									value: totalIncome,
									color: "#10b981",
								},
								{
									label: "Total Egresos",
									value: totalExpense,
									color: "#ef4444",
								},
							].map((row) => (
								<div
									key={row.label}
									className="flex items-center justify-between"
								>
									<span
										className="font-body text-ink-tertiary"
										style={{ fontSize: 12 }}
									>
										{row.label}
									</span>
									<span
										className="font-kds"
										style={{
											fontSize: 18,
											color: row.color || "var(--ink-secondary)",
										}}
									>
										{fmt(row.value)}
									</span>
								</div>
							))}
							<div
								style={{
									height: 1,
									background: "var(--s3)",
									margin: "4px 0",
								}}
							/>
							<div className="flex items-center justify-between">
								<span
									className="font-display text-ink-primary"
									style={{ fontSize: 13, fontWeight: 700 }}
								>
									Saldo Calculado
								</span>
								<span
									className="font-kds text-brand-500"
									style={{ fontSize: 24 }}
								>
									{fmt(currentBalance)}
								</span>
							</div>
						</div>

						<div className="flex gap-3">
							<button
								className="btn-ghost flex-1"
								onClick={() => setShowClose(false)}
							>
								Cancelar
							</button>
							<button
								className="btn-primary flex-1 flex items-center gap-2 justify-center"
								onClick={handleClose}
								disabled={closing}
							>
								<Lock size={14} />
								{closing ? "Cerrando..." : "Confirmar Cierre"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
