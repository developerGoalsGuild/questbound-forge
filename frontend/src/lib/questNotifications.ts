/**
 * Quest Notifications Utility
 * 
 * Provides functions for generating notification messages and detecting quest events
 * for the notification system.
 */

import type { Quest } from '@/models/quest';
import type { NotificationPreferences } from '@/models/profile';

export type QuestEventType = 
  | 'questStarted'
  | 'questCompleted'
  | 'questFailed'
  | 'progressMilestone'
  | 'deadlineWarning'
  | 'streakAchieved'
  | 'challengeJoined';

export interface QuestEvent {
  type: QuestEventType;
  quest: Quest;
  metadata?: {
    percentage?: number;
    days?: number;
    title?: string;
  };
}

/**
 * Check if a notification should be shown based on user preferences
 */
export const shouldNotify = (
  eventType: QuestEventType,
  preferences?: NotificationPreferences
): boolean => {
  if (!preferences) {
    // Default to all notifications enabled if preferences not set
    return true;
  }

  // Check if in-app notifications are enabled
  if (!preferences.channels?.inApp) {
    return false;
  }

  // Check if specific event type is enabled
  switch (eventType) {
    case 'questStarted':
      return preferences.questStarted;
    case 'questCompleted':
      return preferences.questCompleted;
    case 'questFailed':
      return preferences.questFailed;
    case 'progressMilestone':
      return preferences.progressMilestones;
    case 'deadlineWarning':
      return preferences.deadlineWarnings;
    case 'streakAchieved':
      return preferences.streakAchievements;
    case 'challengeJoined':
      return preferences.challengeUpdates;
    default:
      return true;
  }
};

/**
 * Generate notification message for a quest event
 */
export const getNotificationMessage = (
  event: QuestEvent,
  translations?: any
): string => {
  const { type, quest, metadata } = event;
  const messages = translations?.quest?.notifications?.messages;

  if (!messages) {
    // Fallback messages if translations not available
    switch (type) {
      case 'questStarted':
        return `Quest "${quest.title}" has been started!`;
      case 'questCompleted':
        return `Congratulations! Quest "${quest.title}" completed!`;
      case 'questFailed':
        return `Quest "${quest.title}" has failed`;
      case 'progressMilestone':
        return `You've reached ${metadata?.percentage || 0}% on quest "${quest.title}"!`;
      case 'deadlineWarning':
        return `Quest "${quest.title}" deadline is approaching!`;
      case 'streakAchieved':
        return `Amazing! You've achieved a ${metadata?.days || 0}-day quest streak!`;
      case 'challengeJoined':
        return `You've joined the challenge "${metadata?.title || quest.title}"`;
      default:
        return `Quest "${quest.title}" updated`;
    }
  }

  // Use translations with dynamic values
  switch (type) {
    case 'questStarted':
      return messages.questStarted.replace('{title}', quest.title);
    case 'questCompleted':
      return messages.questCompleted.replace('{title}', quest.title);
    case 'questFailed':
      return messages.questFailed.replace('{title}', quest.title);
    case 'progressMilestone':
      return messages.progressMilestone
        .replace('{title}', quest.title)
        .replace('{percentage}', String(metadata?.percentage || 0));
    case 'deadlineWarning':
      return messages.deadlineWarning.replace('{title}', quest.title);
    case 'streakAchieved':
      return messages.streakAchieved.replace('{days}', String(metadata?.days || 0));
    case 'challengeJoined':
      return messages.challengeJoined.replace('{title}', metadata?.title || quest.title);
    default:
      return `Quest "${quest.title}" updated`;
  }
};

/**
 * Detect quest status changes between old and new quest state
 */
export const detectQuestChanges = (
  oldQuest: Quest | null,
  newQuest: Quest
): QuestEvent | null => {
  if (!oldQuest) {
    // New quest, check if it was just started
    if (newQuest.status === 'active' && newQuest.startedAt) {
      return {
        type: 'questStarted',
        quest: newQuest
      };
    }
    return null;
  }

  // Detect status changes
  if (oldQuest.status !== newQuest.status) {
    if (newQuest.status === 'active') {
      return {
        type: 'questStarted',
        quest: newQuest
      };
    }
    if (newQuest.status === 'completed') {
      return {
        type: 'questCompleted',
        quest: newQuest
      };
    }
    if (newQuest.status === 'failed') {
      return {
        type: 'questFailed',
        quest: newQuest
      };
    }
  }

  return null;
};

/**
 * Check if a quest is approaching its deadline (within 24 hours)
 */
export const isApproachingDeadline = (quest: Quest): boolean => {
  if (!quest.deadline || quest.status !== 'active') {
    return false;
  }

  const now = Date.now();
  const deadline = new Date(quest.deadline).getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  return deadline - now <= twentyFourHours && deadline > now;
};

