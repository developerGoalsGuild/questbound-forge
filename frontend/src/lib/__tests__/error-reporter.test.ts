import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { QuestApiError } from '../apiQuest';

// Mock the logger dependency
const mockLoggerError = vi.fn();
vi.mock('../logger', () => ({
  logger: {
    error: mockLoggerError,
  },
}));

describe('Error Reporter', () => {
  beforeEach(() => {
    vi.resetModules(); // This is key to make mocks work with import.meta.env
    mockLoggerError.mockClear();
  });

  describe('in Production environment', () => {
    beforeEach(() => {
      vi.stubGlobal('import.meta.env', { PROD: true, DEV: false });
    });

    it('should NOT call the logger', async () => {
      const { reportError } = await import('../error-reporter');
      const error = new Error('Something went wrong');
      
      // We assume the external SDK is called, which we can't easily test here.
      // The main goal is to ensure our internal logger is NOT called.
      reportError(error, {});
      
      expect(mockLoggerError).not.toHaveBeenCalled();
    });
  });

  describe('in Development environment', () => {
    beforeEach(() => {
      vi.stubGlobal('import.meta.env', { PROD: false, DEV: true });
    });

    it('should log a standard Error via the logger', async () => {
      const { reportError } = await import('../error-reporter');
      const error = new Error('A standard error');
      const context = { userId: 123 };

      reportError(error, context);

      expect(mockLoggerError).toHaveBeenCalledTimes(1);
      expect(mockLoggerError).toHaveBeenCalledWith(
        '--- DEV: Error Report ---',
        expect.objectContaining({
          error,
          context: expect.objectContaining(context),
        })
      );
    });

    it('should extract details from a QuestApiError-like object', async () => {
      const { reportError } = await import('../error-reporter');
      
      const apiErrorDetails: Partial<QuestApiError> = {
        status: 500,
        statusText: 'Internal Server Error',
        errorBody: { errors: [{ field: 'name', message: 'is required' }] },
        requestId: 'xyz-123',
      };
      const error = new Error('API Failed');
      
      const context = { operation: 'createQuest', ...apiErrorDetails };
      reportError(error, context);

      expect(mockLoggerError).toHaveBeenCalledTimes(1);
      expect(mockLoggerError).toHaveBeenCalledWith(
        '--- DEV: Error Report ---',
        expect.objectContaining({
          error,
          context: expect.objectContaining({
            operation: 'createQuest',
            status: 500,
            statusText: 'Internal Server Error',
            apiErrors: [{ field: 'name', message: 'is required' }],
            requestId: 'xyz-123',
          }),
        })
      );
    });

    it('should handle an error with partial QuestApiError details', async () => {
      const { reportError } = await import('../error-reporter');
      const error = new Error('Simple API Error');
      const context = { status: 404 };
      
      reportError(error, context);

      expect(mockLoggerError).toHaveBeenCalledWith(
        '--- DEV: Error Report ---',
        expect.objectContaining({
          context: expect.objectContaining({
            status: 404,
          }),
        })
      );
    });
  });
});
