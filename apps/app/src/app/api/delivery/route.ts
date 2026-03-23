import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");

		const orders = await db.deliveryOrder.findMany({
			where: status ? { status } : undefined,
			include: { items: true },
			orderBy: { createdAt: "desc" },
		});
		return NextResponse.json({ orders });
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
			userId?: string;
			items: { name: string; qty: number; price: number }[];
		};

		const {
			customerName,
			address,
			phone,
			total,
			paymentMethod,
			notes,
			userId,
			items,
		} = body;

		if (!customerName || !address || !paymentMethod) {
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
				total: total ?? 0,
				paymentMethod,
				notes: notes ?? null,
				userId: userId ?? null,
				items: {
					create: (items ?? []).map((item) => ({
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
