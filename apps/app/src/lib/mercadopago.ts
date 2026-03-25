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
