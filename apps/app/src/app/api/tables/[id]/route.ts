import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const table = await db.table.findUnique({
			where: { id },
			include: { zone: true },
		});
		if (!table)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(table);
	} catch (error) {
		console.error("[tables/[id] GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch table" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		await db.table.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[tables/[id] DELETE]", error);
		return NextResponse.json(
			{ error: "Failed to delete table" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const allowed = [
			"number",
			"zoneId",
			"type",
			"status",
			"seats",
			"x",
			"y",
			"w",
			"h",
			"shape",
			"rotation",
		] as const;
		const data: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) data[key] = body[key];
		}
		if (Object.keys(data).length === 0) {
			return NextResponse.json(
				{ error: "No valid fields provided" },
				{ status: 400 },
			);
		}

		const table = await db.table.update({
			where: { id },
			data,
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
