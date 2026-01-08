import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { getActiveGoalsCountForUser, loadDashboardGoalsWithProgress } from '@/lib/apiGoal';
import { getUserIdFromToken } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Plus, TrendingUp, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import FieldTooltip from '@/components/ui/FieldTooltip';
import { 
  calculateTimeProgress, 
  calculateHybridProgress,
  getProgressBarColor, 
  getProgressBarBgColor, 
  getCategoryBadgeColor, 
  formatProgressPercentage, 
  getProgressStatusText,
  sortGoals,
  type GoalProgressData 
} from '@/lib/goalProgress';
import DualProgressBar from '@/components/ui/DualProgressBar';
import { logger } from '@/lib/logger';

const GoalsButton: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [goals, setGoals] = useState<GoalProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<string>('deadline-asc');

  const goalDashboardTranslations = (t as any)?.goalDashboard;

  // Load active goals count
  useEffect(() => {
    const loadActiveCount = async () => {
      try {
        setLoading(true);
        setError(null);
        const userId = getUserIdFromToken();
        if (!userId) {
          setActiveCount(0);
          return;
        }
        const count = await getActiveGoalsCountForUser(userId);
        setActiveCount(count);
      } catch (err) {
        logger.error('Failed to load active goals count for dashboard button', { error: err });
        setError('Failed to load goals count');
        setActiveCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadActiveCount();
  }, []);

  // Load dashboard goals when expanded
  useEffect(() => {
    if (isExpanded) {
      const loadGoals = async () => {
        try {
          setGoalsLoading(true);
          const dashboardGoals = await loadDashboardGoalsWithProgress(sortBy);
          setGoals(dashboardGoals);
        } catch (err) {
          logger.error('Failed to load dashboard goals', { error: err });
          setGoals([]); // Clear goals on error
        } finally {
          setGoalsLoading(false);
        }
      };

      loadGoals();
    }
  }, [isExpanded, sortBy]);

  // Sort goals when sortBy changes
  const sortedGoals = useMemo(() => {
    if (!goals || goals.length === 0) return [];
    return sortGoals(goals, sortBy).slice(0, 3);
  }, [goals, sortBy]);

  const handleViewGoals = () => {
    navigate('/goals');
  };

  const handleCreateGoal = () => {
    navigate('/goals/create');
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    // Goals will be reloaded automatically by the useEffect
  };

  if (loading) {
    return (
      <Card className="guild-card">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-8 bg-muted rounded mx-auto" />
            <div className="h-6 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-8 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="guild-card">
      <CardHeader>
        <CardTitle className="font-cinzel text-xl flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {goalDashboardTranslations?.button?.title || 'Goals'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Goals Count */}
        <div className="text-center">
          <div className="font-cinzel text-3xl font-bold text-gradient-royal mb-1">
            {error ? '?' : activeCount ?? 0}
          </div>
          <div className="text-sm text-muted-foreground">
            {goalDashboardTranslations?.stats?.activeGoals || 'Active Goals'}
          </div>
          {error && (
            <div className="text-xs text-destructive mt-1">
              {goalDashboardTranslations?.messages?.loading || 'Unable to load count'}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={handleViewGoals} 
            className="w-full btn-heraldic text-primary-foreground"
            disabled={loading}
          >
            <Target className="w-4 h-4 mr-2" />
            {goalDashboardTranslations?.button?.viewAll || 'View All Goals'}
          </Button>
          
          <div className="relative">
            <Button 
              onClick={handleCreateGoal} 
              variant="outline" 
              className="w-full"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {goalDashboardTranslations?.button?.createGoal || 'Create Goal'}
            </Button>
            <FieldTooltip 
              targetId="create-goal-button"
              fieldLabel={goalDashboardTranslations?.button?.createGoal || 'Create Goal'}
              hint={goalDashboardTranslations?.tooltips?.createGoal || 'Create a new goal'}
              iconLabelTemplate={goalDashboardTranslations?.hints?.iconLabel || 'More information about {field}'}
            />
          </div>
        </div>

        {/* Quick Stats */}
        {activeCount !== null && activeCount > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>
                {activeCount === 1 
                  ? '1 active goal' 
                  : `${activeCount} active goals`
                }
              </span>
            </div>
          </div>
        )}

        {/* Top Goals Section */}
        {activeCount !== null && activeCount > 0 && (
          <div className="pt-4 border-t border-border">
            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpanded}
              className="w-full justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                {goalDashboardTranslations?.goalsList?.title || 'Top Goals'}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>

            {/* Goals List */}
            {isExpanded && (
              <div className="mt-4 space-y-4">
                {/* Sort Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {goalDashboardTranslations?.goalsList?.sortBy || 'Sort by'}
                  </label>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deadline-asc">
                        {goalDashboardTranslations?.goalsList?.sortOptions?.deadlineAsc || 'Deadline (earliest first)'}
                      </SelectItem>
                      <SelectItem value="deadline-desc">
                        {goalDashboardTranslations?.goalsList?.sortOptions?.deadlineDesc || 'Deadline (latest first)'}
                      </SelectItem>
                      <SelectItem value="progress-asc">
                        {goalDashboardTranslations?.goalsList?.sortOptions?.progressAsc || 'Progress (lowest first)'}
                      </SelectItem>
                      <SelectItem value="progress-desc">
                        {goalDashboardTranslations?.goalsList?.sortOptions?.progressDesc || 'Progress (highest first)'}
                      </SelectItem>
                      <SelectItem value="task-progress-asc">
                        {goalDashboardTranslations?.goalsList?.sortOptions?.taskProgressAsc || 'Task Progress (lowest first)'}
                      </SelectItem>
                      <SelectItem value="task-progress-desc">
                        {goalDashboardTranslations?.goalsList?.sortOptions?.taskProgressDesc || 'Task Progress (highest first)'}
                      </SelectItem>
                      <SelectItem value="title-asc">
                        {goalDashboardTranslations?.goalsList?.sortOptions?.titleAsc || 'Title (A-Z)'}
                      </SelectItem>
                      <SelectItem value="title-desc">
                        {goalDashboardTranslations?.goalsList?.sortOptions?.titleDesc || 'Title (Z-A)'}
                      </SelectItem>
                      <SelectItem value="created-asc">
                        {goalDashboardTranslations?.goalsList?.sortOptions?.createdAsc || 'Created (oldest first)'}
                      </SelectItem>
                      <SelectItem value="created-desc">
                        {goalDashboardTranslations?.goalsList?.sortOptions?.createdDesc || 'Created (newest first)'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Goals List */}
                {goalsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-2 bg-muted rounded w-full mb-1" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : sortedGoals.length > 0 ? (
                  <div className="space-y-3">
                    {sortedGoals.map((goal) => {
                      const progress = calculateTimeProgress(goal);
                      const categoryColor = getCategoryBadgeColor(goal.tags[0] || 'general');
                      
                      return (
                        <div key={goal.id} className="p-3 border border-border rounded-lg bg-card">
                          {/* Goal Title and Category */}
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-sm leading-tight pr-2">
                              {goal.title}
                            </h4>
                            {goal.tags.length > 0 && (
                              <span className={`px-2 py-1 text-xs rounded-full ${categoryColor} flex-shrink-0`}>
                                {goal.tags[0]}
                              </span>
                            )}
                          </div>

                          {/* Dual Progress Bar */}
                          <DualProgressBar 
                            goal={goal} 
                            showMilestones={true}
                            showLabels={true}
                            className="mb-3"
                          />

                          {/* Deadline Information */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {goal.deadline ? (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(goal.deadline).toLocaleDateString()}
                                </span>
                              ) : (
                                goalDashboardTranslations?.goalsList?.noDeadline || 'No deadline'
                              )}
                            </span>
                            <span>
                              {progress.daysRemaining > 0 
                                ? `${progress.daysRemaining} days left`
                                : progress.isOverdue 
                                  ? `${Math.abs(progress.daysRemaining)} days overdue`
                                  : 'No deadline'
                              }
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {goalDashboardTranslations?.messages?.noGoals || 'No goals found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalsButton;