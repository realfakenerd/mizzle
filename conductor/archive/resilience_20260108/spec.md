# Specification: Transparent DynamoDB Error Handling & Smart Retries

## Overview
DynamoDB "errors" such as throttling and partial batch failures are often expected behaviors under load. This track implements a transparent resilience layer within Mizzle to handle these scenarios automatically, improving developer experience and application stability.

## Functional Requirements

### 1. Exponential Backoff & Jitter
- Implement a robust retry mechanism for transient DynamoDB errors.
- **Retryable Exceptions:**
  - `ProvisionedThroughputExceededException`
  - `RequestLimitExceeded`
  - `InternalServerError` (500)
  - `ServiceUnavailable` (503)
- **Configuration:** Settings (max attempts, base delay) will be defined globally during Mizzle client initialization to maintain clean query code.

### 2. Smart Batching Resilience
- Automatically handle `UnprocessedKeys` (BatchGetItem) and `UnprocessedItems` (BatchWriteItem).
- The system will transparently retry these unprocessed items using the backoff strategy until the request is complete or max retries are exhausted.
- **Failure Handling:** If retries are exhausted and items remain unprocessed, the operation will return a result object that explicitly separates `succeeded` items from `failed` items.

### 3. Client-Side Validation
- Implement a "fail-fast" check for item size.
- Reject any item exceeding the 400KB DynamoDB limit before making a network request.
- **Error Handling:** Throw a specific `ItemSizeExceededError` if validation fails.

## Non-Functional Requirements
- **Performance:** Validation logic should have negligible overhead.
- **Observability:** Ensure retry attempts are traceable (e.g., via internal logging or hooks if available in the future).

## Acceptance Criteria
- [ ] Queries automatically retry on throttling without user intervention.
- [ ] `BatchWriteItem` and `BatchGetItem` calls eventually return all items or a clear partial success object.
- [ ] Attempting to write an item > 400KB throws `ItemSizeExceededError` immediately.
- [ ] Retry settings can be configured at the global client level.

## Out of Scope
- Per-request retry configuration overrides (to be considered for future tracks).
- Automatic splitting of large batches into multiple smaller requests (this track focuses on retrying *unprocessed* items within the original batch scope).
