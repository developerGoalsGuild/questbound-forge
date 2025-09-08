import { jest } from '@jest/globals';

describe('appsync_persist_user lambda', () => {
  const OLD_ENV = process.env;
  let calls;

  beforeEach(() => { process.env = { ...OLD_ENV }; calls = []; });
  afterAll(() => { process.env = OLD_ENV; });

  test('validates inputs', async () => {
    process.env.TABLE = 'gg_core';
    globalThis.__DOC = { transactWrite: () => ({ promise: async () => {} }) };
    const { handler } = await import('../index.mjs');
    await expect(handler({ email: '', nickname: 'n', fullName: 'F' })).rejects.toThrow(/email required/);
    await expect(handler({ email: 'a@b.com', nickname: '', fullName: 'F' })).rejects.toThrow(/nickname required/);
    await expect(handler({ email: 'a@b.com', nickname: 'n', fullName: '' })).rejects.toThrow(/fullName required/);
  });

  test('writes transact items to DDB', async () => {
    process.env.TABLE = 'gg_core';
    globalThis.__DOC = { transactWrite: (tx) => ({ promise: async () => { calls.push(tx); } }) };
    const { handler } = await import('../index.mjs');
    const res = await handler({ email: 'a@b.com', nickname: 'neo', fullName: 'Neo', identitySub: 'sub-1', now: 123 });
    expect(res.ok).toBe(true);
    expect(calls.length).toBe(1);
    const tx = calls[0];
    expect(tx.TransactItems[0].Put.Item.PK).toBe('EMAIL#a@b.com');
    expect(tx.TransactItems[1].Put.Item.PK).toBe('USER#sub-1');
  });
});
