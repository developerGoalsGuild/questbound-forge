/**
 * Help Center Page
 * 
 * Displays FAQ, help articles, and search functionality.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Search, HelpCircle, Book, MessageSquare } from 'lucide-react';
import { faqs } from '@/data/help/faq';
import { helpArticles } from '@/data/help/articles';

const Help: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const helpTranslations = (t as any)?.help || {};
  const commonTranslations = (t as any)?.common || {};

  const categories = [
    { id: 'getting-started', label: helpTranslations?.categories?.gettingStarted || 'Getting Started' },
    { id: 'goals-quests', label: helpTranslations?.categories?.goalsQuests || 'Goals & Quests' },
    { id: 'guilds', label: helpTranslations?.categories?.guilds || 'Guilds' },
    { id: 'billing', label: helpTranslations?.categories?.billing || 'Billing' },
    { id: 'troubleshooting', label: helpTranslations?.categories?.troubleshooting || 'Troubleshooting' }
  ];

  const filteredFaqs = useMemo(() => {
    let filtered = faqs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const filteredArticles = useMemo(() => {
    let filtered = helpArticles;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const popularArticles = helpArticles.slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
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
          <div className="space-y-1 flex-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <HelpCircle className="h-8 w-8" />
              {helpTranslations?.title || 'Help Center'}
            </h1>
            <p className="text-muted-foreground">
              {helpTranslations?.subtitle || 'Find answers and learn how to use GoalsGuild'}
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={helpTranslations?.searchPlaceholder || 'Search for help...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>{helpTranslations?.categories?.title || 'Browse by Category'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                {helpTranslations?.all || 'All'}
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Articles */}
        {popularArticles.length > 0 && !searchQuery && !selectedCategory && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Book className="h-6 w-6" />
              {helpTranslations?.popularArticles || 'Popular Articles'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularArticles.map((article) => (
                <Card
                  key={article.slug}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/help/article/${article.slug}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{article.excerpt}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            {helpTranslations?.faq || 'Frequently Asked Questions'}
          </h2>
          {filteredFaqs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {helpTranslations?.noFaqs || 'No FAQs found'}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Help Articles */}
        {filteredArticles.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              {helpTranslations?.articles || 'Help Articles'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((article) => (
                <Card
                  key={article.slug}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/help/article/${article.slug}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{article.excerpt}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>{helpTranslations?.contactSupport || 'Still Need Help?'}</CardTitle>
            <CardDescription>
              {helpTranslations?.contactSupportDescription || 'Can\'t find what you\'re looking for? Contact our support team.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>{helpTranslations?.email || 'Email'}:</strong>{' '}
                <a href="mailto:support@goalsguild.com" className="text-primary hover:underline">
                  support@goalsguild.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                {helpTranslations?.responseTime || 'We typically respond within 24 hours.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Help;

