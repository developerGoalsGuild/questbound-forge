// Pipeline function 1: Get active goals
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
        ':sk': 'GOAL#',
      }),
    },
    filter: {
      expression: '#status = :status',
      expressionNames: { '#status': 'status' },
      expressionValues: util.dynamodb.toMapValues({ ':status': 'active' })
    },
    scanIndexForward: true,
    consistentRead: false,
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);

  const items = ctx.result?.items ?? [];

  // Map DynamoDB attributes to GraphQL Goal and store in stash
  ctx.stash.goals = items.map(a => ({
    id: a.id,
    userId: a.userId,
    title: a.title,
    description: a.description,
    category: a.category || null,
    tags: a.tags || [],
    deadline: typeof a.deadline === 'string' && a.deadline ? a.deadline : null,
    status: a.status,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));

  return ctx.stash.goals;
}
