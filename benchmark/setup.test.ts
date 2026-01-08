import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTable, deleteTable, waitForTable } from "./setup";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { TABLE_NAME, REGION, ENDPOINT } from "./env";

const client = new DynamoDBClient({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

describe("Benchmark Setup", () => {
    beforeAll(async () => {
        await deleteTable();
    });

    afterAll(async () => {
        await deleteTable();
    });

    it("should create and delete the benchmark table", async () => {
        // Create table
        await createTable();
        await waitForTable();

        // Verify it exists
        const { Table } = await client.send(
            new DescribeTableCommand({ TableName: TABLE_NAME })
        );
        expect(Table).toBeDefined();
        expect(Table?.TableStatus).toBe("ACTIVE");

        // Delete table
        await deleteTable();

        // Verify it's gone (or at least deleting)
        try {
            const { Table: TableAfterDelete } = await client.send(
                new DescribeTableCommand({ TableName: TABLE_NAME })
            );
            // It might still be in DELETING status
            expect(TableAfterDelete?.TableStatus).toBe("DELETING");
        } catch (e: any) {
            expect(e.name).toBe("ResourceNotFoundException");
        }
    }, 10000); // 10s timeout
});
