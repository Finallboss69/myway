import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const ADMIN_ROLES = ["admin", "manager"];

export async function GET() {
	try {
		const cats = await db.expenseCategory.findMany({
			orderBy: { order: "asc" },
			include: { _count: { select: { expenses: true } } },
		});
		return NextResponse.json(cats);
	} catch (e) {
		console.error("[expense-categories GET]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}

export async function POST(req: NextRequest) {
	const auth = await requireStaffRole(req, ADMIN_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const body = await req.json();
		const { name, icon, order } = body;
		if (!name?.trim()) {
			return NextResponse.json({ error: "name required" }, { status: 400 });
		}
		const cat = await db.expenseCategory.create({
			data: { name: name.trim(), icon: icon || "📦", order: order ?? 0 },
		});
		return NextResponse.json(cat, { status: 201 });
	} catch (e) {
		console.error("[expense-categories POST]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
