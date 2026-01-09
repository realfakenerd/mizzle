# Plan: Fluent Writes - Expression Builder & Safety

## Phase 1: Foundation & Atomic Helpers [checkpoint: 33a5b9f]
- [x] Task: Create standalone atomic helpers 1711160
    - Implement `add`, `append`, `ifNotExists`, `remove`, `addToSet`, `deleteFromSet`.
    - These functions should return an internal "Action" object that the builder can recognize.
- [x] Task: Define internal `UpdateState` types 1711160
    - Define structures to hold pending `SET`, `ADD`, `REMOVE`, and `DELETE` operations.
- [x] Task: Conductor - User Manual Verification 'Foundation & Atomic Helpers' (Protocol in workflow.md) 1711160

## Phase 2: Core Expression Builder Logic [checkpoint: 33a5b9f]
- [x] Task: Implement `UpdateExpression` partitioner 1711160
    - Create a utility that takes the flat `.set()` object and sorts entries into the appropriate `UpdateState` buckets.
- [x] Task: Implement `AttributeMapper` 1711160
    - Create a central utility to generate `#name` and `:value` placeholders.
    - Ensure it handles nested paths (if any) and prevents collisions.
- [x] Task: Implement string generator 1711160
    - Convert the `UpdateState` into the final `UpdateExpression` string (e.g., combining sections with correct spacing/commas).
- [x] Task: Conductor - User Manual Verification 'Core Expression Builder Logic' (Protocol in workflow.md) 1711160

## Phase 3: Integration with Update Command [checkpoint: 33a5b9f]
- [x] Task: Update `.update()` builder to use the new Expression Builder 1711160
    - Replace any existing manual string concatenation logic.
    - Ensure the builder correctly populates `ExpressionAttributeNames` and `ExpressionAttributeValues` in the final SDK command.
- [x] Task: Implement Type Safety for helpers 1711160
    - Enhance TypeScript types to ensure helpers are only used on compatible column types (e.g., `add()` only on numbers).
- [x] Task: Conductor - User Manual Verification 'Integration with Update Command' (Protocol in workflow.md) 1711160

## Phase 4: Verification & Edge Cases [checkpoint: 33a5b9f]
- [x] Task: Reserved Word Integration Tests 1711160
    - Create a table with columns like `name`, `status`, `order`, `value`.
    - Verify that updates to these columns succeed without manual mapping.
- [x] Task: Multi-Action Integration Tests 1711160
    - Test a single update that uses `SET`, `ADD`, and `REMOVE` simultaneously.
- [x] Task: Conductor - User Manual Verification 'Verification & Edge Cases' (Protocol in workflow.md) 1711160
