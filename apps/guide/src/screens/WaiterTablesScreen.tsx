import {
	Clock,
	Bell,
	Users,
	Home,
	CheckCircle2,
	CreditCard,
} from "lucide-react";

const mockTables = [
	{
		number: 1,
		zone: "Salon Principal",
		type: "bar",
		status: "occupied" as const,
		seats: 4,
		total: 12500,
		items: 4,
		minutes: 35,
	},
	{
		number: 2,
		zone: "Salon Principal",
		type: "bar",
		status: "available" as const,
		seats: 2,
		total: 0,
		items: 0,
		minutes: 0,
	},
	{
		number: 3,
		zone: "Salon Principal",
		type: "bar",
		status: "occupied" as const,
		seats: 6,
		total: 8900,
		items: 3,
		minutes: 18,
	},
	{
		number: 4,
		zone: "Afuera",
		type: "pool",
		status: "available" as const,
		seats: 4,
		total: 0,
		items: 0,
		minutes: 0,
	},
	{
		number: 5,
		zone: "Afuera",
		type: "bar",
		status: "occupied" as const,
		seats: 4,
		total: 22300,
		items: 7,
		minutes: 52,
	},
	{
		number: 6,
		zone: "Salon Principal",
		type: "bar",
		status: "available" as const,
		seats: 2,
		total: 0,
		items: 0,
		minutes: 0,
	},
];

