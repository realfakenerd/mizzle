import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        pool: "forks",
        singleFork: true,
        alias: [
            {
                find: "mizzle/table",
                replacement: path.resolve(
                    __dirname,
                    "./packages/mizzle/src/core/table",
                ),
            },
            {
                find: "mizzle/columns",
                replacement: path.resolve(
                    __dirname,
                    "./packages/mizzle/src/columns",
                ),
            },
            {
                find: "mizzle/db",
                replacement: path.resolve(
                    __dirname,
                    "./packages/mizzle/src/db",
                ),
            },
            {
                find: "mizzle/introspection",
                replacement: path.resolve(
                    __dirname,
                    "./packages/mizzle/src/core/introspection",
                ),
            },
            {
                find: "mizzle/snapshot",
                replacement: path.resolve(
                    __dirname,
                    "./packages/mizzle/src/core/snapshot",
                ),
            },
            {
                find: "mizzle/diff",
                replacement: path.resolve(
                    __dirname,
                    "./packages/mizzle/src/core/diff",
                ),
            },
            {
                find: "mizzle",
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
            mizzle: path.resolve(__dirname, "./packages/mizzle/src"),
            "@mizzle/shared": path.resolve(__dirname, "./packages/shared/src"),
        },
    },
});
