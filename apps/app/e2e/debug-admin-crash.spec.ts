import { test } from "@playwright/test";

/**
 * Debug test: capture the exact JS errors that crash /admin/expenses,
 * /admin/menu, and /admin/suppliers by bypassing the PIN gate via
 * a fake localStorage session and monitoring all errors + API responses.
 */

// Fake admin session: role "admin" satisfies allowedRoles=["admin","manager"]
const FAKE_ADMIN_SESSION = JSON.stringify({
	pin: "bypass",
	staffId: "debug-staff",
	name: "Debug",
	role: "admin",
	expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8h TTL
});

async function injectSession(page: import("@playwright/test").Page) {
	await page.addInitScript((session) => {
		window.localStorage.setItem("myway-admin-staff", session);
	}, FAKE_ADMIN_SESSION);
}

test("debug: /admin/expenses crash", async ({ page }) => {
	const errors: string[] = [];
	const networkErrors: string[] = [];

	page.on("pageerror", (err) => {
		errors.push(`PAGE_ERROR: ${err.message}\nStack: ${err.stack}`);
	});
	page.on("console", (msg) => {
		if (msg.type() === "error") errors.push(`CONSOLE_ERROR: ${msg.text()}`);
	});
	page.on("requestfailed", (req) => {
		networkErrors.push(
			`NETWORK_FAIL [${req.method()}] ${req.url()} → ${req.failure()?.errorText}`,
		);
	});

	const apiResponses: string[] = [];
	page.on("response", async (resp) => {
		const url = resp.url();
		if (url.includes("/api/")) {
			const status = resp.status();
			let body = "";
			try {
				body = await resp.text();
			} catch {
				body = "(unreadable)";
			}
			apiResponses.push(`[${status}] ${url}\n  body: ${body.slice(0, 300)}`);
		}
	});

	await injectSession(page);
	await page.goto("/admin/expenses", { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(6000);

	await page.screenshot({
		path: "e2e/screenshots/expenses-with-session.png",
		fullPage: true,
	});

	console.log("\n=== /admin/expenses — PAGE/CONSOLE ERRORS ===");
	if (errors.length === 0) console.log("(none)");
	errors.forEach((e) => console.log(e));

	console.log("\n=== /admin/expenses — NETWORK ERRORS ===");
	if (networkErrors.length === 0) console.log("(none)");
	networkErrors.forEach((e) => console.log(e));

	console.log("\n=== /admin/expenses — API RESPONSES ===");
	if (apiResponses.length === 0) console.log("(none — no /api/ requests made)");
	apiResponses.forEach((e) => console.log(e));
});

test("debug: /admin/menu crash", async ({ page }) => {
	const errors: string[] = [];
	const networkErrors: string[] = [];
	const apiResponses: string[] = [];

	page.on("pageerror", (err) => {
		errors.push(`PAGE_ERROR: ${err.message}\nStack: ${err.stack}`);
	});
	page.on("console", (msg) => {
		if (msg.type() === "error") errors.push(`CONSOLE_ERROR: ${msg.text()}`);
	});
	page.on("requestfailed", (req) => {
		networkErrors.push(
			`NETWORK_FAIL [${req.method()}] ${req.url()} → ${req.failure()?.errorText}`,
		);
	});
	page.on("response", async (resp) => {
		const url = resp.url();
		if (url.includes("/api/")) {
			const status = resp.status();
			let body = "";
			try {
				body = await resp.text();
			} catch {
				body = "(unreadable)";
			}
			apiResponses.push(`[${status}] ${url}\n  body: ${body.slice(0, 300)}`);
		}
	});

	await injectSession(page);
	await page.goto("/admin/menu", { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(6000);

	await page.screenshot({
		path: "e2e/screenshots/menu-with-session.png",
		fullPage: true,
	});

	console.log("\n=== /admin/menu — PAGE/CONSOLE ERRORS ===");
	if (errors.length === 0) console.log("(none)");
	errors.forEach((e) => console.log(e));

	console.log("\n=== /admin/menu — NETWORK ERRORS ===");
	if (networkErrors.length === 0) console.log("(none)");
	networkErrors.forEach((e) => console.log(e));

	console.log("\n=== /admin/menu — API RESPONSES ===");
	if (apiResponses.length === 0) console.log("(none — no /api/ requests made)");
	apiResponses.forEach((e) => console.log(e));
});

test("debug: /admin/suppliers crash", async ({ page }) => {
	const errors: string[] = [];
	const networkErrors: string[] = [];
	const apiResponses: string[] = [];

	page.on("pageerror", (err) => {
		errors.push(`PAGE_ERROR: ${err.message}\nStack: ${err.stack}`);
	});
	page.on("console", (msg) => {
		if (msg.type() === "error") errors.push(`CONSOLE_ERROR: ${msg.text()}`);
	});
	page.on("requestfailed", (req) => {
		networkErrors.push(
			`NETWORK_FAIL [${req.method()}] ${req.url()} → ${req.failure()?.errorText}`,
		);
	});
	page.on("response", async (resp) => {
		const url = resp.url();
		if (url.includes("/api/")) {
			const status = resp.status();
			let body = "";
			try {
				body = await resp.text();
			} catch {
				body = "(unreadable)";
			}
			apiResponses.push(`[${status}] ${url}\n  body: ${body.slice(0, 300)}`);
		}
	});

	await injectSession(page);
	await page.goto("/admin/suppliers", { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(6000);

	await page.screenshot({
		path: "e2e/screenshots/suppliers-with-session.png",
		fullPage: true,
	});

	console.log("\n=== /admin/suppliers — PAGE/CONSOLE ERRORS ===");
	if (errors.length === 0) console.log("(none)");
	errors.forEach((e) => console.log(e));

	console.log("\n=== /admin/suppliers — NETWORK ERRORS ===");
	if (networkErrors.length === 0) console.log("(none)");
	networkErrors.forEach((e) => console.log(e));

	console.log("\n=== /admin/suppliers — API RESPONSES ===");
	if (apiResponses.length === 0) console.log("(none — no /api/ requests made)");
	apiResponses.forEach((e) => console.log(e));
});
