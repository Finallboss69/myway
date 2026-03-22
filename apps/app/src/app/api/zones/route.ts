import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const zones = await db.zone.findMany({
			orderBy: { order: "asc" },
		});
		return NextResponse.json(zones);
	} catch (error) {
		console.error("[zones GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch zones" },
			{ status: 500 },
		);
	}
}
