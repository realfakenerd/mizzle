import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dynamoTable, dynamoEntity } from "mizzle/table";
import { string, uuid, number, list } from "mizzle/columns";
import { prefixKey, staticKey } from "mizzle";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { mizzle } from "mizzle/db";
import { eq } from "../packages/mizzle/src/expressions/operators";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

describe("Update Integration", () => {
    const tableName = "UpdateIntegrationTable";
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
            age: number(),
            roles: list(),
        },
        (cols) => ({
            pk: prefixKey("USER#", cols.id),
            sk: staticKey("METADATA"),
        }),
    );

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
        } catch { /* ignore */ }
    });

    afterAll(async () => {
        try {
            await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch { /* ignore */ }
    });

    it("should perform a full update lifecycle", async () => {
        const db = mizzle(client);

        // 1. Setup - Insert a user
        const newUser = await db.insert(user).values({
            name: "Alice",
            age: 25,
            roles: ["user"]
        }).returning().execute();

        expect(newUser.id).toBeDefined();

        // 2. SET
        const setRes = await db.update(user)
            .set({ name: "Alice Smith" })
            .where(eq(user.id, newUser.id))
            .returning("ALL_NEW")
            .execute();
        
        expect(setRes.name).toBe("Alice Smith");
        expect(setRes.age).toBe(25);

        // 3. ADD
        const addRes = await db.update(user)
            .add({ age: 5 })
            .where(eq(user.id, newUser.id))
            .returning("UPDATED_NEW")
            .execute();
        
        expect(addRes.age).toBe(30);

        // 4. REMOVE
        const removeRes = await db.update(user)
            .remove("roles")
            .where(eq(user.id, newUser.id))
            .returning("ALL_NEW")
            .execute();
        
        expect(removeRes.roles).toBeUndefined();
        expect(removeRes.name).toBe("Alice Smith");

        // 5. Verification - Select
        const final = await db.select().from(user).where(eq(user.id, newUser.id));
        expect(final[0]).toMatchObject({
            id: newUser.id,
            name: "Alice Smith",
            age: 30
        });
        expect(final[0].roles).toBeUndefined();
    });
});
