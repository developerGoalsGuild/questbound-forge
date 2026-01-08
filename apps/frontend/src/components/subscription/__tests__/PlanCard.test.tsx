/**
 * PlanCard Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { PlanCard } from '../PlanCard';
import { SubscriptionTier } from '@/lib/api/subscription';

describe('PlanCard', () => {
  const mockPlan = {
    tier: 'JOURNEYMAN' as SubscriptionTier,
    name: 'Journeyman',
    price: '$15',
    period: '/month',
    description: 'For serious goal achievers',
    features: ['100 video credits/month', 'All quest templates', 'Priority support'],
    cta: 'Subscribe',
    popular: true,
    currentPlan: false,
    onSelect: vi.fn(),
    disabled: false,
  };

  it('should render plan card with all details', () => {
    render(<PlanCard {...mockPlan} />);

    expect(screen.getByText('Journeyman')).toBeInTheDocument();
    expect(screen.getByText('$15')).toBeInTheDocument();
    expect(screen.getByText('/month')).toBeInTheDocument();
    expect(screen.getByText('For serious goal achievers')).toBeInTheDocument();
    expect(screen.getByText('100 video credits/month')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
  });

  it('should show popular badge when popular is true', () => {
    render(<PlanCard {...mockPlan} popular={true} />);
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('should not show popular badge when popular is false', () => {
    render(<PlanCard {...mockPlan} popular={false} />);
    expect(screen.queryByText('Most Popular')).not.toBeInTheDocument();
  });

  it('should show current plan badge when currentPlan is true', () => {
    render(<PlanCard {...mockPlan} currentPlan={true} />);
    const badges = screen.getAllByText('Current Plan');
    expect(badges.length).toBeGreaterThan(0);
    // Check that at least one badge exists
    expect(badges[0]).toBeInTheDocument();
  });

  it('should call onSelect when button is clicked', () => {
    const onSelect = vi.fn();
    render(<PlanCard {...mockPlan} onSelect={onSelect} />);

    const button = screen.getByText('Subscribe');
    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledWith('JOURNEYMAN');
  });

  it('should disable button when disabled is true', () => {
    render(<PlanCard {...mockPlan} disabled={true} />);

    const button = screen.getByText('Subscribe');
    expect(button).toBeDisabled();
  });

  it('should disable button when currentPlan is true', () => {
    render(<PlanCard {...mockPlan} currentPlan={true} />);

    const buttons = screen.getAllByText('Current Plan');
    const button = buttons.find(btn => btn.closest('button'));
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('should render all features', () => {
    render(<PlanCard {...mockPlan} />);

    expect(screen.getByText('100 video credits/month')).toBeInTheDocument();
    expect(screen.getByText('All quest templates')).toBeInTheDocument();
    expect(screen.getByText('Priority support')).toBeInTheDocument();
  });

  it('should apply popular styling when popular is true', () => {
    const { container } = render(<PlanCard {...mockPlan} popular={true} />);
    const card = container.querySelector('.scale-105');
    expect(card).toBeInTheDocument();
  });

  it('should apply current plan styling when currentPlan is true', () => {
    const { container } = render(<PlanCard {...mockPlan} currentPlan={true} />);
    const card = container.querySelector('.border-green-500');
    expect(card).toBeInTheDocument();
  });
});

