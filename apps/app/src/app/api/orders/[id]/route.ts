import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const STAFF_ROLES = ["admin", "manager", "cashier", "waiter", "bar", "kitchen"];

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const order = await db.order.findUnique({
			where: { id },
			include: { items: true },
		});

		if (!order) {
			return NextResponse.json(
				{ error: "Recurso no encontrado" },
				{ status: 404 },
			);
		}

		return NextResponse.json(order);
	} catch (error) {
		console.error("[orders/[id] GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch order" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await requireStaffRole(request, STAFF_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const { id } = await params;
		const body = (await request.json()) as { status: string };
		const { status } = body;

		const VALID_STATUSES = [
			"pending",
			"preparing",
			"ready",
			"closed",
			"cancelled",
		];
		if (!status || !VALID_STATUSES.includes(status)) {
			return NextResponse.json(
				{
					error: `status inválido. Valores permitidos: ${VALID_STATUSES.join(", ")}`,
				},
				{ status: 400 },
			);
		}

		// Validate state transitions
		const existing = await db.order.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json(
				{ error: "Pedido no encontrado" },
				{ status: 404 },
			);
		}

		const TRANSITIONS: Record<string, string[]> = {
			pending: ["preparing", "cancelled"],
			preparing: ["ready", "pending", "cancelled"],
			ready: ["closed", "preparing", "cancelled"],
			closed: [],
			cancelled: [],
		};
		const allowed = TRANSITIONS[existing.status] ?? [];
		if (!allowed.includes(status)) {
			return NextResponse.json(
				{ error: `No se puede cambiar de "${existing.status}" a "${status}"` },
				{ status: 400 },
			);
		}

		const order = await db.order.update({
			where: { id },
			data: { status },
			include: { items: true },
		});
		return NextResponse.json(order);
	} catch (error) {
		console.error("[orders/[id] PATCH]", error);
		return NextResponse.json(
			{ error: "Failed to update order" },
			{ status: 500 },
		);
	}
}
