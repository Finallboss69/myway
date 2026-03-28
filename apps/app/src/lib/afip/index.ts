/**
 * AFIP WSFE Service Module
 *
 * Handles electronic invoicing via AFIP's Web Service de Facturación Electrónica.
 * Uses @afipsdk/afip.js when available, otherwise operates in mock/draft mode.
 *
 * Architecture:
 * - AfipService: main class, wraps SDK calls
 * - getAfipService(): singleton factory, reads config from DB
 * - createElectronicInvoice(): high-level function for creating authorized invoices
 */

import { db } from "@/lib/db";

// Types
export interface AfipInvoiceData {
	type: "A" | "B" | "C";
	puntoVenta: number;
	customerCuit?: string;
	customerName?: string;
	items: {
		description: string;
		quantity: number;
		unitPrice: number;
		ivaRate: number;
		subtotal: number;
	}[];
}

export interface AfipInvoiceResult {
	success: boolean;
	cae?: string;
	caeExpiry?: string;
	invoiceNumber?: number;
	error?: string;
	afipResponse?: unknown;
}

// Invoice type codes for AFIP
const INVOICE_TYPE_CODES: Record<string, number> = {
	A: 1,
	B: 6,
	C: 11,
};

// IVA condition codes
const IVA_CONDITION_CODES: Record<number, number> = {
	21: 5, // 21%
	10.5: 4, // 10.5%
	27: 6, // 27%
	0: 3, // 0%
};

export class AfipService {
	private afipSdk: unknown = null;
	private config: {
		cuit: string;
		certPem: string | null;
		keyPem: string | null;
		environment: string;
		puntoVenta: number;
		taxRegime: string;
	};

	constructor(config: typeof AfipService.prototype.config) {
		this.config = config;
	}

	async initialize(): Promise<boolean> {
		if (!this.config.cuit || !this.config.certPem || !this.config.keyPem) {
			return false;
		}

		try {
			// Dynamic import — package may not be installed
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let AfipModule: any;
			try {
				AfipModule = await Function('return import("@afipsdk/afip.js")')();
			} catch {
				console.warn("@afipsdk/afip.js not installed — running in draft mode");
				return false;
			}

			const Afip = AfipModule.default || AfipModule;
			this.afipSdk = new Afip({
				CUIT: this.config.cuit,
				cert: this.config.certPem,
				key: this.config.keyPem,
				production: this.config.environment === "production",
			});
			return true;
		} catch (e) {
			console.error("AFIP SDK init failed:", e);
			return false;
		}
	}

	async getLastInvoiceNumber(
		puntoVenta: number,
		invoiceType: string,
	): Promise<number> {
		if (!this.afipSdk) return 0;
		try {
			const sdk = this.afipSdk as {
				ElectronicBilling: {
					getLastVoucher: (pv: number, type: number) => Promise<number>;
				};
			};
			const typeCode = INVOICE_TYPE_CODES[invoiceType] ?? 6;
			return await sdk.ElectronicBilling.getLastVoucher(puntoVenta, typeCode);
		} catch {
			return 0;
		}
	}

	async createInvoice(data: AfipInvoiceData): Promise<AfipInvoiceResult> {
		const typeCode = INVOICE_TYPE_CODES[data.type] ?? 6;

		// Calculate totals per IVA rate
		let neto = 0;
		let iva21 = 0;
		let iva105 = 0;
		let neto21 = 0;
		let neto105 = 0;
		const ivaArray: { Id: number; BaseImp: number; Importe: number }[] = [];

		for (const item of data.items) {
			neto += item.subtotal;
			const ivaAmount = item.subtotal * (item.ivaRate / 100);
			if (item.ivaRate === 21) {
				iva21 += ivaAmount;
				neto21 += item.subtotal;
			} else if (item.ivaRate === 10.5) {
				iva105 += ivaAmount;
				neto105 += item.subtotal;
			}
		}

		if (iva21 > 0) {
			ivaArray.push({
				Id: IVA_CONDITION_CODES[21],
				BaseImp: Math.round(neto21 * 100) / 100,
				Importe: Math.round(iva21 * 100) / 100,
			});
		}
		if (iva105 > 0) {
			ivaArray.push({
				Id: IVA_CONDITION_CODES[10.5],
				BaseImp: Math.round(neto105 * 100) / 100,
				Importe: Math.round(iva105 * 100) / 100,
			});
		}

		const total = neto + iva21 + iva105;

		if (!this.afipSdk) {
			// Draft mode — no AFIP connection
			return {
				success: false,
				error: "AFIP SDK not configured — invoice saved as draft",
			};
		}

		try {
			const sdk = this.afipSdk as {
				ElectronicBilling: {
					getLastVoucher: (pv: number, type: number) => Promise<number>;
					createVoucher: (data: Record<string, unknown>) => Promise<{
						CAE: string;
						CAEFchVto: string;
						CbteDesde: number;
					}>;
				};
			};

			const lastNumber = await sdk.ElectronicBilling.getLastVoucher(
				data.puntoVenta,
				typeCode,
			);
			const nextNumber = lastNumber + 1;

			const today = new Date();
			const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

			const voucherData: Record<string, unknown> = {
				CantReg: 1,
				PtoVta: data.puntoVenta,
				CbteTipo: typeCode,
				Concepto: 1, // Productos
				DocTipo: data.customerCuit ? 80 : 99, // CUIT or Consumidor Final
				DocNro: data.customerCuit
					? parseInt(data.customerCuit.replace(/-/g, ""))
					: 0,
				CbteDesde: nextNumber,
				CbteHasta: nextNumber,
				CbteFch: dateStr,
				ImpTotal: Math.round(total * 100) / 100,
				ImpTotConc: 0,
				ImpNeto: Math.round(neto * 100) / 100,
				ImpOpEx: 0,
				ImpIVA: Math.round((iva21 + iva105) * 100) / 100,
				ImpTrib: 0,
				MonId: "PES",
				MonCotiz: 1,
			};

			// Type C (monotributo) doesn't include IVA breakdown
			if (data.type !== "C" && ivaArray.length > 0) {
				voucherData.Iva = ivaArray;
			}

			const result = await sdk.ElectronicBilling.createVoucher(voucherData);

			return {
				success: true,
				cae: result.CAE,
				caeExpiry: result.CAEFchVto,
				invoiceNumber: result.CbteDesde,
				afipResponse: result,
			};
		} catch (e) {
			return {
				success: false,
				error: String(e),
			};
		}
	}
}

