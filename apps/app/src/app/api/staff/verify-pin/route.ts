import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
	const body = (await req.json()) as { pin?: string };
	const { pin } = body;
	if (!pin)
		return NextResponse.json({ error: "PIN required" }, { status: 400 });

	try {
		const staff = await db.staff.findFirst({ where: { pin } });
		if (!staff)
			return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });

		return NextResponse.json({
			id: staff.id,
			name: staff.name,
			role: staff.role,
			avatar: staff.avatar,
		});
	} catch (error) {
		console.error("[staff verify-pin]", error);
		return NextResponse.json(
			{ error: "Error al verificar PIN" },
			{ status: 500 },
		);
	}
}
