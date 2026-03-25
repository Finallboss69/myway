import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const supplierId = searchParams.get("supplierId");
		const status = searchParams.get("status");
		const where: Record<string, unknown> = {};
		if (supplierId) where.supplierId = supplierId;
		if (status) where.status = status;

		const invoices = await db.supplierInvoice.findMany({
			where,
			orderBy: { date: "desc" },
			include: { supplier: true, items: true },
		});
		return NextResponse.json(invoices);
	} catch (e) {
		console.error("[supplier-invoices GET]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const {
			supplierId,
			number,
			date,
			dueDate,
			subtotal,
			iva,
			iibb,
			otherTaxes,
			total,
			photoUrl,
			notes,
			items,
		} = body;
		if (!supplierId || !number || !date || total == null) {
			return NextResponse.json(
				{ error: "supplierId, number, date, total required" },
				{ status: 400 },
			);
		}
		const invoice = await db.supplierInvoice.create({
			data: {
				supplierId,
				number,
				date: new Date(date),
				dueDate: dueDate ? new Date(dueDate) : null,
				subtotal: subtotal ?? 0,
				iva: iva ?? 0,
				iibb: iibb ?? 0,
				otherTaxes: otherTaxes ?? 0,
				total,
				photoUrl: photoUrl || null,
				notes: notes || null,
				items: items?.length
					? {
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
						}
					: undefined,
			},
			include: { items: true, supplier: true },
		});
		return NextResponse.json(invoice, { status: 201 });
	} catch (e) {
		console.error("[supplier-invoices POST]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
