/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/*.d.ts',
        'app/entry.server.tsx',
        'app/root.tsx',
        'app/lib/db/seeds/',
      ],
      thresholds: {
        global: {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
      },
    },
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Mock configuration
    server: {
      deps: {
        inline: ['@remix-run/testing'],
      },
    },
  },
});