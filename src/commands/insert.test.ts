import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { dynamoTable, dynamoEntity } from "../core/table";
import { string, uuid, number, boolean, list, map, stringSet, numberSet } from "../columns/all";
import { prefixKey, staticKey } from "../core/strategies";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { InsertBuilder } from "./insert";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

const docClient = DynamoDBDocumentClient.from(client);

describe("Insert Command", () => {
    const tableName = "TestTable_Insert";
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
            tags: stringSet(),
            scores: numberSet(),
            metadata: map({
                lastLogin: string(),
            }),
            items: list(string()),
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
        } catch (e) {
            // Table might already exist
        }
    });

    afterAll(async () => {
        try {
            await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch (e) {}
    });

    it("should correctly resolve keys and insert data", async () => {
        const insertBuilder = new InsertBuilder(user, docClient);
        const data = {
            id: "123e4567-e89b-12d3-a456-426614174000",
            name: "Luke",
            age: 30,
            active: true,
        };

        const result = await insertBuilder.values(data).returning().execute();

        expect(result).toMatchObject({
            pk: "USER#123e4567-e89b-12d3-a456-426614174000",
            sk: "METADATA",
            id: "123e4567-e89b-12d3-a456-426614174000",
            name: "Luke",
            age: 30,
            active: true,
        });
    });

    it("should handle complex column types correctly", async () => {
        const insertBuilder = new InsertBuilder(user, docClient);
        const data = {
            id: "223e4567-e89b-12d3-a456-426614174000",
            name: "Dave",
            age: 25,
            active: false,
            tags: ["typescript", "dynamodb"],
            scores: [10, 20, 30],
            metadata: {
                lastLogin: "2025-12-23",
            },
            items: ["item1", "item2"],
        };

        const result = await insertBuilder.values(data).returning().execute();

        expect(result).toMatchObject({
            pk: "USER#223e4567-e89b-12d3-a456-426614174000",
            sk: "METADATA",
            id: "223e4567-e89b-12d3-a456-426614174000",
            name: "Dave",
            tags: new Set(["typescript", "dynamodb"]),
            scores: new Set([10, 20, 30]),
            metadata: {
                lastLogin: "2025-12-23",
            },
            items: ["item1", "item2"],
        });

        // Verify in DynamoDB
        const getResponse = await docClient.send(new GetCommand({
            TableName: tableName,
            Key: {
                pk: "USER#223e4567-e89b-12d3-a456-426614174000",
                sk: "METADATA",
            },
        }));

        expect(getResponse.Item).toMatchObject({
            pk: "USER#223e4567-e89b-12d3-a456-426614174000",
            sk: "METADATA",
            name: "Dave",
            tags: new Set(["typescript", "dynamodb"]),
            scores: new Set([10, 20, 30]),
        });
    });

    it("should auto-generate UUID and resolve keys if not provided", async () => {
        const insertBuilder = new InsertBuilder(user, docClient);
        const data = {
            name: "Auto",
            age: 20,
            active: true,
        } as any; // Cast to any to skip required id check for test

        const result = await insertBuilder.values(data).returning().execute();

        expect(result.id).toBeDefined();
        expect(result.pk).toBe(`USER#${result.id}`);
        expect(result.sk).toBe("METADATA");

        // Verify in DynamoDB
        const getResponse = await docClient.send(new GetCommand({
            TableName: tableName,
            Key: {
                pk: result.pk,
                sk: result.sk,
            },
        }));

        expect(getResponse.Item).toMatchObject({
            id: result.id,
            name: "Auto",
        });
    });

    it("should remove empty sets before inserting", async () => {
        const insertBuilder = new InsertBuilder(user, docClient);
        const data = {
            id: "323e4567-e89b-12d3-a456-426614174000",
            name: "EmptySet",
            age: 20,
            active: true,
            tags: [], // Empty set
        };

        const result = await insertBuilder.values(data).returning().execute();

        expect(result.tags).toBeUndefined();

        // Verify in DynamoDB
        const getResponse = await docClient.send(new GetCommand({
            TableName: tableName,
            Key: {
                pk: result.pk,
                sk: result.sk,
            },
        }));

        expect(getResponse.Item?.tags).toBeUndefined();
    });
});
