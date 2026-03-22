"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="flex min-h-screen" style={{ background: "var(--s0)" }}>
			<AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			{/* Main content — offset by sidebar width on md+ */}
			<main
				className="flex-1 min-h-screen overflow-x-hidden"
				style={{ marginLeft: 0 }}
			>
				{/* Mobile top bar with hamburger */}
				<div
					className="md:hidden flex items-center gap-3 sticky top-0 z-30"
					style={{
						padding: "12px 16px",
						background: "var(--s1)",
						borderBottom: "1px solid var(--s3)",
					}}
				>
					<button
						onClick={() => setSidebarOpen(true)}
						className="btn-ghost"
						style={{ padding: "6px 8px" }}
						aria-label="Abrir menú"
					>
						<Menu size={20} style={{ color: "#aaa" }} />
					</button>
					<span
						className="font-kds text-brand-500"
						style={{ fontSize: 18, lineHeight: 1 }}
					>
						MY WAY
					</span>
					<span
						className="font-display text-ink-disabled uppercase"
						style={{ fontSize: 9, letterSpacing: "0.2em", paddingTop: 2 }}
					>
						Admin
					</span>
				</div>

				{/* Page content — desktop gets left padding for sidebar */}
				<div className="md:ml-[240px]">{children}</div>
			</main>
		</div>
	);
}
