import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const order = await db.order.findUnique({
			where: { id },
			include: { items: true },
		});

		if (!order) {
			return NextResponse.json({ error: "Order not found" }, { status: 404 });
		}

		return NextResponse.json(order);
	} catch (error) {
		console.error("[orders/[id] GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch order" },
			{ status: 500 },
		);
	}
}

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

		const order = await db.order.update({
			where: { id },
			data: { status },
			include: { items: true },
		});
		return NextResponse.json(order);
	} catch (error) {
		console.error("[orders/[id] PATCH]", error);
		return NextResponse.json(
			{ error: "Failed to update order" },
			{ status: 500 },
		);
	}
}
