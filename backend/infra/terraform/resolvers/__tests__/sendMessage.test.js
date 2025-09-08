import { request, response } from '../sendMessage.js';

describe('sendMessage resolver', () => {
  test('request returns PutItem with message item', () => {
    const ctx = { identity: { sub: 'S1' }, args: { roomId: 'ROOM1', text: 'Hello' } };
    const req = request(ctx);
    expect(req.operation).toBe('PutItem');
    expect(req.item).toBeDefined();
    expect(req.item.type).toBe('Message');
    expect(req.item.roomId).toBe('ROOM1');
  });

  test('response returns normalized message', () => {
    const attributes = { id: 'M1', roomId: 'ROOM1', senderId: 'S1', text: 'Hello', ts: 1 };
    const out = response({ result: { attributes } });
    expect(out).toMatchObject({ id: 'M1', roomId: 'ROOM1', text: 'Hello' });
  });
});

