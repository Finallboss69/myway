"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Category {
	id: string;
	name: string;
	icon: string;
	order: number;
}

interface Product {
	id: string;
	name: string;
	description: string | null;
	price: number;
	categoryId: string;
	isAvailable: boolean;
}

function formatCurrency(n: number) {
	return "$" + Math.round(n).toLocaleString("es-AR");
}

// ── Intro Loader ──────────────────────────────────────────────────────────────

function IntroLoader({ onDone }: { onDone: () => void }) {
	const [fading, setFading] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const t = setTimeout(() => {
			setFading(true);
			setTimeout(onDone, 600);
		}, 3200);
		return () => clearTimeout(t);
	}, [onDone]);

	// Force play on mobile — many browsers block autoplay
	useEffect(() => {
		const vid = videoRef.current;
		if (!vid) return;
		const tryPlay = () => {
			vid.play().catch(() => {
				// Video blocked by browser — intro still shows with static bg
			});
		};
		// Try immediately, and also after user interaction
		tryPlay();
		document.addEventListener("touchstart", tryPlay, { once: true });
		return () => document.removeEventListener("touchstart", tryPlay);
	}, []);

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 9999,
				background: "#080808",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				opacity: fading ? 0 : 1,
				transition: "opacity 0.6s ease",
				pointerEvents: fading ? "none" : "auto",
			}}
		>
			<video
				ref={videoRef}
				src="/media/intro.mp4"
				autoPlay
				muted
				playsInline
				loop
				preload="auto"
				poster="/media/pool-hero.jpg"
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					objectFit: "cover",
					opacity: 0.4,
				}}
			/>
			<div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
				<div
					style={{
						fontSize: "clamp(52px, 14vw, 104px)",
						fontWeight: 900,
						letterSpacing: "0.22em",
						color: "#f0f0f0",
						fontFamily: "'Segoe UI', system-ui, sans-serif",
						lineHeight: 1,
					}}
				>
					MY WAY
				</div>
				<div
					style={{
						fontSize: 11,
						letterSpacing: "0.4em",
						color: "#f59e0b",
						textTransform: "uppercase",
						marginTop: 14,
					}}
				>
					Bar &amp; Pool · Olivos
				</div>
			</div>
			{/* Progress bar */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 3,
					background: "#1a1a1a",
				}}
			>
				<div
					style={{
						height: "100%",
						background: "linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)",
						animation: "progress 3.2s linear forwards",
					}}
				/>
			</div>
			<style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
		</div>
	);
}

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 60);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<nav
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				zIndex: 100,
				padding: "16px 28px",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				background: scrolled ? "rgba(8,8,8,0.92)" : "transparent",
				backdropFilter: scrolled ? "blur(20px)" : "none",
				borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
				transition: "all 0.3s ease",
			}}
		>
			<a
				href="#"
				style={{
					fontSize: 16,
					fontWeight: 900,
					letterSpacing: "0.2em",
					color: "#f0f0f0",
					textDecoration: "none",
				}}
			>
				MY WAY
			</a>
			<div style={{ display: "flex", alignItems: "center", gap: 24 }}>
				<a
					href="#menu"
					style={{
						fontSize: 10,
						letterSpacing: "0.15em",
						textTransform: "uppercase",
						color: "#888",
						textDecoration: "none",
						transition: "color 0.15s",
					}}
				>
					Menú
				</a>
				<Link
					href="/delivery"
					style={{
						padding: "8px 18px",
						borderRadius: 8,
						background: "#f59e0b",
						color: "#080808",
						fontSize: 10,
						fontWeight: 700,
						letterSpacing: "0.1em",
						textTransform: "uppercase",
						textDecoration: "none",
					}}
				>
					Delivery
				</Link>
			</div>
		</nav>
	);
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
	return (
		<section
			style={{
				position: "relative",
				minHeight: "100svh",
				display: "flex",
				alignItems: "flex-end",
				overflow: "hidden",
			}}
		>
			<Image
				src="/media/pool-hero.jpg"
				alt="My Way Bar & Pool"
				fill
				priority
				style={{ objectFit: "cover", objectPosition: "center" }}
			/>
			{/* Gradient overlay */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"linear-gradient(0deg, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.55) 45%, rgba(8,8,8,0.1) 75%)",
				}}
			/>
			<div
				style={{
					position: "relative",
					zIndex: 1,
					padding: "0 32px 72px",
					maxWidth: 700,
					width: "100%",
				}}
			>
				<div
					style={{
						fontSize: 10,
						letterSpacing: "0.4em",
						textTransform: "uppercase",
						color: "#f59e0b",
						marginBottom: 16,
					}}
				>
					Bar &amp; Pool · Olivos, Buenos Aires
				</div>
				<h1
					style={{
						fontSize: "clamp(56px, 15vw, 120px)",
						fontWeight: 900,
						letterSpacing: "0.12em",
						lineHeight: 0.92,
						color: "#f0f0f0",
						fontFamily: "'Segoe UI', system-ui, sans-serif",
						margin: "0 0 20px",
					}}
				>
					MY WAY
				</h1>
				<p
					style={{
						fontSize: 14,
						color: "#888",
						marginBottom: 36,
						letterSpacing: "0.15em",
						textTransform: "uppercase",
					}}
				>
					Comida · Tragos · Pool
				</p>
				<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
					<a
						href="#menu"
						style={{
							padding: "14px 32px",
							borderRadius: 10,
							background: "#f59e0b",
							color: "#080808",
							fontWeight: 700,
							fontSize: 11,
							letterSpacing: "0.1em",
							textTransform: "uppercase",
							textDecoration: "none",
							display: "inline-flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
						>
							<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
						</svg>
						Ver menú
					</a>
					<Link
						href="/delivery"
						style={{
							padding: "13px 32px",
							borderRadius: 10,
							background: "transparent",
							border: "1px solid rgba(245,158,11,0.45)",
							color: "#f59e0b",
							fontWeight: 700,
							fontSize: 11,
							letterSpacing: "0.1em",
							textTransform: "uppercase",
							textDecoration: "none",
							display: "inline-flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M5 12h14M12 5l7 7-7 7" />
						</svg>
						Pedir delivery
					</Link>
				</div>
			</div>
		</section>
	);
}

// ── useScrollFadeIn ────────────────────────────────────────────────────────────
// Reusable hook: returns a ref + visible state. Once the element scrolls into
// view (10% threshold) it fires once and the observer disconnects.

function useScrollFadeIn() {
	const ref = useRef<HTMLElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const obs = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					obs.disconnect();
				}
			},
			{ threshold: 0.1 },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	return { ref, visible };
}

