import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    columns: "src/columns/index.ts",
    table: "src/core/table.ts",
    snapshot: "src/core/snapshot.ts",
    diff: "src/core/diff.ts",
    introspection: "src/core/introspection.ts",
    db: "src/db.ts",
  },
  format: "esm",
  dts: true,
  clean: true,
  noExternal: ["@mizzle/shared"],
  external: [/^@aws-sdk\//, "uuid"],
  minify: true,
  splitting: true,
});
