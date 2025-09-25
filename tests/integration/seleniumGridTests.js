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

const LOG_FILE = `logs/testlogconsole_${tsSuffix()}.log`;

async function appendLog(lines) {
  const text = Array.isArray(lines) ? lines.join('\n') : String(lines);
  await fs.appendFile(LOG_FILE, text + '\n', 'utf8');
}



const MAX_BODY_PREVIEW = 4096;
const networkCaptureState = new WeakMap();

function normalizeBodyForLog(body, base64Encoded = false) {
  if (body == null) {
    return null;
  }
  const textValue = String(body);
  const truncated = textValue.length > MAX_BODY_PREVIEW;
  return {
    base64Encoded: Boolean(base64Encoded),
    length: textValue.length,
    truncated,
    content: truncated ? textValue.slice(0, MAX_BODY_PREVIEW) : textValue,
  };
}

function mergeHeaders(existing = {}, incoming = {}) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    merged[key] = value;
  }
  return merged;
}

async function attachNetworkCapture(driver) {
  if (networkCaptureState.has(driver)) {
    return networkCaptureState.get(driver);
  }

  const state = {
    enabled: false,
    entries: [],
    byRequestId: new Map(),
    pending: new Set(),
    errors: [],
    error: null,
    errorLogged: false,
  };
  networkCaptureState.set(driver, state);

  const supportsCdp =
    typeof driver.sendDevToolsCommand === 'function' &&
    typeof driver.onDevToolsEvent === 'function';

  if (!supportsCdp) {
    state.error = 'DevTools protocol not supported by this driver/grid.';
    return state;
  }

  try {
    await driver.sendDevToolsCommand('Network.enable', {});
    state.enabled = true;
  } catch (err) {
    state.error = 'Network.enable failed: ' + (err && err.message ? err.message : err);
    return state;
  }

  const trackAsync = (promise) => {
    if (!promise || typeof promise.finally !== 'function') {
      return;
    }
    state.pending.add(promise);
    promise.finally(() => state.pending.delete(promise));
  };

  driver.onDevToolsEvent('Network.requestWillBeSent', (params) => {
    try {
      const { requestId, request, type, wallTime, redirectResponse } = params || {};
      if (!requestId || !request) {
        return;
      }

      let entry = state.byRequestId.get(requestId);
      if (entry && redirectResponse) {
        entry.redirectResponse = {
          status: redirectResponse.status,
          statusText: redirectResponse.statusText,
          headers: redirectResponse.headers || {},
          url: redirectResponse.url,
        };
      }

      if (entry && !redirectResponse) {
        return;
      }

      entry = {
        requestId,
        request: {
          method: request.method,
          url: request.url,
          headers: { ...(request.headers || {}) },
          body: request.postData ? normalizeBodyForLog(request.postData) : null,
        },
        response: null,
        error: null,
        resourceType: type || null,
        wallTime: wallTime || null,
      };

      state.entries.push(entry);
      state.byRequestId.set(requestId, entry);

      if (!entry.request.body) {
        const promise = driver
          .sendDevToolsCommand('Network.getRequestPostData', { requestId })
          .then((result) => {
            if (result && result.postData && !entry.request.body) {
              entry.request.body = normalizeBodyForLog(result.postData);
            }
          })
          .catch((err) => {
            const msg = err && err.message ? err.message : String(err);
            if (!/No resource with given identifier|No post data/i.test(msg)) {
              state.errors.push('getRequestPostData failed for ' + request.url + ': ' + msg);
            }
          });
        trackAsync(promise);
      }
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      state.errors.push('requestWillBeSent handler: ' + msg);
    }
  });

  driver.onDevToolsEvent('Network.requestWillBeSentExtraInfo', (params) => {
    try {
      const entry = params ? state.byRequestId.get(params.requestId) : null;
      if (!entry) return;
      entry.request.headers = mergeHeaders(entry.request.headers, params.headers || {});
      if (params.headersText && !entry.request.rawHeaders) {
        entry.request.rawHeaders = params.headersText;
      }
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      state.errors.push('requestWillBeSentExtraInfo handler: ' + msg);
    }
  });

  driver.onDevToolsEvent('Network.responseReceived', (params) => {
    try {
      const entry = params ? state.byRequestId.get(params.requestId) : null;
      const response = params ? params.response : null;
      if (!entry || !response) return;
      entry.response = entry.response || {};
      entry.response.status = response.status;
      entry.response.statusText = response.statusText;
      entry.response.url = response.url;
      entry.response.headers = mergeHeaders(entry.response.headers, response.headers || {});
      entry.response.mimeType = response.mimeType || null;
      entry.response.remoteAddress = response.remoteIPAddress || null;
      entry.response.fromDiskCache = Boolean(response.fromDiskCache);
      entry.response.fromServiceWorker = Boolean(response.fromServiceWorker);
      entry.response.timing = response.timing || null;
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      state.errors.push('responseReceived handler: ' + msg);
    }
  });

  driver.onDevToolsEvent('Network.responseReceivedExtraInfo', (params) => {
    try {
      const entry = params ? state.byRequestId.get(params.requestId) : null;
      if (!entry) return;
      entry.response = entry.response || {};
      entry.response.headers = mergeHeaders(entry.response.headers, params.headers || {});
      if (params.headersText && !entry.response.rawHeaders) {
        entry.response.rawHeaders = params.headersText;
      }
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      state.errors.push('responseReceivedExtraInfo handler: ' + msg);
    }
  });

  driver.onDevToolsEvent('Network.loadingFinished', (params) => {
    try {
      const entry = params ? state.byRequestId.get(params.requestId) : null;
      if (!entry) return;
      entry.response = entry.response || {};
      entry.response.encodedDataLength = params ? params.encodedDataLength : null;

      const promise = driver
        .sendDevToolsCommand('Network.getResponseBody', { requestId: params.requestId })
        .then((result) => {
          if (!result) return;
          entry.response.body = normalizeBodyForLog(result.body, result.base64Encoded);
        })
        .catch((err) => {
          const msg = err && err.message ? err.message : String(err);
          entry.response = entry.response || {};
          entry.response.bodyError = msg;
        });

      trackAsync(promise);
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      state.errors.push('loadingFinished handler: ' + msg);
    }
  });

  driver.onDevToolsEvent('Network.loadingFailed', (params) => {
    try {
      const entry = params ? state.byRequestId.get(params.requestId) : null;
      if (!entry) return;
      entry.error = {
        errorText: params.errorText,
        canceled: Boolean(params.canceled),
        type: params.type || null,
      };
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      state.errors.push('loadingFailed handler: ' + msg);
    }
  });

  return state;
}

