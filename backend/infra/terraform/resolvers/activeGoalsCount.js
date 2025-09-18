// resolvers/activeGoalsCount.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const identity = ctx.identity || {};
  const sub = identity.sub;
  const userId = ctx.args?.userId;
  if (!sub) util.unauthorized();
  if (!userId) util.error('userId required', 'Validation');
  // Avoid using global String() in AppSync JS runtime; coerce via concatenation
  if (('' + sub) !== ('' + userId)) util.unauthorized();

  return {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      expressionNames: { '#pk': 'PK', '#sk': 'SK', '#st': 'status' },
      expressionValues: util.dynamodb.toMapValues({
        ':pk': 'USER#' + userId,
        ':sk': 'GOAL#',
        ':active': 'active'
      }),
    },
    filter: {
      expression: '#st = :active',
      expressionNames: { '#st': 'status' },
      expressionValues: util.dynamodb.toMapValues({ ':active': 'active' })
    },
    scanIndexForward: true,
    consistentRead: false,
    limit: 100
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const items = (ctx.result && ctx.result.items) ? ctx.result.items : [];
  return items.length;
}
