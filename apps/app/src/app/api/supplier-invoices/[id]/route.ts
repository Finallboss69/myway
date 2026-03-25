import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const existing = await db.supplierInvoice.findUnique({ where: { id } });
		if (!existing)
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
		const body = await req.json();
		const { items, ...data } = body;
		if (data.date) data.date = new Date(data.date);
		if (data.dueDate) data.dueDate = new Date(data.dueDate);
		if (data.paidAt) data.paidAt = new Date(data.paidAt);

		const invoice = await db.supplierInvoice.update({
			where: { id },
			data,
			include: { items: true, supplier: true },
		});
		return NextResponse.json(invoice);
	} catch (e) {
		console.error("[supplier-invoices/[id] PATCH]", e);
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
		const existing = await db.supplierInvoice.findUnique({ where: { id } });
		if (!existing)
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
		await db.supplierInvoice.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error("[supplier-invoices/[id] DELETE]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
