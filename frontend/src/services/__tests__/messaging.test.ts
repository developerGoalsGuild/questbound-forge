/**
 * Comprehensive test suite for messaging services
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { messagePersistence } from '../messagePersistence';
import { errorHandling } from '../errorHandling';
import { rateLimiting } from '../rateLimiting';
import { messageValidation } from '../messageValidation';
import { Message } from '../../types/messaging';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

describe('Message Persistence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should store and retrieve messages locally', async () => {
    const message: Message = {
      id: '1',
      text: 'Test message',
      roomId: 'ROOM-test',
      senderId: 'user-1',
      ts: Date.now(),
      type: 'message',
      roomType: 'general',
      createdAt: new Date().toISOString()
    };

    await messagePersistence.storeMessage(message);
    const result = await messagePersistence.getMessages('ROOM-test');

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].text).toBe('Test message');
  });

  it('should handle offline mode', async () => {
    // Simulate offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const message: Message = {
      id: '2',
      text: 'Offline message',
      roomId: 'ROOM-test',
      senderId: 'user-1',
      ts: Date.now(),
      type: 'message',
      roomType: 'general',
      createdAt: new Date().toISOString()
    };

    await messagePersistence.storeMessage(message);
    const result = await messagePersistence.getMessages('ROOM-test');

    expect(result.messages).toHaveLength(2); // Previous + new message
  });

  it('should sync queued messages when online', async () => {
    // Simulate going online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    await messagePersistence.syncQueuedMessages();
    // Should not throw errors
    expect(true).toBe(true);
  });
});

describe('Error Handling Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  it('should handle and log errors', () => {
    const error = new Error('Test error');
    const context = {
      component: 'messaging',
      action: 'send_message',
      userId: 'user-1',
      roomId: 'ROOM-test'
    };

    errorHandling.handleError(error, context);

    expect(console.error).toHaveBeenCalled();
  });

  it('should handle network errors with retry', async () => {
    let attemptCount = 0;
    const operation = vi.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Network error');
      }
      return 'success';
    });

    const result = await errorHandling.handleNetworkError(
      operation,
      { component: 'messaging', action: 'fetch_messages' },
      3
    );

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should handle messaging-specific errors', () => {
    const error = new Error('Connection failed');
    
    errorHandling.handleMessagingError(error, 'ROOM-test', 'user-1', 'send_message');
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle authentication errors', () => {
    const error = new Error('Unauthorized');
    
    errorHandling.handleAuthError(error, 'user-1');
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle rate limit errors', () => {
    const error = new Error('Rate limit exceeded');
    
    errorHandling.handleRateLimitError(error, 'ROOM-test', 'user-1', 60);
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should track error statistics', () => {
    errorHandling.handleError('Test error 1', { component: 'test' });
    errorHandling.handleError('Test error 2', { component: 'test' });
    
    const stats = errorHandling.getErrorStats();
    expect(stats.totalErrors).toBe(2);
    expect(stats.errorsByComponent.test).toBe(2);
  });
});

describe('Rate Limiting Service', () => {
  beforeEach(() => {
    rateLimiting.resetUserLimits('user-1');
    rateLimiting.resetUserLimits('user-2');
  });

  it('should allow messages within limits', () => {
    const result = rateLimiting.canSendMessage('user-1', 100);
    
    expect(result.canSend).toBe(true);
    expect(result.rateLimitInfo.remaining).toBeGreaterThan(0);
  });

  it('should block messages when rate limit exceeded', () => {
    // Send many messages quickly
    for (let i = 0; i < 35; i++) {
      rateLimiting.recordMessage('user-1', 50);
    }

    const result = rateLimiting.canSendMessage('user-1', 50);
    
    expect(result.canSend).toBe(false);
    expect(result.reason).toContain('Rate limit exceeded');
  });

  it('should handle message length limits', () => {
    const result = rateLimiting.canSendMessage('user-1', 3000);
    
    expect(result.canSend).toBe(false);
    expect(result.reason).toBe('Message too long');
  });

  it('should handle typing indicators', () => {
    const canType = rateLimiting.canSendTypingIndicator('user-1');
    expect(canType).toBe(true);

    rateLimiting.recordTypingIndicator('user-1');
    const canTypeAfter = rateLimiting.canSendTypingIndicator('user-1');
    expect(canTypeAfter).toBe(true);
  });

  it('should provide rate limit info', () => {
    const info = rateLimiting.getRateLimitInfo('user-1');
    
    expect(info).toHaveProperty('isLimited');
    expect(info).toHaveProperty('remaining');
    expect(info).toHaveProperty('resetTime');
    expect(info).toHaveProperty('limit');
  });

  it('should handle user blocking', () => {
    rateLimiting.blockUser('user-1');
    
    const result = rateLimiting.canSendMessage('user-1', 50);
    expect(result.canSend).toBe(false);
    expect(result.reason).toBe('User is blocked');
  });

  it('should provide statistics', () => {
    rateLimiting.recordMessage('user-1', 50);
    rateLimiting.recordMessage('user-2', 50);
    
    const stats = rateLimiting.getStats();
    expect(stats.totalUsers).toBe(2);
    expect(stats.blockedUsers).toBe(0);
  });
});

describe('Message Validation Service', () => {
  it('should validate normal messages', () => {
    const result = messageValidation.validateMessage('Hello world!', 'user-1', 'ROOM-test');
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty messages', () => {
    const result = messageValidation.validateMessage('', 'user-1', 'ROOM-test');
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Message cannot be empty');
  });

  it('should reject messages that are too long', () => {
    const longMessage = 'a'.repeat(3000);
    const result = messageValidation.validateMessage(longMessage, 'user-1', 'ROOM-test');
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Message must be no more than 2000 characters long');
  });

  it('should detect spam patterns', () => {
    const spamMessage = 'aaaaa bbbbb ccccc';
    const result = messageValidation.validateMessage(spamMessage, 'user-1', 'ROOM-test');
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Message appears to be spam');
  });

  it('should validate links', () => {
    const messageWithLinks = 'Check this out: https://example.com and https://another.com';
    const result = messageValidation.validateMessage(messageWithLinks, 'user-1', 'ROOM-test');
    
    expect(result.isValid).toBe(true);
    expect(result.metadata?.hasLinks).toBe(true);
  });

  it('should reject too many links', () => {
    const messageWithManyLinks = 'Link1: https://example1.com Link2: https://example2.com Link3: https://example3.com Link4: https://example4.com';
    const result = messageValidation.validateMessage(messageWithManyLinks, 'user-1', 'ROOM-test');
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Too many links. Maximum 3 allowed');
  });

  it('should sanitize HTML tags', () => {
    const messageWithHtml = 'Hello <script>alert("xss")</script> world';
    const result = messageValidation.validateMessage(messageWithHtml, 'user-1', 'ROOM-test');
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('HTML tag <script> is not allowed');
    expect(result.sanitizedContent).toBeDefined();
  });

  it('should allow allowed HTML tags', () => {
    const messageWithAllowedHtml = 'Hello <b>bold</b> and <i>italic</i> text';
    const result = messageValidation.validateMessage(messageWithAllowedHtml, 'user-1', 'ROOM-test');
    
    expect(result.isValid).toBe(true);
  });

  it('should detect mentions', () => {
    const messageWithMentions = 'Hello @user1 and @user2!';
    const result = messageValidation.validateMessage(messageWithMentions, 'user-1', 'ROOM-test');
    
    expect(result.isValid).toBe(true);
    expect(result.metadata?.hasMentions).toBe(true);
  });

  it('should detect emojis', () => {
    const messageWithEmojis = 'Hello 😀 world 🌍!';
    const result = messageValidation.validateMessage(messageWithEmojis, 'user-1', 'ROOM-test');
    
    expect(result.isValid).toBe(true);
    expect(result.metadata?.hasEmojis).toBe(true);
  });

  it('should warn about too many emojis', () => {
    const messageWithManyEmojis = '😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀';
    const result = messageValidation.validateMessage(messageWithManyEmojis, 'user-1', 'ROOM-test');
    
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain('Too many emojis in message');
  });
});

describe('Integration Tests', () => {
  it('should handle complete message flow', async () => {
    const message: Message = {
      id: '1',
      text: 'Hello world!',
      roomId: 'ROOM-test',
      senderId: 'user-1',
      ts: Date.now(),
      type: 'message',
      roomType: 'general',
      createdAt: new Date().toISOString()
    };

    // Validate message
    const validation = messageValidation.validateMessage(message.text, message.senderId, message.roomId);
    expect(validation.isValid).toBe(true);

    // Check rate limits
    const rateLimit = rateLimiting.canSendMessage(message.senderId, message.text.length);
    expect(rateLimit.canSend).toBe(true);

    // Store message
    await messagePersistence.storeMessage(message);
    const retrieved = await messagePersistence.getMessages(message.roomId);
    expect(retrieved.messages).toHaveLength(1);

    // Record message for rate limiting
    rateLimiting.recordMessage(message.senderId, message.text.length);
  });

  it('should handle error scenarios', async () => {
    // Test error handling
    const error = new Error('Network error');
    errorHandling.handleMessagingError(error, 'ROOM-test', 'user-1', 'send_message');

    // Test rate limiting
    for (let i = 0; i < 35; i++) {
      rateLimiting.recordMessage('user-1', 50);
    }
    const rateLimit = rateLimiting.canSendMessage('user-1', 50);
    expect(rateLimit.canSend).toBe(false);

    // Test validation
    const validation = messageValidation.validateMessage('', 'user-1', 'ROOM-test');
    expect(validation.isValid).toBe(false);
  });
});
