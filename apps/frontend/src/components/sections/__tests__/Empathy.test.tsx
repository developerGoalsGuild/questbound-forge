/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Empathy from '../Empathy';

// Mock translation hook
const mockTranslation = {
  empathy: {
    title: 'We Get It',
    message: {
      paragraph1: 'We know how it feels to be excited about a goal, only to lose motivation when you\'re going it alone.',
      paragraph2: 'The truth is, humans weren\'t meant to achieve goals in isolation.',
    },
    stats: {
      giveUp: { label: 'of people give up on their goals within 3 months' },
      motivated: { label: 'feel more motivated when working with others' },
      accountability: { label: 'more likely to succeed with accountability' },
    },
  },
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
    t: mockTranslation,
  }),
}));

describe('Empathy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock IntersectionObserver: fire callback so component schedules setTimeouts (0, 200, 400ms)
    global.IntersectionObserver = class IntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
        setTimeout(() => {
          callback([{ isIntersecting: true, target: document.createElement('div') } as IntersectionObserverEntry], this);
        }, 0);
      }
    } as any;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders empathy section with title', () => {
    render(<Empathy />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const section = screen.getByRole('region');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-labelledby', 'empathy-title');

    expect(screen.getByText('We Get It')).toBeInTheDocument();
  });

  test('renders empathy message paragraphs', () => {
    render(<Empathy />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText(/We know how it feels to be excited/)).toBeInTheDocument();
    expect(screen.getByText(/The truth is, humans weren't meant/)).toBeInTheDocument();
  });

  test('renders all 3 statistics', async () => {
    render(<Empathy />);

    // Initially stats should be at 0
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
    expect(screen.getByText('0x')).toBeInTheDocument();

    // Flush timers so animation runs in test context (avoids window undefined in CI)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('3x')).toBeInTheDocument();
  });

  test('renders statistic labels', () => {
    render(<Empathy />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText(/of people give up on their goals within 3 months/)).toBeInTheDocument();
    expect(screen.getByText(/feel more motivated when working with others/)).toBeInTheDocument();
    expect(screen.getByText(/more likely to succeed with accountability/)).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<Empathy />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'empathy-title');

    const title = screen.getByText('We Get It');
    expect(title).toHaveAttribute('id', 'empathy-title');
  });

  test('renders statistics in grid layout', () => {
    render(<Empathy />);
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const stats = screen.getAllByText(/^(92%|78%|3x)$/);
    expect(stats.length).toBe(3);
  });
});
