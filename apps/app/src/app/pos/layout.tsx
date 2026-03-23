"use client";

import PinGate from "@/components/PinGate";

export default function POSLayout({ children }: { children: React.ReactNode }) {
	return (
		<PinGate storageKey="pos-staff" subtitle="Sistema POS — Caja">
			{children}
		</PinGate>
	);
}
