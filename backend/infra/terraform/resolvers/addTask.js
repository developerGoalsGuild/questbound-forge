// resolvers/addTask.js
import { util } from '@aws-appsync/utils';
import { put } from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const identity = ctx.identity || {};
  const ownerId = identity.sub;
  if (!ownerId) util.unauthorized();

  const input = ctx.args && ctx.args.input ? ctx.args.input : {};
  const goalId = input.goalId;
  const title = input.title;
  if (!goalId) util.error('goalId required', 'Validation');
  if (!title) util.error('title required', 'Validation');

  const now = util.time.nowEpochMilliSeconds();
  const taskId = util.autoId();

  const item = {
    PK: 'GOAL#' + goalId,
    SK: 'TASK#' + taskId,
    type: 'Task',
    id: taskId,
    goalId: goalId,
    ownerId: ownerId,
    title: title,
    nlpPlan: input.nlpPlan || {},
    dueAt: (typeof input.dueAt === 'number') ? input.dueAt : null, // expecting AWSTimestamp (seconds)
    status: 'open',
    assignees: Array.isArray(input.assignees) ? input.assignees : [],
    createdAt: now,
    updatedAt: now
  };

  return put({ item: item });
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  const a = (ctx.result && ctx.result.attributes) ? ctx.result.attributes : ctx.result;
  return {
    id: a.id,
    goalId: a.goalId,
    title: a.title,
    nlpPlan: a.nlpPlan || {},
    dueAt: (typeof a.dueAt === 'number') ? a.dueAt : null,
    status: a.status,
    assignees: a.assignees || [],
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  };
}
