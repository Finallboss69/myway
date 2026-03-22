import Link from "next/link";

const SECTIONS = [
	{
		id: "pos",
		name: "POS — Caja",
		description: "Terminal de punto de venta para cajeros",
		icon: "💻",
		color: "#f59e0b",
		pages: [
			{ name: "Login / PIN", href: "/pos", tag: "auth" },
			{ name: "Mapa del salón", href: "/pos/salon", tag: "desktop" },
			{ name: "Mesa 2 — Detalle", href: "/pos/salon/t2", tag: "desktop" },
			{ name: "Pedidos activos", href: "/pos/orders", tag: "desktop" },
		],
	},
	{
		id: "kitchen",
		name: "Cocina — KDS",
		description: "Pantalla de visualización para la cocina",
		icon: "🍳",
		color: "#3b82f6",
		pages: [
			{ name: "Display KDS", href: "/kitchen", tag: "tv" },
			{ name: "Stock de cocina", href: "/kitchen/stock", tag: "desktop" },
		],
	},
	{
		id: "bar",
		name: "Bar",
		description: "Display del bartender con fichas de pool",
		icon: "🍸",
		color: "#8b5cf6",
		pages: [
			{ name: "Display del bar", href: "/bar", tag: "tv" },
			{ name: "Stock del bar", href: "/bar/stock", tag: "desktop" },
		],
	},
	{
		id: "waiter",
		name: "Mozo — PWA",
		description: "Aplicación móvil para mozos",
		icon: "🛎️",
		color: "#22c55e",
		pages: [
			{ name: "Login / PIN", href: "/waiter", tag: "mobile" },
			{ name: "Mis mesas", href: "/waiter/tables", tag: "mobile" },
			{ name: "Mesa 2 — Pedido", href: "/waiter/table/t2", tag: "mobile" },
			{ name: "Cobrar mesa", href: "/waiter/payment", tag: "mobile" },
		],
	},
	{
		id: "customer",
		name: "Cliente — QR",
		description: "Menú digital y pedidos desde el celular",
		icon: "📱",
		color: "#ec4899",
		pages: [
			{ name: "Menú QR", href: "/customer/menu", tag: "mobile" },
			{ name: "Carrito", href: "/customer/menu/cart", tag: "mobile" },
			{
				name: "Estado del pedido",
				href: "/customer/order-status",
				tag: "mobile",
			},
			{ name: "Delivery", href: "/customer/delivery", tag: "mobile" },
		],
	},
	{
		id: "admin",
		name: "Admin",
		description: "Panel de gestión para el dueño",
		icon: "⚙️",
		color: "#f97316",
		pages: [
			{ name: "Dashboard", href: "/admin", tag: "desktop" },
			{ name: "Analíticas", href: "/admin/analytics", tag: "desktop" },
			{ name: "Menú y productos", href: "/admin/menu", tag: "desktop" },
			{ name: "Empleados", href: "/admin/employees", tag: "desktop" },
			{ name: "Contabilidad", href: "/admin/accounting", tag: "desktop" },
		],
	},
];

const TAG_LABELS: Record<string, string> = {
	mobile: "📱 móvil",
	desktop: "🖥 desktop",
	tv: "📺 TV",
	auth: "🔐 auth",
};

export default function ShowcasePage() {
	return (
		<div className="min-h-screen bg-surface-0 noise-overlay">
			{/* Hero */}
			<div className="relative border-b border-surface-3 overflow-hidden">
				<div className="absolute inset-0 bg-gold-glow opacity-60" />
				<div className="relative max-w-6xl mx-auto px-6 py-16 text-center">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-500 text-xs font-display uppercase tracking-widest mb-6">
						Preview — UI Showcase
					</div>
					<h1 className="font-kds text-8xl text-brand-500 leading-none mb-3 tracking-wide">
						MY WAY
					</h1>
					<p className="font-display text-xl text-ink-secondary uppercase tracking-[0.2em] mb-2">
						Bar · Pool · Coctelería
					</p>
					<p className="font-body text-ink-tertiary text-sm max-w-lg mx-auto">
						Sistema integral de gestión — Av. Corrientes 1234, Buenos Aires
					</p>

					{/* Stats */}
					<div className="flex items-center justify-center gap-8 mt-10">
						{[
							{ label: "Apps", value: "6" },
							{ label: "Páginas", value: "19" },
							{ label: "Roles", value: "5" },
						].map((s) => (
							<div key={s.label} className="text-center">
								<div className="font-kds text-4xl text-brand-500">
									{s.value}
								</div>
								<div className="font-display text-xs text-ink-tertiary uppercase tracking-widest mt-1">
									{s.label}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Sections */}
			<div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
				{SECTIONS.map((section) => (
					<div key={section.id} className="animate-fade-in">
						{/* Section header */}
						<div className="flex items-start gap-4 mb-5">
							<div
								className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
								style={{
									background: `${section.color}18`,
									border: `1px solid ${section.color}30`,
								}}
							>
								{section.icon}
							</div>
							<div>
								<h2 className="font-display text-lg text-ink-primary uppercase tracking-wider">
									{section.name}
								</h2>
								<p className="font-body text-sm text-ink-tertiary mt-0.5">
									{section.description}
								</p>
							</div>
							<div className="ml-auto flex items-center">
								<span className="font-body text-xs text-ink-disabled">
									{section.pages.length} páginas
								</span>
							</div>
						</div>

						{/* Page links grid */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							{section.pages.map((page) => (
								<Link
									key={page.href}
									href={page.href}
									className="group block card p-4 hover:border-surface-4 transition-all duration-200 hover:shadow-gold-sm"
								>
									<div className="flex items-start justify-between gap-2 mb-3">
										<span
											className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
											style={{ background: section.color }}
										/>
										<span className="font-body text-[10px] text-ink-disabled ml-auto">
											{TAG_LABELS[page.tag]}
										</span>
									</div>
									<div className="font-display text-sm text-ink-primary uppercase tracking-wide group-hover:text-brand-500 transition-colors">
										{page.name}
									</div>
									<div className="font-body text-[11px] text-ink-tertiary mt-1 font-mono">
										{page.href}
									</div>
									<div
										className="mt-3 h-px w-0 group-hover:w-full transition-all duration-300 rounded"
										style={{ background: section.color }}
									/>
								</Link>
							))}
						</div>
					</div>
				))}
			</div>

			{/* Footer */}
			<footer className="border-t border-surface-3 py-8 text-center">
				<div className="font-kds text-2xl text-surface-4 mb-1">MY WAY</div>
				<p className="font-body text-xs text-ink-disabled">
					Preview UI — datos hardcodeados — 2025
				</p>
			</footer>
		</div>
	);
}
