# Specification: Identify and Remove Redundant Implementations

## Overview
This track aims to eliminate architectural redundancy and code duplication within the `mizzle` package. Significant overlap exists between the legacy/standalone builders and the integrated `BaseBuilder` hierarchy, leading to maintenance overhead and potential inconsistencies in logic.

## Functional Requirements
- **Phase 1: Unified Update Architecture**
    - Create a new, unified `UpdateBuilder` that merges the functionality of `packages/mizzle/src/builders/update.ts` and `packages/mizzle/src/builders/update-builder.ts`.
    - Support both fluent API calls (integrated with `BaseBuilder`) and functional expression building for updates.
    - Deprecate/Remove the old update builder files once the new implementation is verified.
- **Phase 2: Unified Query Architecture**
    - Create a new, unified `QueryBuilder` (or enhance `SelectBase`) that merges `packages/mizzle/src/builders/select.ts` and `packages/mizzle/src/builders/query-builder.ts`.
    - Integrate the recursive `buildExpression` logic for complex filtering and condition expressions.
    - Ensure intelligent switching between `GetItem`, `Query`, and `Scan` operations based on resolved keys and indices.
- **Phase 3: Column Organization Refactor**
    - Remove duplicate import/export blocks in `packages/mizzle/src/columns/all.ts`.
    - Refactor the organization of column exports to ensure a clean, maintainable, and non-redundant structure across the package.

## Non-Functional Requirements
- **Performance:** The unified builders must maintain or exceed the performance of the current implementations.
- **Type Safety:** 100% type safety must be maintained for all query and update operations.
- **Backward Compatibility:** Public APIs should remain consistent where possible to minimize breaking changes for consumers.

## Acceptance Criteria
- [ ] Single `Update` implementation handles all update scenarios.
- [ ] Single `Query/Select` implementation handles all read scenarios (Get, Query, Scan).
- [ ] `packages/mizzle/src/columns/all.ts` contains no duplicate code and follows a logical organization.
- [ ] All existing integration and unit tests pass with the new unified builders.
- [ ] Type checking (`bun run check`) passes without errors.

## Out of Scope
- Introducing new database features not currently supported by either existing builder.
- Refactoring core table or schema definition logic beyond what is necessary for builder unification.
