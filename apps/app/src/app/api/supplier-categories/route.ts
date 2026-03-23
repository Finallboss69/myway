import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const categories = await db.supplierCategory.findMany({
			orderBy: { order: "asc" },
			include: {
				suppliers: { select: { id: true, name: true } },
			},
		});
		return NextResponse.json(categories);
	} catch (e) {
		console.error("[supplier-categories GET]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const category = await db.supplierCategory.create({ data: body });
		return NextResponse.json(category, { status: 201 });
	} catch (e) {
		console.error("[supplier-categories POST]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}
