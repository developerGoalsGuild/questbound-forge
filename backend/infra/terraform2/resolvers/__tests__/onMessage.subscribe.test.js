import { request, response } from '../onMessage.subscribe.js';

describe('onMessage.subscribe resolver', () => {
  test('request returns payload as roomId', () => {
    const ctx = { identity: { sub: 'S1' }, args: { roomId: 'ROOM1' } };
    const req = request(ctx);
    expect(req).toEqual({ payload: 'ROOM1' });
  });

  test('response echoes result', () => {
    expect(response({ result: 'X' })).toBe('X');
  });
});

