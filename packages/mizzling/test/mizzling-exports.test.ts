import { describe, it, expect } from "vitest";
import { defineConfig } from "../src/index";

describe("Mizzling Package Exports", () => {
  it("should export defineConfig", () => {
    expect(defineConfig).toBeDefined();
    expect(typeof defineConfig).toBe("function");
  });

  it("should return config object as is", () => {
    const config = {
      schema: "./schema",
      out: "./migrations",
    };
    const result = defineConfig(config);
    expect(result).toBe(config);
  });
});