function TableCard({
	table,
	id,
}: {
	table: (typeof mockTables)[0];
	id?: string;
}) {
	const isAvailable = table.status === "available";
	const isOccupied = table.status === "occupied";

	return (
		<button
			id={id}
			className="flex flex-col rounded-2xl border text-left w-full transition-all"
			style={{
				background: isAvailable
					? "rgba(16,185,129,0.05)"
					: "rgba(245,158,11,0.08)",
				borderColor: "rgba(255,255,255,0.06)",
				borderLeftColor: isAvailable ? "#10b981" : "#f59e0b",
				borderLeftWidth: 4,
				boxShadow: isOccupied
					? "0 0 24px rgba(245,158,11,0.12), 0 2px 14px rgba(0,0,0,0.45)"
					: "0 2px 12px rgba(0,0,0,0.35)",
				padding: "14px 14px 12px",
				minHeight: 130,
			}}
		>
			<div className="flex items-start justify-between w-full mb-1.5">
				<div className="flex items-baseline gap-1.5">
					<span
						className="font-extrabold leading-none"
						style={{ fontSize: "clamp(48px,10vw,56px)", color: "var(--ink)" }}
					>
						{table.number}
					</span>
					{table.type === "pool" && (
						<span className="font-bold text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
							POOL
						</span>
					)}
				</div>
				<span
					className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mt-0.5"
					style={{
						background: isAvailable
							? "rgba(16,185,129,0.15)"
							: "rgba(245,158,11,0.15)",
						color: isAvailable ? "#34d399" : "#fbbf24",
						border: `1px solid ${isAvailable ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
					}}
				>
					{isAvailable ? "Libre" : "Ocupada"}
				</span>
			</div>

			<div className="flex items-center gap-2 mb-auto">
				<div className="text-[9px] uppercase tracking-[0.25em] text-[#6b6b6b] bg-white/[0.04] border border-white/[0.07] rounded-lg px-2 py-0.5">
					{table.zone}
				</div>
				<div className="flex items-center gap-1">
					<Users className="w-3 h-3 text-[var(--ink-faint)]" />
					<span className="text-[10px] text-[var(--ink-faint)]">
						{table.seats}
					</span>
				</div>
			</div>

			{isAvailable && (
				<div
					className="mt-2 pt-2 border-t w-full"
					style={{ borderColor: "rgba(16,185,129,0.2)" }}
				>
					<span className="font-bold tracking-[0.2em] text-sm text-emerald-400">
						LIBRE
					</span>
				</div>
			)}

			{isOccupied && (
				<div
					className="mt-2.5 pt-2.5 border-t w-full flex items-center justify-between"
					style={{ borderColor: "rgba(245,158,11,0.2)" }}
				>
					<div className="flex items-center gap-1.5">
						<Clock className="w-3.5 h-3.5 text-amber-400" />
						<span
							className="font-extrabold text-amber-400 leading-none"
							style={{ fontSize: 24 }}
						>
							{table.minutes}
							<span className="text-[10px] font-normal text-[var(--ink-faint)] ml-0.5">
								min
							</span>
						</span>
						<span className="text-[10px] text-[var(--ink-faint)] ml-1">
							· {table.items} items
						</span>
					</div>
					<span
						className="font-bold text-[var(--ink-secondary)] leading-none"
						style={{ fontSize: 16 }}
					>
						$ {table.total.toLocaleString("es-AR")}
					</span>
				</div>
			)}
		</button>
	);
}

export default function WaiterTablesScreen() {
	const occupied = mockTables.filter((t) => t.status === "occupied").length;
	const available = mockTables.filter((t) => t.status === "available").length;

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			{/* ── Header (replica del real) ── */}
			<header
				id="waiter-header"
				className="sticky top-0 z-40 flex items-center justify-between px-4"
				style={{
					height: 60,
					background: "rgba(8,8,8,0.95)",
					backdropFilter: "blur(24px)",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
					borderTop: "2px solid #f59e0b",
				}}
			>
				<div className="flex items-center gap-3">
					<div className="w-5 h-5 bg-white rounded-sm" />
					<div className="h-4 w-px bg-white/10" />
					<span className="font-extrabold text-2xl leading-none tracking-widest">
						MESAS
					</span>
				</div>
				<div className="flex items-center gap-2.5">
					{/* Stat pills */}
					<div
						id="stats-pills"
						className="flex items-center gap-2 mr-1 rounded-lg"
					>
						<div
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
							style={{
								background: "rgba(16,185,129,0.12)",
								border: "1px solid rgba(16,185,129,0.3)",
							}}
						>
							<span
								className="w-[7px] h-[7px] rounded-full bg-emerald-500 inline-block"
								style={{ boxShadow: "0 0 6px rgba(16,185,129,0.7)" }}
							/>
							<span className="font-bold text-[11px] uppercase tracking-wide text-emerald-300">
								{available} libres
							</span>
						</div>
						<div
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
							style={{
								background: "rgba(245,158,11,0.12)",
								border: "1px solid rgba(245,158,11,0.3)",
							}}
						>
							<span
								className="w-[7px] h-[7px] rounded-full bg-amber-500 inline-block"
								style={{ boxShadow: "0 0 6px rgba(245,158,11,0.7)" }}
							/>
							<span className="font-bold text-[11px] uppercase tracking-wide text-amber-300">
								{occupied} ocupadas
							</span>
						</div>
					</div>
					{/* Waiter name */}
					<div
						id="waiter-name"
						className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
					>
						<div
							className="w-6 h-6 rounded-lg flex items-center justify-center"
							style={{
								background: "rgba(245,158,11,0.15)",
								border: "1px solid rgba(245,158,11,0.3)",
							}}
						>
							<span className="font-extrabold text-xs leading-none text-amber-400">
								M
							</span>
						</div>
						<span className="text-xs font-semibold">Martin</span>
					</div>
					{/* Bell */}
					<div id="bell-ready" className="relative p-2 rounded-xl">
						<Bell className="w-5 h-5 text-amber-400" />
						<span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-black font-bold text-[9px] leading-none flex items-center justify-center">
							3
						</span>
					</div>
				</div>
			</header>

			{/* ── Zone tabs ── */}
			<div
				id="zone-tabs"
				className="flex gap-2.5 px-4 py-3.5 overflow-x-auto rounded-lg"
				style={{
					borderBottom: "1px solid rgba(255,255,255,0.06)",
					background: "rgba(12,12,12,0.8)",
				}}
			>
				<button
					className="shrink-0 px-6 rounded-full font-bold uppercase tracking-widest"
					style={{
						minHeight: 44,
						fontSize: 12,
						background: "#f59e0b",
						color: "#080808",
						border: "1px solid rgba(245,158,11,0.7)",
						boxShadow: "0 0 16px rgba(245,158,11,0.3)",
					}}
				>
					Salon Principal
				</button>
				<button
					className="shrink-0 px-6 rounded-full font-bold uppercase tracking-widest"
					style={{
						minHeight: 44,
						fontSize: 12,
						background: "rgba(255,255,255,0.03)",
						color: "#a3a3a3",
						border: "1px solid rgba(255,255,255,0.08)",
					}}
				>
					Afuera
				</button>
			</div>

			{/* ── Table grid ── */}
			<div className="p-4 grid grid-cols-2 gap-3">
				{mockTables.map((t, i) => (
					<TableCard
						key={t.number}
						table={t}
						id={
							i === 0
								? "table-card-occupied"
								: i === 1
									? "table-card-available"
									: i === 0
										? "table-total"
										: undefined
						}
					/>
				))}
			</div>

			{/* ── Bottom Navigation ── */}
			<nav
				id="bottom-nav"
				className="sticky bottom-0 flex items-center justify-around rounded-lg"
				style={{
					height: 64,
					background: "rgba(8,8,8,0.97)",
					borderTop: "1px solid rgba(255,255,255,0.06)",
					backdropFilter: "blur(24px)",
				}}
			>
				<button className="flex flex-col items-center gap-0.5">
					<Home className="w-5 h-5 text-amber-400" />
					<span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
						Mesas
					</span>
				</button>
				<button className="flex flex-col items-center gap-0.5 relative">
					<CheckCircle2 className="w-5 h-5 text-[var(--ink-faint)]" />
					<span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">
						Listos
					</span>
					<span className="absolute -top-1 right-0 w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[8px] flex items-center justify-center">
						3
					</span>
				</button>
				<button className="flex flex-col items-center gap-0.5">
					<CreditCard className="w-5 h-5 text-[var(--ink-faint)]" />
					<span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">
						Cuenta
					</span>
				</button>
			</nav>
		</div>
	);
}
