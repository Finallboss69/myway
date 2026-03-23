"use client";

import { useState, useEffect, useCallback } from "react";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
import {
	UserPlus,
	Eye,
	Edit2,
	UserX,
	Clock,
	Calendar,
	Users,
	Shield,
	UtensilsCrossed,
	Wine,
	Wallet,
	X,
	EyeOff,
	Truck,
} from "lucide-react";
import type { Staff, StaffRole } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
	cashier: "Cajero",
	waiter: "Mozo",
	kitchen: "Cocina",
	bar: "Barra",
	admin: "Admin",
	repartidor: "Repartidor",
};

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
	{ value: "admin", label: "Admin" },
	{ value: "cashier", label: "Cajero" },
	{ value: "waiter", label: "Mozo" },
	{ value: "kitchen", label: "Cocina" },
	{ value: "bar", label: "Barra" },
	{ value: "repartidor", label: "Repartidor" },
];

const ROLE_COLORS: Record<string, string> = {
	admin: "#f59e0b",
	waiter: "#3b82f6",
	kitchen: "#10b981",
	bar: "#8b5cf6",
	cashier: "#f59e0b",
	repartidor: "#ec4899",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
	admin: Shield,
	waiter: Users,
	kitchen: UtensilsCrossed,
	bar: Wine,
	cashier: Wallet,
	repartidor: Truck,
};

const ROLE_ACCENT: Record<
	string,
	{
		avatarBg: string;
		avatarBorder: string;
		textColor: string;
		badgeBg: string;
		badgeBorder: string;
	}
> = {
	admin: {
		avatarBg: "rgba(245,158,11,0.25)",
		avatarBorder: "rgba(245,158,11,0.4)",
		textColor: "#f59e0b",
		badgeBg: "rgba(245,158,11,0.1)",
		badgeBorder: "rgba(245,158,11,0.2)",
	},
	waiter: {
		avatarBg: "rgba(59,130,246,0.25)",
		avatarBorder: "rgba(59,130,246,0.4)",
		textColor: "#3b82f6",
		badgeBg: "rgba(59,130,246,0.1)",
		badgeBorder: "rgba(59,130,246,0.2)",
	},
	kitchen: {
		avatarBg: "rgba(16,185,129,0.25)",
		avatarBorder: "rgba(16,185,129,0.4)",
		textColor: "#10b981",
		badgeBg: "rgba(16,185,129,0.1)",
		badgeBorder: "rgba(16,185,129,0.2)",
	},
	bar: {
		avatarBg: "rgba(139,92,246,0.25)",
		avatarBorder: "rgba(139,92,246,0.4)",
		textColor: "#8b5cf6",
		badgeBg: "rgba(139,92,246,0.1)",
		badgeBorder: "rgba(139,92,246,0.2)",
	},
	cashier: {
		avatarBg: "rgba(245,158,11,0.25)",
		avatarBorder: "rgba(245,158,11,0.4)",
		textColor: "#f59e0b",
		badgeBg: "rgba(245,158,11,0.1)",
		badgeBorder: "rgba(245,158,11,0.2)",
	},
	repartidor: {
		avatarBg: "rgba(236,72,153,0.25)",
		avatarBorder: "rgba(236,72,153,0.4)",
		textColor: "#ec4899",
		badgeBg: "rgba(236,72,153,0.1)",
		badgeBorder: "rgba(236,72,153,0.2)",
	},
};

const DEFAULT_ACCENT = {
	avatarBg: "var(--s2)",
	avatarBorder: "var(--s4)",
	textColor: "#888",
	badgeBg: "var(--s2)",
	badgeBorder: "var(--s4)",
};

// Static shift data
const SHIFT_SLOTS = [
	{
		label: "Turno tarde",
		time: "16:00 - 22:00",
		color: "#8b5cf6",
		roles: ["cashier", "waiter"],
	},
	{
		label: "Turno noche",
		time: "18:00 - 02:00",
		color: "#f59e0b",
		roles: ["bar", "waiter", "admin"],
	},
	{
		label: "Turno cierre",
		time: "20:00 - 04:00",
		color: "#3b82f6",
		roles: ["kitchen"],
	},
];

// ─── Form state type ─────────────────────────────────────────────────────────

interface EmployeeForm {
	name: string;
	role: StaffRole;
	avatar: string;
	pin: string;
}

