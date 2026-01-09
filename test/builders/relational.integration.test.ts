import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { dynamoTable, dynamoEntity } from "mizzle/table";
import { string, uuid } from "mizzle/columns";
import { prefixKey, staticKey } from "mizzle";
import { defineRelations } from "mizzle";
import { mizzle } from "mizzle/db";
import { gsi } from "../../packages/mizzle/src/indexes";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

async function waitForTable(tableName: string) {
    let active = false;
    let attempts = 0;
    while (!active && attempts < 50) {
        try {
            const res = await client.send(new DescribeTableCommand({ TableName: tableName }));
            if (res.Table?.TableStatus === "ACTIVE") {
                active = true;
            } else {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        attempts++;
    }
}

describe("Relational Query Integration", () => {
    const tableName = `RelationalIntegrationTest_${Date.now()}`;
    const table = dynamoTable(tableName, {
        pk: string("pk"),
        sk: string("sk"),
        indexes: {
            gsi1: gsi("gsi1pk", "gsi1sk")
        }
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

    const projects = dynamoEntity(
        table,
        "projects",
        {
            id: uuid("id"),
            name: string("name"),
        },
        (cols) => ({
            pk: prefixKey("PROJ#", cols.id),
            sk: staticKey("METADATA"),
        })
    );

    const members = dynamoEntity(
        table,
        "members",
        {
            userId: uuid("userId"),
            projectId: uuid("projectId"),
            role: string("role"),
        },
        (cols) => ({
            pk: prefixKey("USER#", cols.userId),
            sk: prefixKey("PROJ#", cols.projectId),
            gsi1: {
                pk: prefixKey("PROJ#", cols.projectId),
                sk: prefixKey("USER#", cols.userId),
            }
        })
    );

    const db = mizzle({
        client,
        relations: {
            users,
            posts,
            projects,
            members,
            usersRelations: defineRelations(users, ({ many }) => ({
                posts: many(posts),
                memberships: many(members, {
                    fields: [users.id],
                    references: [members.userId],
                }),
            })),
            postsRelations: defineRelations(posts, ({ one }) => ({
                author: one(users, {
                    fields: [posts.userId],
                    references: [users.id],
                }),
            })),
            projectsRelations: defineRelations(projects, ({ many }) => ({
                members: many(members, {
                    fields: [projects.id],
                    references: [members.projectId],
                }),
            })),
            membersRelations: defineRelations(members, ({ one }) => ({
                project: one(projects, {
                    fields: [members.projectId],
                    references: [projects.id],
                }),
                user: one(users, {
                    fields: [members.userId],
                    references: [users.id],
                }),
            })),
        }
    });

    beforeAll(async () => {
        // Create
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
        await waitForTable(tableName);
    });

    afterAll(async () => {
        // Do NOT delete to avoid interference if multiple tests run
    });

    it("should fetch user with their posts in a single query", async () => {
        const userId = "user-1";
        await db.insert(users).values({ id: userId, name: "Alice" }).execute();
        await db.insert(posts).values({ id: "post-1", userId, content: "Hello" }).execute();
        await db.insert(posts).values({ id: "post-2", userId, content: "World" }).execute();

        const results = await db.query.users.findMany({
            where: (cols, { eq }) => eq(cols.id, userId),
            with: { posts: true }
        }) as any[];

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("Alice");
        expect(results[0].posts).toHaveLength(2);
    });

    it("should fetch user with their posts using 'include' keyword", async () => {
        const userId = "user-2";
        await db.insert(users).values({ id: userId, name: "Bob" }).execute();
        await db.insert(posts).values({ id: "post-3", userId, content: "Hello from Bob" }).execute();

        const results = await db.query.users.findMany({
            where: (cols, { eq }) => eq(cols.id, userId),
            include: { posts: true }
        }) as any[];

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("Bob");
        expect(results[0].posts).toHaveLength(1);
    });

    it("should fetch post with its author (1:1 relation)", async () => {
        const userId = "user-3";
        const postId = "post-4";
        await db.insert(users).values({ id: userId, name: "Charlie" }).execute();
        await db.insert(posts).values({ id: postId, userId, content: "Charlie's Post" }).execute();

        const results = await db.query.posts.findMany({
            where: (cols, { eq }) => eq(cols.id, postId),
            with: { author: true }
        }) as any[];

        expect(results).toHaveLength(1);
        expect(results[0].content).toBe("Charlie's Post");
        expect(results[0].author).toBeDefined();
        expect(results[0].author.name).toBe("Charlie");
    });

    it("should fetch user with their projects via bridge entity (N:M)", async () => {
        const userId = "user-4";
        const projId1 = "proj-1";
        const projId2 = "proj-2";
        await db.insert(users).values({ id: userId, name: "David" }).execute();
        await db.insert(projects).values({ id: projId1, name: "Project Alpha" }).execute();
        await db.insert(projects).values({ id: projId2, name: "Project Beta" }).execute();
        await db.insert(members).values({ userId, projectId: projId1, role: "admin" }).execute();
        await db.insert(members).values({ userId, projectId: projId2, role: "member" }).execute();

        const results = await db.query.users.findMany({
            where: (cols, { eq }) => eq(cols.id, userId),
            with: { memberships: { with: { project: true } } }
        }) as any[];

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("David");
        expect(results[0].memberships).toHaveLength(2);
        expect(results[0].memberships[0].project).toBeDefined();
    });

    it("should fetch project with its members via GSI", async () => {
        const userId1 = "user-5";
        const userId2 = "user-6";
        const projId = "proj-3";
        await db.insert(users).values({ id: userId1, name: "Eve" }).execute();
        await db.insert(users).values({ id: userId2, name: "Frank" }).execute();
        await db.insert(projects).values({ id: projId, name: "Project Gamma" }).execute();
        await db.insert(members).values({ userId: userId1, projectId: projId, role: "lead" }).execute();
        await db.insert(members).values({ userId: userId2, projectId: projId, role: "dev" }).execute();

        const results = await db.query.projects.findMany({
            where: (cols, { eq }) => eq(cols.id, projId),
            with: { members: true }
        }) as any[];

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("Project Gamma");
        expect(results[0].members).toHaveLength(2);
    });

    it("should use findFirst to fetch a single item with relations", async () => {
        const userId = "user-7";
        await db.insert(users).values({ id: userId, name: "Grace" }).execute();
        await db.insert(posts).values({ id: "post-5", userId, content: "Grace's Post" }).execute();

        const result = await db.query.users.findFirst({
            where: (cols, { eq }) => eq(cols.id, userId),
            with: { posts: true }
        }) as any;

        expect(result).toBeDefined();
        expect(result.name).toBe("Grace");
        expect(result.posts).toHaveLength(1);
    });
});
