/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Hero from '../Hero';

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, size, className, variant, asChild }: any) => {
    if (asChild) {
      // For asChild, clone the child element with combined classes
      const child = React.Children.only(children);
      return React.cloneElement(child, {
        className: `${className} ${child.props.className || ''}`.trim(),
        'data-testid': `button-${variant || 'default'}-${size || 'default'}`
      });
    }
    return (
      <button
        data-testid={`button-${variant || 'default'}-${size || 'default'}`}
        className={className}
      >
        {children}
      </button>
    );
  }
}));

vi.mock('lucide-react', () => ({
  ArrowRight: ({ className }: any) => <div data-testid="arrow-right-icon" className={className} />,
  Play: ({ className }: any) => <div data-testid="play-icon" className={className} />
}));

// Mock the translation hook
const mockTranslation = {
  hero: {
    title: 'Unite in Purpose, Achieve Together',
    subtitle: 'Join a medieval-inspired community where goals become quests, progress is celebrated, and mutual support leads to extraordinary achievements.',
    ctaPrimary: 'Begin Your Quest',
    ctaSecondary: 'Explore Features'
  }
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: mockTranslation
  })
}));

describe.skip('Hero', () => {
  test('renders hero section with background image placeholder', () => {
    render(<Hero />);

    const heroSection = screen.getByRole('banner'); // section element
    expect(heroSection).toBeInTheDocument();
    expect(heroSection).toHaveClass('relative', 'min-h-screen', 'flex', 'items-center', 'justify-center', 'overflow-hidden');

    const backgroundImage = screen.getByAltText('Medieval castle representing collaboration and achievement');
    expect(backgroundImage).toBeInTheDocument();
    expect(backgroundImage).toHaveAttribute('src', '');
  });

  test('renders main heading and subtitle', () => {
    render(<Hero />);

    expect(screen.getByText('Unite in Purpose, Achieve Together')).toBeInTheDocument();
    expect(screen.getByText('Join a medieval-inspired community where goals become quests, progress is celebrated, and mutual support leads to extraordinary achievements.')).toBeInTheDocument();
  });

  test('renders call-to-action buttons', () => {
    render(<Hero />);

    const primaryButton = screen.getByRole('link', { name: /Begin Your Quest/ });
    expect(primaryButton).toHaveAttribute('href', '/dashboard');
    expect(primaryButton).toHaveClass('btn-gold', 'text-secondary-foreground', 'px-8', 'py-4', 'text-lg', 'font-semibold', 'group');

    const secondaryButton = screen.getByRole('button', { name: /Explore Features/ });
    expect(secondaryButton).toHaveClass('border-primary-foreground', 'text-primary-foreground', 'hover:bg-primary-foreground', 'hover:text-primary', 'px-8', 'py-4', 'text-lg', 'group');
  });

  test('renders CTA button icons', () => {
    render(<Hero />);

    expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
    expect(screen.getByTestId('play-icon')).toBeInTheDocument();
  });

  test('renders statistics section', () => {
    render(<Hero />);

    expect(screen.getByText('10K+')).toBeInTheDocument();
    expect(screen.getByText('Active Adventurers')).toBeInTheDocument();

    expect(screen.getByText('50K+')).toBeInTheDocument();
    expect(screen.getByText('Goals Achieved')).toBeInTheDocument();

    expect(screen.getByText('100+')).toBeInTheDocument();
    expect(screen.getByText('Partner Guilds')).toBeInTheDocument();
  });

  test('renders background overlay gradient', () => {
    render(<Hero />);

    const overlay = screen.getByTestId('hero-section')?.querySelector('.absolute.inset-0.bg-gradient-to-r');
    // The overlay should be present in the background
    const heroSection = screen.getByRole('banner');
    const overlayDiv = heroSection.querySelector('.absolute.inset-0.bg-gradient-to-r');
    expect(overlayDiv).toBeInTheDocument();
  });

  test('renders decorative bottom gradient', () => {
    render(<Hero />);

    const heroSection = screen.getByRole('banner');
    const bottomGradient = heroSection.querySelector('.absolute.bottom-0.left-0.right-0.h-32');
    expect(bottomGradient).toBeInTheDocument();
    expect(bottomGradient).toHaveClass('bg-gradient-to-t', 'from-background', 'to-transparent');
  });

  test('has proper responsive classes', () => {
    render(<Hero />);

    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveClass('font-cinzel', 'text-5xl', 'md:text-7xl', 'font-bold', 'mb-6', 'leading-tight');

    const subtitle = screen.getByText(/Join a medieval-inspired community/);
    expect(subtitle).toHaveClass('text-xl', 'md:text-2xl', 'mb-8', 'text-primary-foreground/90', 'leading-relaxed', 'max-w-3xl', 'mx-auto');

    const buttonContainer = subtitle.nextElementSibling;
    expect(buttonContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-4', 'justify-center', 'items-center');
  });

  test('statistics have staggered animation delays', () => {
    render(<Hero />);

    const statContainers = screen.getAllByText(/10K+|50K+|100\+/);
    // Get the parent div that has the animate-scale-in class and style
    const statDivs = statContainers.map(stat => stat.parentElement);

    // Check that animation delays are set
    const firstStat = statDivs[0];
    const secondStat = statDivs[1];
    const thirdStat = statDivs[2];

    // Check for style attribute directly
    expect(firstStat).toHaveAttribute('style', expect.stringContaining('animation-delay: 0.2s'));
    expect(secondStat).toHaveAttribute('style', expect.stringContaining('animation-delay: 0.4s'));
    expect(thirdStat).toHaveAttribute('style', expect.stringContaining('animation-delay: 0.6s'));
  });

  test('has proper semantic structure', () => {
    render(<Hero />);

    // Should have proper heading hierarchy
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Unite in Purpose, Achieve Together');

    // Should be a section element
    const section = screen.getByRole('banner');
    expect(section.tagName).toBe('SECTION');
  });

  test('primary button has arrow icon with hover animation', () => {
    render(<Hero />);

    const arrowIcon = screen.getByTestId('arrow-right-icon');
    expect(arrowIcon).toHaveClass('ml-2', 'h-5', 'w-5', 'group-hover:translate-x-1', 'transition-transform');
  });

  test('secondary button has play icon with hover animation', () => {
    render(<Hero />);

    const playIcon = screen.getByTestId('play-icon');
    expect(playIcon).toHaveClass('mr-2', 'h-5', 'w-5', 'group-hover:scale-110', 'transition-transform');
  });
});
