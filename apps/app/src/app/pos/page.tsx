"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function POSLoginPage() {
	const router = useRouter();

	useEffect(() => {
		// PinGate in layout handles auth — go straight to salon
		router.replace("/pos/salon");
	}, [router]);

	return null;
}
