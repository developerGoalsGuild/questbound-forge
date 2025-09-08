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
  const poolId   = json.cognito_user_pool_id?.value || '';
  const clientId = json.cognito_user_pool_client_id?.value || '';

  if (clientId) {
    upsertEnvVar(envFile, 'VITE_COGNITO_CLIENT_ID', clientId);
    console.log(`Wrote VITE_COGNITO_CLIENT_ID to ${envFile}`);
  } else {
    console.warn('No cognito_user_pool_client_id in outputs. Skipping CLIENT_ID.');
  }

  const domain = json.cognito_user_pool_domain?.value || '';
  if (domain) {
    upsertEnvVar(envFile, 'VITE_COGNITO_DOMAIN', domain);
    console.log(`Wrote VITE_COGNITO_DOMAIN to ${envFile}`);
  } else {
    console.warn('No cognito_user_pool_domain in outputs. Define aws_cognito_user_pool_domain and output it to sync the domain.');
  }
} catch (err) {
  console.error('Failed to sync Cognito settings to env file:', envFileName, err?.message || err);
  process.exit(1);
}

