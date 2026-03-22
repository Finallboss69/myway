"use client";

import { UserPlus, Eye, Edit2, UserX, Clock, Calendar } from "lucide-react";
import { STAFF } from "@/data/mock";
import { useLiveClock } from "@/hooks/useLiveClock";

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
		avatar: "bg-brand-500/25 border-brand-500/40 text-brand-400",
		badge: "bg-brand-500/10 border-brand-500/20 text-brand-400",
		num: "text-brand-400",
	},
	waiter: {
		avatar: "bg-blue-500/25 border-blue-500/40 text-blue-300",
		badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
		num: "text-blue-400",
	},
	kitchen: {
		avatar: "bg-pool-500/25 border-pool-500/40 text-pool-400",
		badge: "bg-pool-500/10 border-pool-500/20 text-pool-400",
		num: "text-pool-400",
	},
	bar: {
		avatar: "bg-purple-500/25 border-purple-500/40 text-purple-300",
		badge: "bg-purple-500/10 border-purple-500/20 text-purple-400",
		num: "text-purple-400",
	},
	cashier: {
		avatar: "bg-amber-500/25 border-amber-500/40 text-amber-300",
		badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
		num: "text-amber-400",
	},
};

const SHIFTS: Record<string, string> = {
	s1: "18:00 – 02:00",
	s2: "18:00 – 02:00",
	s3: "20:00 – 04:00",
	s4: "17:00 – 01:00",
	s5: "18:00 – 02:00",
	s6: "16:00 – 00:00",
};

// ─── Top bar ─────────────────────────────────────────────────────────────────

