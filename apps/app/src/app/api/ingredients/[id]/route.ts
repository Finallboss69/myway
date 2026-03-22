import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = (await request.json()) as {
			stockCurrent?: number;
			alertThreshold?: number;
		};

		const ingredient = await db.ingredient.update({
			where: { id },
			data: {
				...(body.stockCurrent !== undefined
					? { stockCurrent: body.stockCurrent }
					: {}),
				...(body.alertThreshold !== undefined
					? { alertThreshold: body.alertThreshold }
					: {}),
			},
		});
		return NextResponse.json(ingredient);
	} catch (error) {
		console.error("[ingredients/[id] PATCH]", error);
		return NextResponse.json(
			{ error: "Failed to update ingredient" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		await db.ingredient.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[ingredients/[id] DELETE]", error);
		return NextResponse.json(
			{ error: "Failed to delete ingredient" },
			{ status: 500 },
		);
	}
}
