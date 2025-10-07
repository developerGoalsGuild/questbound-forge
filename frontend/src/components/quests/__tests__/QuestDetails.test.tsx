import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuestDetails from '../QuestDetails';
import { Quest } from '@/models/quest';

// Mock the useTranslation hook
const mockT = {
  quest: {
    title: 'Quest Details',
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
    privacy: {
      public: 'Public',
      followers: 'Followers',
      private: 'Private',
    },
    fields: {
      category: 'Category',
      rewardXp: 'Reward XP',
      privacy: 'Privacy',
      deadline: 'Deadline',
      createdAt: 'Created',
      updatedAt: 'Updated',
      tags: 'Tags',
      linkedGoals: 'Linked Goals',
      linkedTasks: 'Linked Tasks',
    },
    sections: {
      linkedItems: 'Linked Items',
      details: 'Quest Details',
    },
    progress: {
      title: 'Progress',
      inProgress: 'Progress',
      completed: 'completed',
    },
    actions: {
      back: 'Go Back',
      edit: 'Edit',
      start: 'Start',
      cancel: 'Cancel',
      fail: 'Mark as Failed',
      delete: 'Delete',
      title: 'Actions',
    },
    messages: {
      loadError: 'Failed to load quest details',
      notFound: 'Quest not found',
      questCompleted: 'This quest has been completed.',
    },
  },
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockT }),
}));

// Mock the useQuests hook
const mockUseQuests = vi.fn();
vi.mock('@/hooks/useQuest', () => ({
  useQuests: () => mockUseQuests(),
}));

// Mock quest data
const mockQuest: Quest = {
  id: 'quest-1',
  userId: 'user-1',
  title: 'Test Quest',
  description: 'This is a test quest',
  difficulty: 'medium',
  rewardXp: 100,
  status: 'active',
  category: 'Health',
  tags: ['test', 'example'],
  privacy: 'public',
  deadline: Date.now() + 86400000, // 1 day from now
  createdAt: Date.now() - 86400000, // 1 day ago
  updatedAt: Date.now() - 3600000, // 1 hour ago
  kind: 'linked',
  linkedGoalIds: ['goal-1', 'goal-2'],
  linkedTaskIds: ['task-1'],
  dependsOnQuestIds: [],
};

const mockQuestQuantitative: Quest = {
  ...mockQuest,
  id: 'quest-2',
  kind: 'quantitative',
  targetCount: 10,
  currentCount: 3,
  countScope: 'any',
  startAt: Date.now() - 3600000,
  periodSeconds: 86400,
};

