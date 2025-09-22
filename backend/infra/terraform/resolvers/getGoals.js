// resolvers/getGoals.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const identity = ctx.identity || {};
  const sub = identity.sub;
  const userId = ctx.args?.userId;
  if (!sub) util.unauthorized();
  if (!userId) util.error('userId required', 'Validation');
  // Enforce that callers can only read their own goals; avoid String() in AppSync runtime
  if (('' + sub) !== ('' + userId)) util.unauthorized();

  return {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      expressionNames: { '#pk': 'PK', '#sk': 'SK' },
      expressionValues: util.dynamodb.toMapValues({
        ':pk': 'USER#' + userId,
        ':sk': 'GOAL#'
      }),
    },
    scanIndexForward: true,
    consistentRead: false,
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const items = (ctx.result && ctx.result.items) ? ctx.result.items : [];
  return items.map(a => ({
    id: a.id,
    userId: a.userId,
    title: a.title,
    description: a.description,
    tags: a.tags || [],
    deadline: (typeof a.deadline === 'string' && a.deadline) ? a.deadline : null,
    status: a.status,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));
}
