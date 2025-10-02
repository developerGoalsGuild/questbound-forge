/**
 * Goal Progress Calculation Utilities
 * Handles progress calculation based on elapsed time and other metrics
 */

export interface GoalProgressData {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  // Backend progress data (when available)
  progress?: number;
  taskProgress?: number;
  timeProgress?: number;
  completedTasks?: number;
  totalTasks?: number;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  percentage: number;
  achieved: boolean;
  achievedAt?: number;
  description?: string;
}

export interface ProgressResult {
  percentage: number;
  isOverdue: boolean;
  isUrgent: boolean;
  isOnTrack: boolean;
  daysRemaining: number;
  daysElapsed: number;
  totalDays: number;
}

/**
 * Calculate task-based progress percentage
 * Formula: (completed_tasks / total_tasks) * 100
 */
export function calculateTaskProgress(goal: GoalProgressData): number {
  if (!goal.totalTasks || goal.totalTasks === 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (goal.completedTasks || 0) / goal.totalTasks * 100));
}

/**
 * Calculate hybrid progress percentage (70% task, 30% time)
 * Formula: (task_progress * 0.7) + (time_progress * 0.3)
 */
export function calculateHybridProgress(goal: GoalProgressData): number {
  const taskProgress = goal.taskProgress !== undefined ? goal.taskProgress : calculateTaskProgress(goal);
  const timeProgress = goal.timeProgress !== undefined ? goal.timeProgress : calculateTimeProgress(goal).percentage;
  
  return Math.min(100, Math.max(0, (taskProgress * 0.7) + (timeProgress * 0.3)));
}

/**
 * Calculate progress percentage based on elapsed time
 * Formula: (current_date - creation_date) / (deadline - creation_date) * 100
 */
export function calculateTimeProgress(goal: GoalProgressData): ProgressResult {
  const now = new Date();
  const created = new Date(goal.createdAt);
  const deadline = goal.deadline ? new Date(goal.deadline) : null;

  // If no deadline, return 0 progress
  if (!deadline) {
    return {
      percentage: 0,
      isOverdue: false,
      isUrgent: false,
      isOnTrack: true,
      daysRemaining: 0,
      daysElapsed: Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)),
      totalDays: 0,
    };
  }

  const totalDays = Math.floor((deadline.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = totalDays - daysElapsed;

  // Calculate percentage
  let percentage = 0;
  if (totalDays > 0) {
    percentage = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  }

  // Determine status
  const isOverdue = now > deadline;
  const isUrgent = daysRemaining <= 7 && daysRemaining > 0;
  const isOnTrack = !isOverdue && !isUrgent;

  return {
    percentage: isOverdue ? 100 : percentage,
    isOverdue,
    isUrgent,
    isOnTrack,
    daysRemaining: Math.max(0, daysRemaining),
    daysElapsed: Math.max(0, daysElapsed),
    totalDays: Math.max(0, totalDays),
  };
}

/**
 * Get progress bar color based on progress status
 */
export function getProgressBarColor(progress: ProgressResult): string {
  if (progress.isOverdue) return 'bg-red-500';
  if (progress.isUrgent) return 'bg-yellow-500';
  if (progress.isOnTrack) return 'bg-green-500';
  return 'bg-gray-500';
}

/**
 * Get progress bar background color
 */
export function getProgressBarBgColor(progress: ProgressResult): string {
  if (progress.isOverdue) return 'bg-red-100';
  if (progress.isUrgent) return 'bg-yellow-100';
  if (progress.isOnTrack) return 'bg-green-100';
  return 'bg-gray-100';
}

/**
 * Get category badge color based on tag
 */
export function getCategoryBadgeColor(tag: string): string {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-indigo-100 text-indigo-800',
    'bg-pink-100 text-pink-800',
    'bg-gray-100 text-gray-800',
  ];
  
  // Simple hash function to get consistent color for same tag
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash + tag.charCodeAt(i)) & 0xffffffff;
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Format progress percentage for display
 */
export function formatProgressPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

/**
 * Get progress status text
 */
export function getProgressStatusText(progress: ProgressResult): string {
  if (progress.isOverdue) return 'Overdue';
  if (progress.isUrgent) return 'Urgent';
  if (progress.isOnTrack) return 'On Track';
  return 'No Deadline';
}

/**
 * Format milestone text for display
 */
export function formatMilestoneText(milestone: Milestone): string {
  return milestone.achieved 
    ? `✓ ${milestone.name} (${milestone.percentage}%)`
    : `${milestone.name} (${milestone.percentage}%)`;
}

/**
 * Get milestone markers for progress bar
 */
export function getMilestoneMarkers(milestones: Milestone[] = []): Array<{percentage: number; achieved: boolean; name: string}> {
  return milestones.map(m => ({
    percentage: m.percentage,
    achieved: m.achieved,
    name: m.name
  }));
}

/**
 * Get progress bar color for task progress
 */
export function getTaskProgressBarColor(percentage: number): string {
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-gray-500';
}

/**
 * Get progress bar background color for task progress
 */
export function getTaskProgressBarBgColor(percentage: number): string {
  if (percentage >= 100) return 'bg-green-100';
  if (percentage >= 75) return 'bg-blue-100';
  if (percentage >= 50) return 'bg-yellow-100';
  if (percentage >= 25) return 'bg-orange-100';
  return 'bg-gray-100';
}

/**
 * Sort goals by various criteria
 */
export function sortGoals(goals: GoalProgressData[], sortBy: string): GoalProgressData[] {
  const sortedGoals = [...goals];
  
  switch (sortBy) {
    case 'deadline-asc':
      return sortedGoals.sort((a, b) => {
        const deadlineA = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
        const deadlineB = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
        return deadlineA.getTime() - deadlineB.getTime();
      });
    
    case 'deadline-desc':
      return sortedGoals.sort((a, b) => {
        const deadlineA = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
        const deadlineB = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
        return deadlineB.getTime() - deadlineA.getTime();
      });
    
    case 'progress-asc':
      return sortedGoals.sort((a, b) => {
        const progressA = a.progress !== undefined ? a.progress : calculateHybridProgress(a);
        const progressB = b.progress !== undefined ? b.progress : calculateHybridProgress(b);
        return progressA - progressB;
      });
    
    case 'progress-desc':
      return sortedGoals.sort((a, b) => {
        const progressA = a.progress !== undefined ? a.progress : calculateHybridProgress(a);
        const progressB = b.progress !== undefined ? b.progress : calculateHybridProgress(b);
        return progressB - progressA;
      });
    
    case 'task-progress-asc':
      return sortedGoals.sort((a, b) => {
        const taskProgressA = calculateTaskProgress(a);
        const taskProgressB = calculateTaskProgress(b);
        return taskProgressA - taskProgressB;
      });
    
    case 'task-progress-desc':
      return sortedGoals.sort((a, b) => {
        const taskProgressA = calculateTaskProgress(a);
        const taskProgressB = calculateTaskProgress(b);
        return taskProgressB - taskProgressA;
      });
    
    case 'title-asc':
      return sortedGoals.sort((a, b) => a.title.localeCompare(b.title));
    
    case 'title-desc':
      return sortedGoals.sort((a, b) => b.title.localeCompare(a.title));
    
    case 'created-asc':
      return sortedGoals.sort((a, b) => a.createdAt - b.createdAt);
    
    case 'created-desc':
      return sortedGoals.sort((a, b) => b.createdAt - a.createdAt);
    
    default:
      return sortedGoals;
  }
}
