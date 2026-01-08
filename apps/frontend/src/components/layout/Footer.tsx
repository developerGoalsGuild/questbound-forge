import { Shield, Facebook, Twitter, Linkedin, Mail, Heart } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const Footer = () => {
  const { t } = useTranslation();

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
          <div className="text-center max-w-lg mx-auto">
            <h3 className="font-cinzel text-xl font-bold mb-2 text-secondary">
              {t.footer?.newsletter?.title || 'Join the Guild Newsletter'}
            </h3>
            <p className="text-primary-foreground/70 mb-4">
              {t.footer?.newsletter?.subtitle || 'Get weekly updates on community achievements and new features.'}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t.footer?.newsletter?.placeholder || 'Enter your email'}
                className="flex-1 px-4 py-2 rounded-lg bg-background text-foreground border border-border"
              />
              <button className="btn-gold text-secondary-foreground px-6 py-2 rounded-lg font-semibold whitespace-nowrap">
                {t.footer?.newsletter?.button || 'Subscribe'}
              </button>
            </div>
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
