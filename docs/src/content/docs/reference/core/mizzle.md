---
title: mizzle
description: API reference for initializing the Mizzle client.
---

`mizzle` is the entry point for the library. It initializes a Mizzle database instance which you use to perform all operations.

## Usage

```typescript
import { mizzle } from "@aurios/mizzle";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Basic initialization
const db = mizzle(new DynamoDBClient({ region: "us-east-1" }));
```

### With Relational Schema

To use the relational query builder (`db.query`), you must provide a schema definition.

```typescript
import { mizzle } from "@aurios/mizzle";
import { users, posts, relations } from "./schema";

const db = mizzle({
  client: new DynamoDBClient({}),
  relations: { users, posts, ...relations }
});
```

## API Reference

### `mizzle(config)`

Initializes a new Mizzle instance.

- **Arguments:**
  - `config`: Either a `DynamoDBClient` instance or a `MizzleConfig` object.

#### `MizzleConfig`

- `client`: A `DynamoDBClient` instance (required).
- `relations`: An object mapping entity names to their definitions and relationship metadata (optional).
- `retry`: Configuration for automatic retries of transient errors (optional).
  - `maxAttempts`: Maximum number of retry attempts (default: 3).
  - `baseDelay`: Initial delay between retries in milliseconds (default: 100).

## Instance Methods

The `mizzle` instance (often named `db`) provides the following main methods:

- [**`select()`**](/reference/querying/select/): Starts a select query.
- [**`insert()`**](/reference/querying/insert/): Starts an insert operation.
- [**`update()`**](/reference/querying/update/): Starts an update operation.
- [**`delete()`**](/reference/querying/delete/): Starts a delete operation.
- [**`batchGet()`**](/reference/querying/batch-get/): Fetches multiple items by key.
- [**`batchWrite()`**](/reference/querying/batch-write/): Performs multiple write operations.
- [**`transaction()`**](/reference/querying/transactions/): Executes operations atomically.
- [**`query`**](/reference/querying/query/): Accesses the relational query builder.
