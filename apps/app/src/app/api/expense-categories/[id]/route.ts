import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const ADMIN_ROLES = ["admin", "manager"];

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await requireStaffRole(req, ADMIN_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const { id } = await params;
		const existing = await db.expenseCategory.findUnique({ where: { id } });
		if (!existing)
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
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
		console.error("[expense-categories/[id] PATCH]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const authDel = await requireStaffRole(req, ADMIN_ROLES);
	if (!authDel.ok) return authDel.response;

	try {
		const { id } = await params;
		const existing = await db.expenseCategory.findUnique({ where: { id } });
		if (!existing)
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
		await db.expenseCategory.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error("[expense-categories/[id] DELETE]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
