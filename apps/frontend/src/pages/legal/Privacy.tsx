/**
 * Privacy Policy Page
 * 
 * Displays the full privacy policy with section navigation.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Printer } from 'lucide-react';
import { privacyPolicyContent } from '@/data/legal/privacy';

const Privacy: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const privacyTranslations = (t as any)?.privacy || {};
  const commonTranslations = (t as any)?.common || {};
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: 'introduction', title: privacyTranslations?.sections?.introduction || 'Introduction' },
    { id: 'data-collection', title: privacyTranslations?.sections?.dataCollection || 'Data Collection' },
    { id: 'data-usage', title: privacyTranslations?.sections?.dataUsage || 'Data Usage' },
    { id: 'data-sharing', title: privacyTranslations?.sections?.dataSharing || 'Data Sharing' },
    { id: 'user-rights', title: privacyTranslations?.sections?.userRights || 'User Rights' },
    { id: 'cookies', title: privacyTranslations?.sections?.cookies || 'Cookies Policy' },
    { id: 'contact', title: privacyTranslations?.sections?.contact || 'Contact Information' }
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
                <Shield className="h-8 w-8" />
                {privacyTranslations?.title || 'Privacy Policy'}
              </h1>
              <p className="text-muted-foreground">
                {privacyTranslations?.subtitle || 'How we collect, use, and protect your data'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="hidden print:hidden md:flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {privacyTranslations?.print || 'Print'}
          </Button>
        </div>

        {/* Last Updated */}
        <div className="text-sm text-muted-foreground">
          {privacyTranslations?.lastUpdated || 'Last Updated'}: {privacyPolicyContent.lastUpdated || 'December 23, 2024'}
        </div>

        {/* Table of Contents */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-lg">
              {privacyTranslations?.tableOfContents || 'Table of Contents'}
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
            {privacyPolicyContent.sections.map((section, index) => (
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
              {privacyTranslations?.contact?.title || 'Questions About Privacy?'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {privacyTranslations?.contact?.description || 
               'If you have questions about this Privacy Policy, please contact us:'}
            </p>
            <div className="space-y-2">
              <p>
                <strong>{privacyTranslations?.contact?.email?.label || 'Email'}:</strong>{' '}
                <a href="mailto:privacy@goalsguild.com" className="text-primary hover:underline">
                  {privacyTranslations?.contact?.email?.value || 'privacy@goalsguild.com'}
                </a>
              </p>
              <p>
                <strong>{privacyTranslations?.contact?.address?.label || 'Address'}:</strong>{' '}
                {privacyTranslations?.contact?.address?.value || 'GoalsGuild Privacy Team'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;

