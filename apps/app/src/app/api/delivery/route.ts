import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── Constants ───────────────────────────────────────────────────────────────

const VALID_PAYMENT_METHODS = [
	"efectivo",
	"transferencia",
	"mercadopago",
	"card",
	"cash",
] as const;

// ─── Operating Hours Check ───────────────────────────────────────────────────

function isWithinOperatingHours(): boolean {
	if (process.env.SKIP_HOURS_CHECK === "true") return true;

	const now = new Date(
		new Date().toLocaleString("en-US", {
			timeZone: "America/Argentina/Buenos_Aires",
		}),
	);
	const day = now.getDay(); // 0=Sun, 1=Mon, 2=Tue ... 6=Sat
	const hour = now.getHours();
	const minutes = now.getMinutes();
	const currentMinutes = hour * 60 + minutes;

	// Closed on Monday (day === 1)
	if (day === 1) return false;

	// Open: 19:00 - 03:00 next day
	// That means: 19:00 (1140 min) to 23:59 OR 00:00 to 03:00 (180 min)
	const openAt = 19 * 60; // 1140
	const closeAt = 3 * 60; // 180

	return currentMinutes >= openAt || currentMinutes < closeAt;
}

// ─── Input Validation ────────────────────────────────────────────────────────

interface ClientItem {
	productId?: string;
	name?: string;
	qty: number;
	price?: number;
}

function validateDeliveryInput(body: Record<string, unknown>): string | null {
	const { customerName, address, phone, paymentMethod, items } = body;

	if (
		!customerName ||
		typeof customerName !== "string" ||
		!String(customerName).trim()
	) {
		return "customerName es requerido";
	}
	if (!address || typeof address !== "string" || !String(address).trim()) {
		return "address es requerido";
	}
	if (!phone || typeof phone !== "string" || !String(phone).trim()) {
		return "phone es requerido";
	}
	if (
		!paymentMethod ||
		typeof paymentMethod !== "string" ||
		!VALID_PAYMENT_METHODS.includes(
			paymentMethod as (typeof VALID_PAYMENT_METHODS)[number],
		)
	) {
		return `paymentMethod debe ser uno de: ${VALID_PAYMENT_METHODS.join(", ")}`;
	}
	if (!Array.isArray(items) || items.length === 0) {
		return "items debe ser un array no vacío";
	}
	for (let i = 0; i < items.length; i++) {
		const item = items[i] as Record<string, unknown>;
		const hasProductId = item.productId && typeof item.productId === "string";
		const hasName = item.name && typeof item.name === "string";
		if (!hasProductId && !hasName) {
			return `items[${i}] debe tener productId o name`;
		}
		if (
			typeof item.qty !== "number" ||
			!Number.isInteger(item.qty) ||
			item.qty < 1
		) {
			return `items[${i}].qty debe ser un entero positivo`;
		}
	}

	return null;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");

		const orders = await db.deliveryOrder.findMany({
			where: status ? { status } : undefined,
			include: { items: true },
			orderBy: { createdAt: "desc" },
		});
		return NextResponse.json({ orders });
	} catch (error) {
		console.error("[delivery GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch delivery orders" },
			{ status: 500 },
		);
	}
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
	try {
		// Parse body
		const body = (await request.json()) as Record<string, unknown>;

		// Operating hours check
		if (!isWithinOperatingHours()) {
			return NextResponse.json(
				{ error: "Estamos cerrados. Horario: Mar-Dom 19:00 a 03:00" },
				{ status: 400 },
			);
		}

		// Validate input
		const validationError = validateDeliveryInput(body);
		if (validationError) {
			return NextResponse.json({ error: validationError }, { status: 400 });
		}

		const customerName = String(body.customerName).trim();
		const address = String(body.address).trim();
		const phone = String(body.phone).trim();
		const paymentMethod = String(body.paymentMethod);
		const notes = body.notes ? String(body.notes).trim() : null;
		const userId = body.userId ? String(body.userId) : null;
		const clientItems = body.items as ClientItem[];

		// ─── Server-side price lookup & total calculation ─────────────────
		const resolvedItems: { name: string; qty: number; price: number }[] = [];
		let serverTotal = 0;

		for (const item of clientItems) {
			let itemName = item.name ?? "Unknown";
			let itemPrice: number;

			if (item.productId) {
				// Look up actual price from database
				const product = await db.product.findUnique({
					where: { id: item.productId },
				});
				if (!product) {
					return NextResponse.json(
						{ error: `Producto no encontrado: ${item.productId}` },
						{ status: 400 },
					);
				}
				if (!product.isAvailable) {
					return NextResponse.json(
						{
							error: `Producto no disponible: ${product.name}`,
						},
						{ status: 400 },
					);
				}
				itemName = product.name;
				itemPrice = product.price;
			} else {
				// Reject items without productId — never trust client prices
				return NextResponse.json(
					{ error: `Producto "${itemName}" requiere productId válido` },
					{ status: 400 },
				);
			}

			resolvedItems.push({
				name: itemName,
				qty: item.qty,
				price: itemPrice,
			});
			serverTotal += itemPrice * item.qty;
		}

		// Create order with server-calculated total
		const order = await db.deliveryOrder.create({
			data: {
				customerName,
				address,
				phone,
				total: serverTotal,
				paymentMethod,
				notes,
				userId,
				items: {
					create: resolvedItems.map((item) => ({
						name: item.name,
						qty: item.qty,
						price: item.price,
					})),
				},
			},
			include: { items: true },
		});
		return NextResponse.json(order, { status: 201 });
	} catch (error) {
		console.error("[delivery POST]", error);
		return NextResponse.json(
			{ error: "Failed to create delivery order" },
			{ status: 500 },
		);
	}
}
