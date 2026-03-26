import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";
import { resetAfipService } from "@/lib/afip";

export async function GET(request: NextRequest) {
	const auth = await requireStaffRole(request, ["admin", "manager"]);
	if (!auth.ok) return auth.response;

	try {
		let config = await db.afipConfig.findUnique({ where: { id: "singleton" } });
		if (!config) {
			config = await db.afipConfig.create({ data: { id: "singleton" } });
		}
		// Strip sensitive cert data from response
		return NextResponse.json({
			...config,
			certPem: config.certPem ? "***configured***" : null,
			keyPem: config.keyPem ? "***configured***" : null,
		});
	} catch (e) {
		console.error("[afip-config GET]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}

export async function PUT(req: NextRequest) {
	const authPut = await requireStaffRole(req, ["admin"]);
	if (!authPut.ok) return authPut.response;

	try {
		const body = await req.json();
		const {
			cuit,
			razonSocial,
			taxRegime,
			puntoVenta,
			certPem,
			keyPem,
			environment,
			autoInvoiceMP,
			autoInvoiceCash,
			autoInvoiceCard,
		} = body;

		const data: Record<string, unknown> = {};
		if (cuit !== undefined) data.cuit = cuit;
		if (razonSocial !== undefined) data.razonSocial = razonSocial;
		if (taxRegime !== undefined) data.taxRegime = taxRegime;
		if (puntoVenta !== undefined) data.puntoVenta = puntoVenta;
		if (certPem !== undefined) data.certPem = certPem;
		if (keyPem !== undefined) data.keyPem = keyPem;
		if (environment !== undefined) data.environment = environment;
		if (autoInvoiceMP !== undefined) data.autoInvoiceMP = autoInvoiceMP;
		if (autoInvoiceCash !== undefined) data.autoInvoiceCash = autoInvoiceCash;
		if (autoInvoiceCard !== undefined) data.autoInvoiceCard = autoInvoiceCard;

		const config = await db.afipConfig.upsert({
			where: { id: "singleton" },
			update: data,
			create: { id: "singleton", ...data },
		});

		// Invalidate AFIP service singleton so it picks up new config
		resetAfipService();

		return NextResponse.json({
			...config,
			certPem: config.certPem ? "***configured***" : null,
			keyPem: config.keyPem ? "***configured***" : null,
		});
	} catch (e) {
		console.error("[afip-config PUT]", e);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
