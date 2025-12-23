import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const expressions = ['#type = :type'];
  const expressionNames = { '#type': 'type' };
  const expressionValues = {
    ':type': util.dynamodb.toDynamoDB('BadgeDefinition'),
  };

  if (ctx.args?.category) {
    expressions.push('#category = :category');
    expressionNames['#category'] = 'category';
    expressionValues[':category'] = util.dynamodb.toDynamoDB(ctx.args.category);
  }

  if (ctx.args?.rarity) {
    expressions.push('#rarity = :rarity');
    expressionNames['#rarity'] = 'rarity';
    expressionValues[':rarity'] = util.dynamodb.toDynamoDB(ctx.args.rarity);
  }

  return {
    operation: 'Scan',
    filter: {
      expression: expressions.join(' AND '),
      expressionNames,
      expressionValues,
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const items = ctx.result?.items ?? ctx.result ?? [];
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    icon: item.icon,
    category: item.category,
    rarity: item.rarity,
    criteria: item.criteria || null,
    createdAt: item.createdAt,
  }));
}

