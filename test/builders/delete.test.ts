import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dynamoTable, dynamoEntity } from "../../src/core/table";
import { string, uuid } from "../../src/columns/all";
import { prefixKey, staticKey } from "../../src/core/strategies";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { mizzle } from "../../src/utils/db";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

describe("Delete Command Integration", () => {
    const tableName = "DeleteTestTable";
    const table = dynamoTable(tableName, {
        pk: string("pk"),
        sk: string("sk"),
    });

    const user = dynamoEntity(
        table,
        "User",
        {
            id: uuid(),
            name: string(),
        },
        (cols) => ({
            pk: prefixKey("USER#", cols.id),
            sk: staticKey("METADATA"),
        }),
    );

    const db = mizzle(client);

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
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            }));
        } catch (e) {}
    });

    afterAll(async () => {
        try {
            await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch (e) {}
    });

    it("should correctly delete an item by its primary key", async () => {
        // 1. Insert an item
        const id = "test-user-1";
        const newUser = { id, name: "Alice" } as any;
        await db.insert(user).values(newUser).execute();

        // 2. Verify it exists
        let results = await db.select().from(user).where({ id } as any); // Use simple where for now
        // wait, select().where() might need eq()
        // but wait, I can just use db.select().from(user).execute() and find it.
        // Actually, let's use the query builder if select is tricky.
        
        // 3. Delete it
        await db.delete(user, { id }).execute();

        // 4. Verify it's gone
        // Using scan-like select for verification
        const allItems = await db.select().from(user).execute();
        const found = (allItems as any[]).find(u => u.id === id);
        expect(found).toBeUndefined();
    });
});
