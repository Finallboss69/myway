import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const STAFF_ROLES = ["admin", "manager", "cashier"];

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await requireStaffRole(req, STAFF_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const { id } = await params;
		const register = await db.cashRegister.findUnique({
			where: { id },
			include: { movements: { orderBy: { createdAt: "desc" } } },
		});
		if (!register)
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
		return NextResponse.json(register);
	} catch (e) {
		console.error("[cash-register/[id] GET]", e);
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
	const authPatch = await requireStaffRole(req, STAFF_ROLES);
	if (!authPatch.ok) return authPatch.response;

	try {
		const { id } = await params;
		const body = await req.json();

		// If closing, calculate balance
		if (body.status === "closed") {
			const register = await db.cashRegister.findUnique({
				where: { id },
				include: { movements: true },
			});
			if (!register)
				return NextResponse.json(
					{ error: "Recurso no encontrado" },
					{ status: 404 },
				);

			const movementTotal = register.movements.reduce((sum, m) => {
				return sum + (m.type === "income" ? m.amount : -m.amount);
			}, 0);

			const updated = await db.cashRegister.update({
				where: { id },
				data: {
					status: "closed",
					closedAt: new Date(),
					closingBalance: register.openingBalance + movementTotal,
				},
				include: { movements: true },
			});
			return NextResponse.json(updated);
		}

		const allowed = ["closingBalance", "status", "closedAt"] as const;
		const data: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) data[key] = body[key];
		}
		const updated = await db.cashRegister.update({ where: { id }, data });
		return NextResponse.json(updated);
	} catch (e) {
		console.error("[cash-register/[id] PATCH]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
