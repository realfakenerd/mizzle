# Plan: Atomicity - Transaction Builder

## Phase 1: Transaction API & Types [checkpoint: 7f1c256]
- [x] Task: Define Transactional Operation Types 4fc25f1
    - Create internal types for `TransactPut`, `TransactUpdate`, `TransactDelete`, and `TransactConditionCheck`.
- [x] Task: Create the `TransactionProxy` object dee5339
    - Implement the `tx` object passed to the callback, which provides the subset of builder methods compatible with transactions.
- [ ] Task: Conductor - User Manual Verification 'Transaction API & Types' (Protocol in workflow.md)

## Phase 2: Execution & Idempotency [checkpoint: 21f9e1f]
- [x] Task: Implement `db.transaction()` wrapper 92c119c
    - Implement the main entry point that accepts the token and executes the callback.
    - Validate the 100-item limit.
- [x] Task: Map Mizzle operations to AWS TransactWriteItems 92c119c
    - Convert the array of Mizzle builders returned by the callback into the raw SDK command structure.
    - Ensure `ClientRequestToken` is correctly passed.
- [ ] Task: Conductor - User Manual Verification 'Execution & Idempotency' (Protocol in workflow.md)

## Phase 3: Error Handling & Parsing [checkpoint: daa73c3]
- [x] Task: Implement `TransactionFailedError` 19d4baa
    - Create the custom error class with a structured `reasons` property.
- [x] Task: Implement `CancellationReasons` parser ab8bf38
    - Add logic to catch SDK exceptions and extract the detailed cancellation reasons from the response.
- [ ] Task: Conductor - User Manual Verification 'Error Handling & Parsing' (Protocol in workflow.md)

## Phase 4: Integration & Verification [checkpoint: 4075ff3]
- [x] Task: Integration tests for successful transactions 73c4858
    - Test multi-table/multi-item atomic updates.
- [x] Task: Integration tests for failed transactions 73c4858
    - Force a `ConditionalCheckFailed` in one of the operations and verify the `TransactionFailedError` content.
- [x] Task: Conductor - User Manual Verification 'Integration & Verification' (Protocol in workflow.md) 4075ff3
