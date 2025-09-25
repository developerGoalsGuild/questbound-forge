/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Footer from '../Footer';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Shield: () => <div data-testid="shield-icon" />,
  Facebook: () => <div data-testid="facebook-icon" />,
  Twitter: () => <div data-testid="twitter-icon" />,
  Linkedin: () => <div data-testid="linkedin-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Heart: () => <div data-testid="heart-icon" />
}));

// Mock the translation hook
const mockTranslation = {
  nav: {
    features: 'Features',
    contact: 'Contact'
  }
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: mockTranslation
  })
}));

describe('Footer', () => {
  test('renders footer with brand section', () => {
    render(<Footer />);

    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    expect(screen.getByText('GoalGuild')).toBeInTheDocument();
    expect(screen.getByText('Join a medieval-inspired community where goals become quests, progress is celebrated, and mutual support leads to extraordinary achievements.')).toBeInTheDocument();
    expect(screen.getByText('Made with')).toBeInTheDocument();
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    expect(screen.getByText('for adventurers worldwide')).toBeInTheDocument();
  });

  test('renders product links section', () => {
    render(<Footer />);

    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '#features');
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '#pricing');
    expect(screen.getByRole('link', { name: 'Community' })).toHaveAttribute('href', '#community');
    expect(screen.getByRole('link', { name: 'API Documentation' })).toHaveAttribute('href', '/docs');
  });

  test('renders company links section', () => {
    render(<Footer />);

    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: 'Careers' })).toHaveAttribute('href', '/careers');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact');
  });

  test('renders support links section', () => {
    render(<Footer />);

    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Help Center' })).toHaveAttribute('href', '/help');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Status' })).toHaveAttribute('href', '/status');
  });

  test('renders newsletter signup section', () => {
    render(<Footer />);

    expect(screen.getByText('Join the Guild Newsletter')).toBeInTheDocument();
    expect(screen.getByText('Get weekly updates on community achievements and new features.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  test('renders social media links', () => {
    render(<Footer />);

    expect(screen.getByTestId('twitter-icon')).toBeInTheDocument();
    expect(screen.getByTestId('facebook-icon')).toBeInTheDocument();
    expect(screen.getByTestId('linkedin-icon')).toBeInTheDocument();
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();

    // Check social links have correct hrefs and aria-labels
    const twitterLink = screen.getByRole('link', { name: 'Twitter' });
    const facebookLink = screen.getByRole('link', { name: 'Facebook' });
    const linkedinLink = screen.getByRole('link', { name: 'LinkedIn' });
    const emailLink = screen.getByRole('link', { name: 'Email' });

    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com');
    expect(facebookLink).toHaveAttribute('href', 'https://facebook.com');
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com');
    expect(emailLink).toHaveAttribute('href', 'mailto:hello@goalguild.com');
  });

  test('renders copyright and legal text', () => {
    render(<Footer />);

    expect(screen.getByText('© 2024 GoalGuild. All rights reserved. Built with AWS serverless architecture.')).toBeInTheDocument();
  });

  test('renders with proper semantic structure', () => {
    render(<Footer />);

    // Should be in a footer element
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    // Should have proper headings
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(4); // Product, Company, Support, Newsletter
  });

  test('newsletter input has correct attributes', () => {
    render(<Footer />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveClass('flex-1', 'px-4', 'py-2', 'rounded-lg', 'bg-background', 'text-foreground', 'border', 'border-border');
  });

  test('social links have proper styling and hover states', () => {
    render(<Footer />);

    const socialLinks = screen.getAllByRole('link').filter(link =>
      ['Twitter', 'Facebook', 'LinkedIn', 'Email'].includes(link.getAttribute('aria-label') || '')
    );

    socialLinks.forEach(link => {
      expect(link).toHaveClass('p-2', 'bg-primary-foreground/10', 'rounded-lg', 'hover:bg-secondary', 'hover:text-secondary-foreground', 'transition-colors', 'duration-200');
    });
  });

  test('footer links have proper styling', () => {
    render(<Footer />);

    const footerLinks = screen.getAllByRole('link').filter(link =>
      !['Twitter', 'Facebook', 'LinkedIn', 'Email'].includes(link.getAttribute('aria-label') || '')
    );

    footerLinks.forEach(link => {
      expect(link).toHaveClass('text-primary-foreground/70', 'hover:text-secondary', 'transition-colors', 'duration-200');
    });
  });
});
