---
title: Unified Select
description: Deep dive into Mizzle's intelligent data retrieval engine.
---

Mizzle's "Unified Select" is an abstraction layer over DynamoDB's `GetItem`, `Query`, and `Scan` operations. Instead of manually choosing which low-level operation to use, you express *what* you want (using `.where()`), and Mizzle determines the most efficient way to fetch it.

## How Routing Works

When you call `.execute()` or `.iterator()`, Mizzle analyzes your query configuration:

1.  **Primary Key Match (`GetItem`):**
    - If your `.where()` clause provides exact equality matches for both the Partition Key (PK) and Sort Key (SK) of the table.
    - **Result:** Uses `GetItem`. Most efficient.

2.  **Index/Partition Match (`Query`):**
    - If your `.where()` clause matches the PK of the table (but not the SK).
    - OR if it matches the PK of a Global Secondary Index (GSI).
    - **Result:** Uses `Query`. Efficient for collections of items.

3.  **Fallback (`Scan`):**
    - If no keys can be resolved from your filters.
    - **Result:** Uses `Scan`. Iterates the entire table. Least efficient.

## Forcing Indexes

Sometimes Mizzle might default to a Scan or the main table when you intend to use a specific index (e.g., if your filter matches multiple potential indexes). You can enforce a specific path:

```typescript
// Forces usage of the 'GSI1' index.
// If the filter doesn't match GSI1's keys, this will throw or result in an empty query.
await db.select()
  .from(users)
  .index("GSI1") 
  .where(eq(users.email, "test@example.com"))
  .execute();
```

## Auto-Pagination & Iterators

DynamoDB queries are paginated by default (1MB limit). Mizzle handles this transparently with **Async Iterators**.

```typescript
const query = db.select().from(orders).where(eq(orders.status, "PENDING"));

// Automatically fetches pages as you loop
for await (const order of query.iterator()) {
  console.log(order.id);
}
```

### Page Size vs Limit

- **`.pageSize(n)`**: Hints DynamoDB to return `n` items per network request. Useful for controlling memory usage or throughput.
- **`.limit(n)`**: Stops the iterator after `n` items are yielded, regardless of how many pages are fetched.

```typescript
await db.select()
  .from(logs)
  .pageSize(100) // Fetch 100 at a time from AWS
  .limit(500)    // Stop after processing 500 total
  .execute();    // .execute() automatically aggregates all pages up to the limit
```

## Consistency

By default, DynamoDB reads are "Eventually Consistent". You can request "Strongly Consistent" reads (consuming 2x capacity) if you need to see the absolute latest data immediately after a write.

```typescript
await db.select()
  .from(users)
  .where(eq(users.id, "123"))
  .consistentRead() // Enable strong consistency
  .execute();
```

*Note: Consistent reads are generally supported on the main table and Local Secondary Indexes (LSIs), but NOT on Global Secondary Indexes (GSIs).*
