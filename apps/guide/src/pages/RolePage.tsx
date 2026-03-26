import { useParams, Link } from "react-router-dom";
import {
	ChevronRight,
	ConciergeBell,
	ChefHat,
	Wine,
	Monitor,
	Bike,
	Shield,
} from "lucide-react";
import Layout from "../components/Layout";
import { roles } from "../data/roles";
import { screens } from "../data/screens";

const iconMap: Record<string, React.ElementType> = {
	ConciergeBell,
	ChefHat,
	Wine,
	Monitor,
	Bike,
	Shield,
};

export default function RolePage() {
	const { roleId } = useParams<{ roleId: string }>();
	const role = roles.find((r) => r.id === roleId);

	if (!role) {
		return (
			<Layout backTo="/" backLabel="Inicio">
				<p className="text-center py-10 text-[var(--ink-faint)]">
					Rol no encontrado
				</p>
			</Layout>
		);
	}

	const Icon = iconMap[role.icon] || Shield;
	const roleScreens = screens.filter((s) => s.roleId === roleId);

	return (
		<Layout backTo="/" backLabel="Inicio" title={role.name}>
			{/* Role header */}
			<div className="flex items-center gap-4 mb-8">
				<div
					className="w-14 h-14 rounded-2xl flex items-center justify-center"
					style={{ backgroundColor: `${role.color}20` }}
				>
					<Icon size={28} style={{ color: role.color }} />
				</div>
				<div>
					<h1 className="text-2xl font-extrabold">{role.name}</h1>
					<p className="text-[var(--ink-secondary)] text-sm">
						{role.description}
					</p>
				</div>
			</div>

			{/* Screen list */}
			<div className="space-y-3">
				{roleScreens.map((screen, i) => (
					<Link
						key={screen.id}
						to={`/tutorial/${screen.id}`}
						className="group flex items-center gap-4 bg-[var(--bg-card)] rounded-2xl p-5 border border-white/5 hover:border-[var(--brand)]/30 transition-all"
					>
						<div
							className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
							style={{
								backgroundColor: `${role.color}15`,
								color: role.color,
							}}
						>
							{i + 1}
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="font-bold group-hover:text-[var(--brand)] transition-colors">
								{screen.name}
							</h3>
							<p className="text-sm text-[var(--ink-secondary)] truncate">
								{screen.description}
							</p>
							<p className="text-xs text-[var(--ink-faint)] mt-1">
								<code className="bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
									{screen.url}
								</code>{" "}
								— {screen.steps.length} pasos
							</p>
						</div>
						<ChevronRight
							size={18}
							className="text-[var(--ink-faint)] group-hover:text-[var(--brand)] transition-colors shrink-0"
						/>
					</Link>
				))}
			</div>
		</Layout>
	);
}
