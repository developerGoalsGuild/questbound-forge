import { request, response } from '../createGoal.js';

describe('createGoal resolver', () => {
  test('request returns PutItem with item fields', () => {
    const ctx = {
      identity: { sub: 'USER_SUB' },
      args: { input: { title: 'Ship v1', description: 'Finish', tags: ['milestone'] } }
    };
    const req = request(ctx);
    expect(req.operation).toBe('PutItem');
    expect(req.item).toBeDefined();
    expect(req.item.type).toBe('Goal');
    expect(req.item.title).toBe('Ship v1');
  });

  test('response returns normalized goal', () => {
    const attributes = {
      id: 'G1', userId: 'U1', title: 'T', description: 'D', tags: ['x'], status: 'active', createdAt: 1, updatedAt: 2
    };
    const out = response({ result: { attributes } });
    expect(out).toMatchObject({ id: 'G1', userId: 'U1', title: 'T', status: 'active' });
  });
});

