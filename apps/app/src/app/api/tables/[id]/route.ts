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
