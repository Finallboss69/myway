import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// --- Route classification ---
//
// Auth model:
//   - Google OAuth (NextAuth) → only for customer delivery flow
//   - Staff PIN → admin, waiter, kitchen, bar, POS (client-side PinGate)
//   - API routes → all public (staff pages need them without Google session;
//     actual authorization is handled by PIN gates on the frontend)
//

// --- Proxy handler ---

const authProxy = auth((req) => {
	const { pathname } = req.nextUrl;

	// NextAuth routes — always allow
	if (pathname.startsWith("/api/auth")) {
		return NextResponse.next();
	}

	// Everything passes through — pages are protected by client-side PIN gates,
	// delivery pages by Google OAuth via useSession()
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
