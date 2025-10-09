import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QuestQuickActions } from '../QuestQuickActions';
import { Plus, Eye, Trophy, Activity } from 'lucide-react';

// Mock the hooks
const mockUseTranslation = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock translations
const mockTranslations = {
  quest: {
    dashboard: {
      quickActions: {
        title: 'Quick Actions',
        createQuest: 'Create Quest',
        viewAllQuests: 'View All',
        joinChallenges: 'Challenges',
        viewActivity: 'Activity',
      },
    },
  },
};

describe('QuestQuickActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: mockTranslations,
    });
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('renders all default action buttons', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Create Quest')).toBeInTheDocument();
      expect(screen.getByText('View All')).toBeInTheDocument();
      expect(screen.getByText('Challenges')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
    });

    it('renders custom title when provided', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions title="Custom Actions" />
        </BrowserRouter>
      );

      expect(screen.getByText('Custom Actions')).toBeInTheDocument();
    });

    it('hides title when showTitle is false', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions showTitle={false} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
      // But buttons should still be there
      expect(screen.getByText('Create Quest')).toBeInTheDocument();
    });

    it('renders custom actions when provided', () => {
      const customActions = [
        {
          id: 'create-quest',
          label: 'Custom Create',
          onClick: vi.fn(),
        },
        {
          id: 'view-all',
          label: 'Custom View',
          onClick: vi.fn(),
        },
      ];

      render(
        <BrowserRouter>
          <QuestQuickActions actions={customActions} />
        </BrowserRouter>
      );

      expect(screen.getByText('Custom Create')).toBeInTheDocument();
      expect(screen.getByText('Custom View')).toBeInTheDocument();
      // Default actions that weren't overridden should still appear
      expect(screen.getByText('Challenges')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
    });
  });

  describe('Action Button Functionality', () => {
    it('navigates to create quest page when create button is clicked', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      const createButton = screen.getByRole('button', { name: /create quest/i });
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests/create');
    });

    it('navigates to quests list when view all button is clicked', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      const viewAllButton = screen.getByRole('button', { name: 'View All' });
      fireEvent.click(viewAllButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests');
    });

    it('navigates to challenges page when challenges button is clicked', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      const challengesButton = screen.getByRole('button', { name: 'Challenges' });
      fireEvent.click(challengesButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests/challenges');
    });

    it('navigates to activity page when activity button is clicked', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      const activityButton = screen.getByRole('button', { name: 'Activity' });
      fireEvent.click(activityButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests/activity');
    });

    it('calls custom onClick handlers when provided', () => {
      const customOnClick = vi.fn();
      const customActions = [
        {
          id: 'create-quest',
          label: 'Custom Create',
          ariaLabel: 'Custom Create Action',
          onClick: customOnClick,
        },
      ];

      render(
        <BrowserRouter>
          <QuestQuickActions actions={customActions} />
        </BrowserRouter>
      );

      const customButton = screen.getByRole('button', { name: 'Custom Create Action' });
      fireEvent.click(customButton);

      expect(customOnClick).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on all buttons', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('has aria-hidden on icons', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('has proper button roles', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // 4 action buttons
    });
  });

  describe('Responsive Design', () => {
    it('uses mobile-first grid classes', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      const gridContainer = document.querySelector('.grid-cols-2.md\\:grid-cols-4');
      expect(gridContainer).toBeInTheDocument();
    });

    it('has consistent button heights', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('h-20');
      });
    });

    it('has proper button layout with icons and text', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('flex', 'flex-col', 'items-center', 'gap-2');
      });
    });
  });

  describe('Translation Integration', () => {
    it('uses translation hook correctly', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      expect(mockUseTranslation).toHaveBeenCalled();
    });

    it('displays translated text with fallbacks', () => {
      // Test with missing translations
      mockUseTranslation.mockReturnValue({
        t: {
          quest: {},
        },
      });

      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      // Should show fallback text
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Create Quest')).toBeInTheDocument();
    });

    it('uses custom action labels when provided', () => {
      mockUseTranslation.mockReturnValue({
        t: mockTranslations,
      });

      const customActions = [
        {
          id: 'create-quest',
          label: 'Custom Label',
          ariaLabel: 'Custom Label Action',
          onClick: vi.fn(),
        },
      ];

      render(
        <BrowserRouter>
          <QuestQuickActions actions={customActions} />
        </BrowserRouter>
      );

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom Label Action' })).toBeInTheDocument();
    });
  });

  describe('Custom Actions', () => {
    it('merges custom actions with defaults correctly', () => {
      const customActions = [
        {
          id: 'create-quest',
          label: 'Custom Create',
          ariaLabel: 'Custom Create Button',
          variant: 'secondary' as const,
        },
        {
          id: 'view-all',
          ariaLabel: 'Custom View Button',
        },
      ];

      render(
        <BrowserRouter>
          <QuestQuickActions actions={customActions} />
        </BrowserRouter>
      );

      // Custom label should be used
      expect(screen.getByText('Custom Create')).toBeInTheDocument();

      // Custom aria-label should be used
      const createButton = screen.getByRole('button', { name: 'Custom Create Button' });
      expect(createButton).toBeInTheDocument();

      const viewButton = screen.getByRole('button', { name: 'Custom View Button' });
      expect(viewButton).toBeInTheDocument();

      // Other buttons should keep defaults
      expect(screen.getByText('Challenges')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
    });

    it('handles partial custom action overrides', () => {
      const customActions = [
        {
          id: 'create-quest',
          onClick: vi.fn(), // Only override onClick
        },
      ];

      render(
        <BrowserRouter>
          <QuestQuickActions actions={customActions} />
        </BrowserRouter>
      );

      // Should still have default label
      expect(screen.getByText('Create Quest')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('applies custom className', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions className="custom-class" />
        </BrowserRouter>
      );

      const card = screen.getByText('Quick Actions').closest('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('has proper card structure', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      // Should be wrapped in a Card component
      const card = document.querySelector('[class*="rounded-lg border"]');
      expect(card).toBeInTheDocument();
    });

    it('has consistent icon sizing', () => {
      render(
        <BrowserRouter>
          <QuestQuickActions />
        </BrowserRouter>
      );

      const icons = document.querySelectorAll('.h-6.w-6');
      expect(icons.length).toBe(4); // 4 icons
    });
  });
});
