import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',          // <-- gives you window, document, etc.
    globals: true,                  // expect, vi, etc. as globals
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    css: true, // let Vitest handle CSS modules/stubs so components render
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // If your tests hang due to too many workers on Windows, you can uncomment:
    // threads: false,
  },
});
