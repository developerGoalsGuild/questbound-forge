/** @vitest-environment jsdom */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from '@/App';

describe('App router guard placement', () => {
  const origError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
    // jsdom: polyfill matchMedia used by Sonner
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });
  afterEach(() => {
    console.error = origError;
  });

  test('AuthWatcher mounts within a Router (no useNavigate context errors)', () => {
    render(<App />);
    const errors = (console.error as any).mock?.calls?.map((c: any[]) => c.join(' ')).join('\n') || '';
    expect(errors).not.toMatch(/useNavigate\(\) may be used only in the context of a <Router>/i);
  });
});
