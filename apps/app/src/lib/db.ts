import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
	// eslint-disable-next-line no-var
	var _prisma: PrismaClient | undefined;
}

function createPrismaClient() {
	// Use transaction-mode pooler (port 6543) for better connection handling
	const rawUrl = process.env.DATABASE_URL ?? "";
	const connStr = rawUrl.replace(/:5432\b/, ":6543");
	if (
		process.env.NODE_ENV === "development" &&
		connStr === rawUrl &&
		!rawUrl.includes(":6543")
	) {
		console.warn(
			"[db] DATABASE_URL does not contain :5432 — transaction-mode rewrite did not apply",
		);
	}
	const adapter = new PrismaPg({ connectionString: connStr });
	return new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});
}

export const db = globalThis._prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis._prisma = db;
