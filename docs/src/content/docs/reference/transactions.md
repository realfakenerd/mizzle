---
title: Transactions & Batch
description: Performing multi-item operations with Mizzle.
---

Mizzle supports both Atomic Transactions (`TransactWriteItems`) and Batch Operations (`BatchWriteItem`, `BatchGetItem`) to work with multiple items efficiently.

## Atomic Transactions

Transactions allow you to perform "all-or-nothing" operations across multiple items and tables. Mizzle provides a type-safe `db.transaction` helper that enforces the 100-item limit and handles idempotency.

### Usage

```typescript
import { db } from "./db";
import { users, accounts } from "./schema";
import { add, eq } from "@aurios/mizzle";

// Use a unique token (e.g., UUID) to ensure idempotency.
// If you retry the request with the same token, DynamoDB won't execute it twice.
const idempotencyToken = crypto.randomUUID();

await db.transaction(idempotencyToken, (tx) => [
  // 1. Create a new user
  tx.insert(users).values({ id: "123", name: "Alice" }),

  // 2. Decrement an account balance (with a condition)
  tx.update(accounts)
    .set({ balance: add(-100) })
    .where(eq(accounts.id, "treasury")),
    
  // 3. Delete a pending request
  tx.delete(requests, { id: "req_999" })
]);
```

### Supported Operations

The `tx` object passed to the callback supports:
- `tx.insert(entity)`
- `tx.update(entity)`
- `tx.delete(entity, keys)`
- `tx.conditionCheck(entity)` (Verifies an item's state without modifying it)

## Batch Operations

Batch operations are more efficient than individual requests for high-volume reads/writes but **do not** offer atomicity. If one item fails (e.g., throttling), others may still succeed. Mizzle transparently handles "Unprocessed Items" logic for you.

### Batch Write

Use `db.batchWrite` to put or delete up to 25 items at once.

```typescript
import { users } from "./schema";

const operations = [
  { type: "put", item: { id: "1", name: "User 1" } },
  { type: "put", item: { id: "2", name: "User 2" } },
  { type: "delete", keys: { id: "3" } }
];

// Mizzle automatically handles retries for unprocessed items
const result = await db.batchWrite(users, operations).execute();

console.log(`Success: ${result.succeededCount}`);
console.log(`Failed: ${result.failed.length}`);
```

### Batch Get

Use `db.batchGet` to retrieve up to 100 items at once by their primary keys.

```typescript
import { users } from "./schema";

const keys = [
  { id: "1" },
  { id: "2" },
  { id: "3" }
];

const result = await db.batchGet(users, keys).execute();

console.log(result.succeeded); // Array of found items
console.log(result.failed);    // Keys that couldn't be processed (e.g. throttling)
```