// ── Gallery ───────────────────────────────────────────────────────────────────

function Gallery() {
	const { ref, visible } = useScrollFadeIn();
	const [activePhoto, setActivePhoto] = useState(0);
	const [hoveredPhoto, setHoveredPhoto] = useState<number | null>(null);

	const photos = [
		{ src: "/media/cheers.jpg", alt: "Brindis" },
		{ src: "/media/drinks-hero.jpg", alt: "Cócteles" },
		{ src: "/media/pool-ambiente.jpg", alt: "Ambiente pool" },
		{ src: "/media/combo-wrap-mojito.jpg", alt: "Wrap y mojito" },
		{ src: "/media/beer-sticks.jpg", alt: "Birra y picada" },
		{ src: "/media/wrap-hands.jpg", alt: "Wrap" },
	];

	// Auto-cycle: every 3.5 s advance to the next featured photo
	useEffect(() => {
		const id = setInterval(() => {
			setActivePhoto((prev) => (prev + 1) % photos.length);
		}, 3500);
		return () => clearInterval(id);
	}, [photos.length]);

	return (
		<section
			ref={ref as React.RefObject<HTMLElement>}
			style={{
				padding: "80px 24px",
				maxWidth: 1100,
				margin: "0 auto",
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(24px)",
				transition: "opacity 0.6s ease, transform 0.6s ease",
			}}
		>
			{/* Animation CSS */}
			<style>{`
				.gallery-photo {
					transition: transform 0.4s ease;
				}
				.gallery-photo:hover {
					transform: scale(1.04) !important;
				}
			`}</style>

			<div style={{ marginBottom: 40 }}>
				<p
					style={{
						fontSize: 9,
						letterSpacing: "0.35em",
						textTransform: "uppercase",
						color: "#f59e0b",
						marginBottom: 8,
					}}
				>
					Ambiente
				</p>
				<h2
					style={{
						fontSize: "clamp(28px, 5vw, 48px)",
						fontWeight: 800,
						color: "#f0f0f0",
						lineHeight: 1.1,
					}}
				>
					Viví la experiencia
				</h2>
			</div>

			{/* Featured cycling photo */}
			<div
				style={{
					position: "relative",
					borderRadius: 20,
					overflow: "hidden",
					aspectRatio: "21/9",
					marginBottom: 12,
				}}
			>
				{photos.map((photo, i) => (
					<div
						key={photo.src}
						style={{
							position: "absolute",
							inset: 0,
							opacity: i === activePhoto ? 1 : 0,
							transition: "opacity 0.9s ease",
						}}
					>
						<Image
							src={photo.src}
							alt={photo.alt}
							fill
							style={{ objectFit: "cover" }}
						/>
					</div>
				))}
				{/* Dot indicators */}
				<div
					style={{
						position: "absolute",
						bottom: 14,
						left: "50%",
						transform: "translateX(-50%)",
						display: "flex",
						gap: 6,
						zIndex: 2,
					}}
				>
					{photos.map((_, i) => (
						<button
							key={i}
							onClick={() => setActivePhoto(i)}
							aria-label={`Foto ${i + 1}`}
							style={{
								width: i === activePhoto ? 18 : 6,
								height: 6,
								borderRadius: 99,
								border: "none",
								background:
									i === activePhoto ? "#f59e0b" : "rgba(255,255,255,0.35)",
								cursor: "pointer",
								padding: 0,
								transition: "width 0.3s ease, background 0.3s ease",
							}}
						/>
					))}
				</div>
			</div>

			{/* Grid of thumbnails */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
					gap: 12,
				}}
			>
				{photos.map((photo, i) => (
					<div
						key={photo.src}
						className="gallery-photo"
						onMouseEnter={() => setHoveredPhoto(i)}
						onMouseLeave={() => setHoveredPhoto(null)}
						style={{
							borderRadius: 16,
							overflow: "hidden",
							aspectRatio: i === 0 || i === 3 ? "16/10" : "4/3",
							position: "relative",
							cursor: "pointer",
							opacity: visible ? 1 : 0,
							transform: visible
								? hoveredPhoto === i
									? "scale(1.04)"
									: "translateY(0)"
								: "translateY(20px)",
							transition:
								hoveredPhoto === i
									? "opacity 0.55s, transform 0.4s ease"
									: `opacity 0.55s ${i * 0.08}s, transform 0.55s ${i * 0.08}s`,
							outline: activePhoto === i ? "2px solid #f59e0b" : "none",
							outlineOffset: 2,
						}}
						onClick={() => setActivePhoto(i)}
					>
						<Image
							src={photo.src}
							alt={photo.alt}
							fill
							style={{ objectFit: "cover" }}
						/>
					</div>
				))}
			</div>
		</section>
	);
}

