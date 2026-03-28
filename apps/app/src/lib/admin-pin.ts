/**
 * Read a staff PIN from localStorage by storage key.
 */
function getPin(storageKey: string): string {
	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) return "";
		return JSON.parse(raw)?.pin ?? "";
	} catch {
		return "";
	}
}

/** Admin staff PIN (from "myway-admin-staff" key). */
export function getAdminPin(): string {
	return getPin("myway-admin-staff");
}

/** POS staff PIN (from "pos-staff" key). */
export function getPosPin(): string {
	return getPin("pos-staff");
}

/** Convenience headers object for fetch calls that need staff auth. */
export function staffHeaders(
	extra?: Record<string, string>,
): Record<string, string> {
	return {
		"Content-Type": "application/json",
		"x-staff-pin": getAdminPin(),
		...extra,
	};
}

/** POS-specific headers with PIN from "pos-staff" key. */
export function posHeaders(
	extra?: Record<string, string>,
): Record<string, string> {
	return {
		"Content-Type": "application/json",
		"x-staff-pin": getPosPin(),
		...extra,
	};
}

/** Waiter staff PIN (from "myway-waiter-staff" key). */
export function getWaiterPin(): string {
	return getPin("myway-waiter-staff");
}

/** Waiter-specific headers with PIN from "myway-waiter-staff" key. */
export function waiterHeaders(
	extra?: Record<string, string>,
): Record<string, string> {
	return {
		"Content-Type": "application/json",
		"x-staff-pin": getWaiterPin(),
		...extra,
	};
}
