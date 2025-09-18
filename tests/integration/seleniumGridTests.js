/**
 * Selenium Grid Integration Tests with Ollama AI for Dynamic Goal Data Generation
 *
 * Environment Variables:
 *  - SELENIUM_GRID_URL: URL of Selenium Grid Hub (default: http://localhost:4444/wd/hub)
 *  - BASE_URL: Base URL of the application (default: http://localhost:8080)
 *  - TEST_USER_EMAIL: Test user email for login
 *  - TEST_USER_PASSWORD: Test user password for login
 *  - OLLAMA_API_URL: URL of local Ollama API (default: http://localhost:11434)
 */

import { Builder, By, until, Key } from 'selenium-webdriver';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promises as fs } from 'fs';

const SELENIUM_GRID_URL = process.env.SELENIUM_GRID_URL || 'http://localhost:4444/wd/hub';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'benjamin4@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '@mONKEY1234';
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:5001';
const OLLAMA_MODEL = 'phi4-mini-reasoning:latest';

/**
 * Legacy example prompt (kept for reference). We no longer rely on this directly because
 * we now *precompute* the deadline and build a stricter prompt at runtime.
 */
const ollamaPromptExample = `
Generate a JSON object representing a new goal creation with the following fields:
- title: a concise, realistic goal title
- description: a detailed description related to the title
- deadline: a timestamp string in ISO 8601 format exactly one year from today (UTC)
- nlpAnswers: an object with the following keys, each with a meaningful, complete answer:
  positive, specific, evidence, resources, obstacles, ecology, timeline, firstStep
- Ecology must be positive and negative
Ensure:
- All fields are logically consistent and realistic.
- The JSON is valid and parsable.
- Example output format:
- No additional properties.
- No trailing commas.
- Do not put raw newline characters in strings; replace them with spaces.
- Output ONLY the JSON object, no prose.

Return ONLY a JSON object matching EXACTLY this schema:
{
  "title": "Learn to play the guitar",
  "description": "Master basic chords and songs to perform live.",
  "deadline": "2025-06-15T00:00:00Z",
  "nlpAnswers": {
    "positive": "I will feel accomplished and confident.",
    "specific": "Practice 30 minutes daily focusing on chords.",
    "evidence": "I can already play simple melodies.",
    "resources": "Online tutorials, guitar teacher, practice guitar.",
    "obstacles": "Time management and finger pain.",
    "ecology": "My family supports my learning. I'll have less time with my son ",
    "timeline": "Practice daily for 6 months.",
    "firstStep": "Buy a beginner guitar and tuner."
  }
}
`;




// timestamp like 2025-09-16_12-34-56-0300
function tsSuffix() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const off = -now.getTimezoneOffset(); // minutes east of UTC
  const sign = off >= 0 ? '+' : '-';
  const hh = pad(Math.floor(Math.abs(off) / 60));
  const mm = pad(Math.abs(off) % 60);
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_` +
         `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}` +
         `${sign}${hh}${mm}`;
}

const LOG_FILE = `testlogconsole_${tsSuffix()}.log`;

async function appendLog(lines) {
  const text = Array.isArray(lines) ? lines.join('\n') : String(lines);
  await fs.appendFile(LOG_FILE, text + '\n', 'utf8');
}



/* ------------------------ Helpers for robust JSON ------------------------ */

function isoOneYearFromTodayUTC() {
  const now = new Date();
  const y = now.getUTCFullYear() + 1;
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const dt = new Date(Date.UTC(y, m, d, 0, 0, 0));
  return dt.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function buildGoalPrompt(userContext = '') {
  const deadline = isoOneYearFromTodayUTC();
  return `
Generate a JSON object representing a new goal creation with the following fields:
- title: concise, realistic (string, no newlines)
- description: detailed, related to the title (string, no newlines)
- deadline: EXACTLY this value -> "${deadline}"
- nlpAnswers: object with these keys (strings, no newlines): positive, specific, evidence, resources, obstacles, ecology, timeline, firstStep
- "ecology" must include BOTH a positive and a negative consideration in the same string.
- All fields must be logically consistent and realistic.

