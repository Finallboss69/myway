"use client";

import { useState, useEffect, useMemo } from "react";
import { Delete, Check, LogIn, LogOut } from "lucide-react";

interface StaffSession {
	id: string;
	name: string;
	role: string;
	avatar: string;
}

interface PinGateProps {
	children: React.ReactNode;
	/** Storage key for this gate's session */
	storageKey: string;
	/** Only allow staff with these roles (empty = any) */
	allowedRoles?: string[];
	/** Title shown above PIN input */
	title?: string;
	/** Subtitle */
	subtitle?: string;
}

function getSession(key: string): StaffSession | null {
	try {
		const raw = sessionStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw) as StaffSession;
	} catch {
		return null;
	}
}

export default function PinGate({
	children,
	storageKey,
	allowedRoles,
	title = "Ingresá tu PIN",
	subtitle,
}: PinGateProps) {
	// Stable reference for allowedRoles to avoid infinite re-render loop
	const roles = useMemo(
		() => allowedRoles ?? [],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[JSON.stringify(allowedRoles)],
	);

	const [authed, setAuthed] = useState<StaffSession | null>(null);
	const [checking, setChecking] = useState(true);
	const [pin, setPin] = useState<string[]>([]);
	const [shaking, setShaking] = useState(false);
	const [wrongFlash, setWrongFlash] = useState(false);
	const [success, setSuccess] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		const s = getSession(storageKey);
		if (s) {
			// Validate stored session still has an allowed role
			if (roles.length > 0 && !roles.includes(s.role)) {
				sessionStorage.removeItem(storageKey);
			} else {
				setAuthed(s);
			}
		}
		setChecking(false);
	}, [storageKey, roles]);

	const handleDigit = (digit: string) => {
		if (pin.length >= 4 || success || verifying) return;
		setError("");
		const next = [...pin, digit];
		setPin(next);
		if (next.length === 4) {
			setTimeout(() => checkPin(next), 120);
		}
	};

	const handleBackspace = () => {
		if (success || verifying) return;
		setPin((prev) => prev.slice(0, -1));
		setError("");
	};

	const checkPin = async (digits: string[]) => {
		if (verifying) return;
		setVerifying(true);
		setError("");
		try {
			const res = await fetch("/api/staff/verify-pin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pin: digits.join("") }),
			});
			if (res.ok) {
				const staff = (await res.json()) as StaffSession;
				if (roles.length > 0 && !roles.includes(staff.role)) {
					setError("No tenés permisos para acceder");
					setShaking(true);
					setWrongFlash(true);
					setTimeout(() => {
						setShaking(false);
						setWrongFlash(false);
						setPin([]);
					}, 600);
					return;
				}
				sessionStorage.setItem(storageKey, JSON.stringify(staff));
				setSuccess(true);
				setTimeout(() => setAuthed(staff), 500);
			} else {
				setShaking(true);
				setWrongFlash(true);
				setError("PIN incorrecto");
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

	const handleLogout = () => {
		sessionStorage.removeItem(storageKey);
		setAuthed(null);
		setSuccess(false);
		setPin([]);
		setError("");
	};

	if (checking) return null;

	if (authed) {
		return (
			<>
				{/* Staff indicator + logout — isolated portal-style overlay */}
				<div
					className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full px-3 py-1.5"
					style={{
						zIndex: 9999,
						background: "var(--s2)",
						border: "1px solid var(--s3)",
						fontSize: 12,
						pointerEvents: "auto",
					}}
				>
					<span className="text-ink-secondary">{authed.name}</span>
					<button
						onClick={handleLogout}
						className="text-ink-disabled hover:text-ink-primary transition-colors"
						title="Cerrar sesión"
					>
						<LogOut size={14} />
					</button>
				</div>
				{children}
			</>
		);
	}

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
			className="noise-overlay min-h-screen flex flex-col items-center justify-center overflow-hidden"
			style={{ background: "var(--s0)", position: "relative" }}
		>
			{/* Background glow */}
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

			{/* Logo */}
			<div className="flex flex-col items-center gap-3 mb-10 animate-fade-in">
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
				{subtitle && (
					<div
						className="font-display text-ink-disabled uppercase tracking-widest"
						style={{ fontSize: 11, letterSpacing: "0.45em" }}
					>
						{subtitle}
					</div>
				)}
			</div>

			{/* PIN Card */}
			<div
				className="card-gold animate-slide-up w-full"
				style={{
					maxWidth: 360,
					padding: "28px 28px 24px",
					position: "relative",
				}}
			>
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
					className="font-display uppercase text-center mb-5 text-ink-disabled"
					style={{ fontSize: 10, letterSpacing: "0.4em" }}
				>
					{title}
				</div>

				{/* PIN dots */}
				<div
					className="flex justify-center gap-5 mb-7"
					style={{
						animation: shaking
							? "pinGateShake 0.5s cubic-bezier(0.36,0.07,0.19,0.97)"
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

				{/* Error message */}
				{error && (
					<div
						className="text-center mb-4 font-display"
						style={{ fontSize: 12, color: "#ef4444" }}
					>
						{error}
					</div>
				)}

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
							Ingresar
						</>
					)}
				</button>
			</div>

			{/* Footer */}
			<div className="flex flex-col items-center gap-1.5 mt-10 animate-fade-in">
				<div
					className="font-display text-ink-disabled uppercase tracking-widest"
					style={{ fontSize: 10, letterSpacing: "0.3em" }}
				>
					My Way · Bar &amp; Pool
				</div>
			</div>

			<style>{`
				@keyframes pinGateShake {
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
