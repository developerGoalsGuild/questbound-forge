import { useEffect, useRef } from 'react';
import { Target, Users, Trophy, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent } from '@/components/ui/card';

interface Step {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const HowItWorks = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const howItWorksT = (t as any).howItWorks || {};

  const steps: Step[] = [
    {
      number: 1,
      icon: Target,
      title: howItWorksT.steps?.step1?.title || 'Share Your Goals',
      description: howItWorksT.steps?.step1?.description || 'Tell us about your goals and what you\'re trying to achieve. Our AI helps you break them down into actionable steps.',
    },
    {
      number: 2,
      icon: Users,
      title: howItWorksT.steps?.step2?.title || 'Find Your People',
      description: howItWorksT.steps?.step2?.description || 'We connect you with others who share similar goals, challenges, or can offer the support you need.',
    },
    {
      number: 3,
      icon: Trophy,
      title: howItWorksT.steps?.step3?.title || 'Achieve Together',
      description: howItWorksT.steps?.step3?.description || 'Work with your community, track progress, celebrate wins, and finally achieve the goals that matter to you.',
    },
    {
      number: 4,
      icon: Sparkles,
      title: howItWorksT.steps?.step4?.title || 'Get Matched Intelligently',
      description: howItWorksT.steps?.step4?.description || 'Our AI analyzes your goals, personality, and preferences to connect you with the perfect accountability partners and mentors.',
    },
    {
      number: 5,
      icon: TrendingUp,
      title: howItWorksT.steps?.step5?.title || 'Stay Motivated & Engaged',
      description: howItWorksT.steps?.step5?.description || 'Earn points, unlock achievements, and participate in challenges that make goal achievement fun and rewarding.',
    },
    {
      number: 6,
      icon: Heart,
      title: howItWorksT.steps?.step6?.title || 'Celebrate Your Success',
      description: howItWorksT.steps?.step6?.description || 'Share your wins with a community that truly understands and celebrates your achievements, creating lasting motivation.',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    const stepCards = sectionRef.current?.querySelectorAll('.step-card');
    stepCards?.forEach((card) => {
      card.classList.add('opacity-0', 'translate-y-4');
      card.classList.add('transition-all', 'duration-600', 'ease-out');
      observer.observe(card);
    });

    return () => {
      stepCards?.forEach((card) => observer.unobserve(card));
    };
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-24 spacing-medieval bg-gradient-parchment"
      role="region"
      aria-labelledby="how-it-works-title"
    >
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2
            id="how-it-works-title"
            className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal"
          >
            {howItWorksT.title || 'How GoalsGuild Works'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {howItWorksT.subtitle || 'Six simple steps to transform your goal achievement'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className="step-card guild-card group overflow-hidden relative"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-royal flex items-center justify-center text-2xl font-cinzel font-bold text-primary-foreground shadow-royal">
                        {step.number}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-royal mb-3">
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                      <h3 className="font-cinzel text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
