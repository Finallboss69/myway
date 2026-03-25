"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

export interface HelpItem {
	title: string;
	description: string;
}

export interface HelpButtonProps {
	sectionTitle: string;
	items: HelpItem[];
	/** Optional role label shown in header badge */
	role?: string;
	/** Variant: "float" renders a fixed-position circle, "inline" renders inline button */
	variant?: "float" | "inline";
}

export default function HelpButton({
	sectionTitle,
	items,
	role,
	variant = "inline",
}: HelpButtonProps) {
	const [open, setOpen] = useState(false);

	// Keyboard shortcut: press ? to toggle
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (
				e.key === "?" &&
				!e.ctrlKey &&
				!e.metaKey &&
				!(e.target instanceof HTMLInputElement) &&
				!(e.target instanceof HTMLTextAreaElement) &&
				!(e.target instanceof HTMLSelectElement)
			) {
				setOpen((o) => !o);
			}
			if (e.key === "Escape" && open) {
				setOpen(false);
			}
		},
		[open],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	// Lock body scroll when open
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [open]);

	const ROLE_COLORS: Record<
		string,
		{ bg: string; border: string; text: string }
	> = {
		admin: {
			bg: "rgba(245,158,11,0.12)",
			border: "rgba(245,158,11,0.3)",
			text: "#f59e0b",
		},
		cajero: {
			bg: "rgba(59,130,246,0.12)",
			border: "rgba(59,130,246,0.3)",
			text: "#3b82f6",
		},
		mozo: {
			bg: "rgba(16,185,129,0.12)",
			border: "rgba(16,185,129,0.3)",
			text: "#10b981",
		},
		cocina: {
			bg: "rgba(239,68,68,0.12)",
			border: "rgba(239,68,68,0.3)",
			text: "#ef4444",
		},
		bar: {
			bg: "rgba(168,85,247,0.12)",
			border: "rgba(168,85,247,0.3)",
			text: "#a855f7",
		},
		cliente: {
			bg: "rgba(34,197,94,0.12)",
			border: "rgba(34,197,94,0.3)",
			text: "#22c55e",
		},
		repartidor: {
			bg: "rgba(249,115,22,0.12)",
			border: "rgba(249,115,22,0.3)",
			text: "#f97316",
		},
	};

	const roleStyle = role
		? (ROLE_COLORS[role.toLowerCase()] ?? ROLE_COLORS.admin)
		: null;

	return (
		<>
			{/* Trigger button */}
			{variant === "float" ? (
				<button
					onClick={() => setOpen(true)}
					aria-label="Ayuda"
					style={{
						position: "fixed",
						bottom: 24,
						right: 24,
						width: 48,
						height: 48,
						borderRadius: "50%",
						background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
						border: "2px solid rgba(255,255,255,0.15)",
						color: "#080808",
						fontSize: 22,
						fontWeight: 800,
						fontFamily: "var(--font-syne, sans-serif)",
						cursor: "pointer",
						zIndex: 9990,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						boxShadow:
							"0 4px 24px rgba(245,158,11,0.4), 0 2px 8px rgba(0,0,0,0.3)",
						transition: "transform 0.2s, box-shadow 0.2s",
					}}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
						(e.currentTarget as HTMLElement).style.boxShadow =
							"0 6px 32px rgba(245,158,11,0.5), 0 2px 8px rgba(0,0,0,0.3)";
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLElement).style.transform = "scale(1)";
						(e.currentTarget as HTMLElement).style.boxShadow =
							"0 4px 24px rgba(245,158,11,0.4), 0 2px 8px rgba(0,0,0,0.3)";
					}}
				>
					?
				</button>
			) : (
				<button
					onClick={() => setOpen(true)}
					className="flex items-center gap-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
					style={{
						padding: "5px 11px",
						background: "rgba(245,158,11,0.08)",
						border: "1px solid rgba(245,158,11,0.2)",
						color: "rgba(245,158,11,0.7)",
						fontSize: 11,
						fontFamily: "var(--font-dm-sans, sans-serif)",
						cursor: "pointer",
					}}
					title="Ayuda (presioná ?)"
				>
					<span
						style={{
							width: 18,
							height: 18,
							borderRadius: "50%",
							background: "rgba(245,158,11,0.15)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 11,
							fontWeight: 700,
							color: "#f59e0b",
							flexShrink: 0,
						}}
					>
						?
					</span>
					<span>Ayuda</span>
				</button>
			)}

			{/* Modal */}
			{open && (
				<>
					{/* Backdrop */}
					<div
						onClick={() => setOpen(false)}
						style={{
							position: "fixed",
							inset: 0,
							background: "rgba(0,0,0,0.65)",
							backdropFilter: "blur(6px)",
							zIndex: 10000,
							animation: "helpFadeIn 0.2s ease",
						}}
					/>

					{/* Panel */}
					<div
						style={{
							position: "fixed",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							width: "min(520px, calc(100vw - 32px))",
							maxHeight: "min(680px, calc(100vh - 48px))",
							background: "var(--s1, #111)",
							border: "1px solid var(--s3, #333)",
							borderRadius: 20,
							zIndex: 10001,
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
							boxShadow:
								"0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
							animation: "helpSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
						}}
					>
						{/* Header */}
						<div
							style={{
								padding: "20px 24px 16px",
								borderBottom: "1px solid var(--s3, #333)",
								flexShrink: 0,
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "flex-start",
									justifyContent: "space-between",
									gap: 12,
								}}
							>
								<div style={{ flex: 1 }}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 10,
											marginBottom: 6,
										}}
									>
										{/* Gold ? badge */}
										<div
											style={{
												width: 32,
												height: 32,
												borderRadius: 10,
												background:
													"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize: 17,
												fontWeight: 800,
												color: "#080808",
												fontFamily: "var(--font-syne, sans-serif)",
												flexShrink: 0,
											}}
										>
											?
										</div>
										<div
											style={{
												fontFamily: "var(--font-syne, sans-serif)",
												fontSize: 17,
												fontWeight: 700,
												color: "var(--ink-primary, #f5f5f5)",
												lineHeight: 1.2,
											}}
										>
											{sectionTitle}
										</div>
									</div>

									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 8,
											marginTop: 4,
										}}
									>
										{roleStyle && role && (
											<span
												style={{
													padding: "2px 10px",
													borderRadius: 99,
													fontSize: 9,
													fontWeight: 700,
													letterSpacing: "0.12em",
													textTransform: "uppercase",
													fontFamily: "var(--font-syne, sans-serif)",
													background: roleStyle.bg,
													border: `1px solid ${roleStyle.border}`,
													color: roleStyle.text,
												}}
											>
												{role}
											</span>
										)}
										<span
											style={{
												fontSize: 10,
												color: "var(--ink-tertiary, #888)",
												fontFamily: "var(--font-dm-sans, sans-serif)",
											}}
										>
											{items.length} funciones disponibles
										</span>
									</div>
								</div>

								<button
									onClick={() => setOpen(false)}
									style={{
										padding: 6,
										borderRadius: 10,
										background: "var(--s2, #1a1a1a)",
										border: "1px solid var(--s3, #333)",
										color: "var(--ink-disabled, #666)",
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										transition: "color 0.15s",
										flexShrink: 0,
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLElement).style.color = "#f5f5f5";
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLElement).style.color = "#666";
									}}
								>
									<X size={16} />
								</button>
							</div>
						</div>

						{/* Content */}
						<div
							style={{
								padding: "16px 20px 24px",
								overflowY: "auto",
								flex: 1,
							}}
						>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 10,
								}}
							>
								{items.map((item, i) => (
									<div
										key={i}
										style={{
											padding: "14px 16px",
											background: "var(--s2, #1a1a1a)",
											border: "1px solid var(--s3, #333)",
											borderRadius: 14,
											display: "flex",
											gap: 14,
											alignItems: "flex-start",
											transition: "border-color 0.15s, background 0.15s",
										}}
										onMouseEnter={(e) => {
											(e.currentTarget as HTMLElement).style.borderColor =
												"rgba(245,158,11,0.25)";
											(e.currentTarget as HTMLElement).style.background =
												"rgba(245,158,11,0.03)";
										}}
										onMouseLeave={(e) => {
											(e.currentTarget as HTMLElement).style.borderColor =
												"var(--s3, #333)";
											(e.currentTarget as HTMLElement).style.background =
												"var(--s2, #1a1a1a)";
										}}
									>
										{/* Step number */}
										<div
											style={{
												width: 26,
												height: 26,
												borderRadius: 8,
												background: "rgba(245,158,11,0.1)",
												border: "1px solid rgba(245,158,11,0.2)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize: 12,
												fontWeight: 700,
												color: "#f59e0b",
												fontFamily: "var(--font-syne, sans-serif)",
												flexShrink: 0,
												marginTop: 1,
											}}
										>
											{i + 1}
										</div>

										<div style={{ flex: 1 }}>
											<div
												style={{
													fontFamily: "var(--font-syne, sans-serif)",
													fontSize: 13,
													fontWeight: 600,
													color: "var(--ink-primary, #f5f5f5)",
													marginBottom: 4,
													lineHeight: 1.3,
												}}
											>
												{item.title}
											</div>
											<div
												style={{
													fontSize: 12,
													color: "var(--ink-secondary, #aaa)",
													lineHeight: 1.6,
													fontFamily: "var(--font-dm-sans, sans-serif)",
												}}
											>
												{item.description}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Footer */}
						<div
							style={{
								padding: "12px 20px",
								borderTop: "1px solid var(--s3, #333)",
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								flexShrink: 0,
							}}
						>
							<span
								style={{
									fontSize: 10,
									color: "var(--ink-disabled, #555)",
									fontFamily: "var(--font-dm-sans, sans-serif)",
								}}
							>
								Presiona{" "}
								<kbd
									style={{
										padding: "1px 6px",
										borderRadius: 4,
										background: "var(--s2, #1a1a1a)",
										border: "1px solid var(--s3, #333)",
										fontSize: 10,
										fontFamily: "monospace",
										color: "#f59e0b",
									}}
								>
									?
								</kbd>{" "}
								para abrir/cerrar
							</span>
							<span
								style={{
									fontSize: 9,
									color: "var(--ink-disabled, #555)",
									fontFamily: "var(--font-syne, sans-serif)",
									letterSpacing: "0.15em",
									textTransform: "uppercase",
								}}
							>
								MY WAY OLIVOS
							</span>
						</div>
					</div>

					{/* Animations */}
					<style>{`
						@keyframes helpFadeIn {
							from { opacity: 0; }
							to { opacity: 1; }
						}
						@keyframes helpSlideUp {
							from { opacity: 0; transform: translate(-50%, -46%); }
							to { opacity: 1; transform: translate(-50%, -50%); }
						}
					`}</style>
				</>
			)}
		</>
	);
}
