"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
	return (
		<div
			style={{
				minHeight: "100vh",
				background: "#080808",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				fontFamily: '"DM Sans", system-ui, sans-serif',
				padding: "24px",
			}}
		>
			{/* Card */}
			<div
				style={{
					width: "100%",
					maxWidth: 420,
					background: "#101010",
					border: "1px solid #1e1e1e",
					borderRadius: 24,
					padding: "48px 32px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 32,
				}}
			>
				{/* Logo / Title */}
				<div style={{ textAlign: "center" }}>
					<h1
						style={{
							fontSize: 42,
							fontWeight: 800,
							color: "#f59e0b",
							margin: 0,
							letterSpacing: "-0.03em",
							fontFamily: '"Bebas Neue", var(--font-bebas), sans-serif',
						}}
					>
						MY WAY
					</h1>
					<p
						style={{
							fontSize: 13,
							color: "#555",
							marginTop: 4,
							letterSpacing: "0.15em",
							textTransform: "uppercase",
						}}
					>
						Bar & Pool · Olivos
					</p>
				</div>

				{/* Divider */}
				<div
					style={{
						width: "100%",
						height: 1,
						background:
							"linear-gradient(90deg, transparent, #1e1e1e, transparent)",
					}}
				/>

				{/* Message */}
				<div style={{ textAlign: "center" }}>
					<p
						style={{
							fontSize: 16,
							fontWeight: 600,
							color: "#f5f5f5",
							margin: 0,
						}}
					>
						Iniciá sesión para pedir
					</p>
					<p
						style={{
							fontSize: 13,
							color: "#666",
							marginTop: 8,
							lineHeight: 1.5,
						}}
					>
						Necesitás una cuenta para realizar pedidos
					</p>
				</div>

				{/* Google Sign In Button */}
				<button
					onClick={() => signIn("google", { callbackUrl: "/delivery" })}
					style={{
						width: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 12,
						padding: "14px 24px",
						borderRadius: 12,
						border: "1px solid #333",
						background: "#ffffff",
						color: "#1f1f1f",
						fontSize: 15,
						fontWeight: 600,
						cursor: "pointer",
						transition: "box-shadow 0.2s, transform 0.1s",
						fontFamily: '"DM Sans", system-ui, sans-serif',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.boxShadow =
							"0 2px 16px rgba(255,255,255,0.08)";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.boxShadow = "none";
					}}
				>
					{/* Google "G" icon */}
					<svg
						width="20"
						height="20"
						viewBox="0 0 48 48"
						style={{ flexShrink: 0 }}
					>
						<path
							fill="#EA4335"
							d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
						/>
						<path
							fill="#4285F4"
							d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
						/>
						<path
							fill="#FBBC05"
							d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
						/>
						<path
							fill="#34A853"
							d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
						/>
					</svg>
					Iniciar sesión con Google
				</button>

				{/* Footer note */}
				<p
					style={{
						fontSize: 11,
						color: "#444",
						textAlign: "center",
						lineHeight: 1.5,
						margin: 0,
					}}
				>
					Tu cuenta se usa solo para gestionar tus pedidos.
					<br />
					No compartimos tu información con terceros.
				</p>
			</div>

			{/* Back link */}
			<a
				href="/"
				style={{
					marginTop: 24,
					fontSize: 13,
					color: "#555",
					textDecoration: "none",
				}}
			>
				← Volver al inicio
			</a>
		</div>
	);
}
