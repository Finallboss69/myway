import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const categories = await db.category.findMany({
			orderBy: { order: "asc" },
		});
		return NextResponse.json(categories);
	} catch (error) {
		console.error("[categories GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch categories" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			name: string;
			icon: string;
			order?: number;
		};
		if (!body.name || !body.icon) {
			return NextResponse.json(
				{ error: "name, icon required" },
				{ status: 400 },
			);
		}
		const category = await db.category.create({
			data: { name: body.name, icon: body.icon, order: body.order ?? 0 },
		});
		return NextResponse.json(category, { status: 201 });
	} catch (error) {
		console.error("[categories POST]", error);
		return NextResponse.json(
			{ error: "Failed to create category" },
			{ status: 500 },
		);
	}
}
