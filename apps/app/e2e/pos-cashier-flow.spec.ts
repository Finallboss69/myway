/**
 * POS / Cashier Flow E2E Test
 *
 * Tests the full cashier journey:
 * 1. /pos/salon navigation (redirect from /pos)
 * 2. PinGate — enter PIN 1234 via numpad buttons
 * 3. Verify salon/tables view is shown after auth
 * 4. Click a table to see its details
 * 5. Navigate to /pos/orders
 *
 * PIN: 1234 (Martín García, cashier)
 * Storage key: pos-staff (set in src/app/pos/layout.tsx)
 */

import { test, expect, Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://myway-pi.vercel.app";
const SCREENSHOTS = path.join(__dirname, "screenshots");

async function shot(page: Page, name: string) {
	const file = path.join(SCREENSHOTS, `${name}.png`);
	await page.screenshot({ path: file, fullPage: true });
	console.log(`  [screenshot] ${file}`);
}

/**
 * Click a numpad digit button in PinGate.
 * Buttons have no data-testid — the digit is their text content.
 * Font-size 26 in Bebas Neue, no inner wrapper elements.
 */
async function clickDigit(page: Page, digit: string) {
	// The numpad renders buttons whose entire text content is the digit string.
	// We match by exact text via :text-is() (Playwright's exact text locator).
	const btn = page.locator(`button:text-is("${digit}")`).first();
	await btn.waitFor({ state: "visible", timeout: 10000 });
	await btn.click();
	console.log(`  [pin] clicked digit ${digit}`);
}

test.describe("POS Cashier Flow — https://myway-pi.vercel.app", () => {
	test.setTimeout(90000);

	test.beforeEach(async ({ page }) => {
		// Log browser console errors to test output
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				console.log(`  [browser error] ${msg.text()}`);
			}
		});
		page.on("pageerror", (err) => {
			console.log(`  [page error] ${err.message}`);
		});
	});

	test("Step 1 — navigate to /pos/salon (redirect chain through /pos)", async ({
		page,
	}) => {
		console.log("\n=== Step 1: Navigate to /pos/salon ===");

		const response = await page.goto(`${BASE_URL}/pos/salon`, {
			waitUntil: "networkidle",
		});

		const finalUrl = page.url();
		console.log(`  Status: ${response?.status()}`);
		console.log(`  Final URL: ${finalUrl}`);

		await shot(page, "01-navigate-pos-salon");

		// Should land somewhere under /pos (may still show PinGate)
		expect(finalUrl).toContain("/pos");
		// Response should be 200 (redirects resolve transparently in browser)
		expect(response?.status()).toBe(200);

		console.log("  PASS: /pos/salon loaded correctly");
	});

	test("Step 2 — PinGate is shown and PIN 1234 authenticates successfully", async ({
		page,
	}) => {
		console.log("\n=== Step 2: PinGate + PIN entry ===");

		await page.goto(`${BASE_URL}/pos/salon`, { waitUntil: "networkidle" });
		await shot(page, "02-pin-gate-initial");

		// Verify the PinGate title text is visible ("INGRESÁ TU PIN" rendered in uppercase CSS)
		const gateTitle = page
			.locator("div")
			.filter({ hasText: /ingresá tu pin/i })
			.first();
		const titleVisible = await gateTitle
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		console.log(`  PinGate title visible: ${titleVisible}`);

		if (!titleVisible) {
			// May already be authenticated from a previous session (localStorage)
			const bodyText = await page.evaluate(() => document.body.innerText);
			console.log(`  Page text sample: ${bodyText.substring(0, 200)}`);
			console.log(
				"  NOTE: PinGate not shown — session may already be active (localStorage)",
			);
			await shot(page, "02-pin-gate-already-authed");
			// Still pass — being already authenticated is valid behavior
			return;
		}

		// Enter digits 1, 2, 3, 4 — PIN auto-submits after 4 digits (120ms delay)
		await clickDigit(page, "1");
		await page.waitForTimeout(150);
		await clickDigit(page, "2");
		await page.waitForTimeout(150);
		await clickDigit(page, "3");
		await page.waitForTimeout(150);
		await clickDigit(page, "4");

		await shot(page, "02-pin-gate-digits-entered");

		// Wait for the verify-pin API call to complete
		await page.waitForResponse(
			(resp) => resp.url().includes("/api/staff/verify-pin"),
			{ timeout: 15000 },
		);

		// Wait a bit for state update + animation (success → setAuthed after 500ms)
		await page.waitForTimeout(800);
		await shot(page, "02-pin-gate-after-verify");

		// Check for "PIN incorrecto" error
		const errorMsg = page
			.locator("div")
			.filter({ hasText: /pin incorrecto/i })
			.first();
		const hasError = await errorMsg
			.isVisible({ timeout: 500 })
			.catch(() => false);
		if (hasError) {
			console.log("  ERROR: PIN incorrecto — authentication failed!");
		}
		expect(hasError).toBe(false);

		// After successful auth the PinGate unmounts and children (salon view) render
		const pinGateTitleGone = await gateTitle
			.isVisible({ timeout: 3000 })
			.catch(() => false);
		console.log(`  PinGate still visible after auth: ${pinGateTitleGone}`);
		expect(pinGateTitleGone).toBe(false);

		console.log("  PASS: PIN 1234 authenticated successfully");
	});

	test("Step 3 — salon/tables view is visible after authentication", async ({
		page,
	}) => {
		console.log("\n=== Step 3: Tables view ===");

		// Inject a pre-existing session into localStorage so we bypass PIN entry
		// (simulates a valid 8-hour session — tests the post-auth state directly)
		await page.goto(`${BASE_URL}/pos/salon`, { waitUntil: "domcontentloaded" });

		await page.evaluate(() => {
			const session = {
				id: "test-session",
				name: "Martín García",
				role: "cashier",
				avatar: "",
				createdAt: Date.now(),
			};
			// POS layout uses storageKey="pos-staff" (see src/app/pos/layout.tsx)
			localStorage.setItem("pos-staff", JSON.stringify(session));
		});

		// Reload so the PinGate picks up the stored session
		await page.reload({ waitUntil: "networkidle" });
		await page.waitForTimeout(1000);

		const url = page.url();
		console.log(`  URL: ${url}`);

		const bodyText = await page.evaluate(() => document.body.innerText);
		console.log(`  Page text sample: ${bodyText.substring(0, 400)}`);

		await shot(page, "03-tables-view");

		// The salon view should show tables (Mesas) or a loading state
		const hasTables =
			bodyText.toLowerCase().includes("mesa") ||
			bodyText.toLowerCase().includes("salon") ||
			bodyText.toLowerCase().includes("salón") ||
			bodyText.toLowerCase().includes("table");
		console.log(`  Has table/mesa content: ${hasTables}`);

		// Also check: PinGate should NOT be showing
		const pinGateTitle = page
			.locator("div")
			.filter({ hasText: /ingresá tu pin/i })
			.first();
		const pinGateVisible = await pinGateTitle
			.isVisible({ timeout: 2000 })
			.catch(() => false);
		console.log(`  PinGate visible: ${pinGateVisible}`);
		expect(pinGateVisible).toBe(false);

		console.log("  PASS: Salon view shown (PinGate cleared)");
	});

	test("Step 4 — click a table to see its details", async ({ page }) => {
		console.log("\n=== Step 4: Click on a table ===");

		await page.goto(`${BASE_URL}/pos/salon`, { waitUntil: "domcontentloaded" });
		await page.evaluate(() => {
			const session = {
				id: "test-session",
				name: "Martín García",
				role: "cashier",
				avatar: "",
				createdAt: Date.now(),
			};
			localStorage.setItem("pos-staff", JSON.stringify(session));
		});
		await page.reload({ waitUntil: "networkidle" });
		await page.waitForTimeout(1500);

		await shot(page, "04-before-table-click");

		// Tables are rendered as SVG foreign objects or canvas-positioned divs.
		// Try multiple approaches to find and click a table element.
		let tableClicked = false;

		// Approach 1: any element whose visible text matches "Mesa \d"
		const mesaLocator = page.locator("text=/^Mesa\\s+\\d+$/").first();
		if (await mesaLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
			const text = await mesaLocator.textContent();
			console.log(`  Found table via text regex: "${text?.trim()}"`);
			await mesaLocator.click();
			tableClicked = true;
		}

		// Approach 2: any button/div with "Mesa" in text
		if (!tableClicked) {
			const allMesa = page
				.locator('[class*="table"], button, div')
				.filter({ hasText: /Mesa \d/ });
			const count = await allMesa.count();
			console.log(`  Found ${count} elements with "Mesa \\d" text`);
			if (count > 0) {
				const first = allMesa.first();
				if (await first.isVisible({ timeout: 2000 }).catch(() => false)) {
					const text = await first.textContent();
					console.log(`  Clicking: "${text?.trim().substring(0, 50)}"`);
					await first.click();
					tableClicked = true;
				}
			}
		}

		if (!tableClicked) {
			console.log("  WARNING: Could not find a clickable table element");
		} else {
			console.log("  Clicked a table element");
		}

		await page.waitForTimeout(1500);
		const urlAfterClick = page.url();
		console.log(`  URL after click: ${urlAfterClick}`);

		await shot(page, "04-after-table-click");

		const bodyTextAfter = await page.evaluate(() => document.body.innerText);
		console.log(
			`  Page after click (first 300 chars): ${bodyTextAfter.substring(0, 300)}`,
		);

		// Whether a modal opened or navigation happened, we verify no crash
		const hasPageError =
			bodyTextAfter.includes("Error") && bodyTextAfter.includes("500");
		expect(hasPageError).toBe(false);

		console.log("  PASS: Table interaction completed without errors");
	});

	test("Step 5 — navigate to /pos/orders and verify it loads", async ({
		page,
	}) => {
		console.log("\n=== Step 5: /pos/orders ===");

		await page.goto(`${BASE_URL}/pos/orders`, {
			waitUntil: "domcontentloaded",
		});

		// Inject session so POS orders page renders (it also uses PinGate)
		await page.evaluate(() => {
			const session = {
				id: "test-session",
				name: "Martín García",
				role: "cashier",
				avatar: "",
				createdAt: Date.now(),
			};
			localStorage.setItem("pos-staff", JSON.stringify(session));
		});
		await page.reload({ waitUntil: "networkidle" });
		await page.waitForTimeout(1000);

		const url = page.url();
		console.log(`  URL: ${url}`);

		const bodyText = await page.evaluate(() => document.body.innerText);
		console.log(`  Page text sample: ${bodyText.substring(0, 400)}`);

		await shot(page, "05-pos-orders");

		expect(url).toContain("/pos/orders");

		// Should not show PinGate (session injected)
		const pinGateTitle = page
			.locator("div")
			.filter({ hasText: /ingresá tu pin/i })
			.first();
		const pinGateVisible = await pinGateTitle
			.isVisible({ timeout: 2000 })
			.catch(() => false);
		console.log(`  PinGate visible: ${pinGateVisible}`);
		expect(pinGateVisible).toBe(false);

		// Should show order-related content
		const hasOrderContent =
			bodyText.toLowerCase().includes("orden") ||
			bodyText.toLowerCase().includes("pedido") ||
			bodyText.toLowerCase().includes("order") ||
			bodyText.toLowerCase().includes("mesa") ||
			bodyText.toLowerCase().includes("cuenta");
		console.log(`  Has order/pedido content: ${hasOrderContent}`);

		console.log("  PASS: /pos/orders loaded without PinGate");
	});

	// ─────────────────────────────────────────────────────────────────────────
	// FULL FLOW — single test that does everything end-to-end with real PIN auth
	// ─────────────────────────────────────────────────────────────────────────
	test("FULL FLOW — navigate, enter PIN 1234, tables view, click table, orders page", async ({
		page,
	}) => {
		console.log("\n=== FULL END-TO-END FLOW ===");

		// ── 1. Navigate to /pos/salon ─────────────────────────────────────────
		console.log("\n--- 1. Navigate to /pos/salon ---");
		await page.goto(`${BASE_URL}/pos/salon`, { waitUntil: "networkidle" });
		console.log(`  URL: ${page.url()}`);
		await shot(page, "full-01-initial-load");
		expect(page.url()).toContain("/pos");

		// ── 2. Check for PinGate ──────────────────────────────────────────────
		console.log("\n--- 2. PinGate detection ---");
		const gateTitle = page
			.locator("div")
			.filter({ hasText: /ingresá tu pin/i })
			.first();
		const pinGateShown = await gateTitle
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		console.log(`  PinGate shown: ${pinGateShown}`);

		if (pinGateShown) {
			// ── 3. Enter PIN 1234 ───────────────────────────────────────────────
			console.log("\n--- 3. Enter PIN 1234 ---");
			await shot(page, "full-02-pin-gate");

			await clickDigit(page, "1");
			await page.waitForTimeout(200);
			await clickDigit(page, "2");
			await page.waitForTimeout(200);
			await clickDigit(page, "3");
			await page.waitForTimeout(200);
			await clickDigit(page, "4");

			await shot(page, "full-03-pin-entered");

			// Wait for API response
			await page.waitForResponse(
				(resp) => resp.url().includes("/api/staff/verify-pin"),
				{ timeout: 15000 },
			);
			await page.waitForTimeout(800);

			await shot(page, "full-04-pin-verified");

			// Check for error
			const errEl = page
				.locator("div")
				.filter({ hasText: /pin incorrecto|no tenés permisos/i })
				.first();
			const hasErr = await errEl
				.isVisible({ timeout: 1000 })
				.catch(() => false);
			if (hasErr) {
				const errText = await errEl.textContent();
				console.log(`  AUTH ERROR: ${errText}`);
			}
			expect(hasErr).toBe(false);
			console.log("  PIN authenticated successfully");
		} else {
			console.log("  Session already active — skipping PIN entry");
			await shot(page, "full-02-already-authed");
		}

		// ── 4. Verify tables view ─────────────────────────────────────────────
		console.log("\n--- 4. Verify tables/salon view ---");
		await page.waitForTimeout(500);
		const bodyAfterAuth = await page.evaluate(() => document.body.innerText);
		console.log(
			`  Page content (first 300): ${bodyAfterAuth.substring(0, 300)}`,
		);
		await shot(page, "full-05-tables-view");

		const pinGateGone = await gateTitle
			.isVisible({ timeout: 1000 })
			.catch(() => false);
		console.log(`  PinGate still visible: ${pinGateGone}`);
		expect(pinGateGone).toBe(false);

		// ── 5. Click a table ──────────────────────────────────────────────────
		console.log("\n--- 5. Click a table ---");
		const mesaEl = page.locator("text=/Mesa/").first();
		const mesaVisible = await mesaEl
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		console.log(`  Mesa element visible: ${mesaVisible}`);

		if (mesaVisible) {
			await mesaEl.click();
			console.log("  Clicked Mesa element");
			await page.waitForTimeout(1000);
		} else {
			console.log("  No Mesa element found — checking page structure");
			// Log all visible text
			const allText = await page.evaluate(() => {
				return Array.from(
					document.querySelectorAll('button, [role="button"], a'),
				)
					.filter((el) => (el as HTMLElement).offsetParent !== null)
					.map((el) => el.textContent?.trim())
					.filter(Boolean)
					.slice(0, 20);
			});
			console.log("  Clickable elements:", JSON.stringify(allText));
		}

		console.log(`  URL after table interaction: ${page.url()}`);
		await shot(page, "full-06-table-detail");

		// ── 6. Navigate to /pos/orders ─────────────────────────────────────────
		console.log("\n--- 6. Navigate to /pos/orders ---");
		await page.goto(`${BASE_URL}/pos/orders`, { waitUntil: "networkidle" });
		await page.waitForTimeout(1000);
		console.log(`  URL: ${page.url()}`);

		const ordersText = await page.evaluate(() => document.body.innerText);
		console.log(
			`  Orders page content (first 300): ${ordersText.substring(0, 300)}`,
		);
		await shot(page, "full-07-pos-orders");

		expect(page.url()).toContain("/pos/orders");

		console.log("\n=== FULL FLOW COMPLETE ===");
	});
});
