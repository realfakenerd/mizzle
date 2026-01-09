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
- [ ] Task: Conductor - User Manual Verification 'Consistency Toggle & Page Size Hint' (Protocol in workflow.md)

## Phase 2: Async Iterator Foundation
- [ ] Task: Define `AsyncIterator` types
    - Ensure the return type of `.iterator()` correctly reflects the entity type.
- [ ] Task: Implement internal `fetchPage` utility
    - Create a helper that executes a single DynamoDB request and returns the items and `LastEvaluatedKey`.
- [ ] Task: Implement the `.iterator()` method on Select/Scan/Query builders
    - This method should return an object implementing `Symbol.asyncIterator`.
- [ ] Task: Conductor - User Manual Verification 'Async Iterator Foundation' (Protocol in workflow.md)

## Phase 3: Pagination Logic & Termination
- [ ] Task: Implement loop for `LastEvaluatedKey`
    - The iterator should internally track the pagination token and trigger new `fetchPage` calls when the current buffer is empty.
- [ ] Task: Integrate `.limit()` with iteration
    - Ensure the iterator stops yielding items (and stops making network requests) once the total global limit is reached.
- [ ] Task: Conductor - User Manual Verification 'Pagination Logic & Termination' (Protocol in workflow.md)

## Phase 4: Integration & Performance
- [ ] Task: Integration tests with large datasets
    - Create a test case that inserts >1MB of data (forcing multiple pages).
    - Verify that `.iterator()` consumes all items correctly.
- [ ] Task: Verify memory efficiency
    - Ensure items are not being accumulated in an internal array during iteration.
- [ ] Task: Conductor - User Manual Verification 'Integration & Performance' (Protocol in workflow.md)