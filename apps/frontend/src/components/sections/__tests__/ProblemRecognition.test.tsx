/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ProblemRecognition from '../ProblemRecognition';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, style }: any) => (
    <div data-testid="card" className={className} style={style}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>
}));

// Mock translation hook
const mockTranslation = {
  problemRecognition: {
    title: 'Does This Sound Like You?',
    scenarios: {
      loseSteam: {
        title: 'You Set Goals But Lose Steam',
        description: 'You get excited about a new goal, make a plan, but after a few weeks you\'re back to your old habits.',
      },
      goingAlone: {
        title: 'You\'re Going It Alone',
        description: 'Your friends don\'t share your goals or understand your struggles.',
      },
      overwhelmed: {
        title: 'You Feel Overwhelmed',
        description: 'You have big dreams but no idea how to break them down.',
      },
      lackAccountability: {
        title: 'You Lack Accountability',
        description: 'You know what you need to do, but there\'s no one holding you accountable.',
      },
      perfectionism: {
        title: 'You\'re Stuck in Perfectionism',
        description: 'You want everything to be perfect before you start, so you never actually begin.',
      },
      feelFailure: {
        title: 'You Feel Like a Failure',
        description: 'Every time you don\'t follow through, you feel like you\'re letting yourself down.',
      },
    },
    closing: {
      title: 'If you nodded "yes" to any of these, you\'re not alone.',
      description: 'Millions of people struggle with the same challenges.',
    },
  },
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: mockTranslation,
  }),
}));

describe('ProblemRecognition', () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
    } as any;
  });

  test('renders problem recognition section with title', () => {
    render(<ProblemRecognition />);

    const section = screen.getByRole('region');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('id', 'problem');
    expect(section).toHaveAttribute('aria-labelledby', 'problem-title');

    expect(screen.getByText('Does This Sound Like You?')).toBeInTheDocument();
  });

  test('renders all 6 problem scenarios', () => {
    render(<ProblemRecognition />);

    expect(screen.getByText('You Set Goals But Lose Steam')).toBeInTheDocument();
    expect(screen.getByText('You\'re Going It Alone')).toBeInTheDocument();
    expect(screen.getByText('You Feel Overwhelmed')).toBeInTheDocument();
    expect(screen.getByText('You Lack Accountability')).toBeInTheDocument();
    expect(screen.getByText('You\'re Stuck in Perfectionism')).toBeInTheDocument();
    expect(screen.getByText('You Feel Like a Failure')).toBeInTheDocument();
  });

  test('renders scenario icons', () => {
    render(<ProblemRecognition />);

    const icons = screen.getAllByRole('img', { hidden: true });
    expect(icons.length).toBeGreaterThanOrEqual(6);
  });

  test('renders scenario descriptions', () => {
    render(<ProblemRecognition />);

    expect(screen.getByText(/You get excited about a new goal/)).toBeInTheDocument();
    expect(screen.getByText(/Your friends don't share your goals/)).toBeInTheDocument();
  });

  test('renders closing message', () => {
    render(<ProblemRecognition />);

    expect(screen.getByText(/If you nodded "yes" to any of these/)).toBeInTheDocument();
    expect(screen.getByText(/Millions of people struggle/)).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<ProblemRecognition />);

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'problem-title');

    const title = screen.getByText('Does This Sound Like You?');
    expect(title).toHaveAttribute('id', 'problem-title');
  });

  test('renders scenarios in grid layout', () => {
    render(<ProblemRecognition />);

    const cards = screen.getAllByTestId('card');
    expect(cards.length).toBe(7); // 6 scenarios + 1 closing message
  });

  test('scenarios have proper styling classes', () => {
    render(<ProblemRecognition />);

    const cards = screen.getAllByTestId('card');
    cards.forEach((card) => {
      expect(card).toHaveClass('problem-card', 'guild-card');
    });
  });
});
