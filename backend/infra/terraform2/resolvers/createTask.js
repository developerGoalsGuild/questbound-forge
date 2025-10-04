import { util } from '@aws-appsync/utils';

/**
 * Mutation resolver for createTask
 * Creates a new task associated with a goal owned by the current user
 */
export function request(ctx) {
  const { input } = ctx.args;
  const userId = ctx.identity.sub;
  
  if (!userId) {
    util.error('Unauthorized', 'UNAUTHORIZED');
  }

  if (!input || !input.goalId || !input.title || !input.dueAt) {
    util.error('Missing required fields: goalId, title, dueAt', 'VALIDATION_ERROR');
  }

  // Generate task ID
  const taskId = `TASK#${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = Math.floor(Date.now() / 1000);

  // First, verify the goal exists and belongs to the user
  const goalQuery = {
    operation: 'GetItem',
    key: {
      PK: `USER#${userId}`,
      SK: `GOAL#${input.goalId}`
    }
  };

  // Then create the task
  const taskItem = {
    operation: 'PutItem',
    key: {
      PK: `USER#${userId}`,
      SK: taskId
    },
    attributeValues: {
      goalId: input.goalId,
      title: input.title,
      dueAt: input.dueAt,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      tags: input.tags || [],
      GSI1PK: `GOAL#${input.goalId}`,
      GSI1SK: taskId
    }
  };

  return {
    operation: 'TransactWrite',
    transactItems: [
      {
        table: '${ctx.source}',
        operation: 'ConditionCheck',
        key: {
          PK: `USER#${userId}`,
          SK: `GOAL#${input.goalId}`
        },
        condition: {
          expression: 'attribute_exists(PK)'
        }
      },
      {
        table: '${ctx.source}',
        operation: 'PutItem',
        key: {
          PK: `USER#${userId}`,
          SK: taskId
        },
        attributeValues: {
          goalId: input.goalId,
          title: input.title,
          dueAt: input.dueAt,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          tags: input.tags || [],
          GSI1PK: `GOAL#${input.goalId}`,
          GSI1SK: taskId
        }
      }
    ]
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  // Extract task information from the transaction result
  const taskId = ctx.result.transactItems[1].key.SK;
  const taskData = ctx.result.transactItems[1].attributeValues;

  return {
    id: taskId.replace('TASK#', ''),
    goalId: taskData.goalId,
    title: taskData.title,
    dueAt: taskData.dueAt,
    status: taskData.status,
    createdAt: taskData.createdAt,
    updatedAt: taskData.updatedAt,
    tags: taskData.tags
  };
}
