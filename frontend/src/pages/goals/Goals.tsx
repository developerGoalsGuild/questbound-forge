import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { graphQLClient } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, ArrowLeft, Plus } from 'lucide-react';
import FieldTooltip from '@/components/ui/FieldTooltip';
import { createGoal, loadGoals, getGoal, updateGoal } from '@/lib/apiGoal';


import { RoleRoute } from '@/lib/auth';
import { useTranslation } from '@/hooks/useTranslation';
import { nlpQuestionOrder, NLPAnswers } from './questions';
import { useToast } from '@/hooks/use-toast';

import { graphQLClientProtected } from '@/lib/api';
import CreateTaskModal from '@/components/modals/CreateTaskModal';
import TasksModal from '@/components/modals/TasksModal';

// Import task API calls
import { createTask as createTaskApi, loadTasks as loadTasksApi, updateTask, deleteTask } from '@/lib/apiTask';

const client = graphQLClientProtected();

// Parse a date-only string (YYYY-MM-DD or datetime-local) into epoch seconds in UTC
const toEpochSeconds = (input: string): number => {
  const dateOnlyMatch = input.match(/^\d{4}-\d{2}-\d{2}$/);
  if (dateOnlyMatch) {
    const [year, month, day] = input.split('-').map(n => Number(n));
    const ms = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    return Math.floor(ms / 1000);
  }
  return Math.floor(new Date(input).getTime() / 1000);
};

const formatDeadline = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return new Date(value * 1000).toLocaleDateString(undefined, { timeZone: 'UTC' });
  }
  const str = String(value);
  const parsed = Date.parse(str);
  return Number.isNaN(parsed) ? str : new Date(parsed).toLocaleDateString(undefined, { timeZone: 'UTC' });
};

