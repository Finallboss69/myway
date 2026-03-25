import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; itemId: string }> },
) {
	try {
		const { id: orderId, itemId } = await params;
		const body = (await request.json()) as { status: string };
		const { status } = body;

		const VALID_ITEM_STATUSES = [
			"pending",
			"preparing",
			"ready",
			"delivered",
			"cancelled",
		];
		if (!status || !VALID_ITEM_STATUSES.includes(status)) {
			return NextResponse.json(
				{
					error: `status inválido. Valores: ${VALID_ITEM_STATUSES.join(", ")}`,
				},
				{ status: 400 },
			);
		}

		// Update item status
		await db.orderItem.update({
			where: { id: itemId },
			data: { status },
		});

		// Fetch all items of this order to recalculate order status
		const allItems = await db.orderItem.findMany({ where: { orderId } });

		const DONE_STATUSES = ["delivered", "cancelled"];
		const allDone = allItems.every((item) =>
			DONE_STATUSES.includes(item.status),
		);
		const anyPreparing = allItems.some((item) => item.status === "preparing");
		const anyReady = allItems.some((item) => item.status === "ready");
		const allReadyOrDone = allItems.every((item) =>
			["ready", "delivered", "cancelled"].includes(item.status),
		);

		let newOrderStatus: string;
		if (allDone || allReadyOrDone) {
			newOrderStatus = "ready";
		} else if (anyPreparing || anyReady) {
			newOrderStatus = "preparing";
		} else {
			newOrderStatus = "pending";
		}

		const updatedOrder = await db.order.update({
			where: { id: orderId },
			data: { status: newOrderStatus },
			include: { items: true },
		});

		// Emit notification in response if all items are done
		const notification = allDone
			? {
					type: "order_complete",
					orderId,
					message: `Order ${orderId} is complete`,
				}
			: null;

		return NextResponse.json({ order: updatedOrder, notification });
	} catch (error) {
		console.error("[orders/[id]/items/[itemId] PATCH]", error);
		return NextResponse.json(
			{ error: "Failed to update item" },
			{ status: 500 },
		);
	}
}
