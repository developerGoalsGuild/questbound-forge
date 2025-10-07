/**
 * Frontend Progress Calculation Utilities
 * Calculates goal progress and milestones on the client side
 */

export interface Task {
  id: string;
  dueAt: number;
  status: 'active' | 'paused' | 'completed' | 'canceled';
  createdAt: number;
  updatedAt: number;
}

export interface GoalWithTasks {
  id: string;
  title: string;
  deadline: string; // YYYY-MM-DD format
  status: 'active' | 'paused' | 'completed' | 'archived';
  createdAt: number;
  tasks: Task[];
}

export interface Milestone {
  id: string;
  name: string;
  percentage: number;
  achieved: boolean;
  achievedAt?: number;
  description: string;
}

export interface GoalProgress {
  goalId: string;
  progressPercentage: number;
  taskProgress: number;
  timeProgress: number;
  completedTasks: number;
  totalTasks: number;
  milestones: Milestone[];
  lastUpdated: number;
  isOverdue: boolean;
  isUrgent: boolean;
}

/**
 * Calculate task completion progress
 */
export function calculateTaskProgress(tasks: Task[]): { taskProgress: number; completedTasks: number; totalTasks: number } {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  return {
    taskProgress,
    completedTasks,
    totalTasks
  };
}

/**
 * Calculate time-based progress
 */
export function calculateTimeProgress(createdAt: number, deadline: string): number {
  try {
    const now = new Date();
    const created = new Date(createdAt);
    const deadlineDate = new Date(deadline + 'T23:59:59'); // End of deadline day
    
    const totalDays = (deadlineDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    
    if (totalDays <= 0) {
      return now > deadlineDate ? 100 : 0;
    }
    
    const timeProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    
    // If overdue, return 100%
    if (now > deadlineDate) {
      return 100;
    }
    
    return timeProgress;
  } catch (error) {
    logger.error('Error calculating time progress', { error, createdAt, deadline });
    return 0;
  }
}

/**
 * Generate milestone data based on progress percentage
 */
export function generateMilestones(progressPercentage: number, goalId: string): Milestone[] {
  const milestoneThresholds = [
    { percentage: 25, name: 'First Quarter' },
    { percentage: 50, name: 'Halfway Point' },
    { percentage: 75, name: 'Three Quarters' },
    { percentage: 100, name: 'Complete' }
  ];
  
  return milestoneThresholds.map(threshold => ({
    id: `milestone_${threshold.percentage}_${goalId}`,
    name: threshold.name,
    percentage: threshold.percentage,
    achieved: progressPercentage >= threshold.percentage,
    achievedAt: progressPercentage >= threshold.percentage ? Date.now() : undefined,
    description: `Next milestone: ${threshold.name}`
  }));
}

/**
 * Check if goal is overdue
 */
export function isGoalOverdue(deadline: string): boolean {
  try {
    const now = new Date();
    const deadlineDate = new Date(deadline + 'T23:59:59');
    return now > deadlineDate;
  } catch (error) {
    return false;
  }
}

/**
 * Check if goal is urgent (within 7 days of deadline)
 */
export function isGoalUrgent(deadline: string): boolean {
  try {
    const now = new Date();
    const deadlineDate = new Date(deadline + 'T23:59:59');
    const daysUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Calculate complete goal progress using hybrid algorithm
 * 70% task completion + 30% time-based progress
 */
export function calculateGoalProgress(goal: GoalWithTasks): GoalProgress {
  const { taskProgress, completedTasks, totalTasks } = calculateTaskProgress(goal.tasks);
  const timeProgress = calculateTimeProgress(goal.createdAt, goal.deadline);
  
  // Hybrid algorithm: 70% task + 30% time
  const progressPercentage = (taskProgress * 0.7) + (timeProgress * 0.3);
  
  const milestones = generateMilestones(progressPercentage, goal.id);
  const overdue = isGoalOverdue(goal.deadline);
  const urgent = isGoalUrgent(goal.deadline);
  
  return {
    goalId: goal.id,
    progressPercentage: Math.round(progressPercentage * 100) / 100, // Round to 2 decimal places
    taskProgress: Math.round(taskProgress * 100) / 100,
    timeProgress: Math.round(timeProgress * 100) / 100,
    completedTasks,
    totalTasks,
    milestones,
    lastUpdated: Date.now(),
    isOverdue: overdue,
    isUrgent: urgent
  };
}

/**
 * Calculate progress for multiple goals
 */
export function calculateMultipleGoalsProgress(goals: GoalWithTasks[]): GoalProgress[] {
  return goals.map(goal => calculateGoalProgress(goal));
}

/**
 * Calculate aggregate progress statistics for dashboard
 */
export function calculateAggregateProgress(goalsProgress: GoalProgress[]): {
  overallProgress: number;
  taskProgress: number;
  timeProgress: number;
  totalGoals: number;
  completedGoals: number;
  overdueGoals: number;
  urgentGoals: number;
} {
  if (goalsProgress.length === 0) {
    return {
      overallProgress: 0,
      taskProgress: 0,
      timeProgress: 0,
      totalGoals: 0,
      completedGoals: 0,
      overdueGoals: 0,
      urgentGoals: 0
    };
  }
  
  const totalGoals = goalsProgress.length;
  const completedGoals = goalsProgress.filter(g => g.progressPercentage >= 100).length;
  const overdueGoals = goalsProgress.filter(g => g.isOverdue).length;
  const urgentGoals = goalsProgress.filter(g => g.isUrgent).length;
  
  const avgOverallProgress = goalsProgress.reduce((sum, g) => sum + g.progressPercentage, 0) / totalGoals;
  const avgTaskProgress = goalsProgress.reduce((sum, g) => sum + g.taskProgress, 0) / totalGoals;
  const avgTimeProgress = goalsProgress.reduce((sum, g) => sum + g.timeProgress, 0) / totalGoals;
  
  return {
    overallProgress: Math.round(avgOverallProgress * 100) / 100,
    taskProgress: Math.round(avgTaskProgress * 100) / 100,
    timeProgress: Math.round(avgTimeProgress * 100) / 100,
    totalGoals,
    completedGoals,
    overdueGoals,
    urgentGoals
  };
}
