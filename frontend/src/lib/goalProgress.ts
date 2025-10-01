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
        const progressA = calculateTimeProgress(a);
        const progressB = calculateTimeProgress(b);
        return progressA.percentage - progressB.percentage;
      });
    
    case 'progress-desc':
      return sortedGoals.sort((a, b) => {
        const progressA = calculateTimeProgress(a);
        const progressB = calculateTimeProgress(b);
        return progressB.percentage - progressA.percentage;
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
