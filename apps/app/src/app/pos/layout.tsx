"use client";

import PinGate from "@/components/PinGate";

const POS_ROLES: string[] = ["admin", "manager", "cashier"];

export default function POSLayout({ children }: { children: React.ReactNode }) {
	return (
		<PinGate
			storageKey="pos-staff"
			subtitle="Sistema POS — Caja"
			allowedRoles={POS_ROLES}
		>
			{children}
		</PinGate>
	);
}
