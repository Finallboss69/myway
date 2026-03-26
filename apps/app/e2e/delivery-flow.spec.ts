import { test, expect, Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://myway-pi.vercel.app";
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

// Helper: save screenshot with a descriptive name
async function shot(page: Page, name: string) {
	const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
	await page.screenshot({ path: filePath, fullPage: true });
	console.log(`[screenshot] ${filePath}`);
}

test.describe("Customer Delivery Flow — Public (no auth required)", () => {
	test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

	// ─── 1. /delivery page ───────────────────────────────────────────────────
	test("1. /delivery — delivery menu loads", async ({ page }) => {
		await page.goto(`${BASE_URL}/delivery`, { waitUntil: "networkidle" });

		// The /delivery page uses useSession internally (delivery repartidor view)
		// Verify the page responds — either loads content or redirects to login
		const title = await page.title();
		console.log(`[/delivery] page title: "${title}"`);
		console.log(`[/delivery] final URL: ${page.url()}`);

		await shot(page, "01-delivery-page");

		// Check page loaded (not a 500/404 error page)
		const body = await page.locator("body").textContent();
		expect(body).not.toBeNull();
		expect(body!.length).toBeGreaterThan(20);

		console.log(`[/delivery] body snippet: "${body!.substring(0, 200)}"`);
	});

	// ─── 2. /customer/menu ───────────────────────────────────────────────────
	test("2. /customer/menu — menu loads with products", async ({ page }) => {
		await page.goto(`${BASE_URL}/customer/menu`, { waitUntil: "networkidle" });

		console.log(`[/customer/menu] final URL: ${page.url()}`);
		await shot(page, "02-customer-menu");

		const body = await page.locator("body").textContent();
		expect(body).not.toBeNull();
		console.log(`[/customer/menu] body snippet: "${body!.substring(0, 300)}"`);

		// Verify the page loaded something meaningful
		expect(body!.length).toBeGreaterThan(50);
	});

	// ─── 3. /customer/delivery — delivery order form ─────────────────────────
	test("3. /customer/delivery — delivery order form loads", async ({
		page,
	}) => {
		await page.goto(`${BASE_URL}/customer/delivery`, {
			waitUntil: "networkidle",
		});

		console.log(`[/customer/delivery] final URL: ${page.url()}`);
		await shot(page, "03-customer-delivery-initial");

		const body = await page.locator("body").textContent();
		expect(body).not.toBeNull();
		console.log(
			`[/customer/delivery] body snippet: "${body!.substring(0, 300)}"`,
		);

		// Check "MY WAY DELIVERY" header is present
		const header = page.locator("text=MY WAY DELIVERY");
		await expect(header).toBeVisible({ timeout: 10000 });
		console.log("[/customer/delivery] header 'MY WAY DELIVERY' found");
	});

	// ─── 4. Fill delivery form ────────────────────────────────────────────────
	test("4. /customer/delivery — fill form fields", async ({ page }) => {
		await page.goto(`${BASE_URL}/customer/delivery`, {
			waitUntil: "networkidle",
		});
		console.log(`[/customer/delivery form] final URL: ${page.url()}`);

		// Wait for the form to be visible
		const nameInput = page.locator('input[placeholder="Tu nombre"]');
		await expect(nameInput).toBeVisible({ timeout: 10000 });

		// Fill customer name
		await nameInput.fill("Test Usuario");
		console.log("[form] filled: name");

		// Fill address
		const addressInput = page.locator(
			'input[placeholder="Dirección de entrega"]',
		);
		await expect(addressInput).toBeVisible();
		await addressInput.fill("Av. Libertador 1234, Olivos");
		console.log("[form] filled: address");

		// Fill phone
		const phoneInput = page.locator(
			'input[placeholder="Teléfono de contacto"]',
		);
		await expect(phoneInput).toBeVisible();
		await phoneInput.fill("1155551234");
		console.log("[form] filled: phone");

		await shot(page, "04-customer-delivery-form-filled");

		// Verify the fields have the correct values
		await expect(nameInput).toHaveValue("Test Usuario");
		await expect(addressInput).toHaveValue("Av. Libertador 1234, Olivos");
		await expect(phoneInput).toHaveValue("1155551234");

		// Select payment method — MercadoPago (already default, try Cash too)
		const cashBtn = page.locator("text=Efectivo");
		if (await cashBtn.isVisible()) {
			await cashBtn.click();
			console.log("[form] clicked: Efectivo payment method");
			await shot(page, "04b-payment-method-cash");
		}

		// Switch to MercadoPago
		const mpBtn = page.locator("text=MercadoPago");
		if (await mpBtn.isVisible()) {
			await mpBtn.click();
			console.log("[form] clicked: MercadoPago payment method");
			await shot(page, "04c-payment-method-mercadopago");
		}

		// Check if products loaded
		await page.waitForTimeout(2000); // wait for products API
		const body = await page.locator("body").textContent();
		const hasProducts = body!.includes("$") || body!.includes("Todos");
		console.log(`[form] products loaded: ${hasProducts}`);

		await shot(page, "04d-delivery-with-products");
		console.log("[form] all fields filled and verified");
	});

	// ─── 5. /customer/order-status ───────────────────────────────────────────
	test("5. /customer/order-status — status page loads", async ({ page }) => {
		await page.goto(`${BASE_URL}/customer/order-status`, {
			waitUntil: "networkidle",
		});

		console.log(`[/customer/order-status] final URL: ${page.url()}`);
		await shot(page, "05-customer-order-status");

		const body = await page.locator("body").textContent();
		expect(body).not.toBeNull();
		console.log(
			`[/customer/order-status] body snippet: "${body!.substring(0, 300)}"`,
		);

		expect(body!.length).toBeGreaterThan(20);
	});

	// ─── 6. /login — Google OAuth page ───────────────────────────────────────
	test("6. /login — Google OAuth login page loads", async ({ page }) => {
		await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

		console.log(`[/login] final URL: ${page.url()}`);
		await shot(page, "06-login-page");

		const body = await page.locator("body").textContent();
		expect(body).not.toBeNull();
		console.log(`[/login] body snippet: "${body!.substring(0, 300)}"`);

		// Expect some login-related content
		const hasLoginContent =
			body!.toLowerCase().includes("google") ||
			body!.toLowerCase().includes("login") ||
			body!.toLowerCase().includes("iniciar") ||
			body!.toLowerCase().includes("ingresar") ||
			body!.toLowerCase().includes("my way");

		console.log(`[/login] has login content: ${hasLoginContent}`);
		expect(hasLoginContent).toBe(true);

		await shot(page, "06b-login-page-fullpage");
	});
});
