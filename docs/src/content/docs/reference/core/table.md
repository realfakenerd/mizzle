---
title: Tables & Entities
description: How to define physical tables and logical entities in Mizzle.
---

Mizzle separates the physical DynamoDB table definition from the logical entities that live within it. This allows for clean Single-Table Design implementations.

## Physical Tables

A `dynamoTable` represents the physical resource in AWS. You define its name and the primary key schema (Partition Key and optionally a Sort Key).

### `dynamoTable(name, config)`

```typescript
import { dynamoTable, string } from "@aurios/mizzle";

export const appTable = dynamoTable("my-app-table", {
  pk: string("pk"),
  sk: string("sk"),
});
```

- **Arguments:**
  - `name`: The actual name of the table in DynamoDB.
  - `config`: An object with `pk` (Partition Key) and optional `sk` (Sort Key).

## Logical Entities

A `dynamoEntity` represents a specific "type" of data stored in a table. It maps logical fields to DynamoDB attributes and handles key generation strategies.

### `dynamoEntity(table, name, columns, strategies?)`

```typescript
import { dynamoEntity, string, number } from "@aurios/mizzle";
import { appTable } from "./table";

export const users = dynamoEntity(appTable, "users", {
  id: string("id"),
  name: string("name"),
  email: string("email"),
  age: number("age"),
}, (cols) => ({
  pk: cols.id, // Maps pk to "id"
  sk: "USER"    // Constant sort key
}));
```

- **Arguments:**
  - `table`: The physical table instance.
  - `name`: A unique internal name for this entity.
  - `columns`: A map of column definitions or a callback returning them.
  - `strategies`: (Optional) A callback to define how `pk`, `sk`, and index keys are constructed from columns or constants.

## Key Strategies

Key strategies allow you to automatically construct Partition Keys and Sort Keys. This is essential for Single-Table Design where keys often follow patterns like `USER#<id>`.

```typescript
export const posts = dynamoEntity(appTable, "posts", {
  userId: string("userId"),
  postId: string("postId"),
  title: string("title"),
}, (cols) => ({
  pk: `USER#${cols.userId}`,
  sk: `POST#${cols.postId}`
}));
```

Mizzle handles the interpolation and extraction of these values during reads and writes.
