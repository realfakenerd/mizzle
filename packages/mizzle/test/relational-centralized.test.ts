import { describe, it, expect } from "vitest";
import { dynamoTable, dynamoEntity } from "@aurios/mizzle/core/table";
import { defineRelations, extractMetadata } from "@aurios/mizzle/core/relations";
import { string, uuid } from "@aurios/mizzle/columns";

describe("Centralized defineRelations", () => {
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
    authorId: uuid("authorId"),
    content: string("content"),
  });

  it("should allow defining relations for multiple entities at once", () => {
    const relations = defineRelations({ users, posts }, (r) => ({
      users: {
        posts: r.many.posts(),
      },
      posts: {
        author: r.one.users({
          fields: [r.posts.authorId],
          references: [r.users.id],
        }),
      },
    }));

    expect(relations).toBeDefined();
    const defs = (relations as any).definitions;
    expect(defs.users.posts.type).toBe("many");
    expect(defs.posts.author.type).toBe("one");
  });

  it("should correctly extract metadata from centralized relations", () => {
    const relations = defineRelations({ users, posts }, (r) => ({
      users: {
        posts: r.many.posts(),
      },
      posts: {
        author: r.one.users({
          fields: [r.posts.authorId],
          references: [r.users.id],
        }),
      },
    }));

    const schema = { users, posts, relations };
    const metadata = extractMetadata(schema);

    expect(metadata.entities.users).toBeDefined();
    expect(metadata.entities.users!.relations.posts).toBeDefined();
    expect(metadata.entities.users!.relations.posts!.type).toBe("many");
    expect(metadata.entities.posts).toBeDefined();
    expect(metadata.entities.posts!.relations.author).toBeDefined();
    expect(metadata.entities.posts!.relations.author!.type).toBe("one");

    // Check column references
    const authorRelation = metadata.entities.posts!.relations.author;
    expect(authorRelation!.config.fields?.[0]).toBe(posts.authorId);
    expect(authorRelation!.config.references?.[0]).toBe(users.id);
  });

  it("should maintain backward compatibility with single-entity defineRelations", () => {
    const usersRelations = defineRelations(users, ({ many }) => ({
      posts: many(posts),
    }));

    const schema = { users, posts, usersRelations };
    const metadata = extractMetadata(schema);

    expect(metadata.entities.users).toBeDefined();
    expect(metadata.entities.users!.relations.posts).toBeDefined();
    expect(metadata.entities.users!.relations.posts!.type).toBe("many");
  });
});
