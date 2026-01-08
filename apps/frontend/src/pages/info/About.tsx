/**
 * About Us Page
 * 
 * Displays company information, mission, values, and team.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Target, Users, Heart, Award, Globe } from 'lucide-react';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const aboutTranslations = (t as any)?.about || {};
  const commonTranslations = (t as any)?.common || {};

  const values = [
    {
      icon: Target,
      title: aboutTranslations?.values?.purpose?.title || 'Purpose-Driven',
      description: aboutTranslations?.values?.purpose?.description || 'We believe every goal matters and deserves support.'
    },
    {
      icon: Users,
      title: aboutTranslations?.values?.community?.title || 'Community First',
      description: aboutTranslations?.values?.community?.description || 'Together we achieve more than we ever could alone.'
    },
    {
      icon: Heart,
      title: aboutTranslations?.values?.empathy?.title || 'Empathy & Support',
      description: aboutTranslations?.values?.empathy?.description || 'We understand the journey and celebrate every step.'
    },
    {
      icon: Award,
      title: aboutTranslations?.values?.excellence?.title || 'Excellence',
      description: aboutTranslations?.values?.excellence?.description || 'We strive for the highest quality in everything we do.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {commonTranslations?.back || 'Back'}
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8" />
              {aboutTranslations?.title || 'About Us'}
            </h1>
            <p className="text-muted-foreground">
              {aboutTranslations?.subtitle || 'Learn more about GoalsGuild and our mission'}
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {aboutTranslations?.mission?.title || 'Our Mission'}
            </CardTitle>
            <CardDescription>
              {aboutTranslations?.mission?.subtitle || 'What drives us every day'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">
              {aboutTranslations?.mission?.content || 
               'To democratize access to goal achievement by connecting people with complementary objectives, providing AI-powered guidance, and creating a sustainable ecosystem where users, businesses, and patrons collaborate for mutual growth.'}
            </p>
          </CardContent>
        </Card>

        {/* Vision Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {aboutTranslations?.vision?.title || 'Our Vision'}
            </CardTitle>
            <CardDescription>
              {aboutTranslations?.vision?.subtitle || 'Where we\'re heading'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">
              {aboutTranslations?.vision?.content || 
               'A world where no one achieves their goals alone. We envision a global community where every aspiration is supported, every milestone is celebrated, and every journey is shared.'}
            </p>
          </CardContent>
        </Card>

        {/* Values Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {aboutTranslations?.values?.title || 'Our Values'}
            </CardTitle>
            <CardDescription>
              {aboutTranslations?.values?.subtitle || 'The principles that guide us'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* What We Do Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {aboutTranslations?.whatWeDo?.title || 'What We Do'}
            </CardTitle>
            <CardDescription>
              {aboutTranslations?.whatWeDo?.subtitle || 'Our platform features'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {aboutTranslations?.whatWeDo?.goals?.title || 'Goal Management'}
              </h3>
              <p className="text-muted-foreground">
                {aboutTranslations?.whatWeDo?.goals?.description || 
                 'Create, track, and achieve your goals with AI-powered guidance and intelligent task breakdown.'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {aboutTranslations?.whatWeDo?.quests?.title || 'Quest System'}
              </h3>
              <p className="text-muted-foreground">
                {aboutTranslations?.whatWeDo?.quests?.description || 
                 'Gamify your journey with quests, XP, badges, and achievements that make progress fun and engaging.'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {aboutTranslations?.whatWeDo?.guilds?.title || 'Guilds & Community'}
              </h3>
              <p className="text-muted-foreground">
                {aboutTranslations?.whatWeDo?.guilds?.description || 
                 'Join or create guilds to collaborate with like-minded individuals and achieve shared objectives.'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {aboutTranslations?.whatWeDo?.collaboration?.title || 'Collaboration'}
              </h3>
              <p className="text-muted-foreground">
                {aboutTranslations?.whatWeDo?.collaboration?.description || 
                 'Invite others to collaborate on your goals and quests, sharing the journey together.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Team Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {aboutTranslations?.team?.title || 'Our Team'}
            </CardTitle>
            <CardDescription>
              {aboutTranslations?.team?.subtitle || 'The people behind GoalsGuild'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {aboutTranslations?.team?.description || 
               'We\'re a passionate team of developers, designers, and dreamers working to make goal achievement accessible to everyone.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">
                    {aboutTranslations?.team?.member?.title || 'Team Member'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {aboutTranslations?.team?.member?.role || 'Role'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Globe className="h-6 w-6" />
              {aboutTranslations?.contact?.title || 'Get in Touch'}
            </CardTitle>
            <CardDescription>
              {aboutTranslations?.contact?.subtitle || 'We\'d love to hear from you'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {aboutTranslations?.contact?.email?.label || 'Email'}
              </h3>
              <a 
                href="mailto:hello@goalsguild.com" 
                className="text-primary hover:underline"
              >
                {aboutTranslations?.contact?.email?.value || 'hello@goalsguild.com'}
              </a>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {aboutTranslations?.contact?.support?.label || 'Support'}
              </h3>
              <a 
                href="/help" 
                className="text-primary hover:underline"
              >
                {aboutTranslations?.contact?.support?.value || 'Visit our Help Center'}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;

