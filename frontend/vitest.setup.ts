// vitest.setup.ts
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure JSDOM is reset between tests
afterEach(() => {
  cleanup();
});