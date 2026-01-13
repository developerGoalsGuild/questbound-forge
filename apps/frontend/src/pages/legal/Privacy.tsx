/**
 * Privacy Policy Page
 * 
 * Displays the full privacy policy with section navigation.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { privacyTranslations } from '@/i18n/privacy';
import { commonTranslations } from '@/i18n/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Printer } from 'lucide-react';
import { privacyPolicyContent } from '@/data/legal/privacy';

const Privacy: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  
  // Access translations directly from translation files
  const privacyT = privacyTranslations[language];
  const commonT = commonTranslations[language];
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: 'introduction', title: privacyT.sections.introduction },
    { id: 'data-collection', title: privacyT.sections.dataCollection },
    { id: 'data-usage', title: privacyT.sections.dataUsage },
    { id: 'data-sharing', title: privacyT.sections.dataSharing },
    { id: 'user-rights', title: privacyT.sections.userRights },
    { id: 'cookies', title: privacyT.sections.cookies },
    { id: 'contact', title: privacyT.sections.contact },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
                {privacyT.title}
              </h1>
              <p className="text-muted-foreground">
                {privacyT.subtitle}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="hidden print:hidden md:flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {privacyT.print}
          </Button>
        </div>

        {/* Last Updated */}
        <div className="text-sm text-muted-foreground">
          {privacyT.lastUpdated}: {privacyPolicyContent.lastUpdated[language]}
        </div>

        {/* Table of Contents */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-lg">
              {privacyT.tableOfContents}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="space-y-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(section.id);
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="block text-primary hover:underline"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Privacy Policy Content */}
        <Card className="print:border-0 print:shadow-none">
          <CardContent className="pt-6 space-y-8">
            {privacyPolicyContent.sections.map((section) => {
              const t = section.translations[language];
              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-20"
                >
                  <h2 className="text-2xl font-bold mb-4">{t.title}</h2>
                  <div className="prose prose-sm max-w-none">
                    {t.content.map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-4 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                    {t.items && (
                      <ul className="list-disc list-inside space-y-2 mb-4">
                        {t.items.map((item, iIndex) => (
                          <li key={iIndex}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              );
            })}
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {privacyT.contact.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {privacyT.contact.description}
            </p>
            <div className="space-y-2">
              <p>
                <strong>{privacyT.contact.email.label}:</strong>{' '}
                <a href="mailto:privacy@goalsguild.com" className="text-primary hover:underline">
                  {privacyT.contact.email.value}
                </a>
              </p>
              <p>
                <strong>{privacyT.contact.address.label}:</strong>{' '}
                {privacyT.contact.address.value}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;

