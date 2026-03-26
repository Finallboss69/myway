import {
	Clock,
	Banknote,
	CreditCard,
	QrCode,
	ArrowRightLeft,
	Copy,
	Check,
	ChefHat,
	Volume2,
	AlertTriangle,
	Plus,
	Minus,
	Send,
	Search,
	Users,
	Truck,
	MapPin,
	Phone,
	FileText,
	Settings,
	DollarSign,
	TrendingUp,
	Package,
	BarChart3,
	ShieldCheck,
	Pencil,
	Trash2,
	ToggleLeft,
	ToggleRight,
	Download,
	Calendar,
	Receipt,
} from "lucide-react";

/* ─── Helpers ──────────────────────────────────────────── */
function Card({
	id,
	children,
	className = "",
}: {
	id?: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			id={id}
			className={`bg-[var(--bg-card)] rounded-xl border border-white/5 p-4 ${className}`}
		>
			{children}
		</div>
	);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<h3 className="text-xs uppercase tracking-widest text-[var(--ink-faint)] font-semibold mb-3">
			{children}
		</h3>
	);
}

function MockInput({
	id,
	label,
	value,
	type = "text",
}: {
	id?: string;
	label: string;
	value: string;
	type?: string;
}) {
	return (
		<div id={id} className="rounded-lg">
			<label className="text-xs text-[var(--ink-faint)] mb-1 block">
				{label}
			</label>
			<div className="bg-[var(--bg-secondary)] rounded-lg px-3 py-2 text-sm text-[var(--ink-secondary)] border border-white/5">
				{type === "password" ? "••••••••••" : value}
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
		{ name: "Fernet con Coca", price: 3500 },
		{ name: "Gin Tonic", price: 4200 },
		{ name: "Mojito Clasico", price: 4000 },
		{ name: "Aperol Spritz", price: 4500 },
		{ name: "Cerveza Tirada", price: 2800 },
		{ name: "Negroni", price: 4800 },
	];

	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5">
				<h2 className="font-bold">Mesa 3 — Nuevo Pedido</h2>
			</div>
			<div
				id="category-tabs"
				className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-white/5 rounded-lg"
			>
				{categories.map((c, i) => (
					<button
						key={c.name}
						className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${i === 1 ? "bg-[var(--brand)] text-white" : "bg-white/5 text-[var(--ink-secondary)]"}`}
					>
						{c.icon} {c.name}
					</button>
				))}
			</div>
			<div id="product-grid" className="p-4 grid grid-cols-2 gap-2 rounded-lg">
				{products.map((p, i) => (
					<div
						key={p.name}
						id={i === 0 ? "product-item" : undefined}
						className="bg-[var(--bg-card)] rounded-lg p-3 border border-white/5 cursor-pointer hover:border-[var(--brand)]/50 transition-colors"
					>
						<p className="font-medium text-sm mb-1">{p.name}</p>
						<p className="text-[var(--brand)] text-sm font-bold">
							$ {p.price.toLocaleString()}
						</p>
					</div>
				))}
			</div>
			<div
				id="order-summary"
				className="mx-4 mb-3 bg-[var(--bg-elevated)] rounded-xl p-4 border border-white/5"
			>
				<SectionTitle>Pedido actual</SectionTitle>
				{[
					{ name: "Gin Tonic", qty: 2, price: 8400 },
					{ name: "Fernet con Coca", qty: 1, price: 3500 },
				].map((item) => (
					<div
						key={item.name}
						className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
					>
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-1">
								<button className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
									<Minus size={12} />
								</button>
								<span className="text-sm font-bold w-6 text-center">
									{item.qty}
								</span>
								<button className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
									<Plus size={12} />
								</button>
							</div>
							<span className="text-sm">{item.name}</span>
						</div>
						<span className="text-sm font-medium">
							$ {item.price.toLocaleString()}
						</span>
					</div>
				))}
				<div id="notes-field" className="mt-3 rounded-lg">
					<div className="bg-[var(--bg-secondary)] rounded-lg px-3 py-2 text-xs text-[var(--ink-faint)] border border-white/5 italic">
						Notas: "Sin hielo en el Gin Tonic"
					</div>
				</div>
			</div>
			<div className="px-4 pb-4">
				<button
					id="send-button"
					className="w-full py-3 rounded-xl bg-[var(--brand)] text-white font-bold flex items-center justify-center gap-2"
				>
					<Send size={16} /> Enviar Pedido — $ 11.900
				</button>
			</div>
		</div>
	);
}

/* ─── Waiter: Ready ────────────────────────────────────── */
export function WaiterReadyScreen() {
	const readyItems = [
		{
			name: "Gin Tonic x2",
			table: 3,
			minutes: 2,
			from: "Barra",
		},
		{
			name: "Pizza Muzza",
			table: 1,
			minutes: 5,
			from: "Cocina",
		},
		{
			name: "Fernet con Coca",
			table: 5,
			minutes: 1,
			from: "Barra",
		},
		{
			name: "Milanesa Napolitana",
			table: 1,
			minutes: 8,
			from: "Cocina",
		},
	];

	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5">
				<h2 className="font-bold">Pedidos Listos</h2>
			</div>
			<div id="ready-list" className="p-4 space-y-3 rounded-lg">
				{readyItems.map((item, i) => (
					<div
						key={i}
						id={i === 0 ? "ready-item" : undefined}
						className="bg-[var(--bg-card)] rounded-xl p-4 border border-emerald-500/30 flex items-center justify-between"
					>
						<div>
							<p className="font-medium">{item.name}</p>
							<p className="text-xs text-[var(--ink-faint)] mt-1">
								Desde: {item.from}
							</p>
						</div>
						<div className="text-right">
							<span
								id={i === 0 ? "ready-table-badge" : undefined}
								className="inline-block px-2 py-0.5 rounded-full bg-[var(--brand)]/20 text-[var(--brand)] text-xs font-bold"
							>
								Mesa {item.table}
							</span>
							<p
								id={i === 0 ? "ready-timer" : undefined}
								className={`text-xs mt-1 ${item.minutes > 5 ? "text-[var(--danger)]" : "text-[var(--ink-faint)]"}`}
							>
								<Clock size={10} className="inline mr-1" />
								{item.minutes} min esperando
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─── Waiter: Payment ──────────────────────────────────── */
export function WaiterPaymentScreen() {
	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5">
				<h2 className="font-bold">Cobrar</h2>
			</div>
			<div className="p-4 space-y-4">
				<div id="payment-table-select" className="rounded-lg">
					<SectionTitle>Mesa a cobrar</SectionTitle>
					<div className="bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--brand)]/50">
						<span className="font-bold">Mesa 5</span>
						<span className="text-[var(--ink-faint)] text-sm ml-2">Afuera</span>
					</div>
				</div>
				<div id="payment-total" className="text-center py-4 rounded-lg">
					<p className="text-xs text-[var(--ink-faint)] uppercase tracking-widest">
						Total
					</p>
					<p className="text-4xl font-extrabold text-[var(--brand)]">
						$ 22.300
					</p>
				</div>
				<SectionTitle>Metodo de pago</SectionTitle>
				<div className="grid grid-cols-2 gap-3">
					<div
						id="payment-cash"
						className="bg-[var(--bg-card)] rounded-xl p-4 border border-white/5 flex flex-col items-center gap-2 cursor-pointer hover:border-emerald-500/50"
					>
						<Banknote size={28} className="text-emerald-400" />
						<span className="font-medium text-sm">Efectivo</span>
					</div>
					<div
						id="payment-card"
						className="bg-[var(--bg-card)] rounded-xl p-4 border border-white/5 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-500/50"
					>
						<CreditCard size={28} className="text-blue-400" />
						<span className="font-medium text-sm">Tarjeta</span>
					</div>
					<div
						id="payment-mp"
						className="bg-[var(--bg-card)] rounded-xl p-4 border border-cyan-500/50 flex flex-col items-center gap-2 cursor-pointer bg-cyan-500/5"
					>
						<QrCode size={28} className="text-cyan-400" />
						<span className="font-medium text-sm">MercadoPago</span>
					</div>
					<div
						id="payment-transfer"
						className="bg-[var(--bg-card)] rounded-xl p-4 border border-white/5 flex flex-col items-center gap-2 cursor-pointer hover:border-amber-500/50"
					>
						<ArrowRightLeft size={28} className="text-amber-400" />
						<span className="font-medium text-sm">Transferencia</span>
					</div>
				</div>
				<div
					id="payment-qr-display"
					className="bg-[var(--bg-card)] rounded-xl p-6 border border-cyan-500/30 text-center"
				>
					<div className="w-40 h-40 mx-auto bg-white rounded-xl p-3 mb-3">
						<div className="w-full h-full bg-[repeating-conic-gradient(#000_0%_25%,#fff_0%_50%)] bg-[length:10px_10px] rounded-lg opacity-70" />
					</div>
					<p className="text-xs text-cyan-400 font-medium">
						QR listo — Esperando pago del cliente...
					</p>
				</div>
				<div
					id="payment-alias-display"
					className="bg-[var(--bg-card)] rounded-xl p-4 border border-amber-500/30"
				>
					<p className="text-xs text-[var(--ink-faint)] mb-2">
						Alias para transferir
					</p>
					<div className="flex items-center justify-between">
						<span className="font-mono text-lg font-bold text-amber-400">
							myway.bar
						</span>
						<button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium">
							<Copy size={12} /> Copiar
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── KDS: Kitchen / Bar Board ─────────────────────────── */
export function KDSBoardScreen({ variant }: { variant: "kitchen" | "bar" }) {
	const isKitchen = variant === "kitchen";
	const pendingOrders = [
		{
			table: 3,
			items: isKitchen
				? ["Pizza Muzza", "Milanesa Napo"]
				: ["Gin Tonic x2", "Fernet"],
			notes: isKitchen ? "Sin cebolla en la milanga" : "Gin con pepino",
			minutes: 3,
		},
		{
			table: 5,
			items: isKitchen ? ["Hamburguesa Completa"] : ["Aperol Spritz", "Mojito"],
			notes: "",
			minutes: 1,
		},
	];
	const preparingOrders = [
		{
			table: 1,
			items: isKitchen ? ["Empanadas x6"] : ["Cerveza Tirada x3"],
			notes: "",
			minutes: 8,
		},
	];

	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 flex items-center justify-between border-b border-white/5">
				<h2 className="font-bold flex items-center gap-2">
					{isKitchen ? (
						<ChefHat size={18} />
					) : (
						<span className="text-lg">🍸</span>
					)}
					{isKitchen ? "Cocina" : "Barra"}
				</h2>
				<div
					id="kds-sound-indicator"
					className="flex items-center gap-1 text-[var(--success)] rounded-md px-2 py-1"
				>
					<Volume2 size={14} />
					<span className="text-xs">Sonido ON</span>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-0 min-h-[400px]">
				{/* Pending column */}
				<div
					id="kds-pending-column"
					className="border-r border-white/5 p-3 rounded-lg"
				>
					<h3 className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-3 text-center">
						Pendientes ({pendingOrders.length})
					</h3>
					<div className="space-y-2">
						{pendingOrders.map((order, i) => (
							<div
								key={i}
								id={i === 0 ? "kds-order-card" : undefined}
								className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/30 cursor-pointer"
							>
								<div className="flex items-center justify-between mb-2">
									<span className="font-bold text-sm">Mesa {order.table}</span>
									<span
										id={i === 0 ? "kds-timer" : undefined}
										className={`text-xs ${order.minutes > 5 ? "text-[var(--danger)]" : "text-[var(--ink-faint)]"}`}
									>
										{order.minutes} min
									</span>
								</div>
								{order.items.map((item) => (
									<p key={item} className="text-sm text-[var(--ink-secondary)]">
										{item}
									</p>
								))}
								{order.notes && (
									<p
										id={i === 0 ? "kds-item-notes" : undefined}
										className="text-xs text-amber-400 italic mt-2 rounded-md"
									>
										"{order.notes}"
									</p>
								)}
							</div>
						))}
					</div>
				</div>
				{/* Preparing column */}
				<div id="kds-preparing-column" className="p-3 rounded-lg">
					<h3 className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-3 text-center">
						Preparando ({preparingOrders.length})
					</h3>
					<div className="space-y-2">
						{preparingOrders.map((order, i) => (
							<div
								key={i}
								className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30"
							>
								<div className="flex items-center justify-between mb-2">
									<span className="font-bold text-sm">Mesa {order.table}</span>
									<span className="text-xs text-[var(--ink-faint)]">
										{order.minutes} min
									</span>
								</div>
								{order.items.map((item) => (
									<p key={item} className="text-sm text-[var(--ink-secondary)]">
										{item}
									</p>
								))}
								<button
									id={i === 0 ? "kds-mark-ready" : undefined}
									className="mt-2 w-full py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30"
								>
									<Check size={12} className="inline mr-1" /> Marcar Listo
								</button>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

/* ─── Stock Screen ─────────────────────────────────────── */
export function StockScreen({ variant }: { variant: "kitchen" | "bar" }) {
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
		if (ratio < 1) return "red";
		if (ratio < 1.5) return "yellow";
		return "green";
	};

	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5">
				<h2 className="font-bold">
					Stock de {variant === "kitchen" ? "Cocina" : "Barra"}
				</h2>
			</div>
			<div id="stock-list" className="p-4 space-y-3 rounded-lg">
				{items.map((item, i) => {
					const level = getLevel(item.current, item.threshold);
					const colors = {
						green: {
							bar: "bg-emerald-500",
							text: "text-emerald-400",
							bg: "bg-emerald-500/10",
						},
						yellow: {
							bar: "bg-amber-500",
							text: "text-amber-400",
							bg: "bg-amber-500/10",
						},
						red: {
							bar: "bg-red-500",
							text: "text-red-400",
							bg: "bg-red-500/10",
						},
					}[level];
					return (
						<div
							key={item.name}
							id={
								i === 0
									? `stock-bar-${level}`
									: i === 1
										? "stock-bar-yellow"
										: i === 2
											? "stock-bar-red"
											: undefined
							}
							className={`${colors.bg} rounded-xl p-4 border border-white/5`}
						>
							<div className="flex items-center justify-between mb-2">
								<span className="font-medium">{item.name}</span>
								{level === "red" && (
									<AlertTriangle size={14} className="text-red-400" />
								)}
							</div>
							<div className="flex items-center gap-3">
								<div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
									<div
										className={`h-full rounded-full ${colors.bar}`}
										style={{
											width: `${Math.min((item.current / (item.threshold * 2)) * 100, 100)}%`,
										}}
									/>
								</div>
								<span className={`text-sm font-bold ${colors.text}`}>
									{item.current} {item.unit}
								</span>
							</div>
							<p className="text-xs text-[var(--ink-faint)] mt-1">
								Minimo: {item.threshold} {item.unit}
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
		{ n: 1, x: 10, y: 10, w: 18, h: 18, status: "occupied" },
		{ n: 2, x: 35, y: 10, w: 18, h: 18, status: "available" },
		{ n: 3, x: 60, y: 10, w: 18, h: 18, status: "occupied" },
		{ n: 4, x: 10, y: 45, w: 18, h: 18, status: "available" },
		{ n: 5, x: 35, y: 45, w: 18, h: 18, status: "occupied" },
		{ n: 6, x: 60, y: 45, w: 18, h: 18, status: "available" },
	];

	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5 flex items-center justify-between">
				<h2 className="font-bold">POS — Salon</h2>
				<div id="pos-zoom-controls" className="flex gap-1 rounded-md">
					<button className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold">
						-
					</button>
					<button className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold">
						+
					</button>
				</div>
			</div>
			<div className="flex">
				{/* Floor plan */}
				<div
					id="pos-floor-plan"
					className="flex-1 relative h-[350px] bg-[var(--bg-secondary)] m-3 rounded-xl border border-white/5 overflow-hidden"
				>
					{tables.map((t) => {
						const isOcc = t.status === "occupied";
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
								className={`absolute rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
									isOcc
										? "bg-orange-500/20 border-2 border-orange-500/50"
										: "bg-emerald-500/20 border-2 border-emerald-500/50"
								}`}
								style={{
									left: `${t.x}%`,
									top: `${t.y}%`,
									width: `${t.w}%`,
									height: `${t.h}%`,
								}}
							>
								<span className="font-bold text-sm">{t.n}</span>
								{isOcc && (
									<span className="text-[10px] text-orange-400">$ 12.500</span>
								)}
							</div>
						);
					})}
				</div>
				{/* Side panel */}
				<div
					id="pos-panel"
					className="w-[220px] border-l border-white/5 p-3 rounded-lg"
				>
					<h3 className="font-bold mb-2">Mesa 3</h3>
					<div className="space-y-1 text-sm mb-3">
						<div className="flex justify-between">
							<span>Gin Tonic x2</span>
							<span>$8.400</span>
						</div>
						<div className="flex justify-between">
							<span>Pizza Muzza</span>
							<span>$4.500</span>
						</div>
						<div className="border-t border-white/5 pt-1 mt-1 font-bold flex justify-between">
							<span>Total</span>
							<span className="text-[var(--brand)]">$12.900</span>
						</div>
					</div>
					<div
						id="pos-pay-buttons"
						className="grid grid-cols-2 gap-2 rounded-lg"
					>
						<button className="py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
							Efectivo
						</button>
						<button className="py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
							Tarjeta
						</button>
						<button className="py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30">
							MP QR
						</button>
						<button className="py-2 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
							Transfer
						</button>
					</div>
					<div
						id="pos-qr-area"
						className="mt-3 bg-[var(--bg-elevated)] rounded-lg p-2 text-center border border-white/5"
					>
						<div className="w-16 h-16 mx-auto bg-white rounded-lg mb-1" />
						<p className="text-[10px] text-cyan-400">QR / Alias</p>
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
		},
		{
			id: 2,
			table: 3,
			status: "preparing",
			total: 8900,
			waiter: "Sofia",
			time: "21:45",
		},
		{
			id: 3,
			table: 5,
			status: "pending",
			total: 22300,
			waiter: "Martin",
			time: "22:00",
		},
		{
			id: 4,
			table: 2,
			status: "closed",
			total: 15600,
			waiter: "Sofia",
			time: "20:15",
		},
	];
	const statusColors: Record<string, string> = {
		pending: "bg-amber-500/20 text-amber-400",
		preparing: "bg-blue-500/20 text-blue-400",
		ready: "bg-emerald-500/20 text-emerald-400",
		closed: "bg-white/5 text-[var(--ink-faint)]",
	};
	const statusLabels: Record<string, string> = {
		pending: "Pendiente",
		preparing: "Preparando",
		ready: "Listo",
		closed: "Cerrado",
	};

	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5">
				<h2 className="font-bold">Pedidos</h2>
			</div>
			<div
				id="orders-filter"
				className="flex gap-2 px-4 py-3 border-b border-white/5 items-center rounded-lg"
			>
				<div className="flex-1 relative">
					<Search
						size={14}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]"
					/>
					<div className="bg-[var(--bg-card)] rounded-lg pl-8 pr-3 py-2 text-sm text-[var(--ink-faint)] border border-white/5">
						Buscar mesa...
					</div>
				</div>
				{["Todos", "Pendiente", "Listo", "Cerrado"].map((f, i) => (
					<button
						key={f}
						className={`px-3 py-1.5 rounded-full text-xs font-medium ${i === 0 ? "bg-[var(--brand)] text-white" : "bg-white/5 text-[var(--ink-secondary)]"}`}
					>
						{f}
					</button>
				))}
			</div>
			<div id="orders-list" className="p-4 space-y-2 rounded-lg">
				{orders.map((o) => (
					<div
						key={o.id}
						className="bg-[var(--bg-card)] rounded-xl p-4 border border-white/5 flex items-center justify-between"
					>
						<div className="flex items-center gap-3">
							<span className="font-bold">Mesa {o.table}</span>
							<span
								id={o.id === 1 ? "orders-status-badge" : undefined}
								className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status]}`}
							>
								{statusLabels[o.status]}
							</span>
						</div>
						<div className="text-right">
							<p className="font-bold text-sm">$ {o.total.toLocaleString()}</p>
							<p className="text-xs text-[var(--ink-faint)]">
								{o.waiter} — {o.time}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─── Repartidor ───────────────────────────────────────── */
export function RepartidorScreen() {
	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5">
				<h2 className="font-bold flex items-center gap-2">
					<Truck size={18} /> Entrega #1042
				</h2>
			</div>
			<div className="p-4 space-y-4">
				<Card id="delivery-customer-info">
					<SectionTitle>Cliente</SectionTitle>
					<p className="font-medium">Juan Perez</p>
					<p className="text-sm text-[var(--ink-secondary)] flex items-center gap-1 mt-1">
						<MapPin size={12} /> Av. Libertador 1234, Olivos
					</p>
					<p className="text-sm text-[var(--ink-secondary)] flex items-center gap-1 mt-1">
						<Phone size={12} /> 11-2345-6789
					</p>
				</Card>
				<Card id="delivery-items">
					<SectionTitle>Items</SectionTitle>
					{[
						{ name: "Hamburguesa Completa x2", price: 9800 },
						{ name: "Papas Fritas", price: 3200 },
						{ name: "Coca Cola 1.5L", price: 2500 },
					].map((item) => (
						<div
							key={item.name}
							className="flex justify-between py-1.5 border-b border-white/5 last:border-0 text-sm"
						>
							<span>{item.name}</span>
							<span>$ {item.price.toLocaleString()}</span>
						</div>
					))}
				</Card>
				<div
					id="delivery-total"
					className="bg-[var(--brand)]/10 rounded-xl p-4 border border-[var(--brand)]/30 flex justify-between items-center"
				>
					<div>
						<p className="text-xs text-[var(--ink-faint)]">Total</p>
						<p className="text-2xl font-extrabold text-[var(--brand)]">
							$ 15.500
						</p>
					</div>
					<span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
						Efectivo
					</span>
				</div>
				<div
					id="delivery-gps"
					className="bg-[var(--bg-card)] rounded-xl p-4 border border-white/5 text-center"
				>
					<div className="w-full h-24 bg-[var(--bg-secondary)] rounded-lg mb-2 flex items-center justify-center">
						<MapPin size={24} className="text-[var(--brand)] animate-bounce" />
					</div>
					<p className="text-xs text-[var(--success)]">
						GPS compartiendo ubicacion...
					</p>
				</div>
				<button
					id="delivery-complete"
					className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold text-lg flex items-center justify-center gap-2"
				>
					<Check size={20} /> Marcar como Entregado
				</button>
			</div>
		</div>
	);
}

/* ─── Admin Dashboard ──────────────────────────────────── */
export function AdminDashboardScreen() {
	const kpis = [
		{
			id: "admin-kpi-orders",
			label: "Pedidos",
			value: "47",
			icon: Package,
			color: "text-blue-400",
		},
		{
			id: "admin-kpi-revenue",
			label: "Facturacion",
			value: "$385.200",
			icon: DollarSign,
			color: "text-emerald-400",
		},
		{
			id: "admin-kpi-costs",
			label: "Costos",
			value: "$142.800",
			icon: TrendingUp,
			color: "text-amber-400",
		},
		{
			id: "admin-kpi-margin",
			label: "Margen",
			value: "$242.400",
			icon: BarChart3,
			color: "text-[var(--brand)]",
		},
	];
	const links = [
		"Menu",
		"Mesas",
		"Empleados",
		"Gastos",
		"Caja",
		"Proveedores",
		"Facturas",
		"Analytics",
	];

	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="flex">
				{/* Sidebar */}
				<div
					id="admin-sidebar"
					className="w-[180px] bg-[var(--bg-secondary)] border-r border-white/5 p-3 min-h-[500px] rounded-lg"
				>
					<div className="flex items-center gap-2 mb-4 px-2">
						<ShieldCheck size={16} className="text-[var(--brand)]" />
						<span className="font-bold text-sm">Admin</span>
					</div>
					{[
						"Dashboard",
						"Menu",
						"Mesas",
						"Empleados",
						"Delivery",
						"Proveedores",
						"Gastos",
						"Caja",
						"Contabilidad",
						"Facturas",
						"MercadoPago",
						"AFIP",
						"Analytics",
					].map((item, i) => (
						<div
							key={item}
							className={`px-3 py-2 rounded-lg text-xs mb-0.5 ${i === 0 ? "bg-[var(--brand)]/20 text-[var(--brand)] font-medium" : "text-[var(--ink-secondary)] hover:bg-white/5"}`}
						>
							{item}
						</div>
					))}
				</div>
				{/* Main */}
				<div className="flex-1 p-4">
					<h2 className="font-bold text-lg mb-4">Dashboard</h2>
					<div className="grid grid-cols-2 gap-3 mb-6">
						{kpis.map((kpi) => (
							<Card key={kpi.id} id={kpi.id}>
								<div className="flex items-center gap-2 mb-1">
									<kpi.icon size={14} className={kpi.color} />
									<span className="text-xs text-[var(--ink-faint)]">
										{kpi.label}
									</span>
								</div>
								<p className="text-xl font-extrabold">{kpi.value}</p>
							</Card>
						))}
					</div>
					<div id="admin-quick-links" className="rounded-lg">
						<SectionTitle>Accesos rapidos</SectionTitle>
						<div className="grid grid-cols-4 gap-2">
							{links.map((link) => (
								<div
									key={link}
									className="bg-[var(--bg-card)] rounded-lg p-3 text-center border border-white/5 text-xs font-medium cursor-pointer hover:border-[var(--brand)]/30"
								>
									{link}
								</div>
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
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5 flex justify-between items-center">
				<h2 className="font-bold">Gestion de Menu</h2>
				<button
					id="menu-add-product"
					className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-bold flex items-center gap-1"
				>
					<Plus size={12} /> Nuevo Producto
				</button>
			</div>
			<div className="flex">
				<div
					id="menu-categories"
					className="w-[160px] border-r border-white/5 p-3 rounded-lg"
				>
					<SectionTitle>Categorias</SectionTitle>
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
							className={`px-3 py-2 rounded-lg text-xs mb-1 cursor-pointer ${i === 1 ? "bg-[var(--brand)]/20 text-[var(--brand)]" : "text-[var(--ink-secondary)]"}`}
						>
							{cat}
						</div>
					))}
				</div>
				<div id="menu-product-list" className="flex-1 p-4 space-y-2 rounded-lg">
					{[
						{ name: "Gin Tonic", price: 4200, available: true },
						{ name: "Mojito Clasico", price: 4000, available: true },
						{ name: "Fernet con Coca", price: 3500, available: true },
						{ name: "Negroni", price: 4800, available: false },
					].map((p, i) => (
						<div
							key={p.name}
							className="bg-[var(--bg-card)] rounded-xl p-3 border border-white/5 flex items-center justify-between"
						>
							<div>
								<span className="font-medium text-sm">{p.name}</span>
								<span className="text-[var(--brand)] text-sm font-bold ml-3">
									$ {p.price.toLocaleString()}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span
									id={i === 3 ? "menu-toggle-available" : undefined}
									className="cursor-pointer"
								>
									{p.available ? (
										<ToggleRight size={24} className="text-emerald-400" />
									) : (
										<ToggleLeft size={24} className="text-[var(--ink-faint)]" />
									)}
								</span>
								<Pencil
									size={14}
									className="text-[var(--ink-faint)] cursor-pointer"
								/>
								<Trash2
									size={14}
									className="text-[var(--ink-faint)] cursor-pointer"
								/>
							</div>
						</div>
					))}
					<div
						id="menu-recipe"
						className="bg-[var(--bg-elevated)] rounded-xl p-4 border border-white/10 mt-4"
					>
						<SectionTitle>Receta — Gin Tonic</SectionTitle>
						<div className="space-y-1 text-sm">
							<div className="flex justify-between">
								<span>Gin Bombay</span>
								<span className="text-[var(--ink-secondary)]">60 ml</span>
							</div>
							<div className="flex justify-between">
								<span>Tonica Schweppes</span>
								<span className="text-[var(--ink-secondary)]">200 ml</span>
							</div>
							<div className="flex justify-between">
								<span>Limon</span>
								<span className="text-[var(--ink-secondary)]">1 rodaja</span>
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
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5 flex justify-between">
				<h2 className="font-bold">Gestion de Mesas</h2>
				<div className="flex gap-2">
					<button
						id="tables-add"
						className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-bold"
					>
						<Plus size={12} className="inline mr-1" /> Mesa
					</button>
					<button
						id="tables-qr-download"
						className="px-3 py-1.5 rounded-lg bg-white/5 text-[var(--ink-secondary)] text-xs font-medium"
					>
						<Download size={12} className="inline mr-1" /> QRs ZIP
					</button>
				</div>
			</div>
			<div className="flex">
				<div
					id="tables-visual-editor"
					className="flex-1 relative h-[300px] bg-[var(--bg-secondary)] m-3 rounded-xl border border-dashed border-white/10"
				>
					{[
						{ n: 1, x: 15, y: 15, shape: "rounded-xl" },
						{ n: 2, x: 45, y: 15, shape: "rounded-full" },
						{ n: 3, x: 75, y: 15, shape: "rounded-xl" },
						{ n: 4, x: 15, y: 55, shape: "rounded-xl" },
						{ n: 5, x: 45, y: 55, shape: "rounded-full" },
					].map((t) => (
						<div
							key={t.n}
							id={t.n === 1 ? "tables-qr" : undefined}
							className={`absolute w-16 h-16 bg-[var(--bg-card)] border-2 border-dashed border-[var(--brand)]/30 ${t.shape} flex items-center justify-center cursor-move hover:border-[var(--brand)]`}
							style={{ left: `${t.x}%`, top: `${t.y}%` }}
						>
							<span className="text-sm font-bold">{t.n}</span>
						</div>
					))}
				</div>
				<div
					id="tables-zones"
					className="w-[160px] border-l border-white/5 p-3 rounded-lg"
				>
					<SectionTitle>Zonas</SectionTitle>
					{["Salon Principal", "Afuera", "VIP"].map((z, i) => (
						<div
							key={z}
							className={`px-3 py-2 rounded-lg text-xs mb-1 ${i === 0 ? "bg-[var(--brand)]/20 text-[var(--brand)]" : "bg-white/5 text-[var(--ink-secondary)]"}`}
						>
							{z}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Employees ──────────────────────────────────── */
export function AdminEmployeesScreen() {
	const staff = [
		{
			name: "Carlos Admin",
			role: "admin",
			pin: "1234",
			color: "text-amber-400",
		},
		{
			name: "Martin Garcia",
			role: "waiter",
			pin: "5678",
			color: "text-blue-400",
		},
		{
			name: "Sofia Lopez",
			role: "waiter",
			pin: "4321",
			color: "text-blue-400",
		},
		{
			name: "Pedro Cocina",
			role: "kitchen",
			pin: "8765",
			color: "text-emerald-400",
		},
		{ name: "Laura Barra", role: "bar", pin: "1111", color: "text-purple-400" },
		{
			name: "Diego Repartidor",
			role: "repartidor",
			pin: "9999",
			color: "text-pink-400",
		},
	];

	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5 flex justify-between">
				<h2 className="font-bold">Empleados</h2>
				<button
					id="emp-add"
					className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-bold"
				>
					<Plus size={12} className="inline mr-1" /> Nuevo
				</button>
			</div>
			<div id="emp-list" className="p-4 space-y-2 rounded-lg">
				{staff.map((s, i) => (
					<div
						key={s.name}
						className="bg-[var(--bg-card)] rounded-xl p-4 border border-white/5 flex items-center justify-between"
					>
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-lg">
								{s.name.charAt(0)}
							</div>
							<div>
								<p className="font-medium text-sm">{s.name}</p>
								<p
									id={i === 0 ? "emp-role" : undefined}
									className={`text-xs font-medium ${s.color} rounded-sm`}
								>
									{s.role}
								</p>
							</div>
						</div>
						<span
							id={i === 0 ? "emp-pin" : undefined}
							className="font-mono text-sm bg-white/5 px-3 py-1 rounded-lg"
						>
							PIN: {s.pin}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─── Admin Suppliers ──────────────────────────────────── */
export function AdminSuppliersScreen() {
	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5 flex justify-between">
				<h2 className="font-bold">Proveedores</h2>
				<button
					id="supplier-add"
					className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-bold"
				>
					<Plus size={12} className="inline mr-1" /> Nuevo
				</button>
			</div>
			<div id="supplier-list" className="p-4 space-y-2 rounded-lg">
				{[
					{
						name: "Distribuidora Norte",
						cat: "Bebidas",
						cuit: "30-12345678-9",
					},
					{ name: "Carnes Premium", cat: "Alimentos", cuit: "20-87654321-0" },
					{ name: "Limpieza Total", cat: "Limpieza", cuit: "33-11223344-5" },
				].map((s) => (
					<div
						key={s.name}
						className="bg-[var(--bg-card)] rounded-xl p-4 border border-white/5"
					>
						<div className="flex justify-between items-start">
							<div>
								<p className="font-medium">{s.name}</p>
								<p className="text-xs text-[var(--ink-faint)]">
									CUIT: {s.cuit}
								</p>
							</div>
							<span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">
								{s.cat}
							</span>
						</div>
						<div
							id={
								s.name === "Distribuidora Norte"
									? "supplier-invoices"
									: undefined
							}
							className="mt-2 text-xs text-[var(--ink-secondary)] flex items-center gap-1 rounded-md"
						>
							<FileText size={12} /> 5 facturas registradas
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─── Admin Expenses ───────────────────────────────────── */
export function AdminExpensesScreen() {
	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5 flex justify-between">
				<h2 className="font-bold">Gastos</h2>
				<button
					id="expense-add"
					className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-bold"
				>
					<Plus size={12} className="inline mr-1" /> Nuevo Gasto
				</button>
			</div>
			<div
				id="expense-filter"
				className="flex gap-2 px-4 py-3 border-b border-white/5 rounded-lg"
			>
				<div className="flex items-center gap-1 bg-[var(--bg-card)] px-3 py-1.5 rounded-lg border border-white/5 text-xs">
					<Calendar size={12} /> 01/03 - 26/03
				</div>
				<button className="px-3 py-1.5 rounded-full text-xs bg-[var(--brand)] text-white">
					Todas
				</button>
				<button className="px-3 py-1.5 rounded-full text-xs bg-white/5 text-[var(--ink-secondary)]">
					Servicios
				</button>
			</div>
			<div id="expense-list" className="p-4 space-y-2 rounded-lg">
				{[
					{
						desc: "Alquiler local",
						amount: 250000,
						cat: "Alquiler",
						recurring: true,
					},
					{
						desc: "Electricidad marzo",
						amount: 45000,
						cat: "Servicios",
						recurring: false,
					},
					{
						desc: "Compra bebidas",
						amount: 85000,
						cat: "Mercaderia",
						recurring: false,
					},
				].map((e) => (
					<div
						key={e.desc}
						className="bg-[var(--bg-card)] rounded-xl p-4 border border-white/5 flex justify-between items-center"
					>
						<div>
							<p className="font-medium text-sm">{e.desc}</p>
							<p className="text-xs text-[var(--ink-faint)]">{e.cat}</p>
						</div>
						<div className="text-right">
							<p className="font-bold text-[var(--danger)]">
								-$ {e.amount.toLocaleString()}
							</p>
							{e.recurring && (
								<span
									id="expense-recurring"
									className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full"
								>
									Recurrente
								</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─── Admin Cash Register ──────────────────────────────── */
export function AdminCashScreen() {
	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5">
				<h2 className="font-bold">Caja Registradora</h2>
			</div>
			<div className="p-4 space-y-4">
				<div className="flex gap-3">
					<button
						id="cash-open"
						className="flex-1 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30"
					>
						Abrir Caja
					</button>
					<button
						id="cash-close"
						className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 font-bold border border-red-500/30"
					>
						Cerrar Caja
					</button>
				</div>
				<Card id="cash-balance">
					<div className="text-center">
						<p className="text-xs text-[var(--ink-faint)]">Saldo actual</p>
						<p className="text-3xl font-extrabold text-emerald-400">
							$ 185.400
						</p>
						<p className="text-xs text-[var(--ink-faint)] mt-1">
							Apertura: $ 10.000 | Ingresos: $ 225.400 | Egresos: $ 50.000
						</p>
					</div>
				</Card>
				<div id="cash-movements" className="rounded-lg">
					<SectionTitle>Ultimos movimientos</SectionTitle>
					{[
						{ concept: "Mesa 3 — Efectivo", amount: 12500, type: "in" },
						{ concept: "Compra hielo", amount: -3500, type: "out" },
						{ concept: "Mesa 1 — Efectivo", amount: 8900, type: "in" },
					].map((m) => (
						<div
							key={m.concept}
							className="flex justify-between py-2 border-b border-white/5 text-sm"
						>
							<span>{m.concept}</span>
							<span
								className={
									m.type === "in"
										? "text-emerald-400 font-bold"
										: "text-red-400 font-bold"
								}
							>
								{m.type === "in" ? "+" : ""}${" "}
								{Math.abs(m.amount).toLocaleString()}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Accounting ─────────────────────────────────── */
export function AdminAccountingScreen() {
	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5">
				<h2 className="font-bold">Contabilidad</h2>
			</div>
			<div className="p-4 space-y-4">
				<div
					id="accounting-date-filter"
					className="flex items-center gap-2 rounded-lg"
				>
					<Calendar size={14} className="text-[var(--ink-faint)]" />
					<span className="text-sm bg-[var(--bg-card)] px-3 py-1.5 rounded-lg border border-white/5">
						01/03/2026 — 26/03/2026
					</span>
				</div>
				<Card id="accounting-summary">
					<SectionTitle>Resumen de gastos por categoria</SectionTitle>
					{[
						{ cat: "Mercaderia", amount: 185000, pct: 45 },
						{ cat: "Alquiler", amount: 250000, pct: 60 },
						{ cat: "Servicios", amount: 95000, pct: 75 },
						{ cat: "Personal", amount: 320000, pct: 90 },
					].map((item) => (
						<div key={item.cat} className="mb-3">
							<div className="flex justify-between text-sm mb-1">
								<span>{item.cat}</span>
								<span className="font-bold">
									$ {item.amount.toLocaleString()}
								</span>
							</div>
							<div className="h-2 bg-white/5 rounded-full overflow-hidden">
								<div
									className="h-full bg-[var(--brand)] rounded-full"
									style={{ width: `${item.pct}%` }}
								/>
							</div>
						</div>
					))}
				</Card>
				<Card id="accounting-budget">
					<SectionTitle>Presupuesto vs Real</SectionTitle>
					{[
						{ cat: "Mercaderia", budget: 200000, real: 185000 },
						{ cat: "Servicios", budget: 80000, real: 95000 },
					].map((item) => (
						<div
							key={item.cat}
							className="flex justify-between text-sm py-2 border-b border-white/5"
						>
							<span>{item.cat}</span>
							<div className="text-right">
								<span
									className={
										item.real > item.budget
											? "text-red-400"
											: "text-emerald-400"
									}
								>
									$ {item.real.toLocaleString()}
								</span>
								<span className="text-[var(--ink-faint)] ml-1">
									/ $ {item.budget.toLocaleString()}
								</span>
							</div>
						</div>
					))}
				</Card>
				<Card id="accounting-payment-breakdown">
					<SectionTitle>Ingresos por metodo de pago</SectionTitle>
					{[
						{ method: "Efectivo", amount: 145000, color: "bg-emerald-500" },
						{ method: "Tarjeta", amount: 98000, color: "bg-blue-500" },
						{ method: "MercadoPago", amount: 112000, color: "bg-cyan-500" },
						{ method: "Transferencia", amount: 30200, color: "bg-amber-500" },
					].map((item) => (
						<div
							key={item.method}
							className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
						>
							<div className={`w-3 h-3 rounded-full ${item.color}`} />
							<span className="text-sm flex-1">{item.method}</span>
							<span className="font-bold text-sm">
								$ {item.amount.toLocaleString()}
							</span>
						</div>
					))}
				</Card>
			</div>
		</div>
	);
}

/* ─── Admin Invoices ───────────────────────────────────── */
export function AdminInvoicesScreen() {
	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5 flex justify-between">
				<h2 className="font-bold">Facturacion AFIP</h2>
				<button
					id="invoice-create"
					className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-bold"
				>
					<Plus size={12} className="inline mr-1" /> Nueva Factura
				</button>
			</div>
			<div id="invoice-list" className="p-4 space-y-2 rounded-lg">
				{[
					{
						num: "B-0001-00042",
						date: "26/03",
						total: 12500,
						status: "issued",
						cae: "71234567890123",
					},
					{
						num: "B-0001-00041",
						date: "25/03",
						total: 8900,
						status: "issued",
						cae: "71234567890122",
					},
					{
						num: "B-0001-00043",
						date: "26/03",
						total: 5600,
						status: "draft",
						cae: "-",
					},
				].map((inv) => (
					<div
						key={inv.num}
						className="bg-[var(--bg-card)] rounded-xl p-4 border border-white/5 flex justify-between items-center"
					>
						<div>
							<p className="font-mono font-bold text-sm">{inv.num}</p>
							<p className="text-xs text-[var(--ink-faint)]">
								{inv.date} | CAE: {inv.cae}
							</p>
						</div>
						<div className="text-right">
							<p className="font-bold">$ {inv.total.toLocaleString()}</p>
							<span
								className={`text-xs px-2 py-0.5 rounded-full ${inv.status === "issued" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}
							>
								{inv.status === "issued" ? "Emitida" : "Borrador"}
							</span>
						</div>
					</div>
				))}
			</div>
			<div className="px-4 pb-4">
				<button
					id="invoice-send-afip"
					className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center justify-center gap-2"
				>
					<Receipt size={16} /> Enviar Borrador a AFIP
				</button>
			</div>
		</div>
	);
}

/* ─── Admin MercadoPago Config ─────────────────────────── */
export function AdminMPConfigScreen() {
	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5">
				<h2 className="font-bold flex items-center gap-2">
					<Settings size={16} /> Configuracion MercadoPago
				</h2>
			</div>
			<div className="p-4 space-y-4">
				<MockInput
					id="mp-access-token"
					label="Access Token"
					value="APP_USR-1234567890abcdef..."
					type="password"
				/>
				<MockInput
					id="mp-user-id"
					label="User ID (Collector)"
					value="123456789"
				/>
				<MockInput
					id="mp-pos-id"
					label="POS ID (Punto de Venta)"
					value="MYWAY_POS_001"
				/>
				<MockInput
					id="mp-webhook"
					label="Webhook Secret"
					value="whsec_..."
					type="password"
				/>
				<MockInput
					id="mp-transfer-alias"
					label="Alias de Transferencia"
					value="myway.bar"
				/>
				<button className="w-full py-3 rounded-xl bg-[var(--brand)] text-white font-bold">
					Guardar Cambios
				</button>
			</div>
		</div>
	);
}

/* ─── Admin AFIP Config ────────────────────────────────── */
export function AdminAFIPConfigScreen() {
	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5">
				<h2 className="font-bold flex items-center gap-2">
					<Settings size={16} /> Configuracion AFIP
				</h2>
			</div>
			<div className="p-4 space-y-4">
				<MockInput id="afip-cuit" label="CUIT" value="20-12345678-9" />
				<MockInput
					id="afip-razon"
					label="Razon Social"
					value="My Way Bar S.R.L."
				/>
				<div id="afip-regime" className="rounded-lg">
					<label className="text-xs text-[var(--ink-faint)] mb-1 block">
						Regimen Fiscal
					</label>
					<div className="flex gap-2">
						<button className="flex-1 py-2 rounded-lg bg-[var(--brand)]/20 text-[var(--brand)] text-sm font-bold border border-[var(--brand)]/30">
							Monotributo
						</button>
						<button className="flex-1 py-2 rounded-lg bg-white/5 text-[var(--ink-secondary)] text-sm border border-white/5">
							Resp. Inscripto
						</button>
					</div>
				</div>
				<div id="afip-certs" className="rounded-lg">
					<label className="text-xs text-[var(--ink-faint)] mb-1 block">
						Certificados PEM
					</label>
					<div className="grid grid-cols-2 gap-2">
						<div className="bg-[var(--bg-card)] rounded-lg p-3 border border-dashed border-white/10 text-center text-xs text-[var(--ink-faint)]">
							cert.pem (cargado)
						</div>
						<div className="bg-[var(--bg-card)] rounded-lg p-3 border border-dashed border-white/10 text-center text-xs text-[var(--ink-faint)]">
							key.pem (cargado)
						</div>
					</div>
				</div>
				<div id="afip-auto" className="rounded-lg">
					<SectionTitle>Auto-facturacion</SectionTitle>
					{["MercadoPago", "Efectivo", "Tarjeta"].map((m) => (
						<div
							key={m}
							className="flex justify-between items-center py-2 border-b border-white/5"
						>
							<span className="text-sm">{m}</span>
							<ToggleRight size={24} className="text-emerald-400" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/* ─── Admin Delivery ───────────────────────────────────── */
export function AdminDeliveryScreen() {
	return (
		<div className="bg-[var(--bg-primary)] rounded-2xl border border-white/5 overflow-hidden">
			<div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-white/5">
				<h2 className="font-bold flex items-center gap-2">
					<Truck size={16} /> Delivery
				</h2>
			</div>
			<div className="p-4 space-y-4">
				<div id="admin-delivery-list" className="space-y-2 rounded-lg">
					{[
						{
							customer: "Juan Perez",
							address: "Libertador 1234",
							status: "en_camino",
							driver: "Diego",
						},
						{
							customer: "Maria Lopez",
							address: "San Martin 567",
							status: "preparing",
							driver: "-",
						},
						{
							customer: "Pedro Garcia",
							address: "Maipu 890",
							status: "pending",
							driver: "-",
						},
					].map((o) => (
						<div
							key={o.customer}
							className="bg-[var(--bg-card)] rounded-xl p-4 border border-white/5"
						>
							<div className="flex justify-between mb-2">
								<p className="font-medium">{o.customer}</p>
								<span
									className={`text-xs px-2 py-0.5 rounded-full ${
										o.status === "en_camino"
											? "bg-blue-500/20 text-blue-400"
											: o.status === "preparing"
												? "bg-amber-500/20 text-amber-400"
												: "bg-white/10 text-[var(--ink-faint)]"
									}`}
								>
									{o.status === "en_camino"
										? "En camino"
										: o.status === "preparing"
											? "Preparando"
											: "Pendiente"}
								</span>
							</div>
							<p className="text-xs text-[var(--ink-faint)] flex items-center gap-1">
								<MapPin size={10} /> {o.address}
							</p>
							<div
								id={
									o.customer === "Pedro Garcia"
										? "admin-delivery-assign"
										: undefined
								}
								className="mt-2 flex items-center gap-2 rounded-md"
							>
								<Users size={12} className="text-[var(--ink-faint)]" />
								<span className="text-xs text-[var(--ink-secondary)]">
									{o.driver === "-" ? (
										<button className="text-[var(--brand)]">
											Asignar repartidor
										</button>
									) : (
										o.driver
									)}
								</span>
							</div>
						</div>
					))}
				</div>
				<div
					id="admin-delivery-map"
					className="bg-[var(--bg-card)] rounded-xl p-4 border border-white/5 text-center h-36 flex items-center justify-center"
				>
					<div>
						<MapPin size={32} className="text-[var(--brand)] mx-auto mb-2" />
						<p className="text-xs text-[var(--ink-faint)]">
							Mapa de flota en tiempo real
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
