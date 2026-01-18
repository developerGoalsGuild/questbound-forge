/**
 * Individual Blog Post Page
 * 
 * Displays a single blog post with markdown content.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { blogTranslations } from '@/i18n/blog';
import { commonTranslations } from '@/i18n/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, Star } from 'lucide-react';
import { blogPosts } from '@/data/blog/posts';
// Markdown will be rendered as HTML using a simple parser

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Access translations directly from translation files with safe fallback
  const currentLanguage = language && blogTranslations[language] ? language : 'en';
  const blogT = blogTranslations[currentLanguage];
  const commonT = commonTranslations[currentLanguage] || commonTranslations.en;

  const post = blogPosts.find(p => p.slug === slug);

  const categories = [
    { id: 'product-updates', label: blogT.categories.productUpdates },
    { id: 'community', label: blogT.categories.community },
    { id: 'tips-tricks', label: blogT.categories.tipsTricks },
  ];

  useEffect(() => {
    if (!post) {
      setLoading(false);
      return;
    }

    // Load markdown content - using fetch directly with language-specific file
    fetch(`/src/data/blog/posts/${post.slug}.${currentLanguage}.md`)
      .then(res => {
        if (res.ok) {
          return res.text();
        }
        // Fallback to English if language-specific file doesn't exist
        if (currentLanguage !== 'en') {
          return fetch(`/src/data/blog/posts/${post.slug}.en.md`)
            .then(res => res.ok ? res.text() : Promise.reject());
        }
        throw new Error('File not found');
      })
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        // Fallback if markdown file doesn't exist
        const t = post.translations[currentLanguage] || post.translations.en;
        setContent('# ' + t.title + '\n\n' + t.excerpt);
        setLoading(false);
      });
  }, [post, currentLanguage]);

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {blogT.notFound}
              </h2>
              <p className="text-muted-foreground mb-4">
                {blogT.notFoundDescription}
              </p>
              <Button onClick={() => navigate('/blog')}>
                {blogT.backToBlog}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const categoryLabel = categories.find(c => c.id === post.category)?.label || post.category;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {commonT.back}
          </Button>
        </div>

        {/* Post Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <Badge>{categoryLabel}</Badge>
              {post.featured && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
            </div>
            <CardTitle className="text-3xl mb-4">{(post.translations[currentLanguage] || post.translations.en).title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {(post.translations[currentLanguage] || post.translations.en).author}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : currentLanguage === 'es' ? 'es-ES' : 'fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readTime} {blogT.minRead}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Post Content */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                {blogT.loading}
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <div 
                  className="blog-content"
                  dangerouslySetInnerHTML={{ 
                    __html: content
                      .split('\n\n')
                      .map(para => {
                        if (para.startsWith('# ')) {
                          return `<h1>${para.substring(2)}</h1>`;
                        }
                        if (para.startsWith('## ')) {
                          return `<h2>${para.substring(3)}</h2>`;
                        }
                        if (para.startsWith('### ')) {
                          return `<h3>${para.substring(4)}</h3>`;
                        }
                        return `<p>${para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br />')}</p>`;
                      })
                      .join('')
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/blog')}>
            {blogT.backToBlog}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;

