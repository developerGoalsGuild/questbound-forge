/**
 * TierBadge Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TierBadge, SubscriptionTier } from '../TierBadge';

describe('TierBadge', () => {
  it('should render FREE tier badge', () => {
    render(<TierBadge tier="FREE" />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('should render INITIATE tier badge', () => {
    render(<TierBadge tier="INITIATE" />);
    expect(screen.getByText('Initiate')).toBeInTheDocument();
  });

  it('should render JOURNEYMAN tier badge', () => {
    render(<TierBadge tier="JOURNEYMAN" />);
    expect(screen.getByText('Journeyman')).toBeInTheDocument();
  });

  it('should render SAGE tier badge', () => {
    render(<TierBadge tier="SAGE" />);
    expect(screen.getByText('Radiant Sage')).toBeInTheDocument();
  });

  it('should render GUILDMASTER tier badge', () => {
    render(<TierBadge tier="GUILDMASTER" />);
    expect(screen.getByText('Guildmaster')).toBeInTheDocument();
  });

  it('should render with icon by default', () => {
    const { container } = render(<TierBadge tier="INITIATE" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should not render icon when showIcon is false', () => {
    const { container } = render(<TierBadge tier="INITIATE" showIcon={false} />);
    const icon = container.querySelector('svg');
    expect(icon).not.toBeInTheDocument();
  });

  it('should apply size classes correctly', () => {
    const { container: smContainer } = render(<TierBadge tier="INITIATE" size="sm" />);
    expect(smContainer.firstChild).toHaveClass('text-xs');

    const { container: mdContainer } = render(<TierBadge tier="INITIATE" size="md" />);
    expect(mdContainer.firstChild).toHaveClass('text-sm');

    const { container: lgContainer } = render(<TierBadge tier="INITIATE" size="lg" />);
    expect(lgContainer.firstChild).toHaveClass('text-base');
  });

  it('should apply custom className', () => {
    const { container } = render(<TierBadge tier="INITIATE" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should render FREE tier without icon', () => {
    const { container } = render(<TierBadge tier="FREE" />);
    const icon = container.querySelector('svg');
    expect(icon).not.toBeInTheDocument();
  });
});

