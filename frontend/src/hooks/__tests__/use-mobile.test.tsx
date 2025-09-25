/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

// Mock matchMedia
const mockMatchMedia = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

beforeEach(() => {
  // Mock window.innerWidth
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: 1024
  });

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      dispatchEvent: vi.fn(),
    }))
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useIsMobile', () => {
  test('returns false for desktop screen width (1024px)', () => {
    window.innerWidth = 1024;

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  test('returns true for mobile screen width (767px)', () => {
    window.innerWidth = 767;

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  test('returns true for tablet screen width (768px)', () => {
    window.innerWidth = 768;

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false); // 768px is not less than 768
  });

  test('updates when window is resized', () => {
    window.innerWidth = 1024;

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Simulate window resize to mobile
    act(() => {
      window.innerWidth = 767;

      // Get the change handler that was added
      const changeHandler = mockAddEventListener.mock.calls[0][1];

      // Call the change handler
      changeHandler();
    });

    expect(result.current).toBe(true);
  });

  test('sets up matchMedia event listener on mount', () => {
    renderHook(() => useIsMobile());

    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  test('cleans up matchMedia event listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  test('handles undefined initial state correctly', () => {
    window.innerWidth = 767;

    const { result } = renderHook(() => useIsMobile());

    // Should return boolean, not undefined
    expect(typeof result.current).toBe('boolean');
    expect(result.current).toBe(true);
  });

  test('correctly determines mobile breakpoint at 767px', () => {
    window.innerWidth = 767;

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  test('correctly determines desktop at 768px', () => {
    window.innerWidth = 768;

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});