/**
 * Get or create the AFIP service singleton, configured from DB
 */
let _service: AfipService | null = null;

export async function getAfipService(): Promise<AfipService> {
	if (_service) return _service;

	let config = await db.afipConfig.findUnique({ where: { id: "singleton" } });
	if (!config) {
		config = await db.afipConfig.create({ data: { id: "singleton" } });
	}

	_service = new AfipService({
		cuit: config.cuit,
		certPem: config.certPem,
		keyPem: config.keyPem,
		environment: config.environment,
		puntoVenta: config.puntoVenta,
		taxRegime: config.taxRegime,
	});

	await _service.initialize();
	return _service;
}

/** Reset service (call after config update) */
export function resetAfipService(): void {
	_service = null;
}

/**
 * High-level: create an electronic invoice, save to DB, attempt AFIP authorization
 */
export async function createElectronicInvoice(
	data: AfipInvoiceData,
	orderId?: string,
	existingInvoiceId?: string,
): Promise<{ invoice: unknown; afipResult: AfipInvoiceResult }> {
	const service = await getAfipService();
	const config = await db.afipConfig.findUnique({ where: { id: "singleton" } });
	const puntoVenta = config?.puntoVenta ?? 1;

	// Get next local number
	const lastInvoice = await db.invoice.findFirst({
		where: { type: data.type, puntoVenta },
		orderBy: { number: "desc" },
	});
	const nextNumber = (lastInvoice?.number ?? 0) + 1;

	// Calculate totals
	let subtotal = 0;
	let iva21 = 0;
	let iva105 = 0;
	for (const item of data.items) {
		subtotal += item.subtotal;
		if (item.ivaRate === 21) iva21 += item.subtotal * 0.21;
		else if (item.ivaRate === 10.5) iva105 += item.subtotal * 0.105;
	}

	// Attempt AFIP authorization
	const afipResult = await service.createInvoice({
		...data,
		puntoVenta,
	});

	// Save to DB — update existing invoice or create new one
	const invoiceData = {
		orderId: orderId || null,
		number: afipResult.invoiceNumber ?? nextNumber,
		type: data.type,
		puntoVenta,
		cae: afipResult.cae || null,
		caeExpiry: afipResult.caeExpiry
			? new Date(
					afipResult.caeExpiry.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
				)
			: null,
		customerCuit: data.customerCuit || null,
		customerName: data.customerName || null,
		subtotal,
		iva21,
		iva105,
		total: subtotal + iva21 + iva105,
		afipResponse: afipResult.afipResponse
			? JSON.stringify(afipResult.afipResponse)
			: null,
		status: afipResult.success ? "authorized" : "draft",
	};

	let invoice;
	if (existingInvoiceId) {
		invoice = await db.invoice.update({
			where: { id: existingInvoiceId },
			data: invoiceData,
			include: { items: true },
		});
	} else {
		invoice = await db.invoice.create({
			data: {
				...invoiceData,
				items: {
					create: data.items.map((it) => ({
						description: it.description,
						quantity: it.quantity,
						unitPrice: it.unitPrice,
						ivaRate: it.ivaRate,
						subtotal: it.subtotal,
					})),
				},
			},
			include: { items: true },
		});
	}

	return { invoice, afipResult };
}
