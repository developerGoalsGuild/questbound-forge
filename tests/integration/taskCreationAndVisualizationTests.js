/**
 * Task Creation and Visualization Integration Tests with Ollama AI
 *
 * Environment Variables:
 *  - SELENIUM_GRID_URL: URL of Selenium Grid Hub (default: http://localhost:4444/wd/hub)
 *  - BASE_URL: Base URL of the application (default: http://localhost:8080)
 *  - TEST_USER_EMAIL: Test user email for login
 *  - TEST_USER_PASSWORD: Test user password for login
 *  - OLLAMA_API_URL: URL of local Ollama API (default: http://localhost:5001)
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

// Network capture utilities (same as original)
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

function sanitizeString(v) {
  if (Array.isArray(v)) v = v.join(', ');
  if (v == null) v = '';
  return String(v).replace(/\r?\n+/g, ' ').trim();
}

/**
 * Generate task data with Ollama based on an existing goal
 */
async function generateTaskData(goalTitle, goalDescription, goalDeadline) {
  const prompt = `
Generate a JSON array of 2-3 tasks related to the following goal:
Goal Title: ${sanitizeString(goalTitle)}
Goal Description: ${sanitizeString(goalDescription)}
Goal Deadline: ${goalDeadline}

Each task should be a JSON object with these fields:
- title: concise task title (string, no newlines)
- description: brief task description (string, no newlines)
- tags: array of 1-3 relevant tags (strings, alphanumeric + hyphens/underscores)
- status: one of "active", "paused", "completed", "archived" (string)
- dueAt: date string in YYYY-MM-DD format, must be before or equal to goal deadline: ${goalDeadline}

STRICT OUTPUT RULES:
- Return ONLY a JSON array
- No trailing commas
- No additional commentary or formatting
- Output ONLY the JSON array, no prose

Example format:
[
  {
    "title": "Research guitar brands",
    "description": "Compare different guitar brands and models for beginners",
    "tags": ["research", "shopping"],
    "status": "active",
    "dueAt": "2025-10-01"
  }
]`.trim();

  const body = {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    format: 'json',
    keep_alive: '10m',
    options: {
      temperature: 0.3,   // more creative but still deterministic for JSON
      num_predict: 2048,
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

  // Parse the JSON array
  try {
    const tasks = JSON.parse(text);
    if (!Array.isArray(tasks)) {
      throw new Error('Expected JSON array of tasks');
    }

    // Validate and sanitize each task
    return tasks.map(task => ({
      title: sanitizeString(task.title),
      description: sanitizeString(task.description),
      tags: Array.isArray(task.tags) ? task.tags.map(sanitizeString).filter(t => t) : [],
      status: ['active', 'paused', 'completed', 'archived'].includes(task.status) ? task.status : 'active',
      dueAt: task.dueAt || goalDeadline
    }));
  } catch (e) {
    // Fallback: try to extract JSON array
    const extracted = extractLikelyJson(text);
    if (extracted) {
      try {
        const tasks = JSON.parse(extracted);
        if (Array.isArray(tasks)) {
          return tasks.map(task => ({
            title: sanitizeString(task.title),
            description: sanitizeString(task.description),
            tags: Array.isArray(task.tags) ? task.tags.map(sanitizeString).filter(t => t) : [],
            status: ['active', 'paused', 'completed', 'archived'].includes(task.status) ? task.status : 'active',
            dueAt: task.dueAt || goalDeadline
          }));
        }
      } catch {}
    }
    throw new Error(`Failed to parse JSON: ${e.message}\nResponse text:\n${text}`);
  }
}

// Finds the longest balanced {...} or [...] block in a string
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

async function navigateToGoalsPage(driver) {
  console.log('Navigating to goals page...');
  await driver.get(`${BASE_URL}/goals`);

  console.log('Waiting for goals page to load...');
  await driver.wait(until.elementLocated(By.css('h1, h2, h3')), 10000);
}

async function findExistingGoal(driver) {
  console.log('Looking for existing goals...');

  // Wait for goals table to load
  await driver.wait(until.elementLocated(By.css('table')), 10000);

  // Find all goal rows (skip header)
  const goalRows = await driver.findElements(By.css('tbody tr'));
  if (goalRows.length === 0) {
    throw new Error('No existing goals found. Please create a goal first.');
  }

  // Get the first goal's data
  const firstRow = goalRows[0];
  const cells = await firstRow.findElements(By.css('td'));

  const title = await cells[0].getText();
  const description = await cells[1].getText();
  const deadlineText = await cells[2].getText();

  // Extract goal ID from the "Create Task" button
  const createTaskButton = await cells[4].findElement(By.css('button:last-child'));
  const onclickAttr = await createTaskButton.getAttribute('onclick') || '';
  const goalIdMatch = onclickAttr.match(/openCreateTaskModal\('([^']+)'\)/) ||
                     onclickAttr.match(/openCreateTaskModal\("([^"]+)"\)/);

  if (!goalIdMatch) {
    // Try alternative approach - find button that calls openCreateTaskModal
    const buttons = await cells[4].findElements(By.css('button'));
    for (const button of buttons) {
      const text = await button.getText();
      if (text.includes('Create Task') || text.includes('createTask')) {
        // Click to open modal and get goal ID from state
        await button.click();
        // Wait for modal to open
        await driver.wait(until.elementLocated(By.css('[role="dialog"]')), 5000);
        // For now, use a fallback approach
        break;
      }
    }
    throw new Error('Could not extract goal ID from buttons');
  }

  const goalId = goalIdMatch[1];

  console.log(`Found goal: ${title} (ID: ${goalId})`);

  return {
    id: goalId,
    title,
    description,
    deadline: deadlineText
  };
}

async function createTasksForGoal(driver, goalData, tasks) {
  console.log(`Creating ${tasks.length} tasks for goal: ${goalData.title}`);

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`Creating task ${i + 1}/${tasks.length}: ${task.title}`);

    // Click "Create Task" button for this goal
    const goalRows = await driver.findElements(By.css('tbody tr'));
    let createButton = null;

    for (const row of goalRows) {
      const cells = await row.findElements(By.css('td'));
      const title = await cells[0].getText();
      if (title === goalData.title) {
        const buttons = await cells[4].findElements(By.css('button'));
        for (const button of buttons) {
          const text = await button.getText();
          if (text.includes('Create Task') || text.includes('createTask')) {
            createButton = button;
            break;
          }
        }
        break;
      }
    }

    if (!createButton) {
      throw new Error('Could not find Create Task button for the goal');
    }

    await createButton.click();

    // Wait for task creation modal
    await driver.wait(until.elementLocated(By.css('[role="dialog"]')), 5000);

    // Fill task form
    const titleInput = await findFirstVisible(driver, [
      'input[name="title"]',
      '#title',
      'input#title',
      'input[placeholder*="title" i]'
    ]);

    if (!titleInput) {
      throw new Error('Task title input not found');
    }

    await typeSafely(titleInput, task.title);

    // Due date input
    const dueDateInput = await findFirstVisible(driver, [
      'input[type="date"]',
      'input[name="dueAt"]',
      '#dueAt'
    ]);

    if (!dueDateInput) {
      throw new Error('Task due date input not found');
    }

    await typeSafely(dueDateInput, task.dueAt);

    // Tags input (comma-separated)
    const tagsInput = await findFirstVisible(driver, [
      'input[placeholder*="tag" i]',
      'input[name*="tag" i]',
      '#tags'
    ]);

    if (tagsInput && task.tags.length > 0) {
      await typeSafely(tagsInput, task.tags.join(', '));
    }

    // Status select
    const statusSelect = await findFirstVisible(driver, [
      'select[name="status"]',
      '#status',
      'select'
    ]);

    if (statusSelect) {
      await statusSelect.sendKeys(task.status);
    }

    // Submit form
    const submitButton = await driver.findElement(By.css('button[type="submit"]'));
    await submitButton.click();

    // Wait for modal to close and success message
    await driver.wait(until.elementIsNotVisible(await driver.findElement(By.css('[role="dialog"]'))), 5000);

    console.log(`Task "${task.title}" created successfully`);
  }
}

