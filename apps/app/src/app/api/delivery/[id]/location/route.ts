import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaffRole } from "@/lib/auth-check";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await requireStaffRole(request, [
		"admin",
		"manager",
		"repartidor",
	]);
	if (!auth.ok) return auth.response;

	try {
		const { id } = await params;
		const body = (await request.json()) as { lat: number; lng: number };
		const { lat, lng } = body;

		if (typeof lat !== "number" || typeof lng !== "number") {
			return NextResponse.json(
				{ error: "lat and lng must be numbers" },
				{ status: 400 },
			);
		}

		await db.deliveryOrder.update({
			where: { id },
			data: {
				repartidorLat: lat,
				repartidorLng: lng,
				repartidorUpdatedAt: new Date(),
			},
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[location PATCH]", error);
		return NextResponse.json(
			{ error: "Failed to update location" },
			{ status: 500 },
		);
	}
}
