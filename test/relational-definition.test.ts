import { describe, it, expect } from "vitest";
import { dynamoTable, dynamoEntity } from "../src/core/table";
import { defineRelations } from "../src/core/relations";
import { string, uuid } from "../src/columns/all";
import { RELATION_SYMBOLS } from "../src/constants";

const table = dynamoTable("mizzle-test", {
    pk: string("pk"),
    sk: string("sk"),
});

const users = dynamoEntity(table, "users", {
    id: uuid("id"),
    name: string("name"),
});

const posts = dynamoEntity(table, "posts", {
    id: uuid("id"),
    userId: uuid("userId"),
    content: string("content"),
});

describe("defineRelations", () => {
    it("should define one-to-many relationship", () => {
        const usersRelations = defineRelations(users, ({ many }) => ({
            posts: many(posts),
        }));

        expect(usersRelations.entity).toBe(users);
        expect(usersRelations.config.posts).toBeDefined();
        expect(usersRelations.config.posts!.type).toBe("many");
        expect(usersRelations.config.posts!.config.to).toBe(posts);
        expect((usersRelations as any)[RELATION_SYMBOLS.RELATION_CONFIG]).toBe(true);
    });

    it("should define a one-to-one relationship", () => {
        const postsRelations = defineRelations(posts, ({ one }) => ({
            author: one(users, {
                fields: [posts.userId],
                references: [users.id],
            }),
        }));

        expect(postsRelations.entity).toBe(posts);
        expect(postsRelations.config.author).toBeDefined();
        expect(postsRelations.config.author!.type).toBe("one");
        expect(postsRelations.config.author!.config.to).toBe(users);
        expect(postsRelations.config.author!.config.fields).toContain(posts.userId);
        expect(postsRelations.config.author!.config.references).toContain(users.id);
    });
});
