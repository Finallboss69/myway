import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await req.json();
		const allowed = ["quantity", "unit", "ingredientId"] as const;
		const data: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) data[key] = body[key];
		}
		const item = await db.recipeIngredient.update({
			where: { id },
			data,
			include: { ingredient: true },
		});

		// Recalculate product cost
		const allIngredients = await db.recipeIngredient.findMany({
			where: { productId: item.productId },
			include: { ingredient: true },
		});
		const totalCost = allIngredients.reduce(
			(sum, ri) => sum + ri.quantity * ri.ingredient.costPerUnit,
			0,
		);
		await db.product.update({
			where: { id: item.productId },
			data: { costPrice: totalCost },
		});

		return NextResponse.json(item);
	} catch (e) {
		console.error("[recipe-ingredients/[id] PUT]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const item = await db.recipeIngredient.findUnique({ where: { id } });
		if (!item)
			return NextResponse.json({ error: "Not found" }, { status: 404 });

		await db.recipeIngredient.delete({ where: { id } });

		// Recalculate product cost
		const allIngredients = await db.recipeIngredient.findMany({
			where: { productId: item.productId },
			include: { ingredient: true },
		});
		const totalCost = allIngredients.reduce(
			(sum, ri) => sum + ri.quantity * ri.ingredient.costPerUnit,
			0,
		);
		await db.product.update({
			where: { id: item.productId },
			data: { costPrice: totalCost },
		});

		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error("[recipe-ingredients/[id] DELETE]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}
