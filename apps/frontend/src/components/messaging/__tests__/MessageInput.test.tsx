/**
 * Tests for MessageInput component
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
  const flushPromises = () => Promise.resolve();

  afterEach(() => {
    vi.useRealTimers();
  });

  it('disables send when empty and enables when text is entered', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn().mockResolvedValue(undefined);

    render(<MessageInput onSendMessage={onSendMessage} />);

    const sendButton = screen.getByRole('button', { name: /send message/i, hidden: true });
    expect(sendButton).toBeDisabled();

    const textbox = screen.getByRole('textbox');
    await user.type(textbox, 'Hello');

    expect(sendButton).toBeEnabled();
  });

  it('sends message on Enter and clears input', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn().mockResolvedValue(undefined);

    render(<MessageInput onSendMessage={onSendMessage} />);

    const textbox = screen.getByRole('textbox');
    await user.type(textbox, 'Hello{enter}');

    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledWith('Hello', undefined);
    });

    expect(textbox).toHaveValue('');
  });

  it('triggers typing start and stop after inactivity', async () => {
    vi.useFakeTimers();
    const onTypingStart = vi.fn();
    const onTypingStop = vi.fn();

    render(
      <MessageInput
        onSendMessage={vi.fn().mockResolvedValue(undefined)}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    );

    const textbox = screen.getByRole('textbox');
    fireEvent.change(textbox, { target: { value: 'H' } });

    expect(onTypingStart).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2000);
    await flushPromises();
    expect(onTypingStop).toHaveBeenCalledTimes(1);
  });

  it('renders reply preview and allows cancel', async () => {
    const user = userEvent.setup();
    const onCancelReply = vi.fn();

    render(
      <MessageInput
        onSendMessage={vi.fn().mockResolvedValue(undefined)}
        replyTo={{ messageId: 'msg-1', senderNickname: 'Alex', text: 'Hello there' }}
        onCancelReply={onCancelReply}
      />
    );

    expect(screen.getByText(/Replying to Alex/i)).toBeInTheDocument();
    expect(screen.getByText('Hello there')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /cancel reply/i });
    await user.click(cancelButton);
    expect(onCancelReply).toHaveBeenCalledTimes(1);
  });

  it('shows rate limit warning on rate limit error and hides after timeout', async () => {
    const onSendMessage = vi.fn().mockRejectedValue(new Error('rate limit exceeded'));

    render(<MessageInput onSendMessage={onSendMessage} />);

    const textbox = screen.getByRole('textbox');
    fireEvent.change(textbox, { target: { value: 'Hello' } });

    const sendButton = screen.getByRole('button', { name: /send message/i, hidden: true });
    fireEvent.click(sendButton);

    expect(await screen.findByText(/sending messages too quickly/i)).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, 5200));
    expect(screen.queryByText(/sending messages too quickly/i)).not.toBeInTheDocument();
  }, 10000);
});
