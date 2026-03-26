import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const ALLOWED_ROLES = ["admin", "manager", "bar", "kitchen"];

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await requireStaffRole(request, ALLOWED_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const { id } = await params;
		const existing = await db.ingredient.findUnique({ where: { id } });
		if (!existing)
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
		const body = (await request.json()) as {
			name?: string;
			unit?: string;
			stockCurrent?: number;
			alertThreshold?: number;
			costPerUnit?: number;
			categoryId?: string | null;
			supplierId?: string | null;
		};

		const data: Record<string, unknown> = {};
		if (body.name !== undefined) data.name = body.name;
		if (body.unit !== undefined) data.unit = body.unit;
		if (body.stockCurrent !== undefined) data.stockCurrent = body.stockCurrent;
		if (body.alertThreshold !== undefined)
			data.alertThreshold = body.alertThreshold;
		if (body.costPerUnit !== undefined) data.costPerUnit = body.costPerUnit;
		if (body.categoryId !== undefined)
			data.categoryId = body.categoryId || null;
		if (body.supplierId !== undefined)
			data.supplierId = body.supplierId || null;

		const ingredient = await db.ingredient.update({
			where: { id },
			data,
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
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await requireStaffRole(request, ALLOWED_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const { id } = await params;
		const existing = await db.ingredient.findUnique({ where: { id } });
		if (!existing)
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
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
