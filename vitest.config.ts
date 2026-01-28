import {sharedConfig} from '@repo/vitest-config';
import { defineConfig } from "vitest/config";

export default defineConfig({
  ...sharedConfig,
  projects: [
    {
      name: 'packages',
      root: './packages/*',
      test: {
        ...sharedConfig.test,
      }
    }
  ],
});
