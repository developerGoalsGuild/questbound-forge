import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { request, response } from '../createUser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadCtx(file) {
  const p = path.join(__dirname, '..', 'context', file);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

describe('createUser resolver', () => {
  test('request invokes Lambda with sanitized payload', () => {
    const ctx = loadCtx('createUser.request.json');
    const req = request(ctx);
    expect(req.operation).toBe('Invoke');
    expect(req.payload).toBeTruthy();
    expect(req.payload.input.email).toBe(ctx.args.input.email.toLowerCase());
    expect(req.payload.action).toBe('signup');
  });

  test('validation: invalid email triggers error', () => {
    const ctx = loadCtx('createUser.request.json');
    ctx.args.input.email = 'not-an-email';
    expect(() => request(ctx)).toThrow(/invalid email|email required/i);
  });

  test('response reconstructs user from args/identity', () => {
    const ctx = loadCtx('createUser.request.json');
    const out = response({ args: ctx.args, identity: ctx.identity, result: { ok: true } });
    expect(out.id).toBe(ctx.identity.sub);
    expect(out.email).toBe(ctx.args.input.email.toLowerCase());
    expect(out.nickname).toBe(ctx.args.input.nickname);
    expect(out.tier).toBe('free');
  });

  test('response uses autoId when identity is missing', () => {
    const ctx = loadCtx('createUser.request.json');
    const out = response({ args: ctx.args, identity: {}, result: { ok: true } });
    expect(out.id).toBeTruthy();
    expect(out.email).toBe(ctx.args.input.email.toLowerCase());
    expect(out.nickname).toBe(ctx.args.input.nickname);
  });
});
