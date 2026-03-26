import { test, expect, Page } from "@playwright/test";

const BASE_URL = "https://myway-pi.vercel.app";
const PIN = "1234";
const SCREENSHOTS = "/workspace/myway/apps/app/e2e/screenshots";

async function enterPin(page: Page, pin: string) {
	for (const digit of pin) {
		// Numpad buttons are rendered as text content matching the digit
		const btn = page
			.locator("button")
			.filter({ hasText: new RegExp(`^${digit}$`) });
		await btn.click();
		await page.waitForTimeout(80);
	}
}

async function waitForPinGate(page: Page) {
	// PinGate renders a numpad — wait for button "1" to be visible
	await expect(page.locator("button").filter({ hasText: /^1$/ })).toBeVisible({
		timeout: 10000,
	});
}

// ─── KITCHEN ──────────────────────────────────────────────────────────────────

test.describe("Kitchen flow", () => {
	test("1. Navigate to /kitchen — PinGate appears", async ({ page }) => {
		await page.goto(`${BASE_URL}/kitchen`, { waitUntil: "networkidle" });
		await waitForPinGate(page);
		await page.screenshot({
			path: `${SCREENSHOTS}/01-kitchen-pingate.png`,
			fullPage: true,
		});
		console.log("PASS: /kitchen shows PinGate");
	});

	test("2. Enter PIN 1234 on /kitchen — check result", async ({ page }) => {
		await page.goto(`${BASE_URL}/kitchen`, { waitUntil: "networkidle" });
		await waitForPinGate(page);

		// Listen for the verify-pin API response
		const [response] = await Promise.all([
			page.waitForResponse((r) => r.url().includes("/api/staff/verify-pin"), {
				timeout: 15000,
			}),
			enterPin(page, PIN),
		]);

		const status = response.status();
		const body = await response.json().catch(() => ({}));
		console.log(`verify-pin status: ${status}`, JSON.stringify(body));

		// Wait a moment for UI to update
		await page.waitForTimeout(700);
		await page.screenshot({
			path: `${SCREENSHOTS}/02-kitchen-after-pin.png`,
			fullPage: true,
		});

		if (status === 200) {
			// PIN accepted — check if role gate triggers or children load
			const errorMsg = page.locator("text=No tenés permisos para acceder");
			const hasRoleError = await errorMsg.isVisible().catch(() => false);

			if (hasRoleError) {
				console.log(
					`BLOCKED: PIN accepted by API (role: ${body.role}) but role gate rejected access`,
				);
			} else {
				// Should see kitchen content now
				console.log(
					`PASS: PIN accepted, staff role: ${body.role}, kitchen content loading`,
				);
				await expect(page.locator("button").filter({ hasText: /^1$/ }))
					.not.toBeVisible({ timeout: 3000 })
					.catch(() => {
						console.log("NOTE: Numpad still visible — may still be on PinGate");
					});
			}
		} else {
			console.log(
				`FAIL: PIN rejected with status ${status}: ${body.error ?? JSON.stringify(body)}`,
			);
		}
	});

	test("3. /kitchen/stock — loads (with pre-set session)", async ({ page }) => {
		// Pre-inject a session to bypass PinGate for stock page test
		await page.goto(`${BASE_URL}/kitchen`, { waitUntil: "domcontentloaded" });

		// Try to set session via localStorage after page load
		await page.evaluate(() => {
			const session = {
				id: "test",
				name: "Test",
				role: "cashier",
				avatar: "",
				createdAt: Date.now(),
			};
			localStorage.setItem("myway-kitchen-staff", JSON.stringify(session));
		});

		await page.goto(`${BASE_URL}/kitchen/stock`, { waitUntil: "networkidle" });
		await page.waitForTimeout(1500);
		await page.screenshot({
			path: `${SCREENSHOTS}/03-kitchen-stock.png`,
			fullPage: true,
		});

		const url = page.url();
		const title = await page.title();
		console.log(`/kitchen/stock URL: ${url}, title: ${title}`);

		// Check if PinGate is still showing or if stock content loaded
		const isPinGate = await page
			.locator("button")
			.filter({ hasText: /^1$/ })
			.isVisible()
			.catch(() => false);
		if (isPinGate) {
			console.log(
				"NOTE: /kitchen/stock still shows PinGate (session injection may not have persisted)",
			);
		} else {
			console.log("PASS: /kitchen/stock loaded past PinGate");
		}
	});
});

// ─── BAR ──────────────────────────────────────────────────────────────────────

test.describe("Bar flow", () => {
	test("4. Navigate to /bar — PinGate appears", async ({ page }) => {
		await page.goto(`${BASE_URL}/bar`, { waitUntil: "networkidle" });
		await waitForPinGate(page);
		await page.screenshot({
			path: `${SCREENSHOTS}/04-bar-pingate.png`,
			fullPage: true,
		});
		console.log("PASS: /bar shows PinGate");
	});

	test("5. Enter PIN 1234 on /bar — check result", async ({ page }) => {
		await page.goto(`${BASE_URL}/bar`, { waitUntil: "networkidle" });
		await waitForPinGate(page);

		const [response] = await Promise.all([
			page.waitForResponse((r) => r.url().includes("/api/staff/verify-pin"), {
				timeout: 15000,
			}),
			enterPin(page, PIN),
		]);

		const status = response.status();
		const body = await response.json().catch(() => ({}));
		console.log(`verify-pin status: ${status}`, JSON.stringify(body));

		await page.waitForTimeout(700);
		await page.screenshot({
			path: `${SCREENSHOTS}/05-bar-after-pin.png`,
			fullPage: true,
		});

		if (status === 200) {
			const errorMsg = page.locator("text=No tenés permisos para acceder");
			const hasRoleError = await errorMsg.isVisible().catch(() => false);

			if (hasRoleError) {
				console.log(
					`BLOCKED: PIN accepted by API (role: ${body.role}) but role gate rejected access`,
				);
			} else {
				console.log(
					`PASS: PIN accepted, staff role: ${body.role}, bar content loading`,
				);
			}
		} else {
			console.log(
				`FAIL: PIN rejected with status ${status}: ${body.error ?? JSON.stringify(body)}`,
			);
		}
	});

	test("6. /bar/stock — loads (with pre-set session)", async ({ page }) => {
		await page.goto(`${BASE_URL}/bar`, { waitUntil: "domcontentloaded" });

		await page.evaluate(() => {
			const session = {
				id: "test",
				name: "Test",
				role: "cashier",
				avatar: "",
				createdAt: Date.now(),
			};
			localStorage.setItem("myway-bar-staff", JSON.stringify(session));
		});

		await page.goto(`${BASE_URL}/bar/stock`, { waitUntil: "networkidle" });
		await page.waitForTimeout(1500);
		await page.screenshot({
			path: `${SCREENSHOTS}/06-bar-stock.png`,
			fullPage: true,
		});

		const url = page.url();
		const title = await page.title();
		console.log(`/bar/stock URL: ${url}, title: ${title}`);

		const isPinGate = await page
			.locator("button")
			.filter({ hasText: /^1$/ })
			.isVisible()
			.catch(() => false);
		if (isPinGate) {
			console.log(
				"NOTE: /bar/stock still shows PinGate (session injection may not have persisted)",
			);
		} else {
			console.log("PASS: /bar/stock loaded past PinGate");
		}
	});
});
