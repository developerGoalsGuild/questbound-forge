// resolvers/createGoal.js
import { util } from '@aws-appsync/utils';
import { put } from '@aws-appsync/utils/dynamodb';

const nlpQuestionOrder = [
  'positive',
  'specific',
  'evidence',
  'resources',
  'obstacles',
  'ecology',
  'timeline',
  'firstStep',
];

export function request(ctx) {
  console.log(`addTodo.request user`);
  console.log('CreateGoal request started');
  const identity = ctx.identity || {};
  console.log('Identity: ' + JSON.stringify(identity));
  const userId = identity.sub;
  if (!userId) {
    util.error('Unauthorized: No userId found in identity', 'Unauthorized');
  }

  const input = ctx.args && ctx.args.input ? ctx.args.input : {};
  console.log('Input received: ' + JSON.stringify(input));

  const title = input.title;
  if (!title) {
    util.error('Validation error: title required', 'Validation');
  }

  const deadline = input.deadline;
  if (typeof deadline !== 'number') {
    util.error('Validation error: deadline required and must be a number', 'Validation');
  }

  const answers = nlpQuestionOrder.map((key) => ({
    key,
    answer: input.answers?.[key] || '',
  }));

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
    answers: answers,
    deadline: deadline,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    GSI1PK: 'USER#' + userId,
    GSI1SK: 'ENTITY#Goal#' + now
  };

  console.log('Item to put: ' + JSON.stringify(item));

  return put({ item: item });
}

export function response(ctx) {
  if (ctx.error) {
    util.error('CreateGoal resolver error: ' + ctx.error.message, ctx.error.type);
  }
  const a = (ctx.result && ctx.result.attributes) ? ctx.result.attributes : ctx.result;
  console.log('CreateGoal resolver response: ' + JSON.stringify(a));
  return {
    id: a.id,
    userId: a.userId,
    title: a.title,
    description: a.description,
    questions: a.questions || [],
    tags: a.tags || [],
    deadline: (typeof a.deadline === 'number') ? a.deadline : null,
    status: a.status,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  };
}
