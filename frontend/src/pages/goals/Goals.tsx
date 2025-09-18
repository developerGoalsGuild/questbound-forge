import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
//import { graphQLClientProtected } from '@/lib/api';
import { graphQLClient } from '@/lib/utils';
import { createGoal,loadGoals } from '@/lib/apiGoal';
import { CREATE_GOAL, ADD_TASK } from '@/graphql/mutations';
import { MY_GOALS, MY_TASKS } from '@/graphql/queries';
import { RoleRoute } from '@/lib/auth';
import { useTranslation } from '@/hooks/useTranslation';
import { nlpQuestionOrder, NLPAnswers } from './questions';
import { useToast } from '@/hooks/use-toast';

const client = graphQLClient();


const toEpochSeconds = (iso: string): number => Math.floor(new Date(iso).getTime() / 1000);

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


  

  const labels = useMemo(() => (t as any).goals?.questions, [t]);

  async function loadMyGoals() {
    try {
      const myGoals = await loadGoals(MY_GOALS);
      
      setGoals(myGoals.myGoals || []);
      setVisibleCount(5);
    } catch (e) {
      // noop UI fallback
    }
  }

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
              deadline: toEpochSeconds(deadline), // ISO date string              
              progress: 0, // 0 to 100, default 0
              nlpAnswers: answers
      });

      setTitle('');
      setDescription('');
      setDeadline('');
    } catch (e: any) {
      const desc = Array.isArray(e?.errors)
        ? e.errors.map((x: any) => x?.message || '').filter(Boolean).join(' | ')
        : (typeof e?.message === 'string' ? e.message : String(e));
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

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{(t as any).goals.title}</h1>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <button onClick={loadMyGoals} className="px-3 py-2 border rounded">
            {(t as any).goals.actions.refresh || 'Refresh'}
          </button>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            className="border rounded p-2 flex-1"
            placeholder={(t as any).goals.list?.search || 'Search goals'}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select
            className="border rounded p-2"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">{(t as any).goals.list?.allStatuses || 'All'}</option>
            <option value="active">{(t as any).goals.list?.statusActive || 'Active'}</option>
            <option value="paused">{(t as any).goals.list?.statusPaused || 'Paused'}</option>
            <option value="completed">{(t as any).goals.list?.statusCompleted || 'Completed'}</option>
            <option value="archived">{(t as any).goals.list?.statusArchived || 'Archived'}</option>
          </select>
        </div>
      </div>
      <form onSubmit={onCreateGoal} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{(t as any).goals.fields.title}</label>
          <input className="w-full border rounded p-2" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{(t as any).goals.fields.description}</label>
          <textarea className="w-full border rounded p-2" rows={4} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{(t as any).goals.fields.deadline}</label>
          <input type="datetime-local" className="w-full border rounded p-2" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>

        <div className="mt-6" data-testid="nlp-section">
          <h2 className="text-lg font-semibold mb-2">{(t as any).goals.section.nlpTitle}</h2>
          <p className="text-sm text-gray-600 mb-3">{(t as any).goals.section.nlpSubtitle}</p>
          <div className="space-y-3" data-testid="nlp-questions">
            {nlpQuestionOrder.map(key => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">{labels?.[key] || key}</label>
                <textarea
                  className="w-full border rounded p-2"
                  rows={2}
                  value={answers[key] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button data-testid="btn-generate-image" type="button" onClick={onGenerateImage} className="px-3 py-2 bg-indigo-600 text-white rounded">
            {(t as any).goals.actions.generateImage}
          </button>
          <button data-testid="btn-suggest-improvements" type="button" onClick={onSuggestImprovements} className="px-3 py-2 bg-sky-600 text-white rounded">
            {(t as any).goals.actions.suggestImprovements}
          </button>
          <button disabled={submitting} type="submit" className="px-3 py-2 bg-emerald-600 text-white rounded">
            {submitting ? (t as any).common.loading : (t as any).goals.actions.createGoal}
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-4">
        {imageUrl && (
          <div>
            <h3 className="font-semibold mb-2">{(t as any).goals.inspiration.title}</h3>
            <img alt="Inspiration" src={imageUrl} className="rounded border max-h-64 object-cover" />
          </div>
        )}
        {suggestions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">{(t as any).goals.suggestions.title}</h3>
            <ul className="list-disc pl-6 space-y-1">
              {suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        <div className="mt-8">
          <h3 className="font-semibold mb-2">{(t as any).goals.list?.myGoals || 'My Quests'}</h3>
          <div className="space-y-2">
            {(goals || []).length === 0 && (
              <div className="text-sm text-muted-foreground">{(t as any).goals.list?.noGoals || 'No goals yet.'}</div>
            )}
            {goals
              .filter((g) => {
                const matchesText = !query || [g.title, g.description].filter(Boolean).some((s: string) => String(s).toLowerCase().includes(query.toLowerCase()));
                const matchesStatus = !statusFilter || String(g.status).toLowerCase() === statusFilter;
                return matchesText && matchesStatus;
              })
              .slice(0, visibleCount)
              .map((g) => (
              <div key={g.id} className="border rounded p-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-xs text-muted-foreground">{g.status} {g.deadline ? `• ${new Date(g.deadline * 1000).toLocaleString()}` : ''}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 text-sm border rounded"
                    onClick={() => { setSelectedGoalId(g.id); loadMyTasks(g.id); }}
                  >
                    {(t as any).goals.list?.viewTasks || 'View Tasks'}
                  </button>
                  <button
                    className="px-2 py-1 text-sm border rounded"
                    onClick={() => { setSelectedGoalId(g.id); setTaskTitle(''); setTaskDueAt(''); }}
                  >
                    {(t as any).goals.list?.createTask || 'Create Task'}
                  </button>
                </div>
              </div>
            ))}
            {((goals || [])
              .filter((g) => {
                const matchesText = !query || [g.title, g.description].filter(Boolean).some((s: string) => String(s).toLowerCase().includes(query.toLowerCase()));
                const matchesStatus = !statusFilter || String(g.status).toLowerCase() === statusFilter;
                return matchesText && matchesStatus;
              }).length > visibleCount) && (
              <div className="pt-2">
                <button className="px-3 py-2 border rounded" onClick={() => setVisibleCount(c => c + 5)}>
                  {(t as any).goals.list?.showMore || 'Show more'}
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedGoalId && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">{(t as any).goals.list?.tasks || 'Tasks'}</h4>
            {(tasks || []).length === 0 ? (
              <div className="text-sm text-muted-foreground">{(t as any).goals.list?.noTasks || 'No tasks yet.'}</div>
            ) : (
              <ul className="list-disc pl-6 space-y-1">
                {tasks.map((tItem) => (
                  <li key={tItem.id}>
                    {tItem.title} {tItem.dueAt ? `• ${new Date(tItem.dueAt * 1000).toLocaleString()}` : ''}
                  </li>
                ))}
              </ul>
            )}

            {/* Create Task inline */}
            <div className="mt-4 border-t pt-4">
              <div className="grid md:grid-cols-3 gap-2">
                <input
                  className="border rounded p-2"
                  placeholder={(t as any).goals.list?.taskTitle || 'Task title'}
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                />
                <input
                  type="datetime-local"
                  className="border rounded p-2"
                  value={taskDueAt}
                  onChange={e => setTaskDueAt(e.target.value)}
                />
                <button
                  className="px-3 py-2 bg-primary text-primary-foreground rounded"
                  onClick={async () => {
                    if (!selectedGoalId || !taskTitle.trim()) return;
                    try {
                      await client.graphql({
                        query: ADD_TASK as any,
                        variables: {
                          input: {
                            goalId: selectedGoalId,
                            title: taskTitle.trim(),
                            dueAt: taskDueAt ? Math.floor(new Date(taskDueAt).getTime() / 1000) : undefined,
                            nlpPlan: answers && Object.keys(answers).length ? answers : undefined,
                          }
                        }
                      });
                      setTaskTitle('');
                      setTaskDueAt('');
                      await loadMyTasks(selectedGoalId);
                      toast({ title: (t as any).goals.list?.taskCreated || 'Task created' });
                    } catch (e: any) {
                      const desc = Array.isArray(e?.errors)
                        ? e.errors.map((x: any) => x?.message || '').filter(Boolean).join(' | ')
                        : (typeof e?.message === 'string' ? e.message : String(e));
                      toast({ title: (t as any).common.error, description: desc, variant: 'destructive' });
                    }
                  }}
                >
                  {(t as any).goals.list?.createTask || 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GoalsPage: React.FC = () => (
  <RoleRoute allow={["user"]}>
    <GoalsPageInner />
  </RoleRoute>
);

export default GoalsPage;
