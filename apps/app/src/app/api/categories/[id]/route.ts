import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const allowed = ["name", "icon", "order", "parentId"] as const;
		const data: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) data[key] = body[key];
		}
		const category = await db.category.update({ where: { id }, data });
		return NextResponse.json(category);
	} catch (error) {
		console.error("[categories/[id] PATCH]", error);
		return NextResponse.json(
			{ error: "Failed to update category" },
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
		await db.category.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[categories/[id] DELETE]", error);
		return NextResponse.json(
			{ error: "Failed to delete category" },
			{ status: 500 },
		);
	}
}