// ── Menu Section ──────────────────────────────────────────────────────────────

function MenuSection() {
	const { ref: sectionRef, visible: sectionVisible } = useScrollFadeIn();
	const [categories, setCategories] = useState<Category[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [active, setActive] = useState("all");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			fetch("/api/categories").then((r) => r.json()),
			fetch("/api/products?available=true").then((r) => r.json()),
		])
			.then(([cats, prods]) => {
				setCategories(
					(Array.isArray(cats) ? cats : []).sort(
						(a: Category, b: Category) => a.order - b.order,
					),
				);
				setProducts(Array.isArray(prods) ? prods : []);
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	// Group products by category, respecting category order
	const grouped = categories
		.map((cat) => ({
			category: cat,
			items: products.filter((p) => p.categoryId === cat.id && p.isAvailable),
		}))
		.filter((g) => g.items.length > 0);

	const filtered =
		active === "all"
			? grouped
			: grouped.filter((g) => g.category.id === active);

	return (
		<section
			ref={sectionRef as React.RefObject<HTMLElement>}
			id="menu"
			style={{
				padding: "80px 24px",
				maxWidth: 860,
				margin: "0 auto",
				opacity: sectionVisible ? 1 : 0,
				transform: sectionVisible ? "translateY(0)" : "translateY(24px)",
				transition: "opacity 0.6s ease, transform 0.6s ease",
			}}
		>
			<div style={{ marginBottom: 32 }}>
				<p
					style={{
						fontSize: 9,
						letterSpacing: "0.35em",
						textTransform: "uppercase",
						color: "#f59e0b",
						marginBottom: 8,
					}}
				>
					Carta
				</p>
				<h2
					style={{
						fontSize: "clamp(28px, 5vw, 48px)",
						fontWeight: 800,
						color: "#f0f0f0",
						lineHeight: 1.1,
						marginBottom: 8,
					}}
				>
					Menú
				</h2>
				<p style={{ fontSize: 13, color: "#555" }}>
					Pedí en la mesa o llevátelo a casa
				</p>
			</div>

			{/* Category pills */}
			<div
				style={{
					display: "flex",
					gap: 8,
					overflowX: "auto",
					paddingBottom: 8,
					marginBottom: 24,
				}}
			>
				{[{ id: "all", name: "Todos", icon: "" }, ...categories].map((cat) => {
					const isActive = active === cat.id;
					return (
						<button
							key={cat.id}
							onClick={() => setActive(cat.id)}
							style={{
								flexShrink: 0,
								padding: "7px 18px",
								borderRadius: 99,
								border: `1px solid ${isActive ? "#f59e0b" : "#1e1e1e"}`,
								background: isActive ? "#f59e0b" : "#0e0e0e",
								color: isActive ? "#080808" : "#777",
								fontSize: 11,
								fontWeight: 700,
								cursor: "pointer",
								letterSpacing: "0.05em",
								transition: "all 0.15s",
							}}
						>
							{cat.icon ? `${cat.icon} ` : ""}
							{cat.name}
						</button>
					);
				})}
			</div>

			{loading ? (
				<div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
					<div
						style={{
							width: 32,
							height: 32,
							borderRadius: "50%",
							border: "2px solid #f59e0b",
							borderTopColor: "transparent",
							animation: "spin 0.8s linear infinite",
						}}
					/>
					<style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
				</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
					{filtered.length === 0 ? (
						<div
							style={{
								padding: "48px 20px",
								textAlign: "center",
								color: "#444",
								fontSize: 14,
								background: "#0a0a0a",
								border: "1px solid #1a1a1a",
								borderRadius: 20,
							}}
						>
							No hay productos en esta categoría
						</div>
					) : (
						filtered.map(({ category, items }) => (
							<div key={category.id}>
								{/* Section header */}
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
										marginBottom: 12,
									}}
								>
									<span style={{ fontSize: 20 }}>{category.icon}</span>
									<span
										style={{
											fontSize: 11,
											fontWeight: 800,
											letterSpacing: "0.15em",
											textTransform: "uppercase",
											color: "#888",
										}}
									>
										{category.name}
									</span>
									<span style={{ fontSize: 10, color: "#333" }}>
										({items.length})
									</span>
								</div>
								{/* Products */}
								<div
									style={{
										background: "#0a0a0a",
										border: "1px solid #1a1a1a",
										borderRadius: 20,
										overflow: "hidden",
									}}
								>
									{items.map((product, i) => (
										<div
											key={product.id}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												gap: 16,
												padding: "16px 24px",
												borderTop: i > 0 ? "1px solid #141414" : "none",
												transition: "background 0.15s",
											}}
										>
											<div style={{ flex: 1, minWidth: 0 }}>
												<p
													style={{
														fontSize: 14,
														fontWeight: 700,
														margin: 0,
													}}
												>
													{product.name}
												</p>
												{product.description && (
													<p
														style={{
															fontSize: 12,
															color: "#555",
															margin: "4px 0 0",
														}}
													>
														{product.description}
													</p>
												)}
											</div>
											<span
												style={{
													fontSize: 16,
													fontWeight: 700,
													color: "#f59e0b",
													flexShrink: 0,
												}}
											>
												{formatCurrency(product.price)}
											</span>
										</div>
									))}
								</div>
							</div>
						))
					)}
				</div>
			)}

			<div style={{ textAlign: "center", marginTop: 36 }}>
				<Link
					href="/delivery"
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 8,
						padding: "14px 36px",
						borderRadius: 12,
						background: "#f59e0b",
						color: "#080808",
						fontWeight: 700,
						fontSize: 12,
						letterSpacing: "0.1em",
						textTransform: "uppercase",
						textDecoration: "none",
					}}
				>
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M5 12h14M12 5l7 7-7 7" />
					</svg>
					Pedir delivery
				</Link>
			</div>
		</section>
	);
}

