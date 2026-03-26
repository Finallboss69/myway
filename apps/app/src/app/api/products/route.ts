import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const ADMIN_ROLES = ["admin", "manager"];

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
	const auth = await requireStaffRole(request, ADMIN_ROLES);
	if (!auth.ok) return auth.response;

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
		if (
			!body.name ||
			!body.categoryId ||
			!body.target ||
			typeof body.price !== "number"
		) {
			return NextResponse.json(
				{ error: "name, price, categoryId, target required" },
				{ status: 400 },
			);
		}
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
