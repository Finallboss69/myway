"use client";

import PinGate from "@/components/PinGate";

const KITCHEN_ROLES: string[] = ["admin", "manager", "kitchen"];

export default function KitchenLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<PinGate
			storageKey="myway-kitchen-staff"
			subtitle="Cocina"
			allowedRoles={KITCHEN_ROLES}
		>
			{children}
		</PinGate>
	);
}
