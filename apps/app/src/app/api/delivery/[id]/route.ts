import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = (await request.json()) as { status: string };
		const { status } = body;

		const VALID_STATUSES = [
			"pending",
			"preparing",
			"ready",
			"en_camino",
			"delivered",
			"cancelled",
		];
		if (!status || !VALID_STATUSES.includes(status)) {
			return NextResponse.json(
				{ error: `status inválido. Valores: ${VALID_STATUSES.join(", ")}` },
				{ status: 400 },
			);
		}

		const existing = await db.deliveryOrder.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json(
				{ error: "Pedido no encontrado" },
				{ status: 404 },
			);
		}

		const order = await db.deliveryOrder.update({
			where: { id },
			data: { status },
			include: { items: true },
		});
		return NextResponse.json(order);
	} catch (error) {
		console.error("[delivery/[id] PATCH]", error);
		return NextResponse.json(
			{ error: "Failed to update delivery order" },
			{ status: 500 },
		);
	}
}