/* ------------------------ Helpers for robust JSON ------------------------ */

function dateOneYearFromTodayUTC() {
  const now = new Date();
  const y = now.getUTCFullYear() + 1;
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return new Date(Date.UTC(y, m, d, 0, 0, 0)).toISOString().slice(0, 10);
}

function isDigits(str) {
  if (!str) return false;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 48 || code > 57) return false;
  }
  return true;
}

function toDateOnlyString(value, fallback = dateOneYearFromTodayUTC()) {
  if (value == null) return fallback;
  const trimmed = String(value).trim();
  if (trimmed.length === 10 && trimmed[4] === '-' && trimmed[7] === '-') {
    const y = trimmed.slice(0, 4);
    const m = trimmed.slice(5, 7);
    const d = trimmed.slice(8, 10);
    if (isDigits(y) && isDigits(m) && isDigits(d)) {
      const year = Number(y);
      const month = Number(m);
      const day = Number(d);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(Date.UTC(year, month - 1, day));
        const valid = date.getUTCFullYear() === year && (date.getUTCMonth() + 1) === month && date.getUTCDate() === day;
        if (valid) {
          return `${y}-${m}-${d}`;
        }
      }
    }
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return fallback;
  return new Date(parsed).toISOString().slice(0, 10);
}

function buildGoalPrompt({ idea, context, deadline } = {}) {
  const targetDeadline = toDateOnlyString(deadline, dateOneYearFromTodayUTC());
  const ideaTitle = idea ? sanitizeString(idea.title) : '';
  const ideaDescription = idea ? sanitizeString(idea.description) : '';
  const ideaContext = idea && (ideaTitle || ideaDescription)
    ? `
Seed idea:
- title: ${ideaTitle || '(unspecified)'}
- description: ${ideaDescription || '(unspecified)'}
Use this idea as the creative foundation for the goal.`
    : '';
  const extraContext = context ? `
Additional context:
${sanitizeString(context)}` : '';
  return `
Generate a JSON object representing a new goal creation with the following fields:
- title: concise, realistic (string, no newlines)
- description: detailed, related to the title (string, no newlines)
- deadline: EXACTLY this value -> "${targetDeadline}"
- nlpAnswers: object with these keys (strings, no newlines): positive, specific, evidence, resources, obstacles, ecology, timeline, firstStep
- "ecology" must include BOTH a positive and a negative consideration in the same string.
- All fields must be logically consistent and realistic.

STRICT OUTPUT RULES:
- Return ONLY a JSON object matching EXACTLY this schema (no extra properties):
{
  "title": "string",
  "description": "string",
  "deadline": "YYYY-MM-DD",
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
${ideaContext}${extraContext}`.trim();
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
  o.deadline = toDateOnlyString(o.deadline);
  o.nlpAnswers = o.nlpAnswers || {};
  keys.forEach(k => { o.nlpAnswers[k] = sanitizeString(o.nlpAnswers[k]); });
  return o;
}
function formatDeadlineForInput(raw, inputType) {
  const fallback = toDateOnlyString(raw);
  const baseValue = fallback ? new Date(`${fallback}T00:00:00Z`) : new Date();
  if (inputType === "datetime-local") {
    return `${fallback}T00:00`;
  }
  if (inputType === "date") {
    return fallback;
  }
  const day = String(baseValue.getDate()).padStart(2, '0');
  const month = String(baseValue.getMonth() + 1).padStart(2, '0');
  const year = String(baseValue.getFullYear());
  return `${day}/${month}/${year}`;
}



