import { expect, test, describe } from "bun:test";
import { getRemoteSnapshot } from "../../src/core/introspection";

const createMockClient = (tables: any[]) => {
    return {
        send: async (command: any) => {
            const cmdName = command.constructor.name;
            if (cmdName === "ListTablesCommand") {
                return { TableNames: tables.map(t => t.TableName) };
            }
            if (cmdName === "DescribeTableCommand") {
                const tableName = command.input.TableName;
                const table = tables.find(t => t.TableName === tableName);
                return { Table: table };
            }
            return {};
        }
    } as any;
};

describe("Introspection", () => {
    test("should list and describe tables", async () => {
        const mockTables = [{
            TableName: "users",
            AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
            KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
            GlobalSecondaryIndexes: [{
                IndexName: "byEmail",
                KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
                Projection: { ProjectionType: "ALL" }
            }]
        }];
        
        const client = createMockClient(mockTables);
        const snapshot = await getRemoteSnapshot(client);
        
        expect(snapshot.tables["users"]).toBeDefined();
        expect(snapshot.tables["users"].TableName).toBe("users");
        expect(snapshot.tables["users"].GlobalSecondaryIndexes).toHaveLength(1);
        expect(snapshot.tables["users"].GlobalSecondaryIndexes![0].IndexName).toBe("byEmail");
    });
});
