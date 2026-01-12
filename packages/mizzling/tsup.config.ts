import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  noExternal: ['@mizzle/shared', 'mizzle'],
  minify: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