// ── Delivery CTA ──────────────────────────────────────────────────────────────

function DeliveryCTA() {
	const { ref, visible } = useScrollFadeIn();
	return (
		<section
			ref={ref as React.RefObject<HTMLElement>}
			style={{
				padding: "0 24px 80px",
				maxWidth: 1100,
				margin: "0 auto",
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(24px)",
				transition: "opacity 0.6s ease, transform 0.6s ease",
			}}
		>
			<div
				style={{
					position: "relative",
					borderRadius: 24,
					overflow: "hidden",
					minHeight: 240,
					display: "flex",
					alignItems: "center",
					padding: "48px 52px",
				}}
			>
				<Image
					src="/media/burger-hands.jpg"
					alt="Delivery My Way"
					fill
					style={{ objectFit: "cover", objectPosition: "center" }}
				/>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background:
							"linear-gradient(90deg, rgba(8,8,8,0.93) 45%, rgba(8,8,8,0.45) 100%)",
					}}
				/>
				<div style={{ position: "relative", zIndex: 1 }}>
					<p
						style={{
							fontSize: 9,
							letterSpacing: "0.35em",
							textTransform: "uppercase",
							color: "#f59e0b",
							marginBottom: 10,
						}}
					>
						Delivery
					</p>
					<h2
						style={{
							fontSize: "clamp(24px, 5vw, 44px)",
							fontWeight: 800,
							color: "#f0f0f0",
							margin: "0 0 10px",
							lineHeight: 1.1,
						}}
					>
						Tu pedido, en tu puerta
					</h2>
					<p
						style={{
							fontSize: 13,
							color: "#777",
							marginBottom: 28,
						}}
					>
						Zona Olivos · GBA Norte
					</p>
					<Link
						href="/delivery"
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 8,
							padding: "13px 30px",
							borderRadius: 10,
							background: "#f59e0b",
							color: "#080808",
							fontWeight: 700,
							fontSize: 11,
							letterSpacing: "0.1em",
							textTransform: "uppercase",
							textDecoration: "none",
						}}
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M5 12h14M12 5l7 7-7 7" />
						</svg>
						Pedir ahora
					</Link>
				</div>
			</div>
		</section>
	);
}

