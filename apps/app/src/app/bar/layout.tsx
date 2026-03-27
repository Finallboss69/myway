"use client";

import PinGate from "@/components/PinGate";

const BAR_ROLES: string[] = ["admin", "manager", "bar"];

export default function BarLayout({ children }: { children: React.ReactNode }) {
	return (
		<PinGate
			storageKey="myway-bar-staff"
			subtitle="Bar"
			allowedRoles={BAR_ROLES}
		>
			{children}
		</PinGate>
	);
}
