// Version: 2.0 - Modern tabbed interface with inline task editing
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { getGoal, deleteGoal } from '@/lib/apiGoal';
import { loadTasks, createTask, updateTask, deleteTask } from '@/lib/apiTask';
import { GoalStatus, formatGoalStatus, getStatusColorClass, formatDeadline } from '@/models/goal';
import DualProgressBar from '@/components/ui/DualProgressBar';
import { 
  calculateTaskProgress, 
  calculateTimeProgress, 
  calculateHybridProgress,
  type GoalProgressData 
} from '@/lib/goalProgress';
import TasksListInline from '@/components/goals/TasksListInline';
import { GoalQuestsSection } from '@/components/goals/GoalQuestsSection';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { getUserIdFromToken } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ListTodo,
} from 'lucide-react';
import FieldTooltip from '@/components/ui/FieldTooltip';
import { logger } from '@/lib/logger';
import { CollaboratorList } from '@/components/collaborations/CollaboratorList';
import { CommentSection } from '@/components/collaborations/CommentSection';
import { InviteCollaboratorModal } from '@/components/collaborations/InviteCollaboratorModal';
import { TaskResponse } from '@/lib/apiTask';

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
  taskProgress?: number;
  timeProgress?: number;
  completedTasks?: number;
  totalTasks?: number;
  milestones?: Array<{
    id: string;
    name: string;
    percentage: number;
    achieved: boolean;
    achievedAt?: number;
    description?: string;
  }>;
  accessType?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canAddTasks?: boolean;
  canComment?: boolean;
}

const GoalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [goal, setGoal] = useState<GoalDetailsData | null>(null);
  const [goalWithProgress, setGoalWithProgress] = useState<GoalProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Task-related state
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Get translations
  const goalDetailsTranslations = (t as any)?.goalDetails;
  const commonTranslations = (t as any)?.common;
  const goalsTranslations = (t as any)?.goals;
  const goalCreationTranslations = (t as any)?.goalCreation;
  const nlpTranslations = goalCreationTranslations?.nlp ?? {};
  const nlpQuestions = nlpTranslations.questions ?? {};
  const nlpHints = nlpTranslations.hints ?? {};

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
      
      const goalData = await getGoal(id);
      
      const goalDetailsData: GoalDetailsData = {
        id: goalData.id,
        title: goalData.title,
        description: goalData.description,
        status: goalData.status as GoalStatus,
        deadline: goalData.deadline,
        tags: goalData.tags,
        createdAt: goalData.createdAt,
        updatedAt: goalData.updatedAt,
        answers: goalData.answers,
        category: goalData.category,
        progress: goalData.progress,
        taskProgress: goalData.taskProgress,
        timeProgress: goalData.timeProgress,
        completedTasks: goalData.completedTasks,
        totalTasks: goalData.totalTasks,
        milestones: goalData.milestones,
        accessType: goalData.accessType,
        canEdit: goalData.canEdit,
        canDelete: goalData.canDelete,
        canAddTasks: goalData.canAddTasks,
        canComment: goalData.canComment
      };
      
      setGoal(goalDetailsData);
      
      const progressGoalData: GoalProgressData = {
        id: goalData.id,
        title: goalData.title,
        deadline: goalData.deadline || undefined,
        status: goalData.status,
        createdAt: goalData.createdAt,
        updatedAt: goalData.updatedAt,
        tags: goalData.tags || [],
        progress: goalData.progress || 0,
        taskProgress: goalData.taskProgress || 0,
        timeProgress: goalData.timeProgress || 0,
        completedTasks: goalData.completedTasks || 0,
        totalTasks: goalData.totalTasks || 0,
        milestones: goalData.milestones || []
      };
      
      setGoalWithProgress(progressGoalData);
      
    } catch (error: any) {
      logger.error('Error loading goal details', { goalId: id, error: error?.message || error });
      setError(error?.message || 'Failed to load goal details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGoalDetails();
  }, [loadGoalDetails]);

  // Load tasks
  const loadGoalTasks = useCallback(async () => {
    if (!goal?.id) return;

    try {
      setTasksLoading(true);
      const goalTasks = await loadTasks(goal.id);
      setTasks(Array.isArray(goalTasks) ? goalTasks : []);
    } catch (e: any) {
      logger.error('Error loading tasks', { goalId: goal.id, error: e });
      toast({
        title: 'Error',
        description: e?.message || 'Failed to load tasks',
        variant: 'destructive'
      });
    } finally {
      setTasksLoading(false);
    }
  }, [goal?.id, toast]);

  // Load tasks when goal is loaded and tasks tab is active
  useEffect(() => {
    if (goal?.id && activeTab === 'tasks') {
      loadGoalTasks();
    }
  }, [goal?.id, activeTab, loadGoalTasks]);

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
      toast({
        title: goalDetailsTranslations?.messages?.deleteError || 'Error',
        description: e?.message || 'Failed to delete goal',
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

  // Task handlers
  const handleTaskCreate = async (taskData: {
    title: string;
    dueAt: string;
    tags: string[];
    status: string;
  }) => {
    if (!goal?.id) return;

    try {
      const dueAtEpoch = new Date(taskData.dueAt + 'T00:00:00Z').getTime() / 1000;
      await createTask({
        goalId: goal.id,
        title: taskData.title,
        dueAt: dueAtEpoch,
        tags: taskData.tags,
        status: taskData.status
      });

      toast({
        title: 'Success',
        description: 'Task created successfully',
        variant: 'default'
      });

      await loadGoalTasks();
    } catch (e: any) {
      logger.error('Error creating task', { goalId: goal.id, error: e });
      toast({
        title: 'Error',
        description: e?.message || 'Failed to create task',
        variant: 'destructive'
      });
      throw e;
    }
  };

  const handleTaskUpdate = async (task: TaskResponse) => {
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

      await loadGoalTasks();
    } catch (e: any) {
      logger.error('Error updating task', { taskId: task.id, error: e });
      toast({
        title: 'Error',
        description: e?.message || 'Failed to update task',
        variant: 'destructive'
      });
      throw e;
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
        variant: 'default'
      });
      await loadGoalTasks();
    } catch (e: any) {
      logger.error('Error deleting task', { taskId, error: e });
      toast({
        title: 'Error',
        description: e?.message || 'Failed to delete task',
        variant: 'destructive'
      });
      throw e;
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
      <div className="container mx-auto py-8 px-4">
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
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-4">
            {goalDetailsTranslations?.messages?.notFound || 'Goal Not Found'}
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-4 justify-center flex-wrap">
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
    <div className="container mx-auto py-4 sm:py-8 px-4 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/goals')}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{goalDetailsTranslations?.actions?.back || 'Back'}</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold truncate">{goal.title}</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              {goalDetailsTranslations?.subtitle || 'Goal Details'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {goal?.canEdit && (
            <Button onClick={handleEditGoal} size="sm">
              <Edit className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{goalDetailsTranslations?.actions?.edit || 'Edit'}</span>
            </Button>
          )}
          
          {goal?.canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  <Trash2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{goalDetailsTranslations?.actions?.delete || 'Delete'}</span>
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
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">{goalDetailsTranslations?.tabs?.details || 'Details'}</span>
            <span className="sm:hidden">Details</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            <span className="hidden sm:inline">{goalDetailsTranslations?.tabs?.tasks || 'Tasks'}</span>
            <span className="sm:hidden">Tasks</span>
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information - Enhanced layout */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Target className="w-5 h-5" />
                    {goalDetailsTranslations?.sections?.basicInfo || 'Basic Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status and Category in a row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-foreground">
                          {goalDetailsTranslations?.fields?.status || 'Status'}
                        </label>
                        <FieldTooltip 
                          targetId="goal-status" 
                          fieldLabel={goalDetailsTranslations?.fields?.status || 'Status'} 
                          hint={goalDetailsTranslations?.hints?.fields?.status || 'Current progress state of the goal'}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(goal.status)}
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColorClass(goal.status)} text-sm px-3 py-1`}
                        >
                          {formatGoalStatus(goal.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-foreground">
                          {goalDetailsTranslations?.fields?.category || 'Category'}
                        </label>
                        <FieldTooltip 
                          targetId="goal-category" 
                          fieldLabel={goalDetailsTranslations?.fields?.category || 'Category'} 
                          hint={goalDetailsTranslations?.hints?.fields?.category || 'Optional categorization'}
                        />
                      </div>
                      {goal.category ? (
                        <p className="text-sm text-foreground font-medium">
                          {goal.category}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No category assigned
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {goal.tags && goal.tags.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-foreground">
                          {goalDetailsTranslations?.fields?.tags || 'Tags'}
                        </label>
                        <FieldTooltip 
                          targetId="goal-tags" 
                          fieldLabel={goalDetailsTranslations?.fields?.tags || 'Tags'} 
                          hint={goalDetailsTranslations?.hints?.fields?.tags || 'Labels to help organize goals'}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {goal.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2.5 py-1">
                            <Tag className="w-3 h-3 mr-1.5" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              {goal.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <FileText className="w-5 h-5" />
                      {goalDetailsTranslations?.sections?.description || 'Description'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {goal.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Goal Contract (NLP Answers) */}
              {goal.answers && goal.answers.length > 0 && (
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base sm:text-lg mb-1">
                          {goalCreationTranslations?.sections?.nlpQuestions || 'Goal Contract'}
                        </CardTitle>
                        {goalCreationTranslations?.sections?.nlpSubtitle && (
                          <p className="text-sm text-muted-foreground">
                            {goalCreationTranslations.sections.nlpSubtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {goal.answers.map((answer, index) => {
                        const questionLabel = nlpQuestions[answer.key as keyof typeof nlpQuestions] || answer.key;
                        const questionHint = nlpHints[answer.key as keyof typeof nlpHints];
                        
                        return (
                          <div 
                            key={index} 
                            className="border rounded-lg p-4 space-y-3 bg-card hover:border-primary/50 transition-all hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <label className="text-sm font-semibold text-foreground leading-tight">
                                    {questionLabel}
                                  </label>
                                  {questionHint && (
                                    <FieldTooltip 
                                      targetId={`nlp-${answer.key}-${index}`} 
                                      fieldLabel={questionLabel} 
                                      hint={questionHint}
                                      iconLabelTemplate={goalCreationTranslations?.hints?.iconLabel || 'More information about {field}'}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="pt-2 border-t">
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                {answer.answer}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Goal Quests Section */}
              <ErrorBoundary>
                <GoalQuestsSection
                  goalId={goal.id}
                  goalTitle={goal.title}
                  canCreate={goal?.canAddTasks || false}
                  canViewAll={goal?.canEdit || false}
                />
              </ErrorBoundary>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Clock className="w-5 h-5" />
                    {goalDetailsTranslations?.sections?.timeline || 'Timeline'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {goalDetailsTranslations?.timeline?.created || 'Created'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatDate(goal.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {goalDetailsTranslations?.timeline?.lastUpdated || 'Last Updated'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatDate(goal.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {deadlineInfo ? (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {goalDetailsTranslations?.timeline?.deadline || 'Deadline'}
                          </p>
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
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
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
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="w-5 h-5" />
                    {goalDetailsTranslations?.sections?.progress || 'Progress'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {goalWithProgress ? (
                    <DualProgressBar 
                      goal={goalWithProgress} 
                      showMilestones={true}
                      showLabels={true}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      Loading progress data...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Collaboration Section */}
          {goal && !['completed', 'archived'].includes(goal.status) && (
            <div className="mt-8 space-y-6">
              <CollaboratorList
                resourceType="goal"
                resourceId={goal.id}
                resourceTitle={goal.title}
                currentUserId={getUserIdFromToken() || ''}
                isOwner={goal.canEdit || false}
                onInviteClick={() => setShowInviteModal(true)}
              />

              {goal.canComment && (
                <CommentSection
                  resourceType="goal"
                  resourceId={goal.id}
                />
              )}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <TasksListInline
            tasks={tasks}
            goalId={goal.id}
            goalDeadline={goal.deadline}
            onUpdateTask={handleTaskUpdate}
            onDeleteTask={handleTaskDelete}
            onCreateTask={handleTaskCreate}
            canEdit={goal.canEdit || false}
            canDelete={goal.canDelete || false}
            canCreate={goal.canAddTasks || false}
          />
        </TabsContent>
      </Tabs>

      {/* Invite Collaborator Modal */}
      {goal && showInviteModal && (
        <InviteCollaboratorModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          resourceType="goal"
          resourceId={goal.id}
          resourceTitle={goal.title}
          onInviteSent={() => {
            setShowInviteModal(false);
          }}
        />
      )}
    </div>
  );
};

export default GoalDetails;
