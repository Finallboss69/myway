import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const product = await db.product.findUnique({
			where: { id },
			include: { category: true },
		});
		if (!product)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(product);
	} catch (e) {
		console.error("[products/[id] GET]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await req.json();
		const allowed = [
			"name",
			"description",
			"price",
			"categoryId",
			"target",
			"isAvailable",
			"isPoolChip",
			"image",
			"costPrice",
		] as const;
		const data: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) data[key] = body[key];
		}
		const product = await db.product.update({ where: { id }, data });
		return NextResponse.json(product);
	} catch (e) {
		console.error("[products/[id] PATCH]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		await db.product.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error("[products/[id] DELETE]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
