import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import GoalCreationForm from '@/components/forms/GoalCreationForm';
import GoalEditForm from '@/components/forms/GoalEditForm';
import CreateTaskModal from '@/components/modals/CreateTaskModal';
import TasksModal from '@/components/modals/TasksModal';

// Import task API calls
import { createTask as createTaskApi, loadTasks as loadTasksApi, updateTask, deleteTask } from '@/lib/apiTask';

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

const GoalsPageInner: React.FC = () => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Determine if this is create or edit mode
  const isEditMode = Boolean(id);
  const isCreateMode = !isEditMode;
  
  // For edit mode, we need to track the goal ID for task management
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(id || null);
  const [tasks, setTasks] = useState<any[]>([]);

  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalGoalDeadline, setModalGoalDeadline] = useState<string | null>(null);

  // New TasksModal state
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);

  // Get translations
  const goalsTranslations = t as any;

  // Load tasks for the goal (used by edit mode)
  useEffect(() => {
    if (isEditMode && id) {
      loadMyTasks(id);
    }
  }, [isEditMode, id]);

  async function loadMyTasks(goalId: string) {
    try {
      console.log('Loading tasks for goalId:', goalId);
      const tasks = await loadTasksApi(goalId);
      console.log('Loaded tasks:', tasks);
      setTasks(Array.isArray(tasks) ? tasks : tasks ? [tasks] : []);
      console.log('Set tasks state');
    } catch (e: any) {
      console.error('Error loading tasks:', e);
      
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
      setTasks([]);
    }
  }



  // New handler for opening modal with goal deadline
  const openCreateTaskModal = (goalId: string) => {
    setSelectedGoalId(goalId);
    // For edit mode, we'll get the deadline from the goal data
    setModalGoalDeadline(null); // Will be set by the GoalEditForm
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
        title: (t as any)?.common?.error || 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
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
        title: (t as any)?.common?.error || 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
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
        title: (t as any)?.common?.error || 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
      throw e;
    }
  };

  // New handler to open TasksModal and load tasks for a goal
  const openTasksModal = async (goalId: string) => {
    setSelectedGoalId(goalId);
    await loadMyTasks(goalId);
    setIsTasksModalOpen(true);
  };
  
  
  // If in create mode, use the dedicated GoalCreationForm component
  if (isCreateMode) {
    return (
      <GoalCreationForm
        onSuccess={(goalId) => {
          toast({
            title: 'Success',
            description: 'Goal created successfully',
            variant: 'default'
          });
          navigate('/goals');
        }}
        onCancel={() => navigate('/goals')}
      />
    );
  }

  // If in edit mode, use the dedicated GoalEditForm component
  if (isEditMode && id) {
    return (
      <GoalEditForm
        goalId={id}
        onSuccess={(goalId) => {
          toast({
            title: 'Success',
            description: 'Goal updated successfully',
            variant: 'default'
          });
          navigate('/goals');
        }}
        onCancel={() => navigate('/goals')}
      />
    );
  }

  // Fallback loading state
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  );
};

const GoalsPage: React.FC = () => (
  <GoalsPageInner />
);

export default GoalsPage;
