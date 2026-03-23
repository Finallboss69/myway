import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await req.json();
		const allowed = [
			"name",
			"icon",
			"order",
			"parentId",
			"budgetMonthly",
		] as const;
		const data: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) data[key] = body[key];
		}
		const cat = await db.expenseCategory.update({ where: { id }, data });
		return NextResponse.json(cat);
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		await db.expenseCategory.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
