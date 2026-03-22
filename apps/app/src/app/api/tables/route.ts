import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const tables = await db.table.findMany({
			include: { zone: true },
			orderBy: { number: "asc" },
		});
		return NextResponse.json(tables);
	} catch (error) {
		console.error("[tables GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch tables" },
			{ status: 500 },
		);
	}
}
