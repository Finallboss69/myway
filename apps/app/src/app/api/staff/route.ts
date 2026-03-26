import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

export async function GET() {
	try {
		const staff = await db.staff.findMany({
			omit: { pin: true },
		});
		return NextResponse.json(staff);
	} catch (error) {
		console.error("[staff GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch staff" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	const auth = await requireStaffRole(request, ["admin", "manager"]);
	if (!auth.ok) return auth.response;

	try {
		const body = (await request.json()) as {
			name: string;
			role: string;
			avatar: string;
			pin?: string;
		};
		const VALID_ROLES = [
			"admin",
			"manager",
			"cashier",
			"waiter",
			"kitchen",
			"bar",
			"repartidor",
		];
		if (!body.name?.trim() || !body.role || !body.avatar) {
			return NextResponse.json(
				{ error: "name, role, avatar required" },
				{ status: 400 },
			);
		}
		if (!VALID_ROLES.includes(body.role)) {
			return NextResponse.json(
				{ error: `role inválido. Valores: ${VALID_ROLES.join(", ")}` },
				{ status: 400 },
			);
		}
		// Validate PIN format if provided
		if (body.pin && !/^\d{4,6}$/.test(body.pin)) {
			return NextResponse.json(
				{ error: "PIN debe ser 4-6 dígitos" },
				{ status: 400 },
			);
		}
		const member = await db.staff.create({
			data: {
				name: body.name.trim(),
				role: body.role,
				avatar: body.avatar,
				pin: body.pin ?? String(randomInt(100000, 999999)),
			},
			omit: { pin: true },
		});
		return NextResponse.json(member, { status: 201 });
	} catch (error) {
		console.error("[staff POST]", error);
		return NextResponse.json(
			{ error: "Failed to create staff" },
			{ status: 500 },
		);
	}
}
