import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const STAFF_ROLES = ["admin", "manager", "cashier"];

export async function GET(req: NextRequest) {
	const auth = await requireStaffRole(req, STAFF_ROLES);
	if (!auth.ok) return auth.response;

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
		console.error("[expenses GET]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}

export async function POST(req: NextRequest) {
	const authPost = await requireStaffRole(req, STAFF_ROLES);
	if (!authPost.ok) return authPost.response;

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
		if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
			return NextResponse.json(
				{ error: "amount debe ser un número positivo" },
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
		console.error("[expenses POST]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