STRICT OUTPUT RULES:
- Return ONLY a JSON object matching EXACTLY this schema (no extra properties):
{
  "title": "string",
  "description": "string",
  "deadline": "YYYY-MM-DDTHH:MM:SSZ",
  "nlpAnswers": {
    "positive": "string",
    "specific": "string",
    "evidence": "string",
    "resources": "string",      // e.g., "Online tutorials, mentor, course"
    "obstacles": "string",
    "ecology": "string",        // include both positive and negative aspects
    "timeline": "string",
    "firstStep": "string"
  }
}
- No trailing commas.
- Do not put raw newline characters in strings; replace them with spaces.
- Output ONLY the JSON object, no prose.
${userContext ? `\nContext:\n${userContext}\n` : ''}`.trim();
}

function sanitizeString(v) {
  if (Array.isArray(v)) v = v.join(', ');
  if (v == null) v = '';
  return String(v).replace(/\r?\n+/g, ' ').trim();
}



async function typeSafely(el, text) {
  await el.click();
  try { await el.clear(); } catch {}
  await el.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.DELETE, text);
}

async function findFirstVisible(driver, selectors) {
  for (const sel of selectors) {
    const els = await driver.findElements(By.css(sel));
    for (const el of els) {
      if (await el.isDisplayed()) return el;
    }
  }
  return null;
}

function titleFallback(goalData) {
  const t = (goalData?.title || '').trim();
  if (t) return t;
  const d = (goalData?.description || '').trim();
  if (d) return d.split(/\s+/).slice(0, 6).join(' ');
  return `New goal ${new Date().toISOString().slice(0, 16)}`;
}




function normalizeGoalData(o) {
  const keys = ['positive', 'specific', 'evidence', 'resources', 'obstacles', 'ecology', 'timeline', 'firstStep'];
  o = o || {};
  o.title = sanitizeString(o.title);
  o.description = sanitizeString(o.description);
  o.deadline = typeof o.deadline === 'string' ? o.deadline : isoOneYearFromTodayUTC();
  o.nlpAnswers = o.nlpAnswers || {};
  keys.forEach(k => { o.nlpAnswers[k] = sanitizeString(o.nlpAnswers[k]); });
  return o;
}

// Finds the longest balanced {...} or [...] block in a string.
function extractLikelyJson(s) {
  const stack = [];
  let start = -1, best = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{' || ch === '[') {
      if (stack.length === 0) start = i;
      stack.push(ch);
    } else if ((ch === '}' && stack[stack.length - 1] === '{') ||
               (ch === ']' && stack[stack.length - 1] === '[')) {
      stack.pop();
      if (stack.length === 0 && start >= 0) {
        const candidate = s.slice(start, i + 1);
        if (candidate.length > best.length) best = candidate;
      }
    }
  }
  return best || null;
}

/* ------------------------ Ollama integration ------------------------ */

/**
 * Generate goal data with Ollama. If called without args, we build a strict prompt on the fly.
 */
async function generateGoalData(promptOverride) {
  const body = {
    model: OLLAMA_MODEL,
    prompt: promptOverride || buildGoalPrompt(), // <-- FIX: safe default when caller passes nothing
    stream: false,
    format: 'json',
    keep_alive: '10m',
    options: {
      temperature: 0.2,   // more deterministic JSON
      num_predict: 1280,  // more room to avoid truncation mid-string
      top_p: 0.9
    }
  };

  const res = await fetch(`${OLLAMA_API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}\n${text}`);
  }

  const data = await res.json();
  let text = data?.response ?? '';
  if (!text) {
    throw new Error(`Empty response from Ollama. Full payload: ${JSON.stringify(data)}`);
  }

  // Primary parse (format:"json" should make this succeed)
  try {
    return normalizeGoalData(JSON.parse(text));
  } catch (e) {
    // --- Repair fallback ---
    const repaired = extractLikelyJson(text);
    if (repaired) {
      try { return normalizeGoalData(JSON.parse(repaired)); } catch {}
    }
    const softened = text
      .replace(/\r?\n+/g, ' ')   // strip raw newlines in strings
      .replace(/,\s*([}\]])/g, '$1'); // remove trailing commas
    try { return normalizeGoalData(JSON.parse(softened)); } catch {}

    throw new Error(`Failed to parse JSON: ${e.message}\nResponse text:\n${text}`);
  }
}

/* ------------------------ Selenium test helpers ------------------------ */

async function login(driver) {
  await driver.get(`${BASE_URL}/login/Login`);

  const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
  await emailInput.sendKeys(TEST_USER_EMAIL);

  const passwordInput = await driver.findElement(By.id('password'));
  await passwordInput.sendKeys(TEST_USER_PASSWORD);

  const submitButton = await driver.findElement(By.css('button[type="submit"]'));
  await submitButton.click();

  await driver.wait(until.urlContains('/dashboard'), 10000);
}

async function viewUserDashboard(driver) {
  await driver.get(`${BASE_URL}/dashboard?type=user`);

  await driver.wait(until.elementLocated(By.css('h1, h2, h3')), 10000);

  const heading = await driver.findElement(By.css('h1, h2, h3'));
  const text = await heading.getText();
  if (!text.toLowerCase().includes('adventurer') && !text.toLowerCase().includes('dashboard')) {
    throw new Error('User dashboard heading not found or unexpected');
  }
}



async function createNewGoal(driver, goalData) {
  await driver.get(`${BASE_URL}/goals`);

  // Wait for the form area to exist
  const form = await driver.wait(
    until.elementLocated(
      By.css('form[data-testid="goal-form"], form#goal-form, form[action*="goal"], form')
    ),
    10000
  );

  // --- TITLE (reliable selectors + label fallback) ---
  const titleSelectors = [
    'input[name="title"]',
    '#title',
    'input#title',
    '[aria-label*="title" i]',
    'input[placeholder*="title" i]',
    'input[name*="goalTitle" i]'
  ];
  let titleInput = await findFirstVisible(driver, titleSelectors);

  if (!titleInput) {
    // Fallback by label → first following input
    const labeled = await driver.findElements(
      By.xpath("//label[contains(translate(normalize-space(.),'TITLE','title'),'title')]/following::input[1]")
    );
    titleInput = labeled.find(async el => await el.isDisplayed()) || labeled[0];
  }

  if (!titleInput) {
    throw new Error('Goal title input not found on the page.');
  }

  await typeSafely(titleInput, titleFallback(goalData));

  // --- DESCRIPTION ---
  const descSelectors = [
    'textarea[name="description"]',
    '#description',
    'textarea#description',
    '[aria-label*="description" i]',
    'textarea[placeholder*="description" i]',
    'form textarea'
  ];
  const descriptionInput = await findFirstVisible(driver, descSelectors);
  if (!descriptionInput) {
    throw new Error('Goal description textarea not found on the page.');
  }
  await typeSafely(descriptionInput, goalData.description || '');

  // --- DEADLINE (datetime-local expects yyyy-MM-ddTHH:mm local time) ---
  const deadlineInput = await driver.findElement(By.css('input[type="datetime-local"]'));
  const deadlineDate = new Date(goalData.deadline);
  const pad = n => n.toString().padStart(2, '0');
  const localISO =
    `${deadlineDate.getFullYear()}-${pad(deadlineDate.getMonth() + 1)}-${pad(deadlineDate.getDate())}` +
    `T${pad(deadlineDate.getHours())}:${pad(deadlineDate.getMinutes())}`;
  await typeSafely(deadlineInput, localISO);

  // --- NLP answers ---
  const nlpKeys = [
    'positive',
    'specific',
    'evidence',
    'resources',
    'obstacles',
    'ecology',
    'timeline',
    'firstStep'
  ];

  // Prefer your test container if present
  let nlpTextareas = await driver.findElements(By.css('[data-testid="nlp-questions"] textarea'));
  if (nlpTextareas.length !== nlpKeys.length) {
    // Fallback: all visible textareas under the form except the main description (already filled)
    const allTextareas = await driver.findElements(By.css('form textarea'));
    // Heuristic: title is input; first textarea is description → skip it
    nlpTextareas = allTextareas.slice(1);
  }
  if (nlpTextareas.length < nlpKeys.length) {
    throw new Error(`Expected ${nlpKeys.length} NLP textareas, found ${nlpTextareas.length}`);
  }

  for (let i = 0; i < nlpKeys.length; i++) {
    await typeSafely(nlpTextareas[i], (goalData.nlpAnswers?.[nlpKeys[i]] || '').trim());
  }

  // Submit
  const submitButton = await driver.findElement(By.css('button[type="submit"], [data-testid="save-goal"]'));
  await submitButton.click();

  // Verify title appears somewhere (list, toast, detail view)
  await driver.wait(
    until.elementLocated(By.xpath(`//*[contains(normalize-space(.), "${titleFallback(goalData)}")]`)),
    10000
  );
}


