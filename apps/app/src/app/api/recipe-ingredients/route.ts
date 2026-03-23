import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const productId = searchParams.get("productId");

	const where = productId ? { productId } : {};
	const items = await db.recipeIngredient.findMany({
		where,
		include: {
			ingredient: true,
			product: { select: { id: true, name: true } },
		},
	});
	return NextResponse.json(items);
}

export async function POST(req: Request) {
	const body = await req.json();
	const item = await db.recipeIngredient.create({
		data: body,
		include: { ingredient: true },
	});

	// Recalculate product cost
	const allIngredients = await db.recipeIngredient.findMany({
		where: { productId: body.productId },
		include: { ingredient: true },
	});
	const totalCost = allIngredients.reduce(
		(sum, ri) => sum + ri.quantity * ri.ingredient.costPerUnit,
		0,
	);
	await db.product.update({
		where: { id: body.productId },
		data: { costPrice: totalCost },
	});

	return NextResponse.json(item, { status: 201 });
}
