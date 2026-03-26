import { Clock, Users, Wifi } from "lucide-react";

const mockTables = [
	{
		number: 1,
		zone: "Salon Principal",
		status: "occupied",
		total: 12500,
		items: 4,
		minutes: 35,
	},
	{
		number: 2,
		zone: "Salon Principal",
		status: "available",
		total: 0,
		items: 0,
		minutes: 0,
	},
	{
		number: 3,
		zone: "Salon Principal",
		status: "occupied",
		total: 8900,
		items: 3,
		minutes: 18,
	},
	{
		number: 4,
		zone: "Afuera",
		status: "available",
		total: 0,
		items: 0,
		minutes: 0,
	},
	{
		number: 5,
		zone: "Afuera",
		status: "occupied",
		total: 22300,
		items: 7,
		minutes: 52,
	},
	{
		number: 6,
		zone: "Salon Principal",
		status: "available",
		total: 0,
		items: 0,
		minutes: 0,
	},
];

export default function WaiterTablesScreen() {
	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			{/* Top bar */}
			<div className="bg-[var(--bg-secondary)] px-4 py-3 flex items-center justify-between border-b border-white/5">
				<h2 className="font-bold text-lg">Mesas</h2>
				<div className="flex items-center gap-1 text-[var(--success)]">
					<Wifi size={14} />
					<span className="text-xs">En vivo</span>
				</div>
			</div>

			{/* Zone tabs */}
			<div
				id="zone-tabs"
				className="flex gap-2 px-4 py-3 border-b border-white/5 rounded-lg"
			>
				<button className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--brand)] text-white">
					Todas
				</button>
				<button className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-[var(--ink-secondary)]">
					Salon Principal
				</button>
				<button className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-[var(--ink-secondary)]">
					Afuera
				</button>
			</div>

			{/* Table grid */}
			<div className="p-4 grid grid-cols-2 gap-3">
				{mockTables.map((table) => {
					const isOccupied = table.status === "occupied";
					const cardId = isOccupied
						? "table-card-occupied"
						: "table-card-available";
					return (
						<div
							key={table.number}
							id={
								table.number === 1
									? cardId
									: table.number === 2
										? "table-card-available"
										: undefined
							}
							className={`rounded-xl p-4 border transition-all cursor-pointer hover:scale-[1.02] ${
								isOccupied
									? "bg-orange-500/10 border-orange-500/30"
									: "bg-emerald-500/10 border-emerald-500/30"
							}`}
						>
							<div className="flex items-center justify-between mb-2">
								<span className="font-bold text-lg">Mesa {table.number}</span>
								<span
									className={`w-3 h-3 rounded-full ${isOccupied ? "bg-orange-500" : "bg-emerald-500"}`}
								/>
							</div>
							<p className="text-xs text-[var(--ink-faint)] mb-2">
								{table.zone}
							</p>
							{isOccupied && (
								<>
									<div
										id={table.number === 1 ? "table-total" : undefined}
										className="text-lg font-bold text-[var(--brand)] mb-1"
									>
										$ {table.total.toLocaleString("es-AR")}
									</div>
									<div className="flex items-center gap-3 text-xs text-[var(--ink-secondary)]">
										<span className="flex items-center gap-1">
											<Users size={12} /> {table.items} items
										</span>
										<span
											id={table.number === 1 ? "table-timer" : undefined}
											className="flex items-center gap-1"
										>
											<Clock size={12} /> {table.minutes} min
										</span>
									</div>
								</>
							)}
							{!isOccupied && (
								<p className="text-sm text-emerald-400">Disponible</p>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
