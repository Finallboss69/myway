import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const invoice = await db.invoice.findUnique({
			where: { id },
			include: { items: true },
		});
		if (!invoice)
			return NextResponse.json({ error: "not found" }, { status: 404 });
		return NextResponse.json(invoice);
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await req.json();
		const invoice = await db.invoice.update({
			where: { id },
			data: body,
			include: { items: true },
		});
		return NextResponse.json(invoice);
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
