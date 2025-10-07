import { util } from '@aws-appsync/utils';

/**
 * myQuests Resolver - Query user's quests
 * Input: { "goalId": "string" (optional) }
 * Output: Quest[] array
 */

export function request(ctx) {
  const { goalId } = ctx.arguments;
  
  // Lambda Authorizer identity lives in resolverContext
  const sub =
    ctx.identity?.resolverContext?.sub || // Lambda authorizer
    ctx.identity?.sub;                    // (fallback for Cognito if ever used)

  if (!sub) util.unauthorized();

  // Build query parameters using AppSync JS runtime format
  const queryConfig = {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      expressionNames: { '#pk': 'PK', '#sk': 'SK' },
      expressionValues: util.dynamodb.toMapValues({
        ':pk': `USER#${sub}`,
        ':sk': 'QUEST#',
      }),
    },
    scanIndexForward: true,
    consistentRead: false,
  };

  // Add filter for goalId if provided
  if (goalId) {
    queryConfig.query.filter = {
      expression: 'contains(linkedGoalIds, :goalId)',
      expressionValues: util.dynamodb.toMapValues({
        ':goalId': goalId,
      }),
    };
  }

  return queryConfig;
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);

  const items = ctx.result?.items ?? [];

  // Transform DynamoDB items to Quest objects
  return items.map(item => {
    const quest = {
      id: item.id,
      userId: item.userId,
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
      periodDays: item.periodDays
    };
    
    // Only include countScope if it's a valid enum value
    if (item.countScope && (item.countScope === 'completed_tasks' || item.countScope === 'completed_goals')) {
      quest.countScope = item.countScope;
    }
    
    return quest;
  });
}