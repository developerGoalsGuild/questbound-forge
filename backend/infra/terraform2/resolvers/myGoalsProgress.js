import { util } from '@aws-appsync/utils';

export function request(ctx) {
  // Lambda Authorizer identity lives in resolverContext
  const sub =
    ctx.identity?.resolverContext?.sub || // Lambda authorizer
    ctx.identity?.sub;                    // (fallback for Cognito if ever used)

  if (!sub) util.unauthorized();

  return {
    method: 'POST',
    resourcePath: '/graphql/myGoalsProgress',
    params: {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: 'getAllGoalsProgress',
        userId: sub
      })
    }
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);

  const result = ctx.result;
  
  if (!result) {
    return [];
  }

  // Parse the HTTP response body
  if (result.body) {
    const parsed = JSON.parse(result.body);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  }

  // If result is already an array, return it
  if (Array.isArray(result)) {
    return result;
  }

  return [];
}
