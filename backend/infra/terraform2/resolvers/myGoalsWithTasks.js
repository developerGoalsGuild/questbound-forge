// Pipeline resolver for myGoalsWithTasks - Before function
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  // Lambda Authorizer identity lives in resolverContext
  const userId =
    ctx.identity?.resolverContext?.sub || // Lambda authorizer
    ctx.identity?.sub;                    // (fallback for Cognito if ever used)

  if (!userId) {
    util.unauthorized();
  }
  
  // Store user ID in stash for pipeline functions
  ctx.stash.userId = userId;
  
  return {};
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);

  const goals = ctx.stash.goals || [];
  const tasks = ctx.stash.tasks || [];
  
  // Group tasks by goalId using reduce
  const tasksByGoal = tasks.reduce((acc, task) => {
    const goalId = task.goalId;
    if (!acc[goalId]) {
      acc[goalId] = [];
    }
    // Remove goalId from the task object since it's redundant in the grouped structure
    acc[goalId].push({
      id: task.id,
      dueAt: task.dueAt,
      status: task.status,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    });
    return acc;
  }, {});
  
  // Combine goals with their tasks using map
  return goals.map(goal => ({
    id: goal.id,
    title: goal.title,
    deadline: goal.deadline,
    status: goal.status,
    createdAt: goal.createdAt,
    tasks: tasksByGoal[goal.id] || []
  }));
}
