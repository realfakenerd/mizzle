# Spec: Project Restructuring and Refactoring

## Overview
This track focuses on restructuring the Mizzle codebase to improve maintainability, scalability, and clarity. The goal is to move away from a flat directory structure towards a domain-driven, "Drizzle-like" internal organization. This will involve grouping files by feature, separating core ORM logic from public APIs, and consolidating utilities. Additionally, all test files will be moved to a dedicated `test/` directory.

## Goals
- **Domain-Driven Structure:** Organize internal files into logical domains (e.g., core, expressions, query builders).
- **Clear API Separation:** Distinguish between internal implementation details and the public-facing API.
- **Improved Maintainability:** Make it easier for contributors to find and understand specific parts of the codebase.
- **Architectural Cleanup:** Allow for breaking changes in import paths to achieve a more robust internal structure.
- **Dedicated Test Directory:** Separate tests from source code by moving them to `test/`.

## Functional Requirements
- **Refactor Directory Tree:** Migrate current files in `src/` to a structured sub-directory system.
- **Consolidate Utilities:** Move shared helpers and internal types to a dedicated `utils` or `common` domain.
- **Organize Tests:** Move all `*.test.ts` files from `src/` to a root `test/` folder, maintaining internal structure if applicable.
- **Update Exports:** Refactor `src/index.ts` to reflect the new internal structure.

## Proposed Structure (Drizzle-like)
- `src/core/`: Base classes like `Entity`, `PhysicalTable`, and core symbols.
- `src/builders/`: Command builders (`insert`, `select`, `update`).
- `src/expressions/`: Operators, conditions, and expression builders.
- `src/columns/`: Existing column definitions.
- `src/utils/`: Shared utilities and type helpers.
- `test/`: All unit and integration tests.

## Acceptance Criteria
- Codebase is restructured according to the proposed domain-driven pattern.
- All test files are located in the `test/` directory.
- All existing tests pass in the new structure (with updated imports).
- `src/index.ts` provides a clean public API, even if internal paths have changed.
- No dead code remains from the migration.

## Out of Scope
- Adding new ORM features (e.g., Delete operation, Transactions).
- Changing the public-facing API behavior (logic remains the same).
