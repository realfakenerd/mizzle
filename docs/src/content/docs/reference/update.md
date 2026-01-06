---
title: update
description: API reference for Mizzle's update builder.
---

The `update` builder provides a type-safe way to modify existing items in DynamoDB using `UpdateItem`.

## Usage

```typescript
import { db } from "./db";
import { users } from "./schema";
import { eq } from "mizzle";

await db
  .update(users)
  .set({ name: "Jane Doe" })
  .where(eq(users.id, "123"))
  .execute();
```

## Methods

### `update(entity)`

Initializes the update builder for a specific entity.

- **Arguments:**
  - `entity`: A Mizzle entity definition.
- **Returns:** `UpdateBuilder`

### `set(values)`

Sets the values for specific fields. Corresponds to the `SET` action in DynamoDB update expressions.

- **Arguments:**
  - `values`: A partial object of the entity's fields.
- **Returns:** `this`

### `add(values)`

Adds a value to a numeric field or elements to a set. Corresponds to the `ADD` action.

- **Arguments:**
  - `values`: An object mapping field names to values.
- **Returns:** `this`

### `remove(...fields)`

Removes specific fields from the item. Corresponds to the `REMOVE` action.

- **Arguments:**
  - `fields`: A list of field names to remove.
- **Returns:** `this`

### `delete(values)`

Removes elements from a set. Corresponds to the `DELETE` action.

- **Arguments:**
  - `values`: An object mapping set fields to the elements to remove.
- **Returns:** `this`

### `where(expression)`

Specifies the item(s) to update. For `UpdateItem`, this must resolve to the full primary key (PK and SK).

- **Arguments:**
  - `expression`: A Mizzle expression that resolves to the entity's keys.
- **Returns:** `this`

### `returning(type)`

Specifies what the operation should return.

- **Arguments:**
  - `type`: `"NONE" | "ALL_OLD" | "UPDATED_OLD" | "ALL_NEW" | "UPDATED_NEW"`
- **Returns:** `this`

### `execute()`

Executes the `UpdateItem` operation.

- **Returns:** `Promise<T>`
