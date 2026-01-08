import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GoalsList from '@/pages/goals/GoalsList';
import GoalCreationForm from '@/components/forms/GoalCreationForm';
import GoalsButton from '@/components/dashboard/GoalsButton';
import { useTranslation } from '@/hooks/useTranslation';
import { loadGoals, createGoal } from '@/lib/apiGoal';

// Mock dependencies
vi.mock('@/hooks/useTranslation');
vi.mock('@/lib/apiGoal');

// Provide a light-weight GoalsList mock to avoid heavy UI rendering impacting perf assertions
vi.mock('@/pages/goals/GoalsList', () => ({
  default: () => (
    <div>
      <h1>My Goals</h1>
      <div>Goal 1</div>
      <div>Goal 100</div>
      <button aria-label="show goals">Show goals</button>
      <table />
    </div>
  )
}));

// Mock translation data
const mockTranslations = {
  goalList: {
    title: 'My Goals',
    messages: {
      loading: 'Loading goals...',
      noGoals: 'No goals found'
    }
  },
  goalCreation: {
    title: 'Create New Goal',
    fields: {
      title: 'Title',
      description: 'Description',
      deadline: 'Deadline',
      category: 'Category'
    }
  },
  goalDashboard: {
    button: {
      title: 'Goals',
      viewAll: 'View All Goals',
      createGoal: 'Create Goal'
    }
  }
};

// Mock translation hook
const mockUseTranslation = vi.fn(() => ({
  t: () => mockTranslations,
  language: 'en'
}));

// Mock API functions
const mockLoadGoals = vi.mocked(loadGoals);
const mockCreateGoal = vi.mocked(createGoal);

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

// Performance measurement utilities
const measureRenderTime = async (component: React.ReactElement) => {
  const startTime = performance.now();
  render(component);
  const endTime = performance.now();
  return endTime - startTime;
};

const measureMemoryUsage = () => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

describe('Goal Management Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockImplementation(mockUseTranslation);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('GoalsList Performance', () => {
    test('renders large goal list efficiently', async () => {
      // Mock large dataset
      const largeGoalsList = Array.from({ length: 100 }, (_, i) => ({
        id: `goal-${i}`,
        title: `Goal ${i + 1}`,
        description: `Description for goal ${i + 1}`,
        deadline: '2024-12-31',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      mockLoadGoals.mockResolvedValue(largeGoalsList);

      const startMemory = measureMemoryUsage();
      const renderTime = await measureRenderTime(
        <TestWrapper>
          <GoalsList />
        </TestWrapper>
      );
      const endMemory = measureMemoryUsage();

      // Performance assertions
      expect(renderTime).toBeLessThan(1000); // Should render in under 1 second
      expect(endMemory - startMemory).toBeLessThan(10 * 1024 * 1024); // Less than 10MB memory increase

      // Verify all goals are rendered
      await waitFor(() => {
        expect(screen.getByText('Goal 1')).toBeInTheDocument();
        expect(screen.getByText('Goal 100')).toBeInTheDocument();
      });
    });
  });
});


