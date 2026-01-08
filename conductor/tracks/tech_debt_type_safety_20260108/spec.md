# Specification: Technical Debt & Type Safety Refinement

## Overview
This track focuses on improving the library's coverage and type safety by exposing missing column types and enforcing stricter TypeScript linting rules to eliminate unsafe `any` usages.

## Functional Requirements
- **Phase 1: Expose JSON Column**
    - Export the `json` column from `packages/mizzle/src/columns/index.ts`.
    - Ensure `json` is also correctly integrated into `packages/mizzle/src/columns/all.ts` if applicable (aligning with the previous refactor track).
- **Phase 2: Strict Type Safety (ESLint)**
    - Update `.eslintrc.cjs` to enable `@typescript-eslint/no-explicit-any` as an **Error**.
    - Systematically refactor code to replace `any` with specific types, generics, or `unknown` where appropriate.
    - Prioritize fixes in relational query logic where type safety is most critical for preventing runtime errors.

## Non-Functional Requirements
- **Type Integrity:** Ensure that replacing `any` doesn't introduce regressions in the fluent API's ergonomics or type inference.
- **Maintainability:** Standardizing on specific types will make the codebase more predictable for future contributors.

## Acceptance Criteria
- [ ] `json` column is importable from `@mizzle/columns`.
- [ ] `bun run check` (TypeScript) passes project-wide.
- [ ] `npm run lint` (or equivalent) passes with `@typescript-eslint/no-explicit-any` set to `error`.
- [ ] All existing tests pass, ensuring that type refactors didn't break runtime logic.

## Out of Scope
- Large-scale architectural changes beyond what is required to satisfy specific types.
- Introducing new linting rules outside of the `no-explicit-any` scope unless directly related.
