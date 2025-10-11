import { useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { Quest } from '@/models/quest';
import { 
  QuestEvent, 
  QuestEventType, 
  getNotificationMessage, 
  shouldNotify 
} from '@/lib/questNotifications';
import { logger } from '@/lib/logger';

export const useQuestNotifications = () => {
  const { t } = useTranslation();
  const { profile: user } = useUserProfile();

  /**
   * Trigger a notification for a quest event
   */
  const notifyQuestEvent = useCallback((event: QuestEvent) => {
    try {
      // Check if user should receive this notification
      if (!shouldNotify(event.type, user?.notificationPreferences)) {
        logger.debug('Notification skipped due to user preferences', { 
          eventType: event.type, 
          preferences: user?.notificationPreferences 
        });
        return;
      }

      // Get the notification message
      const message = getNotificationMessage(event, t);
      
      // Show toast notification
      toast.info(message, {
        duration: 5000,
        position: 'top-right',
      });

      logger.info('Quest notification sent', { 
        eventType: event.type, 
        questId: event.quest.id,
        questTitle: event.quest.title 
      });
    } catch (error) {
      logger.error('Failed to send quest notification', { error, event });
    }
  }, [user, t]);

  /**
   * Convenience method for common quest events
   */
  const notifyQuestStarted = useCallback((quest: Quest) => {
    notifyQuestEvent({
      type: 'questStarted',
      quest
    });
  }, [notifyQuestEvent]);

  const notifyQuestCompleted = useCallback((quest: Quest) => {
    notifyQuestEvent({
      type: 'questCompleted',
      quest
    });
  }, [notifyQuestEvent]);

  const notifyQuestFailed = useCallback((quest: Quest) => {
    notifyQuestEvent({
      type: 'questFailed',
      quest
    });
  }, [notifyQuestEvent]);

  const notifyProgressMilestone = useCallback((quest: Quest, percentage: number) => {
    notifyQuestEvent({
      type: 'progressMilestone',
      quest,
      data: { percentage }
    });
  }, [notifyQuestEvent]);

  const notifyDeadlineWarning = useCallback((quest: Quest) => {
    notifyQuestEvent({
      type: 'deadlineWarning',
      quest
    });
  }, [notifyQuestEvent]);

  const notifyStreakAchieved = useCallback((quest: Quest, days: number) => {
    notifyQuestEvent({
      type: 'streakAchieved',
      quest,
      data: { days }
    });
  }, [notifyQuestEvent]);

  const notifyChallengeJoined = useCallback((quest: Quest) => {
    notifyQuestEvent({
      type: 'challengeJoined',
      quest
    });
  }, [notifyQuestEvent]);

  return {
    notifyQuestEvent,
    notifyQuestStarted,
    notifyQuestCompleted,
    notifyQuestFailed,
    notifyProgressMilestone,
    notifyDeadlineWarning,
    notifyStreakAchieved,
    notifyChallengeJoined,
  };
};