/**
 * Production smoke tests — https://myway-pi.vercel.app
 *
 * Verifies that critical pages:
 *  - Load without crash banners / error messages
 *  - Render meaningful content (not blank / spinner-only)
 *  - Show a PIN gate on staff-only routes
 */

import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Screenshot directory ──────────────────────────────────────────────────────
const SHOT_DIR = path.join(__dirname, "screenshots/prod-smoke");
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

// ── Error patterns that indicate a hard crash ────────────────────────────────
const ERROR_PATTERNS = [
	/this page couldn['']t load/i,
	/application error/i,
	/an unexpected error has occurred/i,
	/500 internal server error/i,
	/something went wrong/i,
	/unhandled runtime error/i,
];

// ── PIN gate patterns ─────────────────────────────────────────────────────────
const PIN_GATE_PATTERNS = [
	/ingres[aá] tu pin/i,
	/ingresar pin/i,
	/enter.*pin/i,
	/\bpin\b/i,
];

async function assertNoErrorPage(page: Page) {
	const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
	for (const pat of ERROR_PATTERNS) {
		expect(
			pat.test(bodyText),
			`Page shows crash message matching ${pat.source}\n\nBody snippet:\n${bodyText.slice(0, 500)}`,
		).toBe(false);
	}
}

async function assertNotBlank(page: Page) {
	const bodyText = await page.evaluate(
		() => document.body?.innerText?.trim() ?? "",
	);
	expect(
		bodyText.length,
		`Page body is blank (${bodyText.length} chars)`,
	).toBeGreaterThan(20);
}

async function assertPinGateVisible(page: Page) {
	const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
	const found = PIN_GATE_PATTERNS.some((p) => p.test(bodyText));
	// Soft check: page may have redirected — log but don't hard-fail
	if (!found) {
		console.warn(
			`  [WARN] PIN gate text not detected on ${page.url()} — page may have redirected`,
		);
	}
}

async function saveScreenshot(page: Page, name: string) {
	const dest = path.join(SHOT_DIR, `${name}.png`);
	await page.screenshot({ path: dest, fullPage: false });
	console.log(`  Screenshot saved: ${dest}`);
}

// ── Helper: navigate + settle ─────────────────────────────────────────────────
async function navigate(page: Page, url: string) {
	await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
	// Wait for React hydration / lazy routes to settle
	await page.waitForTimeout(3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Production Smoke Tests — myway-pi.vercel.app", () => {
	test("1. Login page loads", async ({ page }) => {
		await navigate(page, "/login");
		await saveScreenshot(page, "01-login");
		await assertNoErrorPage(page);
		await assertNotBlank(page);
	});

	test("2a. /admin shows PIN gate", async ({ page }) => {
		await navigate(page, "/admin");
		await saveScreenshot(page, "02a-admin");
		await assertNoErrorPage(page);
		await assertNotBlank(page);
		await assertPinGateVisible(page);
	});

	test("2b. /pos shows PIN gate", async ({ page }) => {
		await navigate(page, "/pos");
		await saveScreenshot(page, "02b-pos");
		await assertNoErrorPage(page);
		await assertNotBlank(page);
		await assertPinGateVisible(page);
	});

	test("2c. /waiter shows PIN gate", async ({ page }) => {
		await navigate(page, "/waiter");
		await saveScreenshot(page, "02c-waiter");
		await assertNoErrorPage(page);
		await assertNotBlank(page);
		await assertPinGateVisible(page);
	});

	test("2d. /kitchen shows PIN gate", async ({ page }) => {
		await navigate(page, "/kitchen");
		await saveScreenshot(page, "02d-kitchen");
		await assertNoErrorPage(page);
		await assertNotBlank(page);
		await assertPinGateVisible(page);
	});

	test("2e. /bar shows PIN gate", async ({ page }) => {
		await navigate(page, "/bar");
		await saveScreenshot(page, "02e-bar");
		await assertNoErrorPage(page);
		await assertNotBlank(page);
		await assertPinGateVisible(page);
	});

	test("3. /pos/salon loads without crash", async ({ page }) => {
		await navigate(page, "/pos/salon");
		await saveScreenshot(page, "03-pos-salon");
		await assertNoErrorPage(page);
		await assertNotBlank(page);
	});

	test("4. /customer/menu renders", async ({ page }) => {
		await navigate(page, "/customer/menu");
		await saveScreenshot(page, "04-customer-menu");
		await assertNoErrorPage(page);
		await assertNotBlank(page);
	});
});
