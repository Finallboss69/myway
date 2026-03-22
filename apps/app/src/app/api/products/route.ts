import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const categoryId = searchParams.get("categoryId");
		const available = searchParams.get("available");

		const products = await db.product.findMany({
			where: {
				...(categoryId ? { categoryId } : {}),
				...(available === "true" ? { isAvailable: true } : {}),
			},
			include: { category: true },
			orderBy: [{ category: { order: "asc" } }, { name: "asc" }],
		});
		return NextResponse.json(products);
	} catch (error) {
		console.error("[products GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch products" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			name: string;
			description?: string;
			price: number;
			categoryId: string;
			target: string;
			isAvailable?: boolean;
			isPoolChip?: boolean;
		};
		const product = await db.product.create({
			data: {
				name: body.name,
				description: body.description ?? null,
				price: body.price,
				categoryId: body.categoryId,
				target: body.target,
				isAvailable: body.isAvailable ?? true,
				isPoolChip: body.isPoolChip ?? false,
			},
			include: { category: true },
		});
		return NextResponse.json(product, { status: 201 });
	} catch (error) {
		console.error("[products POST]", error);
		return NextResponse.json(
			{ error: "Failed to create product" },
			{ status: 500 },
		);
	}
}
