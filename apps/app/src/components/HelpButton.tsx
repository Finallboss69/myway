"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

interface HelpItem {
	title: string;
	description: string;
}

interface HelpButtonProps {
	/** Section title shown in the popup header */
	sectionTitle: string;
	/** List of features/actions explained */
	items: HelpItem[];
}

export default function HelpButton({ sectionTitle, items }: HelpButtonProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="flex items-center gap-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
				style={{
					padding: "6px 12px",
					background: "rgba(245,158,11,0.08)",
					border: "1px solid rgba(245,158,11,0.2)",
					color: "rgba(245,158,11,0.7)",
					fontSize: 12,
					fontFamily: "var(--font-dm-sans)",
				}}
				title="¿Qué puedo hacer aquí?"
			>
				<HelpCircle size={14} />
				<span>¿Qué puedo hacer?</span>
			</button>

			{open && (
				<>
					{/* Backdrop */}
					<div
						onClick={() => setOpen(false)}
						style={{
							position: "fixed",
							inset: 0,
							background: "rgba(0,0,0,0.6)",
							backdropFilter: "blur(4px)",
							zIndex: 10000,
						}}
					/>

					{/* Popup */}
					<div
						className="animate-slide-up"
						style={{
							position: "fixed",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							width: "min(480px, calc(100vw - 32px))",
							maxHeight: "min(600px, calc(100vh - 64px))",
							background: "var(--s1)",
							border: "1px solid var(--s3)",
							borderRadius: 16,
							zIndex: 10001,
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
						}}
					>
						{/* Header */}
						<div
							style={{
								padding: "20px 24px 16px",
								borderBottom: "1px solid var(--s3)",
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								flexShrink: 0,
							}}
						>
							<div>
								<div
									className="font-display"
									style={{
										fontSize: 16,
										fontWeight: 600,
										color: "var(--ink-primary)",
									}}
								>
									{sectionTitle}
								</div>
								<div
									className="font-display"
									style={{
										fontSize: 11,
										color: "rgba(245,158,11,0.6)",
										letterSpacing: "0.1em",
										textTransform: "uppercase",
										marginTop: 2,
									}}
								>
									¿Qué puedo hacer aquí?
								</div>
							</div>
							<button
								onClick={() => setOpen(false)}
								className="text-ink-disabled hover:text-ink-primary transition-colors"
								style={{
									padding: 6,
									borderRadius: 8,
									background: "var(--s2)",
									border: "1px solid var(--s3)",
								}}
							>
								<X size={16} />
							</button>
						</div>

						{/* Content */}
						<div
							style={{
								padding: "16px 24px 24px",
								overflowY: "auto",
								flex: 1,
							}}
						>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 12,
								}}
							>
								{items.map((item, i) => (
									<div
										key={i}
										style={{
											padding: "12px 16px",
											background: "var(--s2)",
											border: "1px solid var(--s3)",
											borderRadius: 12,
										}}
									>
										<div
											className="font-display"
											style={{
												fontSize: 13,
												fontWeight: 600,
												color: "var(--ink-primary)",
												marginBottom: 4,
											}}
										>
											{item.title}
										</div>
										<div
											style={{
												fontSize: 12,
												color: "var(--ink-secondary)",
												lineHeight: 1.5,
											}}
										>
											{item.description}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</>
			)}
		</>
	);
}
