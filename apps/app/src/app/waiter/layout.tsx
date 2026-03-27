"use client";

import PinGate from "@/components/PinGate";

const WAITER_ROLES: string[] = ["admin", "manager", "waiter"];

export default function WaiterLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<PinGate
			storageKey="myway-waiter-staff"
			subtitle="Sistema de Mozos"
			allowedRoles={WAITER_ROLES}
		>
			{children}
		</PinGate>
	);
}
