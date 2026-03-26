/**
 * E2E test: Admin flow on https://myway-pi.vercel.app
 * Tests PinGate with PIN 1234 (cashier role) and all admin subpages.
 */

import { chromium } from '/workspace/myway/apps/app/node_modules/playwright/index.mjs';
import { existsSync, mkdirSync } from 'fs';

const BASE_URL = 'https://myway-pi.vercel.app';
const PIN = ['1', '2', '3', '4'];
const SCREENSHOTS_DIR = '/workspace/myway/e2e-tests/screenshots';
const TIMEOUT = 15000;

if (!existsSync(SCREENSHOTS_DIR)) mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const ADMIN_PAGES = [
  '/admin',
  '/admin/menu',
  '/admin/tables',
  '/admin/employees',
  '/admin/delivery',
  '/admin/analytics',
  '/admin/expenses',
  '/admin/cash-register',
  '/admin/invoices',
  '/admin/suppliers',
  '/admin/mercadopago',
  '/admin/afip-config',
  '/admin/accounting',
  '/admin/repartidores',
];

const results = [];

function log(msg) {
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${time}] ${msg}`);
}

async function waitForNetworkIdle(page, ms = 2000) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch {
    // fallback: just wait for domcontentloaded
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
  }
}

async function enterPinOnGate(page) {
  // Check if PinGate is visible — look for numpad buttons
  const hasPinGate = await page.locator('button').filter({ hasText: /^[0-9]$/ }).first().isVisible({ timeout: 5000 }).catch(() => false);
  if (!hasPinGate) {
    log('  No PinGate numpad found on this page');
    return { found: false };
  }

  log('  PinGate detected, entering PIN 1234...');

  // Click each digit
  for (const digit of PIN) {
    const btn = page.locator('button').filter({ hasText: new RegExp(`^${digit}$`) }).first();
    await btn.click({ timeout: TIMEOUT });
    await page.waitForTimeout(200);
  }

  // Wait for response (either redirect or error message)
  await page.waitForTimeout(1500);

  // Check for error message
  const pageContent = await page.content();
  const hasPermissionError =
    pageContent.includes('No tenés permisos') ||
    pageContent.includes('permisos') ||
    pageContent.includes('acceso') ||
    pageContent.includes('rol') ||
    pageContent.includes('unauthorized') ||
    pageContent.includes('Unauthorized');

  const hasSuccess = !hasPermissionError && (
    pageContent.includes('Dashboard') ||
    pageContent.includes('Admin') ||
    pageContent.includes('Menú') ||
    pageContent.includes('sidebar') ||
    page.url().includes('/admin') && !pageContent.includes('PIN')
  );

  return { found: true, hasPermissionError, hasSuccess, url: page.url() };
}

async function testPage(page, path, screenshotName) {
  const url = `${BASE_URL}${path}`;
  log(`\nTesting: ${url}`);

  const result = { path, url, status: 'unknown', error: null, screenshot: null, pinGateResult: null };

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await waitForNetworkIdle(page);

    result.httpStatus = response?.status();
    result.finalUrl = page.url();

    const pageContent = await page.content();
    const title = await page.title();
    result.title = title;

    // Check if PinGate is present
    const hasPinGate = await page.locator('button').filter({ hasText: /^[0-9]$/ }).count().catch(() => 0);

    if (hasPinGate > 0) {
      log(`  PinGate present (${hasPinGate} numpad buttons)`);
      result.hasPinGate = true;
      result.pinGateResult = await enterPinOnGate(page);
      await waitForNetworkIdle(page);
    } else {
      result.hasPinGate = false;
      log(`  No PinGate — page content loaded directly`);
    }

    // Take screenshot
    const screenshotPath = `${SCREENSHOTS_DIR}/${screenshotName}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshot = screenshotPath;
    log(`  Screenshot saved: ${screenshotPath}`);

    result.status = 'ok';
  } catch (err) {
    result.status = 'error';
    result.error = err.message;
    log(`  ERROR: ${err.message}`);

    // Try screenshot anyway
    try {
      const screenshotPath = `${SCREENSHOTS_DIR}/${screenshotName}-error.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshot = screenshotPath;
    } catch {}
  }

  return result;
}

async function main() {
  log('Starting MyWay Admin E2E test');
  log(`Base URL: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'es-AR',
  });

  // Clear any existing localStorage to start fresh (no prior session)
  await context.addInitScript(() => {
    localStorage.removeItem('myway-admin-staff');
    localStorage.removeItem('myway-pos-staff');
    localStorage.removeItem('myway-bar-staff');
    localStorage.removeItem('myway-waiter-staff');
  });

  const page = await context.newPage();

  // === Test 1: /admin PinGate ===
  log('\n=== TEST 1: /admin — PinGate with PIN 1234 ===');
  const adminResult = await testPage(page, '/admin', '01-admin-pingate');
  results.push(adminResult);

  // Show PinGate result details
  if (adminResult.pinGateResult?.found) {
    if (adminResult.pinGateResult.hasPermissionError) {
      log('  RESULT: "No tenés permisos" error shown — PIN 1234 is cashier, not admin (expected)');
    } else if (adminResult.pinGateResult.hasSuccess) {
      log('  RESULT: Access GRANTED — PIN 1234 accepted for admin');
    } else {
      log('  RESULT: Ambiguous — no clear error or success message');
    }
  }

  // Clear session before testing subpages
  await context.clearCookies();
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('myway-')) localStorage.removeItem(k);
    });
  });

  // === Test 2: Each subpage (check PinGate loads, take screenshots) ===
  // We'll screenshot at least 3 pages with more detail
  const screenshotPages = ['/admin/menu', '/admin/tables', '/admin/employees', '/admin/analytics', '/admin/delivery'];
  const otherPages = ADMIN_PAGES.filter(p => p !== '/admin' && !screenshotPages.includes(p));

  log('\n=== TEST 2: Admin subpages ===');

  for (let i = 0; i < screenshotPages.length; i++) {
    const path = screenshotPages[i];
    // Clear session for each page to see the PinGate
    await page.evaluate(() => {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('myway-')) localStorage.removeItem(k);
      });
    });
    const name = `0${i + 2}-admin${path.replace(/\//g, '-')}`;
    const result = await testPage(page, path, name);
    results.push(result);
  }

  // Test remaining pages quickly (just load check, no re-entering PIN)
  for (const path of otherPages) {
    await page.evaluate(() => {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('myway-')) localStorage.removeItem(k);
      });
    });
    const name = `admin${path.replace(/\//g, '-')}`;
    const result = await testPage(page, path, name);
    results.push(result);
  }

  await browser.close();

  // === Report ===
  log('\n\n========== TEST REPORT ==========');
  log(`Total pages tested: ${results.length}`);
  log('');

  let passed = 0;
  let withPinGate = 0;
  let withPermError = 0;

  for (const r of results) {
    const statusIcon = r.status === 'ok' ? 'PASS' : 'FAIL';
    const pinInfo = r.hasPinGate
      ? (r.pinGateResult?.hasPermissionError ? ' [PinGate: REJECTED - no permisos]' : r.pinGateResult?.hasSuccess ? ' [PinGate: ACCEPTED]' : ' [PinGate: present]')
      : ' [no PinGate]';

    log(`  [${statusIcon}] ${r.path}${pinInfo} (HTTP ${r.httpStatus ?? '?'})`);
    if (r.error) log(`         Error: ${r.error}`);
    if (r.screenshot) log(`         Screenshot: ${r.screenshot}`);

    if (r.status === 'ok') passed++;
    if (r.hasPinGate) withPinGate++;
    if (r.pinGateResult?.hasPermissionError) withPermError++;
  }

  log('');
  log(`Pages loaded OK: ${passed}/${results.length}`);
  log(`Pages with PinGate: ${withPinGate}`);
  log(`PinGate rejections (no permisos): ${withPermError}`);
  log('=================================');

  return results;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
