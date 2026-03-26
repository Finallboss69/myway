import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, RotateCcw } from "lucide-react";
import type { TutorialStep } from "../data/screens";

interface TutorialOverlayProps {
	steps: TutorialStep[];
	screenName: string;
}

export default function TutorialOverlay({
	steps,
	screenName,
}: TutorialOverlayProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const [isVisible, setIsVisible] = useState(true);
	const step = steps[currentStep] as TutorialStep | undefined;

	const highlightTarget = useCallback(() => {
		// Remove previous highlights
		document.querySelectorAll(".glow-ring").forEach((el) => {
			el.classList.remove("glow-ring");
		});

		if (!step) return;

		const target = document.getElementById(step.target);
		if (target) {
			target.classList.add("glow-ring");
			target.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, [step]);

	useEffect(() => {
		highlightTarget();
		return () => {
			document.querySelectorAll(".glow-ring").forEach((el) => {
				el.classList.remove("glow-ring");
			});
		};
	}, [highlightTarget]);

	const next = () => {
		if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
	};

	const prev = () => {
		if (currentStep > 0) setCurrentStep((s) => s - 1);
	};

	const restart = () => {
		setCurrentStep(0);
		setIsVisible(true);
	};

	if (!step) return null;

	if (!isVisible) {
		return (
			<button
				onClick={restart}
				className="fixed bottom-4 right-4 z-[100] bg-[var(--brand)] text-white rounded-full p-3 shadow-lg hover:scale-105 transition-transform"
				title="Reiniciar tutorial"
			>
				<RotateCcw size={20} />
			</button>
		);
	}

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={currentStep}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -20 }}
				className="fixed bottom-0 left-0 right-0 z-[100] p-4"
			>
				<div className="max-w-lg mx-auto bg-[var(--bg-elevated)] rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
					{/* Progress bar */}
					<div className="h-1 bg-white/5">
						<div
							className="h-full bg-[var(--brand)] transition-all duration-300"
							style={{
								width: `${((currentStep + 1) / steps.length) * 100}%`,
							}}
						/>
					</div>

					<div className="p-5">
						{/* Header */}
						<div className="flex items-start justify-between mb-3">
							<div>
								<p className="text-[10px] uppercase tracking-widest text-[var(--brand)] font-semibold mb-1">
									{screenName} — Paso {currentStep + 1} de {steps.length}
								</p>
								<h3 className="text-lg font-bold text-[var(--ink)]">
									{step.title}
								</h3>
							</div>
							<button
								onClick={() => setIsVisible(false)}
								className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors p-1"
							>
								<X size={16} />
							</button>
						</div>

						{/* Description */}
						<p className="text-sm text-[var(--ink-secondary)] leading-relaxed mb-5">
							{step.description}
						</p>

						{/* Navigation */}
						<div className="flex items-center justify-between">
							<button
								onClick={prev}
								disabled={currentStep === 0}
								className="flex items-center gap-1 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
							>
								<ChevronLeft size={16} />
								Anterior
							</button>

							{/* Step dots */}
							<div className="flex gap-1.5">
								{steps.map((_, i) => (
									<button
										key={i}
										onClick={() => setCurrentStep(i)}
										className={`w-2 h-2 rounded-full transition-all ${
											i === currentStep
												? "bg-[var(--brand)] w-6"
												: i < currentStep
													? "bg-[var(--brand)]/40"
													: "bg-white/10"
										}`}
									/>
								))}
							</div>

							{currentStep < steps.length - 1 ? (
								<button
									onClick={next}
									className="flex items-center gap-1 text-sm font-medium text-[var(--brand)] hover:text-white transition-colors"
								>
									Siguiente
									<ChevronRight size={16} />
								</button>
							) : (
								<button
									onClick={() => setIsVisible(false)}
									className="text-sm font-medium text-[var(--success)] hover:text-white transition-colors"
								>
									Completado!
								</button>
							)}
						</div>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
