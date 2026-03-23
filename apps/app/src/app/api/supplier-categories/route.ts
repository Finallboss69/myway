import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	const categories = await db.supplierCategory.findMany({
		orderBy: { order: "asc" },
		include: { suppliers: { select: { id: true, name: true } } },
	});
	return NextResponse.json(categories);
}

export async function POST(req: Request) {
	const body = await req.json();
	const category = await db.supplierCategory.create({ data: body });
	return NextResponse.json(category, { status: 201 });
}
