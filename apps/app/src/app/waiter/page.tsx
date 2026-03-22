"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, ChevronRight, Loader2 } from "lucide-react";
import clsx from "clsx";

interface StaffMember {
	id: string;
	name: string;
	role: string;
	avatar: string;
}

export default function WaiterLoginPage() {
	const router = useRouter();
	const [staff, setStaff] = useState<StaffMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/staff")
			.then((r) => r.json())
			.then((data: StaffMember[]) => {
				setStaff(data.filter((s) => s.role === "waiter"));
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	function handleSelect(member: StaffMember) {
		setSelected(member.id);
		localStorage.setItem("myway_waiter_name", member.name);
		setTimeout(() => router.push("/waiter/tables"), 350);
	}

	return (
		<div
			className="noise-overlay min-h-screen flex flex-col items-center justify-between overflow-hidden"
			style={{
				background: "var(--s0)",
				position: "relative",
			}}
		>
			{/* Background glow */}
			<div
				aria-hidden
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(ellipse 700px 500px at 50% 45%, rgba(245,158,11,0.07) 0%, rgba(245,158,11,0.02) 45%, transparent 70%)",
					pointerEvents: "none",
				}}
			/>
			<div
				aria-hidden
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "35%",
					background:
						"radial-gradient(ellipse 500px 300px at 50% 100%, rgba(16,185,129,0.04) 0%, transparent 60%)",
					pointerEvents: "none",
				}}
			/>
			{/* Top gold line */}
			<div
				aria-hidden
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "1px",
					background:
						"linear-gradient(90deg, transparent, rgba(245,158,11,0.5) 40%, rgba(245,158,11,0.5) 60%, transparent)",
					pointerEvents: "none",
				}}
			/>

			<div className="flex-1" />

			{/* Brand */}
			<div className="flex flex-col items-center gap-2 animate-fade-in px-6">
				<div
					className="font-kds text-brand-500 select-none"
					style={{
						fontSize: 72,
						lineHeight: 1,
						letterSpacing: "0.22em",
						textShadow: "0 0 40px rgba(245,158,11,0.3)",
					}}
				>
					MY WAY
				</div>
				<div
					className="font-display text-ink-disabled uppercase tracking-widest"
					style={{ fontSize: 11, letterSpacing: "0.45em" }}
				>
					Sistema de Mozos
				</div>
			</div>

			<div style={{ height: 40 }} />

			{/* Staff picker */}
			<div
				className="card-gold animate-slide-up w-full"
				style={{
					maxWidth: 420,
					padding: "28px 24px 24px",
					position: "relative",
				}}
			>
				{/* Top stripe */}
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 24,
						right: 24,
						height: "1px",
						background:
							"linear-gradient(90deg, transparent, rgba(245,158,11,0.4) 50%, transparent)",
					}}
				/>

				<div
					className="font-display text-ink-disabled uppercase text-center mb-5"
					style={{ fontSize: 10, letterSpacing: "0.4em" }}
				>
					¿Quién sos?
				</div>

				{loading ? (
					<div className="flex justify-center py-10">
						<Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
					</div>
				) : staff.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-10">
						<User className="w-8 h-8 text-ink-disabled" />
						<p className="font-display text-sm text-ink-tertiary">
							No hay mozos disponibles
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{staff.map((member) => {
							const isSelected = selected === member.id;
							return (
								<button
									key={member.id}
									onClick={() => handleSelect(member)}
									disabled={selected !== null}
									className={clsx(
										"flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all duration-150 text-left w-full group",
										isSelected
											? "border-brand-500/60 bg-brand-500/10"
											: "border-surface-4 bg-surface-2 hover:border-brand-500/30 hover:bg-surface-3",
									)}
								>
									{/* Avatar */}
									<div
										className={clsx(
											"w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
											isSelected
												? "bg-brand-500 shadow-gold-sm"
												: "bg-surface-3 border border-surface-4 group-hover:bg-brand-500/15 group-hover:border-brand-500/30",
										)}
									>
										<span
											className={clsx(
												"font-kds text-2xl leading-none",
												isSelected ? "text-surface-0" : "text-brand-500",
											)}
										>
											{member.avatar || member.name.charAt(0).toUpperCase()}
										</span>
									</div>

									{/* Name */}
									<div className="flex-1 min-w-0">
										<p
											className={clsx(
												"font-display font-semibold text-sm transition-colors",
												isSelected
													? "text-brand-500"
													: "text-ink-primary group-hover:text-ink-primary",
											)}
										>
											{member.name}
										</p>
										<p className="font-display text-[10px] text-ink-tertiary uppercase tracking-widest mt-0.5">
											Mozo
										</p>
									</div>

									{/* Arrow */}
									<ChevronRight
										className={clsx(
											"w-4 h-4 shrink-0 transition-all",
											isSelected
												? "text-brand-500"
												: "text-ink-disabled group-hover:text-brand-500 group-hover:translate-x-0.5",
										)}
									/>
								</button>
							);
						})}
					</div>
				)}
			</div>

			<div className="flex-[0.7]" />

			{/* Footer */}
			<div className="flex flex-col items-center gap-1.5 pb-10 animate-fade-in">
				<div
					className="font-display text-ink-disabled uppercase tracking-widest"
					style={{ fontSize: 10, letterSpacing: "0.3em" }}
				>
					My Way · Bar &amp; Pool
				</div>
			</div>
		</div>
	);
}
