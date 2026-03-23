import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const ingredientId = searchParams.get("ingredientId");

	const where = ingredientId ? { ingredientId } : {};
	const history = await db.priceHistory.findMany({
		where,
		orderBy: { date: "desc" },
		take: 100,
		include: { ingredient: { select: { name: true, unit: true } } },
	});
	return NextResponse.json(history);
}

export async function POST(req: Request) {
	const body = await req.json();
	const entry = await db.priceHistory.create({ data: body });

	// Update ingredient cost
	if (body.costPerUnit && body.ingredientId) {
		await db.ingredient.update({
			where: { id: body.ingredientId },
			data: { costPerUnit: body.costPerUnit },
		});
	}

	return NextResponse.json(entry, { status: 201 });
}
