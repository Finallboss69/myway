import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const staff = await db.staff.findMany({
			omit: { pin: true },
		});
		return NextResponse.json(staff);
	} catch (error) {
		console.error("[staff GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch staff" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			name: string;
			role: string;
			avatar: string;
			pin?: string;
		};
		if (!body.name || !body.role || !body.avatar) {
			return NextResponse.json(
				{ error: "name, role, avatar required" },
				{ status: 400 },
			);
		}
		const member = await db.staff.create({
			data: {
				name: body.name,
				role: body.role,
				avatar: body.avatar,
				pin: body.pin ?? String(Math.floor(1000 + Math.random() * 9000)),
			},
			omit: { pin: true },
		});
		return NextResponse.json(member, { status: 201 });
	} catch (error) {
		console.error("[staff POST]", error);
		return NextResponse.json(
			{ error: "Failed to create staff" },
			{ status: 500 },
		);
	}
}
