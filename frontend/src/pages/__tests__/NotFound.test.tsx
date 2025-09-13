/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import NotFound from '../NotFound';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>
  );

describe('NotFound page', () => {
  const err = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = err;
    cleanup();
  });

  test('shows 404 and home link, logs missing path', () => {
    renderAt('/does/not/exist');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/Oops! Page not found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to Home/i })).toHaveAttribute('href', '/');
    expect(console.error).toHaveBeenCalled();
    const call = (console.error as any).mock.calls[0];
    expect(call.join(' ')).toMatch(/\/does\/not\/exist/);
  });
});

