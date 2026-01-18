import { describe, it, expect, vi } from 'vitest';
import { 
  getNotificationMessage, 
  shouldNotify, 
  QuestEventType 
} from '@/lib/questNotifications';
import { NotificationPreferences } from '@/models/profile';

describe('questNotifications', () => {
  describe('getNotificationMessage', () => {
    it('should return correct message for quest started', () => {
      const quest = { title: 'Test Quest' };
      const event = { type: 'questStarted' as QuestEventType, quest };
      const message = getNotificationMessage(event, null);
      // When translations is null, it returns the basic fallback
      expect(message).toBe('Quest "Test Quest" has been started!');
    });

    it('should return correct message for quest completed', () => {
      const quest = { title: 'Test Quest' };
      const event = { type: 'questCompleted' as QuestEventType, quest };
      const message = getNotificationMessage(event, null);
      expect(message).toBe('Congratulations! Quest "Test Quest" completed!');
    });

    it('should return correct message for progress milestone', () => {
      const quest = { title: 'Test Quest' };
      const event = { 
        type: 'progressMilestone' as QuestEventType, 
        quest, 
        data: { percentage: 50 } 
      };
      const message = getNotificationMessage(event, null);
      expect(message).toBe('You\'ve reached 50% on quest "Test Quest"!');
    });

    it('should return correct message for streak achieved', () => {
      const quest = { title: 'Test Quest' };
      const event = { 
        type: 'streakAchieved' as QuestEventType, 
        quest, 
        data: { days: 7 } 
      };
      const message = getNotificationMessage(event, null);
      expect(message).toBe('Amazing! You\'ve achieved a 7-day quest streak!');
    });
  });

  describe('shouldNotify', () => {
    const mockPreferences: NotificationPreferences = {
      questStarted: true,
      questCompleted: true,
      questFailed: true,
      progressMilestones: true,
      deadlineWarnings: true,
      streakAchievements: true,
      challengeUpdates: true,
      channels: {
        inApp: true,
        email: false,
        push: false
      }
    };

    it('should return true when all preferences are enabled', () => {
      expect(shouldNotify('questStarted', mockPreferences)).toBe(true);
      expect(shouldNotify('questCompleted', mockPreferences)).toBe(true);
      expect(shouldNotify('progressMilestone', mockPreferences)).toBe(true);
      expect(shouldNotify('challengeJoined', mockPreferences)).toBe(true);
    });

    it('should return false when specific event type is disabled', () => {
      const disabledPreferences = {
        ...mockPreferences,
        questStarted: false
      };
      expect(shouldNotify('questStarted', disabledPreferences)).toBe(false);
      expect(shouldNotify('questCompleted', disabledPreferences)).toBe(true);
    });

    it('should return false when in-app notifications are disabled', () => {
      const disabledInAppPreferences = {
        ...mockPreferences,
        channels: {
          inApp: false,
          email: true,
          push: false
        }
      };
      expect(shouldNotify('questStarted', disabledInAppPreferences)).toBe(false);
    });

    it('should return false when user has no preferences', () => {
      expect(shouldNotify('questStarted', null)).toBe(false);
      expect(shouldNotify('questStarted', undefined)).toBe(false);
    });

    it('should return false when preferences object is incomplete', () => {
      const incompletePreferences = {
        questStarted: true
        // Missing other required fields
      } as any;
      expect(shouldNotify('questStarted', incompletePreferences)).toBe(false);
    });

    it('should handle challengeJoined event type correctly', () => {
      const challengePreferences = {
        ...mockPreferences,
        challengeUpdates: false
      };
      expect(shouldNotify('challengeJoined', challengePreferences)).toBe(false);
      expect(shouldNotify('challengeJoined', mockPreferences)).toBe(true);
    });
  });
});
