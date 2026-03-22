import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

async function main() {
	// Zones
	await db.zone.upsert({
		where: { id: "z1" },
		update: {},
		create: { id: "z1", name: "Salón Principal", order: 0 },
	});
	await db.zone.upsert({
		where: { id: "z2" },
		update: {},
		create: { id: "z2", name: "Afuera", order: 1 },
	});

	// Tables
	const tables = [
		{
			id: "t1",
			zoneId: "z1",
			number: 1,
			type: "bar",
			seats: 4,
			x: 80,
			y: 80,
			w: 90,
			h: 60,
		},
		{
			id: "t2",
			zoneId: "z1",
			number: 2,
			type: "bar",
			seats: 6,
			x: 210,
			y: 80,
			w: 90,
			h: 60,
		},
		{
			id: "t3",
			zoneId: "z1",
			number: 3,
			type: "pool",
			seats: 2,
			x: 340,
			y: 60,
			w: 140,
			h: 80,
		},
		{
			id: "t4",
			zoneId: "z1",
			number: 4,
			type: "bar",
			seats: 4,
			x: 80,
			y: 180,
			w: 90,
			h: 60,
		},
		{
			id: "t5",
			zoneId: "z1",
			number: 5,
			type: "pool",
			seats: 2,
			x: 210,
			y: 180,
			w: 140,
			h: 80,
		},
		{
			id: "t6",
			zoneId: "z1",
			number: 6,
			type: "bar",
			seats: 8,
			x: 80,
			y: 280,
			w: 120,
			h: 60,
		},
		{
			id: "t7",
			zoneId: "z1",
			number: 7,
			type: "bar",
			seats: 4,
			x: 250,
			y: 280,
			w: 90,
			h: 60,
		},
		{
			id: "t8",
			zoneId: "z1",
			number: 8,
			type: "bar",
			seats: 4,
			x: 380,
			y: 200,
			w: 90,
			h: 60,
		},
		{
			id: "t9",
			zoneId: "z2",
			number: 9,
			type: "bar",
			seats: 6,
			x: 80,
			y: 80,
			w: 90,
			h: 60,
		},
		{
			id: "t10",
			zoneId: "z2",
			number: 10,
			type: "pool",
			seats: 2,
			x: 210,
			y: 60,
			w: 140,
			h: 80,
		},
		{
			id: "t11",
			zoneId: "z2",
			number: 11,
			type: "bar",
			seats: 4,
			x: 80,
			y: 180,
			w: 90,
			h: 60,
		},
		{
			id: "t12",
			zoneId: "z2",
			number: 12,
			type: "bar",
			seats: 4,
			x: 210,
			y: 180,
			w: 90,
			h: 60,
		},
	];
	for (const t of tables) {
		await db.table.upsert({
			where: { id: t.id },
			update: {},
			create: { ...t, status: "available" },
		});
	}

	// Categories
	const categories = [
		{ id: "c1", name: "Tragos 🍹", icon: "🍹", order: 0 },
		{ id: "c2", name: "Cervezas 🍺", icon: "🍺", order: 1 },
		{ id: "c3", name: "Vinos 🍷", icon: "🍷", order: 2 },
		{ id: "c4", name: "Coctelería 🍸", icon: "🍸", order: 3 },
		{ id: "c5", name: "Comida 🍔", icon: "🍔", order: 4 },
		{ id: "c6", name: "Pool 🎱", icon: "🎱", order: 5 },
		{ id: "c7", name: "Sin Alcohol 🧃", icon: "🧃", order: 6 },
	];
	for (const c of categories) {
		await db.category.upsert({
			where: { id: c.id },
			update: { icon: c.icon },
			create: c,
		});
	}

	// Products
	const products = [
		{
			id: "p1",
			name: "Fernet con Coca",
			categoryId: "c1",
			target: "bar",
			price: 2800,
			description: "Fernet Branca + Coca-Cola",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p2",
			name: "Campari Spritz",
			categoryId: "c1",
			target: "bar",
			price: 3200,
			description: "Campari, Prosecco, soda",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p3",
			name: "Aperol Spritz",
			categoryId: "c1",
			target: "bar",
			price: 3200,
			description: "Aperol, Prosecco, naranja",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p4",
			name: "Gin Tónico",
			categoryId: "c1",
			target: "bar",
			price: 3500,
			description: "Gin Bombay + tónica artesanal",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p5",
			name: "Pinta Quilmes",
			categoryId: "c2",
			target: "bar",
			price: 1800,
			description: "Pinta 500ml",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p6",
			name: "Pinta Andes",
			categoryId: "c2",
			target: "bar",
			price: 1800,
			description: "Pinta 500ml",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p7",
			name: "Schneider Lata",
			categoryId: "c2",
			target: "bar",
			price: 1600,
			description: "473ml",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p8",
			name: "Stella Artois",
			categoryId: "c2",
			target: "bar",
			price: 2000,
			description: "Botella 355ml",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p9",
			name: "Copa de Malbec",
			categoryId: "c3",
			target: "bar",
			price: 2500,
			description: "Rutini Malbec",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p10",
			name: "Copa de Chardonnay",
			categoryId: "c3",
			target: "bar",
			price: 2500,
			description: "Clos de Piedra",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p11",
			name: "Mojito",
			categoryId: "c4",
			target: "bar",
			price: 4200,
			description: "Ron Havana + hierbabuena + lima",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p12",
			name: "Negroni",
			categoryId: "c4",
			target: "bar",
			price: 4500,
			description: "Gin + Campari + Vermut rosso",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p13",
			name: "Old Fashioned",
			categoryId: "c4",
			target: "bar",
			price: 4800,
			description: "Bourbon + bitters + naranja",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p14",
			name: "Nachos c/ Guacamole",
			categoryId: "c5",
			target: "kitchen",
			price: 3800,
			description: "Totopos + guac + pico de gallo",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p15",
			name: "Tabla de Quesos",
			categoryId: "c5",
			target: "kitchen",
			price: 5500,
			description: "4 quesos + frutos secos + dulce",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p16",
			name: "Alitas BBQ",
			categoryId: "c5",
			target: "kitchen",
			price: 4200,
			description: "8 alitas con salsa BBQ casera",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p17",
			name: "Burger My Way",
			categoryId: "c5",
			target: "kitchen",
			price: 5800,
			description: "200g + bacon + cheddar + papas",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p18",
			name: "Ficha de Pool",
			categoryId: "c6",
			target: "bar",
			price: 1200,
			description: "1 partida (30 min)",
			isAvailable: true,
			isPoolChip: true,
		},
		{
			id: "p19",
			name: "Agua s/gas",
			categoryId: "c7",
			target: "bar",
			price: 800,
			description: "Villavicencio 500ml",
			isAvailable: true,
			isPoolChip: false,
		},
		{
			id: "p20",
			name: "Gaseosa",
			categoryId: "c7",
			target: "bar",
			price: 900,
			description: "Coca-Cola / 7Up / Sprite",
			isAvailable: true,
			isPoolChip: false,
		},
	];
	for (const p of products) {
		await db.product.upsert({ where: { id: p.id }, update: {}, create: p });
	}

	// Staff
	const staff = [
		{ id: "s1", name: "Martín García", role: "cashier", avatar: "MG" },
		{ id: "s2", name: "Lucía Fernández", role: "waiter", avatar: "LF" },
		{ id: "s3", name: "Diego López", role: "waiter", avatar: "DL" },
		{ id: "s4", name: "Ana Torres", role: "kitchen", avatar: "AT" },
		{ id: "s5", name: "Carlos Ruiz", role: "bar", avatar: "CR" },
		{ id: "s6", name: "Valentina Paz", role: "admin", avatar: "VP" },
	];
	for (const s of staff) {
		await db.staff.upsert({ where: { id: s.id }, update: {}, create: s });
	}

	// Ingredients
	const ingredients = [
		{
			id: "ing1",
			name: "Fernet Branca",
			unit: "ml",
			stockCurrent: 4800,
			alertThreshold: 1500,
			costPerUnit: 0.025,
		},
		{
			id: "ing2",
			name: "Gin Bombay",
			unit: "ml",
			stockCurrent: 820,
			alertThreshold: 1000,
			costPerUnit: 0.038,
		},
		{
			id: "ing3",
			name: "Ron Havana",
			unit: "ml",
			stockCurrent: 2100,
			alertThreshold: 800,
			costPerUnit: 0.032,
		},
		{
			id: "ing4",
			name: "Aperol",
			unit: "ml",
			stockCurrent: 1650,
			alertThreshold: 600,
			costPerUnit: 0.029,
		},
		{
			id: "ing5",
			name: "Tónica artesanal",
			unit: "ml",
			stockCurrent: 3600,
			alertThreshold: 2000,
			costPerUnit: 0.008,
		},
		{
			id: "ing6",
			name: "Lima",
			unit: "units",
			stockCurrent: 28,
			alertThreshold: 20,
			costPerUnit: 45,
		},
		{
			id: "ing7",
			name: "Hierbabuena",
			unit: "gr",
			stockCurrent: 180,
			alertThreshold: 100,
			costPerUnit: 0.8,
		},
		{
			id: "ing8",
			name: "Pollo (alitas)",
			unit: "gr",
			stockCurrent: 3200,
			alertThreshold: 1000,
			costPerUnit: 0.012,
		},
		{
			id: "ing9",
			name: "Carne vacuna",
			unit: "gr",
			stockCurrent: 1800,
			alertThreshold: 2000,
			costPerUnit: 0.018,
		},
		{
			id: "ing10",
			name: "Quesos selección",
			unit: "gr",
			stockCurrent: 950,
			alertThreshold: 500,
			costPerUnit: 0.022,
		},
	];
	for (const ing of ingredients) {
		await db.ingredient.upsert({
			where: { id: ing.id },
			update: {},
			create: ing,
		});
	}

	console.log("Seed completed successfully");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
