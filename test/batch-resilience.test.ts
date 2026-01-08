import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mizzle } from "mizzle";
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

describe("Batch Resilience", () => {
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
            name: { name: "name" }
        }
   } as any;

    beforeEach(() => {
        vi.spyOn(DynamoDBDocumentClient, "from").mockReturnValue(mockDocClient as any);
        mockSend.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should retry unprocessed keys in batchGet", async () => {
        const client = new DynamoDBClient({});
        const db = mizzle(client);

        // 1st call: returns 1 item and 1 unprocessed key
        mockSend.mockResolvedValueOnce({
            Responses: {
                "test-table": [{ pk: "test1", name: "Item 1" }]
            },
            UnprocessedKeys: {
                "test-table": {
                    Keys: [{ pk: "test2" }]
                }
            }
        });

        // 2nd call: returns the 2nd item
        mockSend.mockResolvedValueOnce({
            Responses: {
                "test-table": [{ pk: "test2", name: "Item 2" }]
            }
        });

        const result = await db.batchGet(mockTable, [{ pk: "test1" }, { pk: "test2" }]).execute();

        expect(result.succeeded).toHaveLength(2);
        expect(result.succeeded[0].name).toBe("Item 1");
        expect(result.succeeded[1].name).toBe("Item 2");
        expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("should retry unprocessed items in batchWrite", async () => {
        const client = new DynamoDBClient({});
        const db = mizzle(client);

        // 1st call: 1 unprocessed item
        mockSend.mockResolvedValueOnce({
            UnprocessedItems: {
                "test-table": [
                    { PutRequest: { Item: { pk: "test2", name: "Item 2" } } }
                ]
            }
        });

        // 2nd call: success
        mockSend.mockResolvedValueOnce({
            UnprocessedItems: {}
        });

        const result = await db.batchWrite(mockTable, [
            { type: "put", item: { pk: "test1", name: "Item 1" } },
            { type: "put", item: { pk: "test2", name: "Item 2" } }
        ]).execute();

        expect(result.succeededCount).toBe(2);
        expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("should return failed keys after max attempts in batchGet", async () => {
        const client = new DynamoDBClient({});
        const db = mizzle(client);

        // Always returns unprocessed
        mockSend.mockResolvedValue({
            UnprocessedKeys: {
                "test-table": {
                    Keys: [{ pk: "test1" }]
                }
            }
        });

        const result = await db.batchGet(mockTable, [{ pk: "test1" }]).execute();

        expect(result.succeeded).toHaveLength(0);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0]).toEqual({ pk: "test1" });
        expect(mockSend).toHaveBeenCalledTimes(5); // Internal limit
    });

    it("should return failed items after max attempts in batchWrite", async () => {
        const client = new DynamoDBClient({});
        const db = mizzle(client);

        mockSend.mockResolvedValue({
            UnprocessedItems: {
                "test-table": [
                    { PutRequest: { Item: { pk: "test1" } } }
                ]
            }
        });

        const result = await db.batchWrite(mockTable, [
            { type: "put", item: { pk: "test1" } }
        ]).execute();

        expect(result.succeededCount).toBe(0);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0].PutRequest.Item.pk).toBe("test1");
        expect(mockSend).toHaveBeenCalledTimes(5);
    });
});
