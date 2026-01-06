import { defineConfig } from "./src/config";

export default defineConfig({
  schema: "./schema.ts",
  out: "./migrations",
  region: "us-east-1",
  endpoint: "http://localhost:8000",
});
