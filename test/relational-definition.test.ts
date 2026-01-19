import { describe, it, expect } from "vitest";
import { dynamoTable, dynamoEntity } from "@aurios/mizzle/table";
import { defineRelations } from "@aurios/mizzle";
import { string, uuid } from "@aurios/mizzle/columns";
import { RELATION_SYMBOLS } from "@mizzle/shared";

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

    it("should define relations for multiple entities using centralized API", () => {
        const relations = defineRelations({ users, posts }, (r) => ({
            users: {
                posts: r.many.posts(),
            },
            posts: {
                author: r.one.users({
                    fields: [r.posts.userId],
                    references: [r.users.id],
                }),
            },
        }));

        expect((relations as any).definitions.users.posts).toBeDefined();
        expect((relations as any).definitions.users.posts.type).toBe("many");
        expect((relations as any).definitions.posts.author).toBeDefined();
        expect((relations as any).definitions.posts.author.type).toBe("one");
        expect((relations as any).definitions.posts.author.config.fields).toContain(posts.userId);
        expect((relations as any).definitions.posts.author.config.references).toContain(users.id);
    });
});