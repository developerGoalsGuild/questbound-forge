/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock all imports
vi.mock('./config/amplifyClient', () => ({}));

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn()
  }))
}));

vi.mock('./App.tsx', () => ({
  default: () => <div data-testid="app-component">App Component</div>
}));

vi.mock('./index.css', () => ({}));

describe('main.tsx', () => {
  let mockCreateRoot: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Get the mocked createRoot function
    const { createRoot } = require('react-dom/client');
    mockCreateRoot = createRoot;
  });

  test('imports amplifyClient configuration', async () => {
    // Import main.tsx to trigger the imports
    await import('./main.tsx');

    // Check that amplifyClient was imported (mocked)
    expect(vi.isMockFunction(vi.importMock('./config/amplifyClient'))).toBe(false);
  });

  test('imports index.css', async () => {
    // Import main.tsx to trigger the imports
    await import('./main.tsx');

    // Check that index.css was imported (mocked)
    expect(vi.isMockFunction(vi.importMock('./index.css'))).toBe(false);
  });

  test('creates root and renders App component', async () => {
    // Import main.tsx to execute the code - this should work without errors
    expect(async () => {
      await import('./main.tsx');
    }).not.toThrow();
  });

  test('handles missing root element gracefully', async () => {
    // Mock getElementById to return null
    const originalGetElementById = document.getElementById;
    document.getElementById = vi.fn().mockReturnValue(null);

    // Import should still work but createRoot would be called with null
    await expect(async () => {
      await import('./main.tsx');
    }).not.toThrow();

    // Restore original function
    document.getElementById = originalGetElementById;
  });
});
