import { Quest } from '@/models/quest';
import { NotificationPreferences } from '@/models/profile';

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
  data?: {
    percentage?: number;
    days?: number;
    [key: string]: any;
  };
}

/**
 * Get notification message for a quest event
 */
export const getNotificationMessage = (
  event: QuestEvent,
  translations: any
): string => {
  // Validate event structure
  if (!event || !event.quest || !event.type) {
    return 'Invalid notification event';
  }

  const questTranslations = translations?.quest?.notifications?.messages;
  if (!questTranslations) {
    // Fallback messages when translations are not available
    const { type, quest, data } = event;
    const title = quest.title || 'Unknown Quest';

    switch (type) {
      case 'questStarted':
        return `Quest "${title}" has been started!`;
      case 'questCompleted':
        return `Congratulations! Quest "${title}" completed!`;
      case 'questFailed':
        return `Quest "${title}" has failed`;
      case 'progressMilestone':
        const percentage = data?.percentage || 0;
        return `You've reached ${percentage}% on quest "${title}"!`;
      case 'deadlineWarning':
        return `Quest "${title}" deadline is approaching!`;
      case 'streakAchieved':
        const days = data?.days || 0;
        return `Amazing! You've achieved a ${days}-day quest streak!`;
      case 'challengeJoined':
        return `You've joined the challenge "${title}"`;
      default:
        return `Quest ${type}`;
    }
  }

  const { type, quest, data } = event;
  const title = quest.title || 'Unknown Quest';

  switch (type) {
    case 'questStarted':
      return questTranslations.questStarted?.replace('{title}', title) || `Quest "${title}" has been started!`;
    
    case 'questCompleted':
      return questTranslations.questCompleted?.replace('{title}', title) || `Congratulations! Quest "${title}" completed!`;
    
    case 'questFailed':
      return questTranslations.questFailed?.replace('{title}', title) || `Quest "${title}" has failed`;
    
    case 'progressMilestone':
      const percentage = data?.percentage || 0;
      return questTranslations.progressMilestone
        ?.replace('{percentage}', percentage.toString())
        ?.replace('{title}', title) || `You've reached ${percentage}% on quest "${title}"!`;
    
    case 'deadlineWarning':
      return questTranslations.deadlineWarning?.replace('{title}', title) || `Quest "${title}" deadline is approaching!`;
    
    case 'streakAchieved':
      const days = data?.days || 0;
      return questTranslations.streakAchieved
        ?.replace('{days}', days.toString())
        ?.replace('{title}', title) || `Amazing! You've achieved a ${days}-day quest streak!`;
    
    case 'challengeJoined':
      return questTranslations.challengeJoined?.replace('{title}', title) || `You've joined the challenge "${title}"`;
    
    default:
      return `Quest ${type}`;
  }
};

/**
 * Check if user should receive notification for event type
 */
export const shouldNotify = (
  eventType: QuestEventType,
  preferences: NotificationPreferences | undefined
): boolean => {
  if (!preferences) return false;
  
  // Map event types to preference keys
  const eventPreferenceMap: Record<QuestEventType, keyof NotificationPreferences> = {
    questStarted: 'questStarted',
    questCompleted: 'questCompleted',
    questFailed: 'questFailed',
    progressMilestone: 'progressMilestones',
    deadlineWarning: 'deadlineWarnings',
    streakAchieved: 'streakAchievements',
    challengeJoined: 'challengeUpdates'
  };
  
  // Check if the specific event type is enabled
  const preferenceKey = eventPreferenceMap[eventType];
  const eventEnabled = preferences[preferenceKey];
  if (!eventEnabled) return false;
  
  // Check if in-app notifications are enabled
  return preferences.channels?.inApp === true;
};

/**
 * Detect quest status changes for notifications
 */
export const detectQuestChanges = (
  previousQuests: Quest[],
  currentQuests: Quest[]
): QuestEvent[] => {
  const events: QuestEvent[] = [];
  
  // Create maps for easier lookup
  const prevMap = new Map(previousQuests.map(q => [q.id, q]));
  const currMap = new Map(currentQuests.map(q => [q.id, q]));
  
  // Check for status changes
  for (const [id, currentQuest] of currMap) {
    const previousQuest = prevMap.get(id);
    
    if (!previousQuest) {
      // New quest started
      if (currentQuest.status === 'active') {
        events.push({
          type: 'questStarted',
          quest: currentQuest
        });
      }
    } else {
      // Check for status changes
      if (previousQuest.status !== currentQuest.status) {
        switch (currentQuest.status) {
          case 'completed':
            events.push({
              type: 'questCompleted',
              quest: currentQuest
            });
            break;
          case 'failed':
            events.push({
              type: 'questFailed',
              quest: currentQuest
            });
            break;
          case 'active':
            if (previousQuest.status === 'draft') {
              events.push({
                type: 'questStarted',
                quest: currentQuest
              });
            }
            break;
        }
      }
      
      // Check for progress milestones (if quest is active)
      if (currentQuest.status === 'active' && previousQuest.status === 'active') {
        const prevProgress = calculateQuestProgress(previousQuest);
        const currProgress = calculateQuestProgress(currentQuest);
        
        // Check for milestone achievements (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100];
        for (const milestone of milestones) {
          if (prevProgress.percentage < milestone && currProgress.percentage >= milestone) {
            events.push({
              type: 'progressMilestone',
              quest: currentQuest,
              data: { percentage: milestone }
            });
            break; // Only trigger one milestone per update
          }
        }
      }
      
      // Check for deadline warnings (if quest has deadline)
      if (currentQuest.deadline && currentQuest.status === 'active') {
        const deadline = new Date(currentQuest.deadline);
        const now = new Date();
        const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Warn if deadline is within 24 hours and we haven't warned recently
        if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
          // This is a simplified check - in a real implementation, you'd track when warnings were last sent
          events.push({
            type: 'deadlineWarning',
            quest: currentQuest
          });
        }
      }
    }
  }
  
  return events;
};

/**
 * Calculate quest progress (simplified version)
 * This should match the logic from questProgress.ts
 */
const calculateQuestProgress = (quest: Quest) => {
  if (quest.kind === 'linked') {
    const linkedGoalIds = quest.linkedGoalIds || [];
    const linkedTaskIds = quest.linkedTaskIds || [];
    const totalItems = linkedGoalIds.length + linkedTaskIds.length;
    
    // For now, return 0 since we don't have actual completion data
    // This would need to be integrated with actual goal/task completion status
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: totalItems
    };
  }
  
  if (quest.kind === 'quantitative') {
    const targetCount = quest.targetCount || 0;
    
    // For now, return 0 since we don't have actual completion data
    // This would need to be integrated with actual task completion counts
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: targetCount
    };
  }
  
  return {
    percentage: 0,
    completedCount: 0,
    totalCount: 0
  };
};