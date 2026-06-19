---
title: Secondary Indexes
description: Configuring GSI and LSI in Mizzle.
---

Mizzle supports Global Secondary Indexes (GSI) and Local Secondary Indexes (LSI) to enable flexible query patterns on your DynamoDB tables.

## Global Secondary Indexes (GSI)

GSIs allow you to query data across the entire table using a different Partition Key and optionally a Sort Key.

### `gsi(pkColumn, skColumn?)`

Define GSIs in your `dynamoTable` configuration.

```typescript
import { dynamoTable, string, gsi } from "@aurios/mizzle";

export const table = dynamoTable("my-table", {
  pk: string("pk"),
  sk: string("sk"),
  indexes: {
    emailIndex: gsi("email", "status")
  }
});
```

- **Arguments:**
  - `pkColumn`: The name of the attribute to use as the Partition Key for the index.
  - `skColumn`: (Optional) The name of the attribute to use as the Sort Key for the index.

## Local Secondary Indexes (LSI)

LSIs allow you to query data within a single Partition Key using a different Sort Key.

### `lsi(skColumn)`

```typescript
export const table = dynamoTable("my-table", {
  pk: string("pk"),
  sk: string("sk"),
  indexes: {
    createdAtIndex: lsi("createdAt")
  }
});
```

- **Arguments:**
  - `skColumn`: The name of the attribute to use as the Sort Key for the index.

## Querying Indexes

Mizzle's `select` builder automatically detects when your `where` clause matches an index.

```typescript
// This will automatically use 'emailIndex' GSI
const user = await db.select()
  .from(users)
  .where(eq(users.email, "test@example.com"))
  .execute();
```

You don't need to manually specify the index name; Mizzle chooses the most efficient one based on the keys provided.
