import { useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent } from '@/components/ui/card';

interface ProblemScenario {
  icon: string;
  title: string;
  description: string;
}

const ProblemRecognition = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const problemT = (t as any).problemRecognition || {};

  const scenarios: ProblemScenario[] = [
    {
      icon: '😔',
      title: problemT.scenarios?.loseSteam?.title || 'You Set Goals But Lose Steam',
      description: problemT.scenarios?.loseSteam?.description || 'You get excited about a new goal, make a plan, but after a few weeks you\'re back to your old habits. You feel like you\'re the only one who can\'t stick to their goals.',
    },
    {
      icon: '😤',
      title: problemT.scenarios?.goingAlone?.title || 'You\'re Going It Alone',
      description: problemT.scenarios?.goingAlone?.description || 'Your friends don\'t share your goals or understand your struggles. You wish you had someone who gets it, someone to celebrate your wins and help you through the tough days.',
    },
    {
      icon: '😰',
      title: problemT.scenarios?.overwhelmed?.title || 'You Feel Overwhelmed',
      description: problemT.scenarios?.overwhelmed?.description || 'You have big dreams but no idea how to break them down. You start multiple goals but never finish any of them. You need guidance, not just another app.',
    },
    {
      icon: '😞',
      title: problemT.scenarios?.lackAccountability?.title || 'You Lack Accountability',
      description: problemT.scenarios?.lackAccountability?.description || 'You know what you need to do, but there\'s no one holding you accountable. You make excuses, skip days, and eventually give up. You need someone who cares about your success.',
    },
    {
      icon: '😓',
      title: problemT.scenarios?.perfectionism?.title || 'You\'re Stuck in Perfectionism',
      description: problemT.scenarios?.perfectionism?.description || 'You want everything to be perfect before you start, so you never actually begin. You research endlessly, plan obsessively, but never take the first step. You need someone to push you forward.',
    },
    {
      icon: '😔',
      title: problemT.scenarios?.feelFailure?.title || 'You Feel Like a Failure',
      description: problemT.scenarios?.feelFailure?.description || 'Every time you don\'t follow through, you feel like you\'re letting yourself down. You start to believe you\'re just not the type of person who can achieve big goals. You need proof that you can succeed.',
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

    const cards = sectionRef.current?.querySelectorAll('.problem-card');
    cards?.forEach((card) => {
      card.classList.add('opacity-0', 'translate-y-4');
      card.classList.add('transition-all', 'duration-600', 'ease-out');
      observer.observe(card);
    });

    return () => {
      cards?.forEach((card) => observer.unobserve(card));
    };
  }, []);

  return (
    <section
      id="problem"
      ref={sectionRef}
      className="py-24 spacing-medieval bg-background"
      role="region"
      aria-labelledby="problem-title"
    >
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2
            id="problem-title"
            className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal"
          >
            {problemT.title || 'Does This Sound Like You?'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {scenarios.map((scenario, index) => (
            <Card
              key={index}
              className="problem-card guild-card group overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="text-5xl mb-4 text-center" role="img" aria-label={scenario.title}>
                  {scenario.icon}
                </div>
                <h3 className="font-cinzel text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {scenario.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {scenario.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center max-w-3xl mx-auto problem-card">
          <h3 className="font-cinzel text-2xl font-bold mb-4 text-foreground">
            {problemT.closing?.title || 'If you nodded "yes" to any of these, you\'re not alone.'}
          </h3>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {problemT.closing?.description || 'Millions of people struggle with the same challenges. The problem isn\'t you - it\'s that you\'re trying to achieve your goals in isolation.'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemRecognition;
