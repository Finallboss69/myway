import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Rate limiting: track failed attempts per IP
const attempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000; // cleanup every 10 min

// Periodically clean old entries
if (typeof globalThis !== "undefined") {
	const cleanup = () => {
		const now = Date.now();
		for (const [key, val] of attempts) {
			if (now - val.lastAttempt > LOCKOUT_MS) attempts.delete(key);
		}
	};
	setInterval(cleanup, CLEANUP_INTERVAL);
}

function getClientIp(req: Request): string {
	const forwarded = req.headers.get("x-forwarded-for");
	return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: Request) {
	const ip = getClientIp(req);

	// Check rate limit
	const record = attempts.get(ip);
	if (record && record.count >= MAX_ATTEMPTS) {
		const elapsed = Date.now() - record.lastAttempt;
		if (elapsed < LOCKOUT_MS) {
			const remaining = Math.ceil((LOCKOUT_MS - elapsed) / 1000);
			return NextResponse.json(
				{ error: `Demasiados intentos. Reintenta en ${remaining}s` },
				{ status: 429 },
			);
		}
		// Lockout expired, reset
		attempts.delete(ip);
	}

	const body = (await req.json()) as { pin?: string };
	const { pin } = body;

	if (!pin || typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
		return NextResponse.json(
			{ error: "PIN debe ser 4-6 dígitos" },
			{ status: 400 },
		);
	}

	try {
		const staff = await db.staff.findFirst({ where: { pin } });
		if (!staff) {
			// Record failed attempt
			const prev = attempts.get(ip) ?? { count: 0, lastAttempt: 0 };
			attempts.set(ip, { count: prev.count + 1, lastAttempt: Date.now() });
			const remaining = MAX_ATTEMPTS - (prev.count + 1);
			const msg =
				remaining > 0
					? `PIN incorrecto. ${remaining} intento${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""}`
					: "PIN incorrecto. Cuenta bloqueada por 5 minutos";
			return NextResponse.json({ error: msg }, { status: 401 });
		}

		// Success — clear attempts for this IP
		attempts.delete(ip);

		return NextResponse.json({
			id: staff.id,
			name: staff.name,
			role: staff.role,
			avatar: staff.avatar,
		});
	} catch (error) {
		console.error("[staff verify-pin]", error);
		return NextResponse.json(
			{ error: "Error al verificar PIN" },
			{ status: 500 },
		);
	}
}
