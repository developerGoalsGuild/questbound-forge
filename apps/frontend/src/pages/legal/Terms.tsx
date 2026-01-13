/**
 * Terms of Service Page
 * 
 * Displays the full terms of service with section navigation.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { termsTranslations } from '@/i18n/terms';
import { commonTranslations } from '@/i18n/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import { termsOfServiceContent } from '@/data/legal/terms';

const Terms: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  
  // Access translations directly from translation files
  const termsT = termsTranslations[language];
  const commonT = commonTranslations[language];
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: 'acceptance', title: termsT.sections.acceptance },
    { id: 'accounts', title: termsT.sections.accounts },
    { id: 'usage', title: termsT.sections.usage },
    { id: 'intellectual-property', title: termsT.sections.intellectualProperty },
    { id: 'liability', title: termsT.sections.liability },
    { id: 'termination', title: termsT.sections.termination },
    { id: 'changes', title: termsT.sections.changes },
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
                <FileText className="h-8 w-8" />
                {termsT.title}
              </h1>
              <p className="text-muted-foreground">
                {termsT.subtitle}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="hidden print:hidden md:flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {termsT.print}
          </Button>
        </div>

        {/* Last Updated */}
        <div className="text-sm text-muted-foreground">
          {termsT.lastUpdated}: {termsOfServiceContent.lastUpdated[language]}
        </div>

        {/* Table of Contents */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-lg">
              {termsT.tableOfContents}
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

        {/* Terms Content */}
        <Card className="print:border-0 print:shadow-none">
          <CardContent className="pt-6 space-y-8">
            {termsOfServiceContent.sections.map((section) => {
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
              {termsT.contact.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {termsT.contact.description}
            </p>
            <div className="space-y-2">
              <p>
                <strong>{termsT.contact.email.label}:</strong>{' '}
                <a href="mailto:legal@goalsguild.com" className="text-primary hover:underline">
                  {termsT.contact.email.value}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;

