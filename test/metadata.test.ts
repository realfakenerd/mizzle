import { describe, it, expect } from "vitest";
import { dynamoTable, dynamoEntity } from "../src/core/table";
import { defineRelations, extractMetadata } from "../src/core/relations";
import { string, uuid } from "../src/columns/all";

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

const usersRelations = defineRelations(users, ({ many }) => ({
    posts: many(posts),
}));

const postsRelations = defineRelations(posts, ({ one }) => ({
    author: one(users, {
        fields: [posts.userId],
        references: [users.id],
    }),
}));

describe("extractMetadata", () => {
    it("should correctly extract metadata from relations definition", () => {
        const schema = {
            users,
            posts,
            usersRelations,
            postsRelations,
        };

        const metadata = extractMetadata(schema);

        expect(metadata.entities.users).toBeDefined();
        expect(metadata.entities.users!.entity).toBe(users);
        expect(metadata.entities.users!.relations.posts).toBeDefined();
        expect(metadata.entities.users!.relations.posts!.type).toBe("many");

        expect(metadata.entities.posts).toBeDefined();
        expect(metadata.entities.posts!.entity).toBe(posts);
        expect(metadata.entities.posts!.relations.author).toBeDefined();
        expect(metadata.entities.posts!.relations.author!.type).toBe("one");
    });
});
