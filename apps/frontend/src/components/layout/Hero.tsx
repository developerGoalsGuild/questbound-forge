import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { heroTranslations } from '@/i18n/hero';

const Hero = () => {
  const { t, language } = useTranslation();
  // heroTranslations is spread directly into t, so access directly from heroTranslations by language
  const heroT = heroTranslations[language];

  // Use a placeholder or public asset path for the hero image
  // If you have the image, uncomment and update the path
  // import heroImage from '@/assets/hero-castle.jpg';
  const heroImage = '/assets/images/hero-castle.jpg'; // Fallback to public asset

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" role="banner" data-testid="hero-section">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {heroImage ? (
          <img
            src={heroImage}
            alt="Medieval castle representing collaboration and achievement"
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              // Hide image on error, show gradient only
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto spacing-medieval text-center text-primary-foreground">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Main Heading */}
          <h1 className="font-cinzel text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {heroT.title}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 leading-relaxed max-w-3xl mx-auto">
            {heroT.subtitle}
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="btn-gold text-secondary-foreground px-8 py-4 text-lg font-semibold group"
              asChild
            >
              <a href="#waitlist">
                {heroT.ctaPrimary}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-primary-foreground/50 bg-white/10 backdrop-blur-sm text-primary-foreground hover:bg-primary-foreground hover:text-primary hover:border-primary-foreground px-8 py-4 text-lg group"
              asChild
            >
              <a href="#how-it-works">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                {heroT.ctaSecondary}
              </a>
            </Button>
          </div>

          {/* Stats or Trust Indicators - Hidden until dynamic numbers are available */}
          {/* <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl font-cinzel font-bold text-secondary mb-2">10K+</div>
              <div className="text-primary-foreground/80">{heroT.stats.activeAdventurers}</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-3xl font-cinzel font-bold text-secondary mb-2">50K+</div>
              <div className="text-primary-foreground/80">{heroT.stats.goalsAchieved}</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: '0.6s' }}>
              <div className="text-3xl font-cinzel font-bold text-secondary mb-2">100+</div>
              <div className="text-primary-foreground/80">{heroT.stats.partnerGuilds}</div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
