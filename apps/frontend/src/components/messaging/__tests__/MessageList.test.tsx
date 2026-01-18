/**
 * Tests for MessageList component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageList } from '../MessageList';
import { Message } from '../../../types/messaging';

vi.mock('../../../lib/api/messaging', () => ({
  formatMessageTimestamp: vi.fn(() => '12:00'),
  isOwnMessage: vi.fn(() => false),
  shouldGroupWithPrevious: vi.fn(() => false)
}));

vi.mock('../MessageItem', () => ({
  MessageItem: ({ message }: { message: Message }) => (
    <div data-testid="message-item">{message.text}</div>
  )
}));

const baseMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  roomId: 'room-1',
  senderId: 'user-1',
  text: 'Hello',
  ts: Date.now(),
  ...overrides
});

describe('MessageList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty state when no messages and not loading', () => {
    render(
      <MessageList
        messages={[]}
        currentUserId="user-1"
        isLoading={false}
      />
    );

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText('Start the conversation by sending a message below.')).toBeInTheDocument();
  });

  it('renders loading skeletons when loading and no messages', () => {
    const { container } = render(
      <MessageList
        messages={[]}
        currentUserId="user-1"
        isLoading={true}
      />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows load more button when scrolled near top and has more messages', () => {
    const onLoadMore = vi.fn().mockResolvedValue(undefined);
    const messages = [
      baseMessage({ id: 'msg-1', text: 'First' }),
      baseMessage({ id: 'msg-2', text: 'Second', senderId: 'user-2' })
    ];

    const { container } = render(
      <MessageList
        messages={messages}
        currentUserId="user-1"
        hasMore={true}
        onLoadMore={onLoadMore}
      />
    );

    const listContainer = container.querySelector('div.space-y-4');
    expect(listContainer).toBeTruthy();

    Object.defineProperty(listContainer as HTMLElement, 'scrollTop', {
      value: 0,
      writable: true
    });

    fireEvent.scroll(listContainer as HTMLElement, { target: { scrollTop: 0 } });

    const loadMoreButton = screen.getByRole('button', { name: /load more messages/i });
    expect(loadMoreButton).toBeInTheDocument();

    fireEvent.click(loadMoreButton);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
