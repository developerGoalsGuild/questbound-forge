/**
 * Tests for ConnectionStatus component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { ConnectionStatus } from '../ConnectionStatus';

describe('ConnectionStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders nothing when connected without errors', () => {
    const { container } = render(
      <ConnectionStatus status="connected" hasError={false} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows connecting message', () => {
    render(<ConnectionStatus status="connecting" hasError={false} />);

    expect(screen.getByText('Connecting to chat...')).toBeInTheDocument();
  });

  it('shows retry button for disconnected status and triggers retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <ConnectionStatus
        status="disconnected"
        hasError={false}
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows rate limit message when limited', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);

    render(
      <ConnectionStatus
        status="connected"
        hasError={false}
        rateLimitInfo={{ isLimited: true, remaining: 0, resetTime: 6000 }}
      />
    );

    expect(
      screen.getByText(/Rate limit exceeded\. You can send messages again in 5 seconds\./i)
    ).toBeInTheDocument();
  });
});
