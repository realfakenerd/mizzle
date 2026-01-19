import { describe, it, expect } from "vitest";
import { defineConfig, type MizzleConfig } from "../packages/mizzling/src/config";

describe("MizzleConfig Alignment", () => {
    it("should allow a valid flat configuration", () => {
        const config: MizzleConfig = {
            schema: "./src/schema.ts",
            out: "./migrations",
            region: "us-west-2",
            endpoint: "http://localhost:8000"
        };
        const result = defineConfig(config);
        expect(result).toEqual(config);
    });

    it("should require schema and out fields", () => {
        // @ts-expect-error - missing schema and out
        const config: MizzleConfig = {
            region: "us-east-1"
        };
        expect(config).toBeDefined();
    });
});
