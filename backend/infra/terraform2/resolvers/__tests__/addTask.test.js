import { request, response } from '../addTask.js';

describe('addTask resolver', () => {
  test('request returns PutItem with task item', () => {
    const ctx = {
      identity: { sub: 'OWNER1' },
      args: { input: { goalId: 'G1', title: 'Write tests', nlpPlan: { steps: [] }, dueAt: 1733356800, assignees: ['OWNER1'] } }
    };
    const req = request(ctx);
    expect(req.operation).toBe('PutItem');
    expect(req.item).toBeDefined();
    expect(req.item.type).toBe('Task');
    expect(req.item.goalId).toBe('G1');
  });

  test('response returns normalized task', () => {
    const attributes = {
      id: 'T1', goalId: 'G1', title: 'Write tests', nlpPlan: {}, dueAt: 1733356800, status: 'open', assignees: [], createdAt: 1, updatedAt: 2
    };
    const out = response({ result: { attributes } });
    expect(out).toMatchObject({ id: 'T1', goalId: 'G1', status: 'open' });
  });
});

