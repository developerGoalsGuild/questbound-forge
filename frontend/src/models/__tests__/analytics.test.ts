import { QuestAnalytics, TrendDataPoint, CategoryPerformance, HourlyProductivity, AnalyticsInsights, AnalyticsPeriod } from '../analytics';

describe('Analytics Models', () => {
  describe('TrendDataPoint', () => {
    it('should create a valid TrendDataPoint', () => {
      const point: TrendDataPoint = {
        date: '2024-01-01',
        value: 0.75
      };

      expect(point.date).toBe('2024-01-01');
      expect(point.value).toBe(0.75);
    });

    it('should handle negative values', () => {
      const point: TrendDataPoint = {
        date: '2024-01-01',
        value: -0.5
      };

      expect(point.value).toBe(-0.5);
    });
  });

  describe('CategoryPerformance', () => {
    it('should create a valid CategoryPerformance', () => {
      const performance: CategoryPerformance = {
        category: 'Health',
        totalQuests: 10,
        completedQuests: 8,
        successRate: 0.8,
        averageCompletionTime: 3600,
        xpEarned: 800
      };

      expect(performance.category).toBe('Health');
      expect(performance.totalQuests).toBe(10);
      expect(performance.completedQuests).toBe(8);
      expect(performance.successRate).toBe(0.8);
      expect(performance.averageCompletionTime).toBe(3600);
      expect(performance.xpEarned).toBe(800);
    });

    it('should handle zero values', () => {
      const performance: CategoryPerformance = {
        category: 'Work',
        totalQuests: 0,
        completedQuests: 0,
        successRate: 0,
        averageCompletionTime: 0,
        xpEarned: 0
      };

      expect(performance.totalQuests).toBe(0);
      expect(performance.completedQuests).toBe(0);
      expect(performance.successRate).toBe(0);
    });
  });

  describe('HourlyProductivity', () => {
    it('should create a valid HourlyProductivity', () => {
      const productivity: HourlyProductivity = {
        hour: 14,
        questsCompleted: 3,
        xpEarned: 300,
        averageCompletionTime: 1800
      };

      expect(productivity.hour).toBe(14);
      expect(productivity.questsCompleted).toBe(3);
      expect(productivity.xpEarned).toBe(300);
      expect(productivity.averageCompletionTime).toBe(1800);
    });

    it('should handle all hours of the day', () => {
      for (let hour = 0; hour < 24; hour++) {
        const productivity: HourlyProductivity = {
          hour,
          questsCompleted: 0,
          xpEarned: 0,
          averageCompletionTime: 0
        };

        expect(productivity.hour).toBe(hour);
      }
    });
  });

  describe('QuestAnalytics', () => {
    it('should create a valid QuestAnalytics', () => {
      const analytics: QuestAnalytics = {
        userId: 'user123',
        period: 'weekly',
        totalQuests: 20,
        completedQuests: 15,
        successRate: 0.75,
        averageCompletionTime: 3600,
        bestStreak: 7,
        currentStreak: 3,
        xpEarned: 1500,
        trends: {
          completionRate: [
            { date: '2024-01-01', value: 0.8 },
            { date: '2024-01-02', value: 0.6 }
          ],
          xpEarned: [
            { date: '2024-01-01', value: 200 },
            { date: '2024-01-02', value: 150 }
          ],
          questsCreated: [
            { date: '2024-01-01', value: 3 },
            { date: '2024-01-02', value: 2 }
          ]
        },
        categoryPerformance: [
          {
            category: 'Health',
            totalQuests: 10,
            completedQuests: 8,
            successRate: 0.8,
            averageCompletionTime: 3600,
            xpEarned: 800
          }
        ],
        productivityByHour: [
          {
            hour: 14,
            questsCompleted: 3,
            xpEarned: 300,
            averageCompletionTime: 1800
          }
        ],
        calculatedAt: Date.now(),
        ttl: 604800
      };

      expect(analytics.userId).toBe('user123');
      expect(analytics.period).toBe('weekly');
      expect(analytics.totalQuests).toBe(20);
      expect(analytics.completedQuests).toBe(15);
      expect(analytics.successRate).toBe(0.75);
      expect(analytics.trends.completionRate).toHaveLength(2);
      expect(analytics.categoryPerformance).toHaveLength(1);
      expect(analytics.productivityByHour).toHaveLength(1);
    });

    it('should handle all period types', () => {
      const periods: AnalyticsPeriod[] = ['daily', 'weekly', 'monthly', 'allTime'];
      
      periods.forEach(period => {
        const analytics: QuestAnalytics = {
          userId: 'user123',
          period,
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

        expect(analytics.period).toBe(period);
      });
    });
  });

  describe('AnalyticsInsights', () => {
    it('should create a valid AnalyticsInsights', () => {
      const insights: AnalyticsInsights = {
        overallPerformance: 'You have completed 15 out of 20 quests, with a success rate of 75%. You\'ve earned 1500 XP.',
        streakInfo: 'Your best completion streak is 7 days. Your current streak is 3 days.',
        mostProductiveCategory: {
          category: 'Health',
          successRate: 0.8
        },
        mostProductiveHour: {
          hour: 14,
          questsCompleted: 3
        },
        trend: 'improving',
        consistencyScore: 0.35
      };

      expect(insights.overallPerformance).toBeDefined();
      expect(insights.streakInfo).toBeDefined();
      expect(insights.mostProductiveCategory?.category).toBe('Health');
      expect(insights.mostProductiveHour?.hour).toBe(14);
      expect(insights.trend).toBe('improving');
      expect(insights.consistencyScore).toBe(0.35);
    });

    it('should handle minimal insights', () => {
      const insights: AnalyticsInsights = {
        overallPerformance: 'Start your questing journey to see your performance insights!'
      };

      expect(insights.overallPerformance).toBeDefined();
      expect(insights.streakInfo).toBeUndefined();
      expect(insights.mostProductiveCategory).toBeUndefined();
      expect(insights.mostProductiveHour).toBeUndefined();
      expect(insights.trend).toBeUndefined();
      expect(insights.consistencyScore).toBeUndefined();
    });

    it('should handle all trend types', () => {
      const trends: ('improving' | 'declining' | 'stable')[] = ['improving', 'declining', 'stable'];
      
      trends.forEach(trend => {
        const insights: AnalyticsInsights = {
          overallPerformance: 'Test performance',
          trend
        };

        expect(insights.trend).toBe(trend);
      });
    });
  });
});
