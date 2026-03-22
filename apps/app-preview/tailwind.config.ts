import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				brand: {
					50: "#fffbeb",
					100: "#fef3c7",
					300: "#fcd34d",
					400: "#fbbf24",
					500: "#f59e0b",
					600: "#d97706",
					700: "#b45309",
					900: "#78350f",
				},
				surface: {
					0: "#080808",
					1: "#101010",
					2: "#161616",
					3: "#1e1e1e",
					4: "#282828",
					5: "#333333",
				},
				ink: {
					primary: "#f5f5f5",
					secondary: "#a3a3a3",
					tertiary: "#6b6b6b",
					disabled: "#404040",
				},
				pool: {
					400: "#34d399",
					500: "#10b981",
					600: "#059669",
				},
				status: {
					available: "#10b981",
					occupied: "#f59e0b",
					reserved: "#8b5cf6",
					pending: "#f59e0b",
					preparing: "#3b82f6",
					ready: "#10b981",
					delivered: "#6b7280",
					cancelled: "#ef4444",
				},
			},
			fontFamily: {
				display: ["var(--font-syne)", "sans-serif"],
				body: ["var(--font-dm-sans)", "sans-serif"],
				mono: ["var(--font-geist-mono)", "monospace"],
				kds: ["var(--font-bebas)", "sans-serif"],
			},
			backgroundImage: {
				noise:
					"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E\")",
				"gold-glow":
					"radial-gradient(ellipse at center, rgba(245,158,11,0.12) 0%, transparent 70%)",
				"green-glow":
					"radial-gradient(ellipse at center, rgba(16,185,129,0.1) 0%, transparent 70%)",
				"surface-gradient": "linear-gradient(180deg, #101010 0%, #080808 100%)",
			},
			boxShadow: {
				"gold-sm": "0 0 12px rgba(245,158,11,0.25)",
				"gold-md": "0 0 24px rgba(245,158,11,0.20)",
				"gold-lg": "0 0 48px rgba(245,158,11,0.15)",
				"green-sm": "0 0 12px rgba(16,185,129,0.25)",
				"green-md": "0 0 24px rgba(16,185,129,0.20)",
				card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.45)",
				"inset-top": "inset 0 1px 0 rgba(255,255,255,0.06)",
			},
			animation: {
				"pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
				"fade-in": "fadeIn 0.3s ease-out",
				"slide-up": "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)",
				"slide-down": "slideDown 0.3s cubic-bezier(0.16,1,0.3,1)",
				"scale-in": "scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)",
				"slide-in-right": "slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)",
				"pulse-glow": "pulseGlow 2s ease-in-out infinite",
			},
			keyframes: {
				fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
				slideUp: {
					from: { opacity: "0", transform: "translateY(16px)" },
					to: { opacity: "1", transform: "translateY(0)" },
				},
				slideDown: {
					from: { opacity: "0", transform: "translateY(-8px)" },
					to: { opacity: "1", transform: "translateY(0)" },
				},
				scaleIn: {
					from: { opacity: "0", transform: "scale(0.95)" },
					to: { opacity: "1", transform: "scale(1)" },
				},
				slideInRight: {
					from: { opacity: "0", transform: "translateX(24px)" },
					to: { opacity: "1", transform: "translateX(0)" },
				},
				pulseGlow: {
					"0%, 100%": { boxShadow: "0 0 0 0 rgba(245,158,11,0.4)" },
					"50%": { boxShadow: "0 0 0 8px rgba(245,158,11,0)" },
				},
			},
		},
	},
	plugins: [],
};

export default config;
