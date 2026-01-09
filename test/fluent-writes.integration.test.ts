import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dynamoTable, dynamoEntity } from "mizzle/table";
import { string, uuid, number, list } from "mizzle/columns";
import { prefixKey, staticKey, add, append, remove, ifNotExists } from "mizzle";
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

describe("Fluent Writes Integration", () => {
    const tableName = "FluentWritesTable";
    const table = dynamoTable(tableName, {
        pk: string("pk"),
        sk: string("sk"),
    });

    const user = dynamoEntity(
        table,
        "User",
        {
            id: uuid(),
            name: string(), // Reserved Word
            status: string(), // Reserved Word
            order: number(), // Reserved Word
            loginCount: number(),
            tags: list(),
            bio: string(),
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
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
            }));
        } catch { /* ignore */ }
    });

    afterAll(async () => {
        try {
            await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch { /* ignore */ }
    });

    it("should handle reserved words and multiple actions in one set()", async () => {
        const db = mizzle(client);

        // 1. Insert
        const newUser = await db.insert(user).values({
            name: "Alice",
            status: "pending",
            order: 1,
            loginCount: 0,
            tags: ["initial"],
            bio: "Old bio"
        }).returning().execute();

        // 2. Multi-Action Update using .set() with helpers
        // We test SET (name, status), ADD (loginCount), REMOVE (bio), SET list_append (tags)
        const updated = await db.update(user)
            .set({
                name: "Alice Smith",
                status: "active",
                order: add(1),
                loginCount: add(5),
                tags: append(["pro"]),
                bio: remove()
            })
            .where(eq(user.id, newUser.id))
            .returning("ALL_NEW")
            .execute();

        expect(updated.name).toBe("Alice Smith");
        expect(updated.status).toBe("active");
        expect(updated.order).toBe(2);
        expect(updated.loginCount).toBe(5);
        expect(updated.tags).toEqual(["initial", "pro"]);
        expect(updated.bio).toBeUndefined();
    });

    it("should handle ifNotExists helper", async () => {
        const db = mizzle(client);
        
        const newUser = await db.insert(user).values({
            name: "Bob",
            loginCount: 0
        }).returning().execute();

        // Use ifNotExists on existing field and non-existing field
        await db.update(user)
            .set({
                name: ifNotExists("ShouldNotChange"),
                status: ifNotExists("initialized")
            })
            .where(eq(user.id, newUser.id))
            .execute();

        const final = await db.select().from(user).where(eq(user.id, newUser.id));
        expect(final[0].name).toBe("Bob"); // Stayed "Bob" because it existed
        expect(final[0].status).toBe("initialized"); // Set because it was missing
    });
});
