# Implementation Plan: Identify and Remove Redundant Implementations

This plan outlines the steps to unify the query and update builders and refactor the column organization to eliminate redundancy and improve maintainability.

## Phase 1: Unified Update Architecture
Merge the functionality of the integrated `update.ts` and the standalone `update-builder.ts` into a single, robust implementation.

- [ ] Task: Research and define the final API surface for the Unified Update Builder.
- [ ] Task: Create comprehensive integration tests covering all update scenarios (Red Phase).
- [ ] Task: Implement the Unified Update Builder core logic and strategy resolution (Green Phase).
- [ ] Task: Port functional expression building logic from `update-builder.ts`.
- [ ] Task: Refactor the implementation for clarity and performance.
- [ ] Task: Remove `packages/mizzle/src/builders/update-builder.ts` and update all references to use the unified builder.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Unified Update Architecture' (Protocol in workflow.md)

## Phase 2: Unified Query Architecture
Consolidate `select.ts` and `query-builder.ts` into a unified query architecture that intelligently handles Get, Query, and Scan operations.

- [ ] Task: Research and define the final API surface for the Unified Query Builder.
- [ ] Task: Create comprehensive integration tests for Get, Query, and Scan operations (Red Phase).
- [ ] Task: Implement the Unified Query Builder with optimized execution path selection (Green Phase).
- [ ] Task: Integrate the recursive functional expression builder for complex filtering.
- [ ] Task: Refactor the query logic to eliminate redundant code and optimize performance.
- [ ] Task: Remove `packages/mizzle/src/builders/query-builder.ts` and update all references to use the unified builder.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Unified Query Architecture' (Protocol in workflow.md)

## Phase 3: Column Organization Refactor
Clean up and reorganize column exports to remove duplication and improve package structure.

- [ ] Task: Analyze current column file structure and identify optimal organization.
- [ ] Task: Refactor column source files and remove duplicate blocks in `packages/mizzle/src/columns/all.ts`.
- [ ] Task: Verify that all package-level exports and external imports remain functional.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Column Organization Refactor' (Protocol in workflow.md)
