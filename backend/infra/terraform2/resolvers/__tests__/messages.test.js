import { request, response } from '../messages.js';

describe('messages resolver', () => {
  const mockIdentity = { sub: 'user-123' };

  describe('request function', () => {
    test('returns query for general room in gg_core table', () => {
      const ctx = { 
        identity: mockIdentity, 
        args: { roomId: 'ROOM1', limit: 20 } 
      };
      const req = request(ctx);
      
      expect(req.operation).toBe('Query');
      expect(req.table).toBe('gg_core');
      expect(req.key.PK).toBe('ROOM#ROOM1');
      expect(req.key.SK.begins_with).toBe('MSG#');
      expect(req.limit).toBe(20);
      expect(req.scanIndexForward).toBe(false);
    });

    test('returns query for guild room in gg_guild table', () => {
      const ctx = { 
        identity: mockIdentity, 
        args: { roomId: 'GUILD#guild-123', limit: 10 } 
      };
      const req = request(ctx);
      
      expect(req.operation).toBe('Query');
      expect(req.table).toBe('gg_guild');
      expect(req.key.PK).toBe('GUILD#guild-123');
      expect(req.key.SK.begins_with).toBe('MSG#');
      expect(req.limit).toBe(10);
    });

    test('adds timestamp filter when after parameter provided', () => {
      const ctx = { 
        identity: mockIdentity, 
        args: { roomId: 'ROOM1', after: 1640995200000 } 
      };
      const req = request(ctx);
      
      expect(req.filter.expression).toBe('ts > :after');
      expect(req.filter.expressionValues[':after']).toBe(1640995200000);
    });

    test('caps limit at 100 messages', () => {
      const ctx = { 
        identity: mockIdentity, 
        args: { roomId: 'ROOM1', limit: 150 } 
      };
      const req = request(ctx);
      
      expect(req.limit).toBe(100);
    });

    test('uses default limit of 50 when not provided', () => {
      const ctx = { 
        identity: mockIdentity, 
        args: { roomId: 'ROOM1' } 
      };
      const req = request(ctx);
      
      expect(req.limit).toBe(50);
    });

    test('throws error when roomId is missing', () => {
      const ctx = { 
        identity: mockIdentity, 
        args: {} 
      };
      
      expect(() => request(ctx)).toThrow('roomId required');
    });

    test('throws unauthorized when identity is missing', () => {
      const ctx = { 
        identity: null, 
        args: { roomId: 'ROOM1' } 
      };
      
      expect(() => request(ctx)).toThrow();
    });
  });

  describe('response function', () => {
    test('transforms DynamoDB items to Message format', () => {
      const mockResult = {
        items: [
          {
            id: 'msg-1',
            roomId: 'ROOM1',
            senderId: 'user-123',
            text: 'Hello world',
            ts: 1640995200000,
            PK: 'ROOM#ROOM1',
            SK: 'MSG#1640995200000#msg-1'
          },
          {
            id: 'msg-2',
            roomId: 'ROOM1',
            senderId: 'user-456',
            text: 'How are you?',
            ts: 1640995300000,
            PK: 'ROOM#ROOM1',
            SK: 'MSG#1640995300000#msg-2'
          }
        ]
      };

      const result = response({ result: mockResult });
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'msg-1',
        roomId: 'ROOM1',
        senderId: 'user-123',
        text: 'Hello world',
        ts: 1640995200000
      });
      expect(result[1]).toEqual({
        id: 'msg-2',
        roomId: 'ROOM1',
        senderId: 'user-456',
        text: 'How are you?',
        ts: 1640995300000
      });
    });

    test('returns empty array when no items', () => {
      const result = response({ result: { items: [] } });
      expect(result).toEqual([]);
    });

    test('returns empty array when result is null', () => {
      const result = response({ result: null });
      expect(result).toEqual([]);
    });

    test('throws error when ctx.error is present', () => {
      const ctx = { error: { message: 'Database error', type: 'Database' } };
      
      expect(() => response(ctx)).toThrow('Database error');
    });
  });
});
