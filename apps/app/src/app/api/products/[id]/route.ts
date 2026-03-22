import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const product = await db.product.findUnique({
			where: { id },
			include: { category: true },
		});
		if (!product)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(product);
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await req.json();
		const product = await db.product.update({ where: { id }, data: body });
		return NextResponse.json(product);
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		await db.product.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
