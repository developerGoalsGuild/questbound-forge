import { useEffect, useState } from 'react';
import { Menu, X, Globe, User as UserIcon, LogOut, MessageSquare, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import GoalsGuildLogo from '@/assets/GoalsGuild_Logo.png';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/i18n/translations';
import { navTranslations } from '@/i18n/nav';
import { loginTranslations } from '@/i18n/login';
import { isTokenValid } from '@/lib/auth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isTokenValid());
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useTranslation();
  // Access nav and auth translations directly from their translation files
  // since t.community, t.contact, and t.signup are full objects, not strings
  const nav = navTranslations[language];
  const auth = {
    login: loginTranslations[language].title || 'Sign In',
    signup: nav.signup, // Use nav.signup since t.signup is the full signupTranslations object
  };
  const chatLabel = nav.chat;

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  useEffect(() => {
    const onAuthChange = () => setIsAuthenticated(isTokenValid());
    window.addEventListener('auth:change', onAuthChange);
    return () => window.removeEventListener('auth:change', onAuthChange);
  }, []);

  // Handle scrolling to anchor after navigation to home page
  useEffect(() => {
    if (location.pathname === '/') {
      const storedHash = window.sessionStorage.getItem('scrollToHash');
      if (storedHash) {
        const id = storedHash.substring(1);
        // Wait for DOM to be ready
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: Math.max(0, offsetPosition),
              behavior: 'smooth'
            });
            // Update URL and clear stored hash
            window.history.pushState(null, '', storedHash);
            window.sessionStorage.removeItem('scrollToHash');
          }
        }, 300);
      }
    }
  }, [location.pathname]);

  const handleLogout = () => {
    try { localStorage.removeItem('auth'); } catch {}
    try { window.dispatchEvent(new CustomEvent('auth:change')); } catch {}
    navigate('/', { replace: true });
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isOnHomePage = location.pathname === '/' || location.pathname === '';
    
    if (!isOnHomePage) {
      // Navigate to home page first, store hash for scrolling
      window.sessionStorage.setItem('scrollToHash', href);
      navigate('/');
      return;
    }
    
    // On home page, scroll to element
    const id = href.substring(1);
    const element = document.getElementById(id);
    if (element) {
      // Use scrollIntoView with offset calculation
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
      
      // Update URL
      window.history.pushState(null, '', href);
    }
  };

  return (
    <header className="medieval-banner border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto spacing-medieval py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <img 
              src={GoalsGuildLogo} 
              alt="GoalsGuild Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="font-cinzel text-2xl font-bold text-gradient-royal">
              GoalGuild
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 relative z-10">
            <a 
              href="#features" 
              onClick={(e) => handleAnchorClick(e, '#features')}
              className="font-medium hover:text-primary transition-colors cursor-pointer relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              {nav.features}
            </a>
            <a 
              href="#community" 
              onClick={(e) => handleAnchorClick(e, '#community')}
              className="font-medium hover:text-primary transition-colors cursor-pointer relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              {nav.community}
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => handleAnchorClick(e, '#pricing')}
              className="font-medium hover:text-primary transition-colors cursor-pointer relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              {nav.pricing}
            </a>
            <a 
              href="#contact" 
              onClick={(e) => handleAnchorClick(e, '#contact')}
              className="font-medium hover:text-primary transition-colors cursor-pointer relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              {nav.contact}
            </a>
            {isAuthenticated && (
              <Link to="/chat" className="font-medium hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                {chatLabel}
              </Link>
            )}
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

            {!isAuthenticated && (
              <>
                <Link to="/login" className="font-medium hover:text-primary transition-colors cursor-pointer">
                  {auth.login}
                </Link>
                <Link to="/signup/LocalSignUp" className="font-medium hover:text-primary transition-colors cursor-pointer">
                  {auth.signup}
                </Link>
              </>
            )}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>{nav.account}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border border-border">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <UserIcon className="h-4 w-4 mr-2" /> {nav.profile}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/subscription')} className="cursor-pointer">
                    <CreditCard className="h-4 w-4 mr-2" /> {nav.subscription}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/subscription/manage')} className="cursor-pointer">
                    <CreditCard className="h-4 w-4 mr-2" /> {nav.manageBilling}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" /> {nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
          <div className="md:hidden mt-4 py-4 border-t border-border animate-fade-in relative z-10">
            <nav className="flex flex-col gap-4">
              <a 
                href="#features" 
                onClick={(e) => { handleAnchorClick(e, '#features'); setIsMenuOpen(false); }}
                className="font-medium hover:text-primary transition-colors cursor-pointer relative z-10"
                style={{ pointerEvents: 'auto' }}
              >
                {nav.features}
              </a>
              <a 
                href="#community" 
                onClick={(e) => { handleAnchorClick(e, '#community'); setIsMenuOpen(false); }}
                className="font-medium hover:text-primary transition-colors cursor-pointer relative z-10"
                style={{ pointerEvents: 'auto' }}
              >
                {nav.community}
              </a>
              <a 
                href="#pricing" 
                onClick={(e) => { handleAnchorClick(e, '#pricing'); setIsMenuOpen(false); }}
                className="font-medium hover:text-primary transition-colors cursor-pointer relative z-10"
                style={{ pointerEvents: 'auto' }}
              >
                {nav.pricing}
              </a>
              <a 
                href="#contact" 
                onClick={(e) => { handleAnchorClick(e, '#contact'); setIsMenuOpen(false); }}
                className="font-medium hover:text-primary transition-colors cursor-pointer relative z-10"
                style={{ pointerEvents: 'auto' }}
              >
                {nav.contact}
              </a>
              {isAuthenticated && (
                <Link to="/chat" className="font-medium hover:text-primary transition-colors flex items-center gap-1 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                  <MessageSquare className="h-4 w-4" />
                  {chatLabel}
                </Link>
              )}

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {!isAuthenticated && (
                  <>
                    <Link to="/login" className="btn-heraldic text-primary-foreground justify-start cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                      {auth.login}
                    </Link>
                    <Link to="/signup/LocalSignUp" className="font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                      {auth.signup}
                    </Link>
                  </>
                )}
                {isAuthenticated && (
                  <>
                    <Link to="/profile" className="font-medium hover:text-primary transition-colors">
                      {nav.profile}
                    </Link>
                    <Link to="/subscription" className="font-medium hover:text-primary transition-colors">
                      {nav.subscription}
                    </Link>
                    <Link to="/subscription/manage" className="font-medium hover:text-primary transition-colors">
                      {nav.manageBilling}
                    </Link>
                    <button onClick={handleLogout} className="text-left font-medium text-red-600 hover:text-red-700 transition-colors">
                      {nav.logout}
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
