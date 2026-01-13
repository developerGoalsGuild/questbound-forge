import { useState, useCallback } from 'react';
import { Heart, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import GoalsGuildLogo from '@/assets/GoalsGuild_Logo.png';
import { commonTranslations } from '@/i18n/common';
import { navTranslations } from '@/i18n/nav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ARIALiveRegion, { FormAnnouncements } from '@/components/ui/ARIALiveRegion';

const Footer = () => {
  const { language, t } = useTranslation();
  // Access footer translations directly from commonTranslations
  const footerT = commonTranslations[language].footer;
  const nav = navTranslations[language];
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterAnnouncement, setNewsletterAnnouncement] = useState('');
  const [newsletterAnnouncementPriority, setNewsletterAnnouncementPriority] = useState<'polite' | 'assertive'>('polite');
  
  // Substack URL - can be configured via environment variable
  const substackUrl = import.meta.env.VITE_SUBSTACK_URL || 'https://substack.com/@goalsguild/subscribe';

  const footerLinks = {
    product: [
      { name: nav.features, href: "#features" },
      { name: footerT.links.pricing, href: "#pricing" },
      { name: footerT.links.community, href: "#community" },
    ],
    company: [
      { name: footerT.links.aboutUs, href: "/about" },
      { name: footerT.links.blog, href: "/blog" },
      { name: nav.contact, href: "#contact" },
    ],
    support: [
      { name: footerT.links.helpCenter, href: "/help" },
      { name: footerT.links.privacyPolicy, href: "/privacy" },
      { name: footerT.links.termsOfService, href: "/terms" },
      { name: footerT.links.status, href: "/status" },
    ],
  };

  // Custom icon components for social media platforms
  const XIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.79-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );

  const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );

  const ThreadsIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12.186 8.302c1.803 0 3.262 1.459 3.262 3.262 0 1.802-1.459 3.261-3.262 3.261-1.802 0-3.261-1.459-3.261-3.261 0-1.803 1.459-3.262 3.261-3.262zm0-1.5c-2.629 0-4.761 2.133-4.761 4.762s2.132 4.761 4.761 4.761 4.762-2.132 4.762-4.761-2.133-4.762-4.762-4.762zm5.095-2.302c.414 0 .75.336.75.75v2.25c0 .414-.336.75-.75.75s-.75-.336-.75-.75V5.25c0-.414.336-.75.75-.75zm-10.19 0c.414 0 .75.336.75.75v2.25c0 .414-.336.75-.75.75s-.75-.336-.75-.75V5.25c0-.414.336-.75.75-.75zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.5c-5.79 0-10.5-4.71-10.5-10.5S6.21 1.5 12 1.5 22.5 6.21 22.5 12 17.79 22.5 12 22.5z"/>
    </svg>
  );

  const SubstackIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V22.64l12 5.759 12-5.759V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
    </svg>
  );

  const YoutubeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );

  const socialLinks = [
    { name: "X (Twitter)", icon: XIcon, href: "https://x.com/goalsguild" },
    { name: "Substack", icon: SubstackIcon, href: "https://substack.com/@goalsguild" },
    { name: "Instagram", icon: InstagramIcon, href: "https://www.instagram.com/goalsguild/" },
    { name: "TikTok", icon: TikTokIcon, href: "https://www.tiktok.com/@goalsguild" },
    { name: "Threads", icon: ThreadsIcon, href: "https://www.threads.com/@goalsguild" },
    { name: "YouTube", icon: YoutubeIcon, href: "https://www.youtube.com/@GoalsGuild" },
  ];

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleNewsletterSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    setNewsletterError(null);
    setNewsletterAnnouncement('');

    if (!newsletterEmail.trim()) {
      const errorMsg = footerT.newsletter.emailRequired || 'Email is required';
      setNewsletterError(errorMsg);
      setNewsletterAnnouncement(FormAnnouncements.fieldRequired('Email'));
      setNewsletterAnnouncementPriority('assertive');
      return;
    }

    if (!validateEmail(newsletterEmail)) {
      const errorMsg = footerT.newsletter.emailInvalid || 'Please enter a valid email address';
      setNewsletterError(errorMsg);
      setNewsletterAnnouncement(FormAnnouncements.validationError('Email'));
      setNewsletterAnnouncementPriority('assertive');
      return;
    }

    // Build Substack subscribe URL with email parameter
    const emailParam = encodeURIComponent(newsletterEmail.trim());
    const substackSubscribeUrl = `${substackUrl}?email=${emailParam}`;
    
    // Open Substack in a new tab
    window.open(substackSubscribeUrl, '_blank', 'noopener,noreferrer');
    
    // Clear the form
    setNewsletterEmail('');
    setNewsletterError(null);
    setNewsletterAnnouncement(footerT.newsletter.redirecting || 'Redirecting to Substack...');
    setNewsletterAnnouncementPriority('polite');
    
    // Clear announcement after a few seconds
    setTimeout(() => {
      setNewsletterAnnouncement('');
    }, 3000);
  }, [newsletterEmail, validateEmail, footerT, substackUrl]);

  const handleNewsletterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewsletterEmail(e.target.value);
    if (newsletterError) {
      setNewsletterError(null);
    }
    if (newsletterAnnouncement) {
      setNewsletterAnnouncement('');
    }
  }, [newsletterError, newsletterAnnouncement]);

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto spacing-medieval py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src={GoalsGuildLogo} 
                alt="GoalsGuild Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="font-cinzel text-2xl font-bold text-gradient-gold">
                GoalGuild
              </span>
            </div>
            
            <p className="text-primary-foreground/80 leading-relaxed mb-6 max-w-md">
              {footerT.description}
            </p>

            <div className="flex items-center gap-2 text-sm text-primary-foreground/60">
              <span>{footerT.madeWith}</span>
              <Heart className="h-4 w-4 text-secondary" />
              <span>{footerT.forAdventurers}</span>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="font-cinzel text-lg font-semibold mb-4 text-secondary">
              {footerT.sections.product}
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
              {footerT.sections.company}
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
              {footerT.sections.support}
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
              {footerT.newsletter.title}
            </h3>
            <p className="text-primary-foreground/70 mb-4">
              {footerT.newsletter.subtitle}
            </p>
            <form onSubmit={handleNewsletterSubmit} noValidate role="form" aria-label="Newsletter subscription form">
              <div className="flex gap-2">
                <label htmlFor="newsletter-email" className="sr-only">
                  {footerT.newsletter.emailLabel}
                </label>
                <Input
                  id="newsletter-email"
                  type="email"
                  value={newsletterEmail}
                  onChange={handleNewsletterChange}
                  placeholder={footerT.newsletter.placeholder}
                  aria-invalid={!!newsletterError}
                  aria-describedby={newsletterError ? 'newsletter-error' : newsletterAnnouncement ? 'newsletter-announcement' : undefined}
                  className={`flex-1 ${newsletterError ? 'border-red-500' : ''}`}
                  required
                />
                <Button
                  type="submit"
                  disabled={!newsletterEmail.trim()}
                  className="btn-gold text-secondary-foreground px-6 py-2 rounded-lg font-semibold whitespace-nowrap"
                >
                  {footerT.newsletter.button}
                  <ExternalLink className="h-4 w-4 ml-2" />
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
              {newsletterAnnouncement && (
                <p
                  id="newsletter-announcement"
                  className="text-xs text-green-300 mt-2 text-left"
                  role="status"
                  aria-live="polite"
                >
                  {newsletterAnnouncement}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center pt-8 border-t border-primary-foreground/20">
          <div className="text-primary-foreground/60 text-sm mb-4 lg:mb-0">
            {footerT.copyright}
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
