import type { Metadata } from "next";
import AdminSidebar from "./AdminSidebar";

export const metadata: Metadata = {
	title: "Admin — My Way",
};

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen bg-surface-0">
			<AdminSidebar />
			<main className="flex-1 ml-[220px] min-h-screen overflow-x-hidden">
				{children}
			</main>
		</div>
	);
}
