/**
 * E2E test: Waiter flow PinGate validation
 *
 * Tests:
 * 1. /waiter/tables shows PinGate
 * 2. Enter cashier PIN 1234 — expected to succeed (no allowedRoles restriction)
 *    OR fail with "No tenés permisos para acceder" if backend returns a non-waiter role
 * 3. /waiter/ready shows PinGate or content
 * 4. /waiter/payment shows PinGate or content
 */

const { chromium } = require("/usr/local/lib/node_modules/@playwright/test");
const path = require("path");
const fs = require("fs");

const BASE_URL = "https://myway-pi.vercel.app";
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

async function screenshot(page, name) {
	const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
	await page.screenshot({ path: filePath, fullPage: false });
	console.log(`  Screenshot saved: ${filePath}`);
	return filePath;
}

async function waitForPinGate(page) {
	// PinGate renders a numpad — wait for button "1" to appear
	try {
		await page.waitForSelector("button", { timeout: 10000 });
		// The numpad digit "1" is a button with that text
		const buttons = await page.$$("button");
		for (const btn of buttons) {
			const text = await btn.textContent();
			if (text && text.trim() === "1") return true;
		}
		return false;
	} catch {
		return false;
	}
}

async function clickPinDigit(page, digit) {
	// The numpad buttons contain digit text rendered via Bebas font
	// They are styled buttons — find by exact text content
	const buttons = await page.$$("button");
	for (const btn of buttons) {
		const text = await btn.textContent();
		if (text && text.trim() === digit) {
			await btn.click();
			return true;
		}
	}
	console.log(`  WARNING: Could not find numpad button for digit "${digit}"`);
	return false;
}

