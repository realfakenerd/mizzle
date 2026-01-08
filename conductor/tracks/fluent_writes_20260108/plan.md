# Plan: Fluent Writes - Expression Builder & Safety

## Phase 1: Foundation & Atomic Helpers
- [ ] Task: Create standalone atomic helpers
    - Implement `add`, `append`, `ifNotExists`, `remove`, `addToSet`, `deleteFromSet`.
    - These functions should return an internal "Action" object that the builder can recognize.
- [ ] Task: Define internal `UpdateState` types
    - Define structures to hold pending `SET`, `ADD`, `REMOVE`, and `DELETE` operations.
- [ ] Task: Conductor - User Manual Verification 'Foundation & Atomic Helpers' (Protocol in workflow.md)

## Phase 2: Core Expression Builder Logic
- [ ] Task: Implement `UpdateExpression` partitioner
    - Create a utility that takes the flat `.set()` object and sorts entries into the appropriate `UpdateState` buckets.
- [ ] Task: Implement `AttributeMapper`
    - Create a central utility to generate `#name` and `:value` placeholders.
    - Ensure it handles nested paths (if any) and prevents collisions.
- [ ] Task: Implement string generator
    - Convert the `UpdateState` into the final `UpdateExpression` string (e.g., combining sections with correct spacing/commas).
- [ ] Task: Conductor - User Manual Verification 'Core Expression Builder Logic' (Protocol in workflow.md)

## Phase 3: Integration with Update Command
- [ ] Task: Update `.update()` builder to use the new Expression Builder
    - Replace any existing manual string concatenation logic.
    - Ensure the builder correctly populates `ExpressionAttributeNames` and `ExpressionAttributeValues` in the final SDK command.
- [ ] Task: Implement Type Safety for helpers
    - Enhance TypeScript types to ensure helpers are only used on compatible column types (e.g., `add()` only on numbers).
- [ ] Task: Conductor - User Manual Verification 'Integration with Update Command' (Protocol in workflow.md)

## Phase 4: Verification & Edge Cases
- [ ] Task: Reserved Word Integration Tests
    - Create a table with columns like `name`, `status`, `order`, `value`.
    - Verify that updates to these columns succeed without manual mapping.
- [ ] Task: Multi-Action Integration Tests
    - Test a single update that uses `SET`, `ADD`, and `REMOVE` simultaneously.
- [ ] Task: Conductor - User Manual Verification 'Verification & Edge Cases' (Protocol in workflow.md)
