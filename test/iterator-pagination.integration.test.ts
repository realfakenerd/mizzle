import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dynamoTable, dynamoEntity } from "mizzle/table";
import { string, uuid } from "mizzle/columns";
import { prefixKey, staticKey } from "mizzle";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { mizzle } from "mizzle/db";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

const docClient = DynamoDBDocumentClient.from(client);

describe("Iterator Pagination Integration", () => {
    const tableName = "TestTable_Pagination";
    const table = dynamoTable(tableName, {
        pk: string("pk"),
        sk: string("sk"),
    });

    const user = dynamoEntity(
        table,
        "User",
        {
            id: uuid(),
            data: string(),
        },
        (cols) => ({
            pk: prefixKey("USER#", cols.id),
            sk: staticKey("METADATA"),
        }),
    );

    // 1MB is the limit. Each item is ~10KB. 120 items = 1.2MB
    const itemCount = 120;
    const largeData = "x".repeat(1024 * 10); // 10KB

    beforeAll(async () => {
        try {
            await client.send(new CreateTableCommand({
                TableName: tableName,
                KeySchema: [
                    { AttributeName: "pk", KeyType: "HASH" },
                    { AttributeName: "sk", KeyType: "RANGE" },
                ],
                AttributeDefinitions: [
                    { AttributeName: "pk", AttributeType: "S" },
                    { AttributeName: "sk", AttributeType: "S" },
                ],
                ProvisionedThroughput: { ReadCapacityUnits: 25, WriteCapacityUnits: 25 },
            }));

            // Parallel insert to speed up
            const puts = [];
            for (let i = 0; i < itemCount; i++) {
                puts.push(docClient.send(new PutCommand({
                    TableName: tableName,
                    Item: {
                        pk: `USER#${i}`,
                        sk: "METADATA",
                        id: `${i}`,
                        data: largeData,
                    },
                })));
            }
            await Promise.all(puts);
        } catch { /* ignore */ }
    }, 30000);

    afterAll(async () => {
        try {
            await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch { /* ignore */ }
    });

    it("should iterate through all items across multiple pages", async () => {
        const iterator = mizzle(client).select().from(user).iterator();
        let count = 0;
        for await (const _ of iterator) {
            count++;
        }
        expect(count).toBe(itemCount);
    }, 20000);

    it("should respect limit across multiple pages", async () => {
        const limit = 15;
        const iterator = mizzle(client).select().from(user).limit(limit).iterator();
        let count = 0;
        for await (const _ of iterator) {
            count++;
        }
        expect(count).toBe(limit);
    });

    it("should respect pageSize hint and still fetch all", async () => {
        // Small page size to force many requests
        const iterator = mizzle(client).select().from(user).pageSize(10).iterator();
        let count = 0;
        for await (const _ of iterator) {
            count++;
        }
        expect(count).toBe(itemCount);
    }, 20000);
});