function TopBar() {
	const activeCount = STAFF.filter((s) => s.isActive).length;
	const { time, date } = useLiveClock();

	return (
		<div className="flex items-center justify-between px-8 py-5 border-b border-surface-3 bg-surface-1/60 backdrop-blur-sm sticky top-0 z-10">
			<div>
				<h1 className="font-display text-xl font-700 text-ink-primary tracking-tight">
					Empleados
				</h1>
				<p className="font-body text-xs text-ink-tertiary mt-0.5">
					{activeCount} activos hoy ·{" "}
					<span className="capitalize" suppressHydrationWarning>
						{date}
					</span>
				</p>
			</div>
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5 text-ink-tertiary">
					<Clock size={13} />
					<span className="font-mono text-xs" suppressHydrationWarning>
						{time}
					</span>
				</div>
				<button className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5">
					<UserPlus size={13} />
					Agregar empleado
				</button>
			</div>
		</div>
	);
}

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatsRow() {
	const roleEntries = Object.entries(ROLE_LABELS).map(([role, label]) => ({
		role,
		label,
		count: STAFF.filter((s) => s.role === role).length,
	}));
	const activeTotal = STAFF.filter((s) => s.isActive).length;

	return (
		<div className="grid grid-cols-6 gap-3">
			{/* Total active — spans 2 cols */}
			<div className="stat-card col-span-2 relative overflow-hidden border-brand-500/25 shadow-gold-sm">
				<div className="absolute inset-0 bg-gold-glow opacity-50 pointer-events-none" />
				<div className="relative z-10">
					<div className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest mb-3">
						Personal activo
					</div>
					<div className="flex items-end gap-3">
						<span className="font-kds text-5xl text-brand-500 leading-none">
							{activeTotal}
						</span>
						<div className="pb-1">
							<div className="font-body text-xs text-ink-tertiary">
								empleados
							</div>
							<div className="flex items-center gap-1.5 mt-0.5">
								<div className="w-1.5 h-1.5 rounded-full bg-pool-500" />
								<span className="font-body text-[10px] text-pool-500">
									Todos activos
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Per-role */}
			{roleEntries.map(({ role, label, count }) => {
				const colors = ROLE_COLORS[role] ?? {
					avatar: "bg-surface-2 border-surface-4 text-ink-secondary",
					badge: "bg-surface-2 border-surface-4 text-ink-secondary",
					num: "text-ink-secondary",
				};
				return (
					<div key={role} className="stat-card flex flex-col gap-2">
						<span
							className={[
								"inline-flex px-2 py-0.5 rounded-md border font-display text-[10px] font-700 uppercase tracking-wider w-fit",
								colors.badge,
							].join(" ")}
						>
							{label}
						</span>
						<span
							className={["font-kds text-4xl leading-none", colors.num].join(
								" ",
							)}
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

function StaffTable() {
	return (
		<div className="card overflow-hidden">
			<div className="px-6 py-4 border-b border-surface-3 bg-surface-2/30 flex items-center justify-between">
				<div>
					<h3 className="font-display text-sm font-700 text-ink-primary">
						Equipo
					</h3>
					<p className="font-body text-xs text-ink-tertiary mt-0.5">
						Personal del local
					</p>
				</div>
			</div>

			<table className="w-full">
				<thead>
					<tr className="border-b border-surface-3">
						{["Empleado", "Rol", "Estado", "Turno actual", "Acciones"].map(
							(h) => (
								<th
									key={h}
									className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest px-5 py-3.5 text-left last:text-right"
								>
									{h}
								</th>
							),
						)}
					</tr>
				</thead>
				<tbody className="divide-y divide-surface-3">
					{STAFF.map((s) => {
						const colors = ROLE_COLORS[s.role] ?? {
							avatar: "bg-surface-2 border-surface-4 text-ink-secondary",
							badge: "bg-surface-2 border-surface-4 text-ink-secondary",
						};

						return (
							<tr
								key={s.id}
								className="hover:bg-surface-2/40 transition-colors group"
							>
								{/* Avatar + Name */}
								<td className="px-5 py-4">
									<div className="flex items-center gap-3">
										<div
											className={[
												"w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0",
												colors.avatar,
											].join(" ")}
										>
											<span className="font-kds text-sm leading-none">
												{s.avatar}
											</span>
										</div>
										<div>
											<div className="font-display text-sm font-600 text-ink-primary leading-tight">
												{s.name}
											</div>
											<div className="font-body text-[10px] text-ink-tertiary">
												ID #{s.id}
											</div>
										</div>
									</div>
								</td>

								{/* Role */}
								<td className="px-5 py-4">
									<span
										className={[
											"inline-flex items-center px-2.5 py-1 rounded-lg border font-display text-xs font-700",
											colors.badge,
										].join(" ")}
									>
										{ROLE_LABELS[s.role] ?? s.role}
									</span>
								</td>

								{/* Status */}
								<td className="px-5 py-4">
									<div className="flex items-center gap-2">
										<div className="w-1.5 h-1.5 rounded-full bg-pool-500" />
										<span className="font-display text-xs font-600 text-pool-500">
											Activo
										</span>
									</div>
								</td>

								{/* Shift */}
								<td className="px-5 py-4">
									<div className="flex items-center gap-2">
										<Clock
											size={12}
											className="text-ink-tertiary flex-shrink-0"
										/>
										<span className="font-mono text-xs text-ink-secondary">
											{SHIFTS[s.id]}
										</span>
									</div>
								</td>

								{/* Actions */}
								<td className="px-5 py-4">
									<div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button className="btn-ghost py-1.5 px-2.5 text-xs flex items-center gap-1">
											<Eye size={13} />
											Ver perfil
										</button>
										<button className="btn-ghost py-1.5 px-2 text-xs">
											<Edit2 size={13} />
										</button>
										<button className="btn-ghost py-1.5 px-2 text-xs hover:text-status-cancelled hover:bg-status-cancelled/10">
											<UserX size={13} />
										</button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

// ─── Shifts section ───────────────────────────────────────────────────────────

const SHIFT_SLOTS = [
	{
		label: "Turno tarde",
		time: "16:00 – 22:00",
		staff: ["s6", "s4"],
		color: "#8b5cf6",
	},
	{
		label: "Turno noche",
		time: "18:00 – 02:00",
		staff: ["s1", "s2", "s5"],
		color: "#f59e0b",
	},
	{
		label: "Turno cierre",
		time: "20:00 – 04:00",
		staff: ["s3"],
		color: "#3b82f6",
	},
];

function ShiftsSection() {
	const { date } = useLiveClock();

	return (
		<div className="card p-6">
			<div className="flex items-center gap-2.5 mb-5">
				<Calendar size={15} className="text-brand-500" />
				<h3 className="font-display text-sm font-700 text-ink-primary">
					Turnos de hoy
				</h3>
				<span
					className="font-body text-xs text-ink-tertiary capitalize"
					suppressHydrationWarning
				>
					{date}
				</span>
			</div>

			<div className="grid grid-cols-3 gap-4">
				{SHIFT_SLOTS.map((slot) => {
					const members = STAFF.filter((s) => slot.staff.includes(s.id));
					return (
						<div
							key={slot.label}
							className="p-4 rounded-xl bg-surface-2 border border-surface-3"
							style={{ borderTopColor: slot.color, borderTopWidth: "2px" }}
						>
							<div className="font-display text-xs font-700 text-ink-primary mb-1">
								{slot.label}
							</div>
							<div className="flex items-center gap-1.5 mb-4">
								<Clock size={11} className="text-ink-tertiary" />
								<span className="font-mono text-[10px] text-ink-tertiary">
									{slot.time}
								</span>
							</div>
							<div className="space-y-2.5">
								{members.map((m) => {
									const colors = ROLE_COLORS[m.role] ?? {
										avatar: "bg-surface-3 border-surface-4 text-ink-secondary",
										badge: "bg-surface-3 border-surface-4 text-ink-secondary",
										num: "text-ink-secondary",
									};
									return (
										<div key={m.id} className="flex items-center gap-2.5">
											<div
												className={[
													"w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0",
													colors.avatar,
												].join(" ")}
											>
												<span className="font-kds text-[10px] leading-none">
													{m.avatar}
												</span>
											</div>
											<div className="flex-1 min-w-0">
												<div className="font-display text-xs font-600 text-ink-primary truncate">
													{m.name.split(" ")[0]}
												</div>
											</div>
											<span
												className={[
													"inline-flex px-1.5 py-0.5 rounded border font-display text-[9px] font-700 flex-shrink-0",
													colors.badge,
												].join(" ")}
											>
												{ROLE_LABELS[m.role]}
											</span>
										</div>
									);
								})}
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
	return (
		<div className="flex flex-col min-h-screen">
			<TopBar />
			<div className="flex-1 px-8 py-6 space-y-5 animate-fade-in">
				<StatsRow />
				<StaffTable />
				<ShiftsSection />
			</div>
		</div>
	);
}
