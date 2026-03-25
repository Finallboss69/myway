import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";

/**
 * Verify that the request includes a valid staff PIN with the required role.
 * Expects header: x-staff-pin
 * Returns the staff record on success, or a 401 NextResponse on failure.
 */
export async function requireStaffRole(
	request: NextRequest,
	allowedRoles: string[],
): Promise<
	| { ok: true; staff: { id: string; name: string; role: string } }
	| { ok: false; response: NextResponse }
> {
	const pin = request.headers.get("x-staff-pin");
	if (!pin) {
		return {
			ok: false,
			response: NextResponse.json(
				{ error: "Autenticación requerida" },
				{ status: 401 },
			),
		};
	}

	const staff = await db.staff.findFirst({ where: { pin } });
	if (!staff || !allowedRoles.includes(staff.role)) {
		return {
			ok: false,
			response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
		};
	}

	return {
		ok: true,
		staff: { id: staff.id, name: staff.name, role: staff.role },
	};
}
