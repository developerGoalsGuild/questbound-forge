/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import HowItWorks from '../HowItWorks';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, style }: any) => (
    <div data-testid="card" className={className} style={style}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Target: () => <div data-testid="target-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
}));

// Mock translation hook
const mockTranslation = {
  howItWorks: {
    title: 'How GoalsGuild Works',
    subtitle: 'Six simple steps to transform your goal achievement',
    steps: {
      step1: {
        title: 'Share Your Goals',
        description: 'Tell us about your goals and what you\'re trying to achieve.',
      },
      step2: {
        title: 'Find Your People',
        description: 'We connect you with others who share similar goals.',
      },
      step3: {
        title: 'Achieve Together',
        description: 'Work with your community, track progress, celebrate wins.',
      },
      step4: {
        title: 'Get Matched Intelligently',
        description: 'Our AI analyzes your goals to connect you with the perfect partners.',
      },
      step5: {
        title: 'Stay Motivated & Engaged',
        description: 'Earn points, unlock achievements, and participate in challenges.',
      },
      step6: {
        title: 'Celebrate Your Success',
        description: 'Share your wins with a community that truly understands.',
      },
    },
  },
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: mockTranslation,
  }),
}));

describe('HowItWorks', () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
    } as any;
  });

  test('renders how it works section with title', () => {
    render(<HowItWorks />);

    const section = screen.getByRole('region');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('id', 'how-it-works');
    expect(section).toHaveAttribute('aria-labelledby', 'how-it-works-title');

    expect(screen.getByText('How GoalsGuild Works')).toBeInTheDocument();
    expect(screen.getByText('Six simple steps to transform your goal achievement')).toBeInTheDocument();
  });

  test('renders all 6 steps', () => {
    render(<HowItWorks />);

    expect(screen.getByText('Share Your Goals')).toBeInTheDocument();
    expect(screen.getByText('Find Your People')).toBeInTheDocument();
    expect(screen.getByText('Achieve Together')).toBeInTheDocument();
    expect(screen.getByText('Get Matched Intelligently')).toBeInTheDocument();
    expect(screen.getByText('Stay Motivated & Engaged')).toBeInTheDocument();
    expect(screen.getByText('Celebrate Your Success')).toBeInTheDocument();
  });

  test('renders step numbers', () => {
    render(<HowItWorks />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  test('renders step icons', () => {
    render(<HowItWorks />);

    expect(screen.getByTestId('target-icon')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
  });

  test('renders step descriptions', () => {
    render(<HowItWorks />);

    expect(screen.getByText(/Tell us about your goals/)).toBeInTheDocument();
    expect(screen.getByText(/We connect you with others/)).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<HowItWorks />);

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'how-it-works-title');
  });

  test('renders steps in grid layout', () => {
    render(<HowItWorks />);

    const cards = screen.getAllByTestId('card');
    expect(cards.length).toBe(6);
  });
});
