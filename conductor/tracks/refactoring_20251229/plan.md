# Plan: Code Quality Improvements & Refactoring

This plan outlines the steps to refactor the Mizzle codebase to reduce duplication, eliminate code smells, and improve overall maintainability.

## Phase 1: Preparation & Constants Centralization [checkpoint: 536cb88]
- [x] Task: Audit existing unit test coverage for `src/builders/` and `src/core/`. d21cc52
- [x] Task: Add granular unit tests for `InsertBuilder`, `SelectBuilder`, and `UpdateBuilder` to ensure existing behavior is fully captured.
- [x] Task: Create `src/constants.ts` and consolidate magic strings (e.g., Symbol names, internal DynamoDB keys). f067c83
- [x] Task: Update the codebase to use the new centralized constants. 04458db
- [x] Task: Conductor - User Manual Verification 'Preparation & Constants Centralization' (Protocol in workflow.md)

## Phase 2: Core Logic Refactoring [checkpoint: 48c6ad5]
- [x] Task: Audit `src/core/table.ts` and `src/core/entity.ts` for redundant helper functions and types. a5d031e
- [x] Task: Extract common internal logic from `src/core/` files into smaller, utility-focused functions in `src/utils/utils.ts` or new core utilities. a5d031e
- [x] Task: Standardize naming conventions for internal symbols and properties (e.g., consistency between `PartitionKey` and `PK`). 3329313
- [~] Task: Conductor - User Manual Verification 'Core Logic Refactoring' (Protocol in workflow.md)

## Phase 3: Builder Logic Consolidation
- [x] Task: Identify shared logic between `InsertBuilder`, `SelectBuilder`, and `UpdateBuilder` (e.g., key resolution, common execution patterns). d121a8a
- [x] Task: Implement a shared base class or common utility module for builders to reduce duplication. dd29db8
- [x] Task: Refactor existing builders to leverage the shared logic. dd29db8
- [~] Task: Perform a final pass to break down overly long methods in builders.
- [ ] Task: Conductor - User Manual Verification 'Builder Logic Consolidation' (Protocol in workflow.md)

## Phase 4: Final Verification & Cleanup
- [ ] Task: Ensure all tests pass with the refactored architecture.
- [ ] Task: Verify that code coverage remains above project requirements (>80%).
- [ ] Task: Remove any dead code or deprecated types uncovered during refactoring.
- [ ] Task: Conductor - User Manual Verification 'Final Verification & Cleanup' (Protocol in workflow.md)
