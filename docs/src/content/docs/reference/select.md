---
title: select
description: API reference for Mizzle's select builder.
---

The `select` builder is used to retrieve data from your DynamoDB tables. It intelligently chooses between `GetItem`, `Query`, and `Scan` based on the filters provided in your `where` clause.

## Usage

```typescript
import { db } from "./db";
import { users } from "./schema";
import { eq } from "mizzle";

const result = await db
  .select()
  .from(users)
  .where(eq(users.id, "123"))
  .execute();
```

## Methods

### `select(fields?)`

Initializes the select builder. You can optionally pass an object to specify which fields should be returned (Projections).

- **Arguments:**
  - `fields` (optional): An object mapping field names to column definitions.
- **Returns:** `SelectBuilder`

### `from(entity)`

Specifies the entity you want to select from.

- **Arguments:**
  - `entity`: A Mizzle entity definition.
- **Returns:** `SelectBase`

### `where(expression)`

Adds a filter to the query. Mizzle will analyze this expression to determine if it can use an index or a direct key lookup.

- **Arguments:**
  - `expression`: A Mizzle expression (e.g., `eq()`, `and()`, `beginsWith()`).
- **Returns:** `this`

### `execute()`

Executes the query against DynamoDB and returns a promise that resolves to an array of items.

- **Returns:** `Promise<T[]>`

## Intelligent Routing

Mizzle's `select` is powerful because it abstracts DynamoDB's different read operations:

1.  **GetItem:** Triggered when the `where` clause provides both the Partition Key and Sort Key for the main table.
2.  **Query:** Triggered when only the Partition Key is provided, or when keys matching a Global Secondary Index (GSI) are provided.
3.  **Scan:** Triggered when no keys can be resolved from the `where` clause. *Note: Scans are expensive and should be used with caution.*
