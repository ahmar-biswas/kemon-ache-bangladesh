/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The folder the site is served from (M9, DECISIONS 140). The deploy workflow sets
// BASE_PATH=/kemon-ache-bangladesh/ for GitHub Pages; everything else builds for the root.
const base = process.env.BASE_PATH ? `/${process.env.BASE_PATH.replace(/^\/+|\/+$/g, '')}/` : '/';

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    // No waiting between retries and no progress lines during tests.
    env: { KAB_RETRY_WAIT_MS: '0', KAB_QUIET: '1' },
  },
});
