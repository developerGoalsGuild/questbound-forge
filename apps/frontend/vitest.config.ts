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
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    css: false, // disable CSS handling to reduce memory usage
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['src/__tests__/integration/**'],
    
    // Memory optimization settings
    threads: false,
    maxConcurrency: 1,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    
    // Coverage optimization
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/hooks/useQuest.ts',
        'src/i18n/quest.ts',
        'src/i18n/translations.ts'
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'src/vite.config.ts',
        'src/vitest.config.ts',
        'src/vitest.setup.ts',
      ],
      // Reduce memory usage during coverage collection
      all: false,
      skipFull: true,
    },
    
    // Test timeout and retry settings
    testTimeout: 5000,
    retry: 0,
    
    // Memory cleanup
    isolate: true,
    passWithNoTests: true,
    
    // Reporter settings for better memory management
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results.json',
    },
  },
});
