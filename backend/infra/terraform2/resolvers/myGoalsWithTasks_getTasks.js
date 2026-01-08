// Pipeline function 2: Get active tasks
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const userId = ctx.stash.userId;
  
  return {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      expressionNames: { '#pk': 'PK', '#sk': 'SK' },
      expressionValues: util.dynamodb.toMapValues({
        ':pk': `USER#${userId}`,
        ':sk': 'TASK#',
      }),
    },
    filter: {
      expression: '#status IN (:activeStatus, :pausedStatus, :completedStatus)',
      expressionNames: { '#status': 'status' },
      expressionValues: util.dynamodb.toMapValues({ 
        ':activeStatus': 'active',
        ':pausedStatus': 'paused', 
        ':completedStatus': 'completed'
      })
    },
    scanIndexForward: true,
    consistentRead: false,
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);

  const items = ctx.result?.items ?? [];

  // Map DynamoDB attributes to GraphQL Task and store in stash
  ctx.stash.tasks = items.map(a => ({
    id: a.id,
    goalId: a.goalId, // Still need this for grouping in the main resolver
    dueAt: (typeof a.dueAt === 'number') ? a.dueAt : null,
    status: a.status,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));

  return ctx.stash.tasks;
}
