/**
 * About Us Page
 * 
 * Displays company information, mission, values, and team.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { aboutTranslations } from '@/i18n/about';
import { commonTranslations } from '@/i18n/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Target, Users, Heart, Award, Globe } from 'lucide-react';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  
  // Access translations directly from translation files with safe fallback
  const currentLanguage = language && aboutTranslations[language] ? language : 'en';
  const aboutT = aboutTranslations[currentLanguage];
  const commonT = commonTranslations[currentLanguage] || commonTranslations.en;

  const values = [
    {
      icon: Target,
      title: aboutT.values.purpose.title,
      description: aboutT.values.purpose.description,
    },
    {
      icon: Users,
      title: aboutT.values.community.title,
      description: aboutT.values.community.description,
    },
    {
      icon: Heart,
      title: aboutT.values.empathy.title,
      description: aboutT.values.empathy.description,
    },
    {
      icon: Award,
      title: aboutT.values.excellence.title,
      description: aboutT.values.excellence.description,
    },
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
            {commonT.back}
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8" />
              {aboutT.title}
            </h1>
            <p className="text-muted-foreground">
              {aboutT.subtitle}
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {aboutT.mission.title}
            </CardTitle>
            <CardDescription>
              {aboutT.mission.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">
              {aboutT.mission.content}
            </p>
          </CardContent>
        </Card>

        {/* Vision Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {aboutT.vision.title}
            </CardTitle>
            <CardDescription>
              {aboutT.vision.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">
              {aboutT.vision.content}
            </p>
          </CardContent>
        </Card>

        {/* Values Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {aboutT.values.title}
            </CardTitle>
            <CardDescription>
              {aboutT.values.subtitle}
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
              {aboutT.whatWeDo.title}
            </CardTitle>
            <CardDescription>
              {aboutT.whatWeDo.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {aboutT.whatWeDo.goals.title}
              </h3>
              <p className="text-muted-foreground">
                {aboutT.whatWeDo.goals.description}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {aboutT.whatWeDo.quests.title}
              </h3>
              <p className="text-muted-foreground">
                {aboutT.whatWeDo.quests.description}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {aboutT.whatWeDo.guilds.title}
              </h3>
              <p className="text-muted-foreground">
                {aboutT.whatWeDo.guilds.description}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {aboutT.whatWeDo.collaboration.title}
              </h3>
              <p className="text-muted-foreground">
                {aboutT.whatWeDo.collaboration.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Team Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {aboutT.team.title}
            </CardTitle>
            <CardDescription>
              {aboutT.team.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {aboutT.team.description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">
                    {aboutT.team.member.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {aboutT.team.member.role}
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
              {aboutT.contact.title}
            </CardTitle>
            <CardDescription>
              {aboutT.contact.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {aboutT.contact.email.label}
              </h3>
              <a 
                href="mailto:hello@goalsguild.com" 
                className="text-primary hover:underline"
              >
                {aboutT.contact.email.value}
              </a>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {aboutT.contact.support.label}
              </h3>
              <a 
                href="/help" 
                className="text-primary hover:underline"
              >
                {aboutT.contact.support.value}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;

