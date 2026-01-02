# Plan: Delete Feature Implementation

## Phase 1: Foundation and API Integration [checkpoint: 6477bd6]
Set up the core `DeleteBuilder` class and integrate it into the main library entry point.

- [x] Task: Create `src/builders/delete.ts` with basic `DeleteBuilder` structure and types.
- [x] Task: Update `src/utils/db.ts` to add the `delete(entity, keys) ` method to the `DynamoDB` class.
- [x] Task: Conductor - User Manual Verification 'Foundation and API Integration' (Protocol in workflow.md)

## Phase 2: Core Deletion (TDD) [checkpoint: e2c4bfc]
Implement the fundamental deletion logic using a Test-Driven Development approach.

- [x] Task: Write failing integration tests in `test/builders/delete.test.ts` covering basic deletion by PK.
- [x] Task: Implement the `execute()` method in `DeleteBuilder` using `DeleteCommand` from the AWS SDK.
- [x] Task: Conductor - User Manual Verification 'Core Deletion' (Protocol in workflow.md)

## Phase 3: Returning Attributes (TDD) [checkpoint: 20f6d3d]
Add support for returning the deleted item's data.

- [x] Task: Write failing tests in `test/builders/delete.test.ts` for the `.returning()` method.
- [x] Task: Implement the `.returning()` logic in `DeleteBuilder` using `ReturnValues: 'ALL_OLD'`.
- [x] Task: Conductor - User Manual Verification 'Returning Attributes' (Protocol in workflow.md)

## Phase 4: Final Verification and Type Safety
Ensure the implementation is robust, type-safe, and regression-free.

- [ ] Task: Run `bun run check` to verify type safety of the new API.
- [ ] Task: Run full test suite `bun run test` to ensure no regressions.
- [ ] Task: Conductor - User Manual Verification 'Final Verification and Type Safety' (Protocol in workflow.md)
