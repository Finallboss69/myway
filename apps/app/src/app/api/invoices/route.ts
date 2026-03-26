import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

const STAFF_ROLES = ["admin", "manager", "cashier"];

export async function GET(req: NextRequest) {
	const auth = await requireStaffRole(req, STAFF_ROLES);
	if (!auth.ok) return auth.response;

	try {
		const { searchParams } = new URL(req.url);
		const status = searchParams.get("status");
		const type = searchParams.get("type");
		const from = searchParams.get("from");
		const to = searchParams.get("to");

		const where: Record<string, unknown> = {};
		if (status) where.status = status;
		if (type) where.type = type;
		if (from || to) {
			where.createdAt = {};
			if (from)
				(where.createdAt as Record<string, unknown>).gte = new Date(from);
			if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
		}

		const invoices = await db.invoice.findMany({
			where,
			orderBy: { createdAt: "desc" },
			include: { items: true },
		});
		return NextResponse.json(invoices);
	} catch (e) {
		console.error("[invoices GET]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}

export async function POST(req: NextRequest) {
	const authPost = await requireStaffRole(req, STAFF_ROLES);
	if (!authPost.ok) return authPost.response;

	try {
		const body = await req.json();
		const { type, customerCuit, customerName, items } = body;

		if (!type || !items?.length) {
			return NextResponse.json(
				{ error: "type and items required" },
				{ status: 400 },
			);
		}

		// Calculate totals
		let subtotal = 0;
		let iva21 = 0;
		let iva105 = 0;
		for (const item of items) {
			subtotal += item.subtotal;
			if (item.ivaRate === 21) iva21 += item.subtotal * 0.21;
			else if (item.ivaRate === 10.5) iva105 += item.subtotal * 0.105;
		}
		const total = subtotal + iva21 + iva105;

		// Use transaction to prevent duplicate invoice numbers
		const invoice = await db.$transaction(async (tx) => {
			// Get AFIP config for punto de venta
			const config = await tx.afipConfig.findUnique({
				where: { id: "singleton" },
			});
			const puntoVenta = config?.puntoVenta ?? 1;

			// Calculate next invoice number atomically within transaction
			const lastInvoice = await tx.invoice.findFirst({
				where: { type, puntoVenta },
				orderBy: { number: "desc" },
			});
			const nextNumber = (lastInvoice?.number ?? 0) + 1;

			return tx.invoice.create({
				data: {
					number: nextNumber,
					type,
					puntoVenta,
					customerCuit: customerCuit || null,
					customerName: customerName || null,
					subtotal,
					iva21,
					iva105,
					total,
					status: "draft",
					items: {
						create: items.map(
							(it: {
								description: string;
								quantity: number;
								unitPrice: number;
								ivaRate?: number;
								subtotal: number;
							}) => ({
								description: it.description,
								quantity: it.quantity,
								unitPrice: it.unitPrice,
								ivaRate: it.ivaRate ?? 21,
								subtotal: it.subtotal,
							}),
						),
					},
				},
				include: { items: true },
			});
		});

		return NextResponse.json(invoice, { status: 201 });
	} catch (e) {
		console.error("[invoices POST]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
