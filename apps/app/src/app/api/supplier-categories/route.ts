import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const ADMIN_ROLES = ["admin", "manager"];

export async function GET() {
	try {
		const categories = await db.supplierCategory.findMany({
			orderBy: { order: "asc" },
			include: {
				suppliers: { select: { id: true, name: true } },
			},
		});
		return NextResponse.json(categories);
	} catch (e) {
		console.error("[supplier-categories GET]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	const auth = await requireStaffRole(req, ADMIN_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const body = await req.json();
		if (!body.name) {
			return NextResponse.json({ error: "name required" }, { status: 400 });
		}
		const allowed = { name: body.name, order: body.order ?? 0 };
		const category = await db.supplierCategory.create({ data: allowed });
		return NextResponse.json(category, { status: 201 });
	} catch (e) {
		console.error("[supplier-categories POST]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}
