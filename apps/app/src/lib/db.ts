import { PrismaClient } from "../../node_modules/.prisma/client/index";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

declare global {
	// eslint-disable-next-line no-var
	var _prisma: PrismaClient | undefined;
}

function createPrismaClient() {
	const url = process.env.DATABASE_URL ?? "file:./dev.db";
	const adapter = new PrismaBetterSqlite3({ url });
	return new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});
}

export const db = globalThis._prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis._prisma = db;
