import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const supplier = await db.supplier.findUnique({
			where: { id },
			include: {
				invoices: { orderBy: { date: "desc" } },
				expenses: { orderBy: { date: "desc" } },
			},
		});
		if (!supplier)
			return NextResponse.json({ error: "not found" }, { status: 404 });
		return NextResponse.json(supplier);
	} catch (e) {
		console.error("[suppliers/[id] GET]", e);
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
		const allowed = [
			"name",
			"cuit",
			"address",
			"phone",
			"email",
			"notes",
			"categoryId",
		] as const;
		const data: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) data[key] = body[key];
		}
		const supplier = await db.supplier.update({ where: { id }, data });
		return NextResponse.json(supplier);
	} catch (e) {
		console.error("[suppliers/[id] PATCH]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		await db.supplier.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error("[suppliers/[id] DELETE]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
