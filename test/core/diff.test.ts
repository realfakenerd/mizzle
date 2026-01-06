import { expect, test, describe } from "bun:test";
import { compareSchema } from "../../packages/mizzle/src/core/diff";
import { PhysicalTable } from "../../packages/mizzle/src/core/table";
import { type MizzleSnapshot } from "../../packages/mizzle/src/core/snapshot";
import { TABLE_SYMBOLS, ENTITY_SYMBOLS } from "@mizzle/shared";

// Mock helpers
const mockColumn = (name: string, type: string) => ({
    name,
    getDynamoType: () => type,
    _: { name, type }
});

const mockTable = (name: string, pkName: string, pkType: string, skName?: string, skType?: string) => {
    const table = new PhysicalTable(name, {
        pk: { build: () => mockColumn(pkName, pkType) } as any
    });
    // @ts-ignore
    table[TABLE_SYMBOLS.TABLE_NAME] = name;
    // @ts-ignore
    table[TABLE_SYMBOLS.PARTITION_KEY] = mockColumn(pkName, pkType);
    if (skName && skType) {
        // @ts-ignore
        table[TABLE_SYMBOLS.SORT_KEY] = mockColumn(skName, skType);
    }
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

describe("Schema Diffing", () => {
  test("should detect new tables", () => {
    const table = mockTable("users", "id", "S");
    const snapshot: MizzleSnapshot = { version: "1", tables: {} };
    
    const changes = compareSchema({ tables: [table], entities: [] }, snapshot);
    
    expect(changes).toHaveLength(1);
    expect(changes[0]!.type).toBe("create");
    expect((changes[0] as any).table.TableName).toBe("users");
    expect((changes[0] as any).table.AttributeDefinitions).toEqual([{ AttributeName: "id", AttributeType: "S" }]);
  });

  test("should detect deleted tables", () => {
    const snapshot: MizzleSnapshot = { 
        version: "1", 
        tables: {
            "users": {
                TableName: "users",
                AttributeDefinitions: [],
                KeySchema: []
            }
        } 
    };
    
        const currentSchema = { tables: [], entities: [] };
        const changes = compareSchema(currentSchema, snapshot);
        expect(changes).toHaveLength(1);
        expect(changes[0]!.type).toBe("delete");
        expect((changes[0] as any).tableName).toBe("users");  });

  test("should return empty array if no changes", () => {
    const table = mockTable("users", "id", "S");
    const snapshot: MizzleSnapshot = { 
        version: "1", 
        tables: {
            "users": {
                TableName: "users",
                AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
                KeySchema: [{ AttributeName: "id", KeyType: "HASH" }]
            }
        } 
    };

    const changes = compareSchema({ tables: [table], entities: [] }, snapshot);
    expect(changes).toHaveLength(0);
  });

  test("should detect changed tables (basic)", () => {
    const table = mockTable("users", "id", "S");
    const snapshot: MizzleSnapshot = { 
        version: "1", 
        tables: {
            "users": {
                TableName: "users",
                AttributeDefinitions: [{ AttributeName: "id", AttributeType: "N" }], // Changed type
                KeySchema: [{ AttributeName: "id", KeyType: "HASH" }]
            }
        } 
    };

    const changes = compareSchema({ tables: [table], entities: [] }, snapshot);
    expect(changes).toHaveLength(1);
    expect(changes[0]!.type).toBe("update");
  });

  test("should resolve index types from entities", () => {
    const table = mockTable("users", "id", "S");
    // Add index definition manually
    // @ts-ignore
    table[TABLE_SYMBOLS.INDEXES] = {
        "byEmail": { type: "gsi", config: { pk: "email" } }
    };

    const entity = mockEntity(table, {
        "id": "S",
        "email": "S"
    });

    const snapshot: MizzleSnapshot = { version: "1", tables: {} };
    
    const changes = compareSchema({ tables: [table], entities: [entity] }, snapshot);
    
    expect(changes).toHaveLength(1);
    const created = (changes[0] as any).table;
    expect(created.GlobalSecondaryIndexes).toHaveLength(1);
    expect(created.GlobalSecondaryIndexes[0].IndexName).toBe("byEmail");
    
    // Check if "email" was added to AttributeDefinitions with correct type
    const emailAttr = created.AttributeDefinitions.find((a: any) => a.AttributeName === "email");
    expect(emailAttr).toBeDefined();
    expect(emailAttr.AttributeType).toBe("S");
  });

  test("should throw if index column type cannot be resolved", () => {
    const table = mockTable("users", "id", "S");
    // @ts-ignore
    table[TABLE_SYMBOLS.INDEXES] = {
        "byEmail": { type: "gsi", config: { pk: "email" } }
    };
    // No entity to provide "email" type

    expect(() => {
        compareSchema({ tables: [table], entities: [] }, { version: "1", tables: {} });
    }).toThrow("Could not resolve type for column 'email'");
  });
});