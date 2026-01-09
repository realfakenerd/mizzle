# Specification: Fluent Reads - Auto-Pagination & Consistency

## Overview
Raw DynamoDB pagination requires manual handling of `LastEvaluatedKey`, which is repetitive and error-prone. This track introduces "Fluent Reads" to Mizzle, providing high-level abstractions for auto-pagination via Async Iterators and a simple chained API for strong consistency.

## Functional Requirements

### 1. Chained Consistency Toggle
- Add a `.consistentRead(enabled: boolean = true)` method to the `select`, `query`, and `scan` builders.
- When invoked, it ensures the underlying DynamoDB command (e.g., `GetItem`, `Query`, `Scan`) is executed with `ConsistentRead: true`.

### 2. Auto-Pagination via Async Iterators
- Introduce a `.iterator()` method to the query builders as an alternative to `.execute()`.
- **Behavior:** Returns an `AsyncIterableIterator` that yields individual items one by one.
- **Mechanism:** Internally handles `LastEvaluatedKey`. When the current buffer of items is exhausted, it automatically fetches the next page from DynamoDB until all results are consumed.
- **Usage Example:**
  ```typescript
  for await (const item of db.select().from(users).iterator()) {
    console.log(item.name);
  }
  ```

### 3. Iteration Controls
- **Global Limit:** The existing `.limit(n)` method should constrain the total number of items yielded by the iterator across all pages.
- **Page Size Hint:** Add a `.pageSize(n)` method (mapping to DynamoDB's `Limit` parameter) to control how many items are requested in each network round-trip.

## Non-Functional Requirements
- **Memory Efficiency:** The iterator must yield items as they are received and should not buffer the entire result set in memory.
- **Developer Experience:** The API should feel familiar to users of modern TypeScript ORMs (like Drizzle).

## Acceptance Criteria
- [ ] `db.select().from(Entity).consistentRead().execute()` correctly sets the `ConsistentRead` flag in the AWS SDK call.
- [ ] `.iterator()` allows for `for await...of` loops that span multiple DynamoDB pages (tested with 1MB+ data sets).
- [ ] The iterator respects `.limit(n)` and stops precisely after `n` items.
- [ ] `.pageSize(n)` correctly controls the number of items fetched per request.

## Out of Scope
- Parallel Scans (multiple segments).
- Manual pagination tokens (exposing `LastEvaluatedKey` for UI-based "Next Page" buttons) is deferred to a future track.
