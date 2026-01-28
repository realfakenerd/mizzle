import { expect, test, describe, beforeEach, vi } from "vitest";
import { listCommand } from "../src/commands/list";
import type { IMizzleClient } from "../../mizzle/src/core/client";

// Mock Console
const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

// Manual Mock Client
const createMockClient = (tables: Record<string, unknown>[]) => {
  return {
    send: async (command: { constructor: { name: string }; input?: { TableName: string } }) => {
      const cmdName = command.constructor.name;
      if (cmdName === "ListTablesCommand") {
        return { TableNames: tables.map((t) => t.TableName as string) };
      }
      if (cmdName === "DescribeTableCommand") {
        const tableName = command.input?.TableName;
        const table = tables.find((t) => t.TableName === tableName);
        return { Table: table };
      }
      return {};
    },
  };
};

describe("List Command", () => {
  beforeEach(() => {
    logSpy.mockClear();
  });

  test("should list remote tables", async () => {
    const mockTables = [
      {
        TableName: "users",
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      },
    ];
    const client = createMockClient(mockTables) as unknown;

    await listCommand({
      config: { schema: "dummy", out: "dummy" } as any,
      client: client as any,
    });

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("users"));
    // Basic check for now
  });

  test("should handle empty list", async () => {
    const client = createMockClient([]) as unknown;
    await listCommand({
      config: { schema: "dummy", out: "dummy" } as any,
      client: client as any,
    });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("No tables found"));
  });
});
