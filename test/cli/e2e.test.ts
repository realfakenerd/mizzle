import { expect, test, describe, beforeAll, afterAll } from "vitest";
import { spawn } from "child_process";
import { mkdirSync, rmSync, existsSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { DynamoDBClient, DeleteTableCommand } from "@aws-sdk/client-dynamodb";

const TEMP_DIR = join(tmpdir(), "mizzle-e2e-test-" + Date.now());
const MIGRATIONS_DIR = join(TEMP_DIR, "migrations");
const SCHEMA_FILE = join(TEMP_DIR, "schema.ts");
const CONFIG_FILE = join(TEMP_DIR, "mizzle.config.ts");

function runCommand(args: string[], env: Record<string, string>): Promise<{ code: number, stdout: string, stderr: string }> {
    return new Promise((resolve) => {
        const proc = spawn("bun", args, {
            cwd: process.cwd(),
            env: { ...process.env, ...env },
        });

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (data) => stdout += data.toString());
        proc.stderr.on("data", (data) => stderr += data.toString());

        proc.on("close", (code) => {
            resolve({ code: code || 0, stdout, stderr });
        });
    });
}

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
        const { code: generateExit, stdout: genStdout, stderr: genStderr } = await runCommand(
            [
                "packages/mizzling/src/index.ts",
                "generate",
                "--name",
                "initial",
            ],
            { MIZZLE_CONFIG: CONFIG_FILE }
        );

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
        const { code: pushExit, stdout: pushStdout, stderr: pushStderr } = await runCommand(
            ["packages/mizzling/src/index.ts", "push", "--yes"],
            { MIZZLE_CONFIG: CONFIG_FILE }
        );

        if (pushExit !== 0) {
            console.error("Push failed!");
            console.error("STDOUT:", pushStdout);
            console.error("STDERR:", pushStderr);
        }
        expect(pushExit).toBe(0);

        // 3. List
        const { stdout: listOutput } = await runCommand(
            ["packages/mizzling/src/index.ts", "list"],
            { MIZZLE_CONFIG: CONFIG_FILE }
        );

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
