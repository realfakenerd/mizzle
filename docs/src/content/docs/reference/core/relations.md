---
title: Relations
description: Defining relationships between entities in Mizzle.
---

Relations allow you to perform powerful nested queries (similar to an ORM) on top of DynamoDB. They define how entities link to each other.

## Defining Relations

You can define relations using `defineRelations`. There are two ways to do this: per-entity or using a centralized schema-aware approach (recommended for circular dependencies).

### Centralized Schema (Recommended)

This approach helps Mizzle understand the full context of your data model and resolves issues with circular references between files.

```typescript
import { defineRelations } from "@aurios/mizzle";
import { users, posts, comments } from "./schema";

export const relations = defineRelations({ users, posts, comments }, (r) => ({
  users: {
    posts: r.many.posts(),
  },
  posts: {
    author: r.one.users({
      fields: [r.posts.authorId],
      references: [r.users.id],
    }),
    comments: r.many.comments(),
  },
  comments: {
    post: r.one.posts({
      fields: [r.comments.postId],
      references: [r.posts.id],
    }),
  }
}));
```

### Per-Entity

```typescript
export const usersRelations = defineRelations(users, ({ many }) => ({
  posts: many(posts),
}));
```

## Helpers

- `r.one.<entity>(config?)`: Defines a one-to-one or many-to-one relationship.
- `r.many.<entity>(config?)`: Defines a one-to-many relationship.

### Configuration Object

- `fields`: An array of columns in the *current* entity that form the foreign key.
- `references`: An array of columns in the *target* entity that the foreign key points to.
- `relationName`: (Optional) A custom name to identify the relationship.

## Relational Queries

Once relations are defined and passed to the `mizzle` client, you can use `db.query`:

```typescript
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, "123"),
  with: {
    posts: true,
  },
});
```

See the [Relational Query Guide](/reference/querying/query/) for more details.
