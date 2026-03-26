"use client";

import PinGate from "@/components/PinGate";

export default function WaiterLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<PinGate
			storageKey="myway-waiter-staff"
			subtitle="Sistema de Mozos"
			allowedRoles={["admin", "manager", "waiter"]}
		>
			{children}
		</PinGate>
	);
}
