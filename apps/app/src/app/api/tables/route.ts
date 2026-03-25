import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const tables = await db.table.findMany({
			include: { zone: true },
			orderBy: { number: "asc" },
		});
		return NextResponse.json(tables);
	} catch (error) {
		console.error("[tables GET]", error);
		return NextResponse.json(
			{ error: "Failed to fetch tables" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			number: number;
			zoneId: string;
			seats?: number;
			type?: string;
			x?: number;
			y?: number;
			w?: number;
			h?: number;
			shape?: string;
			rotation?: number;
		};
		const {
			number,
			zoneId,
			seats = 4,
			type = "bar",
			x,
			y,
			w,
			h,
			shape = "square",
			rotation = 0,
		} = body;

		if (!number || !zoneId) {
			return NextResponse.json(
				{ error: "number and zoneId are required" },
				{ status: 400 },
			);
		}

		const table = await db.table.create({
			data: {
				number,
				zoneId,
				seats,
				type,
				shape,
				rotation,
				...(x !== undefined && { x }),
				...(y !== undefined && { y }),
				...(w !== undefined && { w }),
				...(h !== undefined && { h }),
			},
			include: { zone: true },
		});
		return NextResponse.json(table, { status: 201 });
	} catch (error) {
		console.error("[tables POST]", error);
		return NextResponse.json(
			{ error: "Failed to create table" },
			{ status: 500 },
		);
	}
}
