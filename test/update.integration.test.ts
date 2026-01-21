import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dynamoTable, dynamoEntity } from "@aurios/mizzle/table";
import { string, uuid, number, list } from "@aurios/mizzle/columns";
import { prefixKey, staticKey } from "@aurios/mizzle";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { mizzle } from "@aurios/mizzle/db";
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
        
        const res1 = setRes as Record<string, unknown>;
        expect(res1.name).toBe("Alice Smith");
        expect(res1.age).toBe(25);

        // 3. ADD
        const addRes = await db.update(user)
            .add({ age: 5 })
            .where(eq(user.id, newUser.id))
            .returning("UPDATED_NEW")
            .execute();
        
        const res2 = addRes as Record<string, unknown>;
        expect(res2.age).toBe(30);

        // 4. REMOVE
        const removeRes = await db.update(user)
            .remove("roles")
            .where(eq(user.id, newUser.id))
            .returning("ALL_NEW")
            .execute();
        
        const res3 = removeRes as Record<string, unknown>;
        expect(res3.roles).toBeUndefined();
        expect(res3.name).toBe("Alice Smith");

        // 5. Verification - Select
        const final = await db.select().from(user).where(eq(user.id, newUser.id));
        expect(final[0]!).toMatchObject({
            id: newUser.id,
            name: "Alice Smith",
            age: 30
        });
        expect(final[0]!.roles).toBeUndefined();
    });
});
