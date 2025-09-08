#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.startsWith('--') ? a.slice(2).split('=') : ['mode', a];
  return [k, v ?? ''];
}));

const mode = args.mode || '';
const envFileName = args['env-file'] || (mode ? `.env.${mode}` : '.env');

const terraformDir = path.resolve(__dirname, '..');
const frontendDir = path.resolve(__dirname, '../../../frontend');
const envFile = path.join(frontendDir, envFileName);

function run(cmd, cwd) {
  return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString('utf8');
}

function upsertEnvVar(filePath, key, value) {
  let content = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(content)) {
    content = content.replace(re, line);
  } else {
    if (content && !content.endsWith('\n')) content += '\n';
    content += line + '\n';
  }
  writeFileSync(filePath, content, 'utf8');
}

try {
  const out = run('terraform output -json', terraformDir);
  const json = JSON.parse(out);
  const key = json.appsync_api_key_id?.value || '';
  if (!key) {
    console.error('No appsync_api_key_id found. Is enable_appsync_api_key=true and applied?');
    process.exit(1);
  }
  upsertEnvVar(envFile, 'VITE_APPSYNC_API_KEY', key);
  console.log(`Wrote VITE_APPSYNC_API_KEY to ${envFile}`);
} catch (err) {
  console.error('Failed to sync API key to env file:', envFileName, err?.message || err);
  process.exit(1);
}