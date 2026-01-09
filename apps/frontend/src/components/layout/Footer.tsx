import { useState, useCallback } from 'react';
import { Shield, Facebook, Twitter, Linkedin, Mail, Heart, Loader2, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { subscribeToNewsletter, NewsletterResponse } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ARIALiveRegion, { FormAnnouncements } from '@/components/ui/ARIALiveRegion';

const Footer = () => {
  const { t } = useTranslation();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterAnnouncement, setNewsletterAnnouncement] = useState('');
  const [newsletterAnnouncementPriority, setNewsletterAnnouncementPriority] = useState<'polite' | 'assertive'>('polite');

  const footerLinks = {
    product: [
      { name: t.nav?.features || 'Features', href: "#features" },
      { name: t.footer?.links?.pricing || 'Pricing', href: "#pricing" },
      { name: t.footer?.links?.community || 'Community', href: "#community" },
      { name: t.footer?.links?.apiDocumentation || 'API Documentation', href: "/docs" },
    ],
    company: [
      { name: t.footer?.links?.aboutUs || 'About Us', href: "/about" },
      { name: t.footer?.links?.blog || 'Blog', href: "/blog" },
      { name: t.footer?.links?.careers || 'Careers', href: "/careers" },
      { name: t.nav?.contact || 'Contact', href: "#contact" },
    ],
    support: [
      { name: t.footer?.links?.helpCenter || 'Help Center', href: "/help" },
      { name: t.footer?.links?.privacyPolicy || 'Privacy Policy', href: "/privacy" },
      { name: t.footer?.links?.termsOfService || 'Terms of Service', href: "/terms" },
      { name: t.footer?.links?.status || 'Status', href: "/status" },
    ],
  };

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
    { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
    { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com" },
    { name: "Email", icon: Mail, href: "mailto:hello@goalguild.com" },
  ];

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleNewsletterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setNewsletterError(null);
    setNewsletterSuccess(false);
    setNewsletterAnnouncement('');

    if (!newsletterEmail.trim()) {
      const errorMsg = t.footer?.newsletter?.emailRequired || 'Email is required';
      setNewsletterError(errorMsg);
      setNewsletterAnnouncement(FormAnnouncements.fieldRequired('Email'));
      setNewsletterAnnouncementPriority('assertive');
      return;
    }

    if (!validateEmail(newsletterEmail)) {
      const errorMsg = t.footer?.newsletter?.emailInvalid || 'Please enter a valid email address';
      setNewsletterError(errorMsg);
      setNewsletterAnnouncement(FormAnnouncements.validationError('Email'));
      setNewsletterAnnouncementPriority('assertive');
      return;
    }

    setNewsletterSubmitting(true);
    setNewsletterAnnouncement(t.footer?.newsletter?.submitting || 'Subscribing...');
    setNewsletterAnnouncementPriority('polite');

    try {
      const response: NewsletterResponse = await subscribeToNewsletter(newsletterEmail.trim(), 'footer');
      
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      setNewsletterError(null);
      setNewsletterAnnouncement(response.message || t.footer?.newsletter?.success || 'Successfully subscribed to newsletter');
      setNewsletterAnnouncementPriority('polite');
      
      setTimeout(() => {
        setNewsletterSuccess(false);
        setNewsletterAnnouncement('');
      }, 5000);
    } catch (err: any) {
      const errorMessage = err?.message || t.footer?.newsletter?.error || 'Something went wrong. Please try again later.';
      setNewsletterError(errorMessage);
      setNewsletterAnnouncement(FormAnnouncements.formError(errorMessage));
      setNewsletterAnnouncementPriority('assertive');
    } finally {
      setNewsletterSubmitting(false);
    }
  }, [newsletterEmail, validateEmail, t]);

  const handleNewsletterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewsletterEmail(e.target.value);
    if (newsletterError) {
      setNewsletterError(null);
    }
    if (newsletterSuccess) {
      setNewsletterSuccess(false);
    }
  }, [newsletterError, newsletterSuccess]);

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto spacing-medieval py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-8 w-8 text-secondary" />
              <span className="font-cinzel text-2xl font-bold text-gradient-gold">
                GoalGuild
              </span>
            </div>
            
            <p className="text-primary-foreground/80 leading-relaxed mb-6 max-w-md">
              {t.footer?.description || 'Join a medieval-inspired community where goals become quests, progress is celebrated, and mutual support leads to extraordinary achievements.'}
            </p>

            <div className="flex items-center gap-2 text-sm text-primary-foreground/60">
              <span>{t.footer?.madeWith || 'Made with'}</span>
              <Heart className="h-4 w-4 text-secondary" />
              <span>{t.footer?.forAdventurers || 'for adventurers worldwide'}</span>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="font-cinzel text-lg font-semibold mb-4 text-secondary">
              {t.footer?.sections?.product || 'Product'}
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-secondary transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-cinzel text-lg font-semibold mb-4 text-secondary">
              {t.footer?.sections?.company || 'Company'}
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-secondary transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-cinzel text-lg font-semibold mb-4 text-secondary">
              {t.footer?.sections?.support || 'Support'}
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-secondary transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="medieval-banner p-6 mb-12 bg-primary-foreground/10 border-primary-foreground/20">
          <ARIALiveRegion 
            message={newsletterAnnouncement} 
            priority={newsletterAnnouncementPriority} 
            className="sr-only"
          />
          <div className="text-center max-w-lg mx-auto">
            <h3 className="font-cinzel text-xl font-bold mb-2 text-secondary">
              {t.footer?.newsletter?.title || 'Join the Guild Newsletter'}
            </h3>
            <p className="text-primary-foreground/70 mb-4">
              {t.footer?.newsletter?.subtitle || 'Get weekly updates on community achievements and new features.'}
            </p>
            <form onSubmit={handleNewsletterSubmit} noValidate role="form" aria-label="Newsletter subscription form">
              <div className="flex gap-2">
                <label htmlFor="newsletter-email" className="sr-only">
                  {t.footer?.newsletter?.emailLabel || 'Email address'}
                </label>
                <Input
                  id="newsletter-email"
                  type="email"
                  value={newsletterEmail}
                  onChange={handleNewsletterChange}
                  placeholder={t.footer?.newsletter?.placeholder || 'Enter your email'}
                  disabled={newsletterSubmitting}
                  aria-invalid={!!newsletterError}
                  aria-describedby={newsletterError ? 'newsletter-error' : newsletterSuccess ? 'newsletter-success' : undefined}
                  className={`flex-1 ${newsletterError ? 'border-red-500' : ''}`}
                  required
                />
                <Button
                  type="submit"
                  disabled={newsletterSubmitting || !newsletterEmail.trim()}
                  className="btn-gold text-secondary-foreground px-6 py-2 rounded-lg font-semibold whitespace-nowrap"
                >
                  {newsletterSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t.footer?.newsletter?.submitting || 'Subscribing...'}
                    </>
                  ) : newsletterSuccess ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {t.footer?.newsletter?.subscribed || 'Subscribed!'}
                    </>
                  ) : (
                    t.footer?.newsletter?.button || 'Subscribe'
                  )}
                </Button>
              </div>
              {newsletterError && (
                <p
                  id="newsletter-error"
                  className="text-xs text-red-300 mt-2 text-left"
                  role="alert"
                  aria-live="assertive"
                >
                  {newsletterError}
                </p>
              )}
              {newsletterSuccess && (
                <p
                  id="newsletter-success"
                  className="text-xs text-green-300 mt-2 text-left"
                  role="alert"
                  aria-live="polite"
                >
                  {t.footer?.newsletter?.success || 'Thank you for subscribing!'}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center pt-8 border-t border-primary-foreground/20">
          <div className="text-primary-foreground/60 text-sm mb-4 lg:mb-0">
            {t.footer?.copyright || '© 2024 GoalGuild. All rights reserved. Built with AWS serverless architecture.'}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  className="p-2 bg-primary-foreground/10 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-colors duration-200"
                  aria-label={social.name}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
