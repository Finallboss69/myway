import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const ALLOWED_ROLES = ["admin", "manager", "cashier"];

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await requireStaffRole(req, ALLOWED_ROLES);
	if (!auth.ok) return auth.response;

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
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
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
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await requireStaffRole(req, ALLOWED_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const { id } = await params;
		const existing = await db.supplier.findUnique({ where: { id } });
		if (!existing)
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
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
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await requireStaffRole(req, ALLOWED_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const { id } = await params;
		const existing = await db.supplier.findUnique({ where: { id } });
		if (!existing)
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
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
