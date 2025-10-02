import React from 'react';
import { Progress } from '@/components/ui/progress';
import { 
  calculateTaskProgress, 
  calculateTimeProgress, 
  calculateHybridProgress,
  getTaskProgressBarColor,
  getTaskProgressBarBgColor,
  getProgressBarColor,
  getProgressBarBgColor,
  getMilestoneMarkers,
  formatMilestoneText,
  type GoalProgressData,
  type Milestone
} from '@/lib/goalProgress';

interface DualProgressBarProps {
  goal: GoalProgressData;
  showMilestones?: boolean;
  showLabels?: boolean;
  className?: string;
}

const DualProgressBar: React.FC<DualProgressBarProps> = ({
  goal,
  showMilestones = true,
  showLabels = true,
  className = ''
}) => {
  // Calculate progress values
  const taskProgress = goal.taskProgress !== undefined ? goal.taskProgress : calculateTaskProgress(goal);
  const timeProgress = goal.timeProgress !== undefined ? goal.timeProgress : calculateTimeProgress(goal).percentage;
  const overallProgress = goal.progress !== undefined ? goal.progress : calculateHybridProgress(goal);
  
  // Get milestone markers
  const milestoneMarkers = showMilestones ? getMilestoneMarkers(goal.milestones) : [];
  
  // Get progress bar colors
  const taskColor = getTaskProgressBarColor(taskProgress);
  const taskBgColor = getTaskProgressBarBgColor(taskProgress);
  const timeColor = getProgressBarColor(calculateTimeProgress(goal));
  const timeBgColor = getProgressBarBgColor(calculateTimeProgress(goal));
  const overallColor = getProgressBarColor(calculateTimeProgress(goal));
  const overallBgColor = getProgressBarBgColor(calculateTimeProgress(goal));

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Overall Progress */}
      <div className="space-y-2">
        {showLabels && (
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
          </div>
        )}
        <div className="relative">
          <div className={`w-full h-3 rounded-full ${overallBgColor}`}>
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${overallColor}`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          {/* Milestone markers */}
          {showMilestones && milestoneMarkers.length > 0 && (
            <div className="absolute top-0 left-0 w-full h-3 pointer-events-none">
              {milestoneMarkers.map((marker, index) => (
                <div
                  key={index}
                  className="absolute top-0 w-0.5 h-3 flex items-center justify-center"
                  style={{ left: `${marker.percentage}%` }}
                >
                  <div className={`w-2 h-2 rounded-full border-2 ${
                    marker.achieved 
                      ? 'bg-green-500 border-green-600' 
                      : 'bg-gray-300 border-gray-400'
                  }`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Progress */}
      <div className="space-y-2">
        {showLabels && (
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Task Progress</span>
            <span className="text-muted-foreground">
              {goal.completedTasks || 0} / {goal.totalTasks || 0} tasks
            </span>
          </div>
        )}
        <div className={`w-full h-2 rounded-full ${taskBgColor}`}>
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${taskColor}`}
            style={{ width: `${taskProgress}%` }}
          />
        </div>
      </div>

      {/* Time Progress */}
      <div className="space-y-2">
        {showLabels && (
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Time Progress</span>
            <span className="text-muted-foreground">{Math.round(timeProgress)}%</span>
          </div>
        )}
        <div className={`w-full h-2 rounded-full ${timeBgColor}`}>
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${timeColor}`}
            style={{ width: `${timeProgress}%` }}
          />
        </div>
      </div>

      {/* Milestone Information */}
      {showMilestones && goal.milestones && goal.milestones.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Milestones</div>
          <div className="space-y-1">
            {goal.milestones.map((milestone, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className={milestone.achieved ? 'text-green-600' : 'text-muted-foreground'}>
                  {formatMilestoneText(milestone)}
                </span>
                <span className="text-muted-foreground">
                  {milestone.achieved ? 'Achieved' : 'Upcoming'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DualProgressBar;
