"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Delete, ArrowRight, CheckCircle2 } from "lucide-react";
import { STAFF } from "@/data/mock";

const waiters = STAFF.filter((s) => s.role === "waiter");

const AVATAR_COLORS: Record<string, string> = {
	LF: "#7c3aed",
	DL: "#0284c7",
};

export default function WaiterLoginPage() {
	const router = useRouter();
	const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
	const [pin, setPin] = useState<string[]>([]);
	const [shaking, setShaking] = useState(false);
	const [success, setSuccess] = useState(false);

	const selectedWaiter = waiters.find((s) => s.id === selectedStaff);

	const handleSelectStaff = (id: string) => {
		setSelectedStaff(id);
		setPin([]);
		setSuccess(false);
	};

	const handleDigit = (digit: string) => {
		if (pin.length >= 4 || success) return;
		const next = [...pin, digit];
		setPin(next);
		if (next.length === 4) {
			setTimeout(() => checkPin(next), 80);
		}
	};

	const handleBackspace = () => {
		if (success) return;
		setPin((prev) => prev.slice(0, -1));
	};

	const checkPin = (digits: string[]) => {
		if (digits.join("") === "1234") {
			setSuccess(true);
			setTimeout(() => router.push("/waiter/tables"), 700);
		} else {
			setShaking(true);
			setTimeout(() => {
				setShaking(false);
				setPin([]);
			}, 550);
		}
	};

	const handleAcceder = () => {
		if (pin.length < 4 || success) return;
		checkPin(pin);
	};

	const numpadLayout = [
		["1", "2", "3"],
		["4", "5", "6"],
		["7", "8", "9"],
		["", "0", "⌫"],
	];

	return (
		<div
			className="noise-overlay min-h-screen bg-surface-0 flex flex-col items-center justify-between overflow-hidden"
			style={{ position: "relative" }}
		>
			{/* Gold radial glow */}
			<div
				aria-hidden
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(ellipse 700px 600px at 50% 40%, rgba(245,158,11,0.07) 0%, rgba(245,158,11,0.02) 45%, transparent 70%)",
					pointerEvents: "none",
				}}
			/>
			{/* Top accent line */}
			<div
				aria-hidden
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "1px",
					background:
						"linear-gradient(90deg, transparent, rgba(245,158,11,0.55) 50%, transparent)",
				}}
			/>

			<div className="flex-1" style={{ minHeight: 40 }} />

			{/* Logo block */}
			<div className="flex flex-col items-center gap-2 animate-fade-in">
				<div
					className="font-kds text-brand-500 tracking-widest"
					style={{ fontSize: 64, lineHeight: 1, letterSpacing: "0.18em" }}
				>
					MY WAY
				</div>
				<div
					className="font-display text-ink-tertiary uppercase"
					style={{ fontSize: 10, letterSpacing: "0.45em" }}
				>
					Acceso Mozos
				</div>
			</div>

			<div style={{ height: 36 }} />

			{/* Main content */}
			<div className="w-full max-w-xs px-4 animate-slide-up">
				{!selectedStaff ? (
					<>
						<div
							className="font-display uppercase text-ink-tertiary text-center mb-4"
							style={{ fontSize: 10, letterSpacing: "0.35em" }}
						>
							¿Quién sos?
						</div>
						<div className="grid grid-cols-2 gap-3">
							{waiters.map((waiter) => {
								const avatarBg = AVATAR_COLORS[waiter.avatar] ?? "#f59e0b";
								return (
									<button
										key={waiter.id}
										onClick={() => handleSelectStaff(waiter.id)}
										className="card-sm flex flex-col items-center gap-3 py-6 px-3 cursor-pointer transition-all duration-150 active:scale-95"
										style={{ textAlign: "center" }}
										onMouseEnter={(e) => {
											(e.currentTarget as HTMLElement).style.borderColor =
												"rgba(245,158,11,0.45)";
											(e.currentTarget as HTMLElement).style.boxShadow =
												"0 0 16px rgba(245,158,11,0.1)";
										}}
										onMouseLeave={(e) => {
											(e.currentTarget as HTMLElement).style.borderColor =
												"var(--s3)";
											(e.currentTarget as HTMLElement).style.boxShadow = "";
										}}
									>
										{/* Avatar */}
										<div
											className="font-display font-bold flex items-center justify-center rounded-full flex-shrink-0 relative"
											style={{
												width: 52,
												height: 52,
												background: avatarBg,
												fontSize: 15,
												color: "#fff",
											}}
										>
											{waiter.avatar}
											{/* Active dot */}
											<div
												style={{
													position: "absolute",
													bottom: 2,
													right: 2,
													width: 10,
													height: 10,
													borderRadius: "50%",
													background: "#10b981",
													border: "2px solid #0d0d0d",
													boxShadow: "0 0 6px #10b981",
												}}
											/>
										</div>
										<div>
											<div
												className="text-ink-primary font-display font-semibold leading-tight"
												style={{ fontSize: 13 }}
											>
												{waiter.name}
											</div>
											<div
												className="badge badge-available mt-1.5 inline-flex"
												style={{ fontSize: 9 }}
											>
												Mozo
											</div>
										</div>
									</button>
								);
							})}
						</div>
					</>
				) : (
					/* PIN pad panel */
					<div className="card" style={{ padding: "26px 22px 22px" }}>
						{/* Back link */}
						<button
							onClick={() => {
								setSelectedStaff(null);
								setPin([]);
							}}
							className="flex items-center gap-1.5 text-ink-tertiary hover:text-ink-secondary transition-colors mb-5"
							style={{ fontSize: 11 }}
						>
							<span style={{ fontSize: 15 }}>←</span>
							<span
								className="font-display uppercase"
								style={{ letterSpacing: "0.12em" }}
							>
								Cambiar
							</span>
						</button>

						{/* Selected waiter info */}
						<div className="flex items-center gap-3 mb-6">
							<div
								className="font-display font-bold flex items-center justify-center rounded-full flex-shrink-0"
								style={{
									width: 40,
									height: 40,
									background:
										AVATAR_COLORS[selectedWaiter?.avatar ?? ""] ?? "#f59e0b",
									fontSize: 13,
									color: "#fff",
								}}
							>
								{selectedWaiter?.avatar}
							</div>
							<div>
								<div
									className="text-ink-primary font-display font-semibold"
									style={{ fontSize: 14 }}
								>
									{selectedWaiter?.name}
								</div>
								<div
									className="text-ink-tertiary font-body"
									style={{ fontSize: 11 }}
								>
									Mozo
								</div>
							</div>
						</div>

						{/* PIN label */}
						<div
							className="font-display uppercase text-ink-tertiary text-center mb-4"
							style={{ fontSize: 10, letterSpacing: "0.35em" }}
						>
							Ingresá tu PIN
						</div>

						{/* PIN dots */}
						<div
							className="flex justify-center gap-4 mb-6"
							style={{
								animation: shaking
									? "shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97)"
									: undefined,
							}}
						>
							{[0, 1, 2, 3].map((i) => {
								const filled = pin.length > i;
								const isDone = success && pin.length === 4;
								return (
									<div
										key={i}
										style={{
											width: 14,
											height: 14,
											borderRadius: "50%",
											border: isDone
												? "2px solid #10b981"
												: filled
													? "2px solid #f59e0b"
													: "2px solid #2a2a2a",
											background: isDone
												? "#10b981"
												: filled
													? "#f59e0b"
													: "transparent",
											boxShadow: isDone
												? "0 0 10px rgba(16,185,129,0.6)"
												: filled
													? "0 0 10px rgba(245,158,11,0.55)"
													: undefined,
											transition: "all 0.15s ease",
										}}
									/>
								);
							})}
						</div>

						{/* Numpad */}
						<div className="grid grid-cols-3 gap-2">
							{numpadLayout.flat().map((key, idx) => {
								if (key === "") return <div key={idx} />;
								const isBack = key === "⌫";
								return (
									<button
										key={idx}
										onClick={() =>
											isBack ? handleBackspace() : handleDigit(key)
										}
										disabled={success}
										style={{
											height: 56,
											borderRadius: 12,
											border: "1px solid #252525",
											background: isBack ? "transparent" : "#161616",
											color: isBack ? "#6b6b6b" : "#f0f0f0",
											fontSize: isBack ? 18 : 24,
											fontFamily: isBack ? "inherit" : "var(--font-bebas)",
											cursor: "pointer",
											transition: "all 0.1s",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
										onMouseEnter={(e) => {
											if (!isBack)
												(e.currentTarget as HTMLElement).style.background =
													"#1e1e1e";
										}}
										onMouseLeave={(e) => {
											if (!isBack)
												(e.currentTarget as HTMLElement).style.background =
													"#161616";
										}}
										onMouseDown={(e) => {
											(e.currentTarget as HTMLElement).style.transform =
												"scale(0.91)";
										}}
										onMouseUp={(e) => {
											(e.currentTarget as HTMLElement).style.transform =
												"scale(1)";
										}}
									>
										{isBack ? <Delete size={16} /> : key}
									</button>
								);
							})}
						</div>

						{/* Acceder button */}
						<button
							className="btn-primary w-full mt-4 justify-center"
							style={{
								padding: "14px 20px",
								fontSize: 13,
								opacity: pin.length === 4 && !success ? 1 : 0.35,
								cursor:
									pin.length === 4 && !success ? "pointer" : "not-allowed",
								transition: "opacity 0.2s",
							}}
							onClick={handleAcceder}
							disabled={pin.length < 4 || success}
						>
							{success ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}
							{success ? "Accediendo…" : "Acceder"}
						</button>

						<div
							className="text-center text-ink-disabled mt-2.5 font-body"
							style={{ fontSize: 11 }}
						>
							PIN demo: 1234
						</div>
					</div>
				)}
			</div>

			<div className="flex-1" style={{ minHeight: 32 }} />

			{/* Footer */}
			<div className="pb-8 text-center animate-fade-in">
				<div className="text-ink-disabled font-body" style={{ fontSize: 11 }}>
					© My Way 2025
				</div>
			</div>

			<style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%, 55% { transform: translateX(-7px); }
          35%, 75% { transform: translateX(7px); }
        }
      `}</style>
		</div>
	);
}
