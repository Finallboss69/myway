import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const ALLOWED_ROLES = [
	"admin",
	"manager",
	"cashier",
	"waiter",
	"bar",
	"kitchen",
];

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; itemId: string }> },
) {
	const auth = await requireStaffRole(request, ALLOWED_ROLES);
	if (!auth.ok) return auth.response;

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

		// Wrap in transaction to prevent race conditions when
		// multiple items are updated concurrently.
		const { updatedOrder, allDone } = await db.$transaction(async (tx) => {
			// Update item status
			await tx.orderItem.update({
				where: { id: itemId },
				data: { status },
			});

			// Fetch all items of this order to recalculate order status
			const allItems = await tx.orderItem.findMany({
				where: { orderId },
			});

			const DONE_STATUSES = ["delivered", "cancelled"];
			const done = allItems.every((i) => DONE_STATUSES.includes(i.status));
			const allReadyOrDone = allItems.every((i) =>
				["ready", "delivered", "cancelled"].includes(i.status),
			);
			const anyPreparing = allItems.some((i) => i.status === "preparing");
			const anyReady = allItems.some((i) => i.status === "ready");

			// Derive order status — "ready" means cashier can close it
			let newOrderStatus: string;
			if (allReadyOrDone) {
				newOrderStatus = "ready";
			} else if (anyPreparing || anyReady) {
				newOrderStatus = "preparing";
			} else {
				newOrderStatus = "pending";
			}

			const order = await tx.order.update({
				where: { id: orderId },
				data: { status: newOrderStatus },
				include: { items: true },
			});

			return { updatedOrder: order, allDone: done };
		});

		// Notify only when every item is fully done (delivered/cancelled)
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
