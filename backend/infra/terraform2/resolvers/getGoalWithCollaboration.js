// resolvers/getGoalWithCollaboration.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const identity = ctx.identity || {};
  const sub = identity.resolverContext?.sub || identity.sub;
  const goalId = ctx.args?.goalId;
  
  if (!sub) util.unauthorized();
  if (!goalId) util.error('goalId required', 'Validation');

  // Use a Lambda function to handle complex access control
  return {
    operation: 'Invoke',
    payload: {
      userId: sub,
      goalId: goalId,
      action: 'getGoal'
    }
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  
  const result = ctx.result;
  if (!result || result.error) {
    return null;
  }

  // Return the goal data from the Lambda function
  return result.goal;
}
