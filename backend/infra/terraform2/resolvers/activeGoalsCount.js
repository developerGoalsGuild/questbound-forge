// resolvers/activeGoalsCount.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const sub =
    ctx.identity?.resolverContext?.sub || // Lambda authorizer
    ctx.identity?.sub;                    // (fallback for Cognito if ever used)

  if (!sub) util.unauthorized();


  return {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      expressionNames: { '#pk': 'PK', '#sk': 'SK', '#st': 'status' },
      expressionValues: util.dynamodb.toMapValues({
        ':pk': `USER#${sub}`,
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
