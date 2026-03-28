import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createMpQr } from "@/lib/mercadopago";
import { requireStaffRole } from "@/lib/auth-check";

const STAFF_ROLES = ["admin", "manager", "pos", "waiter"];

/**
 * POST /api/payments/mp — Generate a MercadoPago QR for one or more orders on a table
 * Body: { orderId: string } or { orderIds: string[] }
 */
export async function POST(request: NextRequest) {
	const auth = await requireStaffRole(request, STAFF_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const body = (await request.json()) as {
			orderId?: string;
			orderIds?: string[];
		};

		const orderIds = body.orderIds ?? (body.orderId ? [body.orderId] : []);
		if (orderIds.length === 0) {
			return NextResponse.json(
				{ error: "orderId or orderIds required" },
				{ status: 400 },
			);
		}

		// Fetch orders with items
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

		// Calculate total
		const allItems = orders.flatMap((o) => o.items);
		const totalAmount = allItems.reduce((sum, i) => sum + i.price * i.qty, 0);

		if (totalAmount <= 0) {
			return NextResponse.json(
				{ error: "El total debe ser mayor a 0" },
				{ status: 400 },
			);
		}

		// Build external reference (unique per payment attempt)
		const externalReference = `myway-${orders[0].tableId}-${Date.now()}`;
		const tableNumber = orders[0].tableNumber;

		// Build notification URL from server-side env var (not request headers)
		const appUrl =
			process.env.NEXT_PUBLIC_APP_URL ?? "https://myway-pi.vercel.app";
		const notificationUrl = `${appUrl}/api/webhooks/mercadopago`;

		// Create QR via MP API
		const mpItems = allItems.map((item) => ({
			sku_number: item.productId,
			category: "food",
			title: item.name,
			unit_price: item.price,
			quantity: item.qty,
			unit_measure: "unit" as const,
			total_amount: item.price * item.qty,
		}));

		const mpResponse = await createMpQr({
			externalReference,
			title: `Mesa ${tableNumber}`,
			description: `Cuenta mesa ${tableNumber} — My Way`,
			totalAmount: Math.round(totalAmount * 100) / 100,
			items: mpItems,
			notificationUrl,
		});

		// Store payment record
		const mpPayment = await db.mpPayment.create({
			data: {
				orderId: orderIds.join(","),
				externalReference,
				qrData: mpResponse.qr_data,
				mpOrderId: mpResponse.in_store_order_id,
				status: "pending",
				amount: totalAmount,
			},
		});

		return NextResponse.json({
			id: mpPayment.id,
			qrData: mpResponse.qr_data,
			externalReference,
			amount: totalAmount,
		});
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error("[payments/mp POST]", error);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}

/**
 * GET /api/payments/mp?externalReference=xxx — Check payment status
 */
export async function GET(request: NextRequest) {
	const auth = await requireStaffRole(request, STAFF_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const ref = new URL(request.url).searchParams.get("externalReference");
		if (!ref) {
			return NextResponse.json(
				{ error: "externalReference required" },
				{ status: 400 },
			);
		}

		const mpPayment = await db.mpPayment.findUnique({
			where: { externalReference: ref },
		});

		if (!mpPayment) {
			return NextResponse.json({ error: "Payment not found" }, { status: 404 });
		}

		return NextResponse.json({
			id: mpPayment.id,
			status: mpPayment.status,
			amount: mpPayment.amount,
			paidAt: mpPayment.paidAt,
		});
	} catch (error) {
		console.error("[payments/mp GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch payment status" },
			{ status: 500 },
		);
	}
}
