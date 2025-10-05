import { util } from '@aws-appsync/utils';

/**
 * myQuests Resolver - Query user's quests
 * Input: { "goalId": "string" (optional) }
 * Output: Quest[] array
 */

export function request(ctx) {
  const { goalId } = ctx.arguments;
  const userId = ctx.identity.resolverContext.sub;

  // Build query parameters
  const queryParams = {
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk_prefix': 'QUEST#'
    }
  };

  // Add filter for goalId if provided
  if (goalId) {
    queryParams.FilterExpression = 'contains(linkedGoalIds, :goalId)';
    queryParams.ExpressionAttributeValues[':goalId'] = goalId;
  }

  return {
    version: '2017-02-28',
    operation: 'Query',
    query: queryParams
  };
}

export function response(ctx) {
  const { result } = ctx;

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  // Transform DynamoDB items to Quest objects
  const quests = result.items.map(item => ({
    id: item.SK.replace('QUEST#', ''),
    userId: item.PK.replace('USER#', ''),
    title: item.title,
    description: item.description,
    difficulty: item.difficulty,
    rewardXp: item.rewardXp,
    status: item.status,
    category: item.category,
    tags: item.tags || [],
    privacy: item.privacy,
    deadline: item.deadline,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    kind: item.kind,
    linkedGoalIds: item.linkedGoalIds || [],
    linkedTaskIds: item.linkedTaskIds || [],
    dependsOnQuestIds: item.dependsOnQuestIds || [],
    targetCount: item.targetCount,
    countScope: item.countScope,
    startAt: item.startAt,
    periodSeconds: item.periodSeconds
  }));

  return quests;
}