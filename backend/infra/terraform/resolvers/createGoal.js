// resolvers/createGoal.js
import { util } from '@aws-appsync/utils';
import { put } from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const identity = ctx.identity || {};
  const userId = identity.sub;
  if (!userId) util.unauthorized();

  const input = ctx.args && ctx.args.input ? ctx.args.input : {};
  const title = input.title;
  if (!title) util.error('title required', 'Validation');

  const now = util.time.nowEpochMilliSeconds();
  const goalId = util.autoId();
  const item = {
    PK: 'USER#' + userId,
    SK: 'GOAL#' + goalId,
    type: 'Goal',
    id: goalId,
    userId: userId,
    title: title,
    description: input.description || '',
    tags: Array.isArray(input.tags) ? input.tags : [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
    GSI1PK: 'USER#' + userId,
    GSI1SK: 'ENTITY#Goal#' + now
  };

  return put({ item: item });
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const a = (ctx.result && ctx.result.attributes) ? ctx.result.attributes : ctx.result;
  return {
    id: a.id,
    userId: a.userId,
    title: a.title,
    description: a.description,
    tags: a.tags || [],
    status: a.status,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  };
}
