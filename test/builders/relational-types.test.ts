import { describe, it, expectTypeOf } from "vitest";
import { dynamoTable, dynamoEntity } from "mizzle/table";
import { string, uuid } from "mizzle/columns";
import { defineRelations } from "mizzle";
import type { RelationalQueryOptions } from "mizzle";

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
    author: one(users),
}));

// We'll test the types once we implement them in relational-builder.ts
describe("Relational Query Types", () => {
    it("should allow valid include options", () => {
        const options: RelationalQueryOptions<typeof users> = {
            with: {
                posts: true,
                nonExistent: false, // Currently we don't have strict relationship key checking, but boolean is allowed
            }
        };
        expectTypeOf(options).toBeObject();
    });

    it("should allow nested include options", () => {
        const options: RelationalQueryOptions<typeof users> = {
            include: {
                posts: {
                    with: {
                        author: true
                    }
                }
            }
        };
        expectTypeOf(options).toBeObject();
    });
});
