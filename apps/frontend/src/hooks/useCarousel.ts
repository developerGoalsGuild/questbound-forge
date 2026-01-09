import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCarouselOptions {
  slideCount: number;
  autoPlayDelay?: number;
  pauseOnHover?: boolean;
}

export function useCarousel({
  slideCount,
  autoPlayDelay = 5000,
  pauseOnHover = true,
}: UseCarouselOptions) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= slideCount) return;
      setCurrentSlide(index);
      setProgress(0);
      startTimeRef.current = Date.now();
    },
    [slideCount]
  );

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slideCount);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [slideCount]);

  const previousSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [slideCount]);

  const toggleAutoPlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const pauseAutoPlay = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const startAutoPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || slideCount === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // Progress bar animation
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / autoPlayDelay) * 100, 100);
      setProgress(newProgress);
    }, 50);

    // Slide transition
    intervalRef.current = setInterval(() => {
      nextSlide();
    }, autoPlayDelay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, autoPlayDelay, nextSlide, slideCount]);

  // Pause when page is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAutoPlay();
      } else if (isPlaying) {
        startAutoPlay();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, pauseAutoPlay, startAutoPlay]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previousSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleAutoPlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextSlide, previousSlide, toggleAutoPlay]);

  return {
    currentSlide,
    isPlaying,
    progress,
    goToSlide,
    nextSlide,
    previousSlide,
    toggleAutoPlay,
    pauseAutoPlay: pauseOnHover ? pauseAutoPlay : undefined,
    startAutoPlay: pauseOnHover ? startAutoPlay : undefined,
  };
}
