/**
 * Quest Notifications Hook
 * 
 * Provides functionality to trigger notifications based on quest events
 * and user notification preferences.
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from './useTranslation';
import { getUserProfile } from '@/lib/apiProfile';
import type { Quest } from '@/models/quest';
import type { NotificationPreferences } from '@/models/profile';
import {
  shouldNotify,
  getNotificationMessage,
  type QuestEvent,
  type QuestEventType
} from '@/lib/questNotifications';

export const useQuestNotifications = () => {
  const { t } = useTranslation();

  const notifyQuestEvent = useCallback(async (
    eventType: QuestEventType,
    quest: Quest,
    metadata?: { percentage?: number; days?: number; title?: string }
  ) => {
    try {
      // Get user preferences
      const profile = await getUserProfile();
      const preferences = profile.notificationPreferences;

      // Check if notification should be shown
      if (!shouldNotify(eventType, preferences)) {
        return;
      }

      // Create event
      const event: QuestEvent = {
        type: eventType,
        quest,
        metadata
      };

      // Get notification message
      const message = getNotificationMessage(event, t);

      // Show toast notification
      const toastType = eventType === 'questCompleted' ? 'success' :
                       eventType === 'questFailed' ? 'error' :
                       eventType === 'deadlineWarning' ? 'warning' :
                       'info';

      if (toastType === 'success') {
        toast.success(message);
      } else if (toastType === 'error') {
        toast.error(message);
      } else if (toastType === 'warning') {
        toast.warning(message);
      } else {
        toast.info(message);
      }
    } catch (error) {
      console.error('Failed to show quest notification:', error);
      // Don't throw - notifications are non-critical
    }
  }, [t]);

  return {
    notifyQuestEvent
  };
};

