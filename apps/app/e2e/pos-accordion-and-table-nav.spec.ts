/**
 * Tests for:
 *   1. Accordion category panel (left panel "Menú rápido") in /pos/salon
 *   2. Table click navigates to /pos/salon/{tableId}
 *
 * Uses localStorage session injection to bypass PinGate (same approach as pos-cashier-flow.spec.ts).
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

/** Inject a valid POS staff session into localStorage and reload. */
async function injectSession(page: Page) {
	await page.evaluate(() => {
		const session = {
			id: "test-session",
			name: "Martín García",
			role: "cashier",
			avatar: "",
			createdAt: Date.now(),
		};
		// storageKey="pos-staff" as set in src/app/pos/layout.tsx
		localStorage.setItem("pos-staff", JSON.stringify(session));
	});
	await page.reload({ waitUntil: "networkidle" });
	await page.waitForTimeout(1500);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Accordion category panel
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Test 1 — Accordion category panel (Menú rápido left panel)", () => {
	test.setTimeout(90000);

	test("Left panel shows categories collapsed; Hamburguesas expands and collapses", async ({
		page,
	}) => {
		console.log("\n=== Test 1: Accordion category panel ===");

		// ── Navigate and inject session ──
		await page.goto(`${BASE_URL}/pos/salon`, { waitUntil: "domcontentloaded" });
		await injectSession(page);

		const url = page.url();
		console.log(`  URL after session inject: ${url}`);
		await shot(page, "t1-01-salon-view");

		// ── Step 4: Verify "Menú rápido" header is visible ──
		console.log("\n--- Step 4: Check left panel header ---");
		const menuHeader = page.locator("text=Menú rápido").first();
		const menuHeaderVisible = await menuHeader
			.isVisible({ timeout: 8000 })
			.catch(() => false);
		console.log(`  "Menú rápido" header visible: ${menuHeaderVisible}`);

		if (!menuHeaderVisible) {
			// Log page content to help diagnose
			const bodyText = await page.evaluate(() => document.body.innerText);
			console.log(
				`  Page body text (first 600 chars):\n${bodyText.substring(0, 600)}`,
			);
			await shot(page, "t1-01b-no-menu-rapido");
		}

		// ── Check "Hamburguesas" category is present (collapsed — no products visible) ──
		console.log(
			"\n--- Step 4b: Check Hamburguesas category present & collapsed ---",
		);

		const hamburguesasHeader = page.locator("text=Hamburguesas").first();
		const hamburguesasVisible = await hamburguesasHeader
			.isVisible({ timeout: 8000 })
			.catch(() => false);
		console.log(`  "Hamburguesas" category visible: ${hamburguesasVisible}`);
		await shot(page, "t1-02-categories-collapsed");

		// Products should NOT be visible yet (collapsed).
		// Real product names in Hamburguesas: Americana, Double, Criolla, Tex Mex, etc.
		const americanaBeforeExpand = await page
			.locator("text=Americana")
			.first()
			.isVisible({ timeout: 1000 })
			.catch(() => false);
		const doubleBeforeExpand = await page
			.locator("text=Double")
			.first()
			.isVisible({ timeout: 1000 })
			.catch(() => false);
		console.log(
			`  Products visible before expand — Americana: ${americanaBeforeExpand}, Double: ${doubleBeforeExpand}`,
		);

		// ── Step 5: Click Hamburguesas to expand ──
		console.log("\n--- Step 5: Click Hamburguesas to expand ---");
		expect(
			hamburguesasVisible,
			`"Hamburguesas" category should be visible in left panel. URL: ${url}`,
		).toBe(true);

		await hamburguesasHeader.click();
		await page.waitForTimeout(700);
		await shot(page, "t1-03-hamburguesas-expanded");

		// ── Step 6: Verify products appear ──
		console.log("\n--- Step 6: Verify products appear after expand ---");
		const americanaAfterExpand = await page
			.locator("text=Americana")
			.first()
			.isVisible({ timeout: 3000 })
			.catch(() => false);
		const doubleAfterExpand = await page
			.locator("text=Double")
			.first()
			.isVisible({ timeout: 3000 })
			.catch(() => false);
		console.log(
			`  Products visible after expand — Americana: ${americanaAfterExpand}, Double: ${doubleAfterExpand}`,
		);

		// At least one product must be visible
		const productsVisible = americanaAfterExpand || doubleAfterExpand;
		console.log(`  At least one product visible: ${productsVisible}`);

		// ── Step 8: Click Hamburguesas again to collapse ──
		console.log("\n--- Step 8: Click Hamburguesas again to collapse ---");
		await hamburguesasHeader.click();
		await page.waitForTimeout(700);
		await shot(page, "t1-04-hamburguesas-collapsed");

		// ── Step 9: Verify products disappear ──
		console.log("\n--- Step 9: Verify products disappear after collapse ---");
		const americanaAfterCollapse = await page
			.locator("text=Americana")
			.first()
			.isVisible({ timeout: 1000 })
			.catch(() => false);
		const doubleAfterCollapse = await page
			.locator("text=Double")
			.first()
			.isVisible({ timeout: 1000 })
			.catch(() => false);
		console.log(
			`  Products visible after collapse — Americana: ${americanaAfterCollapse}, Double: ${doubleAfterCollapse}`,
		);

		// ── Assertions ──
		console.log("\n--- Assertions ---");
		expect(
			menuHeaderVisible,
			'"Menú rápido" header must be visible in left panel',
		).toBe(true);
		expect(
			hamburguesasVisible,
			'"Hamburguesas" category must appear in left panel',
		).toBe(true);
		expect(
			productsVisible,
			"Products (Americana, Double, etc.) must appear after clicking Hamburguesas",
		).toBe(true);
		expect(
			americanaAfterCollapse || doubleAfterCollapse,
			"Products must disappear after clicking Hamburguesas again to collapse",
		).toBe(false);

		console.log("\n=== Test 1 PASS ===");
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Table click navigates to /pos/salon/{tableId}
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Test 2 — Table click navigates to detail page", () => {
	test.setTimeout(90000);

	test("Clicking a table navigates to /pos/salon/{tableId}", async ({
		page,
	}) => {
		console.log("\n=== Test 2: Table click → detail page ===");

		// ── Navigate and inject session ──
		await page.goto(`${BASE_URL}/pos/salon`, { waitUntil: "domcontentloaded" });
		await injectSession(page);

		const urlAfterLogin = page.url();
		console.log(`  URL after session inject: ${urlAfterLogin}`);
		await shot(page, "t2-01-salon-view");

		// Log all visible text on page for diagnosis
		const bodyText = await page.evaluate(() => document.body.innerText);
		console.log(
			`  Page body text (first 500 chars):\n${bodyText.substring(0, 500)}`,
		);

		// ── Approach 1: look for elements whose text is "Mesa N" ──
		console.log("\n--- Looking for table elements ---");
		let tableClicked = false;
		let clickedTableText = "";

		const mesaExact = page.locator("text=/^Mesa\\s+\\d+$/").first();
		if (await mesaExact.isVisible({ timeout: 4000 }).catch(() => false)) {
			clickedTableText = (await mesaExact.textContent()) ?? "";
			console.log(`  Found table (exact text): "${clickedTableText.trim()}"`);
			await mesaExact.click();
			tableClicked = true;
		}

		// ── Approach 2: any element containing "Mesa \d" ──
		if (!tableClicked) {
			const mesaAny = page
				.locator("button, div, span, a")
				.filter({ hasText: /Mesa\s+\d/ })
				.first();
			if (await mesaAny.isVisible({ timeout: 3000 }).catch(() => false)) {
				clickedTableText = (await mesaAny.textContent()) ?? "";
				console.log(
					`  Found table (any element): "${clickedTableText.trim().substring(0, 40)}"`,
				);
				await mesaAny.click();
				tableClicked = true;
			}
		}

		// ── Approach 3: canvas-based table layout ──
		if (!tableClicked) {
			const canvas = page.locator("canvas").first();
			if (await canvas.isVisible({ timeout: 2000 }).catch(() => false)) {
				const box = await canvas.boundingBox();
				if (box) {
					console.log(
						`  Canvas found (${box.width}x${box.height}). Trying click positions...`,
					);
					// Try multiple positions across the canvas surface
					const positions = [
						{ x: box.width * 0.5, y: box.height * 0.5 },
						{ x: box.width * 0.25, y: box.height * 0.25 },
						{ x: box.width * 0.75, y: box.height * 0.3 },
						{ x: box.width * 0.3, y: box.height * 0.6 },
					];
					for (const pos of positions) {
						await canvas.click({ position: pos });
						await page.waitForTimeout(800);
						const newUrl = page.url();
						if (newUrl !== urlAfterLogin && newUrl.includes("/pos/salon/")) {
							console.log(`  Canvas click navigated to: ${newUrl}`);
							tableClicked = true;
							break;
						}
					}
				}
			}
		}

		if (!tableClicked) {
			// Log all visible clickable elements
			const clickableEls = await page.evaluate(() => {
				return Array.from(
					document.querySelectorAll('button, [role="button"], a, [onclick]'),
				)
					.filter((el) => (el as HTMLElement).offsetParent !== null)
					.map((el) => ({
						tag: el.tagName,
						text: el.textContent?.trim().substring(0, 50),
						href: (el as HTMLAnchorElement).href ?? null,
					}))
					.slice(0, 30);
			});
			console.log(
				"  Visible clickable elements:",
				JSON.stringify(clickableEls, null, 2),
			);
			await shot(page, "t2-01b-no-table-found");
		}

		await page.waitForTimeout(1500);
		const finalUrl = page.url();
		console.log(`  URL after table click: ${finalUrl}`);
		await shot(page, "t2-02-after-table-click");

		// ── Assertion: URL must include /pos/salon/{tableId} ──
		console.log("\n--- Assertion ---");
		// tableId is the segment after /pos/salon/ — must be non-empty and not just "salon"
		const saloonDetailPattern = /\/pos\/salon\/[^/]+$/;
		const navigatedToDetail =
			saloonDetailPattern.test(finalUrl) && !finalUrl.endsWith("/pos/salon");
		console.log(`  Matches /pos/salon/{tableId}: ${navigatedToDetail}`);
		console.log(`  Expected pattern: /pos/salon/{tableId}, Got: ${finalUrl}`);

		if (navigatedToDetail) {
			const detailPageText = await page.evaluate(() => document.body.innerText);
			console.log(
				`  Detail page content (first 400): ${detailPageText.substring(0, 400)}`,
			);
			await shot(page, "t2-03-table-detail-page");
		}

		expect(
			navigatedToDetail,
			`Expected URL to match /pos/salon/{tableId}, got: ${finalUrl}. tableClicked=${tableClicked}`,
		).toBe(true);

		console.log("\n=== Test 2 PASS ===");
	});
});
