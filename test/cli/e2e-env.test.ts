import { expect, test, describe, beforeAll, afterAll } from "vitest";
import { spawnSync } from "child_process";
import { mkdirSync, rmSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEMP_DIR = join(tmpdir(), "mizzle-e2e-env-test-" + Date.now());
const MIGRATIONS_DIR = join(TEMP_DIR, "migrations");
const ENV_MIGRATIONS_DIR = join(TEMP_DIR, "migrations-env");
const SCHEMA_FILE = join(TEMP_DIR, "schema.ts");
const CONFIG_FILE = join(TEMP_DIR, "mizzle.config.ts");

describe("CLI E2E Environment Overrides", () => {
    beforeAll(() => {
        mkdirSync(TEMP_DIR, { recursive: true });
        mkdirSync(MIGRATIONS_DIR, { recursive: true });
        mkdirSync(ENV_MIGRATIONS_DIR, { recursive: true });

        // Create a simple schema
        writeFileSync(
            SCHEMA_FILE,
            `
import { dynamoTable } from "${join(process.cwd(), "packages/mizzle/src/core/table")}";
import { string } from "${join(process.cwd(), "packages/mizzle/src/columns/all")}";

export const testTable = dynamoTable("e2e_env_test_table", {
    pk: string("pk"),
});
        `.trim(),
        );

        // Create config pointing to MIGRATIONS_DIR
        writeFileSync(
            CONFIG_FILE,
            `
import { defineConfig } from "${join(process.cwd(), "packages/mizzling/src/config")}";
export default defineConfig({
    schema: "${SCHEMA_FILE}",
    out: "${MIGRATIONS_DIR}",
    region: "us-east-1",
    endpoint: "http://localhost:8000"
});
        `.trim(),
        );
    });

    afterAll(() => {
        rmSync(TEMP_DIR, { recursive: true, force: true });
    });

    test("MIZZLE_OUT should override config.out", async () => {
        // Run generate with MIZZLE_OUT pointing to ENV_MIGRATIONS_DIR
        const result = spawnSync(
            "bun",
            [
                "packages/mizzling/src/index.ts",
                "generate",
                "--name",
                "env_override",
            ],
            {
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    MIZZLE_CONFIG: CONFIG_FILE,
                    MIZZLE_OUT: ENV_MIGRATIONS_DIR,
                },
                encoding: "utf-8",
            },
        );

        if (result.status !== 0) {
            console.error("Generate failed!");
            console.error("STDOUT:", result.stdout);
            console.error("STDERR:", result.stderr);
        }

        expect(result.status).toBe(0);

        // Should have created migration in ENV_MIGRATIONS_DIR, NOT MIGRATIONS_DIR
        expect(
            readdirSync(ENV_MIGRATIONS_DIR).some((f) =>
                f.endsWith("_env_override.ts"),
            ),
        ).toBe(true);
        expect(readdirSync(MIGRATIONS_DIR).length).toBe(0);
    }, 20000);
});
