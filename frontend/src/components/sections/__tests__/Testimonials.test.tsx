/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Testimonials from '../Testimonials';

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
  Star: () => <div data-testid="star-icon" />,
  Quote: () => <div data-testid="quote-icon" />
}));

describe('Testimonials', () => {
  test('renders testimonials section with header', () => {
    render(<Testimonials />);

    expect(screen.getByText('Tales of Triumph')).toBeInTheDocument();
    expect(screen.getByText('Hear from adventurers, partners, and patrons who have found success in our guild.')).toBeInTheDocument();
  });

  test('renders all testimonial cards', () => {
    render(<Testimonials />);

    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Marcus Rodriguez')).toBeInTheDocument();
    expect(screen.getByText('Dr. Emily Watson')).toBeInTheDocument();
  });

  test('renders testimonial content', () => {
    render(<Testimonials />);

    expect(screen.getByText(/GoalGuild transformed how I approach personal development/)).toBeInTheDocument();
    expect(screen.getByText(/As a partner company, we've seen amazing engagement/)).toBeInTheDocument();
    expect(screen.getByText(/Supporting the GoalGuild community has been incredibly rewarding/)).toBeInTheDocument();
  });

  test('renders user roles and companies', () => {
    render(<Testimonials />);

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('TechCorp')).toBeInTheDocument();
    expect(screen.getByText('Fitness Coach')).toBeInTheDocument();
    expect(screen.getByText('Elite Training')).toBeInTheDocument();
    expect(screen.getByText('Patron & Philanthropist')).toBeInTheDocument();
    expect(screen.getByText('Watson Foundation')).toBeInTheDocument();
  });

  test('renders 5-star ratings for all testimonials', () => {
    render(<Testimonials />);

    const starIcons = screen.getAllByTestId('star-icon');
    expect(starIcons).toHaveLength(15); // 3 testimonials × 5 stars each
  });

  test('renders quote icons', () => {
    render(<Testimonials />);

    const quoteIcons = screen.getAllByTestId('quote-icon');
    expect(quoteIcons).toHaveLength(3); // One for each testimonial
  });

  test('renders user avatars with initials', () => {
    render(<Testimonials />);

    expect(screen.getByText('SC')).toBeInTheDocument();
    expect(screen.getByText('MR')).toBeInTheDocument();
    expect(screen.getByText('EW')).toBeInTheDocument();
  });

  test('renders call-to-action section', () => {
    render(<Testimonials />);

    expect(screen.getByText('Ready to Write Your Own Success Story?')).toBeInTheDocument();
    expect(screen.getByText('Join thousands of adventurers who are already achieving their dreams.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Begin Your Quest' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Become a Partner' })).toBeInTheDocument();
  });

  test('renders trust indicators', () => {
    render(<Testimonials />);

    expect(screen.getByText('Trusted by adventurers at')).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByText('Meta')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  test('testimonials have staggered animation delays', () => {
    render(<Testimonials />);

    const cards = screen.getAllByTestId('card');

    expect(cards[0]).toHaveStyle({ animationDelay: '0s' });
    expect(cards[1]).toHaveStyle({ animationDelay: '0.2s' });
    expect(cards[2]).toHaveStyle({ animationDelay: '0.4s' });
  });

  test('cards have proper hover effects', () => {
    render(<Testimonials />);

    const cards = screen.getAllByTestId('card');
    cards.forEach(card => {
      expect(card).toHaveClass('guild-card', 'group', 'relative', 'overflow-hidden', 'animate-scale-in');
    });
  });

  test('renders with responsive grid layout', () => {
    render(<Testimonials />);

    const grid = screen.getByTestId('testimonials-section').querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3', 'gap-8');
  });

  test('renders quote icons', () => {
    render(<Testimonials />);

    const quoteIcons = screen.getAllByTestId('quote-icon');
    expect(quoteIcons).toHaveLength(3);
  });

  test('renders star ratings', () => {
    render(<Testimonials />);

    const starIcons = screen.getAllByTestId('star-icon');
    expect(starIcons).toHaveLength(15); // 3 testimonials × 5 stars each
  });

  test('avatar circles have gradient background', () => {
    render(<Testimonials />);

    const avatars = screen.getAllByText(/SC|MR|EW/);
    avatars.forEach(avatar => {
      const avatarDiv = avatar.closest('.w-12.h-12');
      expect(avatarDiv).toHaveClass('w-12', 'h-12', 'bg-gradient-royal', 'rounded-full', 'flex', 'items-center', 'justify-center');
    });
  });

  test('testimonial content is italicized', () => {
    render(<Testimonials />);

    const testimonialTexts = screen.getAllByText(/"[^"]*"/);
    testimonialTexts.forEach(text => {
      expect(text).toHaveClass('text-muted-foreground', 'leading-relaxed', 'mb-6', 'italic');
    });
  });

  test('company names have primary color styling', () => {
    render(<Testimonials />);

    const companies = screen.getAllByText(/TechCorp|Elite Training|Watson Foundation/);
    companies.forEach(company => {
      expect(company).toHaveClass('text-sm', 'text-primary');
    });
  });

  test('CTA buttons have different styles', () => {
    render(<Testimonials />);

    const beginQuestButton = screen.getByRole('button', { name: 'Begin Your Quest' });
    const becomePartnerButton = screen.getByRole('button', { name: 'Become a Partner' });

    expect(beginQuestButton).toHaveClass('btn-heraldic', 'text-primary-foreground', 'px-8', 'py-3', 'rounded-lg', 'font-semibold');
    expect(becomePartnerButton).toHaveClass('btn-gold', 'text-secondary-foreground', 'px-8', 'py-3', 'rounded-lg', 'font-semibold');
  });

  test('trust indicators section has proper opacity', () => {
    render(<Testimonials />);

    const trustSection = screen.getByText('Microsoft').closest('.flex');
    expect(trustSection).toHaveClass('flex', 'justify-center', 'items-center', 'gap-8', 'opacity-60');
  });
});
