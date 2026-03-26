import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const STAFF_ROLES = ["admin", "manager", "cashier"];

export async function GET(req: NextRequest) {
	const auth = await requireStaffRole(req, STAFF_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const suppliers = await db.supplier.findMany({
			orderBy: { name: "asc" },
			include: {
				category: true,
				_count: { select: { invoices: true, ingredients: true } },
			},
		});
		return NextResponse.json(suppliers);
	} catch (e) {
		console.error("[suppliers GET]", e);
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
		const { name, cuit, address, phone, email, notes, categoryId } = body;
		if (!name?.trim()) {
			return NextResponse.json({ error: "name required" }, { status: 400 });
		}
		const supplier = await db.supplier.create({
			data: {
				name: name.trim(),
				cuit: cuit?.trim() || null,
				address: address?.trim() || null,
				phone: phone?.trim() || null,
				email: email?.trim() || null,
				notes: notes?.trim() || null,
				categoryId: categoryId || null,
			},
		});
		return NextResponse.json(supplier, { status: 201 });
	} catch (e) {
		console.error("[suppliers POST]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