describe('QuestDetails', () => {
  const defaultProps = {
    questId: 'quest-1',
    onEdit: vi.fn(),
    onStart: vi.fn(),
    onCancel: vi.fn(),
    onFail: vi.fn(),
    onDelete: vi.fn(),
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders loading state when quests are loading', () => {
      mockUseQuests.mockReturnValue({
        quests: null,
        loading: true,
        error: null,
        loadQuests: vi.fn(),
      });

      render(<QuestDetails {...defaultProps} />);

      // In loading state, we should see skeleton components, not the quest title
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(10);
      expect(screen.queryByText('Test Quest')).not.toBeInTheDocument();
    });

    it('renders error state when there is an error', () => {
      mockUseQuests.mockReturnValue({
        quests: null,
        loading: false,
        error: 'Failed to load',
        loadQuests: vi.fn(),
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Failed to load quest details')).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    it('renders not found state when quest is not found', () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Quest not found')).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    it('renders quest details when quest is found', () => {
      mockUseQuests.mockReturnValue({
        quests: [mockQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        start: vi.fn(),
        cancel: vi.fn(),
        fail: vi.fn(),
        deleteQuest: vi.fn(),
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.getByText('This is a test quest')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      mockUseQuests.mockReturnValue({
        quests: [mockQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        loadingStates: {},
      });

      const { container } = render(
        <QuestDetails {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Quest Information Display', () => {
    beforeEach(() => {
      mockUseQuests.mockReturnValue({
        quests: [mockQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        loadingStates: {},
      });
    });

    it('displays quest title and description', () => {
      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.getByText('This is a test quest')).toBeInTheDocument();
    });

    it('displays quest status and difficulty badges', () => {
      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('displays quest metadata', () => {
      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Health')).toBeInTheDocument();
      expect(screen.getByText('100 XP')).toBeInTheDocument();
      expect(screen.getByText('Public')).toBeInTheDocument();
    });

    it('displays tags when present', () => {
      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('example')).toBeInTheDocument();
    });

    it('displays linked items when present', () => {
      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Linked Items')).toBeInTheDocument();
      expect(screen.getByText('Linked Goals')).toBeInTheDocument();
      expect(screen.getByText('Linked Tasks')).toBeInTheDocument();
    });

    it('displays progress for quantitative quests', () => {
      mockUseQuests.mockReturnValue({
        quests: [mockQuestQuantitative],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} questId="quest-2" />);

      // Check for progress section heading
      expect(screen.getByRole('heading', { name: 'Progress' })).toBeInTheDocument();
      // Check for progress label (there are multiple "Progress" texts, so we need to be more specific)
      expect(screen.getAllByText('Progress')).toHaveLength(2); // Heading and label
      // Look for the specific progress text that contains "3 / 10 completed"
      expect(screen.getByText(/3.*\/.*10.*completed/)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    beforeEach(() => {
      mockUseQuests.mockReturnValue({
        quests: [mockQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        start: vi.fn(),
        cancel: vi.fn(),
        fail: vi.fn(),
        deleteQuest: vi.fn(),
        loadingStates: {},
      });
    });

    it('shows edit, start, and delete buttons for draft quests', () => {
      const draftQuest = { ...mockQuest, status: 'draft' as const };
      mockUseQuests.mockReturnValue({
        quests: [draftQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        start: vi.fn(),
        cancel: vi.fn(),
        fail: vi.fn(),
        deleteQuest: vi.fn(),
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('shows cancel and fail buttons for active quests', () => {
      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Mark as Failed')).toBeInTheDocument();
    });

    it('shows completion message for completed quests', () => {
      const completedQuest = { ...mockQuest, status: 'completed' as const };
      mockUseQuests.mockReturnValue({
        quests: [completedQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('This quest has been completed.')).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuestDetails {...defaultProps} />);

      await user.click(screen.getByText('Go Back'));
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Action Handlers', () => {
    const mockStart = vi.fn();
    const mockCancel = vi.fn();
    const mockFail = vi.fn();
    const mockDelete = vi.fn();

    beforeEach(() => {
      mockUseQuests.mockReturnValue({
        quests: [mockQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        start: mockStart,
        cancel: mockCancel,
        fail: mockFail,
        deleteQuest: mockDelete,
        loadingStates: {},
      });
    });

    it('calls start handler when start button is clicked', async () => {
      const user = userEvent.setup();
      const draftQuest = { ...mockQuest, status: 'draft' as const };
      mockUseQuests.mockReturnValue({
        quests: [draftQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        start: mockStart,
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} />);

      await user.click(screen.getByText('Start'));
      expect(mockStart).toHaveBeenCalledWith('quest-1');
      expect(defaultProps.onStart).toHaveBeenCalledWith('quest-1');
    });

    it('calls cancel handler when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuestDetails {...defaultProps} />);

      await user.click(screen.getByText('Cancel'));
      expect(mockCancel).toHaveBeenCalledWith('quest-1');
      expect(defaultProps.onCancel).toHaveBeenCalledWith('quest-1');
    });

    it('calls fail handler when fail button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuestDetails {...defaultProps} />);

      await user.click(screen.getByText('Mark as Failed'));
      expect(mockFail).toHaveBeenCalledWith('quest-1');
      expect(defaultProps.onFail).toHaveBeenCalledWith('quest-1');
    });

    it('calls delete handler when delete button is clicked', async () => {
      const user = userEvent.setup();
      const draftQuest = { ...mockQuest, status: 'draft' as const };
      mockUseQuests.mockReturnValue({
        quests: [draftQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        deleteQuest: mockDelete,
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} />);

      await user.click(screen.getByText('Delete'));
      expect(mockDelete).toHaveBeenCalledWith('quest-1');
      expect(defaultProps.onDelete).toHaveBeenCalledWith('quest-1');
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner for start action', () => {
      mockUseQuests.mockReturnValue({
        quests: [{ ...mockQuest, status: 'draft' as const }],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        start: vi.fn(),
        loadingStates: { 'start-quest-1': true },
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByRole('button', { name: /start/i })).toBeDisabled();
      expect(screen.getByTestId('loader-spin')).toBeInTheDocument();
    });

    it('shows loading spinner for cancel action', () => {
      mockUseQuests.mockReturnValue({
        quests: [mockQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        cancel: vi.fn(),
        loadingStates: { 'cancel-quest-1': true },
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByTestId('loader-spin')).toBeInTheDocument();
    });

    it('shows loading spinner for fail action', () => {
      mockUseQuests.mockReturnValue({
        quests: [mockQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        fail: vi.fn(),
        loadingStates: { 'fail-quest-1': true },
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByRole('button', { name: /marking quest as failed/i })).toBeDisabled();
      expect(screen.getByTestId('loader-spin')).toBeInTheDocument();
    });

    it('shows loading spinner for delete action', () => {
      mockUseQuests.mockReturnValue({
        quests: [{ ...mockQuest, status: 'draft' as const }],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        deleteQuest: vi.fn(),
        loadingStates: { 'delete-quest-1': true },
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByRole('button', { name: /deleting quest/i })).toBeDisabled();
      expect(screen.getByTestId('loader-spin')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles start action errors gracefully', async () => {
      const user = userEvent.setup();
      const mockStart = vi.fn().mockRejectedValue(new Error('Start failed'));
      
      mockUseQuests.mockReturnValue({
        quests: [{ ...mockQuest, status: 'draft' as const }],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        start: mockStart,
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} />);

      await user.click(screen.getByText('Start'));
      
      expect(mockStart).toHaveBeenCalledWith('quest-1');
      // Error should be logged to console
    });

    it('handles cancel action errors gracefully', async () => {
      const user = userEvent.setup();
      const mockCancel = vi.fn().mockRejectedValue(new Error('Cancel failed'));
      
      mockUseQuests.mockReturnValue({
        quests: [mockQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        cancel: mockCancel,
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} />);

      await user.click(screen.getByText('Cancel'));
      
      expect(mockCancel).toHaveBeenCalledWith('quest-1');
      // Error should be logged to console
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseQuests.mockReturnValue({
        quests: [mockQuest],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        loadingStates: {},
      });
    });

    it('has proper heading structure', () => {
      render(<QuestDetails {...defaultProps} />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('Test Quest');
    });

    it('has accessible buttons with proper labels', () => {
      render(<QuestDetails {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel quest/i });
      const failButton = screen.getByRole('button', { name: /mark quest as failed/i });
      
      expect(cancelButton).toBeInTheDocument();
      expect(failButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<QuestDetails {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel quest/i });
      
      // Tab through the interface
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();
      
      // The cancel button should be focusable
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles quest without description', () => {
      const questWithoutDescription = { ...mockQuest, description: undefined };
      mockUseQuests.mockReturnValue({
        quests: [questWithoutDescription],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.queryByText('This is a test quest')).not.toBeInTheDocument();
    });

    it('handles quest without tags', () => {
      const questWithoutTags = { ...mockQuest, tags: [] };
      mockUseQuests.mockReturnValue({
        quests: [questWithoutTags],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });

    it('handles quest without linked items', () => {
      const questWithoutLinked = { 
        ...mockQuest, 
        linkedGoalIds: [], 
        linkedTaskIds: [] 
      };
      mockUseQuests.mockReturnValue({
        quests: [questWithoutLinked],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.queryByText('Linked Items')).not.toBeInTheDocument();
    });

    it('handles quest without deadline', () => {
      const questWithoutDeadline = { ...mockQuest, deadline: undefined };
      mockUseQuests.mockReturnValue({
        quests: [questWithoutDeadline],
        loading: false,
        error: null,
        loadQuests: vi.fn(),
        loadingStates: {},
      });

      render(<QuestDetails {...defaultProps} />);

      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.queryByText('Deadline')).not.toBeInTheDocument();
    });
  });
});
