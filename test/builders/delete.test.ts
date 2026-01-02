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

        // 3. Delete it
        await db.delete(user, { id }).execute();

        // 4. Verify it's gone
        const allItems = await db.select().from(user).execute();
        const found = (allItems as any[]).find(u => u.id === id);
        expect(found).toBeUndefined();
    });

    it("should return deleted attributes when .returning() is used", async () => {
        // 1. Insert an item
        const id = "test-user-returning";
        const newUser = { id, name: "Bob" } as any;
        await db.insert(user).values(newUser).execute();

        // 2. Delete it with returning()
        const deletedItem = await db.delete(user, { id }).returning().execute();

        // 3. Verify returned item
        expect(deletedItem).toBeDefined();
        expect(deletedItem.id).toBe(id);
        expect(deletedItem.name).toBe("Bob");
    });
});
