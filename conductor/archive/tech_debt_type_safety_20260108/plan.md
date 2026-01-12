# Implementation Plan: Technical Debt & Type Safety Refinement

This plan outlines the steps to expose the missing JSON column and enforce strict type safety across the project by enabling and satisfying the `no-explicit-any` ESLint rule.

## Phase 1: Expose JSON Column
Ensure the `json` column is properly exported and integrated into the library's column system.

- [x] Task: Create a unit test for the `json` column to verify its behavior and serializability (Red Phase).
- [x] Task: Export `json` from `packages/mizzle/src/columns/index.ts`.
- [x] Task: Ensure `json` is correctly included in `packages/mizzle/src/columns/all.ts` (Green Phase).
- [x] Task: Verify that `json` is accessible via the public API.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Expose JSON Column' (Protocol in workflow.md)

## Phase 2: Strict Type Safety (ESLint)
Enable strict ESLint rules for `any` usage and refactor the codebase to use more specific types.

- [x] Task: Update `.eslintrc.cjs` to set `@typescript-eslint/no-explicit-any` to `error`.
- [x] Task: Run linting to identify all files requiring refactoring.
- [x] Task: Refactor relational query logic (`parser.ts`) to replace `any` with specific generics, implement recursive result inference, and enforce strict row parsing.
- [x] Task: Refactor builder logic and strategy resolution (`strategies.ts`) to use generics derived from `Entity` definitions.
- [x] Task: Systematically replace `Record<string, any>` with `Record<string, unknown>` across the project and implement necessary type guards.
- [x] Task: Refactor core table and column definitions to remove unsafe `any` usages.
- [x] Task: Verify type safety project-wide with `bun run check` and `npm run lint`.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Strict Type Safety (ESLint)' (Protocol in workflow.md)