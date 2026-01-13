import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Hero from '@/components/layout/Hero';
import ProblemRecognition from '@/components/sections/ProblemRecognition';
import Empathy from '@/components/sections/Empathy';
import SolutionIntro from '@/components/sections/SolutionIntro';
import HowItWorks from '@/components/sections/HowItWorks';
import FeatureCarousel from '@/components/sections/FeatureCarousel';
import Features from '@/components/sections/Features';
import Community from '@/components/sections/Community';
import Pricing from '@/components/sections/Pricing';
import Contact from '@/components/sections/Contact';
import DevelopmentNotice from '@/components/sections/DevelopmentNotice';
import WaitlistForm from '@/components/forms/WaitlistForm';
import Footer from '@/components/layout/Footer';
import { useTranslation } from '@/hooks/useTranslation';

const Index = () => {
  const { t } = useTranslation();
  const waitlistT = (t as any).waitlist || {};
  
  // Smooth scroll behavior for CSS
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <ProblemRecognition />
      <Empathy />
      <SolutionIntro />
      <HowItWorks />
      <FeatureCarousel />
      <Features />
      <Community />
      <Pricing />
      <Contact />
      <DevelopmentNotice />
      <section id="waitlist" className="py-24 spacing-medieval bg-gradient-parchment">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal">
              {waitlistT.title || 'Ready to Finally Achieve Your Goals?'}
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {waitlistT.subtitle || 'Stop setting goals alone. Join thousands of people who are already transforming their lives with community support, accountability, and the motivation they\'ve been missing.'}
            </p>
            <WaitlistForm variant="default" />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Index;
