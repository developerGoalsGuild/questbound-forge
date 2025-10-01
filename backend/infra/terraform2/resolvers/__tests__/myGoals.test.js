import { request, response } from '../myGoals.js';

describe('myGoals resolver', () => {
  const mockContext = {
    identity: {
      resolverContext: {
        sub: 'test-user-123'
      }
    },
    args: {}
  };

  describe('request function', () => {
    it('should build basic query without parameters', () => {
      const result = request(mockContext);
      
      expect(result.operation).toBe('Query');
      expect(result.query.expression).toBe('#pk = :pk AND begins_with(#sk, :sk)');
      expect(result.query.expressionNames).toEqual({
        '#pk': 'PK',
        '#sk': 'SK'
      });
      expect(result.query.expressionValues).toEqual({
        ':pk': 'USER#test-user-123',
        ':sk': 'GOAL#'
      });
      expect(result.scanIndexForward).toBe(true);
    });

    it('should add status filter when provided', () => {
      const contextWithStatus = {
        ...mockContext,
        args: { status: 'active' }
      };
      
      const result = request(contextWithStatus);
      
      expect(result.query.expression).toBe('#pk = :pk AND begins_with(#sk, :sk) AND #status = :status');
      expect(result.query.expressionNames).toEqual({
        '#pk': 'PK',
        '#sk': 'SK',
        '#status': 'status'
      });
      expect(result.query.expressionValues).toEqual({
        ':pk': 'USER#test-user-123',
        ':sk': 'GOAL#',
        ':status': 'active'
      });
    });

    it('should add limit when provided', () => {
      const contextWithLimit = {
        ...mockContext,
        args: { limit: 5 }
      };
      
      const result = request(contextWithLimit);
      
      expect(result.limit).toBe(5);
    });

    it('should cap limit at 100 for safety', () => {
      const contextWithHighLimit = {
        ...mockContext,
        args: { limit: 500 }
      };
      
      const result = request(contextWithHighLimit);
      
      expect(result.limit).toBe(100);
    });

    it('should set scanIndexForward to false for desc sorting', () => {
      const contextWithDescSort = {
        ...mockContext,
        args: { sortBy: 'deadline-desc' }
      };
      
      const result = request(contextWithDescSort);
      
      expect(result.scanIndexForward).toBe(false);
    });

    it('should set scanIndexForward to true for asc sorting', () => {
      const contextWithAscSort = {
        ...mockContext,
        args: { sortBy: 'deadline-asc' }
      };
      
      const result = request(contextWithAscSort);
      
      expect(result.scanIndexForward).toBe(true);
    });
  });

  describe('response function', () => {
    const mockItems = [
      {
        id: 'goal-1',
        userId: 'test-user-123',
        title: 'Goal A',
        description: 'Description A',
        tags: ['work'],
        deadline: '2024-12-31',
        status: 'active',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        answers: []
      },
      {
        id: 'goal-2',
        userId: 'test-user-123',
        title: 'Goal B',
        description: 'Description B',
        tags: ['personal'],
        deadline: '2024-11-30',
        status: 'active',
        createdAt: 1700000001000,
        updatedAt: 1700000001000,
        answers: []
      }
    ];

    it('should map DynamoDB items to GraphQL format', () => {
      const context = {
        result: { items: mockItems },
        args: {}
      };
      
      const result = response(context);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'goal-1',
        userId: 'test-user-123',
        title: 'Goal A',
        description: 'Description A',
        tags: ['work'],
        deadline: '2024-12-31',
        status: 'active',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        answers: []
      });
    });

    it('should sort by title ascending', () => {
      const context = {
        result: { items: mockItems },
        args: { sortBy: 'title-asc' }
      };
      
      const result = response(context);
      
      expect(result[0].title).toBe('Goal A');
      expect(result[1].title).toBe('Goal B');
    });

    it('should sort by title descending', () => {
      const context = {
        result: { items: mockItems },
        args: { sortBy: 'title-desc' }
      };
      
      const result = response(context);
      
      expect(result[0].title).toBe('Goal B');
      expect(result[1].title).toBe('Goal A');
    });

    it('should sort by deadline ascending', () => {
      const context = {
        result: { items: mockItems },
        args: { sortBy: 'deadline-asc' }
      };
      
      const result = response(context);
      
      expect(result[0].deadline).toBe('2024-11-30');
      expect(result[1].deadline).toBe('2024-12-31');
    });

    it('should handle empty results', () => {
      const context = {
        result: { items: [] },
        args: {}
      };
      
      const result = response(context);
      
      expect(result).toEqual([]);
    });

    it('should handle null deadline', () => {
      const itemsWithNullDeadline = [{
        ...mockItems[0],
        deadline: null
      }];
      
      const context = {
        result: { items: itemsWithNullDeadline },
        args: { sortBy: 'deadline-asc' }
      };
      
      const result = response(context);
      
      expect(result[0].deadline).toBeNull();
    });
  });
});