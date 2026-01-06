import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { dynamoTable, dynamoEntity } from "../../src/core/table";
import { string, uuid } from "../../src/columns/all";
import { prefixKey, staticKey } from "../../src/core/strategies";
import { defineRelations } from "../../src/core/relations";
import { mizzle } from "../../src/utils/db";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

describe("Relational Query Integration", () => {
    const tableName = "RelationalIntegrationTest";
    const table = dynamoTable(tableName, {
        pk: string("pk"),
        sk: string("sk"),
    });

    const users = dynamoEntity(
        table,
        "users",
        {
            id: uuid("id"),
            name: string("name"),
        },
        (cols) => ({
            pk: prefixKey("USER#", cols.id),
            sk: staticKey("METADATA"),
        }),
    );

    const posts = dynamoEntity(
        table,
        "posts",
        {
            id: uuid("id"),
            userId: uuid("userId"),
            content: string("content"),
        },
        (cols) => ({
            pk: prefixKey("USER#", cols.userId),
            sk: prefixKey("POST#", cols.id),
        }),
    );

    const db = mizzle({
        client,
        relations: {
            users,
            posts,
            usersRelations: defineRelations(users, ({ many }) => ({
                posts: many(posts),
            })),
            postsRelations: defineRelations(posts, ({ one }) => ({
                author: one(users),
            })),
        }
    });

    beforeAll(async () => {
        // Delete if exists
        try {
            await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch (e) {}

        // Create
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
        } catch (e: any) {
            throw e;
        }
    });

    afterAll(async () => {
        try {
            await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch (e) {}
    });

    it("should fetch user with their posts in a single query", async () => {
        const userId = "user-1";
        
        // Seed data
        await db.insert(users).values({ id: userId, name: "Alice" }).execute();
        await db.insert(posts).values({ id: "post-1", userId, content: "Hello" }).execute();
        await db.insert(posts).values({ id: "post-2", userId, content: "World" }).execute();

        // Query with relations
        const results = await db.query.users.findMany({
            where: (cols, { eq }) => eq(cols.id, userId),
            with: {
                posts: true
            }
        });

                expect(results[0].posts).toHaveLength(2);

            });

        

            it("should fetch user with their posts using 'include' keyword", async () => {

                const userId = "user-2";

                

                // Seed data

                await db.insert(users).values({ id: userId, name: "Bob" }).execute();

                await db.insert(posts).values({ id: "post-3", userId, content: "Hello from Bob" }).execute();

        

                // Query with 'include'

                const results = await db.query.users.findMany({

                    where: (cols, { eq }) => eq(cols.id, userId),

                    include: {

                        posts: true

                    }

                });

        

                expect(results).toHaveLength(1);

                expect(results[0].name).toBe("Bob");

                expect(results[0].posts).toBeDefined();

                        expect(results[0].posts).toHaveLength(1);

                        expect(results[0].posts[0].content).toBe("Hello from Bob");

                    });

                

                    it("should fetch post with its author (1:1 relation)", async () => {

                        const userId = "user-3";

                        const postId = "post-4";

                        

                        // Seed data

                        await db.insert(users).values({ id: userId, name: "Charlie" }).execute();

                        await db.insert(posts).values({ id: postId, userId, content: "Charlie's Post" }).execute();

                

                                // Query post with author (one-to-one)

                

                                const results = await db.query.posts.findMany({

                

                                    where: (cols, { eq, and }) => and(

                

                                        eq(cols.id, postId),

                

                                        eq(cols.userId, userId)

                

                                    ),

                

                                    include: {

                

                                        author: true

                

                                    }

                

                                });

                

                        

                

                        expect(results).toHaveLength(1);

                        expect(results[0].content).toBe("Charlie's Post");

                        expect(results[0].author).toBeDefined();

                        expect(results[0].author.name).toBe("Charlie");

                        expect(Array.isArray(results[0].author)).toBe(false);

                    });

                });

                

        