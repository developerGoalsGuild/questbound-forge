/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SolutionIntro from '../SolutionIntro';

// Mock translation hook
const mockTranslation = {
  solutionIntro: {
    title: 'Here\'s What Changed Everything',
    subtitle: 'What if you never had to achieve your goals alone again?',
    paragraph1: 'GoalsGuild is the first platform designed around the truth that humans achieve more together than alone.',
    paragraph2: 'Imagine having a community of people who actually get it - who celebrate your wins, help you through setbacks.',
  },
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: mockTranslation,
  }),
}));

describe('SolutionIntro', () => {
  test('renders solution intro section with title', () => {
    render(<SolutionIntro />);

    const section = screen.getByRole('region');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-labelledby', 'solution-title');

    expect(screen.getByText('Here\'s What Changed Everything')).toBeInTheDocument();
  });

  test('renders subtitle', () => {
    render(<SolutionIntro />);

    expect(screen.getByText('What if you never had to achieve your goals alone again?')).toBeInTheDocument();
  });

  test('renders solution paragraphs', () => {
    render(<SolutionIntro />);

    expect(screen.getByText(/GoalsGuild is the first platform/)).toBeInTheDocument();
    expect(screen.getByText(/Imagine having a community/)).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<SolutionIntro />);

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'solution-title');

    const title = screen.getByText('Here\'s What Changed Everything');
    expect(title).toHaveAttribute('id', 'solution-title');
  });

  test('has proper styling classes', () => {
    render(<SolutionIntro />);

    const section = screen.getByRole('region');
    expect(section).toHaveClass('py-24', 'spacing-medieval', 'bg-background');
  });
});
