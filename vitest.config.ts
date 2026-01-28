import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 60000,
    pool: "forks",
    singleFork: true,
    alias: [
      {
        find: "@aurios/mizzle/table",
        replacement: path.resolve(__dirname, "./packages/mizzle/src/core/table"),
      },
      {
        find: "@aurios/mizzle/columns",
        replacement: path.resolve(__dirname, "./packages/mizzle/src/columns"),
      },
      {
        find: "@aurios/mizzle/db",
        replacement: path.resolve(__dirname, "./packages/mizzle/src/db"),
      },
      {
        find: "@aurios/mizzle/introspection",
        replacement: path.resolve(__dirname, "./packages/mizzle/src/core/introspection"),
      },
      {
        find: "@aurios/mizzle/snapshot",
        replacement: path.resolve(__dirname, "./packages/mizzle/src/core/snapshot"),
      },
      {
        find: "@aurios/mizzle/diff",
        replacement: path.resolve(__dirname, "./packages/mizzle/src/core/diff"),
      },
      {
        find: "@aurios/mizzle",
        replacement: path.resolve(__dirname, "./packages/mizzle/src"),
      },
      {
        find: "@mizzle/shared",
        replacement: path.resolve(__dirname, "./packages/shared/src"),
      },
    ],
  },
  resolve: {
    alias: {
      "@aurios/mizzle": path.resolve(__dirname, "./packages/mizzle/src"),
      "@mizzle/shared": path.resolve(__dirname, "./packages/shared/src"),
    },
  },
});