/* ------------------------ Test runner ------------------------ */

async function runTests() {

 const capabilities = {
   browserName: 'chrome',                       // or 'MicrosoftEdge'
   'goog:loggingPrefs': {                       // <- console + CDP perf logs
     browser: 'ALL',
     performance: 'ALL'
   },
   // optional: extra devtools verbosity if you want
   'goog:chromeOptions': {
     args: [] // e.g. ['--auto-open-devtools-for-tabs']
   }
 };

 const driver = await new Builder()
   .usingServer(SELENIUM_GRID_URL)
   .withCapabilities(capabilities)
   .build();


  try {
    console.log('Starting login test...');
    await driver.get('https://www.example.com');
    await login(driver);
    console.log('Login test passed.');

    console.log('Starting user dashboard view test...');
    await viewUserDashboard(driver);
    console.log('User dashboard view test passed.');

    console.log('Generating goal data from Ollama AI...');
    const goalData = await generateGoalData(); // <-- works with default prompt now
    console.log('Generated goal data:', goalData);
    console.log('Starting create new goal test...');
    await createNewGoal(driver, goalData);
    console.log('Create new goal test passed.');
    await dumpBrowserConsole(driver, 'AFTER CREATE GOAL');
    await dumpNetwork(driver, { onlyErrors: true });
    
  } catch (err) {
    console.error('Test failed:', err);
    // on failure, dump everything we have
   await dumpBrowserConsole(driver, 'FINAL');
   await dumpNetwork(driver, { onlyErrors: false })
  } finally {
    await dumpBrowserConsole(driver, 'FINAL');
    await dumpNetwork(driver, { onlyErrors: false })
    await driver.quit();
   }
}
async function dumpBrowserConsole(driver, label = '') {
  try {
    const entries = await driver.manage().logs().get('browser'); // console logs
    if (!entries.length) return;
    const header = `\n===== BROWSER CONSOLE ${label} @ ${new Date().toISOString()} =====`;
    const lines = [header, ...entries.map(e => {
      const lvl = e.level?.name || e.level || '';
      return `[${lvl}] ${e.timestamp} ${e.message}`;
    }), ''];
    await appendLog(lines);
  } catch (err) {
    await appendLog(`console log capture not supported: ${err.message || err}`);
  }
}