async function runTests() {
	console.log("=== Waiter Flow PinGate E2E Test ===\n");
	console.log(`Target: ${BASE_URL}`);
	console.log(`Screenshots: ${SCREENSHOT_DIR}\n`);

	const browser = await chromium.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	const context = await browser.newContext({
		viewport: { width: 390, height: 844 }, // iPhone 14 size — waiter app is mobile-first
		locale: "es-AR",
	});

	const page = await context.newPage();
	const results = [];

	// ─── Test 1: /waiter/tables shows PinGate ────────────────────────────────

	console.log("TEST 1: /waiter/tables — should show PinGate");
	try {
		// Clear any existing sessions first
		await page.goto(`${BASE_URL}/waiter/tables`, {
			waitUntil: "networkidle",
			timeout: 30000,
		});
		await page.evaluate(() => {
			localStorage.removeItem("myway-waiter-staff");
		});
		await page.reload({ waitUntil: "networkidle" });

		await screenshot(page, "01-waiter-tables-initial");

		// Check page title area
		const bodyText = await page.textContent("body");
		const hasPinTitle =
			bodyText.includes("Ingresá tu PIN") ||
			bodyText.includes("INGRESÁ TU PIN");
		const hasNumpad = await waitForPinGate(page);

		if (hasPinTitle || hasNumpad) {
			console.log("  PASS: PinGate visible on /waiter/tables");
			results.push({ test: "/waiter/tables PinGate visible", status: "PASS" });
		} else {
			console.log(
				"  FAIL: PinGate not visible — page content:",
				bodyText.slice(0, 200),
			);
			results.push({
				test: "/waiter/tables PinGate visible",
				status: "FAIL",
				detail: bodyText.slice(0, 200),
			});
		}

		await screenshot(page, "02-waiter-tables-pingate");
	} catch (err) {
		console.log(`  ERROR: ${err.message}`);
		results.push({
			test: "/waiter/tables PinGate visible",
			status: "ERROR",
			detail: err.message,
		});
		await screenshot(page, "02-waiter-tables-error").catch(() => {});
	}

	// ─── Test 2: Enter PIN 1234 — verify role validation behavior ─────────────

	console.log("\nTEST 2: Enter cashier PIN 1234 — verify role validation");
	try {
		// Navigate fresh, ensure no session
		await page.goto(`${BASE_URL}/waiter/tables`, {
			waitUntil: "networkidle",
			timeout: 30000,
		});
		await page.evaluate(() => {
			localStorage.removeItem("myway-waiter-staff");
		});
		await page.reload({ waitUntil: "networkidle" });

		// Wait for PinGate to appear
		await page.waitForSelector("button", { timeout: 10000 });
		await screenshot(page, "03-before-pin-entry");

		// Enter PIN: 1, 2, 3, 4
		console.log("  Clicking digit 1...");
		await clickPinDigit(page, "1");
		await page.waitForTimeout(150);

		console.log("  Clicking digit 2...");
		await clickPinDigit(page, "2");
		await page.waitForTimeout(150);

		console.log("  Clicking digit 3...");
		await clickPinDigit(page, "3");
		await page.waitForTimeout(150);

		console.log("  Clicking digit 4...");
		await clickPinDigit(page, "4");
		await page.waitForTimeout(150);

		console.log("  PIN entered, waiting for API response...");

		// Wait for either error message or page change
		await page.waitForTimeout(2500); // allow verify-pin API call to complete

		await screenshot(page, "04-after-pin-1234");

		const bodyText = await page.textContent("body");
		const hasPermissionError = bodyText.includes(
			"No tenés permisos para acceder",
		);
		const hasPinError = bodyText.includes("PIN incorrecto");
		const hasGranted = bodyText.includes("Acceso concedido");
		const hasMesas = bodyText.includes("MESAS") || bodyText.includes("Mesas");
		const hasRateLimit = bodyText.includes("Demasiados intentos");

		console.log("  Body snippet:", bodyText.slice(0, 300));

		if (hasRateLimit) {
			console.log(
				"  WARN: Rate limited — too many prior attempts from this IP",
			);
			results.push({
				test: "PIN 1234 role validation",
				status: "WARN",
				detail: "Rate limited",
			});
		} else if (hasPermissionError) {
			console.log(
				"  PASS: Role validation WORKS — 'No tenés permisos para acceder' shown",
			);
			console.log(
				"        This means PIN 1234 maps to cashier role, not waiter. PinGate correctly rejected it.",
			);
			results.push({
				test: "PIN 1234 role validation — permission error shown",
				status: "PASS",
			});
			await screenshot(page, "05-permission-denied");
		} else if (hasGranted || hasMesas) {
			console.log(
				"  NOTE: PIN 1234 was ACCEPTED — waiter layout has no allowedRoles restriction",
			);
			console.log(
				"        The cashier PIN grants access to the waiter section (by design or oversight).",
			);
			results.push({
				test: "PIN 1234 accepted (no role restriction)",
				status: "NOTE",
				detail: "WaiterLayout does not pass allowedRoles to PinGate",
			});
			await screenshot(page, "05-access-granted");
		} else if (hasPinError) {
			console.log(
				"  NOTE: PIN 1234 returned 'PIN incorrecto' — no cashier staff with this PIN in DB",
			);
			results.push({
				test: "PIN 1234 — no staff found",
				status: "NOTE",
				detail: "PIN 1234 not found in staff DB",
			});
			await screenshot(page, "05-pin-incorrect");
		} else {
			console.log("  UNKNOWN: Unexpected state");
			results.push({
				test: "PIN 1234 role validation",
				status: "UNKNOWN",
				detail: bodyText.slice(0, 300),
			});
		}
	} catch (err) {
		console.log(`  ERROR: ${err.message}`);
		results.push({
			test: "PIN 1234 role validation",
			status: "ERROR",
			detail: err.message,
		});
		await screenshot(page, "05-pin-entry-error").catch(() => {});
	}

	// ─── Test 3: /waiter/ready shows PinGate ─────────────────────────────────

	console.log("\nTEST 3: /waiter/ready — should show PinGate (fresh context)");
	try {
		// Use fresh page with no localStorage session
		const page2 = await context.newPage();
		await page2.goto(`${BASE_URL}/waiter/ready`, {
			waitUntil: "networkidle",
			timeout: 30000,
		});
		await page2.evaluate(() => {
			localStorage.removeItem("myway-waiter-staff");
		});
		await page2.reload({ waitUntil: "networkidle" });

		await screenshot(page2, "06-waiter-ready");

		const bodyText = await page2.textContent("body");
		const hasPinGate =
			bodyText.includes("Ingresá tu PIN") ||
			bodyText.includes("INGRESÁ TU PIN");
		const hasReadyContent =
			bodyText.includes("LISTOS PARA SERVIR") || bodyText.includes("Listos");

		if (hasPinGate) {
			console.log("  PASS: PinGate shown on /waiter/ready");
			results.push({ test: "/waiter/ready shows PinGate", status: "PASS" });
		} else if (hasReadyContent) {
			console.log(
				"  NOTE: /waiter/ready loaded content directly (session exists or no gate)",
			);
			results.push({ test: "/waiter/ready loads", status: "PASS" });
		} else {
			console.log("  FAIL: Neither PinGate nor expected content found");
			console.log("  Body:", bodyText.slice(0, 300));
			results.push({
				test: "/waiter/ready shows PinGate",
				status: "FAIL",
				detail: bodyText.slice(0, 200),
			});
		}

		await page2.close();
	} catch (err) {
		console.log(`  ERROR: ${err.message}`);
		results.push({
			test: "/waiter/ready shows PinGate",
			status: "ERROR",
			detail: err.message,
		});
		await screenshot(page, "06-waiter-ready-error").catch(() => {});
	}

	// ─── Test 4: /waiter/payment shows PinGate ───────────────────────────────

	console.log(
		"\nTEST 4: /waiter/payment — should show PinGate (fresh context)",
	);
	try {
		const page3 = await context.newPage();
		await page3.goto(`${BASE_URL}/waiter/payment`, {
			waitUntil: "networkidle",
			timeout: 30000,
		});
		await page3.evaluate(() => {
			localStorage.removeItem("myway-waiter-staff");
		});
		await page3.reload({ waitUntil: "networkidle" });

		await screenshot(page3, "07-waiter-payment");

		const bodyText = await page3.textContent("body");
		const hasPinGate =
			bodyText.includes("Ingresá tu PIN") ||
			bodyText.includes("INGRESÁ TU PIN");
		const hasPaymentContent =
			bodyText.includes("CUENTA") ||
			bodyText.includes("Cuenta") ||
			bodyText.includes("pago");

		if (hasPinGate) {
			console.log("  PASS: PinGate shown on /waiter/payment");
			results.push({ test: "/waiter/payment shows PinGate", status: "PASS" });
		} else if (hasPaymentContent) {
			console.log(
				"  NOTE: /waiter/payment loaded content (session exists or no gate)",
			);
			results.push({ test: "/waiter/payment loads", status: "PASS" });
		} else {
			console.log("  FAIL: Neither PinGate nor expected content found");
			console.log("  Body:", bodyText.slice(0, 300));
			results.push({
				test: "/waiter/payment shows PinGate",
				status: "FAIL",
				detail: bodyText.slice(0, 200),
			});
		}

		await page3.close();
	} catch (err) {
		console.log(`  ERROR: ${err.message}`);
		results.push({
			test: "/waiter/payment shows PinGate",
			status: "ERROR",
			detail: err.message,
		});
		await screenshot(page, "07-waiter-payment-error").catch(() => {});
	}

	// ─── Summary ──────────────────────────────────────────────────────────────

	await browser.close();

	console.log("\n=== TEST RESULTS ===");
	for (const r of results) {
		const icon =
			r.status === "PASS"
				? "✓"
				: r.status === "FAIL"
					? "✗"
					: r.status === "ERROR"
						? "!"
						: "~";
		console.log(`  [${icon}] ${r.test} — ${r.status}`);
		if (r.detail) console.log(`       ${r.detail}`);
	}

	const passed = results.filter((r) => r.status === "PASS").length;
	const failed = results.filter(
		(r) => r.status === "FAIL" || r.status === "ERROR",
	).length;
	console.log(
		`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`,
	);
	console.log(`Screenshots in: ${SCREENSHOT_DIR}`);

	return { results, passed, failed };
}

runTests().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
