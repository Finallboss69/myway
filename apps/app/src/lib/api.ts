export async function apiFetch<T>(
	url: string,
	options?: RequestInit,
): Promise<T> {
	const res = await fetch(url, {
		...options,
		headers: { "Content-Type": "application/json", ...options?.headers },
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: "Network error" }));
		throw new Error(err.error ?? "Request failed");
	}
	return res.json();
}
