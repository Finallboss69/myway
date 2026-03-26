import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await requireStaffRole(request, ["admin", "manager"]);
	if (!auth.ok) return auth.response;

	try {
		const { id } = await params;
		const existing = await db.staff.findUnique({ where: { id } });
		if (!existing)
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
		const body = await request.json();
		const allowed = ["name", "role", "avatar", "pin"] as const;
		const data: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) data[key] = body[key];
		}
		// Validate PIN format if provided
		if (typeof data.pin === "string" && !/^\d{4,6}$/.test(data.pin)) {
			return NextResponse.json(
				{ error: "PIN debe ser 4-6 dígitos" },
				{ status: 400 },
			);
		}
		const member = await db.staff.update({
			where: { id },
			data,
			select: { id: true, name: true, role: true, avatar: true },
		});
		return NextResponse.json(member);
	} catch (error) {
		console.error("[staff/[id] PATCH]", error);
		return NextResponse.json(
			{ error: "Failed to update staff" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const authDel = await requireStaffRole(request, ["admin"]);
	if (!authDel.ok) return authDel.response;

	try {
		const { id } = await params;
		const existing = await db.staff.findUnique({ where: { id } });
		if (!existing)
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
		await db.staff.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[staff/[id] DELETE]", error);
		return NextResponse.json(
			{ error: "Failed to delete staff" },
			{ status: 500 },
		);
	}
}
