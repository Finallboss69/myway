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
		console.error("[invoices/[id] GET]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await req.json();
		const allowed = ["status", "cae", "caeExpiry", "afipResponse"] as const;
		const data: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) data[key] = body[key];
		}
		const invoice = await db.invoice.update({
			where: { id },
			data,
			include: { items: true },
		});
		return NextResponse.json(invoice);
	} catch (e) {
		console.error("[invoices/[id] PATCH]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
