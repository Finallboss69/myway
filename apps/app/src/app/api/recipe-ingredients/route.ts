import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const ADMIN_ROLES = ["admin", "manager"];

export async function GET(req: NextRequest) {
	try {
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
	} catch (e) {
		console.error("[recipe-ingredients GET]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	const auth = await requireStaffRole(req, ADMIN_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const body = await req.json();
		if (
			!body.productId ||
			!body.ingredientId ||
			typeof body.quantity !== "number" ||
			!body.unit
		) {
			return NextResponse.json(
				{ error: "productId, ingredientId, quantity, unit required" },
				{ status: 400 },
			);
		}
		const allowed = {
			productId: body.productId,
			ingredientId: body.ingredientId,
			quantity: body.quantity,
			unit: body.unit,
		};
		const item = await db.recipeIngredient.create({
			data: allowed,
			include: { ingredient: true },
		});

		// Recalculate product cost
		const allIngredients = await db.recipeIngredient.findMany({
			where: { productId: allowed.productId },
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
	} catch (e) {
		console.error("[recipe-ingredients POST]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}
