/**
 * Tests for TypingIndicator component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TypingIndicator } from '../TypingIndicator';

describe('TypingIndicator', () => {
  it('renders nothing when no users are typing', () => {
    const { container } = render(<TypingIndicator users={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows typing message for a single user', () => {
    render(
      <TypingIndicator
        users={[{ userId: 'user-1', username: 'Alex' }]}
      />
    );

    expect(screen.getByText('Alex is typing...')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows typing message for two users', () => {
    render(
      <TypingIndicator
        users={[
          { userId: 'user-1', username: 'Alex' },
          { userId: 'user-2', username: 'Jordan' }
        ]}
      />
    );

    expect(screen.getByText('Alex and Jordan are typing...')).toBeInTheDocument();
  });

  it('shows overflow indicator when more than three users are typing', () => {
    render(
      <TypingIndicator
        users={[
          { userId: 'user-1', username: 'Alex' },
          { userId: 'user-2', username: 'Jordan' },
          { userId: 'user-3', username: 'Taylor' },
          { userId: 'user-4', username: 'Morgan' }
        ]}
      />
    );

    expect(screen.getByText('Alex and 3 others are typing...')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});