const GoalsPageInner: React.FC = () => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Determine if this is create or edit mode
  const isEditMode = Boolean(id);
  const isCreateMode = !isEditMode;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<string>('');
  const [answers, setAnswers] = useState<NLPAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(id || null);
  const [tasks, setTasks] = useState<any[]>([]);

  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalGoalDeadline, setModalGoalDeadline] = useState<string | null>(null);

  // New TasksModal state
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);

  // 1. Multilingual labels and hints - Add safety checks
  // Goals translations are spread directly into the main translations object
  const goalsTranslations = t as any;
  const labels = useMemo(() => goalsTranslations?.questions, [goalsTranslations]);
  const hints = goalsTranslations?.hints ?? {};
  const fieldHints = (hints.fields ?? {}) as Record<string, string | undefined>;
  const questionHints = (hints.questions ?? {}) as Record<string, string | undefined>;
  const filterHints = (hints.filters ?? {}) as Record<string, string | undefined>;
  const taskHints = (hints.tasks ?? {}) as Record<string, string | undefined>;
  const iconLabelTemplate = typeof hints.iconLabel === 'string' ? hints.iconLabel : 'More information about {field}';


  // 2. Accessibility helpers
  const createHintId = (id: string) => `${id}-hint`;
  const formatHintLabel = (fieldLabel: string) => {
    const safeLabel = fieldLabel && fieldLabel.trim().length > 0 ? fieldLabel.trim() : 'this field';
    if (iconLabelTemplate.includes('{field}')) {
      return iconLabelTemplate.replace('{field}', safeLabel);
    }
    return `${iconLabelTemplate} ${safeLabel}`.trim();
  };

  // 3. Info icon + tooltip component (accessible) - using FieldTooltip

  // 4. Localized field labels
  const fields = goalsTranslations?.fields ?? {};
  const titleLabel = fields.title || 'Title';
  const descriptionLabel = fields.description || 'Description';
  const deadlineLabel = fields.deadline || 'Deadline';

  // Load goal data for edit mode
  const loadGoalData = useCallback(async (goalId: string) => {
    try {
      setLoading(true);
      const goalData = await getGoal(goalId);
      
      // Pre-fill form with goal data
      setTitle(goalData.title || '');
      setDescription(goalData.description || '');
      
      // Format deadline for date input
      if (goalData.deadline) {
        const deadlineDate = new Date(goalData.deadline + 'T00:00:00Z');
        const formattedDeadline = deadlineDate.toISOString().split('T')[0];
        setDeadline(formattedDeadline);
      }
      
      // Convert answers array to object
      const answersObj: NLPAnswers = {};
      if (goalData.answers && Array.isArray(goalData.answers)) {
        goalData.answers.forEach((answer: any) => {
          if (answer.key && answer.answer) {
            answersObj[answer.key] = answer.answer;
          }
        });
      }
      setAnswers(answersObj);
      
      // Load tasks for this goal
      await loadMyTasks(goalId);
      
    } catch (e: any) {
      console.error('Error loading goal data:', e);
      toast({
        title: 'Error',
        description: e?.message || 'Failed to load goal data',
        variant: 'destructive'
      });
      navigate('/goals');
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  // Load goal data when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadGoalData(id);
    }
  }, [isEditMode, id, loadGoalData]);

  async function loadMyTasks(goalId: string) {
    try {
      console.log('Loading tasks for goalId:', goalId);
      const tasks = await loadTasksApi(goalId);
      console.log('Loaded tasks:', tasks);
      setTasks(Array.isArray(tasks) ? tasks : tasks ? [tasks] : []);
      console.log('Set tasks state');
    } catch (e) {
      console.error('Error loading tasks:', e);
      setTasks([]);
    }
  }

  async function onSubmitGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: goalsTranslations?.validation?.titleRequired || 'Title is required', variant: 'destructive' });
      return;
    }
    if (!deadline) {
      toast({ title: goalsTranslations?.validation?.deadlineRequired || 'Deadline is required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      // Convert deadline to epoch seconds for test compatibility
      let deadlineNum: number | undefined = undefined;
      if (deadline) {
        deadlineNum = toEpochSeconds(deadline);
      }
      
      if (isEditMode && id) {
        // Update existing goal - pass deadline as epoch timestamp
        const updateData = {
          title: title,
          description: description,
          deadline: deadlineNum,
          nlpAnswers: answers,
        };
        await updateGoal(id, updateData);
        toast({ 
          title: 'Success', 
          description: 'Goal updated successfully',
          variant: 'default'
        });
        navigate('/goals');
      } else {
        // Create new goal - pass deadline as string
        const createData = {
          title: title,
          description: description,
          deadline: deadline, // Use the original string format
          nlpAnswers: answers,
        };
        await createGoal(createData);
        toast({ 
          title: 'Success', 
          description: 'Goal created successfully',
          variant: 'default'
        });
        navigate('/goals');
      }
    } catch (e: any) {
      const desc = Array.isArray(e?.errors)
        ? e.errors.map((x: any) => x?.message || '').filter(Boolean).join(' | ')
        : typeof e?.message === 'string'
        ? e.message
        : String(e);
      toast({ title: 'Error', description: desc, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function onGenerateImage() {
    try {
      setImageUrl(null);
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(base.replace(/\/$/, '') + '/ai/inspiration-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: `${title} ${description}`.trim(), lang: language }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.detail || 'AI image failed');
      setImageUrl(body.imageUrl || null);
    } catch (e: any) {
      toast({ title: goalsTranslations?.messages?.aiImageFailed || 'AI image generation failed', description: String(e?.message || e), variant: 'destructive' });
    }
  }

  async function onSuggestImprovements() {
    try {
      setSuggestions([]);
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(base.replace(/\/$/, '') + '/ai/suggest-improvements', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: `${title}\n${description}`.trim(), lang: language }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.detail || 'AI suggestions failed');
      setSuggestions(Array.isArray(body.suggestions) ? body.suggestions : []);
    } catch (e: any) {
      toast({ title: goalsTranslations?.messages?.aiSuggestFailed || 'AI suggestions failed', description: String(e?.message || e), variant: 'destructive' });
    }
  }

  // New handler for opening modal with goal deadline
  const openCreateTaskModal = (goalId: string) => {
    setSelectedGoalId(goalId);
    // For edit mode, we can use the current goal's deadline from the form
    setModalGoalDeadline(deadline || null);
    setIsTaskModalOpen(true);
  };

  // Updated handler for creating task via modal using API Gateway endpoint
  const handleCreateTask = async (taskTitle: string, taskDueAt: string,taskTags:string[], taskStatus: string) => {
    if (!selectedGoalId) return;
    try {
      const dueAtEpoch = toEpochSeconds(taskDueAt);
      // For tags, pass empty array or extend UI to collect tags if needed
      await createTaskApi({
        goalId: selectedGoalId,
        title: taskTitle,
        dueAt: dueAtEpoch,
        tags: taskTags,
        status: taskStatus
      });
      toast({ title: 'Task created' });
      await loadMyTasks(selectedGoalId);
    } catch (e: any) {
      const desc = e?.message || String(e);
      toast({ title: (t as any)?.common?.error || 'Error', description: desc, variant: 'destructive' });
      throw e;
    }
  };

// New handlers for TasksModal
  const handleUpdateTask = async (updatedTask: any) => {
    try {
      // Call API to update task
      await updateTask(updatedTask.id, {
        title: updatedTask.title,
        dueAt: updatedTask.dueAt,
        tags: updatedTask.tags,
        status: updatedTask.status,
        goalId: updatedTask.goalId
      });
      // Update local state after successful API call
      setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
      toast({ title: 'Task updated' });
    } catch (e: any) {
      toast({ title: (t as any)?.common?.error || 'Error', description: e?.message || String(e), variant: 'destructive' });
      throw e;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Call API to delete task
      await deleteTask(taskId);
      // Update local state after successful API call
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({ title: 'Task deleted' });
    } catch (e: any) {
      toast({ title: (t as any)?.common?.error || 'Error', description: e?.message || String(e), variant: 'destructive' });
      throw e;
    }
  };

  // New handler to open TasksModal and load tasks for a goal
  const openTasksModal = async (goalId: string) => {
    setSelectedGoalId(goalId);
    await loadMyTasks(goalId);
    setIsTasksModalOpen(true);
  };
  
  
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading goal data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
        {/* Header with back button and actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/goals')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Goals
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditMode ? 'Edit Goal' : 'Create New Goal'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditMode ? 'Update your goal details and manage tasks' : 'Set up a new goal with detailed planning'}
              </p>
            </div>
          </div>
          
          {/* Task management buttons - only show in edit mode */}
          {isEditMode && selectedGoalId && (
            <div className="flex gap-2">
              <button
                onClick={() => openTasksModal(selectedGoalId)}
                className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
                View Tasks
              </button>
              <button
                onClick={() => openCreateTaskModal(selectedGoalId)}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
            </div>
          )}
        </div>

        <form onSubmit={onSubmitGoal} className="space-y-4" data-testid="goal-form">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-sm font-medium" htmlFor="goal-title">
                {titleLabel}
              </label>
              <FieldTooltip targetId="goal-title" fieldLabel={titleLabel} hint={fieldHints.title} iconLabelTemplate={iconLabelTemplate} />
            </div>
            <input
              id="goal-title"
              className="w-full border rounded p-2"
              value={title}
              onChange={e => setTitle(e.target.value)}
              aria-describedby={fieldHints.title ? createHintId('goal-title') : undefined}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-sm font-medium" htmlFor="goal-description">
                {descriptionLabel}
              </label>
              <FieldTooltip targetId="goal-description" fieldLabel={descriptionLabel} hint={fieldHints.description} iconLabelTemplate={iconLabelTemplate} />
            </div>
            <textarea
              id="goal-description"
              className="w-full border rounded p-2"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              aria-describedby={fieldHints.description ? createHintId('goal-description') : undefined}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-sm font-medium" htmlFor="goal-deadline">
                {deadlineLabel}
              </label>
              <FieldTooltip targetId="goal-deadline" fieldLabel={deadlineLabel} hint={fieldHints.deadline} iconLabelTemplate={iconLabelTemplate} />
            </div>
            <input
              id="goal-deadline"
              type="date"
              className="w-full border rounded p-2"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              aria-describedby={fieldHints.deadline ? createHintId('goal-deadline') : undefined}
            />
          </div>

          <div className="mt-6" data-testid="nlp-section">
            <h2 className="text-lg font-semibold mb-2">{goalsTranslations?.section?.nlpTitle || 'NLP Analysis'}</h2>
            <p className="text-sm text-gray-600 mb-3">{goalsTranslations?.section?.nlpSubtitle || 'Help us understand your goal better'}</p>
            <div className="space-y-3" data-testid="nlp-questions">
              {nlpQuestionOrder.map(key => {
                const questionId = `nlp-${key}`;
                const questionLabel = labels?.[key] || key;
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-start gap-2">
                      <label className="text-sm font-medium" htmlFor={questionId}>
                        {questionLabel}
                      </label>
                      <FieldTooltip targetId={questionId} fieldLabel={questionLabel} hint={questionHints[key]} iconLabelTemplate={iconLabelTemplate} />
                    </div>
                    <textarea
                      id={questionId}
                      className="w-full border rounded p-2"
                      rows={2}
                      value={answers[key] || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                      aria-describedby={questionHints[key] ? createHintId(questionId) : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              data-testid="btn-generate-image"
              type="button"
              onClick={onGenerateImage}
              className="px-3 py-2 bg-indigo-600 text-white rounded"
            >
              {goalsTranslations?.actions?.generateImage || 'Generate Image'}
            </button>
            <button
              data-testid="btn-suggest-improvements"
              type="button"
              onClick={onSuggestImprovements}
              className="px-3 py-2 bg-sky-600 text-white rounded"
            >
              {goalsTranslations?.actions?.suggestImprovements || 'Suggest Improvements'}
            </button>
            <button disabled={submitting} type="submit" className="px-3 py-2 bg-emerald-600 text-white rounded">
              {submitting 
                ? (t as any)?.common?.loading || 'Loading...' 
                : isEditMode 
                  ? 'Update Goal' 
                  : goalsTranslations?.actions?.createGoal || 'Create Goal'
              }
            </button>
          </div>
        </form>

        <div className="mt-6 grid gap-4">
          {imageUrl && (
            <div>
              <h3 className="font-semibold mb-2">{goalsTranslations?.inspiration?.title || 'Inspirational Image'}</h3>
              <img alt="Inspiration" src={imageUrl} className="rounded border max-h-64 object-cover" />
            </div>
          )}
          {suggestions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">{goalsTranslations?.suggestions?.title || 'AI Suggestions'}</h3>
              <ul className="list-disc pl-6 space-y-1">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {isEditMode && selectedGoalId && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Tasks</h4>
              {(tasks || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No tasks yet. Click "Create Task" to add your first task.</div>
              ) : (
                <ul className="list-disc pl-6 space-y-1">
                  {tasks.map(tItem => (
                    <li key={tItem.id}>
                      {tItem.title}
                      {tItem.dueAt ? ` - ${new Date(tItem.dueAt * 1000).toLocaleDateString(undefined, { timeZone: 'UTC' })}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <TasksModal
                isOpen={isTasksModalOpen}
                onClose={() => setIsTasksModalOpen(false)}
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onTasksChange={() => selectedGoalId && loadMyTasks(selectedGoalId)}
              />
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onCreate={handleCreateTask}
          goalDeadline={modalGoalDeadline}
        />
      </div>
  );
};

const GoalsPage: React.FC = () => (
  <GoalsPageInner />
);

export default GoalsPage;
