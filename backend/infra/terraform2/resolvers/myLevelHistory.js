import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const sub = ctx.identity?.resolverContext?.sub || ctx.identity?.sub;
  if (!sub) {
    util.unauthorized();
  }

  const limit = ctx.args?.limit ?? 20;
  const expressionValues = util.dynamodb.toMapValues({
    ':pk': `USER#${sub}`,
    ':sk': 'LEVEL#EVENT#',
  });

  return {
    operation: 'Query',
    query: {
      expression: 'PK = :pk AND begins_with(SK, :sk)',
      expressionValues,
    },
    nextToken: ctx.args?.nextToken,
    limit,
    scanIndexForward: false,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const { items = [], nextToken } = ctx.result ?? {};
  const events = items.map((item) => ({
    userId: item.userId,
    level: item.level,
    totalXp: item.totalXp,
    source: item.source,
    awardedAt: item.awardedAt || item.createdAt,
  }));

  return {
    items: events,
    nextToken,
  };
}

