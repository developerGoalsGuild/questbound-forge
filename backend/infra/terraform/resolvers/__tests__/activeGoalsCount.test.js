import { request, response } from '../activeGoalsCount.js';

describe('activeGoalsCount resolver', () => {
  test('request enforces identity and filters active', () => {
    const ctx = { identity: { sub: 'U1' }, args: { userId: 'U1' } };
    const req = request(ctx);
    expect(req.operation).toBe('Query');
    expect(req.filter.expression).toMatch(/#st = :active/);
    expect(req.query.expression).toMatch(/begins_with\(#sk, :sk\)/);
  });

  test('response returns length of items', () => {
    const out = response({ result: { items: [{}, {}] } });
    expect(out).toBe(2);
  });
});

