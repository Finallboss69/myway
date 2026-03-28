import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clearMpSettingsCache } from "@/lib/mercadopago";
import { requireStaffRole } from "@/lib/auth-check";

const ALLOWED_KEYS = [
	"mp_access_token",
	"mp_user_id",
	"mp_external_pos_id",
	"mp_device_id",
	"mp_webhook_secret",
	"transfer_alias",
] as const;

const SECRET_KEYS = new Set(["mp_access_token", "mp_webhook_secret"]);

const ADMIN_ROLES = ["admin", "manager"];

export async function GET(request: NextRequest) {
	const auth = await requireStaffRole(request, ADMIN_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const settings = await db.setting.findMany({
			where: { key: { in: [...ALLOWED_KEYS] } },
		});
		// Mask secret values for security
		const result = settings.map((s) => ({
			key: s.key,
			value:
				SECRET_KEYS.has(s.key) && s.value.length > 8
					? s.value.slice(0, 4) + "****" + s.value.slice(-4)
					: s.value,
			updatedAt: s.updatedAt,
		}));
		return NextResponse.json(result);
	} catch (error) {
		console.error("[settings GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch settings" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: NextRequest) {
	const auth = await requireStaffRole(request, ADMIN_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const body = (await request.json()) as { key: string; value: string };
		const { key, value } = body;

		if (!key || typeof value !== "string") {
			return NextResponse.json(
				{ error: "key and value required" },
				{ status: 400 },
			);
		}

		if (!ALLOWED_KEYS.includes(key as (typeof ALLOWED_KEYS)[number])) {
			return NextResponse.json(
				{ error: "Invalid setting key" },
				{ status: 400 },
			);
		}

		const setting = await db.setting.upsert({
			where: { key },
			update: { value },
			create: { key, value },
		});

		// Clear cached MP settings when credentials change
		if (key.startsWith("mp_")) clearMpSettingsCache();

		return NextResponse.json({
			key: setting.key,
			value:
				SECRET_KEYS.has(key) && setting.value.length > 8
					? setting.value.slice(0, 4) + "****" + setting.value.slice(-4)
					: setting.value,
		});
	} catch (error) {
		console.error("[settings PUT]", error);
		return NextResponse.json(
			{ error: "Failed to update setting" },
			{ status: 500 },
		);
	}
}