function parsePerfLogMessage(msg) {
  try { return JSON.parse(msg).message; } catch { return null; }
}

async function dumpNetwork(driver, { onlyErrors = true } = {}) {
  try {
    const perf = await driver.manage().logs().get('performance');
    if (!perf.length) return;

    const requests = new Map(); // requestId -> { url, method }
    const responses = [];

    for (const entry of perf) {
      const m = parsePerfLogMessage(entry.message);
      if (!m) continue;

      if (m.method === 'Network.requestWillBeSent') {
        const { requestId, request } = m.params || {};
        if (requestId && request) {
          requests.set(requestId, { url: request.url, method: request.method });
        }
      }
      if (m.method === 'Network.responseReceived') {
        const { requestId, response } = m.params || {};
        const meta = requests.get(requestId) || {};
        if (response) {
          responses.push({
            status: response.status,
            url: response.url || meta.url,
            method: meta.method || '',
          });
        }
      }
    }

    const filtered = onlyErrors ? responses.filter(r => r.status >= 400) : responses;
    const header = `\n===== NETWORK ${onlyErrors ? '(errors only)' : '(all)'} @ ${new Date().toISOString()} =====`;
    if (!filtered.length) {
      await appendLog([header, '(no entries)', '']);
      return;
    }
    await appendLog([
      header,
      ...filtered.map(r => `${r.status} ${r.method} ${r.url}`),
      ''
    ]);
  } catch (err) {
    await appendLog(`network log capture not supported: ${err.message || err}`);
  }
}



// ES module equivalent of `if (require.main === module)`
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  runTests();
}
