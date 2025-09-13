// resolvers/myTasks.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const sub = ctx.identity?.sub;
  const goalId = ctx.args?.goalId;
  if (!sub) util.unauthorized();
  if (!goalId) util.error('goalId required', 'Validation');
  return {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      expressionNames: { '#pk': 'PK', '#sk': 'SK' },
      expressionValues: util.dynamodb.toMapValues({ ':pk': 'GOAL#' + goalId, ':sk': 'TASK#' })
    },
    filter: {
      expression: '#owner = :me',
      expressionNames: { '#owner': 'ownerId' },
      expressionValues: util.dynamodb.toMapValues({ ':me': sub })
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
    goalId: a.goalId,
    title: a.title,
    nlpPlan: a.nlpPlan || {},
    dueAt: (typeof a.dueAt === 'number') ? a.dueAt : null,
    status: a.status,
    assignees: a.assignees || [],
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));
}

