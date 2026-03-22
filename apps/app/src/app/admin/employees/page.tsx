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
			{/* Total active — spans 2 cols */}
			<div
				className="card col-span-2 md:col-span-2 p-5 relative overflow-hidden"
				style={{
					borderColor: "rgba(245,158,11,0.25)",
					boxShadow: "0 0 24px rgba(245,158,11,0.06)",
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
							style={{ fontSize: 44, lineHeight: 1 }}
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
					<div key={role} className="card p-4 flex flex-col gap-2">
						<span
							style={{
								display: "inline-flex",
								padding: "3px 9px",
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
							style={{ fontSize: 38, lineHeight: 1, color: c.textColor }}
						>
							{count}
						</span>
					</div>
				);
			})}
		</div>
	);
}

// ─── Staff grid (cards) ───────────────────────────────────────────────────────

function StaffGrid({ staff }: { staff: Staff[] }) {
	return (
		<div>
			<div className="flex items-center justify-between mb-4">
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

			{staff.length === 0 ? (
				<div
					className="card text-center font-body text-ink-disabled py-16"
					style={{ fontSize: 13 }}
				>
					No hay empleados registrados
				</div>
			) : (
				<div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{staff.map((s) => {
						const c = ROLE_ACCENT[s.role] ?? DEFAULT_ACCENT;
						return (
							<div
								key={s.id}
								className="card p-5 flex flex-col gap-4 hover:border-[rgba(245,158,11,0.2)] transition-all duration-150"
							>
								{/* Avatar + name */}
								<div className="flex items-center gap-3">
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
											className="font-display text-ink-primary"
											style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}
										>
											{s.name}
										</div>
										<div
											className="font-body text-ink-disabled"
											style={{ fontSize: 10, marginTop: 2 }}
										>
											#{s.id.slice(0, 8)}
										</div>
									</div>
								</div>

								{/* Role badge + status */}
								<div className="flex items-center justify-between">
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
											fontSize: 10,
											fontWeight: 700,
											letterSpacing: "0.1em",
											textTransform: "uppercase",
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
								<div className="flex items-center gap-2">
									<Clock size={11} style={{ color: "#555", flexShrink: 0 }} />
									<span
										className="font-body text-ink-disabled"
										style={{ fontSize: 11, fontFamily: "monospace" }}
									>
										18:00 – 02:00
									</span>
								</div>

								{/* Actions */}
								<div
									className="flex items-center gap-1 pt-1"
									style={{ borderTop: "1px solid var(--s3)" }}
								>
									<button
										className="btn-ghost flex-1 justify-center transition-all duration-150"
										style={{ padding: "6px 8px", fontSize: 11 }}
									>
										<Eye size={13} />
										Ver
									</button>
									<button
										className="btn-ghost flex-1 justify-center transition-all duration-150"
										style={{ padding: "6px 8px" }}
									>
										<Edit2 size={13} />
										Editar
									</button>
									<button
										className="btn-ghost transition-all duration-150"
										style={{ padding: "6px 8px", color: "#ef4444" }}
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
		<div className="card p-6">
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
		<div
			className="min-h-screen p-5 md:p-7 pb-10"
			style={{ background: "var(--s0)" }}
		>
			{/* ── Header ── */}
			<div className="flex items-center justify-between mb-7">
				<div>
					<div className="flex items-center gap-2 mb-1">
						<div
							style={{
								width: 3,
								height: 20,
								borderRadius: 3,
								background: "var(--gold)",
							}}
						/>
						<h1
							className="font-display text-ink-primary"
							style={{ fontSize: 22, fontWeight: 700 }}
						>
							Empleados
						</h1>
					</div>
					<div className="font-body text-ink-disabled" style={{ fontSize: 12 }}>
						{staff.length} activos hoy
					</div>
				</div>
				<button className="btn-primary" style={{ padding: "10px 20px" }}>
					<UserPlus size={13} />
					Agregar empleado
				</button>
			</div>

			<div className="divider-gold mb-7" />

			<div className="flex flex-col gap-6">
				<StatsRow staff={staff} />
				<StaffGrid staff={staff} />
				<ShiftsSection staff={staff} />
			</div>
		</div>
	);
}
