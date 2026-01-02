# Plan: Delete Feature Implementation

## Phase 1: Foundation and API Integration
Set up the core `DeleteBuilder` class and integrate it into the main library entry point.

- [x] Task: Create `src/builders/delete.ts` with basic `DeleteBuilder` structure and types.
- [x] Task: Update `src/utils/db.ts` to add the `delete(entity, keys) ` method to the `DynamoDB` class.
- [x] Task: Conductor - User Manual Verification 'Foundation and API Integration' (Protocol in workflow.md)

## Phase 2: Core Deletion (TDD)
Implement the fundamental deletion logic using a Test-Driven Development approach.

- [ ] Task: Write failing integration tests in `test/builders/delete.test.ts` covering basic deletion by PK.
- [ ] Task: Implement the `execute()` method in `DeleteBuilder` using `DeleteCommand` from the AWS SDK.
- [ ] Task: Conductor - User Manual Verification 'Core Deletion' (Protocol in workflow.md)

## Phase 3: Returning Attributes (TDD)
Add support for returning the deleted item's data.

- [ ] Task: Write failing tests in `test/builders/delete.test.ts` for the `.returning()` method.
- [ ] Task: Implement the `.returning()` logic in `DeleteBuilder` using `ReturnValues: 'ALL_OLD'`.
- [ ] Task: Conductor - User Manual Verification 'Returning Attributes' (Protocol in workflow.md)

## Phase 4: Final Verification and Type Safety
Ensure the implementation is robust, type-safe, and regression-free.

- [ ] Task: Run `bun run check` to verify type safety of the new API.
- [ ] Task: Run full test suite `bun run test` to ensure no regressions.
- [ ] Task: Conductor - User Manual Verification 'Final Verification and Type Safety' (Protocol in workflow.md)
