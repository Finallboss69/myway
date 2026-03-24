import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const from = searchParams.get("from");
		const to = searchParams.get("to");
		const limit = parseInt(searchParams.get("limit") || "30");

		const where: Record<string, unknown> = {};
		if (from || to) {
			where.date = {};
			if (from) (where.date as Record<string, unknown>).gte = new Date(from);
			if (to) (where.date as Record<string, unknown>).lte = new Date(to);
		}

		const reports = await db.dailyReport.findMany({
			where,
			orderBy: { date: "desc" },
			take: limit,
		});
		return NextResponse.json(reports);
	} catch (e) {
		console.error("[daily-reports GET]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}

// POST /api/daily-reports/generate — generate report for a date
export async function POST(req: Request) {
	try {
		const { date: dateStr } = await req.json();
		if (!dateStr || isNaN(new Date(dateStr).getTime())) {
			return NextResponse.json(
				{ error: "valid date required" },
				{ status: 400 },
			);
		}
		const date = new Date(dateStr);
		const start = new Date(date);
		start.setHours(0, 0, 0, 0);
		const end = new Date(date);
		end.setHours(23, 59, 59, 999);

		// Get orders for the day
		const orders = await db.order.findMany({
			where: { createdAt: { gte: start, lte: end }, status: "closed" },
			include: { items: true },
		});
		const deliveryOrders = await db.deliveryOrder.findMany({
			where: {
				createdAt: { gte: start, lte: end },
				status: "delivered",
			},
			include: { items: true },
		});

		const orderRevenue = orders.reduce(
			(s, o) => s + o.items.reduce((si, i) => si + i.price * i.qty, 0),
			0,
		);
		const deliveryRevenue = deliveryOrders.reduce((s, o) => s + o.total, 0);
		const totalRevenue = orderRevenue + deliveryRevenue;

		// Get expenses for the day
		const expenses = await db.expense.findMany({
			where: { date: { gte: start, lte: end } },
		});
		const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

		// Calculate cost from recipes
		const productIds = [
			...orders.flatMap((o) => o.items.map((i) => i.productId)),
		];
		const recipes = await db.recipeIngredient.findMany({
			where: { productId: { in: productIds } },
			include: { ingredient: true },
		});
		const costMap = new Map<string, number>();
		for (const r of recipes) {
			costMap.set(
				r.productId,
				(costMap.get(r.productId) || 0) + r.quantity * r.ingredient.costPerUnit,
			);
		}
		const totalCost = orders.reduce(
			(s, o) =>
				s +
				o.items.reduce(
					(si, i) => si + (costMap.get(i.productId) || 0) * i.qty,
					0,
				),
			0,
		);

		// Top products
		const productCount = new Map<string, number>();
		for (const o of orders) {
			for (const i of o.items) {
				productCount.set(i.name, (productCount.get(i.name) || 0) + i.qty);
			}
		}
		const topProducts = [...productCount.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([name, qty]) => ({ name, qty }));

		// Payment breakdown
		const payBreakdown: Record<string, number> = {};
		for (const o of orders) {
			const m = o.paymentMethod || "sin_definir";
			payBreakdown[m] =
				(payBreakdown[m] || 0) +
				o.items.reduce((s, i) => s + i.price * i.qty, 0);
		}

		const grossProfit = totalRevenue - totalCost;
		const netProfit = grossProfit - totalExpenses;
		const avgTicket =
			orders.length > 0
				? totalRevenue / (orders.length + deliveryOrders.length)
				: 0;

		const report = await db.dailyReport.upsert({
			where: { date: start },
			create: {
				date: start,
				totalRevenue,
				totalCost,
				totalExpenses,
				grossProfit,
				netProfit,
				ordersCount: orders.length,
				deliveryCount: deliveryOrders.length,
				avgTicket,
				topProducts: JSON.stringify(topProducts),
				paymentBreakdown: JSON.stringify(payBreakdown),
			},
			update: {
				totalRevenue,
				totalCost,
				totalExpenses,
				grossProfit,
				netProfit,
				ordersCount: orders.length,
				deliveryCount: deliveryOrders.length,
				avgTicket,
				topProducts: JSON.stringify(topProducts),
				paymentBreakdown: JSON.stringify(payBreakdown),
			},
		});

		return NextResponse.json(report);
	} catch (e) {
		console.error("[daily-reports POST]", e);
		return NextResponse.json({ error: "Operation failed" }, { status: 500 });
	}
}
