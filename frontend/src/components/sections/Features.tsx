import { Target, Users, Trophy, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
//import collaborationImage from '@/assets/collaboration-guild.jpg';
//import achievementsImage from '@/assets/achievements.jpg';

const Features = () => {
  const { t } = useTranslation();
  const featuresT = t.features || {};
  const cta = featuresT.cta || {};

  const features = [
    {
      icon: Target,
      title: featuresT.goalTracking?.title || 'Advanced Goal Tracking',
      description: featuresT.goalTracking?.description || 'Track your progress with detailed analytics and milestone celebrations.',
      gradient: 'from-primary to-primary-glow',
    },
    {
      icon: Users,
      title: featuresT.community?.title || 'Community Support',
      description: featuresT.community?.description || 'Connect with like-minded adventurers for mutual encouragement and accountability.',
      gradient: 'from-secondary to-secondary-hover',
      image: '',
    },
    {
      icon: Trophy,
      title: featuresT.gamification?.title || 'Gamified Experience',
      description: featuresT.gamification?.description || 'Earn achievements, unlock rewards, and level up your goal-setting skills.',
      gradient: 'from-accent to-accent-glow',
      image: '',
    },
    {
      icon: Crown,
      title: featuresT.patronage?.title || 'Patronage System',
      description: featuresT.patronage?.description || 'Support the platform and gain exclusive benefits while helping others succeed.',
      gradient: 'from-gold to-gold-glow',
      image: '',
    },
  ];

  return (
    <section id="features" data-testid="features-section" className="py-24 spacing-medieval bg-gradient-parchment" role="region">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal">
            {featuresT.title || 'Powerful Features for Goal Achievement'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {featuresT.subtitle || 'Everything you need to turn your aspirations into achievements'}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="guild-card group overflow-hidden hover:shadow-medieval animate-scale-in"
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

                  {/* Icon */}
                  <div className="mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br ${feature.gradient} shadow-royal`}
                    >
                      <Icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-cinzel text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

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
              {cta.title || 'Ready to Begin Your Adventure?'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {cta.subtitle || 'Join thousands of adventurers already achieving their goals together.'}
            </p>
            <button className="btn-heraldic text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:shadow-royal transition-all duration-300">
              {cta.button || 'Start Your Journey'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
