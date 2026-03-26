import { Link } from "react-router-dom";
import {
	ConciergeBell,
	ChefHat,
	Wine,
	Monitor,
	Bike,
	Shield,
	BookOpen,
} from "lucide-react";
import Layout from "../components/Layout";
import { roles } from "../data/roles";

const iconMap: Record<string, React.ElementType> = {
	ConciergeBell,
	ChefHat,
	Wine,
	Monitor,
	Bike,
	Shield,
};

export default function Home() {
	return (
		<Layout>
			{/* Hero */}
			<div className="text-center py-10">
				<div className="w-16 h-16 rounded-2xl bg-[var(--brand)] flex items-center justify-center mx-auto mb-4">
					<BookOpen size={28} className="text-white" />
				</div>
				<h1 className="text-3xl font-extrabold mb-2">Guia Interactiva</h1>
				<p className="text-[var(--ink-secondary)] max-w-md mx-auto">
					Aprende a usar MyWay paso a paso. Selecciona tu rol para ver
					tutoriales interactivos de cada pantalla.
				</p>
			</div>

			{/* Role grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{roles.map((role) => {
					const Icon = iconMap[role.icon] || Shield;
					return (
						<Link
							key={role.id}
							to={`/rol/${role.id}`}
							className="group bg-[var(--bg-card)] rounded-2xl p-6 border border-white/5 hover:border-[var(--brand)]/30 transition-all hover:scale-[1.02]"
						>
							<div
								className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
								style={{ backgroundColor: `${role.color}20` }}
							>
								<Icon size={24} style={{ color: role.color }} />
							</div>
							<h2 className="font-bold text-lg mb-1 group-hover:text-[var(--brand)] transition-colors">
								{role.name}
							</h2>
							<p className="text-sm text-[var(--ink-secondary)] mb-3">
								{role.description}
							</p>
							<p className="text-xs text-[var(--ink-faint)]">
								{role.screens.length} pantallas
							</p>
						</Link>
					);
				})}
			</div>

			{/* Footer */}
			<div className="text-center py-10 text-xs text-[var(--ink-faint)]">
				MyWay — Sistema de Gestion de Bar & Pool
			</div>
		</Layout>
	);
}
