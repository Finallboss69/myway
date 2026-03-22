"use client";
import { useState, useEffect } from "react";

export function useLiveClock() {
	const [mounted, setMounted] = useState(false);
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		setMounted(true);
		setNow(new Date());
		const interval = setInterval(() => setNow(new Date()), 30000);
		return () => clearInterval(interval);
	}, []);

	const time = mounted
		? now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
		: "--:--";

	const date = mounted
		? now.toLocaleDateString("es-AR", {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			})
		: "";

	return { time, date, mounted, now };
}
