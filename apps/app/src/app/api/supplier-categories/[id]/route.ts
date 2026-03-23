import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await req.json();
		const allowed = ["name", "icon", "order"] as const;
		const data: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) data[key] = body[key];
		}
		const category = await db.supplierCategory.update({
			where: { id },
			data,
		});
		return NextResponse.json(category);
	} catch (e) {
		console.error("[supplier-categories/[id] PUT]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		await db.supplierCategory.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error("[supplier-categories/[id] DELETE]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}
