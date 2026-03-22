"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
	LayoutDashboard,
	BarChart3,
	UtensilsCrossed,
	Users,
	BookOpen,
	Truck,
	MapPin,
	LogOut,
	X,
} from "lucide-react";

const NAV_ITEMS = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, section: "GESTIÓN" },
	{
		href: "/admin/accounting",
		label: "Contabilidad",
		icon: BookOpen,
		exact: false,
		section: "GESTIÓN",
	},
	{ href: "/admin/delivery", label: "Delivery", icon: Truck, exact: false, section: "GESTIÓN" },
	{ href: "/admin/menu", label: "Menú", icon: UtensilsCrossed, exact: false, section: "GESTIÓN" },
	{ href: "/admin/employees", label: "Empleados", icon: Users, exact: false, section: "GESTIÓN" },
	{
		href: "/admin/analytics",
		label: "Analíticas",
		icon: BarChart3,
		exact: false,
		section: "REPORTES",
	},
	{
		href: "/admin/repartidores",
		label: "Mapa GPS",
		icon: MapPin,
		exact: false,
		section: "REPORTES",
	},
];

// Group nav items by section
const SECTIONS = ["GESTIÓN", "REPORTES"] as const;

interface AdminSidebarProps {
	open: boolean;
	onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
	const pathname = usePathname();

	// Close on route change (mobile)
	useEffect(() => {
		onClose();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	const SidebarContent = () => (
		<aside
			className="sidebar top-accent relative"
			style={{ width: 240, height: "100%" }}
		>
			{/* Brand */}
			<div
				style={{
					padding: "28px 20px 20px",
					borderBottom: "1px solid var(--s3)",
					flexShrink: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<div className="flex items-end gap-2">
					<span
						className="font-kds text-brand-500 leading-none tracking-wide"
						style={{ fontSize: 28 }}
					>
						MY WAY
					</span>
					<span
						className="font-display text-ink-tertiary uppercase tracking-widest"
						style={{ fontSize: 9, fontWeight: 600, marginBottom: 2 }}
					>
						Admin
					</span>
				</div>
				{/* Close button — only visible on mobile */}
				<button
					onClick={onClose}
					className="btn-ghost md:hidden"
					style={{ padding: "6px", marginRight: -4 }}
					aria-label="Cerrar menú"
				>
					<X size={16} style={{ color: "#666" }} />
				</button>
			</div>

			{/* Nav */}
			<nav className="flex-1 overflow-y-auto" style={{ padding: "12px 0" }}>
				{SECTIONS.map((section) => {
					const items = NAV_ITEMS.filter((i) => i.section === section);
					return (
						<div key={section} style={{ marginBottom: 8 }}>
							{/* Section label */}
							<div
								className="font-display text-ink-disabled uppercase"
								style={{
									fontSize: 9,
									letterSpacing: "0.25em",
									padding: "6px 20px 4px",
									marginTop: 4,
								}}
							>
								{section}
							</div>
							<div style={{ height: 1, background: "var(--s3)", margin: "4px 12px 6px" }} />

							{/* Items */}
							<div style={{ padding: "0 8px" }}>
								{items.map(({ href, label, icon: Icon, exact }) => {
									const isActive = exact
										? pathname === href
										: pathname.startsWith(href);
									return (
										<Link
											key={href}
											href={href}
											className={[
												"sidebar-item",
												isActive ? "active" : "",
											].join(" ")}
											style={
												isActive
													? { borderLeft: "2px solid var(--gold)", paddingLeft: 14 }
													: {}
											}
										>
											<Icon size={15} className="flex-shrink-0" />
											<span className="flex-1">{label}</span>
											{isActive && (
												<span
													style={{
														width: 5,
														height: 5,
														borderRadius: "50%",
														background: "var(--gold)",
														flexShrink: 0,
													}}
												/>
											)}
										</Link>
									);
								})}
							</div>
						</div>
					);
				})}
			</nav>

			{/* Bottom — user info */}
			<div
				style={{
					padding: "12px 12px 16px",
					borderTop: "1px solid var(--s3)",
					flexShrink: 0,
				}}
			>
				<div
					className="flex items-center gap-2.5 rounded-xl"
					style={{
						padding: "10px 12px",
						background: "var(--s2)",
						border: "1px solid var(--s3)",
					}}
				>
					<div
						className="flex items-center justify-center flex-shrink-0"
						style={{
							width: 34,
							height: 34,
							borderRadius: "50%",
							background: "rgba(245,158,11,0.15)",
							border: "1px solid rgba(245,158,11,0.3)",
						}}
					>
						<span
							className="font-kds text-brand-500"
							style={{ fontSize: 13, lineHeight: 1 }}
						>
							VP
						</span>
					</div>
					<div className="flex-1 min-w-0">
						<div
							className="font-display text-ink-primary truncate"
							style={{ fontSize: 12, fontWeight: 600 }}
						>
							Valentina Paz
						</div>
						<div
							className="font-body text-ink-tertiary"
							style={{ fontSize: 10 }}
						>
							Administrador
						</div>
					</div>
					<Link
						href="/pos"
						className="text-ink-tertiary hover:text-red-400 transition-colors flex-shrink-0"
						style={{ padding: 4 }}
						title="Salir"
					>
						<LogOut size={13} />
					</Link>
				</div>
			</div>
		</aside>
	);

	return (
		<>
			{/* Desktop: always visible, fixed position */}
			<div className="hidden md:block" style={{ width: 240, flexShrink: 0 }}>
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						bottom: 0,
						width: 240,
						zIndex: 50,
					}}
				>
					<SidebarContent />
				</div>
			</div>

			{/* Mobile: slide-in drawer */}
			{/* Backdrop */}
			{open && (
				<div
					className="md:hidden"
					onClick={onClose}
					style={{
						position: "fixed",
						inset: 0,
						zIndex: 200,
						background: "rgba(0,0,0,0.6)",
						backdropFilter: "blur(4px)",
					}}
				/>
			)}

			{/* Drawer */}
			<div
				className="md:hidden"
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					bottom: 0,
					width: 240,
					zIndex: 201,
					transform: open ? "translateX(0)" : "translateX(-100%)",
					transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
				}}
			>
				<SidebarContent />
			</div>
		</>
	);
}
