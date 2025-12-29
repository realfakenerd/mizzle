import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dynamoTable, dynamoEntity } from "../src/core/table";
import { string, uuid, number, boolean, list, map } from "../src/columns/all";
import { prefixKey, staticKey } from "../src/core/strategies";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { mizzle } from "../src/utils/db";
import { eq } from "../src/expressions/operators";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

describe("End-to-End Integration", () => {
    const tableName = "IntegrationTestTable";
    const table = dynamoTable(tableName, {
        pk: string("pk"),
        sk: string("sk"),
    });

    const project = dynamoEntity(
        table,
        "Project",
        {
            id: uuid(),
            name: string(),
            description: string(),
            stars: number(),
            isPublic: boolean(),
            tags: list(string()),
            config: map({
                version: string(),
            }),
        },
        (cols) => ({
            pk: prefixKey("PROJ#", cols.id),
            sk: staticKey("INFO"),
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
        } catch (e) {}
    });

    afterAll(async () => {
        try {
            await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch (e) {}
    });

    it("should perform a full Create -> Read lifecycle", async () => {
        const db = mizzle(client);

        // 1. Insert
        const newProject = {
            name: "Mizzle",
            description: "Lightweight DynamoDB ORM",
            stars: 100,
            isPublic: true,
            tags: ["typescript", "orm"],
            config: { version: "1.0.0" },
        } as any; // Cast to any because 'id' is generated but usually required by type

        const inserted = await db.insert(project).values(newProject).returning().execute();
        
        expect(inserted.id).toBeDefined();
        expect(inserted.pk).toBe(`PROJ#${inserted.id}`);
        expect(inserted.sk).toBe("INFO");

        // 2. Select
        const results = await db.select().from(project).where(eq(project.id, inserted.id));

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
            id: inserted.id,
            name: "Mizzle",
            stars: 100,
            config: { version: "1.0.0" },
        });
    });
});