function buildGoalIdeasPrompt(limit = 100) {
  return `
Generate a JSON array with exactly ${limit} objects.
Each object must contain: {
  \"title\": \"string\",
  \"description\": \"string\"
}
Guidelines:
- The title must a goal that a person has for his life
- Keep entries realistic, diverse, and action-oriented.
- Avoid duplicates or near-duplicates.
- Do not include additional commentary or formatting.
Return ONLY the JSON array.`.trim();
}

function normalizeGoalIdeas(raw, limit) {
  if (!Array.isArray(raw)) return [];
  const items = raw.map((idea) => ({
    title: sanitizeString(idea?.title),
    description: sanitizeString(idea?.description)
  })).filter((idea) => idea.title);
  return items.slice(0, limit);
}

function extractIdeasFromText(text, limit) {
  if (!text) return [];
  const result = [];
  const pattern = /\{[^{}]*"title"\s*:\s*"([^"]+)"[^{}]*"description"\s*:\s*"([^"]+)"[^{}]*\}/g;
  let match;
  while (result.length < limit && (match = pattern.exec(text))) {
    result.push({ title: sanitizeString(match[1]), description: sanitizeString(match[2]) });
  }
  return result;
}

// Fetch a deterministic-sized batch of candidate goals we can sample from.
async function generateGoalIdeas(limit = 100) {
  const prompt = buildGoalIdeasPrompt(limit);
  const body = {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    format: 'json',
    keep_alive: '10m',
    options: {
      temperature: 0.1,
      top_p: 0.9,
      num_predict: 2048
    }
  };

  const res = await fetch(`${OLLAMA_API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama idea generator error: ${res.status} ${res.statusText}
${text}`);
  }

  const data = await res.json();
  let payload = data?.response ?? '';
  if (!payload) {
    throw new Error(`Empty response when generating goal ideas. Full payload: ${JSON.stringify(data)}`);
  }

  let ideas;
  try {
    ideas = JSON.parse(payload);
  } catch (err) {
    const repaired = extractLikelyJson(payload);
    if (repaired) {
      try {
        ideas = JSON.parse(repaired);
      } catch {}
    }
    if (!ideas) {
      const softened = payload
        .replace(/\r?\n+/g, ' ')
        .replace(/,\s*([\}\]])/g, '$1');
      try {
        ideas = JSON.parse(softened);
      } catch {}
    }
    if (!ideas) {
      const extracted = extractIdeasFromText(payload, limit);
      if (extracted.length) {
        ideas = extracted;
      } else {
        throw new Error(`Failed to parse goal ideas JSON: ${err.message}
Response text:
${payload}`);
      }
    }
  }

  const explain = payload ? payload.slice(0, 200) : "\\";
  const normalized = normalizeGoalIdeas(ideas, limit);
  if (!normalized.length) {
    const extracted = extractIdeasFromText(payload, limit);
    if (extracted.length) {
      return extracted;
    }
    throw new Error('Goal idea generator returned no usable entries.');
  }
  return normalized;
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
async function generateGoalData(options) {
  const isStringPrompt = typeof options === 'string';
  const config = (!isStringPrompt && options) ? options : {};
  const prompt = isStringPrompt ? options : buildGoalPrompt(config);
  const body = {
    model: OLLAMA_MODEL,
    prompt, // safe default when caller passes nothing
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
  console.log('Navigating to login page...');
  await driver.get(`${BASE_URL}/login/Login`);

  console.log('Waiting for email input...');
  const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
  await emailInput.sendKeys(TEST_USER_EMAIL);

  console.log('Entering password...');
  const passwordInput = await driver.findElement(By.id('password'));
  await passwordInput.sendKeys(TEST_USER_PASSWORD);

  console.log('Submitting login form...');
  const submitButton = await driver.findElement(By.css('button[type="submit"]'));
  await submitButton.click();

  console.log('Waiting for dashboard redirect...');
  await driver.wait(until.urlContains('/dashboard'), 10000);
}

async function viewUserDashboard(driver) {
  console.log('Navigating to user dashboard...');
  await driver.get(`${BASE_URL}/dashboard?type=user`);

  console.log('Waiting for dashboard heading elements...');
  await driver.wait(until.elementLocated(By.css('h1, h2, h3')), 10000);

  console.log('Verifying dashboard heading...');
  const heading = await driver.findElement(By.css('h1, h2, h3'));
  const text = await heading.getText();
  console.log(`Dashboard heading found: "${text}"`);
  if (!text.toLowerCase().includes('adventurer') && !text.toLowerCase().includes('dashboard')) {
    throw new Error('User dashboard heading not found or unexpected');
  }
}



async function createNewGoal(driver, goalData) {
  console.log('Navigating to goals page...');
  await driver.get(`${BASE_URL}/goals`);
  console.log('Goal data to create:', goalData);

  console.log('Waiting for goal form to load...');
  const form = await driver.wait(
    until.elementLocated(
      By.css('form[data-testid="goal-form"], form#goal-form, form[action*="goal"], form')
    ),
    10000
  );
  console.log('Goal form found, starting form filling...');

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

  // --- DEADLINE (prefer date-only inputs; fall back gracefully) ---
  const deadlineSelectors = [
    'input[type="date"]',
    'input[name="deadline"]',
    '#deadline',
    'input[type="datetime-local"]'
  ];
  const deadlineInput = await findFirstVisible(driver, deadlineSelectors);
  if (!deadlineInput) {
    throw new Error('Goal deadline input not found on the page.');
  }
  const deadlineType = (await deadlineInput.getAttribute('type') || '').toLowerCase();
  const formattedDeadline = '31/12/2026';
  await typeSafely(deadlineInput, formattedDeadline);

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
  console.log('Submitting goal creation form...');
  const submitButton = await driver.findElement(By.css('button[type="submit"], [data-testid="save-goal"]'));
  await submitButton.click();

  // Verify title appears somewhere (list, toast, detail view)
  console.log('Verifying goal was created successfully...');
  await driver.wait(
    until.elementLocated(By.xpath(`//*[contains(normalize-space(.), "${titleFallback(goalData)}")]`)),
    10000
  );
  console.log('Goal creation completed successfully');
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

  await attachNetworkCapture(driver);

  try {
    console.log('Starting login test...');
    await dumpBrowserConsole(driver, 'BEFORE LOGIN');
    await driver.get('https://www.example.com');
    await login(driver);
    console.log('Login test passed.');
    await dumpBrowserConsole(driver, 'AFTER LOGIN');

    console.log('Starting user dashboard view test...');
    await dumpBrowserConsole(driver, 'BEFORE DASHBOARD');
    await viewUserDashboard(driver);
    console.log('User dashboard view test passed.');
    await dumpBrowserConsole(driver, 'AFTER DASHBOARD');

    // Generate a larger idea pool to keep UI flows varied between runs.
    console.log('Generating goal ideas from Ollama AI (first 100)...');
    const goalIdeas = await generateGoalIdeas(100);
    console.log(`Received ${goalIdeas.length} ideas.`);
    const seedIdea = goalIdeas[Math.floor(Math.random() * goalIdeas.length)] || null;
    console.log('Selected seed idea for goal generation:', seedIdea);
    const goalData = await generateGoalData({ idea: seedIdea });
    console.log('Generated goal data:', goalData);
    console.log('Starting create new goal test...');
    await dumpBrowserConsole(driver, 'BEFORE CREATE GOAL');
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

async function dumpNetworkFallbackFromPerformance(driver, { onlyErrors = true } = {}) {
  try {
    const perf = await driver.manage().logs().get('performance');
    if (!perf.length) {
      return false;
    }

    const requests = new Map();
    const responses = [];

    for (const entry of perf) {
      const message = parsePerfLogMessage(entry.message);
      if (!message) continue;

      if (message.method === 'Network.requestWillBeSent') {
        const { requestId, request } = message.params || {};
        if (requestId && request) {
          requests.set(requestId, { url: request.url, method: request.method });
        }
      }

      if (message.method === 'Network.responseReceived') {
        const { requestId, response } = message.params || {};
        const meta = requestId ? requests.get(requestId) : null;
        if (response) {
          responses.push({
            status: response.status,
            url: response.url || (meta && meta.url),
            method: (meta && meta.method) || '',
          });
        }
      }
    }

    const filtered = onlyErrors ? responses.filter(r => r.status >= 400) : responses;
    const header = '\n===== NETWORK ' + (onlyErrors ? '(errors only)' : '(all)') + ' @ ' + new Date().toISOString() + ' =====';

    const lines = [header];
    if (!filtered.length) {
      lines.push('(no entries)');
    } else {
      lines.push(...filtered.map(r => r.status + ' ' + r.method + ' ' + r.url));
    }
    lines.push('');

    await appendLog(lines);
    return true;
  } catch (err) {
    await appendLog('network log capture not supported: ' + (err && err.message ? err.message : err));
    return false;
  }
}

async function dumpNetwork(driver, { onlyErrors = true } = {}) {
  const state = networkCaptureState.get(driver);
  if (state && state.enabled) {
    if (state.pending.size) {
      await Promise.all(Array.from(state.pending));
    }

    const entries = onlyErrors
      ? state.entries.filter(entry => entry.error || (entry.response && entry.response.status >= 400))
      : state.entries;

    const header = '\n===== NETWORK CAPTURE ' + (onlyErrors ? '(errors only)' : '(all)') + ' @ ' + new Date().toISOString() + ' =====';
    const lines = [header];

    if (!entries.length) {
      lines.push('(no entries)');
    } else {
      for (const entry of entries) {
        const record = {
          request: entry.request,
          response: entry.response,
        };
        if (entry.error) {
          record.error = entry.error;
        }
        lines.push(JSON.stringify(record, null, 2));
      }
    }

    if (state.errors.length) {
      lines.push('Capture warnings:');
      lines.push(JSON.stringify(state.errors, null, 2));
      state.errors = [];
    }

    lines.push('');
    await appendLog(lines);
    return;
  }

  if (state && state.error && !state.errorLogged) {
    await appendLog('network capture unavailable: ' + state.error);
    state.errorLogged = true;
  }

  await dumpNetworkFallbackFromPerformance(driver, { onlyErrors });
}



// ES module equivalent of `if (require.main === module)`
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  runTests();
}
