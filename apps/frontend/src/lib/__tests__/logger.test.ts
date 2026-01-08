import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the console methods before importing the logger
const consoleSpies = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.stubGlobal('console', {
    ...console,
    debug: consoleSpies.debug,
    info: consoleSpies.info,
    warn: consoleSpies.warn,
    error: consoleSpies.error,
});

import { logger, setLogLevel, LogLevel } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    // Reset mocks and log level before each test
    vi.clearAllMocks();
    setLogLevel(LogLevel.DEBUG); // Default to most permissive level for tests
  });

  afterEach(() => {
    // Restore original console methods
    vi.restoreAllMocks();
  });

  it('should call console.debug for logger.debug', () => {
    logger.debug('debug message', { test: 'debug' });
    expect(consoleSpies.debug).toHaveBeenCalledTimes(1);
    expect(consoleSpies.debug).toHaveBeenCalledWith(
      '[DEBUG] debug message',
      expect.objectContaining({
        level: 'DEBUG',
        message: 'debug message',
        test: 'debug',
      })
    );
  });

  it('should call console.info for logger.info', () => {
    logger.info('info message', { test: 'info' });
    expect(consoleSpies.info).toHaveBeenCalledTimes(1);
    expect(consoleSpies.info).toHaveBeenCalledWith(
      '[INFO] info message',
      expect.objectContaining({
        level: 'INFO',
        message: 'info message',
        test: 'info',
      })
    );
  });

  it('should call console.warn for logger.warn', () => {
    logger.warn('warn message', { test: 'warn' });
    expect(consoleSpies.warn).toHaveBeenCalledTimes(1);
    expect(consoleSpies.warn).toHaveBeenCalledWith(
      '[WARN] warn message',
      expect.objectContaining({
        level: 'WARN',
        message: 'warn message',
        test: 'warn',
      })
    );
  });

  it('should call console.error for logger.error', () => {
    logger.error('error message', { test: 'error' });
    expect(consoleSpies.error).toHaveBeenCalledTimes(1);
    expect(consoleSpies.error).toHaveBeenCalledWith(
      '[ERROR] error message',
      expect.objectContaining({
        level: 'ERROR',
        message: 'error message',
        test: 'error',
      })
    );
  });

  describe('Log Level Filtering', () => {
    it('should NOT log debug messages when level is INFO', () => {
      setLogLevel(LogLevel.INFO);
      logger.debug('should not appear');
      expect(consoleSpies.debug).not.toHaveBeenCalled();
      logger.info('should appear');
      expect(consoleSpies.info).toHaveBeenCalledTimes(1);
    });

    it('should NOT log info messages when level is WARN', () => {
      setLogLevel(LogLevel.WARN);
      logger.info('should not appear');
      expect(consoleSpies.info).not.toHaveBeenCalled();
      logger.warn('should appear');
      expect(consoleSpies.warn).toHaveBeenCalledTimes(1);
    });

    it('should NOT log warn messages when level is ERROR', () => {
      setLogLevel(LogLevel.ERROR);
      logger.warn('should not appear');
      expect(consoleSpies.warn).not.toHaveBeenCalled();
      logger.error('should appear');
      expect(consoleSpies.error).toHaveBeenCalledTimes(1);
    });

    it('should log all messages when level is DEBUG', () => {
      setLogLevel(LogLevel.DEBUG);
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      expect(consoleSpies.debug).toHaveBeenCalledTimes(1);
      expect(consoleSpies.info).toHaveBeenCalledTimes(1);
      expect(consoleSpies.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpies.error).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle logging without context', () => {
    logger.info('info message without context');
    expect(consoleSpies.info).toHaveBeenCalledTimes(1);
    expect(consoleSpies.info).toHaveBeenCalledWith(
      '[INFO] info message without context',
      expect.objectContaining({
        message: 'info message without context',
      })
    );
  });
});
