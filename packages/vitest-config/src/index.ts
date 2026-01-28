import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sharedConfig = {
  test: {
    globals: true,
    environment: "node",
    testTimeout: 100000,
    hookTimeout: 30000,
    pool: "forks",
    alias: [
          {
            find: "@aurios/mizzle/table",
            replacement: path.resolve(__dirname, "../../mizzle/src/core/table"),
          },
          {
            find: "@aurios/mizzle/columns",
            replacement: path.resolve(__dirname, "../../mizzle/src/columns"),
          },
          {
            find: "@aurios/mizzle/db",
            replacement: path.resolve(__dirname, "../../mizzle/src/db"),
          },
          {
            find: "@aurios/mizzle/introspection",
            replacement: path.resolve(__dirname, "../../mizzle/src/core/introspection"),
          },
          {
            find: "@aurios/mizzle/snapshot",
            replacement: path.resolve(__dirname, "../../mizzle/src/core/snapshot"),
          },
          {
            find: "@aurios/mizzle/diff",
            replacement: path.resolve(__dirname, "../../mizzle/src/core/diff"),
          },
                    {
                      find: "@aurios/mizzle",
                      replacement: path.resolve(__dirname, "../../mizzle/src"),
                    },
                    {
                      find: "@aurios/mizzling",
                      replacement: path.resolve(__dirname, "../../mizzling/src"),
                    },
                    {
                      find: "@repo/shared",
                      replacement: path.resolve(__dirname, "../../shared/src"),
                    },
                  ],
            },
            resolve: {
                alias: {
                  "@aurios/mizzle": path.resolve(__dirname, "../../mizzle/src"),
                  "@aurios/mizzling": path.resolve(__dirname, "../../mizzling/src"),
                  "@repo/shared": path.resolve(__dirname, "../../shared/src"),
                },
              }
          };
          