# DynamoDB Deep Analysis & Mizzle Architecture Insights

This document contains a deep analysis of the Amazon DynamoDB API Reference, identifying key constraints, behaviors, and architectural patterns that must be handled by `mizzle` to ensure reliability, performance, and type safety.

## 1. Core Architectural Constraints & Limits

- **Item Size Limit:** Maximum item size is **400 KB** (inclusive of attribute names and values). `mizzle` should validate this client-side if possible to save RTT.
- **Request Size Limits:**
    - `BatchGetItem`: Max **16 MB** response size, max **100 items** per request.
    - `BatchWriteItem`: Max **16 MB** request size, max **25 items** per request.
    - `Query` / `Scan`: Max **1 MB** of data scanned/returned per page.
    - `TransactWriteItems` / `TransactGetItems`: Max **100 items** per transaction, max **4 MB** aggregate size.
- **Partition Key:** Used for distribution. `mizzle` must ensure partition keys are well-distributed to avoid hot partitions.
- **Sort Key:** Determines ordering. `ScanIndexForward` controls order (default ascending).

## 2. Operation-Specific Insights

### Reads: `GetItem`, `BatchGetItem`, `Query`, `Scan`

- **Consistency:**
    - Eventually consistent by default (cheaper, higher availability).
    - `ConsistentRead: true` available for `GetItem`, `Query`, `Scan` (on table/LSI, not GSI). Costs 2x capacity.
    - **Mizzle Recommendation:** Default to eventual, allow easy opt-in for strong consistency.
- **Pagination (`Query`, `Scan`):**
    - If `LastEvaluatedKey` is present in the response, the result is incomplete.
    - **Mizzle Recommendation:** Implement auto-pagination. Users should be able to iterate over results without manually handling `LastEvaluatedKey`, but also have access to it for stateless pagination (e.g., API responses).
- **Filtering vs. Key Conditions:**
    - `KeyConditionExpression`: Efficient. Used to select items based on PK/SK.
    - `FilterExpression`: Inefficient. Applied _after_ reading data (consuming capacity) but _before_ returning.
    - **Mizzle Recommendation:** Enforce strict typing to distinguish between Keyable attributes (for `KeyCondition`) and non-indexed attributes (for `Filter`). Warn users when filtering without indexing.
- **`BatchGetItem` Complexity:**
    - **Partial Failures:** A 200 OK does _not_ mean success. Must check `UnprocessedKeys`.
    - **Missing Items:** Requests for non-existent items do not return errors, just missing data in the `Responses` map.
    - **Mizzle Recommendation:** `mizzle` must automatically handle `UnprocessedKeys` with exponential backoff. It should also map the unordered `Responses` back to the original request order/structure.

### Writes: `PutItem`, `UpdateItem`, `DeleteItem`, `BatchWriteItem`

- **`UpdateItem` vs. `PutItem`:**
    - `PutItem` replaces the entire item.
    - `UpdateItem` modifies specific attributes via `UpdateExpression` (`SET`, `REMOVE`, `ADD`, `DELETE`).
    - **Mizzle Recommendation:** Prefer `UpdateItem` for partial updates to avoid race conditions on unseen attributes. Abstract `UpdateExpression` complexity (e.g., `SET #a = :v`).
- **Conditional Writes:**
    - Essential for Optimistic Locking.
    - Use `ConditionExpression` (e.g., `attribute_not_exists(id)` for insert-only).
    - **Mizzle Recommendation:** Built-in optimistic locking support using a version number attribute.
- **`BatchWriteItem` Complexity:**
    - **Not Atomic:** Some items may succeed, others fail.
    - **Partial Failures:** Check `UnprocessedItems`.
    - **Mizzle Recommendation:** Auto-retry `UnprocessedItems`. Note that `BatchWriteItem` cannot update, only Put or Delete.

### Transactions: `TransactWriteItems`, `TransactGetItems`

- **Atomicity:** All-or-nothing guarantees.
- **Idempotency:** `ClientRequestToken` is crucial to prevent double-execution on retries.
- **Mizzle Recommendation:** Expose a transaction builder API. Ensure `ClientRequestToken` is generated if not provided. Handle `TransactionCanceledException` (returns reasons for _each_ item).

## 3. Error Handling & Reliability Strategy

- **Throttling:**
    - `ProvisionedThroughputExceededException` (Provisioned mode).
    - `RequestLimitExceeded` (Account limits).
    - **Strategy:** Implement robust **Exponential Backoff with Jitter**. This is critical for DynamoDB.
- **Batch Failures:**
    - `UnprocessedKeys` / `UnprocessedItems` are _not_ exceptions but data in the response body.
    - **Strategy:** Recursive retry logic for unprocessed items, separate from the main exception handler.
- **Item Collection Limits:**
    - `ItemCollectionSizeLimitExceededException`: Specific to tables with LSIs (10GB limit per partition key).
    - **Strategy:** Warn users during schema definition if they use LSIs.

## 4. Data Modeling & Indexes

- **Global Secondary Indexes (GSIs):**
    - Eventually consistent only.
    - Have their own Provisioned Throughput. Throttling on a GSI can throttle the main table writes!
    - **Mizzle Action:** Allow defining GSIs in the schema.
- **Local Secondary Indexes (LSIs):**
    - Must be created at table creation time. Immutable.
    - Strong consistency supported.
    - Shared throughput with the table.
    - 10GB size limit per partition key.

## 5. Type Safety & Developer Experience (Mizzle Goals)

- **`AttributeValue` Abstraction:** The API uses `{ S: "value" }`, `{ N: "123" }`. `mizzle` must marshall/unmarshall native JS types to this format transparently.
- **Expression Generation:** Writing `UpdateExpression` strings (e.g., `SET #k = :v`) is error-prone. `mizzle` should generate these from a fluent builder or object diffing.
    - _Example:_ `db.update(key).set({ status: 'active' })` -> `SET #status = :status`.
- **Reserved Words:** DynamoDB has many reserved words (e.g., `NAME`, `STATUS`, `VALUE`).
    - **Mizzle Action:** ALWAYS use `ExpressionAttributeNames` (e.g., `#status`) to avoid collisions. Never put raw attribute names in expressions.

## 6. PartiQL Support

- The API supports PartiQL (`ExecuteStatement`, `BatchExecuteStatement`).
- **Insight:** While PartiQL offers SQL-like syntax, it often has different performance characteristics and limitations compared to native API calls.
- **Mizzle Decision:** Evaluate if PartiQL adds value to `mizzle` (e.g., for complex conditional updates) or if the native API is sufficient and more predictable.

## 7. Streams & TTL

- **Time To Live (TTL):** Deletion is not instant (can take up to 48 hours). Filter out expired items in application logic if absolute precision is needed.
- **Streams:** Essential for event-driven architectures (triggering Lambdas).

## 8. Performance Tuning

- **Keep-Alive:** HTTP Keep-Alive is crucial for performance (TCP connection reuse).
- **Timeout Config:** default timeouts might be too long. Configure aggressive timeouts for latency-sensitive paths.
