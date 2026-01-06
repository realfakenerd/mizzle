---
title: query
description: API reference for Mizzle's low-level query builder.
---

While `select` provides high-level abstraction, the `query` builder (available via `db.query`) offers more direct control over DynamoDB's `Query` and `Scan` operations.

## Usage

```typescript
import { db } from "./db";
import { users } from "./schema";
import { eq } from "mizzle";

const results = await db
  .query(users)
  .where(eq(users.id, "123"))
  .limit(10)
  .sort(false) // Descending
  .execute();
```

## Methods

### `query(entity)`

Initializes the query builder for a specific entity.

- **Arguments:**
  - `entity`: A Mizzle entity definition.
- **Returns:** `DynamoQueryBuilder`

### `where(condition)`

Sets the condition for the query.

- **Arguments:**
  - `condition`: A Mizzle expression.
- **Returns:** `this`

### `limit(val)`

Sets the maximum number of items to evaluate.

- **Arguments:**
  - `val`: Number of items.
- **Returns:** `this`

### `sort(forward)`

Specifies the order of index traversal.

- **Arguments:**
  - `forward`: `true` for ascending (default), `false` for descending.
- **Returns:** `this`

### `index(name)`

Specifies a Global Secondary Index (GSI) to use for the query.

- **Arguments:**
  - `name`: The name of the GSI.
- **Returns:** `this`

### `setProjection(cols)`

Specifies which attributes to return.

- **Arguments:**
  - `cols`: An array of column names.
- **Returns:** `this`

### `execute()`

Executes the operation (`Query` if PK is provided, otherwise `Scan`).

- **Returns:** `Promise<T[]>`
