import { expect, test, describe, beforeEach, afterEach, mock } from "bun:test";
import { generateCommand } from "../../packages/mizzling/src/commands/generate";
import { pushCommand } from "../../packages/mizzling/src/commands/push";
import { PhysicalTable } from "mizzle/table";
import { TABLE_SYMBOLS } from "@mizzle/shared";
import { mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Mocks
const mockClack = {
    text: mock(() => Promise.resolve("test_migration")),
    confirm: mock(() => Promise.resolve(true)),
    intro: mock(() => {}),
    outro: mock(() => {}),
    spinner: () => ({ start: () => {}, stop: () => {}, message: () => {} }),
    isCancel: () => false
};
mock.module("@clack/prompts", () => mockClack);

const mockTable = (name: string) => {
    const table = new PhysicalTable(name, {
        pk: { build: () => ({ _: { name: "id", type: "string" }, getDynamoType: () => "S", name: "id" }) } as any
    });
    // @ts-ignore
    table[TABLE_SYMBOLS.TABLE_NAME] = name;
    // @ts-ignore
    table[TABLE_SYMBOLS.PARTITION_KEY] = { name: "id", getDynamoType: () => "S" };
    return table;
};

// Mock Client
const createMockClient = () => {
    return {
        send: async () => ({ TableNames: [], Table: undefined })
    } as any;
};

const TEMP_DIR = join(tmpdir(), "mizzle-interactive-test-" + Date.now());

describe("Interactive Commands", () => {
    beforeEach(() => {
        mkdirSync(TEMP_DIR, { recursive: true });
        mockClack.text.mockClear();
        mockClack.confirm.mockClear();
    });
  
    afterEach(() => {
        rmSync(TEMP_DIR, { recursive: true, force: true });
    });

    const mockDiscover = mock();

    test("generateCommand should ask for migration name", async () => {
        const tables = [mockTable("users")];
        mockDiscover.mockResolvedValue({ tables, entities: [] });

        await generateCommand({
            config: { schema: "dummy", out: TEMP_DIR } as any,
            discoverSchema: mockDiscover
        });

        expect(mockClack.text).toHaveBeenCalled();
    });

    test("pushCommand should ask for confirmation", async () => {
        const tables = [mockTable("users")];
        mockDiscover.mockResolvedValue({ tables, entities: [] });
        const client = createMockClient();

        await pushCommand({
            config: { schema: "dummy", out: TEMP_DIR } as any,
            discoverSchema: mockDiscover,
            client
        });

        expect(mockClack.confirm).toHaveBeenCalled();
    });
});
