import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const ADMIN_ROLES = ["admin", "manager"];

// GET /api/cost-calculator — returns cost analysis for all products
export async function GET(request: NextRequest) {
	const auth = await requireStaffRole(request, ADMIN_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const products = await db.product.findMany({
			include: {
				category: true,
				recipeIngredients: { include: { ingredient: true } },
			},
			orderBy: { name: "asc" },
		});

		const analysis = products.map((p) => {
			const ingredientCost = p.recipeIngredients.reduce(
				(sum, ri) => sum + ri.quantity * ri.ingredient.costPerUnit,
				0,
			);
			const margin =
				p.price > 0 ? ((p.price - ingredientCost) / p.price) * 100 : 0;
			return {
				id: p.id,
				name: p.name,
				category: p.category.name,
				salePrice: p.price,
				costPrice: ingredientCost,
				profit: p.price - ingredientCost,
				marginPercent: Math.round(margin * 10) / 10,
				ingredientCount: p.recipeIngredients.length,
				hasRecipe: p.recipeIngredients.length > 0,
			};
		});

		const totalProducts = analysis.length;
		const withRecipe = analysis.filter((a) => a.hasRecipe).length;
		const avgMargin =
			analysis
				.filter((a) => a.hasRecipe)
				.reduce((s, a) => s + a.marginPercent, 0) / (withRecipe || 1);

		return NextResponse.json({
			products: analysis,
			summary: {
				totalProducts,
				withRecipe,
				withoutRecipe: totalProducts - withRecipe,
				avgMargin: Math.round(avgMargin * 10) / 10,
			},
		});
	} catch (e) {
		console.error("[cost-calculator GET]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}
