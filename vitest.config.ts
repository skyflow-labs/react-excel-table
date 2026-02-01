import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Focus coverage on utility functions and logic, not React components
      // React components should be tested with integration/e2e tests
      include: [
        'src/utils/**/*.ts',
        'src/plugins/**/parsers.ts',
        'src/plugins/**/use*.ts',
        'src/hooks/**/*.ts',
        'src/config/**/*.tsx',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/__tests__/**',
        'src/test/**',
        'src/**/index.ts',
        'src/components/**', // UI components tested via e2e
      ],
      thresholds: {
        // Realistic thresholds for utility functions
        'src/utils/**': {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80,
        },
        'src/plugins/**/parsers.ts': {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80,
        },
      },
    },
  },
});
