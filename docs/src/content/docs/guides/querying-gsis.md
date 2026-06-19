---
title: Working with Secondary Indexes (GSIs & LSIs)
description: Learn how to configure and query Global and Local Secondary Indexes in Mizzle.
---

When querying DynamoDB, you are limited to retrieving items using the primary keys defined on the table. If you need to retrieve items using other attributes, you must define **Secondary Indexes**.

Mizzle offers first-class support for Global Secondary Indexes (GSIs) and Local Secondary Indexes (LSIs), providing automated query routing and type safety.

---

## Defining Indexes in Mizzle

You define secondary indexes directly within the `dynamoTable` configuration.

```typescript
import { dynamoTable, string } from "@aurios/mizzle";

export const usersTable = dynamoTable("UsersTable", {
  pk: string("pk"),
  sk: string("sk"),
  email: string("email"),
})
.gsi("EmailIndex", {
  pk: string("email"),
  sk: string("sk"),
});
```

Here we define a GSI named `EmailIndex` with `email` as its Partition Key.

---

## Querying Secondary Indexes

Mizzle features a routing engine called **Unified Select**. When you write a query using `.where()`, Mizzle automatically matches your filter parameters with the primary keys of your table and indexes to route your query efficiently.

### Automatic Routing

If you query users by their email, Mizzle sees that `email` is the Partition Key of the `EmailIndex` and automatically routes the query to that GSI instead of performing a full table scan.

```typescript
import { users } from "./schema";
import { eq } from "@aurios/mizzle";

// Under the hood, this performs a Query against the "EmailIndex" GSI
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, "luke@skywalker.com"))
  .execute();
```

---

## Enforcing a Specific Index

If multiple indexes could satisfy your `.where()` filter, or if you want to make index usage explicit for predictability, you can force the use of a specific index using `.index()`:

```typescript
// Throws an error or returns an empty query if the email filter does not match EmailIndex keys
const user = await db
  .select()
  .from(users)
  .index("EmailIndex")
  .where(eq(users.email, "luke@skywalker.com"))
  .execute();
```

---

## Key Differences: GSIs vs LSIs

When designing indexes, keep in mind these key DynamoDB characteristics supported by Mizzle:

| Feature | Global Secondary Index (GSI) | Local Secondary Index (LSI) |
| :--- | :--- | :--- |
| **Partition Key** | Can be different from base table | Must be the same as base table |
| **Sort Key** | Can be different or optional | Must be different from base table |
| **Consistency** | Eventually consistent only | Strong consistency available |
| **Capacity** | Uses its own provisioned capacity | Shares capacity with the base table |

### Requesting Consistent Reads

LSIs allow for strongly consistent reads, while GSIs do not. To perform a consistent read on the main table or an LSI:

```typescript
await db
  .select()
  .from(users)
  .where(eq(users.id, "123"))
  .consistentRead() // Enabled for Main Table or LSI
  .execute();
```
