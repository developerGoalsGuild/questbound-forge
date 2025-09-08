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
  test('request builds TransactWriteItems for user + email lock', () => {
    const ctx = loadCtx('createUser.request.json');
    const req = request(ctx);
    expect(req.operation).toBe('TransactWriteItems');
    expect(Array.isArray(req.transactItems)).toBe(true);
    expect(req.transactItems.length).toBe(2);
  });

  test('validation: invalid email triggers error', () => {
    const ctx = loadCtx('createUser.request.json');
    ctx.args.input.email = 'not-an-email';
    expect(() => request(ctx)).toThrow(/invalid email|email required/i);
  });

  test('response reconstructs user from args/identity', () => {
    const ctx = loadCtx('createUser.request.json');
    const out = response({ args: ctx.args, identity: ctx.identity, result: {} });
    expect(out.id).toBe(ctx.identity.sub);
    expect(out.email).toBe(ctx.args.input.email.toLowerCase());
    expect(out.nickname).toBe(ctx.args.input.nickname);
    expect(out.tier).toBe('free');
  });

  test('response derives id from result keys when identity is missing', () => {
    const ctx = loadCtx('createUser.request.json');
    const emailLower = ctx.args.input.email.toLowerCase();
    const fakeId = '00000000-0000-4000-8000-FAKEID000123';
    const out = response({
      args: ctx.args,
      identity: {},
      result: {
        keys: [
          { PK: `EMAIL#${emailLower}`, SK: 'UNIQUE#USER' },
          { PK: `USER#${fakeId}`, SK: `PROFILE#${fakeId}` }
        ]
      }
    });
    expect(out.id).toBe(fakeId);
    expect(out.email).toBe(emailLower);
    expect(out.nickname).toBe(ctx.args.input.nickname);
  });
});