// ── Tracking Widget ───────────────────────────────────────────────────────────

function TrackingWidget() {
	const { ref, visible } = useScrollFadeIn();
	const [code, setCode] = useState("");

	const handleTrack = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (code.trim()) window.location.href = `/track/${code.trim()}`;
	};

	return (
		<section
			ref={ref as React.RefObject<HTMLElement>}
			style={{
				padding: "0 24px 80px",
				maxWidth: 560,
				margin: "0 auto",
				textAlign: "center",
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(24px)",
				transition: "opacity 0.6s ease, transform 0.6s ease",
			}}
		>
			<p
				style={{
					fontSize: 9,
					letterSpacing: "0.35em",
					textTransform: "uppercase",
					color: "#f59e0b",
					marginBottom: 8,
				}}
			>
				Seguimiento
			</p>
			<h2
				style={{
					fontSize: "clamp(22px, 4vw, 36px)",
					fontWeight: 800,
					color: "#f0f0f0",
					marginBottom: 8,
					lineHeight: 1.1,
				}}
			>
				¿Dónde está tu pedido?
			</h2>
			<p style={{ fontSize: 13, color: "#555", marginBottom: 28 }}>
				Ingresá tu código para seguirlo en tiempo real
			</p>
			<form onSubmit={handleTrack} style={{ display: "flex", gap: 10 }}>
				<input
					type="text"
					placeholder="Código de pedido"
					value={code}
					onChange={(e) => setCode(e.target.value)}
					style={{
						flex: 1,
						background: "#0e0e0e",
						border: "1px solid #1e1e1e",
						borderRadius: 10,
						color: "#f0f0f0",
						padding: "13px 16px",
						fontSize: 14,
						outline: "none",
					}}
				/>
				<button
					type="submit"
					style={{
						padding: "13px 24px",
						borderRadius: 10,
						background: code.trim() ? "#f59e0b" : "#1a1a1a",
						color: code.trim() ? "#080808" : "#555",
						fontWeight: 700,
						fontSize: 11,
						letterSpacing: "0.1em",
						textTransform: "uppercase",
						border: "none",
						cursor: code.trim() ? "pointer" : "not-allowed",
						transition: "all 0.15s",
					}}
				>
					Rastrear
				</button>
			</form>
		</section>
	);
}

// ── Info ──────────────────────────────────────────────────────────────────────

