import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const order = await db.deliveryOrder.findUnique({
			where: { id },
			include: { items: true },
		});

		if (!order) {
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			id: order.id,
			status: order.status,
			repartidorLat: order.repartidorLat,
			repartidorLng: order.repartidorLng,
			items: order.items.map((i) => ({
				name: i.name,
				qty: i.qty,
				price: i.price,
			})),
			total: order.total,
			customerName: order.customerName,
		});
	} catch (error) {
		console.error("[tracking GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch tracking data" },
			{ status: 500 },
		);
	}
}
