/**
 * Rate Limiting Service
 * Prevents spam and abuse in the messaging system
 */

export interface RateLimitConfig {
  maxMessagesPerMinute: number;
  maxMessagesPerHour: number;
  maxMessagesPerDay: number;
  maxMessageLength: number;
  cooldownPeriod: number; // milliseconds
  enableTypingRateLimit: boolean;
  maxTypingEventsPerMinute: number;
}

export interface RateLimitInfo {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
  retryAfter?: number;
}

export interface MessageRateLimit {
  canSend: boolean;
  reason?: string;
  retryAfter?: number;
  rateLimitInfo: RateLimitInfo;
}

export class RateLimitingService {
  private config: RateLimitConfig;
  private messageCounts: Map<string, number[]> = new Map(); // userId -> timestamps
  private typingCounts: Map<string, number[]> = new Map(); // userId -> timestamps
  private cooldowns: Map<string, number> = new Map(); // userId -> cooldown end time
  private blockedUsers: Set<string> = new Set();

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxMessagesPerMinute: 30,
      maxMessagesPerHour: 500,
      maxMessagesPerDay: 2000,
      maxMessageLength: 2000,
      cooldownPeriod: 5000, // 5 seconds
      enableTypingRateLimit: true,
      maxTypingEventsPerMinute: 60,
      ...config
    };

    // Clean up old data periodically
    setInterval(() => this.cleanupOldData(), 60000); // Every minute
  }

  /**
   * Check if a user can send a message
   */
  canSendMessage(
    userId: string, 
    messageLength: number,
    roomId?: string
  ): MessageRateLimit {
    // Check if user is blocked
    if (this.blockedUsers.has(userId)) {
      return {
        canSend: false,
        reason: 'User is blocked',
        rateLimitInfo: {
          isLimited: true,
          remaining: 0,
          resetTime: Date.now() + 3600000, // 1 hour
          limit: 0
        }
      };
    }

    // Check cooldown
    const cooldownEnd = this.cooldowns.get(userId);
    if (cooldownEnd && Date.now() < cooldownEnd) {
      return {
        canSend: false,
        reason: 'Cooldown period active',
        retryAfter: cooldownEnd - Date.now(),
        rateLimitInfo: {
          isLimited: true,
          remaining: 0,
          resetTime: cooldownEnd,
          limit: 0
        }
      };
    }

    // Check message length
    if (messageLength > this.config.maxMessageLength) {
      return {
        canSend: false,
        reason: 'Message too long',
        rateLimitInfo: {
          isLimited: true,
          remaining: 0,
          resetTime: Date.now(),
          limit: this.config.maxMessageLength
        }
      };
    }

    // Check rate limits
    const now = Date.now();
    const userMessages = this.messageCounts.get(userId) || [];
    
    // Remove old timestamps
    const recentMessages = userMessages.filter(
      timestamp => now - timestamp < 60000 // Last minute
    );

    // Check per-minute limit
    if (recentMessages.length >= this.config.maxMessagesPerMinute) {
      const oldestMessage = Math.min(...recentMessages);
      const resetTime = oldestMessage + 60000;
      
      return {
        canSend: false,
        reason: 'Rate limit exceeded (per minute)',
        retryAfter: resetTime - now,
        rateLimitInfo: {
          isLimited: true,
          remaining: 0,
          resetTime,
          limit: this.config.maxMessagesPerMinute
        }
      };
    }

    // Check per-hour limit
    const hourlyMessages = userMessages.filter(
      timestamp => now - timestamp < 3600000 // Last hour
    );
    if (hourlyMessages.length >= this.config.maxMessagesPerHour) {
      const oldestMessage = Math.min(...hourlyMessages);
      const resetTime = oldestMessage + 3600000;
      
      return {
        canSend: false,
        reason: 'Rate limit exceeded (per hour)',
        retryAfter: resetTime - now,
        rateLimitInfo: {
          isLimited: true,
          remaining: 0,
          resetTime,
          limit: this.config.maxMessagesPerHour
        }
      };
    }

    // Check per-day limit
    const dailyMessages = userMessages.filter(
      timestamp => now - timestamp < 86400000 // Last day
    );
    if (dailyMessages.length >= this.config.maxMessagesPerDay) {
      const oldestMessage = Math.min(...dailyMessages);
      const resetTime = oldestMessage + 86400000;
      
      return {
        canSend: false,
        reason: 'Rate limit exceeded (per day)',
        retryAfter: resetTime - now,
        rateLimitInfo: {
          isLimited: true,
          remaining: 0,
          resetTime,
          limit: this.config.maxMessagesPerDay
        }
      };
    }

    // Calculate remaining messages
    const remaining = Math.min(
      this.config.maxMessagesPerMinute - recentMessages.length,
      this.config.maxMessagesPerHour - hourlyMessages.length,
      this.config.maxMessagesPerDay - dailyMessages.length
    );

    return {
      canSend: true,
      rateLimitInfo: {
        isLimited: false,
        remaining,
        resetTime: now + 60000, // Reset in 1 minute
        limit: this.config.maxMessagesPerMinute
      }
    };
  }

  /**
   * Record a sent message
   */
  recordMessage(userId: string, messageLength: number): void {
    const now = Date.now();
    const userMessages = this.messageCounts.get(userId) || [];
    userMessages.push(now);
    this.messageCounts.set(userId, userMessages);

    // Apply cooldown for very long messages
    if (messageLength > 1000) {
      this.cooldowns.set(userId, now + this.config.cooldownPeriod);
    }
  }

  /**
   * Check if user can send typing indicator
   */
  canSendTypingIndicator(userId: string): boolean {
    if (!this.config.enableTypingRateLimit) return true;

    const now = Date.now();
    const userTyping = this.typingCounts.get(userId) || [];
    const recentTyping = userTyping.filter(
      timestamp => now - timestamp < 60000 // Last minute
    );

    return recentTyping.length < this.config.maxTypingEventsPerMinute;
  }

  /**
   * Record a typing indicator
   */
  recordTypingIndicator(userId: string): void {
    const now = Date.now();
    const userTyping = this.typingCounts.get(userId) || [];
    userTyping.push(now);
    this.typingCounts.set(userId, userTyping);
  }

  /**
   * Get rate limit info for a user
   */
  getRateLimitInfo(userId: string): RateLimitInfo {
    const now = Date.now();
    const userMessages = this.messageCounts.get(userId) || [];
    const recentMessages = userMessages.filter(
      timestamp => now - timestamp < 60000 // Last minute
    );

    const remaining = Math.max(0, this.config.maxMessagesPerMinute - recentMessages.length);
    const resetTime = recentMessages.length > 0 
      ? Math.min(...recentMessages) + 60000 
      : now + 60000;

    return {
      isLimited: remaining === 0,
      remaining,
      resetTime,
      limit: this.config.maxMessagesPerMinute
    };
  }

  /**
   * Block a user (admin function)
   */
  blockUser(userId: string, duration?: number): void {
    this.blockedUsers.add(userId);
    
    if (duration) {
      setTimeout(() => {
        this.blockedUsers.delete(userId);
      }, duration);
    }
  }

  /**
   * Unblock a user (admin function)
   */
  unblockUser(userId: string): void {
    this.blockedUsers.delete(userId);
  }

  /**
   * Get blocked users
   */
  getBlockedUsers(): string[] {
    return Array.from(this.blockedUsers);
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  resetUserLimits(userId: string): void {
    this.messageCounts.delete(userId);
    this.typingCounts.delete(userId);
    this.cooldowns.delete(userId);
  }

  /**
   * Get rate limit statistics
   */
  getStats(): {
    totalUsers: number;
    blockedUsers: number;
    averageMessagesPerUser: number;
    topUsers: Array<{ userId: string; messageCount: number }>;
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    let totalMessages = 0;
    const userStats: Array<{ userId: string; messageCount: number }> = [];

    for (const [userId, timestamps] of this.messageCounts) {
      const recentMessages = timestamps.filter(timestamp => timestamp > oneHourAgo);
      totalMessages += recentMessages.length;
      userStats.push({ userId, messageCount: recentMessages.length });
    }

    userStats.sort((a, b) => b.messageCount - a.messageCount);

    return {
      totalUsers: this.messageCounts.size,
      blockedUsers: this.blockedUsers.size,
      averageMessagesPerUser: this.messageCounts.size > 0 
        ? totalMessages / this.messageCounts.size 
        : 0,
      topUsers: userStats.slice(0, 10)
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Private methods

  private cleanupOldData(): void {
    const now = Date.now();
    const oneDayAgo = now - 86400000;

    // Clean up old message timestamps
    for (const [userId, timestamps] of this.messageCounts) {
      const recentTimestamps = timestamps.filter(timestamp => timestamp > oneDayAgo);
      if (recentTimestamps.length === 0) {
        this.messageCounts.delete(userId);
      } else {
        this.messageCounts.set(userId, recentTimestamps);
      }
    }

    // Clean up old typing timestamps
    for (const [userId, timestamps] of this.typingCounts) {
      const recentTimestamps = timestamps.filter(timestamp => timestamp > oneDayAgo);
      if (recentTimestamps.length === 0) {
        this.typingCounts.delete(userId);
      } else {
        this.typingCounts.set(userId, recentTimestamps);
      }
    }

    // Clean up expired cooldowns
    for (const [userId, cooldownEnd] of this.cooldowns) {
      if (now > cooldownEnd) {
        this.cooldowns.delete(userId);
      }
    }
  }
}

// Singleton instance
export const rateLimiting = new RateLimitingService();
