/**
 * Read the staff PIN from localStorage for admin API auth headers.
 * Used by admin pages to add `x-staff-pin` to mutating requests.
 */
export function getAdminPin(): string {
	try {
		const raw = localStorage.getItem("myway-admin-staff");
		if (!raw) return "";
		return JSON.parse(raw)?.pin ?? "";
	} catch {
		return "";
	}
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
