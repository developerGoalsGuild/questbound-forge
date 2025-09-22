import { request, response } from '../getGoals.js';

describe('getGoals resolver', () => {
  test('request queries only current user goals by PK/SK', () => {
    const ctx = { identity: { sub: 'U1' }, args: { userId: 'U1' } };
    const req = request(ctx);
    expect(req.operation || 'Query').toBe('Query');
    expect(req.query.expression).toMatch(/#pk = :pk/);
    expect(req.query.expression).toMatch(/begins_with\(#sk, :sk\)/);
  });

  test('response maps items to Goal shape', () => {
    const out = response({ result: { items: [
      { id: 'G1', userId: 'U1', title: 't', description: '', tags: [], deadline: '2025-12-31', status: 'active', createdAt: 1, updatedAt: 2 }
    ] } });
    expect(out[0]).toMatchObject({ id: 'G1', userId: 'U1', status: 'active', deadline: '2025-12-31' });
  });
});
