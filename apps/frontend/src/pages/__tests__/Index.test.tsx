/** @vitest-environment jsdom */
import { describe, test, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Index from '../Index';
import { TranslationProvider } from '@/hooks/useTranslation';

const renderPage = () =>
  render(
    <TranslationProvider>
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    </TranslationProvider>
  );

describe('Index page', () => {
  test('renders hero content and navigation', () => {
    renderPage();
    // Hero title from translations
    expect(
      screen.getByText(/Unite in Purpose, Achieve Together/i)
    ).toBeInTheDocument();
    // Action buttons exist
    expect(screen.getByRole('link', { name: /Begin Your Quest/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explore Features/i })).toBeInTheDocument();
  });
});
