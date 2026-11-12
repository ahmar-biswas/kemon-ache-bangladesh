/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    // No waiting between retries and no progress lines during tests.
    env: { KAB_RETRY_WAIT_MS: '0', KAB_QUIET: '1' },
  },
});
