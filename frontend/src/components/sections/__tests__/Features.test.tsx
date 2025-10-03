/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Features from '../Features';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, style }: any) => (
    <div data-testid="card" className={className} style={style}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>
}));

vi.mock('lucide-react', () => ({
  Target: () => <div data-testid="target-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  Crown: () => <div data-testid="crown-icon" />
}));

// Mock the translation hook
const mockTranslation = {
  features: {
    title: 'Powerful Features for Goal Achievement',
    subtitle: 'Everything you need to turn your aspirations into achievements',
    goalTracking: {
      title: 'Advanced Goal Tracking',
      description: 'Track your progress with detailed analytics and milestone celebrations.'
    },
    community: {
      title: 'Community Support',
      description: 'Connect with like-minded adventurers for mutual encouragement and accountability.'
    },
    gamification: {
      title: 'Gamified Experience',
      description: 'Earn achievements, unlock rewards, and level up your goal-setting skills.'
    },
    patronage: {
      title: 'Patronage System',
      description: 'Support the platform and gain exclusive benefits while helping others succeed.'
    }
  }
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: mockTranslation
  })
}));

describe.skip('Features', () => {
  test('renders features section with header', () => {
    render(<Features />);

    const section = screen.getByRole('region'); // section element
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('id', 'features');

    expect(screen.getByText('Powerful Features for Goal Achievement')).toBeInTheDocument();
    expect(screen.getByText('Everything you need to turn your aspirations into achievements')).toBeInTheDocument();
  });

  test('renders all four feature cards', () => {
    render(<Features />);

    expect(screen.getByText('Advanced Goal Tracking')).toBeInTheDocument();
    expect(screen.getByText('Community Support')).toBeInTheDocument();
    expect(screen.getByText('Gamified Experience')).toBeInTheDocument();
    expect(screen.getByText('Patronage System')).toBeInTheDocument();
  });

  test('renders feature descriptions', () => {
    render(<Features />);

    expect(screen.getByText('Track your progress with detailed analytics and milestone celebrations.')).toBeInTheDocument();
    expect(screen.getByText('Connect with like-minded adventurers for mutual encouragement and accountability.')).toBeInTheDocument();
    expect(screen.getByText('Earn achievements, unlock rewards, and level up your goal-setting skills.')).toBeInTheDocument();
    expect(screen.getByText('Support the platform and gain exclusive benefits while helping others succeed.')).toBeInTheDocument();
  });

  test('renders feature icons', () => {
    render(<Features />);

    expect(screen.getByTestId('target-icon')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
    expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
  });

  test('renders call-to-action section', () => {
    render(<Features />);

    expect(screen.getByText('Ready to Begin Your Adventure?')).toBeInTheDocument();
    expect(screen.getByText('Join thousands of adventurers already achieving their goals together.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Your Journey' })).toBeInTheDocument();
  });

  test('features have staggered animation delays', () => {
    render(<Features />);

    const cards = screen.getAllByTestId('card');

    // Check animation delays (first card should have 0s delay, second 0.2s, etc.)
    expect(cards[0]).toHaveStyle({ animationDelay: '0s' });
    expect(cards[1]).toHaveStyle({ animationDelay: '0.2s' });
    expect(cards[2]).toHaveStyle({ animationDelay: '0.4s' });
    expect(cards[3].style.animationDelay).toMatch(/0\.6/);
  });

  test('cards have proper hover effects', () => {
    render(<Features />);

    const cards = screen.getAllByTestId('card');
    cards.forEach(card => {
      expect(card).toHaveClass('guild-card', 'group', 'overflow-hidden', 'hover:shadow-medieval', 'animate-scale-in');
    });
  });

  test('icons have gradient backgrounds', () => {
    render(<Features />);

    // Check that icon containers have gradient classes
    const iconContainers = screen.getAllByTestId('card-content').map(content =>
      content.querySelector('.inline-flex')
    ).filter(Boolean);

    expect(iconContainers).toHaveLength(4);
    // The gradients are applied via className in the component
  });

  test('renders with proper responsive grid layout', () => {
    render(<Features />);

    const grid = screen.getByTestId('features-section').querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-2', 'gap-8');
  });

  test('section has proper id for navigation', () => {
    render(<Features />);

    const section = screen.getByTestId('features-section');
    expect(section).toHaveAttribute('id', 'features');
  });

  test('call-to-action button has proper styling', () => {
    render(<Features />);

    const ctaButton = screen.getByRole('button', { name: 'Start Your Journey' });
    expect(ctaButton).toHaveClass('btn-heraldic', 'text-primary-foreground', 'px-8', 'py-3', 'rounded-lg', 'font-semibold', 'hover:shadow-royal', 'transition-all', 'duration-300');
  });

  test('medieval banner has proper styling for CTA section', () => {
    render(<Features />);

    const banner = screen.getByText('Ready to Begin Your Adventure?').closest('.medieval-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveClass('medieval-banner', 'p-8', 'max-w-2xl', 'mx-auto');
  });

  test('feature titles have proper styling', () => {
    render(<Features />);

    // Get only the feature card titles, not the CTA heading
    const featureTitles = [
      screen.getByText('Advanced Goal Tracking'),
      screen.getByText('Community Support'),
      screen.getByText('Gamified Experience'),
      screen.getByText('Patronage System')
    ];

    featureTitles.forEach(title => {
      expect(title).toHaveClass('font-cinzel', 'text-2xl', 'font-bold', 'mb-4', 'text-foreground', 'group-hover:text-primary', 'transition-colors');
    });
  });
});
