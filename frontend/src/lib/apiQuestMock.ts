/**
 * Mock Quest API for Development
 * 
 * This file provides mock implementations of quest API functions
 * for development and testing purposes when the backend is not available.
 */

import type { 
  Quest, 
  QuestCreateInput, 
  QuestUpdateInput, 
  QuestCancelInput 
} from '@/models/quest';
import { logger } from './logger';

// Mock quest data
const mockQuests: Quest[] = [
  {
    id: 'quest-1',
    userId: 'user-1',
    title: 'Morning Exercise Routine',
    description: 'Complete a 30-minute morning exercise routine every day for a week.',
    difficulty: 'medium',
    rewardXp: 150,
    status: 'active',
    category: 'Health',
    tags: ['fitness', 'morning', 'routine'],
    privacy: 'public',
    deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    kind: 'linked',
    linkedGoalIds: ['goal-1', 'goal-2'],
    linkedTaskIds: ['task-1'],
    dependsOnQuestIds: [],
  },
  {
    id: 'quest-2',
    userId: 'user-1',
    title: 'Read 10 Books',
    description: 'Read 10 books this month to improve knowledge and reading habits.',
    difficulty: 'hard',
    rewardXp: 500,
    status: 'draft',
    category: 'Education',
    tags: ['reading', 'books', 'learning'],
    privacy: 'private',
    deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    updatedAt: Date.now(),
    kind: 'quantitative',
    targetCount: 10,
    countScope: 'any',
    linkedGoalIds: ['goal-3'],
    linkedTaskIds: [],
    dependsOnQuestIds: [],
  },
  {
    id: 'quest-3',
    userId: 'user-1',
    title: 'Complete Project',
    description: 'Finish the important project before the deadline.',
    difficulty: 'easy',
    rewardXp: 100,
    status: 'completed',
    category: 'Work',
    tags: ['project', 'deadline', 'work'],
    privacy: 'followers',
    deadline: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    kind: 'linked',
    linkedGoalIds: [],
    linkedTaskIds: ['task-2', 'task-3'],
    dependsOnQuestIds: ['quest-1'],
  },
];

// Mock delay function
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock function to load quests
 */
export const loadQuests = async (goalId?: string): Promise<Quest[]> => {
  logger.info('Loading quests', { goalId });
  await mockDelay();
  
  // Filter by goalId if provided
  if (goalId) {
    return mockQuests.filter(quest => quest.linkedGoalIds.includes(goalId));
  }
  
  return [...mockQuests];
};

export const loadQuest = async (questId: string): Promise<Quest> => {
  logger.info('Loading quest', { questId });
  await mockDelay();
  
  const quest = mockQuests.find(q => q.id === questId);
  if (!quest) {
    throw new Error(`Quest with ID ${questId} not found`);
  }
  
  return { ...quest };
};

/**
 * Mock function to create a quest
 */
export const createQuest = async (input: QuestCreateInput): Promise<Quest> => {
  logger.info('Creating quest', { input });
  await mockDelay();
  
  const newQuest: Quest = {
    id: `quest-${Date.now()}`,
    userId: 'user-1',
    title: input.title,
    description: input.description,
    difficulty: input.difficulty,
    rewardXp: input.rewardXp,
    status: 'draft',
    category: input.category,
    tags: input.tags || [],
    privacy: input.privacy,
    deadline: input.deadline,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    kind: input.kind,
    linkedGoalIds: input.linkedGoalIds || [],
    linkedTaskIds: input.linkedTaskIds || [],
    dependsOnQuestIds: input.dependsOnQuestIds || [],
    targetCount: input.targetCount,
    countScope: input.countScope,
    periodDays: input.periodDays,
  };
  
  mockQuests.push(newQuest);
  return newQuest;
};

/**
 * Mock function to start a quest
 */
export const startQuest = async (questId: string): Promise<Quest> => {
  logger.info('Starting quest', { questId });
  await mockDelay();
  
  const quest = mockQuests.find(q => q.id === questId);
  if (!quest) {
    throw new Error('Quest not found');
  }
  
  quest.status = 'active';
  quest.updatedAt = Date.now();
  
  return quest;
};

/**
 * Mock function to edit a quest
 */
export const editQuest = async (questId: string, input: QuestUpdateInput): Promise<Quest> => {
  logger.info('Editing quest', { questId, input });
  await mockDelay();
  
  const quest = mockQuests.find(q => q.id === questId);
  if (!quest) {
    throw new Error('Quest not found');
  }
  
  // Update quest properties
  Object.assign(quest, input);
  quest.updatedAt = Date.now();
  
  return quest;
};

/**
 * Mock function to cancel a quest
 */
export const cancelQuest = async (questId: string, input: QuestCancelInput): Promise<Quest> => {
  logger.info('Cancelling quest', { questId, input });
  await mockDelay();
  
  const quest = mockQuests.find(q => q.id === questId);
  if (!quest) {
    throw new Error('Quest not found');
  }
  
  quest.status = 'cancelled';
  quest.updatedAt = Date.now();
  
  return quest;
};

/**
 * Mock function to fail a quest
 */
export const failQuest = async (questId: string): Promise<Quest> => {
  logger.info('Failing quest', { questId });
  await mockDelay();
  
  const quest = mockQuests.find(q => q.id === questId);
  if (!quest) {
    throw new Error('Quest not found');
  }
  
  quest.status = 'failed';
  quest.updatedAt = Date.now();
  
  return quest;
};

/**
 * Mock function to delete a quest
 */
export const deleteQuest = async (questId: string): Promise<void> => {
  logger.info('Deleting quest', { questId });
  await mockDelay();
  
  const index = mockQuests.findIndex(q => q.id === questId);
  if (index === -1) {
    throw new Error('Quest not found');
  }
  
  mockQuests.splice(index, 1);
};
