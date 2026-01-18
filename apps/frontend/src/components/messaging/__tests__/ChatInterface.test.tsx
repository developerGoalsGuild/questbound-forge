/**
 * Tests for ChatInterface component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatInterface } from '../ChatInterface';
import { useMessaging } from '../../../hooks/useMessaging';

// Mock the useMessaging hook
vi.mock('../../../hooks/useMessaging');
const mockUseMessaging = vi.mocked(useMessaging);

// Mock the API functions
vi.mock('../../../lib/api/messaging', () => ({
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
  getWebSocketUrl: vi.fn(),
  isGuildRoom: vi.fn(),
  formatMessageTimestamp: vi.fn(),
  isOwnMessage: vi.fn(),
  shouldGroupWithPrevious: vi.fn()
}));

describe('ChatInterface', () => {
  const defaultProps = {
    roomId: 'ROOM-123',
    userId: 'user-123',
    roomName: 'Test Room',
    roomType: 'general' as const
  };

  const mockMessagingReturn = {
    messages: [],
    isLoading: false,
    hasError: false,
    errorMessage: undefined,
    isConnected: true,
    connectionStatus: 'connected' as const,
    sendMessage: vi.fn(),
    loadMessages: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    clearMessages: vi.fn(),
    retryConnection: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
    typingUsers: [],
    activeConnections: 1,
    rateLimitInfo: undefined
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMessaging.mockReturnValue(mockMessagingReturn);
  });

  it('renders chat interface with header and input', () => {
    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Message Test Room/i)).toBeInTheDocument();
  });

  it('shows loading state when messages are loading', () => {
    mockUseMessaging.mockReturnValue({
      ...mockMessagingReturn,
      isLoading: true,
      messages: []
    });

    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
  });

  it('shows no messages state when no messages exist', () => {
    mockUseMessaging.mockReturnValue({
      ...mockMessagingReturn,
      messages: [],
      isLoading: false
    });

    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText('Start the conversation by sending a message below.')).toBeInTheDocument();
  });

  it('displays messages when they exist', () => {
    const messages = [
      {
        id: 'msg-1',
        roomId: 'ROOM-123',
        senderId: 'user-456',
        text: 'Hello world!',
        ts: Date.now()
      }
    ];

    mockUseMessaging.mockReturnValue({
      ...mockMessagingReturn,
      messages
    });

    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
  });

  it('handles message sending', async () => {
    const mockSendMessage = vi.fn().mockResolvedValue({ success: true, messageId: 'msg-123' });
    
    mockUseMessaging.mockReturnValue({
      ...mockMessagingReturn,
      sendMessage: mockSendMessage
    });

    render(<ChatInterface {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/Message Test Room/i);
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('shows connection error when disconnected', () => {
    mockUseMessaging.mockReturnValue({
      ...mockMessagingReturn,
      isConnected: false,
      connectionStatus: 'error',
      hasError: true,
      errorMessage: 'Connection failed'
    });

    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows rate limit warning when rate limited', () => {
    const rateLimitInfo = {
      limit: 30,
      remaining: 0,
      resetTime: Date.now() + 60000,
      isLimited: true
    };

    mockUseMessaging.mockReturnValue({
      ...mockMessagingReturn,
      rateLimitInfo
    });

    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getAllByText(/rate limit exceeded/i).length).toBeGreaterThan(0);
  });

  it('disables input when not connected', () => {
    mockUseMessaging.mockReturnValue({
      ...mockMessagingReturn,
      isConnected: false,
      hasError: true
    });

    render(<ChatInterface {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/connecting to chat/i);
    expect(input).toBeDisabled();
  });

  it('handles typing indicators', () => {
    const typingUsers = [
      { userId: 'user-456', username: 'TestUser', timestamp: Date.now() }
    ];

    mockUseMessaging.mockReturnValue({
      ...mockMessagingReturn,
      typingUsers
    });

    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByText('TestUser is typing...')).toBeInTheDocument();
  });

  it('calls onMessageSent when message is sent successfully', async () => {
    const user = userEvent.setup();
    const onMessageSent = vi.fn();
    const messages = [
      {
        id: 'msg-1',
        roomId: 'ROOM-123',
        senderId: 'user-123',
        text: 'Test message',
        ts: Date.now()
      }
    ];

    mockUseMessaging.mockReturnValue({
      ...mockMessagingReturn,
      messages,
      sendMessage: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' })
    });

    render(<ChatInterface {...defaultProps} onMessageSent={onMessageSent} />);
    
    const input = screen.getByPlaceholderText(/Message Test Room/i);
    await user.type(input, 'Test message{enter}');
    
    await waitFor(() => {
      expect(onMessageSent).toHaveBeenCalled();
    });
  });

  it('calls onError when message sending fails', async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    const mockSendMessage = vi.fn().mockResolvedValue({ 
      success: false, 
      error: 'Rate limit exceeded' 
    });

    mockUseMessaging.mockReturnValue({
      ...mockMessagingReturn,
      sendMessage: mockSendMessage
    });

    render(<ChatInterface {...defaultProps} onError={onError} />);
    
    const input = screen.getByPlaceholderText(/Message Test Room/i);
    await user.type(input, 'Test message{enter}');
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Rate limit exceeded');
    });
  });

  it('handles guild room type correctly', () => {
    render(<ChatInterface {...defaultProps} roomType="guild" />);
    
    expect(screen.getByText('Guild')).toBeInTheDocument();
  });

  it('shows retry button when connection fails', () => {
    const mockRetryConnection = vi.fn();
    
    mockUseMessaging.mockReturnValue({
      ...mockMessagingReturn,
      isConnected: false,
      hasError: true,
      connectionStatus: 'error',
      retryConnection: mockRetryConnection
    });

    render(<ChatInterface {...defaultProps} />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    
    expect(mockRetryConnection).toHaveBeenCalled();
  });
});
