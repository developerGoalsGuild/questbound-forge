/**
 * Blog Listing Page
 * 
 * Displays a list of blog posts with filtering and search.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { blogTranslations } from '@/i18n/blog';
import { commonTranslations } from '@/i18n/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Calendar, Clock, User, Star } from 'lucide-react';
import { blogPosts } from '@/data/blog/posts';

const Blog: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Access translations directly from translation files with safe fallback
  const currentLanguage = language && blogTranslations[language] ? language : 'en';
  const blogT = blogTranslations[currentLanguage];
  const commonT = commonTranslations[currentLanguage] || commonTranslations.en;

  const categories = [
    { id: 'product-updates', label: blogT.categories.productUpdates },
    { id: 'community', label: blogT.categories.community },
    { id: 'tips-tricks', label: blogT.categories.tipsTricks },
  ];

  const filteredPosts = useMemo(() => {
    let filtered = blogPosts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => {
        const t = post.translations[currentLanguage] || post.translations.en;
        return t.title.toLowerCase().includes(query) ||
          t.excerpt.toLowerCase().includes(query) ||
          t.author.toLowerCase().includes(query);
      });
    }

    if (selectedCategory) {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchQuery, selectedCategory, currentLanguage]);

  const featuredPosts = blogPosts.filter(post => post.featured).slice(0, 2);

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
            {commonT.back}
          </Button>
          <div className="space-y-1 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {blogT.title}
            </h1>
            <p className="text-muted-foreground">
              {blogT.subtitle}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={blogT.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                {blogT.all}
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

        {/* Featured Posts */}
        {featuredPosts.length > 0 && !searchQuery && !selectedCategory && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Star className="h-6 w-6" />
              {blogT.featured}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Card
                  key={post.slug}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge>{categories.find(c => c.id === post.category)?.label}</Badge>
                      {post.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <CardTitle className="line-clamp-2">{(post.translations[currentLanguage] || post.translations.en).title}</CardTitle>
                    <CardDescription className="line-clamp-2">{(post.translations[currentLanguage] || post.translations.en).excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {(post.translations[currentLanguage] || post.translations.en).author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime} {blogT.minRead}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {blogT.allPosts}
          </h2>
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {blogT.noPosts}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Card
                  key={post.slug}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge>{categories.find(c => c.id === post.category)?.label}</Badge>
                      {post.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <CardTitle className="line-clamp-2">{(post.translations[currentLanguage] || post.translations.en).title}</CardTitle>
                    <CardDescription className="line-clamp-3">{(post.translations[currentLanguage] || post.translations.en).excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {(post.translations[currentLanguage] || post.translations.en).author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime} {blogT.minRead}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Blog;