const EMPTY_FORM: EmployeeForm = {
	name: "",
	role: "waiter",
	avatar: "",
	pin: "",
};

// ─── Employee Modal ──────────────────────────────────────────────────────────

function EmployeeModal({
	open,
	onClose,
	onSave,
	initial,
	saving,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (form: EmployeeForm) => void;
	initial: EmployeeForm;
	saving: boolean;
}) {
	const [form, setForm] = useState<EmployeeForm>(initial);
	const [showPin, setShowPin] = useState(false);

	useEffect(() => {
		setForm(initial);
		setShowPin(false);
	}, [initial]);

	if (!open) return null;

	const isEdit = initial.name !== "";
	const isValid = form.name.trim().length > 0 && /^\d{4}$/.test(form.pin);

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 9999,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(0,0,0,0.7)",
				backdropFilter: "blur(4px)",
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: 460,
					margin: "0 16px",
					background: "var(--s1)",
					border: "1px solid var(--s4)",
					borderRadius: 16,
					overflow: "hidden",
					boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
				}}
			>
				{/* Header */}
				<div
					style={{
						padding: "16px 20px",
						borderBottom: "1px solid var(--s3)",
						background: "var(--s2)",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<div className="flex items-center gap-2.5">
						<UserPlus size={14} style={{ color: "var(--gold)" }} />
						<span
							className="font-display uppercase"
							style={{
								fontSize: 11,
								letterSpacing: "0.15em",
								color: "#ccc",
								fontWeight: 600,
							}}
						>
							{isEdit ? "Editar empleado" : "Agregar empleado"}
						</span>
					</div>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							padding: 4,
							color: "#666",
						}}
					>
						<X size={16} />
					</button>
				</div>

				{/* Form */}
				<div style={{ padding: "20px" }}>
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						{/* Name */}
						<div>
							<label
								className="font-display uppercase"
								style={{
									display: "block",
									fontSize: 10,
									letterSpacing: "0.15em",
									color: "#888",
									fontWeight: 600,
									marginBottom: 6,
								}}
							>
								Nombre *
							</label>
							<input
								type="text"
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								placeholder="Nombre completo"
								style={{
									width: "100%",
									padding: "10px 14px",
									background: "var(--s2)",
									border: "1px solid var(--s4)",
									borderRadius: 10,
									color: "#f5f5f5",
									fontSize: 13,
									outline: "none",
								}}
							/>
						</div>

						{/* Role */}
						<div>
							<label
								className="font-display uppercase"
								style={{
									display: "block",
									fontSize: 10,
									letterSpacing: "0.15em",
									color: "#888",
									fontWeight: 600,
									marginBottom: 6,
								}}
							>
								Rol *
							</label>
							<select
								value={form.role}
								onChange={(e) =>
									setForm({ ...form, role: e.target.value as StaffRole })
								}
								style={{
									width: "100%",
									padding: "10px 14px",
									background: "var(--s2)",
									border: "1px solid var(--s4)",
									borderRadius: 10,
									color: "#f5f5f5",
									fontSize: 13,
									outline: "none",
									cursor: "pointer",
								}}
							>
								{ROLE_OPTIONS.map((r) => (
									<option key={r.value} value={r.value}>
										{r.label}
									</option>
								))}
							</select>
							{/* Role color preview */}
							<div className="flex items-center gap-2" style={{ marginTop: 8 }}>
								<span
									className="font-display uppercase"
									style={{
										display: "inline-flex",
										alignItems: "center",
										padding: "3px 10px",
										borderRadius: 6,
										border: `1px solid ${ROLE_COLORS[form.role] ?? "#888"}30`,
										background: `${ROLE_COLORS[form.role] ?? "#888"}15`,
										color: ROLE_COLORS[form.role] ?? "#888",
										fontSize: 10,
										fontWeight: 700,
										letterSpacing: "0.1em",
									}}
								>
									{ROLE_LABELS[form.role] ?? form.role}
								</span>
							</div>
						</div>

						{/* Avatar */}
						<div>
							<label
								className="font-display uppercase"
								style={{
									display: "block",
									fontSize: 10,
									letterSpacing: "0.15em",
									color: "#888",
									fontWeight: 600,
									marginBottom: 6,
								}}
							>
								Avatar (emoji o iniciales)
							</label>
							<input
								type="text"
								value={form.avatar}
								onChange={(e) => setForm({ ...form, avatar: e.target.value })}
								placeholder="ej: JG o un emoji"
								maxLength={4}
								style={{
									width: "100%",
									padding: "10px 14px",
									background: "var(--s2)",
									border: "1px solid var(--s4)",
									borderRadius: 10,
									color: "#f5f5f5",
									fontSize: 13,
									outline: "none",
								}}
							/>
						</div>

						{/* PIN */}
						<div>
							<label
								className="font-display uppercase"
								style={{
									display: "block",
									fontSize: 10,
									letterSpacing: "0.15em",
									color: "#888",
									fontWeight: 600,
									marginBottom: 6,
								}}
							>
								PIN (4 digitos) *
							</label>
							<div style={{ position: "relative" }}>
								<input
									type={showPin ? "text" : "password"}
									value={form.pin}
									onChange={(e) => {
										const val = e.target.value.replace(/\D/g, "").slice(0, 4);
										setForm({ ...form, pin: val });
									}}
									placeholder="0000"
									maxLength={4}
									inputMode="numeric"
									style={{
										width: "100%",
										padding: "10px 14px",
										paddingRight: 40,
										background: "var(--s2)",
										border: `1px solid ${form.pin.length === 4 ? "var(--s4)" : form.pin.length > 0 ? "#ef444460" : "var(--s4)"}`,
										borderRadius: 10,
										color: "#f5f5f5",
										fontSize: 16,
										letterSpacing: "0.3em",
										fontFamily: "monospace",
										outline: "none",
									}}
								/>
								<button
									type="button"
									onClick={() => setShowPin(!showPin)}
									style={{
										position: "absolute",
										right: 10,
										top: "50%",
										transform: "translateY(-50%)",
										background: "none",
										border: "none",
										cursor: "pointer",
										padding: 4,
										color: "#666",
									}}
								>
									{showPin ? <EyeOff size={14} /> : <Eye size={14} />}
								</button>
							</div>
							{form.pin.length > 0 && form.pin.length < 4 && (
								<span
									className="font-body"
									style={{ fontSize: 10, color: "#ef4444", marginTop: 4 }}
								>
									El PIN debe tener exactamente 4 digitos
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div
					style={{
						padding: "14px 20px",
						borderTop: "1px solid var(--s3)",
						display: "flex",
						justifyContent: "flex-end",
						gap: 10,
					}}
				>
					<button
						onClick={onClose}
						className="btn-ghost"
						style={{ padding: "8px 16px", fontSize: 12 }}
					>
						Cancelar
					</button>
					<button
						onClick={() => onSave(form)}
						disabled={!isValid || saving}
						className="btn-primary"
						style={{
							padding: "8px 20px",
							fontSize: 12,
							opacity: !isValid || saving ? 0.5 : 1,
							cursor: !isValid || saving ? "not-allowed" : "pointer",
						}}
					>
						{saving
							? "Guardando..."
							: isEdit
								? "Guardar cambios"
								: "Agregar empleado"}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────

function DeleteModal({
	open,
	name,
	onClose,
	onConfirm,
	deleting,
}: {
	open: boolean;
	name: string;
	onClose: () => void;
	onConfirm: () => void;
	deleting: boolean;
}) {
	if (!open) return null;

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 9999,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(0,0,0,0.7)",
				backdropFilter: "blur(4px)",
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: 400,
					margin: "0 16px",
					background: "var(--s1)",
					border: "1px solid var(--s4)",
					borderRadius: 16,
					overflow: "hidden",
					boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
				}}
			>
				<div
					style={{
						padding: "16px 20px",
						borderBottom: "1px solid var(--s3)",
						background: "var(--s2)",
						display: "flex",
						alignItems: "center",
						gap: 10,
					}}
				>
					<UserX size={14} style={{ color: "#ef4444" }} />
					<span
						className="font-display uppercase"
						style={{
							fontSize: 11,
							letterSpacing: "0.15em",
							color: "#ccc",
							fontWeight: 600,
						}}
					>
						Eliminar empleado
					</span>
				</div>
				<div style={{ padding: "24px 20px" }}>
					<p
						className="font-body"
						style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}
					>
						{"¿Eliminar a "}
						<strong style={{ color: "#f5f5f5" }}>{name}</strong>
						{"? Esta accion no se puede deshacer."}
					</p>
				</div>
				<div
					style={{
						padding: "14px 20px",
						borderTop: "1px solid var(--s3)",
						display: "flex",
						justifyContent: "flex-end",
						gap: 10,
					}}
				>
					<button
						onClick={onClose}
						className="btn-ghost"
						style={{ padding: "8px 16px", fontSize: 12 }}
					>
						Cancelar
					</button>
					<button
						onClick={onConfirm}
						disabled={deleting}
						style={{
							padding: "8px 20px",
							fontSize: 12,
							fontWeight: 600,
							borderRadius: 10,
							border: "1px solid #ef444460",
							background: "#ef444420",
							color: "#ef4444",
							cursor: deleting ? "not-allowed" : "pointer",
							opacity: deleting ? 0.5 : 1,
						}}
					>
						{deleting ? "Eliminando..." : "Eliminar"}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
	const [staff, setStaff] = useState<Staff[]>([]);
	const [date, setDate] = useState("");

	// Modal state
	const [modalOpen, setModalOpen] = useState(false);
	const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
	const [saving, setSaving] = useState(false);

	// Delete state
	const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
	const [deleting, setDeleting] = useState(false);

	const fetchStaff = useCallback(async () => {
		try {
			const data = await apiFetch<Staff[]>("/api/staff");
			setStaff(data);
		} catch (e) {
			console.error(e);
		}
	}, []);

	useEffect(() => {
		fetchStaff();
	}, [fetchStaff]);

	useEffect(() => {
		const now = new Date();
		setDate(
			now.toLocaleDateString("es-AR", {
				weekday: "long",
				day: "numeric",
				month: "long",
			}),
		);
	}, []);

	// ─── CRUD handlers ────────────────────────────────────────────────

	const handleOpenCreate = () => {
		setEditingStaff(null);
		setModalOpen(true);
	};

	const handleOpenEdit = (member: Staff) => {
		setEditingStaff(member);
		setModalOpen(true);
	};

	const handleCloseModal = () => {
		setModalOpen(false);
		setEditingStaff(null);
	};

	const handleSave = async (form: EmployeeForm) => {
		setSaving(true);
		try {
			if (editingStaff) {
				await apiFetch(`/api/staff/${editingStaff.id}`, {
					method: "PATCH",
					body: JSON.stringify({
						name: form.name,
						role: form.role,
						avatar: form.avatar,
						pin: form.pin,
					}),
				});
			} else {
				await apiFetch("/api/staff", {
					method: "POST",
					body: JSON.stringify({
						name: form.name,
						role: form.role,
						avatar: form.avatar,
						pin: form.pin,
					}),
				});
			}
			handleCloseModal();
			await fetchStaff();
		} catch (e) {
			console.error(e);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await apiFetch(`/api/staff/${deleteTarget.id}`, { method: "DELETE" });
			setDeleteTarget(null);
			await fetchStaff();
		} catch (e) {
			console.error(e);
		} finally {
			setDeleting(false);
		}
	};

	// ─── Derived data ─────────────────────────────────────────────────

	const roleEntries = Object.entries(ROLE_LABELS).map(([role, label]) => ({
		role,
		label,
		count: staff.filter((s) => s.role === role).length,
	}));

	const modalInitial: EmployeeForm = editingStaff
		? {
				name: editingStaff.name,
				role: editingStaff.role,
				avatar: editingStaff.avatar,
				pin: editingStaff.pin ?? "0000",
			}
		: EMPTY_FORM;

	return (
		<div style={{ minHeight: "100vh", background: "var(--s0)" }}>
			<div
				style={{ padding: "28px 24px 48px", maxWidth: 1200, margin: "0 auto" }}
			>
				{/* Header */}
				<div
					className="flex items-center justify-between animate-fade-in"
					style={{ marginBottom: 8 }}
				>
					<div className="flex items-center gap-3">
						<div
							style={{
								width: 3,
								height: 24,
								borderRadius: 2,
								background: "var(--gold)",
							}}
						/>
						<div>
							<h1
								className="font-display"
								style={{
									fontSize: 22,
									fontWeight: 700,
									color: "#f5f5f5",
									lineHeight: 1.1,
								}}
							>
								Empleados
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								{staff.length} activos hoy
							</p>
							<HelpButton {...helpContent.employees} />
						</div>
					</div>
					<button
						className="btn-primary"
						style={{ padding: "10px 20px" }}
						onClick={handleOpenCreate}
					>
						<UserPlus size={13} />
						Agregar empleado
					</button>
				</div>
				<div className="divider-gold" style={{ marginBottom: 28 }} />

				{/* KPI Cards */}
				<div
					className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
					style={{ marginBottom: 28 }}
				>
					{/* Total active -- spans 2 cols on lg */}
					<div
						className="col-span-2 sm:col-span-1 lg:col-span-2"
						style={{
							background: "var(--s1)",
							border: "1px solid #f59e0b25",
							borderRadius: 16,
							padding: "24px 22px 20px",
							position: "relative",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								position: "absolute",
								top: 0,
								left: "20%",
								right: "20%",
								height: 1,
								background:
									"linear-gradient(90deg, transparent, #f59e0b50, transparent)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								top: 0,
								right: 0,
								width: 120,
								height: 120,
								background:
									"radial-gradient(circle at 100% 0%, #f59e0b12 0%, transparent 70%)",
								pointerEvents: "none",
							}}
						/>
						<div style={{ position: "relative", zIndex: 1 }}>
							<div
								className="flex items-center justify-between"
								style={{ marginBottom: 16 }}
							>
								<div
									className="font-display uppercase"
									style={{
										fontSize: 10,
										letterSpacing: "0.2em",
										color: "#888",
										fontWeight: 600,
									}}
								>
									Personal activo
								</div>
								<div
									style={{
										width: 34,
										height: 34,
										borderRadius: 10,
										background: "#f59e0b15",
										border: "1px solid #f59e0b30",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Users size={16} style={{ color: "#f59e0b" }} />
								</div>
							</div>
							<div
								className="font-kds"
								style={{ fontSize: 36, lineHeight: 1, color: "#f59e0b" }}
							>
								{staff.length}
							</div>
							<div
								className="flex items-center gap-1.5"
								style={{ marginTop: 6 }}
							>
								<div
									style={{
										width: 6,
										height: 6,
										borderRadius: "50%",
										background: "#10b981",
									}}
								/>
								<span
									className="font-body"
									style={{ fontSize: 10, color: "#10b981" }}
								>
									Todos activos
								</span>
							</div>
						</div>
					</div>

					{roleEntries.map(({ role, label, count }) => {
						const color = ROLE_COLORS[role] ?? "#888";
						const Icon = ROLE_ICONS[role] ?? Users;
						return (
							<div
								key={role}
								style={{
									background: "var(--s1)",
									border: `1px solid ${color}25`,
									borderRadius: 16,
									padding: "24px 22px 20px",
									position: "relative",
									overflow: "hidden",
								}}
							>
								<div
									style={{
										position: "absolute",
										top: 0,
										left: "20%",
										right: "20%",
										height: 1,
										background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
									}}
								/>
								<div
									style={{
										position: "absolute",
										top: 0,
										right: 0,
										width: 120,
										height: 120,
										background: `radial-gradient(circle at 100% 0%, ${color}12 0%, transparent 70%)`,
										pointerEvents: "none",
									}}
								/>
								<div style={{ position: "relative", zIndex: 1 }}>
									<div
										className="flex items-center justify-between"
										style={{ marginBottom: 16 }}
									>
										<div
											className="font-display uppercase"
											style={{
												fontSize: 10,
												letterSpacing: "0.2em",
												color: "#888",
												fontWeight: 600,
											}}
										>
											{label}
										</div>
										<div
											style={{
												width: 34,
												height: 34,
												borderRadius: 10,
												background: `${color}15`,
												border: `1px solid ${color}30`,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<Icon size={16} style={{ color }} />
										</div>
									</div>
									<div
										className="font-kds"
										style={{ fontSize: 36, lineHeight: 1, color }}
									>
										{count}
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Staff list section */}
				<div
					style={{
						background: "var(--s1)",
						border: "1px solid var(--s4)",
						borderRadius: 16,
						overflow: "hidden",
						boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
						marginBottom: 24,
					}}
				>
					<div
						className="flex items-center justify-between"
						style={{
							padding: "14px 20px",
							borderBottom: "1px solid var(--s3)",
							background: "var(--s2)",
						}}
					>
						<div className="flex items-center gap-2.5">
							<Users size={14} style={{ color: "var(--gold)" }} />
							<span
								className="font-display uppercase"
								style={{
									fontSize: 11,
									letterSpacing: "0.15em",
									color: "#ccc",
									fontWeight: 600,
								}}
							>
								Equipo
							</span>
						</div>
						<span className="font-body" style={{ fontSize: 11, color: "#666" }}>
							Personal del local
						</span>
					</div>

					{staff.length === 0 ? (
						<div
							className="flex flex-col items-center justify-center"
							style={{ padding: "48px 20px" }}
						>
							<Users size={32} style={{ color: "#333", marginBottom: 8 }} />
							<span
								className="font-body"
								style={{ fontSize: 13, color: "#555" }}
							>
								No hay empleados registrados
							</span>
							<span
								className="font-body"
								style={{ fontSize: 11, color: "#444", marginTop: 2 }}
							>
								Agrega personal con el boton de arriba
							</span>
						</div>
					) : (
						<div className="grid gap-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{staff.map((s) => {
								const c = ROLE_ACCENT[s.role] ?? DEFAULT_ACCENT;
								return (
									<div
										key={s.id}
										style={{
											padding: "20px",
											borderBottom: "1px solid var(--s3)",
											borderRight: "1px solid var(--s3)",
											transition: "background 0.15s",
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.background = "var(--s2)")
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.background = "transparent")
										}
									>
										{/* Avatar + name */}
										<div
											className="flex items-center gap-3"
											style={{ marginBottom: 14 }}
										>
											<div
												style={{
													width: 44,
													height: 44,
													borderRadius: "50%",
													border: `1.5px solid ${c.avatarBorder}`,
													background: c.avatarBg,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													flexShrink: 0,
												}}
											>
												<span
													className="font-kds"
													style={{
														fontSize: 16,
														lineHeight: 1,
														color: c.textColor,
													}}
												>
													{s.avatar}
												</span>
											</div>
											<div>
												<div
													className="font-display"
													style={{
														fontSize: 13,
														fontWeight: 600,
														lineHeight: 1.2,
														color: "#f5f5f5",
													}}
												>
													{s.name}
												</div>
												<div
													className="font-body"
													style={{ fontSize: 10, marginTop: 2, color: "#555" }}
												>
													#{s.id.slice(0, 8)}
												</div>
											</div>
										</div>

										{/* Role badge + status */}
										<div
											className="flex items-center justify-between"
											style={{ marginBottom: 12 }}
										>
											<span
												className="font-display uppercase"
												style={{
													display: "inline-flex",
													alignItems: "center",
													padding: "4px 10px",
													borderRadius: 8,
													border: `1px solid ${c.badgeBorder}`,
													background: c.badgeBg,
													color: c.textColor,
													fontSize: 10,
													fontWeight: 700,
													letterSpacing: "0.1em",
												}}
											>
												{ROLE_LABELS[s.role] ?? s.role}
											</span>

											<div className="flex items-center gap-1.5">
												<div
													style={{
														width: 6,
														height: 6,
														borderRadius: "50%",
														background: "#10b981",
													}}
												/>
												<span
													className="font-display"
													style={{
														fontSize: 10,
														fontWeight: 600,
														color: "#10b981",
													}}
												>
													Activo
												</span>
											</div>
										</div>

										{/* Shift */}
										<div
											className="flex items-center gap-2"
											style={{ marginBottom: 14 }}
										>
											<Clock
												size={11}
												style={{ color: "#555", flexShrink: 0 }}
											/>
											<span
												className="font-body"
												style={{
													fontSize: 11,
													color: "#666",
													fontFamily: "monospace",
												}}
											>
												18:00 - 02:00
											</span>
										</div>

										{/* Actions */}
										<div
											className="flex items-center gap-1"
											style={{
												paddingTop: 10,
												borderTop: "1px solid var(--s3)",
											}}
										>
											<button
												className="btn-ghost flex-1 justify-center"
												style={{ padding: "6px 8px", fontSize: 11 }}
												onClick={() => handleOpenEdit(s)}
											>
												<Eye size={13} />
												Ver
											</button>
											<button
												className="btn-ghost flex-1 justify-center"
												style={{ padding: "6px 8px" }}
												onClick={() => handleOpenEdit(s)}
											>
												<Edit2 size={13} />
												Editar
											</button>
											<button
												className="btn-ghost"
												style={{ padding: "6px 8px", color: "#ef4444" }}
												onClick={() => setDeleteTarget(s)}
											>
												<UserX size={13} />
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Shifts section */}
				<div
					style={{
						background: "var(--s1)",
						border: "1px solid var(--s4)",
						borderRadius: 16,
						overflow: "hidden",
						boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
					}}
				>
					<div
						className="flex items-center justify-between"
						style={{
							padding: "14px 20px",
							borderBottom: "1px solid var(--s3)",
							background: "var(--s2)",
						}}
					>
						<div className="flex items-center gap-2.5">
							<Calendar size={14} style={{ color: "var(--gold)" }} />
							<span
								className="font-display uppercase"
								style={{
									fontSize: 11,
									letterSpacing: "0.15em",
									color: "#ccc",
									fontWeight: 600,
								}}
							>
								Turnos de hoy
							</span>
						</div>
						<span
							className="font-body"
							style={{
								fontSize: 12,
								color: "#666",
								textTransform: "capitalize",
							}}
							suppressHydrationWarning
						>
							{date}
						</span>
					</div>

					<div className="grid gap-0 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
						{SHIFT_SLOTS.map((slot) => {
							const members = staff.filter((s) => slot.roles.includes(s.role));
							return (
								<div
									key={slot.label}
									style={{
										padding: 20,
										borderRight: "1px solid var(--s3)",
										borderBottom: "1px solid var(--s3)",
									}}
								>
									<div
										style={{
											width: "100%",
											height: 2,
											borderRadius: 1,
											background: slot.color,
											marginBottom: 14,
										}}
									/>
									<div
										className="font-display"
										style={{
											fontSize: 12,
											fontWeight: 700,
											color: "#f5f5f5",
											marginBottom: 4,
										}}
									>
										{slot.label}
									</div>
									<div
										className="flex items-center gap-1.5"
										style={{ marginBottom: 16 }}
									>
										<Clock size={11} style={{ color: "#555" }} />
										<span
											className="font-body"
											style={{
												fontSize: 10,
												fontFamily: "monospace",
												color: "#666",
											}}
										>
											{slot.time}
										</span>
									</div>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: 10,
										}}
									>
										{members.length === 0 ? (
											<div
												className="font-body"
												style={{ fontSize: 11, color: "#555" }}
											>
												Sin personal asignado
											</div>
										) : (
											members.map((m) => {
												const c = ROLE_ACCENT[m.role] ?? DEFAULT_ACCENT;
												return (
													<div key={m.id} className="flex items-center gap-2.5">
														<div
															style={{
																width: 24,
																height: 24,
																borderRadius: "50%",
																border: `1px solid ${c.avatarBorder}`,
																background: c.avatarBg,
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																flexShrink: 0,
															}}
														>
															<span
																className="font-kds"
																style={{
																	fontSize: 10,
																	lineHeight: 1,
																	color: c.textColor,
																}}
															>
																{m.avatar}
															</span>
														</div>
														<div style={{ flex: 1, minWidth: 0 }}>
															<div
																className="font-display"
																style={{
																	fontSize: 12,
																	fontWeight: 600,
																	color: "#f5f5f5",
																	overflow: "hidden",
																	textOverflow: "ellipsis",
																	whiteSpace: "nowrap",
																}}
															>
																{m.name.split(" ")[0]}
															</div>
														</div>
														<span
															className="font-display uppercase"
															style={{
																display: "inline-flex",
																padding: "1px 6px",
																borderRadius: 4,
																border: `1px solid ${c.badgeBorder}`,
																background: c.badgeBg,
																color: c.textColor,
																fontSize: 9,
																fontWeight: 700,
																flexShrink: 0,
															}}
														>
															{ROLE_LABELS[m.role]}
														</span>
													</div>
												);
											})
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Modals */}
			<EmployeeModal
				open={modalOpen}
				onClose={handleCloseModal}
				onSave={handleSave}
				initial={modalInitial}
				saving={saving}
			/>
			<DeleteModal
				open={deleteTarget !== null}
				name={deleteTarget?.name ?? ""}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleDelete}
				deleting={deleting}
			/>
		</div>
	);
}
