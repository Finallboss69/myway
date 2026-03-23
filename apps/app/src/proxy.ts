import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// --- Route classification ---

/** Fully public — no auth required */
const PUBLIC_PATTERNS = [
	/^\/$/,
	/^\/delivery$/,
	/^\/login$/,
	/^\/track(\/.*)?$/,
	/^\/repartidor(\/.*)?$/,
	/^\/api\/auth(\/.*)?$/,
	/^\/media(\/.*)?$/,
];

/** Public API endpoints (specific method + path combos checked inside) */
const PUBLIC_API_GET = [
	/^\/api\/delivery$/,
	/^\/api\/delivery\/[^/]+\/tracking$/,
	/^\/api\/categories$/,
	/^\/api\/products$/,
];

const PUBLIC_API_POST = [/^\/api\/delivery$/];

/** Admin-only pages and API */
const ADMIN_PAGE = /^\/admin(\/.*)?$/;
const ADMIN_API = /^\/api\/admin(\/.*)?$/;

/** Staff pages — require any authenticated session */
const STAFF_PAGES = [
	/^\/waiter(\/.*)?$/,
	/^\/kitchen(\/.*)?$/,
	/^\/bar(\/.*)?$/,
	/^\/pos(\/.*)?$/,
];

// --- Helpers ---

function matchesAny(path: string, patterns: RegExp[]): boolean {
	return patterns.some((p) => p.test(path));
}

function isPublicApiRequest(method: string, path: string): boolean {
	if (method === "GET" && matchesAny(path, PUBLIC_API_GET)) return true;
	if (method === "POST" && matchesAny(path, PUBLIC_API_POST)) return true;
	return false;
}

// --- Proxy handler ---

const authProxy = auth((req) => {
	const { pathname } = req.nextUrl;
	const method = req.method;

	// 1. Always allow public routes
	if (matchesAny(pathname, PUBLIC_PATTERNS)) {
		return NextResponse.next();
	}

	// 2. Allow public API endpoints
	if (isPublicApiRequest(method, pathname)) {
		return NextResponse.next();
	}

	// 3. Admin pages — require admin role
	if (ADMIN_PAGE.test(pathname)) {
		if (!req.auth?.user) {
			return NextResponse.redirect(new URL("/login", req.url));
		}
		if (req.auth.user.role !== "admin") {
			return NextResponse.redirect(new URL("/login", req.url));
		}
		return NextResponse.next();
	}

	// 4. Admin API — require admin role
	if (ADMIN_API.test(pathname)) {
		if (!req.auth?.user || req.auth.user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		return NextResponse.next();
	}

	// 5. Staff pages — require any authenticated session
	if (matchesAny(pathname, STAFF_PAGES)) {
		if (!req.auth?.user) {
			return NextResponse.redirect(new URL("/login", req.url));
		}
		return NextResponse.next();
	}

	// 6. All other /api/* endpoints — require any authenticated session
	if (pathname.startsWith("/api/")) {
		if (!req.auth?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		return NextResponse.next();
	}

	// 7. Everything else — pass through
	return NextResponse.next();
});

// Next.js 16: export named `proxy` function
export function proxy(request: NextRequest) {
	return authProxy(request, {} as never);
}

// Only run on relevant routes — skip static assets and images
export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|media/).*)",
	],
};
