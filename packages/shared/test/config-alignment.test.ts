import { describe, it, expect } from "vitest";
import { defineConfig, type MizzleConfig } from "@aurios/mizzling/config";

describe("MizzleConfig Alignment", () => {
  it("should have correct types in defineConfig", () => {
    const config: MizzleConfig = {
      schema: "./schema.ts",
      out: "./migrations",
      region: "us-east-1",
    };
    const result = defineConfig(config);
    expect(result).toBe(config);
  });
});