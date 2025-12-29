# Plan: Code Quality Improvements & Refactoring

This plan outlines the steps to refactor the Mizzle codebase to reduce duplication, eliminate code smells, and improve overall maintainability.

## Phase 1: Preparation & Constants Centralization
- [x] Task: Audit existing unit test coverage for `src/builders/` and `src/core/`. d21cc52
- [ ] Task: Add granular unit tests for `InsertBuilder`, `SelectBuilder`, and `UpdateBuilder` to ensure existing behavior is fully captured.
- [x] Task: Create `src/constants.ts` and consolidate magic strings (e.g., Symbol names, internal DynamoDB keys). f067c83
- [x] Task: Update the codebase to use the new centralized constants. 04458db
- [~] Task: Conductor - User Manual Verification 'Preparation & Constants Centralization' (Protocol in workflow.md)

## Phase 2: Core Logic Refactoring
- [ ] Task: Audit `src/core/table.ts` and `src/core/entity.ts` for redundant helper functions and types.
- [ ] Task: Extract common internal logic from `src/core/` files into smaller, utility-focused functions in `src/utils/utils.ts` or new core utilities.
- [ ] Task: Standardize naming conventions for internal symbols and properties (e.g., consistency between `PartitionKey` and `PK`).
- [ ] Task: Conductor - User Manual Verification 'Core Logic Refactoring' (Protocol in workflow.md)

## Phase 3: Builder Logic Consolidation
- [ ] Task: Identify shared logic between `InsertBuilder`, `SelectBuilder`, and `UpdateBuilder` (e.g., key resolution, common execution patterns).
- [ ] Task: Implement a shared base class or common utility module for builders to reduce duplication.
- [ ] Task: Refactor existing builders to leverage the shared logic.
- [ ] Task: Perform a final pass to break down overly long methods in builders.
- [ ] Task: Conductor - User Manual Verification 'Builder Logic Consolidation' (Protocol in workflow.md)

## Phase 4: Final Verification & Cleanup
- [ ] Task: Ensure all tests pass with the refactored architecture.
- [ ] Task: Verify that code coverage remains above project requirements (>80%).
- [ ] Task: Remove any dead code or deprecated types uncovered during refactoring.
- [ ] Task: Conductor - User Manual Verification 'Final Verification & Cleanup' (Protocol in workflow.md)
