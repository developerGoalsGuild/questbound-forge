import Header from '@/components/layout/Header';
import Hero from '@/components/layout/Hero';
import ProblemRecognition from '@/components/sections/ProblemRecognition';
import Empathy from '@/components/sections/Empathy';
import SolutionIntro from '@/components/sections/SolutionIntro';
import HowItWorks from '@/components/sections/HowItWorks';
import FeatureCarousel from '@/components/sections/FeatureCarousel';
import Testimonials from '@/components/sections/Testimonials';
import Features from '@/components/sections/Features';
import DevelopmentNotice from '@/components/sections/DevelopmentNotice';
import WaitlistForm from '@/components/forms/WaitlistForm';
import Footer from '@/components/layout/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <ProblemRecognition />
      <Empathy />
      <SolutionIntro />
      <HowItWorks />
      <FeatureCarousel />
      <Testimonials />
      <Features />
      <DevelopmentNotice />
      <section id="waitlist" className="py-24 spacing-medieval bg-gradient-parchment">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal">
              Ready to Finally Achieve Your Goals?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Stop setting goals alone. Join thousands of people who are already transforming their lives with community support, accountability, and the motivation they've been missing.
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
