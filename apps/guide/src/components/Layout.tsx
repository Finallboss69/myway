import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";

interface LayoutProps {
	children: React.ReactNode;
	title?: string;
	backTo?: string;
	backLabel?: string;
}

export default function Layout({
	children,
	title,
	backTo,
	backLabel,
}: LayoutProps) {
	const location = useLocation();
	const isHome = location.pathname === "/";

	return (
		<div className="min-h-screen bg-[var(--bg-primary)]">
			{/* Header */}
			<header className="sticky top-0 z-50 bg-[var(--bg-secondary)]/80 backdrop-blur-xl border-b border-white/5">
				<div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
					{!isHome && backTo && (
						<Link
							to={backTo}
							className="flex items-center gap-1.5 text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors text-sm"
						>
							<ArrowLeft size={16} />
							<span>{backLabel || "Volver"}</span>
						</Link>
					)}
					{isHome && (
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-lg bg-[var(--brand)] flex items-center justify-center">
								<BookOpen size={16} className="text-white" />
							</div>
							<span className="font-bold text-lg">MyWay</span>
						</div>
					)}
					{title && (
						<h1 className="font-semibold text-[var(--ink)] ml-auto text-sm">
							{title}
						</h1>
					)}
				</div>
			</header>

			{/* Content */}
			<main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
		</div>
	);
}
