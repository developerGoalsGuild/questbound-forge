import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { getGoal, deleteGoal, loadGoals } from '@/lib/apiGoal';
import { loadTasks, createTask, updateTask, deleteTask } from '@/lib/apiTask';
import { GoalStatus, formatGoalStatus, getStatusColorClass, formatDeadline } from '@/models/goal';
import TasksModal from '@/components/modals/TasksModal';
import CreateTaskModal from '@/components/modals/CreateTaskModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Tag,
  CheckCircle,
  Play,
  Pause,
  Archive,
  Target,
  BarChart3,
  FileText,
  User,
  CalendarDays,
  TrendingUp,
  AlertCircle,
  Plus,
} from 'lucide-react';
import FieldTooltip from '@/components/ui/FieldTooltip';

interface GoalDetailsData {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  deadline: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  answers: Array<{ key: string; answer: string }>;
  category?: string;
  progress?: number;
}

interface Task {
  id: string;
  title: string;
  dueAt: number; // epoch seconds
  status: string;
  tags: string[];
}

const GoalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [goal, setGoal] = useState<GoalDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Task-related state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Get translations with safety checks
  const goalDetailsTranslations = (t as any)?.goalDetails;
  const commonTranslations = (t as any)?.common;
  // Get goals translations for specific hints (same as create goals page)
  const goalsTranslations = t as any;


  // Load goal details
  const loadGoalDetails = useCallback(async () => {
    if (!id) {
      setError('Goal ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Try the direct getGoal first
      try {
        const goalData = await getGoal(id);
        setGoal(goalData);
        return;
      } catch (getGoalError) {
        console.warn('[GoalDetails] getGoal failed, trying loadGoals workaround:', getGoalError);
        
        // Fallback: Load all goals and filter by ID
        const allGoals = await loadGoals();
        const foundGoal = allGoals.find(goal => goal.id === id);
        
        if (foundGoal) {
          // Transform the goal data to match the expected format
          const goalData: GoalDetailsData = {
            id: foundGoal.id,
            title: foundGoal.title,
            description: foundGoal.description || '',
            status: foundGoal.status as GoalStatus,
            deadline: foundGoal.deadline,
            tags: foundGoal.tags || [],
            createdAt: foundGoal.createdAt,
            updatedAt: foundGoal.updatedAt,
            answers: foundGoal.answers || [],
            category: foundGoal.category,
            progress: foundGoal.progress
          };
          setGoal(goalData);
        } else {
          throw new Error('Goal not found');
        }
      }
    } catch (e: any) {
      const errorMessage = e?.message || 'Failed to load goal details';
      setError(errorMessage);
      toast({
        title: goalDetailsTranslations?.messages?.error || 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast, goalDetailsTranslations]);

  useEffect(() => {
    loadGoalDetails();
  }, [loadGoalDetails]);

  // Handle delete goal
  const handleDeleteGoal = async () => {
    if (!goal) return;

    try {
      setDeleting(true);
      await deleteGoal(goal.id);
      toast({
        title: goalDetailsTranslations?.messages?.deleteSuccess || 'Success',
        description: 'Goal deleted successfully',
        variant: 'default'
      });
      navigate('/goals');
    } catch (e: any) {
      const errorMessage = e?.message || 'Failed to delete goal';
      toast({
        title: goalDetailsTranslations?.messages?.deleteError || 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Handle edit goal
  const handleEditGoal = () => {
    if (goal) {
      navigate(`/goals/edit/${goal.id}`);
    }
  };

  // Load tasks for the goal
  const loadGoalTasks = useCallback(async () => {
    if (!goal?.id) return;

    try {
      setTasksLoading(true);
      const goalTasks = await loadTasks(goal.id);
      setTasks(goalTasks || []);
    } catch (e: any) {
      console.error('[loadGoalTasks] Error loading tasks:', e);
      
      // Parse API error response
      let errorMessage = e?.message || 'Failed to load tasks';
      
      try {
        // Try to parse error response if it's a string
        if (typeof e?.message === 'string') {
          const parsedError = JSON.parse(e.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        console.log('Could not parse error response:', parseError);
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setTasksLoading(false);
    }
  }, [goal?.id, toast]);

  // Handle view tasks
  const handleViewTasks = () => {
    if (goal) {
      setShowTasksModal(true);
      loadGoalTasks();
    }
  };

  // Handle create new task
  const handleCreateTask = () => {
    setShowCreateTaskModal(true);
  };

  // Handle task creation
  const handleTaskCreate = async (title: string, dueAt: string, tags: string[], status: string) => {
    if (!goal?.id) return;

    try {
      const dueAtTimestamp = new Date(dueAt + 'T00:00:00Z').getTime() / 1000;
      await createTask({
        goalId: goal.id,
        title,
        dueAt: dueAtTimestamp,
        tags,
        status
      });

      toast({
        title: 'Success',
        description: 'Task created successfully',
        variant: 'default'
      });

      setShowCreateTaskModal(false);
      loadGoalTasks(); // Refresh tasks list
    } catch (e: any) {
      console.error('Error creating task:', e);
      
      // Parse API error response
      let errorMessage = e?.message || 'Failed to create task';
      
      try {
        // Try to parse error response if it's a string
        if (typeof e?.message === 'string') {
          const parsedError = JSON.parse(e.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        console.log('Could not parse error response:', parseError);
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  // Handle task update
  const handleTaskUpdate = async (task: Task) => {
    try {
      await updateTask(task.id, {
        goalId: goal?.id || '',
        title: task.title,
        dueAt: task.dueAt,
        tags: task.tags,
        status: task.status
      });

      toast({
        title: 'Success',
        description: 'Task updated successfully',
        variant: 'default'
      });

      loadGoalTasks(); // Refresh tasks list
    } catch (e: any) {
      console.error('Error updating task:', e);
      
      // Parse API error response
      let errorMessage = e?.message || 'Failed to update task';
      
      try {
        // Try to parse error response if it's a string
        if (typeof e?.message === 'string') {
          const parsedError = JSON.parse(e.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        console.log('Could not parse error response:', parseError);
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  // Handle task deletion
  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);

      toast({
        title: 'Success',
        description: 'Task deleted successfully',
        variant: 'default'
      });

      loadGoalTasks(); // Refresh tasks list
    } catch (e: any) {
      console.error('Error deleting task:', e);
      
      // Parse API error response
      let errorMessage = e?.message || 'Failed to delete task';
      
      try {
        // Try to parse error response if it's a string
        if (typeof e?.message === 'string') {
          const parsedError = JSON.parse(e.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        console.log('Could not parse error response:', parseError);
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  // Calculate days remaining/overdue
  const getDeadlineInfo = () => {
    if (!goal?.deadline) return null;
    
    const deadline = new Date(goal.deadline + 'T00:00:00Z');
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      deadline,
      daysRemaining: diffDays,
      isOverdue: diffDays < 0,
      isDueSoon: diffDays >= 0 && diffDays <= 7
    };
  };

  // Get status icon
  const getStatusIcon = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.ACTIVE:
        return <Play className="w-4 h-4" />;
      case GoalStatus.PAUSED:
        return <Pause className="w-4 h-4" />;
      case GoalStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4" />;
      case GoalStatus.ARCHIVED:
        return <Archive className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {goalDetailsTranslations?.messages?.loading || 'Loading goal details...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-4">
            {goalDetailsTranslations?.messages?.notFound || 'Goal Not Found'}
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/goals')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {goalDetailsTranslations?.actions?.back || 'Back to Goals'}
            </Button>
            <Button onClick={loadGoalDetails}>
              {commonTranslations?.retry || 'Try Again'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const deadlineInfo = getDeadlineInfo();

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/goals')}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {goalDetailsTranslations?.actions?.back || 'Back'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{goal.title}</h1>
            <p className="text-muted-foreground">
              {goalDetailsTranslations?.subtitle || 'Goal Details'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleViewTasks}>
            <Calendar className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{goalDetailsTranslations?.actions?.viewTasks || 'View Tasks'}</span>
            <span className="sm:hidden">Tasks</span>
          </Button>
          <Button variant="outline" onClick={handleCreateTask}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{goalDetailsTranslations?.actions?.createTask || 'Create Task'}</span>
            <span className="sm:hidden">Create</span>
          </Button>
          <Button onClick={handleEditGoal}>
            <Edit className="w-4 h-4 mr-2" />
            {goalDetailsTranslations?.actions?.edit || 'Edit'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{goalDetailsTranslations?.actions?.delete || 'Delete'}</span>
                <span className="sm:hidden">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                <AlertDialogDescription>
                  {goalDetailsTranslations?.messages?.deleteConfirm || 
                   'Are you sure you want to delete this goal? This action cannot be undone.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteGoal}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                {goalDetailsTranslations?.sections?.basicInfo || 'Basic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {goalDetailsTranslations?.fields?.status || 'Status'}
                    </label>
                    <FieldTooltip 
                      targetId="goal-status" 
                      fieldLabel={goalDetailsTranslations?.fields?.status || 'Status'} 
                      hint={goalDetailsTranslations?.hints?.fields?.status || 'Current progress state of the goal (active, paused, completed, or archived).'}
                      iconLabelTemplate={goalDetailsTranslations?.hints?.iconLabel || 'More information about {field}'}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(goal.status)}
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColorClass(goal.status)} text-xs`}
                    >
                      {formatGoalStatus(goal.status)}
                    </Badge>
                  </div>
                </div>
                
                {goal.category && (
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {goalDetailsTranslations?.fields?.category || 'Category'}
                      </label>
                      <FieldTooltip 
                        targetId="goal-category" 
                        fieldLabel={goalDetailsTranslations?.fields?.category || 'Category'} 
                        hint={goalDetailsTranslations?.hints?.fields?.category || 'Optional categorization to group related goals.'}
                        iconLabelTemplate={goalDetailsTranslations?.hints?.iconLabel || 'More information about {field}'}
                      />
                    </div>
                    <p className="mt-1 text-sm">{goal.category}</p>
                  </div>
                )}
              </div>

              {goal.tags && goal.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {goalDetailsTranslations?.fields?.tags || 'Tags'}
                    </label>
                    <FieldTooltip 
                      targetId="goal-tags" 
                      fieldLabel={goalDetailsTranslations?.fields?.tags || 'Tags'} 
                      hint={goalDetailsTranslations?.hints?.fields?.tags || 'Labels to help organize and find related goals.'}
                      iconLabelTemplate={goalDetailsTranslations?.hints?.iconLabel || 'More information about {field}'}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {goal.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {goalDetailsTranslations?.sections?.description || 'Description'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {goal.description || 'No description provided'}
              </p>
            </CardContent>
          </Card>

          {/* NLP Answers */}
          {goal.answers && goal.answers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {goalDetailsTranslations?.sections?.nlpAnswers || 'NLP Answers'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {goal.answers.map((answer, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {answer.key}
                      </label>
                      <FieldTooltip 
                        targetId={`nlp-${answer.key}-${index}`} 
                        fieldLabel={answer.key} 
                        hint={goalsTranslations?.hints?.questions?.[answer.key] || 'Your responses to the NLP (Neuro-Linguistic Programming) questions.'}
                        iconLabelTemplate={goalsTranslations?.hints?.iconLabel || 'More information about {field}'}
                      />
                    </div>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {answer.answer}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {goalDetailsTranslations?.sections?.timeline || 'Timeline'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {goalDetailsTranslations?.timeline?.created || 'Created'}
                      </p>
                      <FieldTooltip 
                        targetId="goal-created" 
                        fieldLabel={goalDetailsTranslations?.timeline?.created || 'Created'} 
                        hint={goalDetailsTranslations?.hints?.fields?.createdAt || 'When this goal was originally created.'}
                        iconLabelTemplate={goalDetailsTranslations?.hints?.iconLabel || 'More information about {field}'}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(goal.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {goalDetailsTranslations?.timeline?.lastUpdated || 'Last Updated'}
                      </p>
                      <FieldTooltip 
                        targetId="goal-updated" 
                        fieldLabel={goalDetailsTranslations?.timeline?.lastUpdated || 'Last Updated'} 
                        hint={goalDetailsTranslations?.hints?.fields?.updatedAt || 'When this goal was last modified.'}
                        iconLabelTemplate={goalDetailsTranslations?.hints?.iconLabel || 'More information about {field}'}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(goal.updatedAt)}
                    </p>
                  </div>
                </div>

                {deadlineInfo ? (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {goalDetailsTranslations?.timeline?.deadline || 'Deadline'}
                        </p>
                        <FieldTooltip 
                          targetId="goal-deadline" 
                          fieldLabel={goalDetailsTranslations?.timeline?.deadline || 'Deadline'} 
                          hint={goalsTranslations?.hints?.fields?.deadline || 'Pick the target date you want to finish; you can adjust it if plans change.'}
                          iconLabelTemplate={goalsTranslations?.hints?.iconLabel || 'More information about {field}'}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDeadline(goal.deadline!)}
                        {deadlineInfo.isOverdue ? (
                          <span className="text-destructive ml-2">
                            ({Math.abs(deadlineInfo.daysRemaining)} {goalDetailsTranslations?.timeline?.daysOverdue || 'days overdue'})
                          </span>
                        ) : deadlineInfo.isDueSoon ? (
                          <span className="text-orange-500 ml-2">
                            ({deadlineInfo.daysRemaining} {goalDetailsTranslations?.timeline?.daysRemaining || 'days remaining'})
                          </span>
                        ) : (
                          <span className="text-muted-foreground ml-2">
                            ({deadlineInfo.daysRemaining} {goalDetailsTranslations?.timeline?.daysRemaining || 'days remaining'})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {goalDetailsTranslations?.timeline?.deadline || 'Deadline'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {goalDetailsTranslations?.timeline?.noDeadline || 'No deadline set'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {goalDetailsTranslations?.sections?.progress || 'Progress'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goal.progress !== undefined ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {goalDetailsTranslations?.fields?.progress || 'Progress'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {goal.progress === 100
                      ? goalDetailsTranslations?.progress?.completed || 'Completed'
                      : goal.progress > 0
                      ? goalDetailsTranslations?.progress?.inProgress || 'In Progress'
                      : goalDetailsTranslations?.progress?.notStarted || 'Not Started'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {goalDetailsTranslations?.progress?.noProgress || 'No progress data available'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tasks Modal */}
      <TasksModal
        isOpen={showTasksModal}
        onClose={() => setShowTasksModal(false)}
        tasks={tasks}
        onUpdateTask={handleTaskUpdate}
        onDeleteTask={handleTaskDelete}
        onTasksChange={loadGoalTasks}
        onCreateTask={handleCreateTask}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onCreate={handleTaskCreate}
        goalDeadline={goal?.deadline || null}
      />
    </div>
  );
};

export default GoalDetails;
