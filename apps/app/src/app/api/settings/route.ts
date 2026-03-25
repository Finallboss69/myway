import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clearMpSettingsCache } from "@/lib/mercadopago";

const ALLOWED_KEYS = [
	"mp_access_token",
	"mp_user_id",
	"mp_external_pos_id",
] as const;

export async function GET() {
	try {
		const settings = await db.setting.findMany({
			where: { key: { in: [...ALLOWED_KEYS] } },
		});
		// Mask the access token for security
		const result = settings.map((s) => ({
			key: s.key,
			value:
				s.key === "mp_access_token" && s.value.length > 8
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
				key === "mp_access_token" && setting.value.length > 8
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
