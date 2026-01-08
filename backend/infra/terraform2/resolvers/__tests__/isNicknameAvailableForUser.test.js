import { request, response } from '../isNicknameAvailableForUser.js';

describe('isNicknameAvailableForUser resolver', () => {
  test('request queries GSI2 by nickname', () => {
    const ctx = { 
      args: { nickname: 'neo' },
      identity: { sub: 'user123' }
    };
    const req = request(ctx);
    expect(req.operation).toBe('Query');
    expect(req.index).toBe('GSI2');
    expect(req.query.expression).toMatch(/#pk = :pk/);
  });

  test('request throws error when user not authenticated', () => {
    const ctx = { 
      args: { nickname: 'neo' },
      identity: null
    };
    expect(() => request(ctx)).toThrow('User not authenticated');
  });

  test('request throws error when nickname is empty', () => {
    const ctx = { 
      args: { nickname: '' },
      identity: { sub: 'user123' }
    };
    expect(() => request(ctx)).toThrow('nickname required');
  });

  test('response returns true when no items (nickname available)', () => {
    const ctx = { 
      result: { items: [] },
      identity: { sub: 'user123' }
    };
    const out = response(ctx);
    expect(out).toBe(true);
  });

  test('response returns true when no items after filter (current user has nickname)', () => {
    const ctx = { 
      result: { 
        items: [] // Filter excludes current user, so no items returned
      },
      identity: { sub: 'user123' }
    };
    const out = response(ctx);
    expect(out).toBe(true);
  });

  test('response returns false when items found (another user has nickname)', () => {
    const ctx = { 
      result: { 
        items: [{ 
          userId: 'user456',
          PK: 'NICK#testnick',
          SK: 'UNIQUE#USER'
        }] 
      },
      identity: { sub: 'user123' }
    };
    const out = response(ctx);
    expect(out).toBe(false);
  });

  test('response handles single item correctly (limit=1)', () => {
    const ctx = { 
      result: { 
        items: [{ userId: 'user456', PK: 'NICK#testnick', SK: 'UNIQUE#USER' }] 
      },
      identity: { sub: 'user123' }
    };
    const out = response(ctx);
    expect(out).toBe(false);
  });

  test('response handles error gracefully', () => {
    const ctx = { 
      error: { message: 'DynamoDB error', type: 'DynamoDB' },
      identity: { sub: 'user123' }
    };
    expect(() => response(ctx)).toThrow('DynamoDB error');
  });
});
