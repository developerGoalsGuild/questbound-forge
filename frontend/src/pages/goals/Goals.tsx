import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { graphQLClient } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { createGoal, loadGoals } from '@/lib/apiGoal';


import { RoleRoute } from '@/lib/auth';
import { useTranslation } from '@/hooks/useTranslation';
import { nlpQuestionOrder, NLPAnswers } from './questions';
import { useToast } from '@/hooks/use-toast';

import { graphQLClientProtected } from '@/lib/api';
import CreateTaskModal from '@/components/modals/CreateTaskModal';
import TasksModal from '@/components/modals/TasksModal';

// Import new createTask API call
import { createTask as createTaskApi, loadTasks as loadTasksApi } from '@/lib/apiTask';

const client = graphQLClientProtected();

const toEpochSeconds = (iso: string): number => Math.floor(new Date(iso).getTime() / 1000);

const formatDeadline = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return new Date(value * 1000).toLocaleDateString();
  }
  const str = String(value);
  const parsed = Date.parse(str);
  return Number.isNaN(parsed) ? str : new Date(parsed).toLocaleDateString();
};

const GoalsPageInner: React.FC = () => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<string>('');
  const [answers, setAnswers] = useState<NLPAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(5);

  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalGoalDeadline, setModalGoalDeadline] = useState<string | null>(null);

  // New TasksModal state
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);

  // 1. Multilingual labels and hints - Add safety checks
  const goalsTranslations = (t as any)?.goals;
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

  // 3. Info icon + tooltip component (accessible)
  const InfoHint = ({ hint, targetId, fieldLabel }: { hint?: string; targetId: string; fieldLabel: string }) => {
    if (!hint) {
      return null;
    }
    const descriptionId = createHintId(targetId);
    const tooltipId = `${descriptionId}-content`;
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={formatHintLabel(fieldLabel)}
              aria-describedby={descriptionId}
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            id={tooltipId}
            role="tooltip"
            side="top"
            align="start"
            aria-labelledby={descriptionId}
            className="max-w-xs text-sm leading-relaxed"
          >
            {hint}
          </TooltipContent>
        </Tooltip>
        <span id={descriptionId} className="sr-only">
          {hint}
        </span>
      </>
    );
  };

  // 4. Localized field labels
  const goalsList = goalsTranslations?.list ?? {};
  const fields = goalsTranslations?.fields ?? {};
  const searchLabel = goalsList.searchLabel || goalsList.search || 'Search goals';
  const statusLabel = goalsList.statusFilterLabel || 'Status';
  const titleLabel = fields.title || 'Title';
  const descriptionLabel = fields.description || 'Description';
  const deadlineLabel = fields.deadline || 'Deadline';

  // 5. Filtering
  const filteredGoals = useMemo(() => {
    const list = Array.isArray(goals) ? goals : [];
    const q = query.trim().toLowerCase();
    const status = statusFilter.trim().toLowerCase();
    return list.filter((g) => {
      const matchesText = !q || [g.title, g.description]
        .filter(Boolean)
        .some((s: string) => String(s).toLowerCase().includes(q));
      const matchesStatus = !status || String(g.status ?? '').toLowerCase() === status;
      return matchesText && matchesStatus;
    });
  }, [goals, query, statusFilter]);

  const visibleGoals = useMemo(() => filteredGoals.slice(0, visibleCount), [filteredGoals, visibleCount]);

  const loadMyGoals = useCallback(async () => {
    try {
      const myGoals = await loadGoals();
      setGoals(Array.isArray(myGoals) ? myGoals : []);
      setVisibleCount(5);
    } catch (e) {
      setGoals([]);
      setVisibleCount(5);
    }
  }, []);

  useEffect(() => {
    loadMyGoals();
  }, [loadMyGoals]);

  async function loadMyTasks(goalId: string) {
    try {
      console.log('Loading tasks for goalId:', goalId);
      const tasks = await loadTasksApi(goalId);
      console.log('Loaded tasks:', tasks);
      setTasks(tasks || []);
      console.log('Set tasks state');
    } catch (e) {
      console.error('Error loading tasks:', e);
      setTasks([]);
    }
  }

  async function onCreateGoal(e: React.FormEvent) {
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
      await createGoal({
        title: title,
        description: description,
        deadline: deadline,
        nlpAnswers: answers,
      });

      setTitle('');
      setDescription('');
      setDeadline('');
      await loadMyGoals();
    } catch (e: any) {
      const desc = Array.isArray(e?.errors)
        ? e.errors.map((x: any) => x?.message || '').filter(Boolean).join(' | ')
        : typeof e?.message === 'string'
        ? e.message
        : String(e);
      toast({ title: (t as any).common.error, description: desc, variant: 'destructive' });
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
    const goal = goals.find(g => g.id === goalId);
    setModalGoalDeadline(goal?.deadline || null);
    setIsTaskModalOpen(true);
  };

  // Updated handler for creating task via modal using API Gateway endpoint
  const handleCreateTask = async (taskTitle: string, taskDueAt: string,taskTags:string[], taskStatus: string) => {
    if (!selectedGoalId) return;
    try {
      const dueAtEpoch = Math.floor(new Date(taskDueAt).getTime() / 1000);
      // For tags, pass empty array or extend UI to collect tags if needed
      await createTaskApi({
        goalId: selectedGoalId,
        title: taskTitle,
        dueAt: dueAtEpoch,
        tags: taskTags,
        status: taskStatus
      });
      toast({ title: goalsList?.taskCreated || 'Task created' });
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
      // Call API to update task - implement your API call here
      // Example: await updateTaskApi(updatedTask);
      // For demo, just update local state
      setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
      toast({ title: goalsList?.taskUpdated || 'Task updated' });
    } catch (e: any) {
      toast({ title: (t as any)?.common?.error || 'Error', description: e?.message || String(e), variant: 'destructive' });
      throw e;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Call API to delete task - implement your API call here
      // Example: await deleteTaskApi(taskId);
      // For demo, just update local state
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({ title: goalsList?.taskDeleted || 'Task deleted' });
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
  
  
  return (
    <TooltipProvider delayDuration={150}>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{goalsTranslations?.title || 'Goals'}</h1>
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <button onClick={loadMyGoals} className="px-3 py-2 border rounded">
              {goalsTranslations?.actions?.refresh || 'Refresh'}
            </button>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-end">
            <div className="w-full md:w-64">
              <div className="mb-1 flex items-center gap-2">
                <label className="text-sm font-medium" htmlFor="goal-search">
                  {searchLabel}
                </label>
                <InfoHint targetId="goal-search" fieldLabel={searchLabel} hint={filterHints.search} />
              </div>
              <input
                id="goal-search"
                className="w-full border rounded p-2"
                placeholder={goalsList?.search || 'Search goals'}
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-describedby={filterHints.search ? createHintId('goal-search') : undefined}
              />
            </div>
            <div className="w-full md:w-48">
              <div className="mb-1 flex items-center gap-2">
                <label className="text-sm font-medium" htmlFor="goal-status-filter">
                  {statusLabel}
                </label>
                <InfoHint targetId="goal-status-filter" fieldLabel={statusLabel} hint={filterHints.status} />
              </div>
              <select
                id="goal-status-filter"
                className="w-full border rounded p-2"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                aria-describedby={filterHints.status ? createHintId('goal-status-filter') : undefined}
              >
                <option value="">{goalsList?.allStatuses || 'All'}</option>
                <option value="active">{goalsList?.statusActive || 'Active'}</option>
                <option value="paused">{goalsList?.statusPaused || 'Paused'}</option>
                <option value="completed">{goalsList?.statusCompleted || 'Completed'}</option>
                <option value="archived">{goalsList?.statusArchived || 'Archived'}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-8 gap-2">
          <h3 className="font-semibold mb-2">{goalsList?.myGoals || 'My Quests'}</h3>
          <div className="space-y-2">
            {filteredGoals.length === 0 ? (
              <div className="text-sm text-muted-foreground">{goalsList?.noGoals || 'No goals yet.'}</div>
            ) : (
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">{goalsList?.columns?.title || 'Goal'}</th>
                      <th className="px-3 py-2 text-left">{goalsList?.columns?.description || 'Descriptions'}</th>
                      <th className="px-3 py-2 text-left">{goalsList?.columns?.deadline || 'Due Date'}</th>
                      <th className="px-3 py-2 text-left">{goalsList?.columns?.status || 'Status'}</th>
                      <th className="px-3 py-2 text-right">{goalsList?.columns?.actions || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleGoals.map(g => {
                      const deadlineLabel = formatDeadline(g.deadline);
                      return (
                        <tr key={g.id} className="border-t">
                          <td className="px-3 py-2 align-top font-medium">{g.title || 'N/A'}</td>
                          <td className="px-3 py-2 align-top text-muted-foreground">{g.description || 'N/A'}</td>
                          <td className="px-3 py-2 align-top">{deadlineLabel || 'N/A'}</td>
                          <td className="px-3 py-2 align-top capitalize">{g.status || 'N/A'}</td>
                          <td className="px-3 py-2 align-top">
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                              <button
                                className="px-2 py-1 text-xs sm:text-sm border rounded"
                                onClick={() => {
                                  setSelectedGoalId(g.id);
                                  openTasksModal(g.id);
                                }}
                              >
                                {goalsList?.viewTasks || 'View Tasks'}
                              </button>
                              <button
                                className="px-2 py-1 text-xs sm:text-sm border rounded"
                                onClick={() => openCreateTaskModal(g.id)}
                              >
                                {goalsList?.createTask || 'Create Task'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {filteredGoals.length > visibleCount && (
              <div className="pt-2 text-right mb-4">
                <button className="px-3 py-2 border rounded" onClick={() => setVisibleCount(c => c + 5)}>
                  {goalsList?.showMore || 'Show more'}
                </button>
              </div>
            )}
          </div>
        </div>
        <form onSubmit={onCreateGoal} className="space-y-4" data-testid="goal-form">
          <div className="max-w-3xl mx-auto p-6">
            <h3 className="font-semibold">{goalsList?.newGoal || 'New Goal'}</h3>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-sm font-medium" htmlFor="goal-title">
                {titleLabel}
              </label>
              <InfoHint targetId="goal-title" fieldLabel={titleLabel} hint={fieldHints.title} />
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
              <InfoHint targetId="goal-description" fieldLabel={descriptionLabel} hint={fieldHints.description} />
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
              <InfoHint targetId="goal-deadline" fieldLabel={deadlineLabel} hint={fieldHints.deadline} />
            </div>
            <input
              id="goal-deadline"
              type="datetime-local"
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
                      <InfoHint targetId={questionId} fieldLabel={questionLabel} hint={questionHints[key]} />
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
              {submitting ? (t as any)?.common?.loading || 'Loading...' : goalsTranslations?.actions?.createGoal || 'Create Goal'}
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

          {selectedGoalId && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">{goalsList?.tasks || 'Tasks'}</h4>
              {(tasks || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">{goalsList?.noTasks || 'No tasks yet.'}</div>
              ) : (
                <ul className="list-disc pl-6 space-y-1">
                  {tasks.map(tItem => (
                    <li key={tItem.id}>
                      {tItem.title}
                      {tItem.dueAt ? ` - ${new Date(tItem.dueAt * 1000).toLocaleString()}` : ''}
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
              />
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onCreate={handleCreateTask}
          goalDeadline={modalGoalDeadline}
        />
      </div>
    </TooltipProvider>
  );
};

const GoalsPage: React.FC = () => (
  <GoalsPageInner />
);

export default GoalsPage;
