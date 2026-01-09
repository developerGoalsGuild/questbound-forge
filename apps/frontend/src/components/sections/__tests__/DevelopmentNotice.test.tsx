/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import DevelopmentNotice from '../DevelopmentNotice';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Layers: () => <div data-testid="layers-icon" />,
}));

// Mock translation hook
const mockTranslation = {
  developmentNotice: {
    title: 'Platform in Development',
    message: 'The features described on this page are currently in development and may change before the final product launch.',
  },
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: mockTranslation,
  }),
}));

describe('DevelopmentNotice', () => {
  test('renders development notice section', () => {
    render(<DevelopmentNotice />);

    const section = screen.getByRole('region');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-labelledby', 'development-notice-title');
  });

  test('renders notice title', () => {
    render(<DevelopmentNotice />);

    expect(screen.getByText('Platform in Development')).toBeInTheDocument();
  });

  test('renders notice message', () => {
    render(<DevelopmentNotice />);

    expect(screen.getByText(/The features described on this page are currently in development/)).toBeInTheDocument();
  });

  test('renders icon', () => {
    render(<DevelopmentNotice />);

    expect(screen.getByTestId('layers-icon')).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<DevelopmentNotice />);

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'development-notice-title');

    const title = screen.getByText('Platform in Development');
    expect(title).toHaveAttribute('id', 'development-notice-title');
  });

  test('has proper styling classes', () => {
    render(<DevelopmentNotice />);

    const section = screen.getByRole('region');
    expect(section).toHaveClass('py-12', 'spacing-medieval', 'bg-muted/50');
  });
});
