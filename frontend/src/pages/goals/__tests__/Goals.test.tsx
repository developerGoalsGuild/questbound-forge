/** @vitest-environment jsdom */
import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TranslationProvider, useTranslation } from '@/hooks/useTranslation';
import Goals from '@/pages/goals/Goals';

const hoisted = vi.hoisted(() => ({ tracker: { called: 0 } }));

// Mock Amplify client
vi.mock('aws-amplify/api', () => ({
  generateClient: () => ({
    graphql: vi.fn().mockImplementation(async () => {
      hoisted.tracker.called++;
      return { data: { createGoal: { id: 'G1', deadline: 1700000000 } } } as any;
    })
  })
}));

describe('Goals page', () => {
  beforeEach(() => {
    const header = { alg: 'none', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = { sub: 'U1', role: 'user', exp: now + 3600 } as any;
    const b64 = (o: any) => btoa(JSON.stringify(o)).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
    const token = `${b64(header)}.${b64(payload)}.`;
    localStorage.setItem('auth', JSON.stringify({ id_token: token, access_token: token, token_type: 'Bearer', expires_in: 3600 }));
  });

  function LangSetter() {
    const { setLanguage } = useTranslation();
    React.useEffect(() => { setLanguage('en'); }, []);
    return null;
  }

  function renderPage() {
    return render(
      <BrowserRouter>
        <TranslationProvider>
          <LangSetter />
          <Goals />
        </TranslationProvider>
      </BrowserRouter>
    );
  }

  test('requires deadline', async () => {
    const utils = renderPage();
    const titleInput = utils.container.querySelector('input') as HTMLInputElement;
    expect(titleInput).toBeTruthy();
    fireEvent.change(titleInput, { target: { value: 'Learn TypeScript' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Goal/i }));
    // Asserting validation via absence of GraphQL call instead of toast text
    await new Promise(r => setTimeout(r, 50));
    expect(hoisted.tracker.called).toBe(0);
  });

  test('renders NLP questions section', async () => {
    const utils = renderPage();
    const section = utils.container.querySelector('[data-testid="nlp-questions"]') as HTMLElement | null;
    expect(section).toBeTruthy();
    const areas = (section as HTMLElement).querySelectorAll('textarea');
    expect(areas.length).toBeGreaterThan(0);
  });

  test('AI buttons call backend', async () => {
    const g: any = globalThis as any;
    if (!g.fetch) g.fetch = vi.fn();
    const fetchSpy = vi.spyOn(g, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ imageUrl: 'https://example.com/x.jpg', suggestions: ['One', 'Two'] }) } as any);
    const utils = renderPage();
    const genBtn = utils.container.querySelector('[data-testid="btn-generate-image"]') as HTMLButtonElement;
    expect(genBtn).toBeTruthy();
    fireEvent.click(genBtn);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const suggBtn = utils.container.querySelector('[data-testid="btn-suggest-improvements"]') as HTMLButtonElement;
    expect(suggBtn).toBeTruthy();
    fireEvent.click(suggBtn);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    fetchSpy.mockRestore();
  });
});

