import { useTranslation } from '@/hooks/useTranslation';

const SolutionIntro = () => {
  const { t } = useTranslation();
  const solutionT = (t as any).solutionIntro || {};

  return (
    <section
      className="py-24 spacing-medieval bg-background"
      role="region"
      aria-labelledby="solution-title"
    >
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h2
            id="solution-title"
            className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal"
          >
            {solutionT.title || 'Here\'s What Changed Everything'}
          </h2>
          <p className="text-2xl md:text-3xl font-semibold mb-8 text-foreground">
            {solutionT.subtitle || 'What if you never had to achieve your goals alone again?'}
          </p>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed text-left">
            <p>
              {solutionT.paragraph1 || 'GoalsGuild is the first platform designed around the truth that humans achieve more together than alone. We connect you with people who share your struggles, understand your goals, and genuinely want to see you succeed.'}
            </p>
            <p>
              {solutionT.paragraph2 || 'Imagine having a community of people who actually get it - who celebrate your wins, help you through setbacks, and hold you accountable when you need it most. That\'s what GoalsGuild provides.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionIntro;
