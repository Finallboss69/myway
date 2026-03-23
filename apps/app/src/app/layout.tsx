import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, Bebas_Neue, DM_Mono } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const syne = Syne({
	subsets: ["latin"],
	variable: "--font-syne",
	display: "swap",
	weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-dm-sans",
	display: "swap",
	weight: ["300", "400", "500", "600"],
});

const bebasNeue = Bebas_Neue({
	subsets: ["latin"],
	variable: "--font-bebas",
	display: "swap",
	weight: "400",
});

const dmMono = DM_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
	display: "swap",
	weight: ["400", "500"],
});

export const viewport: Viewport = {
	themeColor: "#f59e0b",
};

export const metadata: Metadata = {
	title: "My Way — Sistema de Bar & Pool",
	description: "Sistema de gestión para bar & pool",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "My Way",
	},
	icons: {
		apple: "/icons/icon-192.png",
		icon: "/icons/icon-192.png",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="es"
			className={`${syne.variable} ${dmSans.variable} ${bebasNeue.variable} ${dmMono.variable}`}
		>
			<body className="bg-surface-0 text-ink-primary antialiased">
				<SessionProvider>{children}</SessionProvider>
			</body>
		</html>
	);
}
