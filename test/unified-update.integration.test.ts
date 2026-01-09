import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dynamoTable, dynamoEntity } from "mizzle/table";
import { string, uuid, number, stringSet } from "mizzle/columns";
import { prefixKey, staticKey } from "mizzle";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { mizzle } from "mizzle/db";
import { eq, and } from "../packages/mizzle/src/expressions/operators";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

describe("Unified Update Integration", () => {
    const tableName = "UnifiedUpdateTable";
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
            tags: stringSet(),
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

    it("should support all unified update operations", async () => {
        const db = mizzle(client);

        // 1. Setup
        const newUser = await db.insert(user).values({
            name: "Unified Alice",
            age: 30,
            tags: new Set(["initial"])
        }).returning().execute();

        // 2. SET multiple fields
        await db.update(user)
            .set({ name: "Unified Alice Smith", age: 31 })
            .where(eq(user.id, newUser.id))
            .execute();

        // 3. ADD to numeric field
        await db.update(user)
            .add({ age: 1 })
            .where(eq(user.id, newUser.id))
            .execute();

        // 4. ADD to set field
        await db.update(user)
            .add({ tags: new Set(["added"]) })
            .where(eq(user.id, newUser.id))
            .execute();

        // 5. REMOVE field
        await db.update(user)
            .remove("name")
            .where(eq(user.id, newUser.id))
            .execute();

        // 6. DELETE from set
        await db.update(user)
            .delete({ tags: new Set(["initial"]) })
            .where(eq(user.id, newUser.id))
            .execute();

        // 7. Conditional update (should only update if age is 32)
        // Current implementation might ignore the age condition if it's not part of the key
        await db.update(user)
            .set({ name: "Conditional Alice" })
            .where(and(eq(user.id, newUser.id), eq(user.age, 32)))
            .execute();

        // 8. Conditional update that should fail (age is not 40)
        try {
            await db.update(user)
                .set({ name: "Should Not Happen" })
                .where(and(eq(user.id, newUser.id), eq(user.age, 40)))
                .execute();
        } catch (e) {
            // Expected to fail if ConditionExpression is implemented
        }

        // Verification
        const final = await db.select().from(user).where(eq(user.id, newUser.id));
        expect(final[0].name).toBe("Conditional Alice");
        expect(final[0].age).toBe(32);
        expect(final[0].tags).toContain("added");
        expect(final[0].tags).not.toContain("initial");
    });
});