function Info() {
	const { ref, visible } = useScrollFadeIn();
	return (
		<section
			ref={ref as React.RefObject<HTMLElement>}
			style={{
				padding: "0 24px 80px",
				maxWidth: 900,
				margin: "0 auto",
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(24px)",
				transition: "opacity 0.6s ease, transform 0.6s ease",
			}}
		>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
					gap: 16,
				}}
			>
				{/* Hours */}
				<div
					style={{
						background: "#0a0a0a",
						border: "1px solid #1a1a1a",
						borderRadius: 20,
						padding: "28px 32px",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							marginBottom: 20,
						}}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#f59e0b"
							strokeWidth="2"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M12 6v6l4 2" />
						</svg>
						<span
							style={{
								fontSize: 9,
								letterSpacing: "0.25em",
								textTransform: "uppercase",
								color: "#555",
							}}
						>
							Horarios
						</span>
					</div>
					<p
						style={{
							fontSize: 16,
							fontWeight: 700,
							color: "#f0f0f0",
							marginBottom: 6,
						}}
					>
						Martes — Domingo
					</p>
					<p
						style={{
							fontSize: 22,
							fontWeight: 800,
							color: "#f59e0b",
							lineHeight: 1,
						}}
					>
						19:00 – 03:00
					</p>
				</div>

				{/* Location */}
				<div
					style={{
						background: "#0a0a0a",
						border: "1px solid #1a1a1a",
						borderRadius: 20,
						padding: "28px 32px",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							marginBottom: 20,
						}}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#f59e0b"
							strokeWidth="2"
						>
							<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
							<circle cx="12" cy="10" r="3" />
						</svg>
						<span
							style={{
								fontSize: 9,
								letterSpacing: "0.25em",
								textTransform: "uppercase",
								color: "#555",
							}}
						>
							Ubicación
						</span>
					</div>
					<p
						style={{
							fontSize: 16,
							fontWeight: 700,
							color: "#f0f0f0",
							marginBottom: 6,
						}}
					>
						Olivos
					</p>
					<p style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
						Buenos Aires, Argentina
					</p>
					<a
						href="https://www.instagram.com/mywayolivos"
						target="_blank"
						rel="noopener noreferrer"
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
							fontSize: 12,
							color: "#f59e0b",
							textDecoration: "none",
						}}
					>
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
							<circle cx="12" cy="12" r="4" />
							<circle
								cx="17.5"
								cy="6.5"
								r="1"
								fill="currentColor"
								stroke="none"
							/>
						</svg>
						@mywayolivos
					</a>
				</div>
			</div>
		</section>
	);
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
	return (
		<footer
			style={{
				borderTop: "1px solid #141414",
				padding: "36px 24px 44px",
				textAlign: "center",
			}}
		>
			<div
				style={{
					fontSize: 24,
					fontWeight: 900,
					letterSpacing: "0.22em",
					color: "#f0f0f0",
					marginBottom: 20,
				}}
			>
				MY WAY
			</div>
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					gap: 28,
					flexWrap: "wrap",
					marginBottom: 24,
				}}
			>
				{[
					{ label: "Menú", href: "#menu", external: false },
					{ label: "Delivery", href: "/delivery", external: false },
					{
						label: "Instagram",
						href: "https://www.instagram.com/mywayolivos",
						external: true,
					},
				].map((link) => (
					<a
						key={link.label}
						href={link.href}
						target={link.external ? "_blank" : undefined}
						rel={link.external ? "noopener noreferrer" : undefined}
						style={{
							fontSize: 10,
							color: "#444",
							textDecoration: "none",
							letterSpacing: "0.15em",
							textTransform: "uppercase",
						}}
					>
						{link.label}
					</a>
				))}
			</div>
			<p style={{ fontSize: 11, color: "#2a2a2a" }}>
				© {new Date().getFullYear()} My Way · Bar &amp; Pool · Olivos, Buenos
				Aires
			</p>
		</footer>
	);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
	const [showIntro, setShowIntro] = useState(false);

	useEffect(() => {
		const seen = sessionStorage.getItem("intro_seen");
		if (!seen) {
			setShowIntro(true);
		}
	}, []);

	const handleIntroDone = useCallback(() => {
		sessionStorage.setItem("intro_seen", "1");
		setShowIntro(false);
	}, []);

	return (
		<div style={{ background: "#080808", minHeight: "100vh" }}>
			{showIntro && <IntroLoader onDone={handleIntroDone} />}
			<Navbar />
			<Hero />
			<Gallery />
			<MenuSection />
			<DeliveryCTA />
			<TrackingWidget />
			<Info />
			<Footer />
		</div>
	);
}
