/**
 * Message Validation Service
 * Validates and sanitizes messages before sending
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: string;
  metadata?: Record<string, any>;
}

export interface ValidationConfig {
  maxLength: number;
  minLength: number;
  allowedTags: string[];
  blockedWords: string[];
  enableProfanityFilter: boolean;
  enableSpamDetection: boolean;
  enableLinkDetection: boolean;
  maxLinks: number;
  enableEmojiValidation: boolean;
  enableMentionValidation: boolean;
}

export class MessageValidationService {
  private config: ValidationConfig;
  private profanityWords: Set<string>;
  private spamPatterns: RegExp[];

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      maxLength: 2000,
      minLength: 1,
      allowedTags: ['b', 'i', 'u', 'em', 'strong'],
      blockedWords: [],
      enableProfanityFilter: true,
      enableSpamDetection: true,
      enableLinkDetection: true,
      maxLinks: 3,
      enableEmojiValidation: true,
      enableMentionValidation: true,
      ...config
    };

    this.profanityWords = new Set([
      // Add profanity words here (keeping it minimal for example)
      'spam', 'scam', 'fake'
    ]);

    this.spamPatterns = [
      /(.)\1{4,}/g, // Repeated characters (aaaaa)
      /(https?:\/\/[^\s]+){3,}/g, // Multiple links
      /(.)\1{2,}/g, // Repeated patterns
      /[A-Z]{10,}/g, // Excessive caps
      /[!]{3,}/g, // Excessive exclamation marks
    ];
  }

  /**
   * Validate a message
   */
  validateMessage(content: string, userId: string, roomId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedContent = content;

    // Basic length validation
    if (content.length < this.config.minLength) {
      errors.push(`Message must be at least ${this.config.minLength} character(s) long`);
    }

    if (content.length > this.config.maxLength) {
      errors.push(`Message must be no more than ${this.config.maxLength} characters long`);
    }

    // Empty content check
    if (!content.trim()) {
      errors.push('Message cannot be empty');
    }

    // Profanity filter
    if (this.config.enableProfanityFilter) {
      const profanityResult = this.checkProfanity(content);
      if (profanityResult.hasProfanity) {
        errors.push('Message contains inappropriate content');
        sanitizedContent = profanityResult.sanitized;
      }
    }

    // Spam detection
    if (this.config.enableSpamDetection) {
      const spamResult = this.detectSpam(content);
      if (spamResult.isSpam) {
        errors.push('Message appears to be spam');
      }
      if (spamResult.warnings.length > 0) {
        warnings.push(...spamResult.warnings);
      }
    }

    // Link validation
    if (this.config.enableLinkDetection) {
      const linkResult = this.validateLinks(content);
      if (linkResult.error) {
        errors.push(linkResult.error);
      }
      if (linkResult.warnings.length > 0) {
        warnings.push(...linkResult.warnings);
      }
    }

    // HTML tag validation
    const htmlResult = this.validateHtmlTags(content);
    if (htmlResult.error) {
      errors.push(htmlResult.error);
    }
    if (htmlResult.sanitized) {
      sanitizedContent = htmlResult.sanitized;
    }

    // Emoji validation
    if (this.config.enableEmojiValidation) {
      const emojiResult = this.validateEmojis(content);
      if (emojiResult.warnings.length > 0) {
        warnings.push(...emojiResult.warnings);
      }
    }

    // Mention validation
    if (this.config.enableMentionValidation) {
      const mentionResult = this.validateMentions(content);
      if (mentionResult.warnings.length > 0) {
        warnings.push(...mentionResult.warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedContent: sanitizedContent !== content ? sanitizedContent : undefined,
      metadata: {
        originalLength: content.length,
        sanitizedLength: sanitizedContent.length,
        hasLinks: this.extractLinks(content).length > 0,
        hasMentions: this.extractMentions(content).length > 0,
        hasEmojis: this.extractEmojis(content).length > 0
      }
    };
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHtml(content: string): string {
    // Remove all HTML tags except allowed ones
    const allowedTags = this.config.allowedTags.join('|');
    const tagRegex = new RegExp(`<(?!/?(?:${allowedTags})\\b)[^>]*>`, 'gi');
    return content.replace(tagRegex, '');
  }

  /**
   * Check for profanity
   */
  private checkProfanity(content: string): { hasProfanity: boolean; sanitized: string } {
    let sanitized = content;
    let hasProfanity = false;

    for (const word of this.profanityWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(content)) {
        hasProfanity = true;
        sanitized = sanitized.replace(regex, '*'.repeat(word.length));
      }
    }

    return { hasProfanity, sanitized };
  }

  /**
   * Detect spam patterns
   */
  private detectSpam(content: string): { isSpam: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let isSpam = false;

    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) {
        warnings.push('Message contains suspicious patterns');
        isSpam = true;
      }
    }

    // Check for excessive repetition
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts: Record<string, number> = {};
    
    for (const word of words) {
      if (word.length > 3) { // Only count longer words
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }

    for (const [word, count] of Object.entries(wordCounts)) {
      if (count > 5) {
        warnings.push(`Word "${word}" appears too frequently`);
        isSpam = true;
      }
    }

    return { isSpam, warnings };
  }

  /**
   * Validate links in content
   */
  private validateLinks(content: string): { error?: string; warnings: string[] } {
    const links = this.extractLinks(content);
    const warnings: string[] = [];

    if (links.length > this.config.maxLinks) {
      return {
        error: `Too many links. Maximum ${this.config.maxLinks} allowed`,
        warnings
      };
    }

    // Check for suspicious links
    for (const link of links) {
      if (this.isSuspiciousLink(link)) {
        warnings.push(`Suspicious link detected: ${link}`);
      }
    }

    return { warnings };
  }

  /**
   * Validate HTML tags
   */
  private validateHtmlTags(content: string): { error?: string; sanitized?: string } {
    const htmlTagRegex = /<[^>]*>/g;
    const tags = content.match(htmlTagRegex) || [];
    
    for (const tag of tags) {
      const tagName = tag.match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/)?.[1];
      if (tagName && !this.config.allowedTags.includes(tagName.toLowerCase())) {
        return {
          error: `HTML tag <${tagName}> is not allowed`,
          sanitized: this.sanitizeHtml(content)
        };
      }
    }

    return {};
  }

  /**
   * Validate emojis
   */
  private validateEmojis(content: string): { warnings: string[] } {
    const warnings: string[] = [];
    const emojis = this.extractEmojis(content);

    if (emojis.length > 20) {
      warnings.push('Too many emojis in message');
    }

    return { warnings };
  }

  /**
   * Validate mentions
   */
  private validateMentions(content: string): { warnings: string[] } {
    const warnings: string[] = [];
    const mentions = this.extractMentions(content);

    if (mentions.length > 10) {
      warnings.push('Too many mentions in message');
    }

    return { warnings };
  }

  /**
   * Extract links from content
   */
  private extractLinks(content: string): string[] {
    const linkRegex = /https?:\/\/[^\s]+/g;
    return content.match(linkRegex) || [];
  }

  /**
   * Extract mentions from content
   */
  private extractMentions(content: string): string[] {
    const mentionRegex = /@\w+/g;
    return content.match(mentionRegex) || [];
  }

  /**
   * Extract emojis from content
   */
  private extractEmojis(content: string): string[] {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    return content.match(emojiRegex) || [];
  }

  /**
   * Check if a link is suspicious
   */
  private isSuspiciousLink(link: string): boolean {
    const suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'short.link'
    ];

    try {
      const url = new URL(link);
      return suspiciousDomains.some(domain => url.hostname.includes(domain));
    } catch {
      return true; // Invalid URL is suspicious
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Add blocked words
   */
  addBlockedWords(words: string[]): void {
    this.config.blockedWords.push(...words);
  }

  /**
   * Remove blocked words
   */
  removeBlockedWords(words: string[]): void {
    this.config.blockedWords = this.config.blockedWords.filter(
      word => !words.includes(word)
    );
  }
}

// Singleton instance
export const messageValidation = new MessageValidationService();
