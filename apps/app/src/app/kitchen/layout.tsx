"use client";

import PinGate from "@/components/PinGate";

export default function KitchenLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<PinGate storageKey="myway-kitchen-staff" subtitle="Cocina">
			{children}
		</PinGate>
	);
}