async function verifyTasksVisualization(driver, goalData, expectedTasks) {
  console.log(`Verifying task visualization for goal: ${goalData.title}`);

  // Find and click "View Tasks" button
  const goalRows = await driver.findElements(By.css('tbody tr'));
  let viewButton = null;

  for (const row of goalRows) {
    const cells = await row.findElements(By.css('td'));
    const title = await cells[0].getText();
    if (title === goalData.title) {
      const buttons = await cells[4].findElements(By.css('button'));
      for (const button of buttons) {
        const text = await button.getText();
        if (text.includes('View Tasks') || text.includes('viewTasks')) {
          viewButton = button;
          break;
        }
      }
      break;
    }
  }

  if (!viewButton) {
    throw new Error('Could not find View Tasks button for the goal');
  }

  await viewButton.click();

  // Wait for tasks modal
  await driver.wait(until.elementLocated(By.css('[role="dialog"]')), 5000);

  // Check if tasks are displayed
  const taskRows = await driver.findElements(By.css('table tbody tr'));
  console.log(`Found ${taskRows.length} task rows in the modal`);

  if (taskRows.length === 0) {
    throw new Error('No tasks found in the tasks modal');
  }

  // Verify each expected task appears
  for (const expectedTask of expectedTasks) {
    let found = false;
    for (const row of taskRows) {
      const cells = await row.findElements(By.css('td'));
      if (cells.length >= 4) {
        const title = await cells[0].getText();
        if (title === expectedTask.title) {
          console.log(`✓ Task "${expectedTask.title}" found in visualization`);
          found = true;
          break;
        }
      }
    }
    if (!found) {
      throw new Error(`Task "${expectedTask.title}" not found in tasks visualization`);
    }
  }

  // Close the modal
  const closeButton = await driver.findElement(By.css('button:has-text("Close"), [aria-label*="close" i]'));
  await closeButton.click();

  console.log('Task visualization verification completed successfully');
}

