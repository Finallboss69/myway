import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
	// eslint-disable-next-line no-var
	var _prisma: PrismaClient | undefined;
}

function createPrismaClient() {
	// Use transaction-mode pooler (port 6543) for better connection handling
	const connStr = (process.env.DATABASE_URL ?? "").replace(/:5432\b/, ":6543");
	const adapter = new PrismaPg({ connectionString: connStr });
	return new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});
}

export const db = globalThis._prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis._prisma = db;
