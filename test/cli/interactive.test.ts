import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { generateCommand } from "../../packages/mizzling/src/commands/generate";
import { pushCommand } from "../../packages/mizzling/src/commands/push";
import { PhysicalTable } from "mizzle/table";
import { TABLE_SYMBOLS } from "@mizzle/shared";
import { mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Mocks
const { mockClack } = vi.hoisted(() => ({
    mockClack: {
        text: vi.fn(() => Promise.resolve("test_migration")),
        confirm: vi.fn(() => Promise.resolve(true)),
        intro: vi.fn(() => {}),
        outro: vi.fn(() => {}),
        spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() })),
        isCancel: vi.fn(() => false),
    }
}));

vi.mock("@clack/prompts", () => ({
    text: mockClack.text,
    confirm: mockClack.confirm,
    intro: mockClack.intro,
    outro: mockClack.outro,
    spinner: mockClack.spinner,
    isCancel: mockClack.isCancel,
}));

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
    };
    return table;
};

// Mock Client
const createMockClient = () => {
    return {
        send: async () => ({ TableNames: [], Table: undefined }),
    } as any;
};

const TEMP_DIR = join(tmpdir(), "mizzle-interactive-test-" + Date.now());

describe("Interactive Commands", () => {
    beforeEach(() => {
        mkdirSync(TEMP_DIR, { recursive: true });
        vi.mocked(mockClack.text).mockClear();
        vi.mocked(mockClack.confirm).mockClear();
    });

    afterEach(() => {
        rmSync(TEMP_DIR, { recursive: true, force: true });
    });

    const mockDiscover = vi.fn();

    test("generateCommand should ask for migration name", async () => {
        const tables = [mockTable("users")];
        mockDiscover.mockResolvedValue({ tables, entities: [] });

        await generateCommand({
            config: { schema: "dummy", out: TEMP_DIR } as any,
            discoverSchema: mockDiscover,
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
            client,
        });

        expect(mockClack.confirm).toHaveBeenCalled();
    });
});
