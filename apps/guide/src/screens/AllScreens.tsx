import {
	Clock,
	Banknote,
	CreditCard,
	ArrowRightLeft,
	Copy,
	Check,
	ChefHat,
	Volume2,
	AlertTriangle,
	Plus,
	Minus,
	Send,
	Users,
	Truck,
	MapPin,
	Phone,
	FileText,
	TrendingUp,
	Package,
	BarChart3,
	Pencil,
	Trash2,
	ToggleLeft,
	ToggleRight,
	Download,
	Calendar,
	Receipt,
	Home,
	CheckCircle2,
	Bell,
	ArrowLeft,
	Wine,
	ListOrdered,
	LayoutGrid,
	Smartphone,
	ZoomIn,
	ZoomOut,
	Wallet,
	Settings,
} from "lucide-react";

/* ─── Shared Styles ──────────────────────────────────────── */
const headerStyle = {
	background: "rgba(8,8,8,0.95)",
	backdropFilter: "blur(24px)",
	borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const cardBorder = "1px solid rgba(255,255,255,0.06)";

function StatusPill({
	color,
	glow,
	label,
	count,
}: {
	color: string;
	glow: string;
	label: string;
	count: number;
}) {
	return (
		<div
			className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
			style={{
				background: `${color}1F`,
				border: `1px solid ${color}4D`,
			}}
		>
			<span
				className="w-[7px] h-[7px] rounded-full inline-block"
				style={{ background: color, boxShadow: `0 0 6px ${glow}` }}
			/>
			<span
				className="font-bold text-[11px] uppercase tracking-wide"
				style={{ color }}
			>
				{count} {label}
			</span>
		</div>
	);
}

function AdminSidebar({ active }: { active: string }) {
	const sections = [
		{
			title: "GESTIÓN",
			items: [
				"Dashboard",
				"Contabilidad",
				"Delivery",
				"Menu",
				"Mesas",
				"Empleados",
			],
		},
		{
			title: "ADMINISTRACIÓN",
			items: [
				"Proveedores",
				"Facturas",
				"Gastos",
				"Caja",
				"MercadoPago",
				"AFIP",
			],
		},
	];

	return (
		<div
			id="admin-sidebar"
			className="w-[200px] min-h-[500px] p-3 flex-shrink-0"
			style={{
				background: "var(--s1, #0c0c0c)",
				borderRight: cardBorder,
			}}
		>
			<div className="flex items-center gap-2 mb-4 px-2 pt-1">
				<div className="w-5 h-5 bg-white rounded-sm" />
				<span className="font-extrabold text-sm tracking-wider">ADMIN</span>
			</div>
			{sections.map((sec) => (
				<div key={sec.title} className="mb-3">
					<p className="text-[9px] uppercase tracking-[0.2em] text-[#555] font-semibold px-3 mb-1">
						{sec.title}
					</p>
					{sec.items.map((item) => (
						<div
							key={item}
							className="px-3 py-2 rounded-lg text-xs mb-0.5 cursor-pointer"
							style={
								item === active
									? {
											background: "rgba(245,158,11,0.12)",
											color: "#f59e0b",
											fontWeight: 600,
											borderLeft: "3px solid #f59e0b",
										}
									: { color: "#888" }
							}
						>
							{item}
						</div>
					))}
				</div>
			))}
		</div>
	);
}

function SectionCard({
	id,
	title,
	icon,
	children,
	delay = 0,
}: {
	id?: string;
	title: string;
	icon?: React.ReactNode;
	children: React.ReactNode;
	delay?: number;
}) {
	return (
		<div
			id={id}
			className="rounded-2xl overflow-hidden"
			style={{
				background: "var(--s1, #0e0e0e)",
				border: cardBorder,
				boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
				animation: `slideUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
			}}
		>
			{title && (
				<div
					className="flex items-center gap-2 px-5 py-3"
					style={{
						background: "rgba(255,255,255,0.02)",
						borderBottom: cardBorder,
					}}
				>
					{icon}
					<span className="font-bold text-[11px] uppercase tracking-[0.15em]">
						{title}
					</span>
				</div>
			)}
			<div className="p-5">{children}</div>
		</div>
	);
}

function KpiCard({
	id,
	label,
	value,
	subtext,
	color,
	icon,
	idx = 0,
}: {
	id?: string;
	label: string;
	value: string;
	subtext?: string;
	color: string;
	icon: React.ReactNode;
	idx?: number;
}) {
	return (
		<div
			id={id}
			className="relative rounded-2xl overflow-hidden"
			style={{
				background: "var(--s1, #0e0e0e)",
				border: `1px solid ${color}25`,
				animation: `slideUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 80}ms both`,
			}}
		>
			{/* Top glow */}
			<div
				className="absolute top-0 left-0 right-0 h-[1px]"
				style={{
					background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
				}}
			/>
			<div className="p-4">
				<div className="flex items-center gap-2 mb-2">
					<div
						className="w-[34px] h-[34px] rounded-xl flex items-center justify-center"
						style={{
							background: `${color}18`,
							border: `1px solid ${color}30`,
						}}
					>
						{icon}
					</div>
					<span className="text-[10px] uppercase tracking-[0.15em] text-[#777]">
						{label}
					</span>
				</div>
				<p
					className="font-extrabold leading-none"
					style={{ fontSize: 36, color }}
				>
					{value}
				</p>
				{subtext && <p className="text-[11px] text-[#666] mt-1">{subtext}</p>}
			</div>
		</div>
	);
}

/* ─── Waiter: Order ────────────────────────────────────── */
export function WaiterOrderScreen() {
	const categories = [
		{ icon: "🍺", name: "Cervezas" },
		{ icon: "🍸", name: "Tragos" },
		{ icon: "🍕", name: "Pizzas" },
		{ icon: "🥩", name: "Parrilla" },
		{ icon: "🥗", name: "Ensaladas" },
	];
	const products = [
		{ name: "Fernet con Coca", price: 3500, target: "bar" },
		{ name: "Gin Tonic", price: 4200, target: "bar" },
		{ name: "Mojito Clasico", price: 4000, target: "bar" },
		{ name: "Aperol Spritz", price: 4500, target: "bar" },
		{ name: "Cerveza Tirada", price: 2800, target: "bar" },
		{ name: "Negroni", price: 4800, target: "bar" },
	];

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center gap-3 px-4"
				style={{ height: 60, ...headerStyle }}
			>
				<button className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06]">
					<ArrowLeft className="w-4 h-4 text-[var(--ink-faint)]" />
				</button>
				<div className="h-4 w-px bg-white/10" />
				<span
					className="font-extrabold text-amber-400 leading-none"
					style={{ fontSize: 44 }}
				>
					3
				</span>
				<div>
					<span className="font-extrabold text-2xl tracking-widest">
						PEDIDO
					</span>
					<p className="text-[10px] text-[#666]">
						Salon Principal · 4 asientos
					</p>
				</div>
			</header>

			{/* Category tabs */}
			<div
				id="category-tabs"
				className="flex gap-2.5 px-4 py-3.5 overflow-x-auto"
				style={{
					borderBottom: "1px solid rgba(255,255,255,0.06)",
					background: "rgba(12,12,12,0.8)",
				}}
			>
				{categories.map((c, i) => (
					<button
						key={c.name}
						className="shrink-0 px-5 rounded-full font-bold uppercase tracking-widest"
						style={
							i === 1
								? {
										minHeight: 44,
										fontSize: 12,
										background: "#f59e0b",
										color: "#080808",
										border: "1px solid rgba(245,158,11,0.7)",
										boxShadow: "0 0 16px rgba(245,158,11,0.3)",
									}
								: {
										minHeight: 44,
										fontSize: 12,
										background: "rgba(255,255,255,0.03)",
										color: "#a3a3a3",
										border: "1px solid rgba(255,255,255,0.08)",
									}
						}
					>
						{c.icon} {c.name}
					</button>
				))}
			</div>

			{/* Product grid */}
			<div id="product-grid" className="p-4 grid grid-cols-2 gap-2.5">
				{products.map((p, i) => (
					<button
						key={p.name}
						id={i === 0 ? "product-item" : undefined}
						className="rounded-2xl text-left transition-all"
						style={{
							background: "rgba(255,255,255,0.02)",
							border: cardBorder,
							padding: "14px",
							minHeight: 90,
						}}
					>
						<p className="font-bold text-sm mb-1">{p.name}</p>
						<p
							className="font-extrabold text-amber-400"
							style={{
								fontSize: 20,
								textShadow: "0 0 12px rgba(245,158,11,0.2)",
							}}
						>
							$ {p.price.toLocaleString()}
						</p>
						<span className="text-[9px] uppercase tracking-wider text-[#555] mt-1 inline-block">
							🍹 {p.target}
						</span>
					</button>
				))}
			</div>

			{/* Order summary */}
			<div
				id="order-summary"
				className="mx-4 mb-3 rounded-2xl overflow-hidden"
				style={{
					background: "rgba(245,158,11,0.04)",
					border: "1px solid rgba(245,158,11,0.15)",
					boxShadow: "0 0 24px rgba(245,158,11,0.08)",
				}}
			>
				<div
					className="px-4 py-2.5"
					style={{
						background: "rgba(255,255,255,0.03)",
						borderBottom: "1px solid rgba(255,255,255,0.06)",
					}}
				>
					<span className="text-[10px] uppercase tracking-[0.2em] text-[#777] font-semibold">
						Pedido actual · 2 items
					</span>
				</div>
				<div className="divide-y divide-white/5">
					{[
						{ name: "Gin Tonic", qty: 2, price: 8400 },
						{ name: "Fernet con Coca", qty: 1, price: 3500 },
					].map((item) => (
						<div
							key={item.name}
							className="flex items-center justify-between px-4"
							style={{ minHeight: 52 }}
						>
							<div className="flex items-center gap-3">
								<span
									className="font-extrabold text-amber-400"
									style={{ fontSize: 28, width: 28, textAlign: "center" }}
								>
									{item.qty}
								</span>
								<span className="font-bold text-sm">{item.name}</span>
							</div>
							<div className="flex items-center gap-2">
								<span
									className="font-extrabold text-[var(--ink-secondary)]"
									style={{ fontSize: 18 }}
								>
									$ {item.price.toLocaleString()}
								</span>
								<div className="flex items-center gap-1 ml-2">
									<button
										className="w-7 h-7 rounded-lg flex items-center justify-center"
										style={{
											background: "rgba(255,255,255,0.04)",
											border: "1px solid rgba(255,255,255,0.08)",
										}}
									>
										<Minus size={12} />
									</button>
									<button
										className="w-7 h-7 rounded-lg flex items-center justify-center"
										style={{
											background: "rgba(245,158,11,0.1)",
											border: "1px solid rgba(245,158,11,0.3)",
										}}
									>
										<Plus size={12} className="text-amber-400" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
				<div
					id="notes-field"
					className="px-4 py-3"
					style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
				>
					<div
						className="rounded-xl px-4 py-2.5 text-xs italic text-amber-400/70"
						style={{
							background: "rgba(245,158,11,0.05)",
							border: "1px solid rgba(245,158,11,0.15)",
						}}
					>
						📝 "Sin hielo en el Gin Tonic"
					</div>
				</div>
				{/* Total */}
				<div
					className="px-4 py-4 text-center"
					style={{ background: "rgba(245,158,11,0.05)" }}
				>
					<span className="text-[10px] uppercase tracking-[0.2em] text-[#777]">
						Total
					</span>
					<p
						className="font-extrabold text-amber-400"
						style={{
							fontSize: 48,
							textShadow: "0 0 28px rgba(245,158,11,0.35)",
						}}
					>
						$ 11.900
					</p>
				</div>
			</div>

			{/* Send button */}
			<div className="px-4 pb-4">
				<button
					id="send-button"
					className="w-full font-bold flex items-center justify-center gap-2 text-white"
					style={{
						minHeight: 64,
						fontSize: 16,
						borderRadius: 16,
						background: "#f59e0b",
						border: "1px solid rgba(245,158,11,0.7)",
						boxShadow:
							"0 0 32px rgba(245,158,11,0.3), 0 4px 18px rgba(0,0,0,0.4)",
					}}
				>
					<Send size={18} /> ENVIAR PEDIDO · $ 11.900
				</button>
			</div>

			{/* Bottom nav */}
			<nav
				className="sticky bottom-0 flex items-center justify-around"
				style={{
					height: 64,
					background: "rgba(8,8,8,0.97)",
					borderTop: "1px solid rgba(255,255,255,0.06)",
					backdropFilter: "blur(24px)",
				}}
			>
				<button className="flex flex-col items-center gap-0.5">
					<Home className="w-5 h-5 text-[var(--ink-faint)]" />
					<span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">
						Mesas
					</span>
				</button>
				<button className="flex flex-col items-center gap-0.5">
					<CheckCircle2 className="w-5 h-5 text-[var(--ink-faint)]" />
					<span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">
						Listos
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

/* ─── Waiter: Ready ────────────────────────────────────── */
export function WaiterReadyScreen() {
	const readyGroups = [
		{
			table: 1,
			items: [
				{ name: "Pizza Muzza", qty: 1, from: "Cocina", minutes: 5 },
				{ name: "Milanesa Napolitana", qty: 1, from: "Cocina", minutes: 8 },
			],
		},
		{
			table: 3,
			items: [{ name: "Gin Tonic", qty: 2, from: "Barra", minutes: 2 }],
		},
		{
			table: 5,
			items: [{ name: "Fernet con Coca", qty: 1, from: "Barra", minutes: 1 }],
		},
	];
	const totalItems = readyGroups.reduce((sum, g) => sum + g.items.length, 0);

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center justify-between px-4"
				style={{ height: 60, ...headerStyle }}
			>
				<div className="flex items-center gap-3">
					<div
						className="w-12 h-12 rounded-xl flex items-center justify-center"
						style={{
							background: "rgba(16,185,129,0.15)",
							border: "1px solid rgba(16,185,129,0.4)",
						}}
					>
						<Bell className="w-5 h-5 text-emerald-400" />
					</div>
					<div>
						<span className="font-extrabold text-xl tracking-widest">
							LISTOS PARA SERVIR
						</span>
						<p className="text-[10px] text-[#666]">
							{totalItems} items esperando retiro
						</p>
					</div>
				</div>
				<div
					className="w-[52px] h-[52px] rounded-xl flex items-center justify-center"
					style={{
						background: "rgba(16,185,129,0.15)",
						border: "1px solid rgba(16,185,129,0.4)",
						boxShadow: "0 0 20px rgba(16,185,129,0.3)",
					}}
				>
					<span
						className="font-extrabold text-emerald-400"
						style={{ fontSize: 28 }}
					>
						{totalItems}
					</span>
				</div>
			</header>

			{/* Ready groups */}
			<div id="ready-list" className="p-4 space-y-4">
				{readyGroups.map((group, gi) => (
					<div
						key={group.table}
						id={gi === 0 ? "ready-item" : undefined}
						className="rounded-2xl overflow-hidden"
						style={{
							border: "1px solid rgba(16,185,129,0.2)",
							boxShadow:
								"0 0 28px rgba(16,185,129,0.14), 0 2px 18px rgba(0,0,0,0.45)",
						}}
					>
						{/* Table header */}
						<div
							className="flex items-center justify-between px-4 py-3"
							style={{
								background: "rgba(16,185,129,0.09)",
								borderBottom: "1px solid rgba(255,255,255,0.06)",
							}}
						>
							<div className="flex items-center gap-3">
								<span
									id={gi === 0 ? "ready-table-badge" : undefined}
									className="font-extrabold text-emerald-400"
									style={{
										fontSize: 56,
										textShadow: "0 0 20px rgba(16,185,129,0.5)",
									}}
								>
									{group.table}
								</span>
								<div>
									<span className="text-[10px] uppercase tracking-[0.2em] text-[#666]">
										Mesa
									</span>
									<p className="text-sm font-bold text-emerald-300">
										{group.items.length} item{group.items.length > 1 ? "s" : ""}{" "}
										listo{group.items.length > 1 ? "s" : ""}
									</p>
								</div>
							</div>
							<span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
								● Listo
							</span>
						</div>
						{/* Items */}
						<div className="divide-y divide-white/5">
							{group.items.map((item, ii) => (
								<div
									key={ii}
									className="flex items-center justify-between px-4"
									style={{ minHeight: 76, padding: "14px 16px" }}
								>
									<div className="flex items-center gap-3">
										<span
											className="font-extrabold text-emerald-400"
											style={{ fontSize: 34, width: 36, textAlign: "center" }}
										>
											{item.qty}
										</span>
										<div>
											<p className="font-bold text-sm">{item.name}</p>
											<p className="text-[10px] text-[#666]">{item.from}</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<span
											id={gi === 0 && ii === 0 ? "ready-timer" : undefined}
											className={`text-xs flex items-center gap-1 ${item.minutes > 5 ? "text-red-400" : "text-[#666]"}`}
										>
											<Clock size={12} /> {item.minutes} min
										</span>
										<button
											className="rounded-xl font-bold text-xs text-white flex items-center gap-1.5"
											style={{
												minWidth: 110,
												minHeight: 52,
												padding: "0 16px",
												background: "#10b981",
												border: "1px solid rgba(16,185,129,0.5)",
												boxShadow: "0 0 18px rgba(16,185,129,0.35)",
											}}
										>
											<Check size={14} /> Entregar
										</button>
									</div>
								</div>
							))}
						</div>
						{group.items.length > 1 && (
							<div
								className="px-4 py-3"
								style={{
									background: "rgba(16,185,129,0.06)",
									borderTop: "1px solid rgba(255,255,255,0.06)",
								}}
							>
								<button
									className="w-full font-bold text-sm text-emerald-300 rounded-xl flex items-center justify-center gap-2"
									style={{
										minHeight: 52,
										background: "rgba(16,185,129,0.2)",
										border: "1px solid rgba(16,185,129,0.4)",
										boxShadow: "0 0 16px rgba(16,185,129,0.2)",
									}}
								>
									<Check size={16} /> Entregar Todo
								</button>
							</div>
						)}
					</div>
				))}
			</div>

			{/* Bottom nav */}
			<nav
				className="sticky bottom-0 flex items-center justify-around"
				style={{
					height: 64,
					background: "rgba(8,8,8,0.97)",
					borderTop: "1px solid rgba(255,255,255,0.06)",
					backdropFilter: "blur(24px)",
				}}
			>
				<button className="flex flex-col items-center gap-0.5">
					<Home className="w-5 h-5 text-[var(--ink-faint)]" />
					<span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">
						Mesas
					</span>
				</button>
				<button className="flex flex-col items-center gap-0.5 relative">
					<CheckCircle2 className="w-5 h-5 text-emerald-400" />
					<span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
						Listos
					</span>
					<span className="absolute -top-1 right-0 w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[8px] flex items-center justify-center">
						{totalItems}
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

/* ─── Waiter: Payment ──────────────────────────────────── */
export function WaiterPaymentScreen() {
	const items = [
		{ name: "Gin Tonic", qty: 2, price: 8400 },
		{ name: "Pizza Muzza", qty: 1, price: 4500 },
		{ name: "Fernet con Coca", qty: 2, price: 7000 },
		{ name: "Papas Fritas", qty: 1, price: 2400 },
	];
	const subtotal = items.reduce((s, i) => s + i.price, 0);
	const iva = Math.round(subtotal * 0.21);
	const total = subtotal + iva;

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center justify-between px-4"
				style={{ height: 60, ...headerStyle }}
			>
				<div className="flex items-center gap-3">
					<button className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06]">
						<ArrowLeft className="w-4 h-4 text-[var(--ink-faint)]" />
					</button>
					<div className="h-4 w-px bg-white/10" />
					<span
						className="font-extrabold text-amber-400 leading-none"
						style={{ fontSize: 44 }}
					>
						5
					</span>
					<div>
						<span className="font-extrabold text-2xl tracking-widest">
							CUENTA
						</span>
						<p className="text-[10px] text-[#666]">Afuera · 52 min</p>
					</div>
				</div>
				<CreditCard className="w-5 h-5 text-[#555]" />
			</header>

			{/* Order summary card */}
			<div className="p-4 space-y-4">
				<div
					className="rounded-2xl overflow-hidden"
					style={{
						border: cardBorder,
						boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
					}}
				>
					<div
						className="px-4 py-2.5"
						style={{
							background: "rgba(255,255,255,0.03)",
							borderBottom: cardBorder,
						}}
					>
						<span className="text-[10px] uppercase tracking-[0.2em] text-[#666] font-semibold">
							Detalle del pedido
						</span>
					</div>
					<div className="divide-y divide-white/5">
						{items.map((item) => (
							<div
								key={item.name}
								className="flex items-center justify-between px-4"
								style={{ minHeight: 52 }}
							>
								<div className="flex items-center gap-3">
									<span
										className="font-extrabold text-amber-400"
										style={{ fontSize: 28, width: 28, textAlign: "center" }}
									>
										{item.qty}
									</span>
									<span className="font-bold text-sm">{item.name}</span>
								</div>
								<span
									className="font-extrabold text-[var(--ink-secondary)]"
									style={{ fontSize: 18 }}
								>
									$ {item.price.toLocaleString("es-AR")}
								</span>
							</div>
						))}
					</div>
					{/* Subtotal + IVA */}
					<div
						className="px-4 pt-3 pb-1"
						style={{ background: "rgba(255,255,255,0.03)" }}
					>
						<div className="flex justify-between text-xs text-[#666] mb-1">
							<span>Subtotal</span>
							<span>$ {subtotal.toLocaleString("es-AR")}</span>
						</div>
						<div className="flex justify-between text-xs text-[#666]">
							<span>IVA 21%</span>
							<span>$ {iva.toLocaleString("es-AR")}</span>
						</div>
					</div>
					{/* Total */}
					<div
						id="payment-total"
						className="text-center py-5"
						style={{ background: "rgba(245,158,11,0.05)" }}
					>
						<span className="text-[10px] uppercase tracking-[0.2em] text-[#777]">
							Total a cobrar
						</span>
						<p
							className="font-extrabold text-amber-400"
							style={{
								fontSize: 64,
								textShadow: "0 0 28px rgba(245,158,11,0.35)",
							}}
						>
							$ {total.toLocaleString("es-AR")}
						</p>
					</div>
				</div>

				{/* Payment method select */}
				<div id="payment-table-select" className="hidden" />
				<div className="grid grid-cols-2 gap-2.5">
					{[
						{
							id: "payment-cash",
							icon: Banknote,
							label: "EFECTIVO",
							active: false,
							color: "#10b981",
						},
						{
							id: "payment-mp",
							icon: Smartphone,
							label: "MERCADOPAGO",
							active: true,
							color: "#009ee3",
						},
						{
							id: "payment-card",
							icon: CreditCard,
							label: "TARJETA",
							active: false,
							color: "#8b5cf6",
						},
						{
							id: "payment-transfer",
							icon: ArrowRightLeft,
							label: "TRANSFERENCIA",
							active: false,
							color: "#f59e0b",
						},
					].map((m) => (
						<button
							key={m.id}
							id={m.id}
							className="rounded-2xl text-left transition-all"
							style={
								m.active
									? {
											minHeight: 90,
											padding: "14px",
											background: "#f59e0b",
											border: "1px solid rgba(245,158,11,0.7)",
											boxShadow:
												"0 0 28px rgba(245,158,11,0.4), 0 2px 12px rgba(0,0,0,0.4)",
										}
									: {
											minHeight: 90,
											padding: "14px",
											background: "rgba(255,255,255,0.02)",
											border: cardBorder,
										}
							}
						>
							<div
								className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
								style={
									m.active
										? { background: "rgba(0,0,0,0.2)" }
										: {
												background: "rgba(255,255,255,0.04)",
												border: cardBorder,
											}
								}
							>
								<m.icon
									size={20}
									style={{ color: m.active ? "#080808" : "#6b6b6b" }}
								/>
							</div>
							<span
								className="font-bold text-[11px] uppercase tracking-wider"
								style={{ color: m.active ? "#080808" : "#6b6b6b" }}
							>
								{m.label}
							</span>
						</button>
					))}
				</div>

				{/* QR Display */}
				<div
					id="payment-qr-display"
					className="rounded-2xl p-6 text-center"
					style={{
						border: "1px solid rgba(0,158,227,0.3)",
						background: "rgba(0,158,227,0.05)",
					}}
				>
					<div className="w-[180px] h-[180px] mx-auto bg-white rounded-2xl p-4 mb-3">
						<div className="w-full h-full bg-[repeating-conic-gradient(#000_0%_25%,#fff_0%_50%)] bg-[length:10px_10px] rounded-lg opacity-70" />
					</div>
					<div className="flex items-center justify-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[#009ee3] animate-pulse" />
						<p className="text-xs text-[#009ee3] font-medium">
							Esperando pago del cliente...
						</p>
					</div>
				</div>

				{/* Transfer alias */}
				<div
					id="payment-alias-display"
					className="rounded-2xl p-4"
					style={{
						border: "1px solid rgba(245,158,11,0.3)",
						background: "rgba(245,158,11,0.05)",
					}}
				>
					<p className="text-xs text-[#777] mb-2">Alias para transferir</p>
					<div className="flex items-center justify-between">
						<span
							className="font-extrabold text-amber-400"
							style={{ fontSize: 20 }}
						>
							myway.bar
						</span>
						<button
							className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
							style={{
								background: "rgba(245,158,11,0.15)",
								border: "1px solid rgba(245,158,11,0.3)",
								color: "#f59e0b",
							}}
						>
							<Copy size={12} /> Copiar
						</button>
					</div>
				</div>

				{/* Confirm */}
				<button
					className="w-full font-bold text-white flex items-center justify-center gap-2"
					style={{
						minHeight: 64,
						fontSize: 16,
						borderRadius: 16,
						background: "#f59e0b",
						border: "1px solid rgba(245,158,11,0.7)",
						boxShadow:
							"0 0 32px rgba(245,158,11,0.3), 0 4px 18px rgba(0,0,0,0.4)",
					}}
				>
					COBRAR · $ {total.toLocaleString("es-AR")}
				</button>
			</div>
		</div>
	);
}

/* ─── KDS: Kitchen / Bar Board ─────────────────────────── */
export function KDSBoardScreen({ variant }: { variant: "kitchen" | "bar" }) {
	const isKitchen = variant === "kitchen";
	const brandColor = isKitchen ? "#f59e0b" : "#3b82f6";
	const title = isKitchen ? "COCINA" : "BAR";
	const subtitle = isKitchen ? "Kitchen Display System" : "Bar Display System";

	const pendingOrders = [
		{
			table: 3,
			items: isKitchen
				? [
						{ name: "Pizza Muzza", qty: 1, notes: "" },
						{
							name: "Milanesa Napo",
							qty: 1,
							notes: "Sin cebolla en la milanga",
						},
					]
				: [
						{ name: "Gin Tonic", qty: 2, notes: "Con pepino" },
						{ name: "Fernet", qty: 1, notes: "" },
					],
			minutes: 3,
		},
		{
			table: 5,
			items: isKitchen
				? [{ name: "Hamburguesa Completa", qty: 1, notes: "Bien cocida" }]
				: [
						{ name: "Aperol Spritz", qty: 1, notes: "" },
						{ name: "Mojito", qty: 1, notes: "Sin azucar" },
					],
			minutes: 1,
		},
	];
	const preparingOrders = [
		{
			table: 1,
			items: isKitchen
				? [{ name: "Empanadas", qty: 6, notes: "" }]
				: [{ name: "Cerveza Tirada", qty: 3, notes: "" }],
			minutes: 8,
		},
	];

	const statusColors = {
		pending: {
			border: "#f59e0b",
			bg: "rgba(245,158,11,0.08)",
			glow: "rgba(245,158,11,0.12)",
		},
		preparing: {
			border: "#3b82f6",
			bg: "rgba(59,130,246,0.08)",
			glow: "rgba(59,130,246,0.12)",
		},
		ready: {
			border: "#10b981",
			bg: "rgba(16,185,129,0.08)",
			glow: "rgba(16,185,129,0.12)",
		},
	};

	function OrderCard({
		order,
		status,
		idx,
	}: {
		order: (typeof pendingOrders)[0];
		status: "pending" | "preparing";
		idx: number;
	}) {
		const sc = statusColors[status];
		const urgent = order.minutes > 10;
		const warning = order.minutes > 5;
		return (
			<div
				id={idx === 0 && status === "pending" ? "kds-order-card" : undefined}
				className="rounded-2xl overflow-hidden"
				style={{
					borderLeft: `5px solid ${sc.border}`,
					border: `1px solid ${sc.border}30`,
					borderLeftWidth: 5,
					borderLeftColor: sc.border,
					background: sc.bg,
					boxShadow: `0 0 28px ${sc.glow}`,
				}}
			>
				{/* Card header */}
				<div className="flex items-center justify-between px-4 py-3">
					<span
						className="font-extrabold"
						style={{
							fontSize: 52,
							color: urgent ? "#ef4444" : warning ? "#f59e0b" : "var(--ink)",
						}}
					>
						{order.table}
					</span>
					<div className="text-right">
						<span
							className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
							style={{
								background: `${sc.border}20`,
								color: sc.border,
								border: `1px solid ${sc.border}40`,
							}}
						>
							{status === "pending" ? "Pendiente" : "Preparando"}
						</span>
						<p
							id={idx === 0 && status === "pending" ? "kds-timer" : undefined}
							className="flex items-center gap-1 justify-end mt-1"
							style={{
								color: urgent ? "#ef4444" : warning ? "#f59e0b" : "#666",
							}}
						>
							<Clock size={12} />
							<span className="text-xs font-bold">{order.minutes} min</span>
						</p>
					</div>
				</div>
				{/* Items */}
				<div className="px-4 pb-3 space-y-2">
					{order.items.map((item, ii) => (
						<div key={ii} className="flex items-start gap-2">
							<span
								className="font-extrabold"
								style={{
									fontSize: 28,
									color: isKitchen ? "#f59e0b" : "#60a5fa",
									width: 28,
									textAlign: "center",
								}}
							>
								{item.qty}
							</span>
							<div className="flex-1">
								<p className="font-bold text-sm">{item.name}</p>
								{item.notes && (
									<p
										id={idx === 0 && ii === 0 ? "kds-item-notes" : undefined}
										className="text-xs italic mt-0.5"
										style={{ color: "#f59e0b" }}
									>
										📝 "{item.notes}"
									</p>
								)}
							</div>
						</div>
					))}
				</div>
				{/* Action buttons */}
				{status === "pending" && (
					<div className="px-4 pb-3">
						<button
							className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
							style={{
								background: "rgba(59,130,246,0.15)",
								border: "1px solid rgba(59,130,246,0.4)",
								color: "#60a5fa",
							}}
						>
							INICIAR TODO →
						</button>
					</div>
				)}
				{status === "preparing" && (
					<div className="px-4 pb-3">
						<button
							id={idx === 0 ? "kds-mark-ready" : undefined}
							className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
							style={{
								background: "rgba(16,185,129,0.15)",
								border: "1px solid rgba(16,185,129,0.4)",
								color: "#34d399",
							}}
						>
							<Check size={14} className="inline mr-1" /> TODO LISTO ✓
						</button>
					</div>
				)}
			</div>
		);
	}

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			{/* Header */}
			<header
				className="sticky top-0 z-40 flex items-center justify-between px-4"
				style={{
					height: 64,
					...headerStyle,
					borderTop: `2px solid ${brandColor}`,
				}}
			>
				<div className="flex items-center gap-3">
					{isKitchen ? (
						<ChefHat className="w-6 h-6" style={{ color: brandColor }} />
					) : (
						<Wine className="w-6 h-6" style={{ color: brandColor }} />
					)}
					<div>
						<span className="font-extrabold text-xl tracking-widest">
							{title}
						</span>
						<p className="text-[10px] text-[#555]">{subtitle}</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-right">
						<p
							className="font-extrabold text-lg"
							style={{ fontVariantNumeric: "tabular-nums" }}
						>
							22:45
						</p>
						<p className="text-[10px] text-[#555]">En vivo</p>
					</div>
					<div
						id="kds-sound-indicator"
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
						style={{
							background: "rgba(16,185,129,0.1)",
							border: "1px solid rgba(16,185,129,0.3)",
						}}
					>
						<Volume2 size={14} className="text-emerald-400" />
						<span className="text-xs text-emerald-400 font-medium">ON</span>
					</div>
				</div>
			</header>

			{/* Filter tabs */}
			<div
				className="flex gap-2 px-4 py-3"
				style={{
					borderBottom: "1px solid rgba(255,255,255,0.06)",
					background: "rgba(12,12,12,0.8)",
				}}
			>
				{[
					{ label: "Todos", count: 3, active: true },
					{ label: "Pendientes", count: 2, color: "#f59e0b" },
					{ label: "Preparando", count: 1, color: "#3b82f6" },
					{ label: "Listos", count: 0, color: "#10b981" },
				].map((tab) => (
					<button
						key={tab.label}
						className="shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider"
						style={
							tab.active
								? {
										background: `${brandColor}20`,
										color: brandColor,
										border: `1px solid ${brandColor}40`,
									}
								: {
										background: "rgba(255,255,255,0.03)",
										color: "#888",
										border: "1px solid rgba(255,255,255,0.08)",
									}
						}
					>
						{tab.label}{" "}
						<span
							className="ml-1 px-1.5 py-0.5 rounded-full text-[9px]"
							style={{
								background: tab.active
									? `${brandColor}30`
									: "rgba(255,255,255,0.05)",
							}}
						>
							{tab.count}
						</span>
					</button>
				))}
			</div>

			{/* Orders grid */}
			<div className="grid grid-cols-2 gap-0 min-h-[400px]">
				<div
					id="kds-pending-column"
					className="border-r border-white/5 p-3 space-y-3"
				>
					<h3 className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold text-center mb-2">
						Pendientes ({pendingOrders.length})
					</h3>
					{pendingOrders.map((order, i) => (
						<OrderCard key={i} order={order} status="pending" idx={i} />
					))}
				</div>
				<div id="kds-preparing-column" className="p-3 space-y-3">
					<h3 className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold text-center mb-2">
						Preparando ({preparingOrders.length})
					</h3>
					{preparingOrders.map((order, i) => (
						<OrderCard key={i} order={order} status="preparing" idx={i} />
					))}
				</div>
			</div>

			{/* Bottom stats bar */}
			<div
				className="flex items-center justify-around px-4"
				style={{
					height: 56,
					background: "rgba(8,8,8,0.97)",
					borderTop: "1px solid rgba(255,255,255,0.06)",
				}}
			>
				{[
					{
						label: "Pendientes",
						count: pendingOrders.length,
						color: "#f59e0b",
					},
					{
						label: "Preparando",
						count: preparingOrders.length,
						color: "#3b82f6",
					},
					{ label: "Listos", count: 0, color: "#10b981" },
				].map((s) => (
					<div key={s.label} className="flex items-center gap-2">
						<span
							className="w-2 h-2 rounded-full"
							style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
						/>
						<span className="text-[10px] uppercase tracking-wider text-[#666]">
							{s.label}
						</span>
						<span className="font-extrabold text-xl" style={{ color: s.color }}>
							{s.count}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─── Stock Screen ─────────────────────────────────────── */
export function StockScreen({ variant }: { variant: "kitchen" | "bar" }) {
	const isKitchen = variant === "kitchen";
	const brandColor = isKitchen ? "#f59e0b" : "#3b82f6";
	const items =
		variant === "kitchen"
			? [
					{ name: "Harina 000", current: 8, threshold: 3, unit: "kg" },
					{ name: "Mozzarella", current: 2.5, threshold: 2, unit: "kg" },
					{ name: "Carne vacuna", current: 1.8, threshold: 2, unit: "kg" },
					{ name: "Tomate triturado", current: 5, threshold: 2, unit: "lt" },
				]
			: [
					{ name: "Gin Bombay", current: 820, threshold: 1000, unit: "ml" },
					{ name: "Fernet Branca", current: 3500, threshold: 1000, unit: "ml" },
					{ name: "Vodka Absolut", current: 1500, threshold: 500, unit: "ml" },
					{ name: "Tonica Schweppes", current: 12, threshold: 6, unit: "u" },
				];

	const getLevel = (current: number, threshold: number) => {
		const ratio = current / threshold;
		if (ratio < 1) return { color: "#ef4444", label: "Critico" };
		if (ratio < 1.5) return { color: "#f59e0b", label: "Bajo" };
		return { color: "#10b981", label: "OK" };
	};

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 400 }}
		>
			<header
				className="sticky top-0 z-40 flex items-center justify-between px-4"
				style={{
					height: 60,
					...headerStyle,
					borderTop: `2px solid ${brandColor}`,
				}}
			>
				<div className="flex items-center gap-3">
					{isKitchen ? (
						<ChefHat className="w-5 h-5" style={{ color: brandColor }} />
					) : (
						<Wine className="w-5 h-5" style={{ color: brandColor }} />
					)}
					<span className="font-extrabold text-xl tracking-widest">
						STOCK {isKitchen ? "COCINA" : "BARRA"}
					</span>
				</div>
				<div className="flex items-center gap-2">
					{items.filter((i) => i.current < i.threshold).length > 0 && (
						<span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold">
							<AlertTriangle size={12} />{" "}
							{items.filter((i) => i.current < i.threshold).length} alertas
						</span>
					)}
				</div>
			</header>
			<div id="stock-list" className="p-4 space-y-3">
				{items.map((item, i) => {
					const level = getLevel(item.current, item.threshold);
					const pct = Math.min(
						(item.current / (item.threshold * 2)) * 100,
						100,
					);
					return (
						<div
							key={item.name}
							id={
								i === 0
									? `stock-bar-${level.color === "#10b981" ? "green" : level.color === "#f59e0b" ? "yellow" : "red"}`
									: i === 1
										? "stock-bar-yellow"
										: i === 2
											? "stock-bar-red"
											: undefined
							}
							className="rounded-2xl p-4"
							style={{
								background: `${level.color}08`,
								border: `1px solid ${level.color}25`,
								boxShadow: `0 0 16px ${level.color}10`,
							}}
						>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<span
										className="w-2 h-2 rounded-full"
										style={{ background: level.color }}
									/>
									<span className="font-bold text-sm">{item.name}</span>
								</div>
								<div className="flex items-center gap-2">
									<span
										className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
										style={{
											background: `${level.color}20`,
											color: level.color,
										}}
									>
										{level.label}
									</span>
									{level.color === "#ef4444" && (
										<AlertTriangle size={14} className="text-red-400" />
									)}
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
									<div
										className="h-full rounded-full transition-all"
										style={{ width: `${pct}%`, background: level.color }}
									/>
								</div>
								<span
									className="font-extrabold text-sm"
									style={{ color: level.color }}
								>
									{item.current} {item.unit}
								</span>
							</div>
							<p className="text-[10px] text-[#555] mt-1">
								Mínimo: {item.threshold} {item.unit}
							</p>
						</div>
					);
				})}
			</div>
		</div>
	);
}

/* ─── POS Salon ────────────────────────────────────────── */
export function POSSalonScreen() {
	const tables = [
		{
			n: 1,
			x: 8,
			y: 8,
			w: 16,
			h: 16,
			status: "occupied",
			total: 12500,
			elapsed: "25m",
		},
		{
			n: 2,
			x: 32,
			y: 8,
			w: 16,
			h: 16,
			status: "available",
			total: 0,
			elapsed: "",
		},
		{
			n: 3,
			x: 56,
			y: 8,
			w: 16,
			h: 16,
			status: "occupied",
			total: 8900,
			elapsed: "18m",
		},
		{
			n: 4,
			x: 80,
			y: 8,
			w: 16,
			h: 16,
			status: "reserved",
			total: 0,
			elapsed: "",
		},
		{
			n: 5,
			x: 8,
			y: 45,
			w: 16,
			h: 16,
			status: "occupied",
			total: 22300,
			elapsed: "52m",
		},
		{
			n: 6,
			x: 32,
			y: 45,
			w: 16,
			h: 16,
			status: "available",
			total: 0,
			elapsed: "",
		},
		{
			n: 7,
			x: 56,
			y: 45,
			w: 22,
			h: 16,
			status: "available",
			total: 0,
			elapsed: "",
			type: "pool",
		},
	];

	const statusConfig: Record<
		string,
		{ border: string; bg: string; text: string; label: string }
	> = {
		available: {
			border: "#10b981",
			bg: "rgba(16,185,129,0.08)",
			text: "#10b981",
			label: "LIBRE",
		},
		occupied: {
			border: "#f59e0b",
			bg: "rgba(245,158,11,0.08)",
			text: "#f59e0b",
			label: "",
		},
		reserved: {
			border: "#8b5cf6",
			bg: "rgba(139,92,246,0.07)",
			text: "#8b5cf6",
			label: "RESERV.",
		},
	};

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			{/* Header with zone tabs + stats */}
			<header
				className="sticky top-0 z-40 flex items-center justify-between px-4"
				style={{ height: 64, ...headerStyle }}
			>
				<div className="flex items-center gap-3">
					<LayoutGrid className="w-5 h-5 text-amber-400" />
					<span className="font-extrabold text-xl tracking-widest">SALON</span>
				</div>
				<div className="flex items-center gap-2">
					<StatusPill
						color="#10b981"
						glow="rgba(16,185,129,0.7)"
						label="libres"
						count={3}
					/>
					<StatusPill
						color="#f59e0b"
						glow="rgba(245,158,11,0.7)"
						label="ocupadas"
						count={3}
					/>
					<StatusPill
						color="#8b5cf6"
						glow="rgba(139,92,246,0.7)"
						label="reserv."
						count={1}
					/>
				</div>
			</header>

			<div className="flex">
				{/* Quick panel left */}
				<div
					className="w-[140px] flex-shrink-0 p-3"
					style={{ borderRight: cardBorder, background: "rgba(12,12,12,0.5)" }}
				>
					<p className="text-[9px] uppercase tracking-[0.2em] text-[#555] mb-2 font-bold">
						Comidas
					</p>
					{["Pizza Muzza", "Milanesa", "Empanadas"].map((p) => (
						<div
							key={p}
							className="text-xs py-2 px-2.5 rounded-lg mb-1 cursor-grab"
							style={{
								background: "rgba(255,255,255,0.02)",
								border: cardBorder,
							}}
						>
							{p}
						</div>
					))}
					<p className="text-[9px] uppercase tracking-[0.2em] text-[#555] mb-2 mt-3 font-bold">
						Bebidas
					</p>
					{["Gin Tonic", "Fernet", "Cerveza"].map((p) => (
						<div
							key={p}
							className="text-xs py-2 px-2.5 rounded-lg mb-1 cursor-grab"
							style={{
								background: "rgba(255,255,255,0.02)",
								border: cardBorder,
							}}
						>
							{p}
						</div>
					))}
				</div>

				{/* Floor plan */}
				<div className="flex-1 flex flex-col">
					<div
						id="pos-floor-plan"
						className="relative flex-1 m-3 rounded-xl"
						style={{
							minHeight: 300,
							background:
								"radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)",
							backgroundSize: "20px 20px",
							border: "1px solid rgba(255,255,255,0.04)",
						}}
					>
						{tables.map((t) => {
							const sc = statusConfig[t.status];
							const isPool = (t as { type?: string }).type === "pool";
							return (
								<div
									key={t.n}
									id={
										t.n === 2
											? "pos-table-green"
											: t.n === 3
												? "pos-table-red"
												: undefined
									}
									className="absolute rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105"
									style={{
										left: `${t.x}%`,
										top: `${t.y}%`,
										width: `${t.w}%`,
										height: `${t.h}%`,
										background: isPool
											? "linear-gradient(135deg, #1a5c2e, #0f4420)"
											: sc.bg,
										border: `2px solid ${sc.border}`,
										boxShadow: `0 0 12px ${sc.border}30`,
										borderRadius: isPool ? 12 : 12,
									}}
								>
									<span
										className="font-extrabold leading-none"
										style={{
											fontSize: 32,
											color: isPool ? "#4ade80" : sc.text,
											textShadow: `0 0 10px ${sc.border}50`,
										}}
									>
										{t.n}
									</span>
									<span
										className="text-[8px] font-bold uppercase"
										style={{ color: sc.text }}
									>
										{t.status === "occupied" ? t.elapsed : sc.label}
									</span>
									{t.status === "occupied" && (
										<span className="text-[8px] text-amber-400 mt-0.5">
											$ {t.total.toLocaleString("es-AR")}
										</span>
									)}
								</div>
							);
						})}
						{/* Zoom controls */}
						<div
							id="pos-zoom-controls"
							className="absolute bottom-3 right-3 flex gap-1"
						>
							<button
								className="w-8 h-8 rounded-lg flex items-center justify-center"
								style={{
									background: "rgba(255,255,255,0.05)",
									border: cardBorder,
								}}
							>
								<ZoomOut size={14} className="text-[#666]" />
							</button>
							<button
								className="w-8 h-8 rounded-lg flex items-center justify-center"
								style={{
									background: "rgba(255,255,255,0.05)",
									border: cardBorder,
								}}
							>
								<ZoomIn size={14} className="text-[#666]" />
							</button>
						</div>
					</div>
				</div>

				{/* Right panel */}
				<div
					id="pos-panel"
					className="w-[200px] flex-shrink-0 p-3"
					style={{ borderLeft: cardBorder, background: "rgba(12,12,12,0.5)" }}
				>
					<div className="flex items-center gap-2 mb-3">
						<span className="font-extrabold text-2xl text-amber-400">3</span>
						<div>
							<p className="text-xs font-bold">Mesa 3</p>
							<p className="text-[10px] text-[#555]">Salon · 18m</p>
						</div>
					</div>
					<div className="space-y-1 text-xs mb-3">
						{[
							{ name: "Gin Tonic x2", price: "$8.400" },
							{ name: "Pizza Muzza", price: "$4.500" },
						].map((item) => (
							<div
								key={item.name}
								className="flex justify-between py-1.5"
								style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
							>
								<span className="text-[#aaa]">{item.name}</span>
								<span className="font-bold">{item.price}</span>
							</div>
						))}
						<div className="flex justify-between pt-2 font-bold">
							<span>Total</span>
							<span className="text-amber-400">$12.900</span>
						</div>
					</div>
					<div id="pos-pay-buttons" className="grid grid-cols-2 gap-1.5">
						{[
							{ label: "Efectivo", color: "#10b981" },
							{ label: "Tarjeta", color: "#8b5cf6" },
							{ label: "MP QR", color: "#009ee3" },
							{ label: "Transfer", color: "#f59e0b" },
						].map((m) => (
							<button
								key={m.label}
								className="py-2 rounded-xl text-[10px] font-bold"
								style={{
									background: `${m.color}15`,
									border: `1px solid ${m.color}40`,
									color: m.color,
								}}
							>
								{m.label}
							</button>
						))}
					</div>
					<div
						id="pos-qr-area"
						className="mt-3 rounded-xl p-2.5 text-center"
						style={{ background: "rgba(255,255,255,0.02)", border: cardBorder }}
					>
						<div className="w-14 h-14 mx-auto bg-white rounded-lg mb-1" />
						<p className="text-[9px] text-[#009ee3]">QR / Alias</p>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── POS Orders ───────────────────────────────────────── */
export function POSOrdersScreen() {
	const orders = [
		{
			id: 1,
			table: 1,
			status: "ready",
			total: 12500,
			waiter: "Martin",
			time: "21:30",
			items: 4,
			minutes: 25,
		},
		{
			id: 2,
			table: 3,
			status: "preparing",
			total: 8900,
			waiter: "Sofia",
			time: "21:45",
			items: 3,
			minutes: 18,
		},
		{
			id: 3,
			table: 5,
			status: "pending",
			total: 22300,
			waiter: "Martin",
			time: "22:00",
			items: 7,
			minutes: 5,
		},
		{
			id: 4,
			table: 2,
			status: "closed",
			total: 15600,
			waiter: "Sofia",
			time: "20:15",
			items: 5,
			minutes: 0,
		},
	];
	const sc: Record<string, { color: string; bg: string; label: string }> = {
		pending: {
			color: "#f59e0b",
			bg: "rgba(245,158,11,0.08)",
			label: "Pendiente",
		},
		preparing: {
			color: "#3b82f6",
			bg: "rgba(59,130,246,0.08)",
			label: "Preparando",
		},
		ready: { color: "#10b981", bg: "rgba(16,185,129,0.08)", label: "Listo" },
		closed: { color: "#666", bg: "rgba(255,255,255,0.02)", label: "Cerrado" },
	};

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			{/* Sidebar + content */}
			<div className="flex">
				{/* Mini sidebar */}
				<div
					className="w-[60px] flex-shrink-0 flex flex-col items-center py-4 gap-4"
					style={{ borderRight: cardBorder, background: "rgba(12,12,12,0.8)" }}
				>
					<div className="w-8 h-8 bg-white rounded-sm" />
					<div className="w-px h-4 bg-white/10" />
					<button
						className="w-10 h-10 rounded-xl flex items-center justify-center"
						style={{ background: "rgba(255,255,255,0.03)", border: cardBorder }}
					>
						<LayoutGrid size={16} className="text-[#666]" />
					</button>
					<button
						className="w-10 h-10 rounded-xl flex items-center justify-center"
						style={{
							background: "rgba(245,158,11,0.12)",
							border: "1px solid rgba(245,158,11,0.3)",
						}}
					>
						<ListOrdered size={16} className="text-amber-400" />
					</button>
				</div>

				<div className="flex-1">
					{/* Header */}
					<header
						className="flex items-center justify-between px-4"
						style={{ height: 64, ...headerStyle }}
					>
						<div className="flex items-center gap-3">
							<Receipt className="w-5 h-5 text-amber-400" />
							<span className="font-extrabold text-xl tracking-widest">
								PEDIDOS ACTIVOS
							</span>
							<span
								className="px-2.5 py-1 rounded-full text-[10px] font-bold"
								style={{
									background: "rgba(245,158,11,0.15)",
									color: "#f59e0b",
								}}
							>
								{orders.filter((o) => o.status !== "closed").length}
							</span>
						</div>
						<span
							className="font-extrabold text-lg"
							style={{ fontVariantNumeric: "tabular-nums" }}
						>
							22:45
						</span>
					</header>

					{/* Stats summary */}
					<div
						className="grid grid-cols-4 gap-2 px-4 py-3"
						style={{ borderBottom: cardBorder }}
					>
						{[
							{ label: "Activos", value: "3", color: "#f59e0b" },
							{ label: "Listos", value: "1", color: "#10b981" },
							{ label: "Valor en mesa", value: "$43.7K", color: "#f59e0b" },
							{ label: "Ingresos hoy", value: "$185K", color: "#10b981" },
						].map((s) => (
							<div key={s.label} className="text-center">
								<p className="text-[9px] uppercase tracking-wider text-[#555]">
									{s.label}
								</p>
								<p
									className="font-extrabold text-lg"
									style={{ color: s.color }}
								>
									{s.value}
								</p>
							</div>
						))}
					</div>

					{/* Filter tabs */}
					<div
						id="orders-filter"
						className="flex gap-2 px-4 py-3"
						style={{ borderBottom: cardBorder }}
					>
						{[
							{ label: "Todos", count: 4, active: true },
							{ label: "Pendiente", count: 1 },
							{ label: "Preparando", count: 1 },
							{ label: "Listo", count: 1 },
						].map((f) => (
							<button
								key={f.label}
								className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider"
								style={
									f.active
										? {
												background: "rgba(245,158,11,0.15)",
												color: "#f59e0b",
												border: "1px solid rgba(245,158,11,0.3)",
											}
										: {
												background: "rgba(255,255,255,0.03)",
												color: "#888",
												border: cardBorder,
											}
								}
							>
								{f.label} ({f.count})
							</button>
						))}
					</div>

					{/* Orders list */}
					<div id="orders-list" className="p-4 space-y-3">
						{orders.map((o) => {
							const s = sc[o.status];
							return (
								<div
									key={o.id}
									className="rounded-2xl overflow-hidden"
									style={{
										borderLeft: `4px solid ${s.color}`,
										border: `1px solid ${s.color}25`,
										borderLeftWidth: 4,
										borderLeftColor: s.color,
										background: s.bg,
									}}
								>
									<div className="flex items-center justify-between px-4 py-3">
										<div className="flex items-center gap-3">
											<span className="font-extrabold" style={{ fontSize: 52 }}>
												{o.table}
											</span>
											<div>
												<span className="text-[10px] text-[#555]">Mesa</span>
												<p className="text-xs text-[#888]">
													{o.waiter} · {o.items} items
												</p>
											</div>
										</div>
										<div className="text-right">
											<span
												id={o.id === 1 ? "orders-status-badge" : undefined}
												className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
												style={{
													background: `${s.color}20`,
													color: s.color,
													border: `1px solid ${s.color}40`,
												}}
											>
												{s.label}
											</span>
											<p
												className="font-extrabold mt-1"
												style={{
													fontSize: 20,
													color: "#f59e0b",
													textShadow: "0 0 12px rgba(245,158,11,0.2)",
												}}
											>
												$ {o.total.toLocaleString("es-AR")}
											</p>
											{o.minutes > 0 && (
												<p
													className="text-[10px] flex items-center justify-end gap-1 mt-0.5"
													style={{
														color:
															o.minutes > 20
																? "#ef4444"
																: o.minutes > 10
																	? "#f59e0b"
																	: "#666",
													}}
												>
													<Clock size={10} /> {o.minutes} min
												</p>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Repartidor ───────────────────────────────────────── */
export function RepartidorScreen() {
	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<header
				className="sticky top-0 z-40 flex items-center justify-between px-4"
				style={{ height: 60, ...headerStyle, borderTop: "2px solid #ec4899" }}
			>
				<div className="flex items-center gap-3">
					<Truck className="w-5 h-5 text-pink-400" />
					<div>
						<span className="font-extrabold text-xl tracking-widest">
							ENTREGA #1042
						</span>
						<p className="text-[10px] text-[#555]">En camino</p>
					</div>
				</div>
				<span
					className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase"
					style={{
						background: "rgba(245,158,11,0.15)",
						color: "#f59e0b",
						border: "1px solid rgba(245,158,11,0.3)",
					}}
				>
					<Truck size={12} className="inline mr-1" /> En camino
				</span>
			</header>

			<div className="p-4 space-y-4">
				{/* Customer info */}
				<SectionCard
					id="delivery-customer-info"
					title="Datos del Cliente"
					icon={<Users size={14} className="text-amber-400" />}
				>
					<p className="font-bold text-lg">Juan Perez</p>
					<p className="text-sm text-[#888] flex items-center gap-2 mt-2">
						<MapPin size={14} className="text-amber-400" /> Av. Libertador 1234,
						Olivos
					</p>
					<p className="text-sm text-[#888] flex items-center gap-2 mt-1">
						<Phone size={14} className="text-blue-400" /> 11-2345-6789
					</p>
				</SectionCard>

				{/* Items */}
				<SectionCard
					id="delivery-items"
					title="Items del Pedido"
					icon={<Package size={14} className="text-amber-400" />}
					delay={80}
				>
					{[
						{ name: "Hamburguesa Completa", qty: 2, price: 9800 },
						{ name: "Papas Fritas", qty: 1, price: 3200 },
						{ name: "Coca Cola 1.5L", qty: 1, price: 2500 },
					].map((item) => (
						<div
							key={item.name}
							className="flex items-center justify-between py-2.5"
							style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
						>
							<div className="flex items-center gap-2">
								<span className="font-extrabold text-amber-400 text-lg w-6 text-center">
									{item.qty}
								</span>
								<span className="text-sm font-medium">{item.name}</span>
							</div>
							<span className="font-bold text-sm">
								$ {item.price.toLocaleString("es-AR")}
							</span>
						</div>
					))}
				</SectionCard>

				{/* Total */}
				<div
					id="delivery-total"
					className="rounded-2xl p-5 flex justify-between items-center"
					style={{
						background: "rgba(245,158,11,0.05)",
						border: "1px solid rgba(245,158,11,0.2)",
						boxShadow: "0 0 24px rgba(245,158,11,0.08)",
					}}
				>
					<div>
						<p className="text-[10px] uppercase tracking-[0.2em] text-[#777]">
							Total
						</p>
						<p
							className="font-extrabold text-amber-400"
							style={{
								fontSize: 36,
								textShadow: "0 0 20px rgba(245,158,11,0.3)",
							}}
						>
							$ 15.500
						</p>
					</div>
					<span
						className="px-4 py-2 rounded-xl font-bold text-xs"
						style={{
							background: "rgba(16,185,129,0.15)",
							color: "#10b981",
							border: "1px solid rgba(16,185,129,0.3)",
						}}
					>
						💵 Efectivo
					</span>
				</div>

				{/* GPS */}
				<div
					id="delivery-gps"
					className="rounded-2xl p-4 text-center"
					style={{ border: cardBorder, background: "rgba(255,255,255,0.02)" }}
				>
					<div
						className="w-full h-28 rounded-xl mb-3 flex items-center justify-center"
						style={{ background: "rgba(255,255,255,0.02)", border: cardBorder }}
					>
						<MapPin size={32} className="text-amber-400 animate-bounce" />
					</div>
					<div className="flex items-center justify-center gap-2">
						<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
						<p className="text-xs text-emerald-400 font-medium">
							GPS compartiendo ubicación...
						</p>
					</div>
				</div>

				{/* Complete button */}
				<button
					id="delivery-complete"
					className="w-full font-bold text-white flex items-center justify-center gap-2"
					style={{
						minHeight: 64,
						fontSize: 16,
						borderRadius: 16,
						background: "#10b981",
						border: "1px solid rgba(16,185,129,0.5)",
						boxShadow:
							"0 0 32px rgba(16,185,129,0.3), 0 4px 18px rgba(0,0,0,0.4)",
					}}
				>
					<Check size={20} /> MARCAR COMO ENTREGADO
				</button>
			</div>
		</div>
	);
}

/* ─── Admin Dashboard ──────────────────────────────────── */
export function AdminDashboardScreen() {
	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="Dashboard" />
				<div className="flex-1 p-5">
					{/* Title */}
					<div className="flex items-center gap-3 mb-5">
						<div className="w-[3px] h-6 rounded-full bg-amber-500" />
						<h2 className="font-extrabold text-xl tracking-wider">DASHBOARD</h2>
						<span
							className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold"
							style={{
								background: "rgba(16,185,129,0.12)",
								color: "#10b981",
								border: "1px solid rgba(16,185,129,0.3)",
							}}
						>
							<span className="w-[6px] h-[6px] rounded-full bg-emerald-400 animate-pulse" />
							EN VIVO
						</span>
					</div>

					{/* KPI cards */}
					<div className="grid grid-cols-2 gap-3 mb-5">
						<KpiCard
							id="admin-kpi-orders"
							label="Pedidos activos"
							value="12"
							subtext="8 en mesa · 4 delivery"
							color="#3b82f6"
							icon={<Package size={16} style={{ color: "#3b82f6" }} />}
							idx={0}
						/>
						<KpiCard
							id="admin-kpi-revenue"
							label="Mesas ocupadas"
							value="6/10"
							subtext="60% ocupación"
							color="#f59e0b"
							icon={<Users size={16} style={{ color: "#f59e0b" }} />}
							idx={1}
						/>
						<KpiCard
							id="admin-kpi-costs"
							label="Stock bajo"
							value="2"
							subtext="alertas activas"
							color="#ef4444"
							icon={<AlertTriangle size={16} style={{ color: "#ef4444" }} />}
							idx={2}
						/>
						<KpiCard
							id="admin-kpi-margin"
							label="Ingresos activos"
							value="$385K"
							subtext="hoy"
							color="#10b981"
							icon={<TrendingUp size={16} style={{ color: "#10b981" }} />}
							idx={3}
						/>
					</div>

					{/* Quick links */}
					<div id="admin-quick-links">
						<p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-bold mb-2">
							Accesos rápidos
						</p>
						<div className="grid grid-cols-4 gap-2">
							{[
								{ name: "Menu", color: "#f59e0b" },
								{ name: "Mesas", color: "#10b981" },
								{ name: "Empleados", color: "#3b82f6" },
								{ name: "Gastos", color: "#8b5cf6" },
							].map((link) => (
								<button
									key={link.name}
									className="rounded-xl py-3 text-xs font-bold text-center"
									style={{
										background: `${link.color}10`,
										border: `1px solid ${link.color}25`,
										color: link.color,
									}}
								>
									{link.name} →
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Menu ───────────────────────────────────────── */
export function AdminMenuScreen() {
	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="Menu" />
				<div className="flex-1">
					<header
						className="flex items-center justify-between px-5 py-3"
						style={{ ...headerStyle }}
					>
						<span className="font-extrabold text-lg tracking-wider">MENU</span>
						<button
							id="menu-add-product"
							className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
							style={{
								background: "#f59e0b",
								color: "#080808",
								border: "1px solid rgba(245,158,11,0.7)",
							}}
						>
							<Plus size={14} /> Nuevo Producto
						</button>
					</header>
					<div className="flex">
						<div
							id="menu-categories"
							className="w-[160px] p-3"
							style={{ borderRight: cardBorder }}
						>
							<p className="text-[9px] uppercase tracking-[0.2em] text-[#555] mb-2 font-bold px-2">
								Categorías
							</p>
							{[
								"🍺 Cervezas",
								"🍸 Tragos",
								"🍕 Pizzas",
								"🥩 Parrilla",
								"🥗 Ensaladas",
								"🍟 Guarniciones",
							].map((cat, i) => (
								<div
									key={cat}
									className="px-3 py-2 rounded-lg text-xs mb-0.5 cursor-pointer"
									style={
										i === 1
											? {
													background: "rgba(245,158,11,0.12)",
													color: "#f59e0b",
													fontWeight: 600,
													borderLeft: "3px solid #f59e0b",
												}
											: { color: "#888" }
									}
								>
									{cat}
								</div>
							))}
						</div>
						<div id="menu-product-list" className="flex-1 p-4 space-y-2">
							{[
								{ name: "Gin Tonic", price: 4200, available: true },
								{ name: "Mojito Clasico", price: 4000, available: true },
								{ name: "Fernet con Coca", price: 3500, available: true },
								{ name: "Negroni", price: 4800, available: false },
							].map((p, i) => (
								<div
									key={p.name}
									className="rounded-xl flex items-center justify-between px-4"
									style={{
										minHeight: 56,
										background: "rgba(255,255,255,0.02)",
										border: cardBorder,
									}}
								>
									<div className="flex items-center gap-3">
										<span className="text-sm font-bold">{p.name}</span>
										<span
											className="font-extrabold text-amber-400"
											style={{ fontSize: 16 }}
										>
											$ {p.price.toLocaleString()}
										</span>
									</div>
									<div className="flex items-center gap-3">
										<span
											id={i === 3 ? "menu-toggle-available" : undefined}
											className="cursor-pointer"
										>
											{p.available ? (
												<ToggleRight size={24} className="text-emerald-400" />
											) : (
												<ToggleLeft size={24} className="text-[#555]" />
											)}
										</span>
										<Pencil size={14} className="text-[#555] cursor-pointer" />
										<Trash2 size={14} className="text-[#555] cursor-pointer" />
									</div>
								</div>
							))}
							<div
								id="menu-recipe"
								className="rounded-2xl p-4 mt-4"
								style={{
									background: "rgba(245,158,11,0.04)",
									border: "1px solid rgba(245,158,11,0.15)",
								}}
							>
								<p className="text-[10px] uppercase tracking-[0.2em] text-[#777] font-bold mb-3">
									Receta — Gin Tonic
								</p>
								{[
									{ name: "Gin Bombay", amount: "60 ml" },
									{ name: "Tonica Schweppes", amount: "200 ml" },
									{ name: "Limon", amount: "1 rodaja" },
								].map((r) => (
									<div
										key={r.name}
										className="flex justify-between text-sm py-1.5"
										style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
									>
										<span>{r.name}</span>
										<span className="text-[#888]">{r.amount}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Tables ─────────────────────────────────────── */
export function AdminTablesScreen() {
	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="Mesas" />
				<div className="flex-1">
					<header
						className="flex items-center justify-between px-5 py-3"
						style={{ ...headerStyle }}
					>
						<span className="font-extrabold text-lg tracking-wider">MESAS</span>
						<div className="flex gap-2">
							<button
								id="tables-add"
								className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
								style={{ background: "#f59e0b", color: "#080808" }}
							>
								<Plus size={14} /> Mesa
							</button>
							<button
								id="tables-qr-download"
								className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
								style={{
									background: "rgba(255,255,255,0.04)",
									border: cardBorder,
									color: "#888",
								}}
							>
								<Download size={14} /> QRs ZIP
							</button>
						</div>
					</header>
					<div className="flex">
						<div
							id="tables-visual-editor"
							className="flex-1 relative m-3 rounded-xl"
							style={{
								minHeight: 280,
								background:
									"radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)",
								backgroundSize: "20px 20px",
								border: "1px dashed rgba(255,255,255,0.08)",
							}}
						>
							{[
								{ n: 1, x: 12, y: 12, shape: "rounded-xl", color: "#f59e0b" },
								{ n: 2, x: 38, y: 12, shape: "rounded-full", color: "#10b981" },
								{ n: 3, x: 64, y: 12, shape: "rounded-xl", color: "#f59e0b" },
								{ n: 4, x: 12, y: 52, shape: "rounded-xl", color: "#10b981" },
								{ n: 5, x: 38, y: 52, shape: "rounded-full", color: "#8b5cf6" },
							].map((t) => (
								<div
									key={t.n}
									id={t.n === 1 ? "tables-qr" : undefined}
									className={`absolute w-16 h-16 ${t.shape} flex items-center justify-center cursor-move`}
									style={{
										left: `${t.x}%`,
										top: `${t.y}%`,
										background: `${t.color}10`,
										border: `2px dashed ${t.color}50`,
									}}
								>
									<span
										className="font-extrabold text-lg"
										style={{ color: t.color }}
									>
										{t.n}
									</span>
								</div>
							))}
						</div>
						<div
							id="tables-zones"
							className="w-[160px] p-3"
							style={{ borderLeft: cardBorder }}
						>
							<p className="text-[9px] uppercase tracking-[0.2em] text-[#555] mb-2 font-bold px-2">
								Zonas
							</p>
							{["Salon Principal", "Afuera", "VIP"].map((z, i) => (
								<div
									key={z}
									className="px-3 py-2 rounded-lg text-xs mb-1"
									style={
										i === 0
											? {
													background: "rgba(245,158,11,0.12)",
													color: "#f59e0b",
													fontWeight: 600,
												}
											: { color: "#888", background: "rgba(255,255,255,0.02)" }
									}
								>
									{z}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Employees ──────────────────────────────────── */
export function AdminEmployeesScreen() {
	const roleColors: Record<string, string> = {
		admin: "#f59e0b",
		waiter: "#3b82f6",
		kitchen: "#10b981",
		bar: "#8b5cf6",
		cashier: "#f59e0b",
		repartidor: "#ec4899",
	};
	const staff = [
		{ name: "Carlos Admin", role: "admin", pin: "1234" },
		{ name: "Martin Garcia", role: "waiter", pin: "5678" },
		{ name: "Sofia Lopez", role: "waiter", pin: "4321" },
		{ name: "Pedro Cocina", role: "kitchen", pin: "8765" },
		{ name: "Laura Barra", role: "bar", pin: "1111" },
		{ name: "Diego Repartidor", role: "repartidor", pin: "9999" },
	];

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="Empleados" />
				<div className="flex-1">
					<header
						className="flex items-center justify-between px-5 py-3"
						style={{ ...headerStyle }}
					>
						<span className="font-extrabold text-lg tracking-wider">
							EMPLEADOS
						</span>
						<button
							id="emp-add"
							className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
							style={{ background: "#f59e0b", color: "#080808" }}
						>
							<Plus size={14} /> Nuevo
						</button>
					</header>
					<div id="emp-list" className="p-4 space-y-2">
						{staff.map((s, i) => {
							const c = roleColors[s.role] || "#888";
							return (
								<div
									key={s.name}
									className="rounded-xl flex items-center justify-between px-4"
									style={{
										minHeight: 64,
										background: "rgba(255,255,255,0.02)",
										border: cardBorder,
									}}
								>
									<div className="flex items-center gap-3">
										<div
											className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm"
											style={{
												background: `${c}25`,
												border: `1px solid ${c}40`,
												color: c,
											}}
										>
											{s.name.charAt(0)}
										</div>
										<div>
											<p className="font-bold text-sm">{s.name}</p>
											<p
												id={i === 0 ? "emp-role" : undefined}
												className="text-xs font-bold uppercase"
												style={{ color: c }}
											>
												{s.role}
											</p>
										</div>
									</div>
									<span
										id={i === 0 ? "emp-pin" : undefined}
										className="font-mono text-sm px-3 py-1.5 rounded-lg"
										style={{
											background: "rgba(255,255,255,0.04)",
											border: cardBorder,
										}}
									>
										PIN: {s.pin}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Suppliers ──────────────────────────────────── */
export function AdminSuppliersScreen() {
	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="Proveedores" />
				<div className="flex-1">
					<header
						className="flex items-center justify-between px-5 py-3"
						style={{ ...headerStyle }}
					>
						<span className="font-extrabold text-lg tracking-wider">
							PROVEEDORES
						</span>
						<button
							id="supplier-add"
							className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
							style={{ background: "#f59e0b", color: "#080808" }}
						>
							<Plus size={14} /> Nuevo
						</button>
					</header>
					<div
						className="flex gap-2 px-5 py-3"
						style={{ borderBottom: cardBorder }}
					>
						{["Proveedores", "Categorías", "Ingredientes", "Historial"].map(
							(t, i) => (
								<button
									key={t}
									className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider"
									style={
										i === 0
											? {
													background: "rgba(245,158,11,0.15)",
													color: "#f59e0b",
													border: "1px solid rgba(245,158,11,0.3)",
												}
											: {
													background: "rgba(255,255,255,0.03)",
													color: "#888",
													border: cardBorder,
												}
									}
								>
									{t}
								</button>
							),
						)}
					</div>
					<div id="supplier-list" className="p-4 space-y-2">
						{[
							{
								name: "Distribuidora Norte",
								cat: "Bebidas",
								cuit: "30-12345678-9",
								invoices: 5,
							},
							{
								name: "Carnes Premium",
								cat: "Alimentos",
								cuit: "20-87654321-0",
								invoices: 12,
							},
							{
								name: "Limpieza Total",
								cat: "Limpieza",
								cuit: "33-11223344-5",
								invoices: 3,
							},
						].map((s) => (
							<div
								key={s.name}
								className="rounded-xl px-4 py-3"
								style={{
									background: "rgba(255,255,255,0.02)",
									border: cardBorder,
								}}
							>
								<div className="flex justify-between items-start">
									<div>
										<p className="font-bold">{s.name}</p>
										<p className="text-xs text-[#666] mt-0.5">CUIT: {s.cuit}</p>
									</div>
									<span
										className="text-[10px] px-2.5 py-1 rounded-full font-bold"
										style={{
											background: "rgba(255,255,255,0.04)",
											border: cardBorder,
										}}
									>
										{s.cat}
									</span>
								</div>
								<div
									id={
										s.name === "Distribuidora Norte"
											? "supplier-invoices"
											: undefined
									}
									className="mt-2 text-xs text-[#888] flex items-center gap-1.5"
								>
									<FileText size={12} className="text-amber-400" /> {s.invoices}{" "}
									facturas registradas
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Expenses ───────────────────────────────────── */
export function AdminExpensesScreen() {
	const paymentColors: Record<string, string> = {
		Efectivo: "#22c55e",
		Transferencia: "#f97316",
		Tarjeta: "#8b5cf6",
		MercadoPago: "#3b82f6",
	};

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="Gastos" />
				<div className="flex-1">
					<header
						className="flex items-center justify-between px-5 py-3"
						style={{ ...headerStyle }}
					>
						<span className="font-extrabold text-lg tracking-wider">
							GASTOS
						</span>
						<button
							id="expense-add"
							className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
							style={{ background: "#f59e0b", color: "#080808" }}
						>
							<Plus size={14} /> Nuevo Gasto
						</button>
					</header>
					<div
						id="expense-filter"
						className="flex gap-2 px-5 py-3"
						style={{ borderBottom: cardBorder }}
					>
						<div
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
							style={{
								background: "rgba(255,255,255,0.03)",
								border: cardBorder,
							}}
						>
							<Calendar size={12} className="text-[#666]" /> 01/03 – 26/03
						</div>
						{["Todas", "Servicios", "Mercadería"].map((f, i) => (
							<button
								key={f}
								className="px-3 py-1.5 rounded-full text-[11px] font-bold"
								style={
									i === 0
										? { background: "rgba(245,158,11,0.15)", color: "#f59e0b" }
										: { background: "rgba(255,255,255,0.03)", color: "#888" }
								}
							>
								{f}
							</button>
						))}
					</div>
					<div id="expense-list" className="p-4 space-y-2">
						{[
							{
								desc: "Alquiler local",
								amount: 250000,
								cat: "Alquiler",
								method: "Transferencia",
								recurring: true,
							},
							{
								desc: "Electricidad marzo",
								amount: 45000,
								cat: "Servicios",
								method: "Efectivo",
								recurring: false,
							},
							{
								desc: "Compra bebidas",
								amount: 85000,
								cat: "Mercadería",
								method: "Transferencia",
								recurring: false,
							},
						].map((e) => (
							<div
								key={e.desc}
								className="rounded-xl px-4 py-3 flex justify-between items-center"
								style={{
									background: "rgba(255,255,255,0.02)",
									border: cardBorder,
								}}
							>
								<div>
									<p className="font-bold text-sm">{e.desc}</p>
									<div className="flex items-center gap-2 mt-1">
										<span className="text-[10px] text-[#666]">{e.cat}</span>
										<span className="w-1 h-1 rounded-full bg-[#444]" />
										<span
											className="text-[10px]"
											style={{ color: paymentColors[e.method] || "#888" }}
										>
											{e.method}
										</span>
									</div>
								</div>
								<div className="text-right">
									<p className="font-extrabold text-red-400">
										-$ {e.amount.toLocaleString("es-AR")}
									</p>
									{e.recurring && (
										<span
											id="expense-recurring"
											className="text-[9px] px-2 py-0.5 rounded-full font-bold"
											style={{
												background: "rgba(245,158,11,0.15)",
												color: "#f59e0b",
											}}
										>
											Recurrente
										</span>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Cash Register ──────────────────────────────── */
export function AdminCashScreen() {
	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="Caja" />
				<div className="flex-1">
					<header
						className="flex items-center justify-between px-5 py-3"
						style={{ ...headerStyle }}
					>
						<div className="flex items-center gap-3">
							<span className="font-extrabold text-lg tracking-wider">
								CAJA
							</span>
							<span
								className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold"
								style={{
									background: "rgba(16,185,129,0.12)",
									color: "#10b981",
									border: "1px solid rgba(16,185,129,0.3)",
								}}
							>
								<span className="w-[6px] h-[6px] rounded-full bg-emerald-400" />
								Caja Abierta
							</span>
						</div>
					</header>
					<div className="p-5 space-y-4">
						<div className="flex gap-3">
							<button
								id="cash-open"
								className="flex-1 py-3.5 rounded-xl font-bold text-sm"
								style={{
									background: "rgba(16,185,129,0.12)",
									border: "1px solid rgba(16,185,129,0.3)",
									color: "#10b981",
								}}
							>
								Abrir Caja
							</button>
							<button
								id="cash-close"
								className="flex-1 py-3.5 rounded-xl font-bold text-sm"
								style={{
									background: "rgba(239,68,68,0.12)",
									border: "1px solid rgba(239,68,68,0.3)",
									color: "#ef4444",
								}}
							>
								Cerrar Caja
							</button>
						</div>
						<div
							id="cash-balance"
							className="rounded-2xl p-6 text-center"
							style={{
								background: "rgba(16,185,129,0.05)",
								border: "1px solid rgba(16,185,129,0.2)",
								boxShadow: "0 0 24px rgba(16,185,129,0.08)",
							}}
						>
							<p className="text-[10px] uppercase tracking-[0.2em] text-[#777]">
								Saldo actual
							</p>
							<p
								className="font-extrabold text-emerald-400"
								style={{
									fontSize: 48,
									textShadow: "0 0 28px rgba(16,185,129,0.3)",
								}}
							>
								$ 185.400
							</p>
							<div className="flex justify-center gap-4 mt-3 text-xs text-[#666]">
								<span>Apertura: $10.000</span>
								<span>Ingresos: $225.400</span>
								<span>Egresos: $50.000</span>
							</div>
						</div>
						{/* Payment method breakdown */}
						<div className="grid grid-cols-4 gap-2">
							{[
								{
									label: "Efectivo",
									icon: Banknote,
									color: "#10b981",
									amount: "$95K",
								},
								{
									label: "MP",
									icon: Smartphone,
									color: "#3b82f6",
									amount: "$62K",
								},
								{
									label: "Tarjeta",
									icon: CreditCard,
									color: "#8b5cf6",
									amount: "$45K",
								},
								{
									label: "Transfer",
									icon: ArrowRightLeft,
									color: "#f59e0b",
									amount: "$23K",
								},
							].map((m) => (
								<div
									key={m.label}
									className="rounded-xl p-3 text-center"
									style={{
										background: `${m.color}08`,
										border: `1px solid ${m.color}20`,
									}}
								>
									<m.icon
										size={16}
										style={{ color: m.color, margin: "0 auto 4px" }}
									/>
									<p className="text-[9px] text-[#666]">{m.label}</p>
									<p
										className="font-extrabold text-sm"
										style={{ color: m.color }}
									>
										{m.amount}
									</p>
								</div>
							))}
						</div>
						<div id="cash-movements">
							<p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-bold mb-2">
								Últimos movimientos
							</p>
							{[
								{ concept: "Mesa 3 — Efectivo", amount: 12500, type: "in" },
								{ concept: "Compra hielo", amount: -3500, type: "out" },
								{ concept: "Mesa 1 — Efectivo", amount: 8900, type: "in" },
							].map((m) => (
								<div
									key={m.concept}
									className="flex justify-between py-2.5 text-sm"
									style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
								>
									<span className="text-[#aaa]">{m.concept}</span>
									<span
										className={
											m.type === "in"
												? "text-emerald-400 font-bold"
												: "text-red-400 font-bold"
										}
									>
										{m.type === "in" ? "+" : "-"}${" "}
										{Math.abs(m.amount).toLocaleString("es-AR")}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Accounting ─────────────────────────────────── */
export function AdminAccountingScreen() {
	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="Contabilidad" />
				<div className="flex-1">
					<header
						className="flex items-center justify-between px-5 py-3"
						style={{ ...headerStyle }}
					>
						<span className="font-extrabold text-lg tracking-wider">
							CONTABILIDAD
						</span>
						<div
							id="accounting-date-filter"
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
							style={{
								background: "rgba(255,255,255,0.03)",
								border: cardBorder,
							}}
						>
							<Calendar size={12} className="text-[#666]" /> 01/03/2026 —
							26/03/2026
						</div>
					</header>
					<div className="p-5 space-y-4">
						<SectionCard
							id="accounting-summary"
							title="Resumen por categoría"
							icon={<BarChart3 size={14} className="text-amber-400" />}
						>
							{[
								{
									cat: "Mercadería",
									amount: 185000,
									pct: 45,
									color: "#f59e0b",
								},
								{ cat: "Alquiler", amount: 250000, pct: 60, color: "#8b5cf6" },
								{ cat: "Servicios", amount: 95000, pct: 75, color: "#3b82f6" },
								{ cat: "Personal", amount: 320000, pct: 90, color: "#10b981" },
							].map((item) => (
								<div key={item.cat} className="mb-3">
									<div className="flex justify-between text-sm mb-1">
										<span className="text-[#aaa]">{item.cat}</span>
										<span className="font-bold">
											$ {item.amount.toLocaleString("es-AR")}
										</span>
									</div>
									<div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
										<div
											className="h-full rounded-full"
											style={{ width: `${item.pct}%`, background: item.color }}
										/>
									</div>
								</div>
							))}
						</SectionCard>
						<SectionCard
							id="accounting-budget"
							title="Presupuesto vs Real"
							icon={<TrendingUp size={14} className="text-amber-400" />}
							delay={80}
						>
							{[
								{ cat: "Mercadería", budget: 200000, real: 185000 },
								{ cat: "Servicios", budget: 80000, real: 95000 },
							].map((item) => (
								<div
									key={item.cat}
									className="flex justify-between text-sm py-2.5"
									style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
								>
									<span className="text-[#aaa]">{item.cat}</span>
									<div>
										<span
											style={{
												color: item.real > item.budget ? "#ef4444" : "#10b981",
											}}
											className="font-bold"
										>
											$ {item.real.toLocaleString("es-AR")}
										</span>
										<span className="text-[#555] ml-1">
											/ $ {item.budget.toLocaleString("es-AR")}
										</span>
									</div>
								</div>
							))}
						</SectionCard>
						<SectionCard
							id="accounting-payment-breakdown"
							title="Ingresos por método de pago"
							icon={<Wallet size={14} className="text-amber-400" />}
							delay={160}
						>
							{[
								{ method: "Efectivo", amount: 145000, color: "#10b981" },
								{ method: "Tarjeta", amount: 98000, color: "#8b5cf6" },
								{ method: "MercadoPago", amount: 112000, color: "#3b82f6" },
								{ method: "Transferencia", amount: 30200, color: "#f59e0b" },
							].map((item) => (
								<div
									key={item.method}
									className="flex items-center gap-3 py-2.5"
									style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
								>
									<span
										className="w-3 h-3 rounded-full"
										style={{ background: item.color }}
									/>
									<span className="text-sm flex-1 text-[#aaa]">
										{item.method}
									</span>
									<span className="font-bold text-sm">
										$ {item.amount.toLocaleString("es-AR")}
									</span>
								</div>
							))}
						</SectionCard>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Invoices ───────────────────────────────────── */
export function AdminInvoicesScreen() {
	const typeColors: Record<string, string> = {
		A: "#60a5fa",
		B: "#4ade80",
		C: "#fbbf24",
	};

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="Facturas" />
				<div className="flex-1">
					<header
						className="flex items-center justify-between px-5 py-3"
						style={{ ...headerStyle }}
					>
						<span className="font-extrabold text-lg tracking-wider">
							FACTURACIÓN AFIP
						</span>
						<button
							id="invoice-create"
							className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
							style={{ background: "#f59e0b", color: "#080808" }}
						>
							<Plus size={14} /> Nueva Factura
						</button>
					</header>
					<div id="invoice-list" className="p-4 space-y-2">
						{[
							{
								num: "B-0001-00042",
								type: "B",
								date: "26/03",
								total: 12500,
								status: "authorized",
								cae: "71234567890123",
							},
							{
								num: "A-0001-00015",
								type: "A",
								date: "25/03",
								total: 8900,
								status: "authorized",
								cae: "71234567890122",
							},
							{
								num: "B-0001-00043",
								type: "B",
								date: "26/03",
								total: 5600,
								status: "draft",
								cae: "—",
							},
						].map((inv) => (
							<div
								key={inv.num}
								className="rounded-xl px-4 py-3 flex justify-between items-center"
								style={{
									background: "rgba(255,255,255,0.02)",
									border: cardBorder,
								}}
							>
								<div className="flex items-center gap-3">
									<span
										className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm"
										style={{
											background: `${typeColors[inv.type]}20`,
											color: typeColors[inv.type],
											border: `1px solid ${typeColors[inv.type]}40`,
										}}
									>
										{inv.type}
									</span>
									<div>
										<p className="font-mono font-bold text-sm">{inv.num}</p>
										<p className="text-[10px] text-[#666]">
											{inv.date} | CAE: {inv.cae}
										</p>
									</div>
								</div>
								<div className="text-right">
									<p className="font-bold">
										$ {inv.total.toLocaleString("es-AR")}
									</p>
									<span
										className="text-[10px] px-2 py-0.5 rounded-full font-bold"
										style={
											inv.status === "authorized"
												? {
														background: "rgba(16,185,129,0.15)",
														color: "#10b981",
													}
												: {
														background: "rgba(245,158,11,0.15)",
														color: "#f59e0b",
													}
										}
									>
										{inv.status === "authorized" ? "✓ Emitida" : "Borrador"}
									</span>
								</div>
							</div>
						))}
					</div>
					<div className="px-4 pb-4">
						<button
							id="invoice-send-afip"
							className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
							style={{
								background: "rgba(16,185,129,0.12)",
								border: "1px solid rgba(16,185,129,0.3)",
								color: "#10b981",
							}}
						>
							<Receipt size={16} /> Enviar Borrador a AFIP
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Admin MercadoPago Config ─────────────────────────── */
export function AdminMPConfigScreen() {
	function ConfigField({
		id,
		label,
		value,
		secret,
	}: {
		id: string;
		label: string;
		value: string;
		secret?: boolean;
	}) {
		return (
			<div id={id}>
				<label className="text-[10px] uppercase tracking-[0.15em] text-[#666] mb-1.5 block font-semibold">
					{label}
				</label>
				<div
					className="flex items-center rounded-xl px-4 py-3"
					style={{ background: "rgba(255,255,255,0.03)", border: cardBorder }}
				>
					<span className="text-sm text-[#aaa] flex-1">
						{secret ? "••••••••••••••••" : value}
					</span>
				</div>
			</div>
		);
	}

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="MercadoPago" />
				<div className="flex-1">
					<header
						className="flex items-center justify-between px-5 py-3"
						style={{ ...headerStyle }}
					>
						<div className="flex items-center gap-3">
							<Smartphone className="w-5 h-5" style={{ color: "#009ee3" }} />
							<span className="font-extrabold text-lg tracking-wider">
								MERCADOPAGO
							</span>
						</div>
						<span
							className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold"
							style={{
								background: "rgba(16,185,129,0.12)",
								color: "#10b981",
								border: "1px solid rgba(16,185,129,0.3)",
							}}
						>
							<CheckCircle2 size={12} /> Configurado
						</span>
					</header>
					<div className="p-5 space-y-4">
						<ConfigField
							id="mp-access-token"
							label="Access Token"
							value="APP_USR-1234567890abcdef..."
							secret
						/>
						<ConfigField
							id="mp-user-id"
							label="User ID (Collector)"
							value="123456789"
						/>
						<ConfigField
							id="mp-pos-id"
							label="POS ID (Punto de Venta)"
							value="MYWAY_POS_001"
						/>
						<ConfigField
							id="mp-webhook"
							label="Webhook Secret"
							value="whsec_..."
							secret
						/>
						<ConfigField
							id="mp-transfer-alias"
							label="Alias de Transferencia"
							value="myway.bar"
						/>
						<button
							className="w-full py-3.5 rounded-xl font-bold text-sm"
							style={{
								background: "#f59e0b",
								color: "#080808",
								border: "1px solid rgba(245,158,11,0.7)",
								boxShadow: "0 0 24px rgba(245,158,11,0.2)",
							}}
						>
							Guardar Cambios
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Admin AFIP Config ────────────────────────────────── */
export function AdminAFIPConfigScreen() {
	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="AFIP" />
				<div className="flex-1">
					<header
						className="flex items-center justify-between px-5 py-3"
						style={{ ...headerStyle }}
					>
						<div className="flex items-center gap-3">
							<Settings className="w-5 h-5 text-[#666]" />
							<span className="font-extrabold text-lg tracking-wider">
								AFIP
							</span>
						</div>
					</header>
					<div className="p-5 space-y-4">
						<div id="afip-cuit">
							<label className="text-[10px] uppercase tracking-[0.15em] text-[#666] mb-1.5 block font-semibold">
								CUIT
							</label>
							<div
								className="rounded-xl px-4 py-3"
								style={{
									background: "rgba(255,255,255,0.03)",
									border: cardBorder,
								}}
							>
								<span className="text-sm text-[#aaa]">20-12345678-9</span>
							</div>
						</div>
						<div id="afip-razon">
							<label className="text-[10px] uppercase tracking-[0.15em] text-[#666] mb-1.5 block font-semibold">
								Razón Social
							</label>
							<div
								className="rounded-xl px-4 py-3"
								style={{
									background: "rgba(255,255,255,0.03)",
									border: cardBorder,
								}}
							>
								<span className="text-sm text-[#aaa]">My Way Bar S.R.L.</span>
							</div>
						</div>
						<div id="afip-regime">
							<label className="text-[10px] uppercase tracking-[0.15em] text-[#666] mb-1.5 block font-semibold">
								Régimen Fiscal
							</label>
							<div className="flex gap-2">
								<button
									className="flex-1 py-2.5 rounded-xl text-sm font-bold"
									style={{
										background: "rgba(245,158,11,0.12)",
										color: "#f59e0b",
										border: "1px solid rgba(245,158,11,0.3)",
									}}
								>
									Monotributo
								</button>
								<button
									className="flex-1 py-2.5 rounded-xl text-sm"
									style={{
										background: "rgba(255,255,255,0.03)",
										color: "#888",
										border: cardBorder,
									}}
								>
									Resp. Inscripto
								</button>
							</div>
						</div>
						<div id="afip-certs">
							<label className="text-[10px] uppercase tracking-[0.15em] text-[#666] mb-1.5 block font-semibold">
								Certificados PEM
							</label>
							<div className="grid grid-cols-2 gap-2">
								<div
									className="rounded-xl p-3 text-center text-xs"
									style={{
										border: "1px dashed rgba(255,255,255,0.1)",
										color: "#10b981",
									}}
								>
									<Check size={14} className="mx-auto mb-1 text-emerald-400" />{" "}
									cert.pem ✓
								</div>
								<div
									className="rounded-xl p-3 text-center text-xs"
									style={{
										border: "1px dashed rgba(255,255,255,0.1)",
										color: "#10b981",
									}}
								>
									<Check size={14} className="mx-auto mb-1 text-emerald-400" />{" "}
									key.pem ✓
								</div>
							</div>
						</div>
						<div id="afip-auto">
							<label className="text-[10px] uppercase tracking-[0.15em] text-[#666] mb-2 block font-semibold">
								Auto-facturación
							</label>
							{["MercadoPago", "Efectivo", "Tarjeta"].map((m) => (
								<div
									key={m}
									className="flex justify-between items-center py-2.5"
									style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
								>
									<span className="text-sm text-[#aaa]">{m}</span>
									<ToggleRight size={24} className="text-emerald-400" />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Delivery ───────────────────────────────────── */
export function AdminDeliveryScreen() {
	const statusConfig: Record<string, { color: string; label: string }> = {
		pending: { color: "#f59e0b", label: "Pendiente" },
		preparing: { color: "#3b82f6", label: "Preparando" },
		en_camino: { color: "#f59e0b", label: "En camino" },
		delivered: { color: "#10b981", label: "Entregado" },
	};

	return (
		<div
			className="bg-[#080808] rounded-2xl border border-white/5 overflow-hidden"
			style={{ minHeight: 560 }}
		>
			<div className="flex">
				<AdminSidebar active="Delivery" />
				<div className="flex-1">
					<header
						className="flex items-center justify-between px-5 py-3"
						style={{ ...headerStyle }}
					>
						<div className="flex items-center gap-3">
							<Truck className="w-5 h-5 text-amber-400" />
							<span className="font-extrabold text-lg tracking-wider">
								DELIVERY
							</span>
						</div>
						<span
							className="px-3 py-1 rounded-full text-[10px] font-bold"
							style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
						>
							3 activos
						</span>
					</header>
					<div className="p-4 space-y-4">
						<div id="admin-delivery-list" className="space-y-2">
							{[
								{
									customer: "Juan Perez",
									address: "Libertador 1234",
									status: "en_camino",
									driver: "Diego",
									total: 15500,
									minutes: 18,
								},
								{
									customer: "Maria Lopez",
									address: "San Martin 567",
									status: "preparing",
									driver: "-",
									total: 8900,
									minutes: 5,
								},
								{
									customer: "Pedro Garcia",
									address: "Maipu 890",
									status: "pending",
									driver: "-",
									total: 12300,
									minutes: 2,
								},
							].map((o) => {
								const sc = statusConfig[o.status];
								return (
									<div
										key={o.customer}
										className="rounded-xl px-4 py-3"
										style={{
											background: `${sc.color}08`,
											border: `1px solid ${sc.color}20`,
											borderLeft: `4px solid ${sc.color}`,
										}}
									>
										<div className="flex justify-between mb-2">
											<p className="font-bold">{o.customer}</p>
											<span
												className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
												style={{ background: `${sc.color}20`, color: sc.color }}
											>
												{sc.label}
											</span>
										</div>
										<p className="text-xs text-[#666] flex items-center gap-1.5">
											<MapPin size={12} className="text-[#555]" /> {o.address}
										</p>
										<div className="flex items-center justify-between mt-2">
											<div
												id={
													o.customer === "Pedro Garcia"
														? "admin-delivery-assign"
														: undefined
												}
												className="flex items-center gap-1.5 text-xs"
											>
												<Users size={12} className="text-[#555]" />
												{o.driver === "-" ? (
													<button
														style={{ color: "#f59e0b" }}
														className="font-bold"
													>
														Asignar repartidor
													</button>
												) : (
													<span className="text-[#888]">{o.driver}</span>
												)}
											</div>
											<div className="flex items-center gap-2">
												<span
													className="text-[10px] flex items-center gap-1"
													style={{ color: o.minutes > 15 ? "#ef4444" : "#666" }}
												>
													<Clock size={10} /> {o.minutes}m
												</span>
												<span className="font-bold text-sm text-amber-400">
													$ {o.total.toLocaleString("es-AR")}
												</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
						<div
							id="admin-delivery-map"
							className="rounded-2xl p-6 text-center"
							style={{
								border: cardBorder,
								background: "rgba(255,255,255,0.02)",
							}}
						>
							<MapPin size={32} className="text-amber-400 mx-auto mb-2" />
							<p className="text-xs text-[#666]">
								Mapa de flota en tiempo real
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
