"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Loader2 } from "lucide-react";
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
			style={{ background: "var(--s0)", position: "relative" }}
		>
			{/* Background glow */}
			<div
				aria-hidden
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(ellipse 700px 500px at 50% 40%, rgba(245,158,11,0.09) 0%, rgba(245,158,11,0.02) 45%, transparent 70%)",
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
				<img
					src="/logo.svg"
					alt="My Way"
					style={{ height: 28, width: 'auto', filter: 'invert(1)', display: 'block' }}
				/>
				<div
					className="font-display text-ink-disabled uppercase tracking-widest"
					style={{ fontSize: 11, letterSpacing: "0.45em" }}
				>
					Sistema de Mozos
				</div>
			</div>

			<div style={{ height: 32 }} />

			{/* Staff picker */}
			<div className="animate-slide-up w-full px-4" style={{ maxWidth: 560 }}>
				<div
					className="font-display text-ink-disabled uppercase text-center mb-4"
					style={{ fontSize: 10, letterSpacing: "0.4em" }}
				>
					¿Quién sos?
				</div>

				{loading ? (
					<div className="flex justify-center py-16">
						<Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
					</div>
				) : staff.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-12">
						<User className="w-10 h-10 text-ink-disabled" />
						<p className="font-display text-sm text-ink-tertiary">
							No hay mozos disponibles
						</p>
					</div>
				) : (
					<div
						className="waiter-staff-grid grid gap-3"
						style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
					>
						{staff.map((member) => {
							const isSelected = selected === member.id;
							const initials =
								member.avatar || member.name.slice(0, 2).toUpperCase();
							return (
								<button
									key={member.id}
									onClick={() => handleSelect(member)}
									disabled={selected !== null}
									className={clsx(
										"flex flex-col items-center gap-3 rounded-2xl border transition-all duration-200 text-center group active:scale-95",
										isSelected
											? "border-brand-500/70 bg-brand-500/12 shadow-gold-sm"
											: "border-surface-3 bg-surface-2 hover:border-brand-500/40 hover:bg-surface-3",
									)}
									style={{ padding: "22px 16px 18px", minHeight: 130 }}
								>
									{/* Avatar circle */}
									<div
										className={clsx(
											"flex items-center justify-center rounded-full transition-all shrink-0",
											isSelected
												? "shadow-gold-sm"
												: "group-hover:shadow-gold-sm",
										)}
										style={{
											width: 64,
											height: 64,
											background: isSelected
												? "#f59e0b"
												: "rgba(245,158,11,0.15)",
											border: isSelected
												? "2px solid rgba(245,158,11,0.6)"
												: "2px solid rgba(245,158,11,0.25)",
										}}
									>
										<span
											className="font-kds leading-none select-none"
											style={{
												fontSize: 28,
												color: isSelected ? "#080808" : "#f59e0b",
											}}
										>
											{initials}
										</span>
									</div>

									{/* Name */}
									<div>
										<p
											className={clsx(
												"font-display font-semibold text-sm leading-tight transition-colors",
												isSelected
													? "text-brand-500"
													: "text-ink-primary group-hover:text-ink-primary",
											)}
										>
											{member.name}
										</p>
										<p className="font-display text-[10px] text-ink-disabled uppercase tracking-widest mt-0.5">
											Mozo
										</p>
									</div>
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

			<style>{`
        @media (min-width: 640px) {
          .waiter-staff-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (min-width: 900px) {
          .waiter-staff-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
		</div>
	);
}
