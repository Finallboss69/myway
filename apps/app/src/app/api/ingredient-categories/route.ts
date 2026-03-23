import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	const categories = await db.ingredientCategory.findMany({
		orderBy: { order: "asc" },
		include: { ingredients: { select: { id: true, name: true, unit: true } } },
	});
	return NextResponse.json(categories);
}

export async function POST(req: Request) {
	const body = await req.json();
	const category = await db.ingredientCategory.create({ data: body });
	return NextResponse.json(category, { status: 201 });
}
