import { Target, Users, Trophy, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
//import collaborationImage from '@/assets/collaboration-guild.jpg';
//import achievementsImage from '@/assets/achievements.jpg';

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Target,
      title: t.features.goalTracking.title,
      description: t.features.goalTracking.description,
      gradient: 'from-primary to-primary-glow',
    },
    {
      icon: Users,
      title: t.features.community.title,
      description: t.features.community.description,
      gradient: 'from-secondary to-secondary-hover',
      image: '',//collaborationImage,
    },
    {
      icon: Trophy,
      title: t.features.gamification.title,
      description: t.features.gamification.description,
      gradient: 'from-secondary to-secondary-hover',
      image: '',//achievementsImage,
    },
    {
      icon: Crown,
      title: t.features.patronage.title,
      description: t.features.patronage.description,
      gradient: 'from-primary to-primary-glow',
    },
  ];

  return (
    <section id="features" className="py-24 spacing-medieval bg-gradient-parchment">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal">
            {t.features.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t.features.subtitle}
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
              Ready to Begin Your Adventure?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of adventurers already achieving their goals together.
            </p>
            <button className="btn-heraldic text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:shadow-royal transition-all duration-300">
              Start Your Journey
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
