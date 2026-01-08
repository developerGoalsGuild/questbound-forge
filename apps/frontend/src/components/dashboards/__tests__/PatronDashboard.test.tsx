/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import PatronDashboard from '../PatronDashboard';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: any) => <div data-testid="card-title" className={className}>{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className }: any) => (
    <button data-testid="button" className={className}>
      {children}
    </button>
  )
}));

vi.mock('lucide-react', () => ({
  Crown: () => <div data-testid="crown-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Gift: () => <div data-testid="gift-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Award: () => <div data-testid="award-icon" />
}));

// Mock hooks
const mockPatronData = {
  impact: {
    totalSupported: 127,
    goalsAchieved: 89,
    communityGrowth: 23,
    totalContributed: 2500
  },
  contributions: [
    {
      month: 'December 2024',
      amount: 50,
      impact: 3,
      status: 'processed'
    },
    {
      month: 'November 2024',
      amount: 45,
      impact: 2,
      status: 'pending'
    }
  ],
  benefits: [
    {
      name: 'Priority Support',
      unlocked: true,
      requirement: null
    },
    {
      name: 'Exclusive Content',
      unlocked: true,
      requirement: null
    },
    {
      name: 'Monthly Virtual Meetups',
      unlocked: false,
      requirement: '$100+ monthly contribution'
    }
  ],
  communityStats: {
    goalSuccessRate: 87,
    livesImpacted: 156,
    thankYouMessages: 23
  }
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      dashboard: {
        patron: {
          title: 'Patron Sanctuary',
          contributions: 'Contribution History',
          benefits: 'Patron Benefits',
          impact: 'Your Impact'
        }
      }
    }
  })
}));

vi.mock('@/hooks/usePatronData', () => ({
  usePatronData: () => ({
    data: mockPatronData,
    loading: false,
    error: null
  })
}));

describe.skip('PatronDashboard', () => {

  test('renders dashboard with patron data', () => {
    render(<PatronDashboard />);

    expect(screen.getByText('Patron Sanctuary')).toBeInTheDocument();
    expect(screen.getByText('Your noble support makes dreams reality')).toBeInTheDocument();

    // Impact metrics
    expect(screen.getByText('127')).toBeInTheDocument(); // Total supported
    expect(screen.getByText('89')).toBeInTheDocument(); // Goals achieved
    expect(screen.getByText('+23%')).toBeInTheDocument(); // Community growth
    expect(screen.getByText('$2500')).toBeInTheDocument(); // Total contributed

    // Contribution history
    expect(screen.getByText('Contribution History')).toBeInTheDocument();
    expect(screen.getByText('December 2024')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('November 2024')).toBeInTheDocument();
    expect(screen.getByText('$45')).toBeInTheDocument();
    expect(screen.getByText('Helped 3 adventurers achieve their goals')).toBeInTheDocument();
    expect(screen.getByText('Payment processed successfully')).toBeInTheDocument();
    expect(screen.getByText('Payment pending')).toBeInTheDocument();

    // Benefits
    expect(screen.getByText('Patron Benefits')).toBeInTheDocument();
    expect(screen.getByText('Priority Support')).toBeInTheDocument();
    expect(screen.getByText('Exclusive Content')).toBeInTheDocument();
    expect(screen.getByText('Monthly Virtual Meetups')).toBeInTheDocument();
    expect(screen.getByText('Requires: $100+ monthly contribution')).toBeInTheDocument();

    // Impact section
    expect(screen.getByText('Your Impact')).toBeInTheDocument();
    expect(screen.getByText("Success Story: Maria's Career Transformation")).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument(); // Goal success rate
    expect(screen.getByText('156')).toBeInTheDocument(); // Lives impacted
    expect(screen.getByText('23')).toBeInTheDocument(); // Thank you messages
  });

  test('displays unlocked benefits with checkmark', () => {
    render(<PatronDashboard />);

    // Should show checkmarks for unlocked benefits
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks).toHaveLength(2); // Priority Support and Exclusive Content
  });

  test('displays locked benefits with empty circle', () => {
    render(<PatronDashboard />);

    const emptyCircles = screen.getAllByText('○');
    expect(emptyCircles).toHaveLength(1); // Monthly Virtual Meetups
  });

  test('shows upgrade patronage button', () => {
    render(<PatronDashboard />);

    expect(screen.getByText('Upgrade Patronage')).toBeInTheDocument();
  });

  test('displays community impact statistics', () => {
    render(<PatronDashboard />);

    expect(screen.getByText('Goal Success Rate')).toBeInTheDocument();
    expect(screen.getByText('+12% vs last month')).toBeInTheDocument();
    expect(screen.getByText('Lives Impacted')).toBeInTheDocument();
    expect(screen.getByText('Through your patronage')).toBeInTheDocument();
    expect(screen.getByText('Thank You Messages')).toBeInTheDocument();
    expect(screen.getByText('From the community')).toBeInTheDocument();
  });

  test('displays success story with attribution', () => {
    render(<PatronDashboard />);

    expect(screen.getByText('Your contribution directly supported this achievement')).toBeInTheDocument();
  });

  test('renders payment status indicators with correct colors', () => {
    render(<PatronDashboard />);

    // Should have status indicators (dots) for each contribution
    const contributions = screen.getAllByText(/Payment (processed|pending)/);
    expect(contributions).toHaveLength(2);
  });

  test('formats currency values correctly', () => {
    render(<PatronDashboard />);

    expect(screen.getByText('$2500')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('$45')).toBeInTheDocument();
  });

  test('displays adventurer impact counts', () => {
    render(<PatronDashboard />);

    expect(screen.getByText('Helped 3 adventurers achieve their goals')).toBeInTheDocument();
    expect(screen.getByText('Helped 2 adventurers achieve their goals')).toBeInTheDocument();
  });
});
