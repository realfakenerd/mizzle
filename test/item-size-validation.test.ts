import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mizzle, ItemSizeExceededError } from "mizzle";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "@mizzle/shared";

// Mock send method
const mockSend = vi.fn();
const mockDocClient = {
    send: mockSend,
    middlewareStack: {
        add: vi.fn(),
        remove: vi.fn(),
    },
};

describe("Item Size Validation Integration", () => {
    const mockTable = {
        [ENTITY_SYMBOLS.PHYSICAL_TABLE]: {
           [TABLE_SYMBOLS.TABLE_NAME]: "test-table",
           [TABLE_SYMBOLS.PARTITION_KEY]: { name: "pk" },
           [TABLE_SYMBOLS.SORT_KEY]: undefined,
           [TABLE_SYMBOLS.INDEXES]: {},
        },
        [ENTITY_SYMBOLS.ENTITY_STRATEGY]: { pk: { type: "static", segments: ["test"] } },
        [ENTITY_SYMBOLS.COLUMNS]: {
            pk: { name: "pk" },
            data: { name: "data" }
        }
   } as any;

    beforeEach(() => {
        vi.spyOn(DynamoDBDocumentClient, "from").mockReturnValue(mockDocClient as any);
        mockSend.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should throw ItemSizeExceededError on insert if item is too large", async () => {
        const client = new DynamoDBClient({});
        const db = mizzle(client);

        const largeItem = {
            pk: "test",
            data: "x".repeat(401 * 1024)
        };

        await expect(db.insert(mockTable).values(largeItem).execute()).rejects.toThrow(ItemSizeExceededError);
        expect(mockSend).not.toHaveBeenCalled();
    });

    it("should throw ItemSizeExceededError on update if update payload is too large", async () => {
        const client = new DynamoDBClient({});
        const db = mizzle(client);

        const largeData = "x".repeat(401 * 1024);

        await expect(db.update(mockTable).key({ pk: "test" }).set({ data: largeData }).execute()).rejects.toThrow(ItemSizeExceededError);
        expect(mockSend).not.toHaveBeenCalled();
    });

    it("should throw ItemSizeExceededError on batchWrite if any item is too large", async () => {
        const client = new DynamoDBClient({});
        const db = mizzle(client);

        const largeItem = {
            pk: "test",
            data: "x".repeat(401 * 1024)
        };

        await expect(db.batchWrite(mockTable, [
            { type: "put", item: largeItem }
        ]).execute()).rejects.toThrow(ItemSizeExceededError);
        expect(mockSend).not.toHaveBeenCalled();
    });
});
