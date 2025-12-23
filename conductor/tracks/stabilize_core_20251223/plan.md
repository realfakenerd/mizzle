# Plan: Stabilize Core ORM Operations

This plan outlines the steps to stabilize and verify the core `insert` and `select` operations in Mizzle.

## Phase 1: Test Infrastructure & Insert Command

- [x] Task: Ensure local DynamoDB is accessible for integration tests. [infra]
- [x] Task: Write unit and integration tests for `insert` command with various column types. [6fe9c84]
- [x] Task: Implement/Refine `insert` logic to pass all tests, focusing on key strategies. [6fe9c84]
- [x] Task: Verify 80% coverage for `src/commands/insert.ts`. [6fe9c84]
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Insert Stability' (Protocol in workflow.md)

## Phase 2: Select Command Stability

- [ ] Task: Write unit and integration tests for `select` command, covering basic querying and scanning.
- [ ] Task: Refine `select` logic (query builder translation) to handle complex filters and reserved words.
- [ ] Task: Verify 80% coverage for `src/commands/select.ts`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Select Stability' (Protocol in workflow.md)

## Phase 3: End-to-End Integration

- [ ] Task: Create a full entity example and perform a complete CRUD lifecycle test (Insert -> Select -> Verify).
- [ ] Task: Final code review and cleanup.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Final Integration' (Protocol in workflow.md)
