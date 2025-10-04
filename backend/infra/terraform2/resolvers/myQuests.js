import { util } from '@aws-appsync/utils';

/**
 * Query resolver for myQuests
 * Fetches quests for the current user, optionally filtered by goalId
 */
export function request(ctx) {
  const { goalId } = ctx.args;
  const userId = ctx.identity.sub;
  
  if (!userId) {
    util.error('Unauthorized', 'UNAUTHORIZED');
  }

  // Build the query parameters
  const queryParams = {
    operation: 'Query',
    query: {
      expression: 'PK = :pk AND begins_with(SK, :sk)',
      expressionValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'QUEST#'
      }
    }
  };

  // Add goalId filter if provided
  if (goalId) {
    queryParams.query.expression += ' AND contains(linkedGoalIds, :goalId)';
    queryParams.query.expressionValues[':goalId'] = goalId;
  }

  return {
    operation: 'Query',
    query: queryParams.query
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const items = ctx.result.items || [];
  
  // Transform DynamoDB items to GraphQL Quest type
  const quests = items.map(item => ({
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
