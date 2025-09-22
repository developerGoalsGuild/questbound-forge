import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { graphQLClient } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { createGoal, loadGoals } from '@/lib/apiGoal';
import { CREATE_GOAL, ADD_TASK } from '@/graphql/mutations';
import { MY_GOALS, MY_TASKS } from '@/graphql/queries';
import { RoleRoute } from '@/lib/auth';
import { useTranslation } from '@/hooks/useTranslation';
import { nlpQuestionOrder, NLPAnswers } from './questions';
import { useToast } from '@/hooks/use-toast';

import { graphQLClientProtected } from '@/lib/api';
import CreateTaskModal from '@/components/CreateTaskModal';

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
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueAt, setTaskDueAt] = useState<string>('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(5);

  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalGoalDeadline, setModalGoalDeadline] = useState<string | null>(null);

  // 1. Multilingual labels and hints
  const labels = useMemo(() => (t as any).goals?.questions, [t]);
  const hints = (t as any).goals?.hints ?? {};
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
  const goalsList = (t as any).goals?.list ?? {};
  const fields = (t as any).goals?.fields ?? {};
  const searchLabel = goalsList.searchLabel || goalsList.search || 'Search goals';
  const statusLabel = goalsList.statusFilterLabel || 'Status';
  const titleLabel = fields.title || 'Title';
  const descriptionLabel = fields.description || 'Description';
  const deadlineLabel = fields.deadline || 'Deadline';
  const taskTitleLabel = goalsList.taskTitle || 'Task title';
  const taskDueLabel = goalsList.taskDueAtLabel || goalsList.taskDueAt || 'Due date';

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
      const { data, errors } = await client.graphql({ query: MY_TASKS as any, variables: { goalId } });
      if (errors?.length) throw new Error(errors.map((e: any) => e.message).join(' | '));
      setTasks((data as any)?.myTasks || []);
    } catch (e) {
      setTasks([]);
    }
  }

  async function onCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: (t as any).goals.validation.titleRequired, variant: 'destructive' });
      return;
    }
    if (!deadline) {
      toast({ title: (t as any).goals.validation.deadlineRequired, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const input: any = {
        title: title.trim(),
        description: description.trim(),
        tags: [],
        deadline: toEpochSeconds(deadline),
      };

      await createGoal({
        title: title,
        description: description,
        deadline: `${toEpochSeconds(deadline)}`, // ISO date string        
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
      toast({ title: (t as any).goals.messages.aiImageFailed, description: String(e?.message || e), variant: 'destructive' });
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
      toast({ title: (t as any).goals.messages.aiSuggestFailed, description: String(e?.message || e), variant: 'destructive' });
    }
  }

  // New handler for opening modal with goal deadline
  const openCreateTaskModal = (goalId: string) => {
    setSelectedGoalId(goalId);
    const goal = goals.find(g => g.id === goalId);
    setModalGoalDeadline(goal?.deadline || null);
    setIsTaskModalOpen(true);
  };

  // New handler for creating task via modal
  const handleCreateTask = async (taskTitle: string, taskDueAt: string) => {
    if (!selectedGoalId) return;
    try {
      await client.graphql({
        query: ADD_TASK as any,
        variables: {
          input: {
            goalId: selectedGoalId,
            title: taskTitle,
            dueAt: Math.floor(new Date(taskDueAt).getTime() / 1000),
          },
        },
      });
      toast({ title: t.goals.list?.taskCreated || 'Task created' });
      await loadMyTasks(selectedGoalId);
    } catch (e: any) {
      const desc = Array.isArray(e?.errors)
        ? e.errors.map((x: any) => x?.message || '').filter(Boolean).join(' | ')
        : typeof e?.message === 'string'
        ? e.message
        : String(e);
      toast({ title: t.common.error, description: desc, variant: 'destructive' });
      throw e;
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{(t as any).goals.title}</h1>
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <button onClick={loadMyGoals} className="px-3 py-2 border rounded">
              {(t as any).goals.actions.refresh || 'Refresh'}
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
                placeholder={t.goals.list?.search || 'Search goals'}
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
                <option value="">{t.goals.list?.allStatuses || 'All'}</option>
                <option value="active">{t.goals.list?.statusActive || 'Active'}</option>
                <option value="paused">{t.goals.list?.statusPaused || 'Paused'}</option>
                <option value="completed">{t.goals.list?.statusCompleted || 'Completed'}</option>
                <option value="archived">{t.goals.list?.statusArchived || 'Archived'}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-8 gap-2">
          <h3 className="font-semibold mb-2">{t.goals.list?.myGoals || 'My Quests'}</h3>
          <div className="space-y-2">
            {filteredGoals.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t.goals.list?.noGoals || 'No goals yet.'}</div>
            ) : (
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">{t.goals.list?.columns?.title || 'Title'}</th>
                      <th className="px-3 py-2 text-left">{t.goals.list?.columns?.description || 'Description'}</th>
                      <th className="px-3 py-2 text-left">{t.goals.list?.columns?.deadline || 'Deadline'}</th>
                      <th className="px-3 py-2 text-left">{t.goals.list?.columns?.status || 'Status'}</th>
                      <th className="px-3 py-2 text-right">{t.goals.list?.columns?.actions || 'Actions'}</th>
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
                                  loadMyTasks(g.id);
                                }}
                              >
                                {t.goals.list?.viewTasks || 'View Tasks'}
                              </button>
                              <button
                                className="px-2 py-1 text-xs sm:text-sm border rounded"
                                onClick={() => openCreateTaskModal(g.id)}
                              >
                                {t.goals.list?.createTask || 'Create Task'}
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
                  {t.goals.list?.showMore || 'Show more'}
                </button>
              </div>
            )}
          </div>
        </div>
        <form onSubmit={onCreateGoal} className="space-y-4">
          <div className="max-w-3xl mx-auto p-6">
            <h3 className="font-semibold">{t.goals.list?.newGoal || 'New Goal'}</h3>
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
            <h2 className="text-lg font-semibold mb-2">{t.goals.section.nlpTitle}</h2>
            <p className="text-sm text-gray-600 mb-3">{t.goals.section.nlpSubtitle}</p>
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
              {t.goals.actions.generateImage}
            </button>
            <button
              data-testid="btn-suggest-improvements"
              type="button"
              onClick={onSuggestImprovements}
              className="px-3 py-2 bg-sky-600 text-white rounded"
            >
              {t.goals.actions.suggestImprovements}
            </button>
            <button disabled={submitting} type="submit" className="px-3 py-2 bg-emerald-600 text-white rounded">
              {submitting ? t.common.loading : t.goals.actions.createGoal}
            </button>
          </div>
        </form>

        <div className="mt-6 grid gap-4">
          {imageUrl && (
            <div>
              <h3 className="font-semibold mb-2">{t.goals.inspiration.title}</h3>
              <img alt="Inspiration" src={imageUrl} className="rounded border max-h-64 object-cover" />
            </div>
          )}
          {suggestions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">{t.goals.suggestions.title}</h3>
              <ul className="list-disc pl-6 space-y-1">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedGoalId && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">{t.goals.list?.tasks || 'Tasks'}</h4>
              {(tasks || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">{t.goals.list?.noTasks || 'No tasks yet.'}</div>
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
  <RoleRoute allow={['user']}>
    <GoalsPageInner />
  </RoleRoute>
);

export default GoalsPage;
