import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { generateSnapshot, getNextMigrationVersion, saveSnapshot, loadSnapshot, type MizzleSnapshot } from "mizzle/snapshot";
import { PhysicalTable } from "mizzle/table";
import { TABLE_SYMBOLS, ENTITY_SYMBOLS } from "@mizzle/shared";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Mock helpers
const mockColumn = (name: string, type: string) => ({
    name,
    getDynamoType: () => type,
    _: { name, type }
});

const mockTable = (name: string, pkName: string, pkType: string) => {
    const table = new PhysicalTable(name, {
        pk: { build: () => mockColumn(pkName, pkType) } as any
    });
    table[TABLE_SYMBOLS.TABLE_NAME] = name;
    table[TABLE_SYMBOLS.PARTITION_KEY] = mockColumn(pkName, pkType);
    return table;
};

const mockEntity = (table: PhysicalTable, columns: Record<string, string>) => {
    const colBuilders = Object.fromEntries(
        Object.entries(columns).map(([name, type]) => [name, mockColumn(name, type)])
    );
    return {
        [ENTITY_SYMBOLS.PHYSICAL_TABLE]: table,
        [ENTITY_SYMBOLS.COLUMNS]: colBuilders
    } as any;
};

const TEMP_DIR = join(tmpdir(), "mizzle-snapshot-test-" + Date.now());

describe("Snapshot Persistence", () => {
    beforeEach(() => {
        mkdirSync(TEMP_DIR, { recursive: true });
    });
  
    afterEach(() => {
        rmSync(TEMP_DIR, { recursive: true, force: true });
    });

    test("should save and load snapshot", async () => {
        const snapshot: MizzleSnapshot = { 
            version: "1", 
            tables: { 
                "test": { 
                    TableName: "test", 
                    AttributeDefinitions: [], 
                    KeySchema: [] 
                } 
            } 
        };

        await saveSnapshot(TEMP_DIR, snapshot);
        const loaded = await loadSnapshot(TEMP_DIR);
        
        expect(loaded).toEqual(snapshot);
    });

    test("should return null if snapshot does not exist", async () => {
        const loaded = await loadSnapshot(TEMP_DIR);
        expect(loaded).toBeNull();
    });
});

describe("Snapshot Generation", () => {
    test("should generate MizzleSnapshot from tables and entities", () => {
        const table = mockTable("users", "id", "S");
        const schema = { tables: [table], entities: [] };
        
        const snapshot = generateSnapshot(schema);
        
        expect(snapshot.version).toBe("1");
        expect(snapshot.tables["users"]).toBeDefined();
        expect(snapshot.tables["users"]!.TableName).toBe("users");
        expect(snapshot.tables["users"]!.AttributeDefinitions).toEqual([{ AttributeName: "id", AttributeType: "S" }]);
    });

    test("should include indexes in snapshot", () => {
        const table = mockTable("users", "id", "S");
        table[TABLE_SYMBOLS.INDEXES] = {
            "byEmail": { type: "gsi", config: { pk: "email" } },
            "byDate": { type: "lsi", config: { sk: "date" } }
        };

        const entity = mockEntity(table, {
            "id": "S",
            "email": "S",
            "date": "N"
        });

        const snapshot = generateSnapshot({ tables: [table], entities: [entity] });
        const userTable = snapshot.tables["users"]!;

        expect(userTable.GlobalSecondaryIndexes).toHaveLength(1);
        expect(userTable.GlobalSecondaryIndexes![0].IndexName).toBe("byEmail");
        expect(userTable.LocalSecondaryIndexes).toHaveLength(1);
        expect(userTable.LocalSecondaryIndexes![0].IndexName).toBe("byDate");

        // Verify Attributes
        const attrs = userTable.AttributeDefinitions;
        expect(attrs).toContainEqual({ AttributeName: "email", AttributeType: "S" });
        expect(attrs).toContainEqual({ AttributeName: "date", AttributeType: "N" });
    });
});

describe("Migration Versioning", () => {
    beforeEach(() => {
        mkdirSync(TEMP_DIR, { recursive: true });
    });
  
    afterEach(() => {
        rmSync(TEMP_DIR, { recursive: true, force: true });
    });

    test("should return '0000' if no migrations exist", async () => {
        const version = await getNextMigrationVersion(TEMP_DIR);
        expect(version).toBe("0000");
    });

    test("should return '0001' if '0000_init.ts' exists", async () => {
        writeFileSync(join(TEMP_DIR, "0000_init.ts"), "");
        const version = await getNextMigrationVersion(TEMP_DIR);
        expect(version).toBe("0001");
    });

    test("should handle gaps and return next sequential", async () => {
        writeFileSync(join(TEMP_DIR, "0000_init.ts"), "");
        writeFileSync(join(TEMP_DIR, "0002_foo.ts"), ""); // Gap
        const version = await getNextMigrationVersion(TEMP_DIR);
        expect(version).toBe("0003"); // Should be max + 1
    });
});