import { util } from '@aws-appsync/utils';

export function request(ctx) {
  // Lambda Authorizer identity lives in resolverContext
  const sub =
    ctx.identity?.resolverContext?.sub || // Lambda authorizer
    ctx.identity?.sub;                    // (fallback for Cognito if ever used)

  if (!sub) util.unauthorized();

  const goalId = ctx.args.goalId;
  if (!goalId) util.error('Goal ID is required');

  return {
    method: 'POST',
    resourcePath: '/graphql/goalProgress',
    params: {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: 'getGoalProgress',
        goalId: goalId,
        userId: sub
      })
    }
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);

  const result = ctx.result;
  if (!result) {
    util.error('Goal progress not found');
  }

  // Parse the HTTP response body
  if (result.body) {
    return JSON.parse(result.body);
  }

  return result;
}
