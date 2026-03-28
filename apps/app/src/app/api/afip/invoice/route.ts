import { NextRequest, NextResponse } from "next/server";
import { createElectronicInvoice } from "@/lib/afip";
import { requireStaffRole } from "@/lib/auth-check";

export async function POST(req: NextRequest) {
	const auth = await requireStaffRole(req, ["admin", "manager"]);
	if (!auth.ok) return auth.response;

	try {
		const body = await req.json();
		const { type, customerCuit, customerName, items, orderId, invoiceId } =
			body;
		if (!type || !items?.length) {
			return NextResponse.json(
				{ error: "type and items required" },
				{ status: 400 },
			);
		}
		const result = await createElectronicInvoice(
			{ type, puntoVenta: 0, customerCuit, customerName, items },
			orderId,
			invoiceId,
		);
		return NextResponse.json(result, { status: 201 });
	} catch (e) {
		console.error("[afip/invoice POST]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
