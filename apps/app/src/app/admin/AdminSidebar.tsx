"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	BarChart3,
	UtensilsCrossed,
	Users,
	BookOpen,
	Truck,
	LogOut,
} from "lucide-react";

const NAV_ITEMS = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
	{
		href: "/admin/analytics",
		label: "Analíticas",
		icon: BarChart3,
		exact: false,
	},
	{ href: "/admin/menu", label: "Menú", icon: UtensilsCrossed, exact: false },
	{ href: "/admin/employees", label: "Empleados", icon: Users, exact: false },
	{
		href: "/admin/accounting",
		label: "Contabilidad",
		icon: BookOpen,
		exact: false,
	},
	{ href: "/admin/delivery", label: "Delivery", icon: Truck, exact: false },
];

export default function AdminSidebar() {
	const pathname = usePathname();

	return (
		<aside className="sidebar top-accent relative">
			{/* Brand */}
			<div className="px-5 pt-7 pb-5 border-b border-surface-3 flex-shrink-0">
				<div className="flex items-end gap-2">
					<span className="font-kds text-3xl text-brand-500 leading-none tracking-wide">
						MY WAY
					</span>
					<span className="font-display text-[10px] font-600 text-ink-tertiary uppercase tracking-widest mb-0.5">
						Admin
					</span>
				</div>
			</div>

			{/* Nav */}
			<nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
				{NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
					const isActive = exact
						? pathname === href
						: pathname.startsWith(href);
					return (
						<Link
							key={href}
							href={href}
							className={["sidebar-item", isActive ? "active" : ""].join(" ")}
						>
							<Icon size={15} className="flex-shrink-0" />
							<span className="flex-1">{label}</span>
							{isActive && (
								<span className="w-1 h-1 rounded-full bg-brand-500 flex-shrink-0" />
							)}
						</Link>
					);
				})}
			</nav>

			{/* Bottom */}
			<div className="px-3 pb-4 pt-3 border-t border-surface-3 flex-shrink-0 space-y-2">
				{/* User */}
				<div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface-2 border border-surface-3">
					<div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
						<span className="font-kds text-sm text-brand-500 leading-none">
							VP
						</span>
					</div>
					<div className="flex-1 min-w-0">
						<div className="font-display text-xs font-600 text-ink-primary truncate leading-tight">
							Valentina Paz
						</div>
						<div className="font-body text-[10px] text-ink-tertiary leading-tight">
							Administrador
						</div>
					</div>
					<Link
						href="/pos"
						className="text-ink-tertiary hover:text-status-cancelled transition-colors flex-shrink-0 p-1"
					>
						<LogOut size={13} />
					</Link>
				</div>
			</div>
		</aside>
	);
}
