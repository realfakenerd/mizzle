import { expect, test, describe, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { generateCommand } from "../../packages/mizzling/src/commands/generate";
import { PhysicalTable } from "mizzle/table";
import { TABLE_SYMBOLS } from "@mizzle/shared";
import { mkdirSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Mock Clack
const mockClack = {
    text: mock(() => Promise.resolve("migration")),
    confirm: mock(() => Promise.resolve(true)),
    intro: mock(() => {}),
    outro: mock(() => {}),
    spinner: () => ({ start: () => {}, stop: () => {} }),
    isCancel: () => false
};
mock.module("@clack/prompts", () => mockClack);

// Helper to create mock table
const mockTable = (name: string) => {
    const table = new PhysicalTable(name, {
        pk: { build: () => ({ _: { name: "id", type: "string" }, getDynamoType: () => "S", name: "id" }) } as any
    });
    table[TABLE_SYMBOLS.TABLE_NAME] = name;
    table[TABLE_SYMBOLS.PARTITION_KEY] = { name: "id", getDynamoType: () => "S" };
    return table;
};

const TEMP_DIR = join(tmpdir(), "mizzle-generate-test-" + Date.now());
const MIGRATIONS_DIR = join(TEMP_DIR, "migrations");
const SCHEMA_FILE = join(TEMP_DIR, "schema.ts");

describe("Generate Command", () => {
    beforeEach(() => {
        mkdirSync(TEMP_DIR, { recursive: true });
        mkdirSync(MIGRATIONS_DIR, { recursive: true });
    });
  
    afterEach(() => {
        rmSync(TEMP_DIR, { recursive: true, force: true });
    });

    // Mock discoverSchema to return our tables
    const mockDiscover = mock();

    test("should create initial snapshot and migration if none exist", async () => {
        // Setup
        const tables = [mockTable("users")];
        mockDiscover.mockResolvedValue({ tables, entities: [] });

        await generateCommand({
            config: { schema: SCHEMA_FILE, out: MIGRATIONS_DIR },
            discoverSchema: mockDiscover // Dependency injection for testing
        });

        // Verify Snapshot
        const snapshotPath = join(MIGRATIONS_DIR, "snapshot.json");
        expect(existsSync(snapshotPath)).toBe(true);
        const snapshot = JSON.parse(readFileSync(snapshotPath, "utf-8"));
        expect(snapshot.tables["users"]).toBeDefined();

        // Verify Migration Script
        const files = await import("fs").then(fs => fs.readdirSync(MIGRATIONS_DIR));
        const migrationFile = files.find(f => f.endsWith(".ts"));
        expect(migrationFile).toBeDefined();
        expect(migrationFile).toMatch(/^0000_.*\.ts$/);
    });

    test("should not create migration if no changes", async () => {
         // Setup: Create snapshot first
         const tables = [mockTable("users")];
         mockDiscover.mockResolvedValue({ tables, entities: [] });
         
         // Run once to setup
         await generateCommand({
            config: { schema: SCHEMA_FILE, out: MIGRATIONS_DIR },
            discoverSchema: mockDiscover
        });

        const filesBefore = await import("fs").then(fs => fs.readdirSync(MIGRATIONS_DIR));

        // Run again
        await generateCommand({
            config: { schema: SCHEMA_FILE, out: MIGRATIONS_DIR },
            discoverSchema: mockDiscover
        });

        const filesAfter = await import("fs").then(fs => fs.readdirSync(MIGRATIONS_DIR));
        expect(filesAfter.length).toBe(filesBefore.length);
    });

    test("should handle errors gracefully", async () => {
            mockDiscover.mockRejectedValue(new Error("Discovery failed"));
            const errorSpy = spyOn(console, "error").mockImplementation(() => {});
            const processExitSpy = spyOn(process, "exit").mockImplementation((() => {}) as any);
    
            await generateCommand({
                config: { schema: SCHEMA_FILE, out: MIGRATIONS_DIR },
                discoverSchema: mockDiscover
            });
    
            expect(errorSpy).toHaveBeenCalled();
            expect(processExitSpy).toHaveBeenCalledWith(1);
            
        errorSpy.mockRestore();
        processExitSpy.mockRestore();
    });
});