/* ------------------------ Test runner ------------------------ */

async function runTests() {

 const capabilities = {
   browserName: 'chrome',
   'goog:loggingPrefs': {
     browser: 'ALL',
     performance: 'ALL'
   },
   'goog:chromeOptions': {
     args: []
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

    console.log('Starting navigate to goals page test...');
    await dumpBrowserConsole(driver, 'BEFORE GOALS PAGE');
    await navigateToGoalsPage(driver);
    console.log('Navigate to goals page test passed.');
    await dumpBrowserConsole(driver, 'AFTER GOALS PAGE');

    console.log('Finding existing goal...');
    const goalData = await findExistingGoal(driver);
    console.log('Found goal:', goalData);

    console.log('Generating tasks with Ollama AI...');
    const tasks = await generateTaskData(goalData.title, goalData.description, goalData.deadline);
    console.log(`Generated ${tasks.length} tasks:`, tasks);

    console.log('Creating tasks...');
    await dumpBrowserConsole(driver, 'BEFORE CREATE TASKS');
    await createTasksForGoal(driver, goalData, tasks);
    console.log('Task creation test passed.');
    await dumpBrowserConsole(driver, 'AFTER CREATE TASKS');

    console.log('Verifying task visualization...');
    await dumpBrowserConsole(driver, 'BEFORE VERIFY TASKS');
    await verifyTasksVisualization(driver, goalData, tasks);
    console.log('Task visualization verification passed.');
    await dumpBrowserConsole(driver, 'AFTER VERIFY TASKS');

    await dumpNetwork(driver, { onlyErrors: true });

  } catch (err) {
    console.error('Test failed:', err);
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
    const entries = await driver.manage().logs().get('browser');
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
