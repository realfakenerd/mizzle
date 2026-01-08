import { expect, test, describe, beforeAll, afterAll } from "vitest";
import { spawn } from "bun";
import { mkdirSync, rmSync, existsSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { DynamoDBClient, DeleteTableCommand } from "@aws-sdk/client-dynamodb";

const TEMP_DIR = join(tmpdir(), "mizzle-e2e-test-" + Date.now());
const MIGRATIONS_DIR = join(TEMP_DIR, "migrations");
const SCHEMA_FILE = join(TEMP_DIR, "schema.ts");
const CONFIG_FILE = join(TEMP_DIR, "mizzle.config.ts");

describe("CLI End-to-End Migration Lifecycle", () => {
    beforeAll(() => {
        mkdirSync(TEMP_DIR, { recursive: true });

        // Create a simple schema
        writeFileSync(
            SCHEMA_FILE,
            `
import { dynamoTable, dynamoEntity } from "${join(process.cwd(), "packages/mizzle/src/core/table")}";
import { string } from "${join(process.cwd(), "packages/mizzle/src/columns/all")}";
import { staticKey } from "${join(process.cwd(), "packages/mizzle/src/core/strategies")}";

export const testTable = dynamoTable("e2e_test_table", {
    pk: string("pk"),
});

export const testEntity = dynamoEntity(testTable, "Test", { name: string() }, (cols) => ({
    pk: staticKey("FIXED"),
}));
        `.trim(),
        );

        // Create config
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

    test("Full lifecycle: generate -> push -> list -> drop", async () => {
        // 1. Generate
        const generateProc = spawn(
            [
                "bun",
                "packages/mizzling/src/index.ts",
                "generate",
                "--name",
                "initial",
            ],
            {
                cwd: process.cwd(),
                env: { ...process.env, MIZZLE_CONFIG: CONFIG_FILE },
                stdout: "pipe",
                stderr: "pipe",
            },
        );

        const generateExit = await generateProc.exited;
        const genStdout = await new Response(generateProc.stdout).text();
        const genStderr = await new Response(generateProc.stderr).text();

        if (generateExit !== 0 || !existsSync(MIGRATIONS_DIR)) {
            console.error("Generate failed or migrations dir missing!");
            console.error("STDOUT:", genStdout);
            console.error("STDERR:", genStderr);
        }
        expect(generateExit).toBe(0);
        expect(existsSync(MIGRATIONS_DIR)).toBe(true);
        expect(
            readdirSync(MIGRATIONS_DIR).some((f) => f.endsWith("_initial.ts")),
        ).toBe(true);

        // 2. Push
        const pushProc = spawn(
            ["bun", "packages/mizzling/src/index.ts", "push", "--yes"],
            {
                cwd: process.cwd(),
                env: { ...process.env, MIZZLE_CONFIG: CONFIG_FILE },
                stdout: "pipe",
                stderr: "pipe",
            },
        );

        const pushExit = await pushProc.exited;
        if (pushExit !== 0) {
            console.error("Push failed!");
            console.error(
                "STDOUT:",
                await new Response(pushProc.stdout).text(),
            );
            console.error(
                "STDERR:",
                await new Response(pushProc.stderr).text(),
            );
        }
        expect(pushExit).toBe(0);

        // 3. List
        const listProc = spawn(
            ["bun", "packages/mizzling/src/index.ts", "list"],
            {
                cwd: process.cwd(),
                env: { ...process.env, MIZZLE_CONFIG: CONFIG_FILE },
                stdout: "pipe",
            },
        );

        const listOutput = await new Response(listProc.stdout).text();
        expect(listOutput).toContain("e2e_test_table");

        // 4. Cleanup: Drop the table manually to leave clean state
        const client = new DynamoDBClient({
            region: "us-east-1",
            endpoint: "http://localhost:8000",
            credentials: { accessKeyId: "local", secretAccessKey: "local" },
        });
        await client.send(
            new DeleteTableCommand({ TableName: "e2e_test_table" }),
        );
    }, 20000); // Higher timeout for spawning
});
