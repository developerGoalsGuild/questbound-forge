
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  // Lambda Authorizer identity lives in resolverContext
  const sub =
    ctx.identity?.resolverContext?.sub || // Lambda authorizer
    ctx.identity?.sub;                    // (fallback for Cognito if ever used)

  if (!sub) util.unauthorized();

  return {
    operation: 'Query',
    query: {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      expressionNames: { '#pk': 'PK', '#sk': 'SK' },
      expressionValues: util.dynamodb.toMapValues({
        ':pk': `USER#${sub}`,
        ':sk': 'GOAL#',
      }),
    },
    scanIndexForward: true,
    consistentRead: false,
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);

  const items = ctx.result?.items ?? [];

  // Map DynamoDB attributes to GraphQL Goal
  return items.map((a) => ({
    id: a.id,
    userId: a.userId,
    title: a.title,
    description: a.description,
    tags: a.tags || [],
    deadline: typeof a.deadline === 'string' && a.deadline ? a.deadline : null, // "YYYY-MM-DD"
    status: a.status,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));
}
