import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { type, amount, concept, paymentMethod, orderId, expenseId } = body;

		if (!type || amount === undefined || amount === null || !concept?.trim()) {
			return NextResponse.json(
				{ error: "type, amount, concept required" },
				{ status: 400 },
			);
		}
		if (!["income", "expense"].includes(type)) {
			return NextResponse.json(
				{ error: "type must be income or expense" },
				{ status: 400 },
			);
		}
		if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
			return NextResponse.json(
				{ error: "amount debe ser un número positivo" },
				{ status: 400 },
			);
		}

		// Verify register is open
		const register = await db.cashRegister.findUnique({ where: { id } });
		if (!register || register.status !== "open") {
			return NextResponse.json(
				{ error: "Caja no está abierta" },
				{ status: 409 },
			);
		}

		const movement = await db.cashMovement.create({
			data: {
				registerId: id,
				type,
				amount,
				concept: concept.trim(),
				paymentMethod: paymentMethod || null,
				orderId: orderId || null,
				expenseId: expenseId || null,
			},
		});
		return NextResponse.json(movement, { status: 201 });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
