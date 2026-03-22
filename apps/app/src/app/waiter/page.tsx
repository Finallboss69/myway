"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import clsx from "clsx";

interface StaffMember {
	id: string;
	name: string;
	role: string;
	avatar: string;
}

function useGreeting() {
	const [greeting, setGreeting] = useState("BUENOS DÍAS");
	useEffect(() => {
		const hour = new Date().getHours();
		if (hour >= 20 || hour < 6) {
			setGreeting("BUENAS NOCHES");
		} else if (hour >= 14) {
			setGreeting("BUENAS TARDES");
		} else {
			setGreeting("BUENOS DÍAS");
		}
	}, []);
	return greeting;
}

function SkeletonCard() {
	return (
		<div
			className="flex flex-col items-center gap-3 rounded-2xl border border-surface-3 bg-surface-2 animate-pulse"
			style={{ padding: "22px 16px 18px", minHeight: 150 }}
		>
			<div className="w-16 h-16 rounded-full bg-surface-4" />
			<div className="w-20 h-3 rounded-full bg-surface-4" />
			<div className="w-12 h-2 rounded-full bg-surface-3" />
		</div>
	);
}

export default function WaiterLoginPage() {
	const router = useRouter();
	const [staff, setStaff] = useState<StaffMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState<string | null>(null);
	const greeting = useGreeting();

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
			{/* Background glows */}
			<div
				aria-hidden
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(ellipse 700px 500px at 50% 35%, rgba(245,158,11,0.11) 0%, rgba(245,158,11,0.03) 45%, transparent 70%)",
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
					height: "40%",
					background:
						"radial-gradient(ellipse 500px 300px at 50% 100%, rgba(16,185,129,0.05) 0%, transparent 60%)",
					pointerEvents: "none",
				}}
			/>
			{/* Top gold accent line */}
			<div
				aria-hidden
				className="top-accent"
				style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1 }}
			/>

			<div className="flex-1" />

			{/* Brand */}
			<div className="flex flex-col items-center gap-3 animate-fade-in px-6">
				<img
					src="/logo.svg"
					alt="My Way"
					style={{
						height: 32,
						width: "auto",
						filter: "invert(1)",
						display: "block",
					}}
				/>
				<div
					className="font-kds tracking-[0.35em] text-center"
					style={{
						fontSize: 13,
						color: "rgba(245,158,11,0.55)",
						letterSpacing: "0.5em",
					}}
				>
					{greeting}
				</div>
				<div
					className="font-display text-ink-disabled uppercase tracking-widest"
					style={{ fontSize: 10, letterSpacing: "0.4em" }}
				>
					Sistema de Mozos
				</div>
			</div>

			<div style={{ height: 36 }} />

			{/* Staff picker */}
			<div className="animate-slide-up w-full px-4" style={{ maxWidth: 560 }}>
				<div
					className="font-display text-ink-disabled uppercase text-center mb-5"
					style={{ fontSize: 10, letterSpacing: "0.4em" }}
				>
					¿Quién sos?
				</div>

				{loading ? (
					<div
						className="waiter-staff-grid grid gap-3"
						style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
					>
						{[0, 1, 2, 3].map((i) => (
							<SkeletonCard key={i} />
						))}
					</div>
				) : staff.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-12">
						<div
							className="w-16 h-16 rounded-2xl flex items-center justify-center"
							style={{ background: "var(--s2)", border: "1px solid var(--s3)" }}
						>
							<User className="w-8 h-8 text-ink-disabled" />
						</div>
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
									style={{
										padding: "24px 16px 20px",
										minHeight: 150,
										boxShadow: isSelected
											? "0 0 0 2px rgba(245,158,11,0.35), 0 0 32px rgba(245,158,11,0.12)"
											: undefined,
									}}
								>
									{/* Avatar circle */}
									<div
										className={clsx(
											"flex items-center justify-center rounded-full transition-all shrink-0",
											isSelected ? "" : "group-hover:scale-105",
										)}
										style={{
											width: 72,
											height: 72,
											background: isSelected
												? "var(--gold)"
												: "rgba(245,158,11,0.14)",
											border: isSelected
												? "2px solid rgba(245,158,11,0.7)"
												: "2px solid rgba(245,158,11,0.28)",
											boxShadow: isSelected
												? "0 0 24px rgba(245,158,11,0.35)"
												: "none",
											transition: "all 0.2s",
										}}
									>
										<span
											className="font-kds leading-none select-none"
											style={{
												fontSize: 30,
												color: isSelected ? "#080808" : "#f59e0b",
											}}
										>
											{initials}
										</span>
									</div>

									{/* Name + role */}
									<div className="flex flex-col items-center gap-1">
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
										<span
											className={clsx(
												"badge",
												isSelected ? "badge-occupied" : "badge-delivered",
											)}
											style={{ fontSize: 9 }}
										>
											Mozo
										</span>
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
