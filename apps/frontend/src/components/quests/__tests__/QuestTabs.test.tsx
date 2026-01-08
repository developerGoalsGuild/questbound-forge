import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestTabs, QuestTabType } from '../QuestTabs';

// Mock the hooks
const mockUseTranslation = vi.fn();

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

// Mock translations
const mockTranslations = {
  quest: {
    dashboard: {
      tabs: {
        title: 'Quest Overview',
        myQuests: 'My Quests',
        followingQuests: 'Following',
        comingSoon: 'Quest tabs coming soon...',
      },
    },
  },
};

describe('QuestTabs', () => {
  const mockMyContent = <div data-testid="my-content">My Quests Content</div>;
  const mockFollowingContent = <div data-testid="following-content">Following Quests Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: mockTranslations,
    });
  });

  describe('Rendering', () => {
    it('renders tabs with default content', () => {
      render(
        <QuestTabs
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      expect(screen.getByText('Quest Overview')).toBeInTheDocument();
      expect(screen.getByText('My Quests')).toBeInTheDocument();
      expect(screen.getByText('Following')).toBeInTheDocument();
    });

    it('renders custom title when provided', () => {
      render(
        <QuestTabs
          title="Custom Tabs"
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      expect(screen.getByText('Custom Tabs')).toBeInTheDocument();
    });

    it('hides title when showTitle is false', () => {
      render(
        <QuestTabs
          showTitle={false}
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      expect(screen.queryByText('Quest Overview')).not.toBeInTheDocument();
      expect(screen.getByText('My Quests')).toBeInTheDocument(); // Tabs still show
    });

    it('shows my quests content by default', () => {
      render(
        <QuestTabs
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      expect(screen.getByTestId('my-content')).toBeInTheDocument();
      expect(screen.queryByTestId('following-content')).not.toBeInTheDocument();
    });

    it('shows following quests content when defaultTab is set', () => {
      render(
        <QuestTabs
          defaultTab="following"
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      // With Radix UI, only the active tab content is rendered
      expect(screen.queryByTestId('my-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('following-content')).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('can click on different tabs', () => {
      render(
        <QuestTabs
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      const followingTab = screen.getByRole('tab', { name: 'Following' });
      const myTab = screen.getByRole('tab', { name: 'My Quests' });

      // Should be able to click tabs without errors
      fireEvent.click(followingTab);
      fireEvent.click(myTab);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes on tabs', () => {
      render(
        <QuestTabs
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveAttribute('aria-label', 'Quest Overview');

      const myTab = screen.getByRole('tab', { name: 'My Quests' });
      const followingTab = screen.getByRole('tab', { name: 'Following' });

      // Radix UI manages aria-selected internally
      expect(myTab).toHaveAttribute('aria-controls');
      expect(followingTab).toHaveAttribute('aria-controls');
    });

    it('has proper ARIA attributes on active tab panel', () => {
      render(
        <QuestTabs
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby');
    });

    it('has proper heading structure', () => {
      render(
        <QuestTabs
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Quest Overview');
    });
  });

  describe('Styling and Layout', () => {
    it('applies custom className', () => {
      render(
        <QuestTabs
          className="custom-class"
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      const card = screen.getByText('Quest Overview').closest('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('uses proper grid layout for tabs', () => {
      render(
        <QuestTabs
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveClass('grid', 'w-full', 'grid-cols-3');
    });

    it('has consistent spacing', () => {
      render(
        <QuestTabs
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      const tabContent = screen.getByRole('tabpanel');
      expect(tabContent).toHaveClass('mt-6');
    });
  });

  describe('Translation Integration', () => {
    it('uses translation hook correctly', () => {
      render(
        <QuestTabs
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
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
        <QuestTabs
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      // Should show fallback text
      expect(screen.getByText('Quest Overview')).toBeInTheDocument();
      expect(screen.getByText('My Quests')).toBeInTheDocument();
      expect(screen.getByText('Following')).toBeInTheDocument();
    });

    it('uses custom title translation', () => {
      mockUseTranslation.mockReturnValue({
        t: mockTranslations,
      });

      render(
        <QuestTabs
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      expect(screen.getByText('Quest Overview')).toBeInTheDocument();
      expect(screen.getByText('My Quests')).toBeInTheDocument();
      expect(screen.getByText('Following')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('respects defaultTab prop', () => {
      render(
        <QuestTabs
          defaultTab="following"
          myQuestsContent={mockMyContent}
          followingQuestsContent={mockFollowingContent}
        />
      );

      const followingTab = screen.getByRole('tab', { name: 'Following' });
      expect(followingTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Content Rendering', () => {
    it('renders complex content in tabs', () => {
      const complexMyContent = (
        <div>
          <h4>My Complex Content</h4>
          <p>Some description</p>
          <button>Action Button</button>
        </div>
      );

      const complexFollowingContent = (
        <div>
          <h4>Following Complex Content</h4>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      );

      render(
        <QuestTabs
          myQuestsContent={complexMyContent}
          followingQuestsContent={complexFollowingContent}
        />
      );

      expect(screen.getByText('My Complex Content')).toBeInTheDocument();
      expect(screen.getByText('Some description')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('handles empty content gracefully', () => {
      render(
        <QuestTabs
          myQuestsContent={null}
          followingQuestsContent={<div>Following Content</div>}
        />
      );

      // Should not crash
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });
});
