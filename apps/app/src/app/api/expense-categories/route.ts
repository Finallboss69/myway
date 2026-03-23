import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const cats = await db.expenseCategory.findMany({
			orderBy: { order: "asc" },
			include: { _count: { select: { expenses: true } } },
		});
		return NextResponse.json(cats);
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { name, icon, order } = body;
		if (!name?.trim()) {
			return NextResponse.json({ error: "name required" }, { status: 400 });
		}
		const cat = await db.expenseCategory.create({
			data: { name: name.trim(), icon: icon || "📦", order: order ?? 0 },
		});
		return NextResponse.json(cat, { status: 201 });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
