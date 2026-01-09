/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';

describe('useOnlineStatus', () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('returns true when navigator.onLine is true', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);
  });

  test('returns false when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);
  });

  test('updates when online event fires', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(true);
  });

  test('updates when offline event fires', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  test('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
