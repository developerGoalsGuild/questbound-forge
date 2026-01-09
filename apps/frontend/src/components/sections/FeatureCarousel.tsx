import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useCarousel } from '@/hooks/useCarousel';
import { CheckCircle2, Users, Layers, MessageSquare } from 'lucide-react';

interface CarouselSlide {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tags: string[];
}

const FeatureCarousel = () => {
  const { t } = useTranslation();
  const carouselT = (t as any).featureCarousel || {};
  const carouselRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const slides: CarouselSlide[] = [
    {
      icon: CheckCircle2,
      title: carouselT.slides?.slide1?.title || 'Never Set Goals Alone Again',
      description: carouselT.slides?.slide1?.description || 'Finally, a way to break down your big dreams into manageable steps with AI guidance and community support. No more overwhelming goals that you abandon after a few weeks.',
      tags: carouselT.slides?.slide1?.tags || ['AI Guidance', 'Clear Steps', 'Community Support'],
    },
    {
      icon: Users,
      title: carouselT.slides?.slide2?.title || 'Find Your Support System',
      description: carouselT.slides?.slide2?.description || 'Connect with people who actually understand your struggles and want to see you succeed. No more feeling alone in your journey.',
      tags: carouselT.slides?.slide2?.tags || ['Smart Matching', 'Real Support', 'Genuine Connection'],
    },
    {
      icon: Layers,
      title: carouselT.slides?.slide3?.title || 'Stay Motivated & Engaged',
      description: carouselT.slides?.slide3?.description || 'Finally, a way to make goal achievement fun and rewarding. Earn recognition for your progress and stay motivated with a system that actually works.',
      tags: carouselT.slides?.slide3?.tags || ['Fun & Rewarding', 'Real Recognition', 'Sustained Motivation'],
    },
    {
      icon: MessageSquare,
      title: carouselT.slides?.slide4?.title || 'Get Real Support When You Need It',
      description: carouselT.slides?.slide4?.description || 'Connect with mentors who\'ve been where you are, join communities that understand your goals, and get support exactly when you need it most.',
      tags: carouselT.slides?.slide4?.tags || ['Real Mentors', 'Active Communities', 'Timely Support'],
    },
  ];

  const {
    currentSlide,
    isPlaying,
    progress,
    goToSlide,
    nextSlide,
    previousSlide,
    toggleAutoPlay,
    pauseAutoPlay,
    startAutoPlay,
  } = useCarousel({
    slideCount: slides.length,
    autoPlayDelay: 5000,
    pauseOnHover: true,
  });

  // Touch/swipe support
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      previousSlide();
    }
  };

  return (
    <section
      className="py-24 spacing-medieval bg-background"
      role="region"
      aria-labelledby="carousel-title"
    >
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2
            id="carousel-title"
            className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal"
          >
            {carouselT.title || 'Why GoalsGuild Works'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {carouselT.subtitle || 'The features that make goal achievement finally possible'}
          </p>
        </div>

        <div
          ref={carouselRef}
          className="relative max-w-5xl mx-auto"
          onMouseEnter={pauseAutoPlay}
          onMouseLeave={() => isPlaying && startAutoPlay?.()}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Carousel Track */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-parchment">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              role="group"
              aria-label={`Slide ${currentSlide + 1} of ${slides.length}`}
            >
              {slides.map((slide, index) => {
                const Icon = slide.icon;
                return (
                  <div
                    key={index}
                    className="min-w-full px-8 py-12 md:px-16 md:py-16"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`Slide ${index + 1} of ${slides.length}`}
                  >
                    <div className="text-center max-w-3xl mx-auto">
                      <div className="mb-6 flex justify-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-royal">
                          <Icon className="h-10 w-10 text-primary-foreground" />
                        </div>
                      </div>
                      <h3 className="font-cinzel text-3xl font-bold mb-4 text-foreground">
                        {slide.title}
                      </h3>
                      <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                        {slide.description}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {slide.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
            onClick={previousSlide}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Progress Bar */}
          <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-3 mt-6" role="tablist" aria-label="Carousel slides">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={currentSlide === index}
                aria-label={`Go to slide ${index + 1}: ${slides[index].title}`}
                onClick={() => goToSlide(index)}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors ${
                  currentSlide === index
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentSlide === index ? 'bg-primary w-8' : 'bg-muted-foreground'
                  }`}
                />
                <span className="text-xs font-medium hidden sm:block">
                  {carouselT.indicators?.[index] || `Slide ${index + 1}`}
                </span>
              </button>
            ))}
          </div>

          {/* Auto-play Controls */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAutoPlay}
              aria-label={isPlaying ? 'Pause auto-play' : 'Play auto-play'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm">{carouselT.autoPlay || 'Auto-play'}</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureCarousel;
