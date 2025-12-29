# Plan: Project Restructuring and Refactoring

This plan outlines the steps to reorganize the codebase into a domain-driven, "Drizzle-like" structure.

## Phase 1: Preparation & Base Classes [checkpoint: 57b46ee]
- [x] Task: Audit current exports and identify all public-facing symbols.
- [x] Task: Create new directory structure: `src/core`, `src/builders`, `src/expressions`, `src/utils`, and `test/`.
- [x] Task: Move core files (`entity.ts`, `table.ts`, `column.ts`, `column-builder.ts`) to `src/core/` and update internal imports.
- [x] Task: Move `strategies.ts` and `operations.ts` to `src/core/`.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Core Migration' (Protocol in workflow.md)

## Phase 2: Logic & Commands [checkpoint: 42c4412]
- [x] Task: Move command builders (`commands/insert.ts`, `commands/select.ts`, `update-builder.ts`) to `src/builders/`.
- [x] Task: Move query/relational builders (`query-builder.ts`, `query-promise.ts`, `relational-builder.ts`) to `src/builders/`.
- [x] Task: Move `operators.ts` to `src/expressions/`.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Logic Migration' (Protocol in workflow.md)

## Phase 3: Utilities & Public API
- [ ] Task: Move `utils.ts` and `db.ts` to `src/utils/` (or keep `db.ts` at root if preferred for DX).
- [ ] Task: Refactor `src/index.ts` to export from new locations.
- [ ] Task: Move all test files (e.g., `src/**/*.test.ts`) to the `test/` directory.
- [ ] Task: Update all test imports to match the new structure and ensure all tests pass.
- [ ] Task: Cleanup any redundant files or circular dependencies introduced by the move.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Final Integration' (Protocol in workflow.md)
