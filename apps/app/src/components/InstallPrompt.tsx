"use client";

import { useState, useEffect } from "react";
import { X, Download, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "myway_install_dismissed";

function isIosDevice() {
	return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

function isInStandaloneMode() {
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		(window.navigator as { standalone?: boolean }).standalone === true
	);
}

export function InstallPrompt() {
	const [show, setShow] = useState(false);
	const [isIos, setIsIos] = useState(false);
	const [showIosSteps, setShowIosSteps] = useState(false);
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);

	useEffect(() => {
		// Don't show if already installed
		if (isInStandaloneMode()) return;

		// Don't show if dismissed recently
		if (localStorage.getItem(STORAGE_KEY)) return;

		const ios = isIosDevice();
		setIsIos(ios);

		if (ios) {
			// Show iOS prompt after 2s
			const t = setTimeout(() => setShow(true), 2000);
			return () => clearTimeout(t);
		}

		// Android/Chrome: wait for beforeinstallprompt
		const handler = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			const t = setTimeout(() => setShow(true), 2000);
			return () => clearTimeout(t);
		};
		window.addEventListener("beforeinstallprompt", handler);
		return () => window.removeEventListener("beforeinstallprompt", handler);
	}, []);

	function dismiss() {
		localStorage.setItem(STORAGE_KEY, "1");
		setShow(false);
	}

	async function install() {
		if (!deferredPrompt) return;
		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === "accepted") setShow(false);
		else dismiss();
	}

	if (!show) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-[90] bg-black/60"
				style={{ backdropFilter: "blur(4px)" }}
				onClick={dismiss}
			/>

			{/* Bottom sheet */}
			<div
				className="fixed bottom-0 inset-x-0 z-[91] animate-slide-up"
				style={{ maxWidth: 480, margin: "0 auto" }}
			>
				<div
					className="rounded-t-3xl overflow-hidden"
					style={{
						background: "rgba(14,14,14,0.98)",
						border: "1px solid rgba(245,158,11,0.2)",
						borderBottom: "none",
						boxShadow: "0 -8px 48px rgba(245,158,11,0.12)",
					}}
				>
					{/* Gold top bar */}
					<div
						style={{
							height: 3,
							background:
								"linear-gradient(90deg, transparent 0%, #f59e0b 40%, #f59e0b 60%, transparent 100%)",
						}}
					/>

					{/* Handle */}
					<div className="flex justify-center pt-3 pb-0">
						<div
							style={{
								width: 36,
								height: 4,
								borderRadius: 99,
								background: "rgba(255,255,255,0.12)",
							}}
						/>
					</div>

					<div className="px-6 pt-4 pb-8">
						{!showIosSteps ? (
							<>
								{/* App info row */}
								<div className="flex items-center gap-4 mb-5">
									<div
										className="flex-shrink-0 flex items-center justify-center rounded-2xl"
										style={{
											width: 60,
											height: 60,
											background: "#080808",
											border: "1.5px solid rgba(245,158,11,0.35)",
											boxShadow: "0 0 20px rgba(245,158,11,0.15)",
										}}
									>
										<span
											className="font-kds text-brand-500"
											style={{ fontSize: 22, letterSpacing: "0.08em" }}
										>
											MW
										</span>
									</div>
									<div className="flex-1 min-w-0">
										<div
											className="font-display font-bold text-ink-primary"
											style={{ fontSize: 16 }}
										>
											My Way
										</div>
										<div
											className="font-body text-ink-tertiary mt-0.5"
											style={{ fontSize: 12 }}
										>
											Bar & Pool · Sistema de gestión
										</div>
										<div className="flex items-center gap-1 mt-1">
											{[1, 2, 3, 4, 5].map((i) => (
												<span
													key={i}
													style={{ color: "#f59e0b", fontSize: 11 }}
												>
													★
												</span>
											))}
											<span
												className="font-body text-ink-tertiary ml-1"
												style={{ fontSize: 10 }}
											>
												Instalar gratis
											</span>
										</div>
									</div>
									<button
										onClick={dismiss}
										className="flex-shrink-0 flex items-center justify-center rounded-full btn-ghost"
										style={{ width: 32, height: 32 }}
									>
										<X size={16} className="text-ink-tertiary" />
									</button>
								</div>

								{/* Description */}
								<p
									className="font-body text-ink-secondary mb-5"
									style={{ fontSize: 13, lineHeight: 1.5 }}
								>
									Instalá My Way en tu pantalla de inicio para acceso rápido sin
									abrir el navegador. Funciona sin conexión.
								</p>

								{/* Buttons */}
								<div className="flex gap-3">
									<button
										onClick={dismiss}
										className="flex-1 py-3 rounded-2xl font-display font-bold uppercase border border-surface-4 text-ink-tertiary transition-all active:scale-95"
										style={{ fontSize: 12, letterSpacing: "0.08em" }}
									>
										Ahora no
									</button>
									<button
										onClick={isIos ? () => setShowIosSteps(true) : install}
										className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl font-display font-bold uppercase transition-all active:scale-95"
										style={{
											fontSize: 12,
											letterSpacing: "0.08em",
											background: "#f59e0b",
											color: "#080808",
											boxShadow: "0 0 20px rgba(245,158,11,0.35)",
										}}
									>
										<Download size={15} />
										Instalar app
									</button>
								</div>
							</>
						) : (
							<>
								{/* iOS step-by-step */}
								<div className="flex items-center justify-between mb-5">
									<div>
										<div
											className="font-display font-bold text-ink-primary"
											style={{ fontSize: 15 }}
										>
											Instalar en iOS
										</div>
										<div
											className="font-body text-ink-tertiary"
											style={{ fontSize: 11 }}
										>
											Seguí estos pasos en Safari
										</div>
									</div>
									<button onClick={dismiss} className="btn-ghost p-1.5">
										<X size={16} className="text-ink-tertiary" />
									</button>
								</div>

								<div className="space-y-4">
									{[
										{
											icon: <Share size={18} className="text-brand-500" />,
											step: "1",
											title: "Tocá el botón compartir",
											desc: "El ícono de cuadrado con flecha (↑) en la barra inferior de Safari",
										},
										{
											icon: <Plus size={18} className="text-brand-500" />,
											step: "2",
											title: 'Tocá "Agregar a inicio"',
											desc: 'Deslizá hacia abajo en el menú y tocá "Agregar a pantalla de inicio"',
										},
										{
											icon: (
												<span
													className="font-kds text-brand-500"
													style={{ fontSize: 14 }}
												>
													MW
												</span>
											),
											step: "3",
											title: 'Confirmá con "Agregar"',
											desc: "My Way aparecerá en tu pantalla de inicio como una app nativa",
										},
									].map(({ icon, step, title, desc }) => (
										<div key={step} className="flex items-start gap-3">
											<div
												className="flex-shrink-0 flex items-center justify-center rounded-xl"
												style={{
													width: 40,
													height: 40,
													background: "rgba(245,158,11,0.1)",
													border: "1px solid rgba(245,158,11,0.25)",
												}}
											>
												{icon}
											</div>
											<div className="flex-1 min-w-0">
												<div
													className="font-display font-semibold text-ink-primary"
													style={{ fontSize: 13 }}
												>
													{title}
												</div>
												<div
													className="font-body text-ink-tertiary mt-0.5"
													style={{ fontSize: 11, lineHeight: 1.4 }}
												>
													{desc}
												</div>
											</div>
										</div>
									))}
								</div>

								<button
									onClick={dismiss}
									className="w-full mt-6 py-3 rounded-2xl font-display font-bold uppercase transition-all active:scale-95"
									style={{
										fontSize: 12,
										letterSpacing: "0.08em",
										background: "#f59e0b",
										color: "#080808",
										boxShadow: "0 0 20px rgba(245,158,11,0.3)",
									}}
								>
									Entendido ✓
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
