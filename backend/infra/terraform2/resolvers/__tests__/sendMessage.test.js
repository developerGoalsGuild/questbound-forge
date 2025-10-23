import { request, response } from '../sendMessage.js';

describe('sendMessage resolver', () => {
  const mockIdentity = { sub: 'user-123' };

  describe('general room messages', () => {
    test('request returns PutItem for general room in gg_core table', () => {
      const ctx = { identity: mockIdentity, args: { roomId: 'ROOM1', text: 'Hello' } };
      const req = request(ctx);
      
      expect(req.operation).toBe('PutItem');
      expect(req.table).toBe('gg_core');
      expect(req.item).toBeDefined();
      expect(req.item.type).toBe('Message');
      expect(req.item.roomId).toBe('ROOM1');
      expect(req.item.PK).toBe('ROOM#ROOM1');
      expect(req.item.roomType).toBe('general');
    });
  });

  describe('guild room messages', () => {
    test('request returns PutItem for guild room in gg_guild table', () => {
      const ctx = { identity: mockIdentity, args: { roomId: 'GUILD#guild-123', text: 'Guild message' } };
      const req = request(ctx);
      
      expect(req.operation).toBe('PutItem');
      expect(req.table).toBe('gg_guild');
      expect(req.item).toBeDefined();
      expect(req.item.type).toBe('Message');
      expect(req.item.roomId).toBe('GUILD#guild-123');
      expect(req.item.PK).toBe('GUILD#guild-123');
      expect(req.item.roomType).toBe('guild');
    });
  });

  describe('validation', () => {
    test('throws error when roomId is missing', () => {
      const ctx = { identity: mockIdentity, args: { text: 'Hello' } };
      expect(() => request(ctx)).toThrow('roomId required');
    });

    test('throws error when text is missing', () => {
      const ctx = { identity: mockIdentity, args: { roomId: 'ROOM1' } };
      expect(() => request(ctx)).toThrow('text required');
    });

    test('throws unauthorized when identity is missing', () => {
      const ctx = { identity: null, args: { roomId: 'ROOM1', text: 'Hello' } };
      expect(() => request(ctx)).toThrow();
    });
  });

  test('response returns normalized message', () => {
    const attributes = { id: 'M1', roomId: 'ROOM1', senderId: 'S1', text: 'Hello', ts: 1 };
    const out = response({ result: { attributes } });
    expect(out).toMatchObject({ id: 'M1', roomId: 'ROOM1', text: 'Hello' });
  });
});

