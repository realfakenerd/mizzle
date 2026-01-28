import { expect, test, describe, beforeEach, vi } from "vitest";
import { dropCommand } from "../src/commands/drop";
import * as prompts from "@clack/prompts";
import type { IMizzleClient } from "../../mizzle/src/core/client";

// Mock Console
vi.spyOn(console, "log").mockImplementation(() => {});

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
const createMockClient = (tables: Record<string, string>[]) => {
  return {
    send: async (command: { constructor: { name: string } }) => {
      const cmdName = command.constructor.name;
      if (cmdName === "ListTablesCommand") {
        return { TableNames: tables.map((t) => t.TableName) };
      }
      if (cmdName === "DeleteTableCommand") {
        return {};
      }
      return {};
    },
  } as unknown;
};

describe("Drop Command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should handle no tables found", async () => {
    const client = createMockClient([]) as unknown;
    await dropCommand({
      config: { schema: "dummy", out: "dummy" } as any,
      client: client as any,
    });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("No tables found"));
    expect(prompts.multiselect).not.toHaveBeenCalled();
  });

  test("should delete selected tables after confirmation", async () => {
    const mockTables = [{ TableName: "users" }, { TableName: "posts" }];
    const client = createMockClient(mockTables) as { send: (cmd: unknown) => Promise<unknown> };
    const sendSpy = vi.spyOn(client, "send");

    (
      prompts.multiselect as unknown as { mockResolvedValueOnce: (val: unknown) => void }
    ).mockResolvedValueOnce(["users"]);
    (
      prompts.confirm as unknown as { mockResolvedValueOnce: (val: unknown) => void }
    ).mockResolvedValueOnce(true);

    await dropCommand({
      config: { schema: "dummy", out: "dummy" } as any,
      client: client as any,
    });

    // Verify ListTables was called
    expect((sendSpy.mock.calls[0]![0] as { constructor: { name: string } }).constructor.name).toBe(
      "ListTablesCommand",
    );

    // Verify multiselect was called with options
    expect(prompts.multiselect).toHaveBeenCalled();

    // Verify confirm was called
    expect(prompts.confirm).toHaveBeenCalled();

    // Verify DeleteTable was called for 'users'
    // Note: The order of calls depends on implementation, but we expect at least one DeleteTableCommand
    const calls = sendSpy.mock.calls as { input: { TableName: string } }[][];
    const deleteCall = calls.find(
      (call) =>
        (call[0] as unknown as { constructor: { name: string } }).constructor.name ===
        "DeleteTableCommand",
    );
    expect(deleteCall).toBeDefined();
    expect(deleteCall![0]!.input.TableName).toBe("users");

    expect(prompts.outro).toHaveBeenCalled();
  });

  test("should not delete if confirmation is rejected", async () => {
    const mockTables = [{ TableName: "users" }];
    const client = createMockClient(mockTables) as { send: (cmd: unknown) => Promise<unknown> };
    const sendSpy = vi.spyOn(client, "send");

    (
      prompts.multiselect as unknown as { mockResolvedValueOnce: (val: unknown) => void }
    ).mockResolvedValueOnce(["users"]);
    (
      prompts.confirm as unknown as { mockResolvedValueOnce: (val: unknown) => void }
    ).mockResolvedValueOnce(false); // User says No

    await dropCommand({
      config: { schema: "dummy", out: "dummy" } as any,
      client: client as any,
    });

    // Verify DeleteTable was NOT called
    const calls = sendSpy.mock.calls;
    const deleteCall = calls.find(
      (call) =>
        (call[0] as unknown as { constructor: { name: string } }).constructor.name ===
        "DeleteTableCommand",
    );
    expect(deleteCall).toBeUndefined();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Operation cancelled"));
  });

  test("should handle cancellation at selection", async () => {
    const mockTables = [{ TableName: "users" }];
    const client = createMockClient(mockTables) as unknown;

    // Simulate cancellation symbol
    const cancelSymbol = Symbol.for("clack:cancel");
    (
      prompts.multiselect as unknown as { mockResolvedValueOnce: (val: unknown) => void }
    ).mockResolvedValueOnce(cancelSymbol);
    vi.mocked(prompts.isCancel).mockReturnValueOnce(true);

    await dropCommand({
      config: { schema: "dummy", out: "dummy" } as any,
      client: client as any,
    });

    expect(prompts.cancel).toHaveBeenCalled();
    expect(prompts.confirm).not.toHaveBeenCalled();
  });
});
