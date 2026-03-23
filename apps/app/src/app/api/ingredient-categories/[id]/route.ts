import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const body = await req.json();
	const cat = await db.ingredientCategory.update({ where: { id }, data: body });
	return NextResponse.json(cat);
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	await db.ingredientCategory.delete({ where: { id } });
	return NextResponse.json({ ok: true });
}
