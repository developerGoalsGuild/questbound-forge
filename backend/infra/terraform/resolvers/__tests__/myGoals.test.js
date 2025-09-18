import { request, response } from '../myGoals.js';

describe('myGoals resolver', () => {
  test('request queries current user goals by PK/SK', () => {
    const ctx = { identity: { sub: 'U1' } };
    const req = request(ctx);
    expect(req.operation).toBe('Query');
    expect(req.query.expression).toMatch(/#pk = :pk/);
  });

  test('response maps items', () => {
    const out = response({ result: { items: [ { id: 'G1', userId: 'U1', title: 't', deadline: 1700000000, status: 'active', createdAt: 1, updatedAt: 2 } ] } });
    expect(out[0]).toMatchObject({ id: 'G1', userId: 'U1', status: 'active', deadline: 1700000000 });
  });
});
