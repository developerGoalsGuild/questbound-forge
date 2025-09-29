import { useState } from 'react';
import { Shield, Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/i18n/translations';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const nav = (t as any).nav || {};
  const auth = (t as any).auth || {};
  const goalsLabel = (t as any).goals || 'Quests';

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  return (
    <header className="medieval-banner border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto spacing-medieval py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-cinzel text-2xl font-bold text-gradient-royal">
              GoalGuild
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="font-medium hover:text-primary transition-colors">
              {nav.features || 'Features'}
            </a>
            <a href="#community" className="font-medium hover:text-primary transition-colors">
              {nav.community || 'Community'}
            </a>
            <a href="#pricing" className="font-medium hover:text-primary transition-colors">
              {nav.pricing || 'Pricing'}
            </a>
            <a href="#contact" className="font-medium hover:text-primary transition-colors">
              {nav.contact || 'Contact'}
            </a>
            <Link to="/goals" className="font-medium hover:text-primary transition-colors">
              {goalsLabel}
            </Link>
          </nav>

          {/* Action Buttons & Language Selector */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe className="h-4 w-4" />
                  {languages.find(lang => lang.code === language)?.flag}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border border-border">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`cursor-pointer ${language === lang.code ? 'bg-accent' : ''}`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <a data-testid="link" href="/login/Login">
              {auth.login || 'Login'}
            </a>
            <a data-testid="link" href="/signup/LocalSignUp">
              {auth.signup || 'Sign Up'}
            </a>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              <a href="#features" className="font-medium hover:text-primary transition-colors">
                {nav.features || 'Features'}
              </a>
              <a href="#community" className="font-medium hover:text-primary transition-colors">
                {nav.community || 'Community'}
              </a>
              <a href="#pricing" className="font-medium hover:text-primary transition-colors">
                {nav.pricing || 'Pricing'}
              </a>
              <a href="#contact" className="font-medium hover:text-primary transition-colors">
                {nav.contact || 'Contact'}
              </a>
              <Link to="/goals" className="font-medium hover:text-primary transition-colors">
                {goalsLabel}
              </Link>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <a data-testid="link" href="/login/Login" className="btn-heraldic text-primary-foreground justify-start">
                  {auth.login || 'Login'}
                </a>
                <a data-testid="link" href="/signup/LocalSignUp">
                  {auth.signup || 'Sign Up'}
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
