import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const tableId = searchParams.get("tableId");
		const status = searchParams.get("status");
		const target = searchParams.get("target");

		const orders = await db.order.findMany({
			where: {
				status: { not: "closed" },
				...(tableId ? { tableId } : {}),
				...(status ? { status } : {}),
			},
			include: {
				items: target ? { where: { target } } : true,
			},
			orderBy: { createdAt: "desc" },
		});
		return NextResponse.json(orders);
	} catch (error) {
		console.error("[orders GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch orders" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			tableId: string;
			waiterName?: string;
			items: {
				productId: string;
				name: string;
				qty: number;
				price: number;
				target: string;
				notes?: string;
			}[];
		};

		const { tableId, waiterName, items } = body;

		if (!tableId || !items?.length) {
			return NextResponse.json(
				{ error: "tableId and items are required" },
				{ status: 400 },
			);
		}

		// Get the table to retrieve tableNumber and zoneId
		const table = await db.table.findUnique({ where: { id: tableId } });
		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Create order and mark table as occupied in a transaction
		const order = await db.$transaction(async (tx) => {
			const created = await tx.order.create({
				data: {
					tableId,
					tableNumber: table.number,
					zoneId: table.zoneId,
					waiterName: waiterName ?? null,
					status: "pending",
					items: {
						create: items.map((item) => ({
							productId: item.productId,
							name: item.name,
							qty: item.qty,
							price: item.price,
							target: item.target,
							notes: item.notes ?? null,
							status: "pending",
						})),
					},
				},
				include: { items: true },
			});

			await tx.table.update({
				where: { id: tableId },
				data: { status: "occupied" },
			});

			return created;
		});

		return NextResponse.json(order, { status: 201 });
	} catch (error) {
		console.error("[orders POST]", error);
		return NextResponse.json(
			{ error: "Failed to create order" },
			{ status: 500 },
		);
	}
}
