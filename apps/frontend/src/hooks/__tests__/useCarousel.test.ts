/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCarousel } from '../useCarousel';

describe('useCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test('initializes with first slide', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4 }));

    expect(result.current.currentSlide).toBe(0);
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.progress).toBe(0);
  });

  test('goes to next slide', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4 }));

    act(() => {
      result.current.nextSlide();
    });

    expect(result.current.currentSlide).toBe(1);
  });

  test('wraps around to first slide after last', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4 }));

    act(() => {
      result.current.goToSlide(3);
      result.current.nextSlide();
    });

    expect(result.current.currentSlide).toBe(0);
  });

  test('goes to previous slide', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4 }));

    act(() => {
      result.current.goToSlide(2);
      result.current.previousSlide();
    });

    expect(result.current.currentSlide).toBe(1);
  });

  test('wraps around to last slide before first', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4 }));

    act(() => {
      result.current.previousSlide();
    });

    expect(result.current.currentSlide).toBe(3);
  });

  test('goes to specific slide', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4 }));

    act(() => {
      result.current.goToSlide(2);
    });

    expect(result.current.currentSlide).toBe(2);
  });

  test('does not go to invalid slide index', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4 }));

    act(() => {
      result.current.goToSlide(5); // Invalid index
    });

    expect(result.current.currentSlide).toBe(0); // Should remain unchanged
  });

  test('toggles auto-play', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4 }));

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.toggleAutoPlay();
    });

    expect(result.current.isPlaying).toBe(false);

    act(() => {
      result.current.toggleAutoPlay();
    });

    expect(result.current.isPlaying).toBe(true);
  });

  test('pauses auto-play', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4, pauseOnHover: true }));

    act(() => {
      result.current.pauseAutoPlay?.();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  test('starts auto-play', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4, pauseOnHover: true }));

    act(() => {
      result.current.pauseAutoPlay?.();
      result.current.startAutoPlay?.();
    });

    expect(result.current.isPlaying).toBe(true);
  });

  test('auto-advances slides when playing', async () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4, autoPlayDelay: 1000 }));

    expect(result.current.currentSlide).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentSlide).toBe(1);
  });

  test('does not auto-advance when paused', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4, autoPlayDelay: 1000 }));

    act(() => {
      result.current.toggleAutoPlay();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentSlide).toBe(0);
  });

  test('pauses when page becomes hidden', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4 }));

    act(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isPlaying).toBe(false);
  });

  test('resumes when page becomes visible', () => {
    const { result } = renderHook(() => useCarousel({ slideCount: 4 }));

    act(() => {
      result.current.toggleAutoPlay(); // Pause first
    });

    act(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should remain paused since we manually paused it
    expect(result.current.isPlaying).toBe(false);
  });
});
