import { Users, MessageSquare, Trophy, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { Link } from 'react-router-dom';

const Community = () => {
  const { t } = useTranslation();
  const communityT = (t as any).community || {};

  const communityFeatures = [
    {
      icon: Users,
      title: communityT.features?.joinGuilds?.title || 'Join Guilds',
      description: communityT.features?.joinGuilds?.description || 'Connect with like-minded adventurers in specialized guilds focused on your interests and goals.',
      gradient: 'from-primary to-primary-glow',
    },
    {
      icon: MessageSquare,
      title: communityT.features?.activeDiscussions?.title || 'Active Discussions',
      description: communityT.features?.activeDiscussions?.description || 'Engage in meaningful conversations, share progress, and get support from fellow members.',
      gradient: 'from-secondary to-secondary-hover',
    },
    {
      icon: Trophy,
      title: communityT.features?.leaderboards?.title || 'Leaderboards',
      description: communityT.features?.leaderboards?.description || 'Compete in friendly challenges and see how you rank among your peers.',
      gradient: 'from-accent to-accent-glow',
    },
    {
      icon: TrendingUp,
      title: communityT.features?.sharedProgress?.title || 'Shared Progress',
      description: communityT.features?.sharedProgress?.description || 'Celebrate achievements together and inspire others with your journey.',
      gradient: 'from-purple-500 to-purple-700',
    },
  ];

  const stats = [
    { value: '10K+', label: communityT.stats?.activeMembers || 'Active Members' },
    { value: '500+', label: communityT.stats?.guildsCreated || 'Guilds Created' },
    { value: '50K+', label: communityT.stats?.goalsCompleted || 'Goals Completed' },
    { value: '1M+', label: communityT.stats?.messagesShared || 'Messages Shared' },
  ];

  return (
    <section id="community" data-testid="community-section" className="py-24 spacing-medieval bg-background" role="region" style={{ scrollMarginTop: '80px' }}>
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal">
            {communityT.title || 'Join a Thriving Community'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {communityT.subtitle || 'Connect with thousands of adventurers who are achieving their goals together. Share your journey, get support, and celebrate wins as a community.'}
          </p>
        </div>

        {/* Stats - Hidden until real numbers are available */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card
              key={`stat-${stat.label}-${index}`}
              className="guild-card text-center animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-gradient-royal mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div> */}

        {/* Community Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {communityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={`community-feature-${feature.title}-${index}`}
                className="guild-card group overflow-hidden hover:shadow-medieval animate-scale-in relative"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardContent className="p-8">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br ${feature.gradient} shadow-royal mb-6`}
                  >
                    <Icon className={`h-8 w-8 ${
                      feature.gradient.includes('accent') 
                        ? 'text-primary' 
                        : 'text-primary-foreground'
                    }`} />
                  </div>
                  <h3 className="font-cinzel text-xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-lg transition-colors duration-300 pointer-events-none" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="medieval-banner p-8 max-w-2xl mx-auto">
            <h3 className="font-cinzel text-2xl font-bold mb-4 text-gradient-royal">
              {communityT.cta?.title || 'Ready to Join the Guild?'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {communityT.cta?.subtitle || 'Become part of a community that supports your journey to success.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup/LocalSignUp">
                <Button className="btn-heraldic text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:shadow-royal transition-all duration-300">
                  {communityT.cta?.joinNow || 'Join Now'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/guilds">
                <Button variant="outline" className="px-8 py-3 rounded-lg font-semibold">
                  {communityT.cta?.exploreGuilds || 'Explore Guilds'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community;
