import { describe, test, expect } from 'vitest';
import { request, response } from '../../resolvers/myProfile.js';

function makeCtx(overrides = {}) {
  return { identity: { resolverContext: { sub: 'user-1' } }, ...overrides };
}

describe('myProfile resolver', () => {
  test('request builds GetItem for caller sub', () => {
    const req = request(makeCtx());
    expect(req.operation).toBe('GetItem');
    expect(req.consistentRead).toBe(false);
  });

  test('response maps item to User', () => {
    const ctx = { result: { item: { id: 'user-1', email: 'a@a.com', language: 'en', createdAt: 1, updatedAt: 2, tags: [] } } };
    const out = response(ctx);
    expect(out.id).toBe('user-1');
    expect(out.email).toBe('a@a.com');
    expect(out.tags).toEqual([]);
  });

  test('response throws NotFound when missing', () => {
    expect(() => response({ result: {} })).toThrow();
  });
});


