import { request, response } from '../getTasks.js';

describe('getTasks resolver', () => {
  test('request filters by owner and queries by goal PK', () => {
    const ctx = { identity: { sub: 'U1' }, args: { goalId: 'G1' } };
    const req = request(ctx);
    expect(req.operation).toBe('Query');
    expect(req.query.expression).toMatch(/#pk = :pk/);
    expect(req.filter.expression).toMatch(/#owner = :me/);
  });

  test('response maps tasks to normalized shape', () => {
    const out = response({ result: { items: [
      { id: 'T1', goalId: 'G1', title: 't', nlpPlan: {}, dueAt: 1, status: 'open', assignees: [], createdAt: 1, updatedAt: 2 }
    ] } });
    expect(out[0]).toMatchObject({ id: 'T1', goalId: 'G1', status: 'open' });
  });
});

