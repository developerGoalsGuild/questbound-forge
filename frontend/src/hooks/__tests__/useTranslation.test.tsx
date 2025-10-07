/** @vitest-environment jsdom */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { TranslationProvider, useTranslation } from '../useTranslation';

vi.unmock('@/hooks/useTranslation');

// Mock the translations
vi.mock('@/i18n/translations', () => ({
  translations: {
    en: {
      nav: { features: 'Features' },
      hero: { title: 'Welcome' }
    },
    es: {
      nav: { features: 'Características' },
      hero: { title: 'Bienvenido' }
    },
    fr: {
      nav: { features: 'Fonctionnalités' },
      hero: { title: 'Bienvenue' }
    }
  }
}));

describe('useTranslation', () => {
  test('returns fallback when used outside TranslationProvider', () => {
    // Mock console.warn to avoid noise in test output
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.language).toBe('en');
    expect(result.current.t).toBeDefined();
    expect(typeof result.current.setLanguage).toBe('function');

    consoleSpy.mockRestore();
  });

  test('provides default English translations', () => {
    const TestComponent = () => {
      const { t, language } = useTranslation();
      return (
        <div>
          <span data-testid="language">{language}</span>
          <span data-testid="features">{t.nav.features}</span>
          <span data-testid="title">{t.hero.title}</span>
        </div>
      );
    };

    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('features')).toHaveTextContent('Features');
    expect(screen.getByTestId('title')).toHaveTextContent('Welcome');
  });

  test('allows changing language', () => {
    const TestComponent = () => {
      const { t, language, setLanguage } = useTranslation();
      return (
        <div>
          <span data-testid="language">{language}</span>
          <span data-testid="features">{t.nav.features}</span>
          <button data-testid="change-lang" onClick={() => setLanguage('es')}>
            Change to Spanish
          </button>
        </div>
      );
    };

    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('features')).toHaveTextContent('Features');

    // Change language
    const button = screen.getByTestId('change-lang');
    act(() => {
      button.click();
    });

    expect(screen.getByTestId('language')).toHaveTextContent('es');
    expect(screen.getByTestId('features')).toHaveTextContent('Características');
  });

  test('supports all available languages', () => {
    const TestComponent = ({ targetLang }: { targetLang: string }) => {
      const { t, setLanguage } = useTranslation();

      React.useEffect(() => {
        setLanguage(targetLang as any);
      }, [setLanguage, targetLang]);

      return <span data-testid="features">{t.nav.features}</span>;
    };

    // Test Spanish
    const { rerender } = render(
      <TranslationProvider>
        <TestComponent targetLang="es" />
      </TranslationProvider>
    );

    expect(screen.getByTestId('features')).toHaveTextContent('Características');

    // Test French
    rerender(
      <TranslationProvider>
        <TestComponent targetLang="fr" />
      </TranslationProvider>
    );

    expect(screen.getByTestId('features')).toHaveTextContent('Fonctionnalités');
  });

  test('persists language changes within the provider scope', () => {
    const TestComponent = () => {
      const { language, setLanguage } = useTranslation();
      return (
        <div>
          <span data-testid="lang-display">{language}</span>
          <button data-testid="set-french" onClick={() => setLanguage('fr')}>French</button>
          <button data-testid="set-english" onClick={() => setLanguage('en')}>English</button>
        </div>
      );
    };

    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    expect(screen.getByTestId('lang-display')).toHaveTextContent('en');

    // Change to French
    act(() => {
      screen.getByTestId('set-french').click();
    });
    expect(screen.getByTestId('lang-display')).toHaveTextContent('fr');

    // Change back to English
    act(() => {
      screen.getByTestId('set-english').click();
    });
    expect(screen.getByTestId('lang-display')).toHaveTextContent('en');
  });

  test('provides complete translation object structure', () => {
    const TestComponent = () => {
      const { t } = useTranslation();
      return <span data-testid="has-nav">{t.nav ? 'has-nav' : 'no-nav'}</span>;
    };

    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    expect(screen.getByTestId('has-nav')).toHaveTextContent('has-nav');
  });

  test('TranslationProvider renders children', () => {
    render(
      <TranslationProvider>
        <div data-testid="child">Test Child</div>
      </TranslationProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('context value includes all required properties', () => {
    const TestComponent = () => {
      const context = useTranslation();
      return (
        <div>
          <span data-testid="has-language">{context.language ? 'yes' : 'no'}</span>
          <span data-testid="has-setLanguage">{typeof context.setLanguage === 'function' ? 'yes' : 'no'}</span>
          <span data-testid="has-t">{context.t ? 'yes' : 'no'}</span>
        </div>
      );
    };

    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    expect(screen.getByTestId('has-language')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-setLanguage')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-t')).toHaveTextContent('yes');
  });
});
