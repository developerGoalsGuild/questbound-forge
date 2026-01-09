/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { subscribeToWaitlist, subscribeToNewsletter } from '../api';

// Mock getApiBase from utils
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils');
  return {
    ...actual,
    getApiBase: () => 'https://test-api.example.com/v1',
  };
});

// Mock environment variables
vi.stubEnv('VITE_API_GATEWAY_KEY', 'test-api-key');

describe('Waitlist API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test('subscribeToWaitlist sends correct request', async () => {
    const mockResponse = {
      message: 'Successfully subscribed to waitlist',
      email: 'test@example.com',
      subscribed: true,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await subscribeToWaitlist('test@example.com');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://test-api.example.com/v1/waitlist/subscribe',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      }
    );

    expect(result).toEqual(mockResponse);
  });

  test('subscribeToWaitlist handles API errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ detail: 'Invalid email address' }),
    });

    await expect(subscribeToWaitlist('invalid-email')).rejects.toThrow('Invalid email address');
  });

  test('subscribeToWaitlist handles network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(subscribeToWaitlist('test@example.com')).rejects.toThrow('Network error');
  });

  test('subscribeToWaitlist throws error when API base URL is not configured', async () => {
    vi.doMock('../utils', () => ({
      getApiBase: () => null,
    }));

    await expect(subscribeToWaitlist('test@example.com')).rejects.toThrow('API base URL not configured');
  });

  test('subscribeToWaitlist throws error when API key is not configured', async () => {
    vi.stubEnv('VITE_API_GATEWAY_KEY', '');

    await expect(subscribeToWaitlist('test@example.com')).rejects.toThrow('API Gateway key not configured');
  });
});

describe('Newsletter API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.stubEnv('VITE_API_GATEWAY_KEY', 'test-api-key');
  });

  test('subscribeToNewsletter sends correct request', async () => {
    const mockResponse = {
      message: 'Successfully subscribed to newsletter',
      email: 'test@example.com',
      subscribed: true,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await subscribeToNewsletter('test@example.com', 'footer');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://test-api.example.com/v1/newsletter/subscribe',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({ email: 'test@example.com', source: 'footer' }),
      }
    );

    expect(result).toEqual(mockResponse);
  });

  test('subscribeToNewsletter uses default source when not provided', async () => {
    const mockResponse = {
      message: 'Successfully subscribed to newsletter',
      email: 'test@example.com',
      subscribed: true,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await subscribeToNewsletter('test@example.com');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ email: 'test@example.com', source: 'footer' }),
      })
    );
  });

  test('subscribeToNewsletter handles API errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ detail: 'Rate limit exceeded' }),
    });

    await expect(subscribeToNewsletter('test@example.com')).rejects.toThrow('Rate limit exceeded');
  });

  test('subscribeToNewsletter logs error details', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ detail: 'Server error' }),
    });

    await expect(subscribeToNewsletter('test@example.com')).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Newsletter API Error:',
      expect.objectContaining({
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    consoleSpy.mockRestore();
  });
});
