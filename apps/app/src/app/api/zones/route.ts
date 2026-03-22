import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as { name: string; order?: number };
		const { name, order } = body;

		if (!name?.trim()) {
			return NextResponse.json({ error: "name is required" }, { status: 400 });
		}

		// Get max order to append at the end
		const lastZone = await db.zone.findFirst({ orderBy: { order: "desc" } });
		const nextOrder = order ?? (lastZone ? lastZone.order + 1 : 1);

		const zone = await db.zone.create({
			data: { name: name.trim(), order: nextOrder },
		});
		return NextResponse.json(zone, { status: 201 });
	} catch (error) {
		console.error("[zones POST]", error);
		return NextResponse.json(
			{ error: "Failed to create zone" },
			{ status: 500 },
		);
	}
}
