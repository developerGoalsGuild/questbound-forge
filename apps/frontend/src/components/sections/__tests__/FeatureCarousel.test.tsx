/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import FeatureCarousel from '../FeatureCarousel';

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronLeft: () => <div data-testid="chevron-left" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  CheckCircle2: () => <div data-testid="check-circle-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Layers: () => <div data-testid="layers-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
}));

// Mock useCarousel hook
const mockUseCarousel = {
  currentSlide: 0,
  isPlaying: true,
  progress: 50,
  goToSlide: vi.fn(),
  nextSlide: vi.fn(),
  previousSlide: vi.fn(),
  toggleAutoPlay: vi.fn(),
  pauseAutoPlay: vi.fn(),
  startAutoPlay: vi.fn(),
};

vi.mock('@/hooks/useCarousel', () => ({
  useCarousel: () => mockUseCarousel,
}));

// Mock translation hook
const mockTranslation = {
  featureCarousel: {
    title: 'Why GoalsGuild Works',
    subtitle: 'The features that make goal achievement finally possible',
    slides: {
      slide1: {
        title: 'Never Set Goals Alone Again',
        description: 'Finally, a way to break down your big dreams into manageable steps.',
        tags: ['AI Guidance', 'Clear Steps', 'Community Support'],
      },
      slide2: {
        title: 'Find Your Support System',
        description: 'Connect with people who actually understand your struggles.',
        tags: ['Smart Matching', 'Real Support', 'Genuine Connection'],
      },
      slide3: {
        title: 'Stay Motivated & Engaged',
        description: 'Finally, a way to make goal achievement fun and rewarding.',
        tags: ['Fun & Rewarding', 'Real Recognition', 'Sustained Motivation'],
      },
      slide4: {
        title: 'Get Real Support When You Need It',
        description: 'Connect with mentors who\'ve been where you are.',
        tags: ['Real Mentors', 'Active Communities', 'Timely Support'],
      },
    },
    indicators: ['Smart Goals', 'Matching', 'Gamification', 'Collaboration'],
    autoPlay: 'Auto-play',
  },
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: mockTranslation,
  }),
}));

describe('FeatureCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCarousel.currentSlide = 0;
    mockUseCarousel.isPlaying = true;
    mockUseCarousel.progress = 50;
  });

  test('renders carousel section with title', () => {
    render(<FeatureCarousel />);

    const section = screen.getByRole('region');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-labelledby', 'carousel-title');

    expect(screen.getByText('Why GoalsGuild Works')).toBeInTheDocument();
    expect(screen.getByText('The features that make goal achievement finally possible')).toBeInTheDocument();
  });

  test('renders all 4 carousel slides', () => {
    render(<FeatureCarousel />);

    expect(screen.getByText('Never Set Goals Alone Again')).toBeInTheDocument();
    expect(screen.getByText('Find Your Support System')).toBeInTheDocument();
    expect(screen.getByText('Stay Motivated & Engaged')).toBeInTheDocument();
    expect(screen.getByText('Get Real Support When You Need It')).toBeInTheDocument();
  });

  test('renders navigation buttons', () => {
    render(<FeatureCarousel />);

    const prevButton = screen.getByLabelText('Previous slide');
    const nextButton = screen.getByLabelText('Next slide');

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  test('navigation buttons call correct handlers', async () => {
    const user = userEvent.setup();
    render(<FeatureCarousel />);

    const prevButton = screen.getByLabelText('Previous slide');
    const nextButton = screen.getByLabelText('Next slide');

    await user.click(nextButton);
    expect(mockUseCarousel.nextSlide).toHaveBeenCalledTimes(1);

    await user.click(prevButton);
    expect(mockUseCarousel.previousSlide).toHaveBeenCalledTimes(1);
  });

  test('renders progress bar', () => {
    render(<FeatureCarousel />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  test('renders indicators', () => {
    render(<FeatureCarousel />);

    const indicators = screen.getAllByRole('tab');
    expect(indicators.length).toBe(4);
  });

  test('indicators call goToSlide when clicked', async () => {
    const user = userEvent.setup();
    render(<FeatureCarousel />);

    const indicators = screen.getAllByRole('tab');
    await user.click(indicators[1]);

    expect(mockUseCarousel.goToSlide).toHaveBeenCalledWith(1);
  });

  test('renders auto-play toggle button', () => {
    render(<FeatureCarousel />);

    const toggleButton = screen.getByLabelText('Pause auto-play');
    expect(toggleButton).toBeInTheDocument();
  });

  test('auto-play toggle calls toggleAutoPlay', async () => {
    const user = userEvent.setup();
    render(<FeatureCarousel />);

    const toggleButton = screen.getByLabelText('Pause auto-play');
    await user.click(toggleButton);

    expect(mockUseCarousel.toggleAutoPlay).toHaveBeenCalledTimes(1);
  });

  test('renders slide tags', () => {
    render(<FeatureCarousel />);

    expect(screen.getByText('AI Guidance')).toBeInTheDocument();
    expect(screen.getByText('Clear Steps')).toBeInTheDocument();
    expect(screen.getByText('Community Support')).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<FeatureCarousel />);

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'carousel-title');

    const tracks = screen.getAllByRole('group');
    const slideTrack = tracks.find(track => track.getAttribute('aria-label')?.includes('Slide'));
    expect(slideTrack).toBeInTheDocument();
    expect(slideTrack).toHaveAttribute('aria-label', 'Slide 1 of 4');
  });

  test('renders with proper carousel structure', () => {
    render(<FeatureCarousel />);

    const carousel = screen.getByRole('region');
    expect(carousel).toBeInTheDocument();
    
    // Check that slides are rendered
    const slides = screen.getAllByRole('group', { name: /Slide \d+ of 4/ });
    expect(slides.length).toBe(4);
  });

  test('keyboard navigation works via window events', () => {
    render(<FeatureCarousel />);

    // The useCarousel hook listens to window keydown events
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockUseCarousel.nextSlide).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(mockUseCarousel.previousSlide).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: ' ' });
    expect(mockUseCarousel.toggleAutoPlay).toHaveBeenCalledTimes(1);
  });
});
