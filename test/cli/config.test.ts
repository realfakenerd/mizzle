import { expect, test, describe, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../../packages/mizzling/src/config";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEMP_DIR = join(tmpdir(), "mizzle-config-test-" + Date.now());

describe("Config Loader", () => {
    const originalCwd = process.cwd();

    beforeEach(() => {
        mkdirSync(TEMP_DIR, { recursive: true });
        process.chdir(TEMP_DIR);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        rmSync(TEMP_DIR, { recursive: true, force: true });
    });

    test("should throw if config file is missing", async () => {
        expect(loadConfig("non-existent.ts")).rejects.toThrow();
    });

    test("should load valid config", async () => {
        const configName = "mizzle.config.valid.ts";
        const configContent = `
      export default {
        schema: "./src/schema",
        out: "./migrations"
      };
    `;
        writeFileSync(join(TEMP_DIR, configName), configContent);

        const config = await loadConfig(configName);
        expect(config).toEqual({
            schema: "./src/schema",
            out: "./migrations",
        });
    });

    test("should throw if config is invalid (missing out)", async () => {
        const configName = "mizzle.config.invalid.ts";
        const configContent = `
      export default {
        schema: "./src/schema"
      };
    `;
        writeFileSync(join(TEMP_DIR, configName), configContent);

        expect(loadConfig(configName)).rejects.toThrow("Invalid config");
    });

    test("should throw if config is invalid (not an object)", async () => {
        const configName = "mizzle.config.notobject.ts";
        writeFileSync(join(TEMP_DIR, configName), 'export default "string";');
        expect(loadConfig(configName)).rejects.toThrow("Invalid config");
    });

    test("should throw if config is invalid (missing schema)", async () => {
        const configName = "mizzle.config.noschema.ts";
        writeFileSync(
            join(TEMP_DIR, configName),
            'export default { out: "./" };',
        );
        expect(loadConfig(configName)).rejects.toThrow(
            "Invalid config: missing 'schema'",
        );
    });

    test("should throw if config has syntax error", async () => {
        const configName = "mizzle.config.syntax.ts";
        writeFileSync(join(TEMP_DIR, configName), "export default { schema: ");
        expect(loadConfig(configName)).rejects.toThrow("Failed to load config");
    });
});
