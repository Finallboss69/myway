import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const ingredients = await db.ingredient.findMany();
		return NextResponse.json(ingredients);
	} catch (error) {
		console.error("[ingredients GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch ingredients" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			name: string;
			unit: string;
			stockCurrent: number;
			alertThreshold: number;
			costPerUnit: number;
		};
		const ingredient = await db.ingredient.create({ data: body });
		return NextResponse.json(ingredient, { status: 201 });
	} catch (error) {
		console.error("[ingredients POST]", error);
		return NextResponse.json(
			{ error: "Failed to create ingredient" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			updates: { id: string; stockCurrent: number }[];
		};
		const { updates } = body;

		if (!Array.isArray(updates)) {
			return NextResponse.json(
				{ error: "updates must be an array" },
				{ status: 400 },
			);
		}

		const results = await Promise.all(
			updates.map(({ id, stockCurrent }) =>
				db.ingredient.update({
					where: { id },
					data: { stockCurrent },
				}),
			),
		);
		return NextResponse.json(results);
	} catch (error) {
		console.error("[ingredients PATCH]", error);
		return NextResponse.json(
			{ error: "Failed to update ingredients" },
			{ status: 500 },
		);
	}
}
