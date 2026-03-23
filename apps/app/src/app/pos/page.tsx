"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Delete, Check, LogIn } from "lucide-react";

export default function POSLoginPage() {
	const router = useRouter();
	const [pin, setPin] = useState<string[]>([]);
	const [shaking, setShaking] = useState(false);
	const [wrongFlash, setWrongFlash] = useState(false);
	const [success, setSuccess] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [currentTime, setCurrentTime] = useState("");

	useEffect(() => {
		const update = () => {
			const now = new Date();
			setCurrentTime(
				now.toLocaleTimeString("es-AR", {
					hour: "2-digit",
					minute: "2-digit",
					weekday: "short",
					day: "2-digit",
					month: "short",
					year: "numeric",
				}),
			);
		};
		update();
		const id = setInterval(update, 1000);
		return () => clearInterval(id);
	}, []);

	const handleDigit = (digit: string) => {
		if (pin.length >= 4 || success || verifying) return;
		const next = [...pin, digit];
		setPin(next);
		if (next.length === 4) {
			setTimeout(() => checkPin(next), 120);
		}
	};

	const handleBackspace = () => {
		if (success || verifying) return;
		setPin((prev) => prev.slice(0, -1));
	};

	const checkPin = async (digits: string[]) => {
		if (verifying) return;
		setVerifying(true);
		try {
			const res = await fetch("/api/staff/verify-pin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pin: digits.join("") }),
			});
			if (res.ok) {
				const staff = (await res.json()) as {
					id: string;
					name: string;
					role: string;
					avatar: string;
				};
				sessionStorage.setItem("pos-staff", JSON.stringify(staff));
				setSuccess(true);
				setTimeout(() => router.push("/pos/salon"), 700);
			} else {
				setShaking(true);
				setWrongFlash(true);
				setTimeout(() => {
					setShaking(false);
					setWrongFlash(false);
					setPin([]);
				}, 600);
			}
		} catch {
			setShaking(true);
			setWrongFlash(true);
			setTimeout(() => {
				setShaking(false);
				setWrongFlash(false);
				setPin([]);
			}, 600);
		} finally {
			setVerifying(false);
		}
	};

	const numpadRows = [
		["1", "2", "3"],
		["4", "5", "6"],
		["7", "8", "9"],
		["", "0", "⌫"],
	];

	const dotColor = (i: number) => {
		if (success) return "#10b981";
		if (wrongFlash) return "#ef4444";
		if (pin.length > i) return "#f59e0b";
		return "transparent";
	};

	const dotBorder = (i: number) => {
		if (success) return "#10b981";
		if (wrongFlash) return "#ef4444";
		if (pin.length > i) return "#f59e0b";
		return "#272727";
	};

	const dotGlow = (i: number) => {
		if (!pin.length && !success) return undefined;
		if (success && i < 4) return "0 0 10px rgba(16,185,129,0.7)";
		if (wrongFlash && i < pin.length) return "0 0 10px rgba(239,68,68,0.7)";
		if (pin.length > i) return "0 0 10px rgba(245,158,11,0.6)";
		return undefined;
	};

	return (
		<div
			className="noise-overlay min-h-screen bg-surface-0 flex flex-col items-center justify-between overflow-hidden"
			style={{ position: "relative" }}
		>
			{/* Deep radial gold glow background */}
			<div
				aria-hidden
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(ellipse 700px 600px at 50% 48%, rgba(245,158,11,0.07) 0%, rgba(245,158,11,0.03) 40%, transparent 70%)",
					pointerEvents: "none",
				}}
			/>
			{/* Secondary green accent */}
			<div
				aria-hidden
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "40%",
					background:
						"radial-gradient(ellipse 500px 300px at 50% 100%, rgba(16,185,129,0.04) 0%, transparent 60%)",
					pointerEvents: "none",
				}}
			/>
			{/* Top gold accent line */}
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

			{/* Top flex spacer */}
			<div className="flex-1" />

			{/* Logo */}
			<div className="flex flex-col items-center gap-3 animate-fade-in">
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
					className="font-display text-ink-disabled uppercase tracking-widest"
					style={{ fontSize: 11, letterSpacing: "0.45em" }}
				>
					Sistema POS — Caja
				</div>
			</div>

			<div style={{ height: 40 }} />

			{/* PIN Card */}
			<div
				className="card-gold animate-slide-up w-full"
				style={{
					maxWidth: 360,
					padding: "28px 28px 24px",
					position: "relative",
				}}
			>
				{/* Top accent stripe on card */}
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

				{/* PIN label */}
				<div
					className="font-display uppercase text-center mb-5 text-ink-disabled"
					style={{ fontSize: 10, letterSpacing: "0.4em" }}
				>
					Ingresá tu PIN
				</div>

				{/* PIN dots */}
				<div
					className="flex justify-center gap-5 mb-7"
					style={{
						animation: shaking
							? "posShake 0.5s cubic-bezier(0.36,0.07,0.19,0.97)"
							: undefined,
					}}
				>
					{[0, 1, 2, 3].map((i) => (
						<div
							key={i}
							style={{
								width: 16,
								height: 16,
								borderRadius: "50%",
								border: `2px solid ${dotBorder(i)}`,
								background: dotColor(i),
								boxShadow: dotGlow(i),
								transition: "all 0.12s ease",
							}}
						/>
					))}
				</div>

				{/* Numpad */}
				<div
					className="grid gap-2"
					style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
				>
					{numpadRows.flat().map((key, idx) => {
						if (key === "") return <div key={idx} />;
						const isBackspace = key === "⌫";
						return (
							<button
								key={idx}
								onClick={() => {
									if (isBackspace) handleBackspace();
									else handleDigit(key);
								}}
								style={{
									height: 56,
									borderRadius: 12,
									border: isBackspace
										? "1px solid #1e1e1e"
										: "1px solid #202020",
									background: isBackspace ? "transparent" : "var(--s2)",
									color: isBackspace ? "#555" : "#f5f5f5",
									fontSize: isBackspace ? 0 : 26,
									fontFamily: "var(--font-bebas)",
									letterSpacing: "0.05em",
									cursor: "pointer",
									transition: "all 0.1s",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									userSelect: "none",
								}}
								onMouseEnter={(e) => {
									const el = e.currentTarget;
									if (!isBackspace) {
										el.style.background = "var(--s3)";
										el.style.borderColor = "#2c2c2c";
									} else {
										el.style.color = "#a3a3a3";
									}
								}}
								onMouseLeave={(e) => {
									const el = e.currentTarget;
									if (!isBackspace) {
										el.style.background = "var(--s2)";
										el.style.borderColor = "#202020";
									} else {
										el.style.color = "#555";
									}
								}}
								onMouseDown={(e) => {
									e.currentTarget.style.transform = "scale(0.91)";
								}}
								onMouseUp={(e) => {
									e.currentTarget.style.transform = "scale(1)";
								}}
							>
								{isBackspace ? <Delete size={18} /> : key}
							</button>
						);
					})}
				</div>

				{/* Confirm button */}
				<button
					className="btn-primary w-full justify-center mt-4"
					style={{
						paddingTop: 14,
						paddingBottom: 14,
						fontSize: 12,
						opacity: pin.length === 4 && !success && !verifying ? 1 : 0.35,
						cursor:
							pin.length === 4 && !success && !verifying
								? "pointer"
								: "not-allowed",
						transition: "opacity 0.2s, transform 0.1s",
						...(success
							? {
									background: "#10b981",
									boxShadow: "0 0 24px rgba(16,185,129,0.35)",
								}
							: {}),
					}}
					onClick={() => {
						if (pin.length === 4 && !success && !verifying) checkPin(pin);
					}}
					disabled={pin.length < 4 || success || verifying}
				>
					{success ? (
						<>
							<Check size={16} />
							Acceso concedido
						</>
					) : verifying ? (
						<>Verificando...</>
					) : (
						<>
							<LogIn size={15} />
							Iniciar Turno
						</>
					)}
				</button>
			</div>

			<div className="flex-[0.7]" />

			{/* Footer */}
			<div className="flex flex-col items-center gap-2 pb-10 animate-fade-in">
				<img
					src="/logo.svg"
					alt="My Way"
					style={{
						height: 16,
						width: "auto",
						filter: "invert(1)",
						opacity: 0.3,
						display: "block",
					}}
				/>
				<div
					className="text-ink-disabled font-kds"
					style={{ fontSize: 13, letterSpacing: "0.05em" }}
					suppressHydrationWarning
				>
					{currentTime}
				</div>
			</div>

			<style>{`
        @keyframes posShake {
          0%, 100% { transform: translateX(0); }
          12%       { transform: translateX(-8px); }
          36%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
		</div>
	);
}
