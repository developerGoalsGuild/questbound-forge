import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const sub = ctx.identity?.resolverContext?.sub || ctx.identity?.sub;
  if (!sub) {
    util.unauthorized();
  }

  const expressionValues = util.dynamodb.toMapValues({
    ':pk': `USER#${sub}`,
    ':sk': 'BADGE#',
  });

  return {
    operation: 'Query',
    query: {
      expression: 'PK = :pk AND begins_with(SK, :sk)',
      expressionValues,
    },
    scanIndexForward: false,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const categoryFilter = ctx.args?.category;
  const rarityFilter = ctx.args?.rarity;
  const items = ctx.result?.items ?? [];

  const badges = items
    .map((item) => ({
      badge: {
        userId: item.userId,
        badgeId: item.badgeId,
        earnedAt: item.earnedAt ?? item.createdAt,
        progress: item.progress ?? 1,
        metadata: item.metadata ?? null,
      },
      definition: {
        id: item.badgeId,
        name: item.definitionName ?? item.badgeId,
        description: item.definitionDescription ?? '',
        icon: item.definitionIcon ?? null,
        category: item.definitionCategory ?? 'quest',
        rarity: item.definitionRarity ?? 'common',
        criteria: null,
        createdAt: item.createdAt,
      },
    }))
    .filter((entry) => {
      if (categoryFilter && entry.definition.category !== categoryFilter) {
        return false;
      }
      if (rarityFilter && entry.definition.rarity !== rarityFilter) {
        return false;
      }
      return true;
    });

  return badges;
}

