export const formatCurrency = (n: number) =>
	new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: "ARS",
		minimumFractionDigits: 0,
	}).format(n);

export const formatTime = (date: Date | string) => {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
};

export const elapsedMinutes = (date: Date | string) => {
	const d = typeof date === "string" ? new Date(date) : date;
	return Math.floor((Date.now() - d.getTime()) / 60000);
};
