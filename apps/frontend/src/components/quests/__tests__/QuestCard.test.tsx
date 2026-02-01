import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuestCard from '../QuestCard';
import { Quest } from '@/models/quest';

// Mock the useTranslation hook
const mockT = {
  quest: {
    actions: {
      edit: 'Edit',
      start: 'Start',
      view: 'View',
      delete: 'Delete',
      cancel: 'Cancel',
      fail: 'Fail',
    },
    status: {
      draft: 'Draft',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      failed: 'Failed',
    },
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    },
    progress: {
      inProgress: 'Progress',
    },
  },
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockT }),
}));

// Mock the useQuest hook
vi.mock('@/hooks/useQuest', () => ({
  useQuestProgress: vi.fn(() => ({
    progress: 75,
    progressPercentage: 75,
    isCalculating: false,
    isCompleted: false,
    isInProgress: true,
    isNotStarted: false,
    progressData: {
      percentage: 75,
      status: 'in_progress',
      completedCount: 3,
      totalCount: 4,
      remainingCount: 1,
      lastUpdated: new Date(),
      isCalculating: false,
    },
    completedCount: 3,
    totalCount: 4,
    remainingCount: 1,
    status: 'in_progress',
    error: null,
    updateProgress: vi.fn(),
  })),
}));

// Mock the quest model functions
vi.mock('@/models/quest', async () => {
  const actual = await vi.importActual('@/models/quest');
  return {
    ...actual,
    getQuestStatusKey: (status: string) => `quest.status.${status}`,
    getQuestStatusColorClass: (status: string) => {
      const colorMap: Record<string, string> = {
        draft: 'text-gray-600 bg-gray-50',
        active: 'text-green-600 bg-green-50',
        completed: 'text-blue-600 bg-blue-50',
        cancelled: 'text-red-600 bg-red-50',
        failed: 'text-red-600 bg-red-50',
      };
      return colorMap[status] || 'text-gray-600 bg-gray-50';
    },
    getQuestDifficultyKey: (difficulty: string) => `quest.difficulty.${difficulty}`,
    getQuestDifficultyColorClass: (difficulty: string) => {
      const colorMap: Record<string, string> = {
        easy: 'text-green-600 bg-green-50',
        medium: 'text-yellow-600 bg-yellow-50',
        hard: 'text-red-600 bg-red-50',
      };
      return colorMap[difficulty] || 'text-gray-600 bg-gray-50';
    },
    formatRewardXp: (xp: number) => `${xp} XP`,
    calculateQuestProgress: vi.fn(() => 75),
  };
});

