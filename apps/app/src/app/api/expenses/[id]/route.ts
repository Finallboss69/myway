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
			"categoryId",
			"supplierId",
			"description",
			"amount",
			"date",
			"paymentMethod",
			"notes",
			"isRecurring",
			"recurringDay",
		] as const;
		const data: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) data[key] = body[key];
		}
		if (data.date) data.date = new Date(data.date as string);
		const expense = await db.expense.update({
			where: { id },
			data,
			include: { category: true, supplier: true },
		});
		return NextResponse.json(expense);
	} catch (e) {
		console.error("[expenses/[id] PATCH]", e);
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
		await db.expense.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error("[expenses/[id] DELETE]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
