import { expect, test, describe, beforeEach, afterEach, spyOn, mock } from "bun:test";
import { dropCommand } from "../../src/cli/commands/drop";
import * as prompts from "@clack/prompts";

// Mock Console
const logSpy = spyOn(console, "log").mockImplementation(() => {});

// Mock Prompts
const introSpy = spyOn(prompts, "intro").mockImplementation(() => {});
const outroSpy = spyOn(prompts, "outro").mockImplementation(() => {});
const multiselectSpy = spyOn(prompts, "multiselect");
const confirmSpy = spyOn(prompts, "confirm");
const cancelSpy = spyOn(prompts, "cancel").mockImplementation(() => {});
const isCancelSpy = spyOn(prompts, "isCancel").mockImplementation((val): val is symbol => val === Symbol("clack:cancel"));
const spinnerSpy = spyOn(prompts, "spinner").mockImplementation(() => ({
    start: () => {},
    stop: () => {},
    message: () => {}
}) as any);

// Manual Mock Client
const createMockClient = (tables: any[]) => {
    return {
        send: async (command: any) => {
            const cmdName = command.constructor.name;
            if (cmdName === "ListTablesCommand") {
                return { TableNames: tables.map(t => t.TableName) };
            }
            if (cmdName === "DeleteTableCommand") {
                return {};
            }
            return {};
        }
    } as any;
};

describe("Drop Command", () => {
    beforeEach(() => {
        logSpy.mockClear();
        introSpy.mockClear();
        outroSpy.mockClear();
        multiselectSpy.mockClear();
        confirmSpy.mockClear();
        cancelSpy.mockClear();
    });

    test("should handle no tables found", async () => {
        const client = createMockClient([]);
        await dropCommand({
            config: { schema: "dummy", out: "dummy" } as any,
            client
        });
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("No tables found"));
        expect(multiselectSpy).not.toHaveBeenCalled();
    });

    test("should delete selected tables after confirmation", async () => {
        const mockTables = [{ TableName: "users" }, { TableName: "posts" }];
        const client = createMockClient(mockTables);
        const sendSpy = spyOn(client, "send");

        multiselectSpy.mockResolvedValueOnce(["users"] as any);
        confirmSpy.mockResolvedValueOnce(true as any);

        await dropCommand({
            config: { schema: "dummy", out: "dummy" } as any,
            client
        });

        // Verify ListTables was called
        expect((sendSpy.mock.calls[0]![0] as any).constructor.name).toBe("ListTablesCommand");
        
        // Verify multiselect was called with options
        expect(multiselectSpy).toHaveBeenCalled();
        
        // Verify confirm was called
        expect(confirmSpy).toHaveBeenCalled();

        // Verify DeleteTable was called for 'users'
        // Note: The order of calls depends on implementation, but we expect at least one DeleteTableCommand
        const calls = sendSpy.mock.calls as any[];
        const deleteCall = calls.find(call => (call[0] as any).constructor.name === "DeleteTableCommand");
        expect(deleteCall).toBeDefined();
        expect(deleteCall![0].input.TableName).toBe("users");
        
        expect(outroSpy).toHaveBeenCalled();
    });

    test("should not delete if confirmation is rejected", async () => {
        const mockTables = [{ TableName: "users" }];
        const client = createMockClient(mockTables);
        const sendSpy = spyOn(client, "send");

        multiselectSpy.mockResolvedValueOnce(["users"] as any);
        confirmSpy.mockResolvedValueOnce(false as any); // User says No

        await dropCommand({
            config: { schema: "dummy", out: "dummy" } as any,
            client
        });

        // Verify DeleteTable was NOT called
        const calls = sendSpy.mock.calls;
        const deleteCall = calls.find(call => (call[0] as any).constructor.name === "DeleteTableCommand");
        expect(deleteCall).toBeUndefined();
        
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Operation cancelled"));
    });

    test("should handle cancellation at selection", async () => {
        const mockTables = [{ TableName: "users" }];
        const client = createMockClient(mockTables);
        
        // Simulate cancellation symbol
        const cancelSymbol = Symbol("clack:cancel");
        multiselectSpy.mockResolvedValueOnce(cancelSymbol as any);
        isCancelSpy.mockReturnValueOnce(true);

        await dropCommand({
            config: { schema: "dummy", out: "dummy" } as any,
            client
        });

        expect(cancelSpy).toHaveBeenCalled();
        expect(confirmSpy).not.toHaveBeenCalled();
    });
});
