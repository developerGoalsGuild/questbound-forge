// frontend/src/lib/logger.ts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  operation?: string;
  requestId?: string;
  [key: string]: any;
}

// Set the default log level. This can be dynamically changed.
let currentLogLevel: LogLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;

function log(level: LogLevel, message: string, context: LogContext = {}): void {
  if (level < currentLogLevel) {
    return;
  }

  const timestamp = new Date().toISOString();
  const levelString = LogLevel[level];
  
  const logEntry = {
    timestamp,
    level: levelString,
    message,
    ...context,
  };

  const consoleMethod = {
    [LogLevel.DEBUG]: console.debug,
    [LogLevel.INFO]: console.info,
    [LogLevel.WARN]: console.warn,
    [LogLevel.ERROR]: console.error,
  }[level];

  consoleMethod(`[${levelString}] ${message}`, logEntry);
}

export const logger = {
  debug: (message: string, context?: LogContext) => log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: LogContext) => log(LogLevel.INFO, message, context),
  warn: (message: string, context?: LogContext) => log(LogLevel.WARN, message, context),
  error: (message: string, context?: LogContext) => log(LogLevel.ERROR, message, context),
};

export function setLogLevel(level: LogLevel) {
  currentLogLevel = level;
}

// Call this from your main App component or a debug utility
export function initializeDebugMode() {
  if (typeof window !== 'undefined' && window.localStorage.getItem('debug') === 'true') {
    logger.setLevel(LogLevel.DEBUG);
  }
}
