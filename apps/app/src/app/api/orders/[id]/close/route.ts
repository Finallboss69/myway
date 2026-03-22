import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = (await request.json()) as { paymentMethod: string };
		const { paymentMethod } = body;

		if (!paymentMethod) {
			return NextResponse.json(
				{ error: "paymentMethod is required" },
				{ status: 400 },
			);
		}

		const order = await db.order.findUnique({
			where: { id },
			include: { items: true },
		});

		if (!order) {
			return NextResponse.json({ error: "Order not found" }, { status: 404 });
		}

		const closedOrder = await db.$transaction(async (tx) => {
			const closed = await tx.order.update({
				where: { id },
				data: {
					status: "closed",
					paymentMethod,
					closedAt: new Date(),
				},
				include: { items: true },
			});

			await tx.table.update({
				where: { id: order.tableId },
				data: { status: "available" },
			});

			return closed;
		});

		return NextResponse.json(closedOrder);
	} catch (error) {
		console.error("[orders/[id]/close POST]", error);
		return NextResponse.json(
			{ error: "Failed to close order" },
			{ status: 500 },
		);
	}
}
