# Plan: Transparent DynamoDB Error Handling & Smart Retries

## Phase 1: Foundation & Client Configuration [checkpoint: 3aa82cf]
- [x] Task: Define `RetryConfig` type and update `MizzleConfig` 5f06ec8
    - Create types for retry configuration (maxAttempts, baseDelay).
    - Update the core `Mizzle` initialization to accept and store these settings.
- [x] Task: Implement `ItemSizeExceededError` custom error class 5f06ec8
- [x] Task: Conductor - User Manual Verification 'Foundation & Client Configuration' (Protocol in workflow.md) 3aa82cf

## Phase 2: Exponential Backoff & Jitter
- [x] Task: Create `RetryHandler` utility 0226eab
    - Implement a utility function/class that takes an operation and retry settings.
    - Implement exponential backoff logic with jitter.
- [x] Task: Integrate `RetryHandler` into core request execution 4a06505
    - Identify the central point where AWS SDK calls are made.
    - Wrap these calls with the `RetryHandler`.
    - Handle specific retryable exceptions: `ProvisionedThroughputExceededException`, `RequestLimitExceeded`, `InternalServerError`, `ServiceUnavailable`.
- [ ] Task: Conductor - User Manual Verification 'Exponential Backoff & Jitter' (Protocol in workflow.md)

## Phase 3: Smart Batching Resilience
- [ ] Task: Implement `BatchGetItem` recursive retry logic
    - Update `BatchGetItem` to check for `UnprocessedKeys`.
    - Recursively (or iteratively) retry `UnprocessedKeys` using the `RetryHandler`.
- [ ] Task: Implement `BatchWriteItem` recursive retry logic
    - Update `BatchWriteItem` to check for `UnprocessedItems`.
    - Recursively retry `UnprocessedItems` using the `RetryHandler`.
- [ ] Task: Update Batch API return types
    - Ensure `BatchGet` and `BatchWrite` operations return a structure like `{ succeeded: T[], failed: T[] }` when retries are exhausted.
- [ ] Task: Conductor - User Manual Verification 'Smart Batching Resilience' (Protocol in workflow.md)

## Phase 4: Client-Side Validation
- [ ] Task: Implement `calculateItemSize` utility
    - Create a utility to estimate the byte size of a DynamoDB item.
- [ ] Task: Add size validation to write operations
    - Inject a check in `insert`, `update`, and `BatchWriteItem` before the network request.
    - Throw `ItemSizeExceededError` if any item > 400KB.
- [ ] Task: Conductor - User Manual Verification 'Client-Side Validation' (Protocol in workflow.md)
