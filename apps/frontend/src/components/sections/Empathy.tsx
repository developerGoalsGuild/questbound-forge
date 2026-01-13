import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { landingPageTranslations } from '@/i18n/landingPage';

interface Stat {
  value: string;
  label: string;
  reference?: string;
}

const Empathy = () => {
  const { language } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  // empathy is a property in translations, access it directly from landingPageTranslations
  const empathyT = landingPageTranslations[language].empathy;
  const [animatedStats, setAnimatedStats] = useState<Stat[]>([
    { value: '0%', label: '', reference: '' },
    { value: '0%', label: '', reference: '' },
    { value: '0x', label: '', reference: '' },
  ]);

  const stats: Stat[] = [
    {
      value: '92%',
      label: empathyT.stats.giveUp.label,
      reference: empathyT.stats.giveUp.reference,
    },
    {
      value: '78%',
      label: empathyT.stats.motivated.label,
      reference: empathyT.stats.motivated.reference,
    },
    {
      value: '3x',
      label: empathyT.stats.accountability.label,
      reference: empathyT.stats.accountability.reference,
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
  }, [stats]);

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
            {empathyT.title}
          </h2>
        </div>

        <div className="max-w-4xl mx-auto mb-16">
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              {empathyT.message.paragraph1}
            </p>
            <p>
              {empathyT.message.paragraph2}
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
              <div className="text-muted-foreground leading-relaxed mb-2">
                {stat.label}
              </div>
              {stat.reference && (
                <div className="text-xs text-muted-foreground/70 italic mt-2">
                  {stat.reference}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Empathy;
