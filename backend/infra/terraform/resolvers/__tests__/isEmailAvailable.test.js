import { request, response } from '../isEmailAvailable.js';

describe('isEmailAvailable resolver', () => {
  test('request queries GSI3 by email', () => {
    const ctx = { args: { email: 'user@example.com' } };
    const req = request(ctx);
    expect(req.operation).toBe('Query');
    expect(req.index).toBe('GSI3');
    expect(req.query.expression).toMatch(/#pk = :pk/);
  });

  test('response returns true when no items', () => {
    const out = response({ result: { items: [] } });
    expect(out).toBe(true);
  });

  test('response returns false when items exist', () => {
    const out = response({ result: { items: [{}] } });
    expect(out).toBe(false);
  });
});

