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

		if (!status) {
			return NextResponse.json(
				{ error: "status is required" },
				{ status: 400 },
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
