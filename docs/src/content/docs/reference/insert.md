---
title: insert
description: API reference for Mizzle's insert builder.
---

The `insert` builder is used to add new items to your DynamoDB tables. It automatically handles key generation based on your defined Key Strategies.

## Usage

```typescript
import { db } from "./db";
import { users } from "./schema";

await db
  .insert(users)
  .values({
    id: "123",
    name: "John Doe",
    email: "john@example.com"
  })
  .execute();
```

## Methods

### `insert(entity)`

Initializes the insert builder for a specific entity.

- **Arguments:**
  - `entity`: A Mizzle entity definition.
- **Returns:** `InsertBuilder`

### `values(data)`

Specifies the data to be inserted. The `data` object must conform to the entity's schema. Mizzle will automatically populate the physical Partition Key and Sort Key based on your entity's strategies.

- **Arguments:**
  - `data`: An object containing the fields defined in your entity.
- **Returns:** `InsertBase`

### `returning()`

Instructs Mizzle to return the inserted item (including the resolved PK and SK).

- **Returns:** `this`

### `execute()`

Executes the `PutItem` operation against DynamoDB.

- **Returns:** `Promise<T | undefined>` (Returns the item if `returning()` was called).

## Key Resolution

When you call `execute()`, Mizzle performs the following steps:
1.  **Defaults:** Applies any `default` or `defaultFn` values defined in your columns.
2.  **Strategies:** Executes the `prefixKey`, `staticKey`, or `compositeKey` strategies defined for the entity and any GSIs.
3.  **Physical Mapping:** Maps the logical fields to the physical table attributes.
4.  **PutItem:** Sends the fully formed item to DynamoDB.
