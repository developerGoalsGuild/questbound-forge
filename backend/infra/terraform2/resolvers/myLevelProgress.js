import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const sub = ctx.identity?.resolverContext?.sub || ctx.identity?.sub;
  if (!sub) {
    util.unauthorized();
  }

  return {
    operation: 'GetItem',
    key: util.dynamodb.toMapValues({
      PK: `USER#${sub}`,
      SK: 'XP#SUMMARY',
    }),
    consistentRead: true,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result?.item || ctx.result;
  if (!item) {
    util.error('Level progress not found', 'NotFound');
  }

  return {
    userId: item.userId,
    totalXp: item.totalXp || 0,
    currentLevel: item.currentLevel || 1,
    xpForCurrentLevel: item.xpForCurrentLevel || 0,
    xpForNextLevel: item.xpForNextLevel || 100,
    xpProgress: item.xpProgress ?? 0,
    updatedAt: item.updatedAt || util.time.nowEpochMilliSeconds(),
  };
}

