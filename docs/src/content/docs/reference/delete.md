---
title: delete
description: API reference for Mizzle's delete builder.
---

The `delete` builder is used to remove items from your DynamoDB tables.

## Usage

```typescript
import { db } from "./db";
import { users } from "./schema";

await db
  .delete(users)
  .where(eq(users.id, "123"))
  .execute();
```

## Methods

### `delete(entity)`

Initializes the delete builder for a specific entity.

- **Arguments:**
  - `entity`: A Mizzle entity definition.
- **Returns:** `DeleteBuilder`

### `where(expression)`

Specifies the item to delete. Like `update`, this must resolve to the full primary key of the item.

- **Arguments:**
  - `expression`: A Mizzle expression that resolves to the entity's keys.
- **Returns:** `this`

### `returning()`

Instructs DynamoDB to return the content of the item that was deleted.

- **Returns:** `this`

### `execute()`

Executes the `DeleteItem` operation.

- **Returns:** `Promise<T | undefined>`
