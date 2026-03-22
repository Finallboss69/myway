import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const orders = await db.deliveryOrder.findMany({
			include: { items: true },
			orderBy: { createdAt: "desc" },
		});
		return NextResponse.json(orders);
	} catch (error) {
		console.error("[delivery GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch delivery orders" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			customerName: string;
			address: string;
			phone?: string;
			total: number;
			paymentMethod: string;
			notes?: string;
			items: { name: string; qty: number; price: number }[];
		};

		const { customerName, address, phone, total, paymentMethod, notes, items } =
			body;

		if (
			!customerName ||
			!address ||
			!total ||
			!paymentMethod ||
			!items?.length
		) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const order = await db.deliveryOrder.create({
			data: {
				customerName,
				address,
				phone: phone ?? null,
				total,
				paymentMethod,
				notes: notes ?? null,
				items: {
					create: items.map((item) => ({
						name: item.name,
						qty: item.qty,
						price: item.price,
					})),
				},
			},
			include: { items: true },
		});
		return NextResponse.json(order, { status: 201 });
	} catch (error) {
		console.error("[delivery POST]", error);
		return NextResponse.json(
			{ error: "Failed to create delivery order" },
			{ status: 500 },
		);
	}
}
