import { vi } from 'vitest';
import { getQuestAnalytics, refreshQuestAnalytics } from '../apiAnalytics';
import * as utils from '@/lib/utils';
import { QuestAnalytics } from '@/models/analytics';

// Mock fetch
global.fetch = vi.fn() as any;

// Mock environment variables
const mockEnv = {
  VITE_API_GATEWAY_URL: 'https://api.test.com',
  VITE_API_GATEWAY_KEY: 'test-api-key'
};

Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('apiAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(utils, 'getAccessToken').mockReturnValue('test-token');
  });

  describe('getQuestAnalytics', () => {
    it('should fetch analytics successfully', async () => {
      const mockAnalytics: QuestAnalytics = {
        userId: 'user123',
        period: 'weekly',
        totalQuests: 10,
        completedQuests: 8,
        successRate: 0.8,
        averageCompletionTime: 3600,
        bestStreak: 5,
        currentStreak: 3,
        xpEarned: 800,
        trends: {
          completionRate: [],
          xpEarned: [],
          questsCreated: []
        },
        categoryPerformance: [],
        productivityByHour: [],
        calculatedAt: Date.now(),
        ttl: 604800
      };

      (fetch as unknown as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics
      });

      const result = await getQuestAnalytics('weekly', false);

      expect(fetch).toHaveBeenCalledWith(
        '/v1/quests/analytics?period=weekly&force_refresh=false',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      );

      expect(result).toEqual(mockAnalytics);
    });

    it('should handle different periods', async () => {
      const mockAnalytics: QuestAnalytics = {
        userId: 'user123',
        period: 'daily',
        totalQuests: 5,
        completedQuests: 4,
        successRate: 0.8,
        averageCompletionTime: 1800,
        bestStreak: 2,
        currentStreak: 1,
        xpEarned: 400,
        trends: {
          completionRate: [],
          xpEarned: [],
          questsCreated: []
        },
        categoryPerformance: [],
        productivityByHour: [],
        calculatedAt: Date.now(),
        ttl: 86400
      };

      (fetch as unknown as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics
      });

      const result = await getQuestAnalytics('daily', true);

      expect(fetch).toHaveBeenCalledWith(
        '/v1/quests/analytics?period=daily&force_refresh=true',
        expect.any(Object)
      );

      expect(result).toEqual(mockAnalytics);
    });

    it('should throw error when no token is available', async () => {
      vi.spyOn(utils, 'getAccessToken').mockReturnValue(null as any);

      await expect(getQuestAnalytics()).rejects.toThrow('Authentication required');
    });

    it('should handle API errors', async () => {
      (fetch as unknown as vi.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Server error' })
      });

      await expect(getQuestAnalytics()).rejects.toThrow('Server error');
    });

    it('should handle network errors', async () => {
      (fetch as unknown as vi.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(getQuestAnalytics()).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      (fetch as unknown as vi.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(getQuestAnalytics()).rejects.toThrow('Bad Request');
    });

    it('should use default parameters', async () => {
      const mockAnalytics: QuestAnalytics = {
        userId: 'user123',
        period: 'weekly',
        totalQuests: 0,
        completedQuests: 0,
        successRate: 0,
        averageCompletionTime: 0,
        bestStreak: 0,
        currentStreak: 0,
        xpEarned: 0,
        trends: {
          completionRate: [],
          xpEarned: [],
          questsCreated: []
        },
        categoryPerformance: [],
        productivityByHour: [],
        calculatedAt: Date.now(),
        ttl: 604800
      };

      (fetch as unknown as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics
      });

      await getQuestAnalytics();

      expect(fetch).toHaveBeenCalledWith(
        '/v1/quests/analytics?period=weekly&force_refresh=false',
        expect.any(Object)
      );
    });
  });

  describe('refreshQuestAnalytics', () => {
    it('should call getQuestAnalytics with forceRefresh true', async () => {
      const mockAnalytics: QuestAnalytics = {
        userId: 'user123',
        period: 'weekly',
        totalQuests: 10,
        completedQuests: 8,
        successRate: 0.8,
        averageCompletionTime: 3600,
        bestStreak: 5,
        currentStreak: 3,
        xpEarned: 800,
        trends: {
          completionRate: [],
          xpEarned: [],
          questsCreated: []
        },
        categoryPerformance: [],
        productivityByHour: [],
        calculatedAt: Date.now(),
        ttl: 604800
      };

      (fetch as unknown as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics
      });

      const result = await refreshQuestAnalytics('monthly');

      expect(fetch).toHaveBeenCalledWith(
        '/v1/quests/analytics?period=monthly&force_refresh=true',
        expect.any(Object)
      );

      expect(result).toEqual(mockAnalytics);
    });
  });
});
