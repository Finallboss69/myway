"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Eye, Edit2, UserX, Clock, Calendar } from "lucide-react";
import type { Staff } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
	cashier: "Cajero",
	waiter: "Mozo",
	kitchen: "Cocina",
	bar: "Barra",
	admin: "Admin",
};

const ROLE_COLORS: Record<
	string,
	{ avatar: string; badge: string; num: string }
> = {
	admin: {
		avatar:
			"rgba(245,158,11,0.25) border border-[rgba(245,158,11,0.4)] text-[#f59e0b]",
		badge: "rgba(245,158,11,0.1)",
		num: "#f59e0b",
	},
	waiter: {
		avatar: "rgba(59,130,246,0.25)",
		badge: "rgba(59,130,246,0.1)",
		num: "#3b82f6",
	},
	kitchen: {
		avatar: "rgba(16,185,129,0.25)",
		badge: "rgba(16,185,129,0.1)",
		num: "#10b981",
	},
	bar: {
		avatar: "rgba(139,92,246,0.25)",
		badge: "rgba(139,92,246,0.1)",
		num: "#8b5cf6",
	},
	cashier: {
		avatar: "rgba(245,158,11,0.25)",
		badge: "rgba(245,158,11,0.1)",
		num: "#f59e0b",
	},
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
		time: "16:00 – 22:00",
		color: "#8b5cf6",
		roles: ["cashier", "waiter"],
	},
	{
		label: "Turno noche",
		time: "18:00 – 02:00",
		color: "#f59e0b",
		roles: ["bar", "waiter", "admin"],
	},
	{
		label: "Turno cierre",
		time: "20:00 – 04:00",
		color: "#3b82f6",
		roles: ["kitchen"],
	},
];

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatsRow({ staff }: { staff: Staff[] }) {
	const roleEntries = Object.entries(ROLE_LABELS).map(([role, label]) => ({
		role,
		label,
		count: staff.filter((s) => s.role === role).length,
	}));

	return (
		<div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
			{/* Total active */}
			<div
				className="stat-card col-span-2 md:col-span-2"
				style={{
					position: "relative",
					overflow: "hidden",
					borderColor: "rgba(245,158,11,0.25)",
					boxShadow: "0 0 12px rgba(245,158,11,0.06)",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background:
							"radial-gradient(ellipse 300px 200px at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 60%)",
						pointerEvents: "none",
					}}
				/>
				<div style={{ position: "relative", zIndex: 1 }}>
					<div
						className="font-display text-ink-disabled uppercase mb-3"
						style={{ fontSize: 9, letterSpacing: "0.25em" }}
					>
						Personal activo
					</div>
					<div className="flex items-end gap-3">
						<span
							className="font-kds text-brand-500"
							style={{ fontSize: 42, lineHeight: 1 }}
						>
							{staff.length}
						</span>
						<div style={{ paddingBottom: 4 }}>
							<div
								className="font-body text-ink-disabled"
								style={{ fontSize: 12 }}
							>
								empleados
							</div>
							<div className="flex items-center gap-1.5 mt-0.5">
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
				</div>
			</div>

			{roleEntries.map(({ role, label, count }) => {
				const c = ROLE_ACCENT[role] ?? DEFAULT_ACCENT;
				return (
					<div key={role} className="stat-card flex flex-col gap-2">
						<span
							style={{
								display: "inline-flex",
								padding: "2px 8px",
								borderRadius: 6,
								border: `1px solid ${c.badgeBorder}`,
								background: c.badgeBg,
								color: c.textColor,
								fontFamily: "var(--font-syne)",
								fontSize: 9,
								fontWeight: 700,
								letterSpacing: "0.12em",
								textTransform: "uppercase",
							}}
						>
							{label}
						</span>
						<span
							className="font-kds"
							style={{ fontSize: 36, lineHeight: 1, color: c.textColor }}
						>
							{count}
						</span>
					</div>
				);
			})}
		</div>
	);
}

// ─── Staff table ──────────────────────────────────────────────────────────────

