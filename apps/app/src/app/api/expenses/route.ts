import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const categoryId = searchParams.get("categoryId");
		const from = searchParams.get("from");
		const to = searchParams.get("to");

		const where: Record<string, unknown> = {};
		if (categoryId) where.categoryId = categoryId;
		if (from || to) {
			where.date = {};
			if (from) (where.date as Record<string, unknown>).gte = new Date(from);
			if (to) (where.date as Record<string, unknown>).lte = new Date(to);
		}

		const expenses = await db.expense.findMany({
			where,
			orderBy: { date: "desc" },
			include: { category: true, supplier: true },
		});
		return NextResponse.json(expenses);
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const {
			categoryId,
			supplierId,
			supplierInvoiceId,
			description,
			amount,
			date,
			paymentMethod,
			notes,
		} = body;
		if (!categoryId || !description?.trim() || amount == null || !date) {
			return NextResponse.json(
				{ error: "categoryId, description, amount, date required" },
				{ status: 400 },
			);
		}
		const expense = await db.expense.create({
			data: {
				categoryId,
				supplierId: supplierId || null,
				supplierInvoiceId: supplierInvoiceId || null,
				description: description.trim(),
				amount,
				date: new Date(date),
				paymentMethod: paymentMethod || null,
				notes: notes || null,
			},
			include: { category: true, supplier: true },
		});
		return NextResponse.json(expense, { status: 201 });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