describe('QuestCard', () => {
  const mockHandlers = {
    onViewDetails: vi.fn(),
    onStart: vi.fn(),
    onEdit: vi.fn(),
    onCancel: vi.fn(),
    onFail: vi.fn(),
    onDelete: vi.fn(),
  };

  const baseQuest: Quest = {
    id: 'quest-1',
    userId: 'user-1',
    title: 'Test Quest',
    description: 'A test quest description',
    difficulty: 'medium',
    rewardXp: 100,
    status: 'draft',
    category: 'Work',
    tags: ['test', 'example'],
    privacy: 'private',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    kind: 'linked',
    linkedGoalIds: ['goal-1'],
    linkedTaskIds: ['task-1'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders quest title and status', () => {
      render(<QuestCard quest={baseQuest} {...mockHandlers} />);
      
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('renders quest description when provided', () => {
      render(<QuestCard quest={baseQuest} {...mockHandlers} />);
      
      expect(screen.getByText('A test quest description')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      const questWithoutDescription = { ...baseQuest, description: undefined };
      render(<QuestCard quest={questWithoutDescription} {...mockHandlers} />);
      
      expect(screen.queryByText('A test quest description')).not.toBeInTheDocument();
    });

    it('renders difficulty and reward XP badges', () => {
      render(<QuestCard quest={baseQuest} {...mockHandlers} />);
      
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('100 XP')).toBeInTheDocument();
    });

    it('renders category', () => {
      render(<QuestCard quest={baseQuest} {...mockHandlers} />);
      
      expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('renders progress for quantitative quests', () => {
      const quantitativeQuest = { ...baseQuest, kind: 'quantitative' as const };
      render(<QuestCard quest={quantitativeQuest} {...mockHandlers} />);
      
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('renders progress for linked quests', () => {
      render(<QuestCard quest={baseQuest} {...mockHandlers} />);
      
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Action Buttons - Draft Status', () => {
    it('renders correct buttons for draft status', () => {
      render(<QuestCard quest={baseQuest} {...mockHandlers} />);
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('calls correct handlers when draft buttons are clicked', () => {
      render(<QuestCard quest={baseQuest} {...mockHandlers} />);
      
      fireEvent.click(screen.getByText('Edit'));
      expect(mockHandlers.onEdit).toHaveBeenCalledWith('quest-1');
      
      fireEvent.click(screen.getByText('Start'));
      expect(mockHandlers.onStart).toHaveBeenCalledWith('quest-1');
      
      fireEvent.click(screen.getByText('Delete'));
      expect(mockHandlers.onDelete).toHaveBeenCalledWith('quest-1');
    });
  });

  describe('Action Buttons - Active Status', () => {
    it('renders correct buttons for active status', () => {
      const activeQuest = { ...baseQuest, status: 'active' as const };
      render(<QuestCard quest={activeQuest} {...mockHandlers} />);
      
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Fail')).toBeInTheDocument();
    });

    it('calls correct handlers when active buttons are clicked', () => {
      const activeQuest = { ...baseQuest, status: 'active' as const };
      render(<QuestCard quest={activeQuest} {...mockHandlers} />);
      
      fireEvent.click(screen.getByText('View'));
      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith('quest-1');
      
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockHandlers.onCancel).toHaveBeenCalledWith('quest-1');
      
      fireEvent.click(screen.getByText('Fail'));
      expect(mockHandlers.onFail).toHaveBeenCalledWith('quest-1');
    });
  });

  describe('Action Buttons - Completed Status', () => {
    it('renders only view button for completed status', () => {
      const completedQuest = { ...baseQuest, status: 'completed' as const };
      render(<QuestCard quest={completedQuest} {...mockHandlers} />);
      
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Fail')).not.toBeInTheDocument();
    });

    it('calls onViewDetails when view button is clicked for completed quest', () => {
      const completedQuest = { ...baseQuest, status: 'completed' as const };
      render(<QuestCard quest={completedQuest} {...mockHandlers} />);
      
      fireEvent.click(screen.getByText('View'));
      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith('quest-1');
    });
  });

  describe('Action Buttons - Cancelled Status', () => {
    it('renders only view button for cancelled status', () => {
      const cancelledQuest = { ...baseQuest, status: 'cancelled' as const };
      render(<QuestCard quest={cancelledQuest} {...mockHandlers} />);
      
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons - Failed Status', () => {
    it('renders only view button for failed status', () => {
      const failedQuest = { ...baseQuest, status: 'failed' as const };
      render(<QuestCard quest={failedQuest} {...mockHandlers} />);
      
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Different Quest Types', () => {
    it('renders quantitative quest correctly', () => {
      const quantitativeQuest = {
        ...baseQuest,
        kind: 'quantitative' as const,
        targetCount: 10,
        countScope: 'any' as const,
        startAt: Date.now(),
        periodSeconds: 86400,
      };
      render(<QuestCard quest={quantitativeQuest} {...mockHandlers} />);
      
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('renders linked quest correctly', () => {
      render(<QuestCard quest={baseQuest} {...mockHandlers} />);
      
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles unknown status gracefully', () => {
      const unknownStatusQuest = { ...baseQuest, status: 'unknown' as any };
      render(<QuestCard quest={unknownStatusQuest} {...mockHandlers} />);
      
      // Should not crash and should not render any action buttons
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
      expect(screen.queryByText('View')).not.toBeInTheDocument();
    });

    it('handles quest without description', () => {
      const questWithoutDescription = { ...baseQuest, description: undefined };
      render(<QuestCard quest={questWithoutDescription} {...mockHandlers} />);
      
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.queryByText('A test quest description')).not.toBeInTheDocument();
    });

    it('handles quest with empty description', () => {
      const questWithEmptyDescription = { ...baseQuest, description: '' };
      render(<QuestCard quest={questWithEmptyDescription} {...mockHandlers} />);
      
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.queryByText('A test quest description')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<QuestCard quest={baseQuest} {...mockHandlers} />);
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Test Quest');
    });

    it('has accessible button labels', () => {
      render(<QuestCard quest={baseQuest} {...mockHandlers} />);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      const startButton = screen.getByRole('button', { name: /start/i });
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      
      expect(editButton).toBeInTheDocument();
      expect(startButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });
  });
});
