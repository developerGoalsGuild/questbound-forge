import { Target, Users, Trophy, Crown, Brain, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { featuresTranslations } from '@/i18n/features';
//import collaborationImage from '@/assets/collaboration-guild.jpg';
//import achievementsImage from '@/assets/achievements.jpg';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
  badge?: string;
  tags?: string[];
  learnMoreLink?: string;
  image?: string;
}

const Features = () => {
  const { language } = useTranslation();
  // featuresTranslations is spread directly into t, so access directly from featuresTranslations by language
  const featuresT = featuresTranslations[language];
  const cta = featuresT.cta;

  const features: Feature[] = [
    {
      icon: Target,
      title: featuresT.goalTracking.title,
      description: featuresT.goalTracking.description,
      gradient: 'from-primary to-primary-glow',
      badge: featuresT.goalTracking.badge,
      tags: featuresT.goalTracking.tags,
      learnMoreLink: featuresT.goalTracking.learnMore,
    },
    {
      icon: Users,
      title: featuresT.community.title,
      description: featuresT.community.description,
      gradient: 'from-secondary to-secondary-hover',
      badge: featuresT.community.badge,
      tags: featuresT.community.tags,
      learnMoreLink: featuresT.community.learnMore,
      image: '',
    },
    {
      icon: Trophy,
      title: featuresT.gamification.title,
      description: featuresT.gamification.description,
      gradient: 'from-accent to-accent-glow',
      badge: featuresT.gamification.badge,
      tags: featuresT.gamification.tags,
      learnMoreLink: featuresT.gamification.learnMore,
      image: '',
    },
    {
      icon: Crown,
      title: featuresT.patronage.title,
      description: featuresT.patronage.description,
      gradient: 'from-gold to-gold-glow',
      badge: featuresT.patronage.badge || undefined,
      tags: featuresT.patronage.tags || undefined,
      learnMoreLink: featuresT.patronage.learnMore,
      image: '',
    },
    {
      icon: Brain,
      title: featuresT.aiInsights?.title || 'AI-Powered Insights',
      description: featuresT.aiInsights?.description || 'Get personalized recommendations, progress analysis, and AI-generated inspirational content to optimize your goal achievement strategy.',
      gradient: 'from-purple-500 to-purple-700',
      badge: featuresT.aiInsights?.badge || 'Intelligent',
      tags: featuresT.aiInsights?.tags || ['ML Analytics', 'Predictions', 'Personalization'],
      learnMoreLink: featuresT.aiInsights?.learnMore || '#',
    },
    {
      icon: TrendingUp,
      title: featuresT.progressTracking?.title || 'Progress Tracking',
      description: featuresT.progressTracking?.description || 'Visual dashboards, milestone tracking, and detailed analytics help you understand your patterns and celebrate achievements.',
      gradient: 'from-blue-500 to-blue-700',
      badge: featuresT.progressTracking?.badge || 'Analytics',
      tags: featuresT.progressTracking?.tags || ['Dashboards', 'Milestones', 'Analytics'],
      learnMoreLink: featuresT.progressTracking?.learnMore || '#',
    },
  ];

  return (
    <section id="features" data-testid="features-section" className="py-24 spacing-medieval bg-gradient-parchment" role="region" style={{ scrollMarginTop: '80px' }}>
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal">
            {featuresT.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {featuresT.subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={`feature-${feature.title}-${index}`}
                className="guild-card group overflow-hidden hover:shadow-medieval animate-scale-in relative"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardContent className="p-8">
                  {/* Feature Image (if available) */}
                  {feature.image && (
                    <div className="mb-6 rounded-lg overflow-hidden">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Icon and Badge */}
                  <div className="mb-6 flex items-start justify-between">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br ${feature.gradient} shadow-royal`}
                    >
                      <Icon className={`h-8 w-8 ${
                        feature.gradient.includes('accent') || feature.gradient.includes('gold')
                          ? 'text-primary' 
                          : 'text-primary-foreground'
                      }`} />
                    </div>
                    {feature.badge && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                        {feature.badge}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="font-cinzel text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Tags */}
                  {feature.tags && feature.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {feature.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Learn More Link */}
                  {feature.learnMoreLink && (
                    <div className="mt-4">
                      <a
                        href={feature.learnMoreLink}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link"
                      >
                        <span>Learn More</span>
                        <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  )}

                  {/* Hover Effect Border */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-lg transition-colors duration-300 pointer-events-none" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="medieval-banner p-8 max-w-2xl mx-auto">
            <h3 className="font-cinzel text-2xl font-bold mb-4 text-gradient-royal">
              {cta.title}
            </h3>
            <p className="text-muted-foreground mb-6">
              {cta.subtitle}
            </p>
            <button className="btn-heraldic text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:shadow-royal transition-all duration-300">
              {cta.button}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
