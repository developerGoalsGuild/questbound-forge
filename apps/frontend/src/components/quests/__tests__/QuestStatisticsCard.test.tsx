import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestStatisticsCard } from '../QuestStatisticsCard';
import { Trophy, Target, TrendingUp } from 'lucide-react';

describe('QuestStatisticsCard', () => {
  const defaultProps = {
    title: 'Total Quests',
    value: 25,
    icon: Trophy,
  };

  describe('Rendering', () => {
    it('renders title and value correctly', () => {
      render(<QuestStatisticsCard {...defaultProps} />);

      expect(screen.getByText('Total Quests')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('renders icon with correct styling', () => {
      render(<QuestStatisticsCard {...defaultProps} />);

      const icon = document.querySelector('.text-primary');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('h-6', 'w-6');
    });

    it('renders description when provided', () => {
      render(
        <QuestStatisticsCard
          {...defaultProps}
          description="Created in the last 30 days"
        />
      );

      expect(screen.getByText('Created in the last 30 days')).toBeInTheDocument();
    });

    it('renders trend information when provided', () => {
      render(
        <QuestStatisticsCard
          {...defaultProps}
          trend={{
            value: 15,
            label: 'from last week',
            isPositive: true,
          }}
        />
      );

      expect(screen.getByText('+15% from last week')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <QuestStatisticsCard
          {...defaultProps}
          className="custom-class"
        />
      );

      const card = screen.getByText('Total Quests').closest('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('renders string values correctly', () => {
      render(
        <QuestStatisticsCard
          {...defaultProps}
          value="5.2 days"
        />
      );

      expect(screen.getByText('5.2 days')).toBeInTheDocument();
    });
  });

  describe('Trend Display', () => {
    it('shows positive trend with green color', () => {
      render(
        <QuestStatisticsCard
          {...defaultProps}
          trend={{
            value: 10,
            label: 'increase',
            isPositive: true,
          }}
        />
      );

      const trendElement = screen.getByText('+10% increase');
      expect(trendElement).toHaveClass('text-green-600');
    });

    it('shows negative trend with red color', () => {
      render(
        <QuestStatisticsCard
          {...defaultProps}
          trend={{
            value: -5,
            label: 'decrease',
            isPositive: false,
          }}
        />
      );

      const trendElement = screen.getByText('-5% decrease');
      expect(trendElement).toHaveClass('text-red-600');
    });

    it('includes aria-label for trend information', () => {
      render(
        <QuestStatisticsCard
          {...defaultProps}
          trend={{
            value: 20,
            label: 'from last month',
            isPositive: true,
          }}
        />
      );

      const trendElement = screen.getByLabelText('Trend: from last month');
      expect(trendElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-hidden on icon', () => {
      render(<QuestStatisticsCard {...defaultProps} />);

      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('has proper semantic structure', () => {
      render(<QuestStatisticsCard {...defaultProps} />);

      // Should be contained within a card structure
      const cardContent = document.querySelector('[class*="flex items-center"]');
      expect(cardContent).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies hover effects', () => {
      render(<QuestStatisticsCard {...defaultProps} />);

      // Find the Card component (the outermost element with hover effects)
      const card = document.querySelector('[class*="transition-all"]');
      expect(card).toHaveClass('transition-all', 'duration-200', 'hover:shadow-md');
    });

    it('has consistent height for grid alignment', () => {
      render(<QuestStatisticsCard {...defaultProps} />);

      const card = document.querySelector('[class*="h-full"]');
      expect(card).toBeInTheDocument();

      const cardContent = document.querySelector('[class*="h-full"]');
      expect(cardContent).toBeInTheDocument();
    });

    it('has consistent spacing and layout', () => {
      render(<QuestStatisticsCard {...defaultProps} />);

      const cardContent = document.querySelector('[class*="p-6"]');
      expect(cardContent).toBeInTheDocument();

      const iconContainer = document.querySelector('[class*="w-12 h-12"]');
      expect(iconContainer).toBeInTheDocument();

      // Check that icon container doesn't shrink
      expect(iconContainer).toHaveClass('flex-shrink-0');
    });

    it('centers content vertically', () => {
      render(<QuestStatisticsCard {...defaultProps} />);

      const contentContainer = document.querySelector('[class*="flex flex-col justify-center"]');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero values correctly', () => {
      render(
        <QuestStatisticsCard
          {...defaultProps}
          value={0}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles large numbers correctly', () => {
      render(
        <QuestStatisticsCard
          {...defaultProps}
          value={1000}
        />
      );

      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    it('handles empty description gracefully', () => {
      render(
        <QuestStatisticsCard
          {...defaultProps}
          description=""
        />
      );

      // Should not render description paragraph when description is empty
      const descriptionElement = document.querySelector('[class*="text-xs text-muted-foreground"]');
      expect(descriptionElement).toBeNull();
    });

    it('renders without trend information', () => {
      render(<QuestStatisticsCard {...defaultProps} />);

      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });
  });
});
