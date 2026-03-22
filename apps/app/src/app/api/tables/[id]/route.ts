import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = (await request.json()) as { status: string };
		const { status } = body;

		if (!status) {
			return NextResponse.json(
				{ error: "status is required" },
				{ status: 400 },
			);
		}

		const table = await db.table.update({
			where: { id },
			data: { status },
		});
		return NextResponse.json(table);
	} catch (error) {
		console.error("[tables/[id] PATCH]", error);
		return NextResponse.json(
			{ error: "Failed to update table" },
			{ status: 500 },
		);
	}
}
