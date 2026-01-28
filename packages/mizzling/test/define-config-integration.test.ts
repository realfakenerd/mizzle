import { expect, test, describe, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../src/config";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";

const TEMP_DIR = join(tmpdir(), "mizzle-define-config-test-" + Date.now());

describe("defineConfig Integration", () => {
  const originalCwd = process.cwd();
  const projectRoot = originalCwd.includes("packages/mizzling") 
    ? join(originalCwd, "../..") 
    : originalCwd;
  const mizzlingPath = join(projectRoot, "packages/mizzling/src/index.ts");

  beforeEach(() => {
    mkdirSync(TEMP_DIR, { recursive: true });
    process.chdir(TEMP_DIR);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  test("should load config using defineConfig helper", async () => {
    const configName = "mizzle.config.ts";
    // Using relative path to the source index.ts for the test to work without publishing
    const configContent = `
      import { defineConfig } from '${mizzlingPath}';
      
      export default defineConfig({
        schema: "./src/schema",
        out: "./migrations",
        verbose: true,
        strict: false
      });
    `;
    writeFileSync(join(TEMP_DIR, configName), configContent);

    const config = await loadConfig(configName);
    expect(config).toEqual({
      schema: "./src/schema",
      out: "./migrations",
      verbose: true,
      strict: false,
    });
  });
});
