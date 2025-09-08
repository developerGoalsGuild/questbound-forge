import { request, response } from '../isNicknameAvailable.js';

describe('isNicknameAvailable resolver', () => {
  test('request queries GSI2 by nickname', () => {
    const ctx = { args: { nickname: 'neo' } };
    const req = request(ctx);
    expect(req.operation).toBe('Query');
    expect(req.index).toBe('GSI2');
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

