---
title: batchGet
description: API reference for Mizzle's batchGet builder.
---

`batchGet` allows you to retrieve up to 100 items from one or more tables in a single request. Mizzle simplifies this by handling the grouping and automatic retries for any "Unprocessed Keys" returned by DynamoDB.

## Usage

```typescript
import { db } from "./db";
import { users } from "./schema";

const result = await db.batchGet(users, [
  { id: "user_1" },
  { id: "user_2" },
  { id: "user_3" }
]).execute();

console.log(result.succeeded); // Array of found items
console.log(result.failed);    // Array of keys that could not be retrieved
```

## API Reference

### `db.batchGet(entity, keys)`

Initializes a batch get operation for a specific entity.

- **Arguments:**
  - `entity`: The Mizzle entity definition.
  - `keys`: An array of primary key objects (e.g., `{ id: "..." }`).
- **Returns:** `BatchGetBase`

### `.execute()`

Sends the request to DynamoDB. If DynamoDB returns `UnprocessedKeys` (due to throttling), Mizzle will automatically retry those keys up to 5 times.

- **Returns:** `Promise<BatchGetResult<T>>`

#### `BatchGetResult<T>`

- `succeeded`: An array of successfully retrieved items.
- `failed`: An array of keys that were not retrieved after all retry attempts.
