import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const STAFF_ROLES = ["admin", "manager", "cashier"];

export async function GET(req: NextRequest) {
	const auth = await requireStaffRole(req, STAFF_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const { searchParams } = new URL(req.url);
		const status = searchParams.get("status");
		const where: Record<string, unknown> = {};
		if (status) where.status = status;

		const registers = await db.cashRegister.findMany({
			where,
			orderBy: { date: "desc" },
			include: { _count: { select: { movements: true } } },
		});
		return NextResponse.json(registers);
	} catch (e) {
		console.error("[cash-register GET]", e);
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
		const { openingBalance } = body;

		// Check no register is already open
		const existing = await db.cashRegister.findFirst({
			where: { status: "open" },
		});
		if (existing) {
			return NextResponse.json(
				{ error: "Ya hay una caja abierta" },
				{ status: 409 },
			);
		}

		const register = await db.cashRegister.create({
			data: {
				date: new Date(),
				openingBalance: openingBalance ?? 0,
			},
		});
		return NextResponse.json(register, { status: 201 });
	} catch (e) {
		console.error("[cash-register POST]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
