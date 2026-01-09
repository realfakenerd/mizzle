# Plan: Fluent Reads - Auto-Pagination & Consistency

## Phase 1: Consistency Toggle & Page Size Hint [checkpoint: 34a3187]
- [x] Task: Update Query Builder Types c0bc104
    - Add `.consistentRead(enabled?: boolean)` to the common builder interface.
    - Add `.pageSize(n: number)` to the common builder interface.
- [x] Task: Implement `.consistentRead()` logic c0bc104
    - Update the internal command builder to map the toggle to AWS SDK's `ConsistentRead`.
    - Write tests for `GetItem`, `Query`, and `Scan` commands.
- [x] Task: Implement `.pageSize()` logic c0bc104
    - Update the internal command builder to map this to AWS SDK's `Limit`.
    - Ensure it is distinct from the total `.limit()` used for result truncation.
- [x] Task: Conductor - User Manual Verification 'Consistency Toggle & Page Size Hint' (Protocol in workflow.md)

## Phase 2: Async Iterator Foundation
- [x] Task: Define `AsyncIterator` types d266fb8
    - Ensure the return type of `.iterator()` correctly reflects the entity type.
- [x] Task: Implement internal `fetchPage` utility bc3c479
    - Create a helper that executes a single DynamoDB request and returns the items and `LastEvaluatedKey`.
- [x] Task: Implement the `.iterator()` method on Select/Scan/Query builders e830e89
    - This method should return an object implementing `Symbol.asyncIterator`.
- [x] Task: Conductor - User Manual Verification 'Async Iterator Foundation' (Protocol in workflow.md)

## Phase 3: Pagination Logic & Termination
- [x] Task: Implement loop for `LastEvaluatedKey` e830e89
    - The iterator should internally track the pagination token and trigger new `fetchPage` calls when the current buffer is empty.
- [x] Task: Integrate `.limit()` with iteration e830e89
    - Ensure the iterator stops yielding items (and stops making network requests) once the total global limit is reached.
- [x] Task: Conductor - User Manual Verification 'Pagination Logic & Termination' (Protocol in workflow.md)

## Phase 4: Integration & Performance [checkpoint: 158fe54]
- [x] Task: Integration tests with large datasets 3243e1c
    - Create a test case that inserts >1MB of data (forcing multiple pages).
    - Verify that `.iterator()` consumes all items correctly.
- [x] Task: Verify memory efficiency 3243e1c
    - Ensure items are not being accumulated in an internal array during iteration.
- [x] Task: Conductor - User Manual Verification 'Integration & Performance' (Protocol in workflow.md)