function StaffTable({ staff }: { staff: Staff[] }) {
	return (
		<div className="card" style={{ padding: 0, overflow: "hidden" }}>
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
				<div>
					<h3
						className="font-display text-ink-primary"
						style={{ fontSize: 13, fontWeight: 700 }}
					>
						Equipo
					</h3>
					<div
						className="font-body text-ink-disabled mt-0.5"
						style={{ fontSize: 11 }}
					>
						Personal del local
					</div>
				</div>
			</div>

			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr style={{ borderBottom: "1px solid var(--s3)" }}>
						{["Empleado", "Rol", "Estado", "Turno actual", "Acciones"].map(
							(h) => (
								<th
									key={h}
									className="font-display text-ink-disabled uppercase"
									style={{
										fontSize: 9,
										letterSpacing: "0.2em",
										padding: "12px 20px",
										textAlign: "left",
										fontWeight: 600,
									}}
								>
									{h}
								</th>
							),
						)}
					</tr>
				</thead>
				<tbody>
					{staff.length === 0 ? (
						<tr>
							<td
								colSpan={5}
								className="text-center font-body text-ink-disabled"
								style={{ padding: "40px 20px", fontSize: 13 }}
							>
								No hay empleados registrados
							</td>
						</tr>
					) : (
						staff.map((s) => {
							const c = ROLE_ACCENT[s.role] ?? DEFAULT_ACCENT;
							return (
								<tr key={s.id} style={{ borderBottom: "1px solid var(--s3)" }}>
									{/* Avatar + Name */}
									<td style={{ padding: "14px 20px" }}>
										<div className="flex items-center gap-3">
											<div
												style={{
													width: 36,
													height: 36,
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
														fontSize: 14,
														lineHeight: 1,
														color: c.textColor,
													}}
												>
													{s.avatar}
												</span>
											</div>
											<div>
												<div
													className="font-display text-ink-primary"
													style={{
														fontSize: 13,
														fontWeight: 600,
														lineHeight: 1.2,
													}}
												>
													{s.name}
												</div>
												<div
													className="font-body text-ink-disabled"
													style={{ fontSize: 10 }}
												>
													ID #{s.id.slice(0, 8)}
												</div>
											</div>
										</div>
									</td>

									{/* Role */}
									<td style={{ padding: "14px 20px" }}>
										<span
											style={{
												display: "inline-flex",
												alignItems: "center",
												padding: "4px 10px",
												borderRadius: 8,
												border: `1px solid ${c.badgeBorder}`,
												background: c.badgeBg,
												color: c.textColor,
												fontFamily: "var(--font-syne)",
												fontSize: 11,
												fontWeight: 700,
											}}
										>
											{ROLE_LABELS[s.role] ?? s.role}
										</span>
									</td>

									{/* Status */}
									<td style={{ padding: "14px 20px" }}>
										<div className="flex items-center gap-2">
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
													fontSize: 12,
													fontWeight: 600,
													color: "#10b981",
												}}
											>
												Activo
											</span>
										</div>
									</td>

									{/* Shift */}
									<td style={{ padding: "14px 20px" }}>
										<div className="flex items-center gap-2">
											<Clock
												size={12}
												style={{ color: "#555", flexShrink: 0 }}
											/>
											<span
												className="font-body text-ink-secondary"
												style={{ fontSize: 12, fontFamily: "monospace" }}
											>
												18:00 – 02:00
											</span>
										</div>
									</td>

									{/* Actions */}
									<td style={{ padding: "14px 20px" }}>
										<div className="flex items-center justify-end gap-1">
											<button
												className="btn-ghost"
												style={{ padding: "6px 10px", fontSize: 11 }}
											>
												<Eye size={13} />
												Ver perfil
											</button>
											<button
												className="btn-ghost"
												style={{ padding: "6px 8px" }}
											>
												<Edit2 size={13} />
											</button>
											<button
												className="btn-ghost"
												style={{ padding: "6px 8px", color: "#ef4444" }}
											>
												<UserX size={13} />
											</button>
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
}

// ─── Shifts section ───────────────────────────────────────────────────────────

function ShiftsSection({ staff }: { staff: Staff[] }) {
	const [date, setDate] = useState("");

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

	return (
		<div className="card" style={{ padding: 24 }}>
			<div className="flex items-center gap-2.5 mb-5">
				<Calendar size={15} style={{ color: "#f59e0b" }} />
				<h3
					className="font-display text-ink-primary"
					style={{ fontSize: 13, fontWeight: 700 }}
				>
					Turnos de hoy
				</h3>
				<span
					className="font-body text-ink-disabled"
					style={{ fontSize: 12, textTransform: "capitalize" }}
					suppressHydrationWarning
				>
					{date}
				</span>
			</div>

			<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
				{SHIFT_SLOTS.map((slot) => {
					const members = staff.filter((s) => slot.roles.includes(s.role));
					return (
						<div
							key={slot.label}
							style={{
								padding: 16,
								borderRadius: 12,
								background: "var(--s2)",
								border: `1px solid var(--s3)`,
								borderTop: `2px solid ${slot.color}`,
							}}
						>
							<div
								className="font-display text-ink-primary mb-1"
								style={{ fontSize: 12, fontWeight: 700 }}
							>
								{slot.label}
							</div>
							<div className="flex items-center gap-1.5 mb-4">
								<Clock size={11} style={{ color: "#555" }} />
								<span
									className="font-body text-ink-disabled"
									style={{ fontSize: 10, fontFamily: "monospace" }}
								>
									{slot.time}
								</span>
							</div>
							<div
								style={{ display: "flex", flexDirection: "column", gap: 10 }}
							>
								{members.length === 0 ? (
									<div
										className="font-body text-ink-disabled"
										style={{ fontSize: 11 }}
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
														className="font-display text-ink-primary"
														style={{
															fontSize: 12,
															fontWeight: 600,
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
													>
														{m.name.split(" ")[0]}
													</div>
												</div>
												<span
													style={{
														display: "inline-flex",
														padding: "1px 6px",
														borderRadius: 4,
														border: `1px solid ${c.badgeBorder}`,
														background: c.badgeBg,
														color: c.textColor,
														fontFamily: "var(--font-syne)",
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
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
	const [staff, setStaff] = useState<Staff[]>([]);

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

	return (
		<div style={{ minHeight: "100vh" }} className="p-5 md:p-7">
			{/* Header */}
			<div className="flex items-center justify-between mb-7">
				<div>
					<h1
						className="font-display text-ink-primary"
						style={{ fontSize: 20, fontWeight: 700 }}
					>
						Empleados
					</h1>
					<div
						className="font-body text-ink-disabled mt-1"
						style={{ fontSize: 12 }}
					>
						{staff.length} activos hoy
					</div>
				</div>
				<button className="btn-primary" style={{ padding: "10px 20px" }}>
					<UserPlus size={13} />
					Agregar empleado
				</button>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
				<StatsRow staff={staff} />
				<StaffTable staff={staff} />
				<ShiftsSection staff={staff} />
			</div>
		</div>
	);
}
