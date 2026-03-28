import { db } from "./db";

/** Cached MP settings to avoid re-reading DB on every request */
let cachedSettings: MpSettings | null = null;
let cacheTs = 0;
const CACHE_TTL = 60_000; // 1 min

export interface MpSettings {
	accessToken: string;
	userId: string;
	externalPosId: string;
}

export async function getMpSettings(): Promise<MpSettings | null> {
	if (cachedSettings && Date.now() - cacheTs < CACHE_TTL) return cachedSettings;

	const rows = await db.setting.findMany({
		where: {
			key: { in: ["mp_access_token", "mp_user_id", "mp_external_pos_id"] },
		},
	});

	const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
	const accessToken = map.mp_access_token;
	const userId = map.mp_user_id;
	const externalPosId = map.mp_external_pos_id;

	if (!accessToken || !userId || !externalPosId) return null;

	cachedSettings = { accessToken, userId, externalPosId };
	cacheTs = Date.now();
	return cachedSettings;
}

export function clearMpSettingsCache() {
	cachedSettings = null;
	cacheTs = 0;
}

interface MpQrItem {
	sku_number: string;
	category: string;
	title: string;
	unit_price: number;
	quantity: number;
	unit_measure: string;
	total_amount: number;
}

interface CreateQrParams {
	externalReference: string;
	title: string;
	description: string;
	totalAmount: number;
	items: MpQrItem[];
	notificationUrl: string;
}

interface MpQrResponse {
	in_store_order_id: string;
	qr_data: string;
}

export async function createMpQr(
	params: CreateQrParams,
): Promise<MpQrResponse> {
	const settings = await getMpSettings();
	if (!settings) throw new Error("MercadoPago no está configurado");

	const { userId, externalPosId, accessToken } = settings;
	const url = `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${userId}/pos/${externalPosId}/qrs`;

	const res = await fetch(url, {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			external_reference: params.externalReference,
			title: params.title,
			description: params.description,
			notification_url: params.notificationUrl,
			total_amount: params.totalAmount,
			items: params.items,
		}),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`MercadoPago API error ${res.status}: ${body}`);
	}

	return (await res.json()) as MpQrResponse;
}

// ─── Point Integration API (posnet / terminal) ─────────────────────────────

export async function listPointDevices(): Promise<
	{ id: string; pos_id: number; operating_mode: string; name: string }[]
> {
	const settings = await getMpSettings();
	if (!settings) throw new Error("MercadoPago no está configurado");

	const res = await fetch(
		"https://api.mercadopago.com/point/integration-api/devices",
		{
			signal: AbortSignal.timeout(8000),
			headers: { Authorization: `Bearer ${settings.accessToken}` },
		},
	);
	if (!res.ok) throw new Error("Error al listar dispositivos Point");
	const data = (await res.json()) as {
		devices: {
			id: string;
			pos_id: number;
			operating_mode: string;
			name: string;
		}[];
	};
	return data.devices ?? [];
}

export interface PointPaymentIntent {
	id: string;
	device_id: string;
	amount: number;
	state:
		| "OPEN"
		| "ON_TERMINAL"
		| "PROCESSING"
		| "PROCESSED"
		| "CANCELED"
		| "ERROR"
		| "FINISHED";
	payment?: { id: number; type: string; installments: number };
	payment_intent_id?: string;
}

export async function createPointPaymentIntent(
	deviceId: string,
	amount: number,
	externalReference: string,
	description: string,
): Promise<PointPaymentIntent> {
	const settings = await getMpSettings();
	if (!settings) throw new Error("MercadoPago no está configurado");

	const res = await fetch(
		`https://api.mercadopago.com/point/integration-api/devices/${encodeURIComponent(deviceId)}/payment-intents`,
		{
			method: "POST",
			signal: AbortSignal.timeout(10000),
			headers: {
				Authorization: `Bearer ${settings.accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				amount,
				additional_info: {
					external_reference: externalReference,
					print_on_terminal: true,
				},
				description,
			}),
		},
	);

	if (!res.ok) {
		const body = await res.text();
		console.error(`[MP Point create] ${res.status}: ${body}`);
		throw new Error("Error al crear intento de pago en el terminal");
	}

	return (await res.json()) as PointPaymentIntent;
}

export async function getPointPaymentIntent(
	intentId: string,
): Promise<PointPaymentIntent> {
	const settings = await getMpSettings();
	if (!settings) throw new Error("MercadoPago no está configurado");

	const res = await fetch(
		`https://api.mercadopago.com/point/integration-api/payment-intents/${encodeURIComponent(intentId)}`,
		{
			signal: AbortSignal.timeout(8000),
			headers: { Authorization: `Bearer ${settings.accessToken}` },
		},
	);
	if (!res.ok) throw new Error("Error al consultar estado del terminal");
	return (await res.json()) as PointPaymentIntent;
}

export async function cancelPointPaymentIntent(
	deviceId: string,
	intentId: string,
): Promise<void> {
	const settings = await getMpSettings();
	if (!settings) throw new Error("MercadoPago no está configurado");

	const res = await fetch(
		`https://api.mercadopago.com/point/integration-api/devices/${encodeURIComponent(deviceId)}/payment-intents/${encodeURIComponent(intentId)}`,
		{
			method: "DELETE",
			signal: AbortSignal.timeout(8000),
			headers: { Authorization: `Bearer ${settings.accessToken}` },
		},
	);
	if (!res.ok && res.status !== 404) {
		throw new Error("Error al cancelar intento de pago");
	}
}

export async function getMpMerchantOrder(
	merchantOrderId: string,
): Promise<{ status: string; external_reference: string; id: number }> {
	const settings = await getMpSettings();
	if (!settings) throw new Error("MercadoPago no está configurado");

	const res = await fetch(
		`https://api.mercadopago.com/merchant_orders/${merchantOrderId}`,
		{
			headers: { Authorization: `Bearer ${settings.accessToken}` },
		},
	);

	if (!res.ok) throw new Error(`MP merchant_orders error ${res.status}`);
	return (await res.json()) as {
		status: string;
		external_reference: string;
		id: number;
	};
}
