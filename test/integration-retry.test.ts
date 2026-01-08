import { describe, it, expect, vi } from "vitest";
import { mizzle } from "mizzle";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "@mizzle/shared";

// Mock DynamoDBDocumentClient.from to return our mock
const mockSend = vi.fn();
const mockDocClient = {
    send: mockSend,
    middlewareStack: {},
};

vi.mock("@aws-sdk/lib-dynamodb", async () => {
    const actual = await vi.importActual<typeof import("@aws-sdk/lib-dynamodb")>("@aws-sdk/lib-dynamodb");
    return {
        ...actual,
        DynamoDBDocumentClient: {
            from: () => mockDocClient,
        },
    };
});

describe("Integration Retry", () => {
    const mockTable = {
        [ENTITY_SYMBOLS.PHYSICAL_TABLE]: {
           [TABLE_SYMBOLS.TABLE_NAME]: "test-table",
           [TABLE_SYMBOLS.PARTITION_KEY]: { name: "pk" },
           [TABLE_SYMBOLS.SORT_KEY]: undefined,
           [TABLE_SYMBOLS.INDEXES]: {},
        },
        [ENTITY_SYMBOLS.ENTITY_STRATEGY]: { pk: { type: "static", segments: ["test"] } }
   } as any;

    it("should retry operations via mizzle client", async () => {
        const client = new DynamoDBClient({});
        
        // Mock error
        const error = new Error("ThrottlingException");
        error.name = "ThrottlingException";

        mockSend.mockReset();
        mockSend.mockRejectedValueOnce(error)
                .mockResolvedValue({ Items: [] }); // Success on 2nd try

        const db = mizzle({
            client: client,
            retry: { maxAttempts: 3, baseDelay: 10 }
        });

        // Use select builder which calls client.send
        // We use .executeScan() path if no keys provided, but resolveKeys is called first.
        // resolveKeys might complain if strategies/values don't match.
        // Let's force a scan or just rely on the fact that resolveKeys returns something.
        
        await db.select().from(mockTable).execute();

        expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("should throw after max attempts", async () => {
        const client = new DynamoDBClient({});
        
        const error = new Error("ThrottlingException");
        error.name = "ThrottlingException";

        mockSend.mockReset();
        mockSend.mockRejectedValue(error);

        const db = mizzle({
            client: client,
            retry: { maxAttempts: 3, baseDelay: 10 }
        });

        await expect(db.select().from(mockTable).execute()).rejects.toThrow("ThrottlingException");
        expect(mockSend).toHaveBeenCalledTimes(3);
    });
});
