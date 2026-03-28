import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
	createPointPaymentIntent,
	getPointPaymentIntent,
	cancelPointPaymentIntent,
} from "@/lib/mercadopago";
import { requireStaffRole } from "@/lib/auth-check";

const STAFF_ROLES = ["admin", "manager", "cashier", "waiter"];
const SAFE_ID = /^[A-Za-z0-9_\-]{4,128}$/;

/**
 * POST /api/payments/point — Create a Point (posnet) payment intent
 * Body: { orderIds: string[], deviceId?: string }
 */
export async function POST(request: NextRequest) {
	const auth = await requireStaffRole(request, STAFF_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const body = (await request.json()) as {
			orderId?: string;
			orderIds?: string[];
			deviceId?: string;
		};

		const orderIds = body.orderIds ?? (body.orderId ? [body.orderId] : []);
		if (orderIds.length === 0) {
			return NextResponse.json(
				{ error: "orderId or orderIds required" },
				{ status: 400 },
			);
		}

		// Resolve device ID: explicit or from settings
		let deviceId = body.deviceId;
		if (!deviceId) {
			const setting = await db.setting.findUnique({
				where: { key: "mp_device_id" },
			});
			deviceId = setting?.value;
		}
		if (!deviceId) {
			return NextResponse.json(
				{
					error:
						"No hay terminal Point configurada. Configurá el Device ID en Admin → MercadoPago.",
				},
				{ status: 400 },
			);
		}
		if (!SAFE_ID.test(deviceId)) {
			return NextResponse.json(
				{ error: "Device ID inválido" },
				{ status: 400 },
			);
		}

		const orders = await db.order.findMany({
			where: { id: { in: orderIds } },
			include: { items: true },
		});
		if (orders.length === 0) {
			return NextResponse.json(
				{ error: "Órdenes no encontradas" },
				{ status: 404 },
			);
		}

		const allItems = orders.flatMap((o) => o.items);
		const totalAmount = allItems.reduce((sum, i) => sum + i.price * i.qty, 0);
		if (totalAmount <= 0) {
			return NextResponse.json(
				{ error: "El total debe ser mayor a 0" },
				{ status: 400 },
			);
		}

		const externalReference = `myway-point-${orders[0].tableId}-${Date.now()}`;
		const tableNumber = orders[0].tableNumber ?? "??";

		const intent = await createPointPaymentIntent(
			deviceId,
			Math.round(totalAmount * 100) / 100,
			externalReference,
			`Mesa ${tableNumber} — My Way`,
		);

		// Store payment record
		const mpPayment = await db.mpPayment.create({
			data: {
				orderId: orderIds.join(","),
				externalReference,
				mpOrderId: intent.id,
				status: "pending",
				amount: totalAmount,
			},
		});

		return NextResponse.json({
			id: mpPayment.id,
			intentId: intent.id,
			deviceId,
			externalReference,
			amount: totalAmount,
			state: intent.state,
		});
	} catch (error) {
		console.error("[payments/point POST]", error);
		return NextResponse.json(
			{ error: "Error al procesar el pago con tarjeta" },
			{ status: 500 },
		);
	}
}

/**
 * GET /api/payments/point?intentId=xxx — Check Point payment intent status
 */
export async function GET(request: NextRequest) {
	const auth = await requireStaffRole(request, STAFF_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const intentId = new URL(request.url).searchParams.get("intentId");
		if (!intentId || !SAFE_ID.test(intentId)) {
			return NextResponse.json({ error: "intentId inválido" }, { status: 400 });
		}

		const intent = await getPointPaymentIntent(intentId);
		return NextResponse.json({
			intentId: intent.id,
			state: intent.state,
			payment: intent.payment,
		});
	} catch (error) {
		console.error("[payments/point GET]", error);
		return NextResponse.json(
			{ error: "Error al consultar estado" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/payments/point?intentId=xxx&deviceId=yyy — Cancel a Point payment intent
 */
export async function DELETE(request: NextRequest) {
	const auth = await requireStaffRole(request, STAFF_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const url = new URL(request.url);
		const intentId = url.searchParams.get("intentId");
		let deviceId = url.searchParams.get("deviceId");

		if (!intentId || !SAFE_ID.test(intentId)) {
			return NextResponse.json({ error: "intentId inválido" }, { status: 400 });
		}
		if (!deviceId) {
			const setting = await db.setting.findUnique({
				where: { key: "mp_device_id" },
			});
			deviceId = setting?.value ?? null;
		}
		if (!deviceId || !SAFE_ID.test(deviceId)) {
			return NextResponse.json({ error: "deviceId inválido" }, { status: 400 });
		}

		await cancelPointPaymentIntent(deviceId, intentId);
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[payments/point DELETE]", error);
		return NextResponse.json({ error: "Error al cancelar" }, { status: 500 });
	}
}
