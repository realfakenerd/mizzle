import { describe, it, expect } from "vitest";
import { dynamoTable, dynamoEntity } from "../../src/core/table";
import { string, uuid } from "../../src/columns/all";
import { prefixKey, staticKey } from "../../src/core/strategies";
import { defineRelations, extractMetadata } from "../../src/core/relations";
import { ItemCollectionParser } from "../../src/core/parser";

describe("ItemCollectionParser", () => {
    const table = dynamoTable("mizzle-test", {
        pk: string("pk"),
        sk: string("sk"),
    });

    const users = dynamoEntity(table, "users", {
        id: uuid("id"),
        name: string("name"),
    }, (cols) => ({
        pk: prefixKey("USER#", cols.id),
        sk: staticKey("METADATA"),
    }));

    const posts = dynamoEntity(table, "posts", {
        id: uuid("id"),
        userId: uuid("userId"),
        content: string("content"),
    }, (cols) => ({
        pk: prefixKey("USER#", cols.userId),
        sk: prefixKey("POST#", cols.id),
    }));

    const schema = extractMetadata({
        users,
        posts,
        usersRelations: defineRelations(users, ({ many }) => ({
            posts: many(posts),
        })),
        postsRelations: defineRelations(posts, ({ one }) => ({
            author: one(users),
        })),
    });

    it("should parse a collection with 1:N relations in single table", () => {
        const rawItems = [
            { pk: "USER#1", sk: "METADATA", id: "1", name: "Alice" },
            { pk: "USER#1", sk: "POST#101", id: "101", userId: "1", content: "Hello" },
            { pk: "USER#1", sk: "POST#102", id: "102", userId: "1", content: "World" },
        ];

        const parser = new ItemCollectionParser(schema);
        const results = parser.parse(rawItems, "users", { posts: true });

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("1");
        expect(results[0].name).toBe("Alice");
        expect(results[0].posts).toHaveLength(2);
        expect(results[0].posts.map((p: any) => p.content)).toContain("Hello");
        expect(results[0].posts.map((p: any) => p.content)).toContain("World");
    });
});
