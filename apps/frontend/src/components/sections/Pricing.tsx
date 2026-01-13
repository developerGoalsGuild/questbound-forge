import { Check, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { subscriptionTranslations } from '@/i18n/subscription';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Pricing = () => {
  const { language } = useTranslation();
  // subscription is nested in translations, access directly from subscriptionTranslations
  const subscriptionT = subscriptionTranslations[language].subscription;
  const plansT = subscriptionT.plans;

  const plans = [
    {
      tier: 'initiate',
      name: plansT.initiate.name,
      price: plansT.initiate.price,
      period: plansT.initiate.period,
      description: plansT.initiate.description,
      features: plansT.initiate.features,
      cta: plansT.initiate.cta,
      popular: plansT.initiate.popular,
    },
    {
      tier: 'journeyman',
      name: plansT.journeyman.name,
      price: plansT.journeyman.price,
      period: plansT.journeyman.period,
      description: plansT.journeyman.description,
      features: plansT.journeyman.features,
      cta: plansT.journeyman.cta,
      popular: plansT.journeyman.popular,
    },
    {
      tier: 'sage',
      name: plansT.sage.name,
      price: plansT.sage.price,
      period: plansT.sage.period,
      description: plansT.sage.description,
      features: plansT.sage.features,
      cta: plansT.sage.cta,
      popular: plansT.sage.popular,
    },
    {
      tier: 'guildmaster',
      name: plansT.guildmaster.name,
      price: plansT.guildmaster.price,
      period: plansT.guildmaster.period,
      description: plansT.guildmaster.description,
      features: plansT.guildmaster.features,
      cta: plansT.guildmaster.cta,
      popular: plansT.guildmaster.popular,
    },
  ];

  return (
    <section id="pricing" data-testid="pricing-section" className="py-24 spacing-medieval bg-gradient-parchment" role="region" style={{ scrollMarginTop: '80px' }}>
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal">
            {subscriptionT.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {subscriptionT.subtitle}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card
              key={plan.tier}
              className={cn(
                'guild-card relative flex flex-col h-full animate-scale-in',
                plan.popular && 'border-primary border-2 shadow-lg scale-105'
              )}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary z-10">
                  {subscriptionT.mostPopular}
                </Badge>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                </div>
              </CardHeader>

              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {plan.tier === 'guildmaster' ? (
                  <Link to="/about" className="w-full">
                    <Button
                      variant={plan.popular ? 'default' : 'outline'}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/signup/LocalSignUp?plan=${plan.tier}`} className="w-full">
                    <Button
                      variant={plan.popular ? 'default' : 'outline'}
                      className="w-full"
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <div className="medieval-banner p-8 max-w-2xl mx-auto">
            <h3 className="font-cinzel text-2xl font-bold mb-4 text-gradient-royal">
              {subscriptionT.allPlansInclude}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>✓ {subscriptionT.allPlansFeatures.goalTracking}</div>
              <div>✓ {subscriptionT.allPlansFeatures.communityAccess}</div>
              <div>✓ {subscriptionT.allPlansFeatures.mobileApp}</div>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              {subscriptionT.needHelp} <Link to="/help" className="text-primary hover:underline">{subscriptionT.contactSupport}</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
