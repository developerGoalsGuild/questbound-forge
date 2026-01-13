/**
 * Individual Help Article Page
 * 
 * Displays a single help article.
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { helpTranslations } from '@/i18n/help';
import { commonTranslations } from '@/i18n/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { helpArticles } from '@/data/help/articles';

const HelpArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  
  // Access translations directly from translation files
  const helpT = helpTranslations[language];
  const commonT = commonTranslations[language];

  const article = helpArticles.find(a => a.slug === slug);

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {helpT.articleNotFound}
              </h2>
              <p className="text-muted-foreground mb-4">
                {helpT.articleNotFoundDescription}
              </p>
              <Button onClick={() => navigate('/help')}>
                {helpT.backToHelp}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/help')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {commonT.back}
          </Button>
        </div>

        {/* Article */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{article.translations[language].title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: article.translations[language].content
                  .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                  .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                  .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                  .replace(/^\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                  .replace(/^\*(.*)\*/gim, '<em>$1</em>')
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/\n/g, '<br />')
              }}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/help')}>
            {helpT.backToHelp}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HelpArticle;

