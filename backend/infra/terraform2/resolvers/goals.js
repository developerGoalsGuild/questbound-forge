import { util } from '@aws-appsync/utils';

/**
 * Query resolver for goals(userId: ID!)
 * Fetches goals for a specific user by userId
 */
export function request(ctx) {
  const { userId } = ctx.args;
  
  if (!userId) {
    util.error('userId is required', 'VALIDATION_ERROR');
  }

  return {
    operation: 'Query',
    query: {
      expression: 'PK = :pk AND begins_with(SK, :sk)',
      expressionValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'GOAL#'
      }
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const items = ctx.result.items || [];
  
  // Transform DynamoDB items to GraphQL Goal type
  const goals = items.map(item => ({
    id: item.SK.replace('GOAL#', ''),
    userId: item.PK.replace('USER#', ''),
    title: item.title,
    description: item.description,
    category: item.category,
    tags: item.tags || [],
    deadline: item.deadline,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    answers: item.answers || [],
    progress: item.progress,
    milestones: item.milestones || [],
    completedTasks: item.completedTasks,
    totalTasks: item.totalTasks
  }));

  return goals;
}
