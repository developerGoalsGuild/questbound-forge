import { request, response } from '../onMessage.subscribe.js';

const buildCtx = (overrides = {}) => ({
  prev: { result: { sub: 'user-1', roomId: 'ROOM1' } },
  args: { roomId: 'ROOM1' },
  identity: {},
  ...overrides,
});

describe('onMessage.subscribe pipeline function', () => {
  test('request returns payload when authorized', () => {
    const ctx = buildCtx();
    const req = request(ctx);
    expect(req).toEqual({ payload: 'ROOM1' });
  });

  test('request falls back to resolverContext sub when no previous result', () => {
    const ctx = buildCtx({ prev: {}, identity: { resolverContext: { sub: 'user-2' } } });
    const req = request(ctx);
    expect(req).toEqual({ payload: 'ROOM1' });
  });

  test('request throws when no sub available', () => {
    const ctx = buildCtx({ prev: { result: {} }, identity: {} });
    expect(() => request(ctx)).toThrow('Unauthorized');
  });

  test('request throws when room ids mismatch', () => {
    const ctx = buildCtx({ args: { roomId: 'ROOM2' } });
    expect(() => request(ctx)).toThrow('Unauthorized');
  });

  test('response passes through result', () => {
    expect(response({ result: 'value' })).toBe('value');
  });
});
