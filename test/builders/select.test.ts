import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { dynamoTable, dynamoEntity } from "../../packages/mizzle/src/core/table";
import { string, uuid, number, boolean } from "../../packages/mizzle/src/columns/all";
import { prefixKey, staticKey } from "../../packages/mizzle/src/core/strategies";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { mizzle } from "../../src/utils/db";
import { eq, and } from "../../packages/mizzle/src/expressions/operators";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

const docClient = DynamoDBDocumentClient.from(client);

describe("Select Command", () => {
    const tableName = "TestTable_Select";
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
            active: boolean(),
            role: string(),
        },
        (cols) => ({
            pk: prefixKey("USER#", cols.id),
            sk: staticKey("METADATA"),
        }),
    );

    const testUser1 = {
        pk: "USER#user1",
        sk: "METADATA",
        id: "user1",
        name: "Alice",
        age: 30,
        active: true,
        role: "admin",
    };

    const testUser2 = {
        pk: "USER#user2",
        sk: "METADATA",
        id: "user2",
        name: "Bob",
        age: 25,
        active: false,
        role: "user",
    };

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

            await docClient.send(new PutCommand({ TableName: tableName, Item: testUser1 }));
            await docClient.send(new PutCommand({ TableName: tableName, Item: testUser2 }));
        } catch (e) {
            // Table might already exist
        }
    });

    afterAll(async () => {
        try {
            await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch (e) {}
    });

    it("should query by primary key", async () => {
        const result = await mizzle(client).select().from(user).where(eq(user.id, "user1"));

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            id: "user1",
            name: "Alice",
        });
    });

    it("should return empty array if no match found", async () => {
        const result = await mizzle(client).select().from(user).where(eq(user.id, "non-existent"));

        expect(result).toHaveLength(0);
    });

    it("should scan table if no keys provided", async () => {
        // This should trigger a scan
        const result = await mizzle(client).select().from(user).execute();

        expect(result).toHaveLength(2);
        expect(result).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: "user1" }),
            expect.objectContaining({ id: "user2" }),
        ]));
    });
    
    // Note: To test Query with partial key, we need a table where SK is relevant for querying multiple items
    // or use a GSI. Since our current schema uses specific IDs in PK, querying by PK usually yields one result.
    // Let's create a GSI test case.
});

import { gsi } from "../../packages/mizzle/src/indexes";

describe("Select Command with GSI", () => {
    const tableName = "TestTable_Select_GSI";
    
    const table = dynamoTable(tableName, {
        pk: string("pk"),
        sk: string("sk"),
        indexes: {
            gsi1: gsi("gsi1pk", "gsi1sk"),
        }
    });

    const user = dynamoEntity(
        table,
        "User",
        {
            id: uuid(),
            role: string(),
            name: string(),
            createdAt: string(),
        },
        (cols) => ({
            pk: prefixKey("USER#", cols.id),
            sk: staticKey("METADATA"),
            gsi1: {
                pk: staticKey("ROLE"),
                sk: prefixKey("", cols.role),
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
                        IndexName: "gsi1",
                        KeySchema: [
                            { AttributeName: "gsi1pk", KeyType: "HASH" },
                            { AttributeName: "gsi1sk", KeyType: "RANGE" },
                        ],
                        Projection: { ProjectionType: "ALL" },
                        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
                    }
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            }));

            // Insert data
            await docClient.send(new PutCommand({ 
                TableName: tableName, 
                Item: { 
                    pk: "USER#1", sk: "METADATA", id: "1", role: "admin", name: "Alice", gsi1pk: "ROLE", gsi1sk: "admin" 
                } 
            }));
            await docClient.send(new PutCommand({ 
                TableName: tableName, 
                Item: { 
                    pk: "USER#2", sk: "METADATA", id: "2", role: "admin", name: "Bob", gsi1pk: "ROLE", gsi1sk: "admin" 
                } 
            }));
             await docClient.send(new PutCommand({ 
                TableName: tableName, 
                Item: { 
                    pk: "USER#3", sk: "METADATA", id: "3", role: "user", name: "Charlie", gsi1pk: "ROLE", gsi1sk: "user" 
                } 
            }));

        } catch (e) {
            // Table might already exist
        }
    });

    afterAll(async () => {
        try {
             await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch (e) {}
    });

    it("should query using GSI (static PK)", async () => {
        // Query for all roles (since PK is static "ROLE")
        // But our strategy says gsi1: { pk: staticKey("ROLE"), sk: cols.role }
        // If we filter by something that resolves the PK, we can query.
        
        // However, staticKey("ROLE") means the PK is *always* "ROLE".
        // So any query on this entity that doesn't target main PK, 
        // if we can resolve "ROLE" (which is static), we should be able to query the index.
        
        // Currently resolveStrategies logic requires us to 'find' the values in the where clause.
        // For static key, it resolves immediately.
        
        // So a query with NO where clause (or where clause that doesn't contradict) 
        // might resolve to this index if main PK is missing?
        
        // Let's try querying where we filter by role="admin". 
        // This should provide the SK for the GSI, and PK is static.
        
        const result = await mizzle(client).select().from(user).where(eq(user.role, "admin"));
        
        expect(result).toHaveLength(2);
        expect(result).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: "Alice" }),
            expect.objectContaining({ name: "Bob" }),
        ]));
    });
});
