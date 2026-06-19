---
title: batchWrite
description: API reference for Mizzle's batchWrite builder.
---

`batchWrite` allows you to perform up to 25 `Put` or `Delete` operations in a single request. Mizzle handles value processing, key strategy resolution, and automatic retries for "Unprocessed Items".

## Usage

```typescript
import { db } from "./db";
import { users } from "./schema";

const result = await db.batchWrite(users, [
  { type: "put", item: { id: "user_1", name: "Alice" } },
  { type: "put", item: { id: "user_2", name: "Bob" } },
  { type: "delete", keys: { id: "user_3" } }
]).execute();

console.log(`Successfully wrote ${result.succeededCount} items`);
```

## API Reference

### `db.batchWrite(entity, operations)`

Initializes a batch write operation.

- **Arguments:**
  - `entity`: The Mizzle entity definition.
  - `operations`: An array of operation objects.
    - `{ type: "put", item: T }`
    - `{ type: "delete", keys: Partial<T> }`
- **Returns:** `BatchWriteBase`

### `.execute()`

Sends the request to DynamoDB. Automatically retries `UnprocessedItems` up to 5 times.

- **Returns:** `Promise<BatchWriteResult<T>>`

#### `BatchWriteResult<T>`

- `succeededCount`: The total number of items successfully written or deleted.
- `failed`: An array of operations that failed after all retry attempts.
