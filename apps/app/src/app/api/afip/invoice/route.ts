import { NextResponse } from "next/server";
import { createElectronicInvoice } from "@/lib/afip";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { type, customerCuit, customerName, items, orderId } = body;
		if (!type || !items?.length) {
			return NextResponse.json(
				{ error: "type and items required" },
				{ status: 400 },
			);
		}
		const result = await createElectronicInvoice(
			{ type, puntoVenta: 0, customerCuit, customerName, items },
			orderId,
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
