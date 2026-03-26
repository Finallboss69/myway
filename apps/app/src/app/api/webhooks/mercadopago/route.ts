import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getMpMerchantOrder } from "@/lib/mercadopago";

/**
 * Verify MercadoPago webhook signature (HMAC-SHA256).
 * Returns true if signature is valid or if no webhook secret is configured (dev mode).
 */
async function verifyMpSignature(
	request: NextRequest,
): Promise<boolean | "no_secret"> {
	const secret = await getWebhookSecret();
	if (!secret) return "no_secret";

	const xSignature = request.headers.get("x-signature");
	const xRequestId = request.headers.get("x-request-id");
	if (!xSignature || !xRequestId) return false;

	const ts = xSignature.match(/ts=([^,]+)/)?.[1];
	const v1 = xSignature.match(/v1=([^,]+)/)?.[1];
	if (!ts || !v1) return false;

	const dataId = new URL(request.url).searchParams.get("data.id") ?? "";
	const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
	const expected = crypto
		.createHmac("sha256", secret)
		.update(manifest)
		.digest("hex");

	try {
		return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
	} catch {
		return false;
	}
}

async function getWebhookSecret(): Promise<string | null> {
	const row = await db.setting.findUnique({
		where: { key: "mp_webhook_secret" },
	});
	return row?.value ?? null;
}

/**
 * POST /api/webhooks/mercadopago — MercadoPago IPN notification handler
 *
 * MP sends: ?topic=merchant_order&id=<merchant_order_id>
 * We verify the order status and close the local order if paid.
 */
export async function POST(request: NextRequest) {
	// Always respond 200 immediately — MP retries on non-2xx
	try {
		// Verify webhook signature when secret is configured
		const sigResult = await verifyMpSignature(request);
		if (sigResult === "no_secret") {
			console.error(
				"[webhook/mercadopago] mp_webhook_secret not configured — returning 503 so MP retries",
			);
			return NextResponse.json(
				{ error: "Webhook secret not configured" },
				{ status: 503 },
			);
		}
		if (!sigResult) {
			console.warn("[webhook/mercadopago] Invalid signature — rejected");
			return NextResponse.json({ received: true });
		}
		const url = new URL(request.url);
		const topic = url.searchParams.get("topic");
		const id = url.searchParams.get("id");

		// Also handle the new webhook format (JSON body with topic/resource)
		let resolvedTopic = topic;
		let resolvedId = id;

		if (!resolvedTopic || !resolvedId) {
			try {
				const body = (await request.json()) as {
					topic?: string;
					type?: string;
					data?: { id?: string };
					resource?: string;
				};
				resolvedTopic = body.topic ?? body.type ?? null;
				resolvedId = body.data?.id ?? null;

				// Extract ID from resource URL if present
				if (!resolvedId && body.resource) {
					const match = body.resource.match(/\/(\d+)$/);
					if (match) resolvedId = match[1];
				}
			} catch {
				// Body parse failed — ignore
			}
		}

		if (!resolvedTopic || !resolvedId) {
			return NextResponse.json({ received: true });
		}

		// Only process merchant_order notifications
		if (resolvedTopic !== "merchant_order") {
			return NextResponse.json({ received: true });
		}

		// Fetch the full merchant order from MP to get authoritative status
		const merchantOrder = await getMpMerchantOrder(resolvedId);

		// Only act on "closed" status (fully paid)
		if (merchantOrder.status !== "closed") {
			return NextResponse.json({ received: true });
		}

		const extRef = merchantOrder.external_reference;
		if (!extRef) {
			return NextResponse.json({ received: true });
		}

		// Find our payment record
		const mpPayment = await db.mpPayment.findUnique({
			where: { externalReference: extRef },
		});

		if (!mpPayment || mpPayment.status === "paid") {
			return NextResponse.json({ received: true });
		}

		// Atomic update — prevents race condition from concurrent IPN retries
		const updated = await db.mpPayment.updateMany({
			where: { id: mpPayment.id, status: { not: "paid" } },
			data: {
				status: "paid",
				paidAt: new Date(),
				mpOrderId: String(merchantOrder.id),
			},
		});

		if (updated.count === 0) {
			// Already processed by a concurrent request
			return NextResponse.json({ received: true });
		}

		// Close the orders
		const orderIds = mpPayment.orderId.split(",");
		for (const orderId of orderIds) {
			const order = await db.order.findUnique({ where: { id: orderId } });
			if (!order || order.status === "closed") continue;

			await db.order.update({
				where: { id: orderId },
				data: {
					status: "closed",
					paymentMethod: "mercadopago",
					closedAt: new Date(),
				},
			});

			// Free the table (check if any other open orders exist)
			const otherOpen = await db.order.count({
				where: {
					tableId: order.tableId,
					status: { notIn: ["closed", "cancelled"] },
					id: { not: orderId },
				},
			});

			if (otherOpen === 0) {
				await db.table.update({
					where: { id: order.tableId },
					data: { status: "available" },
				});
			}
		}

		return NextResponse.json({ received: true, processed: true });
	} catch (error) {
		console.error("[webhook/mercadopago]", error);
		// Still return 200 so MP doesn't retry
		return NextResponse.json({ received: true, error: "processing failed" });
	}
}

// MP also does GET as a health check
export async function GET() {
	return NextResponse.json({ status: "ok" });
}
