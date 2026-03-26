"use client";

import PinGate from "@/components/PinGate";

export default function BarLayout({ children }: { children: React.ReactNode }) {
	return (
		<PinGate
			storageKey="myway-bar-staff"
			subtitle="Bar"
			allowedRoles={["admin", "manager", "bar"]}
		>
			{children}
		</PinGate>
	);
}
