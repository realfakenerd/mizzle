import { describe, it, expect } from "vitest";
import { dynamoTable, dynamoEntity } from "../packages/mizzle/src/core/table";
import { string } from "../packages/mizzle/src/columns/string";
import { defineRelations, Relation } from "../packages/mizzle/src/core/relations";

describe("defineRelations", () => {
    const table = dynamoTable("test", { pk: string("pk") });
    const users = dynamoEntity(table, "User", { id: string() });
    const posts = dynamoEntity(table, "Post", { id: string(), authorId: string() });

    it("should define one-to-many relations", () => {
        const relations = defineRelations(users, ({ many }) => ({
            posts: many(posts),
        }));

        expect(relations.entity).toBe(users);
        const postsRelation = relations.config.posts;
        expect(postsRelation).toBeDefined();
        if (postsRelation) {
            expect(postsRelation).toBeInstanceOf(Relation);
            expect(postsRelation.type).toBe("many");
            expect(postsRelation.config.to).toBe(posts);
        }
    });

    it("should define one-to-one relations", () => {
        const relations = defineRelations(posts, ({ one }) => ({
            author: one(users, {
                fields: [posts.authorId],
                references: [users.id],
            }),
        }));

        expect(relations.entity).toBe(posts);
        const authorRelation = relations.config.author;
        expect(authorRelation).toBeDefined();
        if (authorRelation) {
            expect(authorRelation).toBeInstanceOf(Relation);
            expect(authorRelation.type).toBe("one");
            expect(authorRelation.config.to).toBe(users);
            expect(authorRelation.config.fields).toEqual([posts.authorId]);
            expect(authorRelation.config.references).toEqual([users.id]);
        }
    });
});
