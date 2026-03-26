/**
 * Detailed PinGate test — captures screenshots at each step with more wait time
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

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'es-AR',
  });

  // Ensure no prior admin session
  await context.addInitScript(() => {
    ['myway-admin-staff', 'myway-pos-staff', 'myway-bar-staff', 'myway-waiter-staff']
      .forEach(k => localStorage.removeItem(k));
  });

  const page = await context.newPage();

  // --- Step 1: Load /admin fresh, screenshot before PIN entry ---
  log('Loading /admin ...');
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/step1-admin-fresh.png`, fullPage: true });
  log('Screenshot: step1-admin-fresh.png (PinGate before PIN)');

  // --- Step 2: Enter PIN digits one by one, screenshot after each ---
  log('Entering PIN 1-2-3-4...');
  for (let i = 0; i < PIN.length; i++) {
    const digit = PIN[i];
    const btn = page.locator('button').filter({ hasText: new RegExp(`^${digit}$`) }).first();
    await btn.click({ timeout: 10000 });
    log(`  Clicked digit: ${digit}`);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/step2-pin-digit-${i + 1}-${digit}.png`,
      fullPage: true
    });
  }

  // --- Step 3: Wait for response and capture result ---
  log('Waiting for PIN validation response...');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/step3-after-pin.png`, fullPage: true });

  const bodyText = await page.locator('body').innerText().catch(() => '');
  const url = page.url();

  log(`Current URL: ${url}`);
  log(`Page text snippet: ${bodyText.slice(0, 300).replace(/\n+/g, ' ')}`);

  const errorKeywords = ['No tenés permisos', 'permisos', 'acceso denegado', 'rol', 'Unauthorized', 'Error'];
  const foundError = errorKeywords.find(kw => bodyText.includes(kw));
  if (foundError) {
    log(`ERROR message detected: "${foundError}"`);
  } else {
    log('No error keyword found in page text');
  }

  // --- Step 4: Check rate limiting by trying again ---
  log('\nTrying PIN again to check for rate limit...');
  for (const digit of PIN) {
    const btn = page.locator('button').filter({ hasText: new RegExp(`^${digit}$`) }).first();
    await btn.click({ timeout: 5000 }).catch(() => log(`  Could not click ${digit}`));
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/step4-second-attempt.png`, fullPage: true });
  const bodyText2 = await page.locator('body').innerText().catch(() => '');
  log(`After 2nd attempt text: ${bodyText2.slice(0, 300).replace(/\n+/g, ' ')}`);

  // --- Step 5: Navigate to /admin/menu with no session ---
  log('\nNavigating to /admin/menu (fresh page)...');
  const page2 = await context.newPage();
  await page2.evaluate(() => {
    ['myway-admin-staff', 'myway-pos-staff', 'myway-bar-staff', 'myway-waiter-staff']
      .forEach(k => localStorage.removeItem(k));
  });
  await page2.goto(`${BASE_URL}/admin/menu`, { waitUntil: 'networkidle', timeout: 20000 });
  await page2.screenshot({ path: `${SCREENSHOTS_DIR}/step5-admin-menu.png`, fullPage: true });
  log('Screenshot: step5-admin-menu.png');

  // Enter PIN on /admin/menu
  for (const digit of PIN) {
    const btn = page2.locator('button').filter({ hasText: new RegExp(`^${digit}$`) }).first();
    await btn.click({ timeout: 10000 }).catch(() => log(`  digit ${digit} not clickable`));
    await page2.waitForTimeout(300);
  }
  await page2.waitForTimeout(2000);
  await page2.screenshot({ path: `${SCREENSHOTS_DIR}/step6-admin-menu-after-pin.png`, fullPage: true });
  const menuText = await page2.locator('body').innerText().catch(() => '');
  log(`/admin/menu after PIN: ${menuText.slice(0, 300).replace(/\n+/g, ' ')}`);

  // --- Step 6: /admin/tables ---
  log('\nNavigating to /admin/tables...');
  const page3 = await context.newPage();
  await page3.evaluate(() => {
    ['myway-admin-staff'].forEach(k => localStorage.removeItem(k));
  });
  await page3.goto(`${BASE_URL}/admin/tables`, { waitUntil: 'networkidle', timeout: 20000 });
  await page3.screenshot({ path: `${SCREENSHOTS_DIR}/step7-admin-tables.png`, fullPage: true });
  for (const digit of PIN) {
    const btn = page3.locator('button').filter({ hasText: new RegExp(`^${digit}$`) }).first();
    await btn.click({ timeout: 10000 }).catch(() => {});
    await page3.waitForTimeout(300);
  }
  await page3.waitForTimeout(2000);
  await page3.screenshot({ path: `${SCREENSHOTS_DIR}/step8-admin-tables-after-pin.png`, fullPage: true });
  const tablesText = await page3.locator('body').innerText().catch(() => '');
  log(`/admin/tables after PIN: ${tablesText.slice(0, 300).replace(/\n+/g, ' ')}`);

  await browser.close();

  log('\n=== Summary of all screenshots ===');
  const steps = [
    'step1-admin-fresh.png',
    'step2-pin-digit-4-4.png',
    'step3-after-pin.png',
    'step4-second-attempt.png',
    'step5-admin-menu.png',
    'step6-admin-menu-after-pin.png',
    'step7-admin-tables.png',
    'step8-admin-tables-after-pin.png',
  ];
  steps.forEach(s => log(`  ${SCREENSHOTS_DIR}/${s}`));
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
