import { expect, test, describe, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { listCommand } from "../../packages/mizzling/src/commands/list";

// Mock Clack
const mockClack = {
    intro: mock(() => {}),
    outro: mock(() => {}),
    spinner: () => ({ start: () => {}, stop: () => {}, message: () => {} }),
};
mock.module("@clack/prompts", () => mockClack);

// Mock Console
const logSpy = spyOn(console, "log").mockImplementation(() => {});

// Manual Mock Client
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

describe("List Command", () => {
    beforeEach(() => {
        logSpy.mockClear();
    });

    test("should list remote tables", async () => {
        const mockTables = [{
            TableName: "users",
            AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
            KeySchema: [{ AttributeName: "id", KeyType: "HASH" }]
        }];
        const client = createMockClient(mockTables);

        await listCommand({
            config: { schema: "dummy", out: "dummy" } as any,
            client
        });

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("users"));
        // Basic check for now
    });

    test("should handle empty list", async () => {
        const client = createMockClient([]);
        await listCommand({
            config: { schema: "dummy", out: "dummy" } as any,
            client
        });
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("No tables found"));
    });
});
