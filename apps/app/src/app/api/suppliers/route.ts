import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const suppliers = await db.supplier.findMany({
			orderBy: { name: "asc" },
			include: {
				category: true,
				_count: { select: { invoices: true, ingredients: true } },
			},
		});
		return NextResponse.json(suppliers);
	} catch (e) {
		console.error("[suppliers GET]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { name, cuit, address, phone, email, notes, categoryId } = body;
		if (!name?.trim()) {
			return NextResponse.json({ error: "name required" }, { status: 400 });
		}
		const supplier = await db.supplier.create({
			data: {
				name: name.trim(),
				cuit: cuit?.trim() || null,
				address: address?.trim() || null,
				phone: phone?.trim() || null,
				email: email?.trim() || null,
				notes: notes?.trim() || null,
				categoryId: categoryId || null,
			},
		});
		return NextResponse.json(supplier, { status: 201 });
	} catch (e) {
		console.error("[suppliers POST]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
