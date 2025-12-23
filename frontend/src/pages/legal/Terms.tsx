/**
 * Terms of Service Page
 * 
 * Displays the full terms of service with section navigation.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import { termsOfServiceContent } from '@/data/legal/terms';

const Terms: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const termsTranslations = (t as any)?.terms || {};
  const commonTranslations = (t as any)?.common || {};
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: 'acceptance', title: termsTranslations?.sections?.acceptance || 'Acceptance of Terms' },
    { id: 'accounts', title: termsTranslations?.sections?.accounts || 'User Accounts' },
    { id: 'usage', title: termsTranslations?.sections?.usage || 'Service Usage Rules' },
    { id: 'intellectual-property', title: termsTranslations?.sections?.intellectualProperty || 'Intellectual Property' },
    { id: 'liability', title: termsTranslations?.sections?.liability || 'Limitation of Liability' },
    { id: 'termination', title: termsTranslations?.sections?.termination || 'Termination' },
    { id: 'changes', title: termsTranslations?.sections?.changes || 'Changes to Terms' }
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
              {commonTranslations?.back || 'Back'}
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-8 w-8" />
                {termsTranslations?.title || 'Terms of Service'}
              </h1>
              <p className="text-muted-foreground">
                {termsTranslations?.subtitle || 'The terms and conditions for using GoalsGuild'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="hidden print:hidden md:flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {termsTranslations?.print || 'Print'}
          </Button>
        </div>

        {/* Last Updated */}
        <div className="text-sm text-muted-foreground">
          {termsTranslations?.lastUpdated || 'Last Updated'}: {termsOfServiceContent.lastUpdated || 'December 23, 2024'}
        </div>

        {/* Table of Contents */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-lg">
              {termsTranslations?.tableOfContents || 'Table of Contents'}
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
            {termsOfServiceContent.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-20"
              >
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <div className="prose prose-sm max-w-none">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                  {section.items && (
                    <ul className="list-disc list-inside space-y-2 mb-4">
                      {section.items.map((item, iIndex) => (
                        <li key={iIndex}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {termsTranslations?.contact?.title || 'Questions About Terms?'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {termsTranslations?.contact?.description || 
               'If you have questions about these Terms of Service, please contact us:'}
            </p>
            <div className="space-y-2">
              <p>
                <strong>{termsTranslations?.contact?.email?.label || 'Email'}:</strong>{' '}
                <a href="mailto:legal@goalsguild.com" className="text-primary hover:underline">
                  {termsTranslations?.contact?.email?.value || 'legal@goalsguild.com'}
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

