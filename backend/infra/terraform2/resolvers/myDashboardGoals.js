import { util } from '@aws-appsync/utils';

export function request(ctx) {
  // Lambda Authorizer identity lives in resolverContext
  const sub =
    ctx.identity?.resolverContext?.sub || // Lambda authorizer
    ctx.identity?.sub;                    // (fallback for Cognito if ever used)

  if (!sub) util.unauthorized();

  // Extract query parameters
  const limit = ctx.args?.limit;
  const status = ctx.args?.status;

  // Build query expression
  let expression = '#pk = :pk AND begins_with(#sk, :sk)';
  const expressionNames = { '#pk': 'PK', '#sk': 'SK' };
  const expressionValues = {
    ':pk': `USER#${sub}`,
    ':sk': 'GOAL#',
  };

  // Add status filter if provided
  if (status) {
    expression += ' AND #status = :status';
    expressionNames['#status'] = 'status';
    expressionValues[':status'] = status;
  }

  const request = {
    operation: 'Query',
    query: {
      expression,
      expressionNames,
      expressionValues: util.dynamodb.toMapValues(expressionValues),
    },
    scanIndexForward: true,
    consistentRead: false,
  };

  // Add limit if provided
  if (limit && limit > 0) {
    request.limit = Math.min(limit, 100); // Cap at 100 for safety
  }

  return request;
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);

  const items = ctx.result?.items ?? [];

  // Map DynamoDB attributes to GraphQL Goal (optimized for dashboard - no answers)
  const goals = items.map((a) => ({
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

  return goals;
}
