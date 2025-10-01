// resolvers/getGoal.js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const identity = ctx.identity || {};
  const sub = identity.resolverContext?.sub || identity.sub;


  const goalId = ctx.args?.goalId;
  
  if (!sub) util.unauthorized();
  if (!goalId) util.error('goalId required', 'Validation');

  return {
    operation: 'GetItem',
    key: util.dynamodb.toMapValues({
      PK: `USER#${sub}`,
      SK: `GOAL#${goalId}`
    }),
    consistentRead: false,
  };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  
  const item = ctx.result;
  if (!item) {
    return null; // Goal not found
  }

  // Transform DynamoDB item to GraphQL Goal type
  return {
    id: item.id,
    userId: item.userId,
    title: item.title,
    description: item.description || null,
    tags: item.tags || [],
    deadline: item.deadline || null,
    status: item.status || 'active',
    createdAt: item.createdAt || 0,
    updatedAt: item.updatedAt || 0,
    answers: (item.answers || []).map(a => ({
      key: a.key || '',
      answer: a.answer || ''
    }))
  };
}
