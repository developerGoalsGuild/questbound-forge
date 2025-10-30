import { request, response } from '../availabilityAuth.js';

describe('availabilityAuth pipeline function', () => {
  test('request invokes lambda with availability mode', () => {
    const ctx = { request: { headers: { 'x-api-key': 'abc' } } };
    const req = request(ctx);
    expect(req.operation).toBe('Invoke');
    expect(req.payload.mode).toBe('availability');
    expect(req.payload.headers['x-api-key']).toBe('abc');
  });

  test('response raises when lambda returns error', () => {
    const ctx = { error: { message: 'nope', type: 'Unauthorized' } };
    expect(() => response(ctx)).toThrow('nope');
  });

  test('response passes through result', () => {
    const ctx = { result: { ok: true } };
    expect(response(ctx)).toEqual({ ok: true });
  });
});
