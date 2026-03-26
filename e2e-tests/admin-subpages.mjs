/**
 * Capture screenshots of admin subpages after PIN entry
 */
import { chromium } from '/workspace/myway/apps/app/node_modules/playwright/index.mjs';
import { existsSync, mkdirSync } from 'fs';

const BASE_URL = 'https://myway-pi.vercel.app';
const SCREENSHOTS_DIR = '/workspace/myway/e2e-tests/screenshots';
if (!existsSync(SCREENSHOTS_DIR)) mkdirSync(SCREENSHOTS_DIR, { recursive: true });
const PIN = ['1', '2', '3', '4'];

function log(msg) {
  console.log(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`);
}

async function testSubpage(browser, path, label) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'es-AR',
    storageState: { cookies: [], origins: [] },
  });

  const page = await context.newPage();
  log(`\nLoading ${path}...`);
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 20000 });

  // Capture before PIN
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/${label}-before.png`, fullPage: true });

  const numpadCount = await page.locator('button').filter({ hasText: /^[0-9]$/ }).count();
  log(`  Numpad buttons found: ${numpadCount}`);

  if (numpadCount >= 9) {
    // Enter PIN
    for (const digit of PIN) {
      const btn = page.locator('button').filter({ hasText: new RegExp(`^${digit}$`) }).first();
      await btn.click({ timeout: 8000 }).catch(() => log(`  Could not click ${digit}`));
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/${label}-after-pin.png`, fullPage: true });

    const bodyText = await page.locator('body').innerText().catch(() => '');
    log(`  Text: ${bodyText.slice(0, 200).replace(/\n+/g, ' ')}`);
    const hasError = bodyText.includes('No tenés permisos') || bodyText.includes('permisos');
    log(`  PinGate result: ${hasError ? 'REJECTED (no permisos)' : 'unknown'}`);
  }

  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const pages = [
    ['/admin/menu', 'sp-menu'],
    ['/admin/tables', 'sp-tables'],
    ['/admin/employees', 'sp-employees'],
    ['/admin/analytics', 'sp-analytics'],
    ['/admin/delivery', 'sp-delivery'],
    ['/admin/expenses', 'sp-expenses'],
    ['/admin/cash-register', 'sp-cash-register'],
    ['/admin/invoices', 'sp-invoices'],
    ['/admin/suppliers', 'sp-suppliers'],
    ['/admin/mercadopago', 'sp-mercadopago'],
    ['/admin/afip-config', 'sp-afip-config'],
    ['/admin/accounting', 'sp-accounting'],
    ['/admin/repartidores', 'sp-repartidores'],
  ];

  for (const [path, label] of pages) {
    await testSubpage(browser, path, label);
  }

  await browser.close();
  log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
