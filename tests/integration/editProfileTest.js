/**
 * E2E: Edit Profile Flow
 * Env vars: SELENIUM_GRID_URL, BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD
 */
import { Builder, By, until, Key } from 'selenium-webdriver';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SELENIUM_GRID_URL = process.env.SELENIUM_GRID_URL || 'http://localhost:4444/wd/hub';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
// Support both legacy and new env var names
const TEST_USER_EMAIL = process.env.GOALSGUILD_USER || process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.GOALSGUILD_PASSWORD || process.env.TEST_USER_PASSWORD;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function typeSafely(el, text) {
  await el.click();
  try { await el.clear(); } catch {}
  await el.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.DELETE, text);
}

async function login(driver) {
  await driver.get(`${BASE_URL}/login/Login`);
  const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
  await emailInput.sendKeys(TEST_USER_EMAIL);
  const passwordInput = await driver.findElement(By.id('password'));
  await passwordInput.sendKeys(TEST_USER_PASSWORD);
  const submitButton = await driver.findElement(By.css('button[type="submit"]'));
  await submitButton.click();
  await driver.wait(until.urlContains('/dashboard'), 15000);
}

async function navigateToEditProfile(driver) {
  await driver.get(`${BASE_URL}/profile`);
  // Click Edit Profile button
  const editBtn = await driver.wait(
    until.elementLocated(By.xpath("//button[.//text()[contains(., 'Edit Profile')] or contains(., 'Edit Profile')]")),
    10000
  );
  await editBtn.click();
  await driver.wait(until.urlContains('/profile/edit'), 10000);
}

async function fillProfileForm(driver) {
  // Basic Information
  const fullName = await driver.wait(until.elementLocated(By.css('input[aria-label="Full name"]')), 10000);
  await typeSafely(fullName, 'Selenium Tester');

  const nickname = await driver.findElement(By.css('input[aria-label="Nickname"]'));
  await typeSafely(nickname, `selenium_${Date.now().toString().slice(-6)}`);

  const birthDate = await driver.findElement(By.css('input[type="date"]'));
  await typeSafely(birthDate, '1992-06-15');

  // Location & Language
  const countryTrigger = await driver.findElement(By.css('div[role="combobox"], button[role="combobox"], button[aria-label="Country"], [aria-label="Country"]'));
  await countryTrigger.click();
  const us = await driver.wait(until.elementLocated(By.xpath("//*[contains(@class,'SelectItem') or @role='option' or self::div][contains(., 'United States') or contains(., 'Estados Unidos')]")), 10000);
  await us.click();

  const languageTrigger = await driver.findElement(By.css('div[role="combobox"], button[role="combobox"], button[aria-label="Language"], [aria-label="Language"]'));
  await languageTrigger.click();
  const en = await driver.wait(until.elementLocated(By.xpath("//*[contains(@class,'SelectItem') or @role='option' or self::div][contains(., 'English')]")), 10000);
  await en.click();

  // Identity
  const gender = await driver.findElement(By.css('input[aria-label="Gender"]'));
  await typeSafely(gender, 'non-binary');
  const pronouns = await driver.findElement(By.css('input[aria-label="Pronouns"]'));
  await typeSafely(pronouns, 'they/them');

  // About
  const bio = await driver.findElement(By.css('textarea[aria-label="Bio"]'));
  await typeSafely(bio, 'Automated E2E bio');
  
  // Tags - new tag input system
  const tagsInput = await driver.findElement(By.css('input[aria-label="Tags"]'));
  await typeSafely(tagsInput, 'testing');
  await tagsInput.sendKeys(Key.ENTER);
  await delay(500);
  
  await typeSafely(tagsInput, 'automation');
  await tagsInput.sendKeys(Key.ENTER);
  await delay(500);
  
  await typeSafely(tagsInput, 'e2e');
  await tagsInput.sendKeys(Key.ENTER);
  await delay(500);
}

async function saveAndVerify(driver) {
  const saveBtn = await driver.findElement(By.xpath("//button[contains(., 'Save')]"));
  await saveBtn.click();
  // Redirect back to /profile
  await driver.wait(until.urlContains('/profile'), 10000);
  // Verify name or nickname visible
  await driver.wait(until.elementLocated(By.xpath("//*[contains(., 'Selenium Tester') or contains(., '@selenium_')]")), 10000);
  // Verify tags are visible
  await driver.wait(until.elementLocated(By.xpath("//*[contains(., 'testing') or contains(., 'automation') or contains(., 'e2e')]")), 10000);
}

async function run() {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    console.error('Missing TEST_USER_EMAIL or TEST_USER_PASSWORD');
    process.exit(1);
  }

  const driver = await new Builder()
    .usingServer(SELENIUM_GRID_URL)
    .withCapabilities({
      browserName: 'chrome',
      'goog:chromeOptions': { args: ['--headless=new'] },
      'goog:loggingPrefs': { browser: 'ALL', performance: 'ALL' }
    })
    .build();

  try {
    await login(driver);
    await navigateToEditProfile(driver);
    await fillProfileForm(driver);
    await saveAndVerify(driver);
    console.log('E2E: Edit Profile flow passed');
    await captureArtifacts(driver, 'success');
  } finally {
    await driver.quit();
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  run();
}

async function captureArtifacts(driver, label) {
  try {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const baseDir = dirname(fileURLToPath(import.meta.url));
    const outDir = join(baseDir, '..', 'screenshots');
    await fs.mkdir(outDir, { recursive: true });
    const png = await driver.takeScreenshot();
    await fs.writeFile(join(outDir, `profile_edit_${label}_${ts}.png`), png, 'base64');
    const source = await driver.getPageSource();
    await fs.writeFile(join(outDir, `profile_edit_${label}_${ts}.html`), source, 'utf8');
    try {
      const logs = await driver.manage().logs().get('browser');
      const lines = logs.map(e => `[${e.level?.name || e.level}] ${e.timestamp} ${e.message}`).join('\n');
      await fs.writeFile(join(outDir, `profile_edit_${label}_${ts}.log`), lines, 'utf8');
    } catch {}
  } catch {}
}


