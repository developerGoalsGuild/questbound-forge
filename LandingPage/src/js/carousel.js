/**
 * GoalsGuild Landing Page - Enhanced Carousel Component
 * Handles feature carousel functionality with fancy controls
 */

class Carousel {
    constructor(elementId) {
        this.carousel = document.getElementById(elementId);
        if (!this.carousel) return;

        this.slides = this.carousel.querySelectorAll('.carousel-slide');
        this.track = this.carousel.querySelector('.carousel-track');
        this.prevBtn = this.carousel.querySelector('.carousel-prev');
        this.nextBtn = this.carousel.querySelector('.carousel-next');
        this.indicatorsContainer = this.carousel.querySelector('.carousel-indicators');
        this.progressBar = this.carousel.querySelector('.progress-fill');
        this.playPauseBtn = this.carousel.querySelector('.play-pause');
        this.playIcon = this.carousel.querySelector('.play-icon');
        this.pauseIcon = this.carousel.querySelector('.pause-icon');
        
        this.currentSlide = 0;
        this.slideCount = this.slides.length;
        this.autoPlayInterval = null;
        this.progressInterval = null;
        this.autoPlayDelay = 5000; // 5 seconds
        this.isPlaying = true;

        this.init();
    }

    init() {
        if (this.slideCount === 0) return;

        // Add event listeners
        this.prevBtn.addEventListener('click', () => this.previousSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        this.playPauseBtn.addEventListener('click', () => this.toggleAutoPlay());

        // Enhanced indicators
        this.indicators = this.indicatorsContainer.querySelectorAll('.indicator');
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
            if (e.key === ' ') {
                e.preventDefault();
                this.toggleAutoPlay();
            }
        });

        // Touch/swipe support
        this.addSwipeSupport();

        // Start autoplay
        this.startAutoPlay();

        // Pause on hover
        this.carousel.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.carousel.addEventListener('mouseleave', () => {
            if (this.isPlaying) this.startAutoPlay();
        });

        // Pause when page is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoPlay();
            } else if (this.isPlaying) {
                this.startAutoPlay();
            }
        });

        // Initialize progress bar
        this.updateProgressBar();
    }

    goToSlide(index) {
        // Remove active class from current slide and indicator
        this.slides[this.currentSlide].classList.remove('active');
        this.indicators[this.currentSlide].classList.remove('active');

        // Update current slide
        this.currentSlide = index;

        // Add active class to new slide and indicator
        this.slides[this.currentSlide].classList.add('active');
        this.indicators[this.currentSlide].classList.add('active');

        // Update track position
        this.updateTrackPosition();

        // Update progress bar
        this.updateProgressBar();

        // Restart autoplay if playing
        if (this.isPlaying) {
            this.startAutoPlay();
        }
    }

    updateTrackPosition() {
        const translateX = -this.currentSlide * 100;
        this.track.style.transform = `translateX(${translateX}%)`;
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slideCount;
        this.goToSlide(nextIndex);
    }

    previousSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slideCount) % this.slideCount;
        this.goToSlide(prevIndex);
    }

    startAutoPlay() {
        this.pauseAutoPlay();
        this.isPlaying = true;
        this.updatePlayPauseButton();
        
        this.autoPlayInterval = setInterval(() => this.nextSlide(), this.autoPlayDelay);
        this.startProgressBar();
    }

    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    toggleAutoPlay() {
        if (this.isPlaying) {
            this.pauseAutoPlay();
            this.isPlaying = false;
        } else {
            this.startAutoPlay();
        }
        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        if (this.isPlaying) {
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
        } else {
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
        }
    }

    startProgressBar() {
        this.progressBar.style.width = '0%';
        this.progressBar.style.transition = 'none';
        
        // Force reflow
        this.progressBar.offsetHeight;
        
        this.progressBar.style.transition = `width ${this.autoPlayDelay}ms linear`;
        this.progressBar.style.width = '100%';
    }

    updateProgressBar() {
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }
    }

    addSwipeSupport() {
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;

        this.carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        this.carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const swipeThreshold = 50;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;

            // Only handle horizontal swipes
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
                if (diffX > 0) {
                    // Swiped left - next slide
                    this.nextSlide();
                } else {
                    // Swiped right - previous slide
                    this.previousSlide();
                }
            }
        };

        this.handleSwipe = handleSwipe;
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Carousel('featuresCarousel');
});

