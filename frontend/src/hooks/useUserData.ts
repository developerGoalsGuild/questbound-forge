import { useState, useEffect, useCallback } from 'react';
import { 
  getUserDashboardData, 
  createUserGoal, 
  updateGoalProgress,
  calculateOverallProgress,
  getGoalsByCategory,
  getUpcomingDeadlines
} from '@/data/userData';
import { Goal, UserDashboardData, UserStats } from '@/data/types';

interface UseUserDataReturn {
  data: UserDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addGoal: (goal: Partial<Goal>) => Promise<void>;
  updateGoal: (goalId: string | number, progress: number) => Promise<void>;
  deleteGoal: (goalId: string | number) => Promise<void>;
  overallProgress: number;
  goalsByCategory: Record<string, Goal[]>;
  upcomingDeadlines: Goal[];
}

export const useUserData = (): UseUserDataReturn => {
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dashboardData = getUserDashboardData();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }, []);

  const addGoal = useCallback(async (goalData: Partial<Goal>) => {
    try {
      setLoading(true);
      const newGoal = createUserGoal(goalData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          goals: [...prevData.goals, newGoal],
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add goal');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateGoal = useCallback(async (goalId: string | number, progress: number) => {
    try {
      setData(prevData => {
        if (!prevData) return prevData;

        const updatedGoals = prevData.goals.map(goal => {
          if (goal.id === goalId) {
            try {
              return updateGoalProgress(goal, progress);
            } catch (err) {
              // Handle error within map callback
              setError(err instanceof Error ? err.message : 'Failed to update goal');
              return goal; // Return original goal if update fails
            }
          }
          return goal;
        });

        return {
          ...prevData,
          goals: updatedGoals,
        };
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal');
    }
  }, []);

  const deleteGoal = useCallback(async (goalId: string | number) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          goals: prevData.goals.filter(goal => goal.id !== goalId),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Derived values
  const overallProgress = data ? calculateOverallProgress(data.goals) : 0;
  const goalsByCategory = data ? getGoalsByCategory(data.goals) : {};
  const upcomingDeadlines = data ? getUpcomingDeadlines(data.goals) : [];

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    addGoal,
    updateGoal,
    deleteGoal,
    overallProgress,
    goalsByCategory,
    upcomingDeadlines,
  };
};

// Specialized hooks for specific data
export const useUserStats = (): { stats: UserStats | null; loading: boolean } => {
  const { data, loading } = useUserData();
  return {
    stats: data?.stats || null,
    loading,
  };
};

export const useUserGoals = () => {
  const { 
    data, 
    loading, 
    error, 
    addGoal, 
    updateGoal, 
    deleteGoal, 
    overallProgress,
    goalsByCategory,
    upcomingDeadlines 
  } = useUserData();
  
  return {
    goals: data?.goals || [],
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    overallProgress,
    goalsByCategory,
    upcomingDeadlines,
  };
};

export const useUserAchievements = () => {
  const { data, loading, error } = useUserData();
  
  return {
    achievements: data?.achievements || [],
    nextAchievement: data?.nextAchievement || null,
    loading,
    error,
  };
};
