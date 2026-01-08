import { request, response } from '../subscriptionAuth.js';

describe('subscriptionAuth function', () => {
  test('request builds lambda invoke payload', () => {
    const ctx = { request: { headers: { authorization: 'Bearer token' } }, arguments: { roomId: 'ROOM1' } };
    const req = request(ctx);
    expect(req.operation).toBe('Invoke');
    expect(req.payload.headers.authorization).toBe('Bearer token');
    expect(req.payload.arguments.roomId).toBe('ROOM1');
    expect(req.payload.roomId).toBe('ROOM1');
  });

  test('response bubbles errors', () => {
    const ctx = { error: { message: 'no auth', type: 'Unauthorized' } };
    expect(() => response(ctx)).toThrow('no auth');
  });

  test('response returns lambda result', () => {
    const ctx = { result: { sub: 'user' } };
    expect(response(ctx)).toEqual({ sub: 'user' });
  });
});
