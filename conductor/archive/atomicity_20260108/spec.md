# Specification: Atomicity - Transaction Builder

## Overview
DynamoDB transactions (`TransactWriteItems`) allow for atomic "all-or-nothing" operations across multiple items and tables. This track implements a type-safe Transaction Builder for Mizzle that simplifies the creation of these transactions, enforces idempotency, and provides better error reporting for cancellation reasons.

## Functional Requirements

### 1. Type-Safe Transaction Callback API
- Implement `db.transaction(token, callback)` where the callback returns an array of operations.
- **Example:**
  ```typescript
  await db.transaction("unique-token-123", (tx) => [
    tx.insert(users).values({ id: '1', name: 'Luke' }),
    tx.update(stats).set({ count: add(1) }).where(eq(stats.id, 'global'))
  ]);
  ```
- Support `Put`, `Update`, `Delete`, and `ConditionCheck` operations within the transaction.

### 2. Explicit Idempotency Management
- The `token` (ClientRequestToken) is a **required** first argument to `db.transaction()`.
- This ensures that developers explicitly manage transaction idempotency to prevent accidental duplicate operations during retries.

### 3. Structured Error Parsing
- Implement a custom `TransactionFailedError` class.
- When a `TransactionCanceledException` occurs, the builder MUST parse the `CancellationReasons` provided by the AWS SDK.
- The error object should map these reasons to their respective operation indices, making it easy to identify which specific condition or item caused the failure.

## Non-Functional Requirements
- **Validation:** The builder should validate that the transaction does not exceed DynamoDB's limit of 100 items per transaction.
- **DX:** Provide clear TypeScript types for the `tx` object within the callback so developers get autocomplete for all supported operations.

## Acceptance Criteria
- [ ] `db.transaction()` correctly aggregates multiple operations into a single `TransactWriteItems` call.
- [ ] Providing a duplicate token within the DynamoDB idempotency window correctly handles the service response.
- [ ] If a transaction fails (e.g., due to a `ConditionalCheckFailed`), the resulting `TransactionFailedError` contains the exact reason and the index of the failing operation.
- [ ] The API enforces the 100-item limit and throws an error before hitting the network if exceeded.

## Out of Scope
- `TransactGetItems` (Atomic reads) is deferred to a future track.
- Automatic splitting of large transactions (>100 items) into multiple transactions (transactions must be atomic, so splitting is a user-level architecture decision).
