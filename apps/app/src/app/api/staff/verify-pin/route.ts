import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Rate limiting: track failed attempts per IP
// NOTE: In-memory — resets on cold start. Adequate for single-process/dev.
// For production with multiple serverless instances, replace with Redis/DB.
const attempts = new Map<string, { count: number; lockedAt: number | null }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

function getClientIp(req: Request): string {
	const forwarded = req.headers.get("x-forwarded-for");
	return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: Request) {
	const ip = getClientIp(req);

	// Check rate limit
	const record = attempts.get(ip);
	if (record && record.lockedAt !== null) {
		const elapsed = Date.now() - record.lockedAt;
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
			const prev = attempts.get(ip) ?? { count: 0, lockedAt: null };
			const newCount = prev.count + 1;
			const lockedAt = newCount >= MAX_ATTEMPTS ? Date.now() : null;
			attempts.set(ip, { count: newCount, lockedAt });
			const remaining = MAX_ATTEMPTS - newCount;
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
