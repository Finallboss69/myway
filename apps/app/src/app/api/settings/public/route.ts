import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Public, non-sensitive settings (no auth required). */
const PUBLIC_KEYS = ["transfer_alias"] as const;

export async function GET() {
	try {
		const settings = await db.setting.findMany({
			where: { key: { in: [...PUBLIC_KEYS] } },
		});
		const result = settings.map((s) => ({ key: s.key, value: s.value }));
		return NextResponse.json(result);
	} catch (error) {
		console.error("[settings/public GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch settings" },
			{ status: 500 },
		);
	}
}
