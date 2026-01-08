import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      'mizzle': path.resolve(__dirname, './packages/mizzle/src'),
      '@mizzle/shared': path.resolve(__dirname, './packages/shared/src'),
    },
  },
  benchmark: {
    include: ['**/*.bench.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
  resolve: {
    alias: {
      'mizzle': path.resolve(__dirname, './packages/mizzle/src'),
      '@mizzle/shared': path.resolve(__dirname, './packages/shared/src'),
    }
  }
});
