"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WaiterLoginPage() {
	const router = useRouter();

	useEffect(() => {
		// PinGate in layout handles auth — go straight to tables
		router.replace("/waiter/tables");
	}, [router]);

	return null;
}
