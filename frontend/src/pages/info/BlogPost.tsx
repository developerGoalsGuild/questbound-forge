/**
 * Individual Blog Post Page
 * 
 * Displays a single blog post with markdown content.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, Star } from 'lucide-react';
import { blogPosts } from '@/data/blog/posts';
// Markdown will be rendered as HTML using a simple parser

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const blogTranslations = (t as any)?.blog || {};
  const commonTranslations = (t as any)?.common || {};

  const post = blogPosts.find(p => p.slug === slug);

  const categories = [
    { id: 'product-updates', label: blogTranslations?.categories?.productUpdates || 'Product Updates' },
    { id: 'community', label: blogTranslations?.categories?.community || 'Community' },
    { id: 'tips-tricks', label: blogTranslations?.categories?.tipsTricks || 'Tips & Tricks' }
  ];

  useEffect(() => {
    if (!post) {
      setLoading(false);
      return;
    }

    // Load markdown content - using fetch directly
    fetch(`/src/data/blog/posts/${post.slug}.md`)
      .then(res => {
        if (res.ok) {
          return res.text();
        }
        throw new Error('File not found');
      })
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        // Fallback if markdown file doesn't exist
        setContent('# ' + post.title + '\n\n' + post.excerpt);
        setLoading(false);
      });
  }, [post]);

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {blogTranslations?.notFound || 'Post Not Found'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {blogTranslations?.notFoundDescription || 'The blog post you\'re looking for doesn\'t exist.'}
              </p>
              <Button onClick={() => navigate('/blog')}>
                {blogTranslations?.backToBlog || 'Back to Blog'}
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
            {commonTranslations?.back || 'Back'}
          </Button>
        </div>

        {/* Post Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <Badge>{categoryLabel}</Badge>
              {post.featured && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
            </div>
            <CardTitle className="text-3xl mb-4">{post.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readTime} {blogTranslations?.minRead || 'min read'}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Post Content */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                {blogTranslations?.loading || 'Loading...'}
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
            {blogTranslations?.backToBlog || 'Back to Blog'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;

