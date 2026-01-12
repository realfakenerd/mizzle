---
title: Relational Proxy & Query Builder
description: Deep dive into how Mizzle handles relational queries and the db.query proxy.
---

Mizzle provides a fluent, ORM-like API for querying relational data in DynamoDB. This is achieved through a combination of a JavaScript `Proxy` for dynamic access and a sophisticated `RelationalQueryBuilder` that handles the complexities of NoSQL data modeling, including Single-Table Design patterns.

## The `db.query` Proxy

The entry point for relational queries is `db.query`. Unlike traditional ORMs that might generate a fixed class with properties for each table, Mizzle uses a JavaScript `Proxy` to provide a dynamic API surface.

When you initialize `mizzle`, you pass a `relations` schema:

```typescript
const db = mizzle({ 
  client, 
  relations: { users, posts, comments } 
});
```

Internally, `db.query` is initialized as a Proxy. When you access a property like `db.query.users`, the following happens:

1.  **Interception**: The Proxy's `get` trap intercepts the access to the property `"users"`.
2.  **Schema Lookup**: It checks if `"users"` exists in the provided `relations` schema.
3.  **Builder Instantiation**: If found, it instantiates and returns a new `RelationalQueryBuilder` for the `users` entity.
4.  **Error Handling**: If the entity is not found in the schema, it throws a runtime error.

This approach allows `mizzle` to keep its runtime lightweight while providing full type safety via TypeScript generics.

## Relational Query Builder

The `RelationalQueryBuilder` is responsible for executing queries and resolving relationships. It supports `findMany` and `findFirst` operations and handles the `with` (or `include`) option for fetching related data.

### Execution Flow

When you execute a query like:

```typescript
const user = await db.query.users.findFirst({
  where: eq(users.id, "u1"),
  with: {
    posts: true
  }
});
```

The builder performs the following steps:

1.  **Base Query**: It executes a standard DynamoDB query (or Scan/GetItem) for the root entity (in this case, `users`).
2.  **Strategy Resolution**: It analyzes the query conditions to determine the most efficient access pattern (GetItem vs Query vs Scan) using `resolveStrategies`.

### Single-Table Optimization

One of Mizzle's most powerful features is its optimization for Single-Table Design.

If the query targets a **Partition Key** (and no specific Index), Mizzle assumes you might be accessing an **Item Collection**.

1.  **Item Collection Fetch**: Instead of just fetching the user, Mizzle modifies the query to fetch *all* items in that partition (e.g., `PK = "USER#u1"`).
2.  **In-Memory Parsing**: It receives a raw list of items (User + Posts + Profiles, etc.) stored under that PK.
3.  **ItemCollectionParser**: The `ItemCollectionParser` takes this mixed list and reconstructs the object graph. It filters for the requested entity (`User`) and automatically populates the requested relations (`posts`) if they were returned in the same query.

This means that complex relational data can often be fetched in a **single network request**, preserving the efficiency of DynamoDB while providing the developer experience of a relational database.

### Recursive Fetching (Cross-Partition)

If the related data cannot be found in the same partition (e.g., a Many-to-Many relationship or a query that doesn't target the PK), Mizzle falls back to recursive fetching:

1.  **Initial Fetch**: The root entities are fetched.
2.  **Relation Mapping**: For each result, Mizzle calculates the keys required to fetch the related items.
3.  **Parallel Execution**: It executes parallel queries for the related entities.
4.  **Merging**: The results are merged into the final object graph.

While this introduces "N+1" query characteristics (technically 1+N where N is the number of relations, parallelized), it handles the complexity of joining data across different partitions or tables automatically.

## Internal Architecture

### `extractMetadata`

The `extractMetadata` function (in `core/relations.ts`) transforms the user-friendly schema definition into an optimized internal format. It links entities to their relation configurations, allowing the Query Builder to quickly look up target entities and foreign keys.

### `resolveStrategies`

Located in `core/strategies.ts`, this function is the "brain" of Mizzle's query planning. It looks at the `where` clause and the entity's definition (PKs, SKs, LSIs, GSIs) to decide:
- Can I use `GetItem`?
- Should I use `Query` on the table?
- Should I use `Query` on a GSI?
- Do I have to fallback to `Scan`?

The `RelationalQueryBuilder` relies heavily on this strategy resolution to ensure that even complex relational traversals are executed as efficiently as possible on DynamoDB.
