import { expect, describe, it } from "vitest";
import { getRemoteSnapshot } from "@aurios/mizzle/introspection";
import type { IMizzleClient } from "../../packages/mizzle/src/core/client";

const createMockClient = (tables: { TableName: string }[]) => {
  return {
    send: async (command: { constructor: { name: string }; input: { TableName: string } }) => {
      const cmdName = command.constructor.name;
      if (cmdName === "ListTablesCommand") {
        return { TableNames: tables.map((t) => t.TableName) };
      }
      if (cmdName === "DescribeTableCommand") {
        const tableName = command.input.TableName;
        const table = tables.find((t) => t.TableName === tableName);
        return { Table: table };
      }
      return {};
    },
  } as unknown as IMizzleClient;
};

describe("Introspection", () => {
  it("should describe tables and return a snapshot", async () => {
    const mockTables = [
      {
        TableName: "users",
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        GlobalSecondaryIndexes: [
          {
            IndexName: "byEmail",
            KeySchema: [],
            Projection: { ProjectionType: "ALL" },
          },
        ],
      },
    ];
    const client = createMockClient(mockTables);
    const snapshot = await getRemoteSnapshot(client as any);

    expect(snapshot.version).toBe("remote");
    expect(snapshot.tables["users"]!.TableName).toBe("users");
    expect(snapshot.tables["users"]!.GlobalSecondaryIndexes).toHaveLength(1);
    expect(snapshot.tables["users"]).toBeDefined();
    expect(snapshot.tables["users"]!.GlobalSecondaryIndexes![0]!.IndexName).toBe("byEmail");
  });
});
