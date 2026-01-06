import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { loadConfig, defineConfig } from "../../src/config";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEMP_DIR = join(tmpdir(), "mizzle-config-expansion-test-" + Date.now());

describe("Config Expansion", () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    mkdirSync(TEMP_DIR, { recursive: true });
    process.chdir(TEMP_DIR);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  test("defineConfig should accept expanded properties", () => {
    const config = defineConfig({
      schema: "./schema.ts",
      out: "./out",
      profile: "test",
      maxAttempts: 3
    });
    expect(config.profile).toBe("test");
    expect(config.maxAttempts).toBe(3);
  });

  test("should load config with expanded properties", async () => {
    const configName = "mizzle.config.expanded.ts";
    const configContent = `
      export default {
        schema: "./src/schema",
        out: "./migrations",
        credentials: {
          accessKeyId: "AKIA",
          secretAccessKey: "SECRET",
          sessionToken: "TOKEN"
        },
        profile: "my-profile",
        maxAttempts: 5
      };
    `;
    writeFileSync(join(TEMP_DIR, configName), configContent);
    
    const config = await loadConfig(configName);
    expect(config).toEqual({
      schema: "./src/schema",
      out: "./migrations",
      credentials: {
        accessKeyId: "AKIA",
        secretAccessKey: "SECRET",
        sessionToken: "TOKEN"
      },
      profile: "my-profile",
      maxAttempts: 5
    });
  });
});
