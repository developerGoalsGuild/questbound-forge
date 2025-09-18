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
              {t.nav.features}
            </a>
            <a href="#community" className="font-medium hover:text-primary transition-colors">
              {t.nav.community}
            </a>
            <a href="#pricing" className="font-medium hover:text-primary transition-colors">
              {t.nav.pricing}
            </a>
            <a href="#contact" className="font-medium hover:text-primary transition-colors">
              {t.nav.contact}
            </a>
            <Link to="/goals" className="font-medium hover:text-primary transition-colors">
              {t.nav.goals || 'Quests'}
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

            <Button className="btn-heraldic text-primary-foreground" variant="outline" asChild>
              <Link to="/login/Login">{t.nav.login}</Link>
            </Button>
            <Button className="btn-heraldic text-primary-foreground" asChild>
              <Link to="/signup/LocalSignUp">{t.nav.signup}</Link>
            </Button>
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
                {t.nav.features}
              </a>
              <a href="#community" className="font-medium hover:text-primary transition-colors">
                {t.nav.community}
              </a>
              <a href="#pricing" className="font-medium hover:text-primary transition-colors">
                {t.nav.pricing}
              </a>
              <a href="#contact" className="font-medium hover:text-primary transition-colors">
                {t.nav.contact}
              </a>
              <Link to="/goals" className="font-medium hover:text-primary transition-colors">
                {t.nav.goals || 'Quests'}
              </Link>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button className="btn-heraldic text-primary-foreground justify-start" variant="outline" className="justify-start" asChild>
                  <Link to="/login/Login">{t.nav.login}</Link>
                </Button>
                <Button className="btn-heraldic text-primary-foreground justify-start" asChild>
                  <Link to="/signup/LocalSignUp">{t.nav.signup}</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
