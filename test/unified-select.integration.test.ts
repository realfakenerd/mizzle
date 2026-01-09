import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dynamoTable, dynamoEntity } from "mizzle/table";
import { string, uuid, number } from "mizzle/columns";
import { prefixKey, staticKey, gsi } from "mizzle";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { mizzle } from "mizzle/db";
import { eq, lt } from "../packages/mizzle/src/expressions/operators";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

describe("Unified Select Integration", () => {
    const tableName = "UnifiedSelectTable";
    const table = dynamoTable(tableName, {
        pk: string("pk"),
        sk: string("sk"),
        indexes: {
            GSI1: gsi("gsi1pk", "gsi1sk"),
        }
    });

    const user = dynamoEntity(
        table,
        "User",
        {
            id: uuid(),
            name: string(),
            age: number(),
            status: string(),
        },
        (cols) => ({
            pk: prefixKey("USER#", cols.id),
            sk: staticKey("METADATA"),
            GSI1: {
                pk: prefixKey("STATUS#", cols.status),
                sk: prefixKey("AGE#", cols.age),
            }
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
                    { AttributeName: "gsi1pk", AttributeType: "S" },
                    { AttributeName: "gsi1sk", AttributeType: "S" },
                ],
                GlobalSecondaryIndexes: [
                    {
                        IndexName: "GSI1",
                        KeySchema: [
                            { AttributeName: "gsi1pk", KeyType: "HASH" },
                            { AttributeName: "gsi1sk", KeyType: "RANGE" },
                        ],
                        Projection: { ProjectionType: "ALL" },
                        ProvisionedThroughput: {
                            ReadCapacityUnits: 5,
                            WriteCapacityUnits: 5,
                        },
                    }
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            }));
        } catch (e) { /* ignore */ }
    });

    afterAll(async () => {
        try {
            await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch { /* ignore */ }
    });

    it("should support Get, Query and Scan", async () => {
        const db = mizzle(client);

        // Setup - Insert some users
        const u1 = await db.insert(user).values({ name: "Alice", age: 25, status: "active" }).returning().execute();
        const u2 = await db.insert(user).values({ name: "Bob", age: 30, status: "active" }).returning().execute();
        const u3 = await db.insert(user).values({ name: "Charlie", age: 35, status: "inactive" }).returning().execute();

        // 1. GetItem (PK + SK)
        const getRes = await db.select().from(user).where(eq(user.id, u1.id)).execute();
        expect(getRes).toHaveLength(1);
        expect(getRes[0].name).toBe("Alice");

        // 2. Query by GSI (PK + SK)
        // Current SelectBase might not support GSI fully yet or might need explicit .index()
        const queryGsiRes = await db.select()
            .from(user)
            .where(eq(user.status, "active"))
            .execute();
        
        // This might fail to use GSI automatically if not implemented
        expect(queryGsiRes.length).toBeGreaterThanOrEqual(2);

        // 3. Query with Filter (Should use FilterExpression)
        // Current SelectBase ignores extra where clauses
        const filterRes = await db.select()
            .from(user)
            .where(eq(user.status, "active"))
            .execute();
        
        // We want to test a real filter:
        const filtered = await db.select()
            .from(user)
            .where(lt(user.age, 28)) // This should be a Scan with Filter or Query with Filter
            .execute();
        
        expect(filtered.some(u => u.name === "Alice")).toBe(true);
        expect(filtered.every(u => u.age < 28)).toBe(true);

        // 4. Limit and Sort (Should fail RED phase as they don't exist on SelectBase)
        // @ts-ignore - these methods don't exist yet on SelectBase
        const paginated = await db.select()
            .from(user)
            .limit(1)
            // @ts-ignore
            .sort(false)
            .execute();
        
        expect(paginated).toHaveLength(1);
    });
});
