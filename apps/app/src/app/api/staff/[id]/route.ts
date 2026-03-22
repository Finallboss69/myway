import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const member = await db.staff.update({ where: { id }, data: body });
		return NextResponse.json(member);
	} catch (error) {
		console.error("[staff/[id] PATCH]", error);
		return NextResponse.json(
			{ error: "Failed to update staff" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		await db.staff.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[staff/[id] DELETE]", error);
		return NextResponse.json(
			{ error: "Failed to delete staff" },
			{ status: 500 },
		);
	}
}
