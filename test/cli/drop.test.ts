import { expect, test, describe, beforeEach, vi } from "vitest";
import { dropCommand } from "../../packages/mizzling/src/commands/drop";
import * as prompts from "@clack/prompts";

// Mock Console
const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

// Mock Prompts
vi.mock("@clack/prompts", () => ({
    intro: vi.fn(),
    outro: vi.fn(),
    multiselect: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
    isCancel: vi.fn((val) => val === Symbol.for("clack:cancel")),
    spinner: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        message: vi.fn(),
    })),
}));

// Manual Mock Client
const createMockClient = (tables: any[]) => {
    return {
        send: async (command: any) => {
            const cmdName = command.constructor.name;
            if (cmdName === "ListTablesCommand") {
                return { TableNames: tables.map((t) => t.TableName) };
            }
            if (cmdName === "DeleteTableCommand") {
                return {};
            }
            return {};
        },
    } as any;
};

describe("Drop Command", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("should handle no tables found", async () => {
        const client = createMockClient([]);
        await dropCommand({
            config: { schema: "dummy", out: "dummy" } as any,
            client,
        });
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("No tables found"),
        );
        expect(prompts.multiselect).not.toHaveBeenCalled();
    });

    test("should delete selected tables after confirmation", async () => {
        const mockTables = [{ TableName: "users" }, { TableName: "posts" }];
        const client = createMockClient(mockTables);
        const sendSpy = vi.spyOn(client, "send");

        (prompts.multiselect as any).mockResolvedValueOnce(["users"] as any);
        (prompts.confirm as any).mockResolvedValueOnce(true as any);

        await dropCommand({
            config: { schema: "dummy", out: "dummy" } as any,
            client,
        });

        // Verify ListTables was called
        expect((sendSpy.mock.calls[0]![0] as any).constructor.name).toBe(
            "ListTablesCommand",
        );

        // Verify multiselect was called with options
        expect(prompts.multiselect).toHaveBeenCalled();

        // Verify confirm was called
        expect(prompts.confirm).toHaveBeenCalled();

        // Verify DeleteTable was called for 'users'
        // Note: The order of calls depends on implementation, but we expect at least one DeleteTableCommand
        const calls = sendSpy.mock.calls as any[];
        const deleteCall = calls.find(
            (call) =>
                (call[0] as any).constructor.name === "DeleteTableCommand",
        );
        expect(deleteCall).toBeDefined();
        expect(deleteCall![0].input.TableName).toBe("users");

        expect(prompts.outro).toHaveBeenCalled();
    });

    test("should not delete if confirmation is rejected", async () => {
        const mockTables = [{ TableName: "users" }];
        const client = createMockClient(mockTables);
        const sendSpy = vi.spyOn(client, "send");

        (prompts.multiselect as any).mockResolvedValueOnce(["users"] as any);
        (prompts.confirm as any).mockResolvedValueOnce(false as any); // User says No

        await dropCommand({
            config: { schema: "dummy", out: "dummy" } as any,
            client,
        });

        // Verify DeleteTable was NOT called
        const calls = sendSpy.mock.calls;
        const deleteCall = calls.find(
            (call) =>
                (call[0] as any).constructor.name === "DeleteTableCommand",
        );
        expect(deleteCall).toBeUndefined();

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("Operation cancelled"),
        );
    });

    test("should handle cancellation at selection", async () => {
        const mockTables = [{ TableName: "users" }];
        const client = createMockClient(mockTables);

        // Simulate cancellation symbol
        const cancelSymbol = Symbol.for("clack:cancel");
        (prompts.multiselect as any).mockResolvedValueOnce(cancelSymbol as any);
        vi.mocked(prompts.isCancel).mockReturnValueOnce(true);

        await dropCommand({
            config: { schema: "dummy", out: "dummy" } as any,
            client,
        });

        expect(prompts.cancel).toHaveBeenCalled();
        expect(prompts.confirm).not.toHaveBeenCalled();
    });
});
