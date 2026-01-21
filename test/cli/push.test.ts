import { expect, test, describe, vi } from "vitest";
import { pushCommand } from "../../packages/mizzling/src/commands/push";
import { PhysicalTable } from "@aurios/mizzle/table";
import { TABLE_SYMBOLS } from "@mizzle/shared";
import type { IMizzleClient } from "../../packages/mizzle/src/core/client";

// Mock Clack
vi.mock("@clack/prompts", () => ({
    text: vi.fn(() => Promise.resolve("migration")),
    confirm: vi.fn(() => Promise.resolve(true)),
    intro: vi.fn(() => {}),
    outro: vi.fn(() => {}),
    spinner: () => ({ start: () => {}, stop: () => {}, message: () => {} }),
    isCancel: () => false,
}));

// Mock Table
const mockTable = (name: string) => {
    const table = new PhysicalTable(name, {
        pk: {
            build: () => ({
                _: { name: "id", type: "string" },
                getDynamoType: () => "S",
                name: "id",
            }),
        } as any,
    });
    table[TABLE_SYMBOLS.TABLE_NAME] = name;
    table[TABLE_SYMBOLS.PARTITION_KEY] = {
        name: "id",
        getDynamoType: () => "S",
    } as any;
    return table;
};

// Manual Mock Client
const createMockClient = () => {
    const sends: unknown[] = [];
    return {
        send: async (command: { constructor: { name: string }; input: Record<string, unknown> }) => {
            sends.push(command);
            const cmdName = command.constructor.name;

            if (cmdName === "ListTablesCommand") {
                return { TableNames: [] };
            }
            if (cmdName === "CreateTableCommand") {
                return {};
            }
            return {};
        },
        // Helper to access captured calls
        _sends: sends,
    };
};

describe("Push Command", () => {
    const mockDiscover = vi.fn();

    test("should create table if it does not exist in remote", async () => {
        // Setup
        const tables = [mockTable("users")];
        mockDiscover.mockResolvedValue({ tables, entities: [] });

        const mockClient = createMockClient() as unknown;

        await pushCommand({
            config: { schema: "dummy", out: "dummy" } as any,
            discoverSchema: mockDiscover,
            client: mockClient as any,
        });

        // Verify CreateTable was called
        // We look for CreateTableCommand in mockClient._sends
        const createCall = ((mockClient as { _sends: { constructor: { name: string }; input: { TableName: string; KeySchema: unknown } }[] })._sends).find(
            (cmd) => cmd.constructor.name === "CreateTableCommand",
        );

        expect(createCall).toBeDefined();
        expect(createCall!.input.TableName).toBe("users");
        expect(createCall!.input.KeySchema).toBeDefined();
    });
});
