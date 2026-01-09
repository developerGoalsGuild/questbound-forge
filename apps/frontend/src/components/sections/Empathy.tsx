import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface Stat {
  value: string;
  label: string;
}

const Empathy = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const empathyT = (t as any).empathy || {};
  const [animatedStats, setAnimatedStats] = useState<Stat[]>([
    { value: '0%', label: '' },
    { value: '0%', label: '' },
    { value: '0x', label: '' },
  ]);

  const stats: Stat[] = [
    {
      value: '92%',
      label: empathyT.stats?.giveUp?.label || 'of people give up on their goals within 3 months',
    },
    {
      value: '78%',
      label: empathyT.stats?.motivated?.label || 'feel more motivated when working with others',
    },
    {
      value: '3x',
      label: empathyT.stats?.accountability?.label || 'more likely to succeed with accountability',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate stats
            stats.forEach((stat, index) => {
              setTimeout(() => {
                setAnimatedStats((prev) => {
                  const newStats = [...prev];
                  newStats[index] = stat;
                  return newStats;
                });
              }, index * 200);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 spacing-medieval bg-gradient-parchment"
      role="region"
      aria-labelledby="empathy-title"
    >
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2
            id="empathy-title"
            className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal"
          >
            {empathyT.title || 'We Get It'}
          </h2>
        </div>

        <div className="max-w-4xl mx-auto mb-16">
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              {empathyT.message?.paragraph1 || 'We know how it feels to be excited about a goal, only to lose motivation when you\'re going it alone. It\'s frustrating when you have big dreams but no one to share the journey with. You\'re not alone in feeling like traditional goal-setting methods just don\'t work.'}
            </p>
            <p>
              {empathyT.message?.paragraph2 || 'The truth is, humans weren\'t meant to achieve goals in isolation. We\'re social creatures who thrive on connection, support, and shared experiences. When you try to go it alone, you\'re fighting against your natural instincts.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {animatedStats.map((stat, index) => (
            <div
              key={index}
              className="text-center animate-scale-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="text-5xl md:text-6xl font-cinzel font-bold text-primary mb-4 transition-all duration-1000">
                {stat.value}
              </div>
              <div className="text-muted-foreground leading-relaxed">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Empathy;